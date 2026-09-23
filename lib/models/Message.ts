import { Schema, model, models, type Model } from "mongoose";
import type { IUser } from "@/lib/models/User";

export interface IMessage {
  _id: string;
  user: string | IUser;
  author: "admin" | "user";
  subject: string;
  body: string;
  /** Root message id of the conversation this message belongs to. */
  thread?: string;
  read: boolean;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    author: { type: String, enum: ["admin", "user"], default: "admin" },
    subject: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    thread: { type: Schema.Types.ObjectId, ref: "Message" },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

MessageSchema.index({ user: 1, createdAt: -1 });
MessageSchema.index({ thread: 1, createdAt: 1 });

export const Message: Model<IMessage> =
  (models.Message as Model<IMessage>) || model<IMessage>("Message", MessageSchema);