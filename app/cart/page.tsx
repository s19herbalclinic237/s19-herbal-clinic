import type { Metadata } from "next";
import { CartView } from "@/components/cart/cart-view";

export const metadata: Metadata = {
  title: "Your Cart",
  description: "Review your S19 Herbal Clinic order and proceed to checkout.",
};

export default function CartPage() {
  return <CartView />;
}