import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { Order } from "@/lib/models/Order";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const { reference, email } = (body ?? {}) as { reference?: string; email?: string };
  if (!reference?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "Reference and email are required." }, { status: 400 });
  }

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Tracking is temporarily unavailable." }, { status: 503 });
  }

  const order = await Order.findOne({
    orderReference: reference.trim().toUpperCase(),
    "customer.email": { $regex: `^${escapeRegex(email.trim().toLowerCase())}$`, $options: "i" },
  }).lean();

  if (!order) {
    return NextResponse.json({ error: "No order matches that reference and email." }, { status: 404 });
  }

  return NextResponse.json({ orderReference: order.orderReference });
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}