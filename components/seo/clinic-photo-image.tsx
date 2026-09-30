import Image from "next/image";
import { CLINIC_LOGOS, clinicPhotoSrc, type ClinicLogoKey, type ClinicPhoto } from "@/lib/image-registry";

/**
 * A clinic photograph, rendered with its true intrinsic size.
 *
 * ## Why this exists
 *
 * The public pages used a bare `<img>` with no `width` and no `height`. Two
 * consequences, both of which cost search ranking:
 *
 * - **Layout shift.** Without intrinsic dimensions the browser cannot reserve
 *   space, so each image shoves the text below it down as it loads. That is
 *   Cumulative Layout Shift — a Core Web Vitals metric, and a ranking input.
 * - **No optimisation.** A raw `<img>` is served exactly as stored: no WebP or
 *   AVIF, no `srcset`. A phone on a 360px-wide slot downloads a 1080px file.
 *
 * `next/image` fixes both, but it *demands* a width and a height, and a wrong
 * value is worse than none because it reserves the wrong space. So the caller
 * never types the dimensions: they come from
 * `resolveClinicPhoto(key, locale)` in `lib/image-registry`, and that registry is
 * verified against the real bytes of every file by `tests/image-seo.test.ts`.
 *
 * Spreading a `resolveClinicPhoto` result is the intended usage:
 *
 * ```tsx
 * const photo = resolveClinicPhoto("labBeakers", locale);
 * <ClinicPhotoImage {...photo} sizes="100vw" />
 * ```
 *
 * Synchronous on purpose — it works in a server component, a client component or
 * a synchronous shared component such as `PageHero`, with no suspense boundary
 * and no async render in the middle of a layout.
 *
 * ## A note on `priority` / `preload`
 *
 * Next 16 deprecates `priority` in favour of `preload`, and its own guidance is
 * that in most cases you want `loading="eager"` with `fetchPriority="high"`
 * instead of `preload` — `preload` injects a `<link>` into the head and is only
 * right when there is exactly one LCP candidate. A page here has a hero plus
 * several full-bleed section photographs that can each become the LCP depending
 * on viewport, so this uses `loading` + `fetchPriority` and lets the registry's
 * `lcp` flag decide which image is the intended one.
 */
export function ClinicPhotoImage({
  src,
  alt,
  width,
  height,
  lcp,
  sizes = "100vw",
  className,
  style,
  caption,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  /**
   * True for the intended Largest Contentful Paint image of a page: loaded
   * eagerly at high priority. Correct for one image per page and actively
   * harmful for the rest, because lazy-loading the LCP element makes the page
   * measurably slower. Comes from the registry's `lcp` flag.
   */
  lcp?: boolean;
  /**
   * Required in practice by `next/image`. It tells the optimiser which candidate
   * to send; without it the browser assumes full viewport width and over-fetches
   * on every screen size. Set it to match the real rendered width.
   */
  sizes?: string;
  className?: string;
  style?: React.CSSProperties;
  /** Optional visible caption, e.g. under a gallery tile. */
  caption?: string;
}) {
  const image = (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      loading={lcp ? "eager" : "lazy"}
      fetchPriority={lcp ? "high" : "auto"}
      className={className}
      style={style}
    />
  );

  if (!caption) return image;
  return (
    <figure>
      {image}
      <figcaption className="mt-3 text-center text-xs leading-relaxed text-muted">{caption}</figcaption>
    </figure>
  );
}

/**
 * A full-bleed photograph that covers its container, for hero sections.
 *
 * `fill` is the right tool when the image has no meaningful intrinsic size on
 * screen — a hero cropped to the viewport is the canonical case. The container
 * must be positioned (`relative`/`absolute`), which is why `className` normally
 * includes `object-cover` and the parent carries the positioning.
 */
export function ClinicPhotoFill({
  photo,
  alt,
  className,
  lcp,
  sizes = "100vw",
}: {
  photo: ClinicPhoto;
  alt: string;
  className?: string;
  lcp?: boolean;
  sizes?: string;
}) {
  const isLcp = lcp ?? photo.lcp ?? false;
  return (
    <Image
      src={clinicPhotoSrc(photo)}
      alt={alt}
      fill
      sizes={sizes}
      loading={isLcp ? "eager" : "lazy"}
      fetchPriority={isLcp ? "high" : "auto"}
      className={className}
    />
  );
}

/**
 * The clinic wordmark or app icon, sized from its intrinsic dimensions.
 *
 * The header, footer and sign-in panel all render the wordmark at a fixed height
 * with automatic width. Previously that was a bare `<img>` with no width or
 * height, so the browser had no aspect ratio to reserve and the header visibly
 * shifted as the mark loaded — on every page, since it is above the fold.
 *
 * The dimensions come from `CLINIC_LOGOS` in `lib/image-registry.ts`, verified
 * against the real files by `tests/image-seo.test.ts`, so a call site cannot
 * declare a size that does not match the asset.
 *
 * `fetchPriority` is deliberately left at its default. The wordmark is a genuine
 * Largest Contentful Paint candidate on a text-heavy page, but promoting it
 * alongside a hero photograph would put two images in competition for the same
 * budget and slow down the one that matters more on each page.
 */
export function ClinicLogoImage({
  logo,
  alt,
  className,
}: {
  logo: ClinicLogoKey;
  /** The brand name, e.g. "S19 Herbal Clinic logo". */
  alt: string;
  className?: string;
}) {
  const entry = CLINIC_LOGOS[logo];
  return (
    <Image
      src={entry.src}
      alt={alt}
      width={entry.width}
      height={entry.height}
      // Above the fold in the header, so not lazy — but a wordmark is a handful
      // of kilobytes and is cached after the first page view.
      loading="eager"
      sizes="(min-width: 768px) 176px, 160px"
      className={className}
    />
  );
}
