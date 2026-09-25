import { Schema, model, models, type Model } from "mongoose";
import type { IUser } from "@/lib/models/User";

export type TreatmentPlanStatus = "active" | "completed";

/**
 * Final review a clinician records when closing a treatment. Reaching the
 * expected end date never completes a plan automatically - the clinician
 * closes it after this review (maintenance, extension or completion).
 */
export interface ITreatmentCompletionReview {
  improvements?: string;
  resolved?: string;
  unresolvedProblems?: string;
  complications?: string;
  followUpLabs?: string;
  outcome: "maintenance" | "extended" | "completed" | "discontinued";
  notes?: string;
}

/** Daily monitoring rules a plan can require (e.g. diabetes glucose logging). */
export interface ITreatmentMonitoring {
  /** Require daily fasting + post-lunch glucose readings. */
  glucose: boolean;
  /** Fasting blood sugar window (24h "HH:mm"), default 6–10 AM. */
  fastingStart: string;
  fastingEnd: string;
  /** Post-lunch window, default 2–4 PM. */
  postLunchStart: string;
  postLunchEnd: string;
}

/**
 * A personalized treatment plan tracked on the patient portal: when it
 * started, when it ends, live phase, required daily monitoring, and the
 * clinician's end-of-treatment review. Admin creates these (e.g. a 3-month
 * or 6-month personalized program); patients see the dates, current month
 * and status on their dashboard.
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
  /** Clinician-driven lifecycle: plans stay "active" until closed. */
  status: TreatmentPlanStatus;
  completedAt?: Date;
  completionReview?: ITreatmentCompletionReview;
  monitoring?: ITreatmentMonitoring;
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
    status: { type: String, enum: ["active", "completed"], default: "active" },
    completedAt: { type: Date },
    completionReview: {
      type: new Schema<ITreatmentCompletionReview>(
        {
          improvements: { type: String, trim: true, maxlength: 4000 },
          resolved: { type: String, trim: true, maxlength: 4000 },
          unresolvedProblems: { type: String, trim: true, maxlength: 4000 },
          complications: { type: String, trim: true, maxlength: 4000 },
          followUpLabs: { type: String, trim: true, maxlength: 4000 },
          outcome: {
            type: String,
            enum: ["maintenance", "extended", "completed", "discontinued"],
            required: true,
          },
          notes: { type: String, trim: true, maxlength: 2000 },
        },
        { _id: false }
      ),
    },
    monitoring: {
      type: new Schema<ITreatmentMonitoring>(
        {
          glucose: { type: Boolean, default: false },
          fastingStart: { type: String, default: "06:00", trim: true },
          fastingEnd: { type: String, default: "10:00", trim: true },
          postLunchStart: { type: String, default: "14:00", trim: true },
          postLunchEnd: { type: String, default: "16:00", trim: true },
        },
        { _id: false }
      ),
    },
  },
  { timestamps: true }
);

TreatmentPlanSchema.index({ user: 1, startDate: -1 });

export type TreatmentPlanPhase = "active" | "expired" | "scheduled" | "completed";

/**
 * Derives the plan's live status:
 * - "completed" once the clinician closed the plan after the final review
 *   (the end date alone never marks a treatment complete)
 * - "scheduled" before the start date
 * - "active" while today is between start and end (inclusive)
 * - "expired" once the end date has passed but the plan has not been closed
 */
export function treatmentPlanPhase(
  plan: Pick<ITreatmentPlan, "startDate" | "endDate" | "status">,
  now: Date = new Date()
): TreatmentPlanPhase {
  if (plan.status === "completed") return "completed";
  // Normalize to local midnight so a plan is "active" for the whole of its
  // start/end calendar days regardless of the clock time they were stored at
  // (the admin form stores local noon, which skews raw-timestamp compares).
  const t = new Date(now);
  const start = new Date(plan.startDate);
  const end = new Date(plan.endDate);
  t.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
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

/** Whole months a plan spans, derived from its day count (3 mo ≈ 90 days). */
export function treatmentMonthsTotal(plan: Pick<ITreatmentPlan, "startDate" | "endDate">): number {
  return Math.max(1, Math.round(treatmentPlanDays(plan) / 30));
}

export interface TreatmentMonthInfo {
  /** Whole months the plan spans ("Y" in "Month X of Y"). */
  totalMonths: number;
  /** Current calendar month of treatment (1-based), or null when not active. */
  month: number | null;
  /** Day of treatment (1-based), or null when not started. */
  day: number | null;
  /** Days left until the end date (0 = last day). */
  daysLeft: number;
  /** Fraction of the period elapsed, 0..1 (used for progress bars). */
  elapsed: number;
}

/**
 * Computes the calendar position of "today" inside the plan's period:
 * which month of treatment we are in, day number, days remaining and the
 * elapsed fraction - the classic "Month 1 of 3" signal.
 */
export function treatmentMonthInfo(
  plan: Pick<ITreatmentPlan, "startDate" | "endDate" | "status">,
  now: Date = new Date()
): TreatmentMonthInfo {
  const totalDays = treatmentPlanDays(plan);
  const totalMonths = treatmentMonthsTotal(plan);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const start = new Date(plan.startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(plan.endDate);
  end.setHours(0, 0, 0, 0);

  const dayIndex = Math.floor((today.getTime() - start.getTime()) / 86_400_000); // 0-based
  const totalIndex = totalDays - 1;

  if (dayIndex < 0) {
    return { totalMonths, month: null, day: null, daysLeft: totalDays, elapsed: 0 };
  }
  const clamped = Math.min(dayIndex, totalIndex);
  const day = clamped + 1;
  const monthLength = totalDays / totalMonths;
  const month = Math.min(totalMonths, Math.floor(clamped / monthLength) + 1);
  const daysLeft = Math.max(0, totalIndex - dayIndex);
  const elapsed = Math.min(1, Math.max(0, (clamped + 1) / totalDays));
  return { totalMonths, month, day, daysLeft, elapsed };
}

export const TreatmentPlan: Model<ITreatmentPlan> =
  (models.TreatmentPlan as Model<ITreatmentPlan>) ||
  model<ITreatmentPlan>("TreatmentPlan", TreatmentPlanSchema);