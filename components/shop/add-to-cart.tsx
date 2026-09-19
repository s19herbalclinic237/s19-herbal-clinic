"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import type { SiteProduct } from "@/lib/site";
import { localizedProduct } from "@/lib/site";
import { waLink } from "@/lib/utils";
import { useLocale } from "@/components/i18n/locale-provider";
import { FaMinus, FaPlus, FaBagShopping, FaWhatsapp } from "react-icons/fa6";

export function AddToCart({ product }: { product: SiteProduct }) {
  const { addItem } = useCart();
  const { t, locale } = useLocale();
  const p = localizedProduct(product, locale);
  const [qty, setQty] = useState(1);

  return (
    <div className="mt-6">
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">{t("addToCart.quantity")}</span>
        <div className="flex h-10 items-center rounded-md border border-line-strong bg-white">
          <button
            type="button"
            aria-label={t("aria.decreaseQty")}
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="flex h-full w-9 items-center justify-center text-ink hover:text-forest-700"
          >
            <FaMinus className="h-3 w-3" aria-hidden />
          </button>
          <span className="w-8 text-center text-sm font-semibold">{qty}</span>
          <button
            type="button"
            aria-label={t("aria.increaseQty")}
            onClick={() => setQty((q) => Math.min(20, q + 1))}
            className="flex h-full w-9 items-center justify-center text-ink hover:text-forest-700"
          >
            <FaPlus className="h-3 w-3" aria-hidden />
          </button>
        </div>
      </div>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Button size="lg" className="h-14 flex-1 sm:h-12" onClick={() => addItem(p, qty)}>
          <FaBagShopping className="h-4 w-4" aria-hidden />
          {t("addToCart.label")}
        </Button>
        <a
          href={waLink(`Hello S19, I am interested in ordering the ${p.name}.`)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-14 flex-1 items-center justify-center gap-2 rounded-md border border-line-strong bg-white px-4 text-sm font-semibold text-ink hover:border-forest-500 hover:text-forest-800 sm:h-12"
        >
          <FaWhatsapp className="h-4 w-4 text-forest-600" aria-hidden />
          {t("common.orderWhatsApp")}
        </a>
      </div>
      <p className="mt-3 text-xs text-muted">{t("addToCart.note")}</p>
    </div>
  );
}