import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { runEmailBackup } from "@/lib/backup/email-export";
import { getBackupConfig, backupConfigurationErrors } from "@/lib/backup/config";
import {
  claimNextBackup,
  enqueueBackup,
  recoverExpiredBackupRuns,
} from "@/lib/backup/queue";
import { runBackup } from "@/lib/backup/orchestrator";

/**
 * Scheduled maintenance route called by Vercel Cron (see vercel.json).
 *
 * Responsibilities:
 *  1. Recover backup runs whose worker lease expired.
 *  2. Enqueue today's encrypted object-store archive when that pipeline is
 *     configured (S3 + KMS + age), then execute queued runs.
 *  3. Run the lightweight emailed database backup (idempotent once per day).
 *
 * Every step is isolated so one failure cannot hide the others, and each is
 * reported in the response for monitoring.
 */
export async function GET(request: Request) {
  // Protect against public invocation: when CRON_SECRET is set it must be
  // supplied as `Authorization: Bearer <secret>`. Vercel Cron can be configured
  // to send this header. Locally (non-production) the check is relaxed.
  const secret = process.env.CRON_SECRET;
  if (secret && process.env.NODE_ENV !== "development") {
    const header = request.headers.get("authorization") ?? "";
    if (header !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
  }

  const result: {
    recovered: number | null;
    archive: { configured: boolean; error?: string; ran?: number };
    email: { delivered: boolean; duplicate: boolean; skipped: boolean; error?: string };
  } = {
    recovered: null,
    archive: { configured: false },
    email: { delivered: false, duplicate: false, skipped: false },
  };

  // 1. Lease recovery (works even when nothing else is configured).
  try {
    await connectDb();
    result.recovered = await recoverExpiredBackupRuns();
  } catch (error) {
    result.archive.error = error instanceof Error ? error.message : String(error);
  }

  // 2. Encrypted object-store archive (only when its infrastructure exists).
  try {
    const config = getBackupConfig();
    const errors = backupConfigurationErrors(config);
    result.archive.configured = errors.length === 0;
    if (errors.length === 0) {
      await enqueueBackup({ trigger: "scheduled", scheduledFor: new Date() });
      let ran = 0;
      for (let i = 0; i < 4; i += 1) {
        const claimed = await claimNextBackup();
        if (!claimed) break;
        await runBackup({ runId: String(claimed.run._id), owner: claimed.owner, config });
        ran += 1;
      }
      result.archive.ran = ran;
    } else {
      result.archive.error = errors.join("; ");
    }
  } catch (error) {
    result.archive.error = error instanceof Error ? error.message : String(error);
  }

  // 3. Lightweight emailed database backup.
  try {
    const outcome = await runEmailBackup({ trigger: "scheduled" });
    result.email.delivered = outcome.run?.notificationStatus === "sent";
    result.email.duplicate = outcome.duplicate;
    result.email.skipped = outcome.skippedMissingConfig;
    if (outcome.run?.state === "failed") {
      result.email.error = outcome.run.errorCode ?? "email backup failed";
    }
  } catch (error) {
    result.email.error = error instanceof Error ? error.message : String(error);
  }

  return NextResponse.json(result);
}