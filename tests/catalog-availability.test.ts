import test from "node:test";
import assert from "node:assert/strict";
import { isPurchasable, isSoldOut } from "@/lib/site";

/**
 * Public product availability.
 *
 * The rule: every active product is listed, including products with no stock.
 * An out-of-stock product stays browsable but cannot be bought - its cart
 * button and order shortcut are disabled and greyed out. A quote-only package
 * (price 0) is never buyable and never "sold out": it has its own contact
 * panel and is priced on request.
 */

test("a priced product is buyable only while it is in stock", () => {
  assert.equal(isPurchasable({ price: 5000, stock: 3 }), true);
  assert.equal(isPurchasable({ price: 5000, stock: 0 }), false);
  assert.equal(isPurchasable({ price: 5000, stock: -2 }), false);
});

test("a quote-only package is never buyable, whatever its stock field holds", () => {
  assert.equal(isPurchasable({ price: 0, stock: 0 }), false);
  assert.equal(isPurchasable({ price: 0, stock: 10 }), false);
});

test("a priced product with no stock is sold out, not hidden", () => {
  assert.equal(isSoldOut({ price: 5000, stock: 0 }), true);
  assert.equal(isSoldOut({ price: 5000, stock: -2 }), true);
  assert.equal(isSoldOut({ price: 5000, stock: 1 }), false);
});

test("a quote-only package is never sold out - it is priced on request", () => {
  assert.equal(isSoldOut({ price: 0, stock: 0 }), false);
  assert.equal(isSoldOut({ price: 0, stock: 5 }), false);
});
