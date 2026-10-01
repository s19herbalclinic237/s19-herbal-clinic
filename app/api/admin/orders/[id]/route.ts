import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDb } from "@/lib/db";
import { adminGuard } from "@/lib/admin-guard";
import { Order, type OrderStatus } from "@/lib/models/Order";
import { User } from "@/lib/models/User";
import { sendOrderStatusEmails } from "@/lib/email";
import { releaseStockForOrder } from "@/lib/stock-db";
import { notifyPatientWhatsApp, whatsappFirstName } from "@/lib/whatsapp";

const ORDER_STATUSES = [
  "Pending",
  "Processing",
  "Ready for Pickup",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
] as const;

/**
 * Short, patient-facing status label for the WhatsApp `order_status` template.
 * The English wording mirrors the status string lib/email.ts shows the customer
 * ("Current status"). No French status map exists in the email module, so the
 * French column is maintained here. Every value of OrderStatus is covered.
 */
const ORDER_STATUS_LABEL: Record<OrderStatus, { en: string; fr: string }> = {
  Pending: { en: "Pending", fr: "En attente" },
  Processing: { en: "Processing", fr: "En préparation" },
  "Ready for Pickup": { en: "Ready for pickup", fr: "Prête pour le retrait" },
  "Out for Delivery": { en: "Out for delivery", fr: "En cours de livraison" },
  Delivered: { en: "Delivered", fr: "Livrée" },
  Cancelled: { en: "Cancelled", fr: "Annulée" },
};

function orderStatusLabel(status: string | undefined, language: "en" | "fr"): string {
  const known = (ORDER_STATUSES as readonly string[]).includes(String(status))
    ? ORDER_STATUS_LABEL[status as OrderStatus]
    : undefined;
  // Unknown future status: fall back to the stored value rather than dropping
  // the notification, so the patient at least sees what the clinic recorded.
  return (known ? known[language] : String(status ?? "").trim()) || (language === "fr" ? "En cours" : "In progress");
}

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

    // Cancelling gives the held stock back. Keyed off the order, so a repeated
    // cancellation is a no-op rather than a second return. Never awaited into
    // the response: the order status change has already succeeded, and failing
    // to adjust inventory must not undo it.
    if (order && existing.status !== "Cancelled" && order.status === "Cancelled") {
      try {
        await releaseStockForOrder({
          _id: String(order._id),
          orderReference: order.orderReference,
          items: order.items,
        });
      } catch (error) {
        console.error("[admin/orders] stock release failed:", error);
      }
    }

    // Email the customer when the order status actually changes.
    if (order && body.status !== undefined && order.status !== existing.status) {
      try {
        await sendOrderStatusEmails(order, existing.status);
      } catch (error) {
        console.error("[admin/orders] status email failed:", error);
      }

      // Same trigger, separate channel. Opt-in, phone and language live on the
      // User document, which is not populated on the order, so load the three
      // fields the send actually reads. Never awaited: a WhatsApp failure must
      // not change this response.
      void (async () => {
        try {
          const userId = typeof order.user === "string" ? order.user : order.user?._id;
          const user = userId
            ? await User.findById(userId)
                .select("name phoneSearch whatsappOptIn preferredLanguage")
                .lean()
            : null;
          if (!user) return;
          const language = user.preferredLanguage === "fr" ? "fr" : "en";
          await notifyPatientWhatsApp(
            {
              phoneSearch: user.phoneSearch,
              phone: order.customer.phone,
              whatsappOptIn: user.whatsappOptIn,
              preferredLanguage: user.preferredLanguage,
            },
            {
              template: "order_status",
              params: [
                whatsappFirstName(user.name || order.customer.fullName),
                order.orderReference,
                orderStatusLabel(order.status, language),
              ],
            }
          );
        } catch (error) {
          console.error("[admin/orders] status whatsapp failed:", error);
        }
      })();
    }

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error("[admin/orders] update failed:", error);
    return NextResponse.json({ error: "Could not update the order." }, { status: 500 });
  }
}