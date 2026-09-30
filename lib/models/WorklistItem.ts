import { Schema, model, models, type Model } from "mongoose";

export type WorklistStatus = "open" | "claimed" | "resolved" | "dismissed";

export interface IWorklistOwner {
  id: string;
  name: string;
}

/**
 * A staff decision about one live alert.
 *
 * The alert itself is recomputed from clinical data on every request and is not
 * stored — a patient who resumes logging glucose must make the alert disappear
 * on their own, without anyone remembering to close a ticket. This model holds
 * only the part that data cannot tell us: who has taken it, what they decided,
 * and whether they have already looked.
 *
 * Rows are created lazily the first time an alert is seen, and `alertId` is
 * unique, so the worklist needs no creation job to stay in step with the feed.
 */
export interface IWorklistItem {
  _id: string;
  /** Stable identity of the alert, e.g. `missed-glucose:<planId>`. */
  alertId: string;
  category: string;
  planId?: string;
  patientId?: string;
  patientName?: string;
  /**
   * `open` nobody has touched it; `claimed` someone owns it; `resolved` handled;
   * `dismissed` not a real problem for this occurrence.
   */
  status: WorklistStatus;
  owner?: IWorklistOwner;
  note?: string;
  /** First time this alert was observed. Drives "how long has this waited". */
  firstSeenAt: Date;
  /** Last time this alert was observed by a read of the worklist. */
  lastSeenAt: Date;
  /** How many distinct clinic days this alert has appeared on. */
  seenCount: number;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WorklistItemSchema = new Schema<IWorklistItem>(
  {
    alertId: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    planId: { type: String, trim: true },
    patientId: { type: String, trim: true },
    patientName: { type: String, trim: true },
    status: {
      type: String,
      enum: ["open", "claimed", "resolved", "dismissed"],
      default: "open",
    },
    owner: {
      id: { type: String },
      name: { type: String, trim: true },
    },
    note: { type: String, trim: true, maxlength: 2000 },
    firstSeenAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now },
    seenCount: { type: Number, default: 1, min: 1 },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

WorklistItemSchema.index({ alertId: 1 }, { unique: true });
// The worklist read fetches by alertId; this covers the "unowned, oldest first"
// queue the dashboard leads with.
WorklistItemSchema.index({ status: 1, lastSeenAt: 1 });

export const WorklistItem: Model<IWorklistItem> =
  (models.WorklistItem as Model<IWorklistItem>) || model<IWorklistItem>("WorklistItem", WorklistItemSchema);