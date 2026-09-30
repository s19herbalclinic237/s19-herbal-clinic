import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { clinicalGuard } from "@/lib/admin-guard";
import { computeTreatmentAlerts, countBySeverity } from "@/lib/treatment-alerts";
import { loadAlertInputs } from "@/lib/treatment-alerts-db";

export type { AlertSeverity, AlertCategory, TreatmentAlert } from "@/lib/treatment-alerts";

/**
 * The S19 team's alert feed: treatments approaching their end date, plans
 * awaiting the final review, missed glucose submissions, overdue reminders,
 * concerning readings, newly reported complications and missed follow-up
 * appointments.
 *
 * The rules live in `lib/treatment-alerts.ts` so that the daily worklist and
 * this feed cannot drift apart; both call the same pure function.
 */
export async function GET() {
  const denied = await clinicalGuard();
  if (denied) return denied;

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Alerts are temporarily unavailable." }, { status: 503 });
  }

  try {
    const alerts = computeTreatmentAlerts(await loadAlertInputs());
    return NextResponse.json({ alerts, counts: countBySeverity(alerts) });
  } catch (error) {
    console.error("[admin treatment-alerts] failed:", error);
    return NextResponse.json({ error: "Could not load treatment alerts." }, { status: 500 });
  }
}