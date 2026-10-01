/**
 * Exerciser for the stock ledger, run against a throwaway database.
 *
 * Run with `npm run verify:stock`. This is the only way to test the properties
 * that matter and that neither typecheck nor a unit test can reach:
 *
 * - the atomic `$inc` actually holds under a repeated call
 * - the unique partial index really does reject a second reserve for one order
 * - the duplicate-key path undoes the duplicate change instead of doubling it
 * - an over-ordered line records a shortfall and never drives stock below zero
 * - the ledger reconciles back to the stored count
 *
 * It connects with a different `dbName`, so **production data is never touched**.
 * The scratch database is dropped on the way out, success or failure.
 */
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import mongoose from "mongoose";
import { Product } from "@/lib/models/Product";
import { Order } from "@/lib/models/Order";
import { StockMovement } from "@/lib/models/StockMovement";
import { reserveStockForOrder, releaseStockForOrder, recordStockChange, stockMovementHistory } from "@/lib/stock-db";

const SCRATCH_DB = "s19_stock_verify_scratch";

let passed = 0;
let failed = 0;

function check(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    passed += 1;
    console.log(`  PASS  ${label}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${label}`);
    console.log(`        expected ${JSON.stringify(expected)}`);
    console.log(`        actual   ${JSON.stringify(actual)}`);
  }
}

async function stockOf(slug: string): Promise<number> {
  const p = await Product.findOne({ slug }).lean();
  return p ? p.stock : -1;
}

async function main() {
  const url = process.env.MONGO_URL;
  if (!url) throw new Error("MONGO_URL is not set.");

  // The ledger module uses the *default* connection, so pointing a separate
  // connection at a scratch database would leave the real one in use and write
  // to production. The default connection is moved to the scratch database
  // instead, and the name is asserted before anything is written — if the
  // option is ever ignored, this aborts rather than touching live data.
  await mongoose.connect(url, { dbName: SCRATCH_DB });
  if (mongoose.connection.name !== SCRATCH_DB) {
    throw new Error(
      `Refusing to run: connected to "${mongoose.connection.name}", expected "${SCRATCH_DB}".`
    );
  }
  console.log(`Connected to scratch database "${SCRATCH_DB}".\n`);

  try {
    const product = await Product.create({
      name: "Verify Tonic",
      slug: "verify-tonic",
      category: "Test",
      categorySlug: "test",
      price: 1000,
      shortDescription: "Scratch product for ledger verification.",
      description: "Scratch product for ledger verification. Safe to delete.",
      image: "/x.jpg",
      stock: 10,
      reorderThreshold: 5,
      reorderTarget: 40,
    });

    const order = await Order.create({
      orderReference: "VERIFY-1",
      items: [{ productSlug: "verify-tonic", name: "Verify Tonic", price: 1000, quantity: 3 }],
      subtotal: 3000,
      shippingFee: 0,
      total: 3000,
      customer: { fullName: "Test", email: "t@example.com", phone: "600000000" },
      shipping: { mode: "Pickup", address: "-" },
      payment: { method: "Bank Transfer", status: "Unpaid" },
      status: "Pending",
    });

    const orderShape = {
      _id: String(order._id),
      orderReference: order.orderReference,
      items: order.items,
    };

    console.log("Reserving stock for a placed order");
    const firstReserve = await reserveStockForOrder(orderShape);
    check("stock falls by the ordered quantity", await stockOf("verify-tonic"), 7);
    check("the reserve is recorded in the ledger", firstReserve[0]?.recorded, true);

    console.log("\nReplaying the same order (a retried request)");
    const replayReserve = await reserveStockForOrder(orderShape);
    await reserveStockForOrder(orderShape);
    check("stock is unchanged by a replay", await stockOf("verify-tonic"), 7);
    check("the replay is recognised, not re-recorded", replayReserve[0]?.recorded, false);
    check(
      "exactly one reserve movement exists",
      await StockMovement.countDocuments({ kind: "order-reserve" }),
      1
    );

    console.log("\nReturning stock for a cancelled order");
    await releaseStockForOrder(orderShape);
    check("stock is restored", await stockOf("verify-tonic"), 10);

    console.log("\nReplaying the cancellation");
    await releaseStockForOrder(orderShape);
    await releaseStockForOrder(orderShape);
    check("stock is unchanged by a replay", await stockOf("verify-tonic"), 10);
    check(
      "exactly one release movement exists",
      await StockMovement.countDocuments({ kind: "order-release" }),
      1
    );

    console.log("\nOver-ordering more than is on hand");
    const bigOrder = await Order.create({
      orderReference: "VERIFY-2",
      items: [{ productSlug: "verify-tonic", name: "Verify Tonic", price: 1000, quantity: 25 }],
      subtotal: 25000,
      shippingFee: 0,
      total: 25000,
      customer: { fullName: "Test", email: "t@example.com", phone: "600000000" },
      shipping: { mode: "Pickup", address: "-" },
      payment: { method: "Bank Transfer", status: "Unpaid" },
      status: "Pending",
    });
    const results = await reserveStockForOrder({
      _id: String(bigOrder._id),
      orderReference: bigOrder.orderReference,
      items: bigOrder.items,
    });
    check("stock floors at zero rather than going negative", await stockOf("verify-tonic"), 0);
    check("the shortfall is reported", results[0]?.shortfall, 15);
    check("the movement is flagged short", results[0]?.short, true);
    check("applied equals what was available", results[0]?.applied, -10);

    console.log("\nRecording a restock");
    await recordStockChange({
      productId: String(product._id),
      kind: "restock",
      delta: 40,
      actor: { id: String(product._id), name: "Verify" },
      note: "Delivery arrived",
    });
    check("stock rises by the delivered quantity", await stockOf("verify-tonic"), 40);
    check(
      "the movement carries the actor",
      (await StockMovement.findOne({ kind: "restock" }).lean())?.actorName,
      "Verify"
    );

    console.log("\nRecounting to an absolute figure");
    await recordStockChange({
      productId: String(product._id),
      kind: "adjustment",
      to: 12,
    });
    check("stock becomes the recounted figure", await stockOf("verify-tonic"), 12);

    console.log("\nRecounting to the figure it already is");
    const noop = await recordStockChange({ productId: String(product._id), kind: "adjustment", to: 12 });
    check("nothing is written for a no-op recount", noop?.recorded, false);
    check("stock is unchanged", await stockOf("verify-tonic"), 12);

    console.log("\nLedger reconciliation");
    const history = await stockMovementHistory({ productId: String(product._id), limit: 500 });
    const oldest = history[history.length - 1];
    const net = history.reduce((n, m) => n + m.applied, 0);
    check(
      "the ledger reproduces the stored count",
      oldest.stockBefore + net,
      await stockOf("verify-tonic")
    );
    check(
      "every movement records its own arithmetic",
      history.every((m) => m.stockBefore + m.applied === m.stockAfter),
      true
    );

    console.log("\nOver-removing via a manual adjustment");
    const overdraw = await recordStockChange({
      productId: String(product._id),
      kind: "adjustment",
      delta: -999,
    });
    check("stock still floors at zero", await stockOf("verify-tonic"), 0);
    check("the overdraw is reported as short", overdraw?.short, true);

    console.log("\nA slug that matches no product");
    const ghost = await reserveStockForOrder({
      _id: String(bigOrder._id),
      orderReference: "VERIFY-GHOST",
      items: [{ productSlug: "does-not-exist", name: "Ghost", price: 1, quantity: 2 }],
    });
    check("is skipped rather than throwing", ghost.length, 0);
  } finally {
    await mongoose.connection.dropDatabase();
    console.log(`\nDropped scratch database "${SCRATCH_DB}".`);
    await mongoose.disconnect();
  }

  console.log(`\n${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});