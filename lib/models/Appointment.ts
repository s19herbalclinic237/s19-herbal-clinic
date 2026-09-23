import { Schema, model, models, type Model } from "mongoose";
import type { IUser } from "@/lib/models/User";
import type { IDoctor } from "@/lib/models/Doctor";

export type AppointmentMode = "clinic" | "video";
export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface IAppointment {
  _id: string;
  user: string | IUser;
  doctor: string | IDoctor;
  /** Family member / companion the visit is for (name only). */
  forMember?: string;
  /** YYYY-MM-DD */
  date: string;
  /** Slot start, "HH:mm" */
  time: string;
  mode: AppointmentMode;
  concern?: string;
  notes?: string;
  status: AppointmentStatus;
  /** Clinic-provided video consultation link (for video mode). */
  meetingUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const AppointmentSchema = new Schema<IAppointment>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    doctor: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    forMember: { type: String, trim: true },
    date: {
      type: String,
      required: true,
      validate: {
        validator: (v: string) => DATE_RE.test(v),
        message: "Date must be YYYY-MM-DD.",
      },
    },
    time: {
      type: String,
      required: true,
      validate: {
        validator: (v: string) => TIME_RE.test(v),
        message: "Time must be HH:mm.",
      },
    },
    mode: { type: String, enum: ["clinic", "video"], default: "clinic" },
    concern: { type: String, trim: true },
    notes: { type: String, trim: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
    },
    meetingUrl: { type: String, trim: true },
  },
  { timestamps: true }
);

AppointmentSchema.index({ user: 1, createdAt: -1 });
AppointmentSchema.index({ doctor: 1, date: 1 });
AppointmentSchema.index({ status: 1, date: 1 });

export const Appointment: Model<IAppointment> =
  (models.Appointment as Model<IAppointment>) || model<IAppointment>("Appointment", AppointmentSchema);