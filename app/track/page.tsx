"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { PageHero } from "@/components/ui/page-hero";
import { Field, Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { S19_ASSETS } from "@/lib/site-assets";
import { useLocale } from "@/components/i18n/locale-provider";
import { FaTruckFast, FaMagnifyingGlass } from "react-icons/fa6";

export default function TrackOrderPage() {
  const { t } = useLocale();
  const router = useRouter();
  const [reference, setReference] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!reference.trim() || !email.trim()) {
      toast.error(t("track.emptyError"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: reference.trim(), email: email.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Not found");
      router.push(`/order/${json.orderReference}?tracked=1`);
    } catch {
      toast.error(t("track.notFound"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHero
        eyebrow={t("track.hero.eyebrow")}
        title={t("track.hero.title")}
        lead={t("track.hero.lead")}
        compact
        image={S19_ASSETS.photos.shopCounter}
      />
      <div className="border-t border-line bg-mist">
        <div className="mx-auto w-full max-w-xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-forest-700">
            <FaTruckFast className="h-5 w-5" aria-hidden />
            <h2 className="text-lg font-semibold">{t("track.title")}</h2>
          </div>
          <form onSubmit={submit} className="mt-5 space-y-4 rounded-lg border border-line bg-white p-5">
            <Field label={t("track.refLabel")} required>
              <Input required value={reference} onChange={(e) => setReference(e.target.value)} placeholder={t("track.refPlaceholder")} />
            </Field>
            <Field label={t("track.emailLabel")} required>
              <Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("track.emailPlaceholder")} />
            </Field>
            <Button type="submit" className="w-full" disabled={loading}>
              <FaMagnifyingGlass className="h-3.5 w-3.5" aria-hidden />
              {loading ? t("track.searching") : t("track.submit")}
            </Button>
            <p className="text-center text-xs text-muted">
              {t("track.hint")}
            </p>
          </form>
        </div>
      </div>
    </>
  );
}