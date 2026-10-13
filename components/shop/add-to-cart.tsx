"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import type { SiteProduct } from "@/lib/site";
import { isPurchasable, localizedProduct } from "@/lib/site";
import { waLink } from "@/lib/utils";
import { useLocale } from "@/components/i18n/locale-provider";
import { FaMinus, FaPlus, FaBagShopping, FaWhatsapp } from "react-icons/fa6";

export function AddToCart({ product }: { product: SiteProduct }) {
  const { addItem } = useCart();
  const { t, locale } = useLocale();
  const p = localizedProduct(product, locale);
  const [qty, setQty] = useState(1);

  // The product stays on the page, but nothing can be bought while it is out of
  // stock. The quantity stepper and cart button are disabled and greyed, and a
  // restock request replaces the order action.
  const soldOut = !isPurchasable(product);

  return (
    <div className="mt-6">
      {soldOut ? (
        <div className="mb-4 rounded-lg border border-line bg-cream px-4 py-3">
          <p className="text-sm font-bold uppercase tracking-wide text-forest-800">
            {t("product.outOfStock")}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-muted">{t("product.outOfStockNote")}</p>
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted" aria-disabled={soldOut}>
          {t("addToCart.quantity")}
        </span>
        <div className={"flex h-10 items-center rounded-md border border-line-strong bg-white" + (soldOut ? " opacity-50" : "")}>
          <button
            type="button"
            aria-label={t("aria.decreaseQty")}
            disabled={soldOut}
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="flex h-full w-9 items-center justify-center text-ink hover:text-forest-700 disabled:pointer-events-none"
          >
            <FaMinus className="h-3 w-3" aria-hidden />
          </button>
          <span className="w-8 text-center text-sm font-semibold">{qty}</span>
          <button
            type="button"
            aria-label={t("aria.increaseQty")}
            disabled={soldOut}
            onClick={() => setQty((q) => Math.min(20, q + 1))}
            className="flex h-full w-9 items-center justify-center text-ink hover:text-forest-700 disabled:pointer-events-none"
          >
            <FaPlus className="h-3 w-3" aria-hidden />
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Button
          size="lg"
          className="h-14 flex-1 sm:h-12"
          disabled={soldOut}
          onClick={() => addItem(p, qty)}
        >
          <FaBagShopping className="h-4 w-4" aria-hidden />
          {t("addToCart.label")}
        </Button>
        <a
          href={waLink(
            soldOut
              ? t("product.restockMessage", { name: p.name })
              : t("product.orderMessage", { name: p.name })
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-14 flex-1 items-center justify-center gap-2 rounded-md border border-line-strong bg-white px-4 text-sm font-semibold text-ink hover:border-forest-500 hover:text-forest-800 sm:h-12"
        >
          <FaWhatsapp className="h-4 w-4 text-forest-600" aria-hidden />
          {soldOut ? t("product.notifyWhatsApp") : t("common.orderWhatsApp")}
        </a>
      </div>
      <p className="mt-3 text-xs text-muted">{t("addToCart.note")}</p>
    </div>
  );
}
