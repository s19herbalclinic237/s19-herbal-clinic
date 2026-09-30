import { createHmac } from "node:crypto";

import { safeEqual } from "@/lib/cron-auth";

/**
 * Authenticating Meta's webhook.
 *
 * ## Why this module exists, in one paragraph
 *
 * A webhook endpoint with no signature check is an open door. Anyone who learns
 * the URL can POST a payload claiming to be a message from any phone number, and
 * this application will resolve it to a patient, append it to that patient's
 * health record as something they said, and open a 24-hour free-text sending
 * window on their record. That is forged clinical data and forged consent in one
 * request, from anyone on the internet. The signature is the only thing standing
 * between that and the patient file, so it is verified on every single delivery.
 *
 * ## Two ways this goes wrong, and both are handled
 *
 * **An unset app secret must not mean "accept".** The same inversion that made
 * `CRON_SECRET` expose a full database export - a guard written as
 * `if (secret && ...)` so that an unconfigured secret skipped the check entirely -
 * would here mean that a deployment without `WHATSAPP_APP_SECRET` accepts forged
 * patient messages. Unset is a hard refusal in production, not a pass.
 *
 * **Verification must run against the raw bytes.** Re-serialising the parsed JSON
 * and hashing that produces a different digest, because key order and whitespace
 * are not preserved by `JSON.parse`. A verifier that reads `await request.json()`
 * and re-stringifies it rejects every genuine delivery while still refusing forgeries
 * - it fails closed but useless. The route therefore reads `await request.text()`
 * once and hands the identical string to both the verifier and the JSON parser.
 *
 * ## Why the decisions are pure functions
 *
 * Same reason as `lib/cron-auth.ts`: a security decision that can only be exercised
 * by standing up a server and forging traffic is one that quietly rots. Both
 * decisions take their inputs as arguments and are unit tested directly.
 */

export type HubAuthReason =
  /** `WHATSAPP_APP_SECRET` is not set, so nothing can be verified. */
  | "unconfigured"
  /** No `X-Hub-Signature-256` header at all. */
  | "missing_signature"
  /** Header present but does not match the body. */
  | "bad_signature"
  /** Subscription handshake with an unknown verify token. */
  | "bad_token"
  /** Subscription handshake for a mode other than `subscribe`. */
  | "bad_mode";

export type HubAuthResult =
  | { ok: true }
  | { ok: false; status: 401 | 503; reason: HubAuthReason; error: string };

/** Header Meta signs deliveries with. The `sha256=` prefix is part of the value. */
export const HUB_SIGNATURE_HEADER = "x-hub-signature-256";

/** The prefix Meta puts in front of the hex digest. */
const SIGNATURE_PREFIX = "sha256=";

/** A SHA-256 digest in hex. */
const DIGEST_LENGTH = 64;

/** Longest body accepted. Meta's real payloads are a few kilobytes. */
export const MAX_WEBHOOK_BODY_BYTES = 1_048_576;

/**
 * Computes the digest Meta would send for a body.
 *
 * Exported so the tests can build a genuinely valid signature rather than a
 * hand-waved one - a test that invents its own "expected" value proves nothing.
 */
export function signHubPayload(rawBody: string, appSecret: string): string {
  return `${SIGNATURE_PREFIX}${createHmac("sha256", appSecret)
    .update(rawBody, "utf8")
    .digest("hex")}`;
}

/**
 * Constant-time digest comparison, by way of hashing both sides first.
 *
 * `timingSafeEqual` throws on a length mismatch, which would itself leak the
 * length of the expected digest, so both values are hashed to a fixed width
 * before comparison. Reusing `safeEqual` rather than reimplementing it keeps one
 * comparison primitive in the codebase.
 */
function digestMatches(rawBody: string, appSecret: string, presented: string): boolean {
  const expected = signHubPayload(rawBody, appSecret);
  return safeEqual(expected, presented);
}

/**
 * A presented header is only compared if it is even shaped like one.
 *
 * Length and alphabet are checked first, and rejected early, because a header of
 * the wrong length is not a near miss - it is not a signature at all, and there is
 * nothing to compare.
 */
function wellFormedSignature(presented: string): boolean {
  if (!presented.startsWith(SIGNATURE_PREFIX)) return false;
  const hex = presented.slice(SIGNATURE_PREFIX.length);
  return hex.length === DIGEST_LENGTH && /^[0-9a-f]{64}$/i.test(hex);
}

export interface HubSignatureInput {
  /** The request body exactly as received. Never a re-serialised object. */
  rawBody: string;
  /** The `X-Hub-Signature-256` header, or null when absent. */
  signature: string | null | undefined;
  appSecret: string | undefined;
  nodeEnv: string | undefined;
}

/**
 * Decides whether a delivery may be processed.
 *
 * Development is exempt so the endpoint can be exercised with `curl` during
 * development, which is the one place where an unauthenticated write is harmless
 * because there is no patient data behind it. Production has no exemption.
 */
export function evaluateHubSignature(input: HubSignatureInput): HubAuthResult {
  if (input.nodeEnv === "development") return { ok: true };

  const secret = input.appSecret?.trim();
  if (!secret) {
    // 503, not 401. This is the deployment's fault, not the caller's, and the
    // operator needs to be able to tell the two apart in a log.
    return {
      ok: false,
      status: 503,
      reason: "unconfigured",
      error:
        "WhatsApp webhook is locked because WHATSAPP_APP_SECRET is not set. " +
        "Set it in the deployment environment (App Settings -> Basic -> App Secret).",
    };
  }

  const presented = (input.signature ?? "").trim();
  if (!presented) {
    return {
      ok: false,
      status: 401,
      reason: "missing_signature",
      error: "Unauthorized.",
    };
  }

  // A `sha1=` header is Meta's deprecated scheme. It is not accepted and not
  // silently upgraded: accepting it would mean sending forged messages is one
  // header rewrite away.
  //
  // The hex is lower-cased before comparison. A hex digest is case-insensitive by
  // definition and Meta sends lowercase, so rejecting an uppercase digest would
  // buy nothing and would produce a support question the first time an
  // intermediary rewrote the header. The `sha256=` prefix stays strict, because
  // that is a fixed constant rather than a digest.
  const canonical = presented.toLowerCase();
  if (!wellFormedSignature(canonical) || !digestMatches(input.rawBody, secret, canonical)) {
    return { ok: false, status: 401, reason: "bad_signature", error: "Unauthorized." };
  }

  return { ok: true };
}

export interface HubChallengeInput {
  /** `hub.mode` query parameter. */
  mode: string | null | undefined;
  /** `hub.verify_token` query parameter. */
  token: string | null | undefined;
  /** `hub.challenge` query parameter, to be echoed back. */
  challenge: string | null | undefined;
  verifyToken: string | undefined;
  nodeEnv: string | undefined;
}

export type HubChallengeResult =
  | { ok: true; challenge: string }
  | { ok: false; status: 400 | 403 | 503; reason: HubAuthReason; error: string };

/**
 * Handles Meta's subscription handshake.
 *
 * Meta calls the URL once, with the verify token in the query string, and only
 * subscribes if the endpoint echoes `hub.challenge` back. The token is compared in
 * constant time for the same reason the signature is: a handshake guard that
 * leaks its token through timing is a handshake guard that can be brute-forced.
 *
 * The challenge is echoed as `text/plain`, not JSON. Meta compares the body
 * byte-for-byte, and a JSON string with quotes around it does not match.
 */
export function evaluateHubChallenge(input: HubChallengeInput): HubChallengeResult {
  if (input.nodeEnv === "development") return { ok: true, challenge: input.challenge ?? "" };

  const expected = input.verifyToken?.trim();
  if (!expected) {
    return {
      ok: false,
      status: 503,
      reason: "unconfigured",
      error:
        "WhatsApp webhook handshake is locked because WHATSAPP_VERIFY_TOKEN is not set. " +
        "Set it to the same value you entered in the Meta webhook configuration.",
    };
  }

  if ((input.mode ?? "").trim() !== "subscribe") {
    return {
      ok: false,
      status: 400,
      reason: "bad_mode",
      error: "Unsupported hub.mode.",
    };
  }

  const presented = (input.token ?? "").trim();
  if (!presented || !safeEqual(presented, expected)) {
    return { ok: false, status: 403, reason: "bad_token", error: "Verify token mismatch." };
  }

  const challenge = (input.challenge ?? "").trim();
  if (!challenge) {
    return { ok: false, status: 400, reason: "bad_mode", error: "Missing hub.challenge." };
  }

  return { ok: true, challenge };
}

/** Operator guidance for a refusal, so a log entry says what to do. */
export function hubAuthGuidance(reason: HubAuthReason): string {
  switch (reason) {
    case "unconfigured":
      return "Set WHATSAPP_APP_SECRET (App Settings -> Basic) and WHATSAPP_VERIFY_TOKEN in the deployment environment.";
    case "missing_signature":
      return "Meta must be configured to POST to this URL. Check the webhook URL and that no proxy strips X-Hub-Signature-256.";
    case "bad_signature":
      return "The signature did not match the body. Usual causes: a proxy re-serialising the JSON, a stale app secret, or a forged request.";
    case "bad_token":
      return "Check WHATSAPP_VERIFY_TOKEN matches the verify token in the Meta webhook configuration.";
    case "bad_mode":
      return "Meta only sends hub.mode=subscribe for a subscription attempt.";
  }
}
