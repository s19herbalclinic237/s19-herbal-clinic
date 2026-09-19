import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { adminGuard } from "@/lib/admin-guard";
import { Product } from "@/lib/models/Product";
import { slugify } from "@/lib/slug";

export async function GET() {
  const denied = await adminGuard();
  if (denied) return denied;

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Products are temporarily unavailable." }, { status: 503 });
  }

  try {
    const products = await Product.find()
      .sort({ featured: -1, createdAt: 1 })
      .limit(500)
      .lean();
    return NextResponse.json({ products });
  } catch (error) {
    console.error("[admin/products] list failed:", error);
    return NextResponse.json({ error: "Could not load products." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await adminGuard();
  if (denied) return denied;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const p = (body ?? {}) as Record<string, unknown>;

  const name = String(p.name || "").trim();
  const nameFr = String(p.nameFr || "").trim();
  const category = String(p.category || "").trim();
  const categoryFr = String(p.categoryFr || "").trim();
  const categorySlug = String(p.categorySlug || slugify(category)).trim();
  const price = Number(p.price);
  const shortDescription = String(p.shortDescription || "").trim();
  const shortDescriptionFr = String(p.shortDescriptionFr || "").trim();
  const description = String(p.description || "").trim();
  const descriptionFr = String(p.descriptionFr || "").trim();
  const image = String(p.image || "").trim();

  if (name.length < 2 || name.length > 120) {
    return NextResponse.json({ error: "Please provide the product name." }, { status: 400 });
  }
  if (nameFr.length < 2 || nameFr.length > 120) {
    return NextResponse.json({ error: "Please provide the French product name." }, { status: 400 });
  }
  if (category.length < 2) {
    return NextResponse.json({ error: "Please provide the category." }, { status: 400 });
  }
  if (categoryFr.length < 2) {
    return NextResponse.json({ error: "Please provide the French category." }, { status: 400 });
  }
  if (!Number.isFinite(price) || price < 0) {
    return NextResponse.json({ error: "Please provide a valid price (0 for contact-for-pricing)." }, { status: 400 });
  }
  if (shortDescription.length < 10) {
    return NextResponse.json({ error: "Please provide a short description." }, { status: 400 });
  }
  if (shortDescriptionFr.length < 10) {
    return NextResponse.json({ error: "Please provide the French short description." }, { status: 400 });
  }
  if (description.length < 10) {
    return NextResponse.json({ error: "Please provide a description." }, { status: 400 });
  }
  if (descriptionFr.length < 10) {
    return NextResponse.json({ error: "Please provide the French description." }, { status: 400 });
  }
  if (!image) {
    return NextResponse.json({ error: "Please provide an image (URL or upload)." }, { status: 400 });
  }

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Could not save the product." }, { status: 503 });
  }

  const slug = slugify(String(p.slug || "").trim() || name);
  try {
    const exists = await Product.exists({ slug });
    if (exists) {
      return NextResponse.json({ error: "A product with that slug already exists." }, { status: 409 });
    }
    const product = await Product.create({
      name,
      slug,
      category,
      categorySlug,
      price,
      unit: typeof p.unit === "string" && p.unit.trim() ? p.unit.trim() : undefined,
      shortDescription,
      description,
      usage: typeof p.usage === "string" ? p.usage.trim() || undefined : undefined,
      ingredients: typeof p.ingredients === "string" ? p.ingredients.trim() || undefined : undefined,
      badge: typeof p.badge === "string" ? p.badge.trim() || undefined : undefined,
      image,
      featured: Boolean(p.featured),
      stock: Number.isFinite(Number(p.stock)) ? Math.max(0, Math.floor(Number(p.stock))) : 0,
      active: p.active === undefined ? true : Boolean(p.active),
      nameFr,
      categoryFr,
      unitFr: typeof p.unitFr === "string" ? p.unitFr.trim() || undefined : undefined,
      shortDescriptionFr,
      descriptionFr,
      usageFr: typeof p.usageFr === "string" ? p.usageFr.trim() || undefined : undefined,
      ingredientsFr: typeof p.ingredientsFr === "string" ? p.ingredientsFr.trim() || undefined : undefined,
      badgeFr: typeof p.badgeFr === "string" ? p.badgeFr.trim() || undefined : undefined,
    });
    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (error) {
    console.error("[admin/products] create failed:", error);
    return NextResponse.json({ error: "Could not save the product." }, { status: 500 });
  }
}