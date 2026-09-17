"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { PageHero } from "@/components/ui/page-hero";
import { buttonLinkClasses } from "@/components/ui/button";
import { Field, Input, Textarea, RadioCard } from "@/components/ui/form";
import { useCart } from "@/lib/cart-context";
import { useLocale } from "@/components/i18n/locale-provider";
import { formatFcfa } from "@/lib/utils";
import { FaArrowRight, FaLock, FaWhatsapp, FaBagShopping } from "react-icons/fa6";

const deliveryModes = [
  {
    value: "Pickup" as const,
    titleKey: "checkout.mode1.title" as const,
    descriptionKey: "checkout.mode1.desc" as const,
    fee: 0,
  },
  {
    value: "Cameroon Delivery" as const,
    titleKey: "checkout.mode2.title" as const,
    descriptionKey: "checkout.mode2.desc" as const,
    fee: 2500,
  },
  {
    value: "Worldwide Delivery" as const,
    titleKey: "checkout.mode3.title" as const,
    descriptionKey: "checkout.mode3.desc" as const,
    fee: 0,
  },
];

const paymentMethods = [
  "MTN Mobile Money",
  "Orange Money",
  "Bank Transfer",
  "Pay on Pickup or Delivery",
];

interface CheckoutData {
  fullName: string;
  email: string;
  phone: string;
  mode: string;
  city: string;
  address: string;
  payment: string;
  notes: string;
}

const CHECKOUT_HERO_IMG = "https://images.unsplash.com/photo-1544787219-7f47ccb76574?q=80&w=1600&auto=format&fit=crop";

export function CheckoutView() {
  const { t } = useLocale();
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<CheckoutData>({
    fullName: "",
    email: "",
    phone: "",
    mode: "Pickup",
    city: "",
    address: "",
    payment: paymentMethods[0],
    notes: "",
  });

  const mode = deliveryModes.find((m) => m.value === data.mode) ?? deliveryModes[0];
  const total = subtotal + mode.fee;

  useEffect(() => {
    if (items.length === 0 && !submitting) {
      router.replace("/cart");
    }
  }, [items.length, submitting, router]);

  if (items.length === 0) {
    return (
      <>
        <PageHero eyebrow={t("checkout.hero.eyebrow")} title={t("checkout.hero.eyebrow")} compact image={CHECKOUT_HERO_IMG} alt={t("cart.hero.alt")} />
        <div className="mx-auto w-full max-w-6xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <FaBagShopping className="mx-auto h-8 w-8 text-forest-300" aria-hidden />
          <p className="mt-4 text-sm text-muted">{t("checkout.empty.text")}</p>
          <Link href="/shop" className={buttonLinkClasses("primary", "md", "mt-4")}>
            {t("cart.browse")}
          </Link>
        </div>
      </>
    );
  }

  const set = (key: keyof CheckoutData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setData((d) => ({ ...d, [key]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          customer: { fullName: data.fullName, email: data.email, phone: data.phone },
          shipping: {
            mode: data.mode,
            city: data.city,
            address: data.address,
            notes: data.notes,
          },
          payment: { method: data.payment },
          fee: mode.fee,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Order failed");
      clearCart();
      router.push(`/order/${json.orderReference}`);
    } catch {
      toast.error(t("checkout.orderFailed"));
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHero eyebrow={t("checkout.hero.eyebrow")} title={t("checkout.hero.title")} compact image={CHECKOUT_HERO_IMG} alt={t("cart.hero.alt")} />
      <div className="border-t border-line bg-mist">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <form onSubmit={submit} className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <div className="min-w-0 space-y-6">
              <div className="rounded-lg border border-line bg-white p-5">
                <h2 className="text-base font-bold">{t("checkout.contactTitle")}</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field label={t("checkout.fullName")} required>
                    <Input required value={data.fullName} onChange={set("fullName")} placeholder={t("checkout.fullNamePh")} autoComplete="name" />
                  </Field>
                  <Field label={t("checkout.phone")} required>
                    <Input required type="tel" value={data.phone} onChange={set("phone")} placeholder="+237 ..." autoComplete="tel" />
                  </Field>
                  <Field label={t("contact.emailLabel")} required className="sm:col-span-2">
                    <Input required type="email" value={data.email} onChange={set("email")} placeholder={t("checkout.emailPh")} autoComplete="email" />
                  </Field>
                </div>

                <div className="mt-5 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink">{t("checkout.deliveryMode")}</p>
                  {deliveryModes.map((m) => (
                    <RadioCard
                      key={m.value}
                      name="mode"
                      value={m.value}
                      checked={data.mode === m.value}
                      onChange={(v) => setData((d) => ({ ...d, mode: v }))}
                      title={t(m.titleKey)}
                      description={`${t(m.descriptionKey)}${m.fee ? t("checkout.fee", { fee: formatFcfa(m.fee) }) : ""}`}
                    />
                  ))}
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {data.mode !== "Pickup" ? (
                    <Field label={t("checkout.city")} required>
                      <Input required value={data.city} onChange={set("city")} placeholder={t("checkout.cityPh")} />
                    </Field>
                  ) : null}
                  <Field label={t("checkout.address")} required className={data.mode === "Pickup" ? "sm:col-span-2" : ""} hint={data.mode === "Pickup" ? t("checkout.addressHint") : undefined}>
                    <Input required={data.mode !== "Pickup"} value={data.address} onChange={set("address")} placeholder={t("checkout.addressPh")} />
                  </Field>
                </div>
              </div>

              <div className="rounded-lg border border-line bg-white p-5">
                <h2 className="text-base font-bold">{t("checkout.paymentTitle")}</h2>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {paymentMethods.map((m) => (
                    <RadioCard
                      key={m}
                      name="payment"
                      value={m}
                      checked={data.payment === m}
                      onChange={(v) => setData((d) => ({ ...d, payment: v }))}
                      title={m}
                    />
                  ))}
                </div>
                <div className="mt-4">
                  <Field label={t("checkout.notes")}>
                    <Textarea rows={3} value={data.notes} onChange={set("notes")} placeholder={t("checkout.notesPh")} />
                  </Field>
                </div>
              </div>

              <button type="submit" disabled={submitting} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-forest-700 bg-forest-700 px-6 text-sm font-semibold text-white transition-colors hover:bg-forest-800 disabled:opacity-60 sm:w-auto">
                {submitting ? t("checkout.placing") : t("checkout.placeOrder")}
                {!submitting ? <FaArrowRight className="h-3.5 w-3.5" aria-hidden /> : null}
              </button>
              <p className="flex items-center gap-1.5 text-xs text-muted">
                <FaLock className="h-3 w-3" aria-hidden />
                {t("checkout.privacy")}
              </p>
            </div>

            <aside className="h-fit min-w-0 rounded-lg border border-line bg-white p-5">
              <h2 className="text-base font-bold">{t("cart.summary")}</h2>
              <ul className="mt-4 divide-y divide-line">
                {items.map((item) => (
                  <li key={item.slug} className="flex items-center gap-3 py-3">
                    <div className="relative h-14 w-16 shrink-0 overflow-hidden rounded-md border border-line bg-forest-50">
                      <Image src={item.image} alt={item.name} fill sizes="64px" className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{item.name}</p>
                      <p className="text-xs text-muted">{t("checkout.qty", { qty: item.quantity, price: formatFcfa(item.price) })}</p>
                    </div>
                    <span className="text-sm font-semibold">{formatFcfa(item.price * item.quantity)}</span>
                  </li>
                ))}
              </ul>
              <dl className="mt-2 space-y-2 border-t border-line pt-3 text-sm">
                <div className="flex justify-between text-muted">
                  <dt>{t("checkout.subtotal")}</dt>
                  <dd>{formatFcfa(subtotal)}</dd>
                </div>
                <div className="flex justify-between text-muted">
                  <dt>{t("cart.delivery")} ({t(mode.titleKey)})</dt>
                  <dd>{data.mode === "Worldwide Delivery" ? t("checkout.deliveryConfirmed") : formatFcfa(mode.fee)}</dd>
                </div>
                <div className="flex justify-between border-t border-line pt-3 text-base font-bold">
                  <dt>{t("cart.total")}</dt>
                  <dd className="text-forest-800">{formatFcfa(total)}</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-muted">
                {t("checkout.whatsappNote")}{" "}
                <a
                  href="https://wa.me/237672595989"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-forest-700 hover:text-forest-800"
                >
                  <FaWhatsapp className="h-3 w-3" aria-hidden />
                  {t("checkout.contactUs")}
                </a>
              </p>
            </aside>
          </form>
        </div>
      </div>
    </>
  );
}