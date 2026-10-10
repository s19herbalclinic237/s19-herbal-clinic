import type { Metadata } from "next";
import { Section, Container } from "@/components/ui/container";
import { Kicker } from "@/components/ui/heading";
import { PageHero } from "@/components/ui/page-hero";
import { CTABand } from "@/components/sections/cta-band";
import { Reveal } from "@/components/ui/motion";
import { localizedTelehealthSteps } from "@/lib/data/programs";
import { CLINIC, waLink } from "@/lib/site";
import { S19_ASSETS } from "@/lib/site-assets";
import {
  FaWhatsapp,
  FaShieldHalved,
  FaFlask,
  FaClock,
  FaPaperPlane,
  FaRegCircleCheck,
  FaUserDoctor,
  FaVideo,
  FaGlobe,
  FaMapLocationDot,
} from "react-icons/fa6";
import { getServerLocale, serverT } from "@/lib/i18n-server";
import { formatEur, formatFcfa, formatUsd } from "@/lib/utils";
import { canonicalMeta } from "@/lib/seo";

const HERO_IMG = S19_ASSETS.photos.patientRecords;

export async function generateMetadata(): Promise<Metadata> {
  const t = await serverT();
  return {
    title: t("tele.meta.title"),
    description: t("tele.meta.description"),
    keywords: [
      "herbal telehealth consultation",
      "online herbal doctor consultation",
      "virtual naturopathic consultation Cameroon",
      // Two of these used to promise worldwide delivery by a named courier. Both
      // are gone: the delivery guide forbids guaranteeing every country and
      // forbids naming a courier company.
      "herbal medicine delivery Cameroon",
      "international herbal shipping",
      "online consultation Bafoussam",
      "téléconsultation phytothérapie Cameroun",
      "consultation en ligne médecin traditionnel",
      "médecine naturelle à distance",
      "livraison internationale plantes médicinales",
    ],
    ...canonicalMeta("/telehealth"),
  };
}

export default async function TelehealthPage() {
  const t = await serverT();
  const locale = await getServerLocale();
  const telehealthSteps = localizedTelehealthSteps(locale);
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
                {formatFcfa(5000)}
              </p>
              <p className="text-sm text-muted">
                ≈ {formatUsd(5000)} · {formatEur(5000)}
              </p>
              {/* The brief requires the foreign figures to be visibly approximate,
                  not just prefixed with a symbol. */}
              <p className="mt-1 text-xs text-muted">{t("tele.price.approx")}</p>
            </div>
          </div>
        </Reveal>
      </Section>

      {/* Advantages */}
      <Section className="bg-white">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <Kicker center>{t("tele.advantages.kicker")}</Kicker>
            <h2 className="mt-4">{t("tele.advantages.title")}</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted">{t("tele.advantages.lead")}</p>
          </div>
        </Reveal>
        <div className="mx-auto mt-10 grid max-w-4xl gap-3 sm:grid-cols-2">
          {[
            t("tele.adv1"),
            t("tele.adv2"),
            t("tele.adv3"),
            t("tele.adv4"),
            t("tele.adv5"),
            t("tele.adv6"),
            t("tele.adv7"),
            t("tele.adv8"),
            t("tele.adv9"),
            t("tele.adv10"),
            t("tele.adv11"),
            t("tele.adv12"),
          ].map((item) => (
            <div key={item} className="flex items-start gap-3 rounded-lg border border-line bg-cream p-4">
              <FaRegCircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-forest-700" aria-hidden />
              <p className="text-sm leading-relaxed text-ink/85">{item}</p>
            </div>
          ))}
        </div>
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

      {/* ---------- Product delivery (Cameroon/International Delivery guide, §04) ----------

          This adds the guide's separated domestic/international copy. Step 02 of the
          process above already says a prescribed package "is safely shipped to your
          city or country", and that line stays: the brief and the guide both
          explicitly require keeping the message that Tele-Health patients receive
          their products after assessment and prescription. This block qualifies it
          with the actual coverage rather than contradicting it, which is why it
          reads as detail rather than as a competing promise. */}
      <Section>
          <Reveal>
            <div className="mx-auto max-w-4xl overflow-hidden rounded-lg border border-line bg-white shadow-card">
              <div className="border-b border-line bg-mist px-7 py-5">
                <Kicker>{t("tele.delivery.kicker")}</Kicker>
                <h2 className="mt-3">{t("tele.delivery.title")}</h2>
              </div>
              <div className="grid md:grid-cols-2">
                {/* Domestic first and equal weight: the guide says explicitly not to
                    make international delivery more prominent than Cameroon delivery. */}
                <div className="border-b border-line p-7 md:border-b-0 md:border-r">
                  <p className="flex items-center gap-2 text-sm font-bold text-forest-800">
                    <FaMapLocationDot className="h-4 w-4 text-forest-600" aria-hidden />
                    {t("tele.delivery.cameroonLabel")}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    {t("tele.delivery.cameroon")}
                  </p>
                </div>
                <div className="p-7">
                  <p className="flex items-center gap-2 text-sm font-bold text-forest-800">
                    <FaGlobe className="h-4 w-4 text-forest-600" aria-hidden />
                    {t("tele.delivery.internationalLabel")}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    {t("tele.delivery.international")}
                  </p>
                </div>
              </div>
              <p className="border-t border-line bg-cream px-7 py-5 text-sm leading-relaxed text-ink/85">
                {t("tele.delivery.close")}
              </p>
            </div>
          </Reveal>
        </Section>

      {/* Which option */}
      <Section>
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <Kicker center>{t("tele.options.kicker")}</Kicker>
            <h2 className="mt-4">{t("tele.options.title")}</h2>
          </div>
        </Reveal>
        <div className="mx-auto mt-10 grid max-w-4xl gap-5 md:grid-cols-2">
          <Reveal>
            <div className="flex h-full items-start gap-4 rounded-lg border border-line bg-white p-7 shadow-card">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-forest-800 text-white">
                <FaUserDoctor className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <h3 className="text-lg font-bold text-forest-900">{t("tele.options.inPerson.title")}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{t("tele.options.inPerson.text")}</p>
              </div>
            </div>
          </Reveal>
          <Reveal>
            <div className="flex h-full items-start gap-4 rounded-lg border border-line bg-white p-7 shadow-card">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gold-500 text-forest-950">
                <FaVideo className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <h3 className="text-lg font-bold text-forest-900">{t("tele.options.online.title")}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{t("tele.options.online.text")}</p>
              </div>
            </div>
          </Reveal>
        </div>
        <Reveal>
          <p className="mx-auto mt-6 max-w-3xl rounded-lg border border-gold-200 bg-gold-50/60 px-5 py-4 text-center text-sm leading-relaxed text-ink/80">
            {t("tele.options.note")}
          </p>
        </Reveal>
      </Section>

      <CTABand title={t("tele.cta.title")} text={t("tele.cta.text")} />
    </>
  );
}