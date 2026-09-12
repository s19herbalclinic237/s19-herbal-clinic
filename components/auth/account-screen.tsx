"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import { DashboardScreen } from "@/components/account/dashboard-screen";
import { Field, Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";

type Mode = "login" | "register";

export function AccountScreen() {
  const { user, loading, login, register } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
    return <DashboardScreen />;
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
                <PasswordInput
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
              </Field>
              {mode === "register" ? (
                <Field label="Confirm Password" required>
                  <PasswordInput
                    required
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