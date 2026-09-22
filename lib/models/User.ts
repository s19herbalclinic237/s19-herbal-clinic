import { Schema, model, models, type Model } from "mongoose";

export type UserRole = "admin" | "user";

export interface IUser {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  emailVerified: boolean;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  verifyTokenHash?: string;
  verifyExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    emailVerified: { type: Boolean, default: false },
    phone: { type: String, trim: true },
    avatar: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
    verifyTokenHash: { type: String },
    verifyExpires: { type: Date },
  },
  { timestamps: true }
);

export const User: Model<IUser> =
  (models.User as Model<IUser>) || model<IUser>("User", UserSchema);