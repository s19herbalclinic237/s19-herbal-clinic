import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-server";
import { Doctor } from "@/lib/models/Doctor";
import { Appointment } from "@/lib/models/Appointment";
import {
  DATE_RE,
  openSlotTimes,
  todayDateOnly,
  weekdayOf,
} from "@/lib/appointments";

/**
 * GET /api/appointments/availability?doctor=ID&date=YYYY-MM-DD
 * Returns the still-open appointment slots for one doctor on one date.
 */
export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to check availability." }, { status: 401 });
  }

  const url = new URL(request.url);
  const doctorId = String(url.searchParams.get("doctor") || "").trim();
  const date = String(url.searchParams.get("date") || "").trim();

  if (!doctorId) {
    return NextResponse.json({ error: "A doctor is required." }, { status: 400 });
  }
  if (!DATE_RE.test(date)) {
    return NextResponse.json({ error: "Please pick a valid date." }, { status: 400 });
  }
  if (date < todayDateOnly()) {
    return NextResponse.json({ error: "You can only book a date from today onwards." }, { status: 400 });
  }

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Availability is temporarily unavailable." }, { status: 503 });
  }

  try {
    const doctor = await Doctor.findOne({ _id: doctorId, active: true }).lean();
    if (!doctor) {
      return NextResponse.json({ error: "This doctor is not accepting bookings." }, { status: 404 });
    }

    const isToday = date === todayDateOnly();
    const day = weekdayOf(date);
    const daySchedule = doctor.schedule.filter((s) => s.day === day);

    if (daySchedule.length === 0) {
      return NextResponse.json({ slots: [], doctor });
    }

    const booked = await Appointment.find({
      doctor: doctorId,
      date,
      status: { $ne: "cancelled" },
    })
      .select("time")
      .lean();
    const bookedTimes = booked.map((b) => b.time);

    const slots = openSlotTimes(daySchedule, bookedTimes, isToday);

    return NextResponse.json({ slots, doctor, date, weekday: day });
  } catch (error) {
    console.error("[appointments/availability] failed:", error);
    return NextResponse.json({ error: "Could not load availability." }, { status: 500 });
  }
}