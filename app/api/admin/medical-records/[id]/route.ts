import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { adminGuard } from "@/lib/admin-guard";
import { MedicalRecord, type RecordAttachment, type MedicalRecordType } from "@/lib/models/MedicalRecord";

type Params = { params: Promise<{ id: string }> };

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

  const { forMember, type, title, date, doctorName, diagnosis, notes, results, attachments, user } =
    (body ?? {}) as Record<string, unknown>;

  const set: Record<string, unknown> = {};
  if (user !== undefined) {
    const cleanUserId = String(user).trim();
    if (cleanUserId) set.user = cleanUserId;
  }
  if (forMember !== undefined) set.forMember = String(forMember).trim() || undefined;
  if (type !== undefined && TYPES.includes(type as MedicalRecordType)) set.type = type as MedicalRecordType;
  if (title !== undefined) {
    const clean = String(title).trim();
    if (clean.length < 2 || clean.length > 200) {
      return NextResponse.json({ error: "Please provide a record title." }, { status: 400 });
    }
    set.title = clean;
  }
  if (date !== undefined) {
    const recordDate = new Date(String(date));
    if (Number.isNaN(recordDate.getTime())) {
      return NextResponse.json({ error: "Please provide a valid date." }, { status: 400 });
    }
    set.date = recordDate;
  }
  if (doctorName !== undefined) set.doctorName = String(doctorName).trim() || undefined;
  if (diagnosis !== undefined) set.diagnosis = String(diagnosis).trim() || undefined;
  if (notes !== undefined) set.notes = String(notes).trim() || undefined;
  if (results !== undefined) set.results = String(results).trim() || undefined;
  if (attachments !== undefined) set.attachments = parseAttachments(attachments);

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Medical records are temporarily unavailable." }, { status: 503 });
  }

  try {
    if (Object.keys(set).length === 0) {
      return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
    }
    const record = await MedicalRecord.findByIdAndUpdate(id, { $set: set }, { new: true }).lean();
    if (!record) return NextResponse.json({ error: "Record not found." }, { status: 404 });
    return NextResponse.json({ success: true, record });
  } catch (error) {
    console.error("[admin/medical-records] update failed:", error);
    return NextResponse.json({ error: "Could not update the medical record." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const denied = await adminGuard();
  if (denied) return denied;

  const { id } = await params;
  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Medical records are temporarily unavailable." }, { status: 503 });
  }

  try {
    const record = await MedicalRecord.findByIdAndDelete(id).lean();
    if (!record) return NextResponse.json({ error: "Record not found." }, { status: 404 });
    return NextResponse.json({ success: true, message: "Medical record deleted." });
  } catch (error) {
    console.error("[admin/medical-records] delete failed:", error);
    return NextResponse.json({ error: "Could not delete the medical record." }, { status: 500 });
  }
}