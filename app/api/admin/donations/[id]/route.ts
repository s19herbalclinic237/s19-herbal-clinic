import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDb } from "@/lib/db";
import { adminGuard } from "@/lib/admin-guard";
import { Donation, type DonationVerificationStatus } from "@/lib/models/Donation";
import {
  DONATION_FUNDS,
  DONATION_PAYMENT_METHODS,
  type DonationFundId,
  type DonationPaymentMethodId,
} from "@/lib/data/donation-funds";

/**
 * Update one donation record.
 *
 * The fields staff change are the ones the brief lists for the log: the
 * verification status, the acknowledgment, and the notes recording what was
 * checked. The donor details can be corrected too - they are confidential,
 * but they still have to be right, and a mistyped WhatsApp number is a donor
 * we cannot reach.
 *
 * There is no `DELETE` handler on purpose. A donation is a financial record:
 * deleting one would leave the log's totals disagreeing with the clinic's
 * Mobile Money and bank statements, and would erase the trail of what was
 * recorded and when. A wrong entry is corrected, not removed.
 */

const FUND_IDS = DONATION_FUNDS.map((f) => f.id) as DonationFundId[];
const METHOD_IDS = DONATION_PAYMENT_METHODS.map((m) => m.id) as DonationPaymentMethodId[];
const STATUS_IDS: DonationVerificationStatus[] = ["unverified", "pending", "verified", "rejected"];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await adminGuard();
  if (denied) return denied;

  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid donation id." }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) ?? {};
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Could not update the donation." }, { status: 503 });
  }

  const existing = await Donation.findById(id).lean();
  if (!existing) {
    return NextResponse.json({ error: "Donation not found." }, { status: 404 });
  }

  const patch: Record<string, unknown> = {};

  if (body.verificationStatus !== undefined) {
    const value = String(body.verificationStatus) as DonationVerificationStatus;
    if (!STATUS_IDS.includes(value)) {
      return NextResponse.json({ error: "Invalid verification status." }, { status: 400 });
    }
    patch.verificationStatus = value;
  }

  if (body.fund !== undefined) {
    const value = String(body.fund) as DonationFundId;
    if (!FUND_IDS.includes(value)) {
      return NextResponse.json({ error: "Invalid donation fund." }, { status: 400 });
    }
    patch.fund = value;
  }

  if (body.paymentMethod !== undefined) {
    const value = String(body.paymentMethod) as DonationPaymentMethodId;
    if (!METHOD_IDS.includes(value)) {
      return NextResponse.json({ error: "Invalid payment method." }, { status: 400 });
    }
    patch.paymentMethod = value;
  }

  if (body.amount !== undefined) {
    const value = Number(body.amount);
    if (!Number.isFinite(value) || value <= 0) {
      return NextResponse.json({ error: "Invalid amount." }, { status: 400 });
    }
    patch.amount = value;
  }

  if (body.date !== undefined) {
    const value = new Date(String(body.date));
    if (Number.isNaN(value.getTime())) {
      return NextResponse.json({ error: "Invalid donation date." }, { status: 400 });
    }
    patch.date = value;
  }

  if (body.transactionReference !== undefined) {
    const value = String(body.transactionReference).trim();
    if (!value) {
      return NextResponse.json(
        { error: "The transaction reference cannot be empty." },
        { status: 400 }
      );
    }
    patch.transactionReference = value;
  }

  if (body.acknowledgment !== undefined) {
    patch.acknowledgment = String(body.acknowledgment).trim() || undefined;
  }

  if (body.notes !== undefined) {
    patch.notes = String(body.notes).trim() || undefined;
  }

  if (body.donorName !== undefined) {
    patch.donorName = String(body.donorName).trim() || undefined;
  }

  if (body.donorContact !== undefined) {
    patch.donorContact = String(body.donorContact).trim() || undefined;
  }

  /**
   * The acknowledgment is a flag with a timestamp, because "we have thanked
   * this donor" and "we have not" are different facts and the log has to be
   * able to answer "which verified donations are still unacknowledged?".
   */
  if (body.acknowledged !== undefined) {
    patch.acknowledgedAt = body.acknowledged ? new Date() : undefined;
  }

  try {
    const donation = await Donation.findByIdAndUpdate(id, { $set: patch }, { new: true }).lean();
    return NextResponse.json({ success: true, donation });
  } catch (error) {
    console.error("[admin/donations] update failed:", error);
    return NextResponse.json({ error: "Could not update the donation." }, { status: 500 });
  }
}
