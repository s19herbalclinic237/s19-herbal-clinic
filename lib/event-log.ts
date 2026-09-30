import "server-only";

import { connectDb } from "@/lib/db";
import { PatientEvent } from "@/lib/models/PatientEvent";
import type { IPatientEvent } from "@/lib/models/PatientEvent";
import { normaliseEvent, type RecordEventInput } from "@/lib/events";

/**
 * Appends to the patient history. This is the only function in the codebase
 * that writes a PatientEvent.
 *
 * It mirrors lib/notify.ts, lib/email.ts and lib/whatsapp.ts: callers fire it
 * without awaiting the business result, and neither a missing database nor a
 * duplicate key can fail the request that triggered it. Recording history is a
 * side effect of care, not a precondition for delivering it - if the log is
 * unavailable we would rather complete the booking than reject it in front of a
 * patient, and the miss surfaces in the error log instead.
 *
 * Idempotency lives here rather than in discipline at each call site, because
 * the two callers that most need it are the two the platform retries: the
 * automation tick (cron overlaps and skipped runs) and the WhatsApp webhook
 * (Meta redelivers until it gets a 200). Both emit a content-derived key, so a
 * retry collapses into the original event instead of telling a patient they
 * have run out of medication twice.
 */
export async function recordEvent(input: RecordEventInput): Promise<IPatientEvent | null> {
  const event = normaliseEvent(input);
  if (!event) return null;

  try {
    const db = await connectDb();
    if (!db) return null;

    return await PatientEvent.create({
      patient: event.patient,
      ...(event.plan ? { plan: event.plan } : {}),
      type: event.type,
      at: event.at,
      actor: event.actor,
      summary: event.summary,
      ...(event.data ? { data: event.data } : {}),
      source: event.source,
      importance: event.importance,
      ...(event.dedupeKey ? { dedupeKey: event.dedupeKey } : {}),
    });
  } catch (error) {
    // E11000 means the same event is already on record. On a retry that is the
    // outcome we wanted, not a fault worth alerting on.
    const isDuplicate =
      typeof error === "object" &&
      error !== null &&
      (error as { code?: number }).code === 11000;
    if (!isDuplicate) {
      console.error("[event-log] recordEvent failed:", {
        type: event.type,
        source: event.source,
        patient: event.patient,
        error,
      });
    }
    return null;
  }
}
