import { Schema, model, models, type Model } from "mongoose";
import type { IUser } from "@/lib/models/User";
import type { IConversation } from "@/lib/models/Conversation";
import type { WhatsAppTemplate } from "@/lib/whatsapp-templates";

/**
 * The outbound queue: every message the clinic sends through the engine, decided
 * before it is sent.
 *
 * ## Why an outbox at all
 *
 * The alternative is to send from the request handler that decided to notify, which
 * is what the site does today and what `notifyPatientWhatsApp` does. That couples
 * three things that should not be coupled:
 *
 *  1. **When.** A patient booking at 03:00 would be sent the booking confirmation at
 *     03:00, because nothing knows it is the middle of the night.
 *  2. **Whether.** The recipient's consent and opt-out would be read at the moment of
 *     sending, which is correct - but nothing would be able to *prevent* a send, only
 *     log that it should not have happened.
 *  3. **Retry.** A Meta timeout would lose the notification permanently, because the
 *     handler returns 200 to the patient regardless and the request context is gone.
 *
 * A row in a queue separates deciding from sending. The decision is made once, by a
 * pure function in `lib/outbound-policy.ts`, and the send happens later from a tick
 * that re-checks the things that may have changed in between. A lost notification
 * becomes a retry; an unwanted one becomes a row that was never dispatched.
 *
 * ## `dedupeKey` is the idempotency mechanism, exactly as `wamid` is for inbound
 *
 * A schedule that fires every minute must produce one message, not one per tick. The
 * key is derived from the *logical* identity of the message - rule, patient, subject,
 * and the date the rule is for - so re-enqueuing produces the same key and the second
 * insert collides on a unique index. Application-level check-then-insert would lose
 * the race whenever two requests enqueue the same reminder concurrently, which is the
 * normal case, not the exotic one.
 *
 * The insert is the arbitration: `E11000` means "already queued", which is success
 * from the caller's point of view, not an error. See `enqueueOutbound` in
 * `lib/outbox.ts`.
 *
 * ## Statuses
 *
 * ```text
 *                    enqueue
 *                      |
 *                      v
 *                   queued  ---- defer (quiet hours / budget / engaged) --->  deferred
 *                      |                                                        |
 *                      | claim                                                due |
 *                      v                                                        |
 *                   sending  ---- failure ---> queued (nextAttemptAt)           |
 *                      |                                             deferred --+
 *                      | success
 *                      v
 *                    sent
 *
 *   any state -- policy refusal ----> stopped        (terminal)
 *   sending -- attempts exhausted --> failed         (terminal, needs a person)
 * ```
 *
 * `deferred` is not a status so much as a note: the message is still wanted, it is
 * just not wanted now. It re-enters the queue on its own at `deferredUntil`, which
 * means a message held by quiet hours re-decides itself the next morning against the
 * full policy rather than against a snapshot taken at 23:00.
 *
 * `stopped` and `failed` are the two states a person has to look at, and both record
 * why. Neither is ever retried by the engine.
 *
 * ## The lease
 *
 * There is no transaction available on this deployment, so claiming is
 * find-one-and-update, not select-for-update. A tick that claims a row and then dies
 * - a deploy mid-run, a Vercel timeout - would otherwise strand it in `sending`
 * forever. `leaseUntil` bounds that: a later tick reclaims a row whose lease has
 * expired. The residual race - two ticks claiming the same row inside one lease
 * window - is small and is not eliminated. It is mitigated rather than solved, and
 * the honest cost is stated in `docs/OUTBOUND_ENGINE.md` rather than glossed.
 */
export type OutboxStatus = "queued" | "sending" | "sent" | "deferred" | "stopped" | "failed";

export interface IOutboxMessage {
  _id: string;
  /**
   * The logical identity of this message. Unique when present.
   *
   * Supplied by the caller as a readable string; `lib/outbox.ts` hashes it. Two
   * enqueues of the same logical message produce the same key.
   */
  dedupeKey?: string | null;
  /** Set once Meta accepted the message. Joins to `WhatsAppMessage.wamid`. */
  wamid?: string | null;
  conversation: string | IConversation;
  /** Absent for a recipient with no patient record; such a message is still queued. */
  patient?: string | IUser;
  /** Digits only, denormalised so "everything queued for this number" needs no join. */
  phone: string;
  /**
   * Whether this is a receipt or automation. Decides which limits apply; see
   * `lib/outbound-policy.ts`.
   */
  priority: "transactional" | "scheduled";
  /** Only `template` is implemented in M2. `text` exists for the free-form replies M13 needs. */
  kind: "template" | "text";
  /** Which approved template. Absent when `kind` is `text`. */
  template?: WhatsAppTemplate;
  /** Body placeholders, filled positionally. May be health data: see retention below. */
  params: string[];
  /** Body text, for `kind: "text"`. */
  text?: string;
  language: "en" | "fr";
  /**
   * The downstream module's identifier for the thing that produced this -
   * `treatment_plan:42:refill:2026-10-01`. Also part of the dedupe key, so one rule
   * cannot collide with another.
   */
  ruleId: string;
  /** When the message was meant to go out. Set at enqueue, not at dispatch. */
  scheduledFor: Date;
  status: OutboxStatus;
  attempts: number;
  /** Earliest next attempt, after a failed send. Null means "as soon as possible". */
  nextAttemptAt?: Date | null;
  /** While `sending`, the instant after which another tick may reclaim the row. */
  leaseUntil?: Date | null;
  /** Policy said "not yet". Populated only while `deferred`. */
  deferReason?: string;
  deferredUntil?: Date | null;
  /** Policy said "never". Populated only when `stopped`. */
  stopReason?: string;
  /** Last transport error, truncated. Never contains a credential. */
  lastError?: string;
  /** When Meta accepted it. */
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * How long a tick may hold a claimed row before another tick may take it.
 *
 * Long enough that a normal send - one HTTP POST to Meta - finishes well inside it,
 * short enough that a crashed tick's row is not stranded for long. Vercel's own
 * function timeout is above this, so a row is reclaimed after a deploy or a timeout
 * rather than sitting until the day ends.
 */
export const OUTBOX_LEASE_MS = 60_000;

/**
 * Attempts before a message is given up on and handed to a person.
 *
 * Five, with the backoff in the policy between them. The failure this covers is a
 * bad token, an unapproved template, or a number Meta rejects - all of which will
 * fail identically five times. Retrying them for hours accomplishes nothing except a
 * log full of identical errors, so the row is stopped and surfaced instead.
 */
export const MAX_OUTBOX_ATTEMPTS = 5;

/** Where a terminal row can be read from. Backs the "what failed" worklist. */
export const TERMINAL_OUTBOX_STATUSES: readonly OutboxStatus[] = ["stopped", "failed"];

const OutboxMessageSchema = new Schema<IOutboxMessage>(
  {
    dedupeKey: { type: String, trim: true },
    wamid: { type: String, trim: true },
    conversation: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    patient: { type: Schema.Types.ObjectId, ref: "User" },
    phone: { type: String, required: true, trim: true },
    priority: { type: String, enum: ["transactional", "scheduled"], required: true },
    kind: { type: String, enum: ["template", "text"], required: true },
    template: { type: String, maxlength: 80 },
    params: { type: [String], default: [] },
    text: { type: String, maxlength: 4096 },
    language: { type: String, enum: ["en", "fr"], default: "en" },
    ruleId: { type: String, required: true, trim: true, maxlength: 200 },
    scheduledFor: { type: Date, required: true, default: Date.now },
    status: { type: String, enum: ["queued", "sending", "sent", "deferred", "stopped", "failed"], default: "queued", index: true },
    attempts: { type: Number, default: 0, min: 0 },
    nextAttemptAt: { type: Date },
    leaseUntil: { type: Date },
    deferReason: { type: String, maxlength: 40 },
    deferredUntil: { type: Date },
    stopReason: { type: String, maxlength: 40 },
    lastError: { type: String, maxlength: 500 },
    sentAt: { type: Date },
  },
  { timestamps: true }
);

/**
 * One row per logical message.
 *
 * Unique and **partial on `{ $type: "string" }`**, not sparse. Sparse would still
 * create a document for every row with no key and collide them all on the single
 * implicit `null`; the partial form excludes them from the index entirely, so a
 * caller that does not supply a key is not penalised for it.
 *
 * An ordinary event-driven message - "your appointment changed", enqueued from a
 * PATCH request - has no dedupe key, because there is no schedule to run twice. It is
 * simply queued once, and that is correct.
 */
OutboxMessageSchema.index({ dedupeKey: 1 }, { unique: true, partialFilterExpression: { dedupeKey: { $type: "string" } } });

/** The claim query: eligible rows, oldest scheduled first. */
OutboxMessageSchema.index({ status: 1, scheduledFor: 1, nextAttemptAt: 1 });
/** A patient's queued history, newest first. Backs "what is waiting for this person". */
OutboxMessageSchema.index({ patient: 1, createdAt: -1 });
/** A thread's history. Joins to the staff inbox's thread view. */
OutboxMessageSchema.index({ conversation: 1, createdAt: -1 });
/** Delivery-failure sweeps, and the retention sweep. See the note on retention below. */
OutboxMessageSchema.index({ status: 1, updatedAt: -1 });

/**
 * ## Retention
 *
 * There is deliberately **no TTL index** here, for the same reason `PatientEvent` has
 * none. `params` for a prescription notification contains a medication list, so a row
 * is health data, and a TTL would delete part of the clinical record by a background
 * timer with nobody deciding it.
 *
 * Sweeping is instead an explicit, reported action: terminal rows older than
 * `OUTBOX_RETENTION_DAYS` are removed by a maintenance pass, which logs what it
 * removed. That pass is scheduled with M10's maintenance work and is listed as a
 * known gap in `docs/STATE_AND_CREDENTIALS_GAPS.md` rather than quietly omitted.
 */
export const OUTBOX_RETENTION_DAYS = 90;

export const OutboxMessage: Model<IOutboxMessage> =
  (models.OutboxMessage as Model<IOutboxMessage>) ||
  model<IOutboxMessage>("OutboxMessage", OutboxMessageSchema);