"use client";

import { useState } from "react";
import { useLocale } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form";
import { FaStar, FaRegStar, FaCircleCheck } from "react-icons/fa6";

const RATINGS = [5, 4, 3, 2, 1];

export function StoriesForm() {
  const { t } = useLocale();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [form, setForm] = useState({
    name: "",
    city: "",
    country: "",
    program: "",
    email: "",
    text: "",
  });

  const set =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData(e.currentTarget);
      const website = String(formData.get("website") ?? "");
      const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, rating, website }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Request failed");
      setDone(true);
    } catch (err) {
      setError((err as Error).message || t("stories.error"));
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-forest-200 bg-forest-50 p-8 text-center">
        <FaCircleCheck className="mx-auto h-10 w-10 text-forest-600" aria-hidden />
        <h3 className="mt-4 font-display text-xl font-bold text-ink">{t("stories.success.title")}</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink/70">{t("stories.success.text")}</p>
        <button
          type="button"
          onClick={() => {
            setDone(false);
            setForm({ name: "", city: "", country: "", program: "", email: "", text: "" });
            setRating(5);
          }}
          className="mt-5 text-sm font-semibold text-forest-700 underline-offset-4 hover:underline"
        >
          {t("stories.shareAnother")}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-line bg-white p-6 shadow-card sm:p-8">
      {/* Honeypot: hidden from humans, tempting for bots. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />
      {error ? (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("stories.name")} required>
          <Input value={form.name} onChange={set("name")} required minLength={2} maxLength={80} placeholder={t("stories.namePh")} />
        </Field>
        <Field label={t("stories.rating")} required>
          <div className="flex items-center gap-1 pt-1.5">
            {RATINGS.map((r) =>
              r <= rating ? (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRating(r)}
                  aria-label={`${r} star${r > 1 ? "s" : ""}`}
                  className="text-gold-500 transition-transform hover:scale-110"
                >
                  <FaStar className="h-6 w-6" aria-hidden />
                </button>
              ) : (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRating(r)}
                  aria-label={`${r} star${r > 1 ? "s" : ""}`}
                  className="text-forest-200 transition-transform hover:scale-110"
                >
                  <FaRegStar className="h-6 w-6" aria-hidden />
                </button>
              )
            )}
          </div>
        </Field>
        <Field label={t("stories.city")} required>
          <Input value={form.city} onChange={set("city")} required minLength={2} maxLength={60} placeholder={t("stories.cityPh")} />
        </Field>
        <Field label={t("stories.country")}>
          <Input value={form.country} onChange={set("country")} maxLength={60} placeholder={t("stories.countryPh")} />
        </Field>
        <Field label={t("stories.email")} className="sm:col-span-2">
          <Input value={form.email} onChange={set("email")} type="email" maxLength={120} placeholder={t("stories.emailPh")} />
        </Field>
        <Field label={t("stories.program")} required className="sm:col-span-2">
          <Input value={form.program} onChange={set("program")} required minLength={2} maxLength={100} placeholder={t("stories.programPh")} />
        </Field>
        <Field label={t("stories.text")} required className="sm:col-span-2">
          <Textarea value={form.text} onChange={set("text")} required minLength={20} maxLength={2000} rows={5} placeholder={t("stories.textPh")} />
        </Field>
      </div>

      <p className="mt-5 text-xs text-muted">{t("stories.private")}</p>

      <div className="mt-5 flex justify-end">
        <Button type="submit" disabled={submitting}>
          {submitting ? t("stories.sending") : t("stories.submit")}
        </Button>
      </div>
    </form>
  );
}