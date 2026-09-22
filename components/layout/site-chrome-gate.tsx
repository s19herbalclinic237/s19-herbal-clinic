"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";

/**
 * Hides the regular public-site chrome (announcement bar, header, footer,
 * floating FABs) while a signed-in user is inside the `/account` dashboard,
 * so the dashboard behaves like a full-screen app: header/page footer/FABs
 * are removed and the shell takes the full width and height of the viewport.
 */
export function SiteChromeGate({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const inDashboard = pathname === "/account" && !!user;
  return inDashboard ? null : <>{children}</>;
}