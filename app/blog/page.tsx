import type { Metadata } from "next";
import { Container, Section } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { NewsletterForm } from "@/components/blog/newsletter-form";
import { BlogExplorer } from "@/components/blog/blog-explorer";
import { S19_ASSETS } from "@/lib/site-assets";
import { serverT } from "@/lib/i18n-server";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const t = await serverT();
  return {
    title: t("blog.meta.title"),
    description: t("blog.meta.description"),
  };
}

interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  cover?: string;
  author: string;
  featured?: boolean;
  publishedAt?: string;
}

export default async function BlogPage() {
  const t = await serverT();
  let posts: BlogPost[] = [];

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/api/blog`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const data = (await res.json()) as { posts?: BlogPost[] };
      posts = Array.isArray(data.posts) ? data.posts : [];
    }
  } catch {
    posts = [];
  }

  return (
    <>
      <PageHero
        eyebrow={t("blog.hero.eyebrow")}
        title={t("blog.hero.title")}
        lead={t("blog.hero.lead")}
        image={S19_ASSETS.photos.nutritionBasketOutreach}
        alt={t("blog.hero.alt")}
      />

      <Section className="bg-white">
        <Container className="max-w-5xl">
          {posts.length === 0 ? (
            <div className="rounded-lg border border-line bg-white p-10 text-center">
              <h2 className="text-xl font-semibold text-ink">{t("blog.empty.title")}</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted">
                {t("blog.empty.text")}
              </p>
            </div>
          ) : (
            <BlogExplorer posts={posts} />
          )}

          <div className="mt-12 rounded-xl border border-forest-200 bg-forest-50/60 p-6 sm:p-8">
            <h2 className="font-display text-xl font-semibold text-ink">{t("blog.newsletter.title")}</h2>
            <p className="mt-1 text-sm text-muted">
              {t("blog.newsletter.text")}
            </p>
            <div className="mt-4">
              <NewsletterForm />
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}