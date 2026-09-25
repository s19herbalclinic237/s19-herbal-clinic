import { Schema, model, models, type Model } from "mongoose";
import type { IUser } from "@/lib/models/User";
import type { ITreatmentPlan } from "@/lib/models/TreatmentPlan";

export type GlucoseKind = "fasting" | "post-lunch";

/**
 * A single glucose reading a patient submits from home (fasting 6–10 AM or
 * 2h post-lunch) as part of diabetes monitoring. The reading, meal info and
 * (optionally) a photo of the glucose-meter result are stored; the clinic
 * sees concerning values flagged in the admin dashboard.
 */
export interface IGlucoseReading {
  _id: string;
  user: string | IUser;
  plan: string | ITreatmentPlan;
  /** Family member / companion the reading belongs to (name only). */
  forMember?: string;
  kind: GlucoseKind;
  /** Blood glucose in mg/dL. */
  reading: number;
  /** What the patient ate (post-lunch readings). */
  mealInfo?: string;
  photoUrl?: string;
  photoPublicId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const GlucoseReadingSchema = new Schema<IGlucoseReading>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    plan: { type: Schema.Types.ObjectId, ref: "TreatmentPlan", required: true, index: true },
    forMember: { type: String, trim: true },
    kind: { type: String, enum: ["fasting", "post-lunch"], required: true },
    reading: { type: Number, required: true, min: 10, max: 900 },
    mealInfo: { type: String, trim: true, maxlength: 500 },
    photoUrl: { type: String, trim: true },
    photoPublicId: { type: String, trim: true },
    notes: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

GlucoseReadingSchema.index({ user: 1, createdAt: -1 });
GlucoseReadingSchema.index({ plan: 1, createdAt: -1 });

/**
 * Flags a reading the clinic should look at: fasting ≥ 126 mg/dL or 2h
 * post-lunch ≥ 200 mg/dL match diagnostic diabetes thresholds.
 */
export function isGlucoseConcerning(r: Pick<IGlucoseReading, "kind" | "reading">): boolean {
  return r.kind === "fasting" ? r.reading >= 126 : r.reading >= 200;
}

export const GlucoseReading: Model<IGlucoseReading> =
  (models.GlucoseReading as Model<IGlucoseReading>) ||
  model<IGlucoseReading>("GlucoseReading", GlucoseReadingSchema);