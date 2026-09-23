import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-server";
import { Prescription } from "@/lib/models/Prescription";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to view your prescriptions." }, { status: 401 });
  }

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Prescriptions are temporarily unavailable." }, { status: 503 });
  }

  try {
    const prescriptions = await Prescription.find({ user: user.id })
      .sort({ issuedDate: -1 })
      .limit(200)
      .lean();
    return NextResponse.json({ prescriptions });
  } catch (error) {
    console.error("[prescriptions] list failed:", error);
    return NextResponse.json({ error: "Could not load your prescriptions." }, { status: 500 });
  }
}