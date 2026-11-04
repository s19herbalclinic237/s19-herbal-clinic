import type { Metadata } from "next";
import { Container, Section } from "@/components/ui/container";
import { Kicker } from "@/components/ui/heading";
import { Reveal } from "@/components/ui/motion";
import { StoriesForm } from "@/components/testimonials/stories-form";
import { StoryVideo } from "@/components/testimonials/story-video";
import { getApprovedTestimonials } from "@/lib/testimonials";
import { S19_ASSETS } from "@/lib/site-assets";
import { serverT, getServerLocale } from "@/lib/i18n-server";
import { canonicalMeta } from "@/lib/seo";
import { clinicPhoto } from "@/lib/image-registry";
import { ClinicPhotoFill } from "@/components/seo/clinic-photo-image";
import { FaQuoteLeft, FaStar } from "react-icons/fa6";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const t = await serverT();
  return {
    title: t("stories.meta.title"),
    description: t("stories.meta.description"),
    keywords: [
      "patient testimonials herbal clinic Cameroon",
      "S19 healing stories",
      "patient reviews Bafoussam",
      "herbal treatment success stories",
      "natural medicine testimonials",
      "avis patients clinique S19",
      "témoignages guérison naturelle Cameroun",
      "résultats traitement phytothérapie",
    ],
    ...canonicalMeta("/patient-stories"),
  };
}

const HERO_IMG = S19_ASSETS.photos.consultationAdvice;

export default async function PatientStoriesPage() {
  const t = await serverT();
  const locale = await getServerLocale();
  const stories = await getApprovedTestimonials(60, locale);

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-forest-950">
        <ClinicPhotoFill
          photo={clinicPhoto("consultationAdvice")}
          alt={t("stories.hero.alt")}
          lcp
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-forest-950/95 via-forest-950/75 to-forest-950/40" />
        <Container className="relative z-10 w-full py-24 md:py-28">
          <Reveal>
            <Kicker className="text-gold-400">{t("stories.hero.eyebrow")}</Kicker>
            <h1 className="mt-4 max-w-2xl text-white">{t("stories.hero.title")}</h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-forest-100/90 md:text-lg">
              {t("stories.hero.lead")}
            </p>
          </Reveal>
        </Container>
      </section>

      {/* DISCLAIMER */}
      <Section className="!py-8">
        <div className="rounded-lg border border-gold-200 bg-gold-50/60 px-5 py-4">
          <p className="text-xs leading-relaxed text-gold-900/90">{t("stories.disclaimer")}</p>
        </div>
      </Section>

      <Section className="!py-0">
        <div className="mx-auto max-w-3xl rounded-lg border border-line bg-white p-6 shadow-card">
          <div className="flex items-start gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold text-ink">{t("stories.consent.title")}</h2>
              <ul className="mt-3 space-y-2.5">
                <li className="flex gap-2.5 text-sm leading-relaxed text-ink/75">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-forest-400" aria-hidden />
                  <span>{t("stories.consent.p1")}</span>
                </li>
                <li className="flex gap-2.5 text-sm leading-relaxed text-ink/75">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-forest-400" aria-hidden />
                  <span>{t("stories.consent.p2")}</span>
                </li>
                <li className="flex gap-2.5 text-sm leading-relaxed text-ink/75">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-forest-400" aria-hidden />
                  <span>{t("stories.consent.p3")}</span>
                </li>
                <li className="flex gap-2.5 text-sm leading-relaxed text-ink/75">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-forest-400" aria-hidden />
                  <span>{t("stories.consent.p4")}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Section>

      {/* GRID */}
      <Section>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((test, i) => (
            <figure
              key={`${test.name}-${i}`}
              className="flex h-full flex-col rounded-lg border border-line bg-white p-7 shadow-card transition-shadow hover:shadow-lift"
            >
              <FaQuoteLeft className="h-5 w-5 text-forest-300" aria-hidden />
              <div className="mt-3 flex items-center gap-1 text-gold-500">
                {Array.from({ length: test.rating ?? 5 }).map((_, j) => (
                  <FaStar key={j} className="h-3.5 w-3.5" aria-hidden />
                ))}
                {Array.from({ length: 5 - (test.rating ?? 5) }).map((_, j) => (
                  <FaStar key={`o-${j}`} className="h-3.5 w-3.5 text-forest-200" aria-hidden />
                ))}
              </div>
              <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-ink/80">
                &ldquo;{test.text}&rdquo;
              </blockquote>
              {test.videoUrl ? (
                <StoryVideo url={test.videoUrl} />
              ) : null}
              <figcaption className="mt-6 border-t border-line pt-4 text-sm">
                <span className="font-bold text-ink">{test.name}</span>
                <span className="mx-1.5 text-muted">·</span>
                <span className="text-muted">{test.city}</span>
                {test.country ? (
                  <>
                    <span className="mx-1.5 text-muted">·</span>
                    <span className="text-forest-600">{test.country}</span>
                  </>
                ) : null}
                <span className="mt-1 block text-xs font-medium italic text-muted">{test.program}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </Section>

      {/* SHARE FORM */}
      <Section className="bg-cream">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <div className="text-center">
              <Kicker center>{t("stories.share.kicker")}</Kicker>
              <h2 className="mt-4">{t("stories.share.title")}</h2>
              <p className="mx-auto mt-4 max-w-xl text-ink/70">{t("stories.share.text")}</p>
            </div>
          </Reveal>
          <Reveal className="mt-10">
            <StoriesForm />
          </Reveal>
        </div>
      </Section>
    </>
  );
}