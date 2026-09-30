# Error Log & Monitoring

How to find out what broke, without depending on the platform's console.

---

## 1. Why this exists

The hosting platform captures `console.log` / `console.error` automatically —
no code needed, and all of the existing call sites already feed it. The problem
is retention:

| Plan | Runtime log retention |
| --- | --- |
| **Hobby** | **1 hour** |
| Pro | 1 day |
| Pro + Observability Plus | 30 days |
| Enterprise | 3 days |

On Hobby a failed email at 9am is gone by 10am, and **Log Drains** — streaming
logs to S3, Axiom or Datadog — are a paid feature.

So the site keeps its own copy. Everything recorded here *also* goes to the
platform console; this only adds a second, durable copy.

---

## 2. What is stored

Mongoose model `AppLog`, stored in the collection **`applogs`** — Mongoose
lowercases and pluralises collection names, so query `applogs`, not `AppLog`.
One document per distinct error:

| Field | Meaning |
| --- | --- |
| `level` | `error`, `warn` or `info` |
| `source` | `console` (patched console), `request` (unhandled server error), `manual` (`logAppError`) |
| `scope` | Subsystem tag, taken from the `[tag]` prefix — `email`, `whatsapp`, `db`, `admin/backups`… |
| `message` | The log message, capped at 500 characters |
| `context` | Redacted JSON of the remaining log arguments |
| `route` / `method` | Which request produced it, when known |
| `digest` | Matches the reference code shown to the patient on the error page |
| `fingerprint` | Hash of scope + message + route; the key repeats collapse on |
| `occurrences` | How many times this exact error repeated within a one-minute window |
| `firstSeen` / `lastSeen` | Timing |

A second collection, model `LogDigest` / collection **`logdigests`**, holds one
document recording whether the daily digest email went out and when.

---

## 3. What is never stored

Redaction happens **at write time**, so the database never holds the raw value.

- **Dropped entirely** — anything under a key matching `password`, `secret`,
  `token`, `authorization`, `cookie`, `api_key`, `credential`, `session`,
  `cvv`, `pin`. Checked before the value is inspected, so a secret cannot leak
  through a nested shape.
- **Emails** — `john.doe@example.com` becomes `j***@example.com`. The domain
  survives deliberately: SMTP failures are usually domain-level, and the
  masked address still identifies which recipient failed.
- **Phone numbers** — masked to the last four digits, when the value sits under
  a phone-ish key (`phone`, `to`, `whatsapp`, `contact`…) or is written with
  separators (`+237 6 99 88 77 44`).
- **Request headers** — never captured. They carry the session cookie.

**Known limitation:** a phone number written as bare digits with no separators
and no phone-ish key is not masked. In practice this codebase logs recipient
addresses under `to`, which is covered.

Bearer tokens found in free-text messages are replaced with `[redacted-token]`.

---

## 4. How errors get captured

### The console

`instrumentation.ts` calls `installConsoleCapture()` once per server instance.
It wraps `console.error` and `console.warn`, calls the original function first,
then records the entry.

It records **only** calls that follow the codebase convention:

```ts
console.error("[email] delivery failed:", { to, subject, error });
//         ^ scope                                  ^ context
```

All 93 existing call sites match this, so none needed editing. Calls without a
`[tag]` prefix are deliberately ignored — the platform logs its own unhandled
errors to the console, and capturing those would record every framework error
twice.

### Unhandled server errors

`onRequestError` in `instrumentation.ts` is the authoritative record for errors
that reach a 500. It is awaited, wrapped in its own try/catch, and never
receives request headers.

### Why instrumentation must stay Edge-safe

Next.js builds an **Edge** variant of `instrumentation.ts` alongside the Node
one, and the bundler resolves imports **statically** — it does not respect the
`process.env.NEXT_RUNTIME` guard. So although the guard means this code never
runs on Edge, everything it imports is still compiled for Edge.

A single `node:crypto` import anywhere in that chain fails the build with
`A Node.js module is loaded ... not supported in the Edge Runtime`, even though
the branch never executes. That is why the fingerprint uses FNV-1a rather than
`node:crypto`: the fingerprint is a bucketing key, not a security control, so a
non-cryptographic hash is the right tool regardless, and it keeps
`lib/app-log.ts` importable from instrumentation.

If you add a `node:` import to `instrumentation.ts` or anything it reaches,
expect that build failure.

The framework's documented escape hatch is a runtime-guarded `require()` into a
separate file. It was tried here and **did not work** — Turbopack traced the
`require()` into the Edge bundle just the same, so the split bought nothing and
cost three lint suppressions. A single Edge-safe file is what actually builds.

### Explicit calls

Prefer this for anything new — it needs no prefix and always records:

```ts
import { logAppError, logAppWarn } from "@/lib/app-log";

logAppError({ scope: "orders", message: "Payment gateway timed out", context: { orderId } });
```

### Safety properties

- Nothing in `lib/app-log.ts` can throw. A log that breaks the request it
  describes is worse than no log.
- The console patch forwards to the original console first, so the platform's
  own log stream is unchanged.
- Write ceiling: 120 database writes per minute. Beyond that, entries are
  dropped from the database (the console still receives everything) so a failing
  loop cannot flood the cluster.
- Repeats of the same error inside one minute collapse into a single row with
  an `occurrences` counter, so a broken endpoint does not bury the panel.

### The collapse is a single atomic upsert

Collapsing is done with one `updateOne(..., { upsert: true })` filtered on
`fingerprint` plus a `lastSeen` window bound, **not** a find-then-update.

`logAppError` and the console patch are fire-and-forget — callers do not await
them — so a failing endpoint produces many overlapping writes. A read-then-write
collapses correctly in isolation but loses the race under concurrency, and an
error storm is exactly when collapsing matters. Measured: 25 concurrent
fire-and-forget calls previously produced 12 duplicate rows; with the upsert they
produce one row with `occurrences: 25`.

The `lastSeen` bound is also what opens a new window — once the previous row
ages out it stops matching, so a fresh row is inserted. `fingerprint` is
therefore deliberately **not** unique.

### If the log itself ever stops working

Every write path is silent by design, which has one bad consequence: if the log
breaks — bad credentials, an unreachable database, a schema change — nothing
reports it and the panel just stays empty while the site looks healthy.

Set `APP_LOG_DEBUG=1` to make swallowed failures visible on the platform
console. It is reported through a reference to the console captured *before*
the patch is installed, so it cannot re-enter the log and loop. Off by default.

To confirm the log is alive without any error occurring, use **Email digest
now** in the admin panel: it exercises the database read, the aggregation and
the mail transport in one step.

---

## 5. Error pages

- `app/error.tsx` — anything below the root layout.
- `app/global-error.tsx` — root layout failures. Supplies its own `<html>` /
  `<body>` and inline styles, because it does not inherit the global stylesheet.

Both are bilingual (EN/FR) and show the patient a `digest` reference code, which
matches the `digest` on the matching log row.

---

## 6. The daily digest

Sent at 05:30 UTC alongside the database backup, to `ADMIN_EMAIL` plus
`BACKUP_ALERT_EMAILS`.

Content is **aggregate only**: error and warning counts for 24h and 7d, and up
to eight deduplicated error signatures with counts and timings. No request
bodies, no database records, no patient identifiers — the same contract
`sendBackupNotification` requires.

It is emailed **every day, including when clean**. A quiet "all clear" is
useful: it proves the cron, the SMTP credentials and the log pipeline are all
still alive, which is exactly the failure mode a log cannot report on itself.

Idempotent for 20 hours, so a repeated cron invocation will not double-send. The
status is visible in the admin panel, and **Email digest now** forces a resend.

### `CRON_SECRET` — set and verified 30 September 2026

`/api/cron/backups` refuses to run unless `CRON_SECRET` is set and the request
carries `Authorization: Bearer <secret>`. It **fails closed** on purpose.

This was a real production fault, found by the feature's own reporting on first
run: `CRON_SECRET` was not configured, and the guard used to skip its check
whenever the variable was missing. That left an unauthenticated public endpoint
which runs the backup and sends mail to anyone who asked. A missing secret is a
configuration fault, so the route now returns `503` and names the problem
instead of running wide open.

**Status: resolved.** The variable is set in Vercel, a redeploy picked it up, and
the endpoint was probed to confirm rather than assumed:

```bash
curl -i https://www.s19herbalclinic.com/api/cron/backups
# 503 + "CRON_SECRET is not configured"  -> still needs setting
# 401 + "Unauthorized"                   -> set, and the guard is working
```

Production currently returns **401**, so the nightly backup and digest are live.

If a future deployment ever regresses to `503`, set it again in Vercel → Settings
→ Environment Variables (any random string, e.g. `openssl rand -hex 32`) and
**redeploy** — environment variables are baked in at build time, so adding one to
a running deployment changes nothing on its own. Vercel Cron attaches it as a
bearer token automatically.

---

## 7. Retention and cost

- **90 days**, enforced by a MongoDB TTL index — no cron job, so it keeps
  working even if the schedule never fires.
- Override with `LOG_RETENTION_DAYS`.

Realistic size: 50 errors/day × 90 days × ~2 KB ≈ **9 MB**. Atlas free tier
gives 512 MB shared, and the collection is inside the encrypted backup already
(the backup discovers collections dynamically, so no registration was needed).

---

## 8. Where to look

**Admin panel → Clinic Admin → Error Log**, or directly:
`/account?tab=admin-logs`

- Errors 24h / 7d, warnings, entries stored
- Last digest status and time
- Filter by level, area or free text
- Expand any row for the redacted context payload
- **Email digest now**

Deep links only open tabs the signed-in role can already see.

---

## 9. Environment variables

None are required. The log works as soon as the database is reachable.

| Variable | Default | Purpose |
| --- | --- | --- |
| `LOG_RETENTION_DAYS` | `90` | How long entries are kept |
| `APP_LOG_DEBUG` | unset | Set to `1` to print swallowed log failures to the platform console. Diagnosing use only. |

Retention is read once at module load, so changing it needs a redeploy.

---

## 10. Verification performed

Checked against a real production build, not just type-checking:

- Console capture records `[scope]` calls; unprefixed `console.log` is ignored.
- Redaction confirmed on a real write: `{ to: "patient@example.com",
  password: "hunter2", count: 3 }` stored as
  `{"to":"p***@example.com","password":"[redacted]","count":3}`.
- Dedupe confirmed: 25 concurrent fire-and-forget writes produce one row with
  `occurrences: 25`.
- TTL index present on `applogs` with `expireAfterSeconds` derived from
  `LOG_RETENTION_DAYS`.
- `GET /api/admin/logs` returns 403 for an unauthenticated request.
- `onRequestError` recorded a genuine unhandled error, with the route and the
  digest, proving the automatic path is not dead code.
- Cron auth, all three cases: missing secret → `503`, wrong secret → `401`,
  correct secret → runs, and the digest reports `"status": "sent"`.

### Two faults this verification caught

Both were found by running the code rather than reading it, and both would
otherwise have shipped silently:

1. **The digest had never worked.** `LogDigest.findById("daily")` threw
   `Cast to ObjectId failed`, because the schema inherited Mongoose's ObjectId
   `_id` while the code keys the singleton by a string. This failed in the worst
   possible way: a summary that never sends reports nothing. The same cast
   error would also have made `GET /api/admin/logs` return `500`, so the admin
   tab was broken too.
2. **The cron endpoint was public**, because `CRON_SECRET` was unset and the
   guard failed open. Confirmed by a real unauthenticated request returning
   `200` and running the backup. **Both halves are now fixed** — the guard fails
   closed, and the variable is set and verified in production.

## 11. Still to do

- If a specific error keeps recurring and its `context` is not detailed enough,
  add an explicit `logAppError` call at that site rather than widening the
  console capture.
- Delivery-status webhooks for WhatsApp are not built; a send that fails is
  visible here, per patient, but Meta's delivered/read status is not tracked.
