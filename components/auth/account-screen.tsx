"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import { Field, Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { FaCheck, FaRegCircleXmark } from "react-icons/fa6";

type Mode = "login" | "register";

export function AccountScreen() {
  const { user, loading, login, register, logout, resendVerification } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resent, setResent] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-forest-200 border-t-forest-800" />
      </div>
    );
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (mode === "register" && password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    const err =
      mode === "login"
        ? await login(email, password)
        : await register(name, email, password);
    setSubmitting(false);
    if (err) setError(err);
  }

  if (user) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-12 md:py-20">
        <div className="overflow-hidden rounded-xl border border-line bg-white shadow-lift">
          <div className="bg-forest-950 px-6 py-6 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-gold-400">
              Your account
            </p>
            <h1 className="mt-2 text-2xl text-white">Welcome, {user.name.split(" ")[0]}</h1>
            <p className="mt-1 text-sm text-forest-200">{user.email}</p>
          </div>
          <div className="space-y-4 p-6 md:p-8">
            <div
              className={
                user.emailVerified
                  ? "flex items-center gap-2 rounded-lg border border-forest-200 bg-forest-50 px-4 py-3 text-sm text-forest-800"
                  : "flex items-start gap-2 rounded-lg border border-gold-300 bg-gold-50 px-4 py-3 text-sm text-ink"
              }
            >
              {user.emailVerified ? (
                <>
                  <FaCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  <span>Email verified. Thank you!</span>
                </>
              ) : (
                <>
                  <FaRegCircleXmark className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" aria-hidden />
                  <span>
                    Your email is not verified yet. Check your inbox for the verification link, or{" "}
                    <button
                      type="button"
                      onClick={async () => {
                        await resendVerification(user.email);
                        setResent(true);
                      }}
                      className="font-semibold text-forest-800 underline underline-offset-2"
                    >
                      resend it
                    </button>
                    {resent ? " (sent - check your inbox)" : ""}
                  </span>
                </>
              )}
            </div>

            <div className="rounded-lg border border-line bg-cream px-4 py-3 text-sm text-muted">
              Your dashboard with order history, messages, and more is coming in the next step.
            </div>

            <Button variant="dark" className="w-full" onClick={() => logout()}>
              Sign out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 md:py-20">
      <div className="mx-auto w-full max-w-md px-4">
        <div className="overflow-hidden rounded-xl border border-line bg-white shadow-lift">
          <div className="bg-forest-950 px-6 py-6 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-gold-400">
              S19 Herbal Clinic
            </p>
            <h1 className="mt-2 text-2xl text-white">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="mt-2 text-sm text-forest-200">
              {mode === "login"
                ? "Sign in to manage your orders, testimonials, and messages."
                : "Join to track orders, receive updates, and more."}
            </p>
          </div>
          <div className="p-6 md:p-8">
            <div className="mb-5 grid grid-cols-2 gap-1 rounded-lg border border-line-strong bg-cream p-1">
              {(["login", "register"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMode(m);
                    setError(null);
                  }}
                  className={
                    mode === m
                      ? "rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-forest-800 shadow-sm"
                      : "rounded-md px-3 py-1.5 text-sm font-medium text-muted hover:text-ink"
                  }
                >
                  {m === "login" ? "Sign in" : "Create account"}
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="space-y-4">
              {mode === "register" ? (
                <Field label="Full Name" required>
                  <Input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    autoComplete="name"
                  />
                </Field>
              ) : null}
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
              <Field label="Password" hint={mode === "register" ? "At least 8 characters." : undefined}>
                <Input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
              </Field>
              {mode === "register" ? (
                <Field label="Confirm Password" required>
                  <Input
                    required
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </Field>
              ) : null}

              {error ? (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              ) : null}

              <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                {submitting ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
              </Button>
            </form>

            {mode === "login" ? (
              <div className="mt-4 text-center text-sm">
                <Link href="/account/forgot-password" className="font-medium text-forest-800 underline underline-offset-2">
                  Forgot your password?
                </Link>
              </div>
            ) : (
              <p className="mt-4 text-center text-xs leading-relaxed text-muted">
                By creating an account you agree to the S19 privacy and terms policies. We will send
                a verification email - please check your inbox.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}