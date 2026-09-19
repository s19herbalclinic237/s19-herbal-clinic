import { Schema, model, models, type Model } from "mongoose";

export interface ICategory {
  _id: string;
  name: string;
  slug: string;
  blurb?: string;
  nameFr?: string;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    blurb: { type: String },
    nameFr: { type: String, trim: true },
  },
  { timestamps: true }
);

export const Category: Model<ICategory> =
  (models.Category as Model<ICategory>) || model<ICategory>("Category", CategorySchema);