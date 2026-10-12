import { Schema, model, models, type Model } from "mongoose";
import type { IUser } from "@/lib/models/User";

export interface ISession {
  _id: string;
  tokenHash: string;
  user: string | IUser;
  expiresAt: Date;
  /** Last time the session was touched; backs the idle timeout. */
  lastActiveAt?: Date;
  createdAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    tokenHash: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    lastActiveAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Session: Model<ISession> =
  (models.Session as Model<ISession>) || model<ISession>("Session", SessionSchema);