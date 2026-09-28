"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { AuthShell } from "@/components/auth/auth-shell";
import { buttonLinkClasses } from "@/components/ui/button";
import { FaCheck, FaRegCircleXmark } from "react-icons/fa6";
import { useLocale } from "@/components/i18n/locale-provider";

export function VerifyEmailPanel() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const { verifyEmail } = useAuth();
  const { t } = useLocale();
  const [state, setState] = useState<"verifying" | "verified" | "error">(
    token ? "verifying" : "error"
  );
  const [error, setError] = useState<string | null>(
    token ? null : t("auth.verifyFailedLead")
  );

  useEffect(() => {
    if (!token) return;
    let active = true;
    verifyEmail(token).then(
      (err) => {
        if (active) {
          setError(err);
          setState(err ? "error" : "verified");
        }
      },
      () => {
        if (active) setState("error");
      }
    );
    return () => {
      active = false;
    };
  }, [token, verifyEmail]);

  const footer = (
    <>
      {t("auth.alreadyVerified")}{" "}
      <Link href="/account" className="font-semibold text-forest-800 underline underline-offset-2">
        {t("auth.signIn")}
      </Link>
    </>
  );

  if (state === "verifying") {
    return (
      <AuthShell eyebrow={t("auth.accountEyebrow")} title={t("auth.verifyingTitle")} footer={footer}>
        <div className="flex justify-center py-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-forest-200 border-t-forest-800" />
        </div>
      </AuthShell>
    );
  }

  if (state === "verified") {
    return (
      <AuthShell
        eyebrow={t("auth.accountEyebrow")}
        title={t("auth.verifiedTitle")}
        lead={t("auth.verifiedLead")}
        footer={footer}
      >
        <div className="flex flex-col items-center gap-4 py-2">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-forest-50">
            <FaCheck className="h-6 w-6 text-forest-700" aria-hidden />
          </span>
          <Link href="/account" className={buttonLinkClasses("primary", "lg", "w-full")}>
            {t("auth.goToAccount")}
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow={t("auth.accountEyebrow")}
      title={t("auth.verifyFailedTitle")}
      lead={error || t("auth.verifyFailedLead")}
      footer={footer}
    >
      <div className="flex flex-col items-center gap-4 py-2">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
          <FaRegCircleXmark className="h-6 w-6 text-red-500" aria-hidden />
        </span>
        <Link href="/account" className={buttonLinkClasses("outline", "lg", "w-full")}>
          {t("auth.signInNewLink")}
        </Link>
      </div>
    </AuthShell>
  );
}