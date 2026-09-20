import Link from "next/link";
import { Container } from "@/components/ui/container";
import { localizedClinic, waLink } from "@/lib/site";
import { S19_ASSETS } from "@/lib/site-assets";
import { getServerLocale, serverT } from "@/lib/i18n-server";
import type { TranslationKey } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import {
  FaWhatsapp,
  FaMapLocationDot,
  FaPhone,
  FaEnvelope,
  FaInstagram,
  FaFacebookF,
} from "react-icons/fa6";

const treatmentLinks: { key: TranslationKey; href: string }[] = [
  { key: "footer.diabetes", href: "/programs#diabetes-metabolic" },
  { key: "footer.hypertension", href: "/programs#hypertension-cardiovascular" },
  { key: "footer.prostate", href: "/programs#prostate-mens-health" },
  { key: "footer.womens", href: "/programs#womens-health-hormones" },
  { key: "footer.gastritis", href: "/programs#digestive-gut-health" },
];

const companyLinks: { key: TranslationKey; href: string }[] = [
  { key: "footer.home", href: "/" },
  { key: "footer.approach", href: "/about" },
  { key: "footer.catalog", href: "/shop" },
  { key: "footer.blog", href: "/blog" },
  { key: "footer.stories", href: "/patient-stories" },
  { key: "footer.contactUs", href: "/contact" },
  { key: "footer.trackOrder", href: "/track" },
  { key: "footer.refundReturns", href: "/refund-and-returns" },
  { key: "footer.privacy", href: "/privacy" },
  { key: "footer.terms", href: "/terms" },
];

export async function SiteFooter() {
  const t = await serverT();
  const clinic = localizedClinic(await getServerLocale());
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
            alt={`${clinic.brand} logo`}
            className="h-11 w-auto"
          />
          <p className="mt-3 max-w-xs text-lg font-bold text-white">{clinic.slogan}</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-forest-300">
            {clinic.mission}
          </p>
          <div className="mt-5 flex items-center gap-3">
            <a
              href={clinic.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("aria.instagram")}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-forest-700 text-forest-300 transition-colors hover:border-gold-400 hover:text-gold-400"
            >
              <FaInstagram className="h-3.5 w-3.5" aria-hidden />
            </a>
            <a
              href={clinic.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("aria.facebook")}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-forest-700 text-forest-300 transition-colors hover:border-gold-400 hover:text-gold-400"
            >
              <FaFacebookF className="h-3.5 w-3.5" aria-hidden />
            </a>
            <a
              href={`tel:${clinic.phoneHref}`}
              aria-label={clinic.phone}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-forest-700 text-forest-300 transition-colors hover:border-gold-400 hover:text-gold-400"
            >
              <FaPhone className="h-3.5 w-3.5" aria-hidden />
            </a>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-gold-400">{t("footer.treatment")}</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {treatmentLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-forest-300 hover:text-gold-400">
                  {t(l.key)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-gold-400">{t("footer.clinicContact")}</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-forest-300">
            <li className="flex gap-2">
              <FaMapLocationDot className="mt-1 h-3.5 w-3.5 shrink-0 text-gold-400" aria-hidden />
              <span>{clinic.address}</span>
            </li>
            <li>
              <a href={`tel:${clinic.phoneHref}`} className="flex items-center gap-2 hover:text-gold-400">
                <FaPhone className="h-3.5 w-3.5 text-gold-400" aria-hidden />
                {clinic.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${clinic.email}`} className="flex items-center gap-2 hover:text-gold-400">
                <FaEnvelope className="h-3.5 w-3.5 text-gold-400" aria-hidden />
                {clinic.email}
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
                {t("common.whatsappDr")}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-gold-400">{t("footer.explore")}</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {companyLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-forest-300 hover:text-gold-400">
                  {t(l.key)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>

      <div className="relative z-10 border-t border-forest-900/80">
        <Container className="flex flex-col gap-3 py-5 text-xs text-forest-400 sm:flex-row sm:items-center sm:justify-between">
          <p>{t("footer.rights", { year: new Date().getFullYear(), brand: clinic.brand, slogan: clinic.slogan })}</p>
          <p className="flex items-center gap-3">
            <span>{t("footer.bottom")}</span>
            <LanguageSwitcher />
          </p>
        </Container>
      </div>
    </footer>
  );
}