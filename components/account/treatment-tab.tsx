"use client";

import { useEffect, useMemo, useState } from "react";
import { daysUntil, formatDayDate, TreatmentPhaseBadge } from "@/components/account/badges";
import {
  FaCalendarDays,
  FaChevronDown,
  FaChevronUp,
  FaHourglassHalf,
  FaStopwatch,
} from "react-icons/fa6";

interface TreatmentPlanView {
  _id: string;
  forMember?: string;
  title: string;
  program?: string;
  startDate: string;
  endDate: string;
  notes?: string;
  phase: "active" | "expired" | "scheduled";
  days: number;
}

type FilterId = "all" | "active" | "scheduled" | "expired";

const filters: { id: FilterId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "scheduled", label: "Upcoming" },
  { id: "expired", label: "Past" },
];

function PlanCard({ p }: { p: TreatmentPlanView }) {
  const [open, setOpen] = useState(false);
  const left = daysUntil(p.endDate);
  const iconClasses =
    p.phase === "active"
      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
      : p.phase === "scheduled"
        ? "border-sky-300 bg-sky-50 text-sky-700"
        : "border-line-strong bg-cream text-muted";

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-forest-50/50 sm:px-5"
      >
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${iconClasses}`}>
          <FaCalendarDays className="h-4 w-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold text-ink">{p.title}</span>
          <span className="mt-0.5 block truncate text-xs text-muted">
            {p.phase === "scheduled" ? "Starts" : "Started"} {formatDayDate(p.startDate)} ·{" "}
            {p.phase === "expired" ? "Ended" : "Ends"} {formatDayDate(p.endDate)}
            {p.forMember ? ` · ${p.forMember}` : ""}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <TreatmentPhaseBadge phase={p.phase} />
          {open ? (
            <FaChevronUp className="h-3.5 w-3.5 text-muted" aria-hidden />
          ) : (
            <FaChevronDown className="h-3.5 w-3.5 text-muted" aria-hidden />
          )}
        </span>
      </button>
      {open ? (
        <div className="border-t border-forest-100 bg-cream/60 px-5 py-4">
          <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <div className="flex justify-between gap-3 sm:block">
              <dt className="text-[10px] font-bold uppercase tracking-wide text-muted">Start date</dt>
              <dd className="mt-0.5 font-semibold text-ink">{formatDayDate(p.startDate)}</dd>
            </div>
            <div className="flex justify-between gap-3 sm:block">
              <dt className="text-[10px] font-bold uppercase tracking-wide text-muted">End date</dt>
              <dd className="mt-0.5 font-semibold text-ink">{formatDayDate(p.endDate)}</dd>
            </div>
            <div className="flex justify-between gap-3 sm:block">
              <dt className="text-[10px] font-bold uppercase tracking-wide text-muted">Duration</dt>
              <dd className="mt-0.5 font-semibold text-ink">
                {p.days} day{p.days === 1 ? "" : "s"}
              </dd>
            </div>
            {p.program ? (
              <div className="flex justify-between gap-3 sm:block">
                <dt className="text-[10px] font-bold uppercase tracking-wide text-muted">Program</dt>
                <dd className="mt-0.5 font-semibold text-ink">{p.program}</dd>
              </div>
            ) : null}
            {p.forMember ? (
              <div className="flex justify-between gap-3 sm:block">
                <dt className="text-[10px] font-bold uppercase tracking-wide text-muted">Patient</dt>
                <dd className="mt-0.5 font-semibold text-ink">{p.forMember}</dd>
              </div>
            ) : null}
          </dl>
          {p.notes ? (
            <p className="mt-3 text-sm text-muted">
              <span className="font-semibold text-ink">Notes:</span> {p.notes}
            </p>
          ) : null}
          {p.phase === "active" ? (
            <p className="mt-3 inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
              <FaHourglassHalf className="h-3.5 w-3.5" aria-hidden />
              {left > 0 ? `${left} day${left === 1 ? "" : "s"} remaining on this treatment` : "Ends today"}
            </p>
          ) : p.phase === "scheduled" ? (
            <p className="mt-3 inline-flex items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-800">
              <FaStopwatch className="h-3.5 w-3.5" aria-hidden />
              Not started yet
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function TreatmentTab() {
  const [plans, setPlans] = useState<TreatmentPlanView[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterId>("all");

  useEffect(() => {
    let active = true;
    fetch("/api/treatment-plans", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        if (data.error) setError(data.error);
        else setPlans(Array.isArray(data.plans) ? data.plans : []);
      })
      .catch(() => {
        if (active) setError("Could not load your treatment plans.");
      });
    return () => {
      active = false;
    };
  }, []);

  const shown = useMemo(() => {
    if (!plans) return null;
    if (filter === "all") return plans;
    return plans.filter((p) => p.phase === filter);
  }, [plans, filter]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Your personalized treatment timeline - when each plan started, when it ends and its live
        status. The clinic sets up these plans for you.
      </p>

      {plans && plans.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => {
            const count =
              f.id === "all" ? plans.length : plans.filter((p) => p.phase === f.id).length;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  filter === f.id
                    ? "border-forest-800 bg-forest-950 text-white"
                    : "border-line-strong bg-white text-muted hover:border-forest-300 hover:text-ink"
                }`}
              >
                {f.label} ({count})
              </button>
            );
          })}
        </div>
      ) : null}

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      {!plans ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-forest-200 border-t-forest-800" />
        </div>
      ) : null}

      {shown && shown.length === 0 ? (
        <div className="rounded-lg border border-line bg-white p-8 text-center">
          <FaCalendarDays className="mx-auto h-7 w-7 text-forest-300" aria-hidden />
          <p className="mt-3 text-sm text-muted">
            {plans && plans.length === 0
              ? "No treatment plan yet. The clinic sets up a personalized 3-month or 6-month plan for you."
              : "Nothing matches this filter."}
          </p>
        </div>
      ) : null}

      {shown && shown.length > 0 ? (
        <ul className="space-y-2.5">
          {shown.map((p) => (
            <li key={p._id}>
              <PlanCard p={p} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}