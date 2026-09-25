import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { adminGuard } from "@/lib/admin-guard";
import {
  GlucoseReading,
  isGlucoseConcerning,
} from "@/lib/models/GlucoseReading";

/** All glucose readings (optionally filtered by plan), newest first, flagged. */
export async function GET(request: Request) {
  const denied = await adminGuard();
  if (denied) return denied;

  const url = new URL(request.url);
  const planId = String(url.searchParams.get("plan") || "").trim();

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Glucose readings are temporarily unavailable." }, { status: 503 });
  }

  try {
    const filter = planId ? { plan: planId } : {};
    const readings = await GlucoseReading.find(filter)
      .populate("plan", "title forMember")
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();
    return NextResponse.json({
      readings: readings.map((r) => ({ ...r, concerning: isGlucoseConcerning(r) })),
    });
  } catch (error) {
    console.error("[admin glucose] list failed:", error);
    return NextResponse.json({ error: "Could not load glucose readings." }, { status: 500 });
  }
}