import { Schema, model, models, type Model } from "mongoose";
import type { DonationFundId, DonationPaymentMethodId } from "@/lib/data/donation-funds";

/**
 * The donation log: one record per donation received by S19-CARE.
 *
 * ## Why staff create these records, and donors do not
 *
 * The brief is explicit: "Staff must verify actual payment records:
 * screenshots alone are not proof." A record therefore only ever enters the
 * log through a staff member who has checked the Mobile Money (or bank)
 * statement - never from a public form and never from an uploaded screenshot.
 * If the public page could file a donation, the log would be a list of claims
 * rather than a list of verified payments, and every total computed from it
 * would be wrong.
 *
 * ## Why the fund is a required field
 *
 * The brief asks for patient assistance and clinic development to be
 * "accounted separately", and asks the clinic to "state transparently when
 * donations benefit the private clinic". That only works if every record
 * carries the purpose the donor chose. So `fund` is required: a donation
 * cannot be filed without saying what it was for.
 *
 * ## Why donor details exist at all
 *
 * Staff need to know who to thank and who to query when a payment cannot be
 * matched. They are stored, never published, and masked by default in the
 * admin log - see `components/admin/donations-tab.tsx`.
 *
 * ## Why there is no delete route
 *
 * A donation is a financial record. Removing one would leave the log's totals
 * and its audit trail disagreeing with the clinic's actual bank and Mobile
 * Money statements. Entries are corrected by editing them, so the history of
 * what was recorded and when stays intact.
 */

/**
 * How far a donation has been through verification.
 *
 * - `unverified` - recorded, not yet checked against the payment record.
 * - `pending`    - a staff member is checking the payment record now.
 * - `verified`   - the payment record was found and matches.
 * - `rejected`   - the payment record does not match, or was never received.
 */
export type DonationVerificationStatus = "unverified" | "pending" | "verified" | "rejected";

export interface IDonation {
  _id: string;
  /** The date the donation was made. Not the date staff typed it in. */
  date: Date;
  /** Amount in FCFA. The clinic's only currency. */
  amount: number;
  currency: string;
  /** How the money was sent. */
  paymentMethod: DonationPaymentMethodId;
  /** The purpose the donor chose. Required - see the note above. */
  fund: DonationFundId;
  /**
   * The transaction reference from the payment record (Mobile Money ID, bank
   * reference, receipt number). Required, because a donation that cannot be
   * matched to a transaction is not verified.
   */
  transactionReference: string;
  /** How far verification has got. */
  verificationStatus: DonationVerificationStatus;
  /** When the acknowledgment was sent, if it has been. */
  acknowledgedAt?: Date;
  /** The free-text acknowledgment sent to the donor. */
  acknowledgment?: string;
  /**
   * The donor's name. Confidential: never published, masked by default in the
   * admin log.
   */
  donorName?: string;
  /**
   * The donor's WhatsApp number or email. Confidential, same rules as the
   * name.
   */
  donorContact?: string;
  /** Staff notes: what was checked, what is still outstanding. */
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DonationSchema = new Schema<IDonation>(
  {
    date: { type: Date, required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "FCFA", trim: true, uppercase: true },
    paymentMethod: {
      type: String,
      enum: ["mtn-momo", "orange-momo", "cash-app", "zelle", "paypal", "bank-transfer"],
      required: true,
      default: "mtn-momo",
    },
    fund: {
      type: String,
      enum: ["patient-assistance", "clinic-development", "general"],
      required: true,
    },
    transactionReference: { type: String, required: true, trim: true, maxlength: 120 },
    verificationStatus: {
      type: String,
      enum: ["unverified", "pending", "verified", "rejected"],
      default: "unverified",
    },
    acknowledgedAt: { type: Date },
    acknowledgment: { type: String, trim: true, maxlength: 1000 },
    donorName: { type: String, trim: true, maxlength: 160 },
    donorContact: { type: String, trim: true, maxlength: 160 },
    notes: { type: String, trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

// The log is read newest-first and filtered by fund when the clinic separates
// patient assistance from clinic development.
DonationSchema.index({ date: -1 });
DonationSchema.index({ fund: 1, date: -1 });
DonationSchema.index({ verificationStatus: 1, date: -1 });

export const Donation: Model<IDonation> =
  (models.Donation as Model<IDonation>) || model<IDonation>("Donation", DonationSchema);
