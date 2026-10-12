import "server-only";

import { connectDb } from "@/lib/db";
import { Product, type IProduct } from "@/lib/models/Product";
import { Category, type ICategory } from "@/lib/models/Category";
import { isPubliclyAvailable, type SiteProduct, type SiteCategory } from "@/lib/site";
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

/** A static product only when it is publicly listable (in stock). */
function publiclyAvailableStatic(slug: string): SiteProduct | undefined {
  const product = getStaticProductBySlug(slug);
  return product && isPubliclyAvailable(product) ? product : undefined;
}

export async function getProducts(): Promise<SiteProduct[]> {
  if (dbUnavailable) return getStaticProducts().filter(isPubliclyAvailable);
  const conn = await connectDb();
  if (!conn) {
    dbUnavailable = true;
    return getStaticProducts().filter(isPubliclyAvailable);
  }
  try {
    const docs = await Product.find({ active: true })
      .sort({ featured: -1, createdAt: 1 })
      .lean<IProduct[]>();
    if (!docs.length) return getStaticProducts().filter(isPubliclyAvailable);
    return docs.map(toSiteProduct).filter(isPubliclyAvailable);
  } catch {
    dbUnavailable = true;
    return getStaticProducts().filter(isPubliclyAvailable);
  }
}

export async function getFeaturedProducts(): Promise<SiteProduct[]> {
  if (dbUnavailable) return getStaticFeaturedProducts().filter(isPubliclyAvailable);
  const conn = await connectDb();
  if (!conn) {
    dbUnavailable = true;
    return getStaticFeaturedProducts().filter(isPubliclyAvailable);
  }
  try {
    const docs = await Product.find({ active: true, featured: true })
      .sort({ createdAt: 1 })
      .limit(8)
      .lean<IProduct[]>();
    if (!docs.length) return getStaticFeaturedProducts().filter(isPubliclyAvailable);
    return docs.map(toSiteProduct).filter(isPubliclyAvailable);
  } catch {
    dbUnavailable = true;
    return getStaticFeaturedProducts().filter(isPubliclyAvailable);
  }
}

export async function getProductBySlug(slug: string): Promise<SiteProduct | undefined> {
  if (dbUnavailable) return publiclyAvailableStatic(slug);
  const conn = await connectDb();
  if (!conn) {
    dbUnavailable = true;
    return publiclyAvailableStatic(slug);
  }
  try {
    const doc = await Product.findOne({ slug, active: true }).lean<IProduct>();
    if (!doc) return publiclyAvailableStatic(slug);
    const product = toSiteProduct(doc);
    // An out-of-stock product is hidden from the shop, so its detail page 404s
    // rather than staying reachable and sellable by direct link.
    return isPubliclyAvailable(product) ? product : undefined;
  } catch {
    dbUnavailable = true;
    return publiclyAvailableStatic(slug);
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