import { S19_ASSETS } from "@/lib/site-assets";

/**
 * Branded loading indicator: S19 icon ring with a spinning gold arc.
 * Used by app/loading.tsx, route streaming and data-loading states.
 */
export function SiteLoader({
  label = "Loading…",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center gap-4 ${className}`}
    >
      <div className="relative flex h-16 w-16 items-center justify-center">
        <span
          aria-hidden
          className="absolute inset-0 rounded-full border-2 border-forest-200/70"
        />
        <span
          aria-hidden
          className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-gold-500 [animation-duration:0.9s]"
        />
        <img
          src={S19_ASSETS.logos.iconDark}
          alt=""
          className="h-8 w-8 object-contain"
          aria-hidden
        />
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{label}</p>
      <span className="sr-only">Loading</span>
    </div>
  );
}