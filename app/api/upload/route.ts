import { NextResponse } from "next/server";
import { getCloudinary } from "@/lib/cloudinary";
import { adminGuard } from "@/lib/admin-guard";
import { rateLimitRequest, rateLimitResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";

// Reasonable ceiling for clinic content images: good quality without bloating
// Cloudinary storage or page weight. (Avatar 4 MB, glucose photos 6 MB, ID
// documents 8 MB - this sits in the same range.)
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
]);

export async function POST(request: Request) {
  const denied = await adminGuard();
  if (denied) return denied;

  const rateLimit = await rateLimitRequest(request, {
    scope: "admin-cloudinary-upload",
    limit: 60,
    windowMs: 60 * 60 * 1000,
  });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit);

  const cloudinary = getCloudinary();
  if (!cloudinary) {
    return NextResponse.json({ error: "Cloudinary is not configured." }, { status: 501 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  // Images only - videos are not supported for device uploads.
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { error: "Please upload a JPG, PNG, WebP, AVIF or GIF image. Videos are not supported." },
      { status: 415 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image must be under 5 MB." }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const folder = process.env.CLOUDINARY_FOLDER || "s19-medical";

  try {
    const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: "image", overwrite: true },
        (error, uploadResult) => {
          if (error) return reject(error);
          if (!uploadResult) return reject(new Error("Upload returned no result."));
          resolve({ secure_url: uploadResult.secure_url, public_id: uploadResult.public_id });
        }
      );
      stream.end(buffer);
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("[upload] cloudinary error:", error);
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}