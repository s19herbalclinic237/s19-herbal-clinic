import { Schema, model, models, type Model } from "mongoose";
import type { IUser } from "@/lib/models/User";

export type MedicalRecordType = "visit" | "diagnosis" | "lab" | "scan" | "note";

export interface RecordAttachment {
  name: string;
  url: string;
}

export interface IMedicalRecord {
  _id: string;
  user: string | IUser;
  /** Family member / companion the record belongs to (name only). */
  forMember?: string;
  type: MedicalRecordType;
  title: string;
  date: Date;
  doctorName?: string;
  diagnosis?: string;
  notes?: string;
  results?: string;
  attachments: RecordAttachment[];
  createdAt: Date;
  updatedAt: Date;
}

const MedicalRecordSchema = new Schema<IMedicalRecord>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    forMember: { type: String, trim: true },
    type: {
      type: String,
      enum: ["visit", "diagnosis", "lab", "scan", "note"],
      default: "visit",
    },
    title: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    doctorName: { type: String, trim: true },
    diagnosis: { type: String, trim: true },
    notes: { type: String, trim: true },
    results: { type: String, trim: true },
    attachments: [
      {
        name: { type: String, trim: true },
        url: { type: String, required: true, trim: true },
      },
    ],
  },
  { timestamps: true }
);

MedicalRecordSchema.index({ user: 1, date: -1 });

export const MedicalRecord: Model<IMedicalRecord> =
  (models.MedicalRecord as Model<IMedicalRecord>) ||
  model<IMedicalRecord>("MedicalRecord", MedicalRecordSchema);