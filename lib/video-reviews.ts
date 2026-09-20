import "server-only";

import { connectDb } from "@/lib/db";
import { VideoReview, type IVideoReview } from "@/lib/models/VideoReview";

export interface SiteVideoReview {
  id: string;
  url: string;
  title?: string;
}

let dbUnavailable = false;

/**
 * Active video reviews, oldest first — the order in which they were pasted
 * in the admin dashboard.
 */
export async function getActiveVideoReviews(): Promise<SiteVideoReview[]> {
  if (dbUnavailable) return [];
  const conn = await connectDb();
  if (!conn) {
    dbUnavailable = true;
    return [];
  }
  try {
    const docs = await VideoReview.find({ active: true })
      .sort({ createdAt: 1 })
      .limit(100)
      .lean<IVideoReview[]>();
    return docs.map((v) => ({ id: v._id, url: v.url, title: v.title }));
  } catch {
    dbUnavailable = true;
    return [];
  }
}