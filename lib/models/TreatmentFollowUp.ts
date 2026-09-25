import { Schema, model, models, type Model } from "mongoose";
import type { IUser } from "@/lib/models/User";
import type { ITreatmentPlan } from "@/lib/models/TreatmentPlan";

export type FollowUpMilestone = "baseline" | "monthly" | "final" | "other";

export interface IFollowUpVitals {
  weightKg?: number;
  systolicBp?: number;
  diastolicBp?: number;
  glucoseMgdl?: number;
}

/**
 * A dated progress record inside a treatment plan. Every follow-up appends a
 * new document (never overwrites), so the patient portal can render the full
 * history: Baseline → Month 1 → Month 2 → Month 3 → Final assessment.
 */
export interface ITreatmentFollowUp {
  _id: string;
  user: string | IUser;
  plan: string | ITreatmentPlan;
  /** Family member / companion the follow-up belongs to (name only). */
  forMember?: string;
  /** Baseline, monthly check-in, final assessment or custom. */
  milestone: FollowUpMilestone;
  /** Free milestone label when milestone is "other" (e.g. "Week 6 review"). */
  milestoneLabel?: string;
  date: Date;
  /** Narrative of improvements recorded at this follow-up. */
  improvements?: string;
  resolvedSymptoms: string[];
  improvedSymptoms: string[];
  persistentSymptoms: string[];
  newSymptoms: string[];
  adverseReactions: string[];
  vitals: IFollowUpVitals;
  /** Follow-up laboratory results (HbA1c, lipids, ...). */
  followUpLabs?: string;
  clinicianNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StringList = { type: [String], default: [] };

const TreatmentFollowUpSchema = new Schema<ITreatmentFollowUp>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    plan: { type: Schema.Types.ObjectId, ref: "TreatmentPlan", required: true, index: true },
    forMember: { type: String, trim: true },
    milestone: {
      type: String,
      enum: ["baseline", "monthly", "final", "other"],
      default: "monthly",
    },
    milestoneLabel: { type: String, trim: true, maxlength: 120 },
    date: { type: Date, required: true },
    improvements: { type: String, trim: true, maxlength: 4000 },
    resolvedSymptoms: StringList,
    improvedSymptoms: StringList,
    persistentSymptoms: StringList,
    newSymptoms: StringList,
    adverseReactions: StringList,
    vitals: {
      type: new Schema<IFollowUpVitals>(
        {
          weightKg: { type: Number, min: 0, max: 500 },
          systolicBp: { type: Number, min: 30, max: 300 },
          diastolicBp: { type: Number, min: 30, max: 200 },
          glucoseMgdl: { type: Number, min: 10, max: 900 },
        },
        { _id: false }
      ),
    },
    followUpLabs: { type: String, trim: true, maxlength: 4000 },
    clinicianNotes: { type: String, trim: true, maxlength: 4000 },
  },
  { timestamps: true }
);

TreatmentFollowUpSchema.index({ plan: 1, date: 1 });
TreatmentFollowUpSchema.index({ user: 1, date: -1 });

/** Converts a comma/line separated list into trimmed, de-duplicated entries. */
export function parseSymptomsList(input: unknown): string[] {
  const parts: unknown[] = Array.isArray(input)
    ? input
    : String(input ?? "").trim().split(/[\n,;]+/);
  return Array.from(
    new Set(
      parts
        .map((x) => String(x).trim())
        .filter((x) => x.length > 0)
        .slice(0, 60)
    )
  );
}

export const TreatmentFollowUp: Model<ITreatmentFollowUp> =
  (models.TreatmentFollowUp as Model<ITreatmentFollowUp>) ||
  model<ITreatmentFollowUp>("TreatmentFollowUp", TreatmentFollowUpSchema);