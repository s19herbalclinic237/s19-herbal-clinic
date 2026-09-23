import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-server";
import { MedicalRecord } from "@/lib/models/MedicalRecord";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to view your medical records." }, { status: 401 });
  }

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Medical records are temporarily unavailable." }, { status: 503 });
  }

  try {
    const records = await MedicalRecord.find({ user: user.id }).sort({ date: -1 }).limit(200).lean();
    return NextResponse.json({ records });
  } catch (error) {
    console.error("[medical-records] list failed:", error);
    return NextResponse.json({ error: "Could not load your medical records." }, { status: 500 });
  }
}