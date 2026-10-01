import type { StockMovementKind } from "@/lib/models/StockMovement";

/**
 * Stock arithmetic, kept separate from the database so the rules are testable
 * and so a retry cannot quietly double-count.
 *
 * The guiding decision: **stock never goes negative and checkout never fails.**
 * A seeded product already sits at zero, and a clinic that cannot sell because
 * a number was never entered would simply stop using the portal. So an order
 * that exceeds available stock applies what exists and records the remainder as
 * an explicit shortfall — which is more useful to staff than a rejected order,
 * because "you are selling stock you do not have" is the thing they need to see.
 */

export type StockLevel = "out" | "low" | "ok" | "untracked";

export interface StockTracking {
  stock: number;
  /** Level at which staff should reorder. Null until the clinic sets one. */
  reorderThreshold?: number | null;
  /** Level a reorder should bring stock back up to. Null until the clinic sets one. */
  reorderTarget?: number | null;
}

export interface StockChange {
  /** Signed change actually applied to `stock`. Negative means stock left. */
  applied: number;
  /** Stock after the change. Never negative. */
  stockAfter: number;
  /** How much of the request could not be applied. */
  shortfall: number;
  /** True when the request was larger than the stock on hand. */
  short: boolean;
}

function nonNegative(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.trunc(n));
}

/**
 * Apply a signed stock change without ever producing negative stock.
 *
 * `delta` is the request; the return value says what actually happened. An
 * outbound request larger than what is on hand applies the remainder and
 * reports the difference, rather than failing or going below zero.
 */
export function applyStockDelta(stockBefore: number, delta: number): StockChange {
  const before = nonNegative(stockBefore);
  const requested = Math.trunc(Number(delta) || 0);

  if (requested >= 0) {
    return { applied: requested, stockAfter: before + requested, shortfall: 0, short: false };
  }

  const wanted = Math.abs(requested);
  const available = before;
  const taken = Math.min(wanted, available);
  return {
    // Normalised rather than `-taken`, which yields `-0` when nothing could be
    // taken and would store a negative zero in the ledger.
    applied: taken === 0 ? 0 : -taken,
    stockAfter: before - taken,
    shortfall: wanted - taken,
    short: taken < wanted,
  };
}

/**
 * Where a product stands.
 *
 * `untracked` means the clinic has not set a reorder level yet. It is reported
 * rather than guessed: inventing a default would either cry wolf on a
 * well-stocked line or hide a genuine shortage, and both are worse than an
 * honest "we do not know yet".
 */
export function classifyStock(tracking: StockTracking): StockLevel {
  const stock = nonNegative(tracking.stock);
  const threshold = tracking.reorderThreshold;

  if (stock <= 0) return "out";
  if (threshold === null || threshold === undefined) return "untracked";
  return stock <= nonNegative(threshold) ? "low" : "ok";
}

/**
 * How many units to reorder.
 *
 * Returns null when there is nothing sensible to say — either no threshold is
 * set or stock is already above the target. A number the clinic did not ask for
 * is worse than none.
 */
export function reorderQuantity(tracking: StockTracking): number | null {
  const threshold = tracking.reorderThreshold;
  const target = tracking.reorderTarget;
  if (threshold === null || threshold === undefined) return null;
  if (target === null || target === undefined) return null;

  const low = nonNegative(threshold);
  const high = nonNegative(target);
  const stock = nonNegative(tracking.stock);
  if (stock > low) return null;
  if (high <= low) return null;
  return high - stock;
}

export interface StockMovementDraft {
  kind: StockMovementKind;
  /** The related product's id. Stored as `product`, matching the schema's relation field. */
  product: string;
  productSlug: string;
  productName: string;
  /** Signed request, in units. Negative for stock leaving. */
  delta: number;
  stockBefore: number;
}

/**
 * Turn a request into a complete, storable movement row.
 *
 * `stockAfter` and `shortfall` are derived here rather than by the caller so
 * that no code path can write a movement whose arithmetic disagrees with the
 * product's actual stock.
 *
 * Field names match the schema exactly. An earlier version emitted `productId`
 * against a `product` field, which failed validation on every write — a
 * mismatch no unit test could see and only a real insert would surface.
 */
export function buildMovement(
  draft: StockMovementDraft,
  context: {
    orderId?: string;
    orderReference?: string;
    actorId?: string;
    actorName?: string;
    note?: string;
    dedupeKey?: string | null;
    at: Date;
  }
) {
  const change = applyStockDelta(draft.stockBefore, draft.delta);
  return {
    kind: draft.kind,
    product: draft.product,
    productSlug: draft.productSlug,
    productName: draft.productName,
    delta: draft.delta,
    applied: change.applied,
    shortfall: change.shortfall,
    short: change.short,
    stockBefore: nonNegative(draft.stockBefore),
    stockAfter: change.stockAfter,
    order: context.orderId,
    orderReference: context.orderReference,
    actor: context.actorId,
    actorName: context.actorName,
    note: context.note,
    dedupeKey: context.dedupeKey ?? null,
    createdAt: context.at,
  };
}

export interface InventoryRow {
  productId: string;
  slug: string;
  name: string;
  stock: number;
  level: StockLevel;
  reorderThreshold: number | null;
  reorderTarget: number | null;
  /** Units to order to reach the target, or null when nothing is needed or knowable. */
  reorderQuantity: number | null;
  /** True when the product has no reorder level set and needs one. */
  needsThreshold: boolean;
}

export function toInventoryRow(product: {
  _id: unknown;
  slug: string;
  name: string;
  stock: number;
  reorderThreshold?: number | null;
  reorderTarget?: number | null;
}): InventoryRow {
  const tracking: StockTracking = {
    stock: product.stock,
    reorderThreshold: product.reorderThreshold ?? null,
    reorderTarget: product.reorderTarget ?? null,
  };
  return {
    productId: String(product._id),
    slug: product.slug,
    name: product.name,
    stock: nonNegative(product.stock),
    level: classifyStock(tracking),
    reorderThreshold: tracking.reorderThreshold ?? null,
    reorderTarget: tracking.reorderTarget ?? null,
    reorderQuantity: reorderQuantity(tracking),
    needsThreshold: tracking.reorderThreshold === null || tracking.reorderThreshold === undefined,
  };
}

export interface InventoryView {
  rows: InventoryRow[];
  summary: {
    total: number;
    out: number;
    low: number;
    ok: number;
    untracked: number;
    needsThreshold: number;
  };
  /** One line for the dashboard. */
  headline: string;
}

/**
 * Order rows so the products that actually need attention come first.
 *
 * Out before low before untracked: a product at zero is a fact, a product below
 * its level is a judgement, and one with no level set is neither.
 */
const LEVEL_RANK: Record<StockLevel, number> = { out: 0, low: 1, untracked: 2, ok: 3 };

export function buildInventoryView(products: Parameters<typeof toInventoryRow>[0][]): InventoryView {
  const rows = products.map(toInventoryRow);

  rows.sort((a, b) => {
    const rank = LEVEL_RANK[a.level] - LEVEL_RANK[b.level];
    if (rank !== 0) return rank;
    // Within a band, the largest shortfall comes first.
    const aQty = a.reorderQuantity ?? -1;
    const bQty = b.reorderQuantity ?? -1;
    if (aQty !== bQty) return bQty - aQty;
    return a.name.localeCompare(b.name);
  });

  const summary = {
    total: rows.length,
    out: rows.filter((r) => r.level === "out").length,
    low: rows.filter((r) => r.level === "low").length,
    ok: rows.filter((r) => r.level === "ok").length,
    untracked: rows.filter((r) => r.level === "untracked").length,
    needsThreshold: rows.filter((r) => r.needsThreshold).length,
  };

  let headline = "Stock levels look fine.";
  if (summary.out > 0) {
    const noun = summary.out === 1 ? "product is" : "products are";
    headline = `${summary.out} ${noun} out of stock.`;
    if (summary.low > 0) headline += ` ${summary.low} below reorder level.`;
  } else if (summary.low > 0) {
    headline = `${summary.low} product${summary.low === 1 ? "" : "s"} below reorder level.`;
  }

  return { rows, summary, headline };
}