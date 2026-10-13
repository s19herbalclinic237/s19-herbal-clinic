import "server-only";

import { connectDb } from "@/lib/db";
import { Product, type IProduct } from "@/lib/models/Product";
import { Category, type ICategory } from "@/lib/models/Category";
import type { SiteProduct, SiteCategory } from "@/lib/site";
import {
  getStaticCategories,
  getStaticFeaturedProducts,
  getStaticProductBySlug,
  getStaticProducts,
} from "@/lib/data/products";

let dbUnavailable = false;

function toSiteProduct(p: IProduct): SiteProduct {
  return {
    id: String(p._id),
    name: p.name,
    slug: p.slug,
    category: p.category,
    categorySlug: p.categorySlug,
    price: p.price,
    unit: p.unit,
    shortDescription: p.shortDescription,
    description: p.description,
    usage: p.usage,
    ingredients: p.ingredients,
    badge: p.badge,
    image: p.image,
    featured: p.featured,
    stock: p.stock,
    nameFr: p.nameFr,
    categoryFr: p.categoryFr,
    unitFr: p.unitFr,
    shortDescriptionFr: p.shortDescriptionFr,
    descriptionFr: p.descriptionFr,
    usageFr: p.usageFr,
    ingredientsFr: p.ingredientsFr,
    badgeFr: p.badgeFr,
  };
}

function toSiteCategory(c: ICategory): SiteCategory {
  return {
    id: String(c._id),
    name: c.name,
    slug: c.slug,
    blurb: c.blurb,
    nameFr: c.nameFr,
  };
}

/**
 * Public product readers.
 *
 * Everything active is listed, including products that are out of stock: the
 * shop shows them with a greyed "out of stock" state rather than hiding them.
 * Buyability is a separate concern (`isPurchasable` in lib/site.ts), enforced
 * by the buy buttons and again by the order API.
 */
export async function getProducts(): Promise<SiteProduct[]> {
  if (dbUnavailable) return getStaticProducts();
  const conn = await connectDb();
  if (!conn) {
    dbUnavailable = true;
    return getStaticProducts();
  }
  try {
    const docs = await Product.find({ active: true })
      .sort({ featured: -1, createdAt: 1 })
      .lean<IProduct[]>();
    if (!docs.length) return getStaticProducts();
    return docs.map(toSiteProduct);
  } catch {
    dbUnavailable = true;
    return getStaticProducts();
  }
}

export async function getFeaturedProducts(): Promise<SiteProduct[]> {
  if (dbUnavailable) return getStaticFeaturedProducts();
  const conn = await connectDb();
  if (!conn) {
    dbUnavailable = true;
    return getStaticFeaturedProducts();
  }
  try {
    const docs = await Product.find({ active: true, featured: true })
      .sort({ createdAt: 1 })
      .limit(8)
      .lean<IProduct[]>();
    if (!docs.length) return getStaticFeaturedProducts();
    return docs.map(toSiteProduct);
  } catch {
    dbUnavailable = true;
    return getStaticFeaturedProducts();
  }
}

export async function getProductBySlug(slug: string): Promise<SiteProduct | undefined> {
  if (dbUnavailable) return getStaticProductBySlug(slug);
  const conn = await connectDb();
  if (!conn) {
    dbUnavailable = true;
    return getStaticProductBySlug(slug);
  }
  try {
    const doc = await Product.findOne({ slug, active: true }).lean<IProduct>();
    if (!doc) return getStaticProductBySlug(slug);
    return toSiteProduct(doc);
  } catch {
    dbUnavailable = true;
    return getStaticProductBySlug(slug);
  }
}

export async function getCategories(): Promise<SiteCategory[]> {
  if (dbUnavailable) return getStaticCategories();
  const conn = await connectDb();
  if (!conn) {
    dbUnavailable = true;
    return getStaticCategories();
  }
  try {
    const docs = await Category.find().sort({ createdAt: 1 }).lean<ICategory[]>();
    if (!docs.length) return getStaticCategories();
    return docs.map(toSiteCategory);
  } catch {
    dbUnavailable = true;
    return getStaticCategories();
  }
}