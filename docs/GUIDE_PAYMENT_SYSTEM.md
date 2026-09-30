# SavoirNet — Payment System: Full Architecture, Fapshi Deep-Dive, Flaw Catalogue & Next.js Checkout Design

> **Scope**: the CodeIgniter 4 payment stack in this repository (`app/Controllers/Payment.php` and
> friends), an end-to-end walkthrough of the Fapshi integration, a complete catalogue of defects with
> file/line references, and a gateway-agnostic checkout architecture for a Next.js e-commerce app.
>
> **No secrets appear in this document.** Keys are referenced by variable name only.
>
> Verified against the official Fapshi documentation (`docs.fapshi.com`) on the date of writing.

---

## Table of Contents

1. [The four tables and what each one owns](#1-the-four-tables-and-what-each-one-owns)
2. [End-to-end flow (Fapshi path)](#2-end-to-end-flow-fapshi-path)
3. [Every database interaction, in order](#3-every-database-interaction-in-order)
4. [The "N reads + 1 extra" pattern](#4-the-n-reads--1-extra-pattern)
5. [Problem 1 — Double payment debit](#5-problem-1--double-payment-debit)
6. [Problem 2 — Double processing (activation / commission)](#6-problem-2--double-processing-activation--commission)
7. [The "100 + 1" commission cap](#7-the-100--1-commission-cap)
8. [Fapshi, end to end](#8-fapshi-end-to-end)
   - 8.1 [What Fapshi is](#81-what-fapshi-is)
   - 8.2 [Initiation — `POST /initiate-pay`](#82-initiation--post-initiate-pay)
   - 8.3 [Callback A — the return URL](#83-callback-a--the-return-url)
   - 8.4 [Callback B — the webhook](#84-callback-b--the-webhook)
   - 8.5 [Status mapping as implemented](#85-status-mapping-as-implemented)
   - 8.6 [The fallback chain as built](#86-the-fallback-chain-as-built)
9. [Flaw catalogue](#9-flaw-catalogue)
10. [Next.js e-commerce checkout — gateway-agnostic](#10-nextjs-e-commerce-checkout--gateway-agnostic)
11. [Operations runbook](#11-operations-runbook)
12. [Appendix — file index](#12-appendix--file-index)

---

## 1. The four tables and what each one owns

| Table | Role | Written by |
|---|---|---|
| `users` | **Entitlement flag**: `has_paid`, `payment_date`, `wallet_balance`, `referred_by`, `country` | `activateUserAccess()`, `ReferralModel::createReferralChain()` |
| `payment_transactions` | **Payment attempt / intent** — one row per `POST /payment/process`. Holds `token_pay` (the Fapshi `transId`), `payment_url`, `status`, `webhook_data` | `processWithFapshi()`, `webhookFapshi()`, `checkFapshiPaymentStatus()` |
| `payments` | **Receipt / ledger** — one row per *successful settlement* | `PaymentModel::recordPayment()`, called from `activateUserAccess()` |
| `referrals` | **Commission rows** — one row per `(referrer, referred, level)` | `ReferralModel::createReferralChain()` |

### 1.1 The structural problem hiding in plain sight

The system keeps **two independent sources of truth** for "did this person pay?":

- `payment_transactions.status = 'paid'`
- `users.has_paid = 1`

Nothing enforces that they agree, and no single atomic operation claims ownership of the transition.
Nearly every defect in this document traces back to that duplication.

### 1.2 The two payment tables are not redundant — but they are not linked either

- `payment_transactions` is an **attempt** (a shopping cart that got sent to a gateway). It is created
  *before* the customer pays and can end `pending`, `paid`, `failure` or `cancelled`.
- `payments` is a **settlement receipt**. It is created *after* a confirmed payment, inside
  `activateUserAccess()`.

There is **no foreign key** from `payments` to `payment_transactions`. The receipt stores an
independently generated `transaction_id` of the form `TXN_<UNIQID>` (`Payment.php:714`), which is
**not** the Fapshi `transId`. The only way to join a receipt back to its gateway transaction is to
read `payment_transactions.transaction_number`, which is populated only on success.

Consequence: reconciliation ("which Fapshi transactions have no receipt?") requires a manual join on
a free-text column rather than a key.

### 1.3 Commission constants

`app/Models/ReferralModel.php:43-58`

```php
const COMMISSION_AMOUNTS = [1 => 2000, 2 => 1000, 3 => 500, 4 => 500];   // FCFA, FIXED
const COMMISSION_RATES   = [1 => 40.00, 2 => 20.00, 3 => 10.00, 4 => 10.00];  // display only
```

`calculateCommission($amount, $level)` (`:63-70`) **ignores `$amount` entirely** and returns the fixed
constant. Max total payout is therefore `2000 + 1000 + 500 + 500 = 4000` FCFA on a 5000 FCFA sale
(80%), and payouts can never exceed the sale regardless of what amount is passed in. `COMMISSION_RATES`
is written to the row for display and never participates in arithmetic.

---

## 2. End-to-end flow (Fapshi path, `country = 'CM'`)

```
User                        Browser                Fapshi                 MySQL
 │                            │                      │                      │
 ├── GET /payment ───────────>│  Payment::index()     │                      │
 │                            │  reads users.country  │                      │
 │                            │  gateway = 'fapshi'   │                      │
 │                            │  displays 5000 XAF    │                      │
 │                            │                      │                      │
 ├── POST /payment/process ──>│  Payment::process()   │                      │
 │                            │  guard: has_paid?     │                      │
 │                            │  INSERT payment_transactions (status=pending)
 │                            ├── POST /initiate-pay ─>│                      │
 │                            │  {amount,email,redirectUrl,webhook,          │
 │                            │   userId,externalId,message}                  │
 │                            │<─ 200 {link, transId} ─┤                     │
 │                            │  UPDATE payment_transactions                 │
 │                            │    SET token_pay, payment_url                 │
 │<─── 302 Location: link ───┤                      │                      │
 │                            │                      │                      │
 │                    (customer pays on the Fapshi hosted page: MTN MoMo / OM)
 │                            │                      │                      │
 │<── 302 /payment/callback ──┤  Payment::callback() │                      │
 │                            │  reads LAST transaction                     │
 │                            │  re-polls Fapshi only if payment_method==fapshi
 │                            │<── GET /payment-status/{transId} ─┤         │
 │                            │  ...or...                          │         │
 │                            │<── POST /payment/webhook-fapshi ───┤         │  Payment::webhookFapshi()
 │                            │  {transId,status,amount,externalId}│         │  UPDATE → 'paid'
 │                            │  UPDATE payment_transactions ──────┼────────>│  activateUserAccess()
 │                            │  activateUserAccess()               │         │  ├ users.has_paid = 1
 │                            │                                     │         │  ├ INSERT payments (TXN_xxx)
 │                            │                                     │         │  └ INSERT referrals ×4
 │                            │                                     │         │    + wallet_balance
```

### 2.1 Gateway routing

`Payment::process()` (`:105-112`) branches on the user's country:

| Country | Gateway | Amount sent | Amount recorded as revenue |
|---|---|---|---|
| `CM` (Cameroon) | Fapshi | `5000` | `5000` (gross — Fapshi fees ignored) |
| everything else | SebPay | `4500` (SebPay adds 500 in fees → 5000 total debit) | `4500` — **10% under-report** |

The `SEBPAY_COUNTRIES` constant (`:25-28`) is defined but **never used** for routing; the `else`
branch catches all non-CM countries, including ones SebPay does not support (e.g. `US`, `FR`).
`index()` (`:49-55`) uses the same binary branch, so a user in an unsupported country is still shown
a SebPay form.

---

## 3. Every database interaction, in order

### 3.1 `processWithFapshi()` — `app/Controllers/Payment.php:115-196`

1. `INSERT INTO payment_transactions` (`status = 'pending'`, no `token_pay` yet)
   — **this is where the anti-double-charge gate should be, and it is missing** (see §5)
2. `POST /initiate-pay` → Fapshi (60s timeout, TLS verify only when `ENVIRONMENT === 'production'`)
3. On success: `UPDATE payment_transactions SET token_pay, payment_url`
   — note: **`payment_method` is never set here**
4. On API error or exception: `UPDATE payment_transactions SET status = 'failure'`

### 3.2 `webhookFapshi()` — `app/Controllers/Payment.php:640-698`

1. `SELECT * FROM payment_transactions WHERE token_pay = :transId` (`getByToken()`, `PaymentTransactionModel.php:41-44`)
2. If not found: `SELECT * FROM payment_transactions WHERE id = :externalId` (`find()`)
3. **Read #2 (the "+1")**: `if ($payment['status'] === 'paid') return 'Already processed'` (`:666`)
   — a *check-then-act* guard, not a lock
4. `UPDATE payment_transactions SET amount_paid, transaction_number, payment_method, status,
   webhook_received, webhook_data`
5. If the new status is `paid` → `activateUserAccess($payment)` — **passing the pre-update array**

### 3.3 `activateUserAccess()` — `app/Controllers/Payment.php:700-745`

1. `transStart()`
2. `SELECT * FROM users WHERE id` (read #3 — used only to test `referred_by`)
3. `UPDATE users SET has_paid = 1, payment_date = NOW()`
4. `INSERT INTO payments (transaction_id = 'TXN_' . strtoupper(uniqid()))`
5. `UserModel::getReferralChain()` → **4 more `SELECT * FROM users`**, recursive
   (`UserModel.php:117-145`)
6. Per level: `INSERT INTO referrals` + `SELECT users` + `UPDATE users SET wallet_balance`
   (`UserModel::updateWalletBalance()`, a read-modify-write — `UserModel.php:102-112`)
7. `transComplete()`; if `transStatus() === false` it logs and **returns without rolling back**

Worst case this is roughly **12–14 database round trips for a single 5000 FCFA payment**.

### 3.4 `checkFapshiPaymentStatus()` — `app/Controllers/Payment.php:578-638` (fallback)

1. `GET /payment-status/{transId}`
2. `UPDATE payment_transactions` → `paid`
3. `SELECT users` via `hasPaid()` (read #4, the classic N+1 — and it is **outside** the transaction)
4. `activateUserAccess($payment)` → the whole of §3.3 again

### 3.5 `callback()` — `app/Controllers/Payment.php:540-576`

1. `SELECT * FROM payment_transactions WHERE user_id = ? ORDER BY created_at DESC` — loads **every**
   transaction for the user just to read `$transactions[0]`
2. If the newest is `pending` and has a `token_pay`, dispatch on `payment_method`
3. Re-reads the user afterwards (`:565`)

The view (`app/Views/payment/callback.php:74-89`) then auto-refreshes every 5 s for 5 minutes, so the
whole of §3.4 runs **up to 60 times per page visit**.

---

## 4. The "N reads + 1 extra" pattern

This is the shape of the defect:

```
read row  →  if (row.status === 'paid') return   ← guard
          →  write row.status = 'paid'             ← act
```

The read and the write are **not one atomic operation**. Between them, a concurrent request performs the
same read, observes `pending`, and also writes. This is textbook TOCTOU (time-of-check to time-of-use).

It is amplified here because:

- `activateUserAccess()` is reachable from **three** independent entry points: `webhookFapshi()`,
  `checkFapshiPaymentStatus()`, and `processTestWebhookFapshi()`.
- `callback()` calls `checkFapshiPaymentStatus()` on **every** page load, and the view reloads 60×.
- `hasPaid()` is checked only inside `checkFapshiPaymentStatus()`, and only **outside** the
  transaction. `webhookFapshi()` does not check it at all.
- `PaymentModel::recordPayment()` uses `$db->table('payments')` (`PaymentModel.php:84`) instead of the
  model, which **bypasses** the `is_unique[payments.transaction_id]` validation rule, and
  `activateUserAccess()` **ignores its return value** (`Payment.php:715`).

**The read count is the symptom. The missing atomic claim is the cause.** You can reduce reads to one
per row and the race would still exist; conversely, adding reads cannot fix it. The only real fix is a
conditional write that can only succeed once (`UPDATE … WHERE status <> 'paid'`, then check
`rowCount`), or a `UNIQUE` constraint on the side-effect record.

---

## 5. Problem 1 — Double payment debit

**Verdict: not prevented.**

`process()` (`:82-113`) contains **zero idempotency**:

```php
public function process()
{
    if (!session()->get('logged_in')) { return redirect()->to('/auth/login'); }
    $user = $this->userModel->find($userId);
    if ($user['has_paid']) { return redirect()->to('/dashboard'); }   // only guard
    ...
    return $this->processWithFapshi($user, $phoneNumber, 5000);      // ALWAYS a new row + new link
}
```

There is **no lookup for an existing pending transaction** and no reuse of its `payment_url`.

| Trigger | Result |
|---|---|
| Double-click "Payer" | 2 `payment_transactions` rows, 2 `transId`s, 2 live checkout links |
| Browser back + resubmit | same |
| Slow network, user retries | same |
| An old tab left open, user pays again | same |

**This already occurred in production.** From this repository's own access log
(`logs savoirnet.txt`):

```
[01/Jul/2026:07:22:16] "POST /payment/process HTTP/1.1" 303 515
[01/Jul/2026:07:22:33] "POST /payment/process HTTP/1.1" 303 515   ← 17s later, same browser
```

Each `transId` is independently chargeable for 5000 XAF and **stays valid for 24 hours** (Fapshi:
*"Payment links expire after 24 hours"*). The first link is simply abandoned — never expired, never
cancelled — and remains payable. The second webhook then activates the user a second time and credits
the referral chain a second time.

This cannot be remediated after the fact: the money has already left the customer's mobile-money
balance. **The fix must happen before `initiate-pay` is called.**

### 5.1 The correct fix (Fapshi provides the tool)

On a new attempt:

1. Look for a **live** pending intent on the same order (`status = 'pending'`, `token_pay` not null,
   created within the last N minutes).
2. If one exists, **return its existing `payment_url`** — do not call `initiate-pay` again.
3. If a genuinely new link is needed (old one expired / failed), call **`POST /expire-pay`** with the
   old `transId` first, so the superseded link can never be paid.

See §10.6 for the implementation.

---

## 6. Problem 2 — Double processing (activation / commission)

**Verdict: only partially prevented.**

### 6.1 The guards that exist

- `webhookFapshi()`: `if ($payment['status'] === 'paid') return 'Already processed'` (`:666`)
- `checkFapshiPaymentStatus()`: `if (!$this->userModel->hasPaid($payment['user_id']))` (`:619`)

### 6.2 Why they are insufficient

1. **Not atomic.** Two concurrent deliveries both read `pending` and both write.
2. **Wrong state is the key.** The guard keys on *the transaction row*, but the grant lives on *the
   user*. With two transactions (a double `POST`), both rows go `pending → paid` and both call
   `activateUserAccess()`.
3. **`webhookFapshi()` has no `hasPaid` check at all** — it relies solely on the row guard.
4. **No unique constraint makes a double write impossible:**
   - `payment_transactions.token_pay` is a plain `KEY`, **not** `UNIQUE`
     (`2025-01-16-100004_CreatePaymentTransactionsTable.php:103`) → `getByToken()->first()` can return
     an arbitrary row.
   - `referrals` has **no** `UNIQUE (referrer_id, referred_id, level)`
     (`2025-01-15-100001_CreateReferralsTable.php:53-56`).
   - `payments.transaction_id` **is** `UNIQUE`, but see §3.3 item 4 — validation is bypassed and the
     failure is swallowed, so you can end up with `has_paid = 1` and **no receipt at all**.
5. **`uniqid()`** (`Payment.php:714`) is time-derived, not random. Two activations inside the same
   microsecond window collide on the `payments.transaction_id` unique index.

### 6.3 The tell-tale: the admin path is the only one that guards properly

`Admin::processReferralCommissions()` (`Admin.php:305-341`) checks each level's existence before
crediting:

```php
$existing = $this->referralModel->where('referrer_id', ...)->where('referred_id', ...)->where('level', ...)->first();
```

The automated payment path has **no equivalent guard**. This asymmetry is why the codebase contains a
"Recalculer les commissions" admin button at all — it exists to repair double-credits and
missing-credits that the webhook path produces.

### 6.4 A third variant: the manual test simulator

`processTestWebhookFapshi()` (`:777-824`) calls `activateUserAccess()` with **no guard whatsoever**,
and writes `payment_method = 'fapshi_' . $paymentMethod` (e.g. `fapshi_momo`). It is gated on
`env('CI_ENVIRONMENT') !== 'production'`, and your `.env` currently sets `CI_ENVIRONMENT = production`,
so it is inert — but any developer running a dev environment against a shared database can double-credit.

---

## 7. The "100 + 1" commission cap

If you have seen a referral system distribute more than the customer paid, that is the *"payout exceeds
revenue"* failure. Here it is structurally impossible, by design:

```php
// app/Models/ReferralModel.php:63-70
public function calculateCommission($amount, $level)
{
    if (!isset(self::COMMISSION_AMOUNTS[$level])) { return 0; }
    return self::COMMISSION_AMOUNTS[$level];     // $amount is ignored entirely
}
```

Because the amounts are **fixed constants** rather than a percentage of a passed-in amount:

- the maximum distributed is `4000` FCFA against a `5000` FCFA sale (80%);
- the platform retains `1000` FCFA per sale before gateway fees;
- passing any `$amount` — even a manipulated one — cannot change the payout;
- `COMMISSION_RATES` (40/20/10/10) is stored on the row **for display only** and never used in
  arithmetic, so the displayed percentages can never disagree with the real money.

`getReferralChain()` (`UserModel.php:117-145`) is also bounded by `$maxLevel = 4` and returns `[]` on
a missing user or a missing `referred_by`, so the chain cannot be walked into a cycle or run away.

**Caveat**: the cap is *implicit*. Nothing asserts `sum(commissions) <= captured_revenue` at runtime,
and `activateUserAccess()` has no such check. If someone later converts `COMMISSION_AMOUNTS` to
percentages, the safety disappears silently. §10.7 shows the explicit runtime guard.

---

## 8. Fapshi, end to end

### 8.1 What Fapshi is

A Cameroon-only mobile-money collection gateway: **MTN Mobile Money**, **Orange Money**, and Fapshi
balance. It is **not** a card processor and does not handle international cards.

| Property | Value |
|---|---|
| Sandbox base URL | `https://sandbox.fapshi.com` |
| Live base URL | `https://live.fapshi.com` |
| Authentication | headers `apiuser` + `apikey` |
| Minimum amount | 100 XAF |
| Payment link lifetime | **24 hours** |
| IP whitelisting | applies to `initiate-pay`, `direct-pay`, `payout` → `403` if the caller IP is not listed |
| `payment-status` rate limit | **6 requests per minute per `transId`**, then `429` |
| Webhook delivery | **exactly one attempt per event, never retried** |
| Webhook authentication | `x-wh-secret` header, secret set per service in the dashboard |

Useful endpoints not currently used: `POST /direct-pay`, `POST /expire-pay`, `POST /payout`,
`GET /balance`, `GET /search-transactions`, `GET /transaction-by-user`.

### 8.2 Initiation — `POST /initiate-pay`

Documented parameters: `amount`, `email`, `redirectUrl`, `userId`, `externalId`, `message`.
`userId` and `externalId` must match `^[a-zA-Z0-9\-_]{1,100}$`.

What the code sends (`Payment.php:141-149`):

```php
$paymentPayload = [
    'amount'      => (int) $priceXAF,          // 5000
    'email'       => $user['email'],
    'redirectUrl' => $returnUrl,              // https://…/payment/callback
    'webhook'     => $webhookUrl,             // ⚠️ NOT a documented initiate-pay parameter
    'userId'      => (string) $userId,        // e.g. "7"
    'externalId'  => (string) $paymentId,     // e.g. "42"  ← the correlation key
    'message'     => 'Paiement SavoirNet - Accès à vie'
];
```

Two things that matter:

- **`webhook` is not an `initiate-pay` parameter.** The `Transaction` object does expose a `webhook`
  field, but Fapshi documents it as *"The webhook you defined for your service"* — a **per-service
  setting in the Fapshi dashboard**. So `FAPSHI_webhook_url` in `.env` is effectively decorative; the
  endpoint that actually fires is whatever was typed into the dashboard. If the two drift, **every
  payment silently fails to confirm**.
- **`externalId` is your correlation key.** It is what lets the webhook match a payment even if
  `transId` is missing from the payload.

Success response:

```json
{ "message": "...", "link": "https://checkout.fapshi.com/...", "transId": "FAPSHI_ABC123", "dateInitiated": "..." }
```

The code accepts it only on `$statusCode === 200 && isset($responseData['link'])` (`:177`) and
**discards `message`**, so a 4xx carrying a useful reason becomes a generic French error string.

### 8.3 Callback A — the return URL (the "return message")

```
customer finishes on the Fapshi page → browser redirected to https://…/payment/callback
```

This is a **pure browser redirect**. It carries no guarantee of payment, and Fapshi documents no query
parameters that are appended. The code responds by **ignoring it entirely and re-polling the API**
(`Payment.php:553-567`).

#### 8.3.1 A live bug: the Fapshi status-poll branch is dead

```php
if ($paymentMethod === 'fapshi') {
    $updatedTransaction = $this->checkFapshiPaymentStatus($lastTransaction);
}
```

…but `processWithFapshi()` **never sets `payment_method`** on success — it writes only `token_pay`
and `payment_url` (`Payment.php:178-181`). The field is populated only inside the *webhook* and
*status-check success* paths (`:680`, `:611`).

So for a freshly created Fapshi attempt `payment_method` is `NULL`, the `=== 'fapshi'` test fails, **no
status check ever runs**, and the page sits on *"Paiement en cours de traitement…"* until the webhook
arrives. The SebPay path sets it correctly at initiation (`:294`); the Fapshi path does not.

#### 8.3.2 The return URL is session-gated

`/payment/callback` is behind `['filter' => 'auth']` (`Routes.php:44`). If the session expired, cookies
were blocked, or the customer paid on a different device, the redirect lands on `/auth/login` with no
explanation. From the customer's point of view: *"I paid and it sent me back to the login page."*

The return URL must be **public** and look the order up by a reference in the URL, not by session.

#### 8.3.3 The auto-refresh is wasteful and rate-limit-breaking

`app/Views/payment/callback.php:74-89` reloads every 5 s for 5 minutes (60 iterations). Each reload
re-runs `callback()`, which re-reads all the user's transactions and re-polls Fapshi. That is
**12 requests/minute against a documented limit of 6/minute** → `429 Too Many Requests`, and the loop
never stops even after the payment succeeds.

### 8.4 Callback B — the webhook (the only thing that grants access)

`POST /payment/webhook-fapshi` → `Payment::webhookFapshi()` (`Payment.php:640-698`).

Fapshi POSTs to the dashboard-configured URL whenever the status changes to **`SUCCESSFUL`**, **`FAILED`**
or **`EXPIRED`**, with a body identical to `GET /payment-status`:

```json
{
  "transId": "FAPSHI_ABC123",
  "status": "SUCCESSFUL",
  "medium": "mobile money",
  "serviceName": "SavoirNet",
  "transType": "Collection",
  "amount": 5000,
  "revenue": 4850,
  "payerName": "…",
  "email": "…",
  "redirectUrl": "https://…/payment/callback",
  "webhook": "https://…/payment/webhook-fapshi",
  "externalId": "42",
  "userId": "7",
  "reason": null,
  "financialTransId": "MP260712.ABCDEF",
  "dateInitiated": "2026-07-01T07:23:10",
  "dateConfirmed": "2026-07-01T07:23:44"
}
```

#### 8.4.1 The single most important line in Fapshi's docs

> *"Fapshi sends **only one webhook request per event, regardless of whether your server responds or
> not**."*

**There are no retries** — not on a 500, not on a timeout, not on a database blip. If
`webhookFapshi()` throws, the transaction is orphaned permanently and the customer has paid for
nothing. This makes the fallback layer mandatory rather than optional, and it invalidates the
monitoring assumptions in `GUIDE_WEBHOOKS_FAPSHI.md`, which is written as though retries were
available.

#### 8.4.2 Returning 200 on failure

```php
return $this->response->setJSON(['status' => 'error', 'message' => 'Payment not found']);  // HTTP 200
```

Since Fapshi never retries, a `200 {"status":"error"}` and a `200 {"status":"success"}` are
operationally identical to the provider. Your only signal is log grepping. Returning `404`/`500` at
least surfaces the failure in HTTP metrics, and leaves the door open for a future provider that does
retry.

#### 8.4.3 Missing webhook authentication — CRITICAL

Fapshi supports a per-service webhook secret; every request then carries an **`x-wh-secret`** header.
`webhookFapshi()` **never reads it** (`:640-698`). The SebPay path *does* verify HMAC (`:410-418`).

Consequence: anyone who learns a `transId` can `POST {"transId":"…","status":"SUCCESSFUL"}` and grant
themselves lifetime access **and** credit their referrer's wallet with real withdrawable balance.
`transId` values leak through access logs, browser history, the Fapshi dashboard, and the
`checkStatus` endpoint.

#### 8.4.4 Missing amount verification — CRITICAL

```php
$amount = $webhookData['amount'] ?? 0;      // :650
...
'amount_paid' => $amount,                   // :678  — written straight through
```

The amount is stored and **never compared** to `amount_requested` or `amount_xaf`. An underpayment
grants full access. Additionally `revenue` (the amount actually credited after Fapshi fees) is
**ignored**, so the `payments` table books gross revenue and gateway fees are invisible in your
reporting.

#### 8.4.5 Missing identity cross-check

`transId` and `externalId` are both used to *locate* the row (`:653-659`), but the payload's
`userId`/`externalId` are never verified against the row that was found. Mismatched or forged
identifiers are accepted.

#### 8.4.6 CSRF exemption

Both webhook routes are exempted from CSRF (`Config/Filters.php:79`), which is correct — but combined
with the missing signature check it means the endpoint is completely open.

### 8.5 Status mapping as implemented

| Fapshi status | Code path | Internal `status` | Grants access? |
|---|---|---|---|
| `CREATED` | default branch (`:670`) | `pending` | no |
| `PENDING` | default branch (`:670`) | `pending` | no |
| `SUCCESSFUL` | `:671` | `paid` | **yes** |
| `completed` | `:671` | `paid` | yes — ⚠️ **not a real Fapshi status** |
| `FAILED` | `:673` | `cancelled` | no |
| `cancelled` | `:673` | `cancelled` | no — ⚠️ **not a real Fapshi status** |
| `EXPIRED` | — | `pending` ⚠️ | no — **unmapped in the webhook path** |

`EXPIRED` is handled only in `checkFapshiPaymentStatus()` (`:625`), never in the webhook. An expired
link therefore leaves the row stuck at `pending` forever, and `getPendingPayments()`
(`PaymentTransactionModel.php:59-66`, the admin's "transactions en attente" list) fills with ghosts.

### 8.6 The fallback chain as built

```
1. PRIMARY    webhookFapshi()             Payment.php:640   [no auth · no signature · no retry]
2. FALLBACK   checkFapshiPaymentStatus()   Payment.php:578   [DEAD for Fapshi — payment_method is NULL]
              triggered by callback()      Payment.php:540   [session-gated · 60× auto-refresh · 429s]
3. SAFETY NET Admin::validatePayment()     Admin.php:233     [manual · guarded by has_paid]
4. DEV ONLY   processTestWebhookFapshi()  Payment.php:777   [no guard at all · CI_ENVIRONMENT gate]
```

**Layer 2 is inert for Fapshi.** In production you are therefore running on a single, unauthenticated,
no-retry webhook with no working automated fallback.

### 8.7 Environment configuration

`.env` (git-ignored — verified via `git check-ignore`):

```bash
CI_ENVIRONMENT = production
FAPSHI_url_api    = 'https://live.fapshi.com/initiate-pay'
FAPSHI_API_KEY    = '…'      # header: apikey
FAPSHI_USER_KEY   = '…'      # header: apiuser
FAPSHI_return_url = 'https://…/payment/callback'
FAPSHI_webhook_url = 'https://…/payment/webhook-fapshi'   # decorative — see §8.2
```

The status URL is then reconstructed by string surgery (`:585`):

```php
$statusUrl = str_replace('/initiate-pay', '/payment-status/' . $transId, $baseUrl);
```

This breaks silently if `FAPSHI_url_api` is given a trailing slash, changed to sandbox/live, or
reformatted. `transId` is also interpolated into the path unencoded.

---

## 9. Flaw catalogue

### 9.1 Critical

| # | Flaw | Location |
|---|---|---|
| 1 | No webhook signature check — `x-wh-secret` ignored → forged webhooks grant free access + real withdrawable commission | `Payment.php:640-698` |
| 2 | No amount verification → underpayment grants full access | `Payment.php:650, 678` |
| 3 | No webhook auth filter and no IP allowlist on the endpoint | `Routes.php:49` |
| 4 | No idempotency on `process()` → multiple live links → real double charge | `Payment.php:82-113` |
| 5 | No atomic claim (check-then-act) → double activation, double commission | `Payment.php:666, 619` |
| 6 | Fapshi sends **one** webhook with no retries → any failure = lost money | design |
| 7 | `revenue` (net) ignored → books gross, gateway fees invisible | `Payment.php:678` |
| 8 | Return URL is session-gated and the Fapshi poll branch is dead (`payment_method` never set) → "I paid, nothing happened" | `Payment.php:178, 557`; `Routes.php:44` |
| 9 | Root `.htaccess` only rewrites, no deny rules → `/.env` may expose live `apikey`, `apiuser`, `sk_live_*`; `SavoirNet-main_delivery.tar.gz`, `savoirnet.zip`, `vendor.zip`, `builds/`, `test_fapshi.php`, `creer-test.php`, `info.php` sit in the webroot on shared hosting | `.htaccess`, root dir |

### 9.2 High

| # | Flaw | Location |
|---|---|---|
| 10 | `token_pay` is not `UNIQUE` → `getByToken()->first()` is nondeterministic | migration `:103` |
| 11 | `referrals` missing `UNIQUE (referrer_id, referred_id, level)` | migration `:53-56` |
| 12 | `recordPayment()` bypasses model validation and its return value is ignored → `has_paid = 1` with no receipt | `PaymentModel.php:84`; `Payment.php:715` |
| 13 | `updateWalletBalance()` is read-modify-write → lost updates / double credit under concurrency | `UserModel.php:102-112` |
| 14 | `transStatus() === false` returns **without** `transRollback()` → partial commit | `Payment.php:730-735` |
| 15 | `EXPIRED` unmapped in the webhook → rows stuck `pending` forever | `Payment.php:670-675` |
| 16 | **Rate limit blown:** callback auto-refresh = 12 req/min, Fapshi allows **6/min** → `429` | `Views/payment/callback.php:83` |
| 17 | No expiry sweep — nothing ever marks 24h-dead `pending` rows | — |
| 18 | `checkStatus($token)` is `auth`-filtered but not owner-filtered → any logged-in user can probe any `transId` | `Payment.php:747-759` |
| 19 | No reconciliation against `GET /search-transactions` or `/transaction-by-user` → silent divergence | — |
| 20 | No `payments → payment_transactions` foreign key; the receipt stores an unrelated `TXN_<uniqid>` | `Payment.php:714`; migrations |

### 9.3 Medium / hygiene

| # | Flaw | Location |
|---|---|---|
| 21 | `activateUserAccess($payment)` receives the **pre-update** array → `payments.payment_method` recorded as `'mobile_money'`. The SebPay path correctly does `array_merge($payment, $updateData)` | `Payment.php:689, 620` vs `:479, 379` |
| 22 | Status URL built with `str_replace` on an env var; `transId` unencoded in the path | `Payment.php:585` |
| 23 | `'completed'` and `'cancelled'` handled as if Fapshi emitted them — it does not | `Payment.php:671-674` |
| 24 | 5 s polling for 5 min regardless of state → 60 API calls per visit, even after success | `Views/payment/callback.php:74-89` |
| 25 | SebPay sends 4500 so the *debit* is 5000, but records revenue of 4500 → 10% under-reporting | `Payment.php:110-111, 717` |
| 26 | `verify => ENVIRONMENT === 'production'` disables TLS verification in dev — a sandbox-key MITM footgun | `Payment.php:166, 265, 343, 596` |
| 27 | `webhook_data` TEXT grows unbounded with raw payloads, including PII | migration `:82-85` |
| 28 | `$errorMessage` computed and never used | `Payment.php:311` |
| 29 | `'webhook'` sent as an `initiate-pay` parameter that does not exist | `Payment.php:145` |
| 30 | `SEBPAY_COUNTRIES` defined but never used for routing; `else` catches unsupported countries | `Payment.php:25-28, 109-112` |
| 31 | `has_promo` always `0`; `PROMO_DISCOUNT = 0`; enum value `no_paid` never used | `ReferralModel`-adjacent; migrations |
| 32 | Dev simulator writes `payment_method = 'fapshi_momo'`, permanently breaking the `=== 'fapshi'` branch for that row | `Payment.php:810` |
| 33 | `amount_usd => round(5000/600, 2)` — hardcoded FX rate | `Payment.php:67` |
| 34 | `PaymentModel::processSuccessfulPayment()` is a dead code path duplicating `activateUserAccess()` | `PaymentModel.php:113-157` |
| 35 | `getUserTransactions()` loads every transaction for the user to read `$transactions[0]` | `PaymentTransactionModel.php:49-54`; `Payment.php:550` |

### 9.4 Things that are correctly done

Worth preserving when you rewrite:

- CSRF is enabled globally and the two webhook routes are explicitly exempted (`Filters.php:79`).
- The SebPay webhook verifies an HMAC-SHA256 signature with `hash_equals` (`:410-418`).
- `Payment::index()` and `process()` both guard on `has_paid` and on a missing user.
- Amounts are stored as `DECIMAL(10,2)`, not floats.
- The commission amounts are fixed constants, so payouts can never exceed the sale (§7).
- The dev-only webhook simulator is gated on `CI_ENVIRONMENT`.
- Every gateway call has a timeout and a `catch` that records the failure instead of white-screening.

---

## 10. Next.js e-commerce checkout — gateway-agnostic

### 10.1 The six rules

1. **An order is not a payment, and a payment is not an order.** Three records: `Order` (what was
   bought), `Payment` (one attempt against a gateway), `PaymentEvent` (every webhook/poll received).
2. **Exactly-once side effects are enforced by the database, not by application logic.** A `UNIQUE`
   constraint is the only real idempotency primitive. Application-level "did I already do this?" checks
   are all TOCTOU waiting to happen.
3. **The atomic claim is a conditional `UPDATE`.**
   `UPDATE … SET status='paid' WHERE id=$1 AND status <> 'paid'` → `rowCount === 1` means *you* won
   the race. No locks, no pre-read.
4. **Money is an integer in minor units.** `amountMinor: 5000` + `currency: 'XAF'`. Never floats,
   never strings.
5. **The gateway is a port, not a branch.** `if (country === 'CM')` inside a controller does not scale
   past two providers.
6. **The return URL reads *your* database, never the gateway.** Polling Postgres is free and
   unlimited; polling Fapshi is capped at 6/minute.

### 10.2 Data model (Prisma)

```prisma
enum OrderStatus   { PENDING PAYMENT_PROCESSING PAID FULFILLED FAILED EXPIRED CANCELLED REFUNDED }
enum PaymentStatus { CREATED PENDING REQUIRES_ACTION SUCCEEDED FAILED EXPIRED CANCELLED REFUNDED }
enum Gateway       { FAPSHI SEBPAY STRIPE }

model Order {
  id            String      @id @default(cuid())
  reference     String      @unique            // public; goes in the return URL
  userId        String
  status        OrderStatus @default(PENDING)
  currency      String                        // ISO-4217, uppercase
  totalMinor    Int                           // authoritative, immutable after creation
  items         OrderItem[]
  payments      Payment[]
  fulfillment   Fulfillment?
  expiresAt     DateTime
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([userId, status])
  @@index([status, expiresAt])                 // the expiry sweeper
}

model OrderItem {
  id        String @id @default(cuid())
  orderId   String
  order     Order  @relation(fields: [orderId], references: [id], onDelete: Cascade)
  sku       String
  name      String
  qty       Int
  unitMinor Int
}

model Payment {
  id             String        @id @default(cuid())
  orderId        String
  order          Order         @relation(fields: [orderId], references: [id])
  attempt        Int           @default(1)
  gateway        Gateway
  status         PaymentStatus @default(CREATED)
  idempotencyKey String        @unique        // ← kills the double-submit
  providerRef    String?                       // Fapshi transId
  checkoutUrl    String?
  amountMinor    Int                           // snapshot; must equal order.totalMinor
  revenueMinor   Int?                          // net after gateway fees
  currency       String
  expiresAt      DateTime
  paidAt         DateTime?
  rawPayload     Json?
  events         PaymentEvent[]

  @@unique([orderId, attempt])
  @@unique([providerRef])                       // ← the constraint missing in the CI4 schema
  @@index([providerRef, status])
}

model PaymentEvent {
  id          String   @id @default(cuid())
  paymentId   String
  payment     Payment  @relation(fields: [paymentId], references: [id])
  providerEvt String                      // provider event id, or hash(raw body)
  type        String
  payload     Json
  receivedAt  DateTime @default(now())

  @@unique([paymentId, providerEvt])        // ← the idempotency ledger
}

model Fulfillment {
  id        String   @id @default(cuid())
  orderId   String   @unique               // ← THE guarantee: one order, one grant
  order     Order    @relation(fields: [orderId], references: [id])
  kind      String                        // "lifetime_access" | "digital_download" | "ship"
  payload   Json
  createdAt DateTime @default(now())
}

model WalletLedger {
  id           String   @id @default(cuid())
  userId       String
  orderId      String?
  entryKey     String                     // e.g. "commission:L1:order_abc"
  amount       Int                        // signed, minor units
  balanceAfter Int
  createdAt    DateTime @default(now())

  @@unique([entryKey])                    // ← commissions can never be credited twice
}
```

**The four constraints that kill the defect classes in §9:**

| Constraint | Kills |
|---|---|
| `Payment.idempotencyKey` UNIQUE | double-submit / double-debit |
| `Payment.providerRef` UNIQUE | two rows sharing a `transId` → the `getByToken()` ambiguity |
| `Fulfillment.orderId` UNIQUE | double activation / double access grant |
| `WalletLedger.entryKey` UNIQUE | double commission credit |

### 10.3 The gateway port

```ts
// lib/payments/types.ts
export type GatewayName = 'fapshi' | 'sebpay' | 'stripe';

export interface CreatePaymentInput {
  orderId: string;
  reference: string;          // Order.reference
  amountMinor: number;
  currency: string;           // 'XAF'
  email: string;
  customerPhone?: string;
  returnUrl: string;          // absolute, public, NO session required
  webhookUrl: string;
  idempotencyKey: string;
}

export interface CreatePaymentResult {
  providerRef: string;
  checkoutUrl: string;
  expiresAt: Date;
}

export interface NormalizedEvent {
  providerEventId: string;    // stable id, used for dedupe
  providerRef: string;
  status: 'succeeded' | 'failed' | 'expired' | 'pending';
  amountMinor: number;        // gross
  revenueMinor?: number;      // net after gateway fees
  externalRef?: string;
  rawBody: string;            // exactly as received, for the audit trail
}

export interface PaymentGateway {
  readonly name: GatewayName;
  readonly supportedCurrencies: readonly string[];
  createPayment(i: CreatePaymentInput): Promise<CreatePaymentResult>;
  fetchStatus(providerRef: string): Promise<NormalizedEvent | null>;
  verifyWebhook(rawBody: string, headers: Headers): boolean;
  parseWebhook(rawBody: string): NormalizedEvent | null;
  voidPayment(providerRef: string): Promise<void>;   // Fapshi: POST /expire-pay
}
```

### 10.4 Fapshi adapter

```ts
// lib/payments/fapshi.ts
import { createHash, timingSafeEqual } from 'node:crypto';
import type { CreatePaymentInput, CreatePaymentResult, NormalizedEvent, PaymentGateway } from './types';

const BASE = process.env.FAPSHI_BASE_URL!;   // https://live.fapshi.com  (no path suffix)

export class FapshiGateway implements PaymentGateway {
  readonly name = 'fapshi' as const;
  readonly supportedCurrencies = ['XAF'] as const;

  private headers() {
    return {
      'Content-Type': 'application/json',
      apikey: process.env.FAPSHI_API_KEY!,
      apiuser: process.env.FAPSHI_USER_KEY!,
    };
  }

  async createPayment(i: CreatePaymentInput): Promise<CreatePaymentResult> {
    // NOTE: no `webhook` param — the webhook URL is a per-service dashboard setting.
    const res = await fetch(`${BASE}/initiate-pay`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        amount: i.amountMinor,        // integer XAF, minimum 100
        email: i.email,
        redirectUrl: i.returnUrl,
        userId: i.orderId,            // ^[a-zA-Z0-9\-_]{1,100}$ — cuid() is safe
        externalId: i.reference,
        message: 'Commande SavoirNet',
      }),
      signal: AbortSignal.timeout(10_000),    // 10s, not 60s — don't hold the checkout open
      cache: 'no-store',
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.link || !body.transId) {
      throw new PaymentInitError(res.status, body.message ?? 'Fapshi init failed');
    }
    return {
      providerRef: body.transId,
      checkoutUrl: body.link,
      // Fapshi: links live 24h. Do not trust the client with this.
      expiresAt: new Date(Date.now() + 23 * 60 * 60 * 1000),
    };
  }

  async fetchStatus(providerRef: string): Promise<NormalizedEvent | null> {
    const res = await fetch(`${BASE}/payment-status/${encodeURIComponent(providerRef)}`, {
      headers: this.headers(),
      signal: AbortSignal.timeout(8_000),
      cache: 'no-store',
    });
    if (res.status === 429) return null;   // rate-limited: 6/min/transId → back off
    if (!res.ok) return null;
    return this.toEvent(await res.json());
  }

  /** Fapshi echoes the dashboard-set secret in `x-wh-secret`. */
  verifyWebhook(rawBody: string, headers: Headers): boolean {
    const expected = process.env.FAPSHI_WEBHOOK_SECRET;
    if (!expected) throw new Error('FAPSHI_WEBHOOK_SECRET is not configured');
    const got = headers.get('x-wh-secret');
    if (!got) return false;
    const a = createHash('sha256').update(expected).digest();
    const b = createHash('sha256').update(got).digest();
    return timingSafeEqual(a, b);           // constant-time
  }

  parseWebhook(rawBody: string): NormalizedEvent | null {
    try { return this.toEvent(JSON.parse(rawBody)); } catch { return null; }
  }

  /** Kills a superseded link. This is the double-debit fix. */
  async voidPayment(providerRef: string): Promise<void> {
    await fetch(`${BASE}/expire-pay`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ transId: providerRef }),
      signal: AbortSignal.timeout(5_000),
      cache: 'no-store',
    });
  }

  private toEvent(t: any): NormalizedEvent {
    const status =
      t.status === 'SUCCESSFUL' ? 'succeeded'
      : t.status === 'FAILED'    ? 'failed'
      : t.status === 'EXPIRED'   ? 'expired'
      :                            'pending';
    return {
      // Fapshi has no event id; transId+status+dateConfirmed is stable and unique per event.
      providerEventId: `${t.transId}:${t.status}:${t.dateConfirmed ?? ''}`,
      providerRef: t.transId,
      status,
      amountMinor: Number(t.amount ?? 0),
      revenueMinor: t.revenue != null ? Number(t.revenue) : undefined,
      externalRef: t.externalId,
      rawBody: JSON.stringify(t),
    };
  }
}
```

Note the deliberate separation of `amountMinor` (gross) and `revenueMinor` (net). The CI4 code ignores
`revenue`, so `payments.amount` books 5000 when Fapshi actually credited less.

### 10.5 Registry and routing

```ts
// lib/payments/index.ts
import { FapshiGateway } from './fapshi';
import { SebPayGateway } from './sebpay';
import { StripeGateway } from './stripe';
import type { GatewayName, PaymentGateway } from './types';

const REGISTRY: Record<GatewayName, PaymentGateway> = {
  fapshi: new FapshiGateway(),
  sebpay: new SebPayGateway(),
  stripe: new StripeGateway(),
};

export const getGateway = (n: GatewayName) => {
  const g = REGISTRY[n];
  if (!g) throw new Error(`Unknown gateway: ${n}`);
  return g;
};

// Move this into a DB table when routing needs to change without a deploy.
const COUNTRY_GATEWAY: Record<string, GatewayName> = { CM: 'fapshi' /* …others → sebpay */ };
export const gatewayForCountry = (cc: string) => COUNTRY_GATEWAY[cc] ?? 'sebpay';
```

### 10.6 Idempotent intent creation — the anti-double-debit core

```ts
// lib/payments/create-intent.ts
import { prisma } from '@/lib/prisma';
import { getGateway } from './index';

export async function createOrReuseIntent(args: {
  orderId: string;
  gateway: Parameters<typeof getGateway>[0];
  email: string;
  phone?: string;
  returnUrl: string;
  webhookUrl: string;
  idempotencyKey: string;   // minted once per checkout render, sent by the client
}) {
  const { payment, checkoutUrl, reused } = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({ where: { id: args.orderId } });
    if (order.status === 'PAID' || order.status === 'FULFILLED') throw new OrderAlreadyPaidError(order.reference);
    if (order.expiresAt < new Date()) throw new OrderExpiredError();

    // ---- REUSE, don't re-create. This is what stops a second live charge. ----
    const live = await tx.payment.findFirst({
      where: {
        orderId: order.id,
        status: { in: ['CREATED', 'PENDING', 'REQUIRES_ACTION'] },
        expiresAt: { gt: new Date() },
      },
      orderBy: { attempt: 'desc' },
    });
    if (live?.checkoutUrl) {
      return { payment: live, checkoutUrl: live.checkoutUrl, reused: true };
    }

    const gateway = getGateway(args.gateway);
    if (!gateway.supportedCurrencies.includes(order.currency))
      throw new UnsupportedCurrencyError(order.currency, gateway.name);
    if (order.totalMinor < 100) throw new AmountBelowProviderMinimumError();

    const attempt = (await tx.payment.count({ where: { orderId: order.id } })) + 1;

    // UNIQUE(idempotencyKey) turns a double POST into a no-op (P2002) instead of a second charge.
    const payment = await tx.payment.create({
      data: {
        orderId: order.id,
        attempt,
        gateway: gateway.name,
        idempotencyKey: args.idempotencyKey,
        status: 'CREATED',
        amountMinor: order.totalMinor,     // never trust the client
        currency: order.currency,
        expiresAt: new Date(Date.now() + 23 * 60 * 60 * 1000),
      },
    });

    let res;
    try {
      res = await gateway.createPayment({
        orderId: order.id,
        reference: order.reference,
        amountMinor: order.totalMinor,
        currency: order.currency,
        email: args.email,
        customerPhone: args.phone,
        returnUrl: args.returnUrl,
        webhookUrl: args.webhookUrl,
        idempotencyKey: args.idempotencyKey,
      });
    } catch (e) {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED', rawPayload: { error: String(e) } },
      });
      throw e;
    }

    await tx.payment.update({
      where: { id: payment.id },
      data: { providerRef: res.providerRef, checkoutUrl: res.checkoutUrl, expiresAt: res.expiresAt },
    });
    await tx.order.update({ where: { id: order.id }, data: { status: 'PAYMENT_PROCESSING' } });

    return { payment, checkoutUrl: res.checkoutUrl, reused: false };
  }, { isolationLevel: 'Serializable' });

  // ---- After commit: expire any superseded link. Best effort. ----
  const stale = await prisma.payment.findMany({
    where: {
      orderId: args.orderId,
      id: { not: payment.id },
      status: { in: ['CREATED', 'PENDING'] },
      expiresAt: { gt: new Date() },
    },
  });
  await Promise.allSettled(
    stale.map(p => p.providerRef && getGateway(p.gateway).voidPayment(p.providerRef)),
  );

  return { checkoutUrl, paymentId: payment.id, reused };
}
```

### 10.7 Fulfillment — exactly once, enforced by Postgres

This is the direct replacement for `activateUserAccess()`.

```ts
// lib/payments/settle.ts
export async function settlePayment(paymentId: string) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUniqueOrThrow({ where: { id: paymentId } });
    if (payment.status === 'SUCCEEDED') return { alreadyProcessed: true };

    // ---- THE ATOMIC CLAIM. No pre-read, no TOCTOU. ----
    const claimed = await tx.payment.updateMany({
      where: { id: paymentId, status: { notIn: ['SUCCEEDED', 'REFUNDED'] } },
      data: { status: 'SUCCEEDED', paidAt: new Date() },
    });
    if (claimed.count === 0) return { alreadyProcessed: true };   // someone else won the race

    // ---- amount verification ----
    const order = await tx.order.findUniqueOrThrow({ where: { id: payment.orderId } });
    if (payment.amountMinor !== order.totalMinor) {
      await tx.payment.update({ where: { id: paymentId }, data: { status: 'PENDING' } });
      await tx.paymentEvent.create({
        data: {
          paymentId,
          providerEvt: `mismatch:${payment.providerRef}:${payment.amountMinor}`,
          type: 'amount_mismatch',
          payload: { got: payment.amountMinor, want: order.totalMinor } as any,
        },
      });
      throw new AmountMismatchError(payment.amountMinor, order.totalMinor);
    }

    // ---- order claim ----
    const orderClaimed = await tx.order.updateMany({
      where: { id: order.id, status: { notIn: ['PAID', 'FULFILLED', 'REFUNDED'] } },
      data: { status: 'PAID' },
    });
    if (orderClaimed.count === 0) return { alreadyProcessed: true };

    // ---- grant: UNIQUE(orderId) makes a second grant a hard DB error, not a silent dup ----
    await tx.fulfillment.create({ data: { orderId: order.id, kind: 'lifetime_access', payload: {} } });

    // ---- commissions: UNIQUE(entryKey) makes double credit impossible ----
    const chain = await getReferralChain(order.userId, 4);
    let credited = 0n;
    for (const { userId, level } of chain) {
      const amount = commissionFor(level, order.totalMinor);
      if (amount <= 0) continue;
      const bal = await tx.user.update({ where: { id: userId }, data: { walletMinor: { increment: amount } } });
      await tx.walletLedger.create({
        data: {
          userId,
          orderId: order.id,
          entryKey: `commission:L${level}:${order.id}`,
          amount,
          balanceAfter: bal.walletMinor,
        },
      });
      credited += BigInt(amount);
    }
    // The explicit "100 + 1" guard the CI4 version lacks:
    if (credited > BigInt(order.totalMinor)) throw new PayoutExceedsRevenueError();

    await tx.order.update({ where: { id: order.id }, data: { status: 'FULFILLED' } });
    return { alreadyProcessed: false, credited: Number(credited) };
  }, { isolationLevel: 'Serializable' });
}
```

**What disappeared compared to `activateUserAccess()`:**

| Was | Now |
|---|---|
| `hasPaid()` read outside the transaction | nothing — the conditional `updateMany` *is* the guard |
| `strtoupper(uniqid())` | the ledger is keyed on `order.id` |
| ignored `recordPayment()` return value | `create()` throws on failure, the tx rolls back |
| `transStatus() === false` without rollback | Prisma throws and rolls back |
| read-modify-write on the wallet | `walletMinor: { increment }`, atomic |
| ~12–14 DB round trips | 1 claim + 1 read + 1 grant + N ledger writes |
| no revenue assertion | `credited > totalMinor` throws |

### 10.8 Webhook route — the only place that grants

```ts
// app/api/webhooks/[gateway]/route.ts
import { headers } from 'next/headers';
import { getGateway } from '@/lib/payments';
import { prisma } from '@/lib/prisma';
import { settlePayment } from '@/lib/payments/settle';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: Promise<{ gateway: string }> }) {
  const { gateway: name } = await params;

  const raw = await req.text();     // RAW body — never req.json() before verifying
  const h = headers();

  let gw;
  try { gw = getGateway(name as never); } catch { return new Response('no gateway', { status: 404 }); }

  // 1) AUTHENTICATE FIRST
  let ok: boolean;
  try { ok = gw.verifyWebhook(raw, h); }
  catch { return new Response('webhook secret not configured', { status: 500 }); }   // fail closed
  if (!ok) {
    await logSecurityEvent({ name, ip: h.get('x-forwarded-for'), reason: 'bad signature' });
    return new Response('unauthorized', { status: 401 });
  }

  // 2) PARSE
  const evt = gw.parseWebhook(raw);
  if (!evt) return new Response('bad payload', { status: 400 });

  // 3) LOCATE — by UNIQUE providerRef, never .first() on a non-unique key
  const payment = await prisma.payment.findUnique({
    where: { providerRef: evt.providerRef },
    include: { order: true },
  });
  if (!payment) return new Response('unknown payment', { status: 404 });

  // 4) DEDUPE — UNIQUE(paymentId, providerEventId)
  try {
    await prisma.paymentEvent.create({
      data: { paymentId: payment.id, providerEvt: evt.providerEventId, type: evt.status, payload: JSON.parse(raw) },
    });
  } catch (e) {
    if (isUniqueViolation(e)) return Response.json({ ok: true, duplicate: true });   // 200, stop
    throw e;
  }

  // 5) APPLY
  try {
    if (evt.status === 'succeeded') {
      const r = await settlePayment(payment.id);
      return Response.json({ ok: true, ...r });
    }
    if (evt.status === 'failed' || evt.status === 'expired') {
      await prisma.$transaction([
        prisma.payment.update({
          where: { id: payment.id },
          data: { status: evt.status === 'expired' ? 'EXPIRED' : 'FAILED' },
        }),
        prisma.order.updateMany({
          where: { id: payment.orderId, status: { in: ['PENDING', 'PAYMENT_PROCESSING'] } },
          data: { status: evt.status === 'expired' ? 'EXPIRED' : 'FAILED' },
        }),
      ]);
      return Response.json({ ok: true });
    }
    await prisma.payment.update({ where: { id: payment.id }, data: { status: 'PENDING' } });
    return Response.json({ ok: true });
  } catch (e) {
    // 500 → visible in metrics. Fapshi won't retry, so the cron must reconcile.
    await logWebhookFailure({ paymentId: payment.id, error: String(e) });
    return new Response('processing error', { status: 500 });
  }
}
```

### 10.9 Checkout page (App Router)

```tsx
// app/checkout/[reference]/page.tsx
import { getOrderForCheckout } from '@/lib/orders';
import { CheckoutForm } from './CheckoutForm';

export default async function Page({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const order = await getOrderForCheckout(reference);   // public by reference, no session
  if (!order) notFound();
  if (order.status === 'FULFILLED') redirect(`/orders/${reference}/done`);

  return (
    <CheckoutForm
      reference={order.reference}
      items={order.items}
      totalMinor={order.totalMinor}
      currency={order.currency}
      // Minted server-side, once, pinned to this render. A double-click reuses the same
      // key → the UNIQUE index collapses it into a no-op.
      idempotencyKey={order.checkoutIdempotencyKey}
    />
  );
}
```

```tsx
// app/checkout/[reference]/CheckoutForm.tsx
'use client';
import { useRouter } from 'next/navigation';
import { useState, useTransition, useRef } from 'react';

export function CheckoutForm(p: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState(false);
  const fired = useRef(false);          // client-side belt; the server is the real lock
  const [phone, setPhone] = useState(p.defaultPhone ?? '');

  async function pay() {
    if (fired.current || busy) return;  // ← no second POST, ever
    fired.current = true;
    setBusy(true);

    start(async () => {
      const res = await fetch(`/api/checkout/${p.reference}/intent`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'idempotency-key': p.idempotencyKey },
        body: JSON.stringify({ phone }),
      });

      if (res.status === 409) { router.push(`/orders/${p.reference}`); return; }   // already paid

      const { checkoutUrl, reused } = await res.json().catch(() => ({}));
      if (!checkoutUrl) {
        setBusy(false); fired.current = false; setError('Paiement indisponible, réessayez.');
        return;
      }
      // reused === true means the server handed back the SAME link — you are not being charged twice
      window.location.href = checkoutUrl;
    });
  }

  return (
    <form onSubmit={e => { e.preventDefault(); pay(); }}>
      {/* …cart summary from server data, never from client state… */}
      <button disabled={busy || pending} type="submit">
        {busy ? 'Redirection…' : `Payer ${formatMinor(p.totalMinor, p.currency)}`}
      </button>
    </form>
  );
}
```

### 10.10 Return page — public, reads your DB, never polls the gateway

```tsx
// app/orders/[reference]/page.tsx   ← the redirectUrl target
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function OrderStatusPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const order = await prisma.order.findUnique({ where: { reference } });
  if (!order) notFound();
  // No session, no auth filter. Fixes the CI4 flaw where the return URL bounced to /login.
  return <OrderStatusClient reference={reference} initial={order.status} />;
}
```

```tsx
'use client';
const TERMINAL = ['FULFILLED', 'FAILED', 'EXPIRED', 'CANCELLED'];

export function OrderStatusClient({ reference, initial }: Props) {
  const [status, setStatus] = useState(initial);

  useEffect(() => {
    if (TERMINAL.includes(status)) return;
    // Poll OUR database, not Fapshi. Unlimited, free, and cannot be rate-limited.
    const t = setInterval(async () => {
      const r = await fetch(`/api/orders/${reference}/status`, { cache: 'no-store' });
      const { status } = await r.json();
      setStatus(status);
      if (TERMINAL.includes(status)) clearInterval(t);
    }, 4_000);
    return () => clearInterval(t);
  }, [status]);

  // PENDING    → spinner + "n fermez pas cette page"
  // FULFILLED  → receipt + download links
  // FAILED     → "réessayer"  (new intent, new attempt number)
  // EXPIRED    → "votre lien a expiré, relancez le paiement"
}
```

**Optional server-side reconcile endpoint** — a manual "I already paid" button that hits Fapshi *once*,
behind a per-`transId` token bucket honouring 6/minute:

```ts
// lib/payments/rate-limit.ts
const buckets = new Map<string, { tokens: number; ts: number }>();

export function allowFapshiPoll(transId: string): boolean {
  const now = Date.now();
  const b = buckets.get(transId) ?? { tokens: 6, ts: now };
  b.tokens = Math.min(6, b.tokens + ((now - b.ts) / 60_000) * 6);
  b.ts = now;
  buckets.set(transId, b);
  if (b.tokens < 1) return false;
  b.tokens -= 1;
  return true;
}
```

Put this in front of **every** `fetchStatus()`. The CI4 callback page hits it 12×/minute; here it is
capped at 6, and in practice never called at all because the webhook already settled the order.

### 10.11 Expiry sweeper + reconciliation — the mandatory safety net

Because Fapshi sends **one** webhook and never retries, cron jobs are not optional.

```ts
// app/api/cron/expire-orders/route.ts
export async function POST(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`)
    return new Response('nope', { status: 401 });

  const stale = await prisma.order.findMany({
    where: { status: { in: ['PENDING', 'PAYMENT_PROCESSING'] }, expiresAt: { lt: new Date() } },
    include: { payments: true },
    take: 200,
  });

  let expired = 0, rescued = 0;
  for (const o of stale) {
    for (const p of o.payments) {
      if (p.status === 'SUCCEEDED' || !p.providerRef) continue;
      if (allowFapshiPoll(p.providerRef)) {
        const evt = await getGateway(p.gateway).fetchStatus(p.providerRef);
        if (evt?.status === 'succeeded') { await settlePayment(p.id); rescued++; continue; }  // money-saver
      }
    }
    await prisma.order.update({ where: { id: o.id }, data: { status: 'EXPIRED' } });
    expired++;
  }
  return Response.json({ expired, rescued });
}
```

Add a second cron reconciling against `GET /search-transactions?status=SUCCESSFUL&date=…`:
any Fapshi `transId` whose `externalId` matches an `Order.reference` **not** in `PAID` is an
incident — page someone. That single query would have caught the double-charge incidents visible in
this repository's own access log.

### 10.12 Environment / configuration

```bash
FAPSHI_BASE_URL=https://live.fapshi.com   # NOT .../initiate-pay — build paths in code
FAPSHI_API_KEY=…
FAPSHI_USER_KEY=…
FAPSHI_WEBHOOK_SECRET=…                  # set in the Fapshi dashboard; REQUIRED at boot
NEXT_PUBLIC_APP_URL=https://savoirnet.net
WEBHOOK_BASE_URL=https://savoirnet.net/api/webhooks
RETURN_URL_TEMPLATE=https://savoirnet.net/orders/{reference}
CRON_SECRET=…
DATABASE_URL=postgresql://…
```

Rules:

- One **base URL** per provider with no path suffix. The `str_replace('/initiate-pay', …)` trick
  (`Payment.php:585`) is exactly the bug this prevents.
- Assert at boot: for Fapshi, `FAPSHI_WEBHOOK_SECRET` must be set and `FAPSHI_BASE_URL` must be
  `live` or `sandbox`. Refuse to boot otherwise — fail closed, like §10.8.
- Keep every secret server-only. Never prefix with `NEXT_PUBLIC_`.
- **Add deny rules for dotfiles and archives in the webroot.** The root `.htaccess` only rewrites, so
  `/.env`, `/SavoirNet-main_delivery.tar.gz`, `/test_fapshi.php` and `/creer-test.php` are plausibly
  downloadable. Rotate the Fapshi `apikey`/`apiuser` and the SebPay `sk_live_*` afterwards, and check
  the access logs to see whether they were ever fetched.

### 10.13 Flaw → fix map

| CI4 flaw | Fix |
|---|---|
| No signature check (`:640`) | `verifyWebhook()` via `x-wh-secret`, fails closed 500 if unset |
| No amount check (`:650`) | `payment.amountMinor !== order.totalMinor` inside `settlePayment` |
| Double POST → 2 live links | `createOrReuseIntent` reuses the live URL; `voidPayment` expires stale ones |
| Check-then-act (`:666`) | `updateMany({ where: { status: { notIn: ['SUCCEEDED'] } } })` — one atomic claim |
| Double `activateUserAccess` | `Fulfillment.orderId @unique` |
| Double commission credit | `WalletLedger.entryKey @unique` |
| Lost wallet updates (`:102`) | `walletMinor: { increment }` |
| `revenue` ignored | `amountMinor` **and** `revenueMinor` stored separately |
| `EXPIRED` unmapped (`:670`) | normalized status enum + the expiry sweeper |
| 6/min rate limit blown (`callback.php:83`) | poll our own DB; `allowFapshiPoll` token bucket on the rare real call |
| 200-on-failure (`:663`) | 404/500 for unknown payment; 200 only for genuine duplicates |
| No provider retry | expiry + reconciliation crons; alert on `PENDING > 15 min` |
| Session-gated return URL (`Routes.php:44`) | `/orders/[reference]` public, no auth |
| No expiry sweep | `/api/cron/expire-orders` |
| Dual truth (`status` + `has_paid`) | one `Order.status`; `Payment` rows are attempts; the `Fulfillment` row *is* the grant |
| `getByToken()->first()` nondeterministic | `providerRef @unique` + `findUnique` |
| Gross-only accounting | store `amountMinor` **and** `revenueMinor` |

### 10.14 Phased migration plan

**Phase 0 — today, no code change (30 minutes)**

1. Add deny rules for `/.env`, `/*.tar.gz`, `/*.zip`, `/test_fapshi.php`, `/creer-test.php`,
   `/info.php`, `/nul` in the webroot. Rotate the Fapshi and SebPay keys afterwards.
2. Query for double-activations and repair by hand:
   ```sql
   SELECT user_id, COUNT(*) FROM payments
   WHERE status = 'completed' GROUP BY user_id HAVING COUNT(*) > 1;

   SELECT referrer_id, referred_id, level, COUNT(*) FROM referrals
   GROUP BY referrer_id, referred_id, level HAVING COUNT(*) > 1;
   ```
3. Check for pending rows older than 24 h and resolve them manually against the Fapshi dashboard.
4. Set the webhook secret in the Fapshi dashboard and confirm the dashboard URL matches
   `FAPSHI_webhook_url`.

**Phase 1 — stop the bleeding (1 day)**

5. Add `x-wh-secret` verification to `webhookFapshi()`.
6. Add amount verification (`$amount === $payment['amount_requested']`).
7. Set `payment_method = 'fapshi'` in `processWithFapshi()` on success — this alone revives the
   broken fallback in `callback()`.
8. Add a rate limiter in front of `checkFapshiPaymentStatus()`; slow the auto-refresh to 15 s.
9. Add the unique indexes: `payment_transactions.token_pay`,
   `referrals (referrer_id, referred_id, level)`.

**Phase 2 — kill the double debit (2 days)**

10. In `process()`, look for a live pending transaction and reuse its `payment_url` instead of
    creating a new one. Call `POST /expire-pay` on the superseded `transId`.
11. Move `activateUserAccess()`'s side effects behind a conditional claim and a `UNIQUE` fulfillment
    marker.
12. Make `updateWalletBalance()` an atomic `SET wallet_balance = wallet_balance + ?`.

**Phase 3 — observability (1 day)**

13. Add an expiry sweep (`php spark` command or an external cron) and a reconciliation job against
    `GET /search-transactions`.
14. Alert on: webhook 5xx rate, `pending > 15 min`, `paid` orders with no `payments` row, and any
    `amount_mismatch` event.

**Phase 4 — the Next.js rewrite**, using §10 as the blueprint.

---

## 11. Operations runbook

### 11.1 Diagnosing a stuck payment

```sql
-- 1. What do we think happened?
SELECT id, user_id, status, token_pay, amount_requested, amount_paid, payment_method,
       webhook_received, created_at, updated_at
FROM payment_transactions
WHERE id = ? OR token_pay = ?;

-- 2. Is there a receipt?
SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC;

-- 3. Did the referral chain get credited?
SELECT * FROM referrals WHERE referred_id = ? ORDER BY level;
```

Then compare `token_pay` against the Fapshi dashboard or
`GET /payment-status/{transId}`, and inspect `webhook_data` (it holds the raw payload).

### 11.2 Useful log greps

```bash
grep "Fapshi Webhook Received"      writable/logs/log-*.log
grep "Fapshi webhook processed"     writable/logs/log-*.log
grep "Fapshi: Payment not found"    writable/logs/log-*.log
grep "Fapshi API Response"          writable/logs/log-*.log     # may contain provider error text
grep "User access activated"        writable/logs/log-*.log
grep "Fapshi.*error"                writable/logs/log-*.log
```

### 11.3 Alerts worth wiring up

| Alert | Threshold | Why |
|---|---|---|
| Orders `PENDING` with no webhook | > 15 min | Fapshi will not retry; this is your only window |
| `amount_mismatch` events | any | someone underpaid |
| Webhook returns 4xx/5xx | any | secret mismatch, DB down, or unknown `transId` |
| Same `transId` on 2 rows | any | duplicate `initiate-pay` — the double-debit signature |
| `paid` transaction with no `payments` row | any | `recordPayment` failed silently |
| `sum(commissions) > captured revenue` | any | the "100 + 1" regression |
| `429` from Fapshi | any | the polling loop is over budget |

### 11.4 Manual payment validation (last resort)

`Admin::validatePayment()` (`Admin.php:233-267`) calls
`PaymentModel::processSuccessfulPayment()` with `MANUAL_{time}_{userId}`. It is guarded by
`has_paid`, so it is safe against double-crediting, but it records revenue as `5000` and credits the
full commission chain. Use it only after confirming the money in the Fapshi dashboard, and log who
approved it.

---

## 12. Appendix — file index

### Payment flow

| File | Role |
|---|---|
| `app/Controllers/Payment.php` | `index`, `process`, `processWithFapshi`, `processWithSebPay`, `webhookFapshi`, `webhookSebPay`, `callback`, `checkFapshiPaymentStatus`, `checkSebPayPaymentStatus`, `activateUserAccess`, dev simulators |
| `app/Config/Routes.php:41-55` | all payment routes; webhooks declared without a filter |
| `app/Config/Filters.php:79` | CSRF global, with the two webhook routes exempted |
| `app/Filters/AuthFilter.php` | session gate; re-syncs `has_paid` into the session on every request |
| `app/Views/payment/index.php` | checkout form (amount, phone, operator) |
| `app/Views/payment/callback.php:74-89` | status page + 5 s auto-refresh for 5 min |
| `app/Views/payment/success.php`, `cancel.php` | terminal pages |

### Models

| File | Role |
|---|---|
| `app/Models/PaymentTransactionModel.php` | attempts; `getByToken` (non-unique), `getUserTransactions`, `getPendingPayments` |
| `app/Models/PaymentModel.php` | receipts; `recordPayment` (bypasses validation), `processSuccessfulPayment` (dead path) |
| `app/Models/UserModel.php` | `hasPaid`, `updateWalletBalance` (read-modify-write), `getReferralChain` (4 levels) |
| `app/Models/ReferralModel.php` | `COMMISSION_AMOUNTS` / `COMMISSION_RATES`, `createReferralChain` |
| `app/Models/WithdrawalModel.php` | `requestWithdrawal` (debits the wallet in a tx), `MINIMUM_WITHDRAWAL = 3000` |

### Migrations

| File | Contents |
|---|---|
| `2025-01-15-100000_CreateUsersTable.php` | `users` |
| `2025-01-15-100001_CreateReferralsTable.php` | `referrals` — **no unique constraint on the trio** |
| `2025-01-15-100004_CreatePaymentsTable.php` | `payments` — `transaction_id` UNIQUE(100) |
| `2025-01-15-100005_CreateWithdrawalsTable.php` | `withdrawals` |
| `2026-01-16-100004_CreatePaymentTransactionsTable.php` | `payment_transactions` — `token_pay` is a plain KEY |
| `2026-01-27-100000_AddCountryToUsers.php` | `users.country` (drives gateway routing) |

### Docs and config

| File | Notes |
|---|---|
| `GUIDE_WEBHOOKS_FAPSHI.md` | **Partly wrong** — assumes retries exist; recommends a 200 response for "Payment not found" |
| `SETUP_SEBPAY.md` | SebPay keys, webhook HMAC, operator slugs |
| `SETUP_ENV.md`, `env-configs/.env.*` | environment templates |
| `.env` | live credentials; git-ignored, but reachable in the webroot (§9.1 #9) |
| `test_fapshi.php` | raw curl diagnostic against the sandbox — **delete from the webroot** |
| `logs savoirnet.txt` | production access log; contains the double-`POST /payment/process` evidence |

### Fapshi reference

| Endpoint | Method | Used here? |
|---|---|---|
| `/initiate-pay` | POST | yes — `Payment.php:169` |
| `/payment-status/:transId` | GET | yes — `Payment.php:585` (6/min limit) |
| `/expire-pay` | POST | **no** — this is the double-debit fix |
| `/direct-pay` | POST | no — push payment to the phone, no redirect |
| `/search-transactions` | GET | **no** — needed for reconciliation |
| `/transaction-by-user` | GET | **no** |
| `/balance` | GET | no |
| `/payout` | POST | no (withdrawals are manual) |

Official documentation: `https://docs.fapshi.com` ·
machine-readable spec: `https://docs.fapshi.com/en/api-reference/openapi.json` ·
SDKs: `https://github.com/Fapshi/SDKs`

---

*End of document. No credentials are reproduced in this file.*
