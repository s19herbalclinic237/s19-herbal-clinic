import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-server";
import {
  TreatmentPlan,
  treatmentPlanDays,
  treatmentPlanPhase,
  type ITreatmentPlan,
} from "@/lib/models/TreatmentPlan";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to view your treatment plans." }, { status: 401 });
  }

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Treatment plans are temporarily unavailable." }, { status: 503 });
  }

  try {
    const plans = await TreatmentPlan.find({ user: user.id })
      .sort({ startDate: -1 })
      .limit(100)
      .lean<ITreatmentPlan[]>();
    return NextResponse.json({
      plans: plans.map((p) => ({
        ...p,
        phase: treatmentPlanPhase(p),
        days: treatmentPlanDays(p),
      })),
    });
  } catch (error) {
    console.error("[treatment-plans] list failed:", error);
    return NextResponse.json({ error: "Could not load your treatment plans." }, { status: 500 });
  }
}