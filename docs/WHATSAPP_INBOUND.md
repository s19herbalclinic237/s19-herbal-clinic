# Inbound WhatsApp (M1)

Patients can reply to the clinic on WhatsApp. This module makes that reply arrive.

**Status: built and dormant.** Every code path is in place, type-checked and
unit-tested. Nothing is received until `WHATSAPP_APP_SECRET` and
`WHATSAPP_VERIFY_TOKEN` are set in the deployment environment and the webhook URL
is saved in the WhatsApp Manager. Until then Meta has nowhere to deliver, and the
clinic behaves exactly as before.

Companion document: [WHATSAPP_SETUP.md](WHATSAPP_SETUP.md) for the outbound side.
That one tells you how to create the templates; this one covers the path replies
travel back through, and what the code does with them once they arrive.

---

## 1. The gap this closes

| Question | Answer before M1 | Answer now |
| --- | --- | --- |
| Does the clinic send WhatsApp messages? | Yes — 10 approved templates, `en` + `fr`. | Unchanged. |
| Is there a route that receives replies? | **No.** | Yes — `app/api/webhooks/whatsapp`. |
| If a patient replies, what happens? | Meta delivers it to a webhook you have not configured. **The reply is discarded.** | It is stored, deduplicated, attributed to the patient, and shown to staff. |
| Can the clinic see the reply? | No. The clinic's WhatsApp Business App is not connected to this number. | Yes — a read-only staff inbox in the dashboard. |

---

## 2. Files

| File | Role |
| --- | --- |
| `lib/whatsapp-templates.ts` | The template catalogue and the button-payload grammar. Pure data, so it is testable. |
| `lib/whatsapp-signature.ts` | Signature and handshake verification. Pure decisions. |
| `lib/whatsapp-inbound.ts` | Reading Meta's payload, clamping timestamps, classifying intent. Pure. |
| `lib/whatsapp-inbound-log.ts` | The only thing that writes. `server-only`. |
| `lib/models/Conversation.ts` | One thread per phone number, with Meta's 24-hour window state. |
| `lib/models/WhatsAppMessage.ts` | Individual messages, both directions. Unique `wamid`. |
| `app/api/webhooks/whatsapp/route.ts` | `GET` handshake, `POST` receiver. |
| `app/api/admin/whatsapp/inbox/route.ts` | The staff inbox: list conversations, clear all. |
| `app/api/admin/whatsapp/inbox/[id]/route.ts` | One thread, and clear its flags. |
| `components/admin/whatsapp-inbox-tab.tsx` | The dashboard panel. |
| `tests/whatsapp-signature.test.ts` | 30 tests on the authentication decisions. |
| `tests/whatsapp-inbound.test.ts` | 47 tests on parsing, hostile input, intent and the catalogue. |

---

## 3. What you must set

| Variable | Why | Effect if missing |
| --- | --- | --- |
| `WHATSAPP_APP_SECRET` | Signs every delivery, so a forged one can be refused. | `POST` returns **503** and every reply is refused. This is deliberate — see §4. |
| `WHATSAPP_VERIFY_TOKEN` | Meta's one-time subscription handshake. | The handshake returns **503** and the clinic never subscribes. |

Both are independent of `WHATSAPP_ACCESS_TOKEN` / `WHATSAPP_PHONE_NUMBER_ID`, which
control **sending**. A clinic can be configured to send but not to receive, and
would then believe replies are being handled while they are being dropped. The
admin status endpoint reports the two halves separately for exactly that reason:

```
GET /api/admin/whatsapp  →  { configured, inbound: { appSecret, verifyToken, url } }
```

### Webhook URL

```
https://www.s19herbalclinic.com/api/webhooks/whatsapp
```

Subscribe to the **`messages`** field. That is the only field that delivers replies
*and* delivery receipts; `message_template_status_update` is a different
subscription and is not used.

---

## 4. The security property, and why an unset secret refuses

Without a signature check, a webhook endpoint is an open door. Anyone who learns the
URL can POST a payload claiming to be a message from any phone number, and this
application will resolve it to a patient, append it to that patient's **health
record** as something they said, and open a 24-hour free-form sending window on
their file. That is forged clinical data and forged consent in one request.

So the signature is verified on every delivery, and an **absent app secret is a
refusal, not a pass**.

This is not a hypothetical inversion. `CRON_SECRET` was unset on this deployment
and its guard was written as `if (secret && ...)`, so an unconfigured secret
*skipped the check* and the backup endpoint served a full database export to
unauthenticated callers. The same shape here would mean that adding the webhook
without adding the secret turned the endpoint into an unauthenticated write
path into patient records. `evaluateHubSignature` returns 503 for an unset secret
before it even looks at the header, and `tests/whatsapp-signature.test.ts` asserts
that a valid signature still does not help.

**Why fail closed rather than stay open.** The alternative — treat "unset" as
"development" — buys nothing and hides a deployment mistake behind a feature that
appears to work. As shipped, the failure is visible: Meta retries, the admin status
endpoint shows `appSecret: false`, and the error log says which variable to set.
Refusing also costs nothing functionally, because before M1 replies were discarded
anyway.

**The one exemption** is `NODE_ENV=development`, so the endpoint can be exercised
with `curl` locally. Every other value — including `test`, `staging` and anything
else — is treated as production. Asserted by test, not left to inspection.

### The raw body matters

The signature is an HMAC of the raw bytes. `JSON.parse` discards key order and
whitespace, so re-stringifying the parsed object produces a different digest and
**every genuine delivery is rejected** while forgeries are still refused — fails
closed, and useless. The route therefore reads the body once with
`request.text()` and hands the identical string to both the verifier and the
parser.

If you ever put a proxy in front of this endpoint, it must not re-serialise the
body. Symptom of a broken proxy: `bad_signature` in the error log on every genuine
delivery, while `hub.challenge` still works.

### Status codes

| Code | Meaning | Meta retries? |
| --- | --- | --- |
| 200 | Stored, or recognised as a redelivery, or an empty delivery | No — and that is the point |
| 400 | The body was not a webhook payload, or not JSON | No |
| 401 | The signature did not verify | No |
| 413 | Body over 1 MB | No |
| 503 | `WHATSAPP_APP_SECRET` unset, **or** a message could not be stored | **Yes** |

The 503-on-store-failure is deliberate and is the one case where refusing is
strictly better: a transient database outage answered with a 200 loses the reply
permanently, because there is no second copy. The retry collapses onto the `wamid`
unique index, so nothing is processed twice.

---

## 5. Idempotency: why the insert comes first

Meta redelivers until it receives a 200, without warning, over a period of hours.
The same message can arrive five times and the only thing distinguishing it from
the original is its `wamid`.

Deduplication is therefore a **unique index**, not a check-then-insert — the latter
loses the race whenever two deliveries arrive together. The ordering in
`lib/whatsapp-inbound-log.ts` is:

```
loop guard → find/create conversation → INSERT MESSAGE → counters, events, consent
```

The insert sits **before** the side effects because it *is* the deduplication. A
redelivery collides, throws `E11000`, and nothing after it runs. Reversing this
would increment `unread` and push out the service window on every redelivery,
making a patient who sent one message look like they sent five.

Verified against the live database: three deliveries of the same two messages
produced `unread: 2`, not 6.

The conversation is created *before* the insert only because the message row needs
its id. That step is deliberately side-effect free (`$setOnInsert` and the
minimum), so repeating it changes nothing.

---

## 6. The 24-hour window

Meta's customer service window is the single fact that makes conversational
automation affordable. Inside 24 hours of a patient writing in, the clinic may reply
with **free text and no approved template**. Outside it, every message must use a
template.

M1 owns the window because the inbound message is what **opens** it, so the inbound
writer is the only place it can be set correctly. `windowExpiresAt` is stored on
the conversation as `timestamp + 24h` — computed from Meta's own send time, not
from our receipt time, so processing delay does not eat into the patient's window.
M2 reads it before every send.

The window is computed on demand by `isServiceWindowOpen()`, never stored as a
"still open" boolean, so it cannot go stale. **Absent or unparseable state reads as
closed**, which is the safe direction: the alternative invites a free-form send
with no basis for one.

---

## 7. Why buttons, given there is no AI anywhere in this project

There is no language model in this codebase. Intent therefore cannot be inferred;
it has to be **stated**.

Free text is genuinely ambiguous. "Yes please" could be confirming an appointment,
asking about a fee, or cancelling. "How much" needs an answer, and an answer that
guesses a fee is worse than no answer. A Quick Reply button removes the ambiguity
completely: tapping one returns a fixed payload the code matches exactly.

This is the difference between an assistant a patient can trust on a clinical
question and one they cannot. The buttons are not a convenience — they are what
makes automation safe here.

Every payload is `s19:<action>`, drawn from a closed vocabulary:

| Action | Means | Handled by |
| --- | --- | --- |
| `confirm` | "Got it" | recorded, no action |
| `question` | "Ask a question" | M13 (curated answers) |
| `human` | "Speak to the clinic" | hard hand-off, always |
| `stop` | "Stop these messages" | **M1 — honoured now** |
| `reschedule` | "Change the time" | M5 |
| `refill` | "Order more" | M4 |
| `track` | "Track my order" | existing track page |

A payload outside the vocabulary is reported as `foreign` and routed to a human,
never guessed at. That covers a template edited in the WhatsApp Manager after
deployment — a patient taps something real, and staff see it rather than the
message vanishing.

### Button order is load-bearing

Meta addresses a quick reply by its **index** in the template, not by its label. The
send only carries the payload. So if the buttons are reordered on a live template
in the WhatsApp Manager, the payload for "ask a question" is delivered as the tap
on **"stop these messages"**.

That failure is silent: the send succeeds and the patient is unsubscribed. The
order is therefore defined once in `lib/whatsapp-templates.ts`, and
`GET /api/admin/whatsapp` prints the buttons **in the order the code will use them**
for the clinic to create. Copy from that endpoint, not from memory.

---

## 8. Opting out, and the bug the live run found

Meta requires a working opt-out. For a utility template the only mechanism is the
patient replying, so both routes are handled:

- Tapping the **Stop these messages** button (`s19:stop`).
- Typing `STOP` — or `quit`, `end`, `unsubscribe`, `cancel`, `opt out`, and the
  French equivalents.

Matched against the **whole normalised message**, never a substring. This is
correctness, not caution: *"I want to stop taking this medicine"* contains the word
"stop", and a substring match would silently unsubscribe a patient from their
treatment notifications over a sentence about their dosage, which they would not
discover for weeks. Accents are not folded either — a patient who types `ARRET`
without the circumflex gets a message to a human, which is the acceptable outcome.

An opt-out has two effects, and **both always apply**:

| Effect | Where | When |
| --- | --- | --- |
| `Conversation.optedOut` is set | Always | An unlinked number has no `User` row, so the conversation is the only place the refusal can live |
| `User.whatsappOptIn` set to `false` | Only if a patient is linked | There is nothing to write to otherwise |

`optedOut` is **not** a cache of consent. Consent lives on the `User` and is always
read live — a cached consent flag is how a clinic ends up messaging someone who
opted out. `Conversation.optedOut` is the one piece of state with nowhere else to
live.

This was found by running the webhook against the live database: a `s19:stop` from
an unlinked number reported `optOuts: 0`, because the original code gated the whole
opt-out on having a patient. The refusal would have evaporated the moment staff
linked that number to a patient record. The decision is now the pure, tested
`optOutEffects()` in `lib/whatsapp-inbound.ts`.

The staff inbox shows an **"Opted out"** badge so nobody re-engages by hand.

`whatsappOptInAt` is deliberately left alone when consent is revoked. It is Meta's
evidence of *when consent was granted*, and the revocation is appended to the
append-only `PatientEvent` log as a `consent` event — which is exactly what an event
log is for, and keeps the two facts from being conflated on one row.

---

## 9. The staff inbox

**Why it ships with the webhook.** The clinic's WhatsApp Business App is not
connected to this number. Adding a webhook and stopping there would not fix
anything — it would make the failure quieter, because the clinic would believe
replies were handled. M1 has to end somewhere a human can look.

**There is no reply box, deliberately.** Sending free-form text requires the
service-window state and the clinic's consent position, and both are M2's job. A
compose box would invite a clinician to type into a window the system has not
verified — and the failure mode, a message that silently never arrives, is the
exact one this module exists to end.

The panel shows: threads needing a person, unread, and all; the message preview;
whether the 24-hour window is open; and the last delivery status Meta reported.

`needsAttention` is set on almost everything M1 records — a free-text message, an
unrecognised button, an unknown sender, someone asking for a person. **M1 answers
nobody, so almost everything that arrives is something a person should read.**
Reading a thread, or pressing "Mark all read", clears both flags. M1 never clears
them by itself.

Unresolved senders show a masked number (`+…1222`). That is not obfuscation for
its own sake: a staff member has no other way to know who is talking, and the full
number is one click away on the thread.

---

## 10. Retention and privacy

Inbound text can be a patient's own description of a symptom, which makes these
collections **health records**. They are kept for the life of the patient record and
swept into the encrypted backup like every other collection. There is deliberately
**no TTL index** on either model, for the same reason `PatientEvent` has none.

Two deliberate omissions:

- **Media is never downloaded.** A photo, voice note or document is recorded as a
  Meta id and shown as "sent an image". Pulling patient media into the clinic's
  storage is a separate decision with its own consent, retention and size
  consequences.
- **Message text never reaches the error log.** An inbound message can be a symptom
  description, and `AppLog` is not where that belongs. Failures log the `wamid`,
  the kind and the error.

---

## 11. What is deliberately not here

| Not built | Why | Where |
| --- | --- | --- |
| Automatic replies | Needs clinic-approved answer content, which does not exist. Guessing a fee or a dosage is the failure mode this project is built to avoid. | M13 |
| Recipients choosing buttons for the clinic | Business logic, not plumbing. | M4, M5 |
| Booking from a button | Same. | M5 |
| Delivery-status reconciliation | The receipts are **captured** on `WhatsAppMessage.status`; turning that into an outbox is the next step. | M2 |
| Catch-up on missed sends | Needs the outbound rules engine. | M2 |
| `message_template_status_update` | A separate subscription; nothing here depends on it. | — |

---

## 12. Verifying it by hand

Repeatable without adding anything to the repository. Use `curl` while
`npm run dev` is running, or a Meta-provided tool such as the WhatsApp Manager's
**Test** button.

```bash
# 1. Handshake. Must echo the challenge verbatim, unquoted, as text/plain.
curl "http://127.0.0.1:3000/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=1158201444"

# 2. A text message. Development exempts the signature check.
curl -X POST http://127.0.0.1:3000/api/webhooks/whatsapp \
  -H "Content-Type: application/json" \
  -d '{"object":"whatsapp_business_account","entry":[{"id":"W","changes":[{"field":"messages","value":{"messages":[{"id":"wamid.TEST1","from":"999000111222","timestamp":"'$(node -e 'process.stdout.write(String(Date.now()))')'","type":"text","message":{"type":"text","text":{"body":"hello"}}}]}}]}]}'

# 3. Send the identical body again. Must report duplicates: 1, stored: 0.
#    Then open the dashboard -> WhatsApp. unread must still be 1.
```

Expected from step 2:

```json
{ "received": 1, "stored": 1, "duplicates": 0, "ignoredSelf": 0,
  "needsAttention": 1, "optOuts": 0, "statusesApplied": 0 }
```

`999000111222` is reserved for testing by ITU-T, so it cannot collide with a
Cameroon subscriber, and it will not resolve to a patient — which is also a useful
check, because it proves a stranger's message does **not** land on someone's chart.

### Running against the live database

`server-only` is a Next.js alias, so `lib/whatsapp-inbound-log.ts` cannot be loaded
by `tsx` — which is what forces this to be tested over HTTP rather than as a unit.
The models have no such import, so inspecting the result is a plain script:

```ts
// scripts/… — connect, print, then delete everything for the test number.
import { connectDb } from "@/lib/db";
import { Conversation } from "@/lib/models/Conversation";
import { WhatsAppMessage } from "@/lib/models/WhatsAppMessage";
```

Remember to load `.env.local` first — `tsx` does not, and Next does
(`dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })`, the pattern
in `scripts/fix-blog-cover-paths.ts`).

---

## 13. Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| `503`, `reason: unconfigured` | `WHATSAPP_APP_SECRET` unset in the deployment | Set it: App Settings → Basic → App Secret |
| `401 bad_signature` on every genuine delivery | A proxy re-serialising the body, or a stale secret | Remove the proxy's JSON handling; confirm the app secret |
| `401` and the handshake works | `WHATSAPP_APP_SECRET` and `WHATSAPP_VERIFY_TOKEN` are different values | They are separate variables; set both |
| The clinic never subscribes in Meta | Challenge not echoed verbatim, or wrong verify token | Check `text/plain` and `WHATSAPP_VERIFY_TOKEN` |
| Meta says subscribed, no messages arrive | Wrong field subscribed | Must be `messages` |
| Replies land but the inbox is empty | Signed-in user is a patient, not staff | The tab is `isStaff`-gated |
| `received: 0` on every delivery | Payload had no `entry` array | Check the webhook URL points at this route |
| A patient says they pressed stop and still got messages | The sender was not a known patient | Fixed in this module; `optedOut` is now always recorded |

Every refusal is written to the admin error log with the reason and the fix, so the
Error Log panel is the first place to look.
