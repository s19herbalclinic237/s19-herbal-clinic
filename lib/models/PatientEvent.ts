import { Schema, model, models, type Model } from "mongoose";
import type { IUser } from "@/lib/models/User";
import type { ITreatmentPlan } from "@/lib/models/TreatmentPlan";

/**
 * The single source of truth for a patient's history.
 *
 * Every meaningful thing that happens to a patient - a consultation, a symptom
 * report, a laboratory result, a prescription, an appointment, a payment, a
 * refill, an inbound WhatsApp reply, an escalation - is appended here and
 * nowhere else. This log is append-only: no feature updates another feature's
 * tables, and nothing rewrites a past event.
 *
 * Why this is the foundation rather than a nice-to-have: four of the requested
 * capabilities are pure projections over this collection and would otherwise
 * each be built separately and drift apart.
 *
 *   - the patient progress timeline          (ordered read of `at`)
 *   - the AI summary before opening a record (events since last consultation)
 *   - treatment adherence scoring            (measurement/task/event density)
 *   - "since you were last here" follow-ups  (same, for patients)
 *
 * Because they are projections, they can be rewritten and improved later
 * without migrating historical data and without touching each other. That is
 * what makes further automation additive rather than a rebuild.
 *
 * Retention: this is a health record, so it is kept for the life of the patient
 * record and is swept into the encrypted database backup like any other
 * collection. There is deliberately no TTL index.
 */
export type PatientEventType =
  | "consultation"
  | "symptom"
  | "measurement"
  | "lab_result"
  | "prescription"
  | "appointment"
  | "payment"
  | "plan_issued"
  | "plan_changed"
  | "refill"
  | "message"
  | "task"
  | "adherence"
  | "document"
  | "escalation"
  | "consent";

/**
 * How prominent an event is. The AI summary and the staff worklist both filter
 * on this, so that "a note was filed" does not crowd out "a symptom was
 * reported" - and so a clinician is never shown a bland timeline that hides the
 * one entry that mattered.
 */
export type PatientEventImportance = "routine" | "notable" | "critical";

/** Who caused the event. Drives attribution in the timeline and in audit. */
export interface PatientEventActor {
  kind: "patient" | "staff" | "system" | "integration";
  /** User id, staff id, or integration name. Absent for pure system events. */
  id?: string;
  /** Display name captured at the time, so the log stays readable if the user
   *  is later renamed or removed. */
  name?: string;
}

/** Which surface produced the event. */
export type PatientEventSource =
  | "portal"
  | "whatsapp"
  | "email"
  | "shop"
  | "automation"
  | "import"
  | "admin";

export interface IPatientEvent {
  _id: string;
  patient: string | IUser;
  /** Set when the event belongs to a specific treatment plan. */
  plan?: string | ITreatmentPlan;
  type: PatientEventType;
  /**
   * When the thing actually happened, in clinic time. Deliberately separate from
   * `createdAt` (when we wrote it down): a lab result entered on Monday for a
   * test taken three weeks earlier must sort on the test date, or the timeline
   * lies about the course of the illness.
   */
  at: Date;
  actor: PatientEventActor;
  /** One short human-readable line, safe to show in the timeline without
   *  re-deriving anything. Never the only place the detail lives. */
  summary: string;
  /** Structured detail. Shape is per `type`; kept loose on purpose so a new
   *  event type does not require a migration. */
  data?: Record<string, unknown>;
  source: PatientEventSource;
  importance: PatientEventImportance;
  /**
   * Optional idempotency key. Two records with the same key for the same patient
   * are the same event - used by the automation engine, which must survive a
   * cron run that fires twice, and by the WhatsApp webhook, which Meta retries.
   */
  dedupeKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PatientEventSchema = new Schema<IPatientEvent>(
  {
    patient: { type: Schema.Types.ObjectId, ref: "User", required: true },
    plan: { type: Schema.Types.ObjectId, ref: "TreatmentPlan" },
    type: {
      type: String,
      enum: [
        "consultation",
        "symptom",
        "measurement",
        "lab_result",
        "prescription",
        "appointment",
        "payment",
        "plan_issued",
        "plan_changed",
        "refill",
        "message",
        "task",
        "adherence",
        "document",
        "escalation",
        "consent",
      ],
      required: true,
    },
    at: { type: Date, required: true, default: Date.now },
    actor: {
      kind: {
        type: String,
        enum: ["patient", "staff", "system", "integration"],
        required: true,
      },
      id: { type: Schema.Types.Mixed },
      name: { type: String, trim: true, maxlength: 120 },
    },
    summary: { type: String, required: true, trim: true, maxlength: 300 },
    data: { type: Schema.Types.Mixed },
    source: {
      type: String,
      enum: ["portal", "whatsapp", "email", "shop", "automation", "import", "admin"],
      default: "admin",
    },
    importance: {
      type: String,
      enum: ["routine", "notable", "critical"],
      default: "routine",
    },
    dedupeKey: { type: String, trim: true, maxlength: 200 },
  },
  { timestamps: true }
);

// The timeline: one patient, newest first. This is the access pattern behind
// both the progress timeline and "everything since the last consultation".
PatientEventSchema.index({ patient: 1, at: -1 });
// Filtering one kind of event for one patient, still newest first.
PatientEventSchema.index({ patient: 1, type: 1, at: -1 });
// Plan-scoped reporting, e.g. adherence within a single course of treatment.
PatientEventSchema.index({ plan: 1, at: -1 });
// Clinic-wide "critical events today" for the exception dashboard.
PatientEventSchema.index({ importance: 1, at: -1 });

/**
 * Idempotency. A sparse unique index means events without a dedupe key are
 * never compared, while two engine ticks that emit the same reminder collide and
 * the second insert is rejected. This is what makes the automation safe to
 * retry, which it has to be: cloud cron skips runs and webhook delivery
 * repeats.
 */
PatientEventSchema.index(
  { patient: 1, dedupeKey: 1 },
  { unique: true, partialFilterExpression: { dedupeKey: { $type: "string" } } }
);

export const PatientEvent: Model<IPatientEvent> =
  (models.PatientEvent as Model<IPatientEvent>) ||
  model<IPatientEvent>("PatientEvent", PatientEventSchema);
