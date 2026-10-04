/**
 * Central SEO helpers & keyword research for S19 Herbal Clinic.
 *
 * Keyword sources (researched July 2025-2026):
 * - Local intent: "herbal clinic Bafoussam", "herbalist Bafoussam", "médecin
 *   traditionnel Bafoussam", "phytothérapie Cameroun" (FR equivalents).
 * - Cameroon coverage: all 10 regions + major cities (see CAMEROON_REGIONS).
 * - International intent: science-based herbalism, natural treatment for
 *   diabetes / hypertension / prostate / women's health, shipping to supported
 *   international destinations. Deliberately not "worldwide": the delivery guide
 *   forbids promising every country, and a keyword is a promise to a crawler.
 *
 * Image SEO (filenames, intrinsic dimensions, alt text, captions) lives in
 * `lib/image-registry.ts`, which is the single place a clinic photograph is
 * described. The `ImageObject` / `ImageGallery` builders below read from it so
 * structured data cannot drift away from the alt text.
 */

import type { ClinicPhoto } from "@/lib/image-registry";
import { clinicPhotoSrc, photosForPage } from "@/lib/image-registry";
import type { Locale } from "@/lib/i18n";

/** Normalized base URL (no trailing slash). Falls back to the public S19 domain. */
export function siteUrl(raw?: string): string {
  const fallback = "https://s19herbalclinic.com";
  const trimmed = (raw ?? process.env.NEXT_PUBLIC_SITE_URL)?.trim();
  if (!trimmed) return fallback;
  const withScheme = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    return new URL(withScheme).origin; // strips path + trailing slash
  } catch {
    return fallback;
  }
}

export const SITE_URL = siteUrl();

/** Absolute URL for a site path, e.g. canonicalPath("/location") -> https://…/location */
export function canonicalPath(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${p}`;
}

/**
 * Small metadata spread for pages that already export generateMetadata:
 * self-referencing canonical + a complete Open Graph block (type, siteName,
 * locale, image) so overriding a page's OG metadata never drops the global
 * OG fields defined in the root layout.
 */
export function canonicalMeta(path: string) {
  const url = canonicalPath(path);
  return {
    alternates: { canonical: url },
    openGraph: {
      url,
      type: "website",
      siteName: "S19 Herbal Clinic",
      locale: "en_US",
      alternateLocale: ["fr_FR"],
      images: [
        {
          url: "/open-graph-thumbnail.png",
          width: 1200,
          height: 630,
          alt: "S19 Herbal Clinic",
        },
      ],
    },
  };
}

/** Primary search keywords (English). */
export const SEO_KEYWORDS_EN = [
  "S19 Herbal Clinic",
  "herbal medicine clinic Cameroon",
  "herbal clinic Bafoussam",
  "herbalist Bafoussam",
  "best herbal clinic in Cameroon",
  "natural medicine clinic Bafoussam",
  "traditional medicine clinic Cameroon",
  "science-based herbalism",
  "root-cause healthcare",
  "herbal doctor Cameroon",
  "natural healing clinic",
  "herbal telehealth consultation",
  "online herbal doctor consultation",
  "herbal remedies for diabetes",
  "natural treatment for type 2 diabetes",
  "herbal support for high blood pressure",
  "natural hypertension remedies",
  "prostate herbal tea",
  "natural prostate support BPH",
  "herbal treatment for malaria and typhoid",
  "women's health herbal remedies",
  "hormonal balance natural remedies",
  "herbal products Cameroon",
  "herbal tea Bafoussam",
  "phytotherapy clinic Cameroon",
  "African herbal remedies",
  "herbal medicine delivery Cameroon",
  "international herbal shipping",
];

/** Secondary search keywords (French). */
export const SEO_KEYWORDS_FR = [
  "clinique de phytothérapie Bafoussam",
  "phytothérapie Cameroun",
  "plantes médicinales Cameroun",
  "médecine traditionnelle Cameroun",
  "médecin traditionnel Bafoussam",
  "phytothérapeute Bafoussam",
  "herboristerie Bafoussam",
  "pharmacopée camerounaise",
  "guérison naturelle Cameroun",
  "traitement naturel du diabète",
  "plantes pour la tension artérielle",
  "remède naturel prostate",
  "tisane médicinale",
  "santé féminine plantes médicinales",
  "traitement naturel paludisme et typhoïde",
  "produits de phytothérapie Cameroun",
  "clinique naturelle Cameroun",
];

/** All 10 regions of Cameroon (EN/FR names + capital) for geo coverage. */
export const CAMEROON_REGIONS = [
  { en: "West Region", fr: "Région de l'Ouest", capital: "Bafoussam" },
  { en: "Centre Region", fr: "Région du Centre", capital: "Yaoundé" },
  { en: "Littoral Region", fr: "Région du Littoral", capital: "Douala" },
  { en: "Northwest Region", fr: "Région du Nord-Ouest", capital: "Bamenda" },
  { en: "Southwest Region", fr: "Région du Sud-Ouest", capital: "Buea" },
  { en: "Adamawa Region", fr: "Région de l'Adamaoua", capital: "Ngaoundéré" },
  { en: "North Region", fr: "Région du Nord", capital: "Garoua" },
  { en: "Far North Region", fr: "Région de l'Extrême-Nord", capital: "Maroua" },
  { en: "East Region", fr: "Région de l'Est", capital: "Bertoua" },
  { en: "South Region", fr: "Région du Sud", capital: "Ebolowa" },
];

/** Major Cameroonian cities covered by the clinic / nationwide delivery. */
export const CAMEROON_CITIES = [
  "Bafoussam",
  "Yaoundé",
  "Douala",
  "Bamenda",
  "Buea",
  "Limbé",
  "Kumba",
  "Nkongsamba",
  "Dschang",
  "Foumban",
  "Bafang",
  "Mbouda",
  "Bangangté",
  "Ngaoundéré",
  "Garoua",
  "Maroua",
  "Bertoua",
  "Ebolowa",
  "Edéa",
  "Kribi",
];

/** Location-scoped keywords, e.g. "herbal clinic Yaoundé", "phytothérapie Garoua". */
export function regionKeywords(): string[] {
  const cities = Array.from(new Set([...CAMEROON_REGIONS.map((r) => r.capital), ...CAMEROON_CITIES]));
  const en: string[] = [];
  const fr: string[] = [];
  for (const city of cities) {
    en.push(`herbal clinic ${city}`, `herbal medicine ${city}`, `natural medicine ${city}`);
    fr.push(`phytothérapie ${city}`, `plantes médicinales ${city}`);
  }
  return [...en, ...fr];
}

/** Everything combined for the global <meta name="keywords"> tag. */
export const SEO_KEYWORDS = Array.from(
  new Set([...SEO_KEYWORDS_EN, ...SEO_KEYWORDS_FR, ...regionKeywords()])
);

/** Clinic geo coordinates (Bafoussam, West Region, Cameroon). */
export const CLINIC_GEO = {
  latitude: 5.4737,
  longitude: 10.4177,
};

/**
 * A single photograph as schema.org `ImageObject`.
 *
 * This is the other half of image SEO alongside the filename and the sitemap.
 * It lets Google attach a name and a description to an image, which is what
 * powers the text shown beside a result in Google Images. The text is taken
 * from the image registry rather than restated here, so the structured data
 * cannot disagree with the alt text.
 */
export function imageObjectJsonLd(entry: ClinicPhoto, locale: Locale = "en") {
  return {
    "@type": "ImageObject",
    "@id": `${canonicalPath(clinicPhotoSrc(entry))}#image`,
    contentUrl: canonicalPath(clinicPhotoSrc(entry)),
    url: canonicalPath(clinicPhotoSrc(entry)),
    width: entry.width,
    height: entry.height,
    encodingFormat: "image/jpeg",
    caption: entry.caption[locale],
    creditText: "S19 Herbal Clinic",
    creator: { "@id": `${SITE_URL}/#clinic` },
    license: `${SITE_URL}/terms`,
    acquireLicensePage: `${SITE_URL}/terms`,
  };
}

/**
 * An `ImageGallery` of the clinic's photographs for a given page, ready to drop
 * into a page's JSON-LD.
 *
 * Only photographs the page actually displays are included: declaring images a
 * visitor cannot see is the fastest way to get a rich result rejected.
 */
export function imageGalleryJsonLd(page: string, locale: Locale = "en") {
  const photos = photosForPage(page);
  if (photos.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    "@id": `${canonicalPath(page === "" ? "/" : page)}#gallery`,
    name: "S19 Herbal Clinic",
    url: canonicalPath(page === "" ? "/" : page),
    associatedMedia: photos.map((p) => imageObjectJsonLd(p, locale)),
  };
}

/** JSON-LD (schema.org) for local SEO: MedicalClinic + WebSite. */
export function clinicJsonLd() {
  const base = SITE_URL;
  const areaServed = Array.from(
    new Set([
      "Bafoussam",
      ...CAMEROON_REGIONS.map((r) => `${r.en} (${r.fr})`),
      ...CAMEROON_REGIONS.map((r) => r.capital),
      ...CAMEROON_CITIES,
      "Cameroon",
      "Africa",
      // Was "Worldwide (international DHL shipping)". This is the clinic's own
      // machine-readable coverage list, read by search engines on every page, so
      // a promise of every country here outranks anything the visible copy says.
      // The delivery guide forbids exactly that, so the entry now names what S19
      // actually ships to and no courier is named.
      "Supported International Destinations",
    ])
  );
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "MedicalClinic",
        "@id": `${base}/#clinic`,
        name: "S19 Herbal Clinic",
        alternateName: ["S19 Clinique de Phytothérapie", "S19 Clinic", "S19 King of Cure"],
        description:
          "Science-based herbal medicine clinic in Bafoussam, Cameroon offering individualized treatment programs for diabetes, hypertension, prostate and men's health, women's health and hormones, with telehealth consultations, delivery across Cameroon and shipping to supported international destinations.",
        url: base,
        logo: `${base}/icon1.png`,
        image: [`${base}/open-graph-thumbnail.png`],
        telephone: "+237672595989",
        email: "info@s19herbalclinic.com",
        priceRange: "FCFA",
        currenciesAccepted: "XAF",
        address: {
          "@type": "PostalAddress",
          streetAddress: "Immeuble Cathédrale, 3rd Floor, Apartment E305",
          addressLocality: "Bafoussam",
          addressRegion: "West Region",
          addressCountry: "CM",
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: CLINIC_GEO.latitude,
          longitude: CLINIC_GEO.longitude,
        },
        hasMap: "https://www.google.com/maps?q=Immeuble+Cath%C3%A9drale,+Bafoussam,+Cameroon",
        openingHoursSpecification: [
          {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            opens: "08:00",
            closes: "18:00",
          },
        ],
        areaServed,
        sameAs: ["https://www.instagram.com/s19_kingofcure", "https://www.facebook.com/share/p/1LhrR7ogQE/"],
        contactPoint: {
          "@type": "ContactPoint",
          telephone: "+237672595989",
          contactType: "customer service",
          availableLanguage: ["English", "French"],
          areaServed: "Worldwide",
        },
      },
      {
        "@type": "WebSite",
        "@id": `${base}/#website`,
        url: base,
        name: "S19 Herbal Clinic",
        inLanguage: ["en", "fr"],
        publisher: { "@id": `${base}/#clinic` },
      },
    ],
  };
}