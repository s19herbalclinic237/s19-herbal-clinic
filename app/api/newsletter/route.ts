import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { Subscriber } from "@/lib/models/Subscriber";
import { sendNewsletterWelcomeEmail } from "@/lib/email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { email, name } = (body ?? {}) as { email?: unknown; name?: unknown };
  const cleanEmail = String(email || "").trim().toLowerCase();

  if (!EMAIL_RE.test(cleanEmail)) {
    return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
  }

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Could not subscribe right now." }, { status: 503 });
  }

  try {
    const existing = await Subscriber.findOne({ email: cleanEmail }).lean();
    if (existing) {
      await Subscriber.findByIdAndUpdate(existing._id, {
        $set: {
          status: "subscribed",
          ...(typeof name === "string" && name.trim() ? { name: name.trim() } : {}),
        },
      });
    } else {
      await Subscriber.create({
        email: cleanEmail,
        name: typeof name === "string" ? name.trim() || undefined : undefined,
      });
    }

    // Send a welcome email (best-effort).
    try {
      await sendNewsletterWelcomeEmail(
        cleanEmail,
        typeof name === "string" ? name.trim() || undefined : undefined
      );
    } catch (error) {
      console.error("[newsletter] welcome email failed:", error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[newsletter] subscribe failed:", error);
    return NextResponse.json({ error: "Could not subscribe right now." }, { status: 500 });
  }
}