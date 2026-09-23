import type { Metadata } from "next";
import { PageHero } from "@/components/ui/page-hero";
import { Section } from "@/components/ui/container";
import { CTABand } from "@/components/sections/cta-band";
import { getActiveVideoReviews } from "@/lib/video-reviews";
import { S19_ASSETS } from "@/lib/site-assets";
import { getServerLocale, serverT } from "@/lib/i18n-server";
import { canonicalMeta } from "@/lib/seo";
import {
  HealthLibraryExplorer,
  type LibraryArticle,
  type LibraryLabels,
  type LibraryVideo,
  type TopicKey,
} from "@/components/health-library/library-explorer";

export const revalidate = 60;

const HERO_IMG = S19_ASSETS.photos.consultationAdvice;

export async function generateMetadata(): Promise<Metadata> {
  const t = await serverT();
  return {
    title: t("library.meta.title"),
    description: t("library.meta.description"),
    keywords: [
      "health education Cameroon",
      "herbal medicine articles",
      "natural healing videos",
      "diabetes education herbal",
      "hypertension natural treatment",
      "health library Bafoussam",
      "bibliothèque santé Cameroun",
      "articles phytothérapie",
      "éducation santé naturelle S19",
    ],
    ...canonicalMeta("/health-library"),
  };
}

export default async function HealthLibraryPage() {
  const t = await serverT();
  const locale = await getServerLocale();

  let posts: LibraryArticle[] = [];
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/api/blog`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const data = (await res.json()) as { posts?: LibraryArticle[] };
      posts = Array.isArray(data.posts) ? data.posts : [];
    }
  } catch {
    posts = [];
  }

  const videos: LibraryVideo[] = (await getActiveVideoReviews()).map((v) => ({
    id: v.id,
    url: v.url,
    title: v.title,
  }));

  const labels: LibraryLabels = {
    all: t("library.topics.all"),
    topics: (["all", "diabetes", "heart", "digestion", "women", "men", "detox"] as TopicKey[]).map((key) => ({
      key,
      label: key === "all" ? t("library.topics.all") : t(`library.topics.${key as Exclude<TopicKey, "all">}`),
    })),
    articlesTitle: t("library.articles.title"),
    articlesLead: t("library.articles.lead"),
    videosTitle: t("library.videos.title"),
    videosLead: t("library.videos.lead"),
    emptyArticles: t("library.empty.articles"),
    emptyVideos: t("library.empty.videos"),
    readArticle: t("library.readArticle"),
    watchAll: t("library.watchAll"),
  };

  return (
    <>
      <PageHero
        eyebrow={t("library.hero.eyebrow")}
        title={t("library.hero.title")}
        lead={t("library.hero.lead")}
        image={HERO_IMG}
        alt={t("library.hero.alt")}
      />

      <Section>
        <HealthLibraryExplorer posts={posts} videos={videos} locale={locale} labels={labels} />
      </Section>

      <CTABand
        title={t("library.cta.title")}
        text={t("library.cta.text")}
        primaryLabel={t("library.cta.button")}
        primaryHref="/telehealth"
      />
    </>
  );
}