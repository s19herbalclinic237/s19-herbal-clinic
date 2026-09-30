# Architecture and stack

## 1. System summary

S19 is a bilingual (English/French), responsive web application that combines:

1. A public marketing and ecommerce website.
2. A public booking/contact funnel.
3. A health-library content experience.
4. A patient account and treatment portal.
5. A clinic administrator dashboard.
6. Route-handler-based business APIs backed by MongoDB.
7. Cloudinary media storage, SMTP notifications, and an optional machine-translation integration.

The current codebase is a monolithic Next.js App Router application. Business logic is concentrated in Client Components and `app/api/**/route.ts` handlers rather than a dedicated service layer.

## 2. Technology stack

| Layer | Current technology | Purpose |
| --- | --- | --- |
| Web framework | Next.js 16.3.x, App Router | Pages, route handlers, metadata, image optimization, build/runtime tooling. |
| UI runtime | React 19 | Server and client components. |
| Language | TypeScript | Application and model typing. |
| Styling | Tailwind CSS v4 | Utility styling and design tokens in `app/globals.css`. |
| Animation | Framer Motion / Motion | Dashboard transitions, reveals, and interactive motion. |
| Icons | `react-icons` / Font Awesome 6 SVG icons | Consistent iconography; no emoji icons. |
| Database | MongoDB with Mongoose 9 | All persistent application collections. Connection URI: `MONGO_URL` or `MONGODB_URI`. |
| Authentication | Custom email/password authentication | Scrypt password hashing, opaque database sessions, HTTP-only cookie. |
| File/media storage | Cloudinary | Product/blog images, avatars, identity-document uploads, glucose photos, and clinical attachments. |
| Email | Nodemailer over SMTP | Order, appointment, clinical, testimonial, and administrative notifications. |
| Translation helper | MyMemory API | Optional English/French machine translation for testimonial administration. |
| Local browser state | `localStorage` | Guest cart and language preference. |
| Build | Next.js/Turbopack | Production build; currently succeeds in the repository baseline. |

## 3. Repository structure

```text
app/
  account/                 Authentication and full-screen portal routes
  api/                     Next.js route handlers grouped by domain
  blog/                    Blog index and dynamic post pages
  shop/                    Catalog index and product pages
  [public pages]/          Marketing, checkout, tracking, and legal pages
components/
  account/                 Patient portal tabs and dashboard shell
  admin/                   Clinic administrator tabs
  auth/                    Login, registration, verification, password reset
  blog/ health-library/    Content experiences
  cart/ checkout/ sections/ storefront and conversion UI
  i18n/ layout/ shop/ ui/ shared application UI
lib/
  models/                  Mongoose schemas and domain types
  data/                    Bundled fallback products, posts, health content, programs
  auth*.ts admin-guard.ts  Authentication/session and current authorization helpers
  rate-limit.ts            First-party server-only rate limiter (memory + optional Upstash Redis)
  backup/                  Backup engines: config, queue/leases, email export, object-store archive
  cart-context.tsx         Guest and authenticated cart state
  cloudinary.ts db.ts      External service adapters
  email.ts notify.ts       Notification adapters
  i18n*.ts site.ts seo.ts  Localization, clinic identity, and SEO
scripts/                    Seed, administration, backup, and smoke-test scripts
docs/                       Technical, operational, legal, and recovery documentation
public/                     Static brand and SEO assets
```

## 4. Runtime topology

```text
Browser
  │
  │ HTTPS
  ▼
Next.js application
  ├─ Public App Router pages
  ├─ /account patient/admin/doctor application
  └─ /api route handlers
       ├─ Mongoose ─────────► MongoDB deployment
       ├─ Cloudinary SDK ───► Cloudinary media API/CDN
       ├─ Nodemailer ────────► SMTP provider
       ├─ MyMemory fetch ───► MyMemory translation API
       ├─ fetch proxy ──────► Google Drive public video source
       ├─ Rate limiter ─────► Shared in-memory window (+ Upstash Redis when configured)
       └─ Backup engines ───► SMTP attachment (age-encrypted) and/or S3-compatible object store
```

A `vercel.json` cron configuration is committed and schedules `GET /api/cron/backups` daily at 05:30 UTC. The endpoint requires a bearer `CRON_SECRET`; see `LOGGING_AND_MONITORING.md` for the verification command. **This project is on Vercel's Hobby plan, which only accepts cron expressions that run once per day or less and will fail the deployment otherwise, and which fires within an hour of the requested time rather than to the minute.** Anything that needs a tighter interval than daily must not be added as a cron here. Confirm the hosting provider's cron limits and outbound network/function limits before enabling the optional object-store archive pipeline or large media transfers.

## 5. Rendering and client/server boundaries

- Most `app/**/page.tsx` files are Server Components unless they delegate rendering to a `use client` component.
- The account screen, cart, checkout, dashboard, filters, forms, and many content explorers are Client Components.
- Route handlers are the backend-for-frontend and perform authentication, database access, validation, email, and Cloudinary work.
- Secrets are expected to remain server-side. Variables prefixed with `NEXT_PUBLIC_` are intentionally public.
- `lib/auth-server.ts` and `lib/i18n-server.ts` are marked `server-only`.

### Important rendering characteristic

`app/layout.tsx` calls `getServerLocale()`, which calls `cookies()`. This intentionally makes locale request-aware, but it also opts pages using the root layout into dynamic request-time rendering unless Next.js can still optimize portions of the tree. The current build lists nearly all application pages as dynamic (`ƒ`). This can increase latency and hosting cost compared with a static public catalog/content site.

A future optimization can move the public and account shells into route groups and obtain locale without making the public static tree request-dependent, but it must be tested for hydration, language switching, metadata, and caching behavior.

## 6. Data architecture

### Connection management

`lib/db.ts` caches the Mongoose connection and in-flight promise on `globalThis` to avoid repeated connections during development and warm server runtime. A missing URI returns `null`; affected routes return a service-unavailable response. Some catalog pages intentionally fall back to bundled data so the marketing/storefront remains viewable without MongoDB.

### Current MongoDB collections

| Collection/model | Data held | Sensitivity |
| --- | --- | --- |
| `Appointment` | Patient, doctor, schedule, visit mode, status, concern, notes, meeting URL. | Health/contact data. |
| `BlogPost` | English/French editorial content and publication state. | Public once published. |
| `Cart` | One server-side cart per signed-in user. | User-linked. |
| `Category` | Catalog taxonomy. | Public. |
| `Doctor` | Public practitioner profile and weekly availability. | Public profile plus future professional data. |
| `GlucoseReading` | Patient, treatment plan, reading, meal notes, optional meter photo. | Health data. |
| `Inquiry` | Booking/contact/order inquiry and status. | Contact and potential health data. |
| `MedicalRecord` | Visit, diagnosis, lab, scan, note, diagnosis, results, attachments. | Highly sensitive health data. |
| `Message` | Clinic/patient conversation and read state. | Potentially sensitive. |
| `Order` | Customer, shipping, payment method/reference, item snapshots, status. | Contact and transaction data. |
| `Prescription` | Medication, dosage, frequency, instructions, status. | Health data. |
| `Product` | Catalog content, price, inventory, locale variants. | Public/operational. |
| `ResetToken` | Hashed, expiring password-reset token. | Authentication secret. |
| `Session` | Hashed, expiring session token. | Authentication secret. |
| `Subscriber` | Marketing email and subscription status. | Contact data. |
| `Testimonial` | Story, optional email/video, moderation status, translations. | Contact/consent data. |
| `TreatmentFollowUp` | Append-only clinical progress, symptoms, vitals, labs, notes. | Highly sensitive health data. |
| `TreatmentPlan` | Treatment period, monitoring rules, status, completion review. | Highly sensitive health data. |
| `TreatmentReminder` | Payment/refill/appointment/lab/monitoring/custom tasks. | Health/financial-plan data. |
| `User` | Identity, password hash, role (`user`/`doctor`/`admin`), profile, emergency contact, family profiles, ID-document fields. | Identity/authentication and health-adjacent data. |
| `VideoReview` | YouTube/Drive URL and activation state. | Public content. |
| `BackupRun` | One row per backup attempt: trigger, state machine, counts, hashes, lease/notification status, error codes. | Operational audit trail; contains no patient documents. |
| `BackupLease` | Global worker lease (owner, expiry, current run) preventing concurrent archive workers. | Operational only. |

### Relationship summary

- `User` is the current account root for patient data.
- `Appointment` references both `User` and `Doctor`.
- Clinical collections reference `User`; treatment follow-ups/reminders/glucose readings also reference `TreatmentPlan`.
- Orders optionally reference a signed-in `User`, but guest checkout is supported.
- `Doctor` is currently a public scheduling profile and is **not linked to an authentication account**.
- Clinical records and prescriptions store a free-text `doctorName`, not a reliable clinician identity.

## 7. Authentication and session flow

1. Passwords are hashed with Node `scrypt` and a per-password random salt.
2. Registration creates a `User` and stores a hashed email-verification token.
3. Successful login/verification creates a random opaque token.
4. Only a SHA-256 token hash is stored in `Session`.
5. The raw token is placed in the HTTP-only `s19_session` cookie with `SameSite=Lax` and a 30-day maximum age.
6. Each protected API handler resolves the cookie to a session and then the current `User`.
7. Admin handlers call `adminGuard()`; patient handlers resolve the current user and scope queries to that user ID.
8. Password reset and email-verification tokens are separately hashed and expiring.

### Current boundaries

- Stored roles are `user`, `doctor`, and `admin`.
- Authorization: `adminGuard()` (admin only) vs. `clinicalGuard()` (admin or doctor) vs. own-account scoping for patients. See `ROLES_AND_PERMISSIONS.md`.
- There is no central permission matrix or audit log; care-relationship scoping for doctors is not yet implemented.
- Custom authentication increases the need for careful review of password policy, enumeration resistance, rate limiting, MFA, session revocation, and recovery procedures.
- Rate limiting: 17 public/authentication/abuse-prone routes use the first-party server-only limiter (`lib/rate-limit.ts`), in-memory by default and shared via Upstash Redis REST when `UPSTASH_REDIS_REST_*` variables are present.
- Security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, production HSTS) are applied to every response via `next.config.ts`; a Content Security Policy is still absent.
- The session cookie is marked `Secure` only when the request is detected as HTTPS. Production policy should require HTTPS and avoid supporting a public production session over plain HTTP.

## 8. Storefront and cart flow

- Guest cart state is stored under `s19-cart` in browser `localStorage`.
- After login, the client loads the server-side `Cart`.
- Cart changes are debounced and synchronized to `/api/cart` for authenticated users.
- Checkout sends item snapshots and customer/shipping/payment selection to `/api/orders`.
- The server validates a limited set of fields, creates a unique order reference, and sends best-effort customer/admin emails.
- Catalog product prices and availability must be revalidated server-side before payment; the current order route is an order-intake workflow, not a verified payment gateway.

## 9. Clinical/treatment flow

1. Patient books an appointment against a doctor's schedule.
2. Clinic staff confirm/complete/cancel the appointment and may store notes/meeting URL.
3. Clinic staff create medical records and prescriptions.
4. Clinic staff create a treatment plan and optional glucose-monitoring rules.
5. Patient submits readings, follow-up symptoms, and marks reminders complete.
6. Staff add follow-ups/reminders, review alerts, and close the plan with a final clinical review.

The `user` account value represents a patient; `doctor` is a clinical-staff login role whose API surface is limited to clinical workflows, and `admin` retains full access. A Doctor account is **not yet linked** to a `Doctor` profile, and every clinical query/write still needs an explicit care-relationship scope plus authenticated clinician attribution.

## 10. Media architecture

### Public/admin marketing media

- Product and blog uploads use `/api/upload` and store Cloudinary URLs in MongoDB.
- Cloudinary and Unsplash are the only configured Next Image remote hosts.

### Patient and clinical media

- Avatars, ID documents, glucose photos, and record attachments use Cloudinary URLs.
- Existing uploads do not consistently store public IDs or enforce authenticated/private delivery.
- Legacy ID fields include `idCardUrl`, `idCardFrontUrl`, and `idCardBackUrl`.
- Some attachments expose a raw URL directly in the UI.
- Orphan cleanup, signed delivery, private access checks, malware scanning, retention, and backup copies are not yet comprehensive.

Private media must move to a public-ID-plus-authorized-delivery model. A stored URL should not be treated as an access-control mechanism.

## 11. External integrations

### SMTP

`lib/email.ts` sends transactional and best-effort notifications through Nodemailer. A failure is logged and generally does not fail the originating business transaction. This preserves user experience but requires operational monitoring because a successful API response does not prove email delivery.

### Cloudinary

The SDK loads credentials from `CLOUDINARY_URL` or individual Cloudinary variables. The application uses uploads for account/clinical/admin content. The environment must not use a shared public delivery policy for sensitive assets.

### Translation

Admin testimonial translation calls MyMemory. Testimonial text is sent to a third party. Clinical data must never be submitted to that route. Review the provider's terms, retention, and transfer implications before using any external translation service on non-public copy.

### Video proxy

`/api/video-stream/[fileId]` proxies a Google Drive public-download URL to work around browser `Content-Disposition` behavior. It is public and validates only a Drive-ID-shaped string. If a Drive file is changed to private, the proxy is expected to return unavailable. Review this route before relying on it for restricted patient content.

## 12. Deployment assumptions and required environment

| Variable | Required for | Notes |
| --- | --- | --- |
| `MONGO_URL` or `MONGODB_URI` | Persistent dynamic features | No URI enables limited fallback behavior only. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Email | SMTP provider must allow production sending. |
| `SMTP_FROM` | Email | Use a verified sender/domain. |
| `ADMIN_EMAIL` | Administrative notifications and planned backup alerts | Keep separate from the public contact address. |
| `CLOUDINARY_URL` or cloud name/key/secret | Uploads | Use private/authenticated delivery for sensitive assets. |
| `CLOUDINARY_FOLDER` | Upload organization | Avoid shared test/production folders. |
| `NEXT_PUBLIC_SITE_URL` | Metadata, canonical URLs, email links | Public and must match the production origin. |
| `MYMEMORY_EMAIL` | Optional quota increase | Only for non-sensitive translation content. |
| `BACKUP_EMAIL_MAX_BYTES` | Email backup size cap | Default 25 MB; override for larger databases. |
| `BACKUP_AGE_RECIPIENTS` | Email-backup attachment encryption | Comma-separated `age1…` public keys; enables age-encrypted attachment. |
| `BACKUP_ALERT_EMAILS` | Backup alerts | Comma-separated; `ADMIN_EMAIL` is always added automatically. |
| `CRON_SECRET` | `GET /api/cron/backups` | Required as `Authorization: Bearer` outside development. |
| `BACKUP_S3_*` (bucket, region, endpoint, keys, `BACKUP_S3_KMS_KEY_ID`, `BACKUP_S3_FORCE_PATH_STYLE`) | Optional object-store archive | Enables the encrypted archive pipeline when all set. |
| `BACKUP_RETENTION_DAYS` | Archive lifecycle | Default 35; bucket lifecycle owns deletion. |
| `BACKUP_CLOUDINARY_*` / `BACKUP_CLOUDINARY_URL` | Archive originals export | Defaults to `CLOUDINARY_FOLDER`/`CLOUDINARY_URL`. |
| `UPSTASH_REDIS_REST_*` | Shared rate limiting | Optional; when absent the limiter runs in-memory per instance. |

Never commit `.env.local`, provider credentials, encryption keys, or cron secrets. Backup encryption keys (age identities, S3 KMS) are custody items with their own procedures in `BACKUP_AND_RECOVERY.md`.

## 13. Architectural risks and recommended sequence

### P0 — before relying on the system for sensitive production data

1. ~~Least-privilege Doctor and clinic-staff roles~~ **Implemented** (`doctor` role, `clinicalGuard`, Dashboard persona; keep `user` as the patient role). Remaining work: care-relationship scope (§9) — see `ROLES_AND_PERMISSIONS.md`.
2. Link authenticated clinician accounts to `Doctor` profiles and store clinician identity on clinical writes. **Open** — current builds record free-text `doctorName`.
3. Centralize authorization and audit every clinical read/write, export, account change, and administrative mutation. **Partial** — role gates are centralized (`admin-guard.ts`); an immutable audit log is still absent.
4. Move identity/clinical media to private Cloudinary delivery with authorized signed access and a migration plan for existing public URLs. **Open**.
5. ~~Add private, encrypted, independently stored MongoDB and media backups with tested restore and deletion/retention policy~~ **Implemented** (daily emailed EJSON backup, optional age-encrypted S3 archive, `BackupRun` audit trail) — restore drills and retention enforcement remain to be evidenced.
6. ~~Add rate limiting to authentication, reset, contact, newsletter, order, translation, and upload routes~~ **Implemented** on 17 public/authentication/abuse-prone routes (`lib/rate-limit.ts`); a managed Redis-backed shared limiter remains recommended at production scale.
7. ~~Add a Content Security Policy and other browser security headers~~ **Partial** — `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, and production `Strict-Transport-Security` are set; a CSP (report-only first) is still outstanding.

### P1 — privacy, legal, and operational readiness

1. Add verified data export, correction, deletion/restriction workflows that preserve legally required records only where counsel approves.
2. Record consent/processing evidence and retention timestamps for optional marketing, testimonials, cookies, and sensitive processing.
3. Add administrator MFA, emergency access rules, session management, and offboarding procedures.
4. Add structured audit logs, alerting, error tracking, uptime monitoring, and backup-failure notifications.
5. Add data processing agreements/vendor register and controller identity/legal-contact configuration.

### P2 — reliability and performance

1. Introduce a server-only Data Access Layer returning minimal DTOs instead of raw Mongoose documents.
2. Add a schema-validation library and central request validators.
3. Add pagination, search, and projection to high-volume admin tables; current `.limit(300–500)` lists are not pagination.
4. Split the root locale-dependent layout so public content can be statically cached where safe.
5. Replace raw `<img>` usage with `next/image` where layout and remote delivery allow it.
6. Add automated unit, integration, authorization, accessibility, and end-to-end tests.
7. Add field performance telemetry only after privacy and consent requirements are approved.

## 14. Decision records to create

The team should record short architecture decision records (ADRs) for:

- Auth library versus continued custom auth.
- Doctor/care-relationship data model.
- Private media delivery and migration.
- Backup storage/provider, encryption-key custody, cadence, and retention.
- Public-page static rendering strategy.
- Payment provider and verified order/payment flow.
- Audit-log retention and legal hold.
- Data-controller identity and Cameroon regulatory applicability.
