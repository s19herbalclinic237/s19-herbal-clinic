"use client";

import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/heading";
import { buttonLinkClasses } from "@/components/ui/button";
import type { SiteProduct } from "@/lib/site";
import { localizedProduct } from "@/lib/site";
import { waLink } from "@/lib/utils";
import { MultiCurrencyPrice } from "@/components/ui/price";
import { useLocale } from "@/components/i18n/locale-provider";
import { FaBagShopping } from "react-icons/fa6";

export function ProductCard({ product }: { product: SiteProduct }) {
  const { t, locale } = useLocale();
  const p = localizedProduct(product, locale);
  return (
    <article className="group relative flex flex-col rounded-lg border border-line bg-white transition-colors hover:border-forest-300">
      <Link href={`/shop/${p.slug}`} className="relative block aspect-[4/3] overflow-hidden rounded-t-lg bg-forest-50">
        <Image
          src={p.image}
          alt={p.name}
          fill
          sizes="(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
          {p.badge ? <Badge>{p.badge}</Badge> : <span />}
          <span className="text-[11px] uppercase tracking-wide text-muted">{p.category}</span>
        </div>
        <h3 className="text-base font-semibold leading-snug">
          <Link href={`/shop/${p.slug}`} className="hover:text-forest-700">
            {p.name}
          </Link>
        </h3>
        <p className="text-sm text-muted">{p.shortDescription}</p>
        <div className="mt-auto flex items-start justify-between gap-2 pt-3">
          <MultiCurrencyPrice price={p.price} unit={p.unit} size="sm" />
          <Link href={`/shop/${p.slug}`} className={buttonLinkClasses("secondary", "sm")}>
            <FaBagShopping className="h-3 w-3" aria-hidden />
            {t("common.view")}
          </Link>
        </div>
      </div>
      <Link
        href={waLink(`Hello S19, I am interested in ordering the ${p.name}.`)}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-b-lg border-t border-line bg-mist px-4 py-2 text-xs font-semibold text-forest-700 hover:bg-forest-50"
      >
        {t("common.orderWhatsApp")}
      </Link>
    </article>
  );
}