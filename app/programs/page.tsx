import type { Metadata } from "next";
import { Section, Container } from "@/components/ui/container";
import { Kicker } from "@/components/ui/heading";
import { PageHero } from "@/components/ui/page-hero";
import { CTABand } from "@/components/sections/cta-band";
import { Reveal, RevealLeft, StaggerGroup, StaggerItem } from "@/components/ui/motion";
import { buttonLinkClasses } from "@/components/ui/button";
import { localizedPrograms } from "@/lib/data/programs";
import { CLINIC, waLink } from "@/lib/site";
import { S19_ASSETS } from "@/lib/site-assets";
import { FaWhatsapp, FaRegCircleCheck, FaArrowRight } from "react-icons/fa6";
import Link from "next/link";
import { getServerLocale, serverT } from "@/lib/i18n-server";
import { canonicalMeta } from "@/lib/seo";

const HERO_IMG = S19_ASSETS.photos.consultationAdvice;

export async function generateMetadata(): Promise<Metadata> {
  const t = await serverT();
  return {
    title: t("programs.meta.title"),
    description: t("programs.meta.description"),
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
    ...canonicalMeta("/programs"),
  };
}

export default async function ProgramsPage() {
  const t = await serverT();
  const locale = await getServerLocale();
  const treatmentPrograms = localizedPrograms(locale);
  return (
    <>
      <PageHero
        eyebrow={t("programs.hero.eyebrow")}
        title={t("programs.hero.title")}
        lead={t("programs.hero.lead")}
        image={HERO_IMG}
        alt={t("programs.hero.alt")}
      />

      <Section>
        <RevealLeft>
          <div className="max-w-2xl">
            <Kicker>{t("programs.kicker")}</Kicker>
            <h2 className="mt-3">{t("programs.title")}</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted">
              {t("programs.intro")}
            </p>
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
                <p className="mt-2.5 text-sm leading-relaxed text-muted">{p.short}</p>
                <p className="mt-3 text-[15px] leading-relaxed text-ink/80">{p.detail}</p>

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

        <Reveal delay={0.1}>
          <div className="relative mt-12 overflow-hidden rounded-lg bg-forest-950 p-8 md:p-10">
            <div className="pointer-events-none absolute -top-16 right-0 h-56 w-56 rounded-full bg-gold-400/10 blur-3xl" />
            <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
              <div>
                <h3 className="text-xl font-bold text-white">{t("programs.notSure.title")}</h3>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-forest-200">
                  {t("programs.notSure.text", { brand: CLINIC.brand, phone: CLINIC.phone })}
                </p>
              </div>
              <Link
                href="/contact"
                className="inline-flex h-11 items-center rounded-lg bg-gold-500 px-5 text-sm font-bold text-forest-950 transition-colors hover:bg-gold-400"
              >
                {t("programs.bookCta")}
              </Link>
            </div>
          </div>
        </Reveal>
      </Section>

      {/* THERAPIES WE PERFORM */}
      <section className="relative overflow-hidden py-24 md:py-28">
        <img
          src={S19_ASSETS.photos.electrolysis}
          alt={t("programs.therapies.alt")}
          className="absolute inset-0 h-full w-full object-cover"
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
                      t("programs.therapies.item3"),
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <FaRegCircleCheck className="mt-1 h-4 w-4 shrink-0 text-gold-400" aria-hidden />
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

      <CTABand title={t("programs.cta.title")} text={t("programs.cta.text")} />
    </>
  );
}