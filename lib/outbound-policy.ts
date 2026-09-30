import {
  addDays,
  clinicClock,
  clinicMinutesOfDay,
  clinicParts,
  clinicToday,
  isDateOnly,
} from "@/lib/clinic-time";

/**
 * The outbound engine's decision logic. Pure; nothing here touches a database, the
 * network, or `process.env`.
 *
 * ## The one job
 *
 * Given everything known about a message that is *about to be sent*, decide whether
 * to send it now, put it off, or never send it. Every other part of M2 - the outbox,
 * the tick, the policy collection - exists to deliver that answer reliably.
 *
 * Keeping the answer in a pure function is what makes the interesting cases testable.
 * "Is 23:30 inside quiet hours?", "does an opt-out from a number with no patient
 * record still block?", "is a reminder from four days ago still worth sending?" are
 * all decisions with awkward boundaries, and none of them are reachable by clicking
 * through the site. They are reachable here, in a test, in milliseconds.
 *
 * ## Two priorities, and why the distinction is load-bearing
 *
 * `transactional` is a message about something the patient just did: they booked,
 * they cancelled, a prescription was issued. It is a receipt. Sending it promptly
 * matters more than sending it politely, and it does not consume the patient's
 * patience - they asked for it.
 *
 * `scheduled` is the automation: "you are running low on your medication", "your
 * review is due". Nobody asked for it. This is the one that can annoy a patient,
 * and so the only one that answers to quiet hours, a weekly budget and a staleness
 * horizon.
 *
 * Collapsing the two would be wrong in both directions: a budget that counted
 * receipts would eventually swallow an appointment confirmation - the clinic tells
 * a patient their appointment was cancelled, and the engine decided they had
 * heard enough this week - and quiet hours applied to receipts would mean a patient
 * who books at 22:00 is not told, until morning, that they are booked.
 *
 * ## What blocks a message in every case
 *
 * Refusal by the recipient, absence of consent, an unusable number, and the loop
 * guard are checked before priority is even read. Nothing overrides them. An
 * appointment confirmation is not a reason to message someone who asked to stop.
 */

/* -------------------------------------------------------------------------- */
/* Priorities                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Why a message is being sent.
 *
 * A closed set. It decides which limits apply, so an unrecognised value has to be
 * refused rather than treated as one of them - a typo must not silently grant a
 * message the exemptions of the other category.
 */
export const OUTBOUND_PRIORITIES = ["transactional", "scheduled"] as const;

export type OutboundPriority = (typeof OUTBOUND_PRIORITIES)[number];

export function isOutboundPriority(value: unknown): value is OutboundPriority {
  return typeof value === "string" && (OUTBOUND_PRIORITIES as readonly string[]).includes(value);
}

/* -------------------------------------------------------------------------- */
/* Why a message did not go out                                                */
/* -------------------------------------------------------------------------- */

/**
 * Every reason the engine can decline to send, in one closed list.
 *
 * Grouped by what the operator should do about it, because the response differs:
 *
 *  - **Patient's decision.** `opted_out`, `no_consent`. No amount of configuration
 *    changes these, and nothing retries them.
 *  - **Data problems.** `unusable_number`, `loop_guard`. Someone has to fix the
 *    record; retrying immediately just fails identically.
 *  - **Configuration.** `automation_disabled`, `invalid_policy`. The engine is not
 *    permitted to act, or is holding a policy it cannot trust.
 *  - **Timing.** `quiet_hours`, `patient_engaged`, `weekly_budget_exhausted`,
 *    `too_old`. The message is still wanted; it is not wanted *now*.
 */
export const OUTBOUND_DECLINE_REASONS = [
  "opted_out",
  "no_consent",
  "unusable_number",
  "loop_guard",
  "automation_disabled",
  "invalid_policy",
  "not_due",
  "quiet_hours",
  "patient_engaged",
  "weekly_budget_exhausted",
  "too_old",
] as const;

export type OutboundDeclineReason = (typeof OUTBOUND_DECLINE_REASONS)[number];

/**
 * Reasons that end a message permanently, as opposed to deferring it.
 *
 * Derived from the list rather than written out again, so a new reason cannot be
 * added that is neither terminally refused nor safely retried. The default is
 * `true` - a new reason stops a message, which is the recoverable direction: a
 * suppressed reminder is visible on a worklist, a wrongly-retried opt-out is a
 * compliance failure nobody sees.
 */
const TERMINAL_REASONS: ReadonlySet<string> = new Set<OutboundDeclineReason>([
  "opted_out",
  "no_consent",
  "unusable_number",
  "loop_guard",
  "automation_disabled",
  "invalid_policy",
  // Terminal despite being a *timing* problem: a reminder about Tuesday that is now
  // three days old will never become true again, so there is nothing to wait for.
  // Requeueing it would only re-decide `too_old` on every subsequent tick.
  "too_old",
]);

export function isTerminalDecline(reason: OutboundDeclineReason): boolean {
  return TERMINAL_REASONS.has(reason);
}

/* -------------------------------------------------------------------------- */
/* The policy                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * The window during which **no automated message is sent**.
 *
 * ## The name is the specification
 *
 * `fromMinutes` to `toMinutes` is the *quiet* period, not the permitted one. Getting
 * this backwards is easy and its failure is severe: configured as "quiet 08:00-20:00",
 * the engine would hold every message for the entire clinic day and send only at 03:00,
 * which is both useless and the exact opposite of the intent.
 *
 * The default below wraps midnight, so the wrap-around branch is the *normal* path
 * rather than an untested edge case.
 */
export interface QuietHours {
  enabled: boolean;
  /** Start of the quiet period, minutes from midnight at the clinic, inclusive. 0-1439. */
  fromMinutes: number;
  /** End of the quiet period, minutes from midnight at the clinic, exclusive. 0-1439. May be less than `from` to wrap midnight. */
  toMinutes: number;
}

export interface OutboundPolicy {
  quietHours: QuietHours;
  /** Scheduled messages one patient may receive in one ISO week. 0 means none at all. */
  weeklyBudget: number;
  /**
   * How long a scheduled message stays worth sending, in hours.
   *
   * A reminder that fires after this is dropped rather than delayed again. "Your
   * appointment is tomorrow" arriving on the day after tomorrow is not a late
   * message, it is a false one, and it undermines every other message the clinic
   * sends.
   */
  stalenessHours: number;
  /**
   * Seconds to wait before a second attempt at a send that failed for network or
   * Meta reasons. Applied by the dispatcher, not by this module.
   */
  retryBackoffSeconds: number;
}

/**
 * The shipped defaults.
 *
 * ## These are placeholders and they are marked as such
 *
 * A quiet period of 20:00-08:00 and four messages a week are **assistant proposals**.
 * The clinic has not chosen either. They are used because a policy is required to
 * have a value before a document exists, and because until the clinic answers, the
 * engine is inert anyway (`lib/outbound-gate.ts`), so no default can reach a patient.
 *
 * They are deliberately on the cautious side: quiet overnight and at the edges of the
 * day, and a small weekly budget, so that being wrong means sending *less*. Sending
 * less is the recoverable direction — the clinic notices a patient who got no refill
 * reminder. Sending more is the direction nobody notices until a patient complains.
 *
 * **Quiet is 20:00-08:00, so messages go out 08:00-20:00.** That is chosen to match a
 * normal working day in Bafoussam. `docs/STATE_AND_CREDENTIALS_GAPS.md` §5 lists this
 * as an open question for the clinic.
 */
export const DEFAULT_OUTBOUND_POLICY: OutboundPolicy = {
  quietHours: { enabled: true, fromMinutes: 20 * 60, toMinutes: 8 * 60 },
  weeklyBudget: 4,
  stalenessHours: 24,
  retryBackoffSeconds: 300,
};

/** Bounds used when validating a stored policy. Outside these, the value is refused. */
export const POLICY_LIMITS = {
  minutes: { min: 0, max: 1439 },
  weeklyBudget: { min: 0, max: 31 },
  stalenessHours: { min: 1, max: 24 * 30 },
  retryBackoffSeconds: { min: 10, max: 24 * 60 * 60 },
} as const;

/* -------------------------------------------------------------------------- */
/* Clinic-local time arithmetic the policy needs                               */
/* -------------------------------------------------------------------------- */

/**
 * The clinic-local clock, re-exported so tests of this module need one import and so
 * a caller checking a quiet-hours window reads the same functions the engine used.
 */
export { clinicClock, clinicMinutesOfDay, clinicToday };

/** UTC offset of the clinic zone at an instant, in minutes (east of UTC positive). */
function offsetMinutesAt(instant: Date): number {
  const p = clinicParts(instant);
  return -Math.round(
    (instant.getTime() - Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)) / 60_000
  );
}

/**
 * The instant of a given clinic-local wall-clock time.
 *
 * Two refinement passes rather than one. Africa/Douala has no daylight saving so a
 * single pass is exact, but a zone that observes DST needs the offset looked up at
 * the *provisional* instant, because the provisional instant may already be on the
 * far side of the transition. Two passes converge for every real zone.
 */
export function clinicLocalToInstant(dateOnly: string, minutesOfDay: number): Date {
  if (!isDateOnly(dateOnly)) throw new RangeError(`clinicLocalToInstant received "${dateOnly}"`);
  const [y, m, d] = dateOnly.split("-").map(Number);
  let instant = new Date(Date.UTC(y, m - 1, d, 0, 0, 0) + minutesOfDay * 60_000);
  for (let pass = 0; pass < 2; pass += 1) {
    instant = new Date(Date.UTC(y, m - 1, d, 0, 0, 0) + minutesOfDay * 60_000 - offsetMinutesAt(instant) * 60_000);
  }
  return instant;
}

/**
 * The instant the current quiet period ends.
 *
 * This is the moment a held message must wait for, so it returns the **end** of the
 * window (`toMinutes`), not the start. Getting that backwards is not a cosmetic
 * mistake: a message held at 20:00 under a 20:00→08:00 window would be told to retry
 * at 20:00 the same evening, arrive there, be held again for the same reason, and be
 * held again at every tick until morning — arriving at 20:00 rather than 08:00, every
 * night, indefinitely.
 *
 * Returns `now` when quiet hours are disabled or not currently in effect, so a caller
 * can use it unconditionally as "send no earlier than". The tick only calls it after
 * `isWithinQuietHours` has confirmed a quiet period is actually running, so the
 * unconditional case is a safety net rather than the main path.
 *
 * The wrap-around window is handled by trying the end later today and advancing a
 * whole day when that has already passed.
 */
export function quietHoursEnd(now: Date, quietHours: QuietHours): Date {
  if (!quietHours.enabled) return now;
  const { fromMinutes, toMinutes } = quietHours;
  if (fromMinutes === toMinutes) return now;

  const today = clinicToday(now);
  const endsToday = clinicLocalToInstant(today, toMinutes);
  // For a non-wrapping window (say 12:00→16:00) the end is later today. For a wrapping
  // one (20:00→08:00) it is already past, so the end belongs to tomorrow.
  if (endsToday.getTime() > now.getTime()) return endsToday;

  return clinicLocalToInstant(addDays(today, 1), toMinutes);
}

/** True when the instant falls inside the quiet-hours window. End is exclusive. */
export function isWithinQuietHours(now: Date, quietHours: QuietHours): boolean {
  if (!quietHours.enabled) return false;
  const { fromMinutes, toMinutes } = quietHours;
  if (fromMinutes === toMinutes) return false;
  const minutes = clinicMinutesOfDay(now);
  return fromMinutes <= toMinutes
    ? minutes >= fromMinutes && minutes < toMinutes
    : minutes >= fromMinutes || minutes < toMinutes;
}

/* -------------------------------------------------------------------------- */
/* ISO weeks - the budget is counted per patient per ISO week                   */
/* -------------------------------------------------------------------------- */

/** ISO weekday index for the clinic: 0 = Monday ... 6 = Sunday. */
function isoWeekday(weekdayFromSunday: number): number {
  return (weekdayFromSunday + 6) % 7;
}

/**
 * The instant 00:00 on the clinic day that starts the current ISO week.
 *
 * Used by the caller to count what a patient has already been sent this week, and
 * by `nextIsoWeekStart` for when the budget refills. ISO weeks start Monday, which
 * is the clinic's working week.
 */
export function isoWeekStart(now: Date): Date {
  const offset = isoWeekday(clinicParts(now).weekday);
  const startDate = addDays(clinicToday(now), -offset);
  return clinicLocalToInstant(startDate, 0);
}

/**
 * The instant the weekly budget refills: 00:00 on the next Monday.
 *
 * Chosen over "24 hours from now" because a rolling window lets a patient who is
 * sent four messages on a Monday be sent four more on the following Monday - eight
 * in eight days, at the point where the clinic is messaging someone daily.
 */
export function nextIsoWeekStart(now: Date): Date {
  const offset = isoWeekday(clinicParts(now).weekday);
  // 7 - offset is the next Monday; today-Monday (offset 0) is therefore 7 days out,
  // which is correct: the budget should refill a week after the week that started.
  const nextMonday = addDays(clinicToday(now), 7 - offset);
  return clinicLocalToInstant(nextMonday, 0);
}

/* -------------------------------------------------------------------------- */
/* Validating a stored policy                                                  */
/* -------------------------------------------------------------------------- */

export interface PolicyValidation {
  ok: boolean;
  /** Present only when `ok`. Fields absent from the source fall back to the default. */
  policy?: OutboundPolicy;
  /**
   * Field-level complaints, safe to show an operator. Never contains the stored
   * value, because the source is a database document and an error string ends up in
   * a log and an API response.
   */
  errors: string[];
}

function readInteger(source: Record<string, unknown>, key: string): number | undefined {
  const raw = source[key];
  if (raw === undefined || raw === null) return undefined;
  // Rejects "4", 4.5 and NaN alike. A policy stored as a string because a form
  // posted it is a configuration mistake worth reporting, not silently coercing.
  if (typeof raw !== "number" || !Number.isInteger(raw)) return NaN;
  return raw;
}

function checkRange(
  value: number | undefined,
  limits: { min: number; max: number },
  label: string,
  errors: string[]
): void {
  if (value === undefined) return;
  if (Number.isNaN(value)) {
    errors.push(`${label} must be a whole number.`);
    return;
  }
  if (value < limits.min || value > limits.max) {
    errors.push(`${label} must be between ${limits.min} and ${limits.max}.`);
  }
}

/**
 * Validates the stored policy document.
 *
 * Absent fields fall back to the shipped default, so a document that sets only the
 * budget is valid and complete. Out-of-range or non-integer fields are **errors**,
 * not coercions: silently clamping a budget of 400 down to 31 would be a quiet
 * decision to message a patient 31 times a week, and silently clamping a staleness
 * window of 0 up to 1 hour would hide a typo.
 *
 * `ok: false` is treated by the dispatcher as "send no scheduled messages at all",
 * not "use the defaults". A policy nobody can read is not a policy.
 */
export function parseAutomationPolicy(raw: unknown): PolicyValidation {
  const errors: string[] = [];

  if (raw === undefined || raw === null) {
    return { ok: true, policy: { ...DEFAULT_OUTBOUND_POLICY }, errors };
  }

  if (typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, errors: ["The policy document is not an object."] };
  }

  const source = raw as Record<string, unknown>;

  const weeklyBudget = readInteger(source, "weeklyBudget");
  const stalenessHours = readInteger(source, "stalenessHours");
  const retryBackoffSeconds = readInteger(source, "retryBackoffSeconds");
  checkRange(weeklyBudget, POLICY_LIMITS.weeklyBudget, "weeklyBudget", errors);
  checkRange(stalenessHours, POLICY_LIMITS.stalenessHours, "stalenessHours", errors);
  checkRange(
    retryBackoffSeconds,
    POLICY_LIMITS.retryBackoffSeconds,
    "retryBackoffSeconds",
    errors
  );

  let quietHours: QuietHours = DEFAULT_OUTBOUND_POLICY.quietHours;
  const rawQuiet = source.quietHours;
  if (rawQuiet !== undefined && rawQuiet !== null) {
    if (typeof rawQuiet !== "object" || Array.isArray(rawQuiet)) {
      errors.push("quietHours must be an object.");
    } else {
      const q = rawQuiet as Record<string, unknown>;
      const fromMinutes = readInteger(q, "fromMinutes");
      const toMinutes = readInteger(q, "toMinutes");
      checkRange(fromMinutes, POLICY_LIMITS.minutes, "quietHours.fromMinutes", errors);
      checkRange(toMinutes, POLICY_LIMITS.minutes, "quietHours.toMinutes", errors);

      const enabled = q.enabled;
      if (enabled !== undefined && typeof enabled !== "boolean") {
        errors.push("quietHours.enabled must be true or false.");
      }

      const fromOk = fromMinutes !== undefined && !Number.isNaN(fromMinutes);
      const toOk = toMinutes !== undefined && !Number.isNaN(toMinutes);
      if ((fromOk || toOk) && fromOk && toOk) {
        quietHours = {
          enabled: enabled === undefined ? true : (enabled as boolean),
          fromMinutes: fromMinutes as number,
          toMinutes: toMinutes as number,
        };
      }
    }
  }

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    policy: {
      quietHours,
      weeklyBudget: weeklyBudget ?? DEFAULT_OUTBOUND_POLICY.weeklyBudget,
      stalenessHours: stalenessHours ?? DEFAULT_OUTBOUND_POLICY.stalenessHours,
      retryBackoffSeconds:
        retryBackoffSeconds ?? DEFAULT_OUTBOUND_POLICY.retryBackoffSeconds,
    },
    errors,
  };
}

/* -------------------------------------------------------------------------- */
/* The decision                                                                 */
/* -------------------------------------------------------------------------- */

export interface OutboundDecisionInput {
  /** The moment the engine is deciding. Injected, never `Date.now()`, so tests can decide at 23:30. */
  now: Date;
  priority: OutboundPriority;

  /**
   * Consent, read live from the `User` record at decision time.
   *
   * `null`/`undefined` means "no patient record, or no answer", and is treated as
   * no consent. Deliberately not `false` - they are different states, and the
   * distinction shows up in the reason reported to an operator.
   */
  consent?: boolean | null;

  /** `Conversation.optedOut`, present if this number ever asked to stop. */
  optedOutAt?: Date | null;

  /** Digits-only international number, or anything unusable. */
  phone?: string | null;

  /** The clinic's own number, digits only. */
  clinicNumber?: string | null;

  /** When Meta's 24-hour free-form window closes for this thread. */
  windowExpiresAt?: Date | null;

  /** The moment the message was meant to go out, set when it was enqueued. */
  scheduledFor: Date;

  /** Outbound messages already delivered to this patient in the current ISO week. */
  sentThisWeek?: number;

  /** Whether the automation gate is open. Only consulted for `scheduled`. */
  automationEnabled?: boolean;

  /**
   * The policy to apply. `null` means the stored policy failed validation, which is
   * not the same as "no policy".
   */
  policy: OutboundPolicy | null;
}

export type OutboundDecision =
  | { action: "send" }
  | { action: "defer"; reason: OutboundDeclineReason; until: Date }
  | { action: "stop"; reason: OutboundDeclineReason };

/**
 * Decides whether one message may be sent, now.
 *
 * The order is the design. The patient's own decisions come first, then the data
 * problems, then configuration, and only then timing. A message blocked by an opt-out
 * is stopped before the budget is even read, so no configuration value can revive it.
 *
 * Timing checks come last because they are the only ones that produce a `defer` with
 * a time attached - and once a message has been deferred it is re-evaluated from the
 * top on the next tick, which is why each branch below is safe to reach more than
 * once. There is no accumulation: a message deferred by quiet hours and then by the
 * budget on a later tick is not penalised twice.
 */
export function decideOutbound(input: OutboundDecisionInput): OutboundDecision {
  const { now, priority, scheduledFor } = input;
  const scheduled = priority === "scheduled";

  /* --- The patient's decision. Nothing overrides these. ------------------- */

  if (input.optedOutAt) {
    // Presence, not recency. A refusal three months ago is still a refusal; there is
    // no expiry and there is no "we will ask again later" path here, because
    // re-asking is how an opt-out becomes a complaint.
    return { action: "stop", reason: "opted_out" };
  }

  if (input.consent !== true) {
    return { action: "stop", reason: "no_consent" };
  }

  /* --- Data problems. Retrying will fail identically. --------------------- */

  const phone = (input.phone ?? "").trim();
  if (!/^\d{8,15}$/.test(phone)) {
    // E.164 allows 8-15 digits. A local "678 12 34 56" is the single most common
    // thing a patient types, and it is rejected here rather than sent and bounced.
    return { action: "stop", reason: "unusable_number" };
  }

  const clinicNumber = (input.clinicNumber ?? "").trim();
  if (clinicNumber && phone === clinicNumber) {
    // The clinic messaging its own number is how a loop starts: the delivery
    // webhook is an inbound message, which the engine then wants to act on.
    return { action: "stop", reason: "loop_guard" };
  }

  /* --- Configuration. Only for automation. -------------------------------- */

  if (scheduled) {
    if (input.automationEnabled !== true) {
      return { action: "stop", reason: "automation_disabled" };
    }
    if (!input.policy) {
      // A stored policy that failed validation. Refusing is the only reading of
      // "unknown": the defaults would be a guess about limits nobody confirmed.
      return { action: "stop", reason: "invalid_policy" };
    }

    const { policy } = input;

    /* --- Timing. Each of these defers with a time. ------------------------ */

    // A stale message is dropped, not delayed. "Your appointment is tomorrow"
    // sent three days late is not a late reminder, it is a wrong one.
    const ageMs = now.getTime() - scheduledFor.getTime();
    if (ageMs > policy.stalenessHours * 3_600_000) {
      return { action: "stop", reason: "too_old" };
    }

    // A message scheduled for the future is simply early. Held rather than dropped,
    // because the enqueue clock and the tick clock can legitimately differ by a few
    // seconds and a message must not evaporate over that.
    if (ageMs < 0) {
      return { action: "defer", reason: "not_due", until: scheduledFor };
    }

    if (isWithinQuietHours(now, policy.quietHours)) {
      return {
        action: "defer",
        reason: "quiet_hours",
        until: quietHoursEnd(now, policy.quietHours),
      };
    }

    // The patient messaged in recently. Their window being open means they are in
    // a conversation with the clinic right now, and appending an unsolicited reminder
    // to a live thread is how an automated message reads as an interruption.
    // Transactional messages skip this for the same reason they skip quiet hours.
    if (input.windowExpiresAt && input.windowExpiresAt.getTime() > now.getTime()) {
      return { action: "defer", reason: "patient_engaged", until: input.windowExpiresAt };
    }

    if (policy.weeklyBudget <= 0) {
      return { action: "stop", reason: "weekly_budget_exhausted" };
    }
    const sent = input.sentThisWeek ?? 0;
    if (sent >= policy.weeklyBudget) {
      // Refills on Monday rather than in 24 hours. A rolling window lets someone
      // messaged four times on Monday be messaged four more on Tuesday.
      return { action: "defer", reason: "weekly_budget_exhausted", until: nextIsoWeekStart(now) };
    }
  }

  return { action: "send" };
}

/* -------------------------------------------------------------------------- */
/* Reasons, in words                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Operator-facing wording, used in the tick's summary and the admin status endpoint.
 *
 * Written so that reading it says what to *do*, not only what happened.
 */
export const DECLINE_EXPLANATIONS: Record<OutboundDeclineReason, string> = {
  opted_out:
    "The number asked to stop receiving these messages. Permanently declined; nothing will retry it.",
  no_consent:
    "The patient has not opted in to WhatsApp messages, or there is no patient record. Permanently declined.",
  unusable_number:
    "The number on file cannot be used: it is missing, or it is not a full international number.",
  loop_guard: "The recipient is the clinic's own number. Sending would start a message loop.",
  automation_disabled:
    "Outbound automation is switched off. Transactional messages are unaffected. " +
    "Set OUTBOUND_AUTOMATION_ENABLED to exactly \"true\" once the clinic has confirmed quiet hours and the weekly budget.",
  invalid_policy:
    "The stored outbound policy failed validation, so no scheduled message is sent. " +
    "Fix the policy document; the specific fields are listed in the error.",
  not_due: "The message is scheduled for later than now. Held until it is due.",
  quiet_hours: "Inside the clinic's quiet hours. Held until they end.",
  patient_engaged:
    "The patient messaged recently, so their conversation is open. Held until the window closes.",
  weekly_budget_exhausted:
    "The patient has already had this week's allowance of scheduled messages.",
  too_old:
    "The message is older than the staleness horizon, so sending it now would state something untrue.",
};