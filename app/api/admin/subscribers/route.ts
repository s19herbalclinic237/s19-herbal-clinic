import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { adminGuard } from "@/lib/admin-guard";
import { Subscriber } from "@/lib/models/Subscriber";

export async function GET() {
  const denied = await adminGuard();
  if (denied) return denied;

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Subscribers are temporarily unavailable." }, { status: 503 });
  }

  try {
    const subscribers = await Subscriber.find()
      .sort({ createdAt: -1 })
      .limit(2000)
      .lean();
    const total = await Subscriber.countDocuments();
    const subscribed = await Subscriber.countDocuments({ status: "subscribed" });
    return NextResponse.json({
      subscribers,
      counts: { total, subscribed },
    });
  } catch (error) {
    console.error("[admin/subscribers] list failed:", error);
    return NextResponse.json({ error: "Could not load subscribers." }, { status: 500 });
  }
}