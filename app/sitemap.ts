import type { MetadataRoute } from "next";
import { SITE_URL, canonicalPath } from "@/lib/seo";
import { getProducts } from "@/lib/catalog";
import { connectDb } from "@/lib/db";
import { BlogPost } from "@/lib/models/BlogPost";
import { blogPosts as staticBlogPosts } from "@/lib/data/blog-posts";
import { photoPathsForPage } from "@/lib/image-registry";

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
  // Answers real search queries ("does S19 cure cancer", "S19 Cameroon delivery"),
  // so this is a landing page rather than a policy page.
  { path: "/faq", priority: 0.8, changeFrequency: "monthly" },
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
  cover?: string;
}

/**
 * Turn a set of public image paths into absolute URLs for the sitemap's
 * `images` field, or `undefined` when there is nothing to declare.
 *
 * `images` in a sitemap is the image sitemap, which is how Google Images finds
 * photographs that are not linked from anywhere crawlable. An empty array would
 * be noise, so the field is only set when there is something to say.
 */
function absoluteImages(srcs: readonly (string | undefined)[]): string[] | undefined {
  const absolute = srcs
    .filter((src): src is string => typeof src === "string" && src.startsWith("/"))
    .map((src) => canonicalPath(src));
  return absolute.length > 0 ? Array.from(new Set(absolute)) : undefined;
}

/**
 * A page's editorial photographs, plus any images the page's own content owns —
 * a blog post's cover, a product's photograph. Those live in the database or in
 * content data rather than in the image registry, so they are passed in.
 */
function imagesForPage(page: string, extra: readonly (string | undefined)[] = []): string[] | undefined {
  return absoluteImages([...photoPathsForPage(page), ...extra]);
}

/** Published blog slugs with lastmod (DB first, static seed list as fallback). */
async function blogSlugs(): Promise<BlogSlugDoc[]> {
  const conn = await connectDb();
  if (conn) {
    try {
      const docs = await BlogPost.find({ status: "published" })
        .select("slug publishedAt cover")
        .lean<BlogSlugDoc[]>();
      if (docs.length) return docs;
    } catch {
      // fall through to static list
    }
  }
  return staticBlogPosts.map((p) => ({ slug: p.slug, publishedAt: p.publishedAt, cover: p.cover }));
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

  const staticEntries = STATIC_ROUTES.map((r) => {
    // A page's own editorial photographs. `r.path` is "" for the home page,
    // which the registry normalises to "/".
    const images = imagesForPage(r.path);
    return {
      url: url(r.path),
      changeFrequency: r.changeFrequency,
      priority: r.priority,
      ...(images ? { images } : {}),
      ...localized(r.path),
    };
  });

  const [blog, products] = await Promise.all([blogSlugs(), getProducts()]);

  const blogEntries: MetadataRoute.Sitemap = blog.map((p) => {
    // The cover image is a real photograph of the clinic, so it belongs in the
    // image sitemap for the post — otherwise a blog illustration stays invisible
    // to Google Images.
    const images = absoluteImages([p.cover]);
    return {
      url: url(`/blog/${p.slug}`),
      lastModified: p.publishedAt ? new Date(p.publishedAt) : undefined,
      changeFrequency: "monthly" as const,
      priority: 0.6,
      ...(images ? { images } : {}),
      ...localized(`/blog/${p.slug}`),
    };
  });

  const productEntries: MetadataRoute.Sitemap = products.map((p) => {
    // Product photography is the shop's largest image-search surface.
    const images = absoluteImages([p.image]);
    return {
      url: url(`/shop/${p.slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.7,
      ...(images ? { images } : {}),
      ...localized(`/shop/${p.slug}`),
    };
  });

  return [...staticEntries, ...blogEntries, ...productEntries];
}