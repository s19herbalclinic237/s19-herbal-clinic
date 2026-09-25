import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { adminGuard } from "@/lib/admin-guard";
import {
  TreatmentFollowUp,
  parseSymptomsList,
} from "@/lib/models/TreatmentFollowUp";
import { TreatmentPlan } from "@/lib/models/TreatmentPlan";
import { notifyPatient } from "@/lib/notify";

const MILESTONES = ["baseline", "monthly", "final", "other"] as const;
type Milestone = (typeof MILESTONES)[number];

export async function GET(request: Request) {
  const denied = await adminGuard();
  if (denied) return denied;

  const url = new URL(request.url);
  const planId = String(url.searchParams.get("plan") || "").trim();

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Treatment progress is temporarily unavailable." }, { status: 503 });
  }

  try {
    const filter = planId ? { plan: planId } : {};
    const followUps = await TreatmentFollowUp.find(filter)
      .populate("plan", "title forMember")
      .populate("user", "name email")
      .sort({ date: -1 })
      .limit(500)
      .lean();
    return NextResponse.json({ followUps });
  } catch (error) {
    console.error("[admin treatment-follow-ups] list failed:", error);
    return NextResponse.json({ error: "Could not load follow-ups." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await adminGuard();
  if (denied) return denied;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Treatment progress is temporarily unavailable." }, { status: 503 });
  }

  try {
    const raw = (body ?? {}) as Record<string, unknown>;
    const planId = String(raw.plan || "").trim();
    const milestone = String(raw.milestone || "monthly") as Milestone;
    const dateRaw = new Date(String(raw.date || ""));
    const forMember = String(raw.forMember || "").trim() || undefined;
    const improvements = String(raw.improvements || "").trim().slice(0, 4000) || undefined;
    const followUpLabs = String(raw.followUpLabs || "").trim().slice(0, 4000) || undefined;
    const clinicianNotes = String(raw.clinicianNotes || "").trim().slice(0, 4000) || undefined;

    if (!planId || !MILESTONES.includes(milestone)) {
      return NextResponse.json({ error: "Choose a plan and milestone." }, { status: 400 });
    }
    if (Number.isNaN(dateRaw.getTime())) {
      return NextResponse.json({ error: "Enter a valid follow-up date." }, { status: 400 });
    }

    const plan = await TreatmentPlan.findById(planId).select("user title forMember").lean();
    if (!plan) {
      return NextResponse.json({ error: "Treatment plan not found." }, { status: 404 });
    }

    const vitalsRaw = (raw.vitals ?? {}) as Record<string, unknown>;
    const vitals = {
      weightKg:
        vitalsRaw.weightKg !== undefined && vitalsRaw.weightKg !== ""
          ? Number(vitalsRaw.weightKg)
          : undefined,
      systolicBp:
        vitalsRaw.systolicBp !== undefined && vitalsRaw.systolicBp !== ""
          ? Number(vitalsRaw.systolicBp)
          : undefined,
      diastolicBp:
        vitalsRaw.diastolicBp !== undefined && vitalsRaw.diastolicBp !== ""
          ? Number(vitalsRaw.diastolicBp)
          : undefined,
      glucoseMgdl:
        vitalsRaw.glucoseMgdl !== undefined && vitalsRaw.glucoseMgdl !== ""
          ? Number(vitalsRaw.glucoseMgdl)
          : undefined,
    };

    const followUp = await TreatmentFollowUp.create({
      user: plan.user,
      plan: planId,
      forMember,
      milestone,
      milestoneLabel:
        milestone === "other" ? String(raw.milestoneLabel || "").trim().slice(0, 120) || undefined : undefined,
      date: dateRaw,
      improvements,
      resolvedSymptoms: parseSymptomsList(raw.resolvedSymptoms),
      improvedSymptoms: parseSymptomsList(raw.improvedSymptoms),
      persistentSymptoms: parseSymptomsList(raw.persistentSymptoms),
      newSymptoms: parseSymptomsList(raw.newSymptoms),
      adverseReactions: parseSymptomsList(raw.adverseReactions),
      vitals,
      followUpLabs,
      clinicianNotes,
    });

    await notifyPatient({
      userId: String(plan.user),
      subject: `Treatment progress update`,
      body: `The clinic recorded a new progress note for "${plan.title}"${
        forMember ? ` (${forMember})` : ""
      } dated ${new Date(dateRaw).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })}. Sign in to the portal to see how your treatment is progressing.`,
    });

    return NextResponse.json({ followUp: followUp.toObject() }, { status: 201 });
  } catch (error) {
    console.error("[admin treatment-follow-ups] create failed:", error);
    return NextResponse.json({ error: "Could not create the follow-up." }, { status: 500 });
  }
}