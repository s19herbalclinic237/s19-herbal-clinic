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
  type TreatmentPlanView,
} from "@/components/account/dashboard-data";
import {
  daysUntil,
  formatDate,
  OrderStatusBadge,
  TestimonialStatusBadge,
  TreatmentPhaseBadge,
} from "@/components/account/badges";
import { UserAvatar } from "@/components/account/user-avatar";
import { useLocale } from "@/components/i18n/locale-provider";
import type { TranslationKey } from "@/lib/i18n";
import { formatFcfa } from "@/lib/utils";
import { CLINIC, waLink } from "@/lib/site";
import {
  FaArrowRight,
  FaBoxOpen,
  FaCalendarCheck,
  FaCalendarDays,
  FaCircleUser,
  FaClock,
  FaCommentDots,
  FaEnvelope,
  FaEnvelopeOpen,
  FaFileMedical,
  FaGear,
  FaHourglassHalf,
  FaLocationDot,
  FaPeopleGroup,
  FaPills,
  FaRegCircleXmark,
  FaStar,
  FaWhatsapp,
} from "react-icons/fa6";

export function getGreeting(): "morning" | "afternoon" | "evening" {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
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
  label,
  value,
  sub,
  badge,
  onClick,
}: {
  icon: ReactNode;
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
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-forest-950/10 text-forest-950 sm:h-12 sm:w-12">
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
  const { t } = useLocale();
  return (
    <Card
      title={t("dash.overview.recentOrders")}
      action={
        orders.length > 0 ? (
          <CardAction onClick={() => onNavigate("orders")}>{t("dash.overview.viewAll")}</CardAction>
        ) : null
      }
    >
      {loading ? (
        <ListSkeleton />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<FaBoxOpen className="h-5 w-5" aria-hidden />}
          title={t("dash.overview.noOrdersTitle")}
          sub={t("dash.overview.noOrdersSub")}
        >
          <Link
            href="/shop"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-forest-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-forest-800"
          >
            {t("dash.overview.browseCatalog")}
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
                    return t(count === 1 ? "dash.overview.item" : "dash.overview.items", { n: count });
                  })()}
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block text-sm font-bold text-forest-800">{formatFcfa(o.total)}</span>
                <OrderStatusBadge status={o.status} />
              </span>
              <Link
                href={`/order/${o.orderReference}`}
                aria-label={t("dash.overview.viewOrder", { ref: o.orderReference })}
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
  const { t } = useLocale();
  return (
    <Card
      title={t("dash.overview.messagesFromClinic")}
      action={
        messages.length > 0 ? (
          <CardAction onClick={() => onNavigate("messages")}>{t("dash.overview.viewAll")}</CardAction>
        ) : null
      }
    >
      {loading ? (
        <ListSkeleton />
      ) : messages.length === 0 ? (
        <EmptyState
          icon={<FaEnvelopeOpen className="h-5 w-5" aria-hidden />}
          title={t("dash.overview.noMessagesTitle")}
          sub={t("dash.overview.noMessagesSub")}
        >
          <button
            type="button"
            onClick={() => onNavigate("messages")}
            className="inline-flex h-10 cursor-pointer items-center justify-center rounded-lg bg-forest-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-forest-800"
          >
            {t("dash.overview.openMessages")}
          </button>
        </EmptyState>
      ) : (
        <ul className="divide-y divide-forest-50">
          {messages.filter((m) => m.author !== "user").slice(0, 3).map((m) => (
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
  const { t } = useLocale();
  const latest = testimonials[0];
  return (
    <Card
      title={t("dash.overview.yourStory")}
      action={
        testimonials.length > 0 ? (
          <CardAction onClick={() => onNavigate("testimonials")}>{t("dash.overview.all")}</CardAction>
        ) : null
      }
    >
      {loading ? (
        <ListSkeleton rows={2} />
      ) : !latest ? (
        <EmptyState
          icon={<FaCommentDots className="h-5 w-5" aria-hidden />}
          title={t("dash.overview.tellStoryTitle")}
          sub={t("dash.overview.tellStorySub")}
        >
          <button
            type="button"
            onClick={() => onNavigate("testimonials")}
            className="inline-flex h-10 cursor-pointer items-center justify-center rounded-lg bg-forest-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-forest-800"
          >
            {t("dash.overview.dropTestimony")}
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
            {t("dash.overview.shareAnother")}
            <FaArrowRight className="h-3 w-3" aria-hidden />
          </button>
        </div>
      )}
    </Card>
  );
}

function TreatmentPlanCard({
  plans,
  loading,
  onNavigate,
}: {
  plans: TreatmentPlanView[];
  loading: boolean;
  onNavigate: (tab: PatientTabId) => void;
}) {
  const { t } = useLocale();
  const featured = plans.find((p) => p.phase === "active") ?? plans[0];
  const left = featured ? daysUntil(featured.endDate) : 0;

  return (
    <Card
      title={t("dash.overview.treatmentPlan")}
      action={
        plans.length > 0 ? (
          <CardAction onClick={() => onNavigate("treatment")}>{t("dash.overview.viewAll")}</CardAction>
        ) : null
      }
    >
      {loading ? (
        <ListSkeleton rows={2} />
      ) : !featured ? (
        <EmptyState
          icon={<FaCalendarDays className="h-5 w-5" aria-hidden />}
          title={t("dash.overview.noPlanTitle")}
          sub={t("dash.overview.noPlanSub")}
        />
      ) : (
        <div className="px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <p className="min-w-0 truncate text-sm font-bold text-ink">{featured.title}</p>
            <TreatmentPhaseBadge phase={featured.phase} />
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            {featured.phase === "scheduled"
              ? t("dash.overview.starts")
              : t("dash.overview.started")}{" "}
            <span className="font-semibold text-ink">{formatDate(featured.startDate)}</span>
            {" · "}
            {featured.phase === "scheduled" || featured.phase === "active"
              ? t("dash.overview.expectedCompletion")
              : t("dash.overview.completed")}{" "}
            <span className="font-semibold text-ink">
              {formatDate(featured.completedAt || featured.endDate)}
            </span>
            {featured.forMember ? ` · ${featured.forMember}` : ""}
          </p>
          {featured.phase === "active" && (featured.month != null || featured.day != null) ? (
            <p className="mt-2 text-xs font-semibold text-forest-800">
              {featured.month != null
                ? t("dash.overview.monthOf", { m: featured.month, n: featured.months })
                : null}
              {featured.month != null && featured.day != null ? " · " : null}
              {featured.day != null
                ? t("dash.overview.dayOf", { d: featured.day, n: featured.days })
                : null}
            </p>
          ) : null}
          {featured.phase === "active" ? (
            <p className="mt-3 inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
              <FaHourglassHalf className="h-3.5 w-3.5" aria-hidden />
              {left > 0
                ? t(left === 1 ? "dash.overview.dayLeft" : "dash.overview.daysLeft", { n: left })
                : t("dash.overview.finalDay")}
            </p>
          ) : featured.phase === "scheduled" ? (
            <p className="mt-3 text-xs font-semibold text-sky-700">{t("dash.overview.notStartedYet")}</p>
          ) : featured.phase === "expired" ? (
            <p className="mt-3 text-xs font-semibold text-amber-700">{t("dash.overview.periodEnded")}</p>
          ) : (
            <p className="mt-3 text-xs font-semibold text-indigo-700">
              {t("dash.overview.completed")}{" "}
              {featured.completedAt ? formatDate(featured.completedAt) : ""}
            </p>
          )}
          <button
            type="button"
            onClick={() => onNavigate("treatment")}
            className="mt-4 inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-forest-800 transition-colors hover:text-gold-600"
          >
            {t("dash.overview.viewTimeline")}
            <FaArrowRight className="h-3 w-3" aria-hidden />
          </button>
        </div>
      )}
    </Card>
  );
}

const quickActions: {
  label: TranslationKey;
  sub: TranslationKey;
  icon: ReactNode;
  tab: PatientTabId;
}[] = [
  {
    label: "dash.overview.quick.book",
    sub: "dash.overview.quick.bookSub",
    icon: <FaCalendarCheck className="h-4 w-4" aria-hidden />,
    tab: "appointments",
  },
  {
    label: "dash.overview.quick.rate",
    sub: "dash.overview.quick.rateSub",
    icon: <FaStar className="h-4 w-4" aria-hidden />,
    tab: "testimonials",
  },
  {
    label: "dash.overview.quick.orders",
    sub: "dash.overview.quick.ordersSub",
    icon: <FaBoxOpen className="h-4 w-4" aria-hidden />,
    tab: "orders",
  },
  {
    label: "dash.overview.quick.messages",
    sub: "dash.overview.quick.messagesSub",
    icon: <FaEnvelopeOpen className="h-4 w-4" aria-hidden />,
    tab: "messages",
  },
  {
    label: "dash.overview.quick.records",
    sub: "dash.overview.quick.recordsSub",
    icon: <FaFileMedical className="h-4 w-4" aria-hidden />,
    tab: "records",
  },
  {
    label: "dash.overview.quick.prescriptions",
    sub: "dash.overview.quick.prescriptionsSub",
    icon: <FaPills className="h-4 w-4" aria-hidden />,
    tab: "prescriptions",
  },
  {
    label: "dash.overview.quick.family",
    sub: "dash.overview.quick.familySub",
    icon: <FaPeopleGroup className="h-4 w-4" aria-hidden />,
    tab: "family",
  },
  {
    label: "dash.overview.quick.settings",
    sub: "dash.overview.quick.settingsSub",
    icon: <FaGear className="h-4 w-4" aria-hidden />,
    tab: "settings",
  },
];

function QuickActions({ onNavigate }: { onNavigate: (tab: PatientTabId) => void }) {
  const { t } = useLocale();
  return (
    <Card title={t("dash.overview.quickActions")}>
      <div className="grid grid-cols-2 gap-3 p-5">
        {quickActions.map((a) => (
          <button
            key={a.tab}
            type="button"
            onClick={() => onNavigate(a.tab)}
            className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-forest-100 bg-forest-50/50 px-3 py-4 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-forest-300 hover:bg-forest-100/70 hover:shadow-card"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-950/10 text-forest-950">
              {a.icon}
            </span>
            <span>
              <span className="block text-xs font-bold text-ink">{t(a.label)}</span>
              <span className="mt-0.5 block text-[10px] text-muted">{t(a.sub)}</span>
            </span>
          </button>
        ))}
      </div>
    </Card>
  );
}

function HelpCard() {
  const { t } = useLocale();
  return (
    <section className="relative overflow-hidden rounded-2xl bg-forest-950 p-5 text-white">
      <span aria-hidden className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/5" />
      <div className="relative">
        <p className="font-display text-base font-bold">{t("dash.overview.help.title")}</p>
        <p className="mt-1 text-xs leading-relaxed text-forest-200">{t("dash.overview.help.text")}</p>
        <a
          href={waLink(t("dash.overview.help.waMessage"))}
          target="_blank"
          rel="noreferrer"
          className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-gold-400 text-sm font-bold text-forest-950 transition-colors hover:bg-gold-300"
        >
          <FaWhatsapp className="h-4 w-4" aria-hidden />
          {t("dash.overview.help.chat")}
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
  const { t } = useLocale();
  const { user, resendVerification } = useAuth();
  const { orders, messages, testimonials, plans, unreadCount, loading } = data;
  const [resent, setResent] = useState(false);

  const firstName = user?.name?.trim().split(/\s+/)[0] || t("dash.overview.fallbackName");
  const greeting = getGreeting();
  const greetingKey = {
    morning: "dash.shell.greeting.morning",
    afternoon: "dash.shell.greeting.afternoon",
    evening: "dash.shell.greeting.evening",
  } as const;
  const greetingText = t(greetingKey[greeting]);
  const dateLabel = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const activeOrders = orders.filter(
    (o) => o.status !== "Delivered" && o.status !== "Cancelled"
  ).length;
  const pendingStories = testimonials.filter((tst) => tst.status === "pending").length;
  const memberSince = user?.createdAt ? formatDate(user.createdAt) : null;

  return (
    <div className="space-y-5 lg:space-y-6">
      {/* Email verification notice */}
      {user && !user.emailVerified ? (
        <div className="flex items-start gap-2.5 rounded-2xl border border-gold-300/70 bg-gold-400/10 px-4 py-3 text-sm text-ink mx-4 sm:mx-0">
          <FaRegCircleXmark className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" aria-hidden />
          <span>
            {t("dash.overview.emailNotVerified")}{" "}
            <button
              type="button"
              onClick={async () => {
                await resendVerification(user.email);
                setResent(true);
              }}
              className="cursor-pointer font-semibold text-forest-800 underline underline-offset-2"
            >
              {t("dash.overview.resendIt")}
            </button>
            {resent ? t("dash.overview.resentNote") : ""}
          </span>
        </div>
      ) : null}

      {/* Mobile hero */}
      <div className="relative overflow-hidden bg-forest-950 px-5 pb-6 pt-6 lg:hidden">
        <span aria-hidden className="pointer-events-none absolute -right-12 -top-14 h-44 w-44 rounded-full bg-white/5" />
        <span aria-hidden className="pointer-events-none absolute -bottom-12 right-8 h-28 w-28 rounded-full bg-gold-400/10" />
        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-display text-[22px] font-bold leading-snug text-white">
              {greetingText},
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
          <VitalMini value={loading ? "—" : String(orders.length)} label={t("dash.overview.vitalOrders")} />
          <VitalMini value={loading ? "—" : String(unreadCount)} label={t("dash.overview.vitalUnread")} />
          <VitalMini
            value={loading ? "—" : String(testimonials.length)}
            label={t("dash.overview.vitalStories")}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-3 overflow-x-auto px-4 pb-1 no-scrollbar sm:grid sm:grid-cols-2 sm:gap-3 sm:px-0 sm:overflow-visible sm:pb-0 lg:grid-cols-4">
        <StatCard
          icon={<FaBoxOpen className="h-5 w-5" aria-hidden />}
          label={t("dash.overview.statOrders")}
          value={loading ? "—" : orders.length}
          sub={
            orders.length > 0
              ? activeOrders > 0
                ? t("dash.overview.stat.inProgress", { n: activeOrders })
                : t("dash.overview.stat.allDelivered")
              : t("dash.overview.stat.noOrders")
          }
          onClick={() => onNavigate("orders")}
        />
        <StatCard
          icon={<FaEnvelopeOpen className="h-5 w-5" aria-hidden />}
          label={t("dash.overview.statUnread")}
          value={loading ? "—" : unreadCount}
          sub={unreadCount > 0 ? t("dash.overview.stat.unreadWaiting") : t("dash.overview.stat.caughtUp")}
          badge={unreadCount > 0 ? t("dash.overview.stat.new") : undefined}
          onClick={() => onNavigate("messages")}
        />
        <StatCard
          icon={<FaCommentDots className="h-5 w-5" aria-hidden />}
          label={t("dash.overview.statStories")}
          value={loading ? "—" : testimonials.length}
          sub={
            pendingStories > 0
              ? t("dash.overview.stat.storiesAwaiting", { n: pendingStories })
              : testimonials.length > 0
                ? t("dash.overview.stat.storiesShared")
                : t("dash.overview.stat.storiesShare")
          }
          onClick={() => onNavigate("testimonials")}
        />
        <StatCard
          icon={<FaCircleUser className="h-5 w-5" aria-hidden />}
          label={t("dash.overview.statAccount")}
          value={user?.emailVerified ? t("dash.overview.stat.verified") : t("dash.overview.stat.verifyEmail")}
          sub={
            memberSince
              ? t("dash.overview.stat.memberSince", { date: memberSince })
              : t("dash.overview.stat.updateProfile")
          }
          onClick={() => onNavigate("settings")}
        />
      </div>

      {/* Content columns */}
      <div className="grid items-start gap-5 px-4 sm:px-0 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6">
        <div className="min-w-0 space-y-5 lg:space-y-6">
          <TreatmentPlanCard plans={plans} loading={loading} onNavigate={onNavigate} />
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