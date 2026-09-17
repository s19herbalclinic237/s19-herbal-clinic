"use client";

import { LOCALE_OPTIONS, type Locale } from "@/lib/i18n";
import { useLocale } from "@/components/i18n/locale-provider";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useLocale();

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg border border-line-strong bg-white p-0.5 shadow-sm",
        className
      )}
      role="group"
      aria-label="Language / Langue"
    >
      {LOCALE_OPTIONS.map((opt) => {
        const active = locale === opt.code;
        return (
          <button
            key={opt.code}
            type="button"
            onClick={() => setLocale(opt.code as Locale)}
            aria-pressed={active}
            className={cn(
              "h-7 rounded-md px-2.5 text-xs font-bold tracking-wide transition-colors",
              active
                ? "bg-forest-800 text-white"
                : "text-ink/70 hover:bg-forest-50 hover:text-forest-800"
            )}
          >
            {opt.short}
          </button>
        );
      })}
    </div>
  );
}