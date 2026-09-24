import { Schema, model, models, type Model } from "mongoose";
import type { IUser } from "@/lib/models/User";

/**
 * A personalized treatment plan tracked on the patient portal: when it
 * started, when it ends, and a live ACTIVE / EXPIRED signal. Admin creates
 * these (e.g. a 3-month or 6-month personalized program); patients see the
 * dates and the current status on their dashboard.
 */
export interface ITreatmentPlan {
  _id: string;
  user: string | IUser;
  /** Family member / companion the plan is for (name only). */
  forMember?: string;
  /** e.g. "Diabetes & Metabolic Treatment Plan" */
  title: string;
  /** Optional program reference, e.g. "diabetes-metabolic". */
  program?: string;
  startDate: Date;
  endDate: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TreatmentPlanSchema = new Schema<ITreatmentPlan>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    forMember: { type: String, trim: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    program: { type: String, trim: true, maxlength: 200 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    notes: { type: String, trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

TreatmentPlanSchema.index({ user: 1, startDate: -1 });

export type TreatmentPlanPhase = "active" | "expired" | "scheduled";

/**
 * Derives the plan's live status from its dates:
 * - "scheduled" before the start date
 * - "active" while today is between start and end (inclusive)
 * - "expired" once the end date has passed
 */
export function treatmentPlanPhase(
  plan: Pick<ITreatmentPlan, "startDate" | "endDate">,
  now: Date = new Date()
): TreatmentPlanPhase {
  const start = new Date(plan.startDate).getTime();
  const end = new Date(plan.endDate).getTime();
  const t = now.getTime();
  if (t < start) return "scheduled";
  if (t > end) return "expired";
  return "active";
}

/** Whole days between the plan's start and end dates (inclusive). */
export function treatmentPlanDays(plan: Pick<ITreatmentPlan, "startDate" | "endDate">): number {
  const start = new Date(plan.startDate);
  const end = new Date(plan.endDate);
  const ms = end.getTime() - start.getTime();
  return Math.max(0, Math.round(ms / 86_400_000)) + 1;
}

export const TreatmentPlan: Model<ITreatmentPlan> =
  (models.TreatmentPlan as Model<ITreatmentPlan>) ||
  model<ITreatmentPlan>("TreatmentPlan", TreatmentPlanSchema);