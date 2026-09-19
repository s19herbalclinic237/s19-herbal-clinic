import "server-only";

import { connectDb } from "@/lib/db";
import { Testimonial, type ITestimonial } from "@/lib/models/Testimonial";
import { testimonials as staticTestimonials } from "@/lib/data/testimonials";

export interface SiteTestimonial {
  name: string;
  city: string;
  country?: string;
  program: string;
  text: string;
  rating?: number;
}

let dbUnavailable = false;

function toSiteTestimonial(t: ITestimonial): SiteTestimonial {
  return {
    name: t.name,
    city: t.city,
    country: t.country,
    program: t.program,
    text: t.text,
    rating: t.rating,
  };
}

export async function getApprovedTestimonials(limit = 6): Promise<SiteTestimonial[]> {
  if (dbUnavailable) return staticTestimonials.slice(0, limit);
  const conn = await connectDb();
  if (!conn) {
    dbUnavailable = true;
    return staticTestimonials.slice(0, limit);
  }
  try {
    const docs = await Testimonial.find({ status: "approved" })
      .sort({ createdAt: 1 })
      .limit(limit)
      .lean<ITestimonial[]>();
    if (!docs.length) return staticTestimonials.slice(0, limit);
    return docs.map(toSiteTestimonial);
  } catch {
    dbUnavailable = true;
    return staticTestimonials.slice(0, limit);
  }
}