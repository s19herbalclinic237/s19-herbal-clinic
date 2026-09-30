import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Authorization for cron endpoints.
 *
 * This module exists because the previous guard was a silent security hole. The
 * backup cron read:
 *
 *   const secret = process.env.CRON_SECRET;
 *   if (secret && process.env.NODE_ENV !== "development") { ...reject... }
 *
 * The `secret &&` means that when `CRON_SECRET` is unset - which is the state
 * this project was actually in - the guard never fires at all. In production the
 * endpoint accepted unauthenticated public GET requests, and invoking it would
 * assemble and email a complete database export, health records included, to the
 * clinic mailbox, on demand, as often as the caller liked.
 *
 * Two properties are enforced here, and both are the point:
 *
 *  1. **Fail closed.** A missing `CRON_SECRET` in production is a hard 503, not
 *     a shrug. An unconfigured secret must never mean "open to the world" -
 *     that inversion is what caused the hole. The cost of failing closed is that
 *     scheduled work stops until the secret is set, which is a loud, fixable
 *     problem; the cost of failing open is a public data exfiltration endpoint.
 *
 *  2. **Constant-time comparison.** A plain `===` on a secret leaks its
 *     prefix through timing, so the value is hashed before comparison. See
 *     `safeEqual`.
 *
 * The decision is a pure function of its inputs and is unit tested, so this
 * cannot quietly regress into a permissive default later.
 */

/** Why a cron request was refused, for logging and for the response body. */
export type CronAuthReason = "unconfigured" | "bad_token";

export type CronAuthResult =
  | { ok: true }
  | { ok: false; status: 401 | 503; reason: CronAuthReason; error: string };

/**
 * Length-independent, timing-safe string comparison.
 *
 * `timingSafeEqual` throws when the buffers differ in length, which would itself
 * leak the secret's length, so both sides are hashed to a fixed width first.
 * The comparison then reveals only whether the values matched - never how much
 * of the guess was right.
 */
export function safeEqual(a: string, b: string): boolean {
  const left = createHash("sha256").update(a, "utf8").digest();
  const right = createHash("sha256").update(b, "utf8").digest();
  return timingSafeEqual(left, right);
}

export interface CronAuthInput {
  /** The raw `authorization` header, or null when absent. */
  authorization: string | null | undefined;
  secret: string | undefined;
  nodeEnv: string | undefined;
}

/**
 * Decides whether a cron request may proceed.
 *
 * Development is exempt so the endpoint stays testable and `npm run dev` does
 * not require a secret. Every other environment must present the shared secret.
 */
export function evaluateCronAuth(input: CronAuthInput): CronAuthResult {
  if (input.nodeEnv === "development") return { ok: true };

  const secret = input.secret?.trim();
  if (!secret) {
    // Deliberately not a 401: this is a server misconfiguration, not a bad
    // request from a caller, and the operator needs to be told which it is.
    return {
      ok: false,
      status: 503,
      reason: "unconfigured",
      error:
        "Scheduled jobs are locked because CRON_SECRET is not set. Set CRON_SECRET in the deployment environment.",
    };
  }

  const header = (input.authorization ?? "").trim();
  if (!header.toLowerCase().startsWith("bearer ")) {
    return { ok: false, status: 401, reason: "bad_token", error: "Unauthorized." };
  }

  const presented = header.slice("bearer ".length).trim();
  if (!safeEqual(presented, secret)) {
    return { ok: false, status: 401, reason: "bad_token", error: "Unauthorized." };
  }

  return { ok: true };
}

/**
 * Human-readable operator guidance for a refusal, used in the log entry so the
 * daily digest tells someone exactly what to do rather than just that it broke.
 */
export function cronAuthGuidance(reason: CronAuthReason): string {
  return reason === "unconfigured"
    ? "Set CRON_SECRET in the Vercel project (and .env.local for local runs). " +
      "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    : "Check that the caller is sending 'Authorization: Bearer <CRON_SECRET>'.";
}
