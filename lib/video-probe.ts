import "server-only";

import { getVideoEmbed } from "@/lib/video";

/**
 * Google Drive serves Google's "401. That's an error" page from the /preview
 * endpoint when the file is private (not shared with "Anyone with the link").
 * The site probes drive embeds server-side so visitors see a clean message
 * instead of Google's error frame inside the iframe. Non-Drive embeds
 * (YouTube / Vimeo / direct files) are assumed playable.
 */
export async function isDrivePreviewPlayable(previewUrl: string): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(previewUrl, {
      method: "GET",
      redirect: "manual",
      signal: controller.signal,
    });
    await res.body?.cancel().catch(() => undefined);
    return res.status >= 200 && res.status < 300;
  } catch {
    // Probe failed (network hiccup) — keep the iframe rather than hiding a working video.
    return true;
  } finally {
    clearTimeout(timer);
  }
}

/** True when a shared link won't stream to visitors (private Google Drive file). */
export async function isVideoEmbedBlocked(url?: string | null): Promise<boolean> {
  if (!url) return false;
  const embed = getVideoEmbed(url);
  if (!embed || embed.kind !== "drive") return false;
  return !(await isDrivePreviewPlayable(embed.embedUrl));
}