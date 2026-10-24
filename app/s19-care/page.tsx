import type { Metadata } from "next";
import Link from "next/link";

import { Section } from "@/components/ui/container";
import { Kicker } from "@/components/ui/heading";
import { PageHero } from "@/components/ui/page-hero";
import { Reveal } from "@/components/ui/motion";
import { buttonLinkClasses } from "@/components/ui/button";
import { DonationPanel } from "@/components/sections/donation-panel";
import { getServerLocale, serverT } from "@/lib/i18n-server";
import { resolveClinicPhoto } from "@/lib/image-registry";
import { CLINIC, waLink } from "@/lib/site";
import {
  DONATION_FUNDS,
  DONATION_PAYMENT_METHODS,
  localizedFundName,
  localizedPaymentMethodName,
  otherMethodsMessage,
} from "@/lib/data/donation-funds";
import {
  FaBullseye,
  FaClipboardCheck,
  FaHandHoldingHeart,
  FaHandshake,
  FaHeartPulse,
  FaLandmark,
  FaLock,
  FaShieldHalved,
  FaUsers,
  FaWallet,
  FaWhatsapp,
} from "react-icons/fa6";

/**
 * S19-CARE: the public donation page.
 *
 * Built from `docs/S19_CARE_Developer_Brief.md`. The approved message and the
 * three donation purposes are reproduced word for word; the surrounding
 * chrome (section headings, button labels, transparency notes) is written to
 * the same conventions as the rest of the site.
 *
 * ## Why the approved message is split across the hero and the next section
 *
 * The brief's message is one block: a headline, a paragraph, a sub-heading,
 * two more paragraphs and a closing tagline. Rendering it as one slab of text
 * under a generic banner would bury it, and the brief asks for it to be
 * *displayed prominently*.
 *
 * So the headline is the page's <h1> and the paragraph that follows it in the
 * brief is the hero lead - the two most-read lines on the page. The rest of
 * the message (the sub-heading, the second paragraph, "No donation is too
 * small", and the tagline) continues immediately below in the next section.
 * Nothing is reworded and nothing is repeated: the reading order is the
 * brief's reading order.
 *
 * ## Why the fund names are not in `lib/i18n.ts`
 *
 * They are in `lib/data/donation-funds.ts`, because the admin donation log
 * files every donation against the same three purposes. Two copies of that
 * list would let a donation be recorded against a fund the page no longer
 * offers.
 *
 * ## Why the only payment details on this page are the MTN MoMo number
 *
 * The brief: "do not publish unapproved payment details." Orange MoMo, Cash
 * App, Zelle, PayPal and bank transfer are named as *methods a donor may ask
 * about*; the instructions themselves are sent privately on WhatsApp. The
 * page never shows an account number, a handle or an IBAN for any of them.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await serverT();
  return {
    title: t("s19care.metaTitle"),
    description: t("s19care.metaDescription"),
  };
}

export default async function S19CarePage() {
  const t = await serverT();
  const locale = await getServerLocale();

  const hero = resolveClinicPhoto("consultationAdvice", locale);

  const otherMethodsHref = waLink(otherMethodsMessage(locale));
  const volunteerHref = waLink(
    locale === "fr"
      ? "Bonjour Clinique S19, je souhaite être bénévole au sein de S19-CARE. Voici ce que je peux apporter :"
      : "Hello S19 Herbal Clinic, I would like to volunteer with S19-CARE. Here is what I can contribute:"
  );
  const partnerHref = waLink(
    locale === "fr"
      ? "Bonjour Clinique S19, notre organisation souhaite discuter d'un partenariat avec S19-CARE. Voici quelques mots sur notre structure :"
      : "Hello S19 Herbal Clinic, our organisation would like to discuss a partnership with S19-CARE. A few words about who we are:"
  );

  const steps = [
    { title: t("s19care.momo.step1.title"), text: t("s19care.momo.step1.text"), icon: <FaBullseye className="h-4 w-4" aria-hidden /> },
    { title: t("s19care.momo.step2.title"), text: t("s19care.momo.step2.text"), icon: <FaHeartPulse className="h-4 w-4" aria-hidden /> },
    { title: t("s19care.momo.step3.title"), text: t("s19care.momo.step3.text"), icon: <FaWhatsapp className="h-4 w-4" aria-hidden /> },
    { title: t("s19care.momo.step4.title"), text: t("s19care.momo.step4.text"), icon: <FaClipboardCheck className="h-4 w-4" aria-hidden /> },
  ];

  const ways = [
    {
      title: t("s19care.ways.donate.title"),
      text: t("s19care.ways.donate.text"),
      cta: t("s19care.ways.donate.cta"),
      href: "#donate",
      icon: <FaHandHoldingHeart className="h-5 w-5" aria-hidden />,
    },
    {
      title: t("s19care.ways.volunteer.title"),
      text: t("s19care.ways.volunteer.text"),
      cta: t("s19care.ways.volunteer.cta"),
      href: volunteerHref,
      external: true,
      icon: <FaUsers className="h-5 w-5" aria-hidden />,
    },
    {
      title: t("s19care.ways.partner.title"),
      text: t("s19care.ways.partner.text"),
      cta: t("s19care.ways.partner.cta"),
      href: partnerHref,
      external: true,
      icon: <FaHandshake className="h-5 w-5" aria-hidden />,
    },
  ];

  const transparency = [
    {
      title: t("s19care.transparency.separate.title"),
      text: t("s19care.transparency.separate.text"),
      icon: <FaBullseye className="h-5 w-5" aria-hidden />,
    },
    {
      title: t("s19care.transparency.private.title"),
      text: t("s19care.transparency.private.text"),
      icon: <FaLandmark className="h-5 w-5" aria-hidden />,
    },
    {
      title: t("s19care.transparency.verify.title"),
      text: t("s19care.transparency.verify.text"),
      icon: <FaShieldHalved className="h-5 w-5" aria-hidden />,
    },
    {
      title: t("s19care.transparency.confidential.title"),
      text: t("s19care.transparency.confidential.text"),
      icon: <FaLock className="h-5 w-5" aria-hidden />,
    },
    {
      title: t("s19care.transparency.tax.title"),
      text: t("s19care.transparency.tax.text"),
      icon: <FaWallet className="h-5 w-5" aria-hidden />,
    },
  ];

  return (
    <>
      <PageHero
        eyebrow={t("s19care.hero.eyebrow")}
        title={t("s19care.hero.title")}
        lead={t("s19care.hero.lead")}
        image={hero.src}
        alt={hero.alt}
        compact
      >
        <div className="flex flex-wrap items-center gap-3">
          <Link href="#donate" className={buttonLinkClasses("gold", "md")}>
            {t("s19care.hero.ctaDonate")}
          </Link>
          <Link
            href="#other-methods"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-white/25 bg-white/10 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/15"
          >
            {t("s19care.hero.ctaOther")}
          </Link>
        </div>
      </PageHero>

      {/* ---------- The approved message, continued from the hero ---------- */}
      <Section className="bg-cream">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-balance">{t("s19care.message.title")}</h2>
            <p className="mt-5 text-[15px] leading-relaxed text-muted md:text-base">
              {t("s19care.message.p2")}
            </p>
            <p className="mt-4 text-[15px] leading-relaxed text-muted md:text-base">
              {t("s19care.message.p3")}
            </p>
            <p className="mt-8 font-display text-xl font-semibold leading-snug text-forest-900 md:text-2xl">
              {t("s19care.message.tagline")}
            </p>
          </div>
        </Reveal>
      </Section>

      {/* ---------- Donation purposes ---------- */}
      <div id="purposes" className="scroll-mt-24">
        <Section className="bg-white">
          <Reveal>
            <div className="max-w-2xl">
              <Kicker>{t("s19care.purposes.eyebrow")}</Kicker>
              <h2 className="mt-4">{t("s19care.purposes.title")}</h2>
              <p className="mt-4 text-[15px] leading-relaxed text-muted">
                {t("s19care.purposes.lead")}
              </p>
            </div>
          </Reveal>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {DONATION_FUNDS.map((fund, i) => (
              <Reveal key={fund.id} delay={i * 0.08}>
                <article className="flex h-full flex-col rounded-lg border border-line bg-white p-6 shadow-card md:p-7">
                  <span className="flex h-11 w-11 items-center justify-center rounded-md bg-forest-950 text-gold-400">
                    <FaHandHoldingHeart className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="mt-5 text-lg">{localizedFundName(fund, locale)}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    {locale === "fr" ? fund.descriptionFr : fund.description}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </Section>
      </div>

      {/* ---------- Direct MTN Mobile Money donations ---------- */}
      <div id="donate" className="scroll-mt-24">
        <Section className="bg-mist">
          <Reveal>
            <div className="max-w-2xl">
              <Kicker>{t("s19care.momo.eyebrow")}</Kicker>
              <h2 className="mt-4">{t("s19care.momo.title")}</h2>
              <p className="mt-4 text-[15px] leading-relaxed text-muted">
                {t("s19care.momo.lead")}
              </p>
            </div>
          </Reveal>

          <div className="mt-10 grid items-start gap-8 lg:grid-cols-[1.05fr_1fr] lg:gap-10">
            <Reveal>
              <DonationPanel />
            </Reveal>

            <Reveal delay={0.1}>
              <div className="rounded-lg border border-line bg-white p-6 shadow-card md:p-8">
                <h3 className="text-lg">{t("s19care.momo.stepsTitle")}</h3>
                <ol className="mt-6 space-y-5">
                  {steps.map((step, i) => (
                    <li key={step.title} className="flex gap-4">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-forest-200 bg-forest-50 text-xs font-bold text-forest-800">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 text-sm font-bold text-ink">
                          <span className="text-forest-600">{step.icon}</span>
                          {step.title}
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-muted">{step.text}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </Reveal>
          </div>
        </Section>
      </div>

      {/* ---------- Other ways to donate ---------- */}
      <div id="other-methods" className="scroll-mt-24">
        <Section className="bg-white">
          <Reveal>
            <div className="grid gap-10 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:gap-14">
              <div>
                <Kicker>{t("s19care.other.eyebrow")}</Kicker>
                <h2 className="mt-4">{t("s19care.other.title")}</h2>
                <p className="mt-4 text-[15px] leading-relaxed text-muted">
                  {t("s19care.other.text")}
                </p>
                <a
                  href={otherMethodsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonLinkClasses("primary", "md", "mt-7 h-auto min-h-10 py-2 text-center leading-snug")}
                >
                  <FaWhatsapp className="h-4 w-4" aria-hidden />
                  {t("s19care.other.cta")}
                </a>
                <p className="mt-4 max-w-md text-xs leading-relaxed text-muted">
                  {t("s19care.other.note")}
                </p>
              </div>

              <ul className="grid gap-3 sm:grid-cols-2">
                {DONATION_PAYMENT_METHODS.filter((m) => !m.published).map((method) => (
                  <li
                    key={method.id}
                    className="flex items-center gap-3 rounded-lg border border-line bg-cream px-4 py-3.5"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-forest-950 text-gold-400">
                      <FaWallet className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="text-sm font-semibold text-ink">
                      {localizedPaymentMethodName(method, locale)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </Section>
      </div>

      {/* ---------- Donate, Volunteer, Partner ---------- */}
      <div id="ways" className="scroll-mt-24">
        <Section className="bg-cream">
          <Reveal>
            <div className="max-w-2xl">
              <Kicker>{t("s19care.ways.eyebrow")}</Kicker>
              <h2 className="mt-4">{t("s19care.ways.title")}</h2>
            </div>
          </Reveal>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {ways.map((way, i) => (
              <Reveal key={way.title} delay={i * 0.08}>
                <article className="flex h-full flex-col rounded-lg border border-line bg-white p-6 shadow-card md:p-7">
                  <span className="flex h-11 w-11 items-center justify-center rounded-md bg-forest-950 text-gold-400">
                    {way.icon}
                  </span>
                  <h3 className="mt-5 text-lg">{way.title}</h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{way.text}</p>
                  {way.external ? (
                    <a
                      href={way.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={buttonLinkClasses("outline", "md", "mt-6 w-full h-auto min-h-10 py-2 text-center leading-snug")}
                    >
                      <FaWhatsapp className="h-4 w-4" aria-hidden />
                      {way.cta}
                    </a>
                  ) : (
                    <Link href={way.href} className={buttonLinkClasses("outline", "md", "mt-6 w-full h-auto min-h-10 py-2 text-center leading-snug")}>
                      {way.cta}
                    </Link>
                  )}
                </article>
              </Reveal>
            ))}
          </div>
        </Section>
      </div>

      {/* ---------- Transparency ---------- */}
      <div id="transparency" className="scroll-mt-24">
        <Section className="bg-forest-950">
          <Reveal>
            <div className="max-w-2xl">
              <Kicker dark>{t("s19care.transparency.eyebrow")}</Kicker>
              <h2 className="mt-4 text-white">{t("s19care.transparency.title")}</h2>
            </div>
          </Reveal>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {transparency.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.06}>
                <article className="h-full rounded-lg border border-white/10 bg-white/5 p-6">
                  <span className="flex h-10 w-10 items-center justify-center rounded-md bg-gold-400/15 text-gold-300">
                    {item.icon}
                  </span>
                  <h3 className="mt-4 text-base font-bold text-white">{item.title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-forest-200/85">{item.text}</p>
                </article>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.1}>
            <p className="mt-10 border-t border-white/10 pt-6 text-sm leading-relaxed text-forest-200/85">
              {CLINIC.brand} · {CLINIC.address}
            </p>
          </Reveal>
        </Section>
      </div>
    </>
  );
}
