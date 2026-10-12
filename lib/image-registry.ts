import type { Locale } from "@/lib/i18n";

/**
 * Registry of the clinic's editorial photographs.
 *
 * ## Why this exists
 *
 * Google Images uses the filename, the alt text, the surrounding caption and the
 * structured data as ranking signals. Before this registry, every one of those
 * was either missing or actively working against the clinic:
 *
 * - The filenames were the **full text prompts used to generate the images** —
 *   `a different s19 staff still in lab doing some transfer of chemical all
 *   dresses in proper lab outfit with gloves.jpg`. That is a useless search term
 *   and an unprofessional URL. They are now descriptive slugs.
 * - Dimensions were unknown, so every `<img>` shipped without `width`/`height`
 *   and the browser could not reserve space — a direct Core Web Vitals penalty.
 * - Alt text lived as ad-hoc strings in whatever component happened to use the
 *   photo, in one language only.
 *
 * So this file is the single place a photo is described. `src` is **derived from
 * the slug** rather than typed out, so a path can never drift from its filename,
 * and `tests/image-seo.test.ts` verifies the declared dimensions against the real
 * bytes of each file.
 *
 * ## Adding a photo
 *
 * 1. Put the file in `public/s19-assets/` with a lowercase-kebab-case,
 *    descriptive filename. Never a generation prompt.
 * 2. Add an entry here, with real dimensions and alt text in **both** languages.
 * 3. Add an eslint-disable or plain `<img>` justification if it is dynamic.
 *
 * The tests fail if a file exists in the folder without an entry, so a new photo
 * cannot be added without being described.
 */

/** Directory (under `public/`) holding the clinic's editorial photographs. */
export const CLINIC_PHOTO_DIR = "/s19-assets";

export interface ClinicPhoto {
  /**
   * Descriptive, lowercase-kebab-case filename stem. This is the ranking signal,
   * so it should read like a search term a patient would plausibly type.
   */
  readonly slug: string;
  /** Intrinsic pixel width. Must match the file; verified by tests. */
  readonly width: number;
  /** Intrinsic pixel height. Must match the file; verified by tests. */
  readonly height: number;
  /**
   * Alt text. Describes what is in the frame, in context, for a screen-reader
   * user — the same text is what image search indexes. Never keyword-stuffed and
   * never empty on a content image.
   */
  readonly alt: Readonly<Record<Locale, string>>;
  /** Caption used in the image sitemap and rendered as a visible figcaption. */
  readonly caption: Readonly<Record<Locale, string>>;
  /**
   * Site paths this photo appears on. Feeds the image sitemap so each image is
   * associated with the pages that actually use it.
   */
  readonly pages: readonly string[];
  /**
   * `true` when this photograph is the intended Largest Contentful Paint image
   * of a page. That one image is loaded eagerly at high fetch priority and
   * everything else is lazy-loaded, because lazy-loading the LCP element makes
   * the page measurably slower.
   *
   * Named `lcp` rather than `priority` deliberately: Next 16 deprecates the
   * `priority` prop in favour of `preload`, and this flag is about the page's
   * content, not about which framework prop to set.
   */
  readonly lcp?: boolean;
}

function photo(entry: ClinicPhoto): ClinicPhoto {
  return entry;
}

/**
 * The clinic's photographs.
 *
 * Keyed by the historical `S19_ASSETS.photos.*` names so the many existing call
 * sites keep working unchanged while the metadata moves here.
 */
export const CLINIC_PHOTOS = {
  shopCounter: photo({
    slug: "s19-herbal-clinic-shop-counter-bafoussam",
    width: 1080,
    height: 720,
    lcp: true,
    alt: {
      en: "S19 Herbal Clinic product counter in Bafoussam, with herbal remedies and health products displayed in the cupboards behind it",
      fr: "Comptoir produits de la Clinique S19 à Bafoussam, avec des remèdes à base de plantes et des produits de santé présentés dans les placards derrière",
    },
    caption: {
      en: "The S19 Herbal Clinic shop and product counter in Bafoussam.",
      fr: "La boutique et le comptoir produits de la Clinique S19 à Bafoussam.",
    },
    pages: ["/", "/track"],
  }),

  patientRecords: photo({
    slug: "s19-clinic-patient-records-bafoussam",
    width: 1080,
    height: 720,
    alt: {
      en: "An S19 Herbal Clinic staff member recording a patient's health history in a medical booklet at the clinic office in Bafoussam",
      fr: "Un membre du personnel de la Clinique S19 consignant les antécédents sanitaires d'un patient dans un carnet médical, au bureau de la clinique à Bafoussam",
    },
    caption: {
      en: "Health history taken at the S19 clinic office in Bafoussam.",
      fr: "Anamnèse prise au bureau de la clinique S19 à Bafoussam.",
    },
    pages: ["/", "/telehealth", "/privacy"],
  }),

  consultationAdvice: photo({
    slug: "s19-herbal-clinic-consultation-bafoussam",
    width: 1280,
    height: 720,
    lcp: true,
    alt: {
      en: "An S19 Herbal Clinic practitioner explaining a treatment plan to two clients during a consultation in Bafoussam",
      fr: "Un praticien de la Clinique S19 expliquant un plan de traitement à deux clients lors d'une consultation à Bafoussam",
    },
    caption: {
      en: "A consultation at S19 Herbal Clinic, Bafoussam.",
      fr: "Une consultation à la Clinique S19, Bafoussam.",
    },
    pages: ["/services", "/health-library", "/patient-stories", "/faq"],
  }),

  bloodPressure: photo({
    slug: "s19-clinic-blood-pressure-check-bafoussam",
    width: 1280,
    height: 720,
    alt: {
      en: "An S19 Herbal Clinic staff member measuring a patient's blood pressure with a digital monitor in the Bafoussam clinic",
      fr: "Un membre du personnel de la Clinique S19 mesurant la tension artérielle d'un patient avec un tensiomètre numérique à la clinique de Bafoussam",
    },
    caption: {
      en: "Blood pressure monitoring at the S19 clinic in Bafoussam.",
      fr: "Surveillance de la tension artérielle à la clinique S19 de Bafoussam.",
    },
    pages: ["/", "/location", "/live-reviews"],
  }),

  labBeakers: photo({
    slug: "s19-herbal-clinic-laboratory-beakers",
    width: 720,
    height: 1080,
    lcp: true,
    alt: {
      en: "An S19 Herbal Clinic laboratory technician in protective equipment working with glass beakers of herbal preparation in Bafoussam",
      fr: "Une technicienne du laboratoire de la Clinique S19, en équipement de protection, travaillant avec des béchers de préparation à base de plantes à Bafoussam",
    },
    caption: {
      en: "Preparing herbal formulations in the S19 Herbal Clinic laboratory.",
      fr: "Préparation de formulations à base de plantes au laboratoire de la Clinique S19.",
    },
    pages: ["/about", "/terms"],
  }),

  electrolysis: photo({
    slug: "s19-clinic-electrotherapy-treatment",
    width: 720,
    height: 1080,
    alt: {
      en: "An S19 Herbal Clinic practitioner performing a non-invasive electrotherapy treatment on a patient at the Bafoussam clinic",
      fr: "Un praticien de la Clinique S19 réalisant un traitement d'électrothérapie non invasive sur un patient à la clinique de Bafoussam",
    },
    caption: {
      en: "A non-invasive supportive therapy session at S19 Herbal Clinic.",
      fr: "Une séance de thérapie de soutien non invasive à la Clinique S19.",
    },
    pages: ["/services"],
  }),

  cupboardProducts: photo({
    slug: "s19-herbal-products-display-shelf",
    width: 720,
    height: 1080,
    alt: {
      en: "Shelves of S19 Herbal Clinic herbal products, medicinal teas and supplements in the Bafoussam clinic dispensary",
      fr: "Rayonnages de produits à base de plantes, de tisanes médicinales et de compléments de la Clinique S19 dans la dispensaire de Bafoussam",
    },
    caption: {
      en: "Herbal products in the S19 dispensary.",
      fr: "Produits à base de plantes à la dispensaire S19.",
    },
    pages: ["/contact", "/cookies", "/refund-and-returns"],
  }),

  nutritionBasketOutreach: photo({
    slug: "s19-nutrition-health-education-workshop",
    width: 1280,
    height: 720,
    lcp: true,
    alt: {
      en: "An S19 Herbal Clinic staff member holding a basket of fresh fruit and vegetables while explaining nutrition to a community group in Bafoussam",
      fr: "Un membre du personnel de la Clinique S19 tenant un panier de fruits et légumes frais tout en expliquant la nutrition à un groupe communautaire à Bafoussam",
    },
    caption: {
      en: "Health and nutrition education in the community.",
      fr: "Éducation à la santé et à la nutrition dans la communauté.",
    },
    pages: ["/blog", "/shop"],
  }),

  // The four photographs below were not referenced anywhere before this registry.
  // They are real, well-lit photographs of the clinic's laboratory and of its
  // staff, which is exactly the kind of imagery that ranks in Google Images for
  // local terms, so they are surfaced in the "Inside the clinic" gallery on the
  // About page rather than left on disk doing nothing.
  labTransfer: photo({
    slug: "s19-laboratory-liquid-transfer",
    width: 720,
    height: 1080,
    alt: {
      en: "An S19 Herbal Clinic laboratory technician transferring a herbal preparation between containers during laboratory investigation in Bafoussam",
      fr: "Une technicienne du laboratoire de la Clinique S19 transférant une préparation à base de plantes entre des contenants lors d'une investigation de laboratoire à Bafoussam",
    },
    caption: {
      en: "Laboratory investigation of a herbal preparation.",
      fr: "Investigation de laboratoire d'une préparation à base de plantes.",
    },
    pages: ["/about"],
  }),

  pipetteTransfer: photo({
    slug: "s19-laboratory-pipette-transfer",
    width: 720,
    height: 1080,
    alt: {
      en: "An S19 Herbal Clinic laboratory technician using a pipette to transfer a herbal liquid during laboratory investigation in Bafoussam",
      fr: "Une technicienne du laboratoire de la Clinique S19 utilisant une pipette pour transférer un liquide à base de plantes lors d'une investigation de laboratoire à Bafoussam",
    },
    caption: {
      en: "Measuring a herbal preparation in the S19 laboratory.",
      fr: "Dosage d'une préparation à base de plantes au laboratoire S19.",
    },
    pages: ["/about"],
  }),

  pipetteReading: photo({
    slug: "s19-laboratory-pipette-reading",
    width: 720,
    height: 1080,
    alt: {
      en: "An S19 Herbal Clinic laboratory technician reading the measurement on a pipette during laboratory investigation in Bafoussam",
      fr: "Une technicienne du laboratoire de la Clinique S19 lisant la mesure sur une pipette lors d'une investigation de laboratoire à Bafoussam",
    },
    caption: {
      en: "Reading a measurement during laboratory investigation.",
      fr: "Lecture d'une mesure lors d'une investigation de laboratoire.",
    },
    pages: ["/about"],
  }),

  nutritionBasket: photo({
    slug: "s19-nutrition-health-education-clinic-staff",
    width: 1280,
    height: 720,
    alt: {
      en: "An S19 Herbal Clinic staff member in clinic uniform holding a basket of fresh fruit and vegetables during a nutrition education session in Bafoussam",
      fr: "Un membre du personnel de la Clinique S19, en tenue de clinique, tenant un panier de fruits et légumes frais lors d'une séance d'éducation nutritionnelle à Bafoussam",
    },
    caption: {
      en: "Nutrition education with fresh, locally available produce.",
      fr: "Éducation nutritionnelle avec des produits frais localement disponibles.",
    },
    pages: ["/about"],
  }),
} as const satisfies Record<string, ClinicPhoto>;

export type ClinicPhotoKey = keyof typeof CLINIC_PHOTOS;

/** All photos, as a stable array. */
export const CLINIC_PHOTO_LIST: readonly ClinicPhoto[] = Object.values(CLINIC_PHOTOS);

/** File name on disk, e.g. `s19-herbal-clinic-shop-counter-bafoussam.jpg`. */
export function clinicPhotoFile(entry: ClinicPhoto): string {
  return `${entry.slug}.jpg`;
}

/** Public URL for a photo, e.g. `/s19-assets/s19-herbal-clinic-shop-counter-bafoussam.jpg`. */
export function clinicPhotoSrc(entry: ClinicPhoto): string {
  return `${CLINIC_PHOTO_DIR}/${clinicPhotoFile(entry)}`;
}

/** Look up a photo by its `S19_ASSETS.photos` key. */
export function clinicPhoto(key: ClinicPhotoKey): ClinicPhoto {
  return CLINIC_PHOTOS[key];
}

/** Registry entry for a public path, or `undefined` if the path is not ours. */
export function findClinicPhotoBySrc(src: string | undefined): ClinicPhoto | undefined {
  if (!src) return undefined;
  return CLINIC_PHOTO_LIST.find((p) => clinicPhotoSrc(p) === src);
}

/** Localised alt text for a photo. */
export function clinicPhotoAlt(entry: ClinicPhoto, locale: Locale): string {
  return entry.alt[locale];
}

/**
 * Everything a component needs to render a photo, resolved in one call.
 *
 * Bundling these together keeps the awkward part — remembering to look up the
 * entry *and* the right language — in one place, so a call site is a single
 * spread rather than three lookups that can disagree:
 *
 * ```tsx
 * const photo = resolveClinicPhoto("labBeakers", locale);
 * <ClinicPhotoImage {...photo} sizes="100vw" />
 * ```
 */
export function resolveClinicPhoto(
  key: ClinicPhotoKey,
  locale: Locale
): {
  photo: ClinicPhoto;
  src: string;
  alt: string;
  width: number;
  height: number;
} {
  const entry = CLINIC_PHOTOS[key];
  return {
    photo: entry,
    src: clinicPhotoSrc(entry),
    alt: clinicPhotoAlt(entry, locale),
    width: entry.width,
    height: entry.height,
  };
}

/** Aspect ratio (width / height), useful for reserving layout space. */
export function clinicPhotoRatio(entry: ClinicPhoto): number {
  return entry.width / entry.height;
}

/**
 * The clinic's wordmark and app icon.
 *
 * Separate from `CLINIC_PHOTOS` because these are brand marks, not editorial
 * photographs: they are not page content, they appear in the manifest and as the
 * favicon, and their alt text is the brand name rather than a description.
 *
 * They still need the same treatment as any other image that a crawler will see
 * — the icon filenames used to contain spaces, which is the same filename defect
 * the editorial photos had, and every logo was rendered with no intrinsic
 * dimensions, which let the header shift while the mark loaded.
 */
export interface ClinicLogo {
  readonly src: string;
  /** Intrinsic pixel width. Verified against the file by tests. */
  readonly width: number;
  /** Intrinsic pixel height. Verified against the file by tests. */
  readonly height: number;
}

export const CLINIC_LOGOS = {
  /** Wordmark for use on light backgrounds. 813x150. */
  fullLight: { src: "/s19-full-logo-for-light-mode.png", width: 813, height: 150 },
  /** Wordmark for use on dark backgrounds. 802x150. */
  fullDark: { src: "/s19-full-logo-for-dark-mode.png", width: 802, height: 150 },
  /** Square icon for light backgrounds. 150x150. */
  iconLight: { src: "/s19-icon-for-light-mode.png", width: 150, height: 150 },
  /** Square icon for dark backgrounds. 150x150. */
  iconDark: { src: "/s19-icon-for-dark-mode.png", width: 150, height: 150 },
  /** Repeating background pattern. 239x73. */
  pattern: { src: "/s19-pattern.png", width: 239, height: 73 },
} as const satisfies Record<string, ClinicLogo>;

export type ClinicLogoKey = keyof typeof CLINIC_LOGOS;

/** Logos as a stable array, for verification. */
export const CLINIC_LOGO_LIST: readonly ClinicLogo[] = Object.values(CLINIC_LOGOS);

/**
 * Photographs that appear on a given site path, in registry order.
 *
 * Used by the sitemap to declare which images belong to which page. An image
 * declared on a page it is not actually on is worse than one left undeclared, so
 * the `pages` field is the authority here and is verified against the real route
 * tree by `tests/image-seo.test.ts`.
 */
export function photosForPage(page: string): readonly ClinicPhoto[] {
  const normalised = page === "" ? "/" : page;
  return CLINIC_PHOTO_LIST.filter((p) => p.pages.includes(normalised));
}

/**
 * Public paths of every photograph that appears on a page, in registry order.
 *
 * The sitemap's `images` field wants absolute URLs, so callers map these through
 * `canonicalPath` from `lib/seo`. Only registry entries are ever returned, which
 * is the point: the sitemap must not advertise an image we have not described.
 */
export function photoPathsForPage(page: string): string[] {
  return photosForPage(page).map((p) => clinicPhotoSrc(p));
}


