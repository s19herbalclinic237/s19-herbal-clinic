"use client";

import { useEffect, useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form";
import { formatDate, TestimonialStatusBadge } from "@/components/account/badges";
import { FaCommentDots, FaPlus, FaStar } from "react-icons/fa6";

interface TestimonialView {
  _id: string;
  name: string;
  city: string;
  country?: string;
  program: string;
  text: string;
  status: string;
  createdAt: string;
}

export function TestimonialsTab() {
  const { user } = useAuth();
  const { t } = useLocale();
  const [testimonials, setTestimonials] = useState<TestimonialView[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [program, setProgram] = useState("");
  const [text, setText] = useState("");
  const [rating, setRating] = useState(0);
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/testimonials", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        if (data.error) setError(data.error);
        else setTestimonials(Array.isArray(data.testimonials) ? data.testimonials : []);
      })
      .catch(() => {
        if (active) setError(t("dash.testimonials.loadError"));
      });
    return () => {
      active = false;
    };
  }, [t]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/testimonials", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, city, country, program, text, rating }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("dash.testimonials.saveError"));
      const created = data.testimonial as TestimonialView;
      setTestimonials((prev) => [created, ...(prev || [])]);
      setShowForm(false);
      setCity("");
      setCountry("");
      setProgram("");
      setText("");
      setRating(0);
      setConsent(false);
      toast.success(t("dash.testimonials.saved"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("dash.testimonials.saveError"));
    } finally {
      setSubmitting(false);
    }
  }

  const ratingLabel =
    rating === 0
      ? t("dash.testimonials.ratingNone")
      : rating === 5
        ? t("dash.testimonials.ratingExcellent")
        : rating === 4
          ? t("dash.testimonials.ratingGood")
          : rating === 3
            ? t("dash.testimonials.ratingOkay")
            : rating === 2
              ? t("dash.testimonials.ratingPoor")
              : t("dash.testimonials.ratingVeryPoor");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">{t("dash.testimonials.intro")}</p>
        {!showForm ? (
          <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
            <FaPlus className="h-3 w-3" aria-hidden />
            {t("dash.testimonials.drop")}
          </Button>
        ) : null}
      </div>

      {showForm ? (
        <form onSubmit={submit} className="rounded-lg border border-line bg-white p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("dash.testimonials.name")} required>
              <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder={t("dash.testimonials.namePh")} maxLength={80} />
            </Field>
            <Field label={t("dash.testimonials.city")} required>
              <Input required value={city} onChange={(e) => setCity(e.target.value)} placeholder={t("dash.testimonials.cityPh")} maxLength={60} />
            </Field>
            <Field label={t("dash.testimonials.country")}>
              <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder={t("dash.testimonials.countryPh")} maxLength={60} />
            </Field>
            <Field label={t("dash.testimonials.program")} required>
              <Input required value={program} onChange={(e) => setProgram(e.target.value)} placeholder={t("dash.testimonials.programPh")} maxLength={100} />
            </Field>
          </div>
          <div className="mt-4">
            <Field label={t("dash.testimonials.rating")} hint={t("dash.testimonials.ratingHint")}>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    aria-label={`${value} star${value === 1 ? "" : "s"}`}
                    className="cursor-pointer p-0.5 text-xl transition-transform hover:scale-110"
                  >
                    {value <= rating ? (
                      <FaStar className="text-gold-500" aria-hidden />
                    ) : (
                      <FaStar className="text-forest-200" aria-hidden />
                    )}
                  </button>
                ))}
                <span className="ml-2 text-xs font-semibold text-muted">{ratingLabel}</span>
              </div>
            </Field>
          </div>
          <div className="mt-4">
            <Field label={t("dash.testimonials.testimony")} required hint={t("dash.testimonials.testimonyHint")}>
              <Textarea
                required
                rows={4}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t("dash.testimonials.testimonyPh")}
                maxLength={2000}
              />
            </Field>
          </div>
          <div className="mt-4 rounded-lg border border-line bg-mist p-4 text-xs text-muted">
            <p className="font-semibold text-ink">{t("dash.testimonials.consentTitle")}</p>
            <p className="mt-1">{t("dash.testimonials.consentText")}</p>
            <p className="mt-2">{t("dash.testimonials.consentWithdraw")}</p>
            <label className="mt-3 flex items-start gap-2">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                required
                className="mt-0.5 h-4 w-4 rounded border-line text-forest-700 focus:ring-forest-600"
              />
              <span>{t("dash.testimonials.consentCheckbox")}</span>
            </label>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={submitting || !consent || rating === 0}>
              {submitting ? t("dash.testimonials.submitting") : t("dash.testimonials.submit")}
            </Button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-sm font-semibold text-muted hover:text-ink"
            >
              {t("dash.testimonials.cancel")}
            </button>
          </div>
        </form>
      ) : null}

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      {!testimonials ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-forest-200 border-t-forest-800" />
        </div>
      ) : null}

      {testimonials && testimonials.length === 0 && !showForm ? (
        <div className="rounded-lg border border-line bg-white p-8 text-center">
          <FaCommentDots className="mx-auto h-7 w-7 text-forest-300" aria-hidden />
          <p className="mt-3 text-sm text-muted">{t("dash.testimonials.empty")}</p>
        </div>
      ) : null}

      {testimonials && testimonials.length > 0 ? (
        <ul className="space-y-3">
          {testimonials.map((tst) => (
            <li key={tst._id} className="rounded-lg border border-line bg-white p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-bold text-ink">{tst.program}</p>
                <TestimonialStatusBadge status={tst.status} />
              </div>
              <p className="mt-1 text-xs text-muted">
                {tst.name} · {tst.city}
                {tst.country ? `, ${tst.country}` : ""} · {formatDate(tst.createdAt)}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted">{tst.text}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}