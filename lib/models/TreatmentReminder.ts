import { Schema, model, models, type Model } from "mongoose";
import type { IUser } from "@/lib/models/User";
import type { ITreatmentPlan } from "@/lib/models/TreatmentPlan";

export type ReminderKind = "payment" | "refill" | "appointment" | "lab" | "monitoring" | "custom";

/**
 * A dated task inside a treatment plan: an installment/payment due date, a
 * refill / renewal date, an appointment or follow-up call, a laboratory test,
 * or a daily monitoring requirement. Admin creates them; the patient sees
 * upcoming items as "today's tasks" and can mark them done; overdue items
 * surface in the clinic's alert feed.
 */
export interface ITreatmentReminder {
  _id: string;
  user: string | IUser;
  plan: string | ITreatmentPlan;
  /** Family member / companion the reminder applies to (name only). */
  forMember?: string;
  kind: ReminderKind;
  title: string;
  /** YYYY-MM-DD */
  dueDate: string;
  /** Due amount in FCFA (installments / payments). */
  amountFcfa?: number;
  notes?: string;
  status: "pending" | "done";
  createdAt: Date;
  updatedAt: Date;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const TreatmentReminderSchema = new Schema<ITreatmentReminder>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    plan: { type: Schema.Types.ObjectId, ref: "TreatmentPlan", required: true, index: true },
    forMember: { type: String, trim: true },
    kind: {
      type: String,
      enum: ["payment", "refill", "appointment", "lab", "monitoring", "custom"],
      default: "custom",
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    dueDate: {
      type: String,
      required: true,
      validate: { validator: (v: string) => DATE_RE.test(v), message: "Date must be YYYY-MM-DD." },
    },
    amountFcfa: { type: Number, min: 0, max: 100_000_000 },
    notes: { type: String, trim: true, maxlength: 1000 },
    status: { type: String, enum: ["pending", "done"], default: "pending" },
  },
  { timestamps: true }
);

TreatmentReminderSchema.index({ user: 1, dueDate: 1 });
TreatmentReminderSchema.index({ plan: 1, dueDate: 1 });

export const TreatmentReminder: Model<ITreatmentReminder> =
  (models.TreatmentReminder as Model<ITreatmentReminder>) ||
  model<ITreatmentReminder>("TreatmentReminder", TreatmentReminderSchema);