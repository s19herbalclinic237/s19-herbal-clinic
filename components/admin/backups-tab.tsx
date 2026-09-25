"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/components/account/badges";
import { FaArrowRotateLeft, FaBoxArchive, FaEnvelope, FaTriangleExclamation } from "react-icons/fa6";

interface BackupRunRow {
  id: string;
  logicalRunId: string;
  state: string;
  trigger: string;
  scheduledFor: string | null;
  startedAt: string | null;
  completedAt: string | null;
  collectionCount: number;
  documentCount: number;
  originalBytes: number;
  ciphertextBytes: number | null;
  notificationStatus: string;
  transportVerified: boolean;
  errorCode: string | null;
  errorStage: string | null;
  stage: string | null;
  createdAt: string;
}

function StateBadge({ state }: { state: string }) {
  const cls =
    state === "succeeded"
      ? "bg-emerald-50 text-emerald-700"
      : state === "failed"
        ? "bg-red-50 text-red-700"
        : "bg-gold-400/20 text-[#8a6e1a]";
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${cls}`}>{state}</span>
  );
}

export function BackupsTab() {
  const [runs, setRuns] = useState<BackupRunRow[] | null>(null);
  const [config, setConfig] = useState<{
    emailBackup: boolean;
    archiveBackup: boolean;
    recipient: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = (message: string) => {
    setToast(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 4500);
  };

  const load = () => {
    let active = true;
    fetch("/api/admin/backups", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        if (data.error) setError(data.error);
        else {
          setRuns(Array.isArray(data.runs) ? data.runs : []);
          setConfig(data.config ?? null);
        }
      })
      .catch(() => {
        if (active) setError("Could not load backup history.");
      });
    return () => {
      active = false;
    };
  };

  useEffect(() => {
    return load();
  }, []);

  const runNow = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/backups", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Manual run from dashboard" }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; duplicate?: boolean };
      if (!res.ok) throw new Error(data.error || "Backup failed.");
      notify(
        data.duplicate
          ? "This day's backup already exists — no duplicate email was sent."
          : "Backup created and emailed to the admin inbox."
      );
      load();
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const sizeLabel = (bytes: number | null | undefined) => {
    if (bytes == null) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-display text-lg font-semibold text-ink">Data Backups</p>
          <p className="text-sm text-muted">
            Daily automated + manual full-database backups, emailed to the admin
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load}>
            <FaArrowRotateLeft className="h-3.5 w-3.5" aria-hidden />
            Refresh
          </Button>
          <Button size="sm" onClick={runNow} disabled={busy || !config?.emailBackup} title={config?.emailBackup ? undefined : "Email SMTP is not configured"}>
            <FaBoxArchive className="h-3.5 w-3.5" aria-hidden />
            {busy ? "Running…" : "Run backup now"}
          </Button>
        </div>
      </div>

      {toast ? (
        <p className="rounded-md border border-forest-200 bg-forest-50 px-3 py-2 text-sm text-forest-800">{toast}</p>
      ) : null}
      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      {config ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted">
              <FaEnvelope className="h-3.5 w-3.5 text-forest-700" aria-hidden />
              Emailed backup
            </p>
            <p className="mt-2 text-sm font-semibold text-ink">
              {config.emailBackup ? "Active" : "Not configured"}
            </p>
            <p className="mt-1 text-xs text-muted">
              {config.emailBackup
                ? `Sends the gzip database to ${config.recipient || "the admin inbox"} — full collections, all documents, daily at 05:30 UTC.`
                : "Set SMTP credentials and ADMIN_EMAIL, then deploy the app to enable automatic backups."}
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted">
              <FaBoxArchive className="h-3.5 w-3.5 text-forest-700" aria-hidden />
              Encrypted object-store archive
            </p>
            <p className="mt-2 text-sm font-semibold text-ink">
              {config.archiveBackup ? "Active" : "Optional"}
            </p>
            <p className="mt-1 text-xs text-muted">
              {config.archiveBackup
                ? "Age-encrypted bundle with Cloudinary originals, object-locked on S3-compatible storage."
                : "Configure BACKUP_S3_* + BACKUP_AGE_RECIPIENTS for an immutable complementary archive. The email backup already covers the full database."}
            </p>
          </div>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-card">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-forest-100 text-[11px] font-bold uppercase tracking-wide text-muted">
              <th className="px-4 py-3">Backup</th>
              <th className="px-4 py-3">Trigger</th>
              <th className="px-4 py-3">Docs / Collections</th>
              <th className="px-4 py-3">Size</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Detail</th>
            </tr>
          </thead>
          <tbody>
            {(runs ?? []).map((r) => (
              <tr key={r.id} className="border-b border-forest-50 last:border-0">
                <td className="px-4 py-3">
                  <p className="font-semibold text-ink">{formatDate(r.createdAt)}</p>
                  <p className="font-mono text-[10px] text-muted">{r.logicalRunId.slice(0, 48)}</p>
                </td>
                <td className="px-4 py-3 text-xs capitalize text-muted">{r.trigger}</td>
                <td className="px-4 py-3 text-xs text-muted">
                  {r.documentCount} docs · {r.collectionCount} collections
                </td>
                <td className="px-4 py-3 text-xs text-muted">{sizeLabel(r.ciphertextBytes ?? r.originalBytes)}</td>
                <td className="px-4 py-3 text-xs text-muted">{r.notificationStatus}</td>
                <td className="px-4 py-3"><StateBadge state={r.state} /></td>
                <td className="px-4 py-3">
                  {r.errorCode ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700">
                      <FaTriangleExclamation className="h-3 w-3" aria-hidden />
                      {r.errorCode}
                    </span>
                  ) : (
                    <span className="text-xs text-muted">{r.stage ?? "—"}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {runs && runs.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted">
            No backups yet. Run one now, or wait for the daily automatic backup.
          </p>
        ) : null}
      </div>
    </div>
  );
}