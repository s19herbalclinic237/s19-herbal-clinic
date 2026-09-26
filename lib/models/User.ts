import { Schema, model, models, type Model } from "mongoose";

export type UserRole = "admin" | "doctor" | "user";

export type PersonGender = "male" | "female" | "other";

export interface EmergencyContact {
  name?: string;
  phone?: string;
  relation?: string;
}

export interface FamilyMember {
  _id: string;
  name: string;
  /** YYYY-MM-DD */
  dob?: string;
  gender?: PersonGender;
  relation: "child" | "spouse" | "parent" | "sibling" | "other";
  notes?: string;
}

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
  /** YYYY-MM-DD */
  dob?: string;
  gender?: PersonGender;
  address?: string;
  emergencyContact?: EmergencyContact;
  /** Cloudinary URL of the patient's ID document (legacy single field). */
  idCardUrl?: string;
  /** Cloudinary URL of the front of the patient's ID document. */
  idCardFrontUrl?: string;
  /** Cloudinary URL of the back of the patient's ID document. */
  idCardBackUrl?: string;
  /** Medical Record Number (MRN). Assigned and edited by clinic admins only.
   *  Example: "S1900615". Sparse-unique: empty/unset values are allowed. */
  mrn?: string;
  familyMembers?: FamilyMember[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "doctor", "user"], default: "user" },
    emailVerified: { type: Boolean, default: false },
    phone: { type: String, trim: true },
    avatar: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
    verifyTokenHash: { type: String },
    verifyExpires: { type: Date },
    dob: { type: String, trim: true },
    gender: { type: String, enum: ["male", "female", "other"] },
    address: { type: String, trim: true },
    emergencyContact: {
      name: { type: String, trim: true },
      phone: { type: String, trim: true },
      relation: { type: String, trim: true },
    },
    idCardUrl: { type: String, trim: true },
    idCardFrontUrl: { type: String, trim: true },
    idCardBackUrl: { type: String, trim: true },
    mrn: { type: String, trim: true, uppercase: true },
    familyMembers: [
      {
        name: { type: String, required: true, trim: true },
        dob: { type: String, trim: true },
        gender: { type: String, enum: ["male", "female", "other"] },
        relation: {
          type: String,
          enum: ["child", "spouse", "parent", "sibling", "other"],
          default: "other",
        },
        notes: { type: String, trim: true },
      },
    ],
  },
  { timestamps: true }
);

// One Medical Record Number per patient. Sparse so users without an MRN
// (unassigned) never collide.
UserSchema.index({ mrn: 1 }, { unique: true, sparse: true });

export const User: Model<IUser> =
  (models.User as Model<IUser>) || model<IUser>("User", UserSchema);