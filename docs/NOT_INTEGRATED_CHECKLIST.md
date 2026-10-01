# Not-yet-integrated capabilities

**Excludes WhatsApp and Fapshi entirely.** Everything here is portal-side work that needs no Meta
credential, no payment provider, and no clinic payment. If the clinic never pays for messaging,
all of it can still ship.

Every claim below was checked against the code on 1 October 2026, not inferred from the brief.
Where a capability is partially built, the specific gap is named.

**Updated 1 October 2026.** Two items have been built since the first draft and are marked
**[BUILT]**: the daily staff worklist (§3.1) and stock tracking (D6). The AI contradiction in §4 is
now a **settled decision**, not an open question.

---

## 1. What is actually working today

These are real, tested, and independent of messaging.

| Capability | Evidence |
| --- | --- |
| Clinic timezone correctness | `lib/clinic-time.ts` — "today" is correct on Vercel, not UTC-shifted |
| Append-only patient event log | `lib/events.ts`, `lib/event-log.ts`, `lib/models/PatientEvent.ts` |
| Treatment plan lifecycle | `lib/plan-lifecycle.ts` — issuing a plan derives dated tasks |
| Seven live alert categories | `/api/admin/treatment-alerts` — `concerning-reading`, `ending-soon`, `final-review`, `missed-follow-up`, `missed-glucose`, `new-complication`, `overdue-reminder`, each ranked by severity |
| Daily glucose monitoring | `GlucoseReading` — fasting and post-lunch, with photo upload, flagged against the plan's own thresholds |
| Email delivery | `lib/notify.ts` — 10 call sites already send patient email |
| Cron authentication | `lib/cron-auth.ts` — nightly backup, authenticated, verified 401 in production |
| Image SEO | 14 descriptive renames, single registry, sitemap images, 54 image URLs all resolving |
| **Daily staff worklist** | `/api/admin/worklist` — one line per patient, grouped by reason, claimable, aged, with staff decisions stored as `WorklistItem`. 20 tests. |
| **Stock ledger** | `lib/stock.ts`, `lib/stock-db.ts`, `/api/admin/inventory` — orders hold and release stock, every change is an append-only `StockMovement`, retries cannot double-count. 24 tests + 22 live checks. |

**One caveat that matters more than it looks:** the schedule derivation is *entirely inert*.
`TREATMENT_SCHEDULE_ENABLED` is unset, so it produces nothing. And of the four derivable kinds,
`refill` and `payment` are `null` in the defaults — so even once enabled, only the appointment
review and the lab cadence derive. Nothing reaches a patient today from this subsystem.

---

## 2. Missing data — these block features

You cannot build the feature above until the field exists. Each is cheap to add.

| # | Gap | Blocks |
| --- | --- | --- |
| D1 | **Products/medications supplied on a treatment plan.** `TreatmentPlan` has no product or medication field at all. | Refill automation, adherence, "medications supplied" |
| D2 | **Days of supply per product.** Not recorded anywhere. A refill date cannot be computed from an unknown quantity. This is the single reason `refill` is disabled. | The whole medication/refill capability — the brief's second bullet |
| D3 | **Payment ledger.** No record of amount paid, balance remaining, or receipt. `totalFcfa` exists only as an *input* for deriving reminder dates. | "Who hasn't paid?", overdue-payment views, payment follow-up |
| D4 | **Monitoring beyond glucose.** Only `fasting` and `post-lunch` glucose. No blood pressure, weight, temperature, or symptom capture. | Daily patient monitoring (the brief's brief bullet), adherence scoring |
| D5 | **Nutrition program on the plan.** No field. | Nutrition and lifestyle adherence check-ins |
| D6 | **[RESOLVED 1 Oct 2026]** `Product.stock` was a hand-entered number, never decremented when an order was placed. Now an append-only ledger records every change, orders hold and release stock, and stock can never go negative. See `docs/INVENTORY.md`. | Nothing further for tracking. **Still open:** refill *forecasting* needs D2 (days of supply) — a different problem — and reorder levels are unset clinic-wide. |
| D7 | **The event log barely records anything.** `PatientEvent` is only written by the plan lifecycle. Appointments, consultations, lab results, prescriptions, payments and messages are **not** logged. | The patient progress timeline — the log exists but is near-empty in practice |

---

## 3. Missing features — no data dependency

### 3.1 The centrepiece: daily staff worklist — **[BUILT 1 Oct 2026]**

The brief asks for this:

> "12 patients require attention today — 3 missed glucose readings, 2 overdue laboratory tests…"

`/api/admin/treatment-alerts` already computed the right alerts, but it was a *feed*, not a worklist:
no per-staff daily list, no assignment, no grouping by reason, no "who owns this".

**Now built.** `/api/admin/worklist` returns one row per patient with the reason, an owner and an age.
Staff actions (claim, release, resolve, dismiss, reopen, note) are stored in `WorklistItem`, unique
on `alertId`.

Two design decisions worth knowing:

- **Alerts are recomputed live and never stored.** Only staff decisions are persisted. A nightly job
  that writes alerts would be a source of truth competing with the live computation.
- **A resolved item can re-open.** It stays hidden only while the alert keeps appearing without a
  break. If the underlying condition clears and later returns, the item re-opens as unowned work,
  decided from two stored timestamps rather than a sweeper. `seenCount` is preserved for escalation.

**What is still missing:** there is no screen. The API exists and is tested, but no component consumes
it — `components/admin/treatment-alerts-tab.tsx` still renders the old feed. Until the UI is built the
clinic cannot see the worklist. This is the highest-value remaining item on this page.

### 3.2 Patient progress timeline

The log is written and never read. No API route, no component, nothing renders it. Because of D7
it would also be nearly empty if rendered today.

### 3.3 Document automation

**Zero.** No prescription print view, no invoice, no lab request, no follow-up report, no
appointment confirmation document. Every one of these is retyped by staff. This is real, daily
clerical waste and it needs no external service.

### 3.4 Treatment adherence tracking

Alerts fire per-event. Nothing aggregates per patient, so the system cannot say "this patient is
doing badly" or "this one is excellent". Depends on D1, D4.

### 3.5 Escalation rules

Severity exists on alerts. No *rules* — nothing escalates on repeated failure. The brief asks for
escalation on repeated missed glucose, multiple missed appointments, repeated non-response. Needs
a counter and a threshold per rule, plus an owner.

### 3.6 Appointment reminder cadence

Only the final review is derived. No advance reminder, no same-day reminder, no missed-appointment
follow-up, no rescheduling workflow. `appointment` derives once per plan.

### 3.7 Laboratory monitoring

Lab *dates* derive from the plan. There is no lab-specific overdue signal — it arrives as a generic
`overdue-reminder`, indistinguishable from an overdue payment.

### 3.8 Patient onboarding

No automated welcome, consultation-preparation instructions, required-forms task, or portal
usage guidance. All manual, per patient.

### 3.9 Inactive patient re-engagement

No detection of patients who stop submitting readings, stop attending, or miss a planned review.
Depends on the event log being complete (D7) to be trustworthy.

### 3.10 Feedback and satisfaction follow-up

Testimonials exist as manual content. Nothing requests feedback automatically after a
consultation or milestone.

### 3.11 Nutrition and lifestyle check-ins

Nothing. No hydration, sleep, fasting, exercise or nutrition-plan prompts. Depends on D5.

---

## 4. AI: suspended, and not to be done

**Decision, 1 October 2026: the brief's AI features are suspended. They will not be built.**

The brief asks for two things that are directly opposed to the standing project instruction:

> "**WhatsApp AI Assistant:** AI should handle approved routine questions…"
> "**AI patient summaries:** Before opening a patient's full record, AI could summarize…"

Against: **no AI model anywhere in this project.**

These cannot both hold, so the AI features are suspended. Concretely:

- **No AI auto-responder.** Patients are answered by a person.
- **No AI-generated patient summaries.** Records are read as they are stored.
- **No model provider is integrated, and none will be.** Not for triage, not for summarising, not for
  drafting replies. If a future module appears to need one, that module is out of scope.
- **"Suspended" is a decision, not a deferral.** This is not queued behind credentials or clinic
  input. It is not a thing waiting to be revisited when the budget allows.

### What replaces them

Neither capability needs a model to be useful:

- **Routine questions** → a fixed FAQ with buttons. Answers are written and approved once, cost
  nothing to serve, and cannot invent a dosage. The button payload grammar (`s19:<action>`) is a
  closed vocabulary, so an unknown answer is a 400, not a guess.
- **Record summaries** → deterministic projections of the `PatientEvent` log. The timeline and
  adherence views are projections, not generated prose.

### Why this is recorded rather than just deleted

Because the brief still contains those two lines. Anyone reading the brief later will see a feature
they were promised and find nothing here. This section exists so the gap is explained rather than
silent, and so it is clear the omission was chosen.

### What it saves

Recurring per-call cost, a data-processing question for patient records under Cameroon's privacy
rules, and — for a herbal clinic messaging patients about health — the risk of a generated answer
that nobody approved.

---

## 5. Blocked on clinic input, not on engineering

| Needed | For |
| --- | --- |
| Days of supply per product | D2 — the blocker on refill automation |
| Refill lead time (order → delivery) | D2 |
| Which products a plan supplies | D1 |
| Monitoring cadence (which measurements, how often) | D4 |
| Glucose thresholds | `fastingStart/End`, `postLunchStart/End` currently hold placeholders |
| Nutrition program structure | D5 |
| Real opening stock counts | D6 — the ledger is live but the current numbers are still seed placeholders |
| Reorder level and reorder target per product | D6 — until set, the inventory view reports `untracked` rather than guessing |
| Escalation owners and thresholds | 3.5 |
| Go-ahead on backfilling existing treatment plans | Activation |

The cadences in `lib/treatment-rules.ts` are assistant-authored placeholders. They are gated off
precisely so they cannot reach a patient by accident. Enabling the gate without replacing them
would ship guesses as clinical instructions.

---

## 6. How to re-verify this document

Claims in sections 1–3 were produced by searching the codebase for the model, route and library
that would have to exist for each capability. The quick checks:

```powershell
# does a model exist for it?
Get-ChildItem lib\models -File | Select-Object -ExpandProperty Name

# does an API route exist for it?
Get-ChildItem app\api -Recurse -Filter route.ts |
  ForEach-Object { $_.FullName.Replace((Get-Location).Path + '\app\api\','') -replace '\\route.ts','' } |
  Sort-Object

# are the schedule rules actually enabled?
Select-String -LiteralPath lib\treatment-rules.ts -Pattern 'refill:|payment:|lab:'

# are the two built items actually built?
Get-ChildItem app\api\admin\worklist, app\api\admin\inventory -Recurse -Filter route.ts | Select-Object -ExpandProperty FullName
Get-ChildItem lib\models\WorklistItem.ts, lib\models\StockMovement.ts, lib\stock.ts | Select-Object -ExpandProperty Name

# does the stock ledger agree with the stored count?
npm.cmd run verify:stock
```

`docs/AUTOMATION_ROADMAP.md` on `feat/whatsapp-fapshi` carries the module numbering (M0–M20) for
the messaging half, which this document deliberately omits.