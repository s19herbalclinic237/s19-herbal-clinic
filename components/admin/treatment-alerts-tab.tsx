"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  FaBell,
  FaCalendarCheck,
  FaDroplet,
  FaHeartPulse,
  FaHourglassHalf,
  FaRotateRight,
  FaTriangleExclamation,
} from "react-icons/fa6";

type Severity = "high" | "medium" | "low";

interface TreatmentAlert {
  id: string;
  severity: Severity;
  category:
    | "final-review"
    | "ending-soon"
    | "missed-glucose"
    | "overdue-reminder"
    | "concerning-reading"
    | "new-complication"
    | "missed-follow-up";
  title: string;
  detail: string;
  planId?: string;
  patientId?: string;
  patientName?: string;
}

const severityMeta: Record<
  Severity,
  { label: string; chip: string; dot: string; ring: string }
> = {
  high: {
    label: "High priority",
    chip: "border-red-300 bg-red-50 text-red-700",
    dot: "bg-red-500",
    ring: "border-l-red-400",
  },
  medium: {
    label: "Medium priority",
    chip: "border-amber-300 bg-amber-50 text-amber-800",
    dot: "bg-amber-500",
    ring: "border-l-amber-400",
  },
  low: {
    label: "Low priority",
    chip: "border-sky-300 bg-sky-50 text-sky-800",
    dot: "bg-sky-500",
    ring: "border-l-sky-400",
  },
};

const categoryIcon: Record<TreatmentAlert["category"], typeof FaBell> = {
  "final-review": FaHeartPulse,
  "ending-soon": FaHourglassHalf,
  "missed-glucose": FaDroplet,
  "overdue-reminder": FaBell,
  "concerning-reading": FaTriangleExclamation,
  "new-complication": FaHeartPulse,
  "missed-follow-up": FaCalendarCheck,
};

export function TreatmentAlertsTab({ onOpenPlans }: { onOpenPlans?: () => void }) {
  const [alerts, setAlerts] = useState<TreatmentAlert[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = () => {
    let active = true;
    fetch("/api/admin/treatment-alerts", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        if (data.error) setError(data.error);
        else setAlerts(Array.isArray(data.alerts) ? data.alerts : []);
      })
      .catch(() => {
        if (active) setError("Could not load treatment alerts.");
      })
      .finally(() => {
        if (active) setRefreshing(false);
      });
    return () => {
      active = false;
    };
  };

  useEffect(load, []);

  const high = alerts?.filter((a) => a.severity === "high").length ?? 0;
  const medium = alerts?.filter((a) => a.severity === "medium").length ?? 0;
  const low = alerts?.filter((a) => a.severity === "low").length ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Live feed for the S19 team - missed glucose submissions, overdue payments, missed
          follow-ups, treatments ending, concerning readings and new complications.
        </p>
        <button
          type="button"
          onClick={() => {
            setRefreshing(true);
            load();
          }}
          disabled={refreshing}
          className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-line-strong bg-white px-3 text-xs font-semibold text-ink transition-colors hover:border-forest-400 disabled:opacity-50"
        >
          <FaRotateRight className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} aria-hidden />
          Refresh
        </button>
      </div>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      {!alerts ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-forest-200 border-t-forest-800" />
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            {(
              [
                ["high", high, "Need attention"],
                ["medium", medium, "Review soon"],
                ["low", low, "Monitor"],
              ] as const
            ).map(([sev, n, label]) => (
              <div
                key={sev}
                className={cn(
                  "rounded-xl border bg-white px-4 py-3",
                  sev === "high"
                    ? "border-red-200"
                    : sev === "medium"
                      ? "border-amber-200"
                      : "border-sky-200"
                )}
              >
                <div className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-full", severityMeta[sev].dot)} aria-hidden />
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
                </div>
                <p className="mt-1 font-display text-2xl font-bold text-ink">
                  {n}
                  <span className="ml-1 text-sm font-semibold text-muted">
                    {n === 1 ? "alert" : "alerts"}
                  </span>
                </p>
              </div>
            ))}
          </div>

          {alerts.length === 0 ? (
            <div className="rounded-lg border border-line bg-white p-10 text-center">
              <FaHeartPulse className="mx-auto h-8 w-8 text-forest-300" aria-hidden />
              <p className="mt-3 text-sm font-semibold text-ink">All clear</p>
              <p className="mt-1 text-sm text-muted">
                No treatment alerts right now. We&apos;ll flag anything needing the team&apos;s
                attention here.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {alerts.map((a) => {
                const meta = severityMeta[a.severity];
                const Icon = categoryIcon[a.category] || FaBell;
                return (
                  <li
                    key={a.id}
                    className={cn("rounded-r-xl rounded-l-lg border border-l-4 border-line bg-white py-3 pl-4 pr-4", meta.ring)}
                  >
                    <div className="flex flex-wrap items-start gap-3">
                      <span
                        className={cn(
                          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
                          meta.chip
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-ink">{a.title}</span>
                          <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", meta.chip)}>
                            {meta.label}
                          </span>
                        </span>
                        <span className="mt-1 block text-xs leading-relaxed text-muted">{a.detail}</span>
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {onOpenPlans ? (
            <div className="rounded-lg border border-dashed border-forest-300 bg-forest-50/50 px-4 py-3 text-sm text-forest-900">
              <span className="font-semibold">Act on these:</span> open the{" "}
              <button
                type="button"
                onClick={onOpenPlans}
                className="cursor-pointer font-semibold text-forest-800 underline underline-offset-2 hover:text-forest-950"
              >
                Treatment Plans
              </button>{" "}
              tab to record follow-ups, close out ended treatments and manage reminders.
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}