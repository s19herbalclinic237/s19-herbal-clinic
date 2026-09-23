import type { Metadata } from "next";
import { PageHero } from "@/components/ui/page-hero";
import { Section } from "@/components/ui/container";
import { CTABand } from "@/components/sections/cta-band";
import { StoryVideo } from "@/components/testimonials/story-video";
import { getActiveVideoReviews } from "@/lib/video-reviews";
import { isVideoEmbedBlocked } from "@/lib/video-probe";
import { S19_ASSETS } from "@/lib/site-assets";
import { serverT } from "@/lib/i18n-server";
import { canonicalMeta } from "@/lib/seo";
import { FaCirclePlay } from "react-icons/fa6";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const t = await serverT();
  return {
    title: t("liveReviews.meta.title"),
    description: t("liveReviews.meta.description"),
    keywords: [
      "S19 patient video reviews",
      "herbal clinic video testimonials Cameroon",
      "live reviews Bafoussam",
      "natural healing videos S19",
      "avis vidéo patients S19",
      "témoignages vidéo phytothérapie Cameroun",
    ],
    ...canonicalMeta("/live-reviews"),
  };
}

const HERO_IMG = S19_ASSETS.photos.bloodPressure;

export default async function LiveReviewsPage() {
  const t = await serverT();
  const videos = await getActiveVideoReviews();
  const items = await Promise.all(
    videos.map(async (v) => ({ video: v, blocked: await isVideoEmbedBlocked(v.url) }))
  );

  return (
    <>
      <PageHero
        eyebrow={t("liveReviews.hero.eyebrow")}
        title={t("liveReviews.hero.title")}
        lead={t("liveReviews.hero.lead")}
        image={HERO_IMG}
        alt="S19 staff taking a patient's blood pressure while family members follow closely"
      />

      <Section>
        {items.length === 0 ? (
          <div className="mx-auto max-w-xl rounded-lg border border-line bg-white p-10 text-center">
            <FaCirclePlay className="mx-auto h-8 w-8 text-forest-300" aria-hidden />
            <p className="mt-4 text-sm text-muted">{t("liveReviews.empty")}</p>
          </div>
        ) : (
          <div className="columns-1 gap-6 sm:columns-2 lg:columns-3">
            {items.map(({ video: v, blocked }) => (
              <div key={v.id} className="mb-6 break-inside-avoid">
                <StoryVideo url={v.url} blocked={blocked} bare />
              </div>
            ))}
          </div>
        )}
      </Section>

      <CTABand />
    </>
  );
}