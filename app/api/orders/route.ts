import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { Order, type IOrder } from "@/lib/models/Order";
import { sendOrderConfirmation } from "@/lib/email";
import { generateOrderReference } from "@/lib/utils";
import type { CartItem } from "@/lib/cart-context";

const validModes = ["Pickup", "Cameroon Delivery", "Worldwide Delivery"];
const validPayments = ["MTN Mobile Money", "Orange Money", "Bank Transfer", "Pay on Pickup or Delivery"];

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const payload = body as {
    items?: CartItem[];
    customer?: { fullName?: string; email?: string; phone?: string };
    shipping?: { mode?: string; city?: string; address?: string; notes?: string };
    payment?: { method?: string };
    fee?: number;
  };

  if (!payload.items?.length) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  }
  const customer = payload.customer;
  if (!customer?.fullName?.trim() || !customer?.email?.trim() || !customer?.phone?.trim()) {
    return NextResponse.json({ error: "Name, email, and phone are required." }, { status: 400 });
  }
  if (!payload.shipping?.mode || !validModes.includes(payload.shipping.mode)) {
    return NextResponse.json({ error: "Select a valid delivery mode." }, { status: 400 });
  }
  const mode = payload.shipping.mode as IOrder["shipping"]["mode"];
  if (mode !== "Pickup" && !payload.shipping.address?.trim()) {
    return NextResponse.json({ error: "Enter a delivery address." }, { status: 400 });
  }
  if (!payload.payment?.method || !validPayments.includes(payload.payment.method)) {
    return NextResponse.json({ error: "Select a valid payment method." }, { status: 400 });
  }

  const subtotal = payload.items.reduce((n, i) => n + i.price * i.quantity, 0);
  const fee = Math.max(0, Number(payload.fee) || 0);

  const orderReference = generateOrderReference();
  const orderData: Omit<IOrder, "_id" | "createdAt"> = {
    orderReference,
    items: payload.items.map((i) => ({
      productSlug: i.slug,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      image: i.image,
    })),
    subtotal,
    shippingFee: fee,
    total: subtotal + fee,
    customer: {
      fullName: customer.fullName.trim(),
      email: customer.email.trim().toLowerCase(),
      phone: customer.phone.trim(),
    },
    shipping: {
      mode,
      city: payload.shipping.city?.trim(),
      address: (payload.shipping.address || "").trim(),
      notes: payload.shipping.notes?.trim(),
    },
    payment: { method: payload.payment.method, status: "Unpaid" },
    status: "Pending",
  };

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json(
      { error: "Our ordering service is temporarily unavailable. Please order via WhatsApp." },
      { status: 503 }
    );
  }

  try {
    const order = await Order.create(orderData);
    sendOrderConfirmation(order.toObject() as unknown as IOrder).catch(() => {});
    return NextResponse.json({ orderReference: order.orderReference }, { status: 201 });
  } catch (error) {
    console.error("[orders] create failed:", error);
    return NextResponse.json({ error: "Could not save your order. Please try again." }, { status: 500 });
  }
}