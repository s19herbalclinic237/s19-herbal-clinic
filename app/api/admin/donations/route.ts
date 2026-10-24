import { NextResponse } from "next/server";
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
 * The admin donation log.
 *
 * `GET` returns the log plus the totals the brief asks for: patient assistance
 * and clinic development accounted for separately.
 *
 * `POST` creates a record. It exists so staff can type in a donation they have
 * just checked against the Mobile Money record - it is deliberately not a
 * public endpoint, so nothing a donor sends can enter the log on its own.
 */

const FUND_IDS = DONATION_FUNDS.map((f) => f.id) as DonationFundId[];
const METHOD_IDS = DONATION_PAYMENT_METHODS.map((m) => m.id) as DonationPaymentMethodId[];
const STATUS_IDS: DonationVerificationStatus[] = ["unverified", "pending", "verified", "rejected"];

/** How many rows the log itself returns. The totals below cover every record. */
const LIST_LIMIT = 500;

interface FundTotals {
  count: number;
  amount: number;
}

interface Summary {
  /** Every donation on record. */
  total: FundTotals;
  /** Per fund. This is the separation the brief requires. */
  byFund: Record<DonationFundId, FundTotals>;
  /** Per verification status. */
  byStatus: Record<DonationVerificationStatus, FundTotals>;
  /** Donations a staff member still has to check. */
  awaitingVerification: number;
  /** Donations verified but not yet acknowledged. */
  awaitingAcknowledgment: number;
}

/**
 * Builds the per-fund and per-status totals.
 *
 * The aggregation runs over the whole collection rather than over the rows
 * this request returns, so the totals stay correct once the log is longer than
 * `LIST_LIMIT` - which is exactly when a financial summary that silently
 * truncates would be most damaging.
 */
function buildSummary(rows: {
  _id: { fund: string; verificationStatus: string };
  count: number;
  amount: number;
}[]): Summary {
  const empty = (): FundTotals => ({ count: 0, amount: 0 });

  const total = empty();
  const byFund = Object.fromEntries(FUND_IDS.map((id) => [id, empty()])) as Record<
    DonationFundId,
    FundTotals
  >;
  const byStatus = Object.fromEntries(STATUS_IDS.map((id) => [id, empty()])) as Record<
    DonationVerificationStatus,
    FundTotals
  >;

  for (const row of rows) {
    total.count += row.count;
    total.amount += row.amount;

    const fund = row._id.fund as DonationFundId;
    if (byFund[fund]) {
      byFund[fund].count += row.count;
      byFund[fund].amount += row.amount;
    }

    const status = row._id.verificationStatus as DonationVerificationStatus;
    if (byStatus[status]) {
      byStatus[status].count += row.count;
      byStatus[status].amount += row.amount;
    }
  }

  return {
    total,
    byFund,
    byStatus,
    awaitingVerification: byStatus.unverified.count + byStatus.pending.count,
    awaitingAcknowledgment: byStatus.verified.count,
  };
}

export async function GET() {
  const denied = await adminGuard();
  if (denied) return denied;

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Donations are temporarily unavailable." }, { status: 503 });
  }

  try {
    const [donations, grouped] = await Promise.all([
      Donation.find().sort({ date: -1, createdAt: -1 }).limit(LIST_LIMIT).lean(),
      Donation.aggregate([
        {
          $group: {
            _id: { fund: "$fund", verificationStatus: "$verificationStatus" },
            count: { $sum: 1 },
            amount: { $sum: "$amount" },
          },
        },
      ]),
    ]);

    return NextResponse.json({ donations, summary: buildSummary(grouped) });
  } catch (error) {
    console.error("[admin/donations] list failed:", error);
    return NextResponse.json({ error: "Could not load donations." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await adminGuard();
  if (denied) return denied;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) ?? {};
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Could not record the donation." }, { status: 503 });
  }

  const date = body.date ? new Date(String(body.date)) : new Date();
  if (Number.isNaN(date.getTime())) {
    return NextResponse.json({ error: "Invalid donation date." }, { status: 400 });
  }

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Enter the amount received." }, { status: 400 });
  }

  const fund = String(body.fund ?? "") as DonationFundId;
  if (!FUND_IDS.includes(fund)) {
    return NextResponse.json({ error: "Choose a donation fund." }, { status: 400 });
  }

  const paymentMethod = String(body.paymentMethod ?? "mtn-momo") as DonationPaymentMethodId;
  if (!METHOD_IDS.includes(paymentMethod)) {
    return NextResponse.json({ error: "Choose a payment method." }, { status: 400 });
  }

  const transactionReference = String(body.transactionReference ?? "").trim();
  if (!transactionReference) {
    return NextResponse.json(
      { error: "Enter the transaction reference from the payment record." },
      { status: 400 }
    );
  }

  const verificationStatus = String(
    body.verificationStatus ?? "unverified"
  ) as DonationVerificationStatus;
  if (!STATUS_IDS.includes(verificationStatus)) {
    return NextResponse.json({ error: "Invalid verification status." }, { status: 400 });
  }

  const text = (value: unknown) => (value === undefined ? undefined : String(value).trim() || undefined);

  try {
    const donation = await Donation.create({
      date,
      amount,
      currency: "FCFA",
      paymentMethod,
      fund,
      transactionReference,
      verificationStatus,
      donorName: text(body.donorName),
      donorContact: text(body.donorContact),
      notes: text(body.notes),
    });
    return NextResponse.json({ success: true, donation }, { status: 201 });
  } catch (error) {
    console.error("[admin/donations] create failed:", error);
    return NextResponse.json({ error: "Could not record the donation." }, { status: 500 });
  }
}
