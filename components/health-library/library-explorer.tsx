"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FaArrowRight, FaBookOpen, FaCirclePlay } from "react-icons/fa6";
import { StoryVideo } from "@/components/testimonials/story-video";

export interface LibraryArticle {
  _id: string;
  slug: string;
  title: string;
  titleFr?: string;
  excerpt: string;
  excerptFr?: string;
  cover?: string;
  author?: string;
  publishedAt?: string;
}

export interface LibraryVideo {
  id: string;
  url: string;
  title?: string;
}

export type TopicKey =
  | "all"
  | "diabetes"
  | "heart"
  | "digestion"
  | "women"
  | "men"
  | "detox";

export interface LibraryLabels {
  all: string;
  topics: { key: TopicKey; label: string }[];
  articlesTitle: string;
  articlesLead: string;
  videosTitle: string;
  videosLead: string;
  emptyArticles: string;
  emptyVideos: string;
  readArticle: string;
  watchAll: string;
}

const TOPIC_KEYWORDS: Record<Exclude<TopicKey, "all">, string[]> = {
  diabetes: ["diabet", "glycem", "glucose", "sugar", "sucre", "insulin", "blood sugar"],
  heart: ["hypertens", "heart", "blood pressure", "tension", "cardio", "cholestérol", "cholesterol", "pression", "coeur", "cœur"],
  digestion: ["gastrit", "digest", "stomach", "ulcer", "constipation", "acide", "acid", "estomac", "ventre", "reflux"],
  women: ["women", "womb", "fertility", "menstrual", "hormon", "breast", "cervical", "femme", "féminin", "utérus", "règles"],
  men: ["prostate", "men", "erectile", "impotence", "enlarg", "homme", "masculin"],
  detox: ["detox", "liver", "foie", "kidney", "rein", "immun", "cleanse", "purif", "boost"],
};

function matchesTopic(haystack: string, topic: Exclude<TopicKey, "all">): boolean {
  const words = TOPIC_KEYWORDS[topic];
  const lower = haystack.toLowerCase();
  return words.some((w) => lower.includes(w));
}

function articleMatches(article: LibraryArticle, topic: Exclude<TopicKey, "all">): boolean {
  const haystack = [
    article.title,
    article.titleFr || "",
    article.excerpt,
    article.excerptFr || "",
  ].join(" \u0000 ");
  return matchesTopic(haystack, topic);
}

export function HealthLibraryExplorer({
  posts,
  videos,
  locale,
  labels,
}: {
  posts: LibraryArticle[];
  videos: LibraryVideo[];
  locale: "en" | "fr";
  labels: LibraryLabels;
}) {
  const [topic, setTopic] = useState<TopicKey>("all");
  const isFr = locale === "fr";

  const filteredPosts = useMemo(() => {
    if (topic === "all") return posts;
    return posts.filter((p) => articleMatches(p, topic));
  }, [posts, topic]);

  const filteredVideos = useMemo(() => {
    if (topic === "all") return videos;
    return videos.filter((v) => matchesTopic(v.title || "", topic));
  }, [videos, topic]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {labels.topics.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTopic(t.key)}
            className={
              topic === t.key
                ? "cursor-pointer rounded-full bg-forest-800 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm"
                : "cursor-pointer rounded-full border border-line-strong bg-white px-3.5 py-1.5 text-xs font-semibold text-ink/80 transition-colors hover:border-forest-400 hover:text-forest-800"
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      <section className="mt-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-ink sm:text-2xl">{labels.articlesTitle}</h2>
            <p className="mt-1 text-sm text-muted">{labels.articlesLead}</p>
          </div>
        </div>

        {filteredPosts.length === 0 ? (
          <p className="mt-5 rounded-lg border border-line bg-white p-6 text-sm text-muted">{labels.emptyArticles}</p>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.slice(0, 12).map((p) => {
              const title = isFr && p.titleFr ? p.titleFr : p.title;
              const excerpt = isFr && p.excerptFr ? p.excerptFr : p.excerpt;
              return (
                <Link
                  key={p._id}
                  href={`/blog/${p.slug}`}
                  className="group flex flex-col overflow-hidden rounded-lg border border-line bg-white transition-shadow hover:shadow-lift"
                >
                  {p.cover ? (
                    <div className="aspect-[16/9] w-full overflow-hidden">
                      {/* Database-supplied cover in a fixed 16/9 box: no layout shift is possible,
                        and the host is not known, so a plain `<img>` is correct.
                        Lazy because the grid sits below the fold. */}
                      <img
                        src={p.cover}
                        alt={title}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-[16/9] w-full items-center justify-center bg-gradient-to-br from-forest-50 to-forest-100 text-forest-300">
                      <FaBookOpen className="h-9 w-9" aria-hidden />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="line-clamp-2 text-sm font-bold leading-snug text-ink transition-colors group-hover:text-forest-800">
                      {title}
                    </h3>
                    {excerpt ? (
                      <p className="mt-2 line-clamp-3 flex-1 text-xs leading-relaxed text-muted">{excerpt}</p>
                    ) : null}
                    <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-forest-800">
                      {labels.readArticle}
                      <FaArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-14">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-ink sm:text-2xl">{labels.videosTitle}</h2>
            <p className="mt-1 text-sm text-muted">{labels.videosLead}</p>
          </div>
          {videos.length > filteredVideos.length || videos.length > 6 ? (
            <Link
              href="/live-reviews"
              className="inline-flex shrink-0 items-center gap-1.5 text-xs font-bold text-forest-800 underline-offset-2 hover:underline"
            >
              <FaCirclePlay className="h-3.5 w-3.5 text-gold-500" aria-hidden />
              {labels.watchAll}
            </Link>
          ) : null}
        </div>

        {filteredVideos.length === 0 ? (
          <p className="mt-5 rounded-lg border border-line bg-white p-6 text-sm text-muted">{labels.emptyVideos}</p>
        ) : (
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredVideos.slice(0, 6).map((v) => (
              <div key={v.id} className="overflow-hidden rounded-lg border border-line bg-white">
                <div className="px-4 pt-4">
                  <p className="line-clamp-2 min-h-[2.5rem] text-sm font-bold text-ink">
                    {v.title || "Patient video review"}
                  </p>
                  <StoryVideo url={v.url} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}