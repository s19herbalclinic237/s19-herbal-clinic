import Link from "next/link";
import { FaHeart, FaWhatsapp } from "react-icons/fa6";
import { Container, Section } from "@/components/ui/container";
import { Kicker } from "@/components/ui/heading";
import { Reveal } from "@/components/ui/motion";
import { buttonLinkClasses } from "@/components/ui/button";
import { waLink } from "@/lib/site";
import { serverT } from "@/lib/i18n-server";

/**
 * "Refer a Loved One to S19" band. Reusable — drop <ReferSection /> onto any
 * page that has room for it.
 */
export async function ReferSection() {
  const t = await serverT();
  return (
    <Section className="relative overflow-hidden bg-forest-950 text-forest-100">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{ backgroundImage: "url('/s19-pattern.png')", backgroundRepeat: "repeat" }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-forest-950/60 via-forest-950/75 to-forest-950/85" />
      <Container className="relative z-10">
        <Reveal>
          <div className="mx-auto max-w-4xl text-center">
            <Kicker className="text-gold-400">{t("refer.kicker")}</Kicker>
            <h2 className="mt-4 text-white">{t("refer.title")}</h2>
            <FaHeart className="mx-auto mt-5 h-6 w-6 text-gold-400" aria-hidden />
            <p className="mx-auto mt-5 max-w-3xl text-[15px] leading-relaxed text-forest-100/90 md:text-base">
              {t("refer.lead1")}
            </p>
            <p className="mx-auto mt-4 max-w-3xl text-[15px] leading-relaxed text-forest-100/90 md:text-base">
              {t("refer.lead2")}
            </p>
            <p className="mx-auto mt-4 max-w-3xl text-[15px] leading-relaxed text-forest-100/90 md:text-base">
              {t("refer.lead3")}
            </p>
            <p className="mt-6 font-display text-lg font-bold text-gold-400 md:text-xl">
              {t("refer.lead4")}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href={waLink(
                  "Hello S19 Herbal Clinic, I would like to refer a loved one for care. Please send me the details on how to get started."
                )}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonLinkClasses("gold", "lg")}
              >
                <FaWhatsapp className="h-4 w-4" aria-hidden />
                {t("refer.whatsapp")}
              </a>
              <Link href="/contact" className={buttonLinkClasses("glass", "lg")}>
                {t("refer.book")}
              </Link>
            </div>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}