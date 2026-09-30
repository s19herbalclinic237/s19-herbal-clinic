# Dashboard actions and current permissions

**Baseline:** 25 September 2026  
**Dashboard route:** `/account`

This runbook describes the current dashboard, not a final clinical or legal approval. The application currently distinguishes signed-in patients (`user`), clinical staff doctors (`doctor`), and administrators (`admin`). The `doctor` role and its clinical-only dashboard persona are implemented; **care-relationship scoping** (which patients a given doctor may access) is still outstanding — see `ROLES_AND_PERMISSIONS.md` for the boundary between implemented and remaining work.

## 1. Access model currently implemented

| Area | Signed out | Patient (`user`) | Doctor (`doctor`) | Administrator (`admin`) |
| --- | --- | --- | --- | --- |
| Public storefront and public content | Allowed | Allowed | Allowed | Allowed |
| Authentication/recovery | Allowed | Allowed | Allowed | Allowed |
| Patient overview, appointments, orders, messages, records, prescriptions, treatment, family, stories, settings | Denied | Own-account data only | Not applicable (clinical view) | All patient/operational data |
| Clinical work: appointments, records, prescriptions, treatment plans, treatment alerts, patients & messages | Denied | Own-account data only | Allowed (all patients, pending care-scope) | Allowed |
| Store, content, subscribers, live reviews, products, roles, backups, user administration | Denied | Denied | Denied | Allowed |
| Route protection | — | API/session ownership checks | `clinicalGuard()` on clinical routes | `adminGuard()` on all admin routes |

There is no permission-specific care-relationship check (a doctor can currently see every patient's clinical data), no MFA requirement, and no immutable audit trail. Do not interpret the `doctor` role as proof that a clinician is authorized for a given patient until care-relationship scope exists — the highest-priority authorization gap is documented in `ROLES_AND_PERMISSIONS.md` §6.

## 2. Patient dashboard navigation

### 2.1 Overview

**Purpose:** Give the patient a concise account and care overview.

**Actions:**

- Open the full patient dashboard after sign-in.
- View current greeting/date and exact account join date (`User.createdAt` formatted as a full date).
- Review summary counts for:
  - Active/non-terminal orders.
  - Unread messages.
  - Upcoming appointments.
  - Active treatment plans.
  - Pending testimonial submissions.
  - Prescriptions and medical records where returned by dashboard aggregation.
- Use shortcuts to open the relevant tab.

**Data changed:** None.

**Current access rule:** `/api/auth/me` and the patient's own dashboard APIs.

### 2.2 Appointments

**Purpose:** Book and manage telehealth/in-person appointments.

**Patient actions:**

1. Select a doctor.
2. Select an appointment date.
3. Load open times for that doctor/date.
4. Select the patient or a family member as the attendee.
5. Select visit mode and enter concern/notes.
6. Submit an appointment.
7. Review appointment status, doctor, date/time, mode, concern, and video link when supplied.
8. Reschedule an eligible appointment to a new open slot.
9. Cancel an eligible appointment.

**Data changed:**

- Create: `Appointment` with `user`, selected `doctor`, family member when applicable, scheduled slot, mode, concern, and pending status.
- Reschedule: new date/time, doctor/slot data, pending status, and prior meeting URL cleared.
- Cancel: cancelled status and timestamp fields.
- Emails: creation, reschedule, and cancellation notifications.

**Server-side constraints that must remain true:**

- Availability must be derived from the doctor's schedule and existing appointments.
- One booked slot must not be reusable.
- Reschedule/cancel must query `{ _id, user: sessionUser.id }`; possession of another appointment ID must not be enough.
- Concurrent requests require an atomic booking strategy or a database transaction/unique appointment-slot constraint.
- Family-member selection must be constrained to an embedded profile owned by the session user.

**Known gap:** Booking currently uses free-text doctor identity and does not establish a Doctor-to-patient care relationship.

### 2.3 Orders

**Purpose:** Review purchases associated with the signed-in account.

**Patient actions:**

- List the user's orders, newest first.
- Review reference, date, items, total, and status.
- Open the order-status/tracking route.
- Continue shopping when cart state is empty.

**Data changed:** None from the patient dashboard.

**Current access rule:** `/api/orders` filters orders by the session user's ID.

**Known gap:** A payment reference/status entered in intake is not proof of payment. A verified payment provider and signed server webhook are required before treating online payment as complete.

### 2.4 Messages

**Purpose:** Exchange account messages with clinic staff.

**Patient actions:**

- Open the messaging tab.
- Review messages and unread count.
- Start a new conversation with subject and body.
- Reply in the same thread.
- Open/mark a received message read.
- Receive clinic email notifications.

**Data changed:**

- New `Message` linked to the signed-in user.
- Reply linked to an existing account-owned thread.
- `read` update for an account-owned message.

**Known gaps:** Message content may contain health information but is not visibly marked as clinical/secure. There is no response-time expectation, message retention policy, staff attribution, or audit log.

### 2.5 Medical records

**Purpose:** Read records issued by clinic staff.

**Patient actions:**

- List account-linked records.
- Filter presentation by family member where available.
- Review type, date, doctor name, diagnosis, notes, results, and attachment links.
- Print or save the rendered record through the browser.

**Data changed:** None.

**Server-side constraints that must remain true:**

- Query records only for the session user's account.
- If family-member records are shown, their embedded owner must match the session user.
- Attachments must be delivered only after authorization; a public URL is not sufficient access control.

**Known gaps:** No formal release authorization, amendment/correction workflow, provenance metadata, clinician account attribution, or attachment malware/access audit exists.

### 2.6 Prescriptions

**Purpose:** Read prescriptions issued by clinic staff.

**Patient actions:**

- List account-linked prescriptions.
- Filter presentation by family member.
- Review medication, dose, frequency, duration, instructions, doctor name, issue/expiry dates, and notes.

**Data changed:** None.

**Known gaps:** There is no verified e-prescription workflow, prescriber identity/account attribution, medication interaction checking, or jurisdiction-specific practice authorization.

### 2.7 Treatment plan

**Purpose:** Follow a clinician-created treatment and monitoring plan.

**Patient actions:**

- View active, scheduled, completed, and expired plans.
- Review title, program, dates, notes, monitoring window, clinician-set lifecycle status, and progress.
- Select a plan/family member.
- Submit a glucose reading:
  - reading type,
  - numeric value,
  - optional meal/notes,
  - optional meter image.
- Submit a follow-up:
  - symptoms,
  - improvements,
  - adverse reactions/complications,
  - optional vitals,
  - optional lab details,
  - notes.
- Mark a treatment reminder done or pending.
- Review submitted glucose and follow-up history.
- Receive staff reminders and clinic email notifications.

**Data changed:**

- `GlucoseReading` insert and possible Cloudinary image upload.
- `TreatmentFollowUp` insert.
- `TreatmentReminder.status` update.

**Server-side constraints that must remain true:**

- The selected plan must belong to the session user.
- Family-member identity must be owned by the session user.
- Reminder updates must resolve the reminder through an owned plan.
- Clinical monitoring thresholds should be centrally defined, not duplicated in the UI.
- Media uploads must be private, type/size constrained, and associated with the submitted record.

**Known gaps:** Follow-ups are described as append-only in intent, but the current model does not provide a complete amendment/version audit chain. Patient self-entered data is not automatically a clinician-attested medical record.

### 2.8 Family

**Purpose:** Maintain people the patient can select for care and treatment workflows.

**Patient actions:**

- List family members.
- Add a member with name, date of birth, gender, relationship, and notes.
- Edit the same fields.
- Delete a member.

**Data changed:** Embedded `User.familyMembers` array.

**Known gaps:** The relationship can be self-asserted; there is no separate identity/consent flow for an adult family member. Do not collect an adult's clinical information without an appropriate lawful basis and authorization process.

### 2.9 Your stories

**Purpose:** Submit a testimonial/story and track moderation.

**Patient actions:**

- List the signed-in user's submissions and moderation status.
- Submit name, city, country, program, story, rating, and optional email.
- Wait for approval/rejection and public display.

**Data changed:** Insert pending `Testimonial`, with `user` when submitted from a signed-in account.

**Known gaps:** The public submission path does not record explicit consent text, consent version, source, publication authorization, withdrawal process, or clinical-claims review evidence.

### 2.10 Settings

**Purpose:** Manage account identity, sensitive verification documents, and password.

**Patient actions:**

- Change name, phone, date of birth, gender, address, and emergency contact.
- Upload/change/remove avatar.
- Upload front/back identity documents.
- Change password using current-password verification.
- Sign out.

**Data changed:**

- `User` profile fields.
- Cloudinary avatar/ID media and associated `User` URL fields.
- Password hash and session invalidation where implemented.

**Security requirements for production:**

- ID documents must use a private Cloudinary resource type, authenticated or signed delivery, short expiry, and authorized user/staff checks.
- Do not expose a Cloudinary public ID or signed parameters in shared analytics/logging.
- Record upload time, document side, file metadata, and deletion/retention state.
- Do not allow arbitrary external URL injection for identity/clinical files.

## 3. Administrator dashboard navigation

### 3.1 Products

**Actions:**

- Search/list products.
- Create a product.
- Edit name, slug, category, price, unit, English/French content, usage, ingredients, badge, image, featured flag, stock, and active flag.
- Upload an image to Cloudinary.
- Delete a product.

**Data changed:** `Product` create/update/delete and Cloudinary media.

**Required safeguards:** Unique slug checks, price/stock validation, upload ownership, and a reason/audit record for deletion. Do not physically delete a product referenced by an order without retaining the order's item snapshot.

### 3.2 Doctors

**Actions:**

- List all doctor profiles.
- Create a practitioner profile.
- Edit name, specialty, bilingual specialty/bio, photo, phone, active state, sort order, and weekly schedule.
- Delete a profile.

**Data changed:** `Doctor` create/update/delete and Cloudinary photo.

**Required safeguards:** The future doctor account must link to a `Doctor.userId`; removing/deactivating a login must not rewrite historical clinical authorship. Deletion must be blocked or anonymized when historical appointments/clinical records reference the practitioner.

### 3.3 Appointments

**Actions:**

- List/filter appointments by lifecycle status.
- View patient, family member, doctor, date/time, mode, concern, notes, and meeting URL.
- Confirm a pending appointment.
- Complete an appointment.
- Cancel an appointment.
- Change doctor/date/time, concern, notes, and video meeting URL.
- Send supported patient/clinic notifications.

**Data changed:** `Appointment` status/scheduling/clinical-note fields.

**Required safeguards:** Atomic slot conflict prevention, state-transition validation, clinician attribution, audit entries, and meeting-URL access restrictions.

### 3.4 Medical records

**Actions:**

- List all records or filter by user.
- Create a visit, diagnosis, lab, scan, or note.
- Select patient and optional family member.
- Enter date, doctor name, diagnosis, notes, results, and attachment URLs.
- Edit or delete a record.

**Data changed:** `MedicalRecord` create/update/delete.

**Required safeguards:** Minimum necessary fields, care relationship, clinician account attribution, immutable correction/audit history, and private authorized attachments. “Delete” should become a controlled correction/retention workflow where medical-record retention duties apply.

### 3.5 Prescriptions

**Actions:**

- List all prescriptions or filter by user.
- Create a prescription for patient/family member.
- Enter medication, dose, frequency, duration, instructions, doctor, issue/expiry dates, and notes.
- Edit or delete a prescription.

**Data changed:** `Prescription` create/update/delete.

**Required safeguards:** Verified prescriber identity and credentials, jurisdiction-appropriate prescribing workflow, care relationship, and auditable amendment/revocation rather than silent deletion.

### 3.6 Treatment plans

**Actions:**

- List/create treatment plans.
- Select patient and optional family member.
- Enter title, program, start/end dates, notes, and glucose-monitoring configuration.
- Open a detailed plan workspace.
- Add/edit/delete follow-ups and reminders.
- Review patient glucose submissions.
- Complete the plan with outcome/review information.
- Delete a plan.

**Data changed:** `TreatmentPlan`, `TreatmentFollowUp`, `TreatmentReminder`, and potentially `GlucoseReading` review metadata.

**Required safeguards:** Clinician attribution, care relationship, server-side plan ownership checks, auditable lifecycle changes, and no physical deletion of clinically required records without approved retention/legal-hold handling.

### 3.7 Treatment alerts

**Actions:**

- Review alerts for:
  - missed glucose submissions,
  - concerning glucose readings,
  - overdue payment,
  - missed follow-up,
  - treatment ending,
  - adverse reactions/new complications.
- Open the corresponding plan detail.

**Data changed:** None unless an alert acknowledgement feature is added.

**Clinical safety requirement:** Alert thresholds and urgent-event messaging require clinician approval. Software alerts are decision support, not proof that a patient received or followed emergency instructions.

### 3.8 Orders

**Actions:**

- List/filter orders.
- Review customer, shipping, payment method/reference, item, total, and status.
- Update order and payment status.
- Send a message to the customer from the order view.

**Data changed:** `Order.status` and `Order.payment.status`; optional `Message`.

**Required safeguards:** Only verified payment-provider events should change paid status. Record status-change actor/time/reason. Restrict customer contact and transaction data to roles that need it.

### 3.9 Testimonials

**Actions:**

- List/filter stories by status.
- Approve, reject, edit, or feature a story.
- Add or request English/French translations.
- Create or delete a story.

**Data changed:** `Testimonial` content/status/translation/featured state.

**Required safeguards:** No clinical data or identifiable health information in public copy; documented publication consent; qualified review of treatment claims; optional anonymization; and moderation audit trail.

### 3.10 Users and messaging

**Actions:**

- List users with order/unread-message summaries.
- Search/filter users.
- Open a user's conversation.
- Mark patient replies read.
- Start or reply to a message.
- Notify the patient by email.

**Data changed:** `Message` inserts/read state and email notification.

**Required safeguards:** Staff-role access, care relationship where appropriate, audit of sensitive conversation access, and least-necessary patient search/export.

### 3.11 Blog

**Actions:**

- List/create/edit/delete posts.
- Set English/French title, excerpt, body, slug, author, cover, draft/published status, featured status, and publication date.
- Upload cover/content images.

**Data changed:** `BlogPost` and Cloudinary media.

**Required safeguards:** Medical-content review, claim substantiation, alt text, publication audit, and removal/correction workflow.

### 3.12 Subscribers and fan-out

**Actions:**

- List subscribers.
- Change subscription status.
- Delete a subscriber.
- Compose a fan-out email and send to the subscriber list.

**Data changed:** `Subscriber` status/deletion; outbound email.

**Required safeguards:** Consent evidence, unsubscribe in every message, suppression list, sender authentication, rate limiting, and campaign audit. Never send clinical or testimonial-identifying data to this list.

### 3.13 Live reviews

**Actions:**

- List/create video-review records.
- Add URL and title.
- Activate/deactivate, edit, or delete a review.

**Data changed:** `VideoReview` and possible linked Cloudinary/remote media.

**Required safeguards:** Content rights, publication consent, safe URL allowlist, moderation, and removal workflow.

### 3.14 Staff & roles

**Actions:**

- List patient/doctor accounts with role, join date, email-verified status, active status, and last login.
- Promote an email-verified account to Doctor.
- Demote a Doctor back to patient.
- Activate/deactivate an account.

**Data changed:** `User.role` and `User.isActive`; deactivation destroys the user's live sessions.

**Required safeguards:** Promotion requires `emailVerified`; an administrator cannot demote/deactivate themselves (`admin` accounts are excluded from the list); deactivation must immediately revoke sessions (implemented via `destroyUserSessions`); role changes should be audited before production.

### 3.15 Data backups

**Actions:**

- View the 30 most recent backup runs: state, trigger, counts, hashes, notification status, and error codes.
- View whether the emailed backup and the optional object-store archive pipelines are configured.
- Run a full-database emailed backup now, with an optional reason.
- (Indirect) Confirm the daily cron output and alert emails.

**Data changed:** A new `BackupRun` audit row; when run, a gzip (optionally age-encrypted) EJSON snapshot of every application collection is emailed to the admin mailbox. The object-store archive additionally writes an encrypted tar to S3-compatible storage (only when `BACKUP_S3_*` is configured).

**Required safeguards:** Admin-only; the dashboard must never display backup contents, only metadata; SMTP failure must surface as `notificationStatus` on the run row rather than silently succeeding; restore drills are mandatory, not optional (see `BACKUP_AND_RECOVERY.md`).

## 4. Role-aware dashboard behavior

The dashboard now derives navigation and API gates from server-issued roles: patients see the own-account portal, doctors see only clinical-work tabs (Appointments, Medical Records, Prescriptions, Treatment Plans, Treatment Alerts, Patients & Messages, WhatsApp) plus Settings, and administrators see the patient portal plus every administrative tab (including Staff & Roles, WhatsApp and Data Backups). Navigation hiding alone is usability, not security — every route re-enforces the role boundary server-side (`clinicalGuard`/`adminGuard`).

The capability matrix below is the target end-state. The `doctor` column is partially met today (clinical tabs exist); remaining gaps are care-relationship scope, clinician attribution on writes, and audit trails.

| Capability | Patient | Doctor | Clinic staff | Administrator |
| --- | --- | --- | --- | --- |
| Own profile/family/cart/orders/messages | Own | Own | Own | Own/managed |
| Book/manage own appointments | Own | Own schedule/assigned patients | Clinic scheduling | All |
| Read clinical records/prescriptions/plans | Own released data | Assigned care only | Operational minimum | Audited break-glass/all as approved |
| Create clinical records/prescriptions | No | Within credentials/care scope | Role-specific | Policy-controlled |
| Manage catalog/content/subscribers | No | No | Separate permission | Separate permission |
| Manage users/roles/audit/backups | No | No | No | Restricted subset, ideally named backup operator |
| View treatment alerts | Own alerts only | Assigned patients | Assigned clinic scope | Policy-controlled |

The server must enforce the same matrix on every handler. Client-side navigation hiding is usability only, not security.

## 5. Administrator operating controls

Before broad production use, the clinic should adopt and document:

1. Named administrator accounts; no shared credentials.
2. MFA for all staff, especially administrators.
3. Automatic session timeout and offboarding/revocation.
4. Quarterly access review and immediate removal for departing staff/doctors.
5. Audit entries for sensitive reads, exports, uploads, clinical writes, role changes, and deletions.
6. Break-glass access reason, approval, time limit, and post-event review.
7. Backup creation/restore test evidence and `ADMIN_EMAIL` failure alerts.
8. A documented process for patient complaints, data requests, incidents, and clinical safety escalation.
9. Approved retention schedules by data class, including backup copies.
10. A prohibition on using consumer messaging tools for patient health information unless formally approved and secured.

## 6. Verification checklist for each dashboard change

Before release, verify:

- A patient cannot retrieve another patient/family member by changing an ID or query parameter.
- A doctor cannot read a patient without an active care relationship and required capability.
- A clinic-staff user cannot perform administrator-only actions.
- A denied request returns no sensitive data and produces an audit/security event where appropriate.
- Mutations are idempotent or protected against duplicate submission where relevant.
- Email failure is observable and does not incorrectly mark the business workflow complete when email is legally necessary.
- Cloudinary resources use private/signed delivery and cannot be enumerated.
- A user can exercise applicable access, correction, export, withdrawal, complaint, and deletion/retention rights.
- Keyboard use, focus, screen-reader labels, and mobile layout work for the changed workflow.
