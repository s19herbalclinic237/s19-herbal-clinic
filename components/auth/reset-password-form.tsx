"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import { AuthShell } from "@/components/auth/auth-shell";
import { Field } from "@/components/ui/form";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/i18n/locale-provider";

export function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const { resetPassword } = useAuth();
  const { t } = useLocale();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError(t("auth.passwordsMismatch"));
      return;
    }
    setSubmitting(true);
    const err = await resetPassword(token, password);
    setSubmitting(false);
    if (err) setError(err);
    else setDone(true);
  }

  if (!token) {
    return (
      <AuthShell
        eyebrow={t("auth.recoveryEyebrow")}
        title={t("auth.invalidResetTitle")}
        lead={t("auth.invalidResetLead")}
        footer={
          <>
            <Link href="/account/forgot-password" className="font-semibold text-forest-800 underline underline-offset-2">
              {t("auth.requestNewLink")}
            </Link>
          </>
        }
      />
    );
  }

  return (
    <AuthShell
      eyebrow={t("auth.recoveryEyebrow")}
      title={t("auth.resetTitle")}
      lead={t("auth.resetLead")}
      footer={
        <>
          {t("auth.rememberPassword")}{" "}
          <Link href="/account" className="font-semibold text-forest-800 underline underline-offset-2">
            {t("auth.signIn")}
          </Link>
        </>
      }
    >
      {done ? (
        <div className="rounded-lg border border-forest-200 bg-forest-50 px-4 py-5 text-sm text-ink">
          <p>{t("auth.resetDone")}</p>
          <Link
            href="/account"
            className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-lg bg-forest-800 px-5 text-sm font-semibold text-white hover:bg-forest-900"
          >
            {t("auth.signIn")}
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field label={t("auth.newPassword")} hint={t("auth.passwordHint")}>
            <PasswordInput
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </Field>
          <Field label={t("auth.confirmNewPassword")} required>
            <PasswordInput
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </Field>
          {error ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}
          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? t("auth.saving") : t("auth.resetSubmit")}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}