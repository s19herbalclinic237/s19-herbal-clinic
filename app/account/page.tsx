import type { Metadata } from "next";
import { AccountScreen } from "@/components/auth/account-screen";

export const metadata: Metadata = {
  title: "Sign in or create an account",
  description:
    "Sign in to your S19 Herbal Clinic account to track orders, manage testimonials, and receive updates.",
};

export default function AccountPage() {
  return <AccountScreen />;
}