import "server-only";

import { Conversation } from "@/lib/models/Conversation";
import { User } from "@/lib/models/User";

/**
 * Resolving a phone number to a thread and to a patient.
 *
 * ## Why this is its own module
 *
 * Two modules need it and must not disagree: M1, which writes to a thread whenever a
 * message arrives, and M2, which writes to one whenever a message is queued. Two
 * copies of "find or create the thread, and work out whose it is" would drift, and
 * the drift would be silent — a thread created by the sender with no patient link
 * would mean an opt-out never reaches the patient record.
 *
 * It existed inside `lib/whatsapp-inbound-log.ts` as a private function and is
 * extracted here so both writers share one implementation.
 *
 * ## The patient link is resolved on every write, never cached
 *
 * A `Conversation` can be created seconds before the number is registered to a
 * patient, and a number can be reassigned to a different account. So the link is
 * recomputed on each write rather than settled once at creation:
 *
 *  - **linked** — the number matches a `User`, and the thread does not point at that
 *    `User`, so it is attached.
 *  - **unlinked** — the thread points at a patient but no `User` matches the number
 *    any more, so the link is cleared.
 *
 * Clearing matters as much as linking. A thread that keeps a stale patient reference
 * after the number moves would show one patient's messages under another's name and
 * route that patient's notifications to the wrong person.
 *
 * The cost is one indexed `User` lookup per inbound message, which is negligible next
 * to the Meta round trip that produced it.
 */

/** Mongoose's duplicate-key code, checked without importing Mongoose. */
function isDuplicateKey(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: number }).code === 11000;
}

/**
 * The `User` record for a digits-only number, or null.
 *
 * `phoneSearch` is the normalised column used for lookups elsewhere in the site, so
 * it is queried alongside the raw `phone`: a number stored before normalisation was
 * added, or typed with formatting, still matches.
 */
export async function findPatientByPhone(phone: string): Promise<string | null> {
  const found = await User.findOne({ $or: [{ phoneSearch: phone }, { phone }] })
    .select("_id")
    .lean();
  return found ? String(found._id) : null;
}

/**
 * Attaches or detaches the thread's patient link to match the number's current owner.
 *
 * Returns the patient id now associated with the thread, or null when there is none.
 * A no-op write is issued only when the link genuinely has to change.
 */
export async function resolveConversationPatient(
  conversationId: string,
  phone: string
): Promise<string | null> {
  const patientId = await findPatientByPhone(phone);
  await Conversation.updateOne(
    { _id: conversationId, ...(patientId ? { patient: { $ne: patientId } } : { patient: { $exists: true } }) },
    patientId ? { $set: { patient: patientId } } : { $unset: { patient: 1 } }
  );
  return patientId;
}

/**
 * Finds or creates the thread for a number, and settles its patient link.
 *
 * Idempotent by construction: on insert it sets only the minimum, so running it twice
 * produces no second row and moves no counter. The unique index on `phone` is what
 * makes create-if-missing safe under concurrency — a concurrent writer's row is the
 * correct one, so a lost race is resolved by reading it back rather than by failing.
 *
 * `at` is the moment the thread's activity happened, not the moment this function
 * ran. For an inbound message it is the message's own timestamp, so a redelivery of an
 * old message cannot make an old thread look new.
 */
export async function upsertConversation(
  phone: string,
  at: Date
): Promise<{ conversationId: string; patientId: string | null }> {
  const existing = await Conversation.findOne({ phone }).select("_id").lean();
  let conversationId: string;

  if (existing) {
    conversationId = String(existing._id);
  } else {
    try {
      const created = await Conversation.create({
        phone,
        lastMessageAt: at,
        lastMessagePreview: "",
      });
      conversationId = String(created._id);
    } catch (error) {
      // Lost a race with a concurrent writer for the same number. Theirs is fine.
      if (!isDuplicateKey(error)) throw error;
      const raced = await Conversation.findOne({ phone }).select("_id").lean();
      if (!raced) throw error;
      conversationId = String(raced._id);
    }
  }

  const patientId = await resolveConversationPatient(conversationId, phone);
  return { conversationId, patientId };
}