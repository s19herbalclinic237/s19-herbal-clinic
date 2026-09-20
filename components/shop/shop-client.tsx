"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "@/components/ui/product-card";
import { Input } from "@/components/ui/form";
import { StaggerGroup, StaggerItem } from "@/components/ui/motion";
import type { SiteProduct, SiteCategory } from "@/lib/site";
import { localizedProduct } from "@/lib/site";
import { useLocale } from "@/components/i18n/locale-provider";
import { FaMagnifyingGlass, FaFilter, FaArrowDown } from "react-icons/fa6";

type SortKey = "featured" | "price-asc" | "price-desc" | "name";

export function ShopClient({
  products,
  categories,
}: {
  products: SiteProduct[];
  categories: SiteCategory[];
}) {
  const { t, locale } = useLocale();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<SortKey>("featured");

  const localized = useMemo(
    () => products.map((p) => localizedProduct(p, locale)),
    [products, locale]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = localized.filter(
      (p) =>
        (category === "all" || p.categorySlug === category) &&
        (q === "" ||
          p.name.toLowerCase().includes(q) ||
          p.shortDescription.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q))
    );
    if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    else if (sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    else list = [...list].sort((a, b) => Number(b.featured) - Number(a.featured));
    return list;
  }, [localized, query, category, sort]);

  return (
    <div className="border-t border-line bg-mist">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-xs">
            <FaMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" aria-hidden />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("shop.search.placeholder")}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <FaFilter className="h-3.5 w-3.5 text-muted" aria-hidden />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-9 rounded-md border border-line-strong bg-white px-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-forest-500/20"
            >
              <option value="featured">{t("shop.sort.featured")}</option>
              <option value="price-asc">{t("shop.sort.priceAsc")}</option>
              <option value="price-desc">{t("shop.sort.priceDesc")}</option>
              <option value="name">{t("shop.sort.name")}</option>
            </select>
            <a
              href="#alternative-order"
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementById("alternative-order")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-gold-500/60 bg-gold-400/20 px-3 text-xs font-bold text-forest-900 transition-colors hover:bg-gold-400/35"
            >
              {t("shop.alternativeOrder.title")}
              <FaArrowDown className="h-3 w-3" aria-hidden />
            </a>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategory("all")}
            className={
              category === "all"
                ? "h-8 rounded-sm border border-forest-700 bg-forest-700 px-3 text-xs font-semibold text-white"
                : "h-8 rounded-sm border border-line-strong bg-white px-3 text-xs font-semibold text-ink hover:border-forest-400"
            }
          >
            {t("shop.filter.all", { count: localized.length })}
          </button>
          {categories.map((c) => {
            const count = localized.filter((p) => p.categorySlug === c.slug).length;
            return (
              <button
                key={c.slug}
                type="button"
                onClick={() => setCategory(c.slug)}
                className={
                  category === c.slug
                    ? "h-8 rounded-sm border border-forest-700 bg-forest-700 px-3 text-xs font-semibold text-white"
                    : "h-8 rounded-sm border border-line-strong bg-white px-3 text-xs font-semibold text-ink hover:border-forest-400"
                }
              >
                {locale === "fr" ? c.nameFr || c.name : c.name} ({count})
              </button>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <div className="mt-10 rounded-lg border border-line bg-white p-10 text-center text-sm text-muted">
            {t("shop.empty")}
          </div>
        ) : (
          <StaggerGroup
            key={`${category}-${query}-${sort}`}
            className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4"
          >
            {filtered.map((p) => (
              <StaggerItem key={p.id}>
                <ProductCard product={p} />
              </StaggerItem>
            ))}
          </StaggerGroup>
        )}
      </div>
    </div>
  );
}