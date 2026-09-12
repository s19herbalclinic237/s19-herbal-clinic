"use client";

import { Toaster } from "react-hot-toast";
import { CartProvider } from "@/lib/cart-context";
import { AuthProvider } from "@/lib/auth-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
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
  );
}