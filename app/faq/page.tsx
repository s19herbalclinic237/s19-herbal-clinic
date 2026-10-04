import type { Metadata } from "next";
import Link from "next/link";
import { FaChevronDown, FaWhatsapp } from "react-icons/fa6";

import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { Reveal } from "@/components/ui/motion";
import { buttonLinkClasses } from "@/components/ui/button";
import { S19_ASSETS } from "@/lib/site-assets";
import { waLink } from "@/lib/site";
import { getServerLocale, serverT } from "@/lib/i18n-server";
import { faqSections, FAQ_MID_CTA_AFTER } from "@/lib/data/faq";

export async function generateMetadata(): Promise<Metadata> {
  const t = await serverT();
  return {
    title: t("faq.metaTitle"),
    description: t("faq.metaDescription"),
  };
}

/**
 * The 22-question FAQ from
 * `docs/S19_New_Retouches/S19_FAQ_Page_Concise_Updated_v2.md`.
 *
 * ## Structure the guide fixes, and why this file obeys it literally
 *
 * "Use the 22-question accordion structure exactly as shown. Place the MID-PAGE
 * CTA after Question 14 and the FINAL CTA after Question 22."
 *
 * The mid-page CTA is therefore injected by question *number* rather than
 * hard-coded between two arrays. `FAQ_MID_CTA_AFTER` is the single source of
 * that position, so renumbering the questions cannot silently leave the CTA in
 * the wrong place — it moves with question 14 or the build fails.
 *
 * ## Why `<details>` and not a JavaScript accordion
 *
 * The home page already renders its FAQ strip this way. Reusing it means the
 * page works before hydration, is keyboard- and screen-reader-accessible without
 * ARIA wiring, and prints sensibly. A JS accordion would be a second pattern on
 * one site for no benefit. `group-open:` rotates the chevron with no script.
 *
 * ## Why the questions are not wrapped in headings
 *
 * Wrapping `<summary>` in an `<h3>` is a common accordion pattern and would give
 * each question a place in the outline, but `<summary>` is only a disclosure
 * widget as the first child of `<details>`; nesting it inside a heading changes
 * that in some browsers. The seven section names are real `<h2>`s, which is the
 * outline that actually matters for navigating a page this long.
 *
 * ## Answers are paragraph arrays
 *
 * Q13 on cancer is four separate claims. They are rendered as four `<p>`s so
 * they cannot collapse into one run-on block.
 */
export default async function FaqPage() {
  const t = await serverT();
  const locale = await getServerLocale();

  const bookHref = "/contact";
  const whatsappHref = waLink(
    "Hello S19 Herbal Clinic, I have a question I could not find answered on your FAQ page."
  );

  /** Shared BOOK A CONSULTATION / WhatsApp pair, per the guide's two CTA blocks. */
  const ctaButtons = (primary: string) => (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      <Link href={bookHref} className={buttonLinkClasses("primary", "md")}>
        {primary}
      </Link>
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-forest-800/20 bg-white px-6 text-sm font-semibold text-forest-900 transition-colors hover:border-forest-700"
      >
        <FaWhatsapp className="h-4 w-4 text-forest-600" aria-hidden />
        {t("common.whatsappDr")}
      </a>
    </div>
  );

  return (
    <>
      <PageHero
        eyebrow={t("faq.hero.eyebrow")}
        title={t("faq.hero.title")}
        lead={t("faq.hero.lead")}
        image={S19_ASSETS.photos.consultationAdvice}
        alt=""
        compact
      >
        <p className="max-w-2xl text-[15px] font-semibold text-gold-300">
          {t("faq.hero.sub")}
        </p>
        {ctaButtons(t("common.bookConsultation"))}
      </PageHero>

      {faqSections.map((section, si) => (
        <Container
          key={section.id}
          className={`max-w-4xl ${si === 0 ? "pt-12 md:pt-16" : "py-8 md:py-10"}`}
        >
          <Reveal>
            {/*
              A real <h2>, not <Kicker>. `Kicker` renders a <p>, which would have
              left a page of 22 questions with no document outline at all — the
              hero <h1> and the closing <h2> were the only headings on it. Seven
              section headings give the page a navigable structure for a screen
              reader and for search engines. The global h2 is display-sized for a
              page's main section, so it is scaled back here: there are seven of
              these, not one.
            */}
            <h2 className="text-xl md:text-2xl">
              {locale === "fr" ? section.titleFr : section.title}
            </h2>

            <div className="mt-6 divide-y divide-line rounded-lg border border-line bg-white shadow-card">
              {section.items.map((item) => (
                <div key={item.n}>
                  <details className="group">
                    <summary className="flex cursor-pointer items-start justify-between gap-4 px-6 py-5 text-[15px] font-semibold text-ink transition-colors hover:text-forest-800">
                      <span>
                        <span className="mr-2 text-forest-500">{item.n}.</span>
                        {locale === "fr" ? item.questionFr : item.question}
                      </span>
                      <FaChevronDown
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-forest-500 transition-transform group-open:rotate-180"
                        aria-hidden
                      />
                    </summary>
                    <div className="space-y-3 px-6 pb-5 text-sm leading-relaxed text-muted">
                      {(locale === "fr" ? item.answerFr : item.answer).map((p, i) => (
                        <p key={i}>{p}</p>
                      ))}
                      {item.links?.length ? (
                        <ul className="flex flex-wrap gap-2 pt-1">
                          {item.links.map((l) => (
                            <li key={l.href}>
                              <Link
                                href={l.href}
                                className="inline-flex items-center rounded-full border border-forest-800/15 bg-mist px-3 py-1 text-xs font-semibold text-forest-800 transition-colors hover:border-forest-700"
                              >
                                {locale === "fr" ? l.labelFr : l.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  </details>

                  {/* The guide fixes the mid-page CTA after Question 14. */}
                  {item.n === FAQ_MID_CTA_AFTER ? (
                    <div className="border-t border-line bg-mist px-6 py-7">
                      <p className="text-[15px] leading-relaxed text-ink">
                        {t("faq.midCta.text")}
                      </p>
                      {ctaButtons(t("common.bookConsultation"))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </Reveal>
        </Container>
      ))}

      <Container className="max-w-4xl pb-16 pt-4 md:pb-20">
        <Reveal>
          <div className="rounded-lg border border-gold-400/40 bg-gold-400/10 px-6 py-8 md:px-8">
            <h2 className="text-xl md:text-2xl">{t("faq.finalCta.title")}</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-ink/85">
              {t("faq.finalCta.text")}
            </p>
            <p className="mt-4 font-display text-lg font-semibold leading-snug text-forest-900">
              {t("faq.finalCta.statement")}
            </p>
            {ctaButtons(t("common.bookConsultation"))}
          </div>
        </Reveal>
      </Container>
    </>
  );
}