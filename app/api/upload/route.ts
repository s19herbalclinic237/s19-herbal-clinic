import { NextResponse } from "next/server";
import { getCloudinary } from "@/lib/cloudinary";
import { clinicalGuard } from "@/lib/admin-guard";
import { getCurrentUser } from "@/lib/auth-server";
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

/**
 * Shared image upload for clinic staff.
 *
 * `clinicalGuard`, not `adminGuard`. Prescriptions were the reason this widened:
 * a doctor could open the prescriptions tab, fill in a medication, and be
 * refused the upload with "Admin access required" — the photo field existed, the
 * API accepted it, and the only thing in the way was this guard. Prescription
 * create and edit were already `clinicalGuard`, so the gap was this route alone.
 *
 * Widening this does not widen what a doctor can *change*: attaching an image
 * still requires write access to the target record, so products, posts and the
 * doctor directory remain admin-only. A doctor can now upload an image and
 * attach it to the clinical records they can already edit.
 *
 * The residual exposure is orphaned uploads - a clinician could upload an image
 * and never reference it. That is bounded by the per-user rate limit below and
 * costs storage, not correctness.
 */
export async function POST(request: Request) {
  const denied = await clinicalGuard();
  if (denied) return denied;

  const actor = await getCurrentUser();

  const rateLimit = await rateLimitRequest(request, {
    // Renamed from "admin-cloudinary-upload": it is no longer admin-only, and a
    // scope named for a narrower audience misleads whoever reads the limit next.
    scope: "staff-cloudinary-upload",
    limit: 60,
    windowMs: 60 * 60 * 1000,
    // Per user as well as per IP: the clinic shares one connection, so an
    // IP-only limit would let the first clinician to upload exhaust everyone
    // else's allowance for the hour.
    dimensions: actor ? [`user:${actor.id}`] : [],
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