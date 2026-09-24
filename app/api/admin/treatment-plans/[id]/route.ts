import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { adminGuard } from "@/lib/admin-guard";
import {
  TreatmentPlan,
  treatmentPlanDays,
  treatmentPlanPhase,
} from "@/lib/models/TreatmentPlan";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const denied = await adminGuard();
  if (denied) return denied;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Treatment plans are temporarily unavailable." }, { status: 503 });
  }

  try {
    const existing = await TreatmentPlan.findById(id).lean();
    if (!existing) {
      return NextResponse.json({ error: "Treatment plan not found." }, { status: 404 });
    }

    const raw = (body ?? {}) as Record<string, unknown>;
    const set: Record<string, unknown> = {};

    if (raw.user !== undefined) {
      const clean = String(raw.user).trim();
      if (clean) set.user = clean;
    }
    if (raw.title !== undefined) {
      const clean = String(raw.title).trim().slice(0, 200);
      if (clean) set.title = clean;
    }
    if (raw.program !== undefined) {
      set.program = String(raw.program).trim().slice(0, 200) || undefined;
    }
    if (raw.forMember !== undefined) {
      set.forMember = String(raw.forMember).trim() || undefined;
    }
    if (raw.notes !== undefined) {
      set.notes = String(raw.notes).trim().slice(0, 2000) || undefined;
    }

    const startRaw = raw.startDate !== undefined ? new Date(String(raw.startDate)) : null;
    const endRaw = raw.endDate !== undefined ? new Date(String(raw.endDate)) : null;

    if (startRaw && Number.isNaN(startRaw.getTime())) {
      return NextResponse.json({ error: "Enter a valid start date." }, { status: 400 });
    }
    if (endRaw && Number.isNaN(endRaw.getTime())) {
      return NextResponse.json({ error: "Enter a valid end date." }, { status: 400 });
    }

    const startMs = startRaw ? startRaw.getTime() : new Date(existing.startDate).getTime();
    const endMs = endRaw ? endRaw.getTime() : new Date(existing.endDate).getTime();
    if (endMs <= startMs) {
      return NextResponse.json({ error: "The end date must be after the start date." }, { status: 400 });
    }

    if (startRaw) set.startDate = startRaw;
    if (endRaw) set.endDate = endRaw;

    const plan = await TreatmentPlan.findByIdAndUpdate(id, { $set: set }, { new: true, runValidators: true }).lean();
    if (!plan) {
      return NextResponse.json({ error: "Treatment plan not found." }, { status: 404 });
    }

    return NextResponse.json({
      plan: { ...plan, phase: treatmentPlanPhase(plan), days: treatmentPlanDays(plan) },
    });
  } catch (error) {
    console.error("[admin treatment-plans] update failed:", error);
    return NextResponse.json({ error: "Could not update the treatment plan." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const denied = await adminGuard();
  if (denied) return denied;

  const { id } = await params;

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Treatment plans are temporarily unavailable." }, { status: 503 });
  }

  try {
    const plan = await TreatmentPlan.findByIdAndDelete(id).lean();
    if (!plan) {
      return NextResponse.json({ error: "Treatment plan not found." }, { status: 404 });
    }
    return NextResponse.json({ message: "Treatment plan removed." });
  } catch (error) {
    console.error("[admin treatment-plans] delete failed:", error);
    return NextResponse.json({ error: "Could not delete the treatment plan." }, { status: 500 });
  }
}