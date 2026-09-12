import { Schema, model, models, type Model } from "mongoose";

export type SubscriberStatus = "subscribed" | "unsubscribed";

export interface ISubscriber {
  _id: string;
  email: string;
  name?: string;
  status: SubscriberStatus;
  createdAt: Date;
}

const SubscriberSchema = new Schema<ISubscriber>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, trim: true },
    status: { type: String, enum: ["subscribed", "unsubscribed"], default: "subscribed" },
  },
  { timestamps: true }
);

export const Subscriber: Model<ISubscriber> =
  (models.Subscriber as Model<ISubscriber>) || model<ISubscriber>("Subscriber", SubscriberSchema);