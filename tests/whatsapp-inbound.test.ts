/**
 * Tests for reading Meta's inbound payload, and for deciding what a message means.
 *
 * The parser is the boundary between a third party's JSON and a patient's health
 * record, so most of what follows is hostile input: a `wamid` that is not a
 * string, a `from` that is not a number, a timestamp from the year 1970, a
 * `messages` value that is a string rather than an array.
 *
 * The intent tests matter just as much. There is no language model anywhere in
 * this project, so intent is a lookup, not a judgement - and the one place a
 * lookup can do real harm is deciding that a patient asked to stop hearing from
 * the clinic.
 */

import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  INBOUND_TEXT_MAX,
  OPT_OUT_WORDS,
  TIMESTAMP_FUTURE_TOLERANCE_MS,
  classifyInbound,
  inboundPhone,
  isOptOut,
  isOptOutIntent,
  isServiceWindowOpen,
  needsHuman,
  normaliseInboundTimestamp,
  optOutEffects,
  parseInboundMessage,
  parseInboundStatus,
  parseWebhookPayload,
  usableInboundPhone,
  windowExpiryFor,
  type InboundMessage,
} from "@/lib/whatsapp-inbound";
import {
  MAX_TEMPLATE_BUTTONS,
  WHATSAPP_ACTIONS,
  WHATSAPP_TEMPLATES,
  buildButtonPayload,
  parseButtonPayload,
  templateButtons,
  type WhatsAppAction,
} from "@/lib/whatsapp-templates";

/** 2026-03-01T12:00:00Z, in the clinic's timezone that is 13:00 on the 1st. */
const NOW = Date.UTC(2026, 2, 1, 12, 0, 0);

function message(overrides: Partial<InboundMessage> = {}): InboundMessage {
  return {
    wamid: "wamid.TEST",
    from: "237672595989",
    timestamp: NOW,
    kind: "text",
    timestampAssumed: false,
    ...overrides,
  };
}

/** A payload shaped exactly as Meta sends one. */
function metaMessage(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "wamid.ABC123",
    from: "237699887766",
    timestamp: String(NOW),
    type: "text",
    message: { from: "237699887766", id: "wamid.ABC123", timestamp: String(NOW), type: "text", text: { body: "Hello" } },
    metadata: { display_phone_number: "237672595989", phone_number_id: "111222333" },
    ...overrides,
  };
}

function metaPayload(values: unknown[]): Record<string, unknown> {
  return {
    object: "whatsapp_business_account",
    entry: [
      {
        id: "WABA_ID",
        changes: [
          {
            field: "messages",
            value: {
              messaging_product: "whatsapp",
              metadata: { display_phone_number: "237672595989" },
              messages: values,
            },
          },
        ],
      },
    ],
  };
}

/* ------------------------------------------------------------------ */
/* Phone numbers                                                       */
/* ------------------------------------------------------------------ */

describe("sender numbers", () => {
  test("digits are extracted from any formatting", () => {
    assert.equal(inboundPhone("+237 672 595 989"), "237672595989");
    assert.equal(inboundPhone("(237)672-595-989"), "237672595989");
    assert.equal(inboundPhone("237672595989"), "237672595989");
  });

  test("a non-string is empty rather than a crash", () => {
    for (const value of [null, undefined, 42, {}, []]) {
      assert.equal(inboundPhone(value), "");
    }
  });

  test("a usable number passes", () => {
    assert.equal(usableInboundPhone("+237672595989"), "237672595989");
  });

  test("a number too short to be real is refused", () => {
    // The failure this prevents: a conversation row keyed on a two-digit
    // "number", created by a malformed payload, that staff then cannot act on.
    for (const value of ["1", "123", "1234567", "++", "+237-"]) {
      assert.equal(usableInboundPhone(value), null, `${value} was accepted as a sender`);
    }
  });

  test("a number too long for E.164 is refused", () => {
    assert.equal(usableInboundPhone("1234567890123456"), null);
    assert.equal(usableInboundPhone("9".repeat(15)), "999999999999999");
  });
});

/* ------------------------------------------------------------------ */
/* Timestamps and the service window                                   */
/* ------------------------------------------------------------------ */

describe("timestamps are normalised, never trusted", () => {
  test("a sane millisecond timestamp is used as given", () => {
    const result = normaliseInboundTimestamp(String(NOW - 60_000), NOW);
    assert.equal(result.assumed, false);
    assert.equal(result.timestamp, NOW - 60_000);
  });

  test("a numeric timestamp is accepted", () => {
    const result = normaliseInboundTimestamp(NOW - 1000, NOW);
    assert.equal(result.assumed, false);
    assert.equal(result.timestamp, NOW - 1000);
  });

  test("a missing timestamp falls back to now and says so", () => {
    for (const value of [undefined, null, "", "not-a-number", {}, []]) {
      const result = normaliseInboundTimestamp(value, NOW);
      assert.equal(result.timestamp, NOW);
      assert.equal(result.assumed, true, `${JSON.stringify(value)} was not flagged as assumed`);
    }
  });

  test("a timestamp far in the future is clamped", () => {
    // Otherwise a forged timestamp hands a patient - or a bot - a free-form
    // sending window that should not exist.
    const hostile = NOW + 365 * 24 * 60 * 60 * 1000;
    const result = normaliseInboundTimestamp(String(hostile), NOW);
    assert.equal(result.timestamp, NOW + TIMESTAMP_FUTURE_TOLERANCE_MS);
    assert.equal(result.assumed, true);
  });

  test("a small amount of clock drift is tolerated", () => {
    // Our server and Meta's are not the same machine. Two minutes of drift is
    // normal and must not be flagged.
    const result = normaliseInboundTimestamp(String(NOW + 120_000), NOW);
    assert.equal(result.assumed, false);
  });

  test("a timestamp of zero is treated as missing, leaving the window open", () => {
    // `new Date(0)` is 1970. Window arithmetic on it yields a date in 1970, so the
    // window would be permanently closed and a patient mid-conversation forced
    // onto templates. Falling back to `now` avoids that outright.
    const result = normaliseInboundTimestamp("0", NOW);
    assert.equal(result.timestamp, NOW);
    assert.equal(result.assumed, true);
    assert.ok(isServiceWindowOpen(windowExpiryFor(result.timestamp), NOW));
  });

  test("a timestamp from 1970 is clamped rather than used raw", () => {
    const result = normaliseInboundTimestamp("1000", NOW);
    assert.equal(result.timestamp, NOW - 30 * 24 * 60 * 60 * 1000);
    assert.equal(result.assumed, true);
  });

  test("a 1970 timestamp cannot produce an open window", () => {
    // The safe direction. A timestamp from before the clinic existed must not
    // hand anyone a free-form sending window - not a never-expiring one, and not
    // an open one either. Used raw it would compute a window in 1970, which is
    // closed, and that is the correct answer.
    const result = normaliseInboundTimestamp("1000", NOW);
    assert.equal(isServiceWindowOpen(windowExpiryFor(result.timestamp), NOW), false);
  });

  test("a genuinely old but plausible timestamp still gets a closed window", () => {
    // Meta retries over days, so a redelivery of a three-day-old message is
    // normal. Deduplication handles it; the window has correctly expired.
    const threeDaysAgo = NOW - 3 * 24 * 60 * 60 * 1000;
    const result = normaliseInboundTimestamp(String(threeDaysAgo), NOW);
    assert.equal(result.assumed, false);
    assert.equal(isServiceWindowOpen(windowExpiryFor(result.timestamp), NOW), false);
  });

  test("a negative timestamp is refused rather than wrapping", () => {
    const result = normaliseInboundTimestamp("-1", NOW);
    assert.equal(result.assumed, true);
    assert.ok(result.timestamp > 0);
  });
});

describe("the 24-hour service window", () => {
  test("it closes exactly 24 hours after the message", () => {
    const expiry = windowExpiryFor(NOW);
    assert.equal(expiry.getTime(), NOW + 24 * 60 * 60 * 1000);
  });

  test("it is open just inside and closed just outside", () => {
    const expiry = windowExpiryFor(NOW);
    assert.equal(isServiceWindowOpen(expiry, NOW + 24 * 60 * 60 * 1000 - 1), true);
    assert.equal(isServiceWindowOpen(expiry, NOW + 24 * 60 * 60 * 1000), false);
    assert.equal(isServiceWindowOpen(expiry, NOW + 24 * 60 * 60 * 1000 + 1), false);
  });

  test("no expiry means no window", () => {
    // The safe direction: absent state must not be read as permission to send
    // free-form text to a patient.
    assert.equal(isServiceWindowOpen(null, NOW), false);
    assert.equal(isServiceWindowOpen(undefined, NOW), false);
  });

  test("an unparseable expiry means no window", () => {
    assert.equal(isServiceWindowOpen(new Date("nonsense"), NOW), false);
  });

  test("a string expiry is accepted", () => {
    assert.equal(isServiceWindowOpen(windowExpiryFor(NOW).toISOString(), NOW + 1000), true);
  });
});

/* ------------------------------------------------------------------ */
/* Message parsing                                                     */
/* ------------------------------------------------------------------ */

describe("a genuine text message is read correctly", () => {
  test("id, sender, text and timestamp come through", () => {
    const parsed = parseInboundMessage(metaMessage(), NOW);
    assert.ok(!("error" in parsed), JSON.stringify(parsed));
    assert.equal(parsed.wamid, "wamid.ABC123");
    assert.equal(parsed.from, "237699887766");
    assert.equal(parsed.kind, "text");
    assert.equal(parsed.text, "Hello");
    assert.equal(parsed.timestamp, NOW);
    assert.equal(parsed.timestampAssumed, false);
  });

  test("the display phone number is captured", () => {
    // Used to detect a delivery arriving on a number the clinic does not own.
    const parsed = parseInboundMessage(metaMessage(), NOW);
    assert.ok(!("error" in parsed));
    assert.equal(parsed.displayPhoneNumber, "237672595989");
  });

  test("a very long body is capped", () => {
    const parsed = parseInboundMessage(
      metaMessage({ message: { type: "text", text: { body: "x".repeat(50_000) } } }),
      NOW
    );
    assert.ok(!("error" in parsed));
    assert.equal(parsed.text?.length, INBOUND_TEXT_MAX);
  });
});

describe("button messages carry their payload", () => {
  test("a quick-reply payload is read and interpreted", () => {
    // Meta sends `type: "button"` with an *object* payload, not a string. Reading
    // it as a string is the easy mistake, and it makes every button arrive empty.
    const parsed = parseInboundMessage(
      metaMessage({
        type: "button",
        message: {
          type: "button",
          context: { id: "wamid.PREVIOUS" },
          button: { payload: "s19:stop", text: "Stop these messages" },
        },
      }),
      NOW
    );
    assert.ok(!("error" in parsed));
    assert.equal(parsed.kind, "button");
    assert.equal(parsed.payload, "s19:stop");
    assert.equal(parsed.action, "stop");
  });

  test("an interactive button reply is also read", () => {
    const parsed = parseInboundMessage(
      metaMessage({
        type: "interactive",
        message: { type: "interactive", interactive: { type: "button_reply", id: "s19:human", title: "Speak to the clinic" } },
      }),
      NOW
    );
    assert.ok(!("error" in parsed));
    assert.equal(parsed.payload, "s19:human");
  });

  test("a payload from outside our namespace is flagged, not guessed", () => {
    const parsed = parseInboundMessage(
      metaMessage({
        type: "button",
        message: { type: "button", button: { payload: "some-other-app:refill", text: "Refill" } },
      }),
      NOW
    );
    assert.ok(!("error" in parsed));
    assert.equal(parsed.action, undefined);
    assert.equal(parsed.foreignPayload, true);
  });

  test("an unknown action in our namespace is flagged too", () => {
    // A template edited in the WhatsApp Manager after deployment. Recorded and
    // handed to a human rather than dropped - the patient tapped something real.
    const parsed = parseInboundMessage(
      metaMessage({
        type: "button",
        message: { type: "button", button: { payload: "s19:teleport", text: "Teleport" } },
      }),
      NOW
    );
    assert.ok(!("error" in parsed));
    assert.equal(parsed.foreignPayload, true);
  });

  test("an over-long payload is capped", () => {
    const parsed = parseInboundMessage(
      metaMessage({
        type: "button",
        message: { type: "button", button: { payload: "s19:" + "a".repeat(5000) } },
      }),
      NOW
    );
    assert.ok(!("error" in parsed));
    assert.ok((parsed.payload?.length ?? 0) <= 256);
  });
});

describe("media messages are recorded, not downloaded", () => {
  for (const kind of ["image", "audio", "video", "sticker", "document"] as const) {
    test(`a ${kind} is kept as a reference`, () => {
      const parsed = parseInboundMessage(
        metaMessage({ type: kind, message: { type: kind, [kind]: { id: `media-${kind}`, mime_type: "image/jpeg" } } }),
        NOW
      );
      assert.ok(!("error" in parsed));
      assert.equal(parsed.kind, kind);
      assert.equal(parsed.mediaId, `media-${kind}`);
      assert.equal(parsed.text, undefined);
    });
  }
});

describe("a message without a usable identity is refused", () => {
  // `wamid` is the deduplication key. Passing a fabricated one downstream would
  // either collide with a real message or defeat deduplication entirely, so an
  // unusable one means the message is not processed at all.
  test("no id is refused", () => {
    const parsed = parseInboundMessage(metaMessage({ id: undefined }), NOW);
    assert.ok("error" in parsed);
    assert.match(parsed.error, /wamid/);
  });

  test("a non-string id is refused", () => {
    for (const id of [42, {}, [], true]) {
      const parsed = parseInboundMessage(metaMessage({ id }), NOW);
      assert.ok("error" in parsed, `id ${JSON.stringify(id)} was accepted`);
    }
  });

  test("an over-long id is refused", () => {
    const parsed = parseInboundMessage(metaMessage({ id: "w".repeat(1000) }), NOW);
    assert.ok("error" in parsed);
  });

  test("no sender is refused", () => {
    const parsed = parseInboundMessage(metaMessage({ from: undefined }), NOW);
    assert.ok("error" in parsed);
    assert.match(parsed.error, /sender/);
  });

  test("a too-short sender is refused", () => {
    const parsed = parseInboundMessage(metaMessage({ from: "12" }), NOW);
    assert.ok("error" in parsed);
  });

  test("a non-object entry is refused", () => {
    for (const value of [null, undefined, "string", 42, []]) {
      const parsed = parseInboundMessage(value, NOW);
      assert.ok("error" in parsed);
    }
  });

  test("an unknown message type is kept as unsupported, not dropped", () => {
    // Refusing it would lose a message. `unsupported` records it and routes it to
    // a human, which is the recoverable outcome.
    const parsed = parseInboundMessage(
      metaMessage({ type: "ephemeral", message: { type: "ephemeral" } }),
      NOW
    );
    assert.ok(!("error" in parsed));
    assert.equal(parsed.kind, "unsupported");
  });
});

/* ------------------------------------------------------------------ */
/* Delivery receipts                                                   */
/* ------------------------------------------------------------------ */

describe("delivery receipts are captured", () => {
  test("a delivered receipt is read", () => {
    const status = parseInboundStatus({ id: "wamid.OUT1", status: "delivered", timestamp: String(NOW) }, NOW);
    assert.ok(status);
    assert.equal(status.wamid, "wamid.OUT1");
    assert.equal(status.status, "delivered");
  });

  test("a failed receipt carries Meta's code and detail", () => {
    // The raw material M2 needs to know which numbers are undeliverable.
    const status = parseInboundStatus(
      {
        id: "wamid.OUT2",
        status: "failed",
        timestamp: String(NOW),
        errors: [{ code: 131026, error_data: { details: "Message undeliverable" } }],
      },
      NOW
    );
    assert.ok(status);
    assert.equal(status.status, "failed");
    assert.equal(status.code, 131026);
    assert.equal(status.detail, "Message undeliverable");
  });

  test("an unknown status is ignored rather than guessed", () => {
    for (const value of ["exploded", "", null, 42, {}]) {
      assert.equal(parseInboundStatus({ id: "wamid.X", status: value, timestamp: String(NOW) }, NOW), null);
    }
  });

  test("a receipt with no id is ignored", () => {
    assert.equal(parseInboundStatus({ status: "read", timestamp: String(NOW) }, NOW), null);
  });

  test("errors that are not an array are survived", () => {
    const status = parseInboundStatus(
      { id: "wamid.OUT3", status: "failed", timestamp: String(NOW), errors: "boom" },
      NOW
    );
    assert.ok(status);
    assert.equal(status.code, undefined);
  });
});

/* ------------------------------------------------------------------ */
/* Whole payloads                                                      */
/* ------------------------------------------------------------------ */

describe("a whole webhook payload", () => {
  test("several messages across several entries are all read", () => {
    // Meta batches, and one webhook serves many numbers. Reading only the first
    // would lose messages.
    const parsed = parseWebhookPayload(
      {
        object: "whatsapp_business_account",
        entry: [
          { changes: [{ value: { messages: [metaMessage({ id: "wamid.1" })] } }] },
          { changes: [{ value: { messages: [metaMessage({ id: "wamid.2" }), metaMessage({ id: "wamid.3" })] } }] },
        ],
      },
      NOW
    );
    assert.equal(parsed.malformed, null);
    assert.equal(parsed.messages.length, 3);
  });

  test("messages and statuses in the same change are both read", () => {
    const parsed = parseWebhookPayload(
      {
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [metaMessage()],
                  statuses: [{ id: "wamid.OUT", status: "read", timestamp: String(NOW) }],
                },
              },
            ],
          },
        ],
      },
      NOW
    );
    assert.equal(parsed.messages.length, 1);
    assert.equal(parsed.statuses.length, 1);
  });

  test("a body that is not a webhook payload is reported, not thrown on", () => {
    for (const value of [null, undefined, "string", 42, []]) {
      const parsed = parseWebhookPayload(value, NOW);
      assert.ok(parsed.malformed, `${JSON.stringify(value)} was not reported as malformed`);
      assert.equal(parsed.messages.length, 0);
    }
  });

  test("a body with no entry array is malformed", () => {
    // The signature of a webhook URL that is really pointed at something else.
    const parsed = parseWebhookPayload({ object: "whatsapp_business_account" }, NOW);
    assert.equal(parsed.malformed, "payload had no `entry` array");
  });

  test("an empty entry list is a valid, empty delivery", () => {
    // Meta's subscription-confirmation POST looks like this. It is a success, and
    // answering it 200 is what stops a retry loop.
    const parsed = parseWebhookPayload({ object: "whatsapp_business_account", entry: [] }, NOW);
    assert.equal(parsed.malformed, null);
    assert.equal(parsed.messages.length, 0);
  });

  test("one unreadable message does not discard the readable ones", () => {
    // Strictness that loses a real patient's message to be correct about a
    // system notice is the wrong trade.
    const parsed = parseWebhookPayload(
      metaPayload([metaMessage({ id: undefined }), metaMessage({ id: "wamid.GOOD" })]),
      NOW
    );
    assert.equal(parsed.messages.length, 1);
    assert.equal(parsed.messages[0].wamid, "wamid.GOOD");
    assert.equal(parsed.rejected.length, 1);
    assert.equal(parsed.malformed, null);
  });

  test("a change with no value is skipped", () => {
    const parsed = parseWebhookPayload(
      { entry: [{ changes: [null, {}, { value: null }, { value: { messages: [metaMessage()] } }] }] },
      NOW
    );
    assert.equal(parsed.messages.length, 1);
    assert.equal(parsed.malformed, null);
  });

  test("messages that are not an array are survived", () => {
    const parsed = parseWebhookPayload(
      { entry: [{ changes: [{ value: { messages: "boom", statuses: 42 } }] }] },
      NOW
    );
    assert.equal(parsed.messages.length, 0);
    assert.equal(parsed.statuses.length, 0);
  });
});

/* ------------------------------------------------------------------ */
/* Intent                                                              */
/* ------------------------------------------------------------------ */

describe("intent is a lookup, never a guess", () => {
  test("a known button payload maps to its action", () => {
    for (const action of WHATSAPP_ACTIONS) {
      const intent = classifyInbound(message({ kind: "button", payload: buildButtonPayload(action), action }));
      assert.deepEqual(intent, { kind: "button", action });
    }
  });

  test("an unrecognised button is reported as such", () => {
    const intent = classifyInbound(message({ kind: "button", payload: "s19:teleport" }));
    assert.deepEqual(intent, { kind: "unknown_button", payload: "s19:teleport" });
  });

  test("typed text is free text, and no meaning is inferred from it", () => {
    const intent = classifyInbound(message({ text: "do I need to stop taking it" }));
    assert.deepEqual(intent, { kind: "free_text", text: "do I need to stop taking it" });
  });

  test("media is classified by kind", () => {
    const intent = classifyInbound(message({ kind: "image", mediaId: "m1" }));
    assert.deepEqual(intent, { kind: "media", kind_: "image", mediaId: "m1" });
  });

  test("a reaction is structural, not a message", () => {
    assert.deepEqual(classifyInbound(message({ kind: "reaction" })), {
      kind: "structural",
      kind_: "reaction",
    });
  });

  test("an unsupported message is reported as unsupported", () => {
    assert.deepEqual(classifyInbound(message({ kind: "unsupported" })), { kind: "unsupported" });
  });
});

describe("opting out is decided on the whole message, never a substring", () => {
  // This is the one classification in the project that can cause real harm if it
  // is wrong in the aggressive direction. A patient who says "I want to stop
  // taking this medicine" contains the word "stop". A substring match would
  // unsubscribe them from their treatment notifications over a sentence about
  // their dosage, and they would not find out for weeks.
  test("a bare STOP opts out", () => {
    assert.equal(isOptOut("STOP"), true);
  });

  test("case and surrounding punctuation do not matter", () => {
    for (const value of ["stop", "STOP", "Stop", " stop ", "stop.", "stop!", "  STOP  "]) {
      assert.equal(isOptOut(value), true, `${JSON.stringify(value)} did not opt out`);
    }
  });

  test("the French equivalents opt out", () => {
    for (const value of ["arret", "ARRET", "arreter", "desabonner"]) {
      assert.equal(isOptOut(value), true, `${value} did not opt out`);
    }
  });

  test("a sentence containing the word does NOT opt out", () => {
    for (const value of [
      "I want to stop taking this medicine",
      "should I stop the herbs before the test",
      "my reading was high, when should I stop?",
      "arreter le traitement est-il dangereux",
    ]) {
      assert.equal(isOptOut(value), false, `${JSON.stringify(value)} opted the patient out`);
    }
  });

  test("a multi-word opt-out phrase is matched whole", () => {
    assert.equal(isOptOut("stop messages"), true);
    assert.equal(isOptOut("I will stop messages later"), false);
  });

  test("inner whitespace is collapsed before matching", () => {
    assert.equal(isOptOut("  stop   messages  "), true);
  });

  test("an empty or punctuation-only message does not opt out", () => {
    for (const value of ["", "   ", ".", "!!!", "..."]) {
      assert.equal(isOptOut(value), false, `${JSON.stringify(value)} opted the patient out`);
    }
  });

  test("accents are not folded, so a near-miss goes to a human", () => {
    // "ARRÊT" without the circumflex does not match. That is the right way round:
    // a patient who gets a human is mildly inconvenienced, a patient who is
    // unsubscribed by accident is not.
    assert.equal(isOptOut("arrêt"), false);
    assert.equal(isOptOut("arréter"), false);
  });

  test("the opt-out list is short on purpose", () => {
    // Every word here is a word a patient might also use in a sentence. Keeping
    // the list minimal is what keeps the false-positive rate near zero.
    assert.ok(OPT_OUT_WORDS.size <= 16, `opt-out list has grown to ${OPT_OUT_WORDS.size} words`);
  });

  test("typing STOP classifies as the stop button", () => {
    // A patient must never have to find the right button in order to stop.
    const intent = classifyInbound(message({ text: "STOP" }));
    assert.deepEqual(intent, { kind: "button", action: "stop" });
    assert.equal(isOptOutIntent(intent), true);
  });

  test("an ordinary question is not an opt-out", () => {
    assert.equal(isOptOutIntent(classifyInbound(message({ text: "how much is the consultation?" }))), false);
  });
});

describe("an opt-out is recorded wherever it can be", () => {
  // Found by the live run against a real database: honouring a stop only for known
  // patients meant a stranger who pressed "stop" left no trace, because there was
  // no `User` row to record the refusal on. The request then evaporated the moment
  // staff linked that number to a patient record.
  test("the conversation is always marked, linked or not", () => {
    for (const hasPatient of [true, false]) {
      const effects = optOutEffects({ kind: "button", action: "stop" }, hasPatient);
      assert.equal(
        effects.marksConversation,
        true,
        `not marked with hasPatient=${hasPatient}`
      );
    }
  });

  test("consent is only revoked when there is a patient to revoke it on", () => {
    assert.equal(optOutEffects({ kind: "button", action: "stop" }, true).revokesConsent, true);
    // Nothing to write to. Silently "succeeding" here is what loses the refusal.
    assert.equal(optOutEffects({ kind: "button", action: "stop" }, false).revokesConsent, false);
  });

  test("a non-opt-out marks nothing", () => {
    for (const intent of [
      { kind: "button", action: "human" } as const,
      { kind: "button", action: "confirm" } as const,
      { kind: "button", action: "question" } as const,
      { kind: "free_text", text: "hello" } as const,
      { kind: "unknown_button", payload: "x" } as const,
      { kind: "media", kind_: "image" } as const,
      { kind: "structural", kind_: "reaction" } as const,
      { kind: "unsupported" } as const,
    ]) {
      for (const hasPatient of [true, false]) {
        assert.deepEqual(
          optOutEffects(intent, hasPatient),
          { marksConversation: false, revokesConsent: false },
          `${intent.kind} with hasPatient=${hasPatient} marked an opt-out`
        );
      }
    }
  });

  test("typing STOP has the same effect as tapping the button", () => {
    const intent = classifyInbound(message({ text: "STOP" }));
    assert.deepEqual(optOutEffects(intent, true), {
      marksConversation: true,
      revokesConsent: true,
    });
  });
});

describe("which messages reach a human", () => {
  test("asking for a person or a question goes to a human", () => {
    // M13 will answer `question` eventually. Until it exists, it must still reach
    // someone - a button that goes nowhere is worse than free text.
    assert.equal(needsHuman({ kind: "button", action: "human" }), true);
    assert.equal(needsHuman({ kind: "button", action: "question" }), true);
  });

  test("acknowledging does not", () => {
    assert.equal(needsHuman({ kind: "button", action: "confirm" }), false);
  });

  test("opting out does not need a human", () => {
    // The system can honour it on its own; a clinician has nothing to decide.
    assert.equal(needsHuman({ kind: "button", action: "stop" }), false);
  });

  test("free text always does", () => {
    // A patient typing a sentence is describing something. There is no model here
    // to interpret it, so it goes to a person.
    assert.equal(needsHuman({ kind: "free_text", text: "hello" }), true);
  });

  test("unknown buttons and media always do", () => {
    assert.equal(needsHuman({ kind: "unknown_button", payload: "x" }), true);
    assert.equal(needsHuman({ kind: "media", kind_: "image" }), true);
    assert.equal(needsHuman({ kind: "unsupported" }), true);
  });
});

/* ------------------------------------------------------------------ */
/* Button grammar                                                      */
/* ------------------------------------------------------------------ */

describe("the button payload grammar", () => {
  test("every action round-trips", () => {
    for (const action of WHATSAPP_ACTIONS) {
      const payload = buildButtonPayload(action);
      assert.equal(payload, `s19:${action}`);
      assert.deepEqual(parseButtonPayload(payload), { kind: "action", action });
    }
  });

  test("a foreign payload is distinguished from an invalid one", () => {
    // They need different handling. A foreign payload is a real button from a
    // template this code does not know about - a human must see it. An invalid
    // one is noise.
    assert.deepEqual(parseButtonPayload("other:thing"), { kind: "foreign", raw: "other:thing" });
    assert.deepEqual(parseButtonPayload("s19:unknown"), { kind: "foreign", raw: "s19:unknown" });
    assert.deepEqual(parseButtonPayload(""), { kind: "invalid", raw: "" });
    assert.deepEqual(parseButtonPayload(42), { kind: "invalid", raw: "" });
  });

  test("an over-long payload is invalid, not foreign", () => {
    const result = parseButtonPayload("x".repeat(500));
    assert.equal(result.kind, "invalid");
  });

  test("the vocabulary is closed", () => {
    // A function that would happily build any string is a function that will one
    // day build a payload nothing can answer.
    assert.throws(() => buildButtonPayload("teleport" as WhatsAppAction));
  });
});

describe("the template catalogue is valid", () => {
  test("no template exceeds Meta's three-button limit", () => {
    // Exceeding it is not a runtime error - it is a template Meta rejects at
    // creation time, which is a support ticket rather than a red test.
    for (const key of Object.keys(WHATSAPP_TEMPLATES) as Array<keyof typeof WHATSAPP_TEMPLATES>) {
      assert.ok(
        templateButtons(key).length <= MAX_TEMPLATE_BUTTONS,
        `${key} has ${templateButtons(key).length} buttons`
      );
    }
  });

  test("a template never offers the same action twice", () => {
    // Two buttons with the same payload are indistinguishable to the patient and
    // ambiguous to the handler.
    for (const key of Object.keys(WHATSAPP_TEMPLATES) as Array<keyof typeof WHATSAPP_TEMPLATES>) {
      const actions = templateButtons(key).map((b) => b.action);
      assert.equal(new Set(actions).size, actions.length, `${key} repeats an action`);
    }
  });

  test("every button has both languages", () => {
    // A missing French label is a template Meta rejects, and it is a rejection the
    // clinic only finds out about at creation time.
    for (const key of Object.keys(WHATSAPP_TEMPLATES) as Array<keyof typeof WHATSAPP_TEMPLATES>) {
      for (const button of templateButtons(key)) {
        assert.ok(button.en.trim().length > 0, `${key} has a button with no English label`);
        assert.ok(button.fr.trim().length > 0, `${key} has a button with no French label`);
      }
    }
  });

  test("every button action is in the reserved vocabulary", () => {
    for (const key of Object.keys(WHATSAPP_TEMPLATES) as Array<keyof typeof WHATSAPP_TEMPLATES>) {
      for (const button of templateButtons(key)) {
        assert.ok(WHATSAPP_ACTIONS.includes(button.action), `${key} uses an unknown action`);
      }
    }
  });

  test("every template body has both languages and the declared placeholders", () => {
    for (const [key, spec] of Object.entries(WHATSAPP_TEMPLATES)) {
      assert.ok(spec.en.trim().length > 0, `${key} has no English body`);
      assert.ok(spec.fr.trim().length > 0, `${key} has no French body`);
      // The placeholders are filled positionally, so a mismatch does not fail -
      // it sends a patient a date where their name belongs.
      for (const marker of spec.params.keys()) {
        assert.match(spec.en, new RegExp(`\\{\\{${marker + 1}\\}\\}`), `${key} en is missing {{${marker + 1}}}`);
        assert.match(spec.fr, new RegExp(`\\{\\{${marker + 1}\\}\\}`), `${key} fr is missing {{${marker + 1}}}`);
      }
    }
  });

  test("at least one template offers a way to stop", () => {
    // Meta requires a working opt-out. Discovery is the clinic's problem, but
    // offering it on the templates patients get most is ours.
    const withStop = (Object.keys(WHATSAPP_TEMPLATES) as Array<keyof typeof WHATSAPP_TEMPLATES>).filter((key) =>
      templateButtons(key).some((b) => b.action === "stop")
    );
    assert.ok(withStop.length >= 5, `only ${withStop.length} templates offer a stop button`);
  });
});
