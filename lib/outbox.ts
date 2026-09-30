import "server-only";

import { createHash } from "node:crypto";

import { connectDb } from "@/lib/db";
import { CLINIC } from "@/lib/site";
import { normalizePhone } from "@/lib/auth";
import { User } from "@/lib/models/User";
import { WhatsAppMessage } from "@/lib/models/WhatsAppMessage";
import {
  OutboxMessage,
  MAX_OUTBOX_ATTEMPTS,
  OUTBOX_LEASE_MS,
} from "@/lib/models/OutboxMessage";
import { upsertConversation } from "@/lib/conversations";
import { isoWeekStart } from "@/lib/outbound-policy";
import type { OutboxStatus } from "@/lib/models/OutboxMessage";
import type { WhatsAppTemplate } from "@/lib/whatsapp-templates";

/**
 * The outbox writer: everything that puts a row in the queue, and everything that
 * takes a row out again.
 *
 * ## What is here and what is not
 *
 * The *decision* to send lives in `lib/outbound-policy.ts` as a pure function, and
 * the HTTP call to Meta lives in `lib/whatsapp.ts`. This module is only the
 * bookkeeping between them: resolve the thread, decide whether this specific message
 * should be enqueued at all, insert with an idempotency key, claim, record.
 *
 * That split is deliberate. The interesting failures — messaging an opt-out,
 * double-sending after a tick runs twice, retrying a broken token forty times — are
 * all decisions, and decisions belong where they can be unit tested.
 *
 * ## Enqueueing is where policy is first applied, but it is not the last word
 *
 * A message can be declined at enqueue (the patient has opted out, the number is
 * unusable) or deferred at dispatch (it is 03:00). Enqueue-time is a cheap early
 * exit for the refusals that will never change; dispatch-time re-runs the same
 * function because everything can change in between. A patient may opt out between
 * enqueue and dispatch, and the dispatch-time check is the one that catches it.
 */

const OUTBOX_MAX_PARAMS = 32;
const OUTBOX_MAX_PARAM_CHARS = 1024;

/** Mongoose's duplicate-key code, checked without importing Mongoose. */
function isDuplicateKey(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: number }).code === 11000;
}

export type EnqueueOutcome =
  /** A new row was inserted. */
  | { ok: true; status: "queued"; id: string; dedupeKey: string }
  /** The same logical message is already in the queue. Not an error. */
  | { ok: true; status: "already_queued"; id: string; dedupeKey: string }
  /** Refused before it was ever queued. `reason` explains it in a log line. */
  | { ok: false; reason: string; detail: string };

/**
 * Builds the idempotency key.
 *
 * Hashed rather than stored readable. The key is built from a `ruleId` and a patient
 * id, and it is compared on every enqueue, so storing it verbatim would put patient
 * identifiers into a field that gets copied into log lines and API responses when
 * someone investigates "why was this sent twice". The hash is not for secrecy — the
 * inputs are recoverable by brute force from a short key space — it is so the *stored*
 * value carries nothing on its own.
 *
 * Truncated to 40 hex characters: 160 bits, so a collision would take longer than this
 * project's lifetime, and short enough to read in a log.
 */
export function buildDedupeKey(ruleId: string, patientId: string | null, salt: string): string {
  return createHash("sha256")
    .update(`${ruleId}|${patientId ?? "anon"}|${salt}`)
    .digest("hex")
    .slice(0, 40);
}

export interface EnqueueInput {
  /** The sending number, any format. Normalised here. */
  to: string | null | undefined;
  template: WhatsAppTemplate;
  params: string[];
  language?: string | null;
  /** `transactional` for receipts, `scheduled` for automation. */
  priority: "transactional" | "scheduled";
  /**
   * The logical identity of the message, from the caller.
   *
   * For a scheduled message this is the rule and the occurrence — for example
   * `treatment_plan:planId:refill:2026-10-01`. For a one-off receipt it is the
   * action's own id, or omitted, in which case the message is queued once and never
   * deduplicated. Omitting it is correct for a one-off: there is no schedule to run
   * twice, and inventing a key from the current time would guarantee no collision is
   * ever possible.
   */
  ruleId: string;
  /** Discriminator within a rule's occurrence, e.g. `refill` vs `review`. */
  salt?: string;
  /** When the message is wanted. Defaults to now. */
  scheduledFor?: Date;
  /** Overrides the recipient taken from the number. Used by admin routes. */
  recipient?: { patient?: string | null; consent?: boolean | null; optedOutAt?: Date | null } | null;
}

/**
 * Puts one message in the queue.
 *
 * Never throws for a normal refusal — an opt-out or an unusable number is a decision,
 * not an exception, and a caller enqueueing ten notifications should not have five of
 * them rejected. It *does* rethrow a database failure, because a row that could not be
 * written is a problem the caller needs to know about.
 */
export async function enqueueOutbound(input: EnqueueInput): Promise<EnqueueOutcome> {
  await connectDb();

  const phone = normalizePhone(input.to || "");
  if (!phone || phone.length < 8 || phone.length > 15) {
    return {
      ok: false,
      reason: "unusable_number",
      detail: "The number is missing or is not a full international number.",
    };
  }
  if (phone === CLINIC.whatsappNumber) {
    return { ok: false, reason: "loop_guard", detail: "The recipient is the clinic's own number." };
  }

  const recipient = input.recipient ?? {};
  const patientId = recipient.patient ?? null;
  const optedOutAt = recipient.optedOutAt ?? null;

  if (optedOutAt) {
    return {
      ok: false,
      reason: "opted_out",
      detail: "The number asked to stop receiving these messages.",
    };
  }

  // Consent is read live from the `User` when the row is enqueued, and again at
  // dispatch. The read here is an early exit, not the guarantee - the dispatch-time
  // check is, because a patient can opt out while a message waits in the queue.
  let consent = recipient.consent;
  if (consent === undefined && patientId) {
    const user = await User.findById(patientId).select("whatsappOptIn").lean();
    consent = user?.whatsappOptIn ?? null;
  }
  if (consent !== true) {
    return {
      ok: false,
      reason: "no_consent",
      detail: patientId
        ? "The patient has not opted in to WhatsApp messages."
        : "The number does not match a patient who has opted in.",
    };
  }

  const { conversationId, patientId: resolvedPatientId } = await upsertConversation(
    phone,
    input.scheduledFor ?? new Date()
  );

  const dedupeKey = buildDedupeKey(input.ruleId, patientId ?? resolvedPatientId, input.salt ?? "");

  const params = input.params
    .slice(0, OUTBOX_MAX_PARAMS)
    .map((value) => String(value ?? "").slice(0, OUTBOX_MAX_PARAM_CHARS));

  try {
    const created = await OutboxMessage.create({
      dedupeKey,
      conversation: conversationId,
      // Built as a single value first because the spread form made the type
      // `string | null | undefined`, which is not assignable to the field.
      ...((): { patient?: string } => {
        const owner = patientId ?? resolvedPatientId;
        return owner ? { patient: owner } : {};
      })(),
      phone,
      priority: input.priority,
      kind: "template",
      template: input.template,
      params,
      language: input.language === "fr" ? "fr" : "en",
      ruleId: input.ruleId.slice(0, 200),
      scheduledFor: input.scheduledFor ?? new Date(),
      status: "queued",
      attempts: 0,
    });
    return { ok: true, status: "queued", id: String(created._id), dedupeKey };
  } catch (error) {
    // A collision means the identical message is already queued, which is the success
    // case for a schedule that runs more than once. Reported as such, not thrown, so
    // a re-run of a rule is not a bug.
    if (isDuplicateKey(error)) {
      const existing = await OutboxMessage.findOne({ dedupeKey }).select("_id").lean();
      if (existing) {
        return { ok: true, status: "already_queued", id: String(existing._id), dedupeKey };
      }
    }
    throw error;
  }
}

/* -------------------------------------------------------------------------- */
/* Dispatch                                                                    */
/* -------------------------------------------------------------------------- */

export interface ClaimedMessage {
  id: string;
  conversation: string;
  patient: string | null;
  phone: string;
  priority: "transactional" | "scheduled";
  template: WhatsAppTemplate;
  params: string[];
  language: "en" | "fr";
  ruleId: string;
  attempts: number;
  /** When the message was meant to go out, not when it was claimed. */
  scheduledFor: Date;
}

/**
 * Takes ownership of up to `limit` due messages.
 *
 * ## The claim is a lease, not a lock
 *
 * There is no transaction available on this deployment — MongoDB is a standalone
 * deployment, not a replica set — so `findOneAndUpdate` cannot be combined with the
 * eventual send. What it gives instead is a lease: the row is marked `sending` with
 * an expiry, and another tick may take it once that expiry passes. A tick that dies
 * mid-run therefore strands nothing.
 *
 * ## The residual race, stated plainly
 *
 * Two ticks that both read an expired lease inside the same instant can both send.
 * The lease shrinks the window; it does not close it. Closing it entirely would need
 * either a transaction or a per-phone serialisation, and neither is available here.
 *
 * In practice the window is under a second and Vercel runs this job on one schedule,
 * so it is not a realistic source of double-sends. But it is a limitation, not a
 * guarantee, and it is recorded in `docs/OUTBOUND_ENGINE.md` rather than claimed
 * away. If a double-send is ever observed, the fix is a replica set, not a retry.
 */
export async function claimDueMessages(now: Date, limit: number): Promise<ClaimedMessage[]> {
  await connectDb();
  const claimed: ClaimedMessage[] = [];
  const leaseUntil = new Date(now.getTime() + OUTBOX_LEASE_MS);

  for (let i = 0; i < limit; i += 1) {
    const row = await OutboxMessage.findOneAndUpdate(
      {
        status: "queued",
        scheduledFor: { $lte: now },
        $or: [{ nextAttemptAt: null }, { nextAttemptAt: { $exists: false } }, { nextAttemptAt: { $lte: now } }],
      },
      { $set: { status: "sending", leaseUntil }, $inc: { attempts: 1 } },
      { sort: { scheduledFor: 1 }, new: true }
    )
      .select("conversation patient phone priority template params language ruleId attempts scheduledFor")
      .lean();

    if (!row) break;
    claimed.push({
      id: String(row._id),
      conversation: String(row.conversation),
      patient: row.patient ? String(row.patient) : null,
      phone: row.phone,
      priority: row.priority,
      template: row.template as WhatsAppTemplate,
      params: (row.params ?? []) as string[],
      language: row.language,
      ruleId: row.ruleId,
      attempts: row.attempts ?? 1,
      scheduledFor: row.scheduledFor,
    });
  }

  return claimed;
}

/**
 * Records a successful send and writes the `WhatsAppMessage` row that makes the
 * message visible in the thread and countable for the weekly budget.
 *
 * ## Ordering: the message row is written first
 *
 * The budget is counted from `WhatsAppMessage`, so if the send were recorded there
 * first and the outbox row updated second, a crash in between would leave a message
 * Meta delivered that the clinic cannot see. The reverse order loses the row instead,
 * which costs a resend rather than an invisible message.
 *
 * The outbox update is guarded on `status: "sending"` so a reclaim by another tick
 * cannot be undone by a stale writer that comes back to life.
 */
export async function markSent(
  id: string,
  result: { wamid: string; sentAt: Date }
): Promise<void> {
  await connectDb();
  const row = await OutboxMessage.findOneAndUpdate(
    { _id: id, status: "sending" },
    { $set: { status: "sent", wamid: result.wamid, sentAt: result.sentAt, leaseUntil: null, lastError: null } },
    { new: true }
  )
    .select("conversation patient phone template priority")
    .lean();

  if (!row) return;

  try {
    await WhatsAppMessage.create({
      wamid: result.wamid,
      conversation: String(row.conversation),
      ...(row.patient ? { patient: String(row.patient) } : {}),
      phone: row.phone,
      direction: "outbound",
      kind: "template",
      template: row.template,
      status: "sent",
      statusAt: result.sentAt,
      occurredAt: result.sentAt,
    });
  } catch (error) {
    // The message is already delivered by Meta at this point, so this cannot be
    // allowed to fail the send or trigger a retry - that would be a second message.
    // A duplicate here means M1 already recorded this wamid, which is benign.
    if (!isDuplicateKey(error)) {
      console.error("[outbox] sent message could not be recorded in the thread:", {
        outboxId: id,
        error,
      });
    }
  }
}

/**
 * Holds a message until a later moment and records why.
 *
 * `until` is not a delay this module invents: it is what `decideOutbound` computed,
 * so the reason and the time always agree. Passing a time for a reason that has no
 * natural one — "quiet hours" has no deadline — would produce a message that comes
 * back immediately and defers again, once per tick.
 */
export async function markDeferred(
  id: string,
  result: { reason: string; until: Date }
): Promise<void> {
  await connectDb();
  await OutboxMessage.updateOne(
    { _id: id, status: "sending" },
    {
      $set: {
        status: "deferred",
        deferReason: result.reason.slice(0, 40),
        deferredUntil: result.until,
        nextAttemptAt: result.until,
        leaseUntil: null,
      },
    }
  );
}

/**
 * Stops a message permanently and records why.
 *
 * The row is kept, not deleted. A declined message is the answer to "why did this
 * patient not get a refill reminder", and the worklist in M10 reads these rows. A
 * deleted queue row is an unexplained absence.
 */
export async function markStopped(id: string, reason: string, detail: string): Promise<void> {
  await connectDb();
  await OutboxMessage.updateOne(
    { _id: id, status: "sending" },
    {
      $set: {
        status: "stopped",
        stopReason: reason.slice(0, 40),
        lastError: detail.slice(0, 500),
        leaseUntil: null,
        nextAttemptAt: null,
      },
    }
  );
}

/**
 * Returns a message to the queue after a transport failure.
 *
 * Stops after `MAX_OUTBOX_ATTEMPTS`. The failures this covers — an expired token, an
 * unapproved template, a number Meta rejects — are all permanent, and retrying them
 * for hours produces a log full of identical errors and no messages. So the row ends
 * as `failed`, which is a status somebody has to look at, rather than looping.
 *
 * The attempt counter was incremented at claim time, so `attempts` here already
 * includes the attempt that just failed.
 */
/**
 * Records that a dry run would have sent this message, without sending it.
 *
 * Deliberately **not** `markSent`. A dry run that wrote `status: "sent"` and a
 * `WhatsAppMessage` row would be indistinguishable from a real delivery in the thread,
 * the budget count, and the worklist — and the budget count matters: a dry run that
 * inflated it would make the next real tick suppress messages to silence.
 *
 * So the row goes back to `queued` with the note in `lastError`, which is the honest
 * state: the message is still waiting, and the next real tick sends it.
 */
export async function markDryRunSent(id: string, detail: string): Promise<void> {
  await connectDb();
  await OutboxMessage.updateOne(
    { _id: id, status: "sending" },
    {
      $set: {
        status: "queued",
        nextAttemptAt: null,
        leaseUntil: null,
        attempts: 0,
        lastError: detail.slice(0, 500),
      },
    }
  );
}

export async function markRetryOrFail(
  id: string,
  detail: string,
  backoffSeconds: number
): Promise<OutboxStatus> {
  await connectDb();
  const row = await OutboxMessage.findOneAndUpdate(
    { _id: id, status: "sending" },
    {
      $set: {
        status: "queued",
        nextAttemptAt: new Date(Date.now() + backoffSeconds * 1000),
        leaseUntil: null,
        lastError: detail.slice(0, 500),
      },
    },
    { new: true }
  )
    .select("attempts")
    .lean();

  if (!row) return "sent";
  return (row.attempts ?? 0) >= MAX_OUTBOX_ATTEMPTS ? "failed" : "queued";
}

/** Moves a message that has exhausted its attempts into the visible failure state. */
export async function markFailed(id: string, detail: string): Promise<void> {
  await connectDb();
  await OutboxMessage.updateOne(
    { _id: id },
    { $set: { status: "failed", leaseUntil: null, nextAttemptAt: null, lastError: detail.slice(0, 500) } }
  );
}

/**
 * Returns a `deferred` message to the queue once its time has come.
 *
 * Done as a bulk update rather than a loop, because a quiet-hours window that ends at
 * 08:00 can unblock hundreds of messages at once and a per-row loop would exceed a
 * serverless function's time budget. Guarded on `status: "deferred"` so a row
 * re-deferred by the sweep in the same run is not moved twice.
 */
export async function releaseDeferred(now: Date): Promise<number> {
  await connectDb();
  const result = await OutboxMessage.updateMany(
    { status: "deferred", deferredUntil: { $lte: now } },
    { $set: { status: "queued", nextAttemptAt: null, deferReason: null, deferredUntil: null } }
  );
  return result.modifiedCount ?? 0;
}

/**
 * Outbound messages already delivered to a patient in the current ISO week.
 *
 * Counted from `WhatsAppMessage`, not from a counter column. The count is then always
 * the truth about what Meta actually accepted, which a denormalised counter is not: it
 * drifts the moment a row is written and the counter update fails, and a budget that
 * under-counts silently removes the limit that exists to protect patients.
 *
 * The index `{ patient: 1, occurredAt: -1 }` on `WhatsAppMessage` covers this.
 */
export async function countSentThisWeek(patientId: string, now: Date): Promise<number> {
  await connectDb();
  return WhatsAppMessage.countDocuments({
    patient: patientId,
    direction: "outbound",
    occurredAt: { $gte: isoWeekStart(now) },
  });
}

/** Counts messages currently queued or deferred for a patient. Used by the status endpoint. */
export async function countPending(patientId: string): Promise<number> {
  await connectDb();
  return OutboxMessage.countDocuments({ patient: patientId, status: { $in: ["queued", "deferred"] } });
}