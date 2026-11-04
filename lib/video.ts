/**
 * Video review link handling.
 *
 * The clinic shares video reviews by link (YouTube, Vimeo or Google Drive)
 * instead of storing large files, so we convert a shared link into an
 * embeddable URL. Direct .mp4 / .webm links are rendered with the <video>
 * element instead of an iframe.
 */

export type VideoEmbed =
  | { kind: "youtube"; embedUrl: string }
  | { kind: "vimeo"; embedUrl: string }
  | { kind: "drive"; embedUrl: string }
  | { kind: "file"; src: string };

export function getVideoEmbed(url?: string | null): VideoEmbed | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // Google Drive: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  // Drive's download endpoint answers with `Content-Disposition: attachment`,
  // which Chromium's media stack refuses to play. We therefore use Drive's own
  // /preview player in an iframe. The video bytes go directly from Google to the
  // visitor, never through this deployment: proxying media through a Vercel
  // function is explicitly outside Vercel's fair-use policy and was the cause of
  // the team's Fast Origin Transfer block.
  const driveMatch = trimmed.match(/drive\.google\.com\/file\/d\/([^/?#]+)/);
  if (driveMatch && driveMatch[1]) {
    const fileId = driveMatch[1];
    return {
      kind: "drive",
      embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
    };
  }

  // YouTube: watch?v=ID, youtu.be/ID, shorts/ID or embed/ID
  const ytMatch = trimmed.match(
    /(?:youtube\.com\/(?:watch\?.*[?&]v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/
  );
  if (ytMatch && ytMatch[1]) {
    return {
      kind: "youtube",
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}`,
    };
  }

  // Vimeo: vimeo.com/VIDEO_ID
  const vimeoMatch = trimmed.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return { kind: "vimeo", embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}` };
  }

  // Direct video file (.mp4 / .webm / .ogg / .mov)
  if (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(trimmed) || trimmed.startsWith("/")) {
    return { kind: "file", src: trimmed };
  }

  return null;
}