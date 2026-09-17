import type { Metadata } from "next";
import { CheckoutView } from "@/components/checkout/checkout-view";
import { serverT } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await serverT();
  return {
    title: t("checkout.hero.eyebrow"),
    description: t("checkout.metaDescription"),
  };
}

export default function CheckoutPage() {
  return <CheckoutView />;
}