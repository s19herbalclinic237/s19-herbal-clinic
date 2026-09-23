import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { adminGuard } from "@/lib/admin-guard";
import { Doctor, type DoctorScheduleSlot } from "@/lib/models/Doctor";

type Params = { params: Promise<{ id: string }> };

function parseSchedule(raw: unknown): DoctorScheduleSlot[] {
  if (!Array.isArray(raw)) return [];
  const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
  const slots: DoctorScheduleSlot[] = [];
  for (const item of raw) {
    const entry = item as Record<string, unknown>;
    const day = Number(entry.day);
    const start = String(entry.start || "");
    const end = String(entry.end || "");
    const slotMinutes = Number(entry.slotMinutes) || 30;
    if (
      Number.isInteger(day) &&
      day >= 0 &&
      day <= 6 &&
      TIME_RE.test(start) &&
      TIME_RE.test(end) &&
      slotMinutes >= 15 &&
      slotMinutes <= 120
    ) {
      slots.push({ day, start, end, slotMinutes });
    }
  }
  return slots;
}

export async function GET(_request: Request, { params }: Params) {
  const denied = await adminGuard();
  if (denied) return denied;

  const { id } = await params;
  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Doctors are temporarily unavailable." }, { status: 503 });
  }

  try {
    const doctor = await Doctor.findById(id).lean();
    if (!doctor) return NextResponse.json({ error: "Doctor not found." }, { status: 404 });
    return NextResponse.json({ doctor });
  } catch (error) {
    console.error("[admin/doctors] get failed:", error);
    return NextResponse.json({ error: "Could not load the doctor." }, { status: 500 });
  }
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
  const payload = (body ?? {}) as Record<string, unknown>;

  const name = payload.name === undefined ? undefined : String(payload.name).trim();
  const specialty = payload.specialty === undefined ? undefined : String(payload.specialty).trim();
  const specialtyFr =
    payload.specialtyFr === undefined ? undefined : String(payload.specialtyFr).trim() || undefined;
  const bio = payload.bio === undefined ? undefined : String(payload.bio).trim() || undefined;
  const bioFr = payload.bioFr === undefined ? undefined : String(payload.bioFr).trim() || undefined;
  const photo = payload.photo === undefined ? undefined : String(payload.photo).trim() || undefined;
  const phone = payload.phone === undefined ? undefined : String(payload.phone).trim() || undefined;
  const active = payload.active === undefined ? undefined : Boolean(payload.active);
  const sortOrder =
    payload.sortOrder === undefined
      ? undefined
      : Number.isFinite(Number(payload.sortOrder))
        ? Number(payload.sortOrder)
        : undefined;
  const schedule =
    payload.schedule === undefined ? undefined : parseSchedule(payload.schedule);

  if (name !== undefined && (name.length < 2 || name.length > 100)) {
    return NextResponse.json({ error: "Please provide the doctor's name." }, { status: 400 });
  }
  if (specialty !== undefined && (specialty.length < 2 || specialty.length > 100)) {
    return NextResponse.json({ error: "Please provide the specialty." }, { status: 400 });
  }

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Doctors are temporarily unavailable." }, { status: 503 });
  }

  try {
    const set: Record<string, unknown> = {};
    if (name !== undefined) set.name = name;
    if (specialty !== undefined) set.specialty = specialty;
    if (specialtyFr !== undefined) set.specialtyFr = specialtyFr;
    if (bio !== undefined) set.bio = bio;
    if (bioFr !== undefined) set.bioFr = bioFr;
    if (photo !== undefined) set.photo = photo;
    if (phone !== undefined) set.phone = phone;
    if (active !== undefined) set.active = active;
    if (sortOrder !== undefined) set.sortOrder = sortOrder;
    if (schedule !== undefined) set.schedule = schedule;

    const doctor = await Doctor.findByIdAndUpdate(id, { $set: set }, { new: true }).lean();
    if (!doctor) return NextResponse.json({ error: "Doctor not found." }, { status: 404 });
    return NextResponse.json({ success: true, doctor });
  } catch (error) {
    console.error("[admin/doctors] update failed:", error);
    return NextResponse.json({ error: "Could not update the doctor." }, { status: 500 });
  }
}

/**
 * Deletes the doctor row entirely. Appointment history keeps the doctor id
 * and shows a "Doctor" fallback label in past/upcoming bookings.
 */
export async function DELETE(_request: Request, { params }: Params) {
  const denied = await adminGuard();
  if (denied) return denied;

  const { id } = await params;
  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Doctors are temporarily unavailable." }, { status: 503 });
  }

  try {
    const doctor = await Doctor.findByIdAndDelete(id).lean();
    if (!doctor) return NextResponse.json({ error: "Doctor not found." }, { status: 404 });
    return NextResponse.json({ success: true, message: "Doctor deleted." });
  } catch (error) {
    console.error("[admin/doctors] delete failed:", error);
    return NextResponse.json({ error: "Could not remove the doctor." }, { status: 500 });
  }
}