import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { adminGuard } from "@/lib/admin-guard";
import { Prescription, type Medication } from "@/lib/models/Prescription";

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

export async function GET(request: Request) {
  const denied = await adminGuard();
  if (denied) return denied;

  const url = new URL(request.url);
  const userId = String(url.searchParams.get("user") || "").trim();

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Prescriptions are temporarily unavailable." }, { status: 503 });
  }

  try {
    const filter = userId ? { user: userId } : {};
    const prescriptions = await Prescription.find(filter)
      .populate("user", "name email")
      .sort({ issuedDate: -1 })
      .limit(500)
      .lean();
    return NextResponse.json({ prescriptions });
  } catch (error) {
    console.error("[admin/prescriptions] list failed:", error);
    return NextResponse.json({ error: "Could not load prescriptions." }, { status: 500 });
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

  const { user, forMember, doctorName, issuedDate, expiresAt, status, medications, notes } =
    (body ?? {}) as Record<string, unknown>;

  const cleanUserId = String(user || "").trim();
  if (!cleanUserId) {
    return NextResponse.json({ error: "Please choose a patient." }, { status: 400 });
  }

  const issued = new Date(String(issuedDate || ""));
  if (Number.isNaN(issued.getTime())) {
    return NextResponse.json({ error: "Please provide the issue date." }, { status: 400 });
  }

  let expires: Date | undefined;
  if (expiresAt !== undefined && String(expiresAt).trim() !== "") {
    const parsed = new Date(String(expiresAt));
    if (Number.isNaN(parsed.getTime())) {
      return NextResponse.json({ error: "Please provide a valid expiry date." }, { status: 400 });
    }
    expires = parsed;
  }

  const meds = parseMedications(medications);
  if (meds.length === 0) {
    return NextResponse.json({ error: "Add at least one medication." }, { status: 400 });
  }

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Prescriptions are temporarily unavailable." }, { status: 503 });
  }

  try {
    const prescription = await Prescription.create({
      user: cleanUserId,
      forMember: String(forMember || "").trim() || undefined,
      doctorName: String(doctorName || "").trim() || undefined,
      issuedDate: issued,
      expiresAt: expires,
      status: status === "expired" ? "expired" : "active",
      medications: meds,
      notes: String(notes || "").trim() || undefined,
    });
    return NextResponse.json({ success: true, prescription }, { status: 201 });
  } catch (error) {
    console.error("[admin/prescriptions] create failed:", error);
    return NextResponse.json({ error: "Could not save the prescription." }, { status: 500 });
  }
}