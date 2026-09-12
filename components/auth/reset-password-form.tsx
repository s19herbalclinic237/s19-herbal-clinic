"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import { AuthShell } from "@/components/auth/auth-shell";
import { Field } from "@/components/ui/form";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";

export function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const { resetPassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match.");
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
        eyebrow="Account recovery"
        title="Invalid reset link"
        lead="This password reset link is missing or invalid. Request a new one below."
        footer={
          <>
            <Link href="/account/forgot-password" className="font-semibold text-forest-800 underline underline-offset-2">
              Request a new reset link
            </Link>
          </>
        }
      />
    );
  }

  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Choose a new password"
      lead="Your new password must be at least 8 characters long."
      footer={
        <>
          Remember your password?{" "}
          <Link href="/account" className="font-semibold text-forest-800 underline underline-offset-2">
            Sign in
          </Link>
        </>
      }
    >
      {done ? (
        <div className="rounded-lg border border-forest-200 bg-forest-50 px-4 py-5 text-sm text-ink">
          <p>Your password has been reset. You can now sign in with your new password.</p>
          <Link
            href="/account"
            className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-lg bg-forest-800 px-5 text-sm font-semibold text-white hover:bg-forest-900"
          >
            Sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field label="New Password" hint="At least 8 characters.">
            <PasswordInput
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </Field>
          <Field label="Confirm New Password" required>
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
            {submitting ? "Saving..." : "Reset password"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}