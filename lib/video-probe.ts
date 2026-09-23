import "server-only";

import { getVideoEmbed } from "@/lib/video";

/**
 * Google Drive serves Google's "401. That's an error" page from the /preview
 * endpoint when the file is private (not shared with "Anyone with the link"),
 * and its direct download/stream endpoint answers with an HTML page instead of
 * video bytes. The site probes the direct stream URL server-side so visitors
 * see a clean message instead of a broken player.
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
    // Probe failed (network hiccup) — keep the player rather than hiding a working video.
    return true;
  } finally {
    clearTimeout(timer);
  }
}

/** Checks the direct stream URL for a Drive file (used server-side before embedding). */
export async function isDriveDirectPlayable(src: string): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(src, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
    });
    const type = (res.headers.get("content-type") || "").toLowerCase();
    await res.body?.cancel().catch(() => undefined);
    // A playable public file streams as video bytes; a private file (or a
    // consent page) comes back as HTML.
    return res.status >= 200 && res.status < 300 && !type.includes("text/html");
  } catch {
    // Probe failed (network hiccup) — keep the player rather than hiding a working video.
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
  return !(await isDriveDirectPlayable(embed.probeUrl));
}