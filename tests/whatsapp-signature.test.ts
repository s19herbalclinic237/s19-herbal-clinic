/**
 * Tests for the WhatsApp webhook signature and handshake.
 *
 * These are the tests that matter most in the whole module. Without them, a
 * deployment missing `WHATSAPP_APP_SECRET` would accept a forged POST from anyone
 * who guessed the URL - a forged message from any phone number, resolved to a
 * patient and appended to their health record.
 *
 * That is not hypothetical in this codebase: `CRON_SECRET` was unset, its guard
 * was written as `if (secret && ...)`, and the backup endpoint served a complete
 * database export to unauthenticated callers. The same inversion - "unconfigured
 * means skip the check" - is the failure mode guarded here.
 */

import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { describe, test } from "node:test";

import {
  evaluateHubChallenge,
  evaluateHubSignature,
  hubAuthGuidance,
  signHubPayload,
} from "@/lib/whatsapp-signature";

const SECRET = "test-secret";
const NODE_ENV = "production";

/** A body with real shape, so the tests are not signing an empty string. */
const BODY = '{"object":"whatsapp_business_account","entry":[]}';

/** Independently computed with node:crypto, not with `signHubPayload`. */
const BODY_DIGEST =
  "cc96f69f5295238707076d443c89d5808d96b634779c922fab0ba9ca5354554e";

function signatureFor(body: string, secret = SECRET): string {
  return `sha256=${createHmac("sha256", secret).update(body, "utf8").digest("hex")}`;
}

function verify(overrides: Partial<Parameters<typeof evaluateHubSignature>[0]> = {}) {
  return evaluateHubSignature({
    rawBody: BODY,
    signature: signatureFor(BODY),
    appSecret: SECRET,
    nodeEnv: NODE_ENV,
    ...overrides,
  });
}

describe("the signature is computed correctly", () => {
  test("matches a known HMAC-SHA256 vector", () => {
    // Hard-coded so this test cannot pass by comparing the implementation with
    // itself. If `signHubPayload` were wrong in the same way the verifier is
    // wrong, this vector is what catches it.
    assert.equal(signHubPayload(BODY, SECRET), `sha256=${BODY_DIGEST}`);
  });

  test("signs the empty body", () => {
    // An empty body is a real case: Meta's subscription-confirmation POST is
    // small, and a body of zero length must still be verifiable.
    assert.equal(
      signHubPayload("", SECRET),
      "sha256=a41bc6d81d6413576ae0994995e0ad89a416ec97389515c3604f47722122eeeb"
    );
  });

  test("is deterministic", () => {
    assert.equal(signHubPayload(BODY, SECRET), signHubPayload(BODY, SECRET));
  });

  test("changes with the secret", () => {
    assert.notEqual(signHubPayload(BODY, SECRET), signHubPayload(BODY, "other-secret"));
  });
});

describe("a genuine delivery is accepted", () => {
  test("the right signature for the right body passes", () => {
    assert.equal(verify().ok, true);
  });

  test("an uppercase hex digest is accepted", () => {
    // Meta sends lowercase, but a case difference is not a forgery and refusing
    // it would be a support question rather than a security improvement.
    const upper = `sha256=${BODY_DIGEST.toUpperCase()}`;
    assert.equal(verify({ signature: upper }).ok, true);
  });

  test("surrounding whitespace in the header is tolerated", () => {
    assert.equal(verify({ signature: `  ${signatureFor(BODY)}  ` }).ok, true);
  });

  test("an empty body with a correct signature passes", () => {
    const result = evaluateHubSignature({
      rawBody: "",
      signature: signatureFor(""),
      appSecret: SECRET,
      nodeEnv: NODE_ENV,
    });
    assert.equal(result.ok, true);
  });
});

describe("a forged delivery is refused", () => {
  test("a signature for a different body is refused", () => {
    // The forgery that matters: a correct-looking header over someone else's
    // payload, or a payload edited after signing.
    const result = verify({ rawBody: '{"entry":[{"changes":[]}]}' });
    assert.equal(result.ok, false);
    if (result.ok) throw new Error("unreachable");
    assert.equal(result.reason, "bad_signature");
    assert.equal(result.status, 401);
  });

  test("changing one byte of the body invalidates it", () => {
    // A single space is enough. This is the property that makes the signature
    // worth anything, and it is the reason the route must never re-serialise.
    const original = evaluateHubSignature({
      rawBody: BODY,
      signature: signatureFor(BODY),
      appSecret: SECRET,
      nodeEnv: NODE_ENV,
    });
    const tampered = evaluateHubSignature({
      rawBody: `${BODY} `,
      signature: signatureFor(BODY),
      appSecret: SECRET,
      nodeEnv: NODE_ENV,
    });
    assert.equal(original.ok, true);
    assert.equal(tampered.ok, false);
  });

  test("a signature made with the wrong secret is refused", () => {
    assert.equal(verify({ signature: signatureFor(BODY, "attacker-secret") }).ok, false);
  });

  test("a signature made with an empty secret is refused", () => {
    assert.equal(verify({ signature: signatureFor(BODY, "") }).ok, false);
  });

  test("no signature at all is refused", () => {
    const result = verify({ signature: null });
    assert.equal(result.ok, false);
    if (result.ok) throw new Error("unreachable");
    assert.equal(result.reason, "missing_signature");
    assert.equal(result.status, 401);
  });

  test("an empty signature is refused", () => {
    assert.equal(verify({ signature: "" }).ok, false);
  });

  test("a bare digest with no algorithm prefix is refused", () => {
    // Accepting a bare hex digest would mean accepting anything that happens to
    // be 64 hex characters.
    assert.equal(verify({ signature: BODY_DIGEST }).ok, false);
  });

  test("Meta's deprecated sha1 scheme is refused, not upgraded", () => {
    const sha1 = createHmac("sha1", SECRET).update(BODY, "utf8").digest("hex");
    const result = verify({ signature: `sha1=${sha1}` });
    assert.equal(result.ok, false);
    if (result.ok) throw new Error("unreachable");
    assert.equal(result.reason, "bad_signature");
  });

  test("truncated and over-long digests are refused without throwing", () => {
    // `timingSafeEqual` throws on a length mismatch, which would itself leak the
    // expected length. These must be clean refusals, not exceptions - an exception
    // here would be a 500, which tells a prober something.
    for (const hex of ["abc", "a".repeat(63), "a".repeat(65), "a".repeat(4096)]) {
      const result = verify({ signature: `sha256=${hex}` });
      assert.equal(result.ok, false, `sha256=${hex.slice(0, 12)} was accepted`);
    }
  });

  test("non-hex characters in the digest are refused", () => {
    const result = verify({ signature: `sha256=${"z".repeat(64)}` });
    assert.equal(result.ok, false);
  });
});

describe("an unconfigured deployment refuses rather than opens", () => {
  test("a missing app secret is refused in production", () => {
    // The single most important assertion in this file. If it ever passes, anyone
    // who finds the webhook URL can post forged patient messages.
    const result = evaluateHubSignature({
      rawBody: BODY,
      signature: signatureFor(BODY),
      appSecret: undefined,
      nodeEnv: NODE_ENV,
    });
    assert.equal(result.ok, false);
    if (result.ok) throw new Error("unreachable");
    assert.equal(result.reason, "unconfigured");
  });

  test("a missing app secret is refused even when a valid signature is supplied", () => {
    // The order of the checks is the point. "No secret" cannot be a pass just
    // because the caller happened to send a header.
    assert.equal(verify({ appSecret: undefined }).ok, false);
  });

  test("a blank or whitespace app secret is refused", () => {
    for (const appSecret of ["", "   ", "\t", "\n"]) {
      const result = verify({ appSecret });
      assert.equal(result.ok, false, `${JSON.stringify(appSecret)} opened the webhook`);
    }
  });

  test("an unconfigured refusal is a 503, not a 401", () => {
    // 503 says "the deployment is broken"; 401 says "you are not allowed". The
    // operator needs to be able to tell them apart in a log.
    const result = evaluateHubSignature({
      rawBody: BODY,
      signature: null,
      appSecret: undefined,
      nodeEnv: NODE_ENV,
    });
    assert.equal(result.ok, false);
    if (result.ok) throw new Error("unreachable");
    assert.equal(result.status, 503);
  });

  test("a production environment is not special-cased by name", () => {
    // Only the exact string "development" is exempt. "test", "staging" and
    // "prod-ish" are all production, because that is where patient data is.
    for (const nodeEnv of ["test", "staging", "dev", "prod", "PRODUCTION", undefined, ""]) {
      const result = evaluateHubSignature({
        rawBody: BODY,
        signature: null,
        appSecret: undefined,
        nodeEnv,
      });
      assert.equal(result.ok, false, `${String(nodeEnv)} opened the webhook`);
    }
  });

  test("development is exempt so the endpoint can be exercised locally", () => {
    // The one exemption, and it is a real one: a local dev server has no patient
    // data behind it.
    const result = evaluateHubSignature({
      rawBody: BODY,
      signature: null,
      appSecret: undefined,
      nodeEnv: "development",
    });
    assert.equal(result.ok, true);
  });
});

describe("refusals explain themselves", () => {
  test("every reason has guidance", () => {
    for (const reason of [
      "unconfigured",
      "missing_signature",
      "bad_signature",
      "bad_token",
      "bad_mode",
    ] as const) {
      const guidance = hubAuthGuidance(reason);
      assert.ok(guidance.length > 20, `${reason} has no usable guidance`);
    }
  });

  test("an unconfigured refusal names the variable", () => {
    const result = evaluateHubSignature({
      rawBody: BODY,
      signature: null,
      appSecret: undefined,
      nodeEnv: NODE_ENV,
    });
    assert.equal(result.ok, false);
    if (result.ok) throw new Error("unreachable");
    assert.match(result.error, /WHATSAPP_APP_SECRET/);
  });

  test("a caller-facing refusal does not explain the attack surface", () => {
    // `bad_signature` must not say "the digest did not match", which tells a
    // prober they were close. The detail belongs in the log, not the response.
    const result = verify({ rawBody: "different" });
    assert.equal(result.ok, false);
    if (result.ok) throw new Error("unreachable");
    assert.equal(result.error, "Unauthorized.");
  });
});

describe("the subscription handshake", () => {
  const token = "my-verify-token";

  function challenge(overrides: Partial<Parameters<typeof evaluateHubChallenge>[0]> = {}) {
    return evaluateHubChallenge({
      mode: "subscribe",
      token,
      challenge: "1158201444",
      verifyToken: token,
      nodeEnv: NODE_ENV,
      ...overrides,
    });
  }

  test("the right token gets the challenge echoed back", () => {
    const result = challenge();
    assert.equal(result.ok, true);
    if (!result.ok) throw new Error("unreachable");
    assert.equal(result.challenge, "1158201444");
  });

  test("a wrong token is refused", () => {
    const result = challenge({ token: "guessed" });
    assert.equal(result.ok, false);
    if (result.ok) throw new Error("unreachable");
    assert.equal(result.reason, "bad_token");
    assert.equal(result.status, 403);
  });

  test("a missing token is refused", () => {
    assert.equal(challenge({ token: null }).ok, false);
    assert.equal(challenge({ token: "" }).ok, false);
  });

  test("a mode other than subscribe is refused", () => {
    // Meta only uses `subscribe` for a subscription attempt. Refusing everything
    // else means a probe cannot use this endpoint for anything.
    for (const mode of ["unsubscribe", "", null, "SUBSCRIBE "]) {
      const result = challenge({ mode });
      assert.equal(result.ok, false, `${String(mode)} was accepted`);
    }
  });

  test("a missing challenge is refused", () => {
    // Echoing an empty body would be a 200 that subscribes nothing, which reads
    // as success in Meta's dashboard and leaves the clinic believing it is wired
    // up. Better to fail loudly.
    const result = challenge({ challenge: null });
    assert.equal(result.ok, false);
    if (result.ok) throw new Error("unreachable");
    assert.equal(result.status, 400);
  });

  test("a missing verify token is a 503, not a pass", () => {
    const result = challenge({ verifyToken: undefined });
    assert.equal(result.ok, false);
    if (result.ok) throw new Error("unreachable");
    assert.equal(result.reason, "unconfigured");
    assert.equal(result.status, 503);
    assert.match(result.error, /WHATSAPP_VERIFY_TOKEN/);
  });

  test("the challenge is echoed verbatim, unquoted", () => {
    // Meta compares the body byte-for-byte. A JSON string would not match, and
    // the clinic would never subscribe while believing it had.
    const result = challenge({ challenge: "1158201444" });
    assert.equal(result.ok, true);
    if (!result.ok) throw new Error("unreachable");
    assert.equal(JSON.parse(result.challenge), 1158201444);
    assert.equal(result.challenge, "1158201444");
  });

  test("development is exempt, as for signatures", () => {
    const result = evaluateHubChallenge({
      mode: "subscribe",
      token: "anything",
      challenge: "42",
      verifyToken: undefined,
      nodeEnv: "development",
    });
    assert.equal(result.ok, true);
    if (!result.ok) throw new Error("unreachable");
    assert.equal(result.challenge, "42");
  });
});
