import type { Metadata } from "next";
import Link from "next/link";
import { Container, Section } from "@/components/ui/container";
import { Kicker } from "@/components/ui/heading";
import { buttonLinkClasses } from "@/components/ui/button";
import { ProductCard } from "@/components/ui/product-card";
import { BookingForm } from "@/components/sections/booking-form";
import { BlurIn, Reveal, ScaleIn, StaggerGroup, StaggerItem } from "@/components/ui/motion";
import { VideoCarousel } from "@/components/home/video-carousel";
import { getProducts } from "@/lib/catalog";
import { getApprovedTestimonials } from "@/lib/testimonials";
import { getActiveVideoReviews } from "@/lib/video-reviews";
import { isVideoEmbedBlocked } from "@/lib/video-probe";
import { localizedFaqs } from "@/lib/data/programs";
import { localizedHomePathway } from "@/lib/data/philosophy";
import {
  localizedAccommodationAmenities,
  localizedCareComponents,
  localizedHerbalSafetyKeywords,
  localizedHomePrograms,
  localizedPersonalizedCareElements,
} from "@/lib/data/home-content";
import { localizedClinic, waLink } from "@/lib/site";
import { getServerLocale, serverT } from "@/lib/i18n-server";
import { formatFcfa } from "@/lib/utils";
import { canonicalMeta, imageGalleryJsonLd } from "@/lib/seo";
import { resolveClinicPhoto } from "@/lib/image-registry";
import { ClinicPhotoFill } from "@/components/seo/clinic-photo-image";
import { JsonLd } from "@/components/seo/json-ld";

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
  FaCirclePlay,
  FaBed,
  FaFlask,
  FaPersonCircleCheck,
  FaShieldHalved,
  FaBookOpen,
  FaStethoscope,
  FaBolt,
  FaAppleWhole,
  FaPersonRunning,
  FaGraduationCap,
  FaChartLine,
  FaCalendarCheck,
} from "react-icons/fa6";

/**
 * Section 7's elements, one icon each, in the order the brief lists them.
 * Keyed to the element rather than picked by index, so inserting or reordering
 * an element cannot leave the wrong icon beside it.
 */
const CARE_ELEMENT_ICONS = [
  FaStethoscope, // Medical History Review
  FaFlask, // Laboratory Assessment
  FaPersonCircleCheck, // Herbal Support
  FaBolt, // Clinic-Based Therapies
  FaAppleWhole, // Nutrition
  FaPersonRunning, // Lifestyle Medicine
  FaGraduationCap, // Health Education
  FaChartLine, // Progress Monitoring
  FaCalendarCheck, // Follow-Up
] as const;

const FEATURED_SLUGS = ["s19-herbal-wine-reserve", "s19-sozo", "s19-malaria-typhoid-combo"];

/**
 * The two CTA styles the brief permits: one primary for booking, one
 * secondary for reading. Declared at module scope, not inside the component,
 * because a component created during render remounts its subtree every pass.
 * `className` lets a call site sit the button on a dark band.
 */
function PrimaryCta({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link href={href} className={buttonLinkClasses("primary", "lg", className)}>
      {children}
      <FaArrowRight className="h-3.5 w-3.5" aria-hidden />
    </Link>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Herbal Clinic in Bafoussam, Cameroon – Science-Based Natural Medicine",
    description:
      "S19 Herbal Clinic: science-based herbal medicine in Bafoussam, Cameroon. Individualized natural programs for diabetes, hypertension, prostate health, and women's health. Telehealth consultations, delivery across Cameroon and shipping to supported international destinations.",
    alternates: { canonical: canonicalMeta("/").alternates?.canonical },
    openGraph: {
      ...canonicalMeta("/").openGraph,
      title: "S19 Herbal Clinic – Natural Healing, Lasting Wellness",
      description:
        "Science-based herbal medicine clinic in Bafoussam, Cameroon. Telehealth consultations, delivery across Cameroon and shipping to supported international destinations.",
    },
    twitter: {
      card: "summary_large_image",
      title: "S19 Herbal Clinic – Natural Healing, Lasting Wellness",
      description:
        "Science-based herbal medicine clinic in Bafoussam, Cameroon. Telehealth consultations, delivery across Cameroon and shipping to supported international destinations.",
    },
  };
}

export default async function HomePage() {
  const t = await serverT();
  const locale = await getServerLocale();
  const clinic = localizedClinic(locale);

  const pathway = localizedHomePathway(locale);
  const homePrograms = localizedHomePrograms(locale);
  const careComponents = localizedCareComponents(locale);
  const safetyKeywords = localizedHerbalSafetyKeywords(locale);
  const personalElements = localizedPersonalizedCareElements(locale);
  const amenities = localizedAccommodationAmenities(locale);
  const faqs = localizedFaqs(locale);

  // Photographs are resolved through the registry so each one carries its true
  // intrinsic size and its alt text in the visitor's language, rather than a
  // hardcoded English string that only ever describes the English site.
  const heroPhoto = resolveClinicPhoto("shopCounter", locale);
  const careAccessPhoto = resolveClinicPhoto("patientRecords", locale);
  const products = await getProducts();
  const featured = FEATURED_SLUGS
    .map((slug) => products.find((p) => p.slug === slug))
    .filter((p): p is NonNullable<typeof p> => typeof p !== "undefined");
  const testimonials = await getApprovedTestimonials(12, locale);
  const videoReviews = await getActiveVideoReviews();
  const videoItems = await Promise.all(
    videoReviews.map(async (v) => ({
      url: v.url,
      title: v.title,
      blocked: await isVideoEmbedBlocked(v.url),
    }))
  );

  return (
    <>
      {/* ImageGallery structured data for the three photographs the home page
          displays. Derived from the image registry, so it can never claim an
          image the page does not show. */}
      <JsonLd data={imageGalleryJsonLd("/", locale)} />

      {/* ---------- 01 HERO ---------- */}
      <section className="relative flex min-h-[86vh] items-center overflow-hidden bg-forest-950">
        {/* The hero is the Largest Contentful Paint element: eager, high fetch
            priority. `fill` because it is cropped to the viewport. */}
        <ClinicPhotoFill
          photo={heroPhoto.photo}
          alt={heroPhoto.alt}
          lcp
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-forest-950/95 via-forest-950/75 to-forest-950/30" />
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-forest-950/90 via-transparent to-transparent" />

        <Container className="relative z-10 w-full py-24 md:py-32">
          <BlurIn>
            <h1 className="mt-6 max-w-3xl text-balance text-4xl text-white drop-shadow-sm md:text-6xl">
              {t("home.hero.titleA")}
              <span className="mt-3 block font-display text-lg font-semibold leading-snug text-gold-400 md:text-2xl">
                {t("home.hero.titleB")}
              </span>
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-relaxed text-forest-100/90 md:text-lg">
              {t("home.hero.lead")}
            </p>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-forest-100/80">
              {t("home.hero.lead2")}
            </p>
            {/* Exactly one primary style and one secondary style, per the
                brief. Gold is the booking action; glass is the reading action.
                Nothing else on the page introduces a third style for these two
                jobs. */}
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/contact" className={buttonLinkClasses("gold", "xl")}>
                {t("home.hero.ctaBook")}
                <FaArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link href="/programs" className={buttonLinkClasses("glass", "xl")}>
                {t("home.hero.ctaPrograms")}
                <FaArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
            <p className="mt-6 text-xs font-medium tracking-wide text-forest-200/80 md:text-sm">
              {t("home.hero.trust")}
            </p>
          </BlurIn>
        </Container>
      </section>

      {/* ---------- 02 MORE THAN SYMPTOM MANAGEMENT ---------- */}
      <Section>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <Reveal>
              <Kicker>{t("home.whole.kicker")}</Kicker>
              <h2 className="mt-4">{t("home.whole.title")}</h2>
              <p className="mt-3 font-display text-base font-semibold text-forest-700">
                {t("home.whole.subtitle")}
              </p>
              <p className="mt-5 text-[15px] leading-relaxed text-muted">{t("home.whole.lead")}</p>
            </Reveal>
          </div>
          <div className="lg:col-span-7">
            <Reveal delay={0.08}>
              <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-ink">
                {t("home.whole.depends")}
              </p>
              <StaggerGroup className="mt-5 grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {careComponents.map((c) => (
                  <StaggerItem key={c} className="flex items-start gap-2.5">
                    <FaRegCircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-forest-600" aria-hidden />
                    <span className="text-[15px] leading-relaxed text-ink/85">{c}</span>
                  </StaggerItem>
                ))}
              </StaggerGroup>
              <p className="mt-7 border-l-2 border-gold-400 pl-5 font-display text-base font-bold leading-relaxed text-ink">
                {t("home.whole.closing")}
              </p>
              <div className="mt-7">
                <PrimaryCta href="/about">{t("home.whole.cta")}</PrimaryCta>
              </div>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* ---------- 03 S19 PATIENT PATHWAY ---------- */}
      <Section className="bg-cream">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <Kicker center>{t("home.pathway.kicker")}</Kicker>
            <h2 className="mt-4">{t("home.pathway.title")}</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted">{t("home.pathway.lead")}</p>
          </div>
        </Reveal>
        {/* Six cards. Stacks one-per-row below `sm`, two columns above. Never
            squeezes: `lg:grid-cols-3` only once there is room for the text. */}
        <StaggerGroup className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pathway.map((step, i) => (
            <StaggerItem key={step.step}>
              <div className="flex h-full flex-col rounded-lg border border-line bg-white p-6 shadow-card">
                {/* Number only. A tick beside each step implied these steps are
                    already done or verified; they are what the patient is
                    moving through, so the numeral carries the sequence and
                    nothing else does. */}
                <span className="font-display text-2xl font-semibold text-gold-500">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 text-base font-bold text-ink">{step.step}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{step.text}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>
        <Reveal delay={0.12}>
          <div className="mt-10 text-center">
            <PrimaryCta href="/contact">{t("home.pathway.cta")}</PrimaryCta>
          </div>
        </Reveal>
      </Section>

      {/* ---------- 04 AREAS WE SUPPORT ---------- */}
      <Section>
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <Kicker>{t("home.areas.kicker")}</Kicker>
              <h2 className="mt-4">{t("home.areas.title")}</h2>
              <p className="mt-4 text-[15px] leading-relaxed text-muted">{t("home.areas.lead")}</p>
            </div>
            <PrimaryCta href="/programs">{t("home.areas.cta")}</PrimaryCta>
          </div>
        </Reveal>
        <StaggerGroup className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {homePrograms.map((p) => (
            <StaggerItem key={p.slug}>
              <Link
                href={p.href}
                className="group flex h-full flex-col rounded-lg border border-line bg-white p-6 shadow-card transition-all hover:border-forest-300 hover:shadow-lift"
              >
                <h3 className="text-base font-bold text-ink transition-colors group-hover:text-forest-800">
                  {p.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{p.text}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-forest-700">
                  {t("common.viewAllPrograms")}
                  <FaArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" aria-hidden />
                </span>
              </Link>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </Section>

      {/* ---------- 05 SCIENCE-BASED HERBALISM ---------- */}
      <section className="relative overflow-hidden bg-forest-950 py-20 md:py-28">
        <div className="pointer-events-none absolute -top-24 left-1/3 h-72 w-72 rounded-full bg-gold-400/10 blur-3xl" />
        <Container className="relative z-10">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <Kicker dark center>{t("home.science.kicker")}</Kicker>
              <h2 className="mt-4 text-balance text-white">{t("home.science.title")}</h2>
              <p className="mt-3 font-display text-base font-semibold text-gold-400">
                {t("home.science.subtitle")}
              </p>
              <p className="mt-5 text-[15px] leading-relaxed text-forest-200">
                {t("home.science.lead")}
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <ul className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-2.5">
              {safetyKeywords.map((k) => (
                <li
                  key={k}
                  className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[13px] font-semibold text-forest-100 backdrop-blur-sm"
                >
                  {k}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.12}>
            <p className="mx-auto mt-9 max-w-2xl text-center text-[15px] leading-relaxed text-forest-200">
              {t("home.science.closing")}
            </p>
            <div className="mt-8 text-center">
              <Link href="/about" className={buttonLinkClasses("gold", "lg")}>
                <FaBookOpen className="h-4 w-4" aria-hidden />
                {t("home.science.cta")}
              </Link>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* ---------- 06 NOT ANTI-CONVENTIONAL ---------- */}
      <Section className="bg-white">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <Kicker center>{t("home.conventional.kicker")}</Kicker>
            <h2 className="mt-4 text-center text-balance">{t("home.conventional.title")}</h2>
            <div className="mt-7 space-y-5 text-[15px] leading-relaxed text-ink/85">
              <p>{t("home.conventional.p1")}</p>
              <p>{t("home.conventional.p2")}</p>
              <p>{t("home.conventional.p3")}</p>
            </div>
            <div className="mt-7 flex items-start gap-3 rounded-lg border border-gold-400/50 bg-gold-400/10 px-5 py-4">
              <FaShieldHalved className="mt-0.5 h-5 w-5 shrink-0 text-forest-800" aria-hidden />
              <p className="text-sm font-semibold leading-relaxed text-forest-950">
                {t("home.conventional.safety")}
              </p>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ---------- 07 PERSONALIZED CARE ---------- */}
      <Section>
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <Kicker center>{t("home.personal.kicker")}</Kicker>
            <h2 className="mt-4 text-balance">{t("home.personal.title")}</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted">{t("home.personal.lead")}</p>
          </div>
        </Reveal>
        <StaggerGroup className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {personalElements.map((el, i) => {
            const Icon = CARE_ELEMENT_ICONS[i] ?? FaRegCircleCheck;
            return (
              <StaggerItem key={el}>
                <div className="flex h-full items-center gap-3 rounded-lg border border-line bg-white px-5 py-4 shadow-card">
                  <Icon className="h-5 w-5 shrink-0 text-forest-700" aria-hidden />
                  <span className="text-sm font-bold text-ink">{el}</span>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerGroup>
        <Reveal delay={0.12}>
          <p className="mx-auto mt-9 max-w-2xl border-t border-line pt-7 text-center text-[15px] leading-relaxed text-muted">
            {t("home.personal.closing")}
          </p>
        </Reveal>
      </Section>

      {/* ---------- 08 IN-PERSON + TELE-HEALTH, WITH THE BOOKING FORM ---------- */}
      <section className="relative overflow-hidden border-y border-forest-900 bg-forest-950 py-20 md:py-28">
        <ClinicPhotoFill
          photo={careAccessPhoto.photo}
          alt={careAccessPhoto.alt}
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-forest-950/95 via-forest-950/85 to-forest-950/60" />
        <Container className="relative z-10">
          <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <Reveal>
                <Kicker dark>{t("home.careWherever.kicker")}</Kicker>
                <h2 className="mt-4 text-balance text-white">{t("home.careWherever.title")}</h2>
                <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-forest-100/90">
                  {t("home.careWherever.lead")}
                </p>

                {/* Tele-Health is a first-class option here, not a footnote. */}
                <div className="mt-8 flex flex-wrap gap-3">
                  <a
                    href={waLink(
                      "Hello S19 Herbal Clinic, I would like to book a Tele-Health consultation."
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonLinkClasses("gold", "lg")}
                  >
                    <FaGlobe className="h-4 w-4" aria-hidden />
                    {t("home.careWherever.tele")}
                  </a>
                  <Link href="/contact" className={buttonLinkClasses("glass", "lg")}>
                    {t("home.careWherever.inPerson")}
                  </Link>
                </div>

                <div className="mt-8 rounded-lg border border-gold-400/40 bg-gold-400/10 px-6 py-5">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <p className="font-display text-lg font-bold text-white">
                      {t("home.consultFee.title")}
                    </p>
                    <p className="font-display text-lg font-bold text-gold-400">
                      {formatFcfa(10000)}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-forest-100/90">{t("home.consultFee.note")}</p>
                </div>

                <ul className="mt-8 space-y-4 text-sm text-forest-200">
                  <li className="flex items-start gap-3">
                    <FaWhatsapp className="mt-1 h-4 w-4 shrink-0 text-gold-400" aria-hidden />
                    <span>{t("home.booking.whatsapp", { phone: clinic.phone })}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <FaClock className="mt-1 h-4 w-4 shrink-0 text-gold-400" aria-hidden />
                    <span>{t("home.booking.hours", { hours: clinic.hours })}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <FaMapLocationDot className="mt-1 h-4 w-4 shrink-0 text-gold-400" aria-hidden />
                    <span>{clinic.address}.</span>
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

      {/* ---------- 09 PATIENT ACCOMMODATION ---------- */}
      <Section className="bg-cream">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <Kicker>{t("home.accommodation.kicker")}</Kicker>
            <h2 className="mt-4">{t("home.accommodation.title")}</h2>
            <p className="mt-3 font-display text-base font-semibold text-forest-700">
              {t("home.accommodation.subtitle")}
            </p>
            <p className="mt-5 text-[15px] leading-relaxed text-muted">
              {t("home.accommodation.lead")}
            </p>
            <div className="mt-7">
              <Link href="/contact#accommodation" className={buttonLinkClasses("primary", "lg")}>
                <FaBed className="h-4 w-4" aria-hidden />
                {t("home.accommodation.cta")}
              </Link>
            </div>
          </Reveal>
          <StaggerGroup className="grid gap-3 sm:grid-cols-2">
            {amenities.map((a) => (
              <StaggerItem key={a}>
                <div className="flex h-full items-start gap-2.5 rounded-lg border border-line bg-white px-5 py-4 shadow-card">
                  <FaRegCircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-forest-600" aria-hidden />
                  <span className="text-sm font-semibold leading-relaxed text-ink/85">{a}</span>
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </Section>

      {/* ---------- 10 PATIENT EXPERIENCES ---------- */}
      <Section>
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <Kicker center>{t("home.experiences.kicker")}</Kicker>
            <h2 className="mt-4">{t("home.experiences.title")}</h2>
            <p className="mt-3 font-display text-base font-semibold text-forest-700">
              {t("home.experiences.subtitle")}
            </p>
            <p className="mt-4 text-[15px] leading-relaxed text-muted">
              {t("home.experiences.lead")}
            </p>
          </div>
        </Reveal>

        {/* The required disclaimer sits directly above the testimonials. Above,
            not below and not on another page, so it is read before the claims. */}
        <Reveal delay={0.06}>
          <div className="mx-auto mt-8 flex max-w-3xl items-start gap-3 rounded-lg border border-line bg-cream px-5 py-4">
            <FaShieldHalved className="mt-0.5 h-4 w-4 shrink-0 text-forest-700" aria-hidden />
            <p className="text-[13px] leading-relaxed text-muted">
              {t("home.experiences.disclaimer")}
            </p>
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
                        <span className="mt-1 block text-xs font-medium italic text-muted">
                          {test.program}
                        </span>
                      </figcaption>
                    </figure>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <PrimaryCta href="/patient-stories">{t("home.experiences.cta")}</PrimaryCta>
            <a
              href="#home-video-reviews"
              className={buttonLinkClasses("outline", "lg")}
            >
              <FaCirclePlay className="h-4 w-4 text-gold-500" aria-hidden />
              {t("home.videos.cta")}
            </a>
          </div>
        </Reveal>
      </Section>

      {/* ---------- VIDEO REVIEWS ---------- */}
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
              <p className="mt-4 text-[15px] leading-relaxed text-forest-200">{t("home.videos.lead")}</p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            {videoItems.length > 0 ? (
              <VideoCarousel items={videoItems} />
            ) : (
              <div className="mx-auto mt-12 flex max-w-3xl flex-col items-center gap-3 rounded-2xl border border-white/15 bg-forest-900/50 px-8 py-14 text-center">
                <FaCirclePlay className="h-8 w-8 text-gold-400" aria-hidden />
                <p className="max-w-sm text-sm leading-relaxed text-forest-200">
                  {t("home.videos.empty")}
                </p>
              </div>
            )}
          </Reveal>
        </Container>
      </section>

      {/* ---------- 11 FINAL CTA + HEALTH INFORMATION NOTICE ---------- */}
      <section className="relative overflow-hidden bg-forest-950 py-20 md:py-28">
        <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-gold-400/10 blur-3xl" />
        <Container className="relative z-10">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <Kicker dark center>{t("home.final.kicker")}</Kicker>
              <h2 className="mt-4 text-balance text-white">{t("home.final.title")}</h2>
              <p className="mt-5 text-[15px] leading-relaxed text-forest-200">{t("home.final.lead")}</p>
              <p className="mt-8 font-display text-xl font-bold leading-snug text-gold-300 drop-shadow-sm md:text-3xl">
                {t("home.final.statement")}
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link href="/contact" className={buttonLinkClasses("gold", "xl")}>
                {t("home.final.book")}
                <FaArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <a
                href={waLink(
                  "Hello S19 Herbal Clinic, I would like to book a consultation."
                )}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonLinkClasses("glass", "xl")}
              >
                <FaWhatsapp className="h-4 w-4 text-gold-400" aria-hidden />
                {t("home.final.whatsapp")}
              </a>
            </div>
          </Reveal>

          {/* The notice is the last thing on the page, not a footer link. */}
          <Reveal delay={0.12}>
            <div className="mx-auto mt-14 max-w-3xl rounded-lg border border-white/15 bg-forest-900/40 p-6">
              <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-gold-400">
                {t("home.final.noticeTitle")}
              </h3>
              <p className="mt-3 text-[13px] leading-relaxed text-forest-200/90">
                {t("home.final.notice")}
              </p>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* ---------- Retained below section 11: featured products and FAQ ----------
          The brief's order table ends at 11. These two are kept because the
          eleven sections do not already cover them:
            - products: none of the 11 shows a product. Section 2's closing
              line is explicitly about NOT selling products as the goal, and
              section 4 lists clinical programs, not catalogue items.
            - FAQ: 3 of its 5 questions restate sections 6 and 8, but
              "how should I take my remedies" and "what payment methods do you
              accept" appear nowhere in the eleven, and this file is the only
              consumer of `faqs`, so deleting the block deletes those answers
              from the whole site.
          The standalone Location block that used to sit here is gone: section 8
          prints `clinic.address` and `clinic.hours` verbatim, and the hero
          trust line already says "In-person care in Bafoussam". The extra
          detail it carried stays on /location, which /contact links to. */}
      <Section className="bg-white">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Reveal>
            <Kicker>{t("home.catalog.kicker")}</Kicker>
            <h2 className="mt-3">{t("home.catalog.title")}</h2>
            <p className="mt-3 max-w-xl text-[15px] text-muted">{t("home.catalog.lead")}</p>
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
        <p className="mt-6 text-sm text-muted">{t("home.catalog.note")}</p>
      </Section>

      <Section>
        <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
          <Reveal>
            <Kicker>{t("home.faq.kicker")}</Kicker>
            <h2 className="mt-4">{t("home.faq.title")}</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted">{t("home.faq.lead")}</p>
          </Reveal>
          <div className="divide-y divide-line rounded-lg border border-line bg-white shadow-card">
            {faqs.map((f) => (
              <details key={f.question} className="group">
                <summary className="flex cursor-pointer items-center justify-between gap-4 px-6 py-5 text-[15px] font-semibold text-ink transition-colors hover:text-forest-800">
                  {f.question}
                  <FaChevronDown
                    className="h-3.5 w-3.5 shrink-0 text-forest-500 transition-transform group-open:rotate-180"
                    aria-hidden
                  />
                </summary>
                <p className="px-6 pb-5 text-sm leading-relaxed text-muted">{f.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </Section>
    </>
  );
}