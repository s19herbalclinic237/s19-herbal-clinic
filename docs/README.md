# S19 documentation

This directory is the operational and technical source of truth for the S19 Herbal Clinic web application. It is maintained as Markdown so the site, patient portal, clinic dashboard, compliance work, and future maintainers can refer to the same system inventory.

**Documentation baseline:** 25 September 2026  
**Application:** S19 Herbal Clinic, Bafoussam, Cameroon  
**Repository root:** `../`

## Documents

| Document | Purpose |
| --- | --- |
| [Architecture and stack](ARCHITECTURE.md) | Runtime topology, framework, data stores, integrations, request flows, deployment assumptions, and known architecture risks. |
| [Features and API](FEATURES_AND_API.md) | Public-site features, patient-portal features, clinic-dashboard features, MongoDB collections, and every current API route. |
| [Dashboard actions](DASHBOARD_ACTIONS.md) | Exact patient and administrator actions, permissions, and data changed by each dashboard workflow. |
| [Performance testing](PERFORMANCE_TESTING.md) | Repeatable lab and field test plan, performance budgets, commands, test data, monitoring, and acceptance thresholds. |
| [Security and privacy audit](SECURITY_PRIVACY_AUDIT.md) | Current-state risk register and prioritized remediation checklist; not a claim of legal compliance. |
| [Roles and permissions](ROLES_AND_PERMISSIONS.md) | Target least-privilege role matrix and migration/authorization requirements. |
| [Legal compliance gap register](LEGAL_COMPLIANCE_GAP_REGISTER.md) | Cameroon-first legal requirements, evidence, unresolved business facts, and counsel-review questions. |
| [Backup and recovery](BACKUP_AND_RECOVERY.md) | Encrypted backup, restore, retention, monitoring, and disaster-recovery runbook. |
| [WhatsApp notifications](WHATSAPP_SETUP.md) | Meta Cloud API setup runbook: credentials, env vars, the ten message templates, patient consent, and what is not covered. **Sending.** |
| [Treatment plan schedule](TREATMENT_PLAN_SCHEDULE.md) | Module M3: what issuing a treatment plan derives, the clinic-supplied cadences, and the gate that keeps it inert until they are confirmed. |
| [Stock and inventory](INVENTORY.md) | How product stock is held, released and recounted, why every change is an append-only ledger row, and what is deliberately left for the clinic to set. |
| [Image SEO](IMAGE_SEO.md) | Module M17: the image audit, the descriptive renames, the single-source asset registry, and what is deliberately left undone. |
| [Error log and monitoring](LOGGING_AND_MONITORING.md) | Durable error log, what is redacted before storage, retention, the daily digest email, and the admin panel. |

## How to keep this documentation accurate

1. Update the relevant document in the same pull request as code or configuration changes.
2. Re-run the route inventory after adding, removing, or changing an API handler.
3. Treat public policy statements as legal-content changes, not ordinary copy changes.
4. Never place patient information, credentials, backup keys, tokens, SMTP passwords, or Cloudinary secrets in these documents.
5. Record operational verification dates and evidence links; do not mark a control complete based only on planned code.

## Branches

`main` carries only work that is independent of Meta and Fapshi credentials, so it can ship whether or not the clinic pays for the messaging half. `feat/whatsapp-fapshi` is a strict superset - it is `main` plus the inbound webhook, the outbound engine and their documentation - so deploying it deploys everything.

| Branch | Contains |
| --- | --- |
| `main` | Brand copy, image SEO, clinic timezone, `PatientEvent` log, treatment-plan schedule derivation, cron authentication, the staff worklist, stock and inventory, transactional WhatsApp sending (pre-existing). |
| `feat/whatsapp-fapshi` | All of `main`, plus the inbound webhook, outbox and outbound engine, the staff inbox, the Fapshi guides, and the `/api/cron/outbound` schedule. |

`main` was deployed on 30 September 2026 at `94d8f7e` and is what production currently runs. The deployment was verified live: the automation routes (`/api/webhooks/whatsapp`, `/api/cron/outbound`, `/api/admin/whatsapp/inbox`) all return 404, so the WhatsApp and Fapshi halves are genuinely absent from production. `feat/whatsapp-fapshi` has not been deployed. Nothing on either branch reaches Meta or Fapshi without credentials that do not exist yet.

**After switching branches, delete `.next` before trusting `npm.cmd run typecheck`.** Next generates `.next/types/validator.ts` listing every route it built, and `tsc` reads that file. Building one branch and then checking out another leaves the old route list behind, producing errors like `Cannot find module '../../app/api/webhooks/whatsapp/route.js'` for routes that do not exist on the branch you are now on. These are cache artefacts, not real faults. `Remove-Item -Recurse -Force .next` clears it.

## Current baseline verification

The following baseline was run on 25 September 2026:

```powershell
npm.cmd run lint
npm.cmd run build
```

Both commands completed successfully at the time of the initial documentation baseline. ESLint reported warnings, not errors, including raw `<img>` usage and one unused variable. Re-run both commands after every implementation phase; the status in this document can become stale.

## Phase changelog

| Date | What changed in this phase |
| --- | --- |
| 2026-09-30 | Added the append-only patient history and the clinic timezone: `lib/clinic-time.ts` pins all clinic-date maths to `Africa/Douala`, fixing "today" being an hour wrong on Vercel, and `lib/events.ts` + `lib/event-log.ts` + `lib/models/PatientEvent.ts` record what happened to a patient as data rather than inferring it from rows. Added a zero-dependency `node:test` suite (`npm.cmd run test`, `npm.cmd run typecheck`). |
| 2026-09-30 | **Treatment plan lifecycle.** `lib/plan-lifecycle.ts` derives the dated schedule a plan implies - reviews, labs, and instalments when the clinic has stated a total - so issuing a plan produces something to do and something to chase. Gated behind `TREATMENT_SCHEDULE_ENABLED`, and the cadences in `lib/treatment-rules.ts` are placeholders until the clinic confirms them. |
| 2026-09-30 | **Cron authentication.** `/api/cron/backups` was publicly callable, so anyone could trigger a full database export by email. Added `lib/cron-auth.ts` with a timing-safe bearer check that fails closed: an unset `CRON_SECRET` returns 503 in production rather than serving the backup unauthenticated. 20 tests. Deployed and verified - the endpoint now returns 401. |
| 2026-09-30 | **Stock and inventory.** Product stock was a number staff typed over by hand and no order ever decremented it, so it drifted silently and a mistake was permanent and invisible. Added an append-only `StockMovement` ledger: placing an order holds stock, cancelling returns it, and a manual edit becomes a recorded adjustment instead of a silent overwrite. Movements are idempotent per order, so a retried request cannot double-count. Stock never goes below zero and checkout is never blocked - an order that exceeds stock records an explicit shortfall instead. Reorder levels are nullable with no default, so an unset level reads as "not decided yet" rather than a guessed alarm. `npm.cmd run verify:stock` exercises the real ledger against a throwaway database (22 checks). |
| 2026-09-30 | **Staff daily worklist.** The alert feed became a worklist: one line per patient, with a reason, an owner and an age. Alert rules were extracted into a pure module so the feed and the worklist cannot drift apart, and the two behaviour bugs found while doing it were fixed - "today" now comes from `clinicToday` rather than a duplicated UTC-shifted calculation, and the per-plan glucose query is one aggregate instead of two queries per plan. A resolved alert suppresses itself only while it keeps appearing without a break; if the condition clears and returns it re-opens as unowned work. 248 tests, and `npm.cmd run verify:alerts` runs the real filters against the live database read-only. |
| 2026-09-25 | Implemented the `doctor` role (clinicalGuard/adminGuard split, doctor persona, `/api/admin/roles`); implemented backups (daily emailed EJSON snapshot + optional age/S3 archive pipeline, manual/CLI/cron triggers, `BackupRun` audit, `/api/admin/backups`, `/api/cron/backups` with `CRON_SECRET`); added a first-party rate limiter on 17 routes and global security headers; added exact join date to the dashboard overview; rewrote `/privacy`, `/terms`, `/cookies` to be truthful and Cameroon-first; created `ROLES_AND_PERMISSIONS.md`, `BACKUP_AND_RECOVERY.md`, and `LEGAL_COMPLIANCE_GAP_REGISTER.md`; updated the other documents in this directory to match. |
