"use client";

import { useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { OrdersTab } from "@/components/account/orders-tab";
import { MessagesTab } from "@/components/account/messages-tab";
import { TestimonialsTab } from "@/components/account/testimonials-tab";
import { SettingsTab } from "@/components/account/settings-tab";
import { ProductsTab } from "@/components/admin/products-tab";
import { AdminOrdersTab } from "@/components/admin/orders-tab";
import { AdminTestimonialsTab } from "@/components/admin/testimonials-tab";
import { MessagingTab } from "@/components/admin/messaging-tab";
import {
  FaBoxOpen,
  FaCheck,
  FaCircleUser,
  FaCommentDots,
  FaEnvelope,
  FaGear,
  FaRegCircleXmark,
  FaShieldHalved,
  FaTags,
  FaTruckFast,
  FaUserGear,
} from "react-icons/fa6";

type TabId =
  | "overview"
  | "orders"
  | "messages"
  | "testimonials"
  | "settings"
  | "admin-products"
  | "admin-orders"
  | "admin-testimonials"
  | "admin-messaging";

const tabList: { id: TabId; label: string; icon: ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <FaCircleUser className="h-4 w-4" aria-hidden /> },
  { id: "orders", label: "Orders", icon: <FaBoxOpen className="h-4 w-4" aria-hidden /> },
  { id: "messages", label: "Messages", icon: <FaEnvelope className="h-4 w-4" aria-hidden /> },
  { id: "testimonials", label: "My Testimonials", icon: <FaCommentDots className="h-4 w-4" aria-hidden /> },
  { id: "settings", label: "Settings", icon: <FaGear className="h-4 w-4" aria-hidden /> },
];

const adminTabList: { id: TabId; label: string; icon: ReactNode }[] = [
  { id: "admin-products", label: "Products", icon: <FaTags className="h-4 w-4" aria-hidden /> },
  { id: "admin-orders", label: "Orders", icon: <FaTruckFast className="h-4 w-4" aria-hidden /> },
  { id: "admin-testimonials", label: "Testimonials", icon: <FaCommentDots className="h-4 w-4" aria-hidden /> },
  { id: "admin-messaging", label: "Users & Messages", icon: <FaUserGear className="h-4 w-4" aria-hidden /> },
];

function OverviewTab({ onNavigate }: { onNavigate: (tab: TabId) => void }) {
  const { user, resendVerification } = useAuth();
  const [resent, setResent] = useState(false);

  return (
    <div className="space-y-5">
      {user && !user.emailVerified ? (
        <div className="flex items-start gap-2 rounded-lg border border-gold-300 bg-gold-50 px-4 py-3 text-sm text-ink">
          <FaRegCircleXmark className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" aria-hidden />
          <span>
            Your email is not verified yet. Check your inbox for the verification link, or{" "}
            <button
              type="button"
              onClick={async () => {
                await resendVerification(user.email);
                setResent(true);
              }}
              className="font-semibold text-forest-800 underline underline-offset-2"
            >
              resend it
            </button>
            {resent ? " (sent - check your inbox)" : ""}
          </span>
        </div>
      ) : null}

      <div className="rounded-lg border border-line bg-white p-5">
        <p className="text-sm leading-relaxed text-muted">
          Welcome to your S19 Herbal Clinic dashboard. Here you can review your orders, receive
          messages from the clinic, share your story, and manage your profile.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onNavigate("orders")}
          className="flex items-center gap-3 rounded-lg border border-line bg-white p-4 text-left transition-colors hover:border-forest-300"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-forest-50 text-forest-700">
            <FaBoxOpen className="h-4 w-4" aria-hidden />
          </span>
          <span>
            <span className="block text-sm font-bold text-ink">Your Orders</span>
            <span className="block text-xs text-muted">History, totals &amp; tracking links</span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => onNavigate("messages")}
          className="flex items-center gap-3 rounded-lg border border-line bg-white p-4 text-left transition-colors hover:border-forest-300"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-forest-50 text-forest-700">
            <FaEnvelope className="h-4 w-4" aria-hidden />
          </span>
          <span>
            <span className="block text-sm font-bold text-ink">Messages from the Clinic</span>
            <span className="block text-xs text-muted">Order updates, reports &amp; news</span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => onNavigate("testimonials")}
          className="flex items-center gap-3 rounded-lg border border-line bg-white p-4 text-left transition-colors hover:border-forest-300"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-forest-50 text-forest-700">
            <FaCommentDots className="h-4 w-4" aria-hidden />
          </span>
          <span>
            <span className="block text-sm font-bold text-ink">Your Stories</span>
            <span className="block text-xs text-muted">Testimonials you have shared</span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => onNavigate("settings")}
          className="flex items-center gap-3 rounded-lg border border-line bg-white p-4 text-left transition-colors hover:border-forest-300"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-forest-50 text-forest-700">
            <FaGear className="h-4 w-4" aria-hidden />
          </span>
          <span>
            <span className="block text-sm font-bold text-ink">Settings</span>
            <span className="block text-xs text-muted">Profile details &amp; password</span>
          </span>
        </button>
      </div>
    </div>
  );
}

export function DashboardScreen() {
  const { user } = useAuth();
  const [tab, setTab] = useState<TabId>("overview");
  const isAdmin = user?.role === "admin";

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 md:py-12">
      <div className="overflow-hidden rounded-xl border border-line bg-white shadow-lift">
        <div className="bg-forest-950 px-6 py-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-gold-400">Your account</p>
              <h1 className="mt-1 text-2xl text-white">{user?.name || "Welcome"}</h1>
              <p className="mt-0.5 break-all text-sm text-forest-200">{user?.email}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {isAdmin ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-500/60 bg-gold-500/10 px-3 py-1 text-xs font-semibold text-gold-300">
                  <FaShieldHalved className="h-3 w-3" aria-hidden />
                  Clinic admin
                </span>
              ) : null}
              {user?.emailVerified ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-forest-600 bg-forest-900 px-3 py-1 text-xs font-semibold text-forest-100">
                  <FaCheck className="h-3 w-3 text-gold-400" aria-hidden />
                  Email verified
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-0 md:flex-row">
          <nav className="flex w-full shrink-0 gap-1 overflow-x-auto border-b border-line bg-cream p-2 md:w-56 md:flex-col md:gap-1 md:border-b-0 md:border-r">
            {tabList.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={
                  tab === t.id
                    ? "flex shrink-0 items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-forest-800 shadow-sm"
                    : "flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted hover:text-ink"
                }
              >
                {t.icon}
                {t.label}
              </button>
            ))}
            {isAdmin ? (
              <>
                <p className="mt-2 hidden px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted md:block md:border-t md:border-line md:pt-3">
                  Clinic admin
                </p>
                {adminTabList.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={
                      tab === t.id
                        ? "flex shrink-0 items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-forest-800 shadow-sm"
                        : "flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted hover:text-ink"
                    }
                  >
                    {t.icon}
                    {t.label}
                  </button>
                ))}
              </>
            ) : null}
          </nav>

          <div className="min-w-0 flex-1 p-5 md:p-6">
            {tab === "overview" ? <OverviewTab onNavigate={setTab} /> : null}
            {tab === "orders" ? <OrdersTab /> : null}
            {tab === "messages" ? <MessagesTab /> : null}
            {tab === "testimonials" ? <TestimonialsTab /> : null}
            {tab === "settings" ? <SettingsTab /> : null}
            {isAdmin && tab === "admin-products" ? <ProductsTab /> : null}
            {isAdmin && tab === "admin-orders" ? <AdminOrdersTab /> : null}
            {isAdmin && tab === "admin-testimonials" ? <AdminTestimonialsTab /> : null}
            {isAdmin && tab === "admin-messaging" ? <MessagingTab /> : null}
          </div>
        </div>
      </div>
    </div>
  );
}