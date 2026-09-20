import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { BlogPost } from "@/lib/models/BlogPost";

export async function GET() {
  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Blog is temporarily unavailable." }, { status: 503 });
  }

  try {
    const posts = await BlogPost.find({ status: "published" })
      .select("-body -bodyFr")
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(100)
      .lean();
    return NextResponse.json({ posts });
  } catch (error) {
    console.error("[blog] list failed:", error);
    return NextResponse.json({ error: "Could not load posts." }, { status: 500 });
  }
}