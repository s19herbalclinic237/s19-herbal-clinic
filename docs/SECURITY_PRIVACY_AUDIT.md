# Security and privacy audit register

**Assessment date:** 25 September 2026  
**Type:** Source-level initial audit  
**Scope:** Current repository, public pages, account/dashboard, 74 route handlers, 20 Mongoose models, Cloudinary/SMTP/translation/video integrations, browser storage, and deployment-relevant configuration.

This is an engineering risk register, not a penetration test, legal opinion, medical-practice opinion, or certification of compliance. Findings marked **Open** require implementation and verification. Some require clinic decisions, qualified Cameroon counsel, a medical-records/professional adviser, or infrastructure-provider confirmation.

## 1. Executive summary

### Highest-risk themes

1. **Clinical authorization is now role-based but not care-scoped.** A `doctor` role with clinical-only API access ships in this phase, but doctors can still access any patient's clinical data — there is no care-relationship scope, clinician attribution on writes, or immutable audit trail.
2. **Sensitive media is not demonstrably private.** ID cards and clinical uploads store Cloudinary `secure_url` values, but current upload code does not mark resources authenticated/private or deliver them through short-lived signed authorization.
3. **No immutable sensitive-data audit trail.** The application does not record who read or changed health/account/identity data.
4. **Rate limiting now covers 17 high-risk routes but is not shared/managed.** The first-party limiter (memory + optional Upstash Redis) protects auth/recovery/upload/contact/newsletter/order/tracking/translation/video routes; a managed Redis-backed limiter and CAPTCHA step-up remain recommended at production scale.
5. **Order intake still trusts browser prices/fees/items.** `/api/orders` computes totals from client-provided values rather than reloading current products and server-owned shipping rules.
6. **Deletion/retention controls are incomplete.** Administrative APIs physically delete some clinical records/plans and have no approved retention/legal-hold workflow.
7. **Encrypted backups now ship (email + optional S3 archive) but restore is unproven.** The daily emailed EJSON backup and archive pipeline are implemented and audited via `BackupRun`; no restore drill, retention-expiry job, or recovery evidence is committed yet.
8. **Core security headers are deployed; a tested CSP is absent.** `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, and production HSTS ship via `next.config.ts`; no Content Security Policy exists yet.
9. **Custom authentication has no MFA, breach throttling, or security-event monitoring.** Opaque hashed sessions and rate-limited auth routes are a useful foundation but do not replace layered controls.
10. **Legal policies now match verified processing but require counsel sign-off.** Cookie/analytic claims were corrected to match reality, and Cameroon-first privacy/terms/cookie policies are published; controller identity, consent records, rights workflows, retention, and provider contracts still need clinic/counsel decisions (see `LEGAL_COMPLIANCE_GAP_REGISTER.md`).

## 2. Current security strengths

These controls are useful foundations, but each should still be tested:

- Passwords use Node `scrypt` with per-password random salts rather than plaintext or fast general-purpose hashes.
- Session and reset/verification tokens are random; only token hashes are persisted in MongoDB.
- The session cookie is HTTP-only, `SameSite=Lax`, path-scoped to `/`, and has a 30-day maximum age.
- Session lookup checks expiry and current user state.
- Patient-facing dynamic resources generally scope by the current session user's ID.
- The Google Drive proxy accepts only Drive-ID-shaped values and does not forward arbitrary upstream URLs.
- Mongoose casts and many schemas enforce field types, enum values, and some length/range limits.
- Public order tracking requires an order reference plus matching customer email.
- Administrative API routes call `adminGuard()` and clinical routes call `clinicalGuard()` (admin or doctor) in the current repository; patient routes scope by session user ID.
- 17 high-risk public/authentication routes are rate-limited by the first-party server-only limiter (`lib/rate-limit.ts`), returning 429 with `Retry-After`; it uses a sliding per-IP window in memory and switches to a shared Upstash Redis window when `UPSTASH_REDIS_REST_*` is configured.
- Security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, production `Strict-Transport-Security`) are applied to every response via `next.config.ts`.
- A daily emailed full-database backup (EJSON/gzip, optionally age-encrypted) plus an optional encrypted object-store archive pipeline are implemented and audited through the `BackupRun` collection (see `BACKUP_AND_RECOVERY.md`).
- Server secrets are read from non-public environment variables; the application does not use `dangerouslySetInnerHTML` for user/API content.
- The production build and lint command complete at the recorded baseline (with warnings).

## 3. Prioritized findings

Severity reflects likely confidentiality/integrity/availability impact for this application. A lower score may increase when the clinic handles real medical records or identity documents.

### P0 — block unapproved production expansion of sensitive data

#### SEC-001 — Clinical staff authorization is binary administrator access

**Status (2026-09-25):** **Partial** — a `doctor` role now exists (`UserRole` enum), `clinicalGuard()`/`adminGuard()` split clinical from administrative API access, the dashboard renders a doctor persona (clinical tabs only), and role administration is live (`app/api/admin/roles`). Care-relationship scope, clinician attribution on writes, MFA, and audit remain **open**.

**Evidence:** `lib/models/User.ts` supports `admin | doctor | user`; `lib/admin-guard.ts` exposes `adminGuard()`/`clinicalGuard()`; `lib/auth-server.ts` exposes `isAdmin()`/`isStaff()`/`isDoctor()`; no `Doctor.userId` or `CareRelationship` model exists.

**Impact:** A doctor given administrator access can access all patients, orders, users, messages, content, subscriber data, and administrative mutations. There is no way to prove that a clinician viewed or changed a record only for an assigned patient.

**Required remediation:**

- Add persisted roles/capabilities with migration from `user` to `patient` semantics.
- Link doctor accounts to a `Doctor` profile.
- Add explicit care relationships/assignment scope.
- Enforce role and care scope in a server-only DAL on every clinical read/write.
- Record clinician identity and timestamps on clinical writes.
- Add MFA, offboarding, break-glass, and access reviews.

**Verification:** Automated negative tests for cross-patient doctor access and cross-capability staff actions.

#### SEC-002 — Identity/clinical media uses ordinary Cloudinary upload URLs

**Evidence:** ID upload returns/stores `secure_url`; generic, avatar, ID, and glucose/media uploads do not set `type: "authenticated"` or a private access mode. Medical-record attachments are accepted as arbitrary HTTP(S) URLs.

**Impact:** A URL leak, guessed public ID, copied browser payload, log, support screenshot, or misconfigured Cloudinary account can expose identity documents, meter images, or clinical attachments. The database does not consistently retain public ID/version/deletion metadata.

**Required remediation:**

- Store asset public ID, resource/version ID, owner/type, checksum/metadata, timestamps, and retention state.
- Use authenticated/private resources and an authorization-checking signed-delivery endpoint with short expiry.
- Migrate existing sensitive assets; do not assume old `secure_url` values are private.
- Restrict attachment sources or upload every clinical file through the controlled media service.
- Add upload size limits, verified MIME/signature checks, malware scanning/quarantine, and safe transformations.
- Prevent arbitrary Cloudinary URL/public-ID injection in profile and clinical write payloads.
- Ensure deletion removes/expires all versions and derived transformations according to an approved retention workflow.

**Verification:** Unauthenticated fetch of known asset URLs must fail; authorized delivery must be short-lived; cross-user delivery must fail; deletion/retention behavior must be tested.

#### SEC-003 — No immutable audit trail for sensitive access and changes

**Evidence:** No audit/event model or write-audit helper exists. Clinical reads, record deletion, exports, identity-document access, role changes, and backup operations are not recorded.

**Impact:** Unauthorized access, incorrect treatment changes, missing attribution, and disputes cannot be reliably investigated. Free-text `doctorName` is not reliable actor identity.

**Required remediation:** Add append-only security/clinical audit events with actor, patient/care subject, action, resource type/ID, timestamp, outcome, purpose/care relationship, request/correlation ID, and changed-field metadata. Do not copy full clinical bodies or secrets into logs. Restrict audit access and define retention/legal hold.

#### SEC-004 — No distributed rate limiting or abuse controls

**Status (2026-09-25):** **Partial** — first-party server-only limiter implemented (`lib/rate-limit.ts`) on 17 routes (login, register, verify-email, resend-verification, forgot-password, reset-password, change-password, avatar, ID-card, contact, newsletter, newsletter/unsubscribe, testimonials, orders, orders/track, generic upload, video proxy). Sliding-window per client key, in-memory by default, shared via Upstash Redis REST when `UPSTASH_REDIS_REST_*` is configured; 429 with `Retry-After` returned. A managed Redis-backed limiter, CAPTCHA step-up for high-risk public forms, and an emergency deny switch remain recommended.

**Evidence:** `lib/rate-limit.ts`; `app/api/**/route.ts` rate-limit call sites; `next.config.ts` security headers.

**Impact:** Credential stuffing, reset-token/email abuse, upload cost exhaustion, spam, order pollution, translation quota abuse, and video-proxy bandwidth abuse are possible.

**Required remediation:** Add a shared serverless-compatible rate limiter (for example, a managed Redis/KV-backed service) with route-specific key/limit policies, trusted-proxy handling, generic responses, monitoring, and an emergency deny switch. Add CAPTCHA or equivalent step-up controls for high-risk public forms only after privacy/access review.

Priority routes: login, register, verify, resend, forgot/reset/change password, ID/avatar/generic upload, contact, newsletter/unsubscribe, testimonials, orders/track, translate, fan-out, and video proxy.

#### SEC-005 — Client controls order item, price, and shipping fee

**Evidence:** `app/api/orders/route.ts` maps client `CartItem` objects and calculates `subtotal` from submitted `price`; it accepts a client `fee`.

**Impact:** A modified request can create false prices, invalid product/quantity combinations, or incorrect totals. Orders are not a trustworthy payment record.

**Required remediation:** Accept product IDs/quantity only, reload active products and approved shipping rules server-side, calculate all totals server-side, validate integer quantity/stock, use an idempotency key, and integrate a verified payment provider/webhook when online payment is offered. Keep item snapshots for historical integrity.

#### SEC-006 — No committed encrypted independent backup/restore control

**Status (2026-09-25):** **Partial** — implemented: daily emailed EJSON backup (`lib/backup/email-export.ts`, idempotent per day, size cap, optional age encryption), optional encrypted object-store archive pipeline (`lib/backup/orchestrator.ts`, S3/KMS + Cloudinary originals + manifest/checksums, lease queue), manual triggers (dashboard `POST /api/admin/backups`, CLI `npm run backup`), cron route (`GET /api/cron/backups`, `CRON_SECRET`), and `BackupRun`/`BackupLease` audit collections. **Open:** restore drills and recovery evidence, retention-expiry jobs, and alert routing beyond email.

**Evidence:** `lib/backup/*`, `scripts/backup.ts`, `app/api/admin/backups`, `app/api/cron/backups`, `vercel.json`, models `BackupRun`/`BackupLease`. See `BACKUP_AND_RECOVERY.md`.

**Impact:** Accidental deletion, account error, provider incident, ransomware, or bad migration could destroy MongoDB and leave media unrecoverable. Email alone is not an adequate archive.

**Required remediation:** Implement the approved design in `BACKUP_AND_RECOVERY.md`: standards-based authenticated encryption, all MongoDB collections, Cloudinary inventory and required asset copies, checksums/manifests, independent destination, least-privilege service identity, retention/deletion, `ADMIN_EMAIL` alerts, and scheduled restore drills.

### P1 — required before a formal security/privacy assessment

#### SEC-007 — Custom authentication lacks MFA, anomaly controls, and security telemetry

- Add MFA for administrators and clinical users first; consider mandatory for all remote patients after usability/risk review.
- Add breached-password screening where a suitable privacy-reviewed service is approved.
- Add login rate limits and progressive delays without account-existence disclosure.
- Alert on repeated reset, MFA, role, session, and clinical-access anomalies.
- Provide users a session list and global logout/revocation.
- Review password policy, scrypt parameters, token expiry, session renewal, and concurrent-session policy.
- Do not send security emails with patient/clinical details.

#### SEC-008 — Session cookie permits a non-Secure path based on request detection

**Evidence:** `lib/auth-server.ts` conditionally sets `Secure` when the request appears HTTPS and documents plain-HTTP phone/tunnel use.

**Risk:** In production, state-changing authenticated requests may be accepted over plain HTTP and the session cookie is not protected in transit.

**Remediation:** Require HTTPS at the edge, redirect/block HTTP, set `Secure` unconditionally for production session cookies, enable HSTS after all production hosts are HTTPS-only, and ensure trusted forwarded-protocol handling. Use separate local-development cookie settings.

#### SEC-009 — No security response headers/CSP

**Status (2026-09-25):** **Partial** — global headers shipped via `next.config.ts`: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera/geolocation/microphone/payment/usb blocked), and production-only `Strict-Transport-Security`. A Content Security Policy remains outstanding; deploy report-only first.

**Evidence:** `next.config.ts` securityHeaders array.

**Remediation:** Inventory required origins (self, Cloudinary, Unsplash, YouTube/Vimeo/Drive, SMTP is server-only), then deploy a report-only CSP followed by enforcement. Confirm HSTS is active in the production response and that HTTP redirects to HTTPS are in place.

#### SEC-010 — Clinical and identity deletion lacks a governed retention/legal-hold process

**Evidence:** Admin routes can delete records, prescriptions, follow-ups, treatment plans, reminders, and related content. No retention schedule, reason code, legal hold, or deletion tombstone exists.

**Remediation:** Define approved retention by record class and jurisdiction; implement restriction/amendment/expiry workflows; require authorization and reason for sensitive deletion; retain an audit event; propagate expiry/deletion to derived media and backups according to policy. Do not promise immediate backup deletion if backup expiry legally/technically differs; explain the limitation and restrict inactive backup access.

#### SEC-011 — Patient and family-member rights workflows are missing

**Status (2026-09-25):** **Partial** — `/privacy`, `/terms`, and `/cookies` now document rights, response windows (30 days), lawful bases, controller contact, retention, transfers, and Cameroon law (2024/017, 2010/012) + GDPR where applicable. No self-service export, correction, restriction, objection, consent withdrawal, or deletion/retention workflow is implemented — rights are exercised manually via email until the workflow is built. Build a rights-request workflow that verifies identity, records scope, searches all data sources including media and processors, and records completion/denial. Counsel and the clinic must define which clinical/transaction records must be preserved and how users are informed.

#### SEC-012 — Profile and clinical payloads accept arbitrary external media URLs

`/api/auth/profile` accepts URL-shaped avatar/ID fields, and medical-record forms accept attachment URLs. An attacker can store an external tracking pixel or request S19 users to fetch an attacker-controlled resource.

**Remediation:** Client payloads should contain opaque asset IDs only. The server resolves an authorized owned asset. Allowlist external URLs only for non-sensitive published content, with safe schemes, host controls, and no credentials/query leakage.

#### SEC-013 — Upload validation trusts browser MIME metadata and buffers whole files

ID/avatar/generic upload routes use `File.type` and read the full file into memory. Generic admin upload has no explicit size/MIME policy. MIME can be spoofed and concurrent large uploads can pressure server memory.

**Remediation:** Enforce byte limits before buffering, allowlist content for the route, inspect magic bytes/server metadata, use bounded streaming, reject archives/executables where inappropriate, and scan sensitive uploads. Generic marketing uploads still need abuse limits and image validation.

#### SEC-014 — No idempotency/atomicity controls for sensitive and transactional actions

Booking, checkout, uploads, and several writes can be duplicated by retries/double-clicks. Appointment availability is checked before write, which is vulnerable to concurrent slot allocation.

**Remediation:** Use idempotency keys for checkout and key clinical submissions, unique appointment-slot constraints/transactions where possible, and state-machine validation. Return the existing result for a safe retry.

#### SEC-015 — Error/observability practices can leak operational details

Handlers generally avoid stack responses, which is good, but raw error values may reach logs. There is no central redaction policy or security event monitor.

**Remediation:** Use structured logging with allowlisted fields and redaction of cookies, tokens, passwords, request bodies, medical values, email/phone/ID, media signed URLs, and Cloudinary identifiers unless specifically approved. Monitor 401/403 spikes, authorization failures, unusual exports, repeated uploads, and admin actions.

#### SEC-016 — Testimonials and marketing subscriptions lack consent evidence/double opt-in

**Impact:** Public health stories and email processing may be used without demonstrable, current publication/marketing consent or a simple withdrawal record.

**Remediation:** Record consent text/version, timestamp, source, publication scope, withdrawal, and administrator action. Separate healthcare publicity consent from marketing email consent. Use verified double opt-in and suppression for newsletters. Moderate stories for identifiable health information and claims.

#### SEC-017 — Public forms accept unbounded data and have weak abuse resistance

Contact, newsletter, testimonial, order, and translation routes apply incomplete length/consistency checks. Contact can return success even if MongoDB persistence fails and email is best-effort, which may create false confidence.

**Remediation:** Use central schema validation with maximum lengths/formats, reject unexpected fields where practical, enforce body/form size limits, rate limit, add bot controls appropriately, and track durable outcome (saved/email failed) in safe operational metrics.

#### SEC-018 — Email security and deliverability are not documented

SMTP supports plain submission on the usual port and does not show DKIM/SPF/DMARC verification, bounce handling, suppression, or delivery monitoring.

**Remediation:** Verify domain SPF/DKIM/DMARC, use TLS, separate transactional/notification identities, minimize sensitive content, process bounces/complaints, protect admin-mailbox access, and ensure every commercial message has required sender/unsubscribe information.

### P2 — hardening and assurance

#### SEC-019 — No automated tests

No `*.test.*` or `*.spec.*` files were found. The repository has scripts, but no committed unit/integration/E2E authorization suite.

Prioritize authentication, ownership/IDOR, care scope, role permissions, validation, booking races, order totals, private media, rights workflows, and backup/restore. Add dependency/security scanning and secret scanning to CI.

#### SEC-020 — Dependency/supply-chain controls are not committed

Package versions use carets. No committed Dependabot/Renovate policy, SBOM, lockfile verification procedure, or automated dependency audit was found.

**Remediation:** Commit/use the lockfile, pin CI actions, enable automated updates with review, generate an SBOM, run `npm audit` plus suitable code/dependency analysis, and review Cloudinary/Nodemailer/Next.js advisories continuously.

#### SEC-021 — Content rendering and third-party embeds need a controlled trust model

Blog content uses a custom Markdown-like renderer rather than raw HTML, which reduces stored-XSS risk. However, externally configurable video embeds and image/link URLs expand the third-party origin and privacy surface.

**Remediation:** Validate allowed providers/schemes, sandbox embeds, set a restrictive CSP, add consent/privacy disclosure before non-essential third-party media, and prohibit patient/clinical material in external embeds.

#### SEC-022 — Raw image elements and remote media reduce defense/performance consistency

Multiple raw `<img>` elements are used, including account-facing images. They can increase data transfer and create inconsistent dimensions/loading behavior.

**Remediation:** Replace with `next/image` where practical, always set dimensions/aspect ratio, lazy-load below-the-fold content, and ensure private Cloudinary assets are not fetched through a caching public optimization path without authorization-aware design.

## 4. Data inventory and minimum controls

| Data set | Current location | Primary risk | Required control direction |
| --- | --- | --- | --- |
| Credentials/session/reset data | `User`, `Session`, `ResetToken`; `s19_session` cookie | Account takeover/session theft | Strong hashing, rate limits, MFA for staff, HTTPS-only secure cookie, revocation, audit/monitoring. |
| Patient identity/emergency/family data | `User` | Identity/profile harm | Minimize fields, purpose/notice, access scope, export/correction, retention. |
| ID documents | Cloudinary + URL fields on `User` | Irreversible identity theft | Private authenticated media, short signed access, access audit, strict retention/deletion. |
| Appointments/meeting URLs | `Appointment` | Health/contact and unauthorized meeting access | Care scope, private links, expiry, no sensitive URL logging, cancellation/retention. |
| Records/prescriptions/plans/follow-ups/reminders | Clinical MongoDB collections + media | Severe health-data harm | Doctor attribution/care scope, immutable audit, encryption/transit/storage, backup, retention, rights workflow. |
| Glucose data/photos | `GlucoseReading` + Cloudinary | Health-data exposure | Strict size/type/scan, private media, access audit, clinically governed retention. |
| Messages | `Message` + SMTP | Sensitive disclosure/phishing | Role scope, no health details in email, audit, retention, staff training. |
| Orders/customer/shipping/payment reference | `Order` | Financial/privacy fraud | Server totals, verified payments, restricted role, PCI/payment-provider review. |
| Testimonials/video URLs | `Testimonial`, `VideoReview`, Google Drive/YouTube/Vimeo | Consent/re-identification/reputation | Consent record, moderation/anonymization, provider rights, withdrawal/removal. |
| Newsletter | `Subscriber` + SMTP | Spam/privacy | Double opt-in, consent record, suppression, unsubscribe, vendor review. |
| Backups | Admin mailbox (email snapshot) + S3-compatible object store (archive pipeline) | Broad concentrated breach | End-to-end age encryption, independent credentials, least privilege, short operational retention, restore tests, `ADMIN_EMAIL`/`BACKUP_ALERT_EMAILS` alerts. |

## 5. Browser storage and third-party inventory baseline

### First-party cookies

| Cookie | Purpose | Current properties | Required review |
| --- | --- | --- | --- |
| `s19_session` | Authentication session. | HTTP-only, `SameSite=Lax`, path `/`, 30 days, conditionally `Secure`. | Essential; make production HTTPS-only/`Secure`; document necessity/lifetime; consider shorter idle timeout. |
| `s19_locale` | English/French preference (`COOKIE_NAME` in `lib/i18n.ts`). | First-party; path `/`; not HTTP-only. | Functional for requested-language UX; no analytics data; disclosed in the cookie policy. |

### Browser local storage

| Key | Contents | Current assessment |
| --- | --- | --- |
| `s19-cart` | Product slug, displayed name, displayed price, quantity, image. | Functional/e-commerce data, not required for core site operation. It is readable by scripts on the origin. Do not place health/identity data in it. Clear on logout if not needed for cart continuity. |

No `sessionStorage` use was found. No analytics/measurement script was found in the repository. Public testimonial video iframes/HTML video can still disclose the visitor's IP, browser information, cookies where applicable, and viewing event to the selected provider; this is third-party disclosure, not a first-party cookie.

### Third parties

| Provider | Data sent | Current purpose/control |
| --- | --- | --- |
| MongoDB hosting | Application records including sensitive data | Primary database; provider/region/security/backup terms must be verified. |
| Cloudinary | Uploaded files/metadata, including ID/clinical media | No consistently private authenticated delivery; highest-priority remediation. |
| SMTP provider | Recipient and rendered transactional/notification content | Content must be minimized; delivery/security configuration undocumented. |
| MyMemory | Admin-supplied translation text | Must be limited to approved non-clinical/non-personal copy and disclosed/assessed. |
| Google Drive | Video ID and visitor IP/range request | Public testimonial media proxy; should not hold private patient/clinical video. |
| YouTube/Vimeo | Page visit, IP/cookies depending embed behavior | Public testimonial embeds; provider/privacy and consent review required. |
| Unsplash | Image request IP/referrer/device metadata | Public remote images; self-host approved assets if privacy/availability requires it. |

A final production inventory must be repeated after tag managers, analytics, chat widgets, payment providers, consent tools, fonts, and future integrations are added.

## 6. Authorization test plan

Every protected route should have positive and negative automated tests. Minimum cases:

1. Signed out → 401/no data.
2. Patient A → own resource succeeds.
3. Patient A → Patient B resource by valid ID returns 404/403 and no data.
4. Patient A → guessed child/reminder/thread/message/plan of B is denied.
5. Doctor → assigned patient succeeds only for allowed capability.
6. Doctor → unassigned patient is denied and audited.
7. Clinic staff → content action allowed, role/clinical action denied.
8. Doctor/clinic staff → user administration, fan-out, backup operations denied.
9. Administrator → permitted action succeeds; highly privileged backup/role action requires stronger capability/MFA.
10. Deactivated doctor/clinician cannot use an existing session.
11. ObjectId injection, duplicate JSON keys, prototype-pollution keys, oversized strings, invalid dates, and unexpected fields are rejected.
12. Cross-origin state-changing requests without the expected origin/token behavior are rejected; cookies remain `SameSite` protected.
13. Private media request without auth/short signature fails; another user's signature fails after expiry.
14. Rights/export/retention action is attributable, authorized, idempotent, and produces a receipt/audit event.

## 7. Secure development and release checklist

### Pull request

- Validate changes against threat/data-flow model.
- Do not add sensitive fields/URLs to logs, analytics, fixtures, or screenshots.
- Add/adjust tests for authorization, validation, and error paths.
- Verify `npm run lint` and relevant type/build/tests.
- Review migrations for indexes, backfill, rollback, and least privilege.

### Production release

- Deploy from reviewed commit; no direct production database edits without change record.
- Confirm environment secrets and production HTTPS/CSP configuration.
- Confirm Cloudinary private delivery and restricted upload roles.
- Run synthetic smoke/authorization/backup verification after release.
- Monitor 5xx, latency, authorization denials, email failure, media access, and queue/backups.
- Have a rollback and incident runbook.

### Quarterly

- Review user/doctor/staff/service accounts and cloud credentials.
- Review active sessions and service/API keys.
- Sample access/audit logs and media ACLs.
- Test a sample restore into an isolated environment.
- Review dependencies, policies, vendor terms, retention, and legal/privacy register.

## 8. Verification evidence to retain

Do not close a finding based on a code change alone. Retain:

- Automated test run tied to the deployed commit.
- Negative cross-user/role/care-scope test result.
- Cloudinary delivery and deletion evidence.
- Header/CSP report showing production behavior.
- Database migration/index verification.
- Restore checksum/log and recovery time/objective result.
- Staff access review and terminated-account offboarding record.
- Approved retention/legal decision with date and approver.
- Counsel/authority correspondence for legal-policy sign-off.

## 9. Known limitations of this review

- No live penetration test or authenticated role test was performed in this phase.
- Third-party dashboards, MongoDB/Cloudinary/SMTP settings, DNS, deployed headers, production logs, and cloud IAM were not directly inspected.
- Current source may change after this baseline; re-run route/model/dependency inventories before each release.
- Static review cannot establish the clinic's actual controller/processor roles, licenses, informed-consent process, record-retention duties, medical-negligence controls, or cross-border transfer compliance.
- Code changes reduce risk but do not eliminate medical, privacy, consumer, advertising, professional, or other legal liability.
