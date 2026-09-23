import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { adminGuard } from "@/lib/admin-guard";
import { Appointment } from "@/lib/models/Appointment";

export async function GET(request: Request) {
  const denied = await adminGuard();
  if (denied) return denied;

  const url = new URL(request.url);
  const status = String(url.searchParams.get("status") || "").trim();

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Appointments are temporarily unavailable." }, { status: 503 });
  }

  try {
    const filter: Record<string, unknown> = {};
    if (status === "all") {
      // no filter
    } else if (
      status === "pending" ||
      status === "confirmed" ||
      status === "completed" ||
      status === "cancelled"
    ) {
      filter.status = status;
    } else {
      filter.status = { $ne: "cancelled" };
    }

    const appointments = await Appointment.find(filter)
      .populate("user", "name email phone")
      .populate("doctor", "name specialty specialtyFr")
      .sort({ date: -1, time: -1 })
      .limit(300)
      .lean();

    return NextResponse.json({ appointments });
  } catch (error) {
    console.error("[admin/appointments] list failed:", error);
    return NextResponse.json({ error: "Could not load appointments." }, { status: 500 });
  }
}