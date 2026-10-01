import "server-only";
import { Product } from "@/lib/models/Product";
import { StockMovement, type StockMovementKind } from "@/lib/models/StockMovement";
import type { IOrder } from "@/lib/models/Order";
import { buildMovement } from "@/lib/stock";

/**
 * The write side of the stock ledger.
 *
 * Every function here is written so that running it twice is indistinguishable
 * from running it once. Order creation and status updates are the kind of thing
 * a client retries, a proxy replays, or a staff member double-clicks, and a
 * stock figure that silently halves on a retry is worse than one that is never
 * updated at all.
 */

function isDuplicateKey(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: number }).code === 11000;
}

export interface Actor {
  id?: string;
  name?: string;
}

export interface MovementResult {
  ok: boolean;
  /**
   * False when a movement with this dedupeKey already existed, so this call was
   * a replay and changed nothing.
   *
   * Named `recorded` rather than `applied` because `applied` already means "how
   * many units moved" on the movement row itself. The same word meaning a
   * boolean in one type and a signed count in the other produced a verification
   * assertion that compared `true` against `-10`.
   */
  recorded: boolean;
  productId: string;
  slug: string;
  stockBefore: number;
  stockAfter: number;
  /** Signed units that actually moved. */
  applied: number;
  shortfall: number;
  short: boolean;
}

/**
 * Apply one movement to one product, atomically and exactly once.
 *
 * Order of operations matters. The product's stock is incremented with a
 * conditional `$inc` first, which is a single atomic document update and cannot
 * interleave with another order. The ledger row is written second under a
 * unique key; if that row already exists the stock change is undone, because
 * that change was already recorded by an earlier attempt.
 *
 * A failure between the two steps leaves stock moved without a ledger row. That
 * is recoverable — the next `reconcileStock` rebuilds the truth from the
 * movements — whereas the alternative, writing the row first, would leave a
 * ledger claiming stock moved when it did not.
 */
async function applyMovement(input: {
  productId: string;
  productSlug: string;
  productName: string;
  kind: StockMovementKind;
  delta: number;
  orderId?: string;
  orderReference?: string;
  actor?: Actor;
  note?: string;
  dedupeKey?: string | null;
  now: Date;
}): Promise<MovementResult | null> {
  const {
    productId,
    productSlug,
    productName,
    kind,
    delta,
    orderId,
    orderReference,
    actor,
    note,
    dedupeKey,
    now,
  } = input;

  // A plain id filter, deliberately without a `stock: { $gte: 0 }` guard. That
  // guard looks protective but is a lost-update path: if a concurrent request
  // briefly left stock negative before clamping it, the whole reservation would
  // be skipped and silently vanish. Matching on the id alone means every item is
  // accounted for, and an over-draw is recorded as a shortfall instead.
  const before = await Product.findOneAndUpdate(
    { _id: productId },
    { $inc: { stock: delta } },
    { returnDocument: "before" }
  ).lean();

  if (!before) return null;

  // A movement can never drive stock below zero, so clamp what actually lands.
  const landed = Math.max(0, Math.trunc(before.stock + delta));
  if (landed !== before.stock + delta) {
    await Product.updateOne({ _id: productId }, { $set: { stock: landed } });
  }

  const movement = buildMovement(
    {
      kind,
      product: productId,
      productSlug,
      productName,
      delta,
      stockBefore: before.stock,
    },
    {
      orderId,
      orderReference,
      actorId: actor?.id,
      actorName: actor?.name,
      note,
      dedupeKey,
      at: now,
    }
  );

  try {
    await StockMovement.create(movement);
  } catch (error) {
    if (!isDuplicateKey(error)) throw error;
    // Already recorded by an earlier attempt: undo this duplicate change.
    await Product.updateOne({ _id: productId }, { $inc: { stock: -delta } });
    return {
      ok: true,
      recorded: false,
      applied: 0,
      productId,
      slug: productSlug,
      stockBefore: before.stock,
      stockAfter: before.stock,
      shortfall: 0,
      short: false,
    };
  }

  return {
    ok: true,
    recorded: true,
    applied: movement.applied,
    productId,
    slug: productSlug,
    stockBefore: movement.stockBefore,
    stockAfter: movement.stockAfter,
    shortfall: movement.shortfall,
    short: movement.short,
  };
}

/**
 * Hold stock for a placed order.
 *
 * Items carry a slug, not an id, because they arrive from the client's cart. The
 * product is therefore resolved server-side by slug — never trusting a
 * client-supplied id or price.
 *
 * A slug that matches no product is skipped rather than failing the order: the
 * shop sells herbs, and a discontinued line in someone's saved cart must not
 * block checkout.
 */
export async function reserveStockForOrder(
  order: Pick<IOrder, "_id" | "orderReference" | "items">,
  now: Date = new Date()
): Promise<MovementResult[]> {
  const slugs = [...new Set(order.items.map((i) => i.productSlug).filter(Boolean))];
  if (slugs.length === 0) return [];

  const products = await Product.find({ slug: { $in: slugs } }).lean();
  const bySlug = new Map(products.map((p) => [p.slug, p]));

  const results: MovementResult[] = [];

  for (const item of order.items) {
    const product = bySlug.get(item.productSlug);
    if (!product) continue;

    const quantity = Math.max(1, Math.trunc(Number(item.quantity) || 0));
    const result = await applyMovement({
      productId: String(product._id),
      productSlug: product.slug,
      productName: product.name,
      kind: "order-reserve",
      delta: -quantity,
      orderId: String(order._id),
      orderReference: order.orderReference,
      note: `Held for order ${order.orderReference}`,
      dedupeKey: `order:${String(order._id)}:reserve:${product.slug}`,
      now,
    });
    if (result) results.push(result);
  }

  return results;
}

/**
 * Return held stock when an order is cancelled.
 *
 * Keyed off the same per-order reserve key, so calling this twice is a no-op the
 * second time.
 */
export async function releaseStockForOrder(
  order: Pick<IOrder, "_id" | "orderReference" | "items">,
  now: Date = new Date()
): Promise<MovementResult[]> {
  const slugs = [...new Set(order.items.map((i) => i.productSlug).filter(Boolean))];
  if (slugs.length === 0) return [];

  const products = await Product.find({ slug: { $in: slugs } }).lean();
  const bySlug = new Map(products.map((p) => [p.slug, p]));

  const results: MovementResult[] = [];

  for (const item of order.items) {
    const product = bySlug.get(item.productSlug);
    if (!product) continue;

    const quantity = Math.max(1, Math.trunc(Number(item.quantity) || 0));
    const result = await applyMovement({
      productId: String(product._id),
      productSlug: product.slug,
      productName: product.name,
      kind: "order-release",
      delta: quantity,
      orderId: String(order._id),
      orderReference: order.orderReference,
      note: `Returned from cancelled order ${order.orderReference}`,
      dedupeKey: `order:${String(order._id)}:release:${product.slug}`,
      now,
    });
    if (result) results.push(result);
  }

  return results;
}

/**
 * Record a deliberate change to a product's stock.
 *
 * `restock` when units arrived, `adjustment` when someone recounted and found a
 * different number. Both write a ledger row, which is the whole point: the count
 * stops being an unexplained number someone typed.
 */
export async function recordStockChange(input: {
  productId: string;
  kind: "restock" | "adjustment" | "correction";
  /** New absolute count, or a signed delta for restock. */
  to?: number;
  delta?: number;
  actor?: Actor;
  note?: string;
  now?: Date;
}): Promise<MovementResult | null> {
  const now = input.now ?? new Date();
  const product = await Product.findById(input.productId).lean();
  if (!product) return null;

  let delta: number;
  if (input.to !== undefined) {
    const target = Math.max(0, Math.trunc(Number(input.to) || 0));
    delta = target - Math.max(0, product.stock);
  } else {
    delta = Math.trunc(Number(input.delta) || 0);
  }

  if (delta === 0) {
    return {
      ok: true,
      recorded: false,
      applied: 0,
      productId: String(product._id),
      slug: product.slug,
      stockBefore: product.stock,
      stockAfter: product.stock,
      shortfall: 0,
      short: false,
    };
  }

  return applyMovement({
    productId: String(product._id),
    productSlug: product.slug,
    productName: product.name,
    kind: input.kind,
    delta,
    actor: input.actor,
    note: input.note,
    // No dedupe key: two restocks of the same size are two real events.
    dedupeKey: null,
    now,
  });
}

export interface MovementHistoryEntry {
  id: string;
  kind: StockMovementKind;
  productId: string;
  productSlug: string;
  productName: string;
  delta: number;
  applied: number;
  shortfall: number;
  short: boolean;
  stockBefore: number;
  stockAfter: number;
  orderReference?: string;
  actorName?: string;
  note?: string;
  at: string;
}

export async function stockMovementHistory(
  filter: { productId?: string; limit?: number } = {}
): Promise<MovementHistoryEntry[]> {
  const query = filter.productId ? { product: filter.productId } : {};
  const rows = await StockMovement.find(query)
    .sort({ createdAt: -1, _id: -1 })
    .limit(Math.min(filter.limit ?? 100, 500))
    .lean();

  return rows.map((m) => ({
    id: String(m._id),
    kind: m.kind,
    productId: String(m.product),
    productSlug: m.productSlug,
    productName: m.productName,
    delta: m.delta,
    applied: m.applied,
    shortfall: m.shortfall,
    short: m.short,
    stockBefore: m.stockBefore,
    stockAfter: m.stockAfter,
    orderReference: m.orderReference,
    actorName: m.actorName,
    note: m.note,
    at: m.createdAt.toISOString(),
  }));
}