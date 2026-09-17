import type { Metadata } from "next";
import { Section } from "@/components/ui/container";
import { Kicker } from "@/components/ui/heading";
import { PageHero } from "@/components/ui/page-hero";
import { BookingForm } from "@/components/sections/booking-form";
import { Reveal } from "@/components/ui/motion";
import { CLINIC, waLink } from "@/lib/site";
import { S19_ASSETS } from "@/lib/site-assets";
import { serverT } from "@/lib/i18n-server";
import {
  FaWhatsapp,
  FaPhone,
  FaEnvelope,
  FaMapLocationDot,
  FaClock,
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
    </>
  );
}