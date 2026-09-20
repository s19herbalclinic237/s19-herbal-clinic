import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { adminGuard } from "@/lib/admin-guard";
import { VideoReview } from "@/lib/models/VideoReview";

function isValidVideoUrl(url: string): boolean {
  return url.length <= 500 && /^https?:\/\//i.test(url);
}

export async function GET() {
  const denied = await adminGuard();
  if (denied) return denied;

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Video reviews are temporarily unavailable." }, { status: 503 });
  }

  try {
    const videos = await VideoReview.find().sort({ createdAt: 1 }).limit(500).lean();
    return NextResponse.json({ videos });
  } catch (error) {
    console.error("[admin/video-reviews] list failed:", error);
    return NextResponse.json({ error: "Could not load video reviews." }, { status: 500 });
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

  const url = String(body.url || "").trim();
  const title = String(body.title || "").trim();

  if (!url) {
    return NextResponse.json({ error: "Please paste a video link." }, { status: 400 });
  }
  if (!isValidVideoUrl(url)) {
    return NextResponse.json(
      { error: "Please provide a valid video link (YouTube, Google Drive or Vimeo)." },
      { status: 400 }
    );
  }
  if (title.length > 140) {
    return NextResponse.json({ error: "The title is too long (max 140 characters)." }, { status: 400 });
  }

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Could not save the video review." }, { status: 503 });
  }

  try {
    const video = await VideoReview.create({
      url,
      title: title || undefined,
      active: true,
    });
    return NextResponse.json({ success: true, video }, { status: 201 });
  } catch (error) {
    console.error("[admin/video-reviews] create failed:", error);
    return NextResponse.json({ error: "Could not save the video review." }, { status: 500 });
  }
}