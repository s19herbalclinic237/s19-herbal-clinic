# WhatsApp notifications (Meta Cloud API)

S19 Herbal Clinic can notify patients on WhatsApp for the same events it already
emails about. This document is the setup runbook: what the code needs from you,
how to create the message templates, and what it will and will not do.

**Status: built and dormant.** Every code path is in place and type-checked, but
nothing is sent until the environment variables below are set and the templates
are approved in the WhatsApp Manager. Until then the calls are silent no-ops —
the clinic behaves exactly as before.

---

## 1. What you need from Meta

| Item | What it is | Where to get it |
| --- | --- | --- |
| Meta Business Portfolio | The business account that owns the number | business.facebook.com |
| WhatsApp Business Account (WABA) | The account that holds templates and the phone number | WhatsApp Manager → Accounts |
| Sending phone number | A dedicated number for the API | Add a number inside the WABA |
| Phone Number ID | The number's API identifier | WhatsApp Manager → Phone numbers |
| Permanent access token | A System User token (a temporary one expires in 24h) | Business Settings → Users → System Users → generate token for `whatsapp_business_messaging` |
| Business verification | Legal name, website, registration documents | Business Settings → Security |

Two practical notes:

- **Use a dedicated number.** The clinic's everyday WhatsApp Business App number
  can be migrated onto a WABA, but only after it is removed from the app. Until
  that migration is done, keep using the app for manual replies.
- **You can send while unverified**, capped at 250 business-initiated
  conversations per rolling 24 hours. Completing business verification raises
  that and improves your quality rating, which is what buys you more headroom.

## 1a. Screen-by-screen setup

### Step 0 — Decide on the number, first

This is the one decision that causes the most pain later, so settle it up front.

- **Best: a brand-new number that has never been on WhatsApp.** A SIM with its own
  number, able to receive an SMS or a voice call. Cleanest path, no migration.
- **Or: migrate your existing WhatsApp Business App number.** Possible, but the
  number must be **deleted from the WhatsApp Business App first**. Until you do
  that, Meta refuses to register it and you get a vague error.
- **Not possible: a number that is someone's personal WhatsApp.** Personal
  accounts cannot be moved.
- The number must receive a **6-digit verification code by SMS or automated voice
  call** during setup. Landlines and some prepaid SIMs fail this step.

Also decide the **display name** patients will see. Meta reviews it. Use the
clinic's real name — do not put "WhatsApp", "Meta", "Official" or "Verified" in
it, or it will be rejected.

### Step 1 — Register as a Meta developer

Go to <https://developers.facebook.com/async/registration/> and register. You
need a Facebook login. Choose the **Business** account type. Free.

### Step 2 — Create the app

1. <https://developers.facebook.com/apps> → **Create App**.
2. Name it (e.g. `S19 Herbal Clinic`) and give your email.
3. Use case: **Connect with customers through WhatsApp** → Next.
4. Select your business portfolio, or create one (name it after the clinic, add
   the clinic website and contact email).
5. **Create app**. You land on *Customize use case → Connect on WhatsApp →
   Quickstart*.

### Step 3 — Create the WABA and add the number

1. Click **Start using the API**. This opens **API Setup**.
2. Connect a WhatsApp Business Account (WABA) — select an existing one or click
   **Create a WhatsApp Business account**. The WABA is the container holding your
   numbers, templates and message history.
3. Add your phone number and verify it with the code Meta sends.
4. **Copy down and keep safe** — you need these later:
   - **WhatsApp Business Account ID (WABA ID)**
   - **Phone number ID**
   - **Test number ID** (only if you use Meta's shared test number)
5. Click **Generate access token** for a **temporary** token and send yourself a
   test message to confirm the plumbing works. That token dies in 24 hours — do
   not put it in the app.

### Step 4 — Set two-step verification

In the same app, enable two-step verification and create a **6-digit PIN**. You
need it to re-register the number in Step 5.

### Step 5 — Register the number (only if it will not show "Connected")

Some numbers sit at **Pending** and refuse to send until explicitly registered.
If that happens:

```
POST https://graph.facebook.com/v23.0/<PHONE_NUMBER_ID>/register
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json

{ "messaging_product": "whatsapp", "pin": "<YOUR-6-DIGIT-PIN>" }
```

A `POST` to the same URL with an empty body deregisters it, if you need to redo it.

### Step 6 — Create the permanent token (the important one)

1. <https://business.facebook.com/latest/settings> → **System users** in the sidebar.
2. **Add +** → create a system user (e.g. `s19-notifications`). Give it the
   **Admin** system-user role if offered.
3. **Assign Assets**:
   - your app → toggle **Full control**
   - your WhatsApp account → toggle **Full control**
   - **Assign assets**
4. **Generate token**, adding these permissions:
   - `business_management`
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
5. **Copy the token immediately — Meta shows it exactly once.** That string is
   `WHATSAPP_ACCESS_TOKEN`.

### Step 7 — Business verification

Business Settings → **Security** → **Business verification** → *Get started*.
Expect: legal business name, business address, phone, website, and a registration
document (in Cameroon, an RCCM / registre du commerce extract or a certificat de
contributable). Clear scans or PDFs.

You can skip this to begin with (capped at 250 business-initiated conversations
per 24h) but it raises limits and quality rating, and Meta increasingly expects it.

### Step 8 — Add a payment method

Meta moved to **per-message billing**, so a payment method is required before
sending to real numbers. Business Settings → **Payments**.

### Step 9 — Create the templates

See §3 below. Create each of the ten in **both** `en` and `fr`, category
**Utility**, and wait for `APPROVED`.

---

## 2. Environment variables

Add to `.env.local` (and to the deployment platform's environment):

```
WHATSAPP_ACCESS_TOKEN=EAAG...            # permanent System User token
WHATSAPP_PHONE_NUMBER_ID=123456789012345  # sending number's ID
WHATSAPP_GRAPH_VERSION=v23.0              # optional, this is the default
WHATSAPP_NAMESPACE=s19                    # optional, template name prefix
```

Then restart the server. Confirm with:

```
GET /api/admin/whatsapp
```

It returns `configured: true`, the number of patients who have opted in, and the
full template list with the exact copy to paste into Meta. Secrets are never
returned by this endpoint.

## 3. Create the message templates

Meta requires every business-initiated message to use a pre-approved template,
so these must be created once by hand. `GET /api/admin/whatsapp` returns the
authoritative list — create each one with the **Utility** category, in both
`en` and `fr`.

| Template name | Placeholders |
| --- | --- |
| `s19_appointment_booked` | `{{1}}` name, `{{2}}` date, `{{3}}` time |
| `s19_appointment_confirmed` | `{{1}}` name, `{{2}}` date, `{{3}}` time |
| `s19_appointment_rescheduled` | `{{1}}` name, `{{2}}` date, `{{3}}` time |
| `s19_appointment_cancelled` | `{{1}}` name, `{{2}}` date |
| `s19_order_placed` | `{{1}}` name, `{{2}}` order reference |
| `s19_order_status` | `{{1}}` name, `{{2}}` reference, `{{3}}` status |
| `s19_prescription_issued` | `{{1}}` name, `{{2}}` medications |
| `s19_record_added` | `{{1}}` name, `{{2}}` record title |
| `s19_treatment_plan` | `{{1}}` name, `{{2}}` plan title, `{{3}}` start date |
| `s19_clinic_message` | `{{1}}` name, `{{2}}` subject |

The placeholder order is fixed in code — `lib/whatsapp.ts` fills them
positionally. If a live template's placeholders are in a different order, the
message will read wrong rather than fail loudly, so copy them exactly as listed.

## 4. Patient consent

Meta requires explicit, recorded opt-in, and a pre-ticked box does not count.

- Patients turn it on themselves in **Settings → Notifications**. The toggle
  stays disabled until a phone number is saved, because consent without a number
  can never be used.
- Consent is stored as `whatsappOptIn` plus a `whatsappOptInAt` timestamp, which
  is the evidence you would show in an audit.
- Each patient also picks a **message language** (English or French) for
  WhatsApp specifically. This is stored on the user record rather than read from
  the site locale, because admin-triggered sends (a prescription issued from the
  clinic dashboard) have no access to the patient's browser cookie.
- Turning the toggle off stops all sends immediately.

## 5. What gets sent

| Event | Template | Trigger |
| --- | --- | --- |
| Appointment booked | `appointment_booked` | Patient books online |
| Appointment confirmed | `appointment_confirmed` | Staff confirms in the dashboard |
| Appointment rescheduled | `appointment_rescheduled` | Patient reschedules |
| Appointment cancelled | `appointment_cancelled` | Patient cancels |
| Order placed | `order_placed` | Checkout completes |
| Order status change | `order_status` | Staff updates an order |
| Prescription issued | `prescription_issued` | Staff issues a prescription |
| Medical record added | `record_added` | Staff adds a record |
| Treatment plan created | `treatment_plan` | Staff creates a plan |
| Clinic message sent | `clinic_message` | Staff messages the patient |

All ten fire alongside the existing email and in-app message — never instead of
them, and a WhatsApp failure can never fail the API call that triggered it.

**Not covered:** guest checkout (no account, so no consent record), marketing and
newsletter sends (Meta classifies these differently and they need their own
opt-in), and treatment/glucose reminders, which stay email-only for now.

## 6. Safety behaviour

`lib/whatsapp.ts` deliberately no-ops rather than failing when:

- the Cloud API variables are not set;
- the patient has not opted in;
- the stored phone number is not a usable international number (fewer than 8
  digits — usually a local number typed without a country code);
- the recipient number is the clinic's own line, which would start a message
  loop.

All of these are normal states, not errors, so the surrounding request always
succeeds. Genuine send failures are logged to the server console as
`[whatsapp] send failed` with the Graph API response.

## 7. Cost, as of Meta's 2026 pricing

Meta bills **per message**, not per conversation, and from **1 October 2026**
service messages and utility templates sent inside the 24-hour customer service
window also become billable (with a small monthly free allowance per number).
Rates vary by category and country — check Meta's pricing page for current
Cameroon figures before committing to volume. At clinic scale the cost is
pennies per month; the operational work is Meta onboarding and keeping template
content in step with clinic policy.

## 8. Still to do before launch

- Submit the ten templates for approval and wait for `APPROVED` status.
- Complete business verification.
- Send a test to Meta's test recipient, then to a consenting patient's own number.
- Add a delivery-status webhook if you want to track failures per patient — not
  built; failures currently only appear in server logs.
- Confirm the wording of each template with the clinic's policy on what may be
  disclosed over WhatsApp, since a locked chat screen is less private than email.

## 9. Credentials checklist

Everything to collect in one place. Only the first two are required to send.

| # | Credential | Where | Required |
| --- | --- | --- | --- |
| 1 | `WHATSAPP_ACCESS_TOKEN` | Business Settings → System users → Generate token | Yes |
| 2 | `WHATSAPP_PHONE_NUMBER_ID` | Developers → your app → API Setup | Yes |
| 3 | WhatsApp Business Account ID | Developers → your app → API Setup | For reference |
| 4 | Business Portfolio ID | Business Settings → Business Portfolio | For reference |
| 5 | App ID / App Secret | Developers → App settings → Basic | For reference |
| 6 | 6-digit two-step PIN | Developers → your app → WhatsApp → Configuration | Only to re-register |
| 7 | Business verification status | Business Settings → Security | Recommended |
| 8 | Ten approved template names | WhatsApp Manager → Message templates | Yes, to deliver |
