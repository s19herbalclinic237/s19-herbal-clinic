import type { Metadata } from "next";
import { PageHero } from "@/components/ui/page-hero";
import { Section } from "@/components/ui/container";
import { Kicker } from "@/components/ui/heading";
import { Reveal } from "@/components/ui/motion";
import { buttonLinkClasses } from "@/components/ui/button";
import { ShopClient } from "@/components/shop/shop-client";
import { AlternativeOrderSection } from "@/components/sections/alternative-order";
import { ReferSection } from "@/components/sections/refer-section";
import { getCategories, getProducts } from "@/lib/catalog";
import { waLink } from "@/lib/site";
import { S19_ASSETS } from "@/lib/site-assets";
import { serverT } from "@/lib/i18n-server";
import { canonicalMeta } from "@/lib/seo";
import { FaGlobe, FaMapLocationDot, FaWhatsapp } from "react-icons/fa6";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const t = await serverT();
  return {
    title: t("shop.meta.title"),
    description: t("shop.meta.description"),
    keywords: [
      "herbal products Cameroon",
      "buy herbal medicine Bafoussam",
      "natural remedies online shop",
      "herbal tea Bafoussam",
      // Was "African herbal products worldwide shipping" - the delivery guide forbids
      // promising every country.
      "African herbal products delivery Cameroon",
      "international herbal shipping destinations",
      "produits de phytothérapie Cameroun",
      "acheter plantes médicinales Cameroun",
      "tisane médicinale Bafoussam",
      "herboristerie en ligne",
    ],
    ...canonicalMeta("/shop"),
  };
}

export default async function ShopPage() {
  const t = await serverT();
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);

  return (
    <>
      <PageHero
        eyebrow={t("shop.hero.eyebrow")}
        title={t("shop.hero.title")}
        lead={t("shop.hero.lead")}
        image={S19_ASSETS.photos.nutritionBasketOutreach}
        alt="S19 staff explaining natural nutrition with a basket of fresh vegetables and fruits"
      />
      <ShopClient products={products} categories={categories} />

      {/* ---------- Item 03 of the Cameroon/International Delivery guide ----------
          Directly below the product collection, as the guide offers: the customer
          has just seen what they can buy, so this is where "can it reach me, and
          what will shipping cost" is the live question.

          Domestic and international are separate blocks, per the guide's rule that
          they stay visually distinct and that international must not outweigh
          Cameroon. No price, customs fee, courier or delivery date appears. */}
      <Section className="!py-0">
        <Reveal>
          <div className="overflow-hidden rounded-lg border border-line bg-white shadow-card">
            <div className="border-b border-line bg-mist px-7 py-6 md:px-9">
              <Kicker>{t("shop.delivery.kicker")}</Kicker>
              <h2 className="mt-3">{t("shop.delivery.title")}</h2>
            </div>
            <div className="grid md:grid-cols-2">
              <div className="border-b border-line p-7 md:border-b-0 md:border-r md:p-8">
                <p className="flex items-center gap-2 text-sm font-bold text-forest-800">
                  <FaMapLocationDot className="h-4 w-4 text-forest-600" aria-hidden />
                  {t("shop.delivery.cameroonLabel")}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {t("shop.delivery.cameroon")}
                </p>
              </div>
              <div className="p-7 md:p-8">
                <p className="flex items-center gap-2 text-sm font-bold text-forest-800">
                  <FaGlobe className="h-4 w-4 text-forest-600" aria-hidden />
                  {t("shop.delivery.internationalLabel")}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {t("shop.delivery.international")}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line bg-cream px-7 py-6 md:px-9">
              <p className="max-w-2xl text-sm leading-relaxed text-ink/85">
                {t("shop.delivery.close")}
              </p>
              <a
                href={waLink(
                  "Hello S19 Herbal Clinic, I would like to confirm shipping availability and delivery options for my destination."
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

      <AlternativeOrderSection />
      <ReferSection />
      <div className="border-t border-line bg-mist">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 text-sm text-muted sm:px-6 lg:px-8">
          {t("shop.orderByChatA")}{" "}
          <a href={waLink("Hello S19, I want to inquire about your herbal products catalog.")} target="_blank" rel="noopener noreferrer" className="font-semibold text-forest-700 hover:text-forest-800">
            {t("shop.orderByChatB")}
          </a>
          {t("shop.orderByChatC")}
        </div>
      </div>
    </>
  );
}