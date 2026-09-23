"use client";

import { useEffect, useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/auth-context";
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
  const [testimonials, setTestimonials] = useState<TestimonialView[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [program, setProgram] = useState("");
  const [text, setText] = useState("");
  const [rating, setRating] = useState(5);
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
        if (active) setError("Could not load your testimonials.");
      });
    return () => {
      active = false;
    };
  }, []);

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
      if (!res.ok) throw new Error(data.error || "Could not save your testimony.");
      const created = data.testimonial as TestimonialView;
      setTestimonials((prev) => [created, ...(prev || [])]);
      setShowForm(false);
      setCity("");
      setCountry("");
      setProgram("");
      setText("");
      toast.success("Thank you! Your testimony is pending review.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save your testimony.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">The stories you have shared with the S19 community.</p>
        {!showForm ? (
          <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
            <FaPlus className="h-3 w-3" aria-hidden />
            Drop a testimony
          </Button>
        ) : null}
      </div>

      {showForm ? (
        <form onSubmit={submit} className="rounded-lg border border-line bg-white p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Your Name" required>
              <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" maxLength={80} />
            </Field>
            <Field label="City" required>
              <Input required value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Bafoussam" maxLength={60} />
            </Field>
            <Field label="Country (optional)">
              <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g. Cameroun / USA" maxLength={60} />
            </Field>
            <Field label="Program or Product" required>
              <Input required value={program} onChange={(e) => setProgram(e.target.value)} placeholder="e.g. Diabetes &amp; Metabolic Health Support" maxLength={100} />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Your Rating" hint="How was your visit with S19?">
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
                <span className="ml-2 text-xs font-semibold text-muted">
                  {rating === 5 ? "Excellent" : rating === 4 ? "Good" : rating === 3 ? "Okay" : rating === 2 ? "Poor" : "Very poor"}
                </span>
              </div>
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Your Testimony" required hint="Share your experience in at least 20 characters.">
              <Textarea
                required
                rows={4}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="How did S19 help you?..."
                maxLength={2000}
              />
            </Field>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit for review"}
            </Button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-sm font-semibold text-muted hover:text-ink"
            >
              Cancel
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
          <p className="mt-3 text-sm text-muted">
            You have not dropped a testimony yet. Share your S19 story - it encourages others.
          </p>
        </div>
      ) : null}

      {testimonials && testimonials.length > 0 ? (
        <ul className="space-y-3">
          {testimonials.map((t) => (
            <li key={t._id} className="rounded-lg border border-line bg-white p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-bold text-ink">{t.program}</p>
                <TestimonialStatusBadge status={t.status} />
              </div>
              <p className="mt-1 text-xs text-muted">
                {t.name} · {t.city}
                {t.country ? `, ${t.country}` : ""} · {formatDate(t.createdAt)}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted">{t.text}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}