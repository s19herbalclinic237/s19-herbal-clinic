import { Schema, model, models, type Model } from "mongoose";

export type LogDigestStatus = "never" | "sent" | "failed" | "not-configured";

/**
 * Single-document record of the last daily log digest, so the admin panel can
 * answer "did yesterday's summary actually arrive?" and so the cron can stay
 * idempotent if it is triggered more than once in a day.
 */
export interface ILogDigest {
  _id: string;
  lastSentAt?: Date;
  windowStart?: Date;
  windowEnd?: Date;
  entryCount: number;
  errorCount: number;
  warnCount: number;
  topSignature?: string;
  status: LogDigestStatus;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LogDigestSchema = new Schema<ILogDigest>(
  {
    // Declared explicitly. Mongoose's default `_id` is an ObjectId, which makes
    // `findById("daily")` throw a CastError - and this is the one place a
    // failure is invisible, because a summary that never sends reports nothing.
    // The collection holds a single document, so a readable string key is the
    // right shape.
    _id: { type: String, required: true },
    lastSentAt: { type: Date },
    windowStart: { type: Date },
    windowEnd: { type: Date },
    entryCount: { type: Number, min: 0, default: 0 },
    errorCount: { type: Number, min: 0, default: 0 },
    warnCount: { type: Number, min: 0, default: 0 },
    topSignature: { type: String, maxlength: 200 },
    status: {
      type: String,
      enum: ["never", "sent", "failed", "not-configured"],
      default: "never",
    },
    errorMessage: { type: String, maxlength: 300 },
  },
  { timestamps: true }
);

export const LOG_DIGEST_ID = "daily";

export const LogDigest: Model<ILogDigest> =
  (models.LogDigest as Model<ILogDigest>) ||
  model<ILogDigest>("LogDigest", LogDigestSchema);
