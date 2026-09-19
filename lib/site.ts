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
}

export interface SiteCategory {
  id: string;
  name: string;
  slug: string;
  blurb?: string;
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