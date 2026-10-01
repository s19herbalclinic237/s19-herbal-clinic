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
  /**
   * Level at or below which staff should reorder.
   *
   * Deliberately nullable with no default. Every existing product predates
   * inventory tracking and has never been given a reorder level, so a default
   * here would either raise false alarms on healthy lines or bury a real
   * shortage. Null reads as "the clinic has not decided", which is the truth.
   */
  reorderThreshold?: number | null;
  /**
   * Level a reorder should bring stock back up to. Null until set; the reorder
   * suggestion stays null while it is, because a quantity nobody chose is not a
   * quantity staff should act on.
   */
  reorderTarget?: number | null;
  active: boolean;
  nameFr?: string;
  categoryFr?: string;
  unitFr?: string;
  shortDescriptionFr?: string;
  descriptionFr?: string;
  usageFr?: string;
  ingredientsFr?: string;
  badgeFr?: string;
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
    stock: { type: Number, default: 0, min: 0 },
    reorderThreshold: { type: Number, min: 0, max: 1_000_000 },
    reorderTarget: { type: Number, min: 0, max: 1_000_000 },
    active: { type: Boolean, default: true },
    nameFr: { type: String, trim: true },
    categoryFr: { type: String, trim: true },
    unitFr: { type: String, trim: true },
    shortDescriptionFr: { type: String },
    descriptionFr: { type: String },
    usageFr: { type: String },
    ingredientsFr: { type: String },
    badgeFr: { type: String },
  },
  { timestamps: true }
);

ProductSchema.index({ categorySlug: 1, active: 1 });
ProductSchema.index({ featured: 1, active: 1 });
// Backs the inventory view's "what needs reordering" ordering.
ProductSchema.index({ stock: 1 });

export const Product: Model<IProduct> =
  (models.Product as Model<IProduct>) || model<IProduct>("Product", ProductSchema);