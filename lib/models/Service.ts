import { Schema, model, models, type Model } from "mongoose";

export type ServiceStatus = "draft" | "published";

/**
 * A service offered on the public Services page (`/services`).
 *
 * This is the admin-managed version of the old static `treatmentPrograms`
 * array in `lib/data/programs.ts`, which is kept as the seed source and the
 * fallback when the database is empty or unreachable.
 */
export interface IService {
  _id: string;
  slug: string;
  title: string;
  short: string;
  detail: string;
  conditions: string[];
  /** Optional boundary-of-care note rendered on the card. */
  note?: string;
  /** "Important" is the default; "safety" is reserved for medication risk. */
  noteKind?: "important" | "safety";
  /** Ascending display order on the Services page. */
  order: number;
  status: ServiceStatus;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  titleFr?: string;
  shortFr?: string;
  detailFr?: string;
  conditionsFr?: string[];
  noteFr?: string;
}

const ServiceSchema = new Schema<IService>(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    title: { type: String, required: true, trim: true },
    short: { type: String, required: true, trim: true },
    detail: { type: String, required: true, trim: true },
    conditions: [{ type: String, trim: true }],
    note: { type: String, trim: true },
    noteKind: { type: String, enum: ["important", "safety"], default: "important" },
    order: { type: Number, default: 0 },
    status: { type: String, enum: ["draft", "published"], default: "published" },
    publishedAt: { type: Date },
    titleFr: { type: String, trim: true },
    shortFr: { type: String, trim: true },
    detailFr: { type: String, trim: true },
    conditionsFr: [{ type: String, trim: true }],
    noteFr: { type: String, trim: true },
  },
  { timestamps: true }
);

ServiceSchema.index({ status: 1, order: 1 });

export const Service: Model<IService> =
  (models.Service as Model<IService>) || model<IService>("Service", ServiceSchema);
