import { FaCirclePlay } from "react-icons/fa6";
import { getVideoEmbed } from "@/lib/video";

/**
 * Renders a patient video review. Supports YouTube, Vimeo and Google Drive
 * share links plus direct .mp4 / .webm file links.
 *
 * Google Drive reviews use Drive's own `/preview` player in an iframe. The
 * video bytes therefore travel directly from Google to the visitor and never
 * through this deployment — proxying media through a Vercel function is
 * explicitly outside Vercel's fair-use policy (it caused a Fast Origin Transfer
 * block). Direct file links still use the native <video> element, with
 * `preload="none"` so nothing is fetched until the visitor presses play.
 *
 * Pass `bare` for Pinterest-style pinboards: the media renders edge-to-edge
 * with no label, border or card chrome and keeps its natural aspect ratio, so
 * masonry columns give every clip its own height.
 */
export function StoryVideo({
  url,
  bare = false,
}: {
  url: string;
  bare?: boolean;
}) {
  const embed = getVideoEmbed(url);
  if (!embed) return null;

  const media =
    embed.kind === "file" ? (
      <video
        src={embed.src}
        controls
        preload="none"
        playsInline
        className={
          bare
            ? "block w-full bg-forest-950/5"
            : "aspect-video w-full bg-forest-950/5 object-contain"
        }
      />
    ) : (
      <iframe
        src={embed.embedUrl}
        title="Patient video review"
        className="aspect-video w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    );

  if (bare) {
    return (
      <div className="w-full overflow-hidden rounded-xl bg-forest-950/5">
        {media}
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
        {media}
      </div>
    </div>
  );
}
