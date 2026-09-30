# Features and API inventory

This document describes the features and route handlers present in the repository at the 25 September 2026 baseline. It is a software inventory, not a statement that every workflow satisfies medical, privacy, consumer, advertising, or other legal obligations.

## 1. Public website features

### Global experience

- English/French locale selection stored in a first-party `s19_locale` cookie (see `COOKIE_NAME` in `lib/i18n.ts`).
- Responsive public header, announcement bar, footer, WhatsApp action, and language control.
- Route-transition progress indicator.
- Search-engine metadata, canonical URL helpers, Open Graph/Twitter metadata, `robots.txt`, sitemap, and medical-clinic/website JSON-LD.
- MongoDB-backed content with bundled fallbacks for catalog, programs, and health/blog content where implemented.

### Pages

| Route | Feature |
| --- | --- |
| `/` | Home page, brand positioning, featured products/programs, calls to action, booking snippets, testimonials, health content, and video carousel. |
| `/about` | Clinic story, mission, approach, values, and contact-oriented calls to action. |
| `/programs` | Browse treatment/wellness programs and select a program for booking. |
| `/telehealth` | Telehealth positioning and consultation call to action. |
| `/health-library` | Searchable/filterable educational health-library experience. Educational content is not presented here as a substitute for diagnosis or emergency care. |
| `/blog` | Published blog index, search/filtering, and featured-post behavior. |
| `/blog/[slug]` | Dynamic bilingual article page and related content/share/CTA behavior. |
| `/live-reviews` | Curated live/video testimonial experience. |
| `/patient-stories` | Approved public patient stories and a submission form. |
| `/shop` | Product catalog, categories, search/filtering, product cards, and stock/price display. |
| `/shop/[slug]` | Product details, usage/ingredients/description, quantity, and add-to-cart action. |
| `/cart` | Guest/authenticated cart review and quantity/remove changes. |
| `/checkout` | Customer, delivery, and payment-method intake; creates an order and redirects to the order result. |
| `/order/[reference]` | Order status/confirmation view for the newly created order. |
| `/track` | Guest order lookup requiring order reference and matching customer email. |
| `/contact` | Contact and appointment/booking inquiry form with clinic/email/whatsapp links. |
| `/location` | Bafoussam address, hours, contact methods, and map/location presentation. |
| `/privacy` | Public privacy notice. Legal-content accuracy is tracked in the legal gap register. |
| `/terms` | Public terms of use/service. Legal-content accuracy is tracked in the legal gap register. |
| `/cookies` | Public cookie/local-storage notice. Must be reconciled with the implemented cookie/local-storage inventory. |
| `/refund-and-returns` | Public refund/return/exchange policy. Mandatory consumer rights and product-specific legal review remain required. |
| `/account` | Login/registration entry point and, when signed in, the full-screen patient/admin dashboard. |
| `/account/verify` | Email-verification result/action panel. |
| `/account/forgot-password` | Password-reset request form. |
| `/account/reset-password` | Password-reset completion form. |

## 2. Authentication and account features

- Email/password registration.
- Email-verification token workflow and resend.
- Login and logout with an opaque, expiring database session.
- Forgot-password and reset-password token workflow.
- Change password after re-authenticating with the current password.
- Session-aware profile refresh.
- Profile fields: name, phone, avatar, date of birth, gender, address, emergency contact, front/back identity-document URLs.
- Family-member profiles stored under the account owner.
- Guest cart merged/synchronized to a server-side cart after sign-in.
- The dashboard overview displays the account creation date in full date format rather than only the year.

### Current account roles

- `user`: patient/customer account (own-account portal only).
- `doctor`: clinical staff account. Clinical workflows only — no store, content, subscriber, user administration, roles, or backups.
- `admin`: full clinic administration — everything a doctor can do plus store/content/subscriber/user/role/backup administration.

Authorization: `adminGuard()` allows only `admin`; `clinicalGuard()` allows `admin` and `doctor`. Clinical API groups use `clinicalGuard`; administrative groups use `adminGuard`. See `ROLES_AND_PERMISSIONS.md` for the full matrix and outstanding care-scope work.

## 3. Patient portal features

### Overview

- Greeting and current date.
- Exact account join date.
- Counts and shortcuts for orders, messages, appointments, prescriptions/treatment, and stories.
- Recent activity/status presentation.

### Appointments

- List the signed-in patient's appointments.
- Select a practitioner and view open slots.
- Create an appointment for the account owner or a named family member.
- View appointment mode, concern, status, provider, date/time, and meeting link when present.
- Reschedule an eligible appointment; rescheduling returns it to pending status and clears the old meeting URL.
- Cancel an eligible appointment.
- Appointment emails notify the patient and clinic on relevant changes.

### Orders

- List the signed-in user's order history.
- Display item, total, status, and order reference.
- Link to a public order-status page/tracking flow.
- Orders placed by signed-in users are linked to their account; guest orders are supported by the intake API.

### Messages

- List clinic/patient messages and unread count.
- Start a conversation with a subject and body.
- Reply in an existing account-owned conversation.
- Mark a message read.
- Clinic replies notify the patient; patient messages notify the admin mailbox.

### Medical records

- Read-only patient view of records associated with the account.
- Display record type, date, provider name, diagnosis, notes, results, and attachments.
- Generate a printable/downloadable record view from the browser.
- Patients do not create or edit clinical records through the portal.

### Prescriptions

- Read active/expired prescriptions for the account.
- Display medications, dosage, frequency, duration, instructions, notes, and the medication/prescription photos uploaded by the clinic.
- Filter presentation by family member when applicable.

### Treatment plan

- View current and historical treatment plans.
- Display start/end dates, duration, elapsed time, live phase, and clinician-set status.
- Display clinician monitoring requirements.
- Submit daily glucose reading type, value, meal/notes, and optional meter photo.
- Submit treatment follow-up symptoms, improvements, adverse reactions, vitals, labs, and notes.
- Mark treatment reminders done/pending.
- Display the plan's append-only follow-up history and glucose history.
- Patient treatment data is read-only except for monitoring submissions and reminder status.

### Family

- List family-member profiles.
- Add a child, spouse, parent, sibling, or other family member.
- Edit name, date of birth, gender, relation, and short notes.
- Remove a family profile.

### Your stories

- List stories submitted by the signed-in user.
- Submit a public testimonial for moderation.
- Public display occurs only for approved stories in the public experience.

### Settings

- Edit profile and extended patient information.
- Upload/change/remove an avatar.
- Upload front/back identity documents.
- Change password.
- Sign out.

## 4. Clinic administrator features

### Products

- List products and edit/create product data.
- Manage price, category, descriptions, usage, ingredients, badge, image, featured state, stock, and active state.
- Upload product images to Cloudinary.
- Activate/deactivate or delete products.

### Doctors

- List public doctor profiles.
- Create/edit practitioner name, specialty, bilingual specialty/bio, photo, phone, active state, sort order, and weekly schedule.
- Delete a doctor profile.

The profile is not currently linked to a login or clinical writes.

### Appointments

- List/filter appointments by status.
- View patient contact details and assigned doctor.
- Confirm, complete, or cancel appointments.
- Reschedule/change date, time, doctor, notes, concern, family member, and video meeting URL.
- Send patient/clinic email notifications for supported status changes.

### Medical records

- List all records or filter to a selected user.
- Create a visit, diagnosis, lab, scan, or note for a patient/family member.
- Add title, date, doctor name, diagnosis, notes, results, and up to ten HTTP(S) attachment URLs.
- Edit or delete a record.

### Prescriptions

- List all prescriptions or filter to a selected user.
- Issue a prescription with medication name, dosage, frequency, duration, and instructions.
- Add doctor name, issue/expiry dates, family member, and notes.
- Edit or delete a prescription.

### Treatment plans

- List/create treatment plans.
- Select a patient and family member, set title/program/start/end dates, notes, and glucose-monitoring windows.
- Open a plan detail workspace.
- Add/edit/delete follow-up entries and reminders.
- Review patient glucose submissions.
- Complete a plan with structured outcome/review fields.

### Treatment alerts

- Aggregated clinic view for concerning glucose readings, missed monitoring, overdue payment reminders, missed follow-ups, ending treatments, and new complications/adverse reactions.
- Link from an alert to the relevant treatment-plan workspace.

### Orders

- List/filter orders.
- View customer/shipping/payment/order information.
- Update order and payment status.
- Send a clinic message to the customer from the order view.

### Testimonials

- List stories with moderation status.
- Approve, reject, feature, or edit story metadata/content.
- Request optional English/French machine translation through MyMemory.
- Delete a story.
- Create a story directly in the dashboard.

### Users and messages

- List patient/customer users with order and unread-message counts.
- Search/filter the user list.
- Open a selected user's conversation.
- Mark patient replies read by opening the conversation.
- Send a new or threaded clinic message.
- Notify the patient by email.

### Blog

- List/create/edit/delete blog posts.
- Manage English/French content, slug, cover, author, draft/published state, featured state, and publication date.
- Upload cover/content images to Cloudinary.

### Subscribers

- List newsletter subscribers.
- Change subscription status.
- Delete a subscriber.
- Compose/send a fan-out email to the subscriber list.

### Live reviews

- List/create video-review URLs and titles.
- Activate/deactivate, edit, and delete video reviews.

### Staff & roles

- List patient/doctor accounts (`role` in `user | doctor`) with join date, email-verified and active status.
- Promote a verified account to Doctor or back to patient; deactivate/activate an account.
- Promotion requires an email-verified account; administrators cannot demote/deactivate themselves; deactivation destroys the user's sessions immediately.
- See `ROLES_AND_PERMISSIONS.md`.

### Data backups

- View the last 30 backup runs (state, trigger, counts, hashes, notification status, error codes) and whether the email/archive pipelines are configured.
- Run a full-database backup now (emailed EJSON snapshot, optionally age-encrypted), with an optional reason recorded.
- Daily scheduled backups run from Vercel Cron; see `BACKUP_AND_RECOVERY.md`.

## 5. API conventions

- Route handlers use JSON and `NextResponse`.
- Dynamic route parameters are asynchronous (`Promise<{ id: string }>`), matching this Next.js version.
- Protected patient APIs call `getSessionUser()` and generally scope queries by the current user ID.
- Administrative APIs call `adminGuard()`; clinical APIs call `clinicalGuard()` (admin or doctor). See `ROLES_AND_PERMISSIONS.md`.
- 17 public/authentication/abuse-prone routes are rate-limited by a first-party server-only limiter (`lib/rate-limit.ts`): login, register, verify-email, resend-verification, forgot-password, reset-password, change-password, avatar upload, ID-card upload, contact, newsletter, newsletter unsubscribe, testimonials, order intake, order tracking, generic upload, and video proxy. It uses an in-memory sliding window per IP (shared via Upstash Redis REST only when `UPSTASH_REDIS_REST_*` variables are present) and returns 429 with `Retry-After`.
- Security headers are applied to all responses via `next.config.ts`: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera/geolocation/microphone/payment/usb blocked), and `Strict-Transport-Security` in production.
- Database errors generally return 500/503 without exposing stack traces.
- Several email actions are intentionally best-effort; a successful database write does not guarantee email delivery.
- Current validation is handwritten and route-specific. A central schema-validation layer is recommended.

## 6. Complete route-handler inventory

### Authentication/account

| Method and path | Access | Action |
| --- | --- | --- |
| `POST /api/auth/register` | Public | Create account (name, optional phone, email, password) and send verification email/token. |
| `POST /api/auth/login` | Public | Validate password for an email OR phone number, update last login, create session, set cookie. |
| `POST /api/auth/logout` | Cookie session | Delete current session and clear cookie. |
| `GET /api/auth/me` | Signed in | Return current safe authentication DTO. |
| `POST /api/auth/verify-email` | Token | Verify email, mark token used, create session. |
| `POST /api/auth/resend-verification` | Email | Issue/reissue verification token without disclosing account existence. |
| `POST /api/auth/forgot-password` | Email | Issue reset token and send recovery email. |
| `POST /api/auth/reset-password` | Reset token | Consume token, set new password, revoke relevant sessions. |
| `POST /api/auth/change-password` | Signed in | Verify current password and replace password hash. |
| `PATCH /api/auth/profile` | Signed in | Update allowed profile/identity-document fields. |
| `POST /api/auth/avatar` | Signed in | Upload and set a Cloudinary avatar. |
| `POST /api/auth/id-card` | Signed in | Upload front/back identity document and set URL. |

### Appointments and doctors

| Method and path | Access | Action |
| --- | --- | --- |
| `GET /api/appointments` | Signed in | List current user's appointments. |
| `POST /api/appointments` | Signed in | Book an available doctor slot. |
| `PATCH /api/appointments/[id]` | Owner | Reschedule or cancel an eligible appointment. |
| `GET /api/appointments/availability` | Signed in | Return open slots for doctor/date. |
| `GET /api/doctors` | Public | List active doctor profiles for booking. |
| `GET /api/admin/appointments` | Admin or Doctor (clinical) | List/filter appointments with patient/doctor details. |
| `PATCH /api/admin/appointments/[id]` | Admin or Doctor (clinical) | Change appointment schedule/status/provider/details and notify parties. |
| `GET /api/admin/doctors` | Admin | List all doctor profiles. |
| `POST /api/admin/doctors` | Admin | Create doctor profile/schedule. |
| `GET /api/admin/doctors/[id]` | Admin | Get one doctor profile. |
| `PATCH /api/admin/doctors/[id]` | Admin | Update doctor profile/schedule. |
| `DELETE /api/admin/doctors/[id]` | Admin | Delete doctor profile. |

### Clinical and treatment

| Method and path | Access | Action |
| --- | --- | --- |
| `GET /api/medical-records` | Signed in | List current user's records. |
| `GET /api/prescriptions` | Signed in | List current user's prescriptions. |
| `GET /api/treatment-plans` | Signed in | List current user's plans with calculated timeline fields. |
| `GET /api/treatment-follow-ups` | Signed in | List current user's treatment follow-ups. |
| `GET /api/treatment-reminders` | Signed in | List current user's treatment reminders. |
| `PATCH /api/treatment-reminders/[id]` | Owner via plan | Mark one reminder pending/done. |
| `GET /api/glucose` | Signed in | List current user's glucose submissions. |
| `POST /api/glucose` | Signed in | Submit a glucose reading and optional photo. |
| `GET /api/admin/medical-records` | Admin or Doctor (clinical) | List all/user-filtered records. |
| `POST /api/admin/medical-records` | Admin or Doctor (clinical) | Create clinical record and notify patient. |
| `PATCH /api/admin/medical-records/[id]` | Admin or Doctor (clinical) | Update clinical record. |
| `DELETE /api/admin/medical-records/[id]` | Admin or Doctor (clinical) | Delete clinical record. |
| `GET /api/admin/prescriptions` | Admin or Doctor (clinical) | List all/user-filtered prescriptions. |
| `POST /api/admin/prescriptions` | Admin or Doctor (clinical) | Issue prescription and notify patient. |
| `PATCH /api/admin/prescriptions/[id]` | Admin or Doctor (clinical) | Update prescription. |
| `DELETE /api/admin/prescriptions/[id]` | Admin or Doctor (clinical) | Delete prescription. |
| `GET /api/admin/treatment-plans` | Admin or Doctor (clinical) | List all/user-filtered treatment plans. |
| `POST /api/admin/treatment-plans` | Admin or Doctor (clinical) | Create treatment plan and notify patient. |
| `PATCH /api/admin/treatment-plans/[id]` | Admin or Doctor (clinical) | Edit plan, monitoring, reminders/status, or completion review. |
| `DELETE /api/admin/treatment-plans/[id]` | Admin or Doctor (clinical) | Delete treatment plan. |
| `GET /api/admin/treatment-follow-ups` | Admin or Doctor (clinical) | List follow-ups, optionally by plan. |
| `POST /api/admin/treatment-follow-ups` | Admin or Doctor (clinical) | Add append-only clinical follow-up. |
| `PATCH /api/admin/treatment-follow-ups/[id]` | Admin or Doctor (clinical) | Edit follow-up. |
| `DELETE /api/admin/treatment-follow-ups/[id]` | Admin or Doctor (clinical) | Delete follow-up. |
| `GET /api/admin/treatment-reminders` | Admin or Doctor (clinical) | List reminders, optionally by plan. |
| `POST /api/admin/treatment-reminders` | Admin or Doctor (clinical) | Create plan reminder. |
| `PATCH /api/admin/treatment-reminders/[id]` | Admin or Doctor (clinical) | Edit or complete/delete-by-status reminder. |
| `DELETE /api/admin/treatment-reminders/[id]` | Admin or Doctor (clinical) | Delete reminder. |
| `GET /api/admin/glucose` | Admin or Doctor (clinical) | List glucose readings, optionally by plan, and flag concerning values. |
| `GET /api/admin/treatment-alerts` | Admin or Doctor (clinical) | Return combined treatment-alert groups. |

### Messaging and users

| Method and path | Access | Action |
| --- | --- | --- |
| `GET /api/messages` | Signed in | List account messages and unread count. |
| `POST /api/messages` | Signed in | Start or reply to a clinic conversation. |
| `POST /api/messages/[id]/read` | Owner | Mark a message read. |
| `GET /api/admin/users` | Admin or Doctor (clinical) | List patient users and order/unread aggregates. |
| `DELETE /api/admin/users/[id]` | Admin | Permanently delete a user account. Requires `{ "confirm": "<user email>" }` (case-insensitive). Rejects admin accounts and self; cascades sessions, tokens, cart, messages, appointments, records, prescriptions, treatment plans/reminders/follow-ups, glucose readings, testimonials; detaches orders. |
| `GET /api/admin/messages` | Admin or Doctor (clinical) | List a selected user's conversation and mark patient replies read. |
| `POST /api/admin/messages` | Admin or Doctor (clinical) | Start/reply to a clinic message and notify patient. |

### Storefront, orders, and cart

| Method and path | Access | Action |
| --- | --- | --- |
| `GET /api/cart` | Signed in | Load server cart. |
| `PUT /api/cart` | Signed in | Replace/synchronize server cart. |
| `DELETE /api/cart` | Signed in | Clear server cart. |
| `GET /api/orders` | Signed in | List account order history. |
| `POST /api/orders` | Public/guest or signed in | Validate order intake, compute server subtotal, create reference/order, send notifications. |
| `POST /api/orders/track` | Public | Return minimal order confirmation only when reference and email match. |
| `GET /api/admin/orders` | Admin | List/filter orders. |
| `PATCH /api/admin/orders/[id]` | Admin | Update order/payment status and optionally message customer. |

### Content, products, testimonials, and subscribers

| Method and path | Access | Action |
| --- | --- | --- |
| `GET /api/blog` | Public | List published posts. |
| `GET /api/blog/[slug]` | Public | Get one published post. |
| `GET /api/admin/posts` | Admin | List all posts. |
| `POST /api/admin/posts` | Admin | Create post. |
| `PATCH /api/admin/posts/[id]` | Admin | Update post/publication state. |
| `DELETE /api/admin/posts/[id]` | Admin | Delete post. |
| `GET /api/admin/products` | Admin | List products. |
| `POST /api/admin/products` | Admin | Create product. |
| `PATCH /api/admin/products/[id]` | Admin | Update product. |
| `DELETE /api/admin/products/[id]` | Admin | Delete product. |
| `POST /api/upload` | Admin | Upload product/blog/doctor media to Cloudinary. Images only (JPG/PNG/WebP/AVIF/GIF, max 5 MB); videos rejected. |
| `GET /api/testimonials` | Signed in | List current user's submitted stories. |
| `POST /api/testimonials` | Public or signed in | Submit story for moderation. |
| `GET /api/admin/testimonials` | Admin | List/filter all stories. |
| `POST /api/admin/testimonials` | Admin | Create story directly. |
| `PATCH /api/admin/testimonials/[id]` | Admin | Edit/moderate/feature story and translations. |
| `DELETE /api/admin/testimonials/[id]` | Admin | Delete story. |
| `POST /api/translate` | Admin | Translate non-clinical supplied text using MyMemory. |
| `GET /api/admin/subscribers` | Admin | List subscribers. |
| `PATCH /api/admin/subscribers/[id]` | Admin | Change subscription status. |
| `DELETE /api/admin/subscribers/[id]` | Admin | Delete subscriber. |
| `POST /api/admin/fanout` | Admin | Send newsletter/fan-out email. |

### Public engagement

| Method and path | Access | Action |
| --- | --- | --- |
| `POST /api/contact` | Public | Create booking/contact/order inquiry and notify clinic. |
| `POST /api/newsletter` | Public | Subscribe/unsubscribe and send welcome email. |
| `POST /api/newsletter/unsubscribe` | Email token | Unsubscribe using an emailed token. |
| `GET /api/video-stream/[fileId]` | Public | Proxy a public Google Drive video for browser playback. |

### Roles, backups, and scheduled maintenance

| Method and path | Access | Action |
| --- | --- | --- |
| `GET /api/admin/roles` | Admin | List non-admin accounts with role/status/join-date/verification. |
| `PATCH /api/admin/roles` | Admin | Promote to Doctor/user (email-verified required), activate/deactivate (deactivation destroys sessions); cannot demote/deactivate self. |
| `GET /api/admin/backups` | Admin | List the 30 most recent `BackupRun` rows plus email/archive pipeline configuration status. |
| `POST /api/admin/backups` | Admin | Run a full-database emailed backup now (optional reason); returns 400 when SMTP/recipient is not configured. |
| `GET /api/cron/backups` | Vercel Cron (Bearer `CRON_SECRET` outside development) | Lease recovery, optional archive queue execution, daily emailed backup; isolated per-step JSON result. |
| `GET /api/admin/whatsapp` | Admin | WhatsApp sending status: whether credentials are present, how many patients are opted in, and the exact template names, copy, placeholders and opt-out line. Never returns secrets. |
| `GET /api/admin/logs` | Admin | Durable error log: newest entries, 24h/7d counts, per-scope breakdown, retention, and the last daily-digest status. Accepts `level`, `source`, `scope` and `q` filters. |
| `POST /api/admin/logs` | Admin | Sends the daily error-log digest immediately, bypassing the idempotency window. |

## 7. Data-change summary

| User action | Data changed |
| --- | --- |
| Register | `User`, `ResetToken`-like verification fields/email. |
| Verify email | `User.emailVerified`, verification fields, `Session`. |
| Login/logout | `User.lastLoginAt`, `Session` create/delete. |
| Password reset/change | `User.passwordHash`, token/session revocation. |
| Profile/avatar/ID update | `User` profile and/or Cloudinary. |
| Add/edit family | Embedded `User.familyMembers`. |
| Book/reschedule/cancel | `Appointment`, email notifications. |
| Submit message | `Message`, email notification, read state. |
| Add glucose | `GlucoseReading`, optional Cloudinary image. |
| Complete reminder | `TreatmentReminder.status`. |
| Checkout | `Order`, optional account cart update, emails. |
| Submit story | `Testimonial` pending record. |
| Subscribe | `Subscriber`, welcome email. |
| Admin clinical write | Corresponding clinical collection, patient notification, and free-text doctor name. |
| Admin content write | Product/BlogPost/Testimonial/Doctor/Subscriber/VideoReview. |
| Admin role change | `User.role`/`isActive`, all sessions revoked on deactivation. |
| Admin/automatic backup | `BackupRun` (+ `BackupLease` for archive runs); emailed backup attachment delivered to admin mailbox. |

## 8. Known feature/security boundaries requiring remediation

- `Doctor` now exists as a login role with clinical-only API access, but is **not linked to a `Doctor` profile** and there is no patient-assignment/care-relationship scope; clinical writes still record a free-text `doctorName`.
- Clinical write APIs trust an administrator-supplied `doctorName` and do not record the signed-in clinician's account.
- ID documents and some clinical media are represented by URLs without consistently authorized private delivery.
- Public testimonial submission has no explicit consent/version/timestamp record.
- Newsletter subscription does not record consent text/version/source/IP or double opt-in.
- No patient-facing data export, correction, restriction, or deletion request workflow is present.
- No immutable audit log exists for sensitive reads/writes.
- A first-party rate limiter now protects 17 public/authentication/abuse-prone routes (`lib/rate-limit.ts`); a managed Redis/KV-backed shared limiter and CAPTCHA step-up for high-risk forms remain recommended for production scale.
- Security headers are set globally via `next.config.ts`; a Content Security Policy is still absent and should be deployed report-only first.
- Order intake does not integrate a verified online payment processor.
- Public inquiry persistence is best-effort when MongoDB is unavailable, while email is also best-effort.
- Daily emailed database backups and the optional encrypted object-store archive now exist (see `BACKUP_AND_RECOVERY.md`); restore drills, retention enforcement jobs, and failure alerting are still to be operationalized and evidenced.
