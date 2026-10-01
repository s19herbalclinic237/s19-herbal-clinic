# Stock and inventory

How product stock is held, released, recounted and explained.

**Status:** live on `main`, no credentials required. Nothing here depends on Meta or Fapshi.

---

## 1. What was broken

`Product.stock` was a number a staff member typed into a form. That produced four
distinct failures, none of which announced itself:

1. **Orders never moved it.** `POST /api/orders` created an order and stopped.
   Two patients could buy the last bottle, and both orders would succeed.
2. **Nothing was recorded.** Setting the count to a different number overwrote
   the old one with no history. A mistake was untraceable and therefore
   permanent.
3. **Cancellation returned nothing.** Cancelling an order released no stock, so
   goods that came back onto the shelf stayed invisible to the shop.
4. **"Low stock" did not exist.** There was no reorder level, so no view could
   say what needed ordering, and no way to tell a real shortage from a number
   nobody had checked.

The value of the ledger is not the automation. It is that `Product.stock` can
now be *explained* — and, more usefully, a wrong number can be corrected without
guessing which order caused it.

---

## 2. The ledger

`StockMovement` is append-only. Rows are never updated; a mistake is answered
with a `correction`, so the history stays a record of what happened rather than
of what is currently believed.

| Field | Meaning |
| --- | --- |
| `product` | The related product. The name and slug are copied onto the row so history survives a rename or deletion. |
| `kind` | `order-reserve`, `order-release`, `restock`, `adjustment`, `correction`. |
| `delta` | The signed request in units. Negative means stock left. |
| `applied` | What actually moved. Differs from `delta` only on a short stock. |
| `shortfall` | `|delta| - |applied|` — what could not be applied. |
| `short` | True when the request exceeded stock on hand. |
| `stockBefore` / `stockAfter` | The count either side of this movement. |
| `order` / `orderReference` | Present for order-driven movements. |
| `actor` / `actorName` | Who did it. |
| `note` | Free text, up to 500 characters. |
| `dedupeKey` | Identity of a movement that must happen at most once. See §4. |

Every movement records its own arithmetic: `stockBefore + applied === stockAfter`
is checked for every row on read (`GET /api/admin/inventory/[id]`).

---

## 3. When stock moves

| Trigger | Movement | Notes |
| --- | --- | --- |
| Order placed (`POST /api/orders`) | `order-reserve` | Stock is held at order time, not at delivery. Reserving prevents overselling; releasing happens when the order is cancelled. |
| Order cancelled (`PATCH /api/admin/orders/[id]`) | `order-release` | Fires on the transition *into* `Cancelled`. Cancelling an already-cancelled order is a no-op. |
| Delivery arrives (`POST /api/admin/inventory/[id]` with `delta`) | `restock` | Adds units. |
| Recount (`POST /api/admin/inventory/[id]` with `to`) | `adjustment` | Sets an absolute count. |
| Product edited with a new `stock` (`PATCH /api/admin/products/[id]`) | `adjustment` | Routed through the ledger so it is no longer a silent overwrite. |

Two deliberate non-movements:

- **Creating a product does not write a movement.** The opening count is the
  product's *baseline*, not a change to it. This is the same situation as the
  seeded products, and the reconciliation in §6 handles both by baselining on
  the oldest movement.
- **Cancelling is the only thing that returns stock.** A delivered order
  consumes its units permanently; there is no automatic return path.

---

## 4. Retrying cannot double-count

Order creation and status updates are the kind of thing a client retries, a
proxy replays, or a staff member double-clicks. A stock figure that silently
halves on a retry is worse than one that is never updated at all.

Each order-driven movement carries a `dedupeKey`:

```
order:<orderId>:reserve:<productSlug>
order:<orderId>:release:<productSlug>
```

`dedupeKey` is unique via a **partial** index (`{ dedupeKey: 1 }` with
`partialFilterExpression: { dedupeKey: { $type: "string" } }`), not a sparse one.
A sparse index still stores an explicit `null`, so every manual adjustment without
a key would collide with every other one.

The write order is deliberate:

1. `Product.findOneAndUpdate` with a plain `$inc` — a single atomic document
   update, which cannot interleave with another order.
2. `StockMovement.create` under the unique key. If that row already exists, the
   stock change is **undone**, because this change was already recorded by an
   earlier attempt.

A crash between the two steps leaves stock moved without a ledger row. That is
recoverable — §6 rebuilds the truth from the movements — whereas writing the row
first would leave a ledger claiming stock moved when it did not.

The id filter is a plain `_id`, deliberately without a `stock: { $gte: 0 }`
guard. That guard looks protective but is a lost-update path: a concurrent
request that briefly left stock negative before clamping it would cause the
whole reservation to be skipped and silently vanish.

---

## 5. Stock never goes negative, and checkout is never blocked

The rule throughout: an order that exceeds available stock applies what exists
and records the remainder as an explicit shortfall.

A seeded product already sits at zero stock. A portal that refuses to sell it is
worse than one that reports the gap — a clinic that cannot take an order stops
using the portal. And "you are selling stock you do not have" is precisely what
staff need to see, whereas a rejected checkout just looks like a bug.

- Order 25 units against 10 in stock → `applied: -10`, `stockAfter: 0`,
  `shortfall: 15`, `short: true`. The order stands.
- Manual removal of 999 against 12 in stock → clamped to 0 and reported as short.
- `POST /api/admin/inventory/[id]` refuses a `delta` that would go below zero
  with a 400 explaining how much is actually in stock, so staff are told rather
  than discovering a week later that the number they entered did not land.

The clamp is applied as a separate `$set` immediately after the `$inc`, because
MongoDB updates cannot compute a floor in one expression. In the pathological
over-draw case a concurrent reader could momentarily see a negative value; every
read path runs the count through a non-negative normalisation, so it is displayed
as zero and classified as out of stock.

---

## 6. Reading it back

`GET /api/admin/inventory` returns every active product — not only the ones with
a reorder level — because the clinic has no levels yet and *"which lines are you
actually tracking?"* is the first question this page has to answer.

```
GET /api/admin/inventory[?history=1][&product=<id>][&limit=<n>][&includeInactive=1]
```

Each row: `stock`, `level`, `reorderThreshold`, `reorderTarget`,
`reorderQuantity`, `needsThreshold`. Plus `summary` and a one-line `headline`.

`level` is one of:

| Level | Meaning |
| --- | --- |
| `out` | Stock is zero. Always reported, regardless of any threshold. |
| `low` | At or below the reorder level the clinic set. |
| `ok` | Above it. |
| `untracked` | No reorder level has been set. |

`untracked` is reported rather than guessed. Inventing a default would either
cry wolf on a well-stocked line or hide a genuine shortage, and both are worse
than an honest "we do not know yet".

Ordering is `out` → `low` → `untracked` → `ok`, and within a band by largest
reorder quantity. A product at zero is a fact, one below its level is a
judgement, and one with no level set is neither — so the facts come first.

### Reconciliation

`GET /api/admin/inventory/[id]` returns the movement history plus:

```json
"reconciliation": {
  "tracked": true,
  "trackedSince": "2026-10-01T09:12:04.881Z",
  "baseline": 10,
  "net": -3,
  "reconstructed": 7,
  "stored": 7,
  "matches": true
}
```

The ledger only covers movements since tracking began — every product predates
it — so the absolute sum of movements is meaningless on its own. Reconciling
from the oldest movement's `stockBefore` instead answers the question that
matters: **does the number on the product still follow from what was recorded?**
A mismatch means a movement was lost, which is the one failure mode a ledger
exists to catch. A product with no movements reports `{"tracked": false}` rather
than a misleading `reconstructed: 0`.

---

## 7. What the clinic still needs to set

None of this is blocked, but the reorder half is inert until the clinic decides
numbers. `reorderThreshold` and `reorderTarget` are nullable with **no default**,
deliberately: every existing product predates inventory tracking and has never
been given a level.

| Needed | Why | Without it |
| --- | --- | --- |
| Reorder level per product | The point at which to order more | Everything stays `untracked`; only true zeros are reported |
| Reorder target per product | What a delivery should bring stock back up to | No reorder *quantity* is suggested — a number nobody chose is worse than none |
| Real opening counts | Current `stock` values are placeholders from the seed data | The shop is guessing; the ledger faithfully records changes to an unverified baseline |

Setting a level is an ordinary product edit:

```
PATCH /api/admin/products/<id>
{ "reorderThreshold": 5, "reorderTarget": 40 }
```

Explicit `null` or `""` clears a level — that is how staff say "no level for
this product".

---

## 8. Verification

### Unit tests

`tests/stock.test.ts` — 24 tests over `lib/stock.ts` (the pure rules). The
arithmetic, the level classification, the refusal to guess, and the view
ordering.

### Live exerciser

```
npm.cmd run verify:stock
```

This is the only way to test the properties that matter and that neither
typecheck nor a unit test can reach: that the atomic `$inc` holds under a
repeated call, that the unique partial index really does reject a second reserve
for one order, that the duplicate-key path undoes the duplicate change instead
of doubling it, and that the ledger reconciles back to the stored count.

**It never touches production.** The ledger module uses the *default* Mongo
connection, so the script points the default connection at a scratch database
(`s19_stock_verify_scratch`) and then **asserts the connected database name
before writing anything** — if the option is ever ignored, it aborts rather than
touching live data. The scratch database is dropped in a `finally` block.

Result on 1 October 2026: **22 checks, 22 passed, 0 failed.**

```
Reserving stock for a placed order
  PASS  stock falls by the ordered quantity
  PASS  the reserve is recorded in the ledger

Replaying the same order (a retried request)
  PASS  stock is unchanged by a replay
  PASS  the replay is recognised, not re-recorded
  PASS  exactly one reserve movement exists

Returning stock for a cancelled order
  PASS  stock is restored

Replaying the cancellation
  PASS  stock is unchanged by a replay
  PASS  exactly one release movement exists

Over-ordering more than is on hand
  PASS  stock floors at zero rather than going negative
  PASS  the shortfall is reported
  PASS  the movement is flagged short
  PASS  applied equals what was available

Recording a restock
  PASS  stock rises by the delivered quantity
  PASS  the movement carries the actor

Recounting to an absolute figure
  PASS  stock becomes the recounted figure

Recounting to the figure it already is
  PASS  nothing is written for a no-op recount
  PASS  stock is unchanged

Ledger reconciliation
  PASS  the ledger reproduces the stored count
  PASS  every movement records its own arithmetic

Over-removing via a manual adjustment
  PASS  stock still floors at zero
  PASS  the overdraw is reported as short

A slug that matches no product
  PASS  is skipped rather than throwing
```

### Why the script needs `tsconfig.scripts.json`

`server-only` is a Next.js alias, not an installed package, so it cannot be
resolved by `tsx` at all. Without the stub the only way to test `lib/stock-db.ts`
would be to reimplement it in the script — which would test the copy rather than
the code. `tsconfig.scripts.json` maps `server-only` to
`scripts/stubs/server-only.ts`, a no-op, for script runs only. The app's own
build still uses the real module, so the client-bundle guard is intact. Nothing
in the app imports the stub.

### Two bugs this found

Both were invisible to typecheck and to unit tests, and are recorded here
because they are the reason to run the script at all:

1. **Nothing could ever be written.** `buildMovement` emitted a `productId` field
   against a `product` schema field, so every `StockMovement.create` failed
   validation. Field names now match the schema exactly.
2. **`applied` meant two different things.** It was a boolean "was this
   recorded?" on `MovementResult` and a signed unit count on the movement row.
   The boolean is now `recorded`, so one word means one thing across both types.

---

## 9. Known gaps

- **No inventory screen yet.** `/api/admin/inventory` and `/api/admin/inventory/[id]`
  are complete and documented, but no component consumes them. The clinic would
  currently have to call the API directly.
- **Prices come from the client.** Order `subtotal`, item `price` and `total`
  are computed from the cart the browser sends. That is a separate integrity gap
  from stock and is not addressed here — worth noting because it means an order
  total can disagree with the products it references.
- **Order items carry no product id.** They carry `productSlug` only, because
  they arrive from the client's cart. The ledger resolves products server-side
  by slug and never trusts a client-supplied id. A slug matching no product is
  skipped rather than failing the order, so a discontinued line in a saved cart
  cannot block checkout.
- **No purchase-order or supplier concept.** A `restock` records units arriving
  and who logged it. It does not record what was ordered, from whom, or when it
  is due, so "what did we order and has it arrived" is still a manual question.
- **No stock counting cycle.** Movements tell you what the system believes.
  Nothing prompts a physical recount on a schedule.
- **Product deletion is unlinked.** Deleting a product leaves its movements
  behind, which preserves history correctly, but the inventory list will no
  longer surface them. A deleted-product movements view does not exist.