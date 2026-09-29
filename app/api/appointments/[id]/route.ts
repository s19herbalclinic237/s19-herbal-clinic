import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-server";
import { Doctor } from "@/lib/models/Doctor";
import { Appointment } from "@/lib/models/Appointment";
import { DATE_RE, TIME_RE, openSlotTimes, parseDateOnly, todayDateOnly, weekdayOf } from "@/lib/appointments";
import { sendAppointmentCancelledEmails, sendAppointmentRescheduledEmails } from "@/lib/email";
import { User } from "@/lib/models/User";
import { notifyPatientWhatsApp, whatsappDay, whatsappFirstName } from "@/lib/whatsapp";

type Params = { params: Promise<{ id: string }> };

/**
 * Best-effort WhatsApp copy of a slot change. Never throws and never fails the
 * request: no account, no opt-in or a Meta outage is a silent no-op.
 */
async function notifyAppointmentWhatsApp(
  userId: string,
  template: "appointment_cancelled" | "appointment_rescheduled",
  date: string,
  time: string
) {
  try {
    const patient = await User.findById(userId)
      .select("name phoneSearch whatsappOptIn preferredLanguage")
      .lean();
    if (!patient) return;
    const language = patient.preferredLanguage === "fr" ? "fr" : "en";
    // `date` is a clinic-local YYYY-MM-DD string and `time` a separate "HH:mm"
    // slot, so both are merged into one local Date before formatting.
    const when = parseDateOnly(date);
    const [hh, mm] = time.split(":").map(Number);
    when.setHours(hh || 0, mm || 0, 0, 0);
    const firstName = whatsappFirstName(patient.name);
    // The cancel template has no time placeholder; booked/rescheduled do.
    const params =
      template === "appointment_cancelled"
        ? [firstName, whatsappDay(when, language)]
        : [
            firstName,
            whatsappDay(when, language),
            when.toLocaleTimeString(language === "fr" ? "fr-FR" : "en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          ];
    await notifyPatientWhatsApp(patient, { template, params });
  } catch (error) {
    console.error("[appointments] whatsapp failed:", error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to update your appointment." }, { status: 401 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { action, date, time } = (body ?? {}) as {
    action?: string;
    date?: string;
    time?: string;
  };

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Appointments are temporarily unavailable." }, { status: 503 });
  }

  try {
    const appointment = await Appointment.findOne({ _id: id, user: user.id }).lean();
    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found." }, { status: 404 });
    }
    if (appointment.status === "cancelled") {
      return NextResponse.json({ error: "This appointment is already cancelled." }, { status: 400 });
    }
    if (appointment.status === "completed") {
      return NextResponse.json({ error: "This appointment is already completed." }, { status: 400 });
    }

    if (action === "cancel") {
      await Appointment.updateOne({ _id: id }, { $set: { status: "cancelled" } });
      const doctorDoc = await Doctor.findById(String(appointment.doctor)).select("name").lean();
      if (user.email) {
        try {
          await sendAppointmentCancelledEmails({
            to: user.email,
            patientName: user.name || "there",
            doctorName: doctorDoc?.name || "the clinic",
            date: appointment.date,
            time: appointment.time,
            mode: appointment.mode === "video" ? "video" : "clinic",
            forMember: appointment.forMember,
            concern: appointment.concern,
            phone: (user as { phone?: string }).phone,
          });
        } catch (error) {
          console.error("[appointments] cancel email failed:", error);
        }
      }
      await notifyAppointmentWhatsApp(
        user.id,
        "appointment_cancelled",
        appointment.date,
        appointment.time
      );
      return NextResponse.json({ success: true, message: "Appointment cancelled." });
    }

    if (action !== "reschedule") {
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    }

    const cleanDate = (date || "").trim();
    const cleanTime = (time || "").trim();
    if (!DATE_RE.test(cleanDate) || cleanDate < todayDateOnly()) {
      return NextResponse.json({ error: "Please pick a valid future date." }, { status: 400 });
    }
    if (!TIME_RE.test(cleanTime)) {
      return NextResponse.json({ error: "Please pick a valid time." }, { status: 400 });
    }

    const doctorDoc = await Doctor.findOne({ _id: String(appointment.doctor) }).lean();
    if (!doctorDoc) {
      return NextResponse.json({ error: "This doctor is no longer available." }, { status: 404 });
    }

    const isToday = cleanDate === todayDateOnly();
    const day = weekdayOf(cleanDate);
    const daySchedule = doctorDoc.schedule.filter((s) => s.day === day);
    if (daySchedule.length === 0) {
      return NextResponse.json({ error: "This doctor is not available on that day." }, { status: 400 });
    }

    const booked = await Appointment.find({
      _id: { $ne: id },
      doctor: String(appointment.doctor),
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

    // Rescheduling needs the clinic's go-ahead again; a video meeting link no
    // longer matches the old slot, so it is cleared.
    await Appointment.updateOne(
      { _id: id },
      { $set: { date: cleanDate, time: cleanTime, status: "pending", meetingUrl: "" } }
    );

    const updated = await Appointment.findById(id)
      .populate("doctor", "name specialty specialtyFr photo")
      .lean();

    if (user.email) {
      try {
        await sendAppointmentRescheduledEmails({
          to: user.email,
          patientName: user.name || "there",
          doctorName: doctorDoc.name,
          date: cleanDate,
          time: cleanTime,
          mode: appointment.mode === "video" ? "video" : "clinic",
          forMember: appointment.forMember,
          concern: appointment.concern,
          phone: (user as { phone?: string }).phone,
        });
      } catch (error) {
        console.error("[appointments] reschedule email failed:", error);
      }
    }

    await notifyAppointmentWhatsApp(user.id, "appointment_rescheduled", cleanDate, cleanTime);

    return NextResponse.json({
      success: true,
      appointment: updated,
      message: "Appointment rescheduled. The clinic will confirm the new slot.",
    });
  } catch (error) {
    console.error("[appointments] update failed:", error);
    return NextResponse.json({ error: "Could not update the appointment." }, { status: 500 });
  }
}