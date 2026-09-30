import "server-only";

import { connectDb } from "@/lib/db";
import { getBackupConfig } from "@/lib/backup/config";
import { sendBackupNotification, siteOrigin } from "@/lib/email";
import { summariseAppLogs, summariseWindow, type AppLogSignature } from "@/lib/app-log";
import { APP_LOG_RETENTION_DAYS } from "@/lib/models/AppLog";
import { LogDigest, LOG_DIGEST_ID, type LogDigestStatus } from "@/lib/models/LogDigest";

/**
 * Daily error-log digest.
 *
 * Runs from the existing backup cron rather than a second schedule, because
 * Vercel's Hobby plan allows only two cron jobs per project. The digest is a
 * separate concern from the backup but shares the same trigger, the same
 * recipient list and the same transport, so it inherits all three for free.
 *
 * Content is deliberately aggregate-only: counts and redacted error
 * signatures, never request bodies, database records or patient identifiers.
 * That is the same contract `sendBackupNotification` requires.
 */

const DIGEST_IDEMPOTENCY_MS = 20 * 60 * 60 * 1000;

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function stamp(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toISOString().replace("T", " ").slice(0, 16) + " UTC";
}

function signatureRows(signatures: AppLogSignature[]): string {
  if (signatures.length === 0) return "";
  return `<table style="border-collapse:collapse;width:100%;margin-top:8px">
    <tr>
      <th style="text-align:left;padding:6px 12px 6px 0;color:#64756d;font-size:11px;text-transform:uppercase;letter-spacing:.8px">Scope</th>
      <th style="text-align:left;padding:6px 12px 6px 0;color:#64756d;font-size:11px;text-transform:uppercase;letter-spacing:.8px">Error</th>
      <th style="text-align:right;padding:6px 0;color:#64756d;font-size:11px;text-transform:uppercase;letter-spacing:.8px">Times</th>
    </tr>
    ${signatures
      .map(
        (s) => `<tr>
          <td style="padding:7px 12px 7px 0;color:#14251e;font-size:13px;font-family:monospace;vertical-align:top">${esc(s.scope)}</td>
          <td style="padding:7px 12px 7px 0;color:#14251e;font-size:13px;vertical-align:top">${esc(s.message)}<br/><span style="color:#64756d;font-size:11px">first ${esc(stamp(s.firstSeen))} · last ${esc(stamp(s.lastSeen))}</span></td>
          <td style="padding:7px 0;color:#14251e;font-size:13px;text-align:right;vertical-align:top;white-space:nowrap">${s.count}</td>
        </tr>`
      )
      .join("")}
  </table>`;
}

export interface LogDigestOutcome {
  status: LogDigestStatus;
  skippedDuplicate: boolean;
  errorCount: number;
  warnCount: number;
  windowStart: Date;
  windowEnd: Date;
}

/**
 * Sends the digest unless one already went out inside the idempotency window,
 * which keeps repeated cron invocations from mailing the same summary twice.
 */
export async function runDailyLogDigest(
  opts: { windowStart?: Date; windowEnd?: Date; force?: boolean } = {}
): Promise<LogDigestOutcome> {
  const windowEnd = opts.windowEnd ?? new Date();
  const windowStart = opts.windowStart ?? new Date(windowEnd.getTime() - 86_400_000);
  const conn = await connectDb();
  if (!conn) {
    throw new Error("Log digest needs a database connection.");
  }

  const existing = await LogDigest.findById(LOG_DIGEST_ID).lean();
  const recent =
    existing?.lastSentAt != null &&
    Date.now() - new Date(existing.lastSentAt).getTime() < DIGEST_IDEMPOTENCY_MS;

  if (recent && !opts.force) {
    return {
      status: existing?.status ?? "sent",
      skippedDuplicate: true,
      errorCount: existing?.errorCount ?? 0,
      warnCount: existing?.warnCount ?? 0,
      windowStart: existing?.windowStart ? new Date(existing.windowStart) : windowStart,
      windowEnd: existing?.windowEnd ? new Date(existing.windowEnd) : windowEnd,
    };
  }

  const [signatures, summary] = await Promise.all([
    summariseWindow(windowStart, windowEnd),
    summariseAppLogs(),
  ]);
  const counts = summary.last24h;
  const errorCount = counts.errors;
  const warnCount = counts.warns;

  const config = getBackupConfig();
  if (config.alertEmails.length === 0) {
    await LogDigest.findByIdAndUpdate(
      LOG_DIGEST_ID,
      {
        $set: {
          status: "not-configured",
          windowStart,
          windowEnd,
          entryCount: counts.rows,
          errorCount,
          warnCount,
        },
      },
      { upsert: true, setDefaultsOnInsert: true }
    );
    return {
      status: "not-configured",
      skippedDuplicate: false,
      errorCount,
      warnCount,
      windowStart,
      windowEnd,
    };
  }

  const clean = errorCount === 0;
  const subject = clean
    ? "S19 error log digest: all clear"
    : `S19 error log digest: ${errorCount} error${errorCount === 1 ? "" : "s"} in 24h`;
  const dashboardUrl = `${siteOrigin()}/account?tab=admin-logs`;

  const html = `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;background:#f4f7f5;padding:24px;color:#14251e">
    <div style="max-width:680px;margin:auto;background:#fff;border:1px solid #dce7e1;border-radius:12px;padding:28px">
      <h1 style="margin-top:0;color:#124034">${clean ? "No errors in the last 24 hours" : `${errorCount} error${errorCount === 1 ? "" : "s"} in the last 24 hours`}</h1>
      <p>This is a daily summary of the application's own error log. It contains counts and redacted error signatures only — no patient names, contact details, message contents, credentials or database records.</p>
      <table style="border-collapse:collapse;width:100%;margin-top:16px">
        <tr><td style="padding:6px 12px 6px 0;color:#64756d;font-size:13px">Window</td><td style="padding:6px 0;color:#14251e;font-size:13px;font-family:monospace">${esc(stamp(windowStart))} → ${esc(stamp(windowEnd))}</td></tr>
        <tr><td style="padding:6px 12px 6px 0;color:#64756d;font-size:13px">Errors (24h)</td><td style="padding:6px 0;color:#14251e;font-size:13px;font-family:monospace">${errorCount}</td></tr>
        <tr><td style="padding:6px 12px 6px 0;color:#64756d;font-size:13px">Warnings (24h)</td><td style="padding:6px 0;color:#14251e;font-size:13px;font-family:monospace">${warnCount}</td></tr>
        <tr><td style="padding:6px 12px 6px 0;color:#64756d;font-size:13px">Errors (7d)</td><td style="padding:6px 0;color:#14251e;font-size:13px;font-family:monospace">${summary.last7d.errors}</td></tr>
        <tr><td style="padding:6px 12px 6px 0;color:#64756d;font-size:13px">Entries stored</td><td style="padding:6px 0;color:#14251e;font-size:13px;font-family:monospace">${summary.storedRows}</td></tr>
        <tr><td style="padding:6px 12px 6px 0;color:#64756d;font-size:13px">Retention</td><td style="padding:6px 0;color:#14251e;font-size:13px;font-family:monospace">${APP_LOG_RETENTION_DAYS} days</td></tr>
      </table>
      ${signatureRows(signatures)}
      <p style="margin-top:24px"><a href="${esc(dashboardUrl)}" style="display:inline-block;background:#1a6b50;color:#fff;padding:11px 22px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:bold">Open the error log</a></p>
      <p style="color:#64756d;font-size:12px;margin-top:24px">This digest is a heads-up, not the log itself. Full history lives in the admin panel and is included in the encrypted database backup.</p>
    </div>
  </body></html>`;

  const results = await Promise.allSettled(
    config.alertEmails.map((email) => sendBackupNotification(email, subject, html))
  );
  const sent = results.some((result) => result.status === "fulfilled");
  const failure = results.find(
    (result): result is PromiseRejectedResult => result.status === "rejected"
  );

  const status: LogDigestStatus = sent ? "sent" : "failed";
  const topSignature = signatures[0]
    ? `${signatures[0].scope}: ${signatures[0].message}`.slice(0, 200)
    : undefined;
  const errorMessage = failure
    ? String((failure.reason as Error)?.message ?? failure.reason).slice(0, 300)
    : undefined;

  // `lastSentAt` is the idempotency marker, so a failed attempt must leave the
  // previous value alone and let the next run try again.
  await LogDigest.findByIdAndUpdate(
    LOG_DIGEST_ID,
    {
      $set: {
        status,
        windowStart,
        windowEnd,
        entryCount: counts.rows,
        errorCount,
        warnCount,
        ...(sent ? { lastSentAt: new Date() } : {}),
        ...(topSignature ? { topSignature } : {}),
        ...(errorMessage ? { errorMessage } : {}),
      },
      // Clear anything the previous run left behind.
      $unset: {
        ...(topSignature ? {} : { topSignature: 1 }),
        ...(errorMessage ? {} : { errorMessage: 1 }),
      },
    },
    { upsert: true, setDefaultsOnInsert: true }
  );

  return { status, skippedDuplicate: false, errorCount, warnCount, windowStart, windowEnd };
}
