import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDb } from "@/lib/db";
import { adminGuard } from "@/lib/admin-guard";
import { VideoReview } from "@/lib/models/VideoReview";

function isValidVideoUrl(url: string): boolean {
  return url.length <= 500 && /^https?:\/\//i.test(url);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await adminGuard();
  if (denied) return denied;

  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid video review id." }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) ?? {};
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Could not update the video review." }, { status: 503 });
  }

  const existing = await VideoReview.findById(id).lean();
  if (!existing) {
    return NextResponse.json({ error: "Video review not found." }, { status: 404 });
  }

  const patch: Record<string, unknown> = {};

  if (body.url !== undefined) {
    const value = String(body.url).trim();
    if (!value || !isValidVideoUrl(value)) {
      return NextResponse.json(
        { error: "Please provide a valid video link (YouTube, Google Drive or Vimeo)." },
        { status: 400 }
      );
    }
    patch.url = value;
  }

  if (body.title !== undefined) {
    const value = String(body.title).trim();
    if (value.length > 140) {
      return NextResponse.json({ error: "The title is too long (max 140 characters)." }, { status: 400 });
    }
    patch.title = value || undefined;
  }

  if (body.active !== undefined) {
    patch.active = Boolean(body.active);
  }

  try {
    const video = await VideoReview.findByIdAndUpdate(id, { $set: patch }, { new: true }).lean();
    return NextResponse.json({ success: true, video });
  } catch (error) {
    console.error("[admin/video-reviews] update failed:", error);
    return NextResponse.json({ error: "Could not update the video review." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await adminGuard();
  if (denied) return denied;

  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid video review id." }, { status: 400 });
  }

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Could not delete the video review." }, { status: 503 });
  }

  try {
    const deleted = await VideoReview.findByIdAndDelete(id).lean();
    if (!deleted) {
      return NextResponse.json({ error: "Video review not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[admin/video-reviews] delete failed:", error);
    return NextResponse.json({ error: "Could not delete the video review." }, { status: 500 });
  }
}