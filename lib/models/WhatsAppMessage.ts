import { Schema, model, models, type Model } from "mongoose";
import type { IUser } from "@/lib/models/User";
import type { IConversation } from "@/lib/models/Conversation";

/**
 * One WhatsApp message, in either direction.
 *
 * ## Why `wamid` is the only index that matters
 *
 * Meta redelivers until it receives a 200, and it redelivers without warning. The
 * same inbound message therefore arrives two, three or five times over a period of
 * hours, and each redelivery is indistinguishable from the original except by
 * `wamid`.
 *
 * So dedupe is not a check-then-insert in application code - that loses the race
 * whenever two deliveries arrive at once. It is a **unique index**, and the insert
 * is the arbitration. The second delivery collides, the insert throws `E11000`,
 * and that is how the code knows it has already handled the message. See
 * `lib/whatsapp-inbound-log.ts`, where the insert happens *before* any side effect
 * for exactly this reason.
 *
 * ## Retention
 *
 * Inbound text can be a patient's own description of a symptom, which makes this a
 * health record. It is kept for the life of the patient record and swept into the
 * encrypted backup like every other collection. There is deliberately no TTL index
 * here, for the same reason `PatientEvent` has none.
 */
export interface IWhatsAppMessage {
  _id: string;
  /** Meta's message id. Unique across both directions. */
  wamid: string;
  conversation: string | IConversation;
  /** Set when the thread is linked to a patient, for querying by patient. */
  patient?: string | IUser;
  /** Digits only, denormalised so "everything from this number" needs no join. */
  phone: string;
  direction: "inbound" | "outbound";
  /** Meta's message type, or `system` for a delivery receipt. */
  kind: string;
  /** Body text for a text message. Capped by `INBOUND_TEXT_MAX`. */
  text?: string;
  /** Raw button payload. Recorded even when unrecognised, never interpreted here. */
  payload?: string;
  /** Meta media/document id. Metadata only - patient media is not downloaded. */
  mediaId?: string;
  /** Which template produced an outbound message. */
  template?: string;
  /** What this application understood the message to mean, for an inbound one. */
  intent?: string;
  /** Last delivery status Meta reported for this `wamid`. */
  status?: string;
  statusAt?: Date;
  statusCode?: number;
  statusDetail?: string;
  /** When the message was sent, per Meta. Not when we received it. */
  occurredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WhatsAppMessageSchema = new Schema<IWhatsAppMessage>(
  {
    wamid: { type: String, required: true, trim: true },
    conversation: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    patient: { type: Schema.Types.ObjectId, ref: "User" },
    phone: { type: String, required: true, trim: true },
    direction: { type: String, enum: ["inbound", "outbound"], required: true },
    kind: { type: String, required: true, trim: true, maxlength: 40 },
    text: { type: String, maxlength: 4096 },
    payload: { type: String, maxlength: 256 },
    mediaId: { type: String, maxlength: 256 },
    template: { type: String, maxlength: 80 },
    intent: { type: String, maxlength: 40 },
    status: { type: String, trim: true, maxlength: 40 },
    statusAt: { type: Date },
    statusCode: { type: Number },
    statusDetail: { type: String, maxlength: 300 },
    occurredAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

/**
 * Idempotency, enforced by the database rather than by discipline.
 *
 * Plain unique rather than partial: outbound messages also carry a `wamid` (Meta
 * returns it from the send call), and both directions must be covered by the same
 * guarantee, so there is no "no key" case to exclude.
 */
WhatsAppMessageSchema.index({ wamid: 1 }, { unique: true });

/** One thread's messages, oldest first - the conversation view. */
WhatsAppMessageSchema.index({ conversation: 1, occurredAt: 1 });
/** A patient's messages across numbers, newest first. */
WhatsAppMessageSchema.index({ patient: 1, occurredAt: -1 });
/** Delivery-failure sweeps. M2 reads this; the index exists so it can stay cheap. */
WhatsAppMessageSchema.index({ direction: 1, status: 1, occurredAt: -1 });

export const WhatsAppMessage: Model<IWhatsAppMessage> =
  (models.WhatsAppMessage as Model<IWhatsAppMessage>) ||
  model<IWhatsAppMessage>("WhatsAppMessage", WhatsAppMessageSchema);
