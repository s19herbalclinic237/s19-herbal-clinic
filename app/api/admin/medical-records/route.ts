import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { adminGuard } from "@/lib/admin-guard";
import { MedicalRecord, type RecordAttachment, type MedicalRecordType } from "@/lib/models/MedicalRecord";

const TYPES: MedicalRecordType[] = ["visit", "diagnosis", "lab", "scan", "note"];

function parseAttachments(raw: unknown): RecordAttachment[] {
  if (!Array.isArray(raw)) return [];
  const out: RecordAttachment[] = [];
  for (const item of raw) {
    const entry = item as Record<string, unknown>;
    const url = String(entry.url || "").trim();
    const name = String(entry.name || "").trim() || "Attachment";
    if (url.startsWith("http://") || url.startsWith("https://")) {
      out.push({ name: name.slice(0, 120), url });
    }
  }
  return out.slice(0, 10);
}

export async function GET(request: Request) {
  const denied = await adminGuard();
  if (denied) return denied;

  const url = new URL(request.url);
  const userId = String(url.searchParams.get("user") || "").trim();

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Medical records are temporarily unavailable." }, { status: 503 });
  }

  try {
    const filter = userId ? { user: userId } : {};
    const records = await MedicalRecord.find(filter)
      .populate("user", "name email")
      .sort({ date: -1 })
      .limit(500)
      .lean();
    return NextResponse.json({ records });
  } catch (error) {
    console.error("[admin/medical-records] list failed:", error);
    return NextResponse.json({ error: "Could not load medical records." }, { status: 500 });
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

  const {
    user,
    forMember,
    type,
    title,
    date,
    doctorName,
    diagnosis,
    notes,
    results,
    attachments,
  } = (body ?? {}) as Record<string, unknown>;

  const cleanUserId = String(user || "").trim();
  const cleanTitle = String(title || "").trim();
  const recordType = TYPES.includes(type as MedicalRecordType) ? (type as MedicalRecordType) : "visit";

  if (!cleanUserId) {
    return NextResponse.json({ error: "Please choose a patient." }, { status: 400 });
  }
  if (cleanTitle.length < 2 || cleanTitle.length > 200) {
    return NextResponse.json({ error: "Please provide a record title." }, { status: 400 });
  }
  const recordDate = new Date(String(date || ""));
  if (Number.isNaN(recordDate.getTime())) {
    return NextResponse.json({ error: "Please provide a record date." }, { status: 400 });
  }

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Medical records are temporarily unavailable." }, { status: 503 });
  }

  try {
    const record = await MedicalRecord.create({
      user: cleanUserId,
      forMember: String(forMember || "").trim() || undefined,
      type: recordType,
      title: cleanTitle,
      date: recordDate,
      doctorName: String(doctorName || "").trim() || undefined,
      diagnosis: String(diagnosis || "").trim() || undefined,
      notes: String(notes || "").trim() || undefined,
      results: String(results || "").trim() || undefined,
      attachments: parseAttachments(attachments),
    });
    return NextResponse.json({ success: true, record }, { status: 201 });
  } catch (error) {
    console.error("[admin/medical-records] create failed:", error);
    return NextResponse.json({ error: "Could not save the medical record." }, { status: 500 });
  }
}