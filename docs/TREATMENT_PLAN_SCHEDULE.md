# M3 — Treatment-plan schedule derivation

**Status:** complete in code, and **shipped switched off.** The engine does nothing at all until
`TREATMENT_SCHEDULE_ENABLED=true` is set — see §0, read that first. Two rule sets are also
deliberately switched off pending clinic input (§6). Nothing here has been run against the live
database.

## 0. The switch, and why it exists

```
TREATMENT_SCHEDULE_ENABLED=true      # the engine derives and writes reminders
TREATMENT_SCHEDULE_ENABLED=anything   # the engine does nothing, and says why
TREATMENT_SCHEDULE_ENABLED=unset      # the engine does nothing, and says why
```

`applyPlanSchedule` refuses to run unless that variable is set to exactly `"true"`. Unset is not a
default of *on*; unset is *off*. Only the literal string opens it — `"1"`, `"yes"` and `"on"` do
not, because a flag that means three different things is a flag that will eventually mean the wrong
one.

The reason is §6 in one line: **the intervals in `lib/treatment-rules.ts` are mine, not the clinic's.**
Reviews every 30 days, labs every 90 days, seven days' notice — plausible placeholders, so the
arithmetic could be built and tested today. Deployed as it stood, those numbers would reach real
patients as though the clinic had set them. A patient told to book a review on a schedule nobody
agreed to is a complaint, not a feature.

So the engine ships inert. Off is indistinguishable from how the site has always behaved — a plan
creates no reminders — which means the worst outcome of shipping this and being wrong is no change
at all. The worst outcome of the opposite default is patients being told things. Same reasoning as
`lib/cron-auth.ts`, where an unset `CRON_SECRET` used to mean "skip the check", and the backup
endpoint then served a full database export over unauthenticated public GET.

**Turning it on is the moment the clinic confirms the intervals.** Not before.

Two things deliberately sit outside the gate:

- **`withdrawPlanSchedule` is not gated.** It only ever *removes* obligations. If the engine is ever
  on and later turned off, plans issued while it was running still have derived reminders, and
  closing one of those plans must still clear them. Gating withdrawal would leave a patient being
  prompted for reviews on a treatment that has ended — the exact harm the gate exists to prevent.
- **The admin panel still shows the report.** Saving a plan while the engine is inert returns the
  refusal, which renders in the form as an amber notice naming what is missing. Silence is the
  failure mode being designed out: a clinician must not have to guess whether "no reminders" means
  "not switched on yet" or "this is broken".

Gate decision, refusal text and the bounded echo of a bad value are in `lib/schedule-gate.ts`, and
`tests/schedule-gate.test.ts` (12 tests) exists so that "inert by default" cannot quietly become "on
by default" later.

## 1. What was wrong

Issuing a treatment plan recorded two dates and stopped.

```
POST /api/admin/treatment-plans   →  TreatmentPlan document  →  email + WhatsApp
```

Every reminder afterwards — the monthly review, the repeat lab test, the second instalment — was
typed into the admin panel by hand, one at a time.

That has three consequences, and all three were visible in the product:

1. **The alert feed was structurally silent.** `GET /api/admin/treatment-alerts` computes overdue
   reminders, missed follow-ups and concerning readings live from portal data. It can only report
   what exists. If nothing was ever created, nothing was ever overdue, and the dashboard showed a
   clean clinic.
2. **Patients got nothing to do.** "Today's tasks" was empty for almost every plan, so adherence
   could not be measured and the patient had no reason to return before their next consultation.
3. **Every one of those reminders depended on a human remembering.** A clinic of any size does not
   type in 200 reminders a year by hand, so in practice they were not typed in at all.

## 2. What it does now

Issuing a plan derives its schedule; changing the plan's dates re-derives it; closing the plan
withdraws it.

```
POST  /api/admin/treatment-plans       issue    → derive + reconcile + record
PATCH /api/admin/treatment-plans/[id]  reschedule → re-derive
PATCH /api/admin/treatment-plans/[id]  close    → withdraw outstanding reminders
```

For a 92-day plan under the current defaults:

| Reminder on | Event on | Kind | Title |
| --- | --- | --- | --- |
| 8 Oct | 15 Oct | appointment | Review with the clinic (month 1) |
| 24 Oct | 31 Oct | lab | Laboratory test (month 1) |
| 7 Nov | 14 Nov | appointment | Review with the clinic (month 2) |
| 7 Dec | 14 Dec | appointment | Review with the clinic (month 3) |

Run `npm.cmd run preview:plan -- 2026-10-01 2026-12-31` to see this for any period, with no
database and no writes.

## 3. The four decisions that matter

### 3.1 An obligation has two dates

`eventDate` is when the thing happens. `dueDate` is when the patient is told. They differ by the
rule's lead time.

Conflating them is the bug that produces a reminder arriving on the morning of the appointment it
is about, or three weeks before the lab. A review on 15 October with seven days' notice is
*reminded* on 8 October and *happens* on 15 October. The patient sees both dates.

### 3.2 Nothing is backdated, and nothing in the past is announced

Derivation skips any occurrence whose event date has already passed, and clamps a reminder forward
to today when its lead window has already opened.

This matters most at plan creation. A plan issued three weeks into its own schedule would otherwise
generate a burst of reminders for reviews and labs that were already missed — useless to the
patient, and the fastest possible way to get a WhatsApp number blocked. A rule that has already
lapsed produces nothing.

Clamping (rather than backdating) also avoids the alternative failure: writing the real due date and
having the task appear *overdue the instant it is created*, which reads to a patient as "you have
already failed this" for something they were never told about.

### 3.3 Reconciliation never destroys a clinician's work

The engine distinguishes rows it owns from rows a human wrote. `TreatmentReminder` gained three
fields for this:

| Field | Meaning |
| --- | --- |
| `origin` | `"manual"` (typed by a person) or `"derived"` (produced by the engine) |
| `pinned` | A clinician has claimed this row; the engine will not touch it again |
| `dedupeKey` | Content-derived identity, `plan:<id>:<kind>:<sequence>` |

And `status` gained `"cancelled"`, meaning *withdrawn*.

The rules:

- `origin: "manual"` rows are **never** read for changes and never touched.
- `origin: "derived"` rows are updated only while nobody has pinned them.
- A pinned row is left alone permanently, so "move this reminder to the 12th" survives the next
  re-derivation instead of being silently undone.
- Completed rows are never reopened.
- A withdrawn obligation is **cancelled, not deleted**, so the record that it existed survives. It
  disappears from every task list because they all filter on `pending`.
- A cancelled row is **resurrected** if the obligation returns — shortening a plan then extending it
  again restores the same row rather than creating a duplicate that would double-charge a patient.
- Closing a plan withdraws the outstanding ones, so finishing a course does not leave the patient
  being prompted for a third monthly review that will never happen.

**Why `pinned` and not field-diffing.** Inferring "a clinician edited this" by comparing fields
guesses wrong: an admin who opens the title to fix a typo would silently hand the row back to the
engine on the next re-run. An explicit flag cannot be set by accident.

**Why cancel rather than delete.** Delete-and-recreate is the obvious implementation and it is
wrong: it destroys history, it loses ids staff have bookmarked, and every re-run looks like a new
task.

### 3.4 Monitoring is a projection, not a pile of rows

Daily glucose monitoring is **not** stored as reminders. A daily requirement across a six-month
plan is 180 rows per patient; storing them would bury the two or three that actually need attention
and every re-derivation would rewrite all of them.

Instead `monitoringWindowsFor()` projects the plan's own `monitoring` field on demand for whichever
day is being asked about. A malformed window time falls back to the documented default rather than
being dropped, because a typo in the admin form should not silently remove a patient's obligation to
test their blood sugar. A window that closes before it opens is dropped, because it is not a window.

## 4. Files

| File | Role |
| --- | --- |
| `lib/treatment-rules.ts` | The rules, as data. Every cadence in one place. Also `parseRuleOverrides`, which validates admin input |
| `lib/plan-schedule.ts` | Pure derivation and reconciliation. No I/O, so it is testable |
| `lib/plan-lifecycle.ts` | The only writer. `server-only`. Records the `PatientEvent` |
| `lib/models/TreatmentReminder.ts` | `origin`, `pinned`, `dedupeKey`, `cancelled`, `eventDate` |
| `scripts/preview-plan-schedule.ts` | Read-only preview. `npm run preview:plan` |
| `tests/plan-schedule.test.ts` | 76 tests |

The split is deliberate. `plan-schedule.ts` answers two questions — *what should exist* and *what
changed* — and returns an intent rather than performing it. That is what lets every rule below be
verified against edge cases that would otherwise need a live database and a running clock to test.

## 5. Safety properties, and how each is tested

| Property | Test |
| --- | --- |
| Nothing is generated outside the plan period | "no obligation falls after the end date" — a 90-day course must not acquire a month-4 review |
| Nothing in the past is announced | "occurrences that already happened are never announced" |
| No reminder is backdated | "no reminder is backdated before today" |
| An open lead window clamps rather than backdates | "an open lead window clamps the reminder to today" |
| Re-running writes nothing | "reconciling identical state twice changes nothing the second time" |
| A clinician's row is never touched | "a stored manual reminder is never created over, updated or cancelled" |
| A moved date survives | "a pinned reminder keeps a moved date" |
| A completed task is never reopened | "a completed reminder is never reopened" |
| Withdrawal keeps history | "an obligation that disappeared is cancelled, never deleted" |
| Withdrawal is reversible | "a withdrawn obligation returns when the plan is extended again" |
| Instalments sum to the quoted total | "a known total produces that many instalments that sum to it" |
| The last instalment lands on the last day | "no instalment falls after the plan ends" |
| A bad cadence is refused, not guessed at | "a zero cadence is refused with the offending value named" |
| A bad amount never becomes a bill | "an unusable amount is treated as no amount, never as a negative bill" |
| A missing rule is reported | "refill and payment derive nothing, and say why" |
| The month label matches the dashboard | "the month of an occurrence matches the plan model's own convention" |
| **Occurrence numbers never move** | "a plan re-derived later keeps the same keys for the same events", "re-deriving a plan in month two never cancels a future reminder" |

That last pair guards the subtlest bug in this module, and it was a real one. Numbering the
occurrences that *survive* today's filter — rather than their position in the cadence — looks
identical on a fresh plan and is invisible in every other test. But it renumbers on every
re-derivation, and since reconciliation matches on that number, re-deriving a plan in month two
would make the engine believe the month-three review no longer exists and **cancel a perfectly valid
future reminder**. The number is now `floor(offset / everyDays) + 1`, which depends only on the plan
and the rule, so it is identical on every run.

That last one matters more than it looks. The same fact is shown to the patient twice — "Month 2
of 3" on the dashboard, "Review with the clinic (month 2)" in their task list. If the two ever
disagree, the patient reads one of them as a mistake and stops trusting both. `plan-schedule.ts`
therefore uses the plan model's own month arithmetic rather than re-deriving it.

## 6. What the clinic still needs to decide — read this before going live

Answering anything in this section is also what unlocks the switch in §0. Until then the engine
refuses to run, so nothing here can reach a patient by accident.

**Every cadence in `lib/treatment-rules.ts` is provisional.** None came from a clinician. They are
reasoned placeholders chosen so the automation is structurally complete and testable today. They
are plausible, not approved. **Do not present any of them to a patient as though the clinic had set
them.**

| Rule | Value now | What the clinic must say |
| --- | --- | --- |
| Consultation | every 30 days, 14 days in, 7 days' notice | Is the review cycle the same for every program? Diabetes and a six-month course are unlikely to share one. |
| Lab | every 90 days, 30 days in, 7 days' notice | Which tests, at what intervals, and which need fasting? The engine cannot know that a fasting test means something different to a patient. |
| Refill | **disabled** | Days of supply per product, and lead time from order to delivery. |
| Payment | **no total** | What a plan costs, and how many instalments. |
| Monitoring grace | 26 hours | Is one missed day acceptable? Should a missed reading prompt the patient, or only staff? |

Two of these are not merely unconfirmed — they are **wrong-shaped**, and the engine declines to
produce output rather than guessing:

- **Refills** are off because a refill reminder has to know how many days of supply a product
  covers, which varies per product and is not recorded anywhere. A made-up supply length would tell
  a patient to reorder before they ran out.
- **Payments** carry no total because a plan document has no price on it. Supplying one switches the
  rule on. The engine will not invent an amount.

A rule that cannot be satisfied produces a **reported skip**, never a plausible guess. The skip is
returned by the API, written to the log, and recorded on the `PatientEvent`, so "why has this
patient had no payment reminders for two months" is answerable. Silent fabrication is how an
automation destroys the trust it is meant to save.

Per-plan overrides are already accepted by both admin endpoints (`rules` in the request body), so
answering any of the above does not need a code change:

```jsonc
POST /api/admin/treatment-plans
{
  "user": "...", "title": "Diabetes & Metabolic Plan",
  "startDate": "2026-10-01", "endDate": "2026-12-31",
  "rules": {
    "consultation": { "everyDays": 42 },
    "lab": null,                                  // this patient needs no repeat labs
    "payment": { "instalments": 3, "totalFcfa": 450000 }
  }
}
```

## 7. Deliberate limits

- **Appointments are not auto-booked.** A derived consultation is a reminder to *book* a review. A
  real slot needs a doctor's schedule and a booking is a real-world commitment; the engine does not
  make one on the patient's behalf. M5 owns the actual booking lifecycle.
- **The `dedupeKey` unique index is partial**, not sparse. Sparse indexes still index an explicit
  `null`, and every pre-engine manual reminder would then collide with every other one. The partial
  filter (`dedupeKey: { $type: "string" }`) excludes both missing and null.
- **Writes are not transactional.** MongoDB transactions need a replica set, and the clinic's
  database may be a single node — in which case failing to write reminders would mean failing to
  issue a plan. Writes are ordered by importance instead, and each is independently retryable by
  simply running the function again, because `dedupeKey` makes the second attempt safe.
- **Patient-visible changes are narrow on purpose**: the patient task list now shows the event date
  alongside the reminder date, and nothing else. Adding an event date without a due date would have
  meant a 92-day plan generating ~180 rows per patient.
- **`plan-schedule.ts` has no `server-only` import**, unlike `plan-lifecycle.ts`. `server-only` is a
  Next.js alias, not an installed package, so a module that imports it cannot be loaded by
  `node --test`. Keeping the derivation free of it is what makes the arithmetic testable.
- **No backfill script.** Existing plans get no schedule until they are next edited. The engine is
  idempotent, so a backfill is a one-liner over `TreatmentPlan` whenever the clinic is ready — but
  it would write to the live database and needs explicit go-ahead. It also requires §0's switch to
  be on, so the ordering is fixed: confirm intervals → enable → backfill.
- **`preview:plan` is not behind the gate.** It is read-only and imports the pure derivation, so a
  plan period can be previewed and the cadences argued over with the clinic *before* the engine is
  ever switched on. That is the intended way to close §6.
