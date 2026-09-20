import { FaCirclePlay } from "react-icons/fa6";
import { getVideoEmbed } from "@/lib/video";

/**
 * Renders a patient video review. Supports YouTube, Vimeo and Google Drive
 * share links (embedded) plus direct .mp4 / .webm file links (<video>).
 */
export function StoryVideo({ url }: { url: string }) {
  const embed = getVideoEmbed(url);
  if (!embed) return null;

  return (
    <div className="mt-4">
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-forest-700">
        <FaCirclePlay className="h-3.5 w-3.5 text-gold-500" aria-hidden />
        Video review
      </p>
      <div className="mt-2 overflow-hidden rounded-lg border border-forest-100 bg-forest-950/5 shadow-sm">
        {embed.kind === "file" ? (
          <video src={embed.src} controls preload="metadata" className="aspect-video w-full" />
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