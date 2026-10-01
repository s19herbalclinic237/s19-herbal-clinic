import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDb } from "@/lib/db";
import { adminGuard } from "@/lib/admin-guard";
import { getCurrentUser } from "@/lib/auth-server";
import { recordAppLog } from "@/lib/app-log";
import { Product } from "@/lib/models/Product";
import { recordStockChange, stockMovementHistory } from "@/lib/stock-db";

/**
 * Record stock arriving, or a correction to a count.
 *
 * Every change writes a ledger row. `to` sets an absolute count (used when
 * staff recount) and `delta` adds or removes units (used when a delivery
 * arrives). Exactly one is required — accepting both would make it ambiguous
 * which the caller meant.
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const denied = await adminGuard();
  if (denied) return denied;

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Inventory is temporarily unavailable." }, { status: 503 });
  }

  const { id } = await context.params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid product id." }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) ?? {};
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const hasTo = body.to !== undefined;
  const hasDelta = body.delta !== undefined;
  if (hasTo === hasDelta) {
    return NextResponse.json(
      { error: "Send either to (the new count) or delta (units added or removed), not both." },
      { status: 400 }
    );
  }

  const kind = body.kind === "restock" ? "restock" : body.kind === "correction" ? "correction" : "adjustment";

  const to = hasTo ? Number(body.to) : undefined;
  const delta = hasDelta ? Number(body.delta) : undefined;

  if (hasTo && (!Number.isFinite(to) || (to as number) < 0)) {
    return NextResponse.json({ error: "The new count must be zero or more." }, { status: 400 });
  }
  if (hasDelta && (!Number.isFinite(delta) || (delta as number) === 0)) {
    return NextResponse.json({ error: "Enter how many units to add or remove." }, { status: 400 });
  }

  const note = typeof body.note === "string" ? body.note.trim().slice(0, 500) : undefined;

  const product = await Product.findById(id).lean();
  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  // Refuse a change that would be silently clamped, so staff are told rather
  // than discovering a week later that the count they entered did not land.
  if (hasDelta) {
    const after = Math.max(0, Math.trunc(product.stock)) + Math.trunc(delta as number);
    if (after < 0) {
      return NextResponse.json(
        { error: `Only ${Math.max(0, Math.trunc(product.stock))} in stock, so ${Math.abs(Math.trunc(delta as number))} cannot be removed.` },
        { status: 400 }
      );
    }
  }

  const actor = await getCurrentUser();
  if (!actor) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  try {
    const result = await recordStockChange({
      productId: id,
      kind,
      to: hasTo ? Math.trunc(to as number) : undefined,
      delta: hasDelta ? Math.trunc(delta as number) : undefined,
      actor: { id: actor.id, name: actor.name },
      note,
    });

    if (!result) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    if (!result.recorded) {
      return NextResponse.json(
        { error: "That is already the recorded count. Nothing was changed." },
        { status: 400 }
      );
    }

    await recordAppLog({
      scope: "admin.inventory",
      level: "info",
      message: `stock ${kind}`,
      context: JSON.stringify({ productId: id, slug: result.slug, actor: actor.id, note: note ?? null }),
    });

    return NextResponse.json({
      success: true,
      stock: result.stockAfter,
      previous: result.stockBefore,
    });
  } catch (error) {
    console.error("[admin inventory] change failed:", error);
    return NextResponse.json({ error: "Could not record that stock change." }, { status: 500 });
  }
}

/** The movement history for one product, newest first. */
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const denied = await adminGuard();
  if (denied) return denied;

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Inventory is temporarily unavailable." }, { status: 503 });
  }

  const { id } = await context.params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid product id." }, { status: 400 });
  }

  try {
    const url = new URL(request.url);
    const movements = await stockMovementHistory({
      productId: id,
      limit: Number(url.searchParams.get("limit")) || 50,
    });

    const product = await Product.findById(id).select("name slug stock").lean();
    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    // Reconcile the ledger against the stored count.
    //
    // The ledger only covers movements since tracking began — every product
    // predates it — so the absolute sum of movements is meaningless on its own.
    // Reconciling from the oldest movement's `stockBefore` instead answers the
    // question that matters: does the number on the product still follow from
    // what was recorded? A mismatch means a movement was lost, which is the one
    // failure mode a ledger exists to catch.
    const oldest = movements.length > 0 ? movements[movements.length - 1] : undefined;
    const baseline = oldest?.stockBefore ?? null;
    const net = movements.reduce((n, m) => n + m.applied, 0);
    const reconstructed = baseline === null ? null : baseline + net;

    return NextResponse.json({
      product: { id: String(product._id), name: product.name, slug: product.slug, stock: product.stock },
      movements,
      reconciliation:
        reconstructed === null
          ? { tracked: false }
          : {
              tracked: true,
              trackedSince: oldest?.at ?? null,
              baseline,
              net,
              reconstructed,
              stored: product.stock,
              matches: reconstructed === product.stock,
            },
    });
  } catch (error) {
    console.error("[admin inventory] history failed:", error);
    return NextResponse.json({ error: "Could not load stock history." }, { status: 500 });
  }
}