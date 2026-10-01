import test from "node:test";
import assert from "node:assert/strict";
import {
  applyStockDelta,
  classifyStock,
  reorderQuantity,
  buildMovement,
  toInventoryRow,
  buildInventoryView,
  type StockTracking,
} from "@/lib/stock";

/**
 * Stock arithmetic.
 *
 * The rule under test throughout: stock never goes negative, and an order that
 * exceeds what is on hand is recorded as a shortfall rather than rejected. The
 * clinic already has a product at zero stock, and a portal that refuses to sell
 * it is worse than one that reports the gap.
 */

test("taking stock out reduces it", () => {
  const change = applyStockDelta(10, -3);
  assert.deepEqual(change, { applied: -3, stockAfter: 7, shortfall: 0, short: false });
});

test("adding stock increases it", () => {
  const change = applyStockDelta(10, 25);
  assert.deepEqual(change, { applied: 25, stockAfter: 35, shortfall: 0, short: false });
});

test("selling more than is on hand applies what exists and reports the gap", () => {
  const change = applyStockDelta(2, -5);
  assert.equal(change.applied, -2);
  assert.equal(change.stockAfter, 0);
  assert.equal(change.shortfall, 3);
  assert.equal(change.short, true);
});

test("selling from empty stock records the whole order as short", () => {
  const change = applyStockDelta(0, -4);
  assert.equal(change.applied, 0);
  assert.equal(change.stockAfter, 0);
  assert.equal(change.shortfall, 4);
  assert.equal(change.short, true);
});

test("stock can never be driven below zero by any input", () => {
  for (const [before, delta] of [[0, -1], [0, -9999], [3, -4], [-5, -1], [10, -10]] as const) {
    assert.ok(applyStockDelta(before, delta).stockAfter >= 0, `${before} ${delta}`);
  }
});

test("nonsense stock and delta values degrade safely", () => {
  assert.equal(applyStockDelta(Number.NaN, -5).stockAfter, 0);
  assert.equal(applyStockDelta(10, Number.NaN).stockAfter, 10);
  assert.equal(applyStockDelta(10, -1.7).applied, -1);
  assert.equal(applyStockDelta(10, 2.9).stockAfter, 12);
});

test("classifyStock calls zero out of stock whatever the threshold", () => {
  assert.equal(classifyStock({ stock: 0, reorderThreshold: 10 }), "out");
  assert.equal(classifyStock({ stock: 0, reorderThreshold: null }), "out");
  assert.equal(classifyStock({ stock: -5, reorderThreshold: 10 }), "out");
});

test("classifyStock calls stock at or below the level low", () => {
  assert.equal(classifyStock({ stock: 10, reorderThreshold: 10 }), "low");
  assert.equal(classifyStock({ stock: 4, reorderThreshold: 10 }), "low");
  assert.equal(classifyStock({ stock: 11, reorderThreshold: 10 }), "ok");
});

test("classifyStock refuses to guess when no level has been set", () => {
  assert.equal(classifyStock({ stock: 5, reorderThreshold: null }), "untracked");
  assert.equal(classifyStock({ stock: 5, reorderThreshold: undefined }), "untracked");
  assert.equal(classifyStock({ stock: 5 }), "untracked");
});

test("reorderQuantity is silent rather than invented", () => {
  assert.equal(reorderQuantity({ stock: 2, reorderThreshold: null, reorderTarget: 50 }), null);
  assert.equal(reorderQuantity({ stock: 2, reorderThreshold: 10 }), null);
  assert.equal(reorderQuantity({ stock: 2, reorderThreshold: 10, reorderTarget: 10 }), null);
});

test("reorderQuantity is silent when stock is still above the level", () => {
  assert.equal(reorderQuantity({ stock: 40, reorderThreshold: 10, reorderTarget: 50 }), null);
});

test("reorderQuantity tops the product back up to the target", () => {
  assert.equal(reorderQuantity({ stock: 4, reorderThreshold: 10, reorderTarget: 50 }), 46);
  assert.equal(reorderQuantity({ stock: 0, reorderThreshold: 10, reorderTarget: 30 }), 30);
});

test("a movement records the arithmetic it caused", () => {
  const movement = buildMovement(
    {
      kind: "order-reserve",
      product: "p1",
      productSlug: "sozo",
      productName: "S19 Sozo",
      delta: -2,
      stockBefore: 10,
    },
    { orderId: "o1", orderReference: "S19-123", actorName: "Ada", at: new Date("2026-09-30T00:00:00Z") }
  );

  assert.equal(movement.stockBefore, 10);
  assert.equal(movement.stockAfter, 8);
  assert.equal(movement.applied, -2);
  assert.equal(movement.shortfall, 0);
  assert.equal(movement.short, false);
  assert.equal(movement.orderReference, "S19-123");
});

test("a movement on a short order is marked as such", () => {
  const movement = buildMovement(
    {
      kind: "order-reserve",
      product: "p1",
      productSlug: "sozo",
      productName: "S19 Sozo",
      delta: -5,
      stockBefore: 1,
    },
    { at: new Date() }
  );

  assert.equal(movement.short, true);
  assert.equal(movement.shortfall, 4);
  assert.equal(movement.stockAfter, 0);
});

test("a movement always carries a dedupe key field, even when empty", () => {
  const movement = buildMovement(
    { kind: "restock", product: "p1", productSlug: "s", productName: "n", delta: 5, stockBefore: 0 },
    { at: new Date() }
  );
  // An explicit null, not an absent field: the unique partial index depends on
  // the distinction between "no key" and "key is null".
  assert.equal(movement.dedupeKey, null);
});

test("toInventoryRow surfaces what staff still need to decide", () => {
  const row = toInventoryRow({ _id: "p1", slug: "sozo", name: "S19 Sozo", stock: 3 });
  assert.equal(row.level, "untracked");
  assert.equal(row.needsThreshold, true);
  assert.equal(row.reorderQuantity, null);
});

test("toInventoryRow computes the reorder quantity when levels are set", () => {
  const row = toInventoryRow({
    _id: "p1",
    slug: "sozo",
    name: "S19 Sozo",
    stock: 3,
    reorderThreshold: 10,
    reorderTarget: 60,
  });
  assert.equal(row.level, "low");
  assert.equal(row.needsThreshold, false);
  assert.equal(row.reorderQuantity, 57);
});

test("the inventory view puts problems first", () => {
  const view = buildInventoryView([
    { _id: "a", slug: "ok", name: "Fine", stock: 90, reorderThreshold: 10, reorderTarget: 50 },
    { _id: "b", slug: "untracked", name: "Unknown", stock: 20 },
    { _id: "c", slug: "out", name: "Gone", stock: 0, reorderThreshold: 10, reorderTarget: 50 },
    { _id: "d", slug: "low", name: "Running low", stock: 5, reorderThreshold: 10, reorderTarget: 50 },
  ]);

  assert.deepEqual(view.rows.map((r) => r.level), ["out", "low", "untracked", "ok"]);
  assert.deepEqual(view.summary, {
    total: 4,
    out: 1,
    low: 1,
    ok: 1,
    untracked: 1,
    needsThreshold: 1,
  });
});

test("the headline leads with what is actually out of stock", () => {
  const view = buildInventoryView([
    { _id: "a", slug: "a", name: "A", stock: 0, reorderThreshold: 5, reorderTarget: 20 },
    { _id: "b", slug: "b", name: "B", stock: 2, reorderThreshold: 5, reorderTarget: 20 },
    { _id: "c", slug: "c", name: "C", stock: 90, reorderThreshold: 5, reorderTarget: 20 },
  ]);
  assert.equal(view.headline, "1 product is out of stock. 1 below reorder level.");
});

test("a single out-of-stock product reads naturally", () => {
  const view = buildInventoryView([
    { _id: "a", slug: "a", name: "A", stock: 0 },
    { _id: "b", slug: "b", name: "B", stock: 90, reorderThreshold: 5 },
  ]);
  assert.equal(view.headline, "1 product is out of stock.");
});

test("a healthy shop says so", () => {
  const view = buildInventoryView([
    { _id: "a", slug: "a", name: "A", stock: 90, reorderThreshold: 5 },
    { _id: "b", slug: "b", name: "B", stock: 40, reorderThreshold: 5 },
  ]);
  assert.equal(view.headline, "Stock levels look fine.");
  assert.equal(view.summary.out, 0);
});

test("an empty catalogue does not claim everything is fine", () => {
  const view = buildInventoryView([]);
  assert.equal(view.rows.length, 0);
  assert.equal(view.summary.total, 0);
  assert.equal(view.summary.needsThreshold, 0);
});

test("ordering within a band puts the biggest reorder first", () => {
  const view = buildInventoryView([
    { _id: "a", slug: "a", name: "Small", stock: 5, reorderThreshold: 10, reorderTarget: 15 },
    { _id: "b", slug: "b", name: "Big", stock: 1, reorderThreshold: 10, reorderTarget: 100 },
  ]);
  assert.deepEqual(view.rows.map((r) => r.slug), ["b", "a"]);
});

test("tracking objects are read consistently whatever shape they arrive in", () => {
  const cases: StockTracking[] = [
    { stock: 5 },
    { stock: 5, reorderThreshold: undefined },
    { stock: 5, reorderThreshold: null },
  ];
  for (const t of cases) assert.equal(classifyStock(t), "untracked");
});