import { Schema, model, models, type Model } from "mongoose";
import type { IUser } from "@/lib/models/User";

/**
 * One WhatsApp conversation, keyed by phone number.
 *
 * ## Why a conversation table at all
 *
 * Three separate things need to be true about a WhatsApp thread, and none of them
 * fit on a `User`:
 *
 *  1. **It exists before a patient is known.** Anyone can message the clinic's
 *     number. An unknown number still needs somewhere to be seen by staff, or the
 *     message is received and then silently destroyed.
 *  2. **It is not the same as the account.** A relative may message on a
 *     patient's behalf, and a patient may have one number for the portal and
 *     another for WhatsApp. Keying on `User` would force a guess.
 *  3. **It has its own clock.** Meta's 24-hour customer service window is a
 *     property of the *conversation*, not of the patient, and it is opened by an
 *     inbound message. No patient-side document can hold it.
 *
 * So this is keyed on the number, with the patient attached when - and only when -
 * the number matches a `User` record. Resolving it on every write rather than
 * caching the link is deliberate: a patient who changes their number, or a number
 * reassigned to a different account, would otherwise keep a stale link forever.
 *
 * ## What is deliberately *not* cached here
 *
 * Consent. `whatsappOptIn` lives on the `User` and is read live by the sender.
 * A cached consent flag is a compliance bug waiting to happen - the patient
 * opts out, the flag says otherwise, and the clinic keeps messaging them.
 */
export interface IConversation {
  _id: string;
  /** Digits only, E.164, no `+`. Unique: one thread per number. */
  phone: string;
  /** Set once the number matches a `User`. Absent for an unknown sender. */
  patient?: string | IUser;
  /** Captured at first contact, so a renamed patient does not change history. */
  displayName?: string;
  lastMessageAt: Date;
  lastMessagePreview: string;
  lastInboundAt?: Date;
  lastOutboundAt?: Date;
  /**
   * When Meta's 24-hour free-form window closes.
   *
   * Set by every inbound message, to `timestamp + 24h`. Inside this, the clinic
   * may reply with ordinary text and no approved template; outside it, only a
   * template is permitted. Storing it rather than recomputing it is what lets M2
   * decide *before* sending, and what stops a burst of replies from accidentally
   * consuming the window by using receipt time instead of send time.
   */
  windowExpiresAt?: Date;
  /** Unread inbound count. Reset when staff open the thread. */
  unread: number;
  /**
   * When this number asked to stop receiving automated messages, if it ever did.
   *
   * ## Why this is separate from `User.whatsappOptIn`
   *
   * Consent lives on the `User` and is always read live - a cached flag is how a
   * clinic ends up messaging someone who opted out. This field is **not** a cache
   * of it. It is the one piece of state that has nowhere else to live: a stranger
   * who messages the clinic and presses "stop" is not a patient, so there is no
   * `User` row to record the refusal on, and without somewhere to put it the only
   * trace is a message row nobody would think to query.
   *
   * The failure this prevents: staff link the number to a patient record later,
   * consent is read as absent, and the clinic starts messaging someone who
   * explicitly asked it not to.
   *
   * A date rather than a boolean, so "never asked" and "asked, and the refusal
   * stands" are distinguishable. M2 must treat *presence* as a stop regardless.
   */
  optedOut?: Date;
  /**
   * Put the thread in front of a human.
   *
   * Set when the sender is unknown, asked for a person, asked a question, or sent
   * something this application cannot classify. Cleared when staff read it. M1
   * never clears it on its own, because M1 never answers anyone.
   */
  needsAttention: boolean;
  /** Last delivery status Meta reported for anything we sent to this number. */
  lastStatus?: string;
  lastStatusAt?: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    phone: { type: String, required: true, trim: true },
    patient: { type: Schema.Types.ObjectId, ref: "User" },
    displayName: { type: String, trim: true, maxlength: 120 },
    lastMessageAt: { type: Date, required: true, default: Date.now },
    lastMessagePreview: { type: String, default: "", maxlength: 200 },
    lastInboundAt: { type: Date },
    lastOutboundAt: { type: Date },
    windowExpiresAt: { type: Date },
    unread: { type: Number, default: 0, min: 0 },
    optedOut: { type: Date },
    needsAttention: { type: Boolean, default: false, index: true },
    lastStatus: { type: String, trim: true, maxlength: 40 },
    lastStatusAt: { type: Date },
    closedAt: { type: Date },
  },
  { timestamps: true }
);

/**
 * One thread per number. The unique index, not application logic, is what makes
 * concurrent deliveries from Meta for the same number collapse into one row
 * instead of racing to create two.
 */
ConversationSchema.index({ phone: 1 }, { unique: true });

/** The staff inbox: what needs a person, newest first. */
ConversationSchema.index({ needsAttention: 1, lastMessageAt: -1 });
/** Everything unread, newest first. */
ConversationSchema.index({ unread: 1, lastMessageAt: -1 });
/** A patient's own thread history. */
ConversationSchema.index({ patient: 1, lastMessageAt: -1 });
/** M2's "is this thread still inside the free-form window" sweep. */
ConversationSchema.index({ windowExpiresAt: 1 });
/** M2's sweep for numbers that must never be messaged. Sparse on purpose. */
ConversationSchema.index({ optedOut: 1 }, { sparse: true });

export const Conversation: Model<IConversation> =
  (models.Conversation as Model<IConversation>) ||
  model<IConversation>("Conversation", ConversationSchema);
