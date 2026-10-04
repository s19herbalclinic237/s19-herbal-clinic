import type { Metadata } from "next";
import { Section } from "@/components/ui/container";
import { Kicker } from "@/components/ui/heading";
import { PageHero } from "@/components/ui/page-hero";
import { BookingForm } from "@/components/sections/booking-form";
import { Reveal } from "@/components/ui/motion";
import { buttonLinkClasses } from "@/components/ui/button";
import { CLINIC, waLink } from "@/lib/site";
import { S19_ASSETS } from "@/lib/site-assets";
import { serverT } from "@/lib/i18n-server";
import {
  FaWhatsapp,
  FaPhone,
  FaEnvelope,
  FaMapLocationDot,
  FaClock,
  FaBed,
  FaWifi,
  FaTv,
  FaGlobe,
} from "react-icons/fa6";

const HERO_IMG = S19_ASSETS.photos.cupboardProducts;

export async function generateMetadata(): Promise<Metadata> {
  const t = await serverT();
  return {
    title: t("contact.meta.title"),
    description: t("contact.meta.description"),
  };
}

export default async function ContactPage() {
  const t = await serverT();
  const rows = [
    {
      icon: <FaPhone className="h-4 w-4 text-gold-400" aria-hidden />,
      label: t("contact.phoneLabel"),
      value: CLINIC.phone,
      sub: t("contact.phoneSub"),
      href: `tel:${CLINIC.phoneHref}`,
    },
    {
      icon: <FaEnvelope className="h-4 w-4 text-gold-400" aria-hidden />,
      label: t("contact.emailLabel"),
      value: CLINIC.email,
      sub: t("contact.emailSub"),
      href: `mailto:${CLINIC.email}`,
    },
    {
      icon: <FaMapLocationDot className="h-4 w-4 text-gold-400" aria-hidden />,
      label: t("contact.addressLabel"),
      value: t("contact.addressValue"),
      sub: t("contact.addressSub"),
      href: "/location",
    },
    {
      icon: <FaClock className="h-4 w-4 text-gold-400" aria-hidden />,
      label: t("contact.hoursLabel"),
      value: t("contact.hoursValue"),
      sub: t("contact.hoursSub"),
      href: undefined,
    },
  ];
  const accommodationPerks = [
    {
      icon: <FaBed className="h-4 w-4 text-gold-400" aria-hidden />,
      title: t("contact.accommodation.perkRoom.title"),
      text: t("contact.accommodation.perkRoom.text"),
    },
    {
      icon: <FaWifi className="h-4 w-4 text-gold-400" aria-hidden />,
      title: t("contact.accommodation.perkInternet.title"),
      text: t("contact.accommodation.perkInternet.text"),
    },
    {
      icon: <FaTv className="h-4 w-4 text-gold-400" aria-hidden />,
      title: t("contact.accommodation.perkTv.title"),
      text: t("contact.accommodation.perkTv.text"),
    },
  ];
  return (
    <>
      <PageHero
        eyebrow={t("contact.hero.eyebrow")}
        title={t("contact.hero.title")}
        lead={t("contact.hero.lead")}
        image={HERO_IMG}
        alt={t("contact.hero.alt")}
      />

      <Section className="bg-white">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <Kicker>{t("contact.form.kicker")}</Kicker>
            <h2 className="mt-4">{t("contact.form.title")}</h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted">
              {t("contact.form.text")}
            </p>
            <div className="mt-8 flex flex-col gap-3">
              <a
                href={waLink("Hello S19 Herbal Clinic, I would like to inquire about a consultation or treatment.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-forest-800 px-6 text-[15px] font-semibold text-white transition-colors hover:bg-forest-900"
              >
                <FaWhatsapp className="h-4 w-4 text-gold-400" aria-hidden />
                {t("contact.chatWhatsApp")}
              </a>
              <a
                href={`tel:${CLINIC.phoneHref}`}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-line-strong bg-white px-6 text-sm font-semibold text-ink shadow-sm transition-colors hover:border-forest-500 hover:text-forest-800"
              >
                <FaPhone className="h-4 w-4 text-forest-700" aria-hidden />
                {CLINIC.phone}
              </a>
            </div>
            <ul className="mt-8 divide-y divide-line overflow-hidden rounded-lg border border-line bg-white shadow-card">
              {rows.map((r) => {
                const inner = (
                  <li className="flex items-start gap-4 px-5 py-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-forest-950">
                      {r.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                        {r.label}
                      </p>
                      <p className="mt-0.5 text-[15px] font-bold text-ink">{r.value}</p>
                      <p className="text-sm text-muted">{r.sub}</p>
                    </div>
                  </li>
                );
                return r.href ? (
                  <a
                    key={r.label}
                    href={r.href}
                    target={r.href.startsWith("http") ? "_blank" : undefined}
                    rel={r.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="block transition-colors hover:bg-cream"
                  >
                    {inner}
                  </a>
                ) : (
                  <div key={r.label}>{inner}</div>
                );
              })}
            </ul>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="space-y-6">
              <div className="rounded-lg border border-line bg-cream p-6 shadow-card md:p-9">
                <BookingForm />
              </div>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ON-SITE ACCOMMODATION */}
      <div id="accommodation" className="scroll-mt-24">
        <Section className="!pt-6">
          <Reveal>
            <div className="overflow-hidden rounded-lg border border-line bg-white shadow-card">
              <div className="grid lg:grid-cols-2">
                <div className="relative overflow-hidden bg-forest-950 p-8 md:p-10">
                  <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gold-400/10 blur-3xl" />
                  <Kicker dark>{t("contact.accommodation.eyebrow")}</Kicker>
                  <h2 className="mt-3 text-white">{t("contact.accommodation.title")}</h2>
                  <p className="mt-4 text-[15px] leading-relaxed text-forest-200">
                    {t("contact.accommodation.text")}
                  </p>
                  <ul className="mt-7 space-y-4">
                    {accommodationPerks.map((perk) => (
                      <li key={perk.title} className="flex items-start gap-3.5">
                        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/20 bg-white/10">
                          {perk.icon}
                        </span>
                        <div>
                          <h3 className="text-sm font-bold text-white">{perk.title}</h3>
                          <p className="mt-0.5 text-sm leading-relaxed text-forest-200/85">{perk.text}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                  {/* Item 07 requires this as one sentence naming both inclusions;
                      the two perk cards above only imply them. */}
                  <p className="mt-6 border-t border-white/15 pt-5 text-sm leading-relaxed text-forest-100">
                    {t("contact.accommodation.includes")}
                  </p>
                  <a
                    href={waLink(
                      "Hello S19 Herbal Clinic, I am travelling from outside Bafoussam and would like to book a room with my appointment."
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonLinkClasses("gold", "md", "mt-8")}
                  >
                    <FaWhatsapp className="h-4 w-4" aria-hidden />
                    {t("contact.accommodation.cta")}
                  </a>
                </div>
                <div className="flex flex-col justify-center gap-6 bg-cream p-8 md:p-10">
                  <div className="rounded-lg border border-gold-400/40 bg-gold-400/10 px-5 py-4">
                    <p className="text-sm leading-relaxed text-forest-900">
                      {t("contact.accommodation.note")}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-forest-900/80">
                      {t("contact.accommodation.bookingNote")}
                    </p>
                  </div>
                  <p className="font-display text-xl font-semibold leading-snug text-forest-900 md:text-2xl">
                    {t("contact.accommodation.tagline")}
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </Section>
      </div>

      {/* ---------- Item 08 of the Contact & Accommodation guide ----------
          A new block for patients who cannot travel to Bafoussam, placed after
          the Accommodation section and before the footer, as the guide requires.
          It complements the accommodation section rather than replacing it: one is
          for people who will come to the clinic, this is for people who cannot.

          Domestic and international delivery are separate rows rather than one
          sentence, because the delivery guide requires them to be visually distinct
          and requires that international not be made more prominent than Cameroon. */}
      <Section className="!pt-0">
        <Reveal>
          <div className="overflow-hidden rounded-lg border border-line bg-white shadow-card">
            <div className="border-b border-line bg-mist px-7 py-6 md:px-9">
              <Kicker>{t("contact.noTravel.eyebrow")}</Kicker>
              <h2 className="mt-3">{t("contact.noTravel.title")}</h2>
              <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-muted">
                {t("contact.noTravel.text")}
              </p>
            </div>
            <div className="grid md:grid-cols-2">
              <div className="border-b border-line p-7 md:border-b-0 md:border-r md:p-8">
                <p className="flex items-center gap-2 text-sm font-bold text-forest-800">
                  <FaMapLocationDot className="h-4 w-4 text-forest-600" aria-hidden />
                  {t("contact.noTravel.cameroonLabel")}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {t("contact.noTravel.cameroon")}
                </p>
              </div>
              <div className="p-7 md:p-8">
                <p className="flex items-center gap-2 text-sm font-bold text-forest-800">
                  <FaGlobe className="h-4 w-4 text-forest-600" aria-hidden />
                  {t("contact.noTravel.internationalLabel")}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {t("contact.noTravel.international")}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line bg-cream px-7 py-6 md:px-9">
              <p className="max-w-2xl text-sm leading-relaxed text-ink/85">
                {t("contact.noTravel.close")}
              </p>
              <a
                href={waLink(
                  "Hello S19 Herbal Clinic, I cannot travel to Bafoussam. I would like to ask about Tele-Health consultation and product delivery."
                )}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonLinkClasses("primary", "md")}
              >
                <FaWhatsapp className="h-4 w-4" aria-hidden />
                {t("common.whatsappDr")}
              </a>
            </div>
          </div>
        </Reveal>
      </Section>
    </>
  );
}