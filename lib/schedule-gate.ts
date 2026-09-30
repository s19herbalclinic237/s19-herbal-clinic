/**
 * The switch that decides whether the treatment schedule engine may act.
 *
 * ## Why this module exists
 *
 * M3 works. Issuing a plan derives its reminders, changing the dates re-derives
 * them, closing the plan withdraws them. All of that is tested.
 *
 * But the *numbers* it schedules by are not the clinic's. `lib/treatment-rules.ts`
 * holds reviews every 30 days, labs every 90 days and seven days' notice because
 * those are plausible placeholders I chose - not because a clinician approved
 * them. Deploying the engine as it stands would put those intervals in front of
 * real patients as though the clinic had set them, and a patient told to book a
 * review on a schedule nobody agreed to is a complaint, not a feature.
 *
 * So the engine ships **inert**. It does nothing at all unless someone deliberately
 * turns it on, and turning it on is the moment the clinic has confirmed the
 * intervals.
 *
 * ## Why "inert" and not "removed"
 *
 * Three reasons, and the first is the only one that really matters:
 *
 *  1. **Failing closed is the safe direction.** Off is indistinguishable from the
 *     behaviour the site has always had - a plan creates no reminders - so the
 *     worst outcome of shipping this and being wrong is no change at all. The
 *     worst outcome of the opposite default is patients being told things.
 *  2. **The arithmetic stays tested and reviewable.** The code is live, so it can
 *     be exercised with real plan dates the moment the clinic answers, instead of
 *     sitting in a branch until then and being written cold.
 *  3. **The refusal is legible.** Every refusal names what is missing and where to
 *     read about it, so the gate is a to-do item rather than a mystery.
 *
 * This is the same reasoning as `lib/cron-auth.ts`. There, an unset secret used to
 * mean "open to the world" and the backup endpoint served health records over
 * unauthenticated public GET. Here, an unset flag would have meant "act on
 * unapproved clinical intervals". Both were the same mistake - an unconfigured
 * control defaulting to the dangerous direction.
 *
 * ## The decision is a pure function
 *
 * `evaluateScheduleGate` takes its input as an argument and touches nothing, so it
 * is unit tested directly. It cannot quietly regress into a permissive default
 * later without a test failing.
 */

/** The only value that opens the gate. Anything else, including "1", leaves it shut. */
const ENABLED_VALUE = "true";

/** How much of a wrong value to quote back in the refusal. */
const MAX_ECHOED = 32;

export type ScheduleGateReason = "unconfigured" | "not_enabled";

export type ScheduleGateResult =
  | { enabled: true }
  | { enabled: false; reason: ScheduleGateReason; error: string };

/**
 * The value to quote back to whoever has to fix it.
 *
 * Truncated, because this string goes into a log line and an API response, and an
 * environment variable is not a trustworthy thing to paste into one. Someone who
 * has accidentally set the variable to a pasted secret should not have that secret
 * written to the application log and echoed to a browser.
 */
function quoteForMessage(value: string): string {
  const trimmed = value.trim();
  return trimmed.length > MAX_ECHOED
    ? `${trimmed.slice(0, MAX_ECHOED)}… (${trimmed.length} characters)`
    : trimmed;
}

/**
 * Whether the schedule engine may write.
 *
 * Deliberately strict: only the exact string `"true"` opens it, case-insensitive
 * and trimmed so a stray space in a Vercel env field does not look like a
 * misconfiguration. `"1"`, `"yes"` and `"on"` are *not* accepted, because a flag
 * that means three different things is a flag that will eventually mean the wrong
 * one.
 *
 * There is no development exemption. An environment-conditional rule is one more
 * thing to reason about, and "it behaves differently on my laptop" is how a
 * fail-closed default quietly stops being fail-closed in the one place it matters.
 */
export function evaluateScheduleGate(raw: string | undefined | null): ScheduleGateResult {
  if (raw === undefined || raw === null || raw.trim() === "") {
    return {
      enabled: false,
      reason: "unconfigured",
      error:
        "TREATMENT_SCHEDULE_ENABLED is not set, so no treatment schedule is generated. " +
        "The clinic has not yet confirmed the review, laboratory and notice intervals in " +
        "lib/treatment-rules.ts - see docs/TREATMENT_PLAN_SCHEDULE.md section 6.",
    };
  }

  if (raw.trim().toLowerCase() !== ENABLED_VALUE) {
    return {
      enabled: false,
      reason: "not_enabled",
      error:
        `TREATMENT_SCHEDULE_ENABLED is set to "${quoteForMessage(raw)}" rather than "true", so no ` +
        "treatment schedule is generated. Set it to exactly \"true\" once the clinic has " +
        "confirmed the intervals in lib/treatment-rules.ts.",
    };
  }

  return { enabled: true };
}

/** Convenience wrapper for the one caller that reads the environment. */
export function scheduleGate(): ScheduleGateResult {
  return evaluateScheduleGate(process.env.TREATMENT_SCHEDULE_ENABLED);
}
