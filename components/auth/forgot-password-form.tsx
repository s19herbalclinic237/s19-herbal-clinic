"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import { AuthShell } from "@/components/auth/auth-shell";
import { Field, Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/i18n/locale-provider";

export function ForgotPasswordForm() {
  const { forgotPassword } = useAuth();
  const { t } = useLocale();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const website = String(formData.get("website") ?? "");
    setSubmitting(true);
    const err = await forgotPassword(email, website);
    setSubmitting(false);
    if (err) setError(err);
    else setSent(true);
  }

  return (
    <AuthShell
      eyebrow={t("auth.recoveryEyebrow")}
      title={t("auth.forgotTitle")}
      lead={t("auth.forgotLead")}
      footer={
        <>
          {t("auth.rememberPassword")}{" "}
          <Link href="/account" className="font-semibold text-forest-800 underline underline-offset-2">
            {t("auth.signIn")}
          </Link>
        </>
      }
    >
      {sent ? (
        <div className="rounded-lg border border-forest-200 bg-forest-50 px-4 py-5 text-sm text-ink">
          <p>{t("auth.forgotSent", { email })}</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {/* Honeypot: hidden from humans, tempting for bots. */}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="absolute -left-[9999px] h-0 w-0 opacity-0"
          />
          <Field label={t("auth.email")} required>
            <Input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("auth.emailPh")}
              autoComplete="email"
            />
          </Field>
          {error ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}
          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? t("auth.sending") : t("auth.sendResetLink")}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}