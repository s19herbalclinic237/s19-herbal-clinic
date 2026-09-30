"use client";

import { useMemo, useSyncExternalStore } from "react";
import { COOKIE_NAME, parseLocale, translate, type Locale, type TranslationKey } from "@/lib/i18n";

export interface ErrorCopy {
  title: string;
  body: string;
  retry: string;
  home: string;
  call: string;
  reference: string;
  referenceHint: string;
}

const KEYS: Record<keyof ErrorCopy, TranslationKey> = {
  title: "sys.error.title",
  body: "sys.error.body",
  retry: "sys.error.retry",
  home: "sys.error.home",
  call: "sys.error.call",
  reference: "sys.error.reference",
  referenceHint: "sys.error.referenceHint",
};

/**
 * Nothing to subscribe to: the cookie only changes when the visitor picks a
 * language, and that action reloads the page.
 */
function subscribe(): () => void {
  return () => {};
}

function readCookieLocale(): Locale {
  if (typeof document === "undefined") return "en";
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]*)`));
  return parseLocale(match?.[1]);
}

function readServerLocale(): Locale {
  return "en";
}

/**
 * Localised copy for the error pages.
 *
 * The locale is read straight from the cookie instead of through
 * `useLocale()` because `app/global-error.tsx` replaces the root layout, and the
 * provider that would normally supply the locale lives in that layout.
 * Depending on the provider there would throw precisely when the app has
 * already failed.
 *
 * `useSyncExternalStore` is used rather than an effect because the cookie is an
 * external value that differs between the server and the browser. The server
 * snapshot is English, so the first paint matches the server-rendered HTML and
 * React corrects to the real locale immediately afterwards - no hydration
 * mismatch, and no extra render pass.
 */
export function useErrorCopy(): ErrorCopy {
  const locale = useSyncExternalStore(subscribe, readCookieLocale, readServerLocale);

  return useMemo(() => {
    const out = {} as ErrorCopy;
    for (const name of Object.keys(KEYS) as Array<keyof ErrorCopy>) {
      out[name] = translate(locale, KEYS[name]);
    }
    return out;
  }, [locale]);
}
