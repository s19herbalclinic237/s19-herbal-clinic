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
  FaMicroscope,
  FaGlobe,
  FaShieldHalved,
  FaArrowRight,
} from "react-icons/fa6";
import Link from "next/link";
import { getServerLocale, serverT } from "@/lib/i18n-server";
import { canonicalMeta } from "@/lib/seo";

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
];

export default async function AboutPage() {
  const t = await serverT();
  const locale = await getServerLocale();
  const coreStrengths = localizedCoreStrengths(locale);
  return (
    <>
      <PageHero
        eyebrow={t("about.hero.eyebrow")}
        title={t("about.hero.title")}
        lead={t("about.hero.lead", { brand: CLINIC.brand })}
        image={HERO_IMG}
        alt={t("about.hero.alt")}
      />

      {/* THE S19 PHILOSOPHY */}
      <Section>
        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          <RevealLeft>
            <Kicker>{t("about.phil.kicker")}</Kicker>
            <p className="mt-4 font-display text-2xl font-semibold leading-snug text-ink">
              {philosophyQuote}
            </p>
            <p className="mt-5 text-[15px] leading-relaxed text-muted">
              {t("about.phil.p1")}
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-ink/85">
              {whyQuestion}
            </p>
            <p className="mt-5 text-[15px] leading-relaxed text-muted">
              {t("about.phil.p2")}
            </p>
            <Link href="/programs" className={buttonLinkClasses("primary", "md", "mt-8")}>
              {t("about.phil.explorePrograms")}
              <FaArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </RevealLeft>

          <RevealRight delay={0.1}>
            <div className="rounded-lg border border-line bg-white p-6 shadow-card md:p-8">
              <h3 className="flex items-center gap-2.5 text-lg font-bold text-ink">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-forest-800 text-gold-400">
                  <FaMagnifyingGlass className="h-4 w-4" aria-hidden />
                </span>
                {t("about.phil.drivers")}
              </h3>
              <ul className="mt-6 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
                {philosophyDrivers.map((d) => (
                  <li key={d} className="flex items-start gap-2 text-sm leading-relaxed text-ink/80">
                    <FaCircleCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-forest-600" aria-hidden />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          </RevealRight>
        </div>
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

      {/* WE DO NOT TREAT BLINDLY + SCIENCE-BASED HERBALISM */}
      <Section>
        <div className="grid gap-6 lg:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-lg border border-line bg-white p-7 shadow-card md:p-9">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-forest-200 bg-forest-50 text-forest-800">
                <FaVial className="h-5 w-5" aria-hidden />
              </div>
              <h2 className="mt-5 text-2xl font-bold text-ink">{t("about.blind.title")}</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-muted">
                {t("about.blind.text")}
              </p>
              <ul className="mt-6 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
                {assessmentAreas.map((a) => (
                  <li key={a} className="flex items-start gap-2 text-sm leading-relaxed text-ink/80">
                    <FaRegCircleCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-forest-600" aria-hidden />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="h-full rounded-lg border border-line bg-white p-7 shadow-card md:p-9">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-forest-200 bg-forest-50 text-forest-800">
                <FaFlask className="h-5 w-5" aria-hidden />
              </div>
              <h2 className="mt-5 text-2xl font-bold text-ink">{t("about.science.title")}</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-muted">
                {t("about.science.text")}
              </p>
              <ul className="mt-6 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
                {herbalismConsiderations.map((c) => (
                  <li key={c} className="flex items-start gap-2 text-sm leading-relaxed text-ink/80">
                    <FaRegCircleCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-forest-600" aria-hidden />
                    {c}
                  </li>
                ))}
              </ul>
              <div className="mt-6 rounded-lg border border-gold-300 bg-gold-50 px-4 py-3 text-sm font-bold text-forest-900">
                {traditionalPlusModern}
              </div>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* HERBS ARE ONLY ONE PART */}
      <Section className="bg-white">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <Kicker center>{t("about.pillars.kicker")}</Kicker>
            <h2 className="mt-4">{t("about.pillars.title")}</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted">
              {t("about.pillars.text")}
            </p>
          </div>
        </Reveal>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {healthPillars.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.06}>
              <div className="group h-full rounded-lg border border-line bg-cream p-7 transition-all hover:border-forest-300 hover:shadow-lift">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-forest-200 bg-forest-50 text-forest-800 transition-transform group-hover:scale-110">
                  {pillarIcons[i]}
                </div>
                <h3 className="mt-5 text-lg font-bold text-ink">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{p.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* EDUCATION BEFORE MEDICATION + NOT ANTI-MEDICINE */}
      <section className="relative overflow-hidden border-y border-forest-900 bg-forest-950 py-16 md:py-24">
        <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-gold-400/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />
        <Container className="relative z-10">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <Reveal>
                <Kicker dark>{t("about.education.kicker")}</Kicker>
                <p className="mt-4 flex items-start gap-3 font-display text-2xl font-semibold leading-snug text-white">
                  <FaQuoteLeft className="mt-1 h-6 w-6 shrink-0 text-gold-400" aria-hidden />
                  “{educationQuote}”
                </p>
                <p className="mt-5 text-[15px] leading-relaxed text-forest-200">
                  {t("about.education.text")}
                </p>
                <ul className="mt-8 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                  {educationQuestions.map((q) => (
                    <li key={q} className="flex items-start gap-2.5 text-sm leading-relaxed text-forest-100">
                      <FaCircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" aria-hidden />
                      {q}
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
            <Reveal delay={0.1}>
              <div className="rounded-lg border border-forest-800 bg-forest-900/70 p-7 md:p-9">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gold-400 text-forest-950">
                  <FaScaleBalanced className="h-5 w-5" aria-hidden />
                </div>
                <h2 className="mt-5 text-2xl font-bold text-white">{t("about.notAnti.title")}</h2>
                <p className="mt-3 text-[15px] leading-relaxed text-forest-100/90">
                  {t("about.notAnti.text")}
                </p>
                <p className="mt-4 rounded-md border border-gold-400/40 bg-gold-400/10 px-4 py-3 font-display text-lg font-semibold text-gold-400">
                  {rightIntervention}
                </p>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* CHRONIC & METABOLIC DISEASE */}
      <Section>
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <Kicker>{t("about.metabolic.kicker")}</Kicker>
            <h2 className="mt-4">{t("about.metabolic.title")}</h2>
            <p className="mt-5 text-[15px] leading-relaxed text-muted">
              {t("about.metabolic.p1", { diabetesIntro })}
            </p>
            <div className="mt-8 rounded-lg border border-line bg-white p-7 shadow-card">
              <h3 className="flex items-center gap-2.5 text-lg font-bold text-ink">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-forest-800 text-gold-400">
                  <FaHeartPulse className="h-4 w-4" aria-hidden />
                </span>
                {t("about.metabolic.diabetesTitle")}
              </h3>
              <ol className="mt-5 space-y-4">
                {diabetesGoals.map((g, i) => (
                  <li key={g.title} className="flex gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-forest-100 text-xs font-bold text-forest-900">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-ink">{g.title}</p>
                      <p className="mt-0.5 text-sm leading-relaxed text-muted">{g.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="mt-5 border-t border-line pt-4 text-sm font-bold text-forest-800">
                {diabetesJourney}
              </p>
              <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900">
                {type1Warning}
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="rounded-lg border border-line bg-white p-7 shadow-card md:p-9">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-forest-200 bg-forest-50 text-forest-800">
                <FaChartLine className="h-5 w-5" aria-hidden />
              </div>
              <h2 className="mt-5 text-2xl font-bold text-ink">{t("about.measure.title")}</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-muted">
                {t("about.measure.text")}
              </p>
              <ul className="mt-6 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
                {measurableOutcomes.map((o) => (
                  <li key={o} className="flex items-start gap-2 text-sm leading-relaxed text-ink/80">
                    <FaRegCircleCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-forest-600" aria-hidden />
                    {o}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* PERSONALIZED & PARTICIPATORY */}
      <Section className="bg-white">
        <div className="grid gap-6 lg:grid-cols-3">
          <Reveal>
            <div className="h-full rounded-lg border border-line bg-white p-7 shadow-card">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-forest-200 bg-forest-50 text-forest-800">
                <FaUserGear className="h-5 w-5" aria-hidden />
              </div>
              <h3 className="mt-5 text-xl font-bold text-ink">{t("about.personalized.title")}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {t("about.personalized.text")}
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.07}>
            <div className="h-full rounded-lg border border-line bg-white p-7 shadow-card">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-forest-200 bg-forest-50 text-forest-800">
                <FaUsers className="h-5 w-5" aria-hidden />
              </div>
              <h3 className="mt-5 text-xl font-bold text-ink">{t("about.participation.title")}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {t("about.participation.text")}
              </p>
              <ul className="mt-4 space-y-2">
                {participation.map((p) => (
                  <li key={p} className="flex items-center gap-2 text-sm text-ink/80">
                    <FaRegCircleCheck className="h-3.5 w-3.5 shrink-0 text-forest-600" aria-hidden />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={0.14}>
            <div className="h-full rounded-lg border border-line bg-white p-7 shadow-card">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-forest-200 bg-forest-50 text-forest-800">
                <FaArrowsRotate className="h-5 w-5" aria-hidden />
              </div>
              <h3 className="mt-5 text-xl font-bold text-ink">{t("about.monitoring.title")}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {t("about.monitoring.text")}
              </p>
            </div>
          </Reveal>
        </div>
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