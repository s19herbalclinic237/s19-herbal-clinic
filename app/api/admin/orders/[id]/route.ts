import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
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

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await adminGuard();
  if (denied) return denied;

  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid order id." }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) ?? {};
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Could not update the order." }, { status: 503 });
  }

  const existing = await Order.findById(id).lean();
  if (!existing) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const patch: Record<string, unknown> = {};

  if (body.status !== undefined) {
    if (!(ORDER_STATUSES as readonly string[]).includes(String(body.status))) {
      return NextResponse.json({ error: "Invalid order status." }, { status: 400 });
    }
    patch.status = body.status;
  }

  if (body.paymentStatus !== undefined) {
    const value = String(body.paymentStatus);
    if (value !== "Unpaid" && value !== "Paid") {
      return NextResponse.json({ error: "Invalid payment status." }, { status: 400 });
    }
    patch["payment.status"] = value;
  }

  if (body.paymentReference !== undefined) {
    patch["payment.reference"] = String(body.paymentReference).trim() || undefined;
  }

  try {
    const order = await Order.findByIdAndUpdate(id, { $set: patch }, { new: true }).lean();
    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error("[admin/orders] update failed:", error);
    return NextResponse.json({ error: "Could not update the order." }, { status: 500 });
  }
}