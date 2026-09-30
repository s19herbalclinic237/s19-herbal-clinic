import { NextResponse } from "next/server";

import { evaluateCronAuth, cronAuthGuidance } from "@/lib/cron-auth";
import { runOutboundTick, reconcileDeliveryFailures } from "@/lib/outbound-tick";

/**
 * The outbound tick, on a schedule.
 *
 * ## Authorization
 *
 * `evaluateCronAuth` refuses a request with no `CRON_SECRET` in production, with a
 * 503 rather than a 401 — an unset secret is a server misconfiguration the operator
 * has to fix, not a bad request from a caller. This is the guard that was missing
 * when `/api/cron/backups` served a complete database export to any unauthenticated
 * caller; it is used unchanged rather than rewritten per-route.
 *
 * ## The engine's own gate is separate, and deliberately so
 *
 * Passing this route's authentication says the caller is allowed to run the tick. It
 * says nothing about whether the clinic has confirmed quiet hours and the weekly
 * message budget. `lib/outbound-gate.ts` answers that question, and when it is shut
 * the tick runs, reports zero sends, and says why — rather than 503-ing, because a
 * scheduled job that fails loudly every minute trains people to ignore it.
 *
 * ## What "dry run" means here
 *
 * `?dry=1` runs every decision and every count, performs the send-replacement and the
 * queue transitions, and returns the summary — but skips the HTTP call to Meta.
 *
 * This is genuinely useful rather than a token flag. The parts most likely to be wrong
 * in a new deployment are the decisions: a quiet-hours window that is off by one, an
 * ISO week that starts on the wrong day, a policy document that fails validation. All
 * of those show up in a dry run, because the decisions are made before the send. Only
 * the last mile is untested, and that mile is Meta's own.
 *
 * ## How often this actually runs
 *
 * `vercel.json` schedules this route once a day at 09:00 UTC — 10:00 in Bafoussam. That is
 * not an ideal for the engine, it is the Vercel Hobby plan's ceiling: the plan rejects any
 * cron expression running more than once per day and fails the deployment outright. The
 * hour is deliberately mid-morning in clinic time so the pass lands inside the permitted
 * sending window rather than in quiet hours, where a single daily tick would defer every
 * message to 08:00 and never be woken again that day.
 *
 * Nothing here assumes that cadence. The claim is a lease, not a lock; the decisions are
 * pure functions of an injected clock; and the `?now` override exists so the behaviour of
 * an arbitrary pass can be checked without waiting for one. That also means an external
 * scheduler can call this route every few minutes with no code change if the clinic later
 * decides once-daily batching is too coarse. See `docs/STATE_AND_CREDENTIALS_GAPS.md` §0.3.
 *
 * ## The clock can be overridden, once, for verification
 *
 * `?now=<ISO>` evaluates the whole pass as if it were that moment. Vercel forbids a
 * `Date` header in the cron invocation, so a query parameter is the only way to ask
 * "what would this tick do at 03:00?" — which is the question that decides whether the
 * quiet-hours window is right. It requires the same secret as everything else.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const auth = evaluateCronAuth({
    authorization: request.headers.get("authorization"),
    secret: process.env.CRON_SECRET,
    nodeEnv: process.env.NODE_ENV,
  });

  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: auth.error, guidance: cronAuthGuidance(auth.reason) },
      { status: auth.status }
    );
  }

  const url = new URL(request.url);
  const dryRun = url.searchParams.get("dry") === "1";

  let now = new Date();
  if (url.searchParams.get("now")) {
    const parsed = new Date(url.searchParams.get("now") as string);
    if (Number.isNaN(parsed.getTime())) {
      return NextResponse.json(
        { ok: false, error: "`now` is not a valid ISO-8601 timestamp." },
        { status: 400 }
      );
    }
    now = parsed;
  }

  try {
    const summary = await runOutboundTick({ now, dryRun });

    // Reconciliation runs in every pass, including dry ones, because it only reads and
    // only raises a flag for staff. Skipping it would mean a dry run cannot show the
    // operator what is already failing.
    const threadsNeedingAttention = await reconcileDeliveryFailures(now);

    // `summary` carries its own `ok`. Spreading it after a literal `ok: true` here would
    // silently overwrite the literal — the same value today, but the spread wins, so the
    // literal was dead code pretending to be the contract.
    return NextResponse.json({
      ...summary,
      dryRun,
      now: now.toISOString(),
      threadsNeedingAttention,
    });
  } catch (error) {
    // A thrown error here means the engine itself broke, not one message — the tick
    // isolates per-message failures. That is worth a 500 so the platform's monitoring
    // sees it, and worth a log line naming the tick.
    console.error("[outbound] tick threw:", error);
    return NextResponse.json(
      { ok: false, error: "The outbound tick failed to run." },
      { status: 500 }
    );
  }
}