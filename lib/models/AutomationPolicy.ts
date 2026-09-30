import { Schema, model, models, type Model } from "mongoose";

/**
 * The clinic's outbound policy, as data.
 *
 * ## Why this is a collection and not environment variables
 *
 * Quiet hours and the weekly message budget are the two numbers a clinic will
 * actually want to change, and they will change for a reason: a patient complained,
 * the clinic is busy on a particular morning, someone is on holiday. Requiring a
 * redeploy to change them means the numbers stay wrong, and a number that cannot be
 * corrected quickly is a number nobody corrects.
 *
 * So the values live in a document the clinic can edit, and the engine reads them at
 * the start of every tick. There is one document, keyed `"default"`. The key exists
 * so a second clinic or a per-category override is a data change rather than a
 * schema migration, not because either is planned.
 *
 * ## The document is allowed to be incomplete
 *
 * Every field is optional. A document that sets only `weeklyBudget` is valid and
 * complete, and the rest falls back to `DEFAULT_OUTBOUND_POLICY`. That matters
 * because the alternative - all-or-nothing - means the clinic has to fill in fields
 * they have no opinion about before the one they do care about has any effect.
 *
 * What it is *not* allowed to do is be wrong. An out-of-range or non-integer value
 * is a validation error rather than a clamped one; see `parseAutomationPolicy`. A
 * policy that fails validation stops every scheduled message rather than silently
 * falling back to defaults, because "unknown" and "the default I picked" are not the
 * same thing and only one of them is defensible.
 *
 * ## Change history is kept, briefly
 *
 * `updatedAt` and `updatedBy` answer the only question that matters after a bad
 * week: who raised the budget to 40, and when. There is no audit log of every edit -
 * `AppLog` covers that where it is needed, and a second history here would be
 * unreviewed duplication.
 */
export interface IAutomationPolicy {
  _id: string;
  /** Singleton key. `"default"` is the only one the engine reads. */
  key: string;
  /** 0-31 whole scheduled messages per patient per ISO week. */
  weeklyBudget?: number;
  /** How long a scheduled message stays worth sending, in hours. 1-720. */
  stalenessHours?: number;
  /** Seconds before a second attempt after a send failed. 10-86400. */
  retryBackoffSeconds?: number;
  quietHours?: {
    enabled: boolean;
    /** Minutes from midnight at the clinic, inclusive. 0-1439. */
    fromMinutes: number;
    /** Minutes from midnight at the clinic, exclusive. 0-1439. May be less than `from`. */
    toMinutes: number;
  };
  /** Recorded for the status endpoint and the worklist, never for enforcement. */
  updatedAt?: Date;
  /** Free text: who asked for the change. */
  updatedBy?: string;
  createdAt: Date;
}

const AutomationPolicySchema = new Schema<IAutomationPolicy>(
  {
    key: { type: String, required: true, trim: true },
    weeklyBudget: { type: Number },
    stalenessHours: { type: Number },
    retryBackoffSeconds: { type: Number },
    quietHours: {
      enabled: { type: Boolean },
      fromMinutes: { type: Number },
      toMinutes: { type: Number },
    },
    updatedAt: { type: Date },
    updatedBy: { type: String, trim: true, maxlength: 120 },
  },
  { timestamps: true }
);

/**
 * One policy per key. The unique index rather than application logic is what makes
 * two concurrent "save the policy" clicks collapse into one row instead of racing
 * to create two, each with different values.
 */
AutomationPolicySchema.index({ key: 1 }, { unique: true });

export const AutomationPolicy: Model<IAutomationPolicy> =
  (models.AutomationPolicy as Model<IAutomationPolicy>) ||
  model<IAutomationPolicy>("AutomationPolicy", AutomationPolicySchema);

/** The only key the engine reads. */
export const DEFAULT_POLICY_KEY = "default";