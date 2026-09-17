"use client";

import { Toaster } from "react-hot-toast";
import { CartProvider } from "@/lib/cart-context";
import { AuthProvider } from "@/lib/auth-context";
import { LocaleProvider } from "@/components/i18n/locale-provider";
import type { Locale } from "@/lib/i18n";

export function Providers({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  return (
    <LocaleProvider initialLocale={initialLocale}>
      <AuthProvider>
        <CartProvider>
          {children}
          <Toaster
            position="bottom-center"
            toastOptions={{
              style: {
                background: "#124034",
                color: "#ffffff",
                border: "1px solid #1a624c",
                fontSize: "14px",
              },
            }}
          />
        </CartProvider>
      </AuthProvider>
    </LocaleProvider>
  );
}