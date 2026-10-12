import test from "node:test";
import assert from "node:assert/strict";
import { isPurchasable, isPubliclyAvailable } from "@/lib/site";

/**
 * Public shop visibility.
 *
 * The rule: nothing is listed or bought while its stock is zero. A product with
 * stock 0 is hidden from the shop and 404s on its detail page, whatever its
 * price. A quote-only package (price 0) that IS in stock stays listed but is
 * never buyable - it shows a "contact S19" panel, not a cart button.
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

test("an out-of-stock priced product cannot appear in a public listing", () => {
  assert.equal(isPubliclyAvailable({ price: 5000, stock: 0 }), false);
  assert.equal(isPubliclyAvailable({ price: 5000, stock: 1 }), true);
});

test("a quote-only package with no stock is hidden like any other empty line", () => {
  assert.equal(isPubliclyAvailable({ price: 0, stock: 0 }), false);
});

test("a quote-only package that is in stock is listed but still not buyable", () => {
  assert.equal(isPubliclyAvailable({ price: 0, stock: 5 }), true);
  assert.equal(isPurchasable({ price: 0, stock: 5 }), false);
});
