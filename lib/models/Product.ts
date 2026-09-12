import { Schema, model, models, type Model } from "mongoose";

export interface IProduct {
  _id: string;
  name: string;
  slug: string;
  category: string;
  categorySlug: string;
  price: number;
  unit?: string;
  shortDescription: string;
  description: string;
  usage?: string;
  ingredients?: string;
  badge?: string;
  image: string;
  featured: boolean;
  stock: number;
  active: boolean;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    category: { type: String, required: true, trim: true },
    categorySlug: { type: String, required: true, lowercase: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    unit: { type: String, trim: true },
    shortDescription: { type: String, required: true },
    description: { type: String, required: true },
    usage: { type: String },
    ingredients: { type: String },
    badge: { type: String },
    image: { type: String, required: true },
    featured: { type: Boolean, default: false },
    stock: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ProductSchema.index({ categorySlug: 1, active: 1 });
ProductSchema.index({ featured: 1, active: 1 });

export const Product: Model<IProduct> =
  (models.Product as Model<IProduct>) || model<IProduct>("Product", ProductSchema);