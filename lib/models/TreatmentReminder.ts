import { Schema, model, models, type Model } from "mongoose";
import type { IUser } from "@/lib/models/User";
import type { ITreatmentPlan } from "@/lib/models/TreatmentPlan";

export type ReminderKind = "payment" | "refill" | "appointment" | "lab" | "monitoring" | "custom";

/**
 * Who is responsible for this row.
 *
 * This field is what makes the automation safe to re-run. The derivation engine
 * (`lib/plan-schedule.ts`) reconciles the schedule on every plan creation and
 * every date change, so it needs to be able to tell "the rules say this should be
 * here" from "a clinician typed this in". Without that distinction a re-run would
 * either duplicate everything or delete a clinician's work, and both are worse
 * than doing nothing.
 */
export type ReminderOrigin = "manual" | "derived";

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
  /** YYYY-MM-DD. When the patient should be reminded. */
  dueDate: string;
  /**
   * YYYY-MM-DD. When the thing itself happens.
   *
   * Different from `dueDate` by the rule's lead time, which is what makes a
   * reminder a reminder rather than a notification on the day. Optional because
   * manually-created reminders often have only one meaningful date.
   */
  eventDate?: string;
  /** Due amount in FCFA (installments / payments). */
  amountFcfa?: number;
  notes?: string;
  /**
   * `cancelled` means the obligation was withdrawn - almost always because a
   * plan was shortened and the derived reminder no longer has a rule behind it.
   * The row is kept rather than deleted so the patient history stays truthful
   * about what they were told, and it disappears from every task list because
   * those all filter on `pending`.
   */
  status: "pending" | "done" | "cancelled";
  /** Default `manual`: a row exists because someone typed it. */
  origin: ReminderOrigin;
  /**
   * Set by an admin edit on a derived row to say "leave this one alone".
   *
   * Explicit rather than inferred by diffing fields, because inference guesses
   * wrong: an admin who opens the title to fix a typo would silently hand the
   * row back to the engine on the next re-run.
   */
  pinned?: boolean;
  /**
   * Content-derived identity for derived rows, e.g. `plan:<id>:lab:2`.
   *
   * Unique and sparse, so re-running the derivation cannot create a duplicate
   * and rows without a key (all pre-existing manual reminders) are unaffected.
   */
  dedupeKey?: string | null;
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
    eventDate: {
      type: String,
      validate: { validator: (v: string) => DATE_RE.test(v), message: "Date must be YYYY-MM-DD." },
    },
    amountFcfa: { type: Number, min: 0, max: 100_000_000 },
    notes: { type: String, trim: true, maxlength: 1000 },
    status: { type: String, enum: ["pending", "done", "cancelled"], default: "pending" },
    origin: { type: String, enum: ["manual", "derived"], default: "manual" },
    pinned: { type: Boolean, default: false },
    dedupeKey: { type: String, trim: true },
  },
  { timestamps: true }
);

TreatmentReminderSchema.index({ user: 1, dueDate: 1 });
TreatmentReminderSchema.index({ plan: 1, dueDate: 1 });
// The guarantee that re-running the derivation is safe. A *partial* index rather
// than a sparse one, because sparse indexes still index an explicit `null` - and
// every manual reminder predating the engine would then collide with every other
// one. Restricting to documents where the key is actually a string excludes both
// missing and null.
TreatmentReminderSchema.index(
  { dedupeKey: 1 },
  {
    unique: true,
    partialFilterExpression: { dedupeKey: { $type: "string" } },
  }
);

export const TreatmentReminder: Model<ITreatmentReminder> =
  (models.TreatmentReminder as Model<ITreatmentReminder>) ||
  model<ITreatmentReminder>("TreatmentReminder", TreatmentReminderSchema);