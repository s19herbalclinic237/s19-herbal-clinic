import type { Locale } from "@/lib/i18n";

export interface SiteProduct {
  id: string;
  name: string;
  slug: string;
  category: string;
  categorySlug: string;
  price: number;
  unit?: string;
  shortDescription: string;
  description: string;
  usage?: string;
  ingredients?: string;
  badge?: string;
  image: string;
  featured: boolean;
  stock: number;
  /** French versions. Fall back to the English fields when absent. */
  nameFr?: string;
  categoryFr?: string;
  unitFr?: string;
  shortDescriptionFr?: string;
  descriptionFr?: string;
  usageFr?: string;
  ingredientsFr?: string;
  badgeFr?: string;
}

export interface SiteCategory {
  id: string;
  name: string;
  slug: string;
  blurb?: string;
  nameFr?: string;
}

export interface TreatmentProgram {
  slug: string;
  title: string;
  short: string;
  detail: string;
  conditions: string[];
  /**
   * Boundary-of-care note shown on the program card. Used where stopping or
   * replacing conventional treatment would be dangerous - insulin-dependent
   * diabetes, antihypertensive medication, oncology. Optional because most
   * programs have nothing specific to warn about.
   */
  note?: string;
  /**
   * Which label the card puts in front of `note`. "Important" is the default;
   * "safety" is reserved for the case where the risk is the patient's own
   * medication, where a weaker word would be a weaker warning.
   */
  noteKind?: "important" | "safety";
  titleFr?: string;
  shortFr?: string;
  detailFr?: string;
  conditionsFr?: string[];
  noteFr?: string;
}

export const CLINIC = {
  brand: "S19 Herbal Clinic",
  slogan: "Natural Healing, Lasting Wellness",
  sloganFr: "Guérison naturelle, Bien-être durable",
  tagline: "Science-Based Herbalism & Root-Cause Healthcare",
  // Site-wide footer mission. Replaced under the footer/navigation guide, item 05:
  // the old sentence opened "To provide safe, natural and effective herbal
  // solutions", which the guide forbids because it asserts every S19 product and
  // intervention is safe and effective. Also feeds the root meta description in
  // app/layout.tsx, which is intentional - the old claim was published there too.
  mission:
    "To provide evidence-informed herbal and integrative wellness support through individualized assessment, nutrition, lifestyle guidance, health education and continuous monitoring.",
  missionFr:
    "Fournir un soutien herbal et intégratif de bien-être fondé sur les données probantes, au moyen d'une évaluation individualisée, de la nutrition, de conseils de mode de vie, de l'éducation à la santé et d'un suivi continu.",
  phone: "+237 672 595 989",
  phoneHref: "+237672595989",
  whatsappNumber: "237672595989",
  email: "info@s19herbalclinic.com",
  address: "Immeuble Cathédrale, 3rd Floor, Apartment E305, Bafoussam, Cameroon",
  addressFr: "Immeuble Cathédrale, 3ᵉ étage, Appartement E305, Bafoussam, Cameroun",
  hours: "Monday - Saturday: 8:00 AM - 6:00 PM",
  hoursFr: "Lundi – samedi : 8h00 – 18h00",
  currency: "FCFA",
  instagram: "https://www.instagram.com/s19_kingofcure",
  facebook: "https://www.facebook.com/share/p/1LhrR7ogQE/",
};

/**
 * Returns the clinic contact details resolved for the given locale.
 * French variants (slogan, mission, address, hours) fall back to English when absent.
 */
export function localizedClinic(locale: Locale) {
  if (locale !== "fr") return CLINIC;
  return {
    ...CLINIC,
    slogan: CLINIC.sloganFr,
    mission: CLINIC.missionFr,
    address: CLINIC.addressFr,
    hours: CLINIC.hoursFr,
  };
}

export function waLink(message: string): string {
  return `https://wa.me/${CLINIC.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export const orderWhatsAppMessage = (reference: string, total: string) =>
  waLink(
    `Hello S19 Herbal Clinic, I just placed order ${reference} (${total}). I would like to confirm payment and delivery.`
  );

export type LocalizedProduct = Pick<
  SiteProduct,
  | "name"
  | "category"
  | "unit"
  | "shortDescription"
  | "description"
  | "usage"
  | "ingredients"
  | "badge"
>;

/**
 * Returns a product whose display fields are resolved for the given locale.
 * Fields without a French version fall back to their English value.
 */
export function localizedProduct(p: SiteProduct, locale: Locale): SiteProduct {
  if (locale !== "fr") return p;
  return {
    ...p,
    name: p.nameFr || p.name,
    category: p.categoryFr || p.category,
    unit: p.unitFr || p.unit,
    shortDescription: p.shortDescriptionFr || p.shortDescription,
    description: p.descriptionFr || p.description,
    usage: p.usageFr || p.usage,
    ingredients: p.ingredientsFr || p.ingredients,
    badge: p.badgeFr || p.badge,
  };
}

export interface SiteBlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  cover?: string;
  author: string;
  featured: boolean;
  publishedAt?: string;
  /** French versions. Fall back to the English fields when absent. */
  titleFr?: string;
  excerptFr?: string;
  bodyFr?: string;
  authorFr?: string;
}

export type LocalizedBlogPost = Pick<
  SiteBlogPost,
  "title" | "excerpt" | "body" | "author"
>;

/**
 * Returns a blog post whose display fields are resolved for the given locale.
 * Fields without a French version fall back to their English value.
 */
export function localizedBlogPost(p: SiteBlogPost, locale: Locale): SiteBlogPost {
  if (locale !== "fr") return p;
  return {
    ...p,
    title: p.titleFr || p.title,
    excerpt: p.excerptFr || p.excerpt,
    body: p.bodyFr || p.body,
    author: p.authorFr || p.author,
  };
}