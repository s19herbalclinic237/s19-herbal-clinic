import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { adminGuard } from "@/lib/admin-guard";
import { Prescription, type Medication } from "@/lib/models/Prescription";

type Params = { params: Promise<{ id: string }> };

function parseMedications(raw: unknown): Medication[] {
  if (!Array.isArray(raw)) return [];
  const out: Medication[] = [];
  for (const item of raw) {
    const entry = item as Record<string, unknown>;
    const name = String(entry.name || "").trim();
    const dosage = String(entry.dosage || "").trim();
    const frequency = String(entry.frequency || "").trim();
    if (!name || !dosage || !frequency) continue;
    out.push({
      name: name.slice(0, 120),
      dosage: dosage.slice(0, 120),
      frequency: frequency.slice(0, 120),
      duration: String(entry.duration || "").trim().slice(0, 120) || undefined,
      instructions: String(entry.instructions || "").trim().slice(0, 500) || undefined,
    });
  }
  return out.slice(0, 20);
}

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

  const { user, forMember, doctorName, issuedDate, expiresAt, status, medications, notes } =
    (body ?? {}) as Record<string, unknown>;

  const set: Record<string, unknown> = {};
  if (user !== undefined) {
    const clean = String(user).trim();
    if (clean) set.user = clean;
  }
  if (forMember !== undefined) set.forMember = String(forMember).trim() || undefined;
  if (doctorName !== undefined) set.doctorName = String(doctorName).trim() || undefined;
  if (issuedDate !== undefined) {
    const issued = new Date(String(issuedDate));
    if (Number.isNaN(issued.getTime())) {
      return NextResponse.json({ error: "Please provide a valid issue date." }, { status: 400 });
    }
    set.issuedDate = issued;
  }
  if (expiresAt !== undefined) {
    const raw = String(expiresAt).trim();
    if (raw === "") set.expiresAt = undefined;
    else {
      const parsed = new Date(raw);
      if (Number.isNaN(parsed.getTime())) {
        return NextResponse.json({ error: "Please provide a valid expiry date." }, { status: 400 });
      }
      set.expiresAt = parsed;
    }
  }
  if (status !== undefined) set.status = status === "expired" ? "expired" : "active";
  if (notes !== undefined) set.notes = String(notes).trim() || undefined;
  if (medications !== undefined) {
    const meds = parseMedications(medications);
    if (meds.length === 0) {
      return NextResponse.json({ error: "Add at least one medication." }, { status: 400 });
    }
    set.medications = meds;
  }

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Prescriptions are temporarily unavailable." }, { status: 503 });
  }

  try {
    if (Object.keys(set).length === 0) {
      return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
    }
    const prescription = await Prescription.findByIdAndUpdate(id, { $set: set }, { new: true }).lean();
    if (!prescription) return NextResponse.json({ error: "Prescription not found." }, { status: 404 });
    return NextResponse.json({ success: true, prescription });
  } catch (error) {
    console.error("[admin/prescriptions] update failed:", error);
    return NextResponse.json({ error: "Could not update the prescription." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const denied = await adminGuard();
  if (denied) return denied;

  const { id } = await params;
  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Prescriptions are temporarily unavailable." }, { status: 503 });
  }

  try {
    const prescription = await Prescription.findByIdAndDelete(id).lean();
    if (!prescription) return NextResponse.json({ error: "Prescription not found." }, { status: 404 });
    return NextResponse.json({ success: true, message: "Prescription deleted." });
  } catch (error) {
    console.error("[admin/prescriptions] delete failed:", error);
    return NextResponse.json({ error: "Could not delete the prescription." }, { status: 500 });
  }
}