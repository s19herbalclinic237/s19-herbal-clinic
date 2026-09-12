import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { BlogPost } from "@/lib/models/BlogPost";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Blog is temporarily unavailable." }, { status: 503 });
  }

  try {
    const post = await BlogPost.findOne({ slug, status: "published" }).lean();
    if (!post) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }
    return NextResponse.json({ post });
  } catch (error) {
    console.error("[blog] detail failed:", error);
    return NextResponse.json({ error: "Could not load the post." }, { status: 500 });
  }
}