/**
 * Shared client-side guards for dashboard image uploads (products, posts,
 * doctors). Mirrors the server-side rules in app/api/upload/route.ts so users
 * get instant feedback instead of waiting for a 415/413 response.
 */

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
]);

/** Returns an error message, or null when the file is acceptable. */
export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return "Please choose a JPG, PNG, WebP, AVIF or GIF image. Videos are not supported.";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return "Image must be under 5 MB.";
  }
  return null;
}