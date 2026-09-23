import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { adminGuard } from "@/lib/admin-guard";
import { Doctor, type DoctorScheduleSlot } from "@/lib/models/Doctor";

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

function cleanCommon(body: Record<string, unknown>) {
  const name = String(body.name || "").trim();
  const specialty = String(body.specialty || "").trim();
  const specialtyFr = String(body.specialtyFr || "").trim() || undefined;
  const bio = String(body.bio || "").trim() || undefined;
  const bioFr = String(body.bioFr || "").trim() || undefined;
  const photo = String(body.photo || "").trim() || undefined;
  const phone = String(body.phone || "").trim() || undefined;
  const active = body.active === undefined ? true : Boolean(body.active);
  const sortOrder = Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0;
  return { name, specialty, specialtyFr, bio, bioFr, photo, phone, active, sortOrder };
}

export async function GET() {
  const denied = await adminGuard();
  if (denied) return denied;

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Doctors are temporarily unavailable." }, { status: 503 });
  }

  try {
    const doctors = await Doctor.find().sort({ sortOrder: 1, name: 1 }).lean();
    return NextResponse.json({ doctors });
  } catch (error) {
    console.error("[admin/doctors] list failed:", error);
    return NextResponse.json({ error: "Could not load doctors." }, { status: 500 });
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
  const payload = (body ?? {}) as Record<string, unknown>;

  const clean = cleanCommon(payload);
  if (clean.name.length < 2 || clean.name.length > 100) {
    return NextResponse.json({ error: "Please provide the doctor's name." }, { status: 400 });
  }
  if (clean.specialty.length < 2 || clean.specialty.length > 100) {
    return NextResponse.json({ error: "Please provide the specialty." }, { status: 400 });
  }
  const schedule = parseSchedule(payload.schedule);

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Doctors are temporarily unavailable." }, { status: 503 });
  }

  try {
    const doctor = await Doctor.create({ ...clean, schedule });
    return NextResponse.json({ success: true, doctor }, { status: 201 });
  } catch (error) {
    console.error("[admin/doctors] create failed:", error);
    return NextResponse.json({ error: "Could not save the doctor." }, { status: 500 });
  }
}