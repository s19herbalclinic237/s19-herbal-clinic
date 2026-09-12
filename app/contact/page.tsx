import type { Metadata } from "next";
import { Section } from "@/components/ui/container";
import { Kicker } from "@/components/ui/heading";
import { PageHero } from "@/components/ui/page-hero";
import { BookingForm } from "@/components/sections/booking-form";
import { Reveal } from "@/components/ui/motion";
import { CLINIC, waLink } from "@/lib/site";
import { S19_ASSETS } from "@/lib/site-assets";
import {
  FaWhatsapp,
  FaPhone,
  FaEnvelope,
  FaMapLocationDot,
  FaClock,
} from "react-icons/fa6";

export const metadata: Metadata = {
  title: "Contact & Book a Consultation",
  description:
    "Book a consultation or Tele-health session with S19 Herbal Clinic. Contact us by WhatsApp, phone, or email.",
};

const HERO_IMG = S19_ASSETS.photos.cupboardProducts;

const rows = [
  {
    icon: <FaPhone className="h-4 w-4 text-gold-400" aria-hidden />,
    label: "Phone & WhatsApp",
    value: CLINIC.phone,
    sub: "Tele-Health emergency line 24/7",
    href: `tel:${CLINIC.phoneHref}`,
  },
  {
    icon: <FaEnvelope className="h-4 w-4 text-gold-400" aria-hidden />,
    label: "Email",
    value: CLINIC.email,
    sub: "We reply within 24 hours",
    href: `mailto:${CLINIC.email}`,
  },
  {
    icon: <FaMapLocationDot className="h-4 w-4 text-gold-400" aria-hidden />,
    label: "Clinic Address",
    value: "Immeuble Cathédrale, 3rd Floor, Apartment E305",
    sub: "Bafoussam, Cameroon",
    href: "/location",
  },
  {
    icon: <FaClock className="h-4 w-4 text-gold-400" aria-hidden />,
    label: "Opening Hours",
    value: "Monday – Saturday: 8:00 AM – 6:00 PM",
    sub: "Tele-Health consultations available on request",
    href: undefined,
  },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact & Consultations"
        title="Book your consultation."
        lead="Generate a priority in-clinic appointment or a Tele-Health consultation. A member of our clinical team confirms your booking by phone or WhatsApp."
        image={HERO_IMG}
        alt="S19 Herbal Clinic remedy shelves and products"
      />

      <Section className="bg-white">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <Kicker>Consultation form</Kicker>
            <h2 className="mt-4">Tell us about your health.</h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted">
              Fill in the form to request a priority appointment or Tele-Health consultation. Our
              clinical team confirms your booking by phone or WhatsApp.
            </p>
            <div className="mt-8 flex flex-col gap-3">
              <a
                href={waLink("Hello S19 Herbal Clinic, I would like to inquire about a consultation or treatment.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-forest-800 px-6 text-[15px] font-semibold text-white transition-colors hover:bg-forest-900"
              >
                <FaWhatsapp className="h-4 w-4 text-gold-400" aria-hidden />
                Chat directly on WhatsApp
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