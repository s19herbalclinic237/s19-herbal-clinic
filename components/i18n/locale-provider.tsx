"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  COOKIE_NAME,
  translate,
  type Locale,
  type TranslationKey,
  type TranslationParams,
} from "@/lib/i18n";

type TFunc = (key: TranslationKey, params?: TranslationParams) => string;

interface LocaleContextValue {
  locale: Locale;
  t: TFunc;
  setLocale: (l: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const t = useCallback<TFunc>(
    (key, params) => translate(locale, key, params),
    [locale]
  );

  const setLocale = useCallback(
    (l: Locale) => {
      setLocaleState(l);
      document.cookie = `${COOKIE_NAME}=${l}; path=/; max-age=31536000; samesite=lax`;
      window.location.reload();
    },
    []
  );

  const value = useMemo(
    () => ({ locale, t, setLocale }),
    [locale, t, setLocale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within a LocaleProvider");
  return ctx;
}