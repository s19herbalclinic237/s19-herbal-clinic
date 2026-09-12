import { NextResponse } from "next/server";
import { getCloudinary } from "@/lib/cloudinary";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const cloudinary = getCloudinary();
  if (!cloudinary) {
    return NextResponse.json({ error: "Cloudinary is not configured." }, { status: 501 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const folder = process.env.CLOUDINARY_FOLDER || "s19-medical";

  try {
    const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: "auto", overwrite: true },
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