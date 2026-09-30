import type { AlertCategory, AlertSeverity, TreatmentAlert } from "@/lib/treatment-alerts";
import type { WorklistStatus } from "@/lib/models/WorklistItem";

export type { WorklistStatus };

/** Staff-visible name for each reason a patient is on the worklist. */
export const CATEGORY_LABELS: Record<AlertCategory, string> = {
  "final-review": "Final review due",
  "ending-soon": "Treatment ending",
  "missed-glucose": "Missed glucose readings",
  "overdue-reminder": "Overdue tasks",
  "concerning-reading": "Concerning reading",
  "new-complication": "New symptoms reported",
  "missed-follow-up": "Missed appointment",
};

/** Days a `firstSeenAt` may be old before an item is considered stale-but-live. */
export const STALE_AFTER_DAYS = 7;

export interface WorklistState {
  alertId: string;
  status: WorklistStatus;
  ownerId?: string;
  ownerName?: string;
  note?: string;
  firstSeenAt: string;
  lastSeenAt: string;
  seenCount: number;
  resolvedAt?: string;
}

export interface WorklistItemView extends TreatmentAlert {
  status: WorklistStatus;
  owner?: { id: string; name: string };
  note?: string;
  /** ISO timestamp of the first day this alert was observed. */
  firstSeenAt?: string;
  /** Whole days the alert has been outstanding. 0 when first seen today. */
  ageDays: number;
  seenCount: number;
  /** True once `firstSeenAt` is older than {@link STALE_AFTER_DAYS}. */
  stale: boolean;
}

export interface WorklistReason {
  category: AlertCategory;
  label: string;
  count: number;
  severity: AlertSeverity;
}

export interface WorklistRow {
  /** Grouping key. `patient:<id>`, or `name:<name>` when the alert has no account. */
  key: string;
  patientId?: string;
  patientName: string;
  /** Worst severity across the row, which is what the row is sorted by. */
  severity: AlertSeverity;
  itemCount: number;
  reasons: WorklistReason[];
  items: WorklistItemView[];
  /** Shared owner when every item has one, otherwise undefined. */
  owner?: { id: string; name: string };
  /** Worst state across the row: resolved > claimed > open. */
  status: WorklistStatus;
  /** Whole days since the oldest outstanding item was first seen. */
  waitingDays: number;
}

export interface WorklistSummary {
  /** Patients with at least one outstanding item. */
  patients: number;
  outstanding: number;
  claimed: number;
  resolved: number;
  /** Oldest outstanding item, in whole days. */
  oldestDays: number;
  byCategory: Array<{ category: AlertCategory; label: string; count: number }>;
}

export interface Worklist {
  today: string;
  summary: WorklistSummary;
  rows: WorklistRow[];
}

const severityRank: Record<AlertSeverity, number> = { high: 3, medium: 2, low: 1 };

/** Roll several item states into the one that describes the row worst. */
function worstStatus(statuses: WorklistStatus[]): WorklistStatus {
  if (statuses.includes("open")) return "open";
  if (statuses.includes("claimed")) return "claimed";
  if (statuses.includes("dismissed")) return "dismissed";
  return "resolved";
}

function worstSeverity(severities: AlertSeverity[]): AlertSeverity {
  return severities.reduce<AlertSeverity>(
    (worst, s) => (severityRank[s] > severityRank[worst] ? s : worst),
    "low"
  );
}

function daysBetween(fromIso: string, toIso: string): number {
  const from = Date.parse(fromIso);
  const to = Date.parse(toIso);
  if (Number.isNaN(from) || Number.isNaN(to)) return 0;
  return Math.max(0, Math.floor((to - from) / 86_400_000));
}

/**
 * Grouping key for a patient.
 *
 * Prefers the account id so two plans for the same person collapse into one row.
 * Family-member alerts carry only a name, so those group by name — which is
 * exactly the set of alerts that genuinely have no patient account behind them.
 */
function rowKey(alert: TreatmentAlert): string {
  return alert.patientId ? `patient:${alert.patientId}` : `name:${alert.patientName}`;
}

/**
 * Was a resolved alert resolved, or has the problem come back?
 *
 * `lastSeenAt` is the last time the alert was observed. If that is *before* it
 * was resolved, the alert must have cleared in between and is now firing again —
 * so this is a fresh occurrence, not a leftover someone already handled.
 *
 * That distinction is what stops "I already called her about this" from
 * permanently hiding a real recurrence, and it needs no nightly sweeper: the
 * evidence is already in the two timestamps.
 */
function hasReturned(state: WorklistState): boolean {
  if (state.status !== "resolved" && state.status !== "dismissed") return false;
  if (!state.resolvedAt) return false;
  return Date.parse(state.lastSeenAt) < Date.parse(state.resolvedAt);
}

export interface BuildWorklistOptions {
  /** ISO timestamp treated as "now". Injected so tests are deterministic. */
  now: string;
  /** Include `resolved` and `dismissed` rows in the output. Default false. */
  includeResolved?: boolean;
}

/**
 * Turn the flat alert feed into the clinic's daily worklist.
 *
 * Pure: no queries, no clock reads. The live alerts arrive as input, the stored
 * staff decisions arrive as input, and the daily shape of the work falls out.
 *
 * "Manage by exception" means one line per patient rather than one per alert:
 * a single nurse opening this at 08:00 should read "12 patients need attention
 * today" and then work down it, not scroll a severity-sorted feed of forty
 * individual alerts.
 */
export function buildWorklist(
  alerts: TreatmentAlert[],
  states: WorklistState[],
  options: BuildWorklistOptions
): Worklist {
  const { now, includeResolved = false } = options;
  const stateById = new Map(states.map((s) => [s.alertId, s]));

  const groups = new Map<string, WorklistItemView[]>();
  let suppressed = 0;

  for (const alert of alerts) {
    const state = stateById.get(alert.id);
    const returned = state ? hasReturned(state) : false;

    // A returned alert is a new occurrence: nobody owns it yet and it must not
    // inherit the previous one's age. `seenCount` is kept, because how many
    // times this has happened is exactly what escalation will need later.
    const status: WorklistStatus = returned ? "open" : (state?.status ?? "open");
    const owner = returned ? undefined : state?.ownerId
      ? { id: state.ownerId, name: state.ownerName || "Staff" }
      : undefined;

    // The previous occurrence ended on `lastSeenAt`, so a recurrence is aged
    // from there rather than from the original first sighting.
    const anchor = state ? (returned ? state.lastSeenAt : state.firstSeenAt) : undefined;
    const ageDays = anchor ? daysBetween(anchor, now) : 0;

    const settled = !returned && (status === "resolved" || status === "dismissed");
    if (settled) {
      suppressed += 1;
      if (!includeResolved) continue;
    }

    const item: WorklistItemView = {
      ...alert,
      status,
      owner,
      note: state?.note,
      firstSeenAt: anchor,
      ageDays,
      seenCount: state?.seenCount ?? 1,
      stale: ageDays >= STALE_AFTER_DAYS,
    };

    const key = rowKey(alert);
    const bucket = groups.get(key);
    if (bucket) bucket.push(item);
    else groups.set(key, [item]);
  }

  const rows: WorklistRow[] = [];
  for (const [key, items] of groups) {
    const owners = new Set(items.map((i) => i.owner?.id ?? ""));
    const statuses = items.map((i) => i.status);
    const resolvedRow = !statuses.includes("open") && !statuses.includes("claimed");

    if (resolvedRow && !includeResolved) continue;

    const categoryCounts = new Map<AlertCategory, { count: number; severity: AlertSeverity }>();
    for (const item of items) {
      const entry = categoryCounts.get(item.category);
      if (entry) {
        entry.count += 1;
        if (severityRank[item.severity] > severityRank[entry.severity]) entry.severity = item.severity;
      } else {
        categoryCounts.set(item.category, { count: 1, severity: item.severity });
      }
    }

    // Most severe reason first, then most frequent, so the line reads as a
    // summary of what is actually wrong rather than an alphabetical list.
    const reasons: WorklistReason[] = [...categoryCounts.entries()]
      .map(([category, v]) => ({
        category,
        label: CATEGORY_LABELS[category],
        count: v.count,
        severity: v.severity,
      }))
      .sort((a, b) => {
        const sev = severityRank[b.severity] - severityRank[a.severity];
        if (sev !== 0) return sev;
        return b.count - a.count;
      });

    items.sort((a, b) => {
      const sev = severityRank[b.severity] - severityRank[a.severity];
      if (sev !== 0) return sev;
      return b.ageDays - a.ageDays;
    });

    const waitingDays = items.reduce((max, i) => Math.max(max, i.ageDays), 0);
    const sharedOwner = owners.size === 1 ? items[0]?.owner : undefined;

    rows.push({
      key,
      patientId: items[0]?.patientId,
      patientName: items[0]?.patientName || "Patient",
      severity: worstSeverity(items.map((i) => i.severity)),
      itemCount: items.length,
      reasons,
      items,
      owner: sharedOwner,
      status: worstStatus(statuses),
      waitingDays,
    });
  }

  rows.sort((a, b) => {
    // Anything still unclaimed outranks work already in hand: the point of the
    // list is what nobody has started.
    const openFirst = (a.status === "open" ? 0 : 1) - (b.status === "open" ? 0 : 1);
    if (openFirst !== 0) return openFirst;
    const sev = severityRank[b.severity] - severityRank[a.severity];
    if (sev !== 0) return sev;
    return b.waitingDays - a.waitingDays;
  });

  const outstandingRows = rows.filter((r) => r.status === "open" || r.status === "claimed");
  const categoryTotals = new Map<AlertCategory, number>();
  for (const row of outstandingRows) {
    for (const reason of row.reasons) {
      categoryTotals.set(reason.category, (categoryTotals.get(reason.category) ?? 0) + reason.count);
    }
  }

  const summary: WorklistSummary = {
    patients: outstandingRows.length,
    outstanding: outstandingRows.filter((r) => r.status === "open").reduce((n, r) => n + r.itemCount, 0),
    claimed: outstandingRows.filter((r) => r.status === "claimed").reduce((n, r) => n + r.itemCount, 0),
    resolved: suppressed,
    oldestDays: outstandingRows.reduce((max, r) => Math.max(max, r.waitingDays), 0),
    byCategory: [...categoryTotals.entries()]
      .map(([category, count]) => ({ category, label: CATEGORY_LABELS[category], count }))
      .sort((a, b) => b.count - a.count),
  };

  return { today: now.slice(0, 10), summary, rows };
}

/** One-line headline for the top of the worklist. */
export function summariseWorklist(worklist: Worklist): string {
  const { patients, outstanding } = worklist.summary;
  if (patients === 0) return "Nothing needs attention today.";
  const subject = `${patients} patient${patients === 1 ? "" : "s"}`;
  const verb = outstanding === 0 ? "in progress" : "require attention today";
  return `${subject} ${verb}.`;
}