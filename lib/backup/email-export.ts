import "server-only";

import { Encrypter } from "age-encryption";
import { EJSON } from "bson";
import { createHash, randomUUID } from "node:crypto";
import { promisify } from "node:util";
import { gzip } from "node:zlib";
import mongoose from "mongoose";
import { connectDb } from "@/lib/db";
import { BackupRun, type BackupTrigger, type IBackupRun } from "@/lib/models/BackupRun";
import { sendEmailWithAttachments } from "@/lib/email";

const gzipAsync = promisify(gzip);

const FORMAT = "s19-email-backup/v1";

/** Conservative default: comfortable for 100–1000 patients; override with env. */
const MAX_BYTES = parseInt(process.env.BACKUP_EMAIL_MAX_BYTES || String(25 * 1024 * 1024), 10);

export function emailBackupRecipient(): string {
  const admin = process.env.ADMIN_EMAIL?.trim();
  const alerts = (process.env.BACKUP_ALERT_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return (alerts[0] ?? admin ?? "").toLowerCase();
}

/** True when SMTP credentials and a recipient address are configured. */
export function emailBackupConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      emailBackupRecipient()
  );
}

function sha256(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

function htmlEscape(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function dayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export interface EmailBackupInput {
  trigger: BackupTrigger;
  requestedBy?: string;
  reason?: string;
}

export interface EmailBackupOutcome {
  run: IBackupRun | null;
  duplicate: boolean;
  skippedMissingConfig: boolean;
}

/**
 * Lightweight full-database backup: every application collection is exported
 * as EJSON (dates/ObjectIds preserved), gzip-compressed into one self-contained
 * JSON package, optionally age-encrypted end-to-end, and emailed to the clinic
 * admin mailbox. A BackupRun row records the audit trail.
 *
 * Only the admin's inbox receives the file. The attachment contains all
 * database documents (including health records), so the recipient address must
 * be the clinic's own protected mailbox; set BACKUP_AGE_RECIPIENTS to encrypt
 * the attachment with the clinic's age public key so it cannot be read if the
 * mailbox is ever compromised.
 */
export async function runEmailBackup(input: EmailBackupInput): Promise<EmailBackupOutcome> {
  const conn = await connectDb();
  if (!conn) {
    throw new Error("Database is unavailable for backup");
  }
  if (!emailBackupConfigured()) {
    // Record the gap but never crash callers that call us opportunistically
    // (for example a cron probe) — the dashboard exposes this status.
    return { run: null, duplicate: false, skippedMissingConfig: true };
  }

  // Idempotent daily key so a retried cron tick cannot email twice.
  const logicalRunId =
    input.trigger === "scheduled"
      ? `email:scheduled:${dayKey()}`
      : `email:${input.trigger}:${dayKey()}:${randomUUID()}`;

  const existing =
    input.trigger === "scheduled"
      ? await BackupRun.findOne({ logicalRunId, state: "succeeded" }).lean()
      : null;
  if (existing) {
    return { run: existing, duplicate: true, skippedMissingConfig: false };
  }

  const run = await BackupRun.create({
    logicalRunId,
    attempt: 1,
    state: "capturing-mongo",
    trigger: input.trigger,
    scheduledFor: input.trigger === "scheduled" ? new Date() : undefined,
    requestedBy: input.requestedBy,
    requestReason: input.reason?.trim().slice(0, 300),
    collectionCount: 0,
    documentCount: 0,
    assetCount: 0,
    originalCount: 0,
    originalBytes: 0,
    transportVerified: false,
    notificationStatus: "pending",
    restoreTestStatus: "not-tested",
    stage: "email-export",
  });
  const runId = String(run._id);

  const startedAt = new Date();
  let payloadBytes = 0;
  let encrypted = false;

  try {
    const db = mongoose.connection.db;
    if (!db) throw new Error("MongoDB connection has no database");

    const collections = (await db.listCollections().toArray())
      .map((c) => c.name)
      .filter((name) => !name.startsWith("system."))
      .sort((a, b) => a.localeCompare(b));

    const packageDoc: {
      format: string;
      exportedAt: string;
      database: string;
      runId: string;
      collections: Record<string, { count: number; bytes: number; sha256: string; ndjson: string }>;
    } = {
      format: FORMAT,
      exportedAt: startedAt.toISOString(),
      database: db.databaseName,
      runId,
      collections: {},
    };

    let documentCount = 0;
    const collectionEntries: Array<{ name: string; count: number; bytes: number; sha256: string }> = [];

    for (const name of collections) {
      await BackupRun.updateOne(
        { _id: runId },
        { $set: { stage: `email-export:${name}` } }
      ).exec();
      const docs = await db.collection(name).find({}).toArray();
      const lines = docs.map((doc) => EJSON.stringify(doc, { relaxed: false })).join("\n");
      const ndjson = lines.length > 0 ? `${lines}\n` : "";
      const raw = Buffer.from(ndjson, "utf8");
      packageDoc.collections[name] = {
        count: docs.length,
        bytes: raw.length,
        sha256: sha256(raw),
        ndjson,
      };
      collectionEntries.push({
        name,
        count: docs.length,
        bytes: raw.length,
        sha256: sha256(raw),
      });
      documentCount += docs.length;
    }

    const json = Buffer.from(JSON.stringify(packageDoc), "utf8");
    payloadBytes = json.length;
    const compressed = await gzipAsync(json);
    const compressedSha = sha256(compressed);

    if (compressed.length > MAX_BYTES) {
      throw new Error(
        `Backup exceeds BACKUP_EMAIL_MAX_BYTES (${compressed.length} > ${MAX_BYTES}); configure the object-storage pipeline for larger archives`
      );
    }

    // Optional end-to-end encryption with the clinic's age public key.
    let attachment = compressed;
    let filename = `s19-database-backup-${dayKey()}-${runId.slice(0, 8)}.json.gz`;
    let contentType = "application/gzip";
    const recipients = (process.env.BACKUP_AGE_RECIPIENTS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.startsWith("age1"));
    if (recipients.length > 0) {
      const encrypter = new Encrypter();
      encrypter.addRecipient(recipients[0]);
      attachment = Buffer.from(await encrypter.encrypt(compressed));
      filename = `s19-database-backup-${dayKey()}-${runId.slice(0, 8)}.tar.age`;
      contentType = "application/octet-stream";
      encrypted = true;
    }

    const row = (key: string, value: unknown) =>
      `<tr><td style="padding:6px 12px 6px 0;color:#64756d;font-size:13px">${htmlEscape(key)}</td><td style="padding:6px 0;color:#14251e;font-size:13px;font-family:monospace;word-break:break-all">${htmlEscape(value)}</td></tr>`;

    const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f4f7f5;padding:24px;color:#14251e"><div style="max-width:680px;margin:auto;background:white;border:1px solid #dce7e1;border-radius:12px;padding:28px"><h1 style="margin-top:0;color:#124034">S19 database backup — ${htmlEscape(dayKey())}</h1><p style="color:#64756d;font-size:14px;line-height:1.6">The complete S19 database backup is attached (${encrypted ? "age-encrypted" : "gzip"}). This is an operational archive: keep the file in the clinic's protected storage and do not forward it. The email body intentionally contains no patient data.</p><table style="border-collapse:collapse;width:100%">${[
      ["Run", `${runId}`],
      ["Trigger", input.trigger],
      ["Database", db.databaseName],
      ["Collections", collections.length],
      ["Documents", documentCount],
      ["Raw bytes", payloadBytes],
      ["Archive bytes", attachment.length],
      ["Archive SHA-256", sha256(attachment)],
      ["Encryption", encrypted ? "age (X25519 recipient)" : "none — configure BACKUP_AGE_RECIPIENTS"],
      ...collectionEntries.map((c) => [
        `Collection: ${c.name}`,
        `${c.count} docs · ${c.bytes} bytes · ${c.sha256.slice(0, 16)}…`,
      ]),
    ]
      .map(([k, v]) => row(String(k), v))
      .join("")}</table><p style="color:#64756d;font-size:12px;margin-top:24px">Restore: ungzip/decrypt the attachment, then load the JSON into a MongoDB shell or a script. Verify each collection hash against this email.</p></div></body></html>`;

    const delivered = await sendEmailWithAttachments({
      to: emailBackupRecipient(),
      subject: `S19 database backup ${dayKey()} (${collections.length} collections, ${documentCount} documents)`,
      html,
      attachments: [{ filename, content: attachment, contentType }],
    });

    await BackupRun.updateOne(
      { _id: runId },
      {
        $set: {
          state: "succeeded",
          stage: "complete",
          completedAt: new Date(),
          collectionCount: collections.length,
          documentCount,
          originalCount: collections.length,
          originalBytes: payloadBytes,
          ciphertextBytes: attachment.length,
          ciphertextSha256: sha256(attachment),
          manifestSha256: compressedSha,
          transportVerified: false,
          notificationStatus: delivered ? "sent" : "failed",
        },
        $unset: { errorCode: 1, errorStage: 1 },
      }
    ).exec();

    const finalRun = await BackupRun.findById(runId).lean();
    return { run: finalRun, duplicate: false, skippedMissingConfig: false };
  } catch (error) {
    const errorCode = error instanceof Error ? error.name.slice(0, 80) : "BACKUP_ERROR";
    await BackupRun.updateOne(
      { _id: runId },
      {
        $set: {
          state: "failed",
          stage: "email-export",
          completedAt: new Date(),
          errorCode: `EMAIL_BACKUP_${errorCode}`,
          errorStage: "email-export",
          notificationStatus: "failed",
        },
      }
    ).exec();
    throw error;
  }
}