import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDb } from "@/lib/db";
import { adminGuard } from "@/lib/admin-guard";
import { BlogPost } from "@/lib/models/BlogPost";
import { slugify } from "@/lib/slug";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await adminGuard();
  if (denied) return denied;

  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid post id." }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) ?? {};
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Could not save the post." }, { status: 503 });
  }

  const existing = await BlogPost.findById(id).lean();
  if (!existing) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }

  const patch: Record<string, unknown> = {};

  if (body.title !== undefined) {
    const title = String(body.title).trim();
    if (title.length < 3 || title.length > 160) {
      return NextResponse.json({ error: "Please provide a title." }, { status: 400 });
    }
    patch.title = title;
  }

  if (body.slug !== undefined) {
    const slug = slugify(String(body.slug).trim() || String(existing.title));
    if (slug && slug !== existing.slug) {
      const exists = await BlogPost.exists({ slug, _id: { $ne: id } });
      if (exists) {
        return NextResponse.json({ error: "A post with that slug already exists." }, { status: 409 });
      }
    }
    if (slug) patch.slug = slug;
  }

  for (const key of ["excerpt", "body"] as const) {
    if (body[key] !== undefined) {
      const value = String(body[key]).trim();
      if ((key === "excerpt" && (value.length < 10 || value.length > 400)) || value.length < 20) {
        return NextResponse.json({ error: "Please complete the excerpt and article text." }, { status: 400 });
      }
      patch[key] = value;
    }
  }

  if (body.cover !== undefined) {
    patch.cover = String(body.cover).trim() || null;
  }

  if (body.author !== undefined) {
    const author = String(body.author).trim();
    patch.author = author || "S19 Herbal Clinic";
  }

  if (body.status !== undefined) {
    const status = String(body.status) === "published" ? "published" : "draft";
    patch.status = status;
    if (status === "published" && existing.status !== "published") {
      patch.publishedAt = new Date();
    }
  }

  if (body.featured !== undefined) patch.featured = Boolean(body.featured);

  try {
    const post = await BlogPost.findByIdAndUpdate(id, { $set: patch }, { new: true, runValidators: true }).lean();
    return NextResponse.json({ success: true, post });
  } catch (error) {
    console.error("[admin/posts] update failed:", error);
    return NextResponse.json({ error: "Could not save the post." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await adminGuard();
  if (denied) return denied;

  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid post id." }, { status: 400 });
  }

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Could not delete the post." }, { status: 503 });
  }

  try {
    const deleted = await BlogPost.findByIdAndDelete(id).lean();
    if (!deleted) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[admin/posts] delete failed:", error);
    return NextResponse.json({ error: "Could not delete the post." }, { status: 500 });
  }
}