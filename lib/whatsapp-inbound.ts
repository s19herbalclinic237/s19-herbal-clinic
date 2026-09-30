import { parseButtonPayload, type WhatsAppAction } from "@/lib/whatsapp-templates";

/**
 * Reading Meta's inbound webhook payload, and deciding what each message means.
 *
 * ## Why this module is pure
 *
 * It is the boundary between a third party's JSON and the patient record, and it
 * is where the trust decisions live: which fields may be believed, which may not,
 * what an unrecognised shape means, and what a message is allowed to cause.
 *
 * None of that needs a database, so none of it is given one. `lib/whatsapp-inbound-log.ts`
 * is the only thing here that writes. That split is what lets every hostile input
 * below - a forged timestamp, a 40-megabyte string, an unknown button, a body
 * claiming to be something it is not - be tested as plain function calls, rather
 * than by standing up Mongo and posting at it.
 *
 * ## What this module deliberately does not do
 *
 * It does not decide whether to *reply*. Answering a patient is M13's job and
 * needs clinic-approved content, which does not exist yet. What it decides is what
 * the message **is** - which is a closed, enumerable question, and therefore one
 * that can be answered correctly by a lookup table with no model involved.
 *
 * Anything not in the table is reported as needing a human. There is no branch
 * anywhere in this file that guesses.
 */

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

/** Meta's inbound `messages[].type`, plus what this app calls the rest. */
export type InboundKind =
  | "text"
  | "button"
  | "image"
  | "document"
  | "audio"
  | "video"
  | "sticker"
  | "location"
  | "contacts"
  | "interactive"
  | "reaction"
  | "system"
  | "unsupported";

export interface InboundMessage {
  /** Meta's message id. Unique per message and the basis of idempotency. */
  wamid: string;
  /** Sender, digits only, no `+`. The conversation key. */
  from: string;
  /** When Meta says it was sent, in ms. Not when we received it. */
  timestamp: number;
  kind: InboundKind;
  /** Body text, for `text` messages. Already length-capped. */
  text?: string;
  /** Raw button payload, for `button` messages. Not yet interpreted. */
  payload?: string;
  /** Set when the payload belongs to this application's namespace. */
  action?: WhatsAppAction;
  /** True when the payload came from outside `s19:` and is therefore unknown. */
  foreignPayload?: boolean;
  /** Media or document id, when the message carries one. Metadata only - M1
   *  does not download patient media. */
  mediaId?: string;
  /** The clinic number the message arrived on. Used to detect a misrouted event. */
  displayPhoneNumber?: string;
  /** True when Meta's own timestamp was missing or unusable and `timestamp` was
   *  substituted. Surfaced so a suspicious payload is visible rather than hidden
   *  behind a plausible-looking date. */
  timestampAssumed: boolean;
}

export type DeliveryStatus =
  | "sent"
  | "delivered"
  | "read"
  | "failed"
  | "deleted";

export interface InboundStatus {
  /** The id of the outbound message this receipt is about. */
  wamid: string;
  status: DeliveryStatus;
  timestamp: number;
  /** Meta's error code, present on `failed`. */
  code?: number;
  /** Meta's human-readable failure text, present on `failed`. */
  detail?: string;
}

export interface ParsedWebhook {
  messages: InboundMessage[];
  statuses: InboundStatus[];
  /**
   * Set when the body was not a webhook payload at all. The whole delivery is
   * then untrustworthy and the route answers 400.
   */
  malformed: string | null;
  /**
   * Messages that were present but unusable, with the reason for each.
   *
   * Kept separate from `malformed` on purpose. One unreadable message inside an
   * otherwise good delivery is not a reason to reject the rest - a batch may
   * contain a system notice we do not model alongside a patient's real message,
   * and throwing away the second to be strict about the first loses a real
   * message from a real patient.
   */
  rejected: string[];
}

/* ------------------------------------------------------------------ */
/* Limits                                                              */
/* ------------------------------------------------------------------ */

/** Longest inbound text kept. WhatsApp allows far more; a patient is not writing
 *  a novel, and an unbounded string in a health record is a storage liability. */
export const INBOUND_TEXT_MAX = 4096;

/** Longest button payload. Matches the WhatsApp button-id cap. */
const PAYLOAD_MAX = 256;

/**
 * How far ahead of our own clock a Meta timestamp may sit.
 *
 * The 24-hour window is computed from this value, so a forged or clock-skewed
 * future timestamp would hand a patient or a bot a free-form sending window that
 * should not exist. Five minutes is generous for genuine clock drift and is
 * reached by nobody honestly.
 */
export const TIMESTAMP_FUTURE_TOLERANCE_MS = 5 * 60 * 1000;

/**
 * How far back a timestamp may be before it is treated as a redelivery.
 *
 * Meta retries over days, so old timestamps are normal and must still be
 * deduplicated rather than rejected. This bound is only here to stop a
 * pathological value (`0`, or year 1970) from opening a 24-hour window that has
 * silently expired - or worse, one that never expires.
 */
export const TIMESTAMP_PAST_LIMIT_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Meta's customer service window: 24 hours from the last inbound message.
 *
 * Inside it, the clinic may reply with free text and no approved template.
 * Outside it, every message must use a template. This is the single fact that
 * makes conversational automation affordable, and it is why M1 owns
 * `windowExpiresAt` - the inbound message is what *opens* the window, so the
 * writer that handles inbound is the only place that can set it correctly.
 */
export const SERVICE_WINDOW_MS = 24 * 60 * 60 * 1000;

/* ------------------------------------------------------------------ */
/* Normalisation                                                       */
/* ------------------------------------------------------------------ */

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

/** Digits only, the same canonical form `lib/auth.ts` uses for phone lookups. */
export function inboundPhone(raw: unknown): string {
  return typeof raw === "string" ? raw.replace(/\D/g, "") : "";
}

/**
 * A usable sender number, or null.
 *
 * Eight digits is the floor, matching `lib/whatsapp.ts`. A shorter `from` is not
 * a patient with a missing country code - it is a malformed or hostile field, and
 * treating it as a number would create a conversation row keyed on nothing.
 */
export function usableInboundPhone(raw: unknown): string | null {
  const digits = inboundPhone(raw);
  if (digits.length < 8 || digits.length > 15) return null;
  return digits;
}

/**
 * Converts Meta's millisecond timestamp into something the window logic can use.
 *
 * Falls back to `now` when the value is missing or unparseable, and says so via
 * the second return value. Substituting `now` is the right failure: refusing the
 * message would lose a real patient's message over a field the patient does not
 * control, whereas an assumed timestamp only costs the accuracy of the recorded
 * time. The flag keeps it visible.
 */
export function normaliseInboundTimestamp(
  raw: unknown,
  now: number
): { timestamp: number; assumed: boolean } {
  const parsed = typeof raw === "string" ? Number(raw) : typeof raw === "number" ? raw : NaN;
  if (!Number.isFinite(parsed) || parsed <= 0) return { timestamp: now, assumed: true };

  // Clamped, not rejected, and in both directions:
  //  - a timestamp from the future would extend the service window beyond 24h;
  //  - a timestamp from 1970 would compute a window that expired before the
  //    message was even received, silently closing it and forcing a template on
  //    a patient who is mid-conversation.
  const ceiling = now + TIMESTAMP_FUTURE_TOLERANCE_MS;
  const floor = now - TIMESTAMP_PAST_LIMIT_MS;
  if (parsed > ceiling) return { timestamp: ceiling, assumed: true };
  if (parsed < floor) return { timestamp: floor, assumed: true };
  return { timestamp: parsed, assumed: false };
}

/** When the 24-hour free-text window closes for a message sent at `timestamp`. */
export function windowExpiryFor(timestamp: number): Date {
  return new Date(timestamp + SERVICE_WINDOW_MS);
}

/**
 * Whether free-form replies are still legal at `now`. M2 reads this.
 *
 * Accepts a string as well as a `Date`, because M2 reads `windowExpiresAt` back
 * out of Mongo where it may arrive as either depending on the driver settings.
 * Unparseable input is treated as *closed*, never as open.
 */
export function isServiceWindowOpen(
  expiresAt: Date | string | null | undefined,
  now: number
): boolean {
  if (!expiresAt) return false;
  const at = expiresAt instanceof Date ? expiresAt.getTime() : new Date(expiresAt).getTime();
  if (!Number.isFinite(at)) return false;
  return now < at;
}

/* ------------------------------------------------------------------ */
/* Message classification                                              */
/* ------------------------------------------------------------------ */

const KNOWN_KINDS: ReadonlySet<string> = new Set([
  "text",
  "button",
  "image",
  "document",
  "audio",
  "video",
  "sticker",
  "location",
  "contacts",
  "interactive",
  "reaction",
  "system",
]);

/**
 * Reads one `value.messages[]` entry.
 *
 * Every field is treated as hostile. A `wamid` that is absent, or not a usable
 * string, makes the message **unprocessable** - and unprocessable means dropped,
 * with a reason. It is never passed downstream with a placeholder id, because
 * `wamid` is the idempotency key: a fabricated one would either collide with a
 * real message or defeat deduplication entirely.
 */
export function parseInboundMessage(entry: unknown, now: number): InboundMessage | { error: string } {
  const value = asRecord(entry);
  if (!value) return { error: "message entry was not an object" };

  const wamid = asString(value.id)?.trim() ?? "";
  if (!wamid || wamid.length > 256) {
    return { error: "message had no usable wamid" };
  }

  const from = usableInboundPhone(value.from);
  if (!from) {
    return { error: "message had no usable sender number" };
  }

  const { timestamp, assumed } = normaliseInboundTimestamp(value.timestamp, now);

  const message = asRecord(value.message);
  const rawType = message ? asString(message.type) : null;
  const type = rawType && KNOWN_KINDS.has(rawType) ? rawType : "unsupported";

  const out: InboundMessage = {
    wamid,
    from,
    timestamp,
    kind: type as InboundKind,
    timestampAssumed: assumed,
  };

  if (type === "text") {
    const text = asString(asRecord(message?.text)?.body) ?? "";
    out.text = text.slice(0, INBOUND_TEXT_MAX);
  }

  if (type === "button") {
    // Quick-reply buttons arrive as `type: "button"` with an *object* payload:
    //   { "type": "button", "button": { "payload": "s19:stop", "text": "..." } }
    // An interactive-list reply uses the other shape, `interactive.button_reply.id`,
    // and is read below. Both are handled because a template edited in the
    // WhatsApp Manager can produce either, and a patient tapping a button must not
    // be met with silence just because the shape changed.
    const raw =
      asString(asRecord(message?.button)?.payload) ??
      asString(asRecord(asRecord(message?.interactive)?.button_reply)?.id) ??
      "";
    const payload = raw.trim().slice(0, PAYLOAD_MAX);
    out.payload = payload;
    const parsed = parseButtonPayload(payload);
    if (parsed.kind === "action") out.action = parsed.action;
    else if (parsed.kind === "foreign") out.foreignPayload = true;
  }

  if (type === "interactive") {
    // An interactive list or button reply. The payload is `interactive.id`
    // directly - there is no nested `button_reply` object in the wire format, and
    // reading one that is not there is how every interactive reply arrives empty.
    const raw = asString(asRecord(message?.interactive)?.id) ?? "";
    if (raw.trim()) out.payload = raw.trim().slice(0, PAYLOAD_MAX);
  }

  if (type === "image" || type === "audio" || type === "video" || type === "sticker" || type === "document") {
    const id =
      asString(asRecord(message?.[type])?.id) ??
      asString(asRecord(message?.image)?.id) ??
      asString(asRecord(message?.document)?.id) ??
      undefined;
    if (id) out.mediaId = id.slice(0, 256);
  }

  const display = asString(asRecord(value.metadata)?.display_phone_number)?.replace(/\D/g, "");
  if (display) out.displayPhoneNumber = display;

  return out;
}

const KNOWN_STATUSES: ReadonlySet<string> = new Set([
  "sent",
  "delivered",
  "read",
  "failed",
  "deleted",
]);

/**
 * Reads one `value.statuses[]` entry - a delivery receipt for something we sent.
 *
 * Recorded in M1 because the data arrives at this same webhook and is worthless
 * if not captured on the way past. Reconciling it against an outbox is M2's job;
 * M1's obligation is to not throw it away.
 */
export function parseInboundStatus(entry: unknown, now: number): InboundStatus | null {
  const value = asRecord(entry);
  if (!value) return null;

  const wamid = asString(value.id)?.trim() ?? "";
  if (!wamid || wamid.length > 256) return null;

  const raw = asString(value.status)?.toLowerCase() ?? "";
  if (!KNOWN_STATUSES.has(raw)) return null;

  const { timestamp } = normaliseInboundTimestamp(value.timestamp, now);
  const errors = Array.isArray(value.errors) ? value.errors : [];
  const first = asRecord(errors[0]);

  return {
    wamid,
    status: raw as DeliveryStatus,
    timestamp,
    ...(first?.code !== undefined ? { code: Number(first.code) } : {}),
    ...(asString(asRecord(first?.error_data)?.details)
      ? { detail: String(asRecord(first?.error_data)?.details).slice(0, 300) }
      : {}),
  };
}

/* ------------------------------------------------------------------ */
/* Intent                                                              */
/* ------------------------------------------------------------------ */

/**
 * What the patient meant.
 *
 * A closed set, because there is no model. Every branch maps to a specific,
 * already-decided action; nothing here infers.
 */
export type InboundIntent =
  /** Tapped a clinic button whose action is in the reserved vocabulary. */
  | { kind: "button"; action: WhatsAppAction }
  /** Tapped a real button this version of the code does not recognise. */
  | { kind: "unknown_button"; payload: string }
  /** Typed something. No meaning is inferred from it. */
  | { kind: "free_text"; text: string }
  /** Media with no caption. */
  | { kind: "media"; kind_: InboundKind; mediaId?: string }
  /** A reaction, contact card, location or system notice. */
  | { kind: "structural"; kind_: InboundKind }
  /** Unrecognised or unsupported. */
  | { kind: "unsupported" };

/**
 * Words that mean "stop messaging me", in both clinic languages.
 *
 * Matched against the **whole normalised message**, never against a substring or
 * a fuzzy score. That is not caution, it is correctness: "I want to stop taking
 * this medicine" contains the word "stop", and a substring match would silently
 * unsubscribe a patient from their treatment notifications over a sentence about
 * their dosage. The same applies in French to "arrêter".
 *
 * Lower-cased and stripped of surrounding punctuation only - no accents folded, no
 * stemming. A patient who types "ARRET" without the circumflex gets a free-text
 * message to a human, which is an acceptable outcome. A patient who gets unsubscribed
 * by accident does not find out for weeks.
 */
export const OPT_OUT_WORDS: ReadonlySet<string> = new Set([
  "stop",
  "quit",
  "end",
  "unsubscribe",
  "cancel",
  "opt out",
  "stop messages",
  "arret",
  "arreter",
  "desabonner",
  "desabonnement",
  "arreter les messages",
  "arreter ces messages",
  "stopper",
]);

/** Strips case and edge punctuation, collapsing inner runs of whitespace. */
function normaliseTypedText(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^[.!?,;:]+/, "")
    .replace(/[.!?,;:]+$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Whether a typed message is an opt-out. Whole-message match only. */
export function isOptOut(text: string): boolean {
  return OPT_OUT_WORDS.has(normaliseTypedText(text));
}

/**
 * Decides what a message is asking for.
 *
 * `stop` is checked first, and against the button payload *and* the typed text.
 * An opt-out must never be dependent on the patient having found the right
 * button - Meta's requirement is that stopping is easy, and a patient who types
 * STOP deserves exactly the same outcome as one who taps the button.
 */
export function classifyInbound(message: InboundMessage): InboundIntent {
  if (message.action) {
    return { kind: "button", action: message.action };
  }

  if (message.kind === "button") {
    return { kind: "unknown_button", payload: message.payload ?? "" };
  }

  if (message.kind === "text") {
    const text = message.text ?? "";
    if (isOptOut(text)) return { kind: "button", action: "stop" };
    return { kind: "free_text", text };
  }

  if (
    message.kind === "image" ||
    message.kind === "audio" ||
    message.kind === "video" ||
    message.kind === "sticker" ||
    message.kind === "document"
  ) {
    return { kind: "media", kind_: message.kind, mediaId: message.mediaId };
  }

  if (message.kind === "interactive" || message.kind === "reaction" || message.kind === "system") {
    return { kind: "structural", kind_: message.kind };
  }

  return { kind: "unsupported" };
}

/** Whether an intent should put the conversation in front of a human. */
export function needsHuman(intent: InboundIntent): boolean {
  if (intent.kind === "button") return intent.action === "human" || intent.action === "question";
  return true;
}

/** Whether an intent stops automated messages. */
export function isOptOutIntent(intent: InboundIntent): boolean {
  return intent.kind === "button" && intent.action === "stop";
}

/**
 * What an opt-out has to change, and where.
 *
 * Split out as a pure decision so it can be tested without a database, because
 * this is the one place where an over-narrow implementation causes a real harm:
 * honouring a stop only for known patients means a stranger who asked not to be
 * contacted leaves no trace, and the refusal evaporates the moment their number
 * is later linked to a patient record.
 *
 * Both effects therefore always apply. The conversation is marked whatever the
 * sender is, because that is the only place the refusal can live when there is
 * no patient; the consent flag on the `User` is flipped only when there is one to
 * flip it on.
 */
export function optOutEffects(intent: InboundIntent, hasPatient: boolean): {
  marksConversation: boolean;
  revokesConsent: boolean;
} {
  const optedOut = isOptOutIntent(intent);
  return { marksConversation: optedOut, revokesConsent: optedOut && hasPatient };
}

/* ------------------------------------------------------------------ */
/* Payload                                                             */
/* ------------------------------------------------------------------ */

/**
 * Reads Meta's whole webhook body.
 *
 * Meta's shape is an array of `entry[]`, each with an array of `changes[]`, each
 * with a `value`. The nesting exists because one webhook serves many phone
 * numbers and many business accounts; the walk below is therefore deliberately
 * shallow-tolerant - a missing layer ends the walk, it does not throw.
 *
 * A body that is not an object at all is reported as `malformed` rather than
 * throwing, so the route can answer Meta with a 400 and a reason instead of an
 * exception it has to guess the meaning of.
 */
export function parseWebhookPayload(raw: unknown, now: number): ParsedWebhook {
  const root = asRecord(raw);
  if (!root) {
    return { messages: [], statuses: [], malformed: "payload was not a JSON object", rejected: [] };
  }

  // Meta always sends an `entry` array, for both real notifications and the
  // subscription-confirmation POST. Its absence means this is not a webhook body
  // - a misconfigured URL pointed at the app, most likely - and there is nothing
  // trustworthy in it to act on.
  if (!Array.isArray(root.entry)) {
    return { messages: [], statuses: [], malformed: "payload had no `entry` array", rejected: [] };
  }

  const messages: InboundMessage[] = [];
  const statuses: InboundStatus[] = [];
  const rejected: string[] = [];

  for (const entry of root.entry) {
    const changes = asRecord(entry)?.changes;
    if (!Array.isArray(changes)) continue;

    for (const change of changes) {
      const value = asRecord(asRecord(change)?.value);
      if (!value) continue;

      if (Array.isArray(value.messages)) {
        for (const entryMessage of value.messages) {
          const parsed = parseInboundMessage(entryMessage, now);
          if ("error" in parsed) rejected.push(parsed.error);
          else messages.push(parsed);
        }
      }

      if (Array.isArray(value.statuses)) {
        for (const entryStatus of value.statuses) {
          const parsed = parseInboundStatus(entryStatus, now);
          if (parsed) statuses.push(parsed);
        }
      }
    }
  }

  return { messages, statuses, malformed: null, rejected };
}
