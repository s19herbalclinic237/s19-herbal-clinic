import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { adminGuard } from "@/lib/admin-guard";
import { Product } from "@/lib/models/Product";
import { buildInventoryView } from "@/lib/stock";
import { stockMovementHistory } from "@/lib/stock-db";

/**
 * Stock levels, what needs reordering, and why each number is what it is.
 *
 * Reports every product rather than only the ones with a reorder level set,
 * because the clinic has no levels yet and "which lines are you actually
 * tracking?" is the first question this page has to answer.
 */
export async function GET(request: Request) {
  const denied = await adminGuard();
  if (denied) return denied;

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Inventory is temporarily unavailable." }, { status: 503 });
  }

  const url = new URL(request.url);
  const productId = url.searchParams.get("product") || undefined;
  const includeHistory = url.searchParams.get("history") === "1";
  const includeInactive = url.searchParams.get("includeInactive") === "1";

  try {
    const products = await Product.find(includeInactive ? {} : { active: true })
      .select("name slug stock reorderThreshold reorderTarget active")
      .sort({ name: 1 })
      .lean();

    const view = buildInventoryView(
      products.map((p) => ({
        _id: p._id,
        slug: p.slug,
        name: p.name,
        stock: p.stock,
        reorderThreshold: p.reorderThreshold ?? null,
        reorderTarget: p.reorderTarget ?? null,
      }))
    );

    const payload: Record<string, unknown> = {
      headline: view.headline,
      summary: view.summary,
      products: view.rows,
    };

    if (includeHistory) {
      payload.movements = await stockMovementHistory({
        productId,
        limit: Number(url.searchParams.get("limit")) || 100,
      });
    }

    return NextResponse.json(payload);
  } catch (error) {
    console.error("[admin inventory] failed:", error);
    return NextResponse.json({ error: "Could not load inventory." }, { status: 500 });
  }
}