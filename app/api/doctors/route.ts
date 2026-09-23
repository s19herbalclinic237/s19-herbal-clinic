import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { Doctor } from "@/lib/models/Doctor";

export async function GET() {
  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Doctors are temporarily unavailable." }, { status: 503 });
  }

  try {
    const doctors = await Doctor.find({ active: true })
      .sort({ sortOrder: 1, name: 1 })
      .lean();
    return NextResponse.json({ doctors });
  } catch (error) {
    console.error("[doctors] list failed:", error);
    return NextResponse.json({ error: "Could not load doctors." }, { status: 500 });
  }
}