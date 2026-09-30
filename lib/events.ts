import type {
  IPatientEvent,
  PatientEventActor,
  PatientEventImportance,
  PatientEventSource,
  PatientEventType,
} from "@/lib/models/PatientEvent";

/**
 * The vocabulary of the patient history: what kinds of event exist, who caused
 * them, how important they are, and how a repeated emission is collapsed.
 *
 * This module is deliberately free of `server-only`, Mongoose and any I/O, so it
 * can be imported by the automation engine, by UI code, and by the test suite
 * alike. Only type imports cross into the model, which the compiler erases - so
 * nothing here pulls the database into a test run. The writer that actually
 * appends the event lives in lib/event-log.ts.
 *
 * Keeping the vocabulary separate from the writer is what lets the rules engine
 * be tested as pure logic: decide *what* should be recorded, without touching a
 * database, and let one small function persist it.
 */

export type {
  IPatientEvent,
  PatientEventActor,
  PatientEventImportance,
  PatientEventSource,
  PatientEventType,
};

/**
 * Events a clinician must never have to go looking for. Used by the AI summary
 * and the exception dashboard to decide what a 30-second glance should show.
 * Everything else is `notable` when a human did it, `routine` when the system
 * did it.
 */
export const CRITICAL_EVENT_TYPES: readonly PatientEventType[] = [
  "escalation",
  "lab_result",
  "symptom",
];

/** What a module calls when it needs to append to the history. */
export interface RecordEventInput {
  patient: string;
  plan?: string | null;
  type: PatientEventType;
  /** When the thing happened, not when we wrote it down. Defaults to now. */
  at?: Date | string | null;
  actor: PatientEventActor;
  summary: string;
  data?: Record<string, unknown>;
  source?: PatientEventSource;
  importance?: PatientEventImportance;
  /**
   * Stable key making repeated emissions of the same event collapse into one.
   * Derive it from the *content* of the event - never from a timestamp or a
   * random id, which would defeat the purpose. See `eventKey`.
   */
  dedupeKey?: string | null;
}

/**
 * Builds a deterministic dedupe key.
 *
 * Parts are joined with a colon and each is stripped of colons, so no two
 * different input lists can produce the same string by concatenation. That
 * matters because these keys back a unique index: a collision would silently
 * drop a real clinical event, which is worse than sending a duplicate reminder.
 */
export function eventKey(...parts: Array<string | number | null | undefined>): string {
  return parts
    .map((part) =>
      part === null || part === undefined ? "" : String(part).replace(/:/g, "")
    )
    .join(":");
}

/** Actor shorthand for an action the patient took themselves. */
export function patientActor(userId: string, name?: string): PatientEventActor {
  return { kind: "patient", id: userId, ...(name ? { name } : {}) };
}

/** Actor shorthand for a staff member acting in the dashboard. */
export function staffActor(staffId: string, name?: string): PatientEventActor {
  return { kind: "staff", id: staffId, ...(name ? { name } : {}) };
}

/** Actor shorthand for the automation engine itself. */
export function systemActor(reason?: string): PatientEventActor {
  return { kind: "system", ...(reason ? { name: reason } : {}) };
}

/** Actor shorthand for an external service (payment gateway, Meta, e-mail). */
export function integrationActor(name: string): PatientEventActor {
  return { kind: "integration", name };
}

/**
 * Default importance when a caller does not state one. Critical event types are
 * promoted regardless of who caused them, because a laboratory result is
 * clinically important whether it arrived by upload, by portal entry, or by the
 * engine noticing it was overdue.
 */
export function defaultImportance(
  type: PatientEventType,
  actorKind: PatientEventActor["kind"]
): PatientEventImportance {
  if (CRITICAL_EVENT_TYPES.includes(type)) return "critical";
  return actorKind === "system" ? "routine" : "notable";
}

/** Longest summary the model accepts, and the slice applied before insert. */
export const EVENT_SUMMARY_MAX = 300;

/** Longest dedupe key the model accepts. */
export const EVENT_DEDUPE_KEY_MAX = 200;

/**
 * Validates and normalises an event before the writer persists it, so the
 * database is never handed a value the schema would reject. Returns `null` when
 * the event is not worth storing.
 */
export function normaliseEvent(
  input: RecordEventInput
): (Omit<RecordEventInput, "at"> & { at: Date; source: PatientEventSource; importance: PatientEventImportance }) | null {
  const summary = (input.summary ?? "").trim();
  if (!summary) return null;

  const at = input.at instanceof Date ? input.at : input.at ? new Date(input.at) : new Date();
  if (Number.isNaN(at.getTime())) return null;

  return {
    ...input,
    summary: summary.slice(0, EVENT_SUMMARY_MAX),
    at,
    source: input.source ?? "admin",
    importance: input.importance ?? defaultImportance(input.type, input.actor.kind),
    dedupeKey: input.dedupeKey ? input.dedupeKey.slice(0, EVENT_DEDUPE_KEY_MAX) : null,
  };
}
