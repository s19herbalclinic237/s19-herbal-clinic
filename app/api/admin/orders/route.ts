import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { adminGuard } from "@/lib/admin-guard";
import { Order } from "@/lib/models/Order";

const ORDER_STATUSES = [
  "Pending",
  "Processing",
  "Ready for Pickup",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
] as const;

export async function GET(request: Request) {
  const denied = await adminGuard();
  if (denied) return denied;

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Orders are temporarily unavailable." }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  try {
    const filter: Record<string, unknown> = {};
    if (status && status !== "All" && (ORDER_STATUSES as readonly string[]).includes(status)) {
      filter.status = status;
    }
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .limit(300)
      .populate("user", "name email phone")
      .lean();
    return NextResponse.json({ orders });
  } catch (error) {
    console.error("[admin/orders] list failed:", error);
    return NextResponse.json({ error: "Could not load orders." }, { status: 500 });
  }
}