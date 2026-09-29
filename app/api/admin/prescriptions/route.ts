import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { clinicalGuard } from "@/lib/admin-guard";
import { Prescription, type Medication } from "@/lib/models/Prescription";
import { User } from "@/lib/models/User";
import { notifyPatient } from "@/lib/notify";
import { sendPrescriptionIssuedEmail } from "@/lib/email";
import { notifyPatientWhatsApp, whatsappFirstName } from "@/lib/whatsapp";

/** WhatsApp message bodies are short, so cap the medication list at 3 names. */
function summariseMedications(meds: Medication[], language: "en" | "fr"): string {
  const names = meds.map((m) => m.name);
  if (names.length <= 3) return names.join(", ");
  const rest = names.length - 3;
  return language === "fr"
    ? `${names.slice(0, 3).join(", ")} et ${rest} autres`
    : `${names.slice(0, 3).join(", ")} and ${rest} more`;
}

/** Only absolute http(s) image URLs are stored, mirroring the attachment rule in
 *  app/api/admin/medical-records/route.ts. */
function cleanImageUrl(raw: unknown): string | undefined {
  const url = String(raw || "").trim();
  if (!url) return undefined;
  if (!url.startsWith("http://") && !url.startsWith("https://")) return undefined;
  return url.slice(0, 1000);
}

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
      photo: cleanImageUrl(entry.photo),
    });
  }
  return out.slice(0, 20);
}

export async function GET(request: Request) {
  const denied = await clinicalGuard();
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
  const denied = await clinicalGuard();
  if (denied) return denied;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { user, forMember, doctorName, issuedDate, expiresAt, status, medications, coverPhoto, notes } =
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
      coverPhoto: cleanImageUrl(coverPhoto),
      notes: String(notes || "").trim() || undefined,
    });

    // Notify the patient (and keep the doctor's name on record in their inbox).
    const doctor = String(doctorName || "").trim();
    const member = String(forMember || "").trim();
    const medNames = meds.map((m) => m.name).join(", ");
    const bodyLines = [
      `A new prescription has been issued${doctor ? ` by ${doctor}` : " by the clinic"}: ${medNames}.`,
      member ? `Patient: ${member}.` : "",
      String(notes || "").trim() ? `Notes: ${String(notes || "").trim()}` : "",
      "You can view the dosage instructions under Prescriptions in your dashboard.",
    ].filter(Boolean);
    const notified = await notifyPatient({
      userId: cleanUserId,
      subject: `New prescription - ${medNames}`,
      body: bodyLines.join("\n"),
    });

    // Email the patient the same update (best-effort).
    const patient = await User.findById(cleanUserId)
      .select("name email phoneSearch whatsappOptIn preferredLanguage")
      .lean();
    if (patient?.email) {
      try {
        await sendPrescriptionIssuedEmail({
          to: patient.email,
          patientName: patient.name,
          doctorName: doctor || undefined,
          forMember: member || undefined,
          medications: medNames,
        });
      } catch (error) {
        console.error("[admin/prescriptions] email failed:", error);
      }
    }

    // WhatsApp the patient the same update (best-effort, never fails the request).
    if (patient) {
      try {
        const language = patient.preferredLanguage === "fr" ? "fr" : "en";
        await notifyPatientWhatsApp(patient, {
          template: "prescription_issued",
          params: [whatsappFirstName(patient.name), summariseMedications(meds, language)],
        });
      } catch (error) {
        console.error("[admin/prescriptions] whatsapp failed:", error);
      }
    }

    return NextResponse.json({ success: true, prescription, notified }, { status: 201 });
  } catch (error) {
    console.error("[admin/prescriptions] create failed:", error);
    return NextResponse.json({ error: "Could not save the prescription." }, { status: 500 });
  }
}