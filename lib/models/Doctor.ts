import { Schema, model, models, type Model } from "mongoose";

export interface DoctorScheduleSlot {
  /** JS day: 0 = Sunday ... 6 = Saturday */
  day: number;
  /** Slot start, "HH:mm" */
  start: string;
  /** Slot end (exclusive), "HH:mm" */
  end: string;
  /** Slot length in minutes */
  slotMinutes: number;
}

export interface IDoctor {
  _id: string;
  name: string;
  specialty: string;
  specialtyFr?: string;
  bio?: string;
  bioFr?: string;
  photo?: string;
  phone?: string;
  schedule: DoctorScheduleSlot[];
  active: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const DoctorSchema = new Schema<IDoctor>(
  {
    name: { type: String, required: true, trim: true },
    specialty: { type: String, required: true, trim: true },
    specialtyFr: { type: String, trim: true },
    bio: { type: String, trim: true },
    bioFr: { type: String, trim: true },
    photo: { type: String, trim: true },
    phone: { type: String, trim: true },
    schedule: [
      {
        day: { type: Number, required: true, min: 0, max: 6 },
        start: {
          type: String,
          required: true,
          validate: {
            validator: (v: string) => TIME_RE.test(v),
            message: "Start time must be HH:mm.",
          },
        },
        end: {
          type: String,
          required: true,
          validate: {
            validator: (v: string) => TIME_RE.test(v),
            message: "End time must be HH:mm.",
          },
        },
        slotMinutes: { type: Number, required: true, min: 15, max: 120, default: 30 },
      },
    ],
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

DoctorSchema.index({ active: 1, sortOrder: 1 });

export const Doctor: Model<IDoctor> =
  (models.Doctor as Model<IDoctor>) || model<IDoctor>("Doctor", DoctorSchema);