import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { clinicalGuard } from "@/lib/admin-guard";
import { computeTreatmentAlerts, countBySeverity } from "@/lib/treatment-alerts";
import { loadAlertInputs } from "@/lib/treatment-alerts-db";
import { buildWorklist, summariseWorklist } from "@/lib/worklist";
import { touchWorklistAlerts } from "@/lib/worklist-db";

/**
 * The clinic's daily worklist: one line per patient, ordered by what nobody has
 * started, with the reasons behind it and who owns it.
 *
 * Built from the same alert rules as `/api/admin/treatment-alerts`, so the feed
 * and the worklist can never disagree about who needs attention.
 */
export async function GET(request: Request) {
  const denied = await clinicalGuard();
  if (denied) return denied;

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "The worklist is temporarily unavailable." }, { status: 503 });
  }

  const url = new URL(request.url);
  const includeResolved = url.searchParams.get("includeResolved") === "1";

  try {
    const now = new Date();
    const alerts = computeTreatmentAlerts(await loadAlertInputs(now));

    // Registers newly-appeared alerts and returns every stored staff decision,
    // so ages and ownership are real rather than inferred.
    const states = await touchWorklistAlerts(alerts, now);

    const worklist = buildWorklist(alerts, states, {
      now: now.toISOString(),
      includeResolved,
    });

    return NextResponse.json({
      headline: summariseWorklist(worklist),
      today: worklist.today,
      summary: worklist.summary,
      rows: worklist.rows,
      // The flat feed stays available so a client can switch views without a
      // second round trip.
      counts: countBySeverity(alerts),
    });
  } catch (error) {
    console.error("[admin worklist] failed:", error);
    return NextResponse.json({ error: "Could not load the worklist." }, { status: 500 });
  }
}