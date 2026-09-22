"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  type DashboardData,
  type MessageView,
  type OrderSummary,
  type PatientTabId,
  type TestimonialView,
} from "@/components/account/dashboard-data";
import { formatDate, OrderStatusBadge, TestimonialStatusBadge } from "@/components/account/badges";
import { UserAvatar } from "@/components/account/user-avatar";
import { formatFcfa } from "@/lib/utils";
import { CLINIC, waLink } from "@/lib/site";
import {
  FaArrowRight,
  FaBoxOpen,
  FaCircleUser,
  FaClock,
  FaCommentDots,
  FaEnvelope,
  FaEnvelopeOpen,
  FaGear,
  FaLocationDot,
  FaRegCircleXmark,
  FaWhatsapp,
} from "react-icons/fa6";

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export { initialsOf } from "@/components/account/user-avatar";

/* ── Small building blocks ─────────────────────────────────────────────── */

function VitalMini({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-white/10 px-2 py-3 text-center">
      <p className="font-display text-lg font-bold leading-none text-white">{value}</p>
      <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-wide text-forest-200">
        {label}
      </p>
    </div>
  );
}

function StatCard({
  icon,
  iconClass,
  label,
  value,
  sub,
  badge,
  onClick,
}: {
  icon: ReactNode;
  iconClass: string;
  label: string;
  value: ReactNode;
  sub: string;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-w-[186px] shrink-0 cursor-pointer items-center gap-3.5 rounded-2xl bg-white p-4 text-left shadow-card ring-1 ring-transparent transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift hover:ring-forest-200 sm:min-w-0 sm:flex-1"
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12 ${iconClass}`}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted">
          {label}
        </span>
        <span className="block truncate font-display text-lg font-bold leading-snug text-ink sm:text-xl">
          {value}
        </span>
        <span className="block truncate text-[11px] text-muted">{sub}</span>
        {badge ? (
          <span className="mt-1 inline-block rounded-full bg-gold-400/20 px-2.5 py-0.5 text-[10px] font-bold text-[#8a6e1a]">
            {badge}
          </span>
        ) : null}
      </span>
    </button>
  );
}

function Card({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-white shadow-card">
      <header className="flex items-center justify-between gap-3 border-b border-forest-100 px-5 py-4">
        <h2 className="font-display text-base font-bold text-ink">{title}</h2>
        {action || null}
      </header>
      {children}
    </section>
  );
}

function CardAction({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-forest-800 transition-colors hover:text-gold-600"
    >
      {children}
      <FaArrowRight className="h-3 w-3" aria-hidden />
    </button>
  );
}

function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="divide-y divide-forest-50 px-5">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-4">
          <div className="h-11 w-11 shrink-0 animate-pulse rounded-xl bg-forest-100" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-2/5 animate-pulse rounded bg-forest-100" />
            <div className="h-3 w-3/5 animate-pulse rounded bg-forest-50" />
          </div>
          <div className="h-3.5 w-16 animate-pulse rounded bg-forest-100" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  sub,
  children,
}: {
  icon: ReactNode;
  title: string;
  sub: string;
  children?: ReactNode;
}) {
  return (
    <div className="px-5 py-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-forest-100 text-forest-800">
        {icon}
      </div>
      <p className="mt-3 text-sm font-bold text-ink">{title}</p>
      <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-muted">{sub}</p>
      {children ? <div className="mt-4 flex justify-center">{children}</div> : null}
    </div>
  );
}

/* ── Section cards ─────────────────────────────────────────────────────── */

function RecentOrdersCard({
  orders,
  loading,
  onNavigate,
}: {
  orders: OrderSummary[];
  loading: boolean;
  onNavigate: (tab: PatientTabId) => void;
}) {
  return (
    <Card
      title="Recent Orders"
      action={
        orders.length > 0 ? <CardAction onClick={() => onNavigate("orders")}>View all</CardAction> : null
      }
    >
      {loading ? (
        <ListSkeleton />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<FaBoxOpen className="h-5 w-5" aria-hidden />}
          title="No orders yet"
          sub="Browse the online catalog and place your first order - we will track it here for you."
        >
          <Link
            href="/shop"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-forest-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-forest-800"
          >
            Browse the catalog
          </Link>
        </EmptyState>
      ) : (
        <ul className="divide-y divide-forest-50">
          {orders.slice(0, 3).map((o) => (
            <li
              key={o._id}
              className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-forest-50/60"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-forest-100 text-forest-800">
                <FaBoxOpen className="h-4 w-4" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-ink">{o.orderReference}</span>
                <span className="block text-xs text-muted">
                  {formatDate(o.createdAt)} ·{" "}
                  {(() => {
                    const count = o.items.reduce((n, i) => n + i.quantity, 0);
                    return `${count} item${count === 1 ? "" : "s"}`;
                  })()}
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block text-sm font-bold text-forest-800">{formatFcfa(o.total)}</span>
                <OrderStatusBadge status={o.status} />
              </span>
              <Link
                href={`/order/${o.orderReference}`}
                aria-label={`View order ${o.orderReference}`}
                className="ml-1 shrink-0 text-forest-700 transition-colors hover:text-gold-600"
              >
                <FaArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function RecentMessagesCard({
  messages,
  loading,
  onNavigate,
}: {
  messages: MessageView[];
  loading: boolean;
  onNavigate: (tab: PatientTabId) => void;
}) {
  return (
    <Card
      title="Messages from the Clinic"
      action={
        messages.length > 0 ? (
          <CardAction onClick={() => onNavigate("messages")}>View all</CardAction>
        ) : null
      }
    >
      {loading ? (
        <ListSkeleton />
      ) : messages.length === 0 ? (
        <EmptyState
          icon={<FaEnvelopeOpen className="h-5 w-5" aria-hidden />}
          title="No messages yet"
          sub="The clinic will reach out here with order updates and wellness notes."
        >
          <button
            type="button"
            onClick={() => onNavigate("messages")}
            className="inline-flex h-10 cursor-pointer items-center justify-center rounded-lg bg-forest-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-forest-800"
          >
            Open messages
          </button>
        </EmptyState>
      ) : (
        <ul className="divide-y divide-forest-50">
          {messages.slice(0, 3).map((m) => (
            <li key={m._id} className={`px-5 py-4 ${m.read ? "" : "bg-gold-400/[0.07]"}`}>
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 truncate text-sm font-bold text-ink">
                  {!m.read ? (
                    <span
                      className="mr-1.5 inline-block h-2 w-2 shrink-0 rounded-full bg-gold-500 align-middle"
                      aria-hidden
                    />
                  ) : null}
                  {m.subject}
                </p>
                <span className="shrink-0 text-[11px] text-muted">{formatDate(m.createdAt)}</span>
              </div>
              {m.body ? (
                <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted">{m.body}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function YourStoryCard({
  testimonials,
  loading,
  onNavigate,
}: {
  testimonials: TestimonialView[];
  loading: boolean;
  onNavigate: (tab: PatientTabId) => void;
}) {
  const latest = testimonials[0];
  return (
    <Card
      title="Your Story"
      action={
        testimonials.length > 0 ? (
          <CardAction onClick={() => onNavigate("testimonials")}>All</CardAction>
        ) : null
      }
    >
      {loading ? (
        <ListSkeleton rows={2} />
      ) : !latest ? (
        <EmptyState
          icon={<FaCommentDots className="h-5 w-5" aria-hidden />}
          title="Tell your S19 story"
          sub="Share how your healing journey is going - it encourages others on the same path."
        >
          <button
            type="button"
            onClick={() => onNavigate("testimonials")}
            className="inline-flex h-10 cursor-pointer items-center justify-center rounded-lg bg-forest-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-forest-800"
          >
            Drop a testimony
          </button>
        </EmptyState>
      ) : (
        <div className="px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ink">{latest.program}</p>
              <p className="text-xs text-muted">{formatDate(latest.createdAt)}</p>
            </div>
            <TestimonialStatusBadge status={latest.status} />
          </div>
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">{latest.text}</p>
          <button
            type="button"
            onClick={() => onNavigate("testimonials")}
            className="mt-4 inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-forest-800 transition-colors hover:text-gold-600"
          >
            Share another story
            <FaArrowRight className="h-3 w-3" aria-hidden />
          </button>
        </div>
      )}
    </Card>
  );
}

const quickActions: {
  label: string;
  sub: string;
  icon: ReactNode;
  iconClass: string;
  tab: PatientTabId;
}[] = [
  {
    label: "View orders",
    sub: "History & tracking",
    icon: <FaBoxOpen className="h-4 w-4" aria-hidden />,
    iconClass: "bg-forest-950/10 text-forest-950",
    tab: "orders",
  },
  {
    label: "Read messages",
    sub: "Clinic updates",
    icon: <FaEnvelopeOpen className="h-4 w-4" aria-hidden />,
    iconClass: "bg-gold-400/15 text-[#8a6e1a]",
    tab: "messages",
  },
  {
    label: "Share your story",
    sub: "Testimonies",
    icon: <FaCommentDots className="h-4 w-4" aria-hidden />,
    iconClass: "bg-forest-100 text-forest-800",
    tab: "testimonials",
  },
  {
    label: "Account settings",
    sub: "Profile & password",
    icon: <FaGear className="h-4 w-4" aria-hidden />,
    iconClass: "bg-amber-50 text-amber-700",
    tab: "settings",
  },
];

function QuickActions({ onNavigate }: { onNavigate: (tab: PatientTabId) => void }) {
  return (
    <Card title="Quick Actions">
      <div className="grid grid-cols-2 gap-3 p-5">
        {quickActions.map((a) => (
          <button
            key={a.tab}
            type="button"
            onClick={() => onNavigate(a.tab)}
            className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-forest-100 bg-forest-50/50 px-3 py-4 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-forest-300 hover:bg-forest-100/70 hover:shadow-card"
          >
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-xl text-base ${a.iconClass}`}
            >
              {a.icon}
            </span>
            <span>
              <span className="block text-xs font-bold text-ink">{a.label}</span>
              <span className="mt-0.5 block text-[10px] text-muted">{a.sub}</span>
            </span>
          </button>
        ))}
      </div>
    </Card>
  );
}

function HelpCard() {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-forest-950 p-5 text-white">
      <span aria-hidden className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/5" />
      <div className="relative">
        <p className="font-display text-base font-bold">Need help?</p>
        <p className="mt-1 text-xs leading-relaxed text-forest-200">
          Questions about your order, a remedy, or your account?
        </p>
        <a
          href={waLink("Hello S19 Herbal Clinic, I have a question about my account or my order.")}
          target="_blank"
          rel="noreferrer"
          className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-gold-400 text-sm font-bold text-forest-950 transition-colors hover:bg-gold-300"
        >
          <FaWhatsapp className="h-4 w-4" aria-hidden />
          Chat on WhatsApp
        </a>
        <ul className="mt-4 space-y-2.5 text-xs text-forest-200">
          <li className="flex gap-2.5">
            <FaClock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-400" aria-hidden />
            <span>{CLINIC.hours}</span>
          </li>
          <li className="flex gap-2.5">
            <FaLocationDot className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-400" aria-hidden />
            <span>{CLINIC.address}</span>
          </li>
          <li className="flex gap-2.5">
            <FaEnvelope className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-400" aria-hidden />
            <span className="break-all">{CLINIC.email}</span>
          </li>
        </ul>
      </div>
    </section>
  );
}

/* ── Overview ──────────────────────────────────────────────────────────── */

interface DashboardOverviewProps {
  data: DashboardData;
  onNavigate: (tab: PatientTabId) => void;
}

export function DashboardOverview({ data, onNavigate }: DashboardOverviewProps) {
  const { user, resendVerification } = useAuth();
  const { orders, messages, testimonials, unreadCount, loading } = data;
  const [resent, setResent] = useState(false);

  const firstName = user?.name?.trim().split(/\s+/)[0] || "there";
  const greeting = getGreeting();
  const dateLabel = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const activeOrders = orders.filter(
    (o) => o.status !== "Delivered" && o.status !== "Cancelled"
  ).length;
  const pendingStories = testimonials.filter((t) => t.status === "pending").length;
  const memberSince = user?.createdAt ? new Date(user.createdAt).getFullYear() : null;

  return (
    <div className="space-y-5 lg:space-y-6">
      {/* Email verification notice */}
      {user && !user.emailVerified ? (
        <div className="flex items-start gap-2.5 rounded-2xl border border-gold-300/70 bg-gold-400/10 px-4 py-3 text-sm text-ink">
          <FaRegCircleXmark className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" aria-hidden />
          <span>
            Your email is not verified yet. Check your inbox for the verification link, or{" "}
            <button
              type="button"
              onClick={async () => {
                await resendVerification(user.email);
                setResent(true);
              }}
              className="cursor-pointer font-semibold text-forest-800 underline underline-offset-2"
            >
              resend it
            </button>
            {resent ? " (sent - check your inbox)" : ""}
          </span>
        </div>
      ) : null}

      {/* Mobile hero */}
      <div className="relative overflow-hidden rounded-3xl bg-forest-950 px-6 pb-6 pt-7 shadow-lift lg:hidden">
        <span aria-hidden className="pointer-events-none absolute -right-12 -top-14 h-44 w-44 rounded-full bg-white/5" />
        <span aria-hidden className="pointer-events-none absolute -bottom-12 right-8 h-28 w-28 rounded-full bg-gold-400/10" />
        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-display text-[22px] font-bold leading-snug text-white">
              {greeting},
            </p>
            <p className="font-display text-[22px] font-bold leading-snug text-white">{firstName}</p>
            <p className="mt-2 text-xs leading-relaxed text-forest-200">{dateLabel}</p>
          </div>
          <UserAvatar
            user={user}
            className="h-16 w-16 border-2 border-gold-400 shadow-lift"
            textClassName="font-display text-lg font-bold text-gold-300"
          />
        </div>
        <div className="relative mt-5 grid grid-cols-3 gap-2">
          <VitalMini value={loading ? "—" : String(orders.length)} label="Orders" />
          <VitalMini value={loading ? "—" : String(unreadCount)} label="Unread" />
          <VitalMini value={loading ? "—" : String(testimonials.length)} label="Stories" />
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar sm:grid sm:grid-cols-2 sm:gap-3 sm:overflow-visible sm:pb-0 lg:grid-cols-4">
        <StatCard
          icon={<FaBoxOpen className="h-5 w-5" aria-hidden />}
          iconClass="bg-forest-950/10 text-forest-950"
          label="Orders placed"
          value={loading ? "—" : orders.length}
          sub={
            orders.length > 0
              ? activeOrders > 0
                ? `${activeOrders} in progress`
                : "All delivered"
              : "No orders yet"
          }
          onClick={() => onNavigate("orders")}
        />
        <StatCard
          icon={<FaEnvelopeOpen className="h-5 w-5" aria-hidden />}
          iconClass="bg-gold-400/15 text-[#8a6e1a]"
          label="Unread messages"
          value={loading ? "—" : unreadCount}
          sub={unreadCount > 0 ? "Waiting from the clinic" : "You're all caught up"}
          badge={unreadCount > 0 ? "New" : undefined}
          onClick={() => onNavigate("messages")}
        />
        <StatCard
          icon={<FaCommentDots className="h-5 w-5" aria-hidden />}
          iconClass="bg-forest-100 text-forest-800"
          label="Your stories"
          value={loading ? "—" : testimonials.length}
          sub={
            pendingStories > 0
              ? `${pendingStories} awaiting review`
              : testimonials.length > 0
                ? "Shared with S19"
                : "Share your experience"
          }
          onClick={() => onNavigate("testimonials")}
        />
        <StatCard
          icon={<FaCircleUser className="h-5 w-5" aria-hidden />}
          iconClass="bg-amber-50 text-amber-700"
          label="Account"
          value={user?.emailVerified ? "Verified" : "Verify email"}
          sub={memberSince ? `Member since ${memberSince}` : "Update your profile"}
          onClick={() => onNavigate("settings")}
        />
      </div>

      {/* Content columns */}
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6">
        <div className="min-w-0 space-y-5 lg:space-y-6">
          <RecentOrdersCard orders={orders} loading={loading} onNavigate={onNavigate} />
          <RecentMessagesCard messages={messages} loading={loading} onNavigate={onNavigate} />
        </div>
        <div className="min-w-0 space-y-5 lg:space-y-6">
          <YourStoryCard testimonials={testimonials} loading={loading} onNavigate={onNavigate} />
          <QuickActions onNavigate={onNavigate} />
          <HelpCard />
        </div>
      </div>
    </div>
  );
}