"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  FaArrowRotateLeft,
  FaCloud,
  FaDatabase,
  FaHardDrive,
} from "react-icons/fa6";

interface MongoStats {
  ok: boolean;
  dataSize?: number;
  storageSize?: number;
  indexSize?: number;
  totalSize?: number;
  objectCount?: number;
  collections?: number;
  limitBytes?: number | null;
  message?: string;
  error?: string;
}

interface CloudinaryStats {
  ok: boolean;
  plan?: string;
  storage?: number;
  storageLimit?: number | null;
  bandwidth?: number;
  bandwidthLimit?: number | null;
  transformation?: number;
  transformationLimit?: number | null;
  objects?: number;
  credits?: unknown;
  message?: string;
  error?: string;
}

interface StorageResponse {
  mongo: MongoStats | null;
  cloudinary: CloudinaryStats | null;
  error?: string;
}

/** Human-readable byte size (decimal, matching Cloudinary's own readouts). */
function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null || !Number.isFinite(bytes)) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB", "PB"];
  let value = bytes / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i += 1;
  }
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

function pct(used: number, limit: number): number {
  if (!limit || limit <= 0) return 0;
  return Math.min(100, Math.max(0, (used / limit) * 100));
}

function barColor(percent: number): string {
  if (percent >= 90) return "bg-red-500";
  if (percent >= 75) return "bg-gold-500";
  return "bg-forest-600";
}

/** A used/limit meter with a progress bar. When there is no hard limit only the
 *  used figure is shown, because inventing a denominator would be dishonest. */
function UsageBar({
  used,
  limit,
  usedLabel,
  limitLabel,
  leftLabel,
  unitLabel,
}: {
  used: number | null | undefined;
  limit: number | null | undefined;
  usedLabel: string;
  limitLabel: string;
  leftLabel: string;
  unitLabel: string;
}) {
  const hasLimit = typeof limit === "number" && limit > 0;
  const usedValue = typeof used === "number" ? used : 0;
  const percent = hasLimit ? pct(usedValue, limit as number) : 0;
  const left = hasLimit ? Math.max(0, (limit as number) - usedValue) : null;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-2xl font-bold text-ink">
          {formatBytes(used)} <span className="text-sm font-medium text-muted">{unitLabel}</span>
        </p>
        {hasLimit ? (
          <p className="text-sm font-semibold text-muted">
            {percent.toFixed(0)}%
          </p>
        ) : null}
      </div>

      {hasLimit ? (
        <>
          <div
            className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-forest-100"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(percent)}
            aria-label={`${usedLabel} ${percent.toFixed(0)}%`}
          >
            <div
              className={`h-full rounded-full ${barColor(percent)} transition-[width] duration-500`}
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-muted">
            <span>
              {usedLabel}: <strong className="font-semibold text-ink">{formatBytes(usedValue)}</strong>
            </span>
            <span>
              {leftLabel}: <strong className="font-semibold text-ink">{formatBytes(left)}</strong>
            </span>
            <span>
              {limitLabel}: <strong className="font-semibold text-ink">{formatBytes(limit)}</strong>
            </span>
          </div>
        </>
      ) : (
        <p className="mt-2 text-xs text-muted">
          No fixed quota is set for this resource, so only current usage is shown.
        </p>
      )}
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-cream/50 px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}

export function StorageTab() {
  const [data, setData] = useState<StorageResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback((): (() => void) => {
    let active = true;
    fetch("/api/admin/storage", { credentials: "include", cache: "no-store" })
      .then(async (res) => {
        const json = (await res.json().catch(() => ({}))) as StorageResponse & { error?: string };
        if (!res.ok) throw new Error(json.error || "Could not load storage usage.");
        return json;
      })
      .then((json) => {
        if (!active) return;
        setData(json);
        setError(null);
      })
      .catch((e: Error) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => load(), [load]);

  const refresh = () => {
    setLoading(true);
    void load();
  };

  const mongo = data?.mongo;
  const cloud = data?.cloudinary;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-display text-lg font-semibold text-ink">Storage</p>
          <p className="text-sm text-muted">
            How much space the database and media library are using, and how much is left.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
          <FaArrowRotateLeft className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} aria-hidden />
          {loading ? "Loading…" : "Refresh"}
        </Button>
      </div>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* MongoDB */}
        <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-forest-50 text-forest-700">
              <FaDatabase className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-bold text-ink">MongoDB database</p>
              <p className="text-xs text-muted">Patients, orders, records, and settings</p>
            </div>
          </div>

          <div className="mt-4">
            {loading && !mongo ? (
              <p className="text-sm text-muted">Loading usage…</p>
            ) : mongo?.ok ? (
              <>
                <UsageBar
                  used={mongo.totalSize}
                  limit={mongo.limitBytes}
                  usedLabel="Used"
                  limitLabel="Total quota"
                  leftLabel="Left"
                  unitLabel=""
                />
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <StatPill label="Data" value={formatBytes(mongo.dataSize)} />
                  <StatPill label="Indexes" value={formatBytes(mongo.indexSize)} />
                  <StatPill label="Collections" value={String(mongo.collections ?? "—")} />
                  <StatPill label="Documents" value={String(mongo.objectCount ?? "—")} />
                </div>
              </>
            ) : (
              <p className="text-sm text-red-700">
                {mongo?.error || mongo?.message || "Database usage is unavailable."}
              </p>
            )}
          </div>
        </div>

        {/* Cloudinary */}
        <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-forest-50 text-forest-700">
              <FaCloud className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-bold text-ink">Cloudinary media</p>
              <p className="text-xs text-muted">
                Product images, blog covers, ID documents{cloud?.plan ? ` · ${cloud.plan} plan` : ""}
              </p>
            </div>
          </div>

          <div className="mt-4">
            {loading && !cloud ? (
              <p className="text-sm text-muted">Loading usage…</p>
            ) : cloud?.ok ? (
              <>
                <UsageBar
                  used={cloud.storage}
                  limit={cloud.storageLimit}
                  usedLabel="Used"
                  limitLabel="Total quota"
                  leftLabel="Left"
                  unitLabel=""
                />
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <StatPill label="Assets" value={String(cloud.objects ?? "—")} />
                  <StatPill label="Bandwidth" value={formatBytes(cloud.bandwidth)} />
                  <StatPill
                    label="Transformations"
                    value={
                      typeof cloud.transformation === "number"
                        ? cloud.transformation.toLocaleString()
                        : "—"
                    }
                  />
                  <StatPill
                    label="Credits"
                    value={typeof cloud.credits === "number" ? String(cloud.credits) : "—"}
                  />
                </div>
              </>
            ) : (
              <p className="text-sm text-red-700">
                {cloud?.error || cloud?.message || "Cloudinary usage is unavailable."}
              </p>
            )}
          </div>
        </div>
      </div>

      <p className="flex items-start gap-2 text-xs text-muted">
        <FaHardDrive className="mt-0.5 h-3.5 w-3.5 shrink-0 text-forest-700" aria-hidden />
        Backup archives stored on the optional S3-compatible object store are tracked separately on the
        Data Backups tab.
      </p>
    </div>
  );
}
