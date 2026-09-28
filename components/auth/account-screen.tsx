"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import { DashboardScreen } from "@/components/account/dashboard-screen";
import { Field, Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { SiteLoader } from "@/components/ui/site-loader";
import { useLocale } from "@/components/i18n/locale-provider";

type Mode = "login" | "register";

export function AccountScreen() {
  const { user, loading, login, register } = useAuth();
  const { t } = useLocale();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <SiteLoader label={t("auth.checkingSession")} />
      </div>
    );
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (mode === "register" && password !== confirm) {
      setError(t("auth.passwordsMismatch"));
      return;
    }
    const form = e.currentTarget;
    const botField = new FormData(form).get("website");
    const bot = typeof botField === "string" ? botField : "";
    if (!email.trim() || (!password && mode === "login")) {
      setError(t("auth.enterAccount"));
      return;
    }
    setSubmitting(true);
    const err =
      mode === "login"
        ? await login(email, password, bot)
        : await register(name, phone, email, password, bot);
    setSubmitting(false);
    if (err) setError(err);
    else if (mode === "register") {
      setMode("login");
      setName("");
      setPhone("");
      setPassword("");
      setConfirm("");
      setNotice(t("auth.createdNotice", { email }));
    }
  }

  if (user) {
    return <DashboardScreen />;
  }

  return (
    <div className="py-12 md:py-20">
      <div className="mx-auto w-full max-w-md px-4">
        <div className="overflow-hidden rounded-xl border border-line bg-white shadow-lift">
          <div className="bg-forest-950 px-6 py-6 text-center">
            <h1 className="text-2xl text-white">
              {mode === "login" ? t("auth.login.title") : t("auth.register.title")}
            </h1>
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
                    setNotice(null);
                  }}
                  className={
                    mode === m
                      ? "rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-forest-800 shadow-sm"
                      : "rounded-md px-3 py-1.5 text-sm font-medium text-muted hover:text-ink"
                  }
                >
                  {m === "login" ? t("auth.login.tab") : t("auth.register.tab")}
                </button>
              ))}
            </div>

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
              {mode === "register" ? (
                <Field label={t("auth.fullName")} required>
                  <Input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("auth.fullNamePh")}
                    autoComplete="name"
                  />
                </Field>
              ) : null}
              {mode === "register" ? (
                <Field label={t("auth.phone")}>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t("auth.phonePh")}
                    autoComplete="tel"
                  />
                </Field>
              ) : null}
              <Field label={mode === "login" ? t("auth.emailOrPhone") : t("auth.email")} required>
                <Input
                  required
                  type={mode === "login" ? "text" : "email"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={mode === "login" ? "you@example.com or +237..." : t("auth.emailPh")}
                  autoComplete="email"
                />
              </Field>
              <Field label={t("auth.password")} hint={mode === "register" ? t("auth.passwordHint") : undefined}>
                <PasswordInput
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
              </Field>
              {mode === "register" ? (
                <Field label={t("auth.confirmPassword")} required>
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
              {notice ? (
                <p className="rounded-md border border-forest-200 bg-forest-50 px-3 py-2 text-sm text-forest-800">
                  {notice}
                </p>
              ) : null}

              <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                {submitting
                  ? t("auth.submitting")
                  : mode === "login"
                    ? t("auth.submitSignIn")
                    : t("auth.submitRegister")}
              </Button>
            </form>

            {mode === "login" ? (
              <div className="mt-4 text-center text-sm">
                <Link href="/account/forgot-password" className="font-medium text-forest-800 underline underline-offset-2">
                  {t("auth.forgotPassword")}
                </Link>
              </div>
            ) : (
              <p className="mt-4 text-center text-xs leading-relaxed text-muted">{t("auth.agreement")}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}