import type { Metadata } from "next";
import Link from "next/link";
import { Section, Container } from "@/components/ui/container";
import { Kicker } from "@/components/ui/heading";
import { buttonLinkClasses } from "@/components/ui/button";
import { CTABand } from "@/components/sections/cta-band";
import { Reveal, RevealLeft, StaggerGroup, StaggerItem } from "@/components/ui/motion";
import { getLocalizedServices } from "@/lib/services";
import { localizedProgramsPathway } from "@/lib/data/philosophy";
import { CLINIC, waLink } from "@/lib/site";
import { FaWhatsapp, FaRegCircleCheck, FaArrowRight, FaFlask, FaShieldHalved } from "react-icons/fa6";
import { getServerLocale, serverT } from "@/lib/i18n-server";
import { canonicalMeta } from "@/lib/seo";
import { clinicPhoto } from "@/lib/image-registry";
import { ClinicPhotoFill } from "@/components/seo/clinic-photo-image";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Personalized Herbal Treatment Programs in Bafoussam",
    description:
      "Individualized herbal treatment programs in Bafoussam, Cameroon: diabetes, hypertension, prostate and men's health, women's health and hormones, digestive and liver health, cancer support and nutrition.",
    keywords: [
      "herbal treatment programs Cameroon",
      "herbal medicine programs Bafoussam",
      "natural treatment for diabetes Bafoussam",
      "herbal support for high blood pressure",
      "prostate herbal treatment",
      "women's health herbal remedies",
      "herbal treatment malaria typhoid",
      "digestive health natural remedies",
      "integrative treatment programs Cameroon",
      "programme de phytothérapie Cameroun",
      "traitement naturel du diabète",
      "remède naturel pour la prostate",
    ],
    ...canonicalMeta("/services"),
  };
}

export default async function ServicesPage() {
  const t = await serverT();
  const locale = await getServerLocale();
  const treatmentPrograms = await getLocalizedServices(locale);
  const pathway = localizedProgramsPathway(locale);

  

  return (
    <>
      {/* ---------- HERO + brief §2 top-of-page statements ---------- */}
      <section className="relative overflow-hidden bg-forest-950 py-20 md:py-28">
        <ClinicPhotoFill
          photo={clinicPhoto("consultationAdvice")}
          alt={t("programs.hero.alt")}
          lcp
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-forest-950/95 via-forest-950/80 to-forest-950/45" />
        <Container className="relative z-10">
          <div className="max-w-3xl">
            <Kicker dark>{t("programs.hero.eyebrow")}</Kicker>
            <h1 className="mt-5 text-balance text-white">{t("programs.hero.title")}</h1>
            <div className="mt-7 space-y-5 text-[15px] leading-relaxed text-forest-100/90">
              <p>{t("programs.hero.p1")}</p>
              <p>{t("programs.hero.p2")}</p>
              <p>{t("programs.hero.p3")}</p>
            </div>
            <p className="mt-8 border-l-2 border-gold-400 pl-5 font-display text-lg font-bold leading-snug text-gold-300 md:text-xl">
              {t("programs.hero.tagline")}
            </p>
          </div>
        </Container>
      </section>

      {/* ---------- HOW S19 PROGRAMS WORK (brief §3) ---------- */}
      <Section>
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <Kicker center>{t("programs.pathway.kicker")}</Kicker>
            <h2 className="mt-4">{t("programs.pathway.title")}</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted">{t("programs.pathway.lead")}</p>
          </div>
        </Reveal>
        {/* Desktop: a horizontal run of six. Mobile: stacked cards. Both are
            the same list; only the grid changes at `lg`. */}
        <StaggerGroup className="mt-11 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {pathway.map((step, i) => (
            <StaggerItem key={step.step}>
              <div className="flex h-full flex-col rounded-lg border border-line bg-white p-5 shadow-card">
                <span className="font-display text-2xl font-semibold text-gold-500">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 text-sm font-bold uppercase tracking-wide text-forest-800">
                  {step.step}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted">{step.text}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </Section>

      {/* ---------- PUBLIC-FACING INVESTIGATION STATEMENT (brief §5) ---------- */}
      <Section className="bg-cream">
        <Reveal>
          <div className="mx-auto flex max-w-3xl items-start gap-4">
            <FaFlask className="mt-1 h-6 w-6 shrink-0 text-forest-700" aria-hidden />
            <div>
              <Kicker>{t("programs.investigation.kicker")}</Kicker>
              <p className="mt-3 text-[15px] leading-relaxed text-ink/80">
                {t("programs.investigation.text")}
              </p>
            </div>
          </div>
        </Reveal>
      </Section>

      {/* ---------- THE TEN PROGRAMS (brief §4) ---------- */}
      <Section>
        <RevealLeft>
          <div className="max-w-2xl">
            <Kicker>{t("programs.kicker")}</Kicker>
            <h2 className="mt-3">{t("programs.title")}</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted">{t("programs.intro")}</p>
          </div>
        </RevealLeft>

        <StaggerGroup className="mt-12 grid gap-5 lg:grid-cols-2">
          {treatmentPrograms.map((p, i) => (
            <StaggerItem key={p.slug}>
              <article
                id={p.slug}
                className="group flex h-full scroll-mt-28 flex-col rounded-lg border border-line bg-white p-7 shadow-card transition-all hover:border-forest-300 hover:shadow-lift md:p-9"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-forest-600 to-forest-900 font-display text-lg font-bold text-white shadow-lift transition-transform group-hover:scale-110">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="rounded-md border border-forest-200 bg-forest-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-forest-800">
                    {t("programs.badge")}
                  </span>
                </div>
                <h3 className="mt-5 text-xl font-bold text-ink">{p.title}</h3>
                <p className="mt-2.5 text-[15px] leading-relaxed text-ink/80">{p.short}</p>
                <p className="mt-3 text-sm leading-relaxed text-muted">{p.detail}</p>

                <div className="mt-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-forest-700">
                    {t("programs.supports")}
                  </p>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {p.conditions.map((c) => (
                      <li
                        key={c}
                        className="flex items-center gap-1.5 rounded-md border border-line bg-cream px-2.5 py-1.5 text-xs font-medium text-ink/80"
                      >
                        <FaRegCircleCheck className="h-3 w-3 text-forest-600" aria-hidden />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Boundary-of-care note. Rendered only where the brief requires
                    one, and always above the buttons so it is read before the
                    call to action rather than after. */}
                {p.note ? (
                  <div className="mt-5 flex items-start gap-2.5 rounded-md border border-gold-400/50 bg-gold-400/10 px-4 py-3">
                    <FaShieldHalved className="mt-0.5 h-4 w-4 shrink-0 text-forest-800" aria-hidden />
                    <p className="text-[13px] font-semibold leading-relaxed text-forest-950">
                      <span className="font-bold uppercase tracking-wide">
                        {p.noteKind === "safety"
                          ? t("programs.noteSafety")
                          : t("programs.noteImportant")}
                      </span>{" "}
                      {p.note}
                    </p>
                  </div>
                ) : null}

                <div className="mt-auto flex flex-wrap items-center gap-3 pt-7">
                  <a
                    href={waLink(`Hello S19, I'm inquiring about ${p.title} support.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 items-center gap-2 rounded-lg bg-forest-800 px-4 text-sm font-semibold text-white transition-colors hover:bg-forest-900"
                  >
                    <FaWhatsapp className="h-3.5 w-3.5" aria-hidden />
                    {t("programs.inquire")}
                  </a>
                  <Link
                    href="/contact"
                    className="inline-flex h-10 items-center gap-1.5 text-sm font-semibold text-forest-800 transition-colors hover:text-forest-900"
                  >
                    {t("programs.bookCta")}
                    <FaArrowRight className="h-3 w-3" aria-hidden />
                  </Link>
                </div>
              </article>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </Section>

      {/* ---------- PROGRAMS ARE NOT RETAIL PRODUCTS (brief §6) ---------- */}
      <Section className="bg-white">
        <Reveal>
          <div className="mx-auto max-w-3xl">
            <Kicker center>{t("programs.notRetail.kicker")}</Kicker>
            <h2 className="mt-4 text-center text-balance">{t("programs.notRetail.title")}</h2>
            <p className="mt-5 text-[15px] leading-relaxed text-ink/80">
              {t("programs.notRetail.text")}
            </p>
          </div>
        </Reveal>
      </Section>

      {/* ---------- SUPPORTIVE IN-CLINIC THERAPIES (brief §7) ---------- */}
      <section className="relative overflow-hidden py-24 md:py-28">
        <ClinicPhotoFill
          photo={clinicPhoto("electrolysis")}
          alt={t("programs.therapies.alt")}
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-forest-950/95 via-forest-950/80 to-forest-950/45" />
        <Container className="relative z-10">
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-6">
              <Reveal>
                <Kicker dark>{t("programs.therapies.kicker")}</Kicker>
                <h2 className="mt-5 text-balance text-white">{t("programs.therapies.title")}</h2>
                <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-forest-100/90">
                  {t("programs.therapies.text")}
                </p>
                <Link href="/contact" className={buttonLinkClasses("gold", "xl", "mt-8")}>
                  {t("programs.bookCta")}
                  <FaArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Reveal>
            </div>
            <div className="hidden lg:col-span-6 lg:block">
              <Reveal delay={0.1}>
                <div className="flex h-full flex-col gap-5 rounded-lg border border-white/20 bg-forest-950/60 p-8 backdrop-blur-md">
                  <h3 className="text-lg font-bold text-white">{t("programs.therapies.sessions")}</h3>
                  <ul className="space-y-4 text-sm leading-relaxed text-forest-100/85">
                    {[
                      t("programs.therapies.item1"),
                      t("programs.therapies.item2"),
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <FaRegCircleCheck
                          className="mt-1 h-4 w-4 shrink-0 text-gold-400"
                          aria-hidden
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            </div>
          </div>
        </Container>
      </section>

      {/* ---------- FINAL CTA (brief §8) ---------- */}
      <Section>
        <Reveal delay={0.1}>
          <div className="relative overflow-hidden rounded-lg bg-forest-950 p-8 md:p-12">
            <div className="pointer-events-none absolute -top-16 right-0 h-56 w-56 rounded-full bg-gold-400/10 blur-3xl" />
            <div className="relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
              <div className="max-w-xl">
                <h2 className="text-2xl font-bold text-white">{t("programs.notSure.title")}</h2>
                <p className="mt-3 text-[15px] leading-relaxed text-forest-200">
                  {t("programs.notSure.text", { brand: CLINIC.brand, phone: CLINIC.phone })}
                </p>
                <p className="mt-5 font-display text-base font-bold text-gold-300">
                  {t("programs.notSure.closing")}
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-3 sm:flex-row md:flex-col">
                <Link href="/contact" className={buttonLinkClasses("gold", "xl")}>
                  {t("programs.bookCta")}
                  <FaArrowRight className="h-4 w-4" aria-hidden />
                </Link>
                <a
                  href={waLink("Hello S19, I would like to book a consultation.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonLinkClasses("glass", "xl")}
                >
                  <FaWhatsapp className="h-4 w-4 text-gold-400" aria-hidden />
                  {t("programs.notSure.whatsapp")}
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </Section>

      <CTABand title={t("programs.cta.title")} text={t("programs.cta.text")} />
    </>
  );
}