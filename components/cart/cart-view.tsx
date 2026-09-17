"use client";

import Image from "next/image";
import Link from "next/link";
import { PageHero } from "@/components/ui/page-hero";
import { buttonLinkClasses } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { useLocale } from "@/components/i18n/locale-provider";
import { formatFcfa, waLink } from "@/lib/utils";
import { FaMinus, FaPlus, FaTrashCan, FaWhatsapp, FaBagShopping, FaArrowRight } from "react-icons/fa6";

const CART_HERO_IMG = "https://images.unsplash.com/photo-1544787219-7f47ccb76574?q=80&w=1600&auto=format&fit=crop";

export function CartView() {
  const { t } = useLocale();
  const { items, count, subtotal, updateQuantity, removeItem } = useCart();

  if (items.length === 0) {
    return (
      <>
        <PageHero eyebrow={t("cart.hero.eyebrow")} title={t("cart.hero.title")} compact image={CART_HERO_IMG} alt={t("cart.hero.alt")} />
        <div className="mx-auto w-full max-w-6xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <FaBagShopping className="mx-auto h-8 w-8 text-forest-300" aria-hidden />
          <h2 className="mt-4 text-xl">{t("cart.empty.title")}</h2>
          <p className="mt-2 text-sm text-muted">{t("cart.empty.text")}</p>
          <Link href="/shop" className={buttonLinkClasses("primary", "lg", "mt-6")}>
            {t("cart.browse")}
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHero eyebrow={t("cart.hero.eyebrow")} title={t("cart.countTitle", { count })} compact image={CART_HERO_IMG} alt={t("cart.hero.alt")} />
      <div className="border-t border-line bg-mist">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
            <div className="overflow-hidden rounded-lg border border-line bg-white">
              {items.map((item, idx) => (
                <div
                  key={item.slug}
                  className={
                    "flex gap-4 p-4 sm:items-center" + (idx < items.length - 1 ? " border-b border-line" : "")
                  }
                >
                  <Link href={`/shop/${item.slug}`} className="relative h-20 w-24 shrink-0 overflow-hidden rounded-md border border-line bg-forest-50">
                    <Image src={item.image} alt={item.name} fill sizes="96px" className="object-cover" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link href={`/shop/${item.slug}`} className="block truncate text-sm font-semibold hover:text-forest-700">
                      {item.name}
                    </Link>
                    <p className="mt-0.5 text-sm font-bold text-forest-800">{formatFcfa(item.price)}</p>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex h-8 items-center rounded-md border border-line-strong bg-white">
                        <button
                          type="button"
                          aria-label={t("aria.decreaseQty")}
                          onClick={() => updateQuantity(item.slug, item.quantity - 1)}
                          className="flex h-full w-8 items-center justify-center text-ink hover:text-forest-700"
                        >
                          <FaMinus className="h-2.5 w-2.5" aria-hidden />
                        </button>
                        <span className="w-7 text-center text-xs font-semibold">{item.quantity}</span>
                        <button
                          type="button"
                          aria-label={t("aria.increaseQty")}
                          onClick={() => updateQuantity(item.slug, item.quantity + 1)}
                          className="flex h-full w-8 items-center justify-center text-ink hover:text-forest-700"
                        >
                          <FaPlus className="h-2.5 w-2.5" aria-hidden />
                        </button>
                      </div>
                      <span className="text-xs font-semibold text-muted">{formatFcfa(item.price * item.quantity)}</span>
                      <button
                        type="button"
                        aria-label={t("cart.remove", { name: item.name })}
                        onClick={() => removeItem(item.slug)}
                        className="ml-auto flex h-8 w-8 items-center justify-center rounded-md border border-line text-muted transition-colors hover:border-red-300 hover:text-red-600"
                      >
                        <FaTrashCan className="h-3 w-3" aria-hidden />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex flex-wrap gap-3 p-4">
                <Link href="/shop" className={buttonLinkClasses("secondary", "md")}>
                  {t("cart.continue")}
                </Link>
                <a
                  href={waLink("Hello S19 Herbal Clinic, I would like to order some of your herbal products.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonLinkClasses("outline", "md")}
                >
                  <FaWhatsapp className="h-3.5 w-3.5 text-forest-600" aria-hidden />
                  {t("cart.orderWhatsApp")}
                </a>
              </div>
            </div>

            <div className="h-fit rounded-lg border border-line bg-white p-5">
              <h2 className="text-base font-bold">{t("cart.summary")}</h2>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between text-muted">
                  <dt>{count > 1 ? t("cart.subtotalMany", { count }) : t("cart.subtotalOne", { count })}</dt>
                  <dd>{formatFcfa(subtotal)}</dd>
                </div>
                <div className="flex justify-between text-muted">
                  <dt>{t("cart.delivery")}</dt>
                  <dd>{t("cart.deliveryCalc")}</dd>
                </div>
                <div className="flex justify-between border-t border-line pt-3 text-base font-bold">
                  <dt>{t("cart.total")}</dt>
                  <dd className="text-forest-800">{formatFcfa(subtotal)}</dd>
                </div>
              </dl>
              <Link href="/checkout" className={buttonLinkClasses("primary", "lg", "mt-5 w-full")}>
                {t("cart.checkout")}
                <FaArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
              <p className="mt-3 text-center text-xs text-muted">
                {t("cart.paymentHint")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}