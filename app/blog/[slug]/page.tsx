import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, Section } from "@/components/ui/container";
import { formatDate } from "@/lib/format-date";
import { ArticleBody, readingTime } from "@/components/blog/article-body";
import { NewsletterForm } from "@/components/blog/newsletter-form";
import { FaArrowLeft, FaClock, FaRegNewspaper, FaUserPen } from "react-icons/fa6";

export const revalidate = 60;

export const dynamicParams = true;

interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  cover?: string;
  author: string;
  featured: boolean;
  publishedAt?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const fetchPost = async (slug: string): Promise<BlogPost | null> => {
  try {
    const res = await fetch(`${API_BASE}/api/blog/${slug}`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { post?: BlogPost };
    return data.post ?? null;
  } catch {
    return null;
  }
};

const fetchSlugs = async (): Promise<string[]> => {
  try {
    const res = await fetch(`${API_BASE}/api/blog`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = (await res.json()) as { posts?: { slug: string }[] };
    return (data.posts ?? []).map((p) => p.slug);
  } catch {
    return [];
  }
};

export async function generateStaticParams() {
  const slugs = await fetchSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchPost(slug);
  if (!post) return { title: "Article not found | S19 Health Blog" };
  return {
    title: `${post.title} | S19 Health Blog`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await fetchPost(slug);

  if (!post) notFound();

  return (
    <>
      <Section className="bg-cream">
        <Container className="max-w-3xl">
          <Link href="/blog" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-forest-700 hover:text-forest-900">
            <FaArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Back to the blog
          </Link>

          <article>
            <p className="text-xs font-semibold uppercase tracking-widest text-gold-600">
              {post.publishedAt ? formatDate(post.publishedAt) : ""} · S19 Health Blog
            </p>
            <h1 className="mt-3 font-display text-3xl font-bold leading-tight text-ink sm:text-4xl">{post.title}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
              <p className="flex items-center gap-2">
                <FaUserPen className="h-4 w-4 text-forest-400" aria-hidden />
                By {post.author}
              </p>
              <span className="hidden h-4 w-px bg-line-strong sm:block" aria-hidden />
              <p className="flex items-center gap-2">
                <FaClock className="h-3.5 w-3.5 text-forest-400" aria-hidden />
                {readingTime(post.body)} min read
              </p>
            </div>

            {post.cover ? (
              <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
                <img src={post.cover} alt={post.title} className="w-full object-cover" />
              </div>
            ) : null}

            <div className="mt-8">
              <ArticleBody body={post.body} />
            </div>
          </article>

          <div className="mt-12 rounded-xl border border-forest-200 bg-forest-50/60 p-6 sm:p-8">
            <div className="flex items-start gap-3">
              <span className="mt-1 rounded-md bg-forest-800 p-2 text-white">
                <FaRegNewspaper className="h-4 w-4" aria-hidden />
              </span>
              <div className="flex-1">
                <h2 className="font-display text-lg font-semibold text-ink">Enjoyed this article?</h2>
                <p className="mt-1 text-sm text-muted">
                  Subscribe for the next health update - tips, new articles and clinic news, straight to your inbox.
                </p>
                <div className="mt-4">
                  <NewsletterForm />
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}