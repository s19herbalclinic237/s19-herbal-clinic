# S19 Automation Roadmap — "manage by exception"

**Status:** plan of record · **Updated:** 30 September 2026
**Scope:** the continuous background engine that watches treatment timelines, appointments,
payments, refills, laboratory requirements, patient reporting, adherence, communication and
follow-up — and brings humans only the exceptions.

Every module is numbered, dependency-ordered, independently shippable, and ships with tests.
Nothing here is a rewrite of the existing app; it is additive.

---

## 0. Decisions recorded

**No AI model will be added to this project.** Nothing here calls a language model, and no
patient data leaves the clinic's own infrastructure. Two requested capabilities are re-specified
below as deterministic features rather than dropped, because the underlying need is real and does
not actually require a model:

| Originally requested | Now specified as | Module |
| --- | --- | --- |
| "WhatsApp AI Assistant" for approved routine questions | A **curated self-service assistant**: clinic-authored answers, matched by exact choice, button payload, or keyword. Anything unmatched escalates to a human. | M13 |
| "AI patient summaries" before opening a record | A **deterministic "since your last visit" summary** computed from the `PatientEvent` log: new results, missed readings, overdue items, upcoming refills, outstanding payments. Factual and traceable to the events it cites. | M14 |

This is not only a budget decision, and it is the better engineering answer for this domain:
the questions patients ask are a **fixed, enumerable set** (fees, hours, location, booking,
preparation, payment procedure), so a lookup table is both cheaper and strictly more reliable
than a model — it cannot hallucinate a fee or a dosage. Likewise a patient summary built from
recorded events with citations is *more* trustworthy in a clinical record than a generated
paragraph, because a clinician can check it.

**The SavoirNet PHP payment system is not part of this project.** `docs/GUIDE_PAYMENT_SYSTEM.md`
was copied in as background reading only. Its conclusions are treated as a **list of warnings,
not a design to copy** — that file's own flaw catalogue documents double debits, double
processing, trusting the browser's return URL, and `str_replace` surgery on the API URL. M6
implements the payment flow natively against the rules below and assumes nothing from that
codebase is safe until independently verified. See §7.

**WhatsApp credentials are not set**, so no automated message has ever been sent and no reply has
ever been received. Both halves of the number are still dormant, and they are set independently —
see [WHATSAPP_SETUP.md §9](WHATSAPP_SETUP.md). See
[State and credentials gaps](STATE_AND_CREDENTIALS_GAPS.md).

---

## 1. Can a patient reply to a message sent by automation?

**Yes. M1 is built, and the answer is now "yes" — the reply arrives.**

| Question | Answer before M1 | Answer now |
| --- | --- | --- |
| Does S19 send WhatsApp messages? | Yes — `lib/whatsapp.ts`, 10 approved templates, `en` + `fr`. | Unchanged. |
| Are they actually being sent? | **No.** `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` are unset, so every send is a silent no-op. | Still no — credentials absent. |
| Is there an inbound webhook? | **No.** No route read Meta's `messages` payload. | **Yes** — `app/api/webhooks/whatsapp`, signature-verified, `wamid`-deduped. |
| If a patient replies today? | Meta delivered it to a webhook that did not exist, so **the reply was discarded silently.** | Stored, deduplicated, attributed to the patient, shown to staff. |
| Can the clinic see a reply? | No. | Yes — a read-only staff inbox in the dashboard, `clinicalGuard`-gated. |
| Does the clinic opt a patient out? | Only by a patient turning the toggle off in Settings. | Also by tapping **Stop these messages** or typing `STOP` on WhatsApp, honoured immediately. |

Full detail, including the security reasoning and the live-database verification, is
[WHATSAPP_INBOUND.md](WHATSAPP_INBOUND.md).

What M1 required, and how each requirement was met:

- **A webhook route with Meta's handshake.** `GET` echoes `hub.challenge` verbatim as
  `text/plain` when `hub.verify_token` matches; `POST` receives events.
- **Signature verification** (`X-Hub-Signature-256`) with the app secret. An **unset** secret
  refuses with 503 rather than skipping the check — the same inverted-guard shape that left
  `/api/cron/backups` open on this deployment, and the reason the raw body is read once and never
  re-serialised.
- **The 24-hour window.** Stored as `timestamp + 24h` from Meta's own send time on the
  conversation, and computed on demand by `isServiceWindowOpen()` rather than cached as a boolean.
  Absent or unparseable state reads as *closed*. M2 reads it before every send.
- **Buttons for machine-readable answers.** A closed payload grammar, `s19:<action>`, over
  `confirm`/`question`/`human`/`stop`/`reschedule`/`refill`/`track`. A real button whose action is
  not in the vocabulary is routed to a human, never dropped as invalid.
- **Idempotency.** A unique index on `wamid`, with the insert ordered **before** the side effects.
  Meta's redelivery collides and nothing after it runs. Verified live: three deliveries of the same
  two messages produced `unread: 2`, not 6.

---

## 2. The architectural spine

Everything in the brief is one loop: *a thing happened → a rule decided it matters → a message
went out → someone responded.*

Built feature-by-feature, that becomes 20 subsystems that cannot talk to each other, and the
timeline and the summary both have to be rebuilt from scratch. So the foundation is one
append-only log, and every module is a projection over it.

```
        ┌──────────────┐
        │  any action  │  booking, payment, reading, reply, refill, lab result
        └──────┬───────┘
               │  emits
               ▼
   ┌───────────────────────────┐
   │  PatientEvent  (append)   │  the single source of truth. Never updated, never deleted.
   └───────────┬───────────────┘
               │
     ┌─────────┼──────────┬───────────────┬──────────────┐
     ▼         ▼          ▼               ▼              ▼
  timeline   rules     summary        adherence      worklist
  (M3)      (M2)        (M14)          (M8)           (M10)
```

Four decisions make "more automation later, without a rebuild" real:

1. **`PatientEvent` is append-only.** No feature writes to another feature's tables. The
   timeline, the summary and the adherence score are all *derived*, so they can be rewritten and
   improved without migrating data or touching each other.
2. **Automation rules are data, not code.** An `AutomationRule` is a JSON document (trigger,
   conditions, channel, template, escalate-after). Adding "notify me when an HbA1c is overdue"
   must be a database insert, **not a deploy**. If adding an automation needs a developer, the
   design is wrong.
3. **Every outbound message is an outbox row** with a delivery status and a dedupe key. This is
   what makes "no response → follow up → escalate" reliable, and what protects the number.
4. **Automation can be switched off** — globally and per patient. Staff need one action to stop
   all automated contact for one person (dispute, bereavement, no-contact request). An
   automation you cannot turn off is one you will regret.

---

## 3. Module list

**Legend** — ☐ not started · ◐ in progress · ☑ done and tested · **E** engineer-days ·
**D** blocked by. "Unblocked" means it can be built and fully tested right now.

### Done

- ☑ **M0 — Foundation.** Clinic timezone (`lib/clinic-time.ts`), the `PatientEvent` log, and a
  zero-dependency `node:test` harness. *E 5–6 · unblocked.* 61 tests green.
- ☑ **Security fix — cron endpoint authorization.** `CRON_SECRET` was never set, so the guard
  `if (secret && …)` never fired and `/api/cron/backups` accepted **unauthenticated public
  requests** — exposing a full database export, health records included, to anyone who guessed
  the URL. Now fail-closed via `lib/cron-auth.ts`, timing-safe, logged to the daily digest, and
  unit tested. *E 0.5.* **Deployed 30 September 2026** — the variable is set in Vercel and
  `/api/cron/backups` returns 401, so the nightly backup is live. `vercel.json` also now
  schedules `/api/cron/outbound` daily at 09:00 UTC — **once per day, not every 5 minutes**,
  because Vercel's Hobby plan rejects sub-daily cron expressions at deploy time. See
  `STATE_AND_CREDENTIALS_GAPS.md` §0.3 for the options and what each costs.

### Next — unblocked, no external state needed

- ☑ **M18 — Brand content.** About page, home page, positioning copy. Applied and tested.
- ☑ **M17 — Image SEO.** Complete. See `docs/IMAGE_SEO.md` for the audit, what changed and
  what is deliberately left undone.
- ☐ **M1 — Inbound WhatsApp.** ☑ **DONE.** Webhook, handshake, signature verification, `wamid`
  dedupe, conversation thread, Quick Reply buttons, opt-out by reply, and a read-only staff inbox.
  79 tests. Dormant — two credentials gate going live only. See `docs/WHATSAPP_INBOUND.md`.
- ☑ **M3 — Treatment-plan lifecycle.** The hub: issuing a plan derives appointments, labs,
  refills, payments, monitoring and follow-ups. Pure date/derivation logic, so it is heavily
  testable and depends on nothing external. **Done in code** — see `docs/TREATMENT_PLAN_SCHEDULE.md`.
  Two rule sets (refills, instalment totals) are still switched off pending clinic input.

### Core engine

- ☐ **M2 — Outbound engine.** Rules, scheduler, outbox, dedupe, quiet hours, weekly message
  budget, opt-out, delivery/read status, catch-up on missed ticks. *D M0, M1.*
- ☐ **M4 — Medication & refill.** Supply days → run-out date → warn at −7 and −3 days → no
  response → follow up → escalate. *D M3, M2.*
- ☐ **M5 — Appointments.** Confirm, −24h reminder, same-day, no-show follow-up, reschedule.
  Needs a real lifecycle state machine; the model is currently a flat record. *D M2, M3.*
- ☐ **M7 — Laboratory monitoring.** "HbA1c in 3 months" schedules, reminds, escalates when
  overdue. Pending and not-yet-due must be distinct states, or you spam patients. *D M3.*
- ☐ **M8 — Daily measurements + anomaly detection.** Asks for glucose, BP, weight, temperature.
  Also flags **abnormal** readings, not just missing ones — thresholds clinician-set per patient,
  never inferred. *D M3.*

### Visibility and escalation

- ☐ **M10 — Staff worklists and the exception dashboard.** "12 patients need attention today —
  3 missed readings, 2 overdue labs, 2 running out, 1 missed appointment, 4 overdue payments."
  Every row actionable in one click. *D M2.*
- ☐ **M11 — Escalation rules.** Declarative: condition + occurrences → severity + owner +
  deadline. *D M2, M10.*
- ☐ **M9 — Nutrition and lifestyle adherence.** Plan-linked check-ins, adherence scoring.
  *D M2, M3.*

### Payments and documents

- ☐ **M6 — Payments and instalments.** Fapshi, built natively. See §7. *D M0, M2.*
- ☐ **M12 — Document automation.** Prescriptions, treatment plans, lab requests, invoices,
  receipts, follow-up reports — generated from record data. *D M3, M6.*

### Engagement

- ☐ **M13 — Curated self-service assistant (no AI).** Clinic-authored answers to the approved
  administrative questions, routed by button payload or keyword, with a hard hand-off for
  anything else. *D M1, M2.*
- ☐ **M14 — Deterministic "since your last visit" summary.** From `PatientEvent`, every line
  traceable to the events behind it. *D M0.*
- ☐ **M15 — Onboarding, re-engagement, feedback.** Welcome sequence, consultation prep, forms,
  payment instructions; lapsed patients detected and re-contacted. *D M2, M3.*
- ☐ **M16 — Refill forecasting and inventory alerts.** Project demand from active plans, warn
  before stock is short. Needs real stock counts. *D M3, M4.*

### Effort and honesty

**Total: ~95–130 engineer-days (5–6 months)** for one senior developer, less than the original
estimate now that the two AI modules are deterministic. Recommended build order — front-loaded
with the unblocked work so every increment is visible:

**M0 ✅ → M18 ✅ → M17 ✅ → M3 ✅ → M1 ✅ → M2 → M10 → M4/M5/M7/M8 → M11 → M6 → M12 → M9/M13/M14/M15/M16**

Five of twenty-one are done. **M3 went before M1** because it was the only unblocked module left with
no dependency on anything, and because it is what makes M2 worth building: there is nothing for an
outbound engine to send until a plan actually knows what the patient owes and when they are due.

**M2 is next and is the load-bearing one.** Every remaining module is downstream of an engine that
can decide to send, respect a service window, stay inside a budget, and know whether a message
arrived. M1 gave it the two facts it cannot work without: a per-thread 24-hour window and a
per-message delivery status.

M0–M2 alone already deliver real value: staff stop being the ones who notice things by hand.

---

## 4. Testing strategy

- **Pure logic** (dates, rules, reconciliation, state machines, dedupe keys, quiet hours) — unit
  tests via `node:test`, no database, no network. The automation logic lives here, so this is
  where tests are dense.
- **Data access** — thin repository functions against an in-memory fake, so rule behaviour is
  verified without Mongo.
- **Routes** — the WhatsApp webhook is verified over real HTTP against a live database rather than
  mocked, because the property that matters (the dedupe insert preceding the side effects) cannot be
  proven without a database. The procedure is reproducible from
  [WHATSAPP_INBOUND.md §12](WHATSAPP_INBOUND.md). The automation tick takes network and clock
  injected, so it can be run at "23:30 on the due date".
- **Time is injected everywhere.** A scheduler that cannot be tested at "23:30 on the due date"
  will be wrong at 23:30 on the due date.
- **Idempotency is a tested property, not an assumption** — run the same tick twice, assert one
  message.
- `npm run test`, `npm run typecheck`, `npm run lint` and `npm run build` all green at every
  module boundary. No exceptions.

---

## 5. What stays human — non-negotiable

Automation may **inform**. It may not **decide**:

- Any clinical interpretation, diagnosis, or treatment change.
- Dose, medication, or product decisions.
- Responding to a symptom report, an abnormal reading, or any red flag.
- Anything outside the assistant's approved answer set.
- Anything the patient disputes, or that is emotionally sensitive.
- Creating, altering or closing a clinical record.

The design principle: **automation moves information to a human; it never substitutes a
judgment for one.** This is enforced in code — the hard hand-off in M13, the clinician-set
thresholds in M8, and the owner-and-deadline rule in M11.

With no AI in the project, this line is easier to hold, not harder: there is no model that can
be talked into giving clinical advice, because there is no model.

---

## 6. Brand content decisions (M18)

Agreed, to be applied in **both** English and French (`lib/i18n.ts`):

1. **"Science-based herbalism" leads.** The line becomes *Science-Based Herbalism. Root-Cause
   Healthcare. Education. Investigation. Personalization. Monitoring.* Herbalism first, because
   naming the practice accurately is both honest and a stronger position than leading with a
   category the clinic does not primarily occupy.
2. **"S19 is not anti-conventional medicine"** replaces "not anti-medicine": *different
   healthcare approaches have different roles; there are circumstances in which pharmaceuticals,
   surgery, emergency medicine, hospitalization or specialist care are essential, and natural and
   complementary approaches should never delay necessary medical, emergency or specialist care.
   The goal is not to choose sides in medicine — it is to use the right intervention, for the
   right patient, at the right time.*
3. **Seven care pillars, herbal medicine first**, with **Non-Conventional Therapies** added:
   selected non-conventional therapies alongside herbal medicine, nutrition and lifestyle, to
   support symptom management, recovery and overall well-being.
4. **The journey is CONSULT → INVESTIGATE → UNDERSTAND → EDUCATE → ADDRESS → SUPPORT → MONITOR.**
   Education sits *before* intervention deliberately: a patient who does not understand their
   condition is not adhering, only complying, and the two behave differently. "Address" also
   covers correction honestly rather than implying correction is the only intervention.
5. **The opening statement goes to the top of the About page and onto the home page**, so a
   visitor knows what S19 is within 30 seconds: *S19 Herbal Clinic combines science-based herbal
   medicine, laboratory investigation, nutrition, lifestyle medicine, patient education,
   continuous monitoring and in-clinic non-invasive supportive therapies to provide personalized
   healthcare focused on identifying and addressing important contributing factors.* Plus the
   framing question — not "what medicine treats this disease?" but "what is happening inside this
   person, what factors are contributing, what can be changed, and how can we measure whether
   those changes are working?" — and the goal: **not to manage disease, but to build better
   health.**
6. **Description tightened:** a Bafoussam-based herbal and integrative wellness clinic combining
   traditional knowledge of medicinal plants with modern laboratory testing, nutrition, lifestyle
   medicine, health education and evidence-informed natural interventions.
7. **Type 2 diabetes stays an example**, not the clinic's identity.
8. **Open question:** the fragment "Something small. I also noticed…" looks like an editing
   note rather than intended copy. It will not be published unless confirmed.
9. **Judgement call:** the "what medicine treats this disease?" framing is strong, but beside the
   clinic's name it can read as dismissiveness without context. It works as part of the full
   position; it should not be a standalone hero line. Keeping the words, with the context that
   makes them land.

---

## 7. Payment integration approach (M6)

`docs/GUIDE_PAYMENT_SYSTEM.md` is a **background document about a different system**, kept here
only because it documents real Fapshi API behaviour. Its own audit finds critical flaws in that
PHP code, so nothing in it is treated as a pattern to copy. What S19 will do instead:

- **Native implementation** against the Fapshi API, with the gateway behind a small port so a
  card provider can be added later without touching the flow.
- **Intent → webhook → fulfilment.** Only the webhook marks a payment paid. Never the browser
  return URL, and never a client-side confirmation — a return URL is attacker-controlled.
- **Idempotent intent creation** with a unique key per order. This is the anti-double-debit
  core.
- **Exactly-once fulfilment**, enforced by a unique constraint rather than by code order.
- **One `FAPSHI_BASE_URL`** with no path suffix, and status URLs built in code. The
  `str_replace('/initiate-pay', …)` approach in the guide breaks silently on a trailing slash or
  a sandbox/live switch.
- **Fail closed**: refuse to start without a webhook secret, and verify Fapshi's signature
  before trusting a callback.
- **Expiry sweeper + reconciliation** as a mandatory safety net, since a lost webhook must not
  mean a patient paid and received nothing.
- **The return page only reads our database.** It never polls the gateway or infers success.

Fapshi is mobile-money-first, which suits MTN and Orange Mobile Money in Cameroon — the right
default here.

---

## 8. Recommendations beyond the original brief

The items most likely to decide whether this works in six months:

1. **Quiet hours and a weekly message budget are load-bearing.** Meta's quality rating degrades
   with sends outside 08:00–20:00 and with high frequency; a degraded number stops delivering, and
   then *all* of this fails silently. Most likely single point of quiet failure. Built into M2.
2. **A per-patient communication pause** that silences every channel in one action.
3. **Delivery and read receipts as first-class data.** "Sent" is not "received" and not "read".
   The escalation ladder only holds if read status is a fact, not a guess.
4. **Handle the 24-hour window explicitly** — a template opened no window, so a late reply may
   not permit a free-form answer.
5. **Escalations need a human owner and a deadline**, or exceptions accumulate silently — the
   opposite of manage-by-exception.
6. **Consent as a first-class record**, with a withdrawal timestamp, not a settings checkbox.
7. **Catch-up on missed runs.** Cloud cron skips. The engine must compute "what should have
   happened by now", not "what happened in the last hour".
8. **Cost and commission visibility.** Every automated message has a per-conversation cost and
   Fapshi has commission; an unwatched monthly number becomes a surprise.
9. **Adherence scoring prioritises humans; it does not judge patients.** "Not engaging" is a
   signal to reach out differently, not a label. Patients can see their own score — keep the
   language clinical and respectful.
10. **New data inherits the existing controls.** `PatientEvent` and conversations are health
    records: encryption, retention, audit, and the legal review already tracked in
    `LEGAL_COMPLIANCE_GAP_REGISTER.md`.
11. **Use the portal for structured capture, WhatsApp for nudging.** Free-text clinical intake
    is where accuracy dies; a nudge that sends the patient to the right portal field is both more
    accurate and cheaper.

---

## 9. Related documents

[State and credentials gaps](STATE_AND_CREDENTIALS_GAPS.md) ·
[Getting the keys — client instruction manual](GETTING_CREDENTIALS.md) ·
[WhatsApp notifications — sending](WHATSAPP_SETUP.md) ·
[WhatsApp inbound — receiving](WHATSAPP_INBOUND.md) ·
[Treatment plan schedule](TREATMENT_PLAN_SCHEDULE.md) · [Image SEO](IMAGE_SEO.md) ·
[Logging and monitoring](LOGGING_AND_MONITORING.md) ·
[Architecture](ARCHITECTURE.md) · [Legal compliance gap register](LEGAL_COMPLIANCE_GAP_REGISTER.md) ·
Payment background reading (not a design source): `GUIDE_PAYMENT_SYSTEM.md`
