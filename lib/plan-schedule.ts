/**
 * Deriving what a treatment plan obliges the patient to do, and reconciling that
 * against what has already been recorded.
 *
 * ## Why this is the hub
 *
 * Today, issuing a plan records two dates and stops. Every reminder after that -
 * the review, the lab test, the instalment - is typed into the admin panel by
 * hand, one at a time, which means in practice they are not typed in at all. That
 * is why the clinic's alert feed is quiet: it can only report what exists, and
 * almost nothing exists.
 *
 * This module is the fix, and it is deliberately pure: no database, no Mongoose,
 * no `server-only`. It answers two questions and nothing else.
 *
 *   1. `derivePlanObligations` - given a plan's dates and a rule set, what dated
 *      things should exist?
 *   2. `reconcilePlanSchedule` - given that list and the reminders already in the
 *      database, what should be created, changed and withdrawn?
 *
 * `lib/plan-lifecycle.ts` is the only thing that writes. Keeping the arithmetic
 * free of I/O is what makes it testable at all: every rule below is verified
 * against edge cases that would need a live database and a running clock to test
 * any other way.
 *
 * ## The three decisions that matter
 *
 * ### 1. An obligation has two dates, not one
 *
 * `eventDate` is when the thing happens; `dueDate` is when the patient is told.
 * They differ by the rule's lead time. Conflating them is the bug that produces
 * reminders which arrive on the morning of the appointment they are about, or
 * arrive three weeks early.
 *
 * ### 2. Nothing is ever backdated, and nothing in the past is announced
 *
 * Derivation skips any occurrence whose `eventDate` has already passed, and
 * clamps `dueDate` forward to today when the lead window has already opened.
 *
 * This matters most at plan creation. A plan issued three weeks into its own
 * schedule would otherwise generate a burst of reminders for reviews and labs
 * that were already missed - which is both useless to the patient and the fastest
 * possible way to get a WhatsApp number blocked. A rule that has already lapsed
 * produces nothing.
 *
 * ### 3. Reconciliation never destroys a clinician's work
 *
 * The engine distinguishes rows it owns from rows a human wrote:
 *
 * - `origin: "manual"` rows are **never** read for changes and never touched.
 * - `origin: "derived"` rows are updated only while nobody has pinned them.
 * - A `pinned` row is left alone permanently, which is how "move this reminder to
 *   the 12th" survives the next re-derivation instead of being silently undone.
 * - Completed rows are never reopened.
 * - An obligation that has disappeared is **cancelled, not deleted**, so the
 *   record that it existed survives in the patient's history.
 *
 * The alternative - delete and recreate - is the obvious implementation and it is
 * wrong: it destroys history, it loses ids that staff have bookmarked, and every
 * re-run looks like a new task.
 */

import { addDays, daysBetween, isDateOnly } from "@/lib/clinic-time";
import { eventKey } from "@/lib/events";
import {
  splitEvenly,
  type CadenceRule,
  type PaymentRule,
  type PlanRules,
} from "@/lib/treatment-rules";

/** Obligation kinds that produce a dated reminder. Monitoring is not one. */
export type DerivedKind = "appointment" | "lab" | "refill" | "payment";

/** One dated thing the plan asks of the patient. */
export interface DerivedObligation {
  readonly kind: DerivedKind;
  /** Patient-facing title, rendered from the rule's template. */
  readonly title: string;
  readonly note?: string;
  /** The day the thing actually happens. Always within the plan period. */
  readonly eventDate: string;
  /**
   * The day the reminder should reach the patient. Never later than `eventDate`,
   * never earlier than the day derivation ran.
   */
  readonly dueDate: string;
  /** 1-based occurrence number within its own cadence. */
  readonly sequence: number;
  /** Month of treatment, 1-based, for the `{month}` template. */
  readonly month: number;
  readonly amountFcfa?: number;
  /**
   * Stable identity, derived from content only - never from a timestamp or a
   * random id. Re-deriving the same plan must produce the same keys, which is
   * what makes reconciliation possible at all.
   */
  readonly dedupeKey: string;
}

/** Why a rule produced nothing. Surfaced rather than swallowed. */
export interface DerivationSkip {
  readonly kind: DerivedKind;
  readonly reason: string;
}

export interface DerivationResult {
  readonly obligations: readonly DerivedObligation[];
  /**
   * Rules that were configured but could not produce anything. A caller that
   * ignores this will silently ship a plan with no payment reminders and never
   * know why.
   */
  readonly skipped: readonly DerivationSkip[];
}

/** Builds the content-derived identity of one obligation. */
export function obligationKey(
  planId: string,
  kind: DerivedKind,
  sequence: number
): string {
  return eventKey("plan", planId, kind, sequence);
}

/** Fills `{n}` and `{month}` in a rule template. */
function renderTemplate(
  template: string,
  month: number,
  sequence: number
): string {
  return template
    .replace(/\{month\}/g, String(month))
    .replace(/\{n\}/g, String(sequence))
    .trim();
}

/**
 * The 1-based month of treatment a date falls in.
 *
 * This must agree with `treatmentMonthInfo` on the plan model, because the same
 * fact is shown to the patient in two places: "Month 2 of 3" on the dashboard and
 * "Review with the clinic (month 2)" in their reminder list. If the two disagree,
 * the patient reads one of them as a mistake and stops trusting both.
 *
 * So both the month count and the day index are taken from the plan's whole
 * period, and the rounding is the model's: `totalMonths = round(totalDays / 30)`,
 * `monthLength = totalDays / totalMonths`, `month = floor(dayIndex / monthLength) + 1`.
 */
function monthOfTreatment(
  startDate: string,
  date: string,
  totalDays: number,
  totalMonths: number
): number {
  const dayIndex = Math.max(0, daysBetween(startDate, date));
  const monthLength = totalDays / Math.max(1, totalMonths);
  if (monthLength <= 0) return 1;
  return Math.min(totalMonths, Math.max(1, Math.floor(dayIndex / monthLength) + 1));
}

/** Expands one cadence into occurrences, honouring the two-date and no-backfill rules. */
function expandCadence(params: {
  planId: string;
  kind: DerivedKind;
  rule: CadenceRule;
  startDate: string;
  endDate: string;
  today: string;
  totalDays: number;
  totalMonths: number;
  /** Hard cap on occurrences, so a mis-entered rule cannot generate 10,000 rows. */
  limit: number;
}): { obligations: DerivedObligation[]; skipped: DerivationSkip[] } {
  const { planId, kind, rule, startDate, endDate, today, totalDays, totalMonths, limit } = params;
  const out: DerivedObligation[] = [];

  if (!Number.isInteger(rule.everyDays) || rule.everyDays < 1) {
    return {
      obligations: [],
      skipped: [{ kind, reason: `everyDays must be a whole number of days, got ${rule.everyDays}` }],
    };
  }
  if (!Number.isInteger(rule.leadDays) || rule.leadDays < 0) {
    return {
      obligations: [],
      skipped: [{ kind, reason: `leadDays must be zero or more, got ${rule.leadDays}` }],
    };
  }

  for (
    let offset = rule.firstOffsetDays;
    offset <= daysBetween(startDate, endDate) + rule.leadDays;
    offset += rule.everyDays
  ) {
    const eventDate = addDays(startDate, Math.trunc(offset));

    // Never past the end of the plan. A three-month course does not get a
    // fourth-month review, however the cadence divides.
    if (eventDate > endDate) break;

    // The occurrence number is the position in the *cadence*, not a running count
    // of what survived today's filter.
    //
    // This is load-bearing. If it were the running count, then re-deriving a plan
    // in month two would renumber the month-two review from #2 to #1 - and
    // reconciliation, which matches on this number, would see the stored "review
    // 3" as an obligation that no longer exists and cancel a perfectly valid
    // future reminder. Deriving the number from the offset makes it depend only
    // on the plan and the rule, so it is the same on every run, today included.
    const sequence = Math.floor(offset / rule.everyDays) + 1;

    // Never announce something that has already happened.
    if (eventDate < today) continue;

    // The cap bounds what is *emitted*, not the numbering - a plan re-derived long
    // after it started must still produce its remaining obligations rather than
    // finding every sequence number already spent.
    if (out.length >= limit) break;

    // The reminder wants to land `leadDays` before the event, but not in the
    // past: if the lead window has already opened, the reminder is due today.
    const idealDue = addDays(eventDate, -Math.trunc(rule.leadDays));
    const dueDate = idealDue < today ? today : idealDue;

    const month = monthOfTreatment(startDate, eventDate, totalDays, totalMonths);

    out.push({
      kind,
      title: renderTemplate(rule.titleTemplate, month, sequence),
      ...(rule.noteTemplate ? { note: renderTemplate(rule.noteTemplate, month, sequence) } : {}),
      eventDate,
      dueDate,
      sequence,
      month,
      dedupeKey: obligationKey(planId, kind, sequence),
    });
  }

  return { obligations: out, skipped: [] };
}

/** Expands the instalment schedule, which is spread evenly rather than on a cadence. */
function expandPayments(params: {
  planId: string;
  rule: PaymentRule;
  startDate: string;
  endDate: string;
  today: string;
  totalDays: number;
  totalMonths: number;
}): { obligations: DerivedObligation[]; skipped: DerivationSkip[] } {
  const { planId, rule, startDate, endDate, today, totalDays, totalMonths } = params;

  if (rule.totalFcfa === null || rule.totalFcfa === undefined) {
    return {
      obligations: [],
      skipped: [
        {
          kind: "payment",
          reason:
            "no total was supplied for this plan; a plan document carries no price, so no amount can be derived",
        },
      ],
    };
  }
  if (!Number.isInteger(rule.instalments) || rule.instalments < 1) {
    return {
      obligations: [],
      skipped: [
        { kind: "payment", reason: `instalments must be a whole number of 1 or more, got ${rule.instalments}` },
      ],
    };
  }
  if (rule.totalFcfa <= 0) {
    return {
      obligations: [],
      skipped: [{ kind: "payment", reason: "the total is zero or negative, so there is nothing to collect" }],
    };
  }

  const amounts = splitEvenly(rule.totalFcfa, rule.instalments);
  if (amounts.length === 0) {
    return {
      obligations: [],
      skipped: [{ kind: "payment", reason: "the total could not be split into whole instalments" }],
    };
  }

  // Even spacing across the plan, computed as fractions of the whole period and
  // rounded to whole days, so the final instalment lands *on* the last day rather
  // than falling short of it by a day or overshooting past it. Two payments on a
  // 91-day plan start 45 days apart, not 44, which is the difference between
  // collecting the whole amount and quietly dropping a payment.
  //
  // Integer arithmetic throughout: `addDays` rejects fractional offsets outright,
  // and an unrounded division is how that rejection gets reached in production.
  const firstOffset = Math.max(0, Math.trunc(rule.firstOffsetDays));
  const laterCount = amounts.length - 1;
  const remaining = Math.max(0, daysBetween(startDate, endDate) - firstOffset);

  const out: DerivedObligation[] = [];
  for (let i = 0; i < amounts.length; i++) {
    const offset =
      laterCount > 0
        ? firstOffset + Math.round((i * remaining) / laterCount)
        : firstOffset;
    const eventDate = addDays(startDate, offset);
    if (eventDate > endDate) break;
    if (eventDate < today) continue;

    const idealDue = addDays(eventDate, -Math.trunc(rule.leadDays));
    const dueDate = idealDue < today ? today : idealDue;
    const month = monthOfTreatment(startDate, eventDate, totalDays, totalMonths);

    out.push({
      kind: "payment",
      title: renderTemplate(rule.titleTemplate, month, i + 1),
      eventDate,
      dueDate,
      sequence: i + 1,
      month,
      amountFcfa: amounts[i],
      dedupeKey: obligationKey(planId, "payment", i + 1),
    });
  }

  return { obligations: out, skipped: [] };
}

export interface DeriveInput {
  readonly planId: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly rules: PlanRules;
  /** The clinic day derivation is being run on. Defaults to today at the clinic. */
  readonly today?: string;
  /** Cap on obligations of a single kind. Guards a mis-entered cadence. */
  readonly maxPerKind?: number;
}

const DEFAULT_MAX_PER_KIND = 200;

/**
 * The complete set of dated obligations for one plan.
 *
 * Pure and total: given the same input it returns the same output, including the
 * order, which is what makes it safe to re-run at any time.
 */
export function derivePlanObligations(input: DeriveInput): DerivationResult {
  const { planId, startDate, endDate, rules } = input;
  const today = input.today ?? "";

  const invalid =
    !isDateOnly(startDate) || !isDateOnly(endDate) || !isDateOnly(today) || daysBetween(startDate, endDate) < 0;

  // A plan with unusable dates cannot be scheduled. Returning empty rather than
  // throwing keeps a bad import from taking down a whole batch of patients; the
  // caller reads `skipped` to find out.
  if (invalid) {
    return {
      obligations: [],
      skipped: [
        {
          kind: "appointment",
          reason: `unusable plan period: start=${startDate} end=${endDate} today=${today}`,
        },
      ],
    };
  }

  // Mirrors `treatmentMonthsTotal` on the plan model exactly: 90 days is three
  // months. Both the schedule titles and the patient dashboard read from this,
  // so the two definitions of "a month of treatment" must not drift apart.
  const totalDays = daysBetween(startDate, endDate) + 1;
  const totalMonths = Math.max(1, Math.round(totalDays / 30));
  const limit = input.maxPerKind ?? DEFAULT_MAX_PER_KIND;
  const shared = { planId, startDate, endDate, today, totalDays, totalMonths, limit };

  const obligations: DerivedObligation[] = [];
  const skipped: DerivationSkip[] = [];

  for (const kind of ["appointment", "lab", "refill"] as const) {
    const rule = kind === "appointment" ? rules.consultation : kind === "lab" ? rules.lab : rules.refill;
    if (!rule) {
      skipped.push({
        kind,
        reason:
          kind === "refill"
            ? "no refill rule is configured; refills need days-of-supply per product, which the clinic has not supplied"
            : `no ${kind} rule is configured`,
      });
      continue;
    }
    const expanded = expandCadence({ ...shared, kind, rule });
    obligations.push(...expanded.obligations);
    skipped.push(...expanded.skipped);
  }

  if (rules.payment) {
    const expanded = expandPayments({ ...shared, rule: rules.payment });
    obligations.push(...expanded.obligations);
    skipped.push(...expanded.skipped);
  } else {
    skipped.push({ kind: "payment", reason: "no payment rule is configured" });
  }

  obligations.sort((a, b) =>
    a.dueDate === b.dueDate ? a.dedupeKey.localeCompare(b.dedupeKey) : a.dueDate.localeCompare(b.dueDate)
  );

  return { obligations, skipped };
}

/** The shape of a stored reminder that reconciliation needs. */
export interface ExistingReminder {
  readonly _id: string;
  readonly kind: string;
  readonly title: string;
  readonly dueDate: string;
  readonly status: "pending" | "done" | "cancelled";
  readonly amountFcfa?: number;
  readonly origin?: "manual" | "derived";
  readonly pinned?: boolean;
  readonly dedupeKey?: string | null;
}

export interface ReconciliationUpdate {
  readonly _id: string;
  readonly set: {
    readonly title: string;
    readonly dueDate: string;
    readonly eventDate?: string;
    readonly amountFcfa?: number;
  };
}

export interface Reconciliation {
  /** Obligations with no stored counterpart. */
  readonly create: readonly DerivedObligation[];
  /** Stored derived rows whose fields have drifted, and were not pinned. */
  readonly update: readonly ReconciliationUpdate[];
  /** Ids of derived rows whose obligation has disappeared. Cancelled, never deleted. */
  readonly cancel: readonly string[];
  /** How many stored rows already matched and were left alone. */
  readonly unchanged: number;
  /** Rows that were skipped because they are pinned, completed or cancelled. */
  readonly skipped: readonly { readonly _id: string; readonly reason: string }[];
}

/**
 * Works out the difference between what the rules say and what is stored.
 *
 * Deliberately returns an intent rather than performing it, so the caller owns
 * the writes, the transaction and the `PatientEvent` entries. This is also what
 * makes it testable without a database.
 */
export function reconcilePlanSchedule(
  obligations: readonly DerivedObligation[],
  existing: readonly ExistingReminder[]
): Reconciliation {
  const create: DerivedObligation[] = [];
  const update: ReconciliationUpdate[] = [];
  const cancel: string[] = [];
  const skipped: { _id: string; reason: string }[] = [];
  let unchanged = 0;

  const derivedRows = new Map<string, ExistingReminder>();
  for (const row of existing) {
    // Manual rows are not the engine's business. They are not in the map, so
    // they can never match an obligation and can never be cancelled.
    if (row.origin !== "derived" || !row.dedupeKey) continue;
    // A stale duplicate of a key that somehow survived should not make the
    // engine believe the obligation is already present twice.
    if (!derivedRows.has(row.dedupeKey)) derivedRows.set(row.dedupeKey, row);
  }

  const matched = new Set<string>();

  for (const obligation of obligations) {
    const row = derivedRows.get(obligation.dedupeKey);
    if (!row) {
      create.push(obligation);
      continue;
    }
    matched.add(row._id);

    if (row.pinned) {
      skipped.push({ _id: row._id, reason: "pinned by a clinician" });
      continue;
    }
    if (row.status === "done") {
      skipped.push({ _id: row._id, reason: "already completed" });
      continue;
    }
    if (row.status === "cancelled") {
      // The engine cancels an obligation when the plan period moves past it. If
      // the plan is extended and the obligation returns, cancelling had been
      // transient after all, so the row is brought back rather than duplicated.
      update.push({
        _id: row._id,
        set: { title: obligation.title, dueDate: obligation.dueDate, eventDate: obligation.eventDate },
      });
      continue;
    }

    const titleChanged = row.title !== obligation.title;
    const dateChanged = row.dueDate !== obligation.dueDate;
    const amountChanged =
      obligation.amountFcfa !== undefined && row.amountFcfa !== obligation.amountFcfa;

    if (!titleChanged && !dateChanged && !amountChanged) {
      unchanged += 1;
      continue;
    }
    update.push({
      _id: row._id,
      set: {
        title: obligation.title,
        dueDate: obligation.dueDate,
        eventDate: obligation.eventDate,
        ...(amountChanged ? { amountFcfa: obligation.amountFcfa } : {}),
      },
    });
  }

  // Any derived row we did not match belongs to an obligation that no longer
  // exists - a shortened plan, a withdrawn lab rule. Cancel rather than delete:
  // the patient already saw it, and the history should keep saying so.
  for (const row of derivedRows.values()) {
    if (matched.has(row._id)) continue;
    if (row.pinned) {
      skipped.push({ _id: row._id, reason: "pinned by a clinician" });
      continue;
    }
    if (row.status === "done") {
      skipped.push({ _id: row._id, reason: "already completed" });
      continue;
    }
    cancel.push(row._id);
  }

  return { create, update, cancel, unchanged, skipped };
}

/** One of a day's monitoring expectations. */
export interface MonitoringWindow {
  readonly id: "fasting" | "postLunch";
  /** Clinic wall clock, `HH:mm`. */
  readonly opensAt: string;
  /** Clinic wall clock, `HH:mm`. */
  readonly closesAt: string;
  /**
   * The clinic day + `HH:mm` the window closes, as a wall-clock string. Kept
   * un-offset on purpose: the messaging engine resolves these against
   * `CLINIC_TIME_ZONE`, and baking an offset in here would let a second clinic
   * silently inherit the first one's.
   */
  readonly closesOn: string;
}

/** The monitoring configuration a plan carries. */
export interface MonitoringConfig {
  readonly glucose?: boolean;
  readonly fastingStart?: string;
  readonly fastingEnd?: string;
  readonly postLunchStart?: string;
  readonly postLunchEnd?: string;
}

const DEFAULT_WINDOWS = {
  fastingStart: "06:00",
  fastingEnd: "10:00",
  postLunchStart: "14:00",
  postLunchEnd: "16:00",
} as const;

const HHMM_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * The monitoring windows a plan requires on one clinic day.
 *
 * Monitoring is deliberately **not** represented as rows. A daily requirement
 * across a six-month plan is 180 rows per patient per series; storing them would
 * bury the two or three rows that actually need attention, and every
 * re-derivation would rewrite all of them. Instead the windows are a projection
 * of the plan's own `monitoring` field, computed on demand for whichever day is
 * being asked about.
 *
 * A window with an unparseable time falls back to the documented default rather
 * than being dropped, because a typo in the admin form should not silently
 * remove a patient's obligation to test their blood sugar.
 */
export function monitoringWindowsFor(
  monitoring: MonitoringConfig | null | undefined,
  dateOnly: string
): MonitoringWindow[] {
  if (!monitoring?.glucose) return [];
  if (!isDateOnly(dateOnly)) return [];

  const pick = (value: string | undefined, fallback: string): string =>
    typeof value === "string" && HHMM_RE.test(value) ? value : fallback;

  const fastingStart = pick(monitoring.fastingStart, DEFAULT_WINDOWS.fastingStart);
  const fastingEnd = pick(monitoring.fastingEnd, DEFAULT_WINDOWS.fastingEnd);
  const postLunchStart = pick(monitoring.postLunchStart, DEFAULT_WINDOWS.postLunchStart);
  const postLunchEnd = pick(monitoring.postLunchEnd, DEFAULT_WINDOWS.postLunchEnd);

  const windows: MonitoringWindow[] = [
    { id: "fasting", opensAt: fastingStart, closesAt: fastingEnd, closesOn: `${dateOnly}T${fastingEnd}` },
    {
      id: "postLunch",
      opensAt: postLunchStart,
      closesAt: postLunchEnd,
      closesOn: `${dateOnly}T${postLunchEnd}`,
    },
  ];

  // A window whose end is not after its start is not a window. Keeping only the
  // coherent ones is better than presenting a patient with a window that closed
  // before it opened.
  return windows.filter((w) => w.closesAt > w.opensAt);
}