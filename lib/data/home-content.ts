/**
 * Home-page section content: the lists the developer brief asks to be shown as
 * chips, cards or keyword pills rather than as prose.
 *
 * These live in data rather than in the page component because they are content
 * the clinic will want to edit, and because the FR copy must stay beside the EN
 * copy where a translator can see both.
 *
 * Source: docs/S19_Homepage_Adjustments_Developer_Brief.md, sections 2, 4, 5, 7
 * and 9. All wording there is supplied by the clinic and is reproduced as given.
 */

import type { Locale } from "@/lib/i18n";

/** Section 2 — the components of care, listed rather than run together in a paragraph. */
export const careComponents: { text: string; textFr: string }[] = [
  { text: "Individual health assessment", textFr: "Évaluation individuelle de la santé" },
  { text: "Review of laboratory tests and medical history", textFr: "Revue des analyses de laboratoire et des antécédents médicaux" },
  { text: "Herbal medicine", textFr: "Phytothérapie" },
  { text: "Nutrition support", textFr: "Soutien nutritionnel" },
  { text: "Lifestyle modification", textFr: "Modification du mode de vie" },
  {
    text: "Clinic-based supportive therapies using specialized high-technology devices",
    textFr: "Thérapies de soutien en clinique utilisant des appareils spécialisés de haute technologie",
  },
  { text: "Health education", textFr: "Éducation à la santé" },
  { text: "Monitoring and follow-up", textFr: "Suivi et contrôle" },
  {
    text: "Collaboration with or referral to conventional healthcare when appropriate",
    textFr: "Collaboration avec les soins conventionnels ou orientation vers ceux-ci, le cas échéant",
  },
];

/**
 * Section 4 — the six principal service areas surfaced on the home page.
 *
 * Deliberately only six of the services. The brief names these six; the
 * remaining services (Health Assessment & Review, Nutrition & Lifestyle
 * Support, Electromolecular Medicine & Bioelectromagnetic Therapies, and
 * Meditation & Mindfulness) are reached through the Services page rather than
 * crowding this grid.
 */
export interface HomeProgramCard {
  slug: string;
  /**
   * Set only when the card cannot honestly point at one program. The brief
   * merges digestive and liver into a single card, but the Programs page keeps
   * them as two separate programs, so there is no single "appropriate program
   * page" for it. It goes to the Programs index instead, where both are listed
   * in order. Without this the card would have to pretend to be digestive-only.
   */
  href?: string;
  title: string;
  text: string;
  titleFr: string;
  textFr: string;
}

export const homePrograms: HomeProgramCard[] = [
  {
    slug: "diabetes-metabolic",
    title: "Diabetes & Metabolic Health",
    text: "Individualized support focused on blood-glucose management, metabolic health, nutrition, lifestyle and appropriate monitoring.",
    titleFr: "Diabète et santé métabolique",
    textFr:
      "Soutien individualisé axé sur la gestion de la glycémie, la santé métabolique, la nutrition, le mode de vie et un suivi approprié.",
  },
  {
    slug: "hypertension-cardiovascular",
    title: "Hypertension & Cardiovascular Wellness",
    text: "Support addressing blood pressure alongside nutrition, weight, activity, sleep, stress and other cardiovascular risk factors.",
    titleFr: "Hypertension et bien-être cardiovasculaire",
    textFr:
      "Soutien abordant la tension artérielle ainsi que la nutrition, le poids, l'activité, le sommeil, le stress et d'autres facteurs de risque cardiovasculaires.",
  },
  {
    slug: "integrative-cancer-support",
    title: "Cancer Support",
    text: "Integrative supportive care designed to complement appropriate oncology care, with attention to nutrition, general wellbeing, treatment tolerance and quality of life.",
    titleFr: "Soutien en cancérologie",
    textFr:
      "Soins de soutien intégratifs conçus pour compléter des soins d'oncologie appropriés, en portant attention à la nutrition, au bien-être général, à la tolérance du traitement et à la qualité de vie.",
  },
  {
    slug: "womens-health-hormones",
    title: "Women's Health",
    text: "Personalized support for reproductive, menstrual, hormonal and metabolic health concerns.",
    titleFr: "Santé féminine",
    textFr:
      "Soutien personnalisé pour les préoccupations reproductives, menstruelles, hormonales et métaboliques.",
  },
  {
    slug: "prostate-mens-health",
    title: "Prostate & Men's Health",
    text: "Assessment and supportive care for prostate, urinary, reproductive and general men's health.",
    titleFr: "Prostate et santé masculine",
    textFr:
      "Évaluation et soins de soutien pour la prostate, l'appareil urinaire, la santé reproductive et la santé masculine en général.",
  },
  {
    // The brief names "Digestive & Liver Health" as ONE home card, and this
    // page follows the brief rather than splitting it into two. The Programs
    // page keeps digestive and liver as two separate programs, so the card
    // links to the Programs index: an anchor to one of them would misdescribe
    // what the card covers.
    slug: "digestive-gut-health",
    href: "/programs",
    title: "Digestive & Liver Health",
    text: "Individualized support for digestive health, nutrition, liver wellness and related metabolic factors.",
    titleFr: "Santé digestive et hépatique",
    textFr:
      "Soutien individualisé pour la santé digestive, la nutrition, le bien-être hépatique et les facteurs métaboliques associés.",
  },
];

/**
 * Section 5 — the safety considerations the clinic names, shown as keywords.
 * Listed rather than explained: the brief's own framing is that responsible
 * herbal care requires more than matching a plant to a symptom, and a wall of
 * nine sentences would read as a lecture.
 */
export const herbalSafetyKeywords: { text: string; textFr: string }[] = [
  { text: "Pharmacology", textFr: "Pharmacologie" },
  { text: "Phytochemistry", textFr: "Phytochimie" },
  { text: "Dosage", textFr: "Dosage" },
  { text: "Contraindications", textFr: "Contre-indications" },
  { text: "Toxicity", textFr: "Toxicité" },
  { text: "Herb-drug interactions", textFr: "Interactions plantes-médicaments" },
  { text: "Existing medications", textFr: "Traitements en cours" },
  { text: "Laboratory findings", textFr: "Résultats de laboratoire" },
  { text: "Individual health status", textFr: "État de santé individuel" },
];

/** Section 7 — the nine elements a personalized plan is built from. */
export const personalizedCareElements: { text: string; textFr: string }[] = [
  { text: "Medical History Review", textFr: "Revue de l'historique médical" },
  { text: "Laboratory Assessment", textFr: "Évaluation de laboratoire" },
  { text: "Herbal Support", textFr: "Soutien herbal" },
  { text: "Clinic-Based Therapies", textFr: "Thérapies en clinique" },
  { text: "Nutrition", textFr: "Nutrition" },
  { text: "Lifestyle Medicine", textFr: "Médecine du mode de vie" },
  { text: "Health Education", textFr: "Éducation à la santé" },
  { text: "Progress Monitoring", textFr: "Suivi de la progression" },
  { text: "Follow-Up", textFr: "Suivi rapproché" },
];

/** Section 9 — the accommodation amenities, in the order the brief lists them. */
export const accommodationAmenities: { text: string; textFr: string }[] = [
  { text: "Convenient clinic access", textFr: "Accès pratique à la clinique" },
  { text: "Starlink internet", textFr: "Internet Starlink" },
  { text: "Cable television", textFr: "Télévision par câble" },
  {
    text: "Comfortable environment for patients travelling for care",
    textFr: "Environnement confortable pour les patients qui se déplacent pour se faire soigner",
  },
];

export function localizedHomePrograms(locale: Locale) {
  return homePrograms.map((p) => ({
    slug: p.slug,
    href: p.href ?? `/programs#${p.slug}`,
    title: locale === "fr" ? p.titleFr : p.title,
    text: locale === "fr" ? p.textFr : p.text,
  }));
}

function pick(locale: Locale, items: { text: string; textFr: string }[]) {
  return items.map((i) => (locale === "fr" ? i.textFr : i.text));
}

export function localizedCareComponents(locale: Locale) {
  return pick(locale, careComponents);
}

export function localizedHerbalSafetyKeywords(locale: Locale) {
  return pick(locale, herbalSafetyKeywords);
}

export function localizedPersonalizedCareElements(locale: Locale) {
  return pick(locale, personalizedCareElements);
}

export function localizedAccommodationAmenities(locale: Locale) {
  return pick(locale, accommodationAmenities);
}