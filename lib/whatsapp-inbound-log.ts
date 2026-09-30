import "server-only";

import { connectDb } from "@/lib/db";
import { CLINIC } from "@/lib/site";
import { User } from "@/lib/models/User";
import { Conversation } from "@/lib/models/Conversation";
import { WhatsAppMessage } from "@/lib/models/WhatsAppMessage";
import { recordEvent } from "@/lib/event-log";
import { eventKey, patientActor } from "@/lib/events";
import { upsertConversation } from "@/lib/conversations";
import { recordAppLog } from "@/lib/app-log";
import {
  classifyInbound,
  needsHuman,
  optOutEffects,
  windowExpiryFor,
  type InboundIntent,
  type InboundMessage,
  type InboundStatus,
  type ParsedWebhook,
} from "@/lib/whatsapp-inbound";

/**
 * The one place an inbound WhatsApp message is turned into clinic state.
 *
 * Mirrors `lib/notify.ts` and `lib/event-log.ts` in spirit - a notification
 * failure must never break the thing that triggered it - but with one crucial
 * difference. Here, *not persisting* is the failure that matters. A message that
 * arrives and is then dropped is a patient reaching out and being ignored, and
 * there is no second copy. So this module reports precisely what it could not
 * store, and the route answers `503` so Meta redelivers rather than letting a
 * message die.
 *
 * ## The ordering, and why it is this ordering
 *
 * ```
 *   loop guard -> find/create conversation -> INSERT MESSAGE -> side effects
 * ```
 *
 * The insert sits **before** the side effects on purpose. `wamid` carries a unique
 * index, so the insert is the deduplication: a redelivery collides, throws
 * `E11000`, and the code knows not to do the rest. Every side effect below is
 * therefore applied at most once per real message.
 *
 * Doing it the other way round - update the counters, then insert - would increment
 * `unread` and reopen the service window on every redelivery, for hours, with
 * nothing to stop it. A patient would show five unread messages when they had sent
 * one.
 *
 * The conversation is created *before* the insert only because the message row
 * needs its id. That step is deliberately free of side effects (`$setOnInsert` and
 * the minimum), so repeating it on a redelivery changes nothing.
 */

export interface InboundSummary {
  /** False only when the database was unreachable; the route must then 503. */
  ok: boolean;
  received: number;
  stored: number;
  duplicates: number;
  /** Messages this app could not read, with reasons. */
  rejected: string[];
  /** Messages from the clinic's own number, dropped as a loop. */
  ignoredSelf: number;
  /** Readable but not persisted. Non-zero means Meta should be told to retry. */
  failed: number;
  /** Threads flagged for a human by this batch. */
  needsAttention: number;
  /** Consent revocations applied. */
  optOuts: number;
  statusesApplied: number;
  error?: string;
}

/** Longest preview kept on the conversation row. */
const PREVIEW_MAX = 200;

/**
 * A one-line description of what a message was, for the staff inbox.
 *
 * Never the full body. The inbox shows a list of threads, and a list that renders
 * a patient's full medical description 40 times down the page is unreadable and
 * puts their health data on a screen that is not about them.
 */
function previewFor(intent: InboundIntent, message: InboundMessage): string {
  if (intent.kind === "button") {
    return intent.action === "stop" ? "Asked to stop WhatsApp messages" : `Tapped "${intent.action}"`;
  }
  if (intent.kind === "unknown_button") {
    return "Tapped a button this version does not recognise";
  }
  if (intent.kind === "free_text") {
    const collapsed = message.text?.replace(/\s+/g, " ").trim() ?? "";
    return collapsed.length > 0
      ? collapsed.slice(0, PREVIEW_MAX)
      : "Sent an empty message";
  }
  if (intent.kind === "media") return `Sent a ${intent.kind_}`;
  if (intent.kind === "structural") return `Sent a ${intent.kind_.replace("_", " ")}`;
  return "Sent something this version cannot read";
}

/**
 * The `PatientEvent` summary for an inbound message.
 *
 * A short quote, capped well below the 300-character field limit, because this
 * line is rendered in a timeline next to consultations and lab results. A patient
 * writing "my sugar was 180 this morning" is genuinely useful there; a pasted
 * essay is not.
 */
function eventSummaryFor(intent: InboundIntent, message: InboundMessage): string {
  if (intent.kind === "button") {
    return intent.action === "stop"
      ? "Patient opted out of WhatsApp messages"
      : `Patient tapped the "${intent.action}" button on WhatsApp`;
  }
  if (intent.kind === "unknown_button") return "Patient tapped an unrecognised WhatsApp button";
  if (intent.kind === "free_text") {
    const text = (message.text ?? "").replace(/\s+/g, " ").trim();
    return text ? `Patient wrote on WhatsApp: "${text.slice(0, 160)}"` : "Patient sent an empty WhatsApp message";
  }
  if (intent.kind === "media") return `Patient sent a ${intent.kind_} on WhatsApp`;
  if (intent.kind === "structural") return `Patient sent a ${intent.kind_.replace("_", " ")} on WhatsApp`;
  return "Patient sent an unreadable WhatsApp message";
}

/** Mongoose's duplicate-key code, checked without importing Mongoose. */
function isDuplicateKey(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: number }).code === 11000;
}



/**
 * Records one inbound message.
 *
 * Returns `"stored"` only when the message and every consequence of it are on
 * disk. `"duplicate"` means Meta redelivered something already handled. Anything
 * else is counted as failed so the caller can ask for a retry.
 */
async function receiveOne(
  message: InboundMessage,
  summary: InboundSummary
): Promise<"stored" | "duplicate" | "failed"> {
  const occurredAt = new Date(message.timestamp);
  // The shared resolver also settles the thread's patient link, which is what lets
  // an opt-out from this number reach the `User` record below.
  const { conversationId, patientId } = await upsertConversation(message.from, occurredAt);

  // The deduplication point. Nothing below has happened yet, so a collision here
  // costs nothing.
  try {
    await WhatsAppMessage.create({
      wamid: message.wamid,
      conversation: conversationId,
      phone: message.from,
      direction: "inbound",
      kind: message.kind,
      ...(message.text ? { text: message.text } : {}),
      ...(message.payload ? { payload: message.payload } : {}),
      ...(message.mediaId ? { mediaId: message.mediaId } : {}),
      occurredAt,
    });
  } catch (error) {
    if (isDuplicateKey(error)) return "duplicate";
    throw error;
  }

  // Past this point the message is durably stored, so it will not be lost even if
  // a later step throws. Each remaining step is therefore isolated.
  const intent = classifyInbound(message);
  const attention = needsHuman(intent);
  const windowExpiresAt = windowExpiryFor(message.timestamp);

  await Conversation.findByIdAndUpdate(
    conversationId,
    {
      $set: {
        lastMessageAt: occurredAt,
        lastMessagePreview: previewFor(intent, message),
        lastInboundAt: occurredAt,
        windowExpiresAt,
        ...(attention ? { needsAttention: true } : {}),
      },
      $inc: { unread: 1 },
    }
  );

  // Taken from the resolver's own result rather than re-read here: this call already
  // settled the link, and reading it back would be a second round trip to learn
  // something already in hand.
  const patient = patientId;

  // Resolved only now that the patient link is known, and deliberately *not*
  // gated on there being one. An opt-out from a number that is not a patient still
  // marks the conversation, because that row is the only place the refusal can
  // live: there is no `User` to record it on, and without it the request
  // evaporates the moment staff later link the number to a patient.
  const optOut = optOutEffects(intent, Boolean(patient));
  if (optOut.marksConversation) {
    await Conversation.updateOne(
      { _id: conversationId, optedOut: { $exists: false } },
      { $set: { optedOut: occurredAt } }
    );
  }

  // Only consulted for the thread's captured name, which is set once at first contact
  // and never overwritten by a later rename.
  const conversation = await Conversation.findById(conversationId)
    .select("displayName")
    .lean();

  const displayName =
    conversation?.displayName || (patient ? undefined : maskPhone(message.from));

  if (patient) {
    await WhatsAppMessage.updateOne({ wamid: message.wamid }, { $set: { patient } });
  }

  // Only a *known* patient can have an event appended. An unknown number has no
  // record to attach one to, and inventing one is how a stranger's message ends up
  // on somebody else's chart.
  if (patient) {
    await recordEvent({
      patient,
      type: "message",
      at: occurredAt,
      actor: patientActor(patient),
      source: "whatsapp",
      summary: eventSummaryFor(intent, message),
      // Content-derived from Meta's own id, so every redelivery collapses onto the
      // original event rather than telling the patient's timeline they said it
      // five times.
      dedupeKey: eventKey("whatsapp", message.wamid),
      data: {
        wamid: message.wamid,
        kind: message.kind,
        intent: intent.kind,
        ...(message.action ? { action: message.action } : {}),
        ...(intent.kind === "free_text" ? { text: message.text } : {}),
        ...(message.timestampAssumed ? { timestampAssumed: true } : {}),
      },
    });
  }

  if (optOut.marksConversation) {
    summary.optOuts += 1;
  }

  if (optOut.revokesConsent && patient) {
    await applyOptOut(patient, message, occurredAt, intent);
  }

  if (attention) summary.needsAttention += 1;

  // Give the thread a name the first time it is seen, so the inbox shows
  // "237…9899" for an unknown sender and a name once linked.
  if (displayName) {
    await Conversation.updateOne(
      { _id: conversationId, displayName: { $exists: false } },
      { $set: { displayName } }
    );
  }

  return "stored";
}

/**
 * Revokes WhatsApp consent.
 *
 * `whatsappOptInAt` is deliberately left alone. It is Meta's evidence of *when
 * consent was granted*, and destroying it would make a later audit unable to show
 * that consent ever existed. The revocation itself is appended to the
 * append-only `PatientEvent` log as a `consent` event, which is exactly what an
 * event log is for - and it means the two facts are never conflated on one row.
 */
async function applyOptOut(
  patient: string,
  message: InboundMessage,
  occurredAt: Date,
  intent: InboundIntent
): Promise<void> {
  await User.updateOne({ _id: patient }, { $set: { whatsappOptIn: false } });
  await recordEvent({
    patient,
    type: "consent",
    at: occurredAt,
    actor: patientActor(patient),
    source: "whatsapp",
    importance: "notable",
    summary:
      intent.kind === "button" && intent.action === "stop"
        ? "Patient opted out of WhatsApp messages using the stop button"
        : "Patient opted out of WhatsApp messages by replying STOP",
    dedupeKey: eventKey("whatsapp-optout", message.wamid),
    data: { wamid: message.wamid, channel: "whatsapp", granted: false },
  });
}

/**
 * A number an inbox can show without being a phone number on a shared screen.
 *
 * Only ever used for an *unresolved* sender, where the staff member has no other
 * way to know who is talking. Once a conversation is linked to a patient the real
 * name is used instead.
 */
function maskPhone(digits: string): string {
  const tail = digits.slice(-4);
  return tail.length === 4 ? `+…${tail}` : "unknown sender";
}

/**
 * Applies a delivery receipt to the message it refers to.
 *
 * Recorded in M1 because the data arrives on this same webhook and is worthless
 * if not captured on the way past. Note the guard against going backwards: Meta
 * can deliver receipts out of order, and a late `sent` must not overwrite a
 * `read` that has already arrived, or a delivered report would appear to have
 * failed.
 */
const STATUS_RANK: Record<string, number> = {
  sent: 0,
  delivered: 1,
  read: 2,
  failed: 3,
  deleted: 4,
};

async function applyStatus(status: InboundStatus, summary: InboundSummary): Promise<void> {
  const existing = await WhatsAppMessage.findOne({ wamid: status.wamid })
    .select("status direction")
    .lean();
  if (!existing || existing.direction !== "outbound") return;

  if (
    existing.status &&
    STATUS_RANK[existing.status] !== undefined &&
    STATUS_RANK[status.status] < STATUS_RANK[existing.status]
  ) {
    return;
  }

  await WhatsAppMessage.updateOne(
    { wamid: status.wamid },
    {
      $set: {
        status: status.status,
        statusAt: new Date(status.timestamp),
        ...(status.code !== undefined ? { statusCode: status.code } : {}),
        ...(status.detail ? { statusDetail: status.detail } : {}),
      },
    }
  );

  const owner = await WhatsAppMessage.findOne({ wamid: status.wamid })
    .select("conversation")
    .lean();
  if (owner) {
    await Conversation.updateOne(
      { _id: String(owner.conversation) },
      { $set: { lastStatus: status.status, lastStatusAt: new Date(status.timestamp) } }
    );
  }

  summary.statusesApplied += 1;
}

/**
 * Processes one webhook delivery.
 *
 * Nothing here throws. Every failure is counted and reported, because the route
 * needs to know whether to answer `200` or `503`, and a thrown exception tells it
 * only that something broke, not whether a patient lost a message.
 */
export async function receiveInbound(payload: ParsedWebhook): Promise<InboundSummary> {
  const summary: InboundSummary = {
    ok: true,
    received: payload.messages.length,
    stored: 0,
    duplicates: 0,
    rejected: payload.rejected,
    ignoredSelf: 0,
    failed: 0,
    needsAttention: 0,
    optOuts: 0,
    statusesApplied: 0,
  };

  if (payload.messages.length === 0 && payload.statuses.length === 0) return summary;

  const conn = await connectDb();
  if (!conn) {
    // The only whole-batch failure. Meta will redeliver, and by then the database
    // may be back.
    return { ...summary, ok: false, error: "database unavailable" };
  }

  for (const message of payload.messages) {
    // A message from the clinic's own number is a loop, not a patient. Meta does
    // not normally echo our own sends, but a staff member forwarding a thread to
    // the clinic line would, and treating that as a patient message would start a
    // conversation with ourselves.
    if (message.from === CLINIC.whatsappNumber) {
      summary.ignoredSelf += 1;
      continue;
    }

    try {
      const outcome = await receiveOne(message, summary);
      if (outcome === "stored") summary.stored += 1;
      else if (outcome === "duplicate") summary.duplicates += 1;
    } catch (error) {
      summary.failed += 1;
      // The message text is deliberately absent from this log. An inbound message
      // can be a patient's description of a symptom, and the error log is
      // somewhere it should not end up.
      console.error("[whatsapp-inbound] could not store message:", {
        wamid: message.wamid,
        kind: message.kind,
        error,
      });
    }
  }

  for (const status of payload.statuses) {
    try {
      await applyStatus(status, summary);
    } catch (error) {
      console.error("[whatsapp-inbound] could not apply delivery status:", {
        wamid: status.wamid,
        status: status.status,
        error,
      });
    }
  }

  if (summary.failed > 0 || summary.rejected.length > 0) {
    await recordAppLog({
      level: "warn",
      source: "request",
      scope: "whatsapp-inbound",
      message: `Inbound WhatsApp delivery was not fully processed (${summary.failed} failed, ${summary.rejected.length} unreadable)`,
      context: JSON.stringify({
        received: summary.received,
        stored: summary.stored,
        duplicates: summary.duplicates,
        failed: summary.failed,
        rejected: summary.rejected.slice(0, 5),
        ignoredSelf: summary.ignoredSelf,
      }),
      route: "/api/webhooks/whatsapp",
      method: "POST",
      status: summary.failed > 0 ? 503 : 200,
    });
  }

  return summary;
}
