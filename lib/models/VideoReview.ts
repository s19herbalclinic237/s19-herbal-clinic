import { Schema, model, models, type Model } from "mongoose";

export interface IVideoReview {
  _id: string;
  url: string;
  title?: string;
  active: boolean;
  createdAt: Date;
}

const VideoReviewSchema = new Schema<IVideoReview>(
  {
    url: { type: String, required: true, trim: true, maxlength: 500 },
    title: { type: String, trim: true, maxlength: 140 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

VideoReviewSchema.index({ createdAt: 1 });

export const VideoReview: Model<IVideoReview> =
  (models.VideoReview as Model<IVideoReview>) ||
  model<IVideoReview>("VideoReview", VideoReviewSchema);