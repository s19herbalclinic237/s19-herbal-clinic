import { NextResponse } from "next/server";
import {
  MAX_WEBHOOK_BODY_BYTES,
  evaluateHubChallenge,
  evaluateHubSignature,
  hubAuthGuidance,
} from "@/lib/whatsapp-signature";
import { parseWebhookPayload } from "@/lib/whatsapp-inbound";
import { receiveInbound } from "@/lib/whatsapp-inbound-log";
import { recordAppLog } from "@/lib/app-log";

/**
 * Meta's WhatsApp webhook.
 *
 * Before this route existed, a patient could reply to any message the clinic
 * sent and Meta would deliver it here - except there was no here, so the reply
 * was discarded. That is the whole gap M1 closes, plus the parts needed to make
 * closing it safe.
 *
 * ## Why the body is read as text and never as JSON
 *
 * The signature is an HMAC of the raw bytes. `JSON.parse` discards key order and
 * whitespace, so `JSON.stringify(await request.json())` does not reproduce the
 * body Meta signed, and the digest never matches. Reading once as text and handing
 * the *same string* to both the verifier and the parser is the only correct
 * order, and it is why this route does not use `request.json()`.
 *
 * ## The three status codes, and why each one
 *
 * - **400** - the body was not a webhook payload. Meta will not retry, and should
 *   not: retrying a request that will never become valid is how a misconfigured
 *   URL turns into a delivery backlog.
 * - **401** - the signature did not verify. Retrying will not help. This is the
 *   response that stops forged patient messages, and it is deliberately not a 403
 *   or a silent 200, both of which let a prober keep trying.
 * - **503** - we could not store what arrived. Meta **will** retry, which is the
 *   point: an unanswered patient is worse than a slow one, so a transient database
 *   outage must be visible to Meta as a failure rather than swallowed into a 200.
 *
 * Everything else is a 200, including "there was nothing here". Meta's
 * subscription-confirmation POST, a delivery receipt for a message we sent, and a
 * redelivery we have already handled are all successes.
 */

// Not cached, and never to be. This is a POST endpoint that must be reachable by
// Meta's infrastructure at all times, and a cached response would be a lie.
export const dynamic = "force-dynamic";

/** No body size limit from the platform: Meta's payloads are small, but a
 *  misconfigured or hostile caller should not be able to make this route allocate
 *  an arbitrary amount of memory before the signature is even checked. */
export const maxDuration = 30;

/**
 * Subscription handshake. Meta calls this once when the webhook URL is saved, and
 * subscribes only if the challenge is echoed back.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);

  const result = evaluateHubChallenge({
    mode: url.searchParams.get("hub.mode"),
    token: url.searchParams.get("hub.verify_token"),
    challenge: url.searchParams.get("hub.challenge"),
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
    nodeEnv: process.env.NODE_ENV,
  });

  if (!result.ok) {
    await recordAppLog({
      level: "error",
      source: "request",
      scope: "whatsapp-webhook",
      message: `WhatsApp handshake refused: ${result.reason}`,
      context: JSON.stringify({ status: result.status, guidance: hubAuthGuidance(result.reason) }),
      route: "/api/webhooks/whatsapp",
      method: "GET",
      status: result.status,
    });
    return NextResponse.json({ error: result.error, reason: result.reason }, { status: result.status });
  }

  // `text/plain`, and the challenge verbatim. Meta compares the body
  // byte-for-byte, so a JSON string with quotes around it does not match and the
  // clinic silently never subscribes.
  return new Response(result.challenge, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

/** Inbound events. */
export async function POST(request: Request) {
  // One read, used for both the signature and the parse. See the note above.
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: "Could not read the request body." }, { status: 400 });
  }

  if (rawBody.length > MAX_WEBHOOK_BODY_BYTES) {
    // Rejected on size before anything is parsed. No legitimate delivery is this
    // large, and a megabyte-scale body is either a mistake or an attempt to make
    // this route do work.
    return NextResponse.json({ error: "Payload too large." }, { status: 413 });
  }

  const auth = evaluateHubSignature({
    rawBody,
    signature: request.headers.get("x-hub-signature-256"),
    appSecret: process.env.WHATSAPP_APP_SECRET,
    nodeEnv: process.env.NODE_ENV,
  });

  if (!auth.ok) {
    // Logged, not silently refused. A deployment missing the app secret looks
    // exactly like a flood of forgeries otherwise, and the two need different
    // fixes.
    await recordAppLog({
      level: "error",
      source: "request",
      scope: "whatsapp-webhook",
      message: `WhatsApp delivery refused: ${auth.reason}`,
      context: JSON.stringify({ status: auth.status, guidance: hubAuthGuidance(auth.reason) }),
      route: "/api/webhooks/whatsapp",
      method: "POST",
      status: auth.status,
    });
    return NextResponse.json({ error: auth.error, reason: auth.reason }, { status: auth.status });
  }

  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    // A verified signature over a body that is not JSON means Meta is broken, not
    // that a caller is hostile. 400, and it is recorded.
    await recordAppLog({
      level: "error",
      source: "request",
      scope: "whatsapp-webhook",
      message: "WhatsApp delivery had a valid signature but a body that is not JSON",
      route: "/api/webhooks/whatsapp",
      method: "POST",
      status: 400,
    });
    return NextResponse.json({ error: "Body was not valid JSON." }, { status: 400 });
  }

  const payload = parseWebhookPayload(json, Date.now());
  if (payload.malformed) {
    return NextResponse.json({ error: "Not a WhatsApp webhook payload." }, { status: 400 });
  }

  // Never throws: it reports what it could not store, which is what the status
  // code below is chosen from.
  const summary = await receiveInbound(payload);

  // 503 when something arrived that we did not manage to keep. Meta retries, and
  // the retry collapses onto the `wamid` unique index, so the messages that *did*
  // store are not processed twice.
  const status = summary.ok && summary.failed === 0 ? 200 : 503;

  return NextResponse.json(
    {
      received: summary.received,
      stored: summary.stored,
      duplicates: summary.duplicates,
      ignoredSelf: summary.ignoredSelf,
      needsAttention: summary.needsAttention,
      optOuts: summary.optOuts,
      statusesApplied: summary.statusesApplied,
      ...(summary.failed > 0 ? { failed: summary.failed } : {}),
      ...(summary.rejected.length > 0 ? { rejected: summary.rejected.slice(0, 5) } : {}),
      ...(summary.error ? { error: summary.error } : {}),
    },
    { status }
  );
}
