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
| [WhatsApp notifications](WHATSAPP_SETUP.md) | Meta Cloud API setup runbook: credentials, env vars, the ten message templates, patient consent, and what is not covered. |

## How to keep this documentation accurate

1. Update the relevant document in the same pull request as code or configuration changes.
2. Re-run the route inventory after adding, removing, or changing an API handler.
3. Treat public policy statements as legal-content changes, not ordinary copy changes.
4. Never place patient information, credentials, backup keys, tokens, SMTP passwords, or Cloudinary secrets in these documents.
5. Record operational verification dates and evidence links; do not mark a control complete based only on planned code.

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
| 2026-09-25 | Implemented the `doctor` role (clinicalGuard/adminGuard split, doctor persona, `/api/admin/roles`); implemented backups (daily emailed EJSON snapshot + optional age/S3 archive pipeline, manual/CLI/cron triggers, `BackupRun` audit, `/api/admin/backups`, `/api/cron/backups` with `CRON_SECRET`); added a first-party rate limiter on 17 routes and global security headers; added exact join date to the dashboard overview; rewrote `/privacy`, `/terms`, `/cookies` to be truthful and Cameroon-first; created `ROLES_AND_PERMISSIONS.md`, `BACKUP_AND_RECOVERY.md`, and `LEGAL_COMPLIANCE_GAP_REGISTER.md`; updated the other documents in this directory to match. |
