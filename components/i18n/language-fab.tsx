"use client";

import { LanguageSwitcher } from "@/components/i18n/language-switcher";

/**
 * Floating language toggle shown on small screens (phones) where the header
 * switcher is hidden. Sits bottom-left, opposite the WhatsApp float button.
 */
export function LanguageFab() {
  return (
    <div className="fixed bottom-4 left-4 z-30 lg:hidden">
      <LanguageSwitcher />
    </div>
  );
}