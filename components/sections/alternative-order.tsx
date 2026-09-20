import { FaEnvelope, FaWhatsapp } from "react-icons/fa6";
import { Container, Section } from "@/components/ui/container";
import { Kicker } from "@/components/ui/heading";
import { Reveal } from "@/components/ui/motion";
import { buttonLinkClasses } from "@/components/ui/button";
import { waLink } from "@/lib/site";
import { serverT } from "@/lib/i18n-server";

/** "Alternative Way to Order" block for the shop page. */
export async function AlternativeOrderSection() {
  const t = await serverT();
  return (
    <Section className="bg-mist">
      <Container id="alternative-order" className="max-w-5xl scroll-mt-28">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <Kicker center>{t("shop.alternativeOrder.kicker")}</Kicker>
            <h2 className="mt-4">{t("shop.alternativeOrder.title")}</h2>
            <p className="mt-5 text-[15px] leading-relaxed text-ink/80">
              {t("shop.alternativeOrder.text")}
            </p>
            <p className="mt-4 text-[15px] leading-relaxed text-ink/80">
              {t("shop.alternativeOrder.details")}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href={waLink(
                  "Hello S19 Herbal Clinic, I would like to order some products. I'm sending a screenshot of what I want."
                )}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonLinkClasses("primary", "lg")}
              >
                <FaWhatsapp className="h-4 w-4" aria-hidden />
                {t("shop.alternativeOrder.whatsapp")}
              </a>
              <a
                href="mailto:s19herbs@gmail.com?subject=Product%20Order%20Request"
                className={buttonLinkClasses("outline", "lg")}
              >
                <FaEnvelope className="h-4 w-4" aria-hidden />
                {t("shop.alternativeOrder.email")}
              </a>
            </div>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}