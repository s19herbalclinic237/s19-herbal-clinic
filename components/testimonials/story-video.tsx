import { FaCircleExclamation, FaCirclePlay } from "react-icons/fa6";
import { getVideoEmbed } from "@/lib/video";

/**
 * Renders a patient video review. Supports YouTube, Vimeo and Google Drive
 * share links plus direct .mp4 / .webm file links.
 *
 * Google Drive reviews play edge-to-edge through the site's streaming proxy
 * (same origin, Range support) so the native <video> element actually loads
 * them — Drive's own download endpoint marks responses as attachments, which
 * browsers refuse to play. Pass `blocked` (probed server-side) when a Drive
 * file is private: instead of a broken player, visitors see a clean message
 * and a link to the source file.
 *
 * Pass `bare` for Pinterest-style pinboards: the media renders edge-to-edge
 * with no label, border or card chrome and keeps its natural aspect ratio, so
 * masonry columns give every clip its own height.
 */
export function StoryVideo({
  url,
  blocked = false,
  bare = false,
}: {
  url: string;
  blocked?: boolean;
  bare?: boolean;
}) {
  const embed = getVideoEmbed(url);
  if (!embed) return null;

  const isBlocked = blocked && embed.kind === "drive";

  if (bare) {
    return (
      <div className="w-full overflow-hidden rounded-xl bg-forest-950/5">
        {isBlocked ? (
          <div className="flex aspect-video w-full flex-col items-center justify-center gap-2.5 bg-forest-950/10 px-6 text-center">
            <FaCircleExclamation className="h-8 w-8 text-gold-500" aria-hidden />
            <p className="text-sm font-bold text-ink">
              This video is temporarily unavailable.
            </p>
            <p className="text-xs leading-relaxed text-muted">
              The clinic will restore it shortly. You can also open it in Google Drive:
            </p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-full bg-forest-800 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-forest-900"
            >
              Open in Google Drive
            </a>
          </div>
        ) : embed.kind === "file" || embed.kind === "drive" ? (
          <video
            src={embed.src}
            controls
            preload="metadata"
            playsInline
            className="block w-full bg-forest-950/5"
          />
        ) : (
          <iframe
            src={embed.embedUrl}
            title="Patient video review"
            className="aspect-video w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        )}
      </div>
    );
  }

  return (
    <div className="mt-4">
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-forest-700">
        <FaCirclePlay className="h-3.5 w-3.5 text-gold-500" aria-hidden />
        Video review
      </p>
      <div className="mt-2 overflow-hidden rounded-lg border border-forest-100 bg-forest-950/5 shadow-sm">
        {isBlocked ? (
          <div className="flex aspect-video w-full flex-col items-center justify-center gap-2.5 bg-forest-950/10 px-6 text-center">
            <FaCircleExclamation className="h-8 w-8 text-gold-500" aria-hidden />
            <p className="text-sm font-bold text-ink">
              This video is temporarily unavailable.
            </p>
            <p className="text-xs leading-relaxed text-muted">
              The clinic will restore it shortly. You can also open it in Google Drive:
            </p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-full bg-forest-800 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-forest-900"
            >
              Open in Google Drive
            </a>
          </div>
        ) : embed.kind === "file" || embed.kind === "drive" ? (
          <video
            src={embed.src}
            controls
            preload="metadata"
            playsInline
            className="aspect-video w-full bg-forest-950/5 object-contain"
          />
        ) : (
          <iframe
            src={embed.embedUrl}
            title="Patient video review"
            className="aspect-video w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        )}
      </div>
    </div>
  );
}