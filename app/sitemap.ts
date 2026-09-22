import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { getProducts } from "@/lib/catalog";
import { connectDb } from "@/lib/db";
import { BlogPost } from "@/lib/models/BlogPost";
import { blogPosts as staticBlogPosts } from "@/lib/data/blog-posts";

export const revalidate = 3600;

/**
 * Canonical public pages. The site is bilingual (EN/FR) with a cookie-driven
 * locale served from the same URL, so both languages are declared via
 * alternates on each <loc>.
 */
const STATIC_ROUTES: {
  path: string;
  priority: number;
  changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
}[] = [
  { path: "", priority: 1.0, changeFrequency: "weekly" },
  { path: "/programs", priority: 0.9, changeFrequency: "monthly" },
  { path: "/shop", priority: 0.9, changeFrequency: "weekly" },
  { path: "/telehealth", priority: 0.8, changeFrequency: "monthly" },
  { path: "/location", priority: 0.8, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.8, changeFrequency: "monthly" },
  { path: "/blog", priority: 0.8, changeFrequency: "weekly" },
  { path: "/patient-stories", priority: 0.7, changeFrequency: "monthly" },
  { path: "/live-reviews", priority: 0.6, changeFrequency: "monthly" },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.2, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.2, changeFrequency: "yearly" },
  { path: "/refund-and-returns", priority: 0.2, changeFrequency: "yearly" },
];

interface BlogSlugDoc {
  slug: string;
  publishedAt?: string;
}

/** Published blog slugs with lastmod (DB first, static seed list as fallback). */
async function blogSlugs(): Promise<BlogSlugDoc[]> {
  const conn = await connectDb();
  if (conn) {
    try {
      const docs = await BlogPost.find({ status: "published" })
        .select("slug publishedAt")
        .lean<BlogSlugDoc[]>();
      if (docs.length) return docs;
    } catch {
      // fall through to static list
    }
  }
  return staticBlogPosts.map((p) => ({ slug: p.slug, publishedAt: p.publishedAt }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = (path: string) => `${SITE_URL}${path}`;
  const localized = (loc: string) => ({
    alternates: {
      languages: {
        en: url(loc),
        fr: url(loc),
        "x-default": url(loc),
      },
    },
  });

  const staticEntries = STATIC_ROUTES.map((r) => ({
    url: url(r.path),
    changeFrequency: r.changeFrequency,
    priority: r.priority,
    ...localized(r.path),
  }));

  const [blog, products] = await Promise.all([blogSlugs(), getProducts()]);

  const blogEntries: MetadataRoute.Sitemap = blog.map((p) => ({
    url: url(`/blog/${p.slug}`),
    lastModified: p.publishedAt ? new Date(p.publishedAt) : undefined,
    changeFrequency: "monthly",
    priority: 0.6,
    ...localized(`/blog/${p.slug}`),
  }));

  const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
    url: url(`/shop/${p.slug}`),
    changeFrequency: "weekly",
    priority: 0.7,
    ...localized(`/shop/${p.slug}`),
  }));

  return [...staticEntries, ...blogEntries, ...productEntries];
}