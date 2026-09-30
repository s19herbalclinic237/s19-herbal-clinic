/**
 * The switch that decides whether outbound **automation** may send to patients.
 *
 * ## What this gate does and does not cover
 *
 * It covers `scheduled` messages only: the reminders, the review prompts, the
 * "you are running low" messages, everything the engine derives by itself.
 *
 * It deliberately does **not** cover `transactional` messages - an appointment
 * confirmation, a cancellation, a new prescription. Those are receipts for something
 * the patient just did, and they are what the site has always sent. Putting them
 * behind a flag the clinic has not yet enabled would be a regression dressed up as
 * caution: the patient books an appointment, and the clinic does not tell them.
 *
 * ## Why automation still ships inert
 *
 * The values the engine acts on are not the clinic's. Quiet hours of 08:00-20:00 and
 * a budget of four messages a week are proposals I chose, documented as such in
 * `lib/outbound-policy.ts`. Sending them to real patients would put intervals in
 * front of people that nobody agreed to, and a patient told to reorder on a schedule
 * the clinic never set is a complaint rather than a feature.
 *
 * So the derived-send path is off until someone deliberately turns it on, and turning
 * it on is the moment the clinic has confirmed the numbers. See
 * `docs/STATE_AND_CREDENTIALS_GAPS.md` §5.
 *
 * The failure direction is the point: the worst outcome of shipping this and being
 * wrong about the cadences is that nothing is sent, which is indistinguishable from
 * the behaviour the site has always had.
 *
 * ## Same shape as `lib/schedule-gate.ts`
 *
 * Only the exact string `"true"` opens it. There is no development exemption, because
 * a rule that behaves differently on a laptop is how a fail-closed default quietly
 * stops being fail-closed in the one place it matters. This is the third instance of
 * that inversion in this codebase - `CRON_SECRET` meaning "open to the world" when
 * unset, `TREATMENT_SCHEDULE_ENABLED` being unset meaning "act anyway" - so the
 * refusal names the variable and the reason every time.
 */

/** The only value that opens the gate. Anything else, including "1", leaves it shut. */
const ENABLED_VALUE = "true";

/** How much of a wrong value to quote back in the refusal. */
const MAX_ECHOED = 32;

export type OutboundGateReason = "unconfigured" | "not_enabled";

export type OutboundGateResult =
  | { enabled: true }
  | { enabled: false; reason: OutboundGateReason; error: string };

/**
 * The value to quote back to whoever has to fix it.
 *
 * Truncated, because this string reaches a log line and an API response, and an
 * environment variable is not a trustworthy thing to paste into either. Someone who
 * has accidentally set the variable to a pasted secret should not have that secret
 * written to the application log and shown in a browser.
 */
function quoteForMessage(value: string): string {
  const trimmed = value.trim();
  return trimmed.length > MAX_ECHOED
    ? `${trimmed.slice(0, MAX_ECHOED)}… (${trimmed.length} characters)`
    : trimmed;
}

/**
 * Whether the outbound automation engine may send scheduled messages.
 *
 * Deliberately strict, and deliberately without a development exemption. A tick run
 * from a laptop should be exactly as unable to message a patient as a tick run from
 * the scheduler.
 */
export function evaluateOutboundGate(raw: string | undefined | null): OutboundGateResult {
  if (raw === undefined || raw === null || raw.trim() === "") {
    return {
      enabled: false,
      reason: "unconfigured",
      error:
        "Outbound automation is switched off because OUTBOUND_AUTOMATION_ENABLED is not set. " +
        "No reminder, review prompt or refill warning is sent. Transactional messages " +
        "(appointment confirmations, prescriptions, order updates) are unaffected. " +
        "Set it to exactly \"true\" once the clinic has confirmed quiet hours and the " +
        "weekly message budget - see docs/STATE_AND_CREDENTIALS_GAPS.md section 5.",
    };
  }

  if (raw.trim().toLowerCase() !== ENABLED_VALUE) {
    return {
      enabled: false,
      reason: "not_enabled",
      error:
        `Outbound automation is switched off because OUTBOUND_AUTOMATION_ENABLED is set to ` +
        `"${quoteForMessage(raw)}" rather than "true". No reminder, review prompt or refill ` +
        `warning is sent. Transactional messages are unaffected.`,
    };
  }

  return { enabled: true };
}

/** Convenience wrapper for the callers that read the environment. */
export function outboundGate(): OutboundGateResult {
  return evaluateOutboundGate(process.env.OUTBOUND_AUTOMATION_ENABLED);
}