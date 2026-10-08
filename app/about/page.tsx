import type { Metadata } from "next";
import { Container, Section } from "@/components/ui/container";
import { Kicker } from "@/components/ui/heading";
import { CTABand } from "@/components/sections/cta-band";
import { PageHero } from "@/components/ui/page-hero";
import { Reveal, RevealLeft, RevealRight, ScaleIn } from "@/components/ui/motion";
import { buttonLinkClasses } from "@/components/ui/button";
import OrbitImages from "@/components/ui/orbit-images";
import { localizedCoreStrengths } from "@/lib/data/programs";
import {
  philosophyQuote,
  whyQuestion,
  philosophyDrivers,
  rootCauseSteps,
  assessmentAreas,
  herbalismConsiderations,
  traditionalPlusModern,
  healthPillars,
  educationQuote,
  educationQuestions,
  rightIntervention,
  diabetesIntro,
  diabetesGoals,
  diabetesJourney,
  type1Warning,
  measurableOutcomes,
  differentiators,
  participation,
  patientJourney,
  careBeyond,
  centralMessage,
  philosophyTagline,
  closingStatement,
} from "@/lib/data/philosophy";
import { CLINIC } from "@/lib/site";
import { S19_ASSETS } from "@/lib/site-assets";
import {
  FaMagnifyingGlass,
  FaVial,
  FaFlask,
  FaSeedling,
  FaGraduationCap,
  FaScaleBalanced,
  FaHeartPulse,
  FaChartLine,
  FaUserGear,
  FaUsers,
  FaArrowsRotate,
  FaRegCircleCheck,
  FaCircleCheck,
  FaQuoteLeft,
  FaLeaf,
  FaHandHoldingHeart,
  FaMicroscope,
  FaGlobe,
  FaShieldHalved,
  FaArrowRight,
} from "react-icons/fa6";
import Link from "next/link";
import { getServerLocale, serverT } from "@/lib/i18n-server";
import { canonicalMeta } from "@/lib/seo";
import { resolveClinicPhoto } from "@/lib/image-registry";
import { ClinicPhotoImage } from "@/components/seo/clinic-photo-image";
import { JsonLd } from "@/components/seo/json-ld";
import { imageGalleryJsonLd } from "@/lib/seo";

const HERO_IMG = S19_ASSETS.photos.labBeakers;

export async function generateMetadata(): Promise<Metadata> {
  const t = await serverT();
  return {
    title: t("about.meta.title"),
    description: t("about.meta.description"),
    keywords: [
      "about S19 Herbal Clinic",
      "root-cause healthcare Cameroon",
      "science-based herbalism",
      "African medicinal plants clinic",
      "integrative medicine Bafoussam",
      "traditional medicine clinic Cameroon",
      "herbal philosophy diabetes hypertension",
      "médecine traditionnelle Bafoussam",
      "phytothérapie fondée sur la science",
      "clinique intégrative Cameroun",
    ],
    ...canonicalMeta("/about"),
  };
}

const strengthIcons = [
  <FaMicroscope key="ind" className="h-5 w-5" aria-hidden />,
  <FaGlobe key="tel" className="h-5 w-5" aria-hidden />,
  <FaFlask key="std" className="h-5 w-5" aria-hidden />,
  <FaShieldHalved key="ww" className="h-5 w-5" aria-hidden />,
];

const pillarIcons = [
  <FaLeaf key="herb" className="h-5 w-5" aria-hidden />,
  <FaSeedling key="nut" className="h-5 w-5" aria-hidden />,
  <FaHeartPulse key="life" className="h-5 w-5" aria-hidden />,
  <FaChartLine key="met" className="h-5 w-5" aria-hidden />,
  <FaShieldHalved key="stress" className="h-5 w-5" aria-hidden />,
  <FaVial key="lab" className="h-5 w-5" aria-hidden />,
  <FaGraduationCap key="edu" className="h-5 w-5" aria-hidden />,
  // Non-Conventional Therapies: supportive care delivered alongside, never
  // instead of, herbal medicine and nutrition.
  <FaHandHoldingHeart key="nct" className="h-5 w-5" aria-hidden />,
];

export default async function AboutPage() {
  const t = await serverT();
  const locale = await getServerLocale();
  const coreStrengths = localizedCoreStrengths(locale);
  // The four photographs this page galleries. Allocated here rather than read
  // from the registry's page index so that adding a photo to the gallery is a
  // one-line change and the structured data below stays in step automatically.
  const clinicGallery = (["labTransfer", "pipetteTransfer", "pipetteReading", "nutritionBasket"] as const)
    .map((key) => resolveClinicPhoto(key, locale));
  return (
    <>
      {/* ImageGallery: names and describes every photograph this page displays,
          which is what supplies the text beside a result in Google Images. Built
          from the same registry as the markup, so the two cannot disagree. */}
      <JsonLd data={imageGalleryJsonLd("/about", locale)} />

      <PageHero
        eyebrow={t("about.hero.eyebrow")}
        title={t("about.hero.title")}
        lead={t("about.hero.lead", { brand: CLINIC.brand })}
        image={HERO_IMG}
        alt={t("about.hero.alt")}
      />

      {/* SECTION 1 - HERO / WHO WE ARE */}
      <Section>
        <Reveal>
          <div className="mx-auto max-w-4xl">
            <h1 className="font-display text-4xl font-semibold leading-snug text-ink md:text-5xl">
              About S19 Herbal Clinic
            </h1>
            <p className="mt-3 font-display text-xl font-semibold text-forest-800 md:text-2xl">
              Science-Based Herbalism. Personalized Care.
            </p>
            <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-ink/85 md:text-base">
              <p>
                {t("about.hero.lead", { brand: CLINIC.brand })}
              </p>
            </div>
          </div>
        </Reveal>
      </Section>

      {/* SECTION 2 - OUR PHILOSOPHY */}
      <Section className="bg-white">
        <Reveal>
          <div className="mx-auto max-w-4xl">
            <Kicker>{t("about.phil.kicker")}</Kicker>
            <h2 className="mt-4">{t("about.blind.title")}</h2>
            <div className="mt-5 space-y-3 text-[15px] leading-relaxed text-muted md:text-base">
              <p>{t("about.phil.p1")}</p>
              <p>{t("about.phil.p2")}</p>
            </div>
          </div>
        </Reveal>
      </Section>

      {/* ROOT-CAUSE METHOD */}
      <Section className="bg-white">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <Reveal>
              <Kicker>{t("about.rootcause.kicker")}</Kicker>
              <h2 className="mt-4">{t("about.rootcause.title")}</h2>
              <div className="mt-6 flex flex-wrap items-center gap-2">
                {rootCauseSteps.map((s, i) => (
                  <FragmentRow key={s} index={i}>
                    <span className="rounded-md border border-forest-200 bg-forest-50 px-3 py-1.5 text-sm font-bold text-forest-900">
                      {s}
                    </span>
                  </FragmentRow>
                ))}
              </div>
              <p className="mt-6 text-[15px] leading-relaxed text-muted">
                {t("about.rootcause.p1")}
              </p>
              <p className="mt-3 text-[15px] leading-relaxed text-muted">
                {t("about.rootcause.p2")}
              </p>
            </Reveal>
          </div>
          <div className="hidden lg:col-span-5 lg:block">
            <OrbitImages
              items={coreStrengths.map((s, i) => (
                <div
                  key={s.title}
                  className="flex h-full w-full flex-col items-start justify-center overflow-hidden rounded-lg border border-forest-100 bg-white p-5 shadow-card"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-forest-200 bg-forest-50 text-forest-800">
                    {strengthIcons[i]}
                  </div>
                  <h3 className="mt-3 text-[15px] font-bold text-ink">{s.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{s.text}</p>
                </div>
              ))}
              shape="ellipse"
              responsive
              baseWidth={1200}
              radiusX={380}
              radiusY={120}
              rotation={-6}
              duration={46}
              itemSize={220}
              direction="normal"
              fill
              centerContent={
                <div className="flex h-24 w-24 items-center justify-center rounded-full border border-gold-400 bg-forest-800 shadow-lift">
                  <FaLeaf className="h-8 w-8 text-gold-400" aria-hidden />
                </div>
              }
            />
          </div>
        </div>
      </Section>

      {/* SECTION 3 - SCIENCE-BASED HERBALISM */}
      <Section>
        <Reveal>
          <div className="mx-auto max-w-4xl">
            <Kicker>{t("about.sciencebased.kicker")}</Kicker>
            <h2 className="mt-4">{t("about.sciencebased.title")}</h2>
            <div className="mt-5 space-y-3 text-[15px] leading-relaxed text-muted md:text-base">
              <p>{t("about.sciencebased.p1")}</p>
              <p>{t("about.sciencebased.p2")}</p>
              <p>
                At S19, herbs are selected and used within a broader clinical context rather than simply matched to symptoms.
              </p>
            </div>
          </div>
        </Reveal>
      </Section>

      {/* SECTION 4 - HERBS ARE ONLY ONE PART OF S19 */}
      <Section className="bg-white">
        <Reveal>
          <div className="mx-auto max-w-4xl">
            <Kicker>{t("about.pillars.kicker")}</Kicker>
            <h2 className="mt-4">{t("about.pillars.title")}</h2>
            <div className="mt-5 space-y-3 text-[15px] leading-relaxed text-muted md:text-base">
              <p>
                S19 care may include individualized herbal support, nutrition and lifestyle guidance, health education, review of medical information, relevant investigations where appropriate, monitoring and follow-up.
              </p>
              <p>
                The purpose is not simply to dispense herbs. It is to help patients understand their health, participate in their care and follow a structured, individualized plan.
              </p>
            </div>
          </div>
        </Reveal>
      </Section>

      {/* SECTION 6 - EDUCATION BEFORE INTERVENTION */}
      <Section>
        <Reveal>
          <div className="mx-auto max-w-4xl">
            <Kicker>{t("about.education.kicker")}</Kicker>
            <h2 className="mt-4">{t("about.education.kicker")}</h2>
            <div className="mt-5 space-y-3 text-[15px] leading-relaxed text-muted md:text-base">
              <p>{t("about.education.text")}</p>
            </div>
          </div>
        </Reveal>
      </Section>

      {/* SECTION 8 - NOT ANTI-CONVENTIONAL MEDICINE */}
      <Section className="bg-white">
        <Reveal>
          <div className="mx-auto max-w-4xl">
            <Kicker>{t("about.notAnti.title")}</Kicker>
            <h2 className="mt-4">{t("about.notAnti.title")}</h2>
            <div className="mt-5 space-y-3 text-[15px] leading-relaxed text-muted md:text-base">
              <p>{t("about.notAnti.text")}</p>
            </div>
          </div>
        </Reveal>
      </Section>

      {/* SECTION 7 - MEASUREMENT MATTERS */}
      <Section>
        <Reveal>
          <div className="mx-auto max-w-4xl">
            <Kicker>{t("about.measure.title")}</Kicker>
            <h2 className="mt-4">{t("about.measure.title")}</h2>
            <div className="mt-5 space-y-3 text-[15px] leading-relaxed text-muted md:text-base">
              <p>{t("about.measure.text")}</p>
            </div>
          </div>
        </Reveal>
      </Section>

      {/* SECTION 11 - TYPE 1 DIABETES SAFETY NOTE */}
      <Section className="bg-white">
        <Reveal>
          <div className="mx-auto max-w-4xl">
            <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900">
              {type1Warning}
            </p>
          </div>
        </Reveal>
      </Section>

      {/* SECTION 9 - PERSONALIZED CARE & PATIENT PARTICIPATION */}
      <Section>
        <Reveal>
          <div className="mx-auto max-w-4xl">
            <Kicker>{t("about.personalized.title")}</Kicker>
            <h2 className="mt-4">{t("about.personalized.title")}</h2>
            <div className="mt-5 space-y-3 text-[15px] leading-relaxed text-muted md:text-base">
              <p>
                Two people can have the same diagnosis and still have very different health histories, medications, nutritional patterns, lifestyle factors and treatment needs.
              </p>
              <p>
                For that reason, S19 does not rely on a one-size-fits-all approach. Patient participation is also essential. Following agreed nutrition and lifestyle guidance, taking treatment as directed, providing requested updates and attending follow-up all contribute to better continuity of care.
              </p>
            </div>
          </div>
        </Reveal>
      </Section>

      {/* SECTION 10 - CONTINUOUS MONITORING */}
      <Section className="bg-white">
        <Reveal>
          <div className="mx-auto max-w-4xl">
            <Kicker>{t("about.monitoring.title")}</Kicker>
            <h2 className="mt-4">{t("about.monitoring.title")}</h2>
            <div className="mt-5 space-y-3 text-[15px] leading-relaxed text-muted md:text-base">
              <p>{t("about.monitoring.text")}</p>
            </div>
          </div>
        </Reveal>
      </Section>

      {/* WHAT MAKES S19 DIFFERENT */}
      <Section>
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <Kicker center>{t("about.different.kicker")}</Kicker>
            <h2 className="mt-4">{t("about.different.title")}</h2>
          </div>
        </Reveal>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {differentiators.map((d, i) => (
            <ScaleIn key={d.title} delay={i * 0.05}>
              <div className="group h-full rounded-lg border border-line bg-white p-6 transition-all hover:border-forest-300 hover:shadow-lift">
                <div className="flex h-10 w-10 items-center justify-center rounded-md border border-gold-300 bg-gold-50 text-forest-800 transition-transform group-hover:scale-110">
                  <FaRegCircleCheck className="h-4 w-4" aria-hidden />
                </div>
                <h3 className="mt-4 text-base font-bold text-ink">{d.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{d.text}</p>
              </div>
            </ScaleIn>
          ))}
        </div>
      </Section>

      {/* THE S19 PATIENT JOURNEY */}
      <Section className="bg-white">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <Kicker center>{t("about.journey.kicker")}</Kicker>
            <h2 className="mt-4">{t("about.journey.title")}</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted">
              {t("about.journey.text")}
            </p>
          </div>
        </Reveal>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {patientJourney.map((j, i) => (
            <Reveal key={j.step} delay={i * 0.05}>
              <div className="relative h-full rounded-lg border border-line bg-white p-6 shadow-card">
                <span className="font-display text-3xl font-semibold text-forest-100">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 text-base font-bold text-ink">{j.step}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{j.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* CARE BEYOND THE JOURNEY */}
      <Section>
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <Kicker center>{t("about.beyond.kicker")}</Kicker>
            <h2 className="mt-4">{t("about.beyond.title")}</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted">
              {t("about.beyond.text")}
            </p>
          </div>
        </Reveal>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {careBeyond.map((c, i) => (
            <Reveal key={c.title} delay={i * 0.05}>
              <div className="h-full rounded-lg border border-line bg-white p-6 shadow-card">
                <span className="font-display text-3xl font-semibold text-forest-100">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 text-base font-bold text-ink">{c.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{c.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* INSIDE THE CLINIC — photo gallery.
          Four real photographs of the laboratory and of clinic staff were on disk
          and referenced by nothing, so they could never surface in image search.
          They are the same images the sitemap and the ImageGallery structured
          data declare, drawn from one registry. */}
      <Section className="bg-mist">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <Kicker center>{t("about.gallery.kicker")}</Kicker>
            <h2 className="mt-4">{t("about.gallery.title")}</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted">
              {t("about.gallery.text")}
            </p>
          </div>
        </Reveal>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {clinicGallery.map((photo, i) => (
            <Reveal key={photo.photo.slug} delay={i * 0.05}>
              <figure className="h-full overflow-hidden rounded-xl border border-line bg-white shadow-card">
                <ClinicPhotoImage
                  src={photo.src}
                  alt={photo.alt}
                  width={photo.width}
                  height={photo.height}
                  sizes="(min-width: 1024px) 280px, (min-width: 640px) 45vw, 92vw"
                  className="aspect-[3/4] w-full object-cover"
                />
                <figcaption className="border-t border-line px-4 py-3 text-xs leading-relaxed text-muted">
                  {photo.photo.caption[locale]}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* CENTRAL MESSAGE */}
      <section className="relative overflow-hidden border-y border-forest-900 bg-forest-950 py-16 md:py-20">
        <div className="pointer-events-none absolute -top-20 left-0 h-72 w-72 rounded-full bg-gold-400/10 blur-3xl" />
        <Container className="relative z-10">
          <Reveal>
            <div className="mx-auto max-w-3xl text-center">
              <Kicker dark>{t("about.central.kicker")}</Kicker>
              <p className="mt-5 text-lg font-medium leading-relaxed text-white md:text-xl">
                {centralMessage}
              </p>
              <p className="mt-6 text-[15px] font-bold text-forest-200">
                {t("about.central.text")}
              </p>
              <p className="mt-8 text-sm font-semibold uppercase tracking-widest text-gold-400">
                {philosophyTagline}
              </p>
              <p className="mt-4 font-display text-xl font-bold text-white md:text-2xl">
                {closingStatement}
              </p>
            </div>
          </Reveal>
        </Container>
      </section>

      <CTABand title={t("about.cta.title")} text={t("about.cta.text")} />
    </>
  );
}

function FragmentRow({ index, children }: { index: number; children: React.ReactNode }) {
  return (
    <>
      {children}
      {index < rootCauseSteps.length - 1 ? (
        <span className="text-sm font-semibold text-forest-400" aria-hidden>
          →
        </span>
      ) : null}
    </>
  );
}