/**
 * Manual backup CLI.
 *
 *   npm run backup            # lightweight emailed database backup
 *   npm run backup -- archive # encrypted object-store archive (needs S3/KMS/age)
 *
 * Records every run in the BackupRun collection for the audit trail.
 */
import "dotenv/config";
import { connectDb } from "@/lib/db";
import { runEmailBackup } from "@/lib/backup/email-export";
import { getBackupConfig, backupConfigurationErrors } from "@/lib/backup/config";
import { claimNextBackup, enqueueBackup } from "@/lib/backup/queue";
import { runBackup } from "@/lib/backup/orchestrator";

async function main() {
  const mode = process.argv[2] ?? "email";
  const conn = await connectDb();
  if (!conn) throw new Error("Database is unavailable");

  if (mode === "archive") {
    const config = getBackupConfig();
    const errors = backupConfigurationErrors(config);
    if (errors.length > 0) {
      console.error("[backup] archive pipeline is not configured:");
      for (const e of errors) console.error("  -", e);
      process.exitCode = 1;
      return;
    }
    await enqueueBackup({ trigger: "cli", reason: "manual CLI archive" });
    const claimed = await claimNextBackup();
    if (!claimed) {
      console.error("[backup] no backup run could be claimed (another worker holds the lease?)");
      process.exitCode = 1;
      return;
    }
    await runBackup({ runId: String(claimed.run._id), owner: claimed.owner, config });
    console.log("[backup] archive completed:", String(claimed.run._id));
    return;
  }

  const outcome = await runEmailBackup({ trigger: "cli", reason: "manual CLI email backup" });
  if (outcome.skippedMissingConfig) {
    console.error("[backup] email backup is not configured: set SMTP credentials and ADMIN_EMAIL.");
    process.exitCode = 1;
    return;
  }
  console.log(
    `[backup] email backup ${outcome.duplicate ? "(already done today)" : "completed"} —`,
    outcome.run
      ? `${outcome.run.documentCount} documents, notification: ${outcome.run.notificationStatus}`
      : "no run recorded"
  );
}

main().catch((error) => {
  console.error("[backup] failed:", error);
  process.exitCode = 1;
});