import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-server";
import { Doctor } from "@/lib/models/Doctor";
import { Appointment } from "@/lib/models/Appointment";
import { Message } from "@/lib/models/Message";
import {
  DATE_RE,
  TIME_RE,
  openSlotTimes,
  parseDateOnly,
  todayDateOnly,
  weekdayOf,
} from "@/lib/appointments";
import { CLINIC } from "@/lib/site";
import { sendAppointmentBookedEmails } from "@/lib/email";
import { User } from "@/lib/models/User";
import { notifyPatientWhatsApp, whatsappDay, whatsappFirstName } from "@/lib/whatsapp";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to view your appointments." }, { status: 401 });
  }

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Appointments are temporarily unavailable." }, { status: 503 });
  }

  try {
    const appointments = await Appointment.find({ user: user.id, status: { $ne: "cancelled" } })
      .populate("doctor", "name specialty specialtyFr photo")
      .sort({ date: -1, time: -1 })
      .limit(200)
      .lean();
    return NextResponse.json({ appointments });
  } catch (error) {
    console.error("[appointments] list failed:", error);
    return NextResponse.json({ error: "Could not load your appointments." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to book an appointment." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const {
    doctor,
    date,
    time,
    mode,
    forMember,
    concern,
    notes,
  } = (body ?? {}) as {
    doctor?: string;
    date?: string;
    time?: string;
    mode?: string;
    forMember?: string;
    concern?: string;
    notes?: string;
  };

  const cleanDoctor = (doctor || "").trim();
  const cleanDate = (date || "").trim();
  const cleanTime = (time || "").trim();
  const cleanMode = mode === "video" ? "video" : "clinic";
  const cleanForMember = (forMember || "").trim();
  const cleanConcern = (concern || "").trim();
  const cleanNotes = (notes || "").trim();

  if (!cleanDoctor) return NextResponse.json({ error: "Please choose a doctor." }, { status: 400 });
  if (!DATE_RE.test(cleanDate)) {
    return NextResponse.json({ error: "Please pick a valid date." }, { status: 400 });
  }
  if (cleanDate < todayDateOnly()) {
    return NextResponse.json({ error: "You can only book a date from today onwards." }, { status: 400 });
  }
  if (!TIME_RE.test(cleanTime)) {
    return NextResponse.json({ error: "Please pick a valid time." }, { status: 400 });
  }
  if (cleanForMember.length > 80) {
    return NextResponse.json({ error: "The patient name is too long." }, { status: 400 });
  }
  if (cleanConcern.length > 200) {
    return NextResponse.json({ error: "The health concern is too long." }, { status: 400 });
  }
  if (cleanNotes.length > 500) {
    return NextResponse.json({ error: "Your notes are too long (max 500 characters)." }, { status: 400 });
  }

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Appointments are temporarily unavailable." }, { status: 503 });
  }

  try {
    const doctorDoc = await Doctor.findOne({ _id: cleanDoctor, active: true }).lean();
    if (!doctorDoc) {
      return NextResponse.json({ error: "This doctor is not accepting bookings." }, { status: 404 });
    }

    const isToday = cleanDate === todayDateOnly();
    const day = weekdayOf(cleanDate);
    const daySchedule = doctorDoc.schedule.filter((s) => s.day === day);
    if (daySchedule.length === 0) {
      return NextResponse.json(
        { error: "This doctor is not available on that day." },
        { status: 400 }
      );
    }

    const booked = await Appointment.find({
      doctor: cleanDoctor,
      date: cleanDate,
      status: { $ne: "cancelled" },
    })
      .select("time")
      .lean();

    if (!openSlotTimes(daySchedule, booked.map((b) => b.time), isToday).includes(cleanTime)) {
      return NextResponse.json(
        { error: "That slot is no longer available. Please pick another time." },
        { status: 409 }
      );
    }

    const appointment = await Appointment.create({
      user: user.id,
      doctor: cleanDoctor,
      forMember: cleanForMember || undefined,
      date: cleanDate,
      time: cleanTime,
      mode: cleanMode,
      concern: cleanConcern || undefined,
      notes: cleanNotes || undefined,
      status: "pending",
    });

    // In-app reminder so the patient sees the booking in their Messages inbox too.
    const modeLabel = cleanMode === "video" ? "video consultation" : "in-clinic visit";
    await Message.create({
      user: user.id,
      author: "admin",
      subject: `Appointment booked - ${cleanDate} at ${cleanTime}`,
      body:
        `Your ${modeLabel} with ${doctorDoc.name} is booked for ${cleanDate} at ${cleanTime}.` +
        (cleanForMember ? `\nPatient: ${cleanForMember}` : "") +
        `\nThe clinic will confirm shortly. If anything changes, please let us know on WhatsApp: ${CLINIC.phone}`,
      read: false,
    });

    // Email the patient a copy of the request and alert the clinic.
    if (user.email) {
      try {
        await sendAppointmentBookedEmails({
          to: user.email,
          patientName: user.name || "there",
          doctorName: doctorDoc.name,
          date: cleanDate,
          time: cleanTime,
          mode: cleanMode === "video" ? "video" : "clinic",
          forMember: cleanForMember || undefined,
          concern: cleanConcern || undefined,
          phone: (user as { phone?: string }).phone,
        });
      } catch (error) {
        console.error("[appointments] booking email failed:", error);
      }
    }

    // WhatsApp the patient the same request (best-effort, never fails the booking).
    const patient = await User.findById(user.id)
      .select("name phoneSearch whatsappOptIn preferredLanguage")
      .lean();
    if (patient) {
      try {
        const language = patient.preferredLanguage === "fr" ? "fr" : "en";
        // `date` is a clinic-local YYYY-MM-DD string and `time` a separate "HH:mm"
        // slot, so both are merged into one local Date before formatting.
        const when = parseDateOnly(cleanDate);
        const [hh, mm] = cleanTime.split(":").map(Number);
        when.setHours(hh || 0, mm || 0, 0, 0);
        await notifyPatientWhatsApp(patient, {
          template: "appointment_booked",
          params: [
            whatsappFirstName(patient.name),
            whatsappDay(when, language),
            when.toLocaleTimeString(language === "fr" ? "fr-FR" : "en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          ],
        });
      } catch (error) {
        console.error("[appointments] booking whatsapp failed:", error);
      }
    }

    return NextResponse.json(
      { success: true, appointment, message: "Appointment requested. The clinic will confirm." },
      { status: 201 }
    );
  } catch (error) {
    console.error("[appointments] create failed:", error);
    return NextResponse.json({ error: "Could not book the appointment. Please try again." }, { status: 500 });
  }
}