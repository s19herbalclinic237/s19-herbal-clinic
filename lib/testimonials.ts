import "server-only";

import { connectDb } from "@/lib/db";
import { Testimonial, type ITestimonial } from "@/lib/models/Testimonial";
import { testimonials as staticTestimonials } from "@/lib/data/testimonials";
import type { Locale } from "@/lib/i18n";

export interface SiteTestimonial {
  name: string;
  city: string;
  country?: string;
  program: string;
  text: string;
  rating?: number;
  videoUrl?: string;
}

/** Fields a testimonial source may carry a French translation for. */
interface LocalizedFields {
  program: string;
  text: string;
  programFr?: string;
  textFr?: string;
}

/** Minimal shape shared by DB docs and the static list, plus the French fields. */
interface TestimonialSource extends LocalizedFields {
  name: string;
  city: string;
  country?: string;
  rating?: number;
  videoUrl?: string;
}

/** Pick the locale-appropriate program/text, falling back to the English value. */
function pickLocalized(fields: LocalizedFields, locale: Locale) {
  if (locale !== "fr") {
    return { program: fields.program, text: fields.text };
  }
  return {
    program: fields.programFr || fields.program,
    text: fields.textFr || fields.text,
  };
}

let dbUnavailable = false;

function toSiteTestimonial(t: TestimonialSource, locale: Locale): SiteTestimonial {
  const localized = pickLocalized(t, locale);
  return {
    name: t.name,
    city: t.city,
    country: t.country,
    program: localized.program,
    text: localized.text,
    rating: t.rating,
    videoUrl: t.videoUrl,
  };
}

export async function getApprovedTestimonials(limit = 6, locale: Locale = "en"): Promise<SiteTestimonial[]> {
  const staticFallback = () => staticTestimonials.slice(0, limit).map((s) => toSiteTestimonial(s, locale));
  if (dbUnavailable) return staticFallback();
  const conn = await connectDb();
  if (!conn) {
    dbUnavailable = true;
    return staticFallback();
  }
  try {
    const docs = await Testimonial.find({ status: "approved" })
      .sort({ createdAt: 1 })
      .limit(limit)
      .lean<ITestimonial[]>();
    if (!docs.length) return staticFallback();
    return docs.map((t) => toSiteTestimonial(t, locale));
  } catch {
    dbUnavailable = true;
    return staticFallback();
  }
}