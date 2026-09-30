import { Schema, model, models, type Model } from "mongoose";

/**
 * Durable application log. Unlike the platform's console output - which is
 * retained for as little as one hour - these documents are queryable from the
 * admin panel, summarised in the daily digest email, and swept into the
 * encrypted database backup like any other collection.
 */
export type AppLogLevel = "error" | "warn" | "info";

/** How the entry was captured. `console` is the patched console, `request` is
 *  the Next.js unhandled-server-error hook, `manual` is an explicit call. */
export type AppLogSource = "console" | "request" | "manual";

export interface IAppLog {
  _id: string;
  level: AppLogLevel;
  source: AppLogSource;
  /** Subsystem tag, taken from the `[tag]` prefix the codebase logs with. */
  scope: string;
  message: string;
  /** Redacted, truncated JSON rendering of the original log arguments. */
  context?: string;
  route?: string;
  method?: string;
  status?: number;
  /** Matches `error.digest` shown on the error page, for correlation. */
  digest?: string;
  /** Stable hash of scope + message + route, used to collapse repeats. */
  fingerprint: string;
  /** How many times this exact error was seen inside the collapse window. */
  occurrences: number;
  firstSeen: Date;
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AppLogSchema = new Schema<IAppLog>(
  {
    level: {
      type: String,
      enum: ["error", "warn", "info"],
      required: true,
    },
    source: {
      type: String,
      enum: ["console", "request", "manual"],
      default: "console",
    },
    scope: { type: String, required: true, trim: true, maxlength: 80 },
    message: { type: String, required: true, maxlength: 500 },
    context: { type: String, maxlength: 4100 },
    route: { type: String, trim: true, maxlength: 300 },
    method: { type: String, trim: true, maxlength: 10 },
    status: { type: Number, min: 100, max: 599 },
    digest: { type: String, trim: true, maxlength: 64 },
    fingerprint: { type: String, required: true, maxlength: 24 },
    occurrences: { type: Number, min: 1, default: 1 },
    firstSeen: { type: Date, default: Date.now },
    lastSeen: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

/**
 * Retention is enforced by MongoDB's TTL monitor rather than a prune job, so
 * it keeps working even if the cron never runs. `LOG_RETENTION_DAYS` defaults
 * to 90.
 */
const retentionDays = (() => {
  const parsed = Number(process.env.LOG_RETENTION_DAYS);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 90;
})();
AppLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: retentionDays * 86_400 });

AppLogSchema.index({ fingerprint: 1, lastSeen: -1 });
AppLogSchema.index({ level: 1, lastSeen: -1 });
AppLogSchema.index({ scope: 1, lastSeen: -1 });

export const APP_LOG_RETENTION_DAYS = retentionDays;

export const AppLog: Model<IAppLog> =
  (models.AppLog as Model<IAppLog>) ||
  model<IAppLog>("AppLog", AppLogSchema);
