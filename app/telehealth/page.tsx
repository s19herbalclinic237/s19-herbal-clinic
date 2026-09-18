import { Section, Container } from "@/components/ui/container";
import { Kicker } from "@/components/ui/heading";
import { PageHero } from "@/components/ui/page-hero";
import { CTABand } from "@/components/sections/cta-band";
import { Reveal } from "@/components/ui/motion";
import { telehealthSteps } from "@/lib/data/programs";
import { CLINIC, waLink } from "@/lib/site";
import { S19_ASSETS } from "@/lib/site-assets";
import { FaWhatsapp, FaShieldHalved, FaFlask, FaClock, FaPaperPlane } from "react-icons/fa6";
import { serverT } from "@/lib/i18n-server";
import { formatEur, formatFcfa, formatUsd } from "@/lib/utils";

const HERO_IMG = S19_ASSETS.photos.patientRecords;

export default async function TelehealthPage() {
  const t = await serverT();
  const modalities = [
    {
      title: t("tele.modality1.title"),
      text: t("tele.modality1.text"),
      icon: <FaPaperPlane className="h-5 w-5 text-white" aria-hidden />,
      tile: "from-forest-600 to-forest-900",
    },
    {
      title: t("tele.modality2.title"),
      text: t("tele.modality2.text"),
      icon: <FaFlask className="h-5 w-5 text-white" aria-hidden />,
      tile: "from-gold-500 to-gold-600",
    },
    {
      title: t("tele.modality3.title"),
      text: t("tele.modality3.text"),
      icon: <FaClock className="h-5 w-5 text-white" aria-hidden />,
      tile: "from-forest-500 to-forest-800",
    },
    {
      title: t("tele.modality4.title"),
      text: t("tele.modality4.text"),
      icon: <FaShieldHalved className="h-5 w-5 text-white" aria-hidden />,
      tile: "from-forest-700 to-forest-950",
    },
  ];
  return (
    <>
      <PageHero
        eyebrow={t("tele.hero.eyebrow")}
        title={t("tele.hero.title")}
        lead={t("tele.hero.lead")}
        image={HERO_IMG}
        alt={t("tele.hero.alt")}
      />

      {/* Price */}
      <Section>
        <Reveal>
          <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-4 rounded-lg border border-forest-200 bg-forest-50/70 p-6 text-center sm:flex-row sm:text-left md:p-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-forest-600">{t("tele.price.title")}</p>
              <p className="mt-2 text-[15px] leading-relaxed text-ink/80">{t("tele.price.text")}</p>
            </div>
            <div className="shrink-0 text-center sm:text-right">
              <p className="font-display text-2xl font-bold text-forest-900">
                {formatFcfa(10000)}
              </p>
              <p className="text-sm text-muted">
                ≈ {formatUsd(10000)} · {formatEur(10000)}
              </p>
            </div>
          </div>
        </Reveal>
      </Section>

      {/* Steps */}
      <Section>
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <Kicker center>{t("tele.steps.kicker")}</Kicker>
            <h2 className="mt-4">{t("tele.steps.title")}</h2>
          </div>
        </Reveal>
        <div className="mx-auto mt-12 max-w-3xl">
          {[
            ...telehealthSteps,
            {
              step: "04",
              title: t("tele.step4.title"),
              text: t("tele.step4.text"),
            },
          ].map((t, i) => (
            <Reveal key={t.step} delay={i * 0.06}>
              <div className="flex items-start gap-6 border-b border-line py-7 first:pt-0">
                <span className="font-display text-4xl font-semibold text-forest-200">{t.step}</span>
                <div>
                  <h3 className="text-lg font-bold text-ink">{t.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{t.text}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Modalities */}
      <Section className="bg-white">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <Kicker center>{t("tele.modalities.kicker")}</Kicker>
            <h2 className="mt-4">{t("tele.modalities.title")}</h2>
            <p className="mt-4 text-[15px] text-muted">
              {t("tele.modalities.text")}
            </p>
          </div>
        </Reveal>
        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {modalities.map((m, i) => (
            <Reveal key={m.title} delay={(i % 2) * 0.08}>
              <div className="flex h-full items-start gap-4 rounded-lg border border-line bg-cream p-7 transition-all hover:border-forest-300 hover:shadow-lift">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${m.tile} shadow-lift`}>
                  {m.icon}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-ink">{m.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{m.text}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <Container className="mt-12 flex flex-col gap-3 sm:flex-row">
          <a
            href={waLink("Hello S19 Herbal Clinic, I would like to book a Tele-health online consultation.")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-forest-800 px-6 text-[15px] font-semibold text-white transition-colors hover:bg-forest-900"
          >
            <FaWhatsapp className="h-4 w-4 text-gold-400" aria-hidden />
            {t("tele.bookVirtual")}
          </a>
          <a
            href={`tel:${CLINIC.phoneHref}`}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-line-strong bg-white px-6 text-sm font-semibold text-ink shadow-sm transition-colors hover:border-forest-500 hover:text-forest-800"
          >
            {CLINIC.phone}
          </a>
        </Container>
      </Section>

      <CTABand title={t("tele.cta.title")} text={t("tele.cta.text")} />
    </>
  );
}