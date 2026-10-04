# S19 Herbal Clinic — Complete Website User Manual

> **The official step-by-step guide** for patients, staff and administrators.
> Every screen, every action, every workflow — explained in detail.
>
> Website: **www.s19herbalclinic.com** · Clinic: Bafoussam, Cameroon
> Built and maintained by **Cameroon Digital Agency**

---

## Table of Contents

1. [Introduction & Roles](#1-introduction--roles)
2. [Technology Stack & Infrastructure](#2-technology-stack--infrastructure)
3. [The Public Website (Visitors)](#3-the-public-website-visitors)
4. [Accounts: Register, Verify, Sign In, Reset](#4-accounts-register-verify-sign-in-reset)
5. [Patient Dashboard — Every Tab in Detail](#5-patient-dashboard--every-tab-in-detail)
6. [Staff (Doctor) Dashboard — Clinical Work](#6-staff-doctor-dashboard--clinical-work)
7. [Administrator Dashboard — Clinic Admin](#7-administrator-dashboard--clinic-admin)
8. [Feature Breakdown — Everything We Built](#8-feature-breakdown--everything-we-built)
9. [Emails & Notifications System](#9-emails--notifications-system)
10. [Operations & Maintenance](#10-operations--maintenance)
11. [Roles & Permissions Reference](#11-roles--permissions-reference)
12. [Support](#12-support)

---

## 1. Introduction & Roles

The S19 Herbal Clinic website is a full digital front door for the clinic: an online **shop**, a **blog and health library**, a **tele-health and booking system**, a complete **patient portal** (records, prescriptions, treatment plans, glucose monitoring), and a **clinic administration panel**.

The site is used by four different audiences:

| Role | What they can do | Where |
|---|---|---|
| **Visitor** (no account) | Browse the catalog, order via chat/screenshot, book a consultation, read the blog, subscribe to news, submit a patient story, track an order | Public pages |
| **Patient** (registered user) | Book/manage appointments, message the clinic, view records/prescriptions, follow a treatment plan, log glucose readings, manage family members, order products | The **My account** dashboard |
| **Staff (Doctor)** | Confirm appointments, write medical records, issue prescriptions, run treatment plans (follow-ups, reminders, final reviews), work the alerts queue, message patients | The **Clinical work** dashboard |
| **Administrator** | Everything staff can do, plus: manage products/doctors/orders/testimonials/blog/subscribers/videos, assign MRNs, promote staff, run backups | The **Clinic admin** dashboard + full patient area |

> **Language:** the whole public site is bilingual **English / Français** (switch in the top bar, or via the floating EN/FR button on mobile). The account/auth screens and the dashboards are currently English-only.

---

## 2. Technology Stack & Infrastructure

Everything behind the live site, provided and managed by **Cameroon Digital Agency**:

| Layer | Technology | What it does here |
|---|---|---|
| **Framework** | **Next.js 16** (App Router, Turbopack) | Renders every page, API routes, server components, metadata/SEO |
| **UI** | React 19 + TypeScript 5.7 | Components, strong typing |
| **Styling** | Tailwind CSS 4 | Design system, responsive layout |
| **Animations** | framer-motion / motion | Scroll reveals, carousels, drawer menu |
| **Database** | **MongoDB Atlas** (cloud cluster) | Stores users, products, orders, records, plans, messages, content |
| **ODM** | Mongoose 9 | Data models & validation |
| **Hosting** | **Vercel** | Deploys the site, serves it worldwide, runs the **scheduled backup cron** |
| **Email** | **Zoho Mail (SMTP)** + Nodemailer | Sends verification, order, appointment, record, prescription, plan and backup emails from **info@s19herbalclinic.com** |
| **Images / files** | **Cloudinary** | Stores avatars, ID documents, glucose-meter photos, product photos, blog covers |
| **Auto-translation** | **MyMemory API** (free tier) | One-click French translation of testimonials in the admin panel |
| **Archived backups** | AWS S3-compatible storage + `age-encryption` + `tar-stream` | Optional end-to-end encrypted immutable archive of the database + Cloudinary originals |
| **Messaging apps** | WhatsApp (`wa.me`) | "Book a consultation", order-by-chat, reminders, support handoffs |
| **Tele-health** | Google Meet / Whereby / video links | Join links on confirmed video appointments |
| **Video reviews** | Google Drive / YouTube / Vimeo | Embedded on the "Live Reviews" page |
| **3D / WebGL** | `ogl` | Decorative visual effects on marketing pages |
| **Utilities** | react-hot-toast, react-icons, clsx, tailwind-merge, bson, dotenv | Notifications, icons, helpers |
| **Tooling** | TypeScript, ESLint, `tsx` scripts (seeds, admin creation, backups) | Development & maintenance |
| **SEO** | `sitemap.xml`, `robots.txt`, OpenGraph/metadata, `NEXT_PUBLIC_SITE_URL` | Search engines & social sharing |

**Environment & hosting overview:** source code in GitHub (`s19-herbal-clinic`) → deployed automatically to **Vercel** → production domain **www.s19herbalclinic.com**. A Vercel Cron job calls the backup API daily; a `CRON_SECRET` protects it.

---

## 3. The Public Website (Visitors)

You do not need an account for any of this.

### 3.1 Main navigation

| Menu | Page | Purpose |
|---|---|---|
| Home | `/` | Hero, videos, programs, featured remedies, booking form, stories, FAQ |
| Programs | `/programs` | Treatment programs (diabetes, hypertension, women's health…) |
| Tele-Health | `/telehealth` | Online consultation service |
| Shop | `/shop` | The product catalog |
| Blog | `/blog` | Health articles |
| Videos | `/live-reviews` | Video patient reviews |
| Testimonials | `/patient-stories` | Written stories + submit yours |
| About | `/about` | Our approach |
| (icon) Cart | `/cart` | Your shopping cart (shows item count) |
| (icon) Account | `/account` | Sign in / create account / dashboard |
| (button) **Book a Consultation** | `/contact` | Booking form + clinic details |

The footer links to the catalog, blog, health library, stories, live reviews, contact, **Track Your Order**, refund & returns, privacy, terms and cookies. A **WhatsApp bubble** follows you on every page. Phone: **+237 672 595 989**.

### 3.2 Browse and order products

1. Open **Shop**.
2. Use **search**, the **category chips** (All, Treatment Packs, Herbal Teas, Extracts & Oils, Wine, Wellness Essentials, Merch & Branded) or the **sort** dropdown (Featured, price, name).
3. Open a product to see description, benefits and usage.
4. Three ways to order:
   - **Add to cart** → open the **cart** → **Proceed to Checkout** (full flow in §3.3). Your cart is saved even if you leave.
   - **Order via WhatsApp** — the cart always offers this shortcut.
   - **Alternative order** (no account needed) — on the product/shop pages, click **"Send a screenshot on WhatsApp"** or **"Email: info@s19herbalclinic.com"**.
   - Products marked **"Contact S19 for pricing"** are quote-only: they use a direct WhatsApp order link instead of the cart.

### 3.3 Checkout step by step

1. In the cart click **Proceed to Checkout**.
2. **Step 1 — Contact & Delivery:** Full name, Phone/WhatsApp, Email (all required).
3. **Step 2 — Delivery mode** (choose one):
   - **Clinic Pickup (Bafoussam)** — free
   - **Cameroon Nationwide** — delivery fee shown at checkout
   - **Worldwide** — fee confirmed after order
4. For delivery (not pickup) also fill **City / Country** and **Delivery Address** (required).
5. **Step 3 — Payment method** (choose one): MTN Mobile Money · Orange Money · Bank Transfer · Pay on Pickup or Delivery.
6. Optional **Order Notes**.
7. Review the **Order Summary** and click **Place Order**.
8. You are taken to your **order confirmation page** with a reference like `S19-20260101-AB12C` — keep it safe.
9. Payment is settled with the clinic directly (e.g. mobile-money transfer); the clinic marks it received on their side. You can also reach them on WhatsApp for the payment handshake.

> No credit/debit cards are processed on the site. Also, if the clinic confirms delivery together with you, amounts owed appear in the patient portal as payment reminders (see §5.7).

### 3.4 Track an order

1. Open **Track Your Order** (footer or `/track`).
2. Enter your **Order Reference** and the **Email used at checkout**.
3. Click **Track Order** — you see the current status (Pending / Processing / Ready for Pickup / Out for Delivery / Delivered / Cancelled) and history.

### 3.5 Book a consultation (public form)

On the home page or the **Contact** page:

1. **Full Name** (required), **Phone/WhatsApp** (required), Email (optional).
2. **Consultation Mode**: Telehealth (Online / WhatsApp / Call) or In-Clinic Visit.
3. **Primary Health Concern**: diabetes, hypertension, prostate, women's health, gastritis, liver, cancer, general, or Other (type it).
4. Optionally describe **Symptoms / Previous treatments**.
5. Click **Submit & Connect to Dr on WhatsApp**.
6. You see "Request received" and a **Connect with Dr on WhatsApp** button (pre-filled message) — the clinic also gets your request by email.

> A consultation fee applies — it is displayed on the Contact page. Requests are stored as "New" inquiries; the clinic responds by email/WhatsApp.

### 3.6 Subscribe to the newsletter

Enter your email in the **Newsletter** box (home, blog or footer) → **Subscribe** → check your inbox for the welcome email. Unsubscribe anytime with the link in those emails.

### 3.7 Share your story (public)

On **Patient Stories**:

1. Click the submission form. Fields: **Name**, **Rating** (1–5 stars), **City**, Country (optional), **Program or product** that helped, Email (optional), **Your review** (at least 20 characters).
2. Click **Submit for review**.
3. Your story goes to **"pending"** — it appears publicly only after the clinic **approves** it (they also email you when it goes live). Reviews are moderated.

### 3.8 Blog, health library, videos

- **Blog** — search and filter articles (All / Featured), read articles in EN or FR.
- **Health Library** — browse and search health topics.
- **Live Reviews** — play video reviews (Google Drive/YouTube/Vimeo). If a Drive video does not play, it must be shared with "Anyone with the link" (the clinic can re-share it).

---

## 4. Accounts: Register, Verify, Sign In, Reset

Go to **/account** (the "My Account" icon).

### 4.1 Create an account

1. Click the **Create account** tab.
2. Fill **Full Name**, **Email**, **Password** (at least 8 characters) and **Confirm Password**.
3. Click **Create account**.
4. You are **not signed in yet**. Check the inbox of that email for the verification link *(sent from info@s19herbalclinic.com, valid 72 hours)* and open it.
5. Return to **/account** and **Sign in**.

> If the link expired, sign in anyway and click **"resend it"** on the dashboard banner (or use "Resend verification email" on the verify page).

### 4.2 Sign in / sign out

- **Sign in** with email + password. (Admins sign in with the admin address.)
- **Forgot your password?** → enter your email → click the reset link in the email (valid 1 hour) → choose a **new password** → sign in.
- **Sign out** — sidebar/drawer footer button, or Settings → Sign out.

### 4.3 Email verification status

Unverified accounts see a banner: *"Your email is not verified yet…"*. Some features (like being promoted to staff) require a verified email, so verify as soon as possible.

---

## 5. Patient Dashboard — Every Tab in Detail

After signing in you land on the **Dashboard**. On desktop use the **left sidebar**; on mobile use the **top-left ☰ menu** or the **bottom navigation bar** (labels are shorter there — e.g. "Home", "Bookings", "Inbox", "Rx", "Plan", "Stories").

Your **10 tabs** are:

| 1. Dashboard | 2. Appointments | 3. Orders | 4. Messages | 5. Medical Records |
| 6. Prescriptions | 7. Treatment Plan | 8. Family | 9. Your Stories | 10. Settings |

### 5.1 Dashboard (overview)

- **Stat cards** (each jumps to its tab): Orders placed · Unread messages · Your stories · Account (verified status).
- **Treatment Plan** card: your active plan with "Month X of Y", "N day(s) left", and a **View treatment timeline** link.
- **Recent Orders** (top 3) and **Messages from the Clinic** (top 3, unread highlighted).
- **Your Story** card with **Share another story**.
- **Quick Actions** — 8 tiles: Book appointment, Rate your visit, View orders, Read messages, Medical records, Prescriptions, Family profile, Account settings.
- **Need help?** — WhatsApp chat, hours (Mon–Sat 8AM–6PM), address, **info@s19herbalclinic.com**.

### 5.2 Appointments

**Book an appointment:**

1. Click **Book appointment** (in-clinic) or **Book video visit** (telehealth).
2. **Step 1 — Doctor:** choose from the dropdown (each option shows name · specialty).
3. **Step 2 — Date:** pick a future date (cannot be in the past).
4. The **Available times** chips load for that doctor/day — click a time (it turns dark green).
5. **Consultation mode:** In-clinic (Bafoussam clinic) or Video call (Telehealth).
6. **Who is the visit for?:** Myself, or a family member (if you have added one).
7. **Health concern (optional):** choose from the list (diabetes, heart, prostate, women's, digestion, liver/kidney, cancer care, general).
8. **Notes for the clinic (optional)** — up to 500 characters.
9. Click **Request appointment**.

The clinic receives it; your status is **"Awaiting confirmation"**, you get a confirmation email and a message in your Inbox. For **video** visits, the clinic shares a **join link** — it appears on the appointment card as **Join consultation** once confirmed.

**Reschedule:** on the card click **Reschedule** → pick a **New date** and **New time** → **Confirm reschedule**. The appointment returns to "Awaiting confirmation" and the old video link is cleared.

**Cancel:** click **Cancel appointment** → confirm **"Cancel this appointment?"**.

**WhatsApp reminder:** on the card click **Set WhatsApp reminder** — a pre-filled reminder message opens in WhatsApp; just send it.

**Statuses:** Awaiting confirmation → Confirmed → Completed (or Cancelled).

### 5.3 Orders

- Full order history with reference, date, item count, FCFA total and status badge.
- Click **View & track** on any order for details and tracking.
- Header button **Browse catalog** to shop more.

### 5.4 Messages

- **New message** (top right): **Subject** (≤120 chars) + **Message** (2–5,000 chars) → **Send**.
- Each conversation is a row (unread = gold dot; last line shows "You:" or "Clinic:"). **Click the row to open** — it marks clinic messages as read.
- Reply inside the thread with the **Reply** box → **Send reply**. Bubbles are labelled "You" and "S19 Clinic".
- The clinic uses this channel for order updates, reports, appointment confirmations, records, prescriptions and treatment notices.

### 5.5 Medical Records

- Your visits, diagnoses, lab results, scans and clinical notes (family filter chips appear if you have family members).
- Click a record to expand: **Diagnosis**, **Results**, **Notes**, **Attachments** (open links).
- **Download PDF** on any record — prints a clean, branded copy (choose "Save as PDF" in the print dialog).
- Records are only visible to you and the clinic team.

### 5.6 Prescriptions

- Tabs **Current** (active) and **Past** (expired), with family filters.
- Expand a prescription to see the medication table (**Medication / Dosage / Frequency / Duration**), **Directions**, and **Notes**.
- **Photos**: where the clinic has attached one, you see a thumbnail on the prescription card and a larger picture next to each medicine, so you can match it to the box or bottle on your shelf. A single photo of the whole prescription may also appear at the top.
- **Download PDF** to keep a copy.

### 5.7 Treatment Plan

This is your **personal treatment dashboard** — timeline, today's tasks, glucose logging and progress all in one place.

**Plan status:** Active Treatment (with day counter) / Scheduled (awaiting start) / Treatment Period Ended (final review pending) / Completed (with final-review outcome: maintenance, extended, or closed).

**Today's tasks & reminders:**
- Rows show payment/installment reminders (with the FCFA amount the clinic set), refill dates, follow-up calls, lab tests, daily monitoring.
- Each row shows **Due today** / **Overdue** / **Due \<date>**.
- Click **Done** when you complete a task (it moves to "Recently done"). Overdue items also alert the clinic.

**Glucose monitoring (only if your plan requires it):**
- You must log **Fasting (6–10 AM)** and **2h post-lunch** readings in the windows the clinic set.
- Click **Log reading** → choose **Reading type** → enter **Reading (mg/dL)** (10–900) → optionally **What did you eat?** (post-lunch only) → optionally **Photo of the glucose meter result** (max 6 MB) → **Save reading**.
- Your last 6 readings show with a level chip — **Normal / Elevated / High** — and a **View photo** link when a meter photo was attached.

**Treatment progress:** a dated timeline of the clinic's follow-ups — Baseline, Month 1, 2…, Final assessment — each with improvements, symptom chips (Resolved / Improved / Persistent / New / Adverse), vitals, labs and notes.

### 5.8 Family

- **Add family member:** Full name (required), Date of birth, Gender, Relationship (Child/Spouse/Parent/Sibling/Other), Notes (optional) → **Add member**.
- Edit (pencil) or Remove (bin) any member.
- Family members appear everywhere relevant: the **"Who is the visit for?"** dropdown when booking, and filter chips in Medical Records & Prescriptions. The clinic can also record records/prescriptions/plans "for" a member.

### 5.9 Your Stories

- **Drop a testimony**: Name (pre-filled), City, Country (optional), Program or Product, Rating (stars), Your Testimony (≥20 chars) → **Submit for review**.
- Status badges: **Pending review** → **Approved & live** → **Not approved**.
- Approved stories also appear on the public Patient Stories page and the home-page marquee.

### 5.10 Settings

Five cards:

1. **Profile photo** — **Upload photo** (JPG/PNG/WebP/AVIF, max 4 MB) or **Remove**. No photo = your initials monogram.
2. **Profile** — includes your **Medical Record Number (MRN)** at the top:
   - If assigned, it shows large (e.g. `S1900617`); otherwise *"Not assigned yet"*.
   - **The MRN is managed by the clinic and cannot be changed from this page** — ask the clinic to change it.
   - Editable: **Full Name**, **Phone / WhatsApp**, **Date of Birth**, **Gender**, **Home Address**, and an **Emergency contact** (Name / Phone / Relationship).
   - **Notifications** — tick **Send me WhatsApp notifications** to also be alerted on your phone about appointment confirmations and changes, order updates, new prescriptions, medical records, treatment plans and clinic messages. You can turn it off at any time. The tick box stays disabled until you have saved a phone number. **Message language** (English / Français) chooses the language of these WhatsApp messages only; it does not change your dashboard language.
   - **Email** is shown disabled — it is your sign-in and cannot be changed here.
   - **Save profile** to apply.
3. **ID document** — upload **Front** and **Back** of your NIN, passport or birth certificate (JPG/PNG/WebP/AVIF/PDF, max 8 MB per side). A preview appears first, then **Upload & save** (or Cancel). You can **Replace** or **Remove** each side later.
4. **Change password** — Current Password + New Password (≥8 chars) + Confirm → **Update password**.
5. **Sign out.**

---

## 6. Staff (Doctor) Dashboard — Clinical Work

Staff accounts see a **"Clinical work"** section with **6 tabs** plus Settings. (After a role change, sign out and sign back in to see the new tabs.)

| Tab | Purpose |
|---|---|
| Appointments | Confirm, complete or cancel patient bookings; add video links |
| Medical Records | Log visits, diagnoses, lab results and scans |
| Prescriptions | Issue treatment plans with dosage instructions |
| Treatment Plans | Timelines, progress notes, reminders/installments, glucose review, final reviews |
| Treatment Alerts | Missed glucose, overdue payments, missed follow-ups, treatments ending |
| Patients & Messages | Find any patient, read and reply to conversations |

### 6.1 Appointments

1. Filter: **Upcoming & active / Pending / Confirmed / Completed / Cancelled**.
2. On a card you see patient (name, email, phone), doctor, specialty, **Video** badge, family-member badge, status, date/time, concern.
3. **Pending** → click **Confirm** (patient emailed + messaged).
4. **Confirmed** → click **Mark complete** after the consultation.
5. **Cancel** (with confirmation) to void a booking.
6. For a **video** appointment: paste the meeting link (Google Meet, Whereby, WhatsApp video…) into **Consultation link** → **Save link**. The patient receives the join link in their Messages on confirmation.

### 6.2 Medical Records

- **Add record**: choose **Patient** (shows name · email · MRN), **Record type** (Visit / Diagnosis / Lab result / Scan / Clinical note), **Date** (no future dates), **Title**, optional **Doctor / clinician**, **For family member**, **Diagnosis / findings**, **Results**, **Doctor's notes**, and optional **Attachments** (Name + URL rows, http/https).
- **Add record** — the patient is notified in-app and by email.
- Existing records: expand, **Edit** or **Delete**.

### 6.3 Prescriptions

- **Issue prescription**: **Patient** (required), **Issued date**, **Valid until**, **Doctor / clinician**, **For family member**, **Status** (Active / Past), and an optional **Prescription photo**.
- Under **Medications**, add at least one row: **Medication (required)**, **Dosage (required)**, **Frequency (required)**, optional **Duration**, **Instructions** and **Medication photo** — use **Add medication** for each additional drug, bin icon to remove.
- **Photos** are how the patient knows exactly which product you mean. For each medicine, paste an image URL or click **Upload** to send a photo from your device (JPG, PNG, WebP, AVIF or GIF, under 5 MB — it is stored on Cloudinary). Photograph the real box or bottle, straight-on and well lit. The **Prescription photo** field is for a single shot of the whole kit. Only `http`/`https` image URLs are stored.
- optional **Notes** → **Issue prescription**. Patient is notified. Expand rows to edit/delete or review the dosage table and directions.

### 6.4 Treatment Plans

**Create a plan:**
1. **New treatment plan** → choose **Patient**, optional **For family member**.
2. **Plan name** (required), optional **Program**.
3. **Start date** + **End date** (required) — quick duration buttons: 3/6/9/12 months auto-fill the end date.
4. Tick **Require daily glucose monitoring** if needed and set the **fasting** (default 06:00–10:00) and **post-lunch** (default 14:00–16:00) windows.
5. Optional **Notes** → **Create plan** (patient notified by email + dashboard message).

**Run the plan:**
- **Progress notes (follow-ups)** → **Add follow-up**: Date, **Milestone** (Baseline / Monthly check-in / Final assessment / Other + label), Improvements, symptom lists (resolved / improved / persistent / new / adverse reactions), **Vitals** (weight, BP, glucose), Follow-up labs, Clinician notes → **Record follow-up**.
- **Reminders & installments** → **Add reminder**: **Type** (Payment/installment, Renewal/refill, Appointment/follow-up call, Laboratory test, Daily monitoring, Other), **Title**, **Due date**, **Amount (FCFA)** for payment reminders, Notes → **Create reminder**. Mark **Done**/**Reopen** as they clear; overdue items feed the alerts.
- **Glucose readings** panel (read-only): recent readings with **concerning** flags and meter-photo links.

**Final review / close-out (when the period ends):**
1. Click **Final review** → choose **Outcome**: Completed programme / Proceeds to maintenance / Extends treatment / Discontinued.
2. Add Follow-up labs, Improvements, Resolved / Unresolved problems, Complications, Notes.
3. Click **Close treatment**. The plan becomes **Completed** and the patient sees the outcome.
4. Premature? Click **Reopen** to make it active again.

### 6.5 Treatment Alerts

- Live queue with severity tiles: **Need attention** (high — final review due, overdue payments, concerning readings, missed follow-ups), **Review soon** (medium), **Monitor** (low — e.g. treatments ending soon).
- Click the **Treatment Plans** link on any alert to jump straight to the plan and act (record the follow-up, close out, mark reminders done).
- **Refresh** to re-evaluate.

### 6.6 Patients & Messages

- Search any patient by **name, email, phone or MRN**.
- Each row shows MRN chip (if assigned), contact info, order count, new replies, unread count, last login.
- Click **Message** (or **Conversations (N new)**) to open the thread panel.
- **New message** (subject + body) or type in **Reply** → **Send reply**.
- *(MRN assignment/editing is an admin-only action — see §7.10.)*

---

## 7. Administrator Dashboard — Clinic Admin

Admins see everything under **My account** (the 10 patient tabs) **plus** the 16-tab **Clinic admin** section:

Products · Staff · Appointments · Medical Records · Prescriptions · Treatment Plans · Treatment Alerts · Orders · Testimonials · Users · Users & Messages · Blog · Subscribers · Live Reviews · Staff & Roles · Data Backups · Error Log

**Two user screens, on purpose.** **Users** (§7.10) is the full directory — every account, every detail, searchable by name, email, phone or MRN. **Users & Messages** (§7.11) is the chat view. They are separate because they answer different questions, and merging them would either hide the clinic's own accounts or drag a patient's address into a messaging pane.

### 7.1 Products

- List with **Featured** and **Visible** toggles (per row), edit (pencil) and delete (bin, with confirm).
- **Add product** form: **Slug** (auto-generated from the English name), **Price (FCFA)** — enter **0** to show "Contact S19 for pricing", **Stock**, then the full English block (**Name**, **Category**, **Short description**, **Description**, Usage, Ingredients, Badge, Unit) and the parallel **French block** (Nom, Catégorie, Description courte, Description, Mode d'emploi, Ingrédients, Badge, Unité).
- **Image**: paste an **Image URL** or click **Upload** (stores on Cloudinary and fills the URL).
- Tick **Featured on home catalog** / **Visible in shop** → **Create product** (or **Save changes**).

### 7.2 Staff

- Clinic team members shown with specialty and weekly availability ("available N day(s)/week"); hidden staff members carry a **Hidden** badge.
- **Add staff member**: **Name**, **Specialty** (+ French), Phone, Photo URL, Sort order, Bio (EN/FR).
- **Weekly availability**: **Add day** per working day → Day (Sun–Sat), Start, End, **Slot (min)** (15–120).
- **Accepting bookings** controls whether the staff member appears in the patient booking screen.
- Toggle **Active** to hide/show; edit or delete rows.

### 7.3 Appointments

Same clinical flow as staff (§6.1) — full filter set and confirm/complete/cancel/video-link actions, plus slot conflict checking when dates/times change.

### 7.4 Medical Records — see §6.2 (identical).

### 7.5 Prescriptions — see §6.3 (identical).

### 7.6 Treatment Plans — see §6.4 (identical, plus alerts).

### 7.7 Treatment Alerts — see §6.5 (identical).

### 7.8 Orders

- Filter chips: **All / Pending / Processing / Ready for Pickup / Out for Delivery / Delivered / Cancelled**; **Refresh**.
- Per order: set **Order status** (customer is emailed automatically on each change).
- Tick **Payment received** when funds clear (label flips to **Payment unpaid** when off).
- Type the **Reference / receipt no.** (e.g. mobile-money transaction id) — saved automatically.
- **Message customer** opens an inline composer ("About your order \<ref>") — guest orders (no account) show *"Guest order — customer has no account to message"*, so use WhatsApp/email for them.

### 7.9 Testimonials

- Filter chips **Pending / Approved / Rejected / All**.
- **Approve** → story goes live on the site *and the author is emailed*. **Reject** or **Delete** as needed.
- **Auto-translate to French** fills the French program + text via the MyMemory API (edit by hand if the machine translation needs fixing); a "French translation added" marker appears once `textFr` exists.
- **Add manually**: name*, city*, country, program/concern*, text* (≥20 chars), email, video URL, rating, and the optional French block; status **Save as pending** or **Approve immediately**.

### 7.10 Users

The full account directory. **Administrators only.**

Unlike **Staff & Roles** (§7.15), which deliberately hides the account you are signed in as, and **Users & Messages** (§7.11), which is a chat view, this screen lists **every account on the site — patients, staff and administrators alike** — with the details the clinic needs to recognise someone who walks in.

**Search and filter**

- One box searches **name, email, phone or MRN** at once. An empty box shows everyone.
- **Account type**: All / Patients / Staff / Administrators.
- **Missing an MRN**: the list of patients who have no file number yet. This is the worklist for issuing numbers.

**Medical Record Number**

The MRN sits on the same line as the name, because that is how the clinic actually calls a patient — name plus file number.

- The number is shown in a dark chip so it is readable at a glance; patients without one show an amber **No MRN** chip rather than a blank.
- **Search by MRN** works from the same box as names and emails.
- **Assign MRN / Change MRN** opens an inline field (`S1900615`). **Remove** clears it.
- Two patients can never hold the same number — duplicates are refused with a clear error, and a unique database index is the backstop if two administrators ever act at the same instant.
- **Every** assign, change and removal is written to the audit log with who did it and when.
- Administrator accounts never receive an MRN, and the screen says so rather than offering an empty field.

**Account details**

**Details** opens one person in full: identity (name, email, phone, date of birth, gender, address), account (role, active/disabled, email verified, WhatsApp opt-in, language, last sign-in, joined date), emergency contact, counts of everything on file (records, prescriptions, plans, reminders, follow-ups, readings, appointments, orders, messages, testimonials), ID document images, and family members.

Details load only when opened, so opening the list on a phone does not download every patient's file.

### 7.11 Users & Messages (MRN + messaging)

**Assign an MRN:**
1. Search the user by **name, email, phone or MRN**.
2. Open the user (conversation panel).
3. In the **Medical Record Number** block click **Assign MRN** (or **Edit MRN** if one exists).
4. Type the number (letters/numbers and dashes, auto-uppercased) → **Save**. Duplicates are rejected with a clear error. **Remove** clears it.
5. Every change is recorded in the audit log. Admin accounts never receive an MRN.

**Message a user:** **New message** (subject + body) or reply inside the thread (**Reply** → **Send reply**). Unread clinic messages surface as gold dots.

### 7.12 Blog

- Posts list with **Draft / Published** badges, **Featured** toggles, EN/FR content.
- **New post**: English (**Title**, **Short excerpt**, **Article text**, Author) + French (**Titre**, **Extrait court**, **Texte de l'article**, Auteur) — all required. Slug auto-generates from the title.
- **Cover image**: Upload (Cloudinary) or **Insert image into text** at the cursor.
- **Status**: Save as draft / **Publish immediately**; tick **Featured article** to lead the blog.
- **Publish / Unpublish** toggles visibility; edit or delete any post.

### 7.13 Subscribers

- Newsletter list with subscribed/total counts, search box, **Active** checkbox (subscribe/unsubscribe) and **Remove**.
- **Send to all subscribers**: write **Subject** (2–120) and **Message** (2–5,000) → **Send to all subscribers**. Updates go to subscribers who have active accounts as in-app Messages; the rest are queued for later delivery. A summary line confirms how many went out.

### 7.14 Live Reviews

- Numbered cards in paste order (oldest first) with embedded player and **Visible/Hidden** pill.
- **Paste link** (YouTube / Google Drive / Vimeo) + optional title → goes live immediately. Drive files must be shared "Anyone with the link".
- **Hide / Show**, **Edit** (URL + title), **Delete** per review.

### 7.15 Staff & Roles

- List of all non-admin accounts: name, email, **Active/Disabled**, **Unverified** badge, current role, doctor icon.
- **Make staff** promotes a verified user to **doctor** (they must have verified their email first — otherwise the system asks them to verify). **Make patient** demotes back.
- **Disable** suspends access (all sessions destroyed); **Enable** restores.
- Admins never appear here and cannot be demoted.

### 7.16 Data Backups

- **Configuration cards**: **Emailed backup** (daily, 05:30 UTC, emailed to the clinic inbox) and **Encrypted object-store archive** (Active when configured, otherwise Optional).
- **Run backup now** — take an immediate full-database backup and have it emailed (idempotent per day — no duplicate emails if it already ran).
- **Run history table** — last 30 runs: trigger, docs/collections, size, email status, detail.

### 7.17 Error Log

- **What it is.** Every error the site records, kept in the database for 90 days. The hosting platform's own console is kept for only **1 hour** on the free plan, so this is the copy you can actually come back to.
- **Summary cards** — errors and warnings in the last 24 hours, errors in the last 7 days, and how many entries are currently stored.
- **Daily digest email card** — when the digest last went out, whether it failed, and the most frequent error in that window. Sent with the daily backup at 05:30 UTC.
- **Email digest now** — send the summary immediately without waiting for tomorrow.
- **Filters** — level (errors / warnings), area (e.g. `email`, `whatsapp`, `db`, `admin/orders`), and a free-text search over messages and routes.
- **Entry table** — newest first, with a `×N` badge when the same error repeated inside a minute. Click the arrow on a row to expand the redacted context payload.
- **Patient impact.** When a page fails, the patient sees a friendly bilingual page with a reference code. That code appears in the matching log row, so a patient reporting "it said `a1b2c3`" can be matched to the exact error.
- **Privacy.** Names, email addresses and phone numbers are masked before anything is written. Passwords, tokens and session cookies are never stored. The digest email carries counts and error signatures only — never patient details.

### 7.18 Administrator's own account

Admins also have all 10 patient tabs (Dashboard, Appointments, Orders, Messages, Records, Prescriptions, Treatment Plan, Family, Stories, Settings) so they can experience (and test) the patient side and manage their own profile.

---

## 8. Feature Breakdown — Everything We Built

A complete inventory of what **Cameroon Digital Agency** implemented to take this site live:

**Public website**
- Bilingual EN/FR site (language switch + locale cookie), responsive on all devices
- Home page: hero, video carousel, programs strip, featured remedies, booking form, testimonials marquee, location, FAQ, CTA band, referral block
- Marketing pages: About, Programs, Tele-Health, Location, Health Library
- Shop: catalog with search, category chips, sorting; product detail pages; "Contact for pricing" products; related products rail
- Cart (persists locally + syncs when signed in), full checkout, order confirmation page
- Order tracking by reference + email
- Blog: listing with search + featured filter, bilingual articles
- Patient Stories: public grid + moderated submission form
- Live Reviews: video wall (YouTube/Drive/Vimeo proxied streaming) + **Testimonials** button across to the written stories
- **Patient Video Testimonial & Privacy Disclaimer** on the Live Reviews video page only (consent is voluntary, taking part is optional, anyone who prefers privacy is never published, nothing goes out without authorisation)
- Booking/contact form → inquiry + email + WhatsApp handoff
- Newsletter subscribe/unsubscribe
- Legal pages: privacy, terms, cookies, refund & returns
- SEO: sitemap, robots, metadata/OG tags; 404 and loading states

**Accounts & security**
- Register (with rate limiting), email verification (72 h tokens), login/logout with secure session cookie, forgot/reset password (1 h tokens)
- Password hashing (scrypt), role-based access control on every API route
- Avatar + ID-document uploads (validated types/sizes, upload rate limits, 512×512 face-crop avatars)

**E-commerce operations**
- Order lifecycle (Pending → Processing → Ready for Pickup → Out for Delivery → Delivered / Cancelled) with automatic customer emails
- Payment reconciliation (MTN / Orange / Bank / Pay-on-pickup) with receipt reference, customer messaging per order

**Clinical platform (patient portal)**
- Appointments: availability engine (doctor schedules, slot conflicts), book/reschedule/cancel, video join links, WhatsApp reminders, family-member booking
- Medical records (visits, diagnoses, labs, scans) with attachments and PDF download
- Prescriptions with dosage tables, directions, PDF download
- Treatment plans: timelines, progress notes/follow-ups with vitals and symptom tracking, reminders & installments, final reviews with outcomes (maintenance/extended/discontinued), reopen
- Glucose monitoring: fasting/post-lunch logging with meter-photo upload, severity classification, readings history
- Treatment alerts engine: missed glucose, overdue payments, missed follow-ups, concerning readings, treatments ending, complications
- Family member profiles
- In-app messaging (patient ↔ clinic threads) with unread tracking

**Admin & content**
- Products, Doctors (with weekly availability), Blog (bilingual publish workflow), Subscribers + broadcasts, Live Reviews, Testimonials moderation + **MyMemory auto-translation**
- **Users directory** — every account (patients, staff, administrators) with full details, searchable by name, email, phone or MRN, filterable by account type and by "missing an MRN"; on-demand per-account detail (identity, emergency contact, record counts, ID documents, family members)
- **MRN assignment with audit trail** (assign/change/remove) — admin-only, duplicate-proof, never given to an administrator account
- Staff & Roles management (promote verified users to doctors; disable/enable)
- Orders management, backups console

**Reliability & operations**
- Daily automated email backups + manual "backup now" (idempotent), lease recovery, optional age-encrypted S3 archive
- Vercel Cron scheduled jobs with secret-key protection
- Rate limiting on sensitive endpoints, input validation everywhere, error handling + user-friendly messages

---

## 9. Emails & Notifications System

All transactional mail is sent by **Zoho Mail** (from **info@s19herbalclinic.com**). Two copies are sent for orders (customer + clinic).

| Email | Triggered when |
|---|---|
| Verification email (+ resend) | Account registration |
| New account notification | Someone registers (to the clinic) |
| Password reset link | Forgot password requested |
| Order confirmation | Order placed (customer + clinic) |
| Booking notification | Public consultation form submitted (clinic, + customer if email given) |
| Newsletter welcome | Newsletter subscribed |
| Appointment confirmation / reschedule / cancellation | Clinic confirms, patient reschedules, or either party cancels |
| Medical record added | Staff adds a record |
| Prescription issued | Staff issues a prescription |
| Treatment plan created | Staff creates a plan |
| Treatment progress update | Staff records a follow-up |
| Treatment closed / reopened | Final review recorded or plan reopened |
| Order status changed | Clinic changes order status |
| Payment received / installments | Clinic records payments |
| Message notifications | Clinic ↔ patient messages |
| Testimonial approved | Admin approves a story |
| Backup delivered | Daily or manual backup run |
| Error digest delivered | Daily 05:30 UTC error summary |

---

## 10. Operations & Maintenance

**Backups**
- The database is backed up **daily at 05:30 UTC** and emailed to the clinic inbox (admin-only tab **Data Backups** to monitor or run manually).
- Optional: an **encrypted archive** (age-encrypted bundle, object-locked on S3-compatible storage) including Cloudinary originals — activated via environment variables.
- Manual backups are idempotent: only one email per day.

**Error log & monitoring**
- Every `console.error` / `console.warn` in the codebase, plus every unhandled server error, is recorded in the database and kept **90 days** (admin-only tab **Error Log**). This exists because the hosting platform keeps its own console for only **1 hour** on the free plan.
- A **digest email** arrives with the daily backup summarising the previous 24 hours. It is sent every day, including when there is nothing wrong, so a missing digest is itself a signal.
- Failed emails and WhatsApp sends appear here per recipient, which is currently the only way to see them — there is no delivery-status webhook.
- Full details, including what is redacted before storage, are in [LOGGING_AND_MONITORING.md](LOGGING_AND_MONITORING.md).

**Deployments**
- Push to the GitHub repo → Vercel builds and deploys automatically.
- Sensitive configuration (Mongo, SMTP, Cloudinary, backup secrets, `CRON_SECRET`) lives in environment variables — never in the repository.

**Images & media**
- Patient photos, ID cards and glucose-meter photos upload to **Cloudinary**; blog covers and product images too. All migrated and centralized on the clinic's Cloudinary account.

**Monitoring**
- The **Treatment Alerts** tab is the daily clinical work queue; Data Backups shows backup health; audit entries are recorded for MRN changes.

---

## 11. Roles & Permissions Reference

| Capability | Patient | Doctor | Admin |
|---|---|---|---|
| Patient dashboard (10 tabs) | ✅ | — | ✅ |
| Book/reschedule/cancel own appointments | ✅ | — | ✅ (own) |
| Confirm/complete/cancel any appointment | ❌ | ✅ | ✅ |
| Add video meeting links | ❌ | ✅ | ✅ |
| View own records/prescriptions/plan | ✅ | — | ✅ |
| Write records, issue prescriptions, run plans | ❌ | ✅ | ✅ |
| Log glucose readings | ✅ (own) | read-only | read-only |
| Treatment alerts queue | ❌ | ✅ | ✅ |
| Message the clinic / message patients | ✅ | ✅ | ✅ |
| Assign/edit/remove MRN | ❌ | ❌ | ✅ |
| Manage products, doctors, orders, blog, subscribers, videos | ❌ | ❌ | ✅ |
| Moderate testimonials (+ auto-translate FR) | ❌ | ❌ | ✅ |
| Promote/demote staff, disable accounts | ❌ | ❌ | ✅ |
| Run backups / view backup history | ❌ | ❌ | ✅ |
| Access **Clinic admin** section | ❌ | ❌ | ✅ |

---

## 12. Support

**Clinic (business as usual)**
- WhatsApp: **+237 672 595 989** · Call: **+237 672 595 989** · Email: **info@s19herbalclinic.com**
- Hours: Mon–Sat, 8:00–18:00 · Immeuble Cathédrale, 3rd Floor, Apartment E305, Bafoussam, Cameroon
- Instagram: @s19_kingofcure · Facebook: S19 Herbal Clinic

**Technical support (website)**
- Developed, deployed and maintained by **Cameroon Digital Agency** — for anything related to the platform itself (accounts, emails, backups, new features), contact the development agency.

---

*End of manual — S19 Herbal Clinic · Built by Cameroon Digital Agency · 2026*