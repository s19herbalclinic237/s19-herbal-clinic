import type { Metadata } from "next";
import { CartView } from "@/components/cart/cart-view";
import { serverT } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await serverT();
  return {
    title: t("cart.hero.title"),
    description: t("cart.metaDescription"),
  };
}

export default function CartPage() {
  return <CartView />;
}