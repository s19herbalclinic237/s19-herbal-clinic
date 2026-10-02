# Roles and permissions

**Baseline:** 25 September 2026
**Purpose:** Document the role model now implemented for S19, the exact capability of each role at the API and dashboard level, what remains to be done to reach a least-privilege clinical model, and the migration/authorization requirements still outstanding.

This document is an engineering specification, not a clinical or legal approval. Roles limit *what an account can do*; they do not by themselves prove that every clinical action is appropriately scoped to a patient the clinician is actually responsible for.

## 1. Role model

Roles are stored on the `User` document as the `role` field. The Mongoose schema enum in `lib/models/User.ts` is:

| Role | Meaning |
| --- | --- |
| `user` | Patient/customer account. Own-account portal only. |
| `doctor` | Clinical staff account. Can manage the clinical workflows but has **no** store, content, subscriber, user-administration, roles, or backup access. |
| `admin` | Full clinic-administration account. Everything a doctor can do plus store/content/subscriber/user/role/backup administration. |

The role value is surfaced to the client only through the safe `AuthUser` DTO (`lib/auth.ts` → `toAuthUser`), which exposes `role`. Server-side authorization never trusts the client; every protected route resolves the session and re-derives the role from the database user.

## 2. Server-side authorization helpers

| Helper | Location | Behavior |
| --- | --- | --- |
| `isAdmin()` | `lib/auth-server.ts` | `user.role === "admin"`. |
| `isStaff()` | `lib/auth-server.ts` | `admin` or `doctor`. |
| `isDoctor()` | `lib/auth-server.ts` | `user.role === "doctor"`. |
| `adminGuard()` | `lib/admin-guard.ts` | Rejects signed-out, deactivated, non-admin users with 401/403 and no data. |
| `clinicalGuard()` | `lib/admin-guard.ts` | Same checks as `adminGuard` but allows both `admin` and `doctor`. |

Rule of thumb: **clinical operations** (anything touching patient-facing clinical data) use `clinicalGuard`; **administrative operations** (store, content, subscribers, users, roles, backups) use `adminGuard`.

### Why the two user screens are guarded differently

The clinic's specification is that a patient has one Medical Record Number, that **only an administrator may create, change or remove it**, and that **other authorised clinical staff may view and search by it**. That is implemented as a split rather than one endpoint with a role check inside:

| Concern | Route | Guard | Reason |
| --- | --- | --- | --- |
| Read one patient's file | `GET /api/admin/users/[id]` | `clinicalGuard` | Looking at a patient's file when they walk in is clinical work. A doctor should not need an administrator to open a read-only view. |
| List every account, all roles | `GET /api/admin/directory` | `adminGuard` | This list includes the clinic owner's own address and date of birth. Staff already have the patient list they need via `GET /api/admin/users`. |
| Write the MRN | `PATCH /api/admin/mrn` | `adminGuard` | The specification says administrators only. No exceptions, no self-service, ever. |

`GET /api/admin/users` was deliberately **not** widened to include administrators. It feeds **Staff & Roles**, which offers promote / disable / delete; adding the signed-in administrator to that list would let a screen offer to delete the account it is running as. The directory is a separate route for that reason.

Duplicate MRNs are refused in two independent places: an explicit `findOne` in the route so the clinic gets a readable error, and a **unique sparse index** on `User.mrn` so that two administrators acting in the same instant still cannot produce two records with one number. The sparse part matters: without it, every unassigned patient would collide on a missing value.

## 3. Route-to-role matrix (implemented)

### Admin-only (`adminGuard`)

| Route group | Routes |
| --- | --- |
| Products | `GET/POST /api/admin/products`, `PATCH/DELETE /api/admin/products/[id]` |
| Doctors (public profiles) | `GET/POST /api/admin/doctors`, `GET/PATCH/DELETE /api/admin/doctors/[id]` |
| Orders | `GET /api/admin/orders`, `PATCH /api/admin/orders/[id]` |
| Content | `GET/POST /api/admin/posts`, `PATCH/DELETE /api/admin/posts/[id]` |
| Testimonials | `GET/POST /api/admin/testimonials`, `PATCH/DELETE /api/admin/testimonials/[id]` |
| Subscribers | `GET /api/admin/subscribers`, `PATCH /api/admin/subscribers/[id]`, `DELETE /api/admin/subscribers/[id]` |
| Fan-out | `POST /api/admin/fanout` |
| Video reviews | `GET/POST/DELETE /api/admin/video-reviews` |
| Roles | `GET/PATCH /api/admin/roles` |
| **Users directory** | `GET /api/admin/directory` — every account, all roles, searchable by name/email/phone/MRN |
| **Medical Record Number** | `PATCH /api/admin/mrn` — assign, change or remove a patient's MRN |
| Backups | `GET/POST /api/admin/backups` |
| Translation | `POST /api/translate` |

### Clinical staff (`clinicalGuard` — admin **and** doctor)

| Route group | Routes |
| --- | --- |
| Appointments | `GET /api/admin/appointments`, `PATCH /api/admin/appointments/[id]` |
| Medical records | `GET/POST /api/admin/medical-records`, `PATCH/DELETE /api/admin/medical-records/[id]` |
| Prescriptions | `GET/POST /api/admin/prescriptions`, `PATCH/DELETE /api/admin/prescriptions/[id]` |
| Treatment plans | `GET/POST /api/admin/treatment-plans`, `PATCH/DELETE /api/admin/treatment-plans/[id]` |
| Treatment follow-ups | `GET/POST /api/admin/treatment-follow-ups`, `PATCH/DELETE /api/admin/treatment-follow-ups/[id]` |
| Treatment reminders | `GET/POST /api/admin/treatment-reminders`, `PATCH/DELETE /api/admin/treatment-reminders/[id]` |
| Glucose | `GET /api/admin/glucose` |
| Treatment alerts | `GET /api/admin/treatment-alerts` |
| Messaging | `GET /api/admin/users` (patient list for selection), `GET/POST /api/admin/messages` |
| One patient in full (read-only) | `GET /api/admin/users/[id]` — identity, contact, emergency contact, family members, ID documents and record counts. Nothing here can be written from this endpoint. |
| Image uploads | `POST /api/upload` — so a doctor can attach prescription and medical-record photos, not just an administrator |

`POST /api/upload` is `clinicalGuard` rather than `adminGuard` because a doctor could otherwise
open the prescriptions tab, complete every field including the photo, and be refused the upload
with "Admin access required" — the record routes were already staff-accessible. Widening the upload
does not widen what a doctor can *change*: products, posts and the doctor directory stay
admin-only, so an uploaded image still has to be attached to a record the doctor can already edit.
The residual exposure is an orphaned upload, bounded by a per-user rate limit.

Patients keep the existing own-account routes (`/api/appointments`, `/api/medical-records`, `/api/prescriptions`, `/api/treatment-plans`, `/api/glucose`, `/api/messages`, …), which scope every query to the session user's ID.

## 4. Role administration API

`PATCH /api/admin/roles` (admin-only) accepts `{ id, role?, isActive? }`:

- **Promotion to `doctor` or `user` requires `emailVerified === true`.** Unverified accounts cannot be promoted.
- An administrator cannot demote or deactivate themselves (`user.role === "admin"` is protected).
- Deactivating a user (`isActive: false`) destroys all of that user's sessions immediately (`destroyUserSessions`), so a deactivated doctor or staff account cannot keep using an existing session.
- `GET /api/admin/roles` lists accounts with `role` in `["user", "doctor"]` (administrators are excluded from the list because they cannot be managed here) and returns `role`, `emailVerified`, `isActive`, `lastLoginAt`, `createdAt`.

The dashboard **Staff & Roles** tab (`components/admin/roles-tab.tsx`) exposes this to the administrator.

## 5. Dashboard personas

`components/account/dashboard-screen.tsx` renders different navigation per role:

### Patient (`user`)
- Tabs: Dashboard, Appointments, Orders, Messages, Medical Records, Prescriptions, Treatment Plan, Family, Your Stories, Settings.
- Bottom mobile nav: the same patient tabs (short labels).

### Doctor (`doctor`)
- **Clinical work:** Appointments, Medical Records, Prescriptions, Treatment Plans, Treatment Alerts, Patients & Messages.
- **My account:** Settings.
- No store, blog, subscribers, live reviews, orders administration, doctors-profiles administration, Staff & Roles, or Data Backups tabs.
- Sidebar shows a **Doctor** badge; the initial tab on sign-in is `admin-appointments`.
- Bottom mobile nav shows the clinical tabs with short labels.

### Administrator (`admin`)
- Everything the patient can see plus **Clinic admin:** Products, Doctors, Appointments, Medical Records, Prescriptions, Treatment Plans, Treatment Alerts, Orders, Testimonials, **Users**, Users & Messages, Blog, Subscribers, Live Reviews, Staff & Roles, Data Backups.
- Sidebar shows a **Clinic admin** badge.

### The signed-in user's MRN
`lib/auth-server.ts` puts `mrn` on the session user, so the dashboard sidebar shows the number next to the name and email when the signed-in person has one — that is how the clinic calls a patient, name plus file number. Administrator accounts never carry an MRN, so the chip is absent for them rather than blank. It is read-only in this place; changing an MRN happens on the **Users** tab, which is administrator-only.

Tab rendering in `renderTab` re-checks the role server-independent gate (`isStaff`/`isAdmin`) so a manually chosen tab ID cannot bypass the persona navigation; the API routes enforce the same boundary itself.

## 6. Implemented vs. outstanding requirements

### Implemented in this phase
1. `doctor` role in the `User` enum plus `AuthUser.role`.
2. `clinicalGuard` separating clinical from administrative API access; 15 clinical route groups switched to it.
3. Roles management API and dashboard tab with promotion/deactivation safeguards.
4. Doctor persona dashboard with clinical-only navigation and badge.

### Still outstanding (see `SECURITY_PRIVACY_AUDIT.md` and `LEGAL_COMPLIANCE_GAP_REGISTER.md`)
1. **Doctor profile linkage.** A `doctor` *account* is a login role; it is not yet linked to a `Doctor` *profile* (public practitioner record). `app/api/admin/doctors` still manages profiles as public content.
2. **Care relationships.** Clinical routes protect *who can call them* but not *which patients a given doctor may access*. Every clinical write still records a free-text `doctorName` rather than the signed-in clinician's identity. Before multiple doctors share the clinical dashboard, add an assignment/care-relationship model and scope every clinical query/write to it.
3. **MFA and offboarding.** No multi-factor authentication, access-review, or break-glass procedure is implemented.
4. **Audit attribution.** Role changes and deactivations are not written to an immutable audit log.
5. **Automated negative tests.** Authorization tests for doctor cross-patient access and cross-capability denial are not yet committed (see the test plan in `SECURITY_PRIVACY_AUDIT.md` §6).

## 7. Requirements before this model is deployed

- Decide whether `doctor` accounts map one-to-one to `Doctor` profiles and who creates them.
- Define patient-assignment scope (by treatment plan? by appointment? by clinic-selected list?) and enforce it server-side on every clinical route.
- Store the acting clinician (`req.user.id`) on every clinical write and remove reliance on free-text `doctorName`.
- Add MFA for `doctor` and `admin`.
- Add an audit event on every role change, activation/deactivation, and clinical write/read of sensitive records.
- Automate the §6 authorization test plan in CI.