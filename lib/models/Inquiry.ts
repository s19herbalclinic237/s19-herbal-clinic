import { Schema, model, models, type Model } from "mongoose";

export type InquiryType = "Booking" | "Contact" | "Order";

export interface IInquiry {
  _id: string;
  type: InquiryType;
  fullName: string;
  phone: string;
  email?: string;
  mode?: string;
  concern?: string;
  message: string;
  status: "New" | "In Progress" | "Resolved";
}

const InquirySchema = new Schema<IInquiry>(
  {
    type: { type: String, enum: ["Booking", "Contact", "Order"], required: true },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    mode: { type: String, trim: true },
    concern: { type: String, trim: true },
    message: { type: String, trim: true },
    status: { type: String, enum: ["New", "In Progress", "Resolved"], default: "New" },
  },
  { timestamps: true }
);

export const Inquiry: Model<IInquiry> =
  (models.Inquiry as Model<IInquiry>) || model<IInquiry>("Inquiry", InquirySchema);