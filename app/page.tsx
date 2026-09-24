import type { Metadata } from "next";
import Link from "next/link";
import { Container, Section } from "@/components/ui/container";
import { Kicker } from "@/components/ui/heading";
import { buttonLinkClasses } from "@/components/ui/button";
import { ProductCard } from "@/components/ui/product-card";
import { BookingForm } from "@/components/sections/booking-form";
import { CTABand } from "@/components/sections/cta-band";
import { BlurIn, Reveal, ScaleIn, StaggerGroup, StaggerItem } from "@/components/ui/motion";
import { StoryVideo } from "@/components/testimonials/story-video";
import { getProducts } from "@/lib/catalog";
import { getApprovedTestimonials } from "@/lib/testimonials";
import { getActiveVideoReviews } from "@/lib/video-reviews";
import { isVideoEmbedBlocked } from "@/lib/video-probe";
import {
  localizedClinicalPrinciples,
  localizedFaqs,
  localizedPrograms,
  localizedTelehealthSteps,
} from "@/lib/data/programs";
import { localizedClinic, waLink } from "@/lib/site";
import { S19_ASSETS } from "@/lib/site-assets";
import { getServerLocale, serverT } from "@/lib/i18n-server";
import { formatFcfa } from "@/lib/utils";
import { canonicalMeta } from "@/lib/seo";

export const revalidate = 60;
import {
  FaWhatsapp,
  FaGlobe,
  FaMapLocationDot,
  FaClock,
  FaArrowRight,
  FaChevronDown,
  FaStar,
  FaRegCircleCheck,
  FaStarOfLife,
  FaCirclePlay,
  FaBed,
} from "react-icons/fa6";

const FEATURED_SLUGS = ["s19-herbal-wine-reserve", "s19-sozo", "s19-malaria-typhoid-combo"];

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Herbal Clinic in Bafoussam, Cameroon – Science-Based Natural Medicine",
    description:
      "S19 Herbal Clinic: science-based herbal medicine in Bafoussam, Cameroon. Individualized natural programs for diabetes, hypertension, prostate health, and women's health. Telehealth consultations and worldwide DHL shipping.",
    alternates: { canonical: canonicalMeta("/").alternates?.canonical },
    openGraph: {
      ...canonicalMeta("/").openGraph,
      title: "S19 Herbal Clinic – Natural Healing, Lasting Wellness",
      description: "Science-based herbal medicine clinic in Bafoussam, Cameroon. Telehealth + worldwide DHL shipping.",
    },
    twitter: {
      card: "summary_large_image",
      title: "S19 Herbal Clinic – Natural Healing, Lasting Wellness",
      description: "Science-based herbal medicine clinic in Bafoussam, Cameroon. Telehealth + worldwide DHL shipping.",
    },
  };
}

export default async function HomePage() {
  const t = await serverT();
  const locale = await getServerLocale();
  const treatmentPrograms = localizedPrograms(locale);
  const clinicalPrinciples = localizedClinicalPrinciples(locale);
  const telehealthSteps = localizedTelehealthSteps(locale);
  const faqs = localizedFaqs(locale);
  const products = await getProducts();
  const featured = FEATURED_SLUGS
    .map((slug) => products.find((p) => p.slug === slug))
    .filter((p): p is NonNullable<typeof p> => typeof p !== "undefined");
  const testimonials = await getApprovedTestimonials(12, locale);
  const videoReviews = await getActiveVideoReviews();
  const featuredVideo = videoReviews.length > 0 ? videoReviews[videoReviews.length - 1] : null;
  const featuredVideoBlocked = featuredVideo ? await isVideoEmbedBlocked(featuredVideo.url) : false;

  const careLinks = [
    {
      icon: S19_ASSETS.icons.herbalMedicine,
      title: t("home.focus.clinical.title"),
      href: "/programs",
      label: t("home.focus.clinical.label"),
    },
    {
      icon: S19_ASSETS.icons.trustedCare,
      title: t("home.focus.tele.title"),
      href: "/telehealth",
      label: t("home.focus.tele.label"),
    },
    {
      icon: S19_ASSETS.icons.naturalIngredients,
      title: t("home.focus.catalog.title"),
      href: "/shop",
      label: t("home.focus.catalog.label"),
    },
  ];

  const bookingSteps = [
    { n: "01", title: t("home.steps.1.title"), text: t("home.steps.1.text") },
    { n: "02", title: t("home.steps.2.title"), text: t("home.steps.2.text") },
    { n: "03", title: t("home.steps.3.title"), text: t("home.steps.3.text") },
    { n: "04", title: t("home.steps.4.title"), text: t("home.steps.4.text") },
  ];

  return (
    <>
      {/* HERO */}
      <section className="relative flex min-h-[86vh] items-center overflow-hidden bg-forest-950">
        <img
          src={S19_ASSETS.photos.shopCounter}
          alt="The S19 Herbal Clinic reception and product counter in Bafoussam"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-forest-950/95 via-forest-950/75 to-forest-950/30" />
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-forest-950/90 via-transparent to-transparent" />

        <Container className="relative z-10 w-full py-24 md:py-32">
          <BlurIn>
            <h1 className="mt-6 max-w-3xl text-balance text-5xl text-white drop-shadow-sm md:text-7xl">
              {t("home.hero.titleA")}
              <span className="mt-3 block font-display text-lg font-semibold leading-snug text-gold-400 md:text-2xl">
                {t("home.hero.titleB")}
              </span>
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-relaxed text-forest-100/90 md:text-lg">
              {t("home.hero.lead")}
            </p>
            <p className="mt-6 max-w-2xl font-display text-lg font-bold text-gold-300 drop-shadow-sm md:text-xl">
              {t("home.hero.closing")}
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link href="/contact" className={buttonLinkClasses("gold", "xl")}>
                {t("common.bookConsultation")}
                <FaArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <a
                href={waLink("Hello S19 Herbal Clinic, I would like to inquire about a consultation or treatment.")}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonLinkClasses("glass", "xl")}
              >
                <FaWhatsapp className="h-4 w-4 text-gold-400" aria-hidden />
                {t("home.hero.whatsapp")}
              </a>
            </div>
          </BlurIn>
        </Container>
      </section>

      {/* CLAIM BANNER */}
      <div className="bg-gold-400">
        <Container className="flex items-center justify-center gap-3 py-3.5 md:py-4">
          <FaStarOfLife className="h-4 w-4 shrink-0 text-forest-950" aria-hidden />
          <p className="text-center text-sm font-extrabold uppercase tracking-wide text-forest-950 md:text-[15px]">
            {t("home.hero.claim")}
          </p>
        </Container>
      </div>

      {/* TREATMENT PROGRAMS (merged with Why S19 principles) */}
      <Section>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:col-span-5 lg:self-start">
            <Reveal>
              <Kicker>{t("home.programs.kicker")}</Kicker>
              <h2 className="mt-4">{t("home.programs.title")}</h2>
              <p className="mt-5 text-[15px] leading-relaxed text-muted">
                {t("home.programs.lead")}
              </p>
              <div className="mt-7 space-y-4 border-t border-line pt-7">
                {clinicalPrinciples.map((p) => (
                  <div key={p.title} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-forest-100 text-forest-800">
                      <FaRegCircleCheck className="h-3.5 w-3.5" aria-hidden />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-ink">{p.title}</h3>
                      <p className="mt-0.5 text-sm leading-relaxed text-muted">{p.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/programs" className={buttonLinkClasses("primary", "lg", "mt-8")}>
                {t("common.viewAllPrograms")}
                <FaArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </Reveal>
          </div>
          <div className="lg:col-span-7">
            {treatmentPrograms.slice(0, 3).map((p, i) => (
              <ScaleIn key={p.slug} delay={i * 0.08}>
                <div className="group border-b border-line">
                  <Link href={`/programs#${p.slug}`} className="flex items-start gap-5 py-6 transition-colors">
                    <span className="font-display text-3xl font-semibold text-forest-200 transition-colors group-hover:text-gold-500">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-ink transition-colors group-hover:text-forest-800">
                        {p.title}
                      </h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted">{p.short}</p>
                    </div>
                    <FaArrowRight className="mt-2 h-4 w-4 shrink-0 text-forest-400 transition-transform group-hover:translate-x-1 group-hover:text-forest-700" aria-hidden />
                  </Link>
                </div>
              </ScaleIn>
            ))}
          </div>
        </div>
      </Section>

      {/* FEATURED REMEDIES */}
      <Section className="bg-white">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Reveal>
            <Kicker>{t("home.catalog.kicker")}</Kicker>
            <h2 className="mt-3">{t("home.catalog.title")}</h2>
            <p className="mt-3 max-w-xl text-[15px] text-muted">
              {t("home.catalog.lead")}
            </p>
          </Reveal>
          <Link href="/shop" className={buttonLinkClasses("primary", "md")}>
            {t("common.viewCatalog")}
          </Link>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.slice(0, 3).map((p, i) => (
            <ScaleIn key={p.id} delay={i * 0.08}>
              <ProductCard product={p} />
            </ScaleIn>
          ))}
        </div>
        <p className="mt-6 text-sm text-muted">
          {t("home.catalog.note")}
        </p>
      </Section>

      {/* TELEHEALTH (merged with the 3 care links) - full-bleed image band */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <img
          src={S19_ASSETS.photos.patientRecords}
          alt="S19 staff recording patient health records at the clinic office"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-forest-950/95 via-forest-950/80 to-forest-950/40" />
        <Container className="relative z-10">
          <StaggerGroup className="grid gap-4 sm:grid-cols-3">
            {careLinks.map((c) => (
              <StaggerItem key={c.href}>
                <Link
                  href={c.href}
                  className="flex h-full items-center gap-4 rounded-lg border border-white/20 bg-white/10 p-5 backdrop-blur-sm transition-all hover:border-gold-400/60 hover:bg-white/15"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/25 bg-white/10">
                    <img src={c.icon} alt="" className="h-5 w-5" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold text-white">{c.title}</h3>
                    <span className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-gold-400">
                      {c.label}
                      <FaArrowRight className="h-2.5 w-2.5" aria-hidden />
                    </span>
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerGroup>

          <div className="mt-14 grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-6">
              <Reveal delay={0.05}>
                <Kicker dark>{t("home.tele.kicker")}</Kicker>
                <h2 className="mt-5 text-balance text-white">
                  {t("home.tele.title")}
                </h2>
                <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-forest-100/90">
                  {t("home.tele.lead")}
                </p>
                <a
                  href={waLink("Hello S19 Herbal Clinic, I would like to book a Tele-health online consultation.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonLinkClasses("gold", "xl", "mt-8")}
                >
                  <FaGlobe className="h-4 w-4" aria-hidden />
                  {t("home.tele.cta")}
                </a>
              </Reveal>
            </div>
            <StaggerGroup className="space-y-0 lg:col-span-6">
              {telehealthSteps.map((ts) => (
                <StaggerItem key={ts.step}>
                  <div className="flex items-start gap-5 border-b border-white/15 py-6 first:pt-0 last:border-0">
                    <span className="font-display text-4xl font-semibold text-gold-400">{ts.step}</span>
                    <div>
                      <h3 className="text-lg font-bold text-white">{ts.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-forest-100/85">{ts.text}</p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerGroup>
          </div>
        </Container>
      </section>

      {/* BOOKING (merged with the 4 steps) */}
      <section className="relative overflow-hidden border-y border-forest-900 bg-forest-950 py-16 md:py-24">
        <div className="pointer-events-none absolute -top-20 right-0 h-72 w-72 rounded-full bg-gold-400/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />
        <Container className="relative z-10">
          <StaggerGroup className="mb-14 grid gap-px overflow-hidden rounded-lg border border-forest-800 bg-forest-800 sm:grid-cols-2 lg:grid-cols-4">
            {bookingSteps.map((s) => (
              <StaggerItem key={s.n} className="bg-forest-950 p-6">
                <span className="font-display text-3xl font-semibold text-gold-400">{s.n}</span>
                <h3 className="mt-2 text-base font-bold text-white">{s.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-forest-200/80">{s.text}</p>
              </StaggerItem>
            ))}
          </StaggerGroup>

          <div className="mb-14 rounded-lg border border-gold-400/40 bg-gold-400/10 px-6 py-5">
            <div className="flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1 sm:justify-start">
              <p className="font-display text-lg font-bold text-white sm:text-xl">{t("home.consultFee.title")}</p>
              <p className="font-display text-lg font-bold text-gold-400 sm:text-xl">{formatFcfa(10000)}</p>
            </div>
            <p className="mt-1 text-center text-sm text-forest-100/90 sm:text-left">{t("home.consultFee.note")}</p>
          </div>

          <Link
            href="/contact#accommodation"
            className="group mb-14 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gold-400/40 bg-gold-400/10 px-6 py-5 transition-colors hover:border-gold-400/70 hover:bg-gold-400/15"
          >
            <p className="max-w-2xl text-sm leading-relaxed text-forest-100">
              <FaBed className="mr-2 inline h-4 w-4 text-gold-400" aria-hidden />
              {t("home.booking.accommodation")}
            </p>
            <span className="inline-flex items-center gap-2 text-sm font-bold text-gold-300 transition-colors group-hover:text-gold-200">
              {t("home.booking.accommodationLink")}
              <FaArrowRight className="h-3.5 w-3.5" aria-hidden />
            </span>
          </Link>

          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <Reveal>
                <Kicker dark>{t("home.booking.kicker")}</Kicker>
                <h2 className="mt-4 text-white">{t("home.booking.title")}</h2>
                <p className="mt-5 max-w-md text-[15px] leading-relaxed text-forest-200">
                  {t("home.booking.lead")}
                </p>
                <ul className="mt-8 space-y-4 text-sm text-forest-200">
                  <li className="flex items-start gap-3">
                    <FaWhatsapp className="mt-1 h-4 w-4 shrink-0 text-gold-400" aria-hidden />
                    <span>{t("home.booking.whatsapp", { phone: localizedClinic(locale).phone })}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <FaClock className="mt-1 h-4 w-4 shrink-0 text-gold-400" aria-hidden />
                    <span>{t("home.booking.hours", { hours: localizedClinic(locale).hours })}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <FaMapLocationDot className="mt-1 h-4 w-4 shrink-0 text-gold-400" aria-hidden />
                    <span>{localizedClinic(locale).address}.</span>
                  </li>
                </ul>
              </Reveal>
            </div>
            <Reveal delay={0.1}>
              <div className="rounded-lg border border-forest-800 bg-white p-6 shadow-lift md:p-9">
                <BookingForm />
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* TESTIMONIALS - marquee */}
      <Section>
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <Kicker center>{t("home.testimonials.kicker")}</Kicker>
            <h2 className="mt-4">{t("home.testimonials.title")}</h2>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <a
                href="#home-video-reviews"
                className="inline-flex items-center gap-2 rounded-full border border-forest-200 bg-white px-5 py-2.5 text-sm font-semibold text-forest-800 shadow-sm transition-colors hover:border-gold-400 hover:text-forest-950"
              >
                <FaCirclePlay className="h-4 w-4 text-gold-500" aria-hidden />
                {t("home.testimonials.watchVideos")}
              </a>
            </div>
          </div>
        </Reveal>
        <Reveal className="mt-12">
          <div className="relative overflow-hidden">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-cream to-transparent sm:w-24" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-cream to-transparent sm:w-24" />
            <div
              className="marquee-track flex w-max animate-marquee hover:[animation-play-state:paused]"
              style={{ animationDuration: "60s" }}
            >
              {[0, 1].map((copy) => (
                <div key={copy} className="flex shrink-0" aria-hidden={copy === 1}>
                  {testimonials.map((test) => (
                    <figure
                      key={`${copy}-${test.name}`}
                      className="mx-2.5 flex h-full w-[300px] flex-col rounded-lg border border-line bg-white p-7 shadow-card transition-shadow hover:shadow-lift sm:w-[340px]"
                    >
                      <div className="flex items-center gap-1 text-gold-500">
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
              ))}
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mt-10 text-center">
            <Link href="/patient-stories" className={buttonLinkClasses("primary", "lg")}>
              {t("home.testimonials.cta")}
              <FaArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        </Reveal>
      </Section>

      {/* VIDEO TESTIMONIALS - featured patient review + link to the full library */}
      <section
        id="home-video-reviews"
        className="relative scroll-mt-20 overflow-hidden border-t border-forest-900 bg-forest-950 py-16 md:py-24"
      >
        <div className="pointer-events-none absolute -top-20 left-1/4 h-72 w-72 rounded-full bg-gold-400/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />
        <Container className="relative z-10">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <Kicker dark center>{t("home.videos.kicker")}</Kicker>
              <h2 className="mt-4 text-white">{t("home.videos.title")}</h2>
              <p className="mt-4 text-[15px] leading-relaxed text-forest-200">
                {t("home.videos.lead")}
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="mx-auto mt-12 max-w-3xl">
              {featuredVideo ? (
                <div className="overflow-hidden rounded-2xl border border-white/15 bg-forest-900/50 shadow-lift">
                  <StoryVideo url={featuredVideo.url} blocked={featuredVideoBlocked} bare />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/15 bg-forest-900/50 px-8 py-14 text-center">
                  <FaCirclePlay className="h-8 w-8 text-gold-400" aria-hidden />
                  <p className="max-w-sm text-sm leading-relaxed text-forest-200">
                    {t("home.videos.empty")}
                  </p>
                </div>
              )}
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link href="/live-reviews" className={buttonLinkClasses("gold", "xl")}>
                <FaCirclePlay className="h-4 w-4" aria-hidden />
                {t("home.videos.cta")}
              </Link>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* LOCATION - full-bleed image band */}
      <section className="relative overflow-hidden py-24 md:py-28">
        <img
          src={S19_ASSETS.photos.bloodPressure}
          alt="S19 staff measuring a patient's blood pressure in the Bafoussam clinic"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-forest-950/95 via-forest-950/75 to-forest-950/35" />
        <Container className="relative z-10">
          <Reveal>
            <Kicker dark>{t("home.location.kicker")}</Kicker>
            <h2 className="mt-4 max-w-xl text-balance text-white">{t("home.location.title")}</h2>
          </Reveal>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {[
              {
                icon: <FaMapLocationDot className="h-5 w-5 text-gold-400" aria-hidden />,
                title: t("home.location.clinic"),
                lines: ["Immeuble Cathédrale, 3rd Floor", "Apartment E305, Bafoussam"],
              },
              {
                icon: <FaClock className="h-5 w-5 text-gold-400" aria-hidden />,
                title: t("home.location.hours"),
                lines: ["Monday – Saturday: 8:00 AM – 6:00 PM", "Tele-Health follow-ups: scheduled"],
              },
              {
                icon: <FaGlobe className="h-5 w-5 text-gold-400" aria-hidden />,
                title: t("home.location.coverage"),
                lines: ["Cameroon: Nationwide — Douala, Yaoundé, Bamenda, Buea and more", "International: worldwide express"],
              },
            ].map((c, i) => (
              <ScaleIn key={c.title} delay={i * 0.08}>
                <div className="h-full rounded-lg border border-white/20 bg-white/10 p-7 backdrop-blur-sm">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/25 bg-white/10">
                    {c.icon}
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-white">{c.title}</h3>
                  {c.lines.map((l) => (
                    <p key={l} className="mt-1 text-sm leading-relaxed text-forest-100/85">
                      {l}
                    </p>
                  ))}
                </div>
              </ScaleIn>
            ))}
          </div>
          <Reveal delay={0.15}>
            <Link href="/location" className={buttonLinkClasses("secondary", "lg", "mt-10")}>
              {t("common.visitLocationPage")}
              <FaArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </Reveal>
        </Container>
      </section>

      {/* FAQ */}
      <Section>
        <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
          <Reveal>
            <Kicker>{t("home.faq.kicker")}</Kicker>
            <h2 className="mt-4">{t("home.faq.title")}</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted">
              {t("home.faq.lead")}
            </p>
          </Reveal>
          <div className="divide-y divide-line rounded-lg border border-line bg-white shadow-card">
            {faqs.map((f) => (
              <details key={f.question} className="group">
                <summary className="flex cursor-pointer items-center justify-between gap-4 px-6 py-5 text-[15px] font-semibold text-ink transition-colors hover:text-forest-800">
                  {f.question}
                  <FaChevronDown className="h-3.5 w-3.5 shrink-0 text-forest-500 transition-transform group-open:rotate-180" aria-hidden />
                </summary>
                <p className="px-6 pb-5 text-sm leading-relaxed text-muted">{f.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </Section>

      <CTABand />
    </>
  );
}