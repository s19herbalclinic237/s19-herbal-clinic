import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/admin-guard";
import { connectDb } from "@/lib/db";
import { BackupRun } from "@/lib/models/BackupRun";
import { getSessionUser } from "@/lib/auth-server";
import {
  runEmailBackup,
  emailBackupConfigured,
  emailBackupRecipient,
} from "@/lib/backup/email-export";

export async function GET() {
  const denied = await adminGuard();
  if (denied) return denied;

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Backups are temporarily unavailable." }, { status: 503 });
  }

  try {
    const runs = await BackupRun.find()
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();
    return NextResponse.json({
      runs: runs.map((r) => ({
        id: String(r._id),
        logicalRunId: r.logicalRunId,
        state: r.state,
        trigger: r.trigger,
        scheduledFor: r.scheduledFor ?? null,
        startedAt: r.startedAt ?? null,
        completedAt: r.completedAt ?? null,
        collectionCount: r.collectionCount,
        documentCount: r.documentCount,
        originalBytes: r.originalBytes,
        ciphertextBytes: r.ciphertextBytes,
        ciphertextSha256: r.ciphertextSha256,
        manifestSha256: r.manifestSha256,
        notificationStatus: r.notificationStatus,
        transportVerified: r.transportVerified,
        errorCode: r.errorCode ?? null,
        errorStage: r.errorStage ?? null,
        stage: r.stage ?? null,
        requestReason: r.requestReason ?? null,
        createdAt: r.createdAt,
      })),
      config: {
        emailBackup: emailBackupConfigured(),
        archiveBackup: Boolean(process.env.BACKUP_S3_BUCKET),
        recipient: emailBackupRecipient(),
      },
    });
  } catch (error) {
    console.error("[admin/backups] list failed:", error);
    return NextResponse.json({ error: "Could not load backup history." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await adminGuard();
  if (denied) return denied;

  let reason: string | undefined;
  try {
    const body = (await request.json().catch(() => ({}))) as { reason?: unknown };
    reason = typeof body.reason === "string" ? body.reason.slice(0, 300) : undefined;
  } catch {
    reason = undefined;
  }

  const user = await getSessionUser();
  try {
    const outcome = await runEmailBackup({
      trigger: "manual",
      requestedBy: user?.id,
      reason,
    });
    if (outcome.skippedMissingConfig) {
      return NextResponse.json(
        { error: "Email backup is not configured: set SMTP credentials and ADMIN_EMAIL." },
        { status: 400 }
      );
    }
    return NextResponse.json({ run: outcome.run, duplicate: outcome.duplicate });
  } catch (error) {
    console.error("[admin/backups] manual run failed:", error);
    const message = error instanceof Error ? (error.message || "Backup failed.") : "Backup failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}