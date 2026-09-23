import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { getSessionUser, toAuthUser } from "@/lib/auth-server";
import { User } from "@/lib/models/User";
import { getCloudinary } from "@/lib/cloudinary";

export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "application/pdf",
]);

export async function POST(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Sign in to upload your ID document." }, { status: 401 });
  }

  const cloudinary = getCloudinary();
  if (!cloudinary) {
    return NextResponse.json({ error: "ID uploads are temporarily unavailable." }, { status: 501 });
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
    return NextResponse.json({ error: "Document must be under 8 MB." }, { status: 413 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { error: "Please upload a JPG, PNG, WebP, AVIF or PDF document." },
      { status: 415 }
    );
  }
  const side = String(formData.get("side") || "front");
  if (side !== "front" && side !== "back") {
    return NextResponse.json({ error: "Please indicate which side of the document you uploaded." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const baseFolder = process.env.CLOUDINARY_FOLDER || "s19-medical";
  const folder = `${baseFolder}/id-cards`;

  try {
    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "auto",
          overwrite: true,
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
      return NextResponse.json({ error: "ID uploads are temporarily unavailable." }, { status: 503 });
    }

    const updated = await User.findByIdAndUpdate(
      sessionUser.id,
      { $set: { [side === "back" ? "idCardBackUrl" : "idCardFrontUrl"]: result.secure_url } },
      { new: true }
    ).lean();
    if (!updated) {
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }

    return NextResponse.json(
      { success: true, user: toAuthUser(updated), message: "ID document uploaded." },
      { status: 201 }
    );
  } catch (error) {
    console.error("[id-card] cloudinary error:", error);
    return NextResponse.json({ error: "Upload failed. Try again." }, { status: 500 });
  }
}