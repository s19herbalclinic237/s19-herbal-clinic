import { Schema, model, models, type Model } from "mongoose";
import type { IUser } from "@/lib/models/User";

export interface IResetToken {
  _id: string;
  tokenHash: string;
  user: string | IUser;
  used: boolean;
  expiresAt: Date;
  createdAt: Date;
}

const ResetTokenSchema = new Schema<IResetToken>(
  {
    tokenHash: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    used: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true }
);

export const ResetToken: Model<IResetToken> =
  (models.ResetToken as Model<IResetToken>) ||
  model<IResetToken>("ResetToken", ResetTokenSchema);