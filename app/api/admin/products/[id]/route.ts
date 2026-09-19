import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDb } from "@/lib/db";
import { adminGuard } from "@/lib/admin-guard";
import { Product } from "@/lib/models/Product";
import { slugify } from "@/lib/slug";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await adminGuard();
  if (denied) return denied;

  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid product id." }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) ?? {};
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Could not save the product." }, { status: 503 });
  }

  const existing = await Product.findById(id).lean();
  if (!existing) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  const patch: Record<string, unknown> = {};

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (name.length < 2 || name.length > 120) {
      return NextResponse.json({ error: "Please provide the product name." }, { status: 400 });
    }
    patch.name = name;
  }

  if (body.nameFr !== undefined) {
    const nameFr = String(body.nameFr).trim();
    if (nameFr.length < 2 || nameFr.length > 120) {
      return NextResponse.json({ error: "Please provide the French product name." }, { status: 400 });
    }
    patch.nameFr = nameFr;
  }

  if (body.slug !== undefined) {
    const slug = slugify(String(body.slug).trim() || String(existing.name));
    if (slug !== existing.slug) {
      const exists = await Product.exists({ slug, _id: { $ne: id } });
      if (exists) {
        return NextResponse.json({ error: "A product with that slug already exists." }, { status: 409 });
      }
    }
    if (slug) patch.slug = slug;
  }

  if (body.category !== undefined) {
    const category = String(body.category).trim();
    if (category.length < 2) {
      return NextResponse.json({ error: "Please provide the category." }, { status: 400 });
    }
    patch.category = category;
  }

  if (body.categoryFr !== undefined) {
    const categoryFr = String(body.categoryFr).trim();
    if (categoryFr.length < 2) {
      return NextResponse.json({ error: "Please provide the French category." }, { status: 400 });
    }
    patch.categoryFr = categoryFr;
  }

  if (body.categorySlug !== undefined) {
    patch.categorySlug = String(body.categorySlug).trim() || slugify(String(body.category || existing.category));
  }

  if (body.price !== undefined) {
    const price = Number(body.price);
    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json({ error: "Please provide a valid price." }, { status: 400 });
    }
    patch.price = price;
  }

  for (const key of ["shortDescription", "description"] as const) {
    if (body[key] !== undefined) {
      const value = String(body[key]).trim();
      if (value.length < 10) {
        return NextResponse.json({ error: "Please provide a complete description." }, { status: 400 });
      }
      patch[key] = value;
    }
  }

  for (const key of ["shortDescriptionFr", "descriptionFr"] as const) {
    if (body[key] !== undefined) {
      const value = String(body[key]).trim();
      if (value.length < 10) {
        return NextResponse.json({ error: "Please provide the complete French description." }, { status: 400 });
      }
      patch[key] = value;
    }
  }

  for (const key of ["unit", "usage", "ingredients", "badge", "image"] as const) {
    if (body[key] !== undefined) {
      const value = String(body[key]).trim();
      patch[key] = value || undefined;
    }
  }

  for (const key of ["unitFr", "usageFr", "ingredientsFr", "badgeFr"] as const) {
    if (body[key] !== undefined) {
      const value = String(body[key]).trim();
      patch[key] = value || undefined;
    }
  }

  if (body.image !== undefined && !String(body.image).trim()) {
    return NextResponse.json({ error: "Please provide an image." }, { status: 400 });
  }

  if (body.featured !== undefined) patch.featured = Boolean(body.featured);
  if (body.active !== undefined) patch.active = Boolean(body.active);
  if (body.stock !== undefined) {
    patch.stock = Number.isFinite(Number(body.stock)) ? Math.max(0, Math.floor(Number(body.stock))) : existing.stock;
  }

  try {
    const product = await Product.findByIdAndUpdate(id, { $set: patch }, { new: true, runValidators: true }).lean();
    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error("[admin/products] update failed:", error);
    return NextResponse.json({ error: "Could not save the product." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await adminGuard();
  if (denied) return denied;

  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid product id." }, { status: 400 });
  }

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Could not delete the product." }, { status: 503 });
  }

  try {
    const deleted = await Product.findByIdAndDelete(id).lean();
    if (!deleted) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[admin/products] delete failed:", error);
    return NextResponse.json({ error: "Could not delete the product." }, { status: 500 });
  }
}