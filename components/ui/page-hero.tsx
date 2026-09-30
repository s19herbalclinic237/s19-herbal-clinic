import Image from "next/image";
import { Container } from "@/components/ui/container";
import { Kicker } from "@/components/ui/heading";
import { BlurIn } from "@/components/ui/motion";

/**
 * The full-bleed photograph banner at the top of a page.
 *
 * Used by fourteen pages, so this is the highest-leverage image on the site.
 *
 * ## Why `fill` rather than intrinsic `width`/`height`
 *
 * A hero is cropped to the viewport and covered edge to edge, so it has no
 * meaningful intrinsic size on screen — which is exactly what `fill` is for.
 * `fill` requires the parent to be positioned, and the `<section>` below is
 * already `relative`.
 *
 * The old markup was a bare `<img>`, which meant no WebP/AVIF negotiation and no
 * `srcset`: every visitor downloaded the full-resolution file. `sizes="100vw"`
 * is accurate here — the image genuinely spans the viewport — and is what lets
 * the optimiser pick a phone-sized candidate instead of the desktop one.
 *
 * ## Loading
 *
 * A hero is above the fold on every page that has one and is the Largest
 * Contentful Paint element, so it loads eagerly at high fetch priority. Next 16
 * deprecates `priority` in favour of `preload`, and its own guidance is that
 * `loading="eager"` with `fetchPriority="high"` is the right choice in most
 * cases; `preload` injects a `<link>` into the head and is only appropriate
 * when there is exactly one LCP candidate.
 *
 * ## Alt text
 *
 * Supplied by the caller from `lib/i18n.ts` so it is localised — a French
 * visitor should not be handed an English description. Most call sites pass a
 * translated key; the remaining few fall back to the empty alt, which correctly
 * marks the photograph as decorative rather than inventing a description.
 */
export function PageHero({
  eyebrow,
  title,
  lead,
  image,
  alt = "",
  compact,
  sizes = "100vw",
  children,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  lead?: string;
  /** Public path (`/s19-assets/…`) or a whitelisted remote URL. */
  image: string;
  /** Localised description of the photograph. Empty marks it decorative. */
  alt?: string;
  compact?: boolean;
  /** Override only if the hero is not actually full-bleed. */
  sizes?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative flex items-center overflow-hidden bg-forest-950">
      <Image
        src={image}
        alt={alt}
        fill
        sizes={sizes}
        loading="eager"
        fetchPriority="high"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-forest-950/95 via-forest-950/80 to-forest-950/35" />
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-forest-950/90 via-forest-950/40 to-transparent" />

      <Container
        className={`relative z-10 w-full ${compact ? "py-14 md:py-20" : "py-20 md:py-28"}`}
      >
        <BlurIn>
          {eyebrow ? <Kicker dark>{eyebrow}</Kicker> : null}
          <h1 className="mt-5 max-w-3xl text-balance text-white drop-shadow-sm">{title}</h1>
          {lead ? (
            <p className="mt-6 max-w-2xl text-base text-forest-100/90 md:text-lg">{lead}</p>
          ) : null}
          {children ? <div className="mt-9">{children}</div> : null}
        </BlurIn>
      </Container>
    </section>
  );
}
