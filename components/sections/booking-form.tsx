"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { waLink } from "@/lib/site";
import { useLocale } from "@/components/i18n/locale-provider";
import { type TranslationKey } from "@/lib/i18n";
import { FaWhatsapp, FaCheck, FaLock } from "react-icons/fa6";

const concerns: TranslationKey[] = [
  "concern.diabetes",
  "concern.hypertension",
  "concern.prostate",
  "concern.women",
  "concern.gastritis",
  "concern.liver",
  "concern.cancer",
  "concern.general",
];

export function BookingForm() {
  const { t } = useLocale();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    mode: "Telehealth (Online / WhatsApp / Call)",
    concern: "",
    message: "",
  });

  const set = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, type: "Booking" }),
      });
      if (!res.ok) throw new Error("Request failed");
      setDone(true);
    } catch {
      toast.error(t("booking.error"));
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-lg border border-forest-200 bg-forest-50 p-6 md:p-8">
        <div className="flex items-center gap-2 text-forest-800">
          <FaCheck className="h-5 w-5" aria-hidden />
          <h3 className="text-lg font-semibold">{t("booking.title")}</h3>
        </div>
        <p className="mt-3 text-sm text-ink">
          {t("booking.thanks", { name: form.fullName.split(" ")[0] || "S19", phone: form.phone })}
        </p>
        <a
          href={waLink(
            `Hello S19 Herbal Clinic, I just submitted a consultation request${
              form.concern ? ` regarding ${form.concern}` : ""
            }. Name: ${form.fullName}.`
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex h-11 items-center gap-2 rounded-md bg-forest-700 px-5 text-sm font-semibold text-white hover:bg-forest-800"
        >
          <FaWhatsapp className="h-4 w-4" aria-hidden />
          {t("booking.connectDr")}
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("booking.fullName")} required>
          <Input required value={form.fullName} onChange={set("fullName")} placeholder={t("booking.namePlaceholder")} autoComplete="name" />
        </Field>
        <Field label={t("booking.phone")} required>
          <Input required type="tel" value={form.phone} onChange={set("phone")} placeholder="+237 ..." autoComplete="tel" />
        </Field>
      </div>
      <Field label={t("booking.email")}>
        <Input type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" autoComplete="email" />
      </Field>
      <Field label={t("booking.mode")} required>
        <Select required value={form.mode} onChange={set("mode")}>
          <option>{t("booking.modeTele")}</option>
          <option>{t("booking.modeClinic")}</option>
        </Select>
      </Field>
      <Field label={t("booking.concern")} hint={t("booking.concernHint")}>
        <Select value={form.concern} onChange={set("concern")}>
          <option value="">{t("booking.concernPlaceholder")}</option>
          {concerns.map((c) => (
            <option key={c} value={c}>
              {t(c)}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={t("booking.summary")}>
        <Textarea
          rows={4}
          value={form.message}
          onChange={set("message")}
          placeholder={t("booking.summaryPlaceholder")}
        />
      </Field>
      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting ? t("booking.sending") : t("booking.submit")}
      </Button>
      <p className="flex items-center justify-center gap-1.5 text-xs text-muted">
        <FaLock className="h-3 w-3" aria-hidden />
        {t("booking.private")}
      </p>
    </form>
  );
}