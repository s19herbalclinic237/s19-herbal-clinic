"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { AuthShell } from "@/components/auth/auth-shell";
import { buttonLinkClasses } from "@/components/ui/button";
import { FaCheck, FaRegCircleXmark } from "react-icons/fa6";

export function VerifyEmailPanel() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const { verifyEmail } = useAuth();
  const [state, setState] = useState<"verifying" | "verified" | "error">(
    token ? "verifying" : "error"
  );
  const [error, setError] = useState<string | null>(
    token ? null : "This verification link is missing or invalid."
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
      Already verified?{" "}
      <Link href="/account" className="font-semibold text-forest-800 underline underline-offset-2">
        Sign in
      </Link>
    </>
  );

  if (state === "verifying") {
    return (
      <AuthShell eyebrow="Account" title="Verifying your email..." footer={footer}>
        <div className="flex justify-center py-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-forest-200 border-t-forest-800" />
        </div>
      </AuthShell>
    );
  }

  if (state === "verified") {
    return (
      <AuthShell
        eyebrow="Account"
        title="Email verified"
        lead="Your email address has been verified. You can now sign in to your account."
        footer={footer}
      >
        <div className="flex flex-col items-center gap-4 py-2">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-forest-50">
            <FaCheck className="h-6 w-6 text-forest-700" aria-hidden />
          </span>
          <Link href="/account" className={buttonLinkClasses("primary", "lg", "w-full")}>
            Go to your account
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Account"
      title="Verification failed"
      lead={error || "This verification link is invalid or has expired."}
      footer={footer}
    >
      <div className="flex flex-col items-center gap-4 py-2">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
          <FaRegCircleXmark className="h-6 w-6 text-red-500" aria-hidden />
        </span>
        <Link href="/account" className={buttonLinkClasses("outline", "lg", "w-full")}>
          Sign in to request a new link
        </Link>
      </div>
    </AuthShell>
  );
}