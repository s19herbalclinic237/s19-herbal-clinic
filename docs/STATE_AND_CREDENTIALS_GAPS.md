# State and credentials gaps — what I do not have, and how to get it

**Written:** 30 September 2026
**For:** the S19 automation build ([AUTOMATION_ROADMAP.md](AUTOMATION_ROADMAP.md))
**Why this file exists:** most of the automation cannot be built or *tested* without state that
lives outside the codebase — Meta credentials, payment keys, business rules, and clinical
thresholds. Listing them here stops us discovering them halfway through a module.

I verified every "current state" claim below by reading the code and `.env.local`. Secrets are
never printed — only whether a variable is set.

---

## 0. Both of these are now closed

### 0.1 The backup cron was publicly triggerable — `CRON_SECRET` — RESOLVED 30 September 2026

**What the hole was.** `app/api/cron/backups/route.ts:37` guarded with
`if (secret && process.env.NODE_ENV !== "development")`. Because `CRON_SECRET` was unset, the
condition was false, the guard never fired, and in production the endpoint accepted
**unauthenticated public GET requests**. Anyone who guessed the URL could trigger a full
database export — including health records — emailed to the clinic mailbox, at any time, as
often as they liked.

**Code fix — done.** The guard now lives in `lib/cron-auth.ts` and **fails closed**: a missing
`CRON_SECRET` in production is a hard 503, never "open". The comparison is timing-safe, refusals
are written to the error log so a misconfigured deployment surfaces in the daily digest instead
of silently skipping backups, and the decision is a pure function with 20 unit tests covering the
exact scenario that caused the hole ("production with no secret must refuse").

**Deployment — done 30 September 2026.** The variable is set in Vercel and a redeploy has picked
it up. Verified against production rather than assumed:

```
GET https://www.s19herbalclinic.com/api/cron/backups  ->  401
```

401 is the proof, and it is worth being precise about why. `evaluateCronAuth` returns **503**
when no secret is configured in production (`lib/cron-auth.ts:77`) and **401** only when a
secret exists and the request failed to present it (`lib/cron-auth.ts:86`, `:91`). So a 401
distinguishes "armed" from "not armed" — an unauthenticated probe is enough to tell whether the
backups are protected, and no secret has to be transmitted to check.

**The nightly 05:30 backup is now live.** It has never run before this.

`vercel.json` also gained a second cron, `/api/cron/outbound` at `0 9 * * *` — once daily, and
deliberately so. This project is on Vercel's **Hobby** plan, which rejects any cron expression
that would run more than once per day **at deploy time**, with
*"Hobby accounts are limited to daily cron jobs. This cron expression would run more than once
per day."* An `*/5 * * * *` schedule was tried first and would have failed the next deployment
outright. It returns 404 in production until the M2 outbound engine is deployed, which is
expected and harmless — the route has never been in a production build. See §0.3 for what a
once-daily pass costs the reminder engine.

### 0.2 "Today" is computed in UTC, not in Bafoussam — FIXED in M0

`lib/dates.ts` derived "today" from the runtime's local time, which on Vercel is UTC. Cameroon is
UTC+1, so for one hour every night the clinic's "today" was wrong, and the cron at `05:30` UTC
ran at `06:30` clinic time. Harmless enough then; unacceptable once reminders fire from it.

**Fixed.** `lib/clinic-time.ts` now pins every date calculation to `Africa/Douala`, and
`lib/dates.ts` delegates to it, so all four existing call sites became correct without being
rewritten. A regression test pins the exact boundary (23:30 UTC is already the next day in
Bafoussam).

### 0.3 The reminder engine can only run once a day — a Hobby-plan constraint, not a design choice

**The rule.** Vercel Hobby accepts cron expressions that run **once per day or less**. Anything
faster **fails the deployment** rather than being silently downgraded:

> Hobby accounts are limited to daily cron jobs. This cron expression would run more than once
> per day.

An `*/5 * * * *` schedule was written for `/api/cron/outbound` before this was known. It would
have taken the **whole site** down at the next deploy, not just the cron. The committed schedule
is now `0 9 * * *` — one pass a day. Pro and Enterprise allow per-minute.

**Hobby timing precision is per-hour, ±59 minutes.** `30 5 * * *` fires anywhere between 05:30
and 06:29 UTC. That is acceptable for a backup. It is *not* acceptable for a message that must
arrive at a specific time, which is why the outbound cron is placed mid-morning in clinic time
rather than at a convenient hour in UTC.

**Why 09:00 UTC specifically.** Clinic time is UTC+1, so the pass runs at 10:00–10:59 in
Bafoussam. The permitted sending window is 08:00–20:00 clinic time (quiet by default from 20:00
to 08:00). 10:00 sits comfortably inside it, and survives an hour of jitter in either direction.
Putting the cron in the early morning — the obvious choice in UTC — would have landed it inside
quiet hours, and because there is no second pass that day it would have deferred every message
to 08:00 and then never been woken again. That is the failure mode this schedule exists to avoid.

**What a once-daily pass actually costs.**

| | |
| --- | --- |
| Appointment and refill reminders | **Fine.** A once-a-day batch is how most clinics operate. |
| Messages that become due mid-afternoon | **Wait until the next morning.** Acceptable for reminders, wrong for anything urgent. |
| Two-hour warnings ("your appointment is in 2 hours") | **Broken on this plan.** They would be sent the following morning, so the staleness rule must be set longer than ~24 hours or these must not be scheduled. |
| A patient's own reply opening the 24-hour window | **Unaffected** — inbound is a webhook, not a cron. Replies are still instant. |
| Transactional receipts | **Unaffected** — they bypass quiet hours and the gate by design, and are sent from the request that triggers them, not from the tick. |

**Three ways out, cheapest first.**

1. **Accept it.** Nothing else in the roadmap depends on sub-daily sends. This is the default.
2. **Free external pinger.** A service such as UptimeRobot's free tier (50 monitors, 5-minute
   intervals) can `GET` the endpoint with the bearer header. No Vercel plan change, no code
   change. The trade is a third party holding a URL that can run a send pass — acceptable only
   because the route is authenticated and the engine is gated, but it is a real third-party
   dependency and should be a deliberate decision, not a shortcut.
3. **Upgrade to Pro** — 20 USD/month, unlocks per-minute crons and removes the jitter. At roughly
   15,500 FCFA/month against a site built for 125,000 FCFA, this is the single largest recurring
   cost in the project and should be put to the clinic as a decision, not absorbed silently.

**Recommendation: option 1 for now.** Revisit when the clinic is actually sending reminders and
can say whether once-daily batching is enough. Deciding it before there is real usage is how a
20 USD/month bill becomes a surprise.


---

## 1. Meta WhatsApp Cloud API — needed for M1, M2 and everything downstream

**Status: no WhatsApp credentials are set.** `.env.local` has no `WHATSAPP_*` variables, so
`whatsappConfigured()` returns `false` and all ten templates in `lib/whatsapp.ts` are currently
dead code. No automated message has ever been delivered. **M1's code is complete and tested** — it
is simply not pointed at anything, so no reply has ever arrived either.

**The two halves are independent, and the dangerous configuration is the half-set one.** A number
with items 4–5 but not 6–7 sends happily, discards every reply, and looks perfectly healthy from
the outside. `GET /api/admin/whatsapp` reports the halves separately for that reason.

| Half | Enables | Needs |
| --- | --- | --- |
| **Sending** | M2 and every notification | Items 1, 3, 4, 5, 8, 9 |
| **Receiving** | M1 — replies, opt-outs, the 24-hour window, the staff inbox | Items 1, 3, 6, 7 **and** the callback URL saved in Meta |

> **Client-facing instruction manual: [`GETTING_CREDENTIALS.md`](GETTING_CREDENTIALS.md)** — a
> step-by-step guide written for the clinic, covering both a "you do it and send me the keys"
> route and a "give me access and I do it" route, with three safe ways to hand over secrets and
> a one-page checklist to send back. The tables below are the same list in engineer form.

`docs/WHATSAPP_SETUP.md` (sending) and `docs/WHATSAPP_INBOUND.md` (receiving) are the full
runbooks. The short version of what I need **from you**:

| # | Item | Where to get it | Needed for |
| --- | --- | --- | --- |
| 1 | Meta Business portfolio + a Business app | `business.facebook.com` | everything |
| 2 | **Business verification** (documents: clinic registration, tax ID, utility bill) | Meta Business Centre | production sending, higher limits |
| 3 | WhatsApp Business Account (WABA) | WhatsApp Manager | everything |
| 4 | `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp Manager → Phone numbers | sending |
| 5 | `WHATSAPP_ACCESS_TOKEN` — **permanent System User token**, not the 24-hour temporary one | Meta app dashboard → Business settings → Accounts → WhatsApp accounts → Business portfolio → System users | sending |
| 6 | `WHATSAPP_APP_SECRET` | App dashboard → Settings → Basic | signature verification of inbound webhooks (M1) |
| 7 | `WHATSAPP_VERIFY_TOKEN` | **we choose it** — you pick any random string, I add it to the code | webhook handshake (M1) |
| 8 | The 10 template names approved by Meta, in **both `en` and `fr`** | create in WhatsApp Manager | sending |
| 9 | Production (not sandbox) WhatsApp business account | Meta application for WhatsApp → your number is usually in sandbox | real delivery |
| 10 | Callback URL saved and `messages` subscribed | WhatsApp Manager → Configuration | receiving |
| 11 | A second team member as a backup number? optional | — | resilience |

Three things I want to flag plainly:

- **Step 8 is the real bottleneck, not the code.** Templates are created and approved in the Meta
  UI and each takes review. `lib/whatsapp.ts` already declares the exact bodies and parameter
  lists, so the copy is written — but I cannot create or approve them for you.
- **The buttons must be added in the exact order `GET /api/admin/whatsapp` prints them.** Meta
  addresses a quick reply by its *index*, not its label, so a re-ordered button delivers the wrong
  action — and "Stop these messages" landing where "Ask a question" should be silently unsubscribes
  a patient. Copy from that endpoint, not from memory. See
  [WHATSAPP_INBOUND.md §7](WHATSAPP_INBOUND.md).
- **French matters commercially.** The clinic is in Bafoussam; a large share of patients will
  prefer French. Both languages are already specified in the template constants, so approving both
  is a UI task with no code cost.

To enable sending once you have items 4–5:

```env
WHATSAPP_ACCESS_TOKEN=…
WHATSAPP_PHONE_NUMBER_ID=…
WHATSAPP_GRAPH_VERSION=v23.0
WHATSAPP_NAMESPACE=s19
```

To enable receiving once you have items 6–7:

```env
WHATSAPP_APP_SECRET=…
WHATSAPP_VERIFY_TOKEN=…
```

then save `https://www.s19herbalclinic.com/api/webhooks/whatsapp` as the callback URL and subscribe to
the **`messages`** field.

**An unset `WHATSAPP_APP_SECRET` refuses every delivery (503), by design.** It does not skip the
signature check. Adding the webhook without the secret would otherwise leave an unauthenticated
write path into patient records — the same inverted-guard shape that left `/api/cron/backups`
publicly triggerable. The failure is loud on purpose: Meta retries, the error log names the
variable, and the status endpoint shows `appSecret: false`.

---

## 2. Payments — Fapshi (module M6)

**Status: nothing configured. No payment code exists in this repository yet.** The shop has
`Order`, `Cart` and `Product` models and a checkout page, but no gateway.

`docs/GUIDE_PAYMENT_SYSTEM.md` is **background reading only**. It documents a PHP application
(SavoirNet) that is a *different* system and has nothing to do with this project; it was copied
in for head start on Fapshi API behaviour. It is treated as a **list of warnings, not a design to
copy** — its own audit finds critical flaws in that code (double debit, double processing,
trusting the browser return URL, `str_replace` surgery on the API URL). S19 implements the
payment flow **natively** against the rules in §7 of the roadmap, and nothing in that guide is
assumed safe until independently verified. If anything looks like a shortcut from that
codebase, it will be re-derived rather than ported.

What I need from you — the client-facing step-by-step version is in
[`GETTING_CREDENTIALS.md` §4](GETTING_CREDENTIALS.md):

| # | Item | Why |
| --- | --- | --- |
| 0 | **Start the KYC application first.** It is 1–5 days of Fapshi's review, and nothing else on this list can be completed without it. | This is the long pole in the whole project |
| 1 | Fapshi account status: live, sandbox, or not yet applied for? | Sandbox cannot test real money movement |
| 2 | `FAPSHI_API_KEY` (sent as the `apikey` header) | initiate payment |
| 3 | `FAPSHI_USER_KEY` (sent as the `apiuser` header) | initiate payment |
| 4 | `FAPSHI_WEBHOOK_SECRET` — set in the Fapshi dashboard | **required**; we fail closed without it, because trusting an unauthenticated payment webhook is how people give away services for free |
| 5 | Fapshi merchant KYC / approval status | live payments |
| 6 | Your agreed commission percentage | instalment totals and clinic revenue reporting |
| 7 | Live **and** sandbox base URLs | we assert at boot which one is configured |
| 8 | Do you want mobile money only (MTN/Orange via Fapshi), or card payments too? | Fapshi is mobile-money-first. I recommend a gateway port so cards can be added later without touching the flow. |
| 10 | Refund/chargeback handling — does Fapshi support reversal, and who authorises a refund? | needs a designed path, not an ad-hoc one |

Proposed environment (per the guide's §10.12, corrected to one base URL with no path suffix):

```env
FAPSHI_BASE_URL=https://live.fapshi.com
FAPSHI_API_KEY=…
FAPSHI_USER_KEY=…
FAPSHI_WEBHOOK_SECRET=…
NEXT_PUBLIC_APP_URL=https://www.s19herbalclinic.com
WEBHOOK_BASE_URL=https://www.s19herbalclinic.com/api/webhooks
RETURN_URL_TEMPLATE=https://www.s19herbalclinic.com/order/{reference}
```

Also: the guide's §10.2 recommends checking the SavoirNet server's access logs for fetches of
`/.env`, delivery archives and test scripts, and rotating that application's Fapshi
`apikey`/`apiuser` if any were ever reachable. **That is a security task on the old server, not
this repo, and it is worth doing regardless of this project** — particularly if that server is
still online and holding Fapshi keys.

### 2.1 Two operational facts that shape the build

Both come from the Fapshi API's real behaviour, and both are reasons the payment module cannot be
a thin wrapper around `initiate-pay`:

- **Fapshi delivers each webhook exactly once and never retries.** A lost notification is lost
  permanently, so M6 includes a reconciliation sweep that checks anything still unpaid after 24
  hours against Fapshi's transaction list. Until then, **the Fapshi webhook URL must be left
  empty in the dashboard** — the endpoint does not exist yet, and setting it would mean taking
  customers' money without confirming the order.
- **IP whitelisting applies to the payment endpoints.** This site's outgoing IP is not fixed, so
  whitelisting has to be disabled or arranged with Fapshi before live. This is the most likely
  reason a correct integration fails, and it is worth raising during the KYC conversation rather
  than discovering at launch.

---

## 3. AI — resolved: no model will be added

**Status: closed by decision.** No AI provider, no API key, no data-processing agreement, and no
patient data leaves the clinic's infrastructure. Nothing in the roadmap calls a language model.

The two capabilities that originally assumed a model are re-specified as deterministic features,
so this section needs **no credentials and no legal review**:

| Was | Is now | What I need instead |
| --- | --- | --- |
| "WhatsApp AI Assistant" for routine questions | **M13** — curated self-service assistant: clinic-authored answers matched by button payload or keyword, hard hand-off for anything unmatched | The approved answers themselves (§4) — content, not credentials |
| "AI patient summaries" | **M14** — deterministic "since your last visit" summary computed from the `PatientEvent` log, every line traceable to its source events | Nothing; it is derived from data we already hold |

This is the better outcome for a clinical setting, not a compromise: the questions patients ask
are a **fixed, enumerable set**, so a lookup table cannot hallucinate a fee, a dosage or an
opening hour, and a summary assembled from recorded events can be checked by a clinician — which
a generated paragraph cannot be.

Because there is no model, the strongest safety property in the design becomes structural: there
is nothing in the system capable of offering clinical advice, because there is no language model
to ask.

---

## 4. Clinic knowledge for the AI assistant (M13)

These are the approved questions. I can write the structure, but the **content is yours and must be
accurate** — I will not invent fees, hours or clinical instructions:

1. Consultation fees, and whether they differ by consultation type, in-clinic vs Tele-Health, and
   follow-up vs first.
2. Opening days and hours, and any closure days.
3. Exact location and directions, plus parking.
4. Accommodation guidance for patients travelling from other regions — the clinic is in Bafoussam,
   and patients from outside the West Region will ask.
5. Tele-Health: how to book, what platform, what to prepare, and what it is not suitable for.
6. Consultation preparation instructions: fasting, what to bring, which documents.
7. How to send laboratory results through the portal.
8. Payment procedure: instalments, what is refundable, how to request a receipt.
9. The escalation contact and what patients should do in an emergency.
10. Any topic you want explicitly excluded.

---

## 5. Business rules and clinical thresholds — needed by module, not before

I have deliberately **not** hard-coded any of these. Each is configurable, owned by the clinic, and
must come from a clinician. Guessing any of them would be unsafe.

| # | Question | Needed by | Note |
| --- | --- | --- | --- |
| 1 | Per-product **supply days** (a 30-day course vs 15-day vs as-needed) | M4 | drives every refill date |
| 2 | Refill warning lead time — you said 7–10 days; confirm exact days and whether it varies by course length | M4 | |
| 3 | Non-response policy: how many follow-ups, spaced how, before escalating | M4, M11 | |
| 4 | Escalation **owner** per exception type and a resolution deadline | M11 | an escalation with no owner is a silent leak |
| 5 | Glucose thresholds: low and high, per patient | M8 | **clinician-set per patient; never AI-inferred** |
| 6 | Reading frequency per patient (daily? before meals? fasting only?) | M8 | |
| 7 | Which measurements beyond glucose — BP, weight, temperature, symptoms — and their targets | M8 | |
| 8 | Trend rules worth alerting on (e.g. three consecutive rising readings) | M8 | |
| 9 | Lab turnaround time in days, and the "patient will do it" vs "result received" distinction | M7 | |
| 10 | Standard follow-up intervals per programme | M3 | **Code is done and awaiting your answer.** M3 now derives the whole schedule, but every cadence is a provisional placeholder. See `docs/TREATMENT_PLAN_SCHEDULE.md` §6. |
| 10a | Review cycle — is it the same for every programme? | M3 | Currently 30 days for all. Diabetes and a six-month course are unlikely to share one. |
| 10b | Which lab tests, at what intervals, and which need fasting | M3 | Currently 90 days for all. The engine cannot know that a fasting test means something different to a patient. |
| 10c | Notice period for a review and for a lab booking | M3 | Currently 7 days for both. |
| 10d | **Plan price and instalment count** | M3 | **Switched off.** A plan document has no price on it, so no amount can be derived. Supplying a total enables payment reminders. |
| 10e | Is one missed daily reading acceptable? | M3 | Currently a 26-hour grace period before a reading counts as missed. |
| 11 | Inactivity threshold for "lapsed patient" re-engagement | M15 | |
| 12 | **Quiet hours** — I propose 08:00–20:00 Africa/Douala; confirm | M2 | protects the Meta number's quality rating |
| 13 | **Maximum automated messages per patient per week** — I propose 4 | M2 | same reason |
| 14 | Which programmes/staff are live, so automation is not enabled for dormant ones | M2 | |
| 15 | Whether patients can opt out of automated contact and still keep treatment | M2 | |
| 16 | Feedback survey: after which consultations or stages | M15 | |

---

## 6. Inventory (M16)

1. **Do S19 products have real stock counts anywhere?** The `Product` model has no `stock` field.
   Refill forecasting needs quantities and reorder points per product, plus lead time from supplier.
2. Which products are dispensed to patients (as opposed to sold in the shop) — different stock logic.
3. Batch/expiry tracking. **Whether you want expiry-aware forecasting** — I recommend yes for
   herbal formulations, and it is not much extra work once stock exists.
4. Supplier lead times and who orders.

---

## 7. Infrastructure I would recommend adding (not strictly required)

| # | Item | Why it matters now | Effort |
| --- | --- | --- | --- |
| 1 | `CRON_SECRET` | ✅ **Complete.** Set in Vercel and verified — `/api/cron/backups` returns 401, which is proof the guard is armed. Nightly backups are running. See §0.1. | Done |
| 2 | Upstash Redis (`UPSTASH_REDIS_REST_URL` / `_TOKEN`) | Rate limits are currently in-memory per instance, so on Vercel they are per-function-instance and effectively weak. The automation engine also needs a **distributed lock** so two overlapping cron runs cannot double-send. | 15 min |
| 3 | Object-store backups (`BACKUP_S3_*`, `BACKUP_KMS_KEY_ID`, `BACKUP_AGE_RECIPIENTS`) | Backups are currently emailed only, and the email path has a 25 MB cap. `PatientEvent`, conversations and payments will make the database larger. | 1–2 h |
| 4 | Google Search Console + Bing Webmaster | Required for the image SEO work in M17 — you cannot verify or measure without them. Verification is a DNS TXT record, so I need you to add it. | 20 min |
| 5 | A PDF library | Needed by M12. I will add it when we reach M12, not before. | — |

---

## 8. Access I need for verification

I can build and test most of this, but some things can only be proven in production:

1. **Ability to check the Meta webhook delivery log** after the webhook is configured, to prove
   replies arrive.
2. **Fapshi sandbox transaction** for end-to-end payment testing before live. A real test payment
   and its reversal, ideally.
3. **A real test WhatsApp number** (not a patient's) so reminder flows can be exercised without
   messaging actual patients.
4. **A seeded test patient** in the portal for monitoring, adherence and escalation flows. I can
   build the seed script; I need to know whether a test environment is acceptable or whether this
   must run against production data.
5. **Your own walkthrough** of the final exception dashboard, because the headline format has to be
   useful to the person using it at 8am.

---

## 9. What I can start on right now, with nothing from you

| Module | Blocked? |
| --- | --- |
| M0 — foundation, timezone fix, test harness, `PatientEvent` | **Done.** |
| Cron authorization security fix | **Done and deployed** — `CRON_SECRET` set in Vercel, `/api/cron/backups` verified returning 401. See §0.1. |
| M18 — brand content (About page, home page, positioning, EN + FR) | **Done.** |
| M17 — image SEO audit and fixes | **Done, including the live data.** See `docs/IMAGE_SEO.md`. The 4 blog post covers pointing at old prompt filenames were repaired in MongoDB (§9.1). Search Console verification is §7.4. |
| M1 — inbound WhatsApp | **Done and verified against the live database.** See `docs/WHATSAPP_INBOUND.md`. 79 tests, plus an end-to-end HTTP run that proved the dedupe-before-side-effects ordering. Dormant: items 6, 7, 10 in §1 gate going live only. |
| M3 — treatment-plan lifecycle | **Done in code.** See `docs/TREATMENT_PLAN_SCHEDULE.md`. Cadences still need your answer (§5 rows 10–10e) before any patient sees them. |
| M2 — outbound engine | **Next, and unblocked.** M1 now supplies the two facts it cannot work without: the per-thread 24-hour window and per-message delivery status. |
| M4–M16 | Blocked on their prerequisites and, for M6, on §2 |

The honest summary: **most of the roadmap needs nothing from you to build and test.** The
Meta and Fapshi credentials gate *going live*, not writing the code. The only item that changes
the design rather than the schedule is the Fapshi account status (§2.1), and the only item that
needs a human decision before it can be built at all is the set of clinical and business
thresholds in §5 — which I have deliberately not guessed.

---

## 9.1 Live-data repair — done

**What I found.** The clinic's twelve editorial photographs were renamed from
image-generation-prompt filenames to descriptive slugs. Every path in the code is now derived
from `lib/image-registry.ts`, so the filenames cannot drift again — and the test suite verifies
each declared dimension against the real bytes of the file.

**But the MongoDB documents were not updated.** `scripts/seed-blog.ts` copied the cover path
verbatim into each blog post, so **four published posts had 404 cover images**:

| Slug | Now points at |
| --- | --- |
| `enlarged-prostate-every-man-over-50` | `s19-herbal-clinic-consultation-bafoussam.jpg` |
| `food-as-medicine-who-targets` | `s19-nutrition-health-education-workshop.jpg` |
| `natural-doesnt-mean-safe-herbs` | `s19-laboratory-liquid-transfer.jpg` |
| `type-2-diabetes-root-cause-care` | `s19-laboratory-pipette-reading.jpg` |

They were also appearing in `sitemap.xml` as broken `<image:loc>` entries, which is worse than not
being listed at all.

**Applied 30 Sep 2026.** The dry run reported `Covers needing repair: 4` / `Bodies needing repair: 0`
— exactly the four above, every target filename validated against the registry — so the update was
committed with `npm.cmd run fix:blog-covers -- --apply`. Re-running the dry run now reports `0` and
`0`, which is the idempotency check. The migration only ever touches `cover` and `body` on documents
that literally contain one of the listed legacy filenames, and it refuses to run if its targets
disagree with `lib/image-registry.ts`, so a typo cannot trade one 404 for another. The pre-migration
values were printed in the apply log above if you ever need to reverse it.

### 9.2 Two decisions I need before M3 can safely go live

M3 is done in code and fully tested. It now also **ships switched off**: `applyPlanSchedule` refuses
to run unless `TREATMENT_SCHEDULE_ENABLED` is exactly `"true"`, so the placeholder intervals cannot
reach a patient even by accident. Unset is *off*, not *on* — see `docs/TREATMENT_PLAN_SCHEDULE.md`
§0 and `lib/schedule-gate.ts`. The admin panel shows the refusal in the plan form rather than
saving silently, so "not switched on yet" never looks like "broken".

So the remaining work is two decisions, not a risk:

1. **Confirm the cadences, or replace them.** Every interval in `lib/treatment-rules.ts` is a
   placeholder I chose, not something a clinician approved. Reviews every 30 days, labs every 90
   days, seven days' notice. One edit changes them all. Argument them over with
   `npm.cmd run preview:plan -- 2026-10-01 2026-12-31`, which is read-only and not behind the gate.
   Setting the env var to `true` *is* the confirmation.
2. **Decide about a backfill.** Existing treatment plans get no schedule until they are next edited,
   because I will not write to your live database unasked. The engine is idempotent, so backfilling
   is safe to re-run — but it needs your go-ahead, and it should happen *after* the cadences are
   confirmed, or you would have to backfill again. Order: confirm → enable → backfill.

Refill reminders and instalment reminders are already switched off, so no patient will be asked for
money or told to reorder anything on my say-so.

---

## 10. Checklist to unblock the build

Ask S19 for, in priority order:

- [x] `CRON_SECRET` set in Vercel and verified in production — **closed** (§0.1)
- [ ] **WhatsApp sending:** `WHATSAPP_PHONE_NUMBER_ID` + permanent `WHATSAPP_ACCESS_TOKEN` (§1.4–5)
- [ ] **WhatsApp receiving:** `WHATSAPP_APP_SECRET` + `WHATSAPP_VERIFY_TOKEN`, and the callback URL
      saved with `messages` subscribed (§1.6–7, §1.10). **This is the one that makes replies work** —
      without it the number can send and cannot hear the answer. M1 is otherwise finished.
- [ ] Quick Reply buttons added to the ten templates, in the order `GET /api/admin/whatsapp` prints
      them (§1, and `WHATSAPP_INBOUND.md` §7)
- [ ] Opt-out line added to the bottom of each template body — clinic decides the wording (§1)
- [ ] Fapshi `apikey`, `apiuser`, `webhook secret`, live vs sandbox (§2.1–2.4)
- [ ] **Treatment cadences: review interval, lab interval, notice period (§5.10–10c)** — M3 is
      built, tested and inert; answering this and setting `TREATMENT_SCHEDULE_ENABLED=true` is the
      whole of the go-live
- [ ] Plan price and instalment count, if instalment reminders are wanted (§5.10d)
- [ ] Supply days per product + refill lead time + non-response policy (§5.1–5.3)
- [ ] Glucose thresholds and reading frequency, per patient (§5.5–5.6)
- [ ] Quiet hours and weekly message budget (§5.12–5.13)
- [ ] Escalation owners and deadlines (§5.4)
- [ ] Approved-scope assistant content (§4) — content only, no AI provider needed
- [ ] Stock counts and reorder points (§6.1)
- [ ] Search Console + Bing Webmaster DNS records (§7.4)

**No longer needed:** an AI provider, an API key, or any data-processing agreement (§3).
