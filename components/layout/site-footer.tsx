import Link from "next/link";
import { Container } from "@/components/ui/container";
import { CLINIC, waLink } from "@/lib/site";
import { S19_ASSETS } from "@/lib/site-assets";
import {
  FaWhatsapp,
  FaMapLocationDot,
  FaPhone,
  FaEnvelope,
  FaInstagram,
  FaFacebookF,
} from "react-icons/fa6";

const treatmentLinks = [
  { label: "Diabetes & Metabolic Health", href: "/programs#diabetes-metabolic" },
  { label: "Hypertension & Heart Health", href: "/programs#hypertension-cardiovascular" },
  { label: "Prostate & Men's Health", href: "/programs#prostate-mens-health" },
  { label: "Women's Reproductive Wellness", href: "/programs#womens-health-hormones" },
  { label: "Gastritis & Digestive Disorders", href: "/programs#digestive-gut-health" },
];

const companyLinks = [
  { label: "Home", href: "/" },
  { label: "Our Approach", href: "/about" },
  { label: "Herbal Catalog", href: "/shop" },
  { label: "Health Blog", href: "/blog" },
  { label: "Contact Us", href: "/contact" },
  { label: "Track Your Order", href: "/track" },
  { label: "Refund & Returns", href: "/refund-and-returns" },
  { label: "Privacy Policy", href: "/privacy" },
];

export function SiteFooter() {
  return (
    <footer className="relative border-t border-forest-900 bg-forest-950 text-forest-200">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: "url('/s19-pattern.png')",
          backgroundRepeat: "repeat",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-forest-950/55 via-forest-950/70 to-forest-950/80" />
      <Container className="relative z-10 grid gap-10 py-12 md:py-16 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div>
          <img
            src={S19_ASSETS.logos.fullDark}
            alt={`${CLINIC.brand} logo`}
            className="h-11 w-auto"
          />
          <p className="mt-3 max-w-xs text-lg font-bold text-white">{CLINIC.slogan}</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-forest-300">
            {CLINIC.mission}
          </p>
          <div className="mt-5 flex items-center gap-3">
            <a
              href={CLINIC.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="S19 on Instagram"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-forest-700 text-forest-300 transition-colors hover:border-gold-400 hover:text-gold-400"
            >
              <FaInstagram className="h-3.5 w-3.5" aria-hidden />
            </a>
            <a
              href={CLINIC.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="S19 on Facebook"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-forest-700 text-forest-300 transition-colors hover:border-gold-400 hover:text-gold-400"
            >
              <FaFacebookF className="h-3.5 w-3.5" aria-hidden />
            </a>
            <a
              href={`tel:${CLINIC.phoneHref}`}
              aria-label={CLINIC.phone}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-forest-700 text-forest-300 transition-colors hover:border-gold-400 hover:text-gold-400"
            >
              <FaPhone className="h-3.5 w-3.5" aria-hidden />
            </a>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-gold-400">Treatment Focus</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {treatmentLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-forest-300 hover:text-gold-400">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-gold-400">Clinic & Contact</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-forest-300">
            <li className="flex gap-2">
              <FaMapLocationDot className="mt-1 h-3.5 w-3.5 shrink-0 text-gold-400" aria-hidden />
              <span>{CLINIC.address}</span>
            </li>
            <li>
              <a href={`tel:${CLINIC.phoneHref}`} className="flex items-center gap-2 hover:text-gold-400">
                <FaPhone className="h-3.5 w-3.5 text-gold-400" aria-hidden />
                {CLINIC.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${CLINIC.email}`} className="flex items-center gap-2 hover:text-gold-400">
                <FaEnvelope className="h-3.5 w-3.5 text-gold-400" aria-hidden />
                {CLINIC.email}
              </a>
            </li>
            <li>
              <a
                href={waLink("Hello S19 Herbal Clinic, I would like to inquire about a consultation or treatment.")}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-gold-400"
              >
                <FaWhatsapp className="h-3.5 w-3.5 text-gold-400" aria-hidden />
                WhatsApp / Dr Consultation
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-gold-400">Explore</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {companyLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-forest-300 hover:text-gold-400">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>

      <div className="relative z-10 border-t border-forest-900/80">
        <Container className="flex flex-col gap-2 py-5 text-xs text-forest-400 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} {CLINIC.brand} ({CLINIC.slogan}). All rights reserved.</p>
          <p>Science-Based Herbalism · Bafoussam · Worldwide Tele-Health</p>
        </Container>
      </div>
    </footer>
  );
}