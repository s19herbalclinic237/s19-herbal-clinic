import "server-only";

import { connectDb } from "@/lib/db";
import { CLINIC } from "@/lib/site";
import { User } from "@/lib/models/User";
import { Conversation } from "@/lib/models/Conversation";
import { WhatsAppMessage } from "@/lib/models/WhatsAppMessage";
import { AutomationPolicy, DEFAULT_POLICY_KEY } from "@/lib/models/AutomationPolicy";
import { recordAppLog } from "@/lib/app-log";
import { sendWhatsAppTemplateResult, whatsappSendingConfigured } from "@/lib/whatsapp";
import { outboundGate } from "@/lib/outbound-gate";
import {
  claimDueMessages,
  countSentThisWeek,
  markDeferred,
  markDryRunSent,
  markRetryOrFail,
  markSent,
  markStopped,
  releaseDeferred,
} from "@/lib/outbox";
import {
  decideOutbound,
  parseAutomationPolicy,
  DECLINE_EXPLANATIONS,
  type OutboundDeclineReason,
  type OutboundPolicy,
} from "@/lib/outbound-policy";

/**
 * The outbound tick: one pass of the engine.
 *
 * ## What a tick actually does
 *
 * 1. Read the policy. A stored policy that fails validation stops every scheduled
 *    message — see `parseAutomationPolicy` for why that is not "use the defaults".
 * 2. Release deferred messages whose time has come. A quiet-hours window ending at
 *    08:00 can unblock hundreds at once, so this is a bulk update rather than a loop.
 * 3. Claim due messages, a bounded batch at a time.
 * 4. For each one: re-read the decision inputs, re-run `decideOutbound`, then send.
 *
 * ## The policy is re-evaluated per message, not once per tick
 *
 * Consent, opt-out and the quiet-hours window can all change between two messages in
 * the same batch, and reading them once at the top of the tick would apply a stale
 * answer to every message after it. The cost is one indexed lookup per message, which
 * is nothing next to the HTTP POST that follows.
 *
 * ## Injected clock
 *
 * `now` is a parameter, never `Date.now()`. A scheduler that cannot be asked "what
 * happens at 03:00 on the due date" is wrong at 03:00 on the due date, and that is
 * not discoverable from the outside.
 */
export interface TickOptions {
  now?: Date;
  /** Maximum messages to send in one pass. */
  limit?: number;
  /**
   * Make every decision and every queue transition, but skip the HTTP call to Meta.
   *
   * Useful because the decisions are the part most likely to be wrong in a new
   * deployment, and a dry run exercises all of them. The row is left `queued` with a
   * note, so nothing is lost and the next real tick sends it normally.
   */
  dryRun?: boolean;
}

export interface TickSummary {
  ok: boolean;
  /** Refusal text when the engine is not permitted to send scheduled messages. */
  gate: { enabled: boolean; error?: string };
  policy: { source: "stored" | "defaults"; errors: string[] };
  released: number;
  claimed: number;
  sent: number;
  deferred: number;
  stopped: number;
  failed: number;
  /** Outcome per reason, for the log line and the status endpoint. */
  reasons: Partial<Record<OutboundDeclineReason, number>>;
}

/** How many messages one pass may send. Bounded so a pass fits inside a function's time budget. */
export const TICK_BATCH_SIZE = 100;

/**
 * Reads the effective policy.
 *
 * A missing document is not an error: the engine has never needed one, and creating
 * one on read would mean a write on every tick from every deploy. Defaults apply and
 * `source` says so, so the status endpoint can report that the clinic has not set
 * anything yet rather than silently presenting a default as a decision.
 */
async function loadPolicy(): Promise<{ policy: OutboundPolicy | null; source: "stored" | "defaults"; errors: string[] }> {
  await connectDb();
  const stored = await AutomationPolicy.findOne({ key: DEFAULT_POLICY_KEY }).lean();

  if (!stored) {
    return { policy: { ...(await parseAutomationPolicy(null)).policy! }, source: "defaults", errors: [] };
  }

  // Only the policy fields are passed through. `_id`, `key`, `updatedAt` and any
  // stray extra would otherwise be read as configuration, which is how a schema
  // migration silently becomes a behaviour change.
  const result = parseAutomationPolicy({
    weeklyBudget: stored.weeklyBudget,
    stalenessHours: stored.stalenessHours,
    retryBackoffSeconds: stored.retryBackoffSeconds,
    ...(stored.quietHours
      ? {
          quietHours: {
            enabled: stored.quietHours.enabled,
            fromMinutes: stored.quietHours.fromMinutes,
            toMinutes: stored.quietHours.toMinutes,
          },
        }
      : {}),
  });

  return { policy: result.ok ? (result.policy ?? null) : null, source: "stored", errors: result.errors };
}

function countReason(summary: TickSummary, reason: OutboundDeclineReason): void {
  summary.reasons[reason] = (summary.reasons[reason] ?? 0) + 1;
}

/**
 * Runs one pass of the outbound engine.
 *
 * Never throws for a message-level failure. A send that fails is recorded on its row
 * and the pass continues, because one bad template must not stop the other ninety-nine
 * messages in the batch.
 */
export async function runOutboundTick(options: TickOptions = {}): Promise<TickSummary> {
  const now = options.now ?? new Date();
  const limit = Math.max(1, Math.min(options.limit ?? TICK_BATCH_SIZE, TICK_BATCH_SIZE));
  const gate = outboundGate();

  const summary: TickSummary = {
    ok: true,
    gate: { enabled: gate.enabled, ...(gate.enabled ? {} : { error: gate.error }) },
    policy: { source: "defaults", errors: [] },
    released: 0,
    claimed: 0,
    sent: 0,
    deferred: 0,
    stopped: 0,
    failed: 0,
    reasons: {},
  };

  const policyResult = await loadPolicy();
  summary.policy = { source: policyResult.source, errors: policyResult.errors };

  if (policyResult.errors.length > 0) {
    // A policy nobody can read is not a policy. Scheduled messages stop; receipts
    // continue, because refusing to tell a patient their appointment moved is a worse
    // failure than sending under a slightly-wrong budget.
    await recordAppLog({
      level: "warn",
      scope: "outbound",
      source: "console",
      message: "Outbound policy failed validation; no scheduled message will be sent.",
      context: JSON.stringify({ errors: policyResult.errors }),
    });
  }

  summary.released = await releaseDeferred(now);
  const claimed = await claimDueMessages(now, limit);
  summary.claimed = claimed.length;

  for (const message of claimed) {
    /* --- Re-read the facts that could have changed since enqueue --------- */

    const conversation = await Conversation.findById(message.conversation)
      .select("windowExpiresAt optedOut")
      .lean();

    let consent: boolean | null = null;
    const optedOutAt: Date | null = conversation?.optedOut ?? null;

    if (message.patient) {
      const user = await User.findById(message.patient)
        .select("whatsappOptIn")
        .lean();
      consent = user?.whatsappOptIn ?? null;
    }

    // `optedOutAt` comes from the thread, and that is the only place a refusal is
    // recorded - `optOutEffects` writes `Conversation.optedOut` whether or not there
    // was a patient to revoke consent on. So there is no second source to consult, and
    // a patient who opted out while this message sat in the queue is caught here.
    let sentThisWeek = 0;
    if (message.patient) sentThisWeek = await countSentThisWeek(message.patient, now);

    /* --- The decision ---------------------------------------------------- */

    const decision = decideOutbound({
      now,
      priority: message.priority,
      consent,
      optedOutAt,
      phone: message.phone,
      clinicNumber: CLINIC.whatsappNumber,
      windowExpiresAt: conversation?.windowExpiresAt ?? null,
      scheduledFor: message.scheduledFor,
      sentThisWeek,
      automationEnabled: gate.enabled,
      policy: policyResult.policy,
    });

    if (decision.action === "defer") {
      await markDeferred(message.id, {
        reason: decision.reason,
        until: decision.until,
      });
      summary.deferred += 1;
      countReason(summary, decision.reason);
      continue;
    }

    if (decision.action === "stop") {
      await markStopped(message.id, decision.reason, DECLINE_EXPLANATIONS[decision.reason]);
      summary.stopped += 1;
      countReason(summary, decision.reason);
      continue;
    }

    /* --- Send ------------------------------------------------------------ */

    // Checked before the attempt, not after a failure. "The clinic has not given us"
    // credentials is a configuration gap affecting every patient; retrying it five
    // times per message would fill the queue with failure rows that all say the same
    // thing and answer no question. A dry run skips this check too, because its
    // purpose is to show what the decisions produce — and with no credentials set, a
    // dry run would stop at the first row and prove nothing about quiet hours.
    if (!whatsappSendingConfigured() && !options.dryRun) {
      await markStopped(
        message.id,
        "not_configured",
        "WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID are not set, so nothing can be sent. " +
          "See docs/GETTING_CREDENTIALS.md."
      );
      summary.stopped += 1;
      continue;
    }

    const result = options.dryRun
      ? // A dry run still walks every decision and every queue transition above; only
        // the HTTP call is skipped. That is what makes it worth running: the parts
        // most likely to be wrong in a new deployment are the decisions, and this
        // exercises all of them. The synthetic id below is namespaced so a dry run can
        // never collide with a real `wamid`, and is written to `lastError` rather than
        // `wamid` so no `WhatsAppMessage` row is fabricated.
        { ok: true, wamid: `dryrun:${message.id}`, status: 0, detail: "Dry run: no request was made to Meta." }
      : await sendWhatsAppTemplateResult({
          to: message.phone,
          template: message.template,
          params: message.params,
          language: message.language,
        });

    if (options.dryRun && result.ok) {
      await markDryRunSent(message.id, result.detail as string);
      summary.sent += 1;
      continue;
    }

    if (result.ok && result.wamid) {
      await markSent(message.id, { wamid: result.wamid, sentAt: now });
      summary.sent += 1;
      continue;
    }

    const backoff = policyResult.policy?.retryBackoffSeconds ?? 300;
    const detail =
      result.detail ??
      (result.status ? `Meta returned HTTP ${result.status}.` : "The request to Meta did not complete.");
    const state = await markRetryOrFail(message.id, detail, backoff);

    if (state === "failed") {
      summary.failed += 1;
      continue;
    }

    summary.deferred += 1;
  }

  await recordAppLog({
    level: summary.failed > 0 || summary.stopped > 0 ? "warn" : "info",
    scope: "outbound",
    source: "console",
    message:
      `Outbound tick: ${summary.sent} sent, ${summary.deferred} held, ` +
      `${summary.stopped} stopped, ${summary.failed} failed.`,
    context: JSON.stringify({
      gate: summary.gate.enabled,
      policySource: summary.policy.source,
      claimed: summary.claimed,
      reasons: summary.reasons,
    }),
  });

  return summary;
}

/**
 * Reconciliation for delivery failures.
 *
 * Meta reports a status for every outbound message it accepted, and M1 already writes
 * those onto the `WhatsAppMessage` row. What nobody does with them is the gap: a
 * message that failed to deliver is invisible, and the clinic believes the patient was
 * told when they were not.
 *
 * So a failed delivery raises the thread's `needsAttention` flag, which puts it in the
 * staff inbox. This is the one place the engine hands work to a person rather than
 * trying to resolve it — a number that Meta rejects is usually one the carrier has
 * retired, and only a human can ask the patient for a new one.
 *
 * Marked `needsAttention` rather than retried: a rejection Meta has already decided on
 * will be rejected identically on retry.
 */
export async function reconcileDeliveryFailures(now: Date = new Date()): Promise<number> {
  await connectDb();
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const failed = await WhatsAppMessage.find({
    direction: "outbound",
    status: "failed",
    statusAt: { $gte: since },
  })
    .select("conversation")
    .lean();

  const ids = [...new Set(failed.map((row) => String(row.conversation)))];
  if (ids.length === 0) return 0;

  await Conversation.updateMany(
    { _id: { $in: ids } },
    { $set: { needsAttention: true, lastStatus: "failed", lastStatusAt: since } }
  );
  return ids.length;
}