import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { clinicalGuard } from "@/lib/admin-guard";
import { Doctor } from "@/lib/models/Doctor";
import { Appointment } from "@/lib/models/Appointment";
import { Message } from "@/lib/models/Message";
import { DATE_RE, TIME_RE, openSlotTimes, todayDateOnly, weekdayOf } from "@/lib/appointments";
import {
  sendAppointmentCancelledEmails,
  sendAppointmentConfirmedEmails,
  sendAppointmentProviderUpdateEmails,
  type AppointmentEmailInput,
} from "@/lib/email";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const denied = await clinicalGuard();
  if (denied) return denied;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const {
    status,
    meetingUrl,
    notes,
    concern,
    forMember,
    date,
    time,
    doctor: doctorId,
  } = (body ?? {}) as {
    status?: string;
    meetingUrl?: string;
    notes?: string;
    concern?: string;
    forMember?: string;
    date?: string;
    time?: string;
    doctor?: string;
  };

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Appointments are temporarily unavailable." }, { status: 503 });
  }

  try {
    const appointment = await Appointment.findById(id).lean();
    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found." }, { status: 404 });
    }

    const allowedStatus = ["pending", "confirmed", "completed", "cancelled"];
    if (status !== undefined && !allowedStatus.includes(status)) {
      return NextResponse.json({ error: "Unknown status." }, { status: 400 });
    }
    if (meetingUrl !== undefined) {
      const url = meetingUrl.trim();
      if (url !== "" && !/^https?:\/\//.test(url)) {
        return NextResponse.json({ error: "Provide a valid meeting link (https://...)." }, { status: 400 });
      }
    }

    const set: Record<string, unknown> = {};
    let targetDoctorId = String(appointment.doctor);
    let targetDate = appointment.date;
    let targetTime = appointment.time;

    if (doctorId !== undefined) {
      if (!doctorId.trim()) {
        return NextResponse.json({ error: "Please choose a doctor." }, { status: 400 });
      }
      const doctorDoc = await Doctor.findById(doctorId.trim()).lean();
      if (!doctorDoc) {
        return NextResponse.json({ error: "Doctor not found." }, { status: 404 });
      }
      targetDoctorId = String(doctorDoc._id);
      set.doctor = targetDoctorId;
    }
    if (date !== undefined) {
      if (!DATE_RE.test(date.trim()) || date.trim() < todayDateOnly()) {
        return NextResponse.json({ error: "Please pick a valid future date." }, { status: 400 });
      }
      targetDate = date.trim();
      set.date = targetDate;
    }
    if (time !== undefined) {
      if (!TIME_RE.test(time.trim())) {
        return NextResponse.json({ error: "Please pick a valid time." }, { status: 400 });
      }
      targetTime = time.trim();
      set.time = targetTime;
    }

    // Slot conflict check when the appointment was moved.
    if (
      doctorId !== undefined ||
      date !== undefined ||
      time !== undefined
    ) {
      const doctorDoc = await Doctor.findById(targetDoctorId).lean();
      if (!doctorDoc) {
        return NextResponse.json({ error: "Doctor not found." }, { status: 404 });
      }
      const isToday = targetDate === todayDateOnly();
      const day = weekdayOf(targetDate);
      const daySchedule = doctorDoc.schedule.filter((s) => s.day === day);
      if (daySchedule.length === 0) {
        return NextResponse.json({ error: "This doctor is not available on that day." }, { status: 400 });
      }
      const booked = await Appointment.find({
        _id: { $ne: id },
        doctor: targetDoctorId,
        date: targetDate,
        status: { $ne: "cancelled" },
      })
        .select("time")
        .lean();
      if (!openSlotTimes(daySchedule, booked.map((b) => b.time), isToday).includes(targetTime)) {
        return NextResponse.json(
          { error: "That slot is already taken. Please pick another time." },
          { status: 409 }
        );
      }
    }

    if (status !== undefined) set.status = status;
    if (meetingUrl !== undefined) set.meetingUrl = meetingUrl.trim() || undefined;
    if (notes !== undefined) set.notes = notes.trim() || undefined;
    if (concern !== undefined) set.concern = concern.trim() || undefined;
    if (forMember !== undefined) set.forMember = forMember.trim() || undefined;

    await Appointment.updateOne({ _id: id }, { $set: set });

    // Notify the patient when the clinic confirms their appointment.
    if (status === "confirmed" && appointment.status !== "confirmed") {
      const clean = set.meetingUrl as string | undefined;
      await Message.create({
        user: appointment.user,
        author: "admin",
        subject: "Appointment confirmed",
        body:
          `Your appointment (${targetDate} at ${targetTime}) has been confirmed.${
            clean ? `\nJoin link: ${clean}` : ""
          }\nPlease arrive a few minutes early, and reach out on WhatsApp if you need help.`,
        read: false,
      });
    }

    const updated = await Appointment.findById(id)
      .populate("user", "name email phone")
      .populate("doctor", "name specialty specialtyFr")
      .lean();

    // Email the patient when the clinic confirms, cancels, or moves a slot.
    if (updated) {
      const patient = (updated.user ?? undefined) as
        | { name?: string; email?: string; phone?: string }
        | undefined;
      const doctorObj = (updated.doctor ?? undefined) as { name?: string } | undefined;
      const oldStatus = appointment.status;
      const movedSlot =
        (doctorId !== undefined && doctorId.trim() !== String(appointment.doctor)) ||
        (date !== undefined && date.trim() !== appointment.date) ||
        (time !== undefined && time.trim() !== appointment.time);

      if (patient?.email) {
        const payload: AppointmentEmailInput = {
          to: patient.email,
          patientName: patient.name || "there",
          doctorName: doctorObj?.name || "the clinic",
          date: targetDate,
          time: targetTime,
          mode: updated.mode === "video" ? "video" : "clinic",
          forMember: updated.forMember,
          concern: updated.concern,
          meetingUrl:
            (set.meetingUrl as string | undefined) || appointment.meetingUrl || undefined,
          phone: patient.phone,
        };
        try {
          if (status === "confirmed" && oldStatus !== "confirmed") {
            await sendAppointmentConfirmedEmails(payload);
          } else if (status === "cancelled" && oldStatus !== "cancelled") {
            await sendAppointmentCancelledEmails(payload);
          } else if (movedSlot) {
            await sendAppointmentProviderUpdateEmails(payload);
          }
        } catch (error) {
          console.error("[admin/appointments] notification email failed:", error);
        }
      }
    }

    return NextResponse.json({ success: true, appointment: updated });
  } catch (error) {
    console.error("[admin/appointments] update failed:", error);
    return NextResponse.json({ error: "Could not update the appointment." }, { status: 500 });
  }
}