import "server-only";

import { connectDb } from "@/lib/db";
import { BlogPost, type IBlogPost } from "@/lib/models/BlogPost";

/**
 * Blog data access for server components.
 *
 * The blog pages used to fetch their own `/api/blog` routes over HTTP. That
 * turned one page render into two function invocations and an extra network
 * round trip through the deployment's own origin, which counts against Vercel's
 * Fast Origin Transfer allowance. Reading MongoDB directly here keeps the data
 * path in-process and removes that self-inflicted traffic.
 */

export interface BlogListItem {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  cover?: string;
  author: string;
  featured: boolean;
  publishedAt?: string;
  titleFr?: string;
  excerptFr?: string;
  authorFr?: string;
}

export interface BlogPostDetail extends BlogListItem {
  body: string;
  bodyFr?: string;
}

type LeanBlogPost = IBlogPost & { _id: unknown };

function isoDate(value: Date | string | undefined): string | undefined {
  if (!value) return undefined;
  return new Date(value).toISOString();
}

function toListItem(post: LeanBlogPost): BlogListItem {
  return {
    _id: String(post._id),
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    cover: post.cover,
    author: post.author,
    featured: Boolean(post.featured),
    publishedAt: isoDate(post.publishedAt),
    titleFr: post.titleFr,
    excerptFr: post.excerptFr,
    authorFr: post.authorFr,
  };
}

function toDetail(post: LeanBlogPost): BlogPostDetail {
  return {
    ...toListItem(post),
    body: post.body,
    bodyFr: post.bodyFr,
  };
}

export async function getPublishedPosts(limit = 100): Promise<BlogListItem[]> {
  const conn = await connectDb();
  if (!conn) return [];

  try {
    const posts = (await BlogPost.find({ status: "published" })
      .select("-body -bodyFr")
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(limit)
      .lean()) as unknown as LeanBlogPost[];
    return posts.map(toListItem);
  } catch (error) {
    console.error("[blog] list failed:", error);
    return [];
  }
}

export async function getPublishedPost(slug: string): Promise<BlogPostDetail | null> {
  const conn = await connectDb();
  if (!conn) return null;

  try {
    const post = (await BlogPost.findOne({
      slug,
      status: "published",
    }).lean()) as unknown as LeanBlogPost | null;
    return post ? toDetail(post) : null;
  } catch (error) {
    console.error("[blog] detail failed:", error);
    return null;
  }
}

export async function getPublishedSlugs(): Promise<string[]> {
  const posts = await getPublishedPosts();
  return posts.map((post) => post.slug);
}
