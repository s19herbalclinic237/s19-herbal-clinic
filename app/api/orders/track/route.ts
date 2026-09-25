import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { rateLimitRequest, rateLimitResponse } from "@/lib/rate-limit";

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

  const normalizedReference = reference.trim().toUpperCase();
  const normalizedEmail = email.trim().toLowerCase();
  const rateLimit = await rateLimitRequest(request, {
    scope: "order-track",
    limit: 20,
    windowMs: 15 * 60 * 1000,
    dimensions: [`reference:${normalizedReference}`, `email:${normalizedEmail}`],
  });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit);

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Tracking is temporarily unavailable." }, { status: 503 });
  }

  const order = await Order.findOne({
    orderReference: normalizedReference,
    "customer.email": normalizedEmail,
  }).lean();

  if (!order) {
    return NextResponse.json({ error: "No order matches that reference and email." }, { status: 404 });
  }

  return NextResponse.json({ orderReference: order.orderReference });
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}