"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import { AuthShell } from "@/components/auth/auth-shell";
import { Field, Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

export function ForgotPasswordForm() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const err = await forgotPassword(email);
    setSubmitting(false);
    if (err) setError(err);
    else setSent(true);
  }

  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Forgot your password?"
      lead="Enter the email for your account and we will send you a link to reset your password."
      footer={
        <>
          Remember your password?{" "}
          <Link href="/account" className="font-semibold text-forest-800 underline underline-offset-2">
            Sign in
          </Link>
        </>
      }
    >
      {sent ? (
        <div className="rounded-lg border border-forest-200 bg-forest-50 px-4 py-5 text-sm text-ink">
          <p>
            If an account exists for <strong>{email}</strong>, a password reset link has been sent.
            Check your inbox (and spam folder).
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field label="Email" required>
            <Input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </Field>
          {error ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}
          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? "Sending..." : "Send reset link"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}