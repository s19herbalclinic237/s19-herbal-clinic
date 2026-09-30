/**
 * The rules that decide what a treatment plan obliges the patient to do.
 *
 * ## Why this file exists
 *
 * `lib/plan-schedule.ts` derives a dated schedule from a plan: when the patient
 * is reminded about a consultation, a laboratory test, a refill and an
 * instalment. The arithmetic is pure and lives there. The *cadences* are business
 * and clinical decisions, and they live here - as data, in one object, rather
 * than scattered through the derivation as literals.
 *
 * That separation is the point. When the clinic tells us that reviews are every
 * six weeks rather than every four, this is the only file that changes, and
 * nothing about the derivation has to be re-tested for arithmetic.
 *
 * ## Read this before trusting a number
 *
 * **Every cadence below is provisional.** None of these values came from a
 * clinician. They are reasoned placeholders chosen so the schedule derivation is
 * structurally complete and testable today. They are plausible, not approved.
 * Do not present any of them to a patient as though the clinic had set them.
 *
 * The gate in `lib/schedule-gate.ts` keeps the whole feature inert until the
 * clinic confirms them, so an unapproved number cannot reach a patient by
 * accident. Turning the gate on without changing the values here would ship
 * guesses as instructions.
 *
 * Two are known-wrong-shaped rather than merely unconfirmed, and the derivation
 * handles them by declining to produce output rather than guessing:
 *
 * - `refill` is disabled. A refill reminder has to know how many days of supply
 *   a product covers, which varies per product and is not recorded anywhere. A
 *   made-up supply length would tell a patient to reorder before they run out.
 * - `payment` carries no total, because a plan has no price on it. Payments are
 *   only derived when a caller supplies one.
 *
 * A rule that cannot be satisfied produces a *reported skip*, never a plausible
 * guess. Silent fabrication is how an automation destroys the trust it is meant
 * to save.
 */

/** How often something recurs, and how far ahead to tell the patient. */
export interface CadenceRule {
  /**
   * Days between occurrences. Must be a whole number of days at least 1.
   * Month arithmetic is deliberately avoided: "every 30 days" drifts against
   * "every 1st of the month" in ways that are hard for a patient to reason
   * about, and `lib/clinic-time.ts` already does DST-safe day arithmetic.
   */
  readonly everyDays: number;
  /**
   * Days after the plan's start date for the first occurrence.
   *
   * Offsetting the first occurrence rather than anchoring it to day 0 is
   * deliberate: a consultation on the day the plan is issued is not a
   * consultation, and the baseline assessment is captured as a follow-up record
   * instead.
   */
  readonly firstOffsetDays: number;
  /**
   * How many days *before* the event the reminder should reach the patient.
   *
   * This is what separates "due" from "happening". A lab booked for day 30 is
   * remembered on day 23. Without it, a patient is told about a test on the
   * morning of the test, which is not a reminder.
   */
  readonly leadDays: number;
  /**
   * Reminder title. `{n}` is the 1-based occurrence number, `{month}` is the
   * month of treatment. Kept as a template so the copy lives with the rule that
   * justifies it, and can be corrected without touching logic.
   */
  readonly titleTemplate: string;
  /** Optional note shown beneath the title on the patient portal. */
  readonly noteTemplate?: string;
}

/** Instalment schedule for a plan that has a known total. */
export interface PaymentRule {
  /** How many payments the total is split into. */
  readonly instalments: number;
  /**
   * Days after the plan start for the first instalment.
   *
   * Later instalments are spread evenly across the remaining period rather than
   * spaced on a fixed cadence, so the final instalment does not fall before the
   * plan ends - which would look like a demand for money for treatment the
   * patient has not received yet.
   */
  readonly firstOffsetDays: number;
  /** How many days before each instalment the patient is reminded. */
  readonly leadDays: number;
  readonly titleTemplate: string;
  /**
   * The full amount in FCFA, or `null` when the clinic has not set one.
   *
   * A plan document carries no price, so this is `null` by default and payment
   * obligations are skipped. Supplying a total is what switches the rule on -
   * the engine will not invent an amount.
   */
  readonly totalFcfa: number | null;
}

/** Daily monitoring windows, already configurable per plan. */
export interface MonitoringRule {
  /**
   * Hours after a window closes before the day's reading counts as missed.
   *
   * A glucose reading is not late at 10:05 AM just because the window was
   * 06:00-10:00; people eat breakfast at different times and measurement kit
   * arrives when it arrives. A grace period stops the compliance score punishing
   * an honest patient who read their meter nine minutes late.
   */
  readonly graceHours: number;
}

/** The complete rule set for one plan. */
export interface PlanRules {
  /** Scheduled reviews with a clinician. Derived as reminders to book. */
  readonly consultation: CadenceRule;
  /**
   * Repeat laboratory testing during treatment.
   *
   * Nullable for the same reason as `refill`: some courses need no repeat
   * testing, and "not this one" is a legitimate answer a clinician should be
   * able to give. `null` means the rule was considered and declined, which is
   * recorded as a skip - the clinic can see the decision was made rather than
   * forgotten.
   */
  readonly lab: CadenceRule | null;
  /**
   * Prescription refills.
   *
   * `null` until the clinic supplies days-of-supply per product - see the note
   * at the top of this file. The derivation treats `null` as "do not derive",
   * which is why this is nullable rather than disabled with a magic number.
   */
  readonly refill: CadenceRule | null;
  /** Instalments. See `PaymentRule.totalFcfa` for why this derives nothing today. */
  readonly payment: PaymentRule | null;
  readonly monitoring: MonitoringRule;
}

const DEFAULT_MONITORING: MonitoringRule = {
  graceHours: 26,
};

/**
 * The rule set used when a plan states nothing more specific.
 *
 * PROVISIONAL - pending clinician confirmation (gaps doc §5):
 *
 * | Rule       | Value      | What the clinic still needs to say |
 * | ---------- | ---------- | --------------------------------- |
 * | consultation | every 30 days, 14 days in, 7 days' notice | Is the review cycle the same for every program? Diabetes and a 6-month oncology program are unlikely to share one. |
 * | lab        | every 90 days, 30 days in, 7 days' notice | Which tests, at what intervals, and which need fasting? The engine cannot know that a fasting test means something different to a patient. |
 * | refill     | disabled   | Days of supply per product, and lead time from order to delivery. |
 * | payment    | no total   | What a plan costs, and how many instalments. |
 * | monitoring | 26h grace  | Is one missed day acceptable? Should a missed reading prompt the patient or only staff? |
 */
/**
 * Defaults for the two rules that are off by default.
 *
 * These exist so that switching a rule on is a partial edit. Without them,
 * `mergePlanRules({ payment: { instalments: 3, totalFcfa: 150000 } })` would have
 * nothing to merge into and would produce a rule with `leadDays` and
 * `titleTemplate` as `undefined` - which does not throw at merge time, then throws
 * deep inside the derivation, or worse, quietly produces an untitled reminder.
 *
 * PROVISIONAL - the lead times and titles need the clinic's sign-off on the same
 * footing as the cadences above.
 */
export const REFILL_RULE_DEFAULTS: CadenceRule = {
  everyDays: 30,
  firstOffsetDays: 30,
  leadDays: 3,
  titleTemplate: "Refill (month {month})",
  noteTemplate: "Contact the clinic to arrange your refill before you run out.",
};

export const PAYMENT_RULE_DEFAULTS: PaymentRule = {
  instalments: 1,
  firstOffsetDays: 0,
  leadDays: 3,
  titleTemplate: "Instalment {n} for your treatment plan",
  totalFcfa: null,
};

export const DEFAULT_PLAN_RULES: PlanRules = {
  consultation: {
    everyDays: 30,
    firstOffsetDays: 14,
    leadDays: 7,
    titleTemplate: "Review with the clinic (month {month})",
    noteTemplate: "Book a review to check your progress and adjust your plan.",
  },
  lab: {
    everyDays: 90,
    firstOffsetDays: 30,
    leadDays: 7,
    titleTemplate: "Laboratory test (month {month})",
    noteTemplate:
      "Book the test at the clinic laboratory and the results will be reviewed by your clinician.",
  },
  refill: null,
  payment: null,
  monitoring: DEFAULT_MONITORING,
};

/** Anything a caller may override, all fields optional and deep-merged per rule. */
export type PlanRulesOverrides = {
  // Lab and refill may be switched off outright with `null`. The consultation
  // and payment rules accept a partial patch only - see `mergePlanRules`.
  consultation?: Partial<CadenceRule>;
  lab?: Partial<CadenceRule> | null;
  refill?: Partial<CadenceRule> | null;
  payment?: Partial<PaymentRule> | null;
  monitoring?: Partial<MonitoringRule>;
};

/**
 * Merges overrides over the defaults, one level deep.
 *
 * Deliberately shallow per rule: `overrides.lab = { everyDays: 60 }` keeps the
 * default lead time and title for the lab rather than forcing the caller to restate
 * them. A deep merge would be more flexible and would also silently combine a
 * custom lead time with a default title, which is how you end up with a reminder
 * saying "book your test" seven days before a consultation.
 */
export function mergePlanRules(overrides?: PlanRulesOverrides | null): PlanRules {
  if (!overrides) return DEFAULT_PLAN_RULES;
  const mergeCadence = (
    base: CadenceRule | null,
    patch: Partial<CadenceRule> | null | undefined,
    fallback: CadenceRule
  ): CadenceRule | null => {
    if (patch === null) return null;
    if (patch === undefined) return base;
    // Merging onto the fallback, never onto `{}`. A rule that is off by default
    // still has a complete shape; it is simply not switched on.
    return { ...(base ?? fallback), ...patch };
  };

  // The consultation is not nullable: every plan has reviews, and a schedule
  // with none would be a silent failure rather than a policy choice. An attempt
  // to null it therefore falls back to the default instead of disabling it.
  const consultation = mergeCadence(
    DEFAULT_PLAN_RULES.consultation,
    overrides.consultation,
    DEFAULT_PLAN_RULES.consultation
  );

  return {
    consultation: consultation ?? { ...DEFAULT_PLAN_RULES.consultation },
    lab: mergeCadence(DEFAULT_PLAN_RULES.lab, overrides.lab, DEFAULT_PLAN_RULES.lab ?? REFILL_RULE_DEFAULTS),
    refill: mergeCadence(DEFAULT_PLAN_RULES.refill, overrides.refill, REFILL_RULE_DEFAULTS),
    payment:
      overrides.payment === null || overrides.payment === undefined
        ? DEFAULT_PLAN_RULES.payment
        : { ...PAYMENT_RULE_DEFAULTS, ...overrides.payment },
    monitoring: { ...DEFAULT_PLAN_RULES.monitoring, ...(overrides.monitoring ?? {}) },
  };
}

/**
 * Splits a total into `parts` instalments that sum to it exactly.
 *
 * The rounding remainder lands on the *last* instalment rather than being
 * distributed, so the amounts a patient is shown always add up to the total the
 * clinic quoted. Spreading the remainder produces instalments that differ from
 * the stated per-payment figure by a franc or two, which is the kind of
 * discrepancy that turns into a support call.
 *
 * @returns the parts, or an empty array when the split is not meaningful.
 */
export function splitEvenly(total: number, parts: number): number[] {
  if (!Number.isFinite(total) || total < 0) return [];
  if (!Number.isInteger(parts) || parts < 1) return [];
  const base = Math.floor(total / parts);
  const remainder = Math.round(total - base * parts);
  const out = new Array<number>(parts).fill(base);
  if (parts > 0 && remainder > 0) out[parts - 1] = base + remainder;
  return out;
}

/* -------------------------------------------------------------------------- */
/*  Reading overrides out of an untrusted request body                        */
/* -------------------------------------------------------------------------- */

/**
 * A mutable `CadenceRule` patch.
 *
 * `CadenceRule` declares its fields `readonly` because a resolved rule set
 * should not be edited in place. That readonly-ness carries into
 * `Partial<CadenceRule>`, which is correct for a value you already have and
 * useless for one you are still assembling key by key - so the parser builds
 * this instead, and the resolved rule set stays immutable.
 */
type CadencePatch = {
  -readonly [K in keyof CadenceRule]?: CadenceRule[K];
};

/**
 * Parses per-plan rule overrides out of an admin request body.
 *
 * Strict on purpose, and this is the boundary where untrusted data becomes
 * numbers the engine will act on. The derivation already refuses a malformed
 * cadence, but it should never be handed one: an admin form posting
 * `everyDays: ""` must not be able to produce a rule that quietly derives
 * nothing. Every unusable field is dropped and the default stands, so a mistake
 * in a form degrades to the clinic's normal schedule rather than to a plan with
 * no schedule at all.
 *
 * Two deliberate choices:
 *
 * - An explicit `null` is honoured and switches a rule off, because "this patient
 *   needs no repeat labs" is a decision someone can legitimately make. An
 *   *absent* key is left alone. Conflating the two would make it impossible to
 *   say "leave the labs as they are".
 * - A bad amount is treated as "no amount set" rather than passed through.
 *   Billing a patient a negative instalment, or one derived from `"abc"`, is not
 *   a failure mode worth having.
 *
 * @returns the overrides, or `null` when the body carried nothing usable.
 */
export function parseRuleOverrides(raw: unknown): PlanRulesOverrides | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const body = raw as Record<string, unknown>;
  const source = (body.rules ?? body.scheduleRules) as Record<string, unknown> | undefined;
  if (!source || typeof source !== "object" || Array.isArray(source)) return null;

  const wholeDays = (value: unknown, min: number): number | undefined => {
    if (value === null || value === undefined || value === "") return undefined;
    const n = Number(value);
    if (!Number.isInteger(n) || n < min) return undefined;
    return n;
  };
  const text = (value: unknown, max: number): string | undefined => {
    if (value === null || value === undefined) return undefined;
    const t = String(value).trim();
    return t ? t.slice(0, max) : undefined;
  };

  const cadence = (value: unknown): CadencePatch | null | undefined => {
    if (value === null) return null;
    if (value === undefined) return undefined;
    if (typeof value !== "object" || Array.isArray(value)) return undefined;
    const patch = value as Record<string, unknown>;
    const out: CadencePatch = {};
    const everyDays = wholeDays(patch.everyDays, 1);
    if (everyDays !== undefined) out.everyDays = everyDays;
    const firstOffsetDays = wholeDays(patch.firstOffsetDays, 0);
    if (firstOffsetDays !== undefined) out.firstOffsetDays = firstOffsetDays;
    const leadDays = wholeDays(patch.leadDays, 0);
    if (leadDays !== undefined) out.leadDays = leadDays;
    const titleTemplate = text(patch.titleTemplate, 200);
    if (titleTemplate !== undefined) out.titleTemplate = titleTemplate;
    const noteTemplate = text(patch.noteTemplate, 500);
    if (noteTemplate !== undefined) out.noteTemplate = noteTemplate;
    return Object.keys(out).length > 0 ? out : undefined;
  };

  const out: PlanRulesOverrides = {};
  let touched = false;

  const consultation = cadence(source.consultation);
  if (consultation === null) {
    // Reviews cannot be switched off - a plan with no reviews is a silent
    // failure, not a policy. Say so by ignoring the attempt.
    console.warn("[treatment-rules] a plan may not disable its consultation cadence; default kept.");
  } else if (consultation !== undefined) {
    out.consultation = consultation;
    touched = true;
  }

  for (const key of ["lab", "refill"] as const) {
    const parsed = cadence(source[key]);
    if (parsed === null) {
      out[key] = null;
      touched = true;
    } else if (parsed !== undefined) {
      out[key] = parsed;
      touched = true;
    }
  }

  if (source.payment === null) {
    out.payment = null;
    touched = true;
  } else if (source.payment !== undefined) {
    if (typeof source.payment !== "object" || Array.isArray(source.payment)) {
      console.warn("[treatment-rules] ignoring a payment override that is not an object.");
    } else {
      const p = source.payment as Record<string, unknown>;
      const instalments = wholeDays(p.instalments, 1);
      const firstOffsetDays = wholeDays(p.firstOffsetDays, 0);
      const leadDays = wholeDays(p.leadDays, 0);
      const titleTemplate = text(p.titleTemplate, 200);

      const rawTotal = p.totalFcfa;
      let totalFcfa: number | null = null;
      if (rawTotal !== null && rawTotal !== undefined && rawTotal !== "") {
        const n = Number(rawTotal);
        if (Number.isFinite(n) && n > 0) totalFcfa = n;
        else console.warn(`[treatment-rules] ignoring an unusable plan total: ${String(rawTotal)}`);
      }

      if (instalments !== undefined || firstOffsetDays !== undefined || leadDays !== undefined || titleTemplate !== undefined || totalFcfa !== null) {
        out.payment = {
          ...(instalments !== undefined ? { instalments } : {}),
          ...(firstOffsetDays !== undefined ? { firstOffsetDays } : {}),
          ...(leadDays !== undefined ? { leadDays } : {}),
          ...(titleTemplate !== undefined ? { titleTemplate } : {}),
          ...(totalFcfa !== null ? { totalFcfa } : {}),
        };
        touched = true;
      }
    }
  }

  const graceHours = wholeDays(source.monitoring === undefined ? undefined : (source.monitoring as Record<string, unknown>)?.graceHours, 0);
  if (graceHours !== undefined) {
    out.monitoring = { graceHours };
    touched = true;
  }

  return touched ? out : null;
}