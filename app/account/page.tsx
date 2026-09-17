import type { Metadata } from "next";
import { ComingSoon } from "@/components/auth/coming-soon";
import { CTABand } from "@/components/sections/cta-band";
import { serverT } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await serverT();
  return {
    title: t("account.metaTitle"),
    description: t("account.metaDescription"),
  };
}

export default function AccountPage() {
  return (
    <>
      <ComingSoon />
      <div className="border-t border-line bg-white">
        <CTABand />
      </div>
    </>
  );
}