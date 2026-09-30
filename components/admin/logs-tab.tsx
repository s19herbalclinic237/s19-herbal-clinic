"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  FaArrowRotateLeft,
  FaChevronDown,
  FaChevronRight,
  FaEnvelope,
  FaTriangleExclamation,
} from "react-icons/fa6";

interface LogEntry {
  id: string;
  level: string;
  source: string;
  scope: string;
  message: string;
  context: string | null;
  route: string | null;
  method: string | null;
  status: number | null;
  digest: string | null;
  occurrences: number;
  firstSeen: string;
  lastSeen: string;
}

interface LogsPayload {
  entries: LogEntry[];
  summary: {
    totals: Record<string, number>;
    last24h: { errors: number; warns: number; rows: number };
    last7d: { errors: number; warns: number; rows: number };
    scopes: Array<{ scope: string; errors: number; warns: number }>;
    storedRows: number;
    oldestAt: string | null;
  };
  retentionDays: number;
  digest: {
    status: string;
    lastSentAt: string | null;
    windowStart?: string | null;
    errorCount?: number;
    topSignature?: string | null;
    errorMessage?: string | null;
  };
}

function stamp(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function LevelBadge({ level }: { level: string }) {
  const cls =
    level === "error"
      ? "bg-red-50 text-red-700"
      : level === "warn"
        ? "bg-amber-50 text-amber-700"
        : "bg-forest-50 text-forest-700";
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${cls}`}>
      {level}
    </span>
  );
}

function Stat({ label, value, tone }: { label: string; value: string | number; tone?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
      <p className="text-xs font-bold uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-2 font-display text-2xl font-semibold ${tone ?? "text-ink"}`}>{value}</p>
    </div>
  );
}

export function LogsTab() {
  const [data, setData] = useState<LogsPayload | null>(null);
  const [level, setLevel] = useState("");
  const [scope, setScope] = useState("");
  const [search, setSearch] = useState("");
  const [applied, setApplied] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = (message: string) => {
    setToast(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 4500);
  };

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (level) params.set("level", level);
    if (scope) params.set("scope", scope);
    if (applied) params.set("q", applied);
    return fetch(`/api/admin/logs?${params.toString()}`, { credentials: "include" })
      .then((r) => r.json())
      .then((payload: LogsPayload & { error?: string }) => {
        if (payload.error) setError(payload.error);
        else {
          setError(null);
          setData(payload);
        }
      })
      .catch(() => setError("Could not load the error log."));
  }, [level, scope, applied]);

  useEffect(() => {
    load();
  }, [load]);

  const sendDigest = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/logs", { method: "POST", credentials: "include" });
      const payload = (await res.json().catch(() => ({}))) as { error?: string; status?: string };
      if (!res.ok) throw new Error(payload.error || "Could not send the digest.");
      notify(
        payload.status === "not-configured"
          ? "No recipient configured. Set ADMIN_EMAIL or BACKUP_ALERT_EMAILS."
          : "Digest sent to the admin inbox."
      );
      load();
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const entries = data?.entries ?? [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-display text-lg font-semibold text-ink">Error Log</p>
          <p className="text-sm text-muted">
            Every error the site records, kept {data?.retentionDays ?? 90} days in the database
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load}>
            <FaArrowRotateLeft className="h-3.5 w-3.5" aria-hidden />
            Refresh
          </Button>
          <Button size="sm" onClick={sendDigest} disabled={busy}>
            <FaEnvelope className="h-3.5 w-3.5" aria-hidden />
            {busy ? "Sending…" : "Email digest now"}
          </Button>
        </div>
      </div>

      {toast ? (
        <p className="rounded-md border border-forest-200 bg-forest-50 px-3 py-2 text-sm text-forest-800">
          {toast}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {data ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Errors · 24h"
            value={data.summary.last24h.errors}
            tone={data.summary.last24h.errors > 0 ? "text-red-700" : "text-ink"}
          />
          <Stat label="Warnings · 24h" value={data.summary.last24h.warns} />
          <Stat
            label="Errors · 7d"
            value={data.summary.last7d.errors}
            tone={data.summary.last7d.errors > 0 ? "text-red-700" : "text-ink"}
          />
          <Stat label="Entries stored" value={data.summary.storedRows} />
        </div>
      ) : null}

      {data ? (
        <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted">
            <FaEnvelope className="h-3.5 w-3.5 text-forest-700" aria-hidden />
            Daily digest email
          </p>
          <p className="mt-2 text-sm font-semibold text-ink">
            {data.digest.status === "sent"
              ? `Last sent ${stamp(data.digest.lastSentAt)}`
              : data.digest.status === "never"
                ? "Not sent yet"
                : data.digest.status === "not-configured"
                  ? "No recipient configured"
                  : "Last attempt failed"}
          </p>
          <p className="mt-1 text-xs text-muted">
            Goes out with the daily backup at 05:30 UTC, summarising the previous 24 hours.{" "}
            {data.digest.topSignature
              ? `Most frequent last window: "${data.digest.topSignature}".`
              : ""}
            {data.digest.errorMessage ? ` Last error: ${data.digest.errorMessage}` : ""}
          </p>
          {data.summary.oldestAt ? (
            <p className="mt-1 text-xs text-muted">
              Oldest entry kept: {stamp(data.summary.oldestAt)}. Anything older is removed
              automatically by the database.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-end gap-2">
        <label className="text-xs font-bold uppercase tracking-wide text-muted">
          <span className="block">Level</span>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="mt-1 rounded-md border border-line bg-white px-2 py-1.5 text-sm font-normal normal-case text-ink"
          >
            <option value="">All</option>
            <option value="error">Errors</option>
            <option value="warn">Warnings</option>
            <option value="info">Info</option>
          </select>
        </label>
        <label className="text-xs font-bold uppercase tracking-wide text-muted">
          <span className="block">Area</span>
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            className="mt-1 rounded-md border border-line bg-white px-2 py-1.5 text-sm font-normal normal-case text-ink"
          >
            <option value="">All</option>
            {(data?.summary.scopes ?? []).map((s) => (
              <option key={s.scope} value={s.scope}>
                {s.scope} ({s.errors + s.warns})
              </option>
            ))}
          </select>
        </label>
        <form
          className="flex-1 min-w-[12rem]"
          onSubmit={(e) => {
            e.preventDefault();
            setApplied(search.trim());
          }}
        >
          <span className="block text-xs font-bold uppercase tracking-wide text-muted">Search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="message or route…"
            className="mt-1 w-full rounded-md border border-line bg-white px-2 py-1.5 text-sm font-normal normal-case text-ink"
          />
        </form>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-card">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className="border-b border-forest-100 text-[11px] font-bold uppercase tracking-wide text-muted">
              <th className="w-8 px-3 py-3" />
              <th className="px-3 py-3">When</th>
              <th className="px-3 py-3">Level</th>
              <th className="px-3 py-3">Area</th>
              <th className="px-3 py-3">What happened</th>
              <th className="px-3 py-3">Where</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => {
              const expanded = !!open[e.id];
              return (
                <tr key={e.id} className="border-b border-forest-50 align-top last:border-0">
                  <td className="px-3 py-3">
                    {e.context ? (
                      <button
                        type="button"
                        aria-label={expanded ? "Hide detail" : "Show detail"}
                        aria-expanded={expanded}
                        onClick={() => setOpen((prev) => ({ ...prev, [e.id]: !prev[e.id] }))}
                        className="text-muted"
                      >
                        {expanded ? (
                          <FaChevronDown className="h-3.5 w-3.5" aria-hidden />
                        ) : (
                          <FaChevronRight className="h-3.5 w-3.5" aria-hidden />
                        )}
                      </button>
                    ) : null}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-xs text-muted">
                    {stamp(e.lastSeen)}
                    {e.occurrences > 1 ? (
                      <span className="ml-1 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                        ×{e.occurrences}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-3">
                    <LevelBadge level={e.level} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 font-mono text-[11px] text-ink">
                    {e.scope}
                  </td>
                  <td className="px-3 py-3 text-ink">
                    {e.message}
                    {expanded && e.context ? (
                      <pre className="mt-2 max-w-xl overflow-x-auto whitespace-pre-wrap break-all rounded-md border border-line bg-forest-50/60 p-2 font-mono text-[10px] leading-relaxed text-muted">
                        {e.context}
                      </pre>
                    ) : null}
                  </td>
                  <td className="px-3 py-3 text-[11px] text-muted">
                    {e.route ? (
                      <span className="font-mono">
                        {e.method ? `${e.method} ` : ""}
                        {e.route}
                      </span>
                    ) : (
                      "—"
                    )}
                    {e.digest ? (
                      <span className="mt-1 block font-mono text-[10px] text-muted">
                        ref {e.digest.slice(0, 12)}
                      </span>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!data && !error ? (
          <p className="px-4 py-10 text-center text-sm text-muted">Loading the error log…</p>
        ) : null}
        {data && entries.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted">
            {data.summary.storedRows === 0
              ? "Nothing logged yet. The log fills in as soon as the site records a warning or error."
              : "No entries match these filters."}
          </p>
        ) : null}
      </div>

      {data && data.summary.storedRows > 0 ? (
        <p className="flex items-start gap-2 text-xs text-muted">
          <FaTriangleExclamation className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
          Patient names, email addresses and phone numbers are masked before anything is written
          here, and passwords, tokens and session cookies are never stored at all.
        </p>
      ) : null}
    </div>
  );
}
