import { Schema, model, models, type Model } from "mongoose";
import type { IProduct } from "@/lib/models/Product";
import type { IOrder } from "@/lib/models/Order";
import type { IUser } from "@/lib/models/User";

/**
 * Why stock moved.
 *
 * - `order-reserve`  stock held for a placed order
 * - `order-release`  that hold returned, because the order was cancelled
 * - `restock`        new units arrived
 * - `adjustment`     a staff member set the count to a different number
 * - `correction`     a previous movement was undone
 */
export type StockMovementKind = "order-reserve" | "order-release" | "restock" | "adjustment" | "correction";

export interface IStockMovement {
  _id: string;
  product: string | IProduct;
  productSlug: string;
  productName: string;
  kind: StockMovementKind;
  /** Signed request in units. Negative means stock left. */
  delta: number;
  /** What actually moved. Differs from `delta` only on a short stock. */
  applied: number;
  /** `Math.abs(delta) - Math.abs(applied)`. */
  shortfall: number;
  /** True when the request exceeded stock on hand. */
  short: boolean;
  stockBefore: number;
  stockAfter: number;
  order?: string | IOrder;
  orderReference?: string;
  actor?: string | IUser;
  actorName?: string;
  note?: string;
  /**
   * Identity of a movement that must happen at most once, e.g.
   * `order:<id>:reserve`. Unique and partial-indexed, so a retried request
   * cannot reserve the same order's stock twice.
   */
  dedupeKey?: string | null;
  createdAt: Date;
}

/**
 * An append-only record of every change to a product's stock.
 *
 * `Product.stock` alone cannot answer "why is this number wrong" — it was a
 * field staff typed over by hand, so a mistake was invisible and permanent.
 * This makes the current number explainable and, more importantly, makes a
 * mistake correctable without guessing.
 *
 * Rows are never updated. A wrong movement is answered with a `correction`, so
 * the history stays a true record of what happened rather than of what is
 * currently believed.
 */
const StockMovementSchema = new Schema<IStockMovement>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    productSlug: { type: String, required: true, trim: true },
    productName: { type: String, required: true, trim: true },
    kind: {
      type: String,
      enum: ["order-reserve", "order-release", "restock", "adjustment", "correction"],
      required: true,
    },
    delta: { type: Number, required: true },
    applied: { type: Number, required: true },
    shortfall: { type: Number, default: 0, min: 0 },
    short: { type: Boolean, default: false },
    stockBefore: { type: Number, required: true, min: 0 },
    stockAfter: { type: Number, required: true, min: 0 },
    order: { type: Schema.Types.ObjectId, ref: "Order" },
    orderReference: { type: String, trim: true },
    actor: { type: Schema.Types.ObjectId, ref: "User" },
    actorName: { type: String, trim: true },
    note: { type: String, trim: true, maxlength: 500 },
    dedupeKey: { type: String, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

StockMovementSchema.index({ product: 1, createdAt: -1 });
StockMovementSchema.index({ order: 1, createdAt: -1 });
// Partial rather than sparse: a sparse index still stores an explicit `null`, and
// every manual adjustment without a key would then collide with every other one.
StockMovementSchema.index(
  { dedupeKey: 1 },
  {
    unique: true,
    partialFilterExpression: { dedupeKey: { $type: "string" } },
  }
);

export const StockMovement: Model<IStockMovement> =
  (models.StockMovement as Model<IStockMovement>) || model<IStockMovement>("StockMovement", StockMovementSchema);