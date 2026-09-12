"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { waLink } from "@/lib/site";
import { FaWhatsapp, FaCheck, FaLock } from "react-icons/fa6";

const concerns = [
  "Diabetes / Blood Sugar",
  "Hypertension / Cardiovascular",
  "Prostate / Men's Health",
  "Women's Health / Hormones",
  "Gastritis / Digestion / Hemorrhoids",
  "Liver / Kidney Detox",
  "Integrative Cancer Care",
  "General Health Consultation",
];

export function BookingForm() {
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
      toast.error("Something went wrong. Please try again or use WhatsApp.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-lg border border-forest-200 bg-forest-50 p-6 md:p-8">
        <div className="flex items-center gap-2 text-forest-800">
          <FaCheck className="h-5 w-5" aria-hidden />
          <h3 className="text-lg font-semibold">Request received</h3>
        </div>
        <p className="mt-3 text-sm text-ink">
          Thank you, {form.fullName.split(" ")[0] || "friend"}. Our team will contact you shortly
          at <strong>{form.phone}</strong>. For an immediate response, connect with the clinic
          directly on WhatsApp.
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
          Connect with Dr on WhatsApp
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full Name" required>
          <Input required value={form.fullName} onChange={set("fullName")} placeholder="Your name" autoComplete="name" />
        </Field>
        <Field label="Phone / WhatsApp Number" required>
          <Input required type="tel" value={form.phone} onChange={set("phone")} placeholder="+237 ..." autoComplete="tel" />
        </Field>
      </div>
      <Field label="Email (optional)">
        <Input type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" autoComplete="email" />
      </Field>
      <Field label="Consultation Mode" required>
        <Select required value={form.mode} onChange={set("mode")}>
          <option>Telehealth (Online / WhatsApp / Call)</option>
          <option>In-Clinic Visit (Bafoussam Clinic)</option>
        </Select>
      </Field>
      <Field label="Primary Health Concern" hint="Select the area closest to your situation.">
        <Select value={form.concern} onChange={set("concern")}>
          <option value="">Select a concern...</option>
          {concerns.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Brief Summary of Symptoms / Previous Treatments">
        <Textarea
          rows={4}
          value={form.message}
          onChange={set("message")}
          placeholder="A short summary helps us prepare for your consultation."
        />
      </Field>
      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting ? "Sending..." : "Submit & Connect to Dr on WhatsApp"}
      </Button>
      <p className="flex items-center justify-center gap-1.5 text-xs text-muted">
        <FaLock className="h-3 w-3" aria-hidden />
        Your health details are kept strictly private and confidential.
      </p>
    </form>
  );
}