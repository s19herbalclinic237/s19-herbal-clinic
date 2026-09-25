import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { adminGuard } from "@/lib/admin-guard";
import {
  TreatmentFollowUp,
  parseSymptomsList,
} from "@/lib/models/TreatmentFollowUp";

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
    return NextResponse.json({ error: "Treatment progress is temporarily unavailable." }, { status: 503 });
  }

  try {
    const existing = await TreatmentFollowUp.findById(id).lean();
    if (!existing) {
      return NextResponse.json({ error: "Follow-up not found." }, { status: 404 });
    }

    const raw = (body ?? {}) as Record<string, unknown>;
    const set: Record<string, unknown> = {};

    if (raw.date !== undefined) {
      const d = new Date(String(raw.date));
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json({ error: "Enter a valid follow-up date." }, { status: 400 });
      }
      set.date = d;
    }
    if (raw.milestone !== undefined) {
      const m = String(raw.milestone);
      if (!["baseline", "monthly", "final", "other"].includes(m)) {
        return NextResponse.json({ error: "Invalid milestone." }, { status: 400 });
      }
      set.milestone = m;
    }
    if (raw.milestoneLabel !== undefined) {
      set.milestoneLabel = String(raw.milestoneLabel).trim().slice(0, 120) || undefined;
    }
    if (raw.forMember !== undefined) set.forMember = String(raw.forMember).trim() || undefined;
    if (raw.improvements !== undefined) {
      set.improvements = String(raw.improvements).trim().slice(0, 4000) || undefined;
    }
    if (raw.followUpLabs !== undefined) {
      set.followUpLabs = String(raw.followUpLabs).trim().slice(0, 4000) || undefined;
    }
    if (raw.clinicianNotes !== undefined) {
      set.clinicianNotes = String(raw.clinicianNotes).trim().slice(0, 4000) || undefined;
    }
    for (const key of ["resolvedSymptoms", "improvedSymptoms", "persistentSymptoms", "newSymptoms", "adverseReactions"] as const) {
      if (raw[key] !== undefined) set[key] = parseSymptomsList(raw[key]);
    }
    if (raw.vitals !== undefined) {
      const v = (raw.vitals ?? {}) as Record<string, unknown>;
      const vitals: Record<string, number | undefined> = {};
      for (const k of ["weightKg", "systolicBp", "diastolicBp", "glucoseMgdl"] as const) {
        vitals[k] = v[k] !== undefined && v[k] !== "" ? Number(v[k]) : undefined;
      }
      set.vitals = vitals;
    }

    const updated = await TreatmentFollowUp.findByIdAndUpdate(
      id,
      { $set: set },
      { new: true, runValidators: true }
    ).lean();
    if (!updated) {
      return NextResponse.json({ error: "Follow-up not found." }, { status: 404 });
    }
    return NextResponse.json({ followUp: updated });
  } catch (error) {
    console.error("[admin treatment-follow-ups] update failed:", error);
    return NextResponse.json({ error: "Could not update the follow-up." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const denied = await adminGuard();
  if (denied) return denied;

  const { id } = await params;

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Treatment progress is temporarily unavailable." }, { status: 503 });
  }

  try {
    const removed = await TreatmentFollowUp.findByIdAndDelete(id).lean();
    if (!removed) {
      return NextResponse.json({ error: "Follow-up not found." }, { status: 404 });
    }
    return NextResponse.json({ message: "Follow-up removed." });
  } catch (error) {
    console.error("[admin treatment-follow-ups] delete failed:", error);
    return NextResponse.json({ error: "Could not delete the follow-up." }, { status: 500 });
  }
}