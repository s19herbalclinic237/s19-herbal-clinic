import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/admin-guard";
import { connectDb } from "@/lib/db";
import { listAppLogs, summariseAppLogs, type AppLogFilter } from "@/lib/app-log";
import { APP_LOG_RETENTION_DAYS } from "@/lib/models/AppLog";
import { LogDigest, LOG_DIGEST_ID } from "@/lib/models/LogDigest";
import { runDailyLogDigest } from "@/lib/app-log-digest";

export const dynamic = "force-dynamic";

/**
 * Durable error log for the admin panel: the entries themselves, a rolling
 * summary, and the state of the last daily digest email. Entries are already
 * redacted at write time, so nothing here needs masking again.
 */
export async function GET(request: Request) {
  const denied = await adminGuard();
  if (denied) return denied;

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "The error log is temporarily unavailable." }, { status: 503 });
  }

  const url = new URL(request.url);
  const level = url.searchParams.get("level");
  const source = url.searchParams.get("source");
  const filter: AppLogFilter = {
    level: level === "error" || level === "warn" || level === "info" ? level : undefined,
    source:
      source === "console" || source === "request" || source === "manual" ? source : undefined,
    scope: url.searchParams.get("scope")?.trim() || undefined,
    search: url.searchParams.get("q")?.trim() || undefined,
  };

  try {
    const [entries, summary, digest] = await Promise.all([
      listAppLogs(filter),
      summariseAppLogs(),
      LogDigest.findById(LOG_DIGEST_ID).lean(),
    ]);

    return NextResponse.json({
      entries: entries.map((e) => ({
        id: String(e._id),
        level: e.level,
        source: e.source,
        scope: e.scope,
        message: e.message,
        context: e.context ?? null,
        route: e.route ?? null,
        method: e.method ?? null,
        status: e.status ?? null,
        digest: e.digest ?? null,
        occurrences: e.occurrences,
        firstSeen: e.firstSeen,
        lastSeen: e.lastSeen,
      })),
      summary,
      retentionDays: APP_LOG_RETENTION_DAYS,
      digest: digest
        ? {
            status: digest.status,
            lastSentAt: digest.lastSentAt ?? null,
            windowStart: digest.windowStart ?? null,
            windowEnd: digest.windowEnd ?? null,
            entryCount: digest.entryCount,
            errorCount: digest.errorCount,
            warnCount: digest.warnCount,
            topSignature: digest.topSignature ?? null,
            errorMessage: digest.errorMessage ?? null,
          }
        : { status: "never", lastSentAt: null },
    });
  } catch (error) {
    console.error("[admin/logs] list failed:", error);
    return NextResponse.json({ error: "Could not load the error log." }, { status: 500 });
  }
}

/** Sends the digest immediately. Used by the "Send now" button in the panel. */
export async function POST() {
  const denied = await adminGuard();
  if (denied) return denied;

  try {
    const outcome = await runDailyLogDigest({ force: true });
    return NextResponse.json(outcome);
  } catch (error) {
    console.error("[admin/logs] digest failed:", error);
    const message = error instanceof Error ? error.message : "Could not send the digest.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
