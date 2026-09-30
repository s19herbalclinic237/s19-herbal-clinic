"use client";

import Link from "next/link";
import { useErrorCopy } from "@/components/system/use-error-copy";
import { CLINIC } from "@/lib/site";

/**
 * Last-resort error boundary: errors thrown by the root layout itself, or that
 * escape every nested boundary.
 *
 * This component replaces the root layout, so per the framework it must supply
 * its own `<html>` and `<body>` - and it does not inherit the global
 * stylesheet, which is why the styling here is inline rather than Tailwind
 * classes. The minimal reset below is all that is needed.
 *
 * Every failure that reaches the server is recorded in the durable error log by
 * the `onRequestError` hook in `instrumentation.ts`, so the reference code
 * shown here can be matched against the admin panel.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const copy = useErrorCopy();

  return (
    <html lang="en">
      <head>
        <title>{copy.title}</title>
        <style>{`
          *, *::before, *::after { box-sizing: border-box; }
          html, body { margin: 0; padding: 0; }
          body {
            background: #f5faf7;
            color: #13201b;
            font-family: Arial, Helvetica, sans-serif;
            line-height: 1.6;
            -webkit-font-smoothing: antialiased;
          }
          a { color: #1a6b50; }
        `}</style>
      </head>
      <body>
        <main
          style={{
            maxWidth: "36rem",
            margin: "0 auto",
            padding: "6rem 1.5rem",
            textAlign: "center",
          }}
        >
          <p
            aria-hidden
            style={{ fontSize: "2.5rem", lineHeight: 1, color: "#124034" }}
          >
            &#127807;
          </p>
          <h1 style={{ fontSize: "1.75rem", margin: "1.25rem 0 0", color: "#124034" }}>
            {copy.title}
          </h1>
          <p style={{ margin: "0.75rem 0 0", fontSize: "0.9rem", color: "#6b7a74" }}>
            {copy.body}
          </p>

          {error.digest ? (
            <p
              style={{
                margin: "1.5rem 0 0",
                padding: "0.75rem",
                background: "#ffffff",
                border: "1px solid #e2ebe6",
                borderRadius: "8px",
                fontSize: "0.75rem",
                color: "#6b7a74",
              }}
            >
              {copy.reference}:{" "}
              <code style={{ fontFamily: "monospace", color: "#13201b" }}>{error.digest}</code>
              <br />
              <span style={{ fontSize: "0.7rem" }}>{copy.referenceHint}</span>
            </p>
          ) : null}

          <div
            style={{
              marginTop: "1.5rem",
              display: "flex",
              flexWrap: "wrap",
              gap: "0.75rem",
              justifyContent: "center",
            }}
          >
            <button
              type="button"
              onClick={() => retry()}
              style={{
                background: "#1a6b50",
                color: "#ffffff",
                border: 0,
                borderRadius: "8px",
                padding: "0.8rem 1.5rem",
                fontSize: "0.9rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {copy.retry}
            </button>
            <Link
              href="/"
              style={{
                display: "inline-block",
                background: "#ffffff",
                color: "#124034",
                border: "1px solid #e2ebe6",
                borderRadius: "8px",
                padding: "0.8rem 1.5rem",
                fontSize: "0.9rem",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              {copy.home}
            </Link>
          </div>

          <p style={{ marginTop: "2.5rem", fontSize: "0.75rem", color: "#6b7a74" }}>
            <a href={`tel:${CLINIC.phoneHref}`}>{CLINIC.phone}</a> ·{" "}
            <a href={`https://wa.me/${CLINIC.whatsappNumber}`}>WhatsApp</a> — {copy.call}
          </p>
        </main>
      </body>
    </html>
  );
}
