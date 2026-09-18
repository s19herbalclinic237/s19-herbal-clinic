import type { Metadata } from "next";
import { AccountScreen } from "@/components/auth/account-screen";
import { serverT } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await serverT();
  return {
    title: t("account.metaTitle"),
    description: t("account.metaDescription"),
  };
}

export default function AccountPage() {
  return <AccountScreen />;
}