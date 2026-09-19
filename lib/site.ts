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
  titleFr?: string;
  shortFr?: string;
  detailFr?: string;
  conditionsFr?: string[];
}

export const CLINIC = {
  brand: "S19 Herbal Clinic",
  slogan: "Natural Healing, Lasting Wellness",
  tagline: "Science-Based Herbalism & Root-Cause Healthcare",
  mission:
    "To provide safe, natural and effective herbal solutions that support long-term health and wellbeing through science-based herbalism, individualized assessment, nutrition, lifestyle medicine, and continuous monitoring.",
  phone: "+237 672 595 989",
  phoneHref: "+237672595989",
  whatsappNumber: "237672595989",
  email: "s19herbs@gmail.com",
  address: "Immeuble Cathédrale, 3rd Floor, Apartment E305, Bafoussam, Cameroon",
  hours: "Monday - Saturday: 8:00 AM - 6:00 PM",
  currency: "FCFA",
  instagram: "https://www.instagram.com/s19_kingofcure",
  facebook: "https://www.facebook.com/share/p/1LhrR7ogQE/",
};

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