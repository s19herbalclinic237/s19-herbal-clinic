import { Schema, model, models, type Model } from "mongoose";
import type { IUser } from "@/lib/models/User";

export type PrescriptionStatus = "active" | "expired";

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  /** e.g. "14 days", "3 months" */
  duration?: string;
  instructions?: string;
  /** Photo of the actual product (box/bottle) so the patient can identify it. */
  photo?: string;
}

export interface IPrescription {
  _id: string;
  user: string | IUser;
  /** Family member / companion the prescription is for (name only). */
  forMember?: string;
  doctorName?: string;
  issuedDate: Date;
  expiresAt?: Date;
  status: PrescriptionStatus;
  medications: Medication[];
  /** Optional photo of the full prescription / treatment kit. */
  coverPhoto?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PrescriptionSchema = new Schema<IPrescription>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    forMember: { type: String, trim: true },
    doctorName: { type: String, trim: true },
    issuedDate: { type: Date, required: true },
    expiresAt: { type: Date },
    status: { type: String, enum: ["active", "expired"], default: "active" },
    medications: [
      {
        name: { type: String, required: true, trim: true },
        dosage: { type: String, required: true, trim: true },
        frequency: { type: String, required: true, trim: true },
        duration: { type: String, trim: true },
        instructions: { type: String, trim: true },
        photo: { type: String, trim: true },
      },
    ],
    coverPhoto: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

PrescriptionSchema.index({ user: 1, issuedDate: -1 });

export const Prescription: Model<IPrescription> =
  (models.Prescription as Model<IPrescription>) ||
  model<IPrescription>("Prescription", PrescriptionSchema);