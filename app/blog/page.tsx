import type { Metadata } from "next";
import Link from "next/link";
import { Container, Section } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { formatDate } from "@/lib/format-date";
import { NewsletterForm } from "@/components/blog/newsletter-form";
import { S19_ASSETS } from "@/lib/site-assets";
import { FaArrowRight, FaRegNewspaper } from "react-icons/fa6";

export const metadata: Metadata = {
  title: "Health Blog & News",
  description:
    "Educational herbal health articles from S19 Herbal Clinic - natural remedies, nutrition, lifestyle medicine and clinic updates.",
};

export const revalidate = 60;

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
        eyebrow="Health Blog"
        title="Education & Clinic News"
        lead="Evidence-informed herbal health articles, nutrition guidance and updates from the S19 wellness team."
        image={S19_ASSETS.photos.nutritionBasketOutreach}
        alt="Fresh fruit and vegetables from the S19 nutrition program"
      />

      <Section className="bg-white">
        <Container className="max-w-5xl">
          {posts.length === 0 ? (
            <div className="rounded-lg border border-line bg-white p-10 text-center">
              <FaRegNewspaper className="mx-auto h-8 w-8 text-forest-300" aria-hidden />
              <h2 className="mt-4 text-xl font-semibold text-ink">Articles are on the way</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted">
                The clinic is preparing its first articles. Subscribe below and you will be notified as soon as they are
                published.
              </p>
            </div>
          ) : (
            <div className="space-y-10">
              {(() => {
                const sorted = [...posts].sort((a, b) => {
                  if (Boolean(a.featured) !== Boolean(b.featured)) return a.featured ? -1 : 1;
                  return (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "");
                });
                const [spotlight, ...rest] = sorted;

                return (
                  <>
                    {spotlight ? (
                      <Link
                        href={`/blog/${spotlight.slug}`}
                        className="group block overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-forest-300 hover:shadow-lift"
                      >
                        <div className="grid md:grid-cols-2">
                          <div className="relative aspect-[16/10] overflow-hidden bg-forest-950 md:aspect-auto md:min-h-72">
                            {spotlight.cover ? (
                              <img
                                src={spotlight.cover}
                                alt={spotlight.title}
                                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center">
                                <FaRegNewspaper className="h-12 w-12 text-gold-400/70" aria-hidden />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col justify-center p-6 sm:p-8">
                            <div className="flex items-center gap-3">
                              <span className="inline-flex items-center gap-1.5 rounded-sm border border-gold-400 bg-gold-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold-700">
                                Featured
                              </span>
                              <p className="text-xs font-semibold uppercase tracking-wide text-gold-600">
                                {spotlight.publishedAt ? formatDate(spotlight.publishedAt) : ""} · {spotlight.author}
                              </p>
                            </div>
                            <h2 className="mt-3 font-display text-xl font-bold leading-snug text-ink group-hover:text-forest-800 sm:text-2xl">
                              {spotlight.title}
                            </h2>
                            <p className="mt-3 text-sm leading-relaxed text-muted">{spotlight.excerpt}</p>
                            <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-forest-700">
                              Read article
                              <FaArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" aria-hidden />
                            </span>
                          </div>
                        </div>
                      </Link>
                    ) : null}

                    {rest.length > 0 ? (
                      <div className="grid gap-6 sm:grid-cols-2">
                        {rest.map((p) => (
                          <Link
                            key={p._id}
                            href={`/blog/${p.slug}`}
                            className="group overflow-hidden rounded-xl border border-line bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-forest-300 hover:shadow-lift"
                          >
                            {p.cover ? (
                              <div className="aspect-[16/9] overflow-hidden bg-cream">
                                <img
                                  src={p.cover}
                                  alt={p.title}
                                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                                />
                              </div>
                            ) : (
                              <div className="flex aspect-[16/9] items-center justify-center bg-forest-950">
                                <FaRegNewspaper className="h-10 w-10 text-gold-400/70" aria-hidden />
                              </div>
                            )}
                            <div className="p-5">
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-semibold uppercase tracking-wide text-gold-600">
                                  {p.publishedAt ? formatDate(p.publishedAt) : ""}
                                </p>
                                {p.featured ? (
                                  <span className="inline-flex rounded-sm border border-gold-400 bg-gold-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold-700">
                                    Featured
                                  </span>
                                ) : null}
                              </div>
                              <h2 className="mt-2 font-display text-lg font-semibold leading-snug text-ink group-hover:text-forest-800">
                                {p.title}
                              </h2>
                              <p className="mt-2 text-sm leading-relaxed text-muted">{p.excerpt}</p>
                              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-forest-700">
                                Read article
                                <FaArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" aria-hidden />
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : null}
                  </>
                );
              })()}
            </div>
          )}

          <div className="mt-12 rounded-xl border border-forest-200 bg-forest-50/60 p-6 sm:p-8">
            <h2 className="font-display text-xl font-semibold text-ink">Get new articles by email</h2>
            <p className="mt-1 text-sm text-muted">
              Health tips, clinic updates and new articles - no spam, unsubscribe anytime.
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