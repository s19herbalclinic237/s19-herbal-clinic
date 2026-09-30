"use client";

import Link from "next/link";
import { buttonLinkClasses } from "@/components/ui/button";
import { useErrorCopy } from "@/components/system/use-error-copy";
import { CLINIC } from "@/lib/site";
import { FaLeaf } from "react-icons/fa6";

/**
 * Error boundary for everything below the root layout. Handles errors thrown
 * while rendering a page, a layout below the root, or a client component.
 *
 * `retry` replaces the older `reset` prop in this Next.js version and re-fetches
 * the failed segment, which is the right recovery for a transient failure
 * without a full reload.
 */
export default function AppError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const copy = useErrorCopy();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <FaLeaf className="h-10 w-10 text-forest-300" aria-hidden />
      <h1 className="mt-6 font-display text-3xl font-semibold text-forest-900">
        {copy.title}
      </h1>
      <p className="mt-3 max-w-md text-sm text-muted">{copy.body}</p>

      {error.digest ? (
        <p className="mt-6 rounded-md border border-line bg-white px-3 py-2 text-xs text-muted">
          {copy.reference}:{" "}
          <code className="font-mono text-[11px] text-ink">{error.digest}</code>
          <br />
          <span className="text-[11px]">{copy.referenceHint}</span>
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={() => retry()} className={buttonLinkClasses("primary", "lg")}>
          {copy.retry}
        </button>
        <Link href="/" className={buttonLinkClasses("secondary", "lg")}>
          {copy.home}
        </Link>
      </div>

      <p className="mt-8 text-xs text-muted">
        <a href={`tel:${CLINIC.phoneHref}`} className="underline">
          {CLINIC.phone}
        </a>{" "}
        ·{" "}
        <a href={`https://wa.me/${CLINIC.whatsappNumber}`} className="underline">
          WhatsApp
        </a>{" "}
        — {copy.call}
      </p>
    </div>
  );
}
