import { sendBackupNotification } from "@/lib/email";
import type { BackupConfig } from "@/lib/backup/config";

export interface BackupNotificationData {
  runId: string;
  state: "succeeded" | "failed";
  trigger: string;
  startedAt?: Date;
  completedAt?: Date;
  collectionCount: number;
  documentCount: number;
  assetCount: number;
  originalBytes: number;
  ciphertextBytes?: number;
  ciphertextSha256?: string;
  manifestSha256?: string;
  transportVerified: boolean;
  restoreTestStatus: string;
  errorCode?: string;
  errorStage?: string;
}

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function rows(data: BackupNotificationData): string {
  return [
    ["Run ID", data.runId],
    ["Trigger", data.trigger],
    ["Started", data.startedAt?.toISOString() || "Not recorded"],
    ["Completed", data.completedAt?.toISOString() || "Not recorded"],
    ["MongoDB collections", data.collectionCount],
    ["MongoDB documents", data.documentCount],
    ["Cloudinary assets/originals", `${data.assetCount} / ${data.assetCount}`],
    ["Original bytes", data.originalBytes],
    ["Encrypted bytes", data.ciphertextBytes ?? "Not recorded"],
    ["Transport verified", data.transportVerified ? "Yes" : "No"],
    ["Latest offline restore test", data.restoreTestStatus],
    ["Ciphertext SHA-256", data.ciphertextSha256 || "Not recorded"],
    ["Manifest SHA-256", data.manifestSha256 || "Not recorded"],
    ["Failure stage", data.errorStage || "None"],
    ["Failure code", data.errorCode || "None"],
  ]
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#64756d;font-size:13px">${esc(label)}</td><td style="padding:6px 0;color:#14251e;font-size:13px;font-family:monospace;word-break:break-all">${esc(value)}</td></tr>`
    )
    .join("");
}

export async function notifyBackupOutcome(
  config: BackupConfig,
  data: BackupNotificationData
): Promise<"sent" | "failed" | "not-configured"> {
  if (config.alertEmails.length === 0) return "not-configured";
  const success = data.state === "succeeded";
  const subject = success
    ? `S19 encrypted backup succeeded: ${data.runId.slice(0, 8)}`
    : `S19 encrypted backup FAILED: ${data.runId.slice(0, 8)}`;
  const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f4f7f5;padding:24px;color:#14251e"><div style="max-width:680px;margin:auto;background:white;border:1px solid #dce7e1;border-radius:12px;padding:28px"><h1 style="margin-top:0;color:#124034">${success ? "Encrypted backup succeeded" : "Encrypted backup failed"}</h1><p>This operational alert contains no patient data, database content, media URLs, credentials, or private keys.</p><table style="border-collapse:collapse;width:100%">${rows(data)}</table><p style="color:#64756d;font-size:12px;margin-top:24px">Verify the backup dashboard and independent monitoring channel. Do not treat this email as the backup itself.</p></div></body></html>`;

  const results = await Promise.allSettled(
    config.alertEmails.map((email) => sendBackupNotification(email, subject, html))
  );
  return results.some((result) => result.status === "fulfilled") ? "sent" : "failed";
}
