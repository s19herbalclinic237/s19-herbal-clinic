import "server-only";
import { WorklistItem, type IWorklistItem } from "@/lib/models/WorklistItem";
import { clinicToday } from "@/lib/clinic-time";
import type { TreatmentAlert } from "@/lib/treatment-alerts";
import type { WorklistState, WorklistStatus } from "@/lib/worklist";

export type { WorklistStatus };

export const WORKLIST_ACTIONS = ["claim", "release", "resolve", "dismiss", "reopen", "note"] as const;
export type WorklistAction = (typeof WORKLIST_ACTIONS)[number];

function toState(doc: IWorklistItem): WorklistState {
  return {
    alertId: doc.alertId,
    status: doc.status,
    ownerId: doc.owner?.id,
    ownerName: doc.owner?.name,
    note: doc.note,
    firstSeenAt: doc.firstSeenAt.toISOString(),
    lastSeenAt: doc.lastSeenAt.toISOString(),
    seenCount: doc.seenCount,
    resolvedAt: doc.resolvedAt?.toISOString(),
  };
}

function isDuplicateKey(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: number }).code === 11000;
}

/**
 * Record that these alerts exist right now, and return their stored state.
 *
 * Two jobs on one pass:
 *
 * 1. Create rows for alerts nobody has seen, so `firstSeenAt` marks the day the
 *    problem started. Without this, "how long has this waited" is always zero and
 *    the worklist cannot prioritise the patient who has been missed for a week.
 * 2. Advance `lastSeenAt` for alerts that are still appearing, which is how a
 *    later resolution is recognised as continuous rather than a recurrence.
 *
 * `seenCount` is advanced only when the stored `lastSeenAt` falls on a different
 * * *clinic* day, so a dashboard open all morning counts once, not once per
 * refresh. Clinic days rather than UTC days because a shift that starts at 23:00
 * must not be split across two counts.
 *
 * The per-row `lastSeenAt` equality filter is deliberate: it makes concurrent
 * refreshes idempotent instead of letting two overlapping reads each add a day.
 */
export async function touchWorklistAlerts(alerts: TreatmentAlert[], now: Date): Promise<WorklistState[]> {
  if (alerts.length === 0) return [];

  const ids = alerts.map((a) => a.id);
  const existing = await WorklistItem.find({ alertId: { $in: ids } }).lean();
  const known = new Map(existing.map((doc) => [doc.alertId, doc]));

  const missing = alerts.filter((a) => !known.has(a.id));
  if (missing.length > 0) {
    try {
      await WorklistItem.insertMany(
        missing.map((alert) => ({
          alertId: alert.id,
          category: alert.category,
          planId: alert.planId,
          patientId: alert.patientId,
          patientName: alert.patientName,
          status: "open" as const,
          firstSeenAt: now,
          lastSeenAt: now,
          seenCount: 1,
        })),
        { ordered: false }
      );
    } catch (error) {
      // A duplicate key means a concurrent read created the same rows first.
      // That is the outcome we wanted, so only a real failure propagates.
      if (!isDuplicateKey(error)) throw error;
    }
  }

  const today = clinicToday(now);
  const stale = existing.filter((doc) => {
    const at = doc.lastSeenAt.getTime();
    if (at >= now.getTime()) return false;
    return clinicToday(doc.lastSeenAt) !== today;
  });
  const sameDay = existing.filter((doc) => {
    const at = doc.lastSeenAt.getTime();
    if (at >= now.getTime()) return false;
    return clinicToday(doc.lastSeenAt) === today;
  });

  if (stale.length > 0 || sameDay.length > 0) {
    const ops = [...stale, ...sameDay].map((doc) => {
      const crossesDay = clinicToday(doc.lastSeenAt) !== today;
      return {
        updateOne: {
          filter: { alertId: doc.alertId, lastSeenAt: doc.lastSeenAt },
          update: {
            $set: { lastSeenAt: now },
            ...(crossesDay ? { $inc: { seenCount: 1 } } : {}),
          },
        },
      };
    });
    // `ordered: false` so one row that another request already moved does not
    // abort the rest.
    await WorklistItem.bulkWrite(ops, { ordered: false });
  }

  const refreshed = await WorklistItem.find({ alertId: { $in: ids } }).lean();
  return refreshed.map(toState);
}

export interface ApplyActionInput {
  alertId: string;
  action: WorklistAction;
  actorId: string;
  actorName: string;
  note?: string;
  now: Date;
  /** Used only when the row has to be created by this action. */
  category?: string;
  planId?: string;
  patientId?: string;
  patientName?: string;
}

/**
 * Record a staff decision against one alert.
 *
 * An upsert keyed on `alertId`, so a clinician can resolve something the moment
 * they see it without the row having been created by an earlier read.
 *
 * `$set` and `$setOnInsert` never name the same field — Mongo rejects that
 * outright — so the insert branch only carries identity columns, and status
 * always travels in `$set`.
 *
 * A `note` deliberately does *not* advance `lastSeenAt`. `lastSeenAt` means "the
 * alert was observed", and writing commentary is not an observation: letting a
 * note reset it would silently re-suppress an alert that has genuinely returned.
 */
export async function applyWorklistAction(input: ApplyActionInput): Promise<WorklistState | null> {
  const { alertId, action, actorId, actorName, now, note } = input;

  if (action === "note" && (note === undefined || note.trim() === "")) return null;

  const owner = { id: actorId, name: actorName };

  const set: Record<string, unknown> = {};
  switch (action) {
    case "claim":
      set.status = "claimed";
      set.owner = owner;
      break;
    case "release":
      set.status = "open";
      set.owner = null;
      set.resolvedAt = null;
      break;
    case "resolve":
    case "dismiss":
      set.status = action === "resolve" ? "resolved" : "dismissed";
      set.owner = owner;
      set.resolvedAt = now;
      break;
    case "reopen":
      set.status = "open";
      set.owner = null;
      set.resolvedAt = null;
      break;
    case "note":
      set.note = (note ?? "").trim();
      break;
    default: {
      const exhaustive: never = action;
      throw new Error(`Unknown worklist action: ${String(exhaustive)}`);
    }
  }

  const doc = await WorklistItem.findOneAndUpdate(
    { alertId },
    {
      $set: set,
      $setOnInsert: {
        alertId,
        category: input.category ?? "custom",
        planId: input.planId,
        patientId: input.patientId,
        patientName: input.patientName,
        firstSeenAt: now,
        seenCount: 1,
      },
    },
    { upsert: true, returnDocument: "after" }
  ).lean();

  return doc ? toState(doc as IWorklistItem) : null;
}

export async function getWorklistItem(alertId: string): Promise<IWorklistItem | null> {
  return WorklistItem.findOne({ alertId }).lean();
}