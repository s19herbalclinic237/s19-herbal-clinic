import { Schema, model, models, type Model } from "mongoose";
import type { IUser } from "@/lib/models/User";

export type TestimonialStatus = "pending" | "approved" | "rejected";

export interface ITestimonial {
  _id: string;
  user?: string | IUser;
  name: string;
  city: string;
  country?: string;
  program: string;
  text: string;
  rating?: number;
  email?: string;
  status: TestimonialStatus;
  createdAt: Date;
}

const TestimonialSchema = new Schema<ITestimonial>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    name: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    country: { type: String, trim: true },
    program: { type: String, required: true, trim: true },
    text: { type: String, required: true, trim: true },
    rating: { type: Number, min: 1, max: 5 },
    email: { type: String, trim: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  },
  { timestamps: true }
);

TestimonialSchema.index({ user: 1, createdAt: -1 });

export const Testimonial: Model<ITestimonial> =
  (models.Testimonial as Model<ITestimonial>) || model<ITestimonial>("Testimonial", TestimonialSchema);