import { v2 as cloudinary } from "cloudinary";

if (process.env.CLOUDINARY_URL) {
  // The SDK auto-loads cloud_name / api_key / api_secret from CLOUDINARY_URL.
  cloudinary.config(true);
} else if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export function getCloudinary() {
  const ready = process.env.CLOUDINARY_URL
    ? true
    : Boolean(
        process.env.CLOUDINARY_CLOUD_NAME &&
          process.env.CLOUDINARY_API_KEY &&
          process.env.CLOUDINARY_API_SECRET
      );
  return ready ? cloudinary : null;
}

export function cloudinaryImage(publicId: string, options?: { width?: number; height?: number; crop?: string }) {
  return cloudinary.url(publicId, {
    width: options?.width ?? 1200,
    crop: options?.crop ?? "fill",
    quality: "auto",
    fetch_format: "auto",
    ...options,
  });
}