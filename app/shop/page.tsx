import type { Metadata } from "next";
import { PageHero } from "@/components/ui/page-hero";
import { ShopClient } from "@/components/shop/shop-client";
import { getCategories, getProducts } from "@/lib/catalog";
import { waLink } from "@/lib/site";
import { S19_ASSETS } from "@/lib/site-assets";

export const metadata: Metadata = {
  title: "Herbal Catalog",
  description:
    "Browse the S19 Herbal Clinic standardized product catalog - treatment packs, herbal teas, extracts and oils, and wellness essentials. Pickup in Bafoussam and worldwide delivery.",
};

export const revalidate = 60;

export default async function ShopPage() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);

  return (
    <>
      <PageHero
        eyebrow="Standardized Formulas"
        title="S19 Herbal Product Catalog"
        lead="Carefully formulated botanical solutions. Available for pickup in Bafoussam and worldwide delivery."
        image={S19_ASSETS.photos.nutritionBasketOutreach}
        alt="S19 staff explaining natural nutrition with a basket of fresh vegetables and fruits"
      />
      <ShopClient products={products} categories={categories} />
      <div className="border-t border-line bg-mist">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 text-sm text-muted sm:px-6 lg:px-8">
          Prefer to order by chat?{" "}
          <a href={waLink("Hello S19, I want to inquire about your herbal products catalog.")} target="_blank" rel="noopener noreferrer" className="font-semibold text-forest-700 hover:text-forest-800">
            Order direct via WhatsApp
          </a>
          . Personalized treatment packs and programs are priced after your health assessment.
        </div>
      </div>
    </>
  );
}