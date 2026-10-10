import { Schema, model, models, type Model } from "mongoose";

export type BlogStatus = "draft" | "published";

export interface IBlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  cover?: string;
  author: string;
  status: BlogStatus;
  featured: boolean;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  titleFr?: string;
  excerptFr?: string;
  bodyFr?: string;
  authorFr?: string;
  gallery?: string[];
  videos?: string[];
}

const BlogPostSchema = new Schema<IBlogPost>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    excerpt: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    cover: { type: String },
    author: { type: String, default: "S19 Herbal Clinic", trim: true },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    featured: { type: Boolean, default: false },
    publishedAt: { type: Date },
    titleFr: { type: String, trim: true },
    excerptFr: { type: String, trim: true },
    bodyFr: { type: String, trim: true },
    authorFr: { type: String, trim: true },
    gallery: [{ type: String }],
    videos: [{ type: String }],
  },
  { timestamps: true }
);

BlogPostSchema.index({ status: 1, publishedAt: -1 });

export const BlogPost: Model<IBlogPost> =
  (models.BlogPost as Model<IBlogPost>) || model<IBlogPost>("BlogPost", BlogPostSchema);