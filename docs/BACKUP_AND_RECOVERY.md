# Backup and recovery

**Baseline:** 25 September 2026
**Purpose:** Operational runbook for S19's database backup and recovery: what runs automatically, how to trigger a backup manually, the exact format of a backup, how to restore it, retention, monitoring, and the disaster-recovery drill plan.

**Why this exists:** The clinic relies on MongoDB Atlas and Cloudinary free/low tiers, and plans for 100–1,000 patients. If data is accidentally deleted, a provider incident occurs, or police/legal investigation requires records, the clinic must be able to reproduce the database. Committed code alone is not a control: **a backup that has never been restored is not a backup**. Restore drills are part of this runbook.

> The emailed backup attachment contains **all database documents, including health records**, and is a highly sensitive artifact. It must only ever be emailed to the clinic's own protected mailbox and must never be forwarded.

## 1. Two pipelines, one audit trail

| | Lightweight emailed backup | Encrypted object-store archive |
| --- | --- | --- |
| **Primary purpose** | Daily + on-demand full database snapshot delivered to the admin mailbox | Heavy, independent, encrypted archive for long-term/legal-grade recovery |
| **Content** | Every application MongoDB collection, exported as EJSON | Same MongoDB export (BSON + EJSON) **plus** Cloudinary originals inventory/copies, checksums, manifest |
| **Format** | One gzip JSON package (`s19-email-backup/v1`), optionally age-encrypted | tar stream, age-encrypted, containing `mongo/*.bson`, `mongo/*.ejson`, `cloudinary/originals/*`, `manifest.json`, `checksums.json` |
| **Destination** | Admin mailbox via SMTP attachment | S3-compatible object store (KMS-SSE encrypted, object-lock-friendly key scheme) |
| **When it runs** | Vercel Cron daily 05:30 UTC + manual button/CLI | Cron/CLI only when `BACKUP_S3_*` infrastructure is configured |
| **Idempotency** | One successful scheduled run per calendar day (`email:scheduled:YYYY-MM-DD`) | Hourly scheduled idempotency via `enqueueBackup`; lease-based queue |
| **Audit row** | `BackupRun` | `BackupRun` + `BackupLease` |

Both pipelines record every attempt in the `BackupRun` collection (state machine, trigger, counts, hashes, notification status), which is what the **Data Backups** tab in the admin dashboard displays.

### Required environment for the emailed backup

`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and a recipient — either `ADMIN_EMAIL` (auto-included) or `BACKUP_ALERT_EMAILS`. Without these the manual run returns 400 and the cron route reports `email.skipped: true` instead of crashing.

### Optional hardening for the emailed backup

- `BACKUP_AGE_RECIPIENTS=age1…` (one or more public age keys). When set, the attachment is **age-encrypted end-to-end** (filename `…tar.age`) so a compromised mailbox cannot be read without the clinic's identity key.
- `BACKUP_EMAIL_MAX_BYTES` (default 25 MB). If the compressed database exceeds it, the run fails with a clear error telling you to use the object-store pipeline.

### Object-store archive configuration

`BACKUP_S3_BUCKET`, `BACKUP_S3_REGION`, `BACKUP_S3_ENDPOINT`, `BACKUP_S3_ACCESS_KEY_ID`, `BACKUP_S3_SECRET_ACCESS_KEY`, `BACKUP_S3_KMS_KEY_ID`, `BACKUP_S3_FORCE_PATH_STYLE`, `BACKUP_RETENTION_DAYS` (default 35), `BACKUP_CLOUDINARY_PREFIXES` (defaults to `CLOUDINARY_FOLDER` or `s19-medical`), `BACKUP_CLOUDINARY_URL` (or cloud name/key/secret), plus `BACKUP_AGE_RECIPIENTS` and `BACKUP_ALERT_EMAILS`/`ADMIN_EMAIL`.

## 2. Triggers

| Trigger | Mechanism | Implementation |
| --- | --- | --- |
| Scheduled daily | Vercel Cron `30 5 * * *` → `GET /api/cron/backups` | `vercel.json` (deployed with the app). Runs lease recovery, then the archive queue (if configured), then the daily email backup. |
| Manual (dashboard) | **Data Backups** tab → "Run backup now" | `POST /api/admin/backups` (admin-only), optional reason text recorded in `requestReason`. |
| Manual (CLI) | `npm run backup` (email) or `npm run backup -- archive` (object store) | `scripts/backup.ts`; requires local env with `MONGO_URL` etc. |
| Cron endpoint security | `CRON_SECRET` | When set, the cron route requires `Authorization: Bearer <CRON_SECRET>` (enforced in non-development). Configure Vercel Cron to send this header. |

The daily email backup is idempotent: a retried cron tick inside the same UTC day does not produce a second attachment (it returns the existing run as `duplicate: true`).

## 3. What the emailed backup contains

One gzip JSON document with format `s19-email-backup/v1`:

```json
{
  "format": "s19-email-backup/v1",
  "exportedAt": "2026-09-25T05:30:00.000Z",
  "database": "<db name>",
  "runId": "<BackupRun id>",
  "collections": {
    "<collection name>": {
      "count": 123,
      "bytes": 456,
      "sha256": "<hex>",
      "ndjson": "<one EJSON document per line>"
    }
  }
}
```

- EJSON (`relaxed: false`) preserves `Date`, `ObjectId`, and binary types — **restoring from the gzip is an exact type-accurate round trip**, not a lossy JSON import.
- The email body contains **no patient data** — only counts, sizes, hashes, and the run ID.
- The email reports each collection's document count, byte size, and SHA-256 (first 16 hex chars) for post-restore verification.

## 4. Restore procedure (emailed backup)

Prerequisites: the clinic's age identity key (if the attachment is `…tar.age`), Node/tsx in this repository, a target MongoDB, and `MONGO_URL` pointing at the **target** (restore) database.

1. Save the attachment and verify it matches the SHA-256 in the email body.
2. Decompress (and decrypt, if age-encrypted):

   ```powershell
   # not encrypted:
   tar -xzf s19-database-backup-<date>-<id>.json.gz
   # age-encrypted (using the clinic's age identity key):
   age --decrypt -i <clinic-identity-key.txt> -o backup.json s19-database-backup-<date>-<id>.tar.age
   ```

3. Load each collection back into MongoDB. A per-collection NDJSON restore using `mongoimport`:

   ```powershell
   node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('backup.json','utf8'));
   for (const [name,c] of Object.entries(p.collections)) fs.writeFileSync('restore-'+name+'.ndjson', c.ndjson);"
   mongoimport --uri "$env:MONGO_URL" --db <db> --collection user --file restore-user.ndjson
   # repeat for every collection listed in the email/manifest
   ```

   Because the file is EJSON, prefer a scripted import that decodes `$date`/`$oid` shapes (for example a small tsx script using `EJSON.deserialize`) instead of raw NDJSON parsing, so dates/ObjectIds round-trip exactly.
4. Verify counts per collection match the email body, and spot-check spot-check records, dates, and file attachments.
5. Record the drill in the evidence template (§9).

## 5. Restore procedure (object-store archive)

1. Claim the run from the dashboard/backups API or query `BackupRun` for the object key.
2. Download the `.tar.age` object from the S3-compatible bucket using the backup service credentials.
3. Decrypt with the clinic's age identity key.
4. Extract: `mongo/*.bson` can be restored with `mongorestore --archive` or deserialized with `bson`; `mongo/*.ejson` verifies counts; `cloudinary/originals/*` are re-uploadable originals; `manifest.json` and `checksums.json` verify the whole archive (compare `files[].sha256` after download).
5. Verify manifest SHA-256 against the `BackupRun.manifestSha256` value shown in the dashboard.

## 6. Retention and deletion

| Store | Default retention | Notes |
| --- | --- | --- |
| Admin mailbox attachments | Policy decision pending (counsel/clinic) | Recommend downloading each daily file into the clinic's encrypted offline/archive storage and then protecting the mailbox. |
| Object-store archive | `BACKUP_RETENTION_DAYS` (default 35) | Object keys are date-based for lifecycle rules/object-lock policies (`s19-backup/v1/YYYY-MM-DD/…`). Deletion is the responsibility of the bucket lifecycle, not the app. |
| `BackupRun` audit rows | Kept | Audit trail for investigations; keep per record-retention policy. |

**Legal note:** deleting a document from the live database does not and must not instantly delete it from every backup. Backup expiry is governed by the retention policy above; the privacy policy explains this limitation instead of over-promising immediate deletion.

## 7. Monitoring and failure behavior

- **Dashboard:** the **Data Backups** tab (admin) shows the last 30 runs: state, trigger, counts, hashes, notification status, error code/stage, and whether the email address delivered.
- **Cron response:** `/api/cron/backups` returns a JSON envelope `{ recovered, archive: {...}, email: {...} }` with each step isolated so one failure cannot hide the others. Vercel Cron logs this body.
- **Alerts:** backup-failure notifications and the daily backup email go to `BACKUP_ALERT_EMAILS` + `ADMIN_EMAIL`.
- **Failure states recorded:** `state: "failed"` with `errorCode`/`errorStage` (for example `EMAIL_BACKUP_MongooseError`, size-limit errors, SMTP failures → `notificationStatus: "failed"`).
- **Lease recovery:** the cron route and CLI run `recoverExpiredBackupRuns()` first, so a crashed worker's run is re-queued instead of being lost.

## 8. Disaster-recovery drill plan (quarterly)

1. Restore the latest emailed backup into an isolated throwaway MongoDB on staging infrastructure.
2. Verify row counts and a sample of records (a real patient's created-at dates, an ObjectId look-alike field, a binary/image field) against the email hash table.
3. Exercise the archive pipeline once (CLI) and restore the archive in the same isolated database.
4. Time the restore and record it as an RPO/RTO observation (target: RPO ≤ 24 h for the daily email; archive RPO depends on archive schedule).
5. Confirm a terminated/stale `BackupRun` row is recoverable after a simulated lease expiry.
6. Confirm alert emails arrive on failure by temporarily breaking SMTP in staging and triggering a manual run.
7. Store the evidence file (never the backup itself or keys) in the clinic's record store.

## 9. Evidence template

```text
Date:
Operator:
Commit SHA:
Pipeline tested (email / archive / both):
Source database name and approximate size:
Target (restore) database:
Attachment SHA-256 (from email) vs. computed SHA-256:
Collections / documents restored:
Spot-check results:
Time to restore (RPO/RTO observation):
Failure-injection test (lease / SMTP) result:
Pass/fail:
Artifact links (redacted) and where the backup file itself is stored:
```

## 10. Known limitations

- The emailed backup is a **database** backup. Cloudinary media (photos, ID documents, attachments) is only covered by the object-store archive pipeline, which also captures Cloudinary originals. Until the archive pipeline is configured, media must be recoverable via Cloudinary's own backup/service terms — confirm with the provider.
- The `BackupRun` audit collection grows by one row per run (plus retries); it is intentionally small.
- Sessions (`Session`) and reset tokens (`ResetToken`) are backed up with the database; restoring them can re-validate old sessions. After a restore, consider clearing non-essential sessions.
- The backup pipeline runs inside the hosting function's memory/CPU limits; the size cap (`BACKUP_EMAIL_MAX_BYTES`, 25 MB default) deliberately triggers a clear failure rather than a silently truncated attachment. At 1,000+ patients or heavy attachments, switch the primary to the object-store archive.
- Restore of the object-store archive requires the clinic's age identity key and the S3 service credentials; custody of those keys must be a documented clinic procedure (see `LEGAL_COMPLIANCE_GAP_REGISTER.md`).