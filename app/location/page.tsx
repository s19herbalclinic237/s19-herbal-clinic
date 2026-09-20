import type { Metadata } from "next";
import { Section } from "@/components/ui/container";
import { Kicker } from "@/components/ui/heading";
import { PageHero } from "@/components/ui/page-hero";
import { CTABand } from "@/components/sections/cta-band";
import { Reveal } from "@/components/ui/motion";
import { localizedClinic, waLink } from "@/lib/site";
import { S19_ASSETS } from "@/lib/site-assets";
import { deliveryZones } from "@/lib/data/programs";
import {
  FaMapLocationDot,
  FaClock,
  FaGlobe,
  FaWhatsapp,
  FaRegCircleCheck,
  FaArrowRight,
} from "react-icons/fa6";
import Link from "next/link";
import { getServerLocale, serverT } from "@/lib/i18n-server";

const HERO_IMG = S19_ASSETS.photos.bloodPressure;

export async function generateMetadata(): Promise<Metadata> {
  const t = await serverT();
  const clinic = localizedClinic(await getServerLocale());
  return {
    title: t("location.meta.title"),
    description: t("location.meta.description", { address: clinic.address }),
  };
}

export default async function LocationPage() {
  const t = await serverT();
  const clinic = localizedClinic(await getServerLocale());
  const info = [
    {
      icon: <FaMapLocationDot className="h-5 w-5 text-white" aria-hidden />,
      tile: "from-forest-600 to-forest-900",
      title: t("location.info.address"),
      lines: clinic.address.split(", "),
    },
    {
      icon: <FaClock className="h-5 w-5 text-white" aria-hidden />,
      tile: "from-gold-500 to-gold-600",
      title: t("location.info.hours"),
      lines: [clinic.hours, t("location.info.hoursLine2"), t("location.info.hoursLine3")],
    },
    {
      icon: <FaGlobe className="h-5 w-5 text-white" aria-hidden />,
      tile: "from-forest-500 to-forest-800",
      title: t("location.info.logistics"),
      lines: [
        t("location.info.logisticsLine1"),
        t("location.info.logisticsLine2"),
        t("location.info.logisticsLine3"),
      ],
    },
  ];
  return (
    <>
      <PageHero
        eyebrow={t("location.hero.eyebrow")}
        title={t("location.hero.title")}
        lead={t("location.hero.lead")}
        image={HERO_IMG}
        alt={t("location.hero.alt")}
      />

      <Section>
        <div className="grid gap-5 lg:grid-cols-3">
          {info.map((c, i) => (
            <Reveal key={c.title} delay={i * 0.08}>
              <div className="h-full rounded-lg border border-line bg-white p-8 shadow-card transition-all hover:border-forest-300 hover:shadow-lift">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${c.tile} shadow-lift`}>
                  {c.icon}
                </div>
                <h2 className="mt-5 text-lg font-bold text-ink">{c.title}</h2>
                <ul className="mt-3 space-y-1.5">
                  {c.lines.map((l) => (
                    <li key={l} className="text-sm leading-relaxed text-muted">
                      {l}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <div className="mt-12 grid gap-8 lg:grid-cols-5">
            <div className="overflow-hidden rounded-lg border border-line shadow-card lg:col-span-3">
              <iframe
                title={t("location.mapTitle")}
                src="https://www.google.com/maps?q=Immeuble+Cath%C3%A9drale,+Bafoussam,+Cameroon&output=embed"
                className="h-[360px] w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div className="relative overflow-hidden rounded-lg bg-forest-950 p-8 lg:col-span-2 md:p-9">
              <div className="pointer-events-none absolute -top-16 right-0 h-56 w-56 rounded-full bg-gold-400/10 blur-3xl" />
              <div className="relative">
                <Kicker dark>{t("location.deliver.kicker")}</Kicker>
                <h2 className="mt-3 text-2xl font-bold text-white">{t("location.deliver.title")}</h2>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {deliveryZones.map((z) => (
                    <li
                      key={z}
                      className="flex items-center gap-1.5 rounded-md border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm"
                    >
                      <FaRegCircleCheck className="h-3.5 w-3.5 text-gold-400" aria-hidden />
                      {z}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 rounded-lg border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold-400">
                    {t("location.deliver.infoTitle")}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-forest-100">
                    {t("location.deliver.infoText")}
                  </p>
                </div>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <a
                    href={waLink("Hello S19, I need directions to your Bafoussam clinic.")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-gold-500 px-5 text-sm font-bold text-forest-950 transition-colors hover:bg-gold-400"
                  >
                    <FaWhatsapp className="h-4 w-4" aria-hidden />
                    {t("location.directions")}
                  </a>
                  <Link
                    href="/contact"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/25 bg-white/10 px-5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/15"
                  >
                    {t("location.bookVisit")}
                    <FaArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </Section>

      <CTABand title={t("location.cta.title")} text={t("location.cta.text")} />
    </>
  );
}