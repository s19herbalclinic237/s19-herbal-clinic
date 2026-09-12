import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { Subscriber } from "@/lib/models/Subscriber";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { email } = (body ?? {}) as { email?: unknown };
  const cleanEmail = String(email || "").trim().toLowerCase();

  if (!EMAIL_RE.test(cleanEmail)) {
    return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
  }

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Could not update your subscription." }, { status: 503 });
  }

  try {
    const existing = await Subscriber.findOne({ email: cleanEmail }).lean();
    if (existing) {
      await Subscriber.findByIdAndUpdate(existing._id, { $set: { status: "unsubscribed" } });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[newsletter] unsubscribe failed:", error);
    return NextResponse.json({ error: "Could not update your subscription." }, { status: 500 });
  }
}