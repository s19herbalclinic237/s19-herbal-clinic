import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui/page-hero";
import { Section } from "@/components/ui/container";
import { CTABand } from "@/components/sections/cta-band";
import { StoryVideo } from "@/components/testimonials/story-video";
import { ConsentDisclaimer } from "@/components/testimonials/consent-disclaimer";
import { getActiveVideoReviews } from "@/lib/video-reviews";
import { S19_ASSETS } from "@/lib/site-assets";
import { serverT } from "@/lib/i18n-server";
import { canonicalMeta } from "@/lib/seo";
import { FaCirclePlay, FaQuoteLeft } from "react-icons/fa6";

export const revalidate = 3600;

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

  return (
    <>
      <PageHero
        eyebrow={t("liveReviews.hero.eyebrow")}
        title={t("liveReviews.hero.title")}
        lead={t("liveReviews.hero.lead")}
        image={HERO_IMG}
        alt="S19 staff taking a patient's blood pressure while family members follow closely"
      />

      {/* The written testimonials live on their own page. A visitor who landed
          here for a video should not have to hunt through the menu to find
          them, so the way across is offered before the grid, not after it. */}
      <Section className="!pb-0">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 rounded-2xl border border-line bg-white px-6 py-8 text-center shadow-card sm:flex-row sm:justify-between sm:text-left">
          <div className="min-w-0">
            <div className="flex items-center justify-center gap-2 sm:justify-start">
              <FaQuoteLeft className="h-4 w-4 shrink-0 text-forest-400" aria-hidden />
              <h2 className="font-display text-lg font-semibold text-ink">
                {t("liveReviews.cta.title")}
              </h2>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted">{t("liveReviews.cta.text")}</p>
          </div>
          <Link
            href="/patient-stories"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-forest-800 px-6 py-3 text-sm font-semibold text-white shadow-card transition-colors hover:bg-forest-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-700"
          >
            {t("liveReviews.cta.button")}
          </Link>
        </div>
      </Section>

      <Section>
        {videos.length === 0 ? (
          <div className="mx-auto max-w-xl rounded-lg border border-line bg-white p-10 text-center">
            <FaCirclePlay className="mx-auto h-8 w-8 text-forest-300" aria-hidden />
            <p className="mt-4 text-sm text-muted">{t("liveReviews.empty")}</p>
          </div>
        ) : (
          <div className="columns-1 gap-6 sm:columns-2 lg:columns-3">
            {videos.map((v) => (
              <div key={v.id} className="mb-6 break-inside-avoid">
                <StoryVideo url={v.url} bare />
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Every video above shows a real patient, so the consent and privacy
          terms sit directly under them rather than only on the linked page. */}
      <Section className="!pt-0">
        <ConsentDisclaimer />
      <div className="mt-8 rounded-lg border border-line bg-white p-5 text-sm leading-relaxed text-ink/80 shadow-card">
        <strong>Video Testimonial Consent:</strong> Patients featured in published testimonial videos have voluntarily consented to S19 displaying their videos. Patients who do not consent are not required to provide a video testimonial, and their decision does not affect their care.
      </div>
      </Section>

      <CTABand />
    </>
  );
}