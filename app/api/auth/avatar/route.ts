import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { getSessionUser, toAuthUser } from "@/lib/auth-server";
import { User } from "@/lib/models/User";
import { getCloudinary } from "@/lib/cloudinary";
import { rateLimitRequest, rateLimitResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";

const MAX_BYTES = 4 * 1024 * 1024; // 4 MB
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export async function POST(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Sign in to update your avatar." }, { status: 401 });
  }

  const rateLimit = await rateLimitRequest(request, {
    scope: "avatar-upload",
    limit: 20,
    windowMs: 60 * 60 * 1000,
    dimensions: [`user:${sessionUser.id}`],
  });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit);

  const cloudinary = getCloudinary();
  if (!cloudinary) {
    return NextResponse.json({ error: "Avatar uploads are temporarily unavailable." }, { status: 501 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image must be under 4 MB." }, { status: 413 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "Please upload a JPG, PNG, WebP or AVIF image." }, { status: 415 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const baseFolder = process.env.CLOUDINARY_FOLDER || "s19-medical";
  const folder = `${baseFolder}/avatars`;

  try {
    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "image",
          overwrite: true,
          transformation: [
            { width: 512, height: 512, crop: "fill", gravity: "faces" },
            { quality: "auto", fetch_format: "auto" },
          ],
        },
        (error, uploadResult) => {
          if (error) return reject(error);
          if (!uploadResult) return reject(new Error("Upload returned no result."));
          resolve({ secure_url: uploadResult.secure_url });
        }
      );
      stream.end(buffer);
    });

    const conn = await connectDb();
    if (!conn) {
      return NextResponse.json({ error: "Avatar uploads are temporarily unavailable." }, { status: 503 });
    }

    const updated = await User.findByIdAndUpdate(
      sessionUser.id,
      { $set: { avatar: result.secure_url } },
      { new: true }
    ).lean();
    if (!updated) {
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: toAuthUser(updated) }, { status: 201 });
  } catch (error) {
    console.error("[avatar] cloudinary error:", error);
    return NextResponse.json({ error: "Upload failed. Try again." }, { status: 500 });
  }
}