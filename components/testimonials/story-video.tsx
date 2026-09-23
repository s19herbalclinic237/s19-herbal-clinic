import { FaCircleExclamation, FaCirclePlay } from "react-icons/fa6";
import { getVideoEmbed } from "@/lib/video";

/**
 * Renders a patient video review. Supports YouTube, Vimeo and Google Drive
 * share links (embedded) plus direct .mp4 / .webm file links (<video>).
 *
 * Pass `blocked` (probed server-side) when a Google Drive file is private:
 * instead of renting Google's "401. That's an error" frame inside the iframe,
 * visitors see a clean message and a link to the source file.
 */
export function StoryVideo({ url, blocked = false }: { url: string; blocked?: boolean }) {
  const embed = getVideoEmbed(url);
  if (!embed) return null;

  const isBlocked = blocked && embed.kind === "drive";

  return (
    <div className="mt-4">
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-forest-700">
        <FaCirclePlay className="h-3.5 w-3.5 text-gold-500" aria-hidden />
        Video review
      </p>
      <div className="mt-2 overflow-hidden rounded-lg border border-forest-100 bg-forest-950/5 shadow-sm">
        {embed.kind === "file" ? (
          <video src={embed.src} controls preload="metadata" className="aspect-video w-full" />
        ) : isBlocked ? (
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