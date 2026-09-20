import type { Metadata } from "next";
import { PageHero } from "@/components/ui/page-hero";
import { ShopClient } from "@/components/shop/shop-client";
import { AlternativeOrderSection } from "@/components/sections/alternative-order";
import { ReferSection } from "@/components/sections/refer-section";
import { getCategories, getProducts } from "@/lib/catalog";
import { waLink } from "@/lib/site";
import { S19_ASSETS } from "@/lib/site-assets";
import { serverT } from "@/lib/i18n-server";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const t = await serverT();
  return {
    title: t("shop.meta.title"),
    description: t("shop.meta.description"),
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