"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatDate } from "@/lib/format-date";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/i18n/locale-provider";
import { localizedBlogPost } from "@/lib/site";
import { FaArrowRight, FaMagnifyingGlass, FaRegNewspaper } from "react-icons/fa6";

interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  cover?: string;
  author: string;
  featured?: boolean;
  publishedAt?: string;
  titleFr?: string;
  excerptFr?: string;
  authorFr?: string;
}

type Filter = "all" | "featured";

export function BlogExplorer({ posts }: { posts: BlogPost[] }) {
  const { t, locale } = useLocale();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const localizedPosts = useMemo(
    () => posts.map((p) => localizedBlogPost({
      id: p._id,
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      body: "",
      cover: p.cover,
      author: p.author,
      featured: p.featured ?? false,
      publishedAt: p.publishedAt,
      titleFr: p.titleFr,
      excerptFr: p.excerptFr,
      authorFr: p.authorFr,
    }, locale)),
    [posts, locale]
  );

  const sorted = useMemo(
    () =>
      [...localizedPosts].sort((a, b) => {
        if (Boolean(a.featured) !== Boolean(b.featured)) return a.featured ? -1 : 1;
        return (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "");
      }),
    [localizedPosts]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sorted.filter((p) => {
      if (filter === "featured" && !p.featured) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q)
      );
    });
  }, [sorted, query, filter]);

  const [spotlight, ...rest] = filtered;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block w-full sm:max-w-xs">
          <FaMagnifyingGlass
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("blog.search.placeholder")}
            className="w-full rounded-lg border border-line-strong bg-white py-2.5 pl-10 pr-4 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:border-forest-500"
          />
        </label>
        <div className="inline-flex items-center gap-1 rounded-lg border border-line-strong bg-cream/70 p-1">
          {(
            [
              { id: "all", label: t("blog.filter.all") },
              { id: "featured", label: t("blog.filter.featured") },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-semibold transition-colors",
                filter === f.id
                  ? "bg-forest-800 text-white shadow-sm"
                  : "text-ink/70 hover:bg-white hover:text-forest-800"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-line bg-white p-10 text-center">
          <FaRegNewspaper className="mx-auto h-8 w-8 text-forest-300" aria-hidden />
          <h2 className="mt-4 text-xl font-semibold text-ink">{t("blog.search.empty")}</h2>
        </div>
      ) : (
        <div className="space-y-10">
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
                      {t("blog.featured")}
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
                    {t("blog.read")}
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
                  key={p.id}
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
                          {t("blog.featured")}
                        </span>
                      ) : null}
                    </div>
                    <h2 className="mt-2 font-display text-lg font-semibold leading-snug text-ink group-hover:text-forest-800">
                      {p.title}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{p.excerpt}</p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-forest-700">
                      {t("blog.read")}
                      <FaArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}