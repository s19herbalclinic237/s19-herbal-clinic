# WhatsApp and payments — what we need from you

**For:** S19 Herbal Clinic
**Written:** 30 September 2026

**You do not need any technical knowledge to follow this.** Every step says what to
click and what you end up with. If a screen does not look exactly like the words here,
look for something similar — both companies rename their menus.

Two of the steps are long and are **someone else's review queue, not our work**. Please
start both applications today, even though the WhatsApp keys are what we need first.

---

## 1. What this costs

| | |
| --- | --- |
| **WhatsApp, finished** | **20,000 FCFA** |
| **Payments (Fapshi), from nothing** | **30,000 FCFA** |
| **Total** | **50,000 FCFA** |

**They are two separate pieces of work and you can take them separately.** If you would
rather do WhatsApp now and decide on payments later, that is fine — pay 20,000 now and
the 30,000 only when you are ready.

**Why these numbers.** This is a fixed price for a fixed amount of work, not an open
hourly bill:

| Work | Days |
| --- | --- |
| WhatsApp — the reply box in your dashboard, and connecting the 9 places the site sends messages | 2 |
| WhatsApp — setting up the account, creating the message templates, testing against a real number | 0.5 |
| Payments — taking payment, confirming payment, handling the one-notification-only rule | 3 |
| Payments — payment reporting in your dashboard, and the written guides | 1 |
| **Total** | **6.5 days** |

**What you are not being charged for:** the part of WhatsApp that *receives* messages
is already built and was included in the original 125,000. That is the difficult half —
the inbox, the duplicate-message protection, the opt-out handling, and the dashboard
screen. This price covers **finishing** it: the box where you type replies, and the
scheduled reminders.

**What it costs you to run, monthly:**

| | |
| --- | --- |
| WhatsApp messages the clinic sends | **about 2–3 FCFA each** — a whole month of reminders is roughly **1,500 FCFA** |
| Replying to a patient within 24 hours | **free** |
| Payments | **3% of each payment collected.** Payouts to your MTN MoMo are **free** |
| The SIM for the new number | about 1,000–2,000 FCFA/month |

There is **no subscription, no monthly fee and no minimum** with either company. If you
do not use it, you do not pay for it.

**How to pay:** half when we start, half when it goes live. 20,000 now, 30,000 later.

---

## 2. What the patient actually sees

This is the part worth reading before you spend anything, because it is the part that
changes how the clinic works day to day.

**When a patient writes to the clinic's number, their message appears in your dashboard
by itself.** Nobody forwards anything, and it does not matter which staff member's
phone it came to — there is one shared list of conversations, and anyone on the team can
open any thread.

**A staff member opens the thread, types a reply, and presses send.** The patient
receives it in their own WhatsApp, in the same conversation, from the clinic's number.
The reply is saved in the dashboard, attributed to whoever sent it, and stays part of
the patient's record.

So from a patient's point of view there is nothing unusual happening — it is an ordinary
WhatsApp conversation with the clinic. The dashboard is just where your staff read and
write it instead of living in their phones.

**Three details that will come up:**

**Patients can still reply for 24 hours after any message.** For those 24 hours the
clinic can write in plain words, with no template and no cost. After 24 hours the
conversation has to start again from a template. In practice this means a patient who
writes in gets a proper conversation, not a wall of form messages.

**A reminder from the clinic looks like a normal message with buttons under it** — for
example *"Your appointment is tomorrow at 10:00"* with **Confirm**, **Reschedule** and
**Ask a question** underneath. The patient taps a button instead of typing, so there is
no misunderstanding about what they are agreeing to. Asking a question puts the
conversation in front of staff.

**The clinic controls how often patients are messaged.** There is a quiet period where
nothing is sent automatically, a weekly limit per patient, and a rule that stops a
reminder being sent if it would no longer be true. You will be asked to confirm the
quiet hours and the weekly limit before any of it starts.

**If a patient wants to stop, they type STOP** and nothing more is sent to them. This
works for any number, including one that is not yet a patient.

**Calls are not affected.** The number stays a normal phone number. Put a SIM in it and
patients can phone the clinic exactly as they do now.

---

## 3. Start these two things first

Both are waiting on a stranger to review your paperwork, and neither is something our
effort can speed up.

| | What | Who decides | How long |
| --- | --- | --- | --- |
| **A** | **Apply to Fapshi for a merchant account** (§5) | Fapshi | 1–5 working days |
| **B** | **Decide the WhatsApp number** (§4) | **You** | 1 hour, plus SIM delivery |

**B is the one decision only you can make, and getting it wrong is the expensive
mistake here.** Please read �4 before doing anything else.

---

## 4. WhatsApp — the number, then the keys

### Step 1: Choose the number

| Option | |
| --- | --- |
| **A brand-new SIM you buy for the clinic** | **Best.** Nothing to break. |
| Move the number you already use in the WhatsApp Business App | Possible, but the number must be **deleted from the app first.** Until it is, Meta refuses it. |
| A number that is someone's personal WhatsApp | **Not possible.** Personal accounts cannot be moved to a business account. |

The number must be able to **receive a 6-digit code by SMS or an automated voice
call.** Landlines and some prepaid SIMs cannot. It should be **yours, not rented** — if
the clinic stops paying for it, the number goes with it.

**Keep using the WhatsApp Business App for replies until we tell you not to.** The
clinic will have two numbers for a while. That is normal and safe.

### Step 2: Create the account

1. Go to <https://developers.facebook.com/async/registration/> and register with a
   Facebook login. Choose **Business**. Free.
2. <https://developers.facebook.com/apps> → **Create App**. Name it "S19 Herbal Clinic",
   add an email address.
3. Use case → **Connect with customers through WhatsApp** → Next. Attach the clinic's
   business portfolio (create one if needed) → **Create app**.
4. Open **WhatsApp → API Setup** → **Start using the API** → **Add phone number**.
   Enter the new number. You will need the verification code.
5. **WhatsApp → Configuration → Two-step verification.** Set a 6-digit PIN and **write
   it down somewhere safe before you close the screen.** If it is lost, Meta will not
   let the number be registered again. **Do not send this PIN to me.**

### Step 3: Get the four keys

**Business Settings → Users → System Users → Add** → **Generate new token** → tick
**`whatsapp_business_messaging`**. Copy it. *A token made the ordinary way expires after
24 hours — this one does not.*

Then you have four values:

| Send me this | Where it is |
| --- | --- |
| **Phone Number ID** | WhatsApp → API Setup |
| **Permanent access token** | Step 3 above |
| **App Secret** | App Settings → Basic → *App secret → Reveal* |
| **A verify token** | Any random words you invent. Send it to me. |

### Step 4: Two things that take longer

**Business verification.** Business Settings → Security. Upload the clinic's
registration document, tax ID and a utility bill. Meta reviews this over several days.
Not needed for testing, needed before sending in bulk.

**A payment method.** Business Settings → Payments. Meta charges per message, so a card
must be on the account before real sending.

### Step 5: The message templates

Meta requires every message the clinic starts to use an approved template, and reviews
each one.

**I will give you the exact text, the exact names, and the buttons in the exact order
to create them.** Each one is created in English and French.

Two things to be careful about, because both fail silently:

- **Do not reorder the buttons.** Meta delivers a button by its position, not by its
  words. Reordered, tapping one button sends a different one, and a patient could be
  unsubscribed by mistake with no visible error.
- **One line I need your decision on.** Meta requires every template to say how to
  stop receiving messages. That wording is yours to approve, so I will propose one.

---

## 5. Payments (Fapshi)

Fapshi is a **Cameroon-only mobile-money gateway** — MTN Mobile Money, Orange Money and
Fapshi balance. It is not a card processor, which is correct for this clinic, because
that is how patients actually pay here.

### Step 1: Apply

<https://www.fapshi.com> → register as a business. You need the clinic's registration
document, tax ID, bank account and a contact. **This is a review by Fapshi, 1–5 working
days. Start it today.**

### Step 2: When approved, send me three values

| Send me this | Where it is |
| --- | --- |
| **API key** | Fapshi dashboard → developer / integration area |
| **User key** | Same screen |
| **A webhook secret** | A random string you choose and set for the payment service. Save it. |

Also tell me one word: **sandbox or live?** We test in sandbox first, then switch.

### Step 3: Please leave one box empty for now

**Do not save a webhook URL in the Fapshi dashboard yet. I will give it to you when the
payment work is finished, and I will ask you to confirm it before anything goes live.**

This matters: Fapshi sends each payment notification **exactly once and never tries
again.** If the receiving end is not ready, every payment message that arrives is lost
permanently — which would mean taking a patient's money without marking the order paid.
Leaving the box empty costs nothing and prevents that.

### Step 4: One question for Fapshi

Ask them whether **IP whitelisting** is switched on, and if so, whether it can be
disabled. Some accounts have it enabled by default and it can block legitimate payment
calls. Worth asking while your application is in front of them.

### Three business questions

Not keys — decisions. I have a recommendation for each, but these are yours:

1. **Mobile money only, or cards too?** My recommendation: mobile money now, so a card
   provider can be added later without redoing the payment work.
2. **What commission percentage is agreed?** This affects the totals patients are shown
   and your reporting.
3. **Who authorises a refund?** Better decided now than during the first refund request.

---

## 6. Sending the keys

**These are passwords.** Anyone with the WhatsApp token can send messages as the
clinic. Anyone with the Fapshi keys can move money. So it matters how they travel.

**What to send me, and nothing else:** the four WhatsApp values from §4 Step 3, and the
three Fapshi values from §5 Step 2. I have everything else I need.

**Never send, to anyone, including me:** your Facebook or Meta password, the 6-digit
two-step PIN, any verification code either company texts or calls you, or scans of the
clinic's identity documents. Those go to Meta and Fapshi directly. I do not need them
and I will refuse them.

**The two-step PIN especially.** You write it down and you keep it. If Meta loses it,
your number cannot be registered again — not by you, not by me, not by Meta support.
It is worth more than every key on this page.

**How to send.** Direct message or email, whichever you use for clinic paperwork, and
say in the subject line that it contains the WhatsApp and Fapshi keys so it is not
opened by accident. Once I have them I will confirm back to you that they are working.

**If you would rather not send them at all,** the alternative is to add me as a member
of the Meta Business account and the Fapshi dashboard and I do the clicking instead.
Ask and I will send the invitations.

**If you are unsure whether something is safe to share, ask first.**

---

## 7. Send this back when you are done

No secrets in this form — just confirmation.

**WhatsApp**

| | |
| --- | --- |
| New number chosen | ☐ Yes, the number is `+237 …` |
| It can receive an SMS or voice call | ☐ Yes ☐ **No** — WhatsApp cannot be set up on it |
| Was it ever in the WhatsApp Business App | ☐ No ☐ Yes, and deleted from the app ☐ Yes, still there |
| Two-step PIN written down somewhere safe | ☐ Yes |
| Phone Number ID sent | ☐ Yes, via ____________ |
| Permanent access token sent | ☐ Yes, via ____________ |
| App Secret sent | ☐ Yes, via ____________ |
| Verify token sent | ☐ Yes, via ____________ |
| Business verification submitted | ☐ Yes, on ______ ☐ Not yet |
| Payment method added | ☐ Yes ☐ Not yet |
| Templates created in English and French | ☐ Yes ☐ Not yet |
| Opt-out wording agreed | ☐ Yes, wording: ______________ |

**Payments**

| | |
| --- | --- |
| Fapshi applied for | ☐ Yes, on ______ ☐ No |
| Approved | ☐ Yes, on ______ ☐ Pending ☐ Refused |
| API key sent | ☐ Yes, via ____________ |
| User key sent | ☐ Yes, via ____________ |
| Webhook secret set and sent | ☐ Yes, via ____________ |
| Sandbox or live | ☐ Sandbox ☐ Live |
| Webhook URL | ☐ **Left empty on purpose, as instructed** |
| Is IP whitelisting on | ☐ No ☐ Yes — Fapshi said: ____________ |
| Commission percentage | ______ % |
| Who authorises refunds | ______________________ |

---

## 8. If you get stuck

| What you see | Do this |
| --- | --- |
| Meta: "This phone number is not available" | It is still in the WhatsApp Business App. Delete it from there, wait 24 hours, try again |
| Meta: verification code never arrives | The number cannot receive codes. Use a different SIM |
| Meta: token disappears after a day | It was a temporary token, not a System User token. Redo Step 3 |
| Meta: "display name not approved" | The name contains WhatsApp, Meta, Official or Verified. Remove them |
| Meta: webhook verification fails | Check the address is exactly `https://www.s19herbalclinic.com/api/webhooks/whatsapp` and the verify token is character-for-character the one you chose |
| Meta: webhook says "subscribed" but no replies arrive | It must be subscribed to **`messages`** |
| Fapshi: keys not visible | The account is not approved yet. They appear after approval |
| Fapshi: 403 on every payment call | IP whitelisting. Raise it with Fapshi support |
| Fapshi: a patient says they paid but the order is not confirmed | **Do not ask them to pay again.** Send me the reference and I will check it. Expected occasionally; there is a manual fix |

**Who to contact:** Meta Business support, inside your Business Settings help menu. For
Fapshi, the support email in your merchant dashboard — mention your merchant ID.
