import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-server";
import { TreatmentFollowUp, type ITreatmentFollowUp } from "@/lib/models/TreatmentFollowUp";
import { TreatmentPlan, type ITreatmentPlan } from "@/lib/models/TreatmentPlan";

/**
 * Dated treatment progress (follow-ups) for the signed-in patient: the full
 * Baseline → Month N → Final history across their plans, so nothing gets
 * overwritten and the timeline reads oldest-first per plan.
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to view your treatment progress." }, { status: 401 });
  }

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Treatment progress is temporarily unavailable." }, { status: 503 });
  }

  try {
    const plans = await TreatmentPlan.find({ user: user.id })
      .select("_id title forMember")
      .lean<ITreatmentPlan[]>();
    const planIds = plans.map((p) => String(p._id));
    if (planIds.length === 0) return NextResponse.json({ followUps: [] });

    const followUps = await TreatmentFollowUp.find({ plan: { $in: planIds } })
      .sort({ date: 1 })
      .limit(500)
      .lean<ITreatmentFollowUp[]>();

    return NextResponse.json({ followUps });
  } catch (error) {
    console.error("[treatment-follow-ups] list failed:", error);
    return NextResponse.json({ error: "Could not load your treatment progress." }, { status: 500 });
  }
}