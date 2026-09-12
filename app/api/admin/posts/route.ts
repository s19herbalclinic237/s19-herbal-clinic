import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { adminGuard } from "@/lib/admin-guard";
import { BlogPost, type BlogStatus } from "@/lib/models/BlogPost";
import { slugify } from "@/lib/slug";

export async function GET() {
  const denied = await adminGuard();
  if (denied) return denied;

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Posts are temporarily unavailable." }, { status: 503 });
  }

  try {
    const posts = await BlogPost.find().sort({ updatedAt: -1 }).limit(500).lean();
    return NextResponse.json({ posts });
  } catch (error) {
    console.error("[admin/posts] list failed:", error);
    return NextResponse.json({ error: "Could not load posts." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await adminGuard();
  if (denied) return denied;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) ?? {};
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const title = String(body.title || "").trim();
  const excerpt = String(body.excerpt || "").trim();
  const text = String(body.body || "").trim();

  if (title.length < 3 || title.length > 160) {
    return NextResponse.json({ error: "Please provide a title." }, { status: 400 });
  }
  if (excerpt.length < 10 || excerpt.length > 400) {
    return NextResponse.json({ error: "Please provide a short excerpt (10-400 characters)." }, { status: 400 });
  }
  if (text.length < 20) {
    return NextResponse.json({ error: "Please provide the article text." }, { status: 400 });
  }

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Could not save the post." }, { status: 503 });
  }

  const slug = slugify(String(body.slug || "").trim() || title);
  const status: BlogStatus = body.status === "published" ? "published" : "draft";

  try {
    const exists = await BlogPost.exists({ slug });
    if (exists) {
      return NextResponse.json({ error: "A post with that slug already exists." }, { status: 409 });
    }
    const post = await BlogPost.create({
      title,
      slug,
      excerpt,
      body: text,
      cover: typeof body.cover === "string" && body.cover.trim() ? body.cover.trim() : undefined,
      author: typeof body.author === "string" && body.author.trim() ? body.author.trim() : "S19 Herbal Clinic",
      status,
      featured: Boolean(body.featured),
      publishedAt:
        status === "published"
          ? body.publishedAt
            ? new Date(String(body.publishedAt))
            : new Date()
          : undefined,
    });
    return NextResponse.json({ success: true, post }, { status: 201 });
  } catch (error) {
    console.error("[admin/posts] create failed:", error);
    return NextResponse.json({ error: "Could not save the post." }, { status: 500 });
  }
}