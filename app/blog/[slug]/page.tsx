import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, Section } from "@/components/ui/container";
import { formatDate } from "@/lib/format-date";
import { ArticleBody, readingTime } from "@/components/blog/article-body";
import { NewsletterForm } from "@/components/blog/newsletter-form";
import { getServerLocale, serverT } from "@/lib/i18n-server";
import { localizedBlogPost } from "@/lib/site";
import { canonicalMeta } from "@/lib/seo";
import { getPublishedPost, getPublishedSlugs } from "@/lib/blog";
import { findClinicPhotoBySrc, clinicPhotoSrc } from "@/lib/image-registry";
import { ClinicPhotoImage } from "@/components/seo/clinic-photo-image";
import { FaArrowLeft, FaClock, FaRegNewspaper, FaUserPen } from "react-icons/fa6";

export const revalidate = 3600;

export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await getPublishedSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const t = await serverT();
  const locale = await getServerLocale();
  const post = await getPublishedPost(slug);
  if (!post) return { title: t("blogPost.notFound") };
  const localized = localizedBlogPost({
    id: post._id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    body: post.body,
    cover: post.cover,
    author: post.author,
    featured: post.featured,
    publishedAt: post.publishedAt,
    titleFr: post.titleFr,
    excerptFr: post.excerptFr,
    bodyFr: post.bodyFr,
    authorFr: post.authorFr,
  }, locale);
  return {
    title: `${localized.title} | ${t("blogPost.metaBlog")}`,
    description: localized.excerpt,
    keywords: [
      localized.title,
      "herbal medicine blog Cameroon",
      "natural health article",
      "phytothérapie Cameroun article",
      "natural remedies education S19",
    ],
    ...canonicalMeta(`/blog/${slug}`),
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = await serverT();
  const locale = await getServerLocale();
  const post = await getPublishedPost(slug);

  if (!post) notFound();

  // Resolved once, so the cover can be rendered through the optimiser with its
  // true dimensions when it is a clinic photograph from the registry.
  const coverPhoto = findClinicPhotoBySrc(post.cover);

  const p = localizedBlogPost({
    id: post._id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    body: post.body,
    cover: post.cover,
    author: post.author,
    featured: post.featured,
    publishedAt: post.publishedAt,
    titleFr: post.titleFr,
    excerptFr: post.excerptFr,
    bodyFr: post.bodyFr,
    authorFr: post.authorFr,
  }, locale);

  return (
    <>
      <Section className="bg-cream">
        <Container className="max-w-3xl">
          <Link href="/blog" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-forest-700 hover:text-forest-900">
            <FaArrowLeft className="h-3.5 w-3.5" aria-hidden />
            {t("blogPost.back")}
          </Link>

          <article>
            <p className="text-xs font-semibold uppercase tracking-widest text-gold-600">
              {post.publishedAt ? formatDate(post.publishedAt) : ""} · {t("blogPost.metaBlog")}
            </p>
            <h1 className="mt-3 font-display text-3xl font-bold leading-tight text-ink sm:text-4xl">{p.title}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
              <p className="flex items-center gap-2">
                <FaUserPen className="h-4 w-4 text-forest-400" aria-hidden />
                {t("blogPost.by", { author: p.author })}
              </p>
              <span className="hidden h-4 w-px bg-line-strong sm:block" aria-hidden />
              <p className="flex items-center gap-2">
                <FaClock className="h-3.5 w-3.5 text-forest-400" aria-hidden />
                {t("blogPost.minRead", { minutes: readingTime(p.body) })}
              </p>
            </div>

            {post.cover ? (
              <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
                {/*
                  Covers come from the database, so a given post's cover may be an
                  editorial clinic photograph or an arbitrary admin-supplied URL.

                  When it is one of ours it is rendered through the optimiser, with
                  the real intrinsic size — which matters here because this is the
                  one image on the page with no aspect-ratio container around it,
                  so without dimensions the browser reserved no space and the
                  article was shoved down as the cover loaded. `h-auto w-full`
                  keeps the natural proportions, so the appearance is unchanged
                  and only the wasted reflow goes away.

                  Anything else falls back to a plain `<img>`: the dimensions are
                  unknown, and `next/image` cannot optimise a host that is not
                  in `remotePatterns` — which would turn an admin typo into a
                  broken page rather than a slightly heavier image.
                */}
                {coverPhoto ? (
                  <ClinicPhotoImage
                    src={clinicPhotoSrc(coverPhoto)}
                    alt={p.title}
                    width={coverPhoto.width}
                    height={coverPhoto.height}
                    sizes="(min-width: 1024px) 768px, 100vw"
                    className="h-auto w-full object-cover"
                  />
                ) : (
                  <img
                    src={post.cover}
                    alt={p.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full object-cover"
                  />
                )}
              </div>
            ) : null}

            <div className="mt-8">
              <ArticleBody body={p.body} cover={post.cover} />
            </div>
          </article>

          <div className="mt-12 rounded-xl border border-forest-200 bg-forest-50/60 p-6 sm:p-8">
            <div className="flex items-start gap-3">
              <span className="mt-1 rounded-md bg-forest-800 p-2 text-white">
                <FaRegNewspaper className="h-4 w-4" aria-hidden />
              </span>
              <div className="flex-1">
                <h2 className="font-display text-lg font-semibold text-ink">{t("blogPost.enjoyed")}</h2>
                <p className="mt-1 text-sm text-muted">
                  {t("blogPost.newsletter.text")}
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