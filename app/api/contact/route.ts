import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { Inquiry } from "@/lib/models/Inquiry";
import { sendBookingNotification } from "@/lib/email";
import { rateLimitRequest, rateLimitResponse } from "@/lib/rate-limit";
import { isBotRequest } from "@/lib/bot-trap";

export async function POST(request: Request) {
  const rateLimit = await rateLimitRequest(request, {
    scope: "contact-create",
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const data = (body ?? {}) as {
    type?: string;
    fullName?: string;
    phone?: string;
    /** Free-text city/country. Optional, and deliberately not a full address. */
    city?: string;
    email?: string;
    mode?: string;
    concern?: string;
    message?: string;
  };

  // Honeypot trap: pretend the inquiry was saved so bots cannot notice.
  if (isBotRequest(data as Record<string, unknown>)) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const type = data.type === "Contact" ? "Contact" : data.type === "Order" ? "Order" : "Booking";
  if (!data.fullName?.trim() || !data.phone?.trim()) {
    return NextResponse.json({ error: "Name and phone number are required." }, { status: 400 });
  }

  const conn = await connectDb();
  if (conn) {
    try {
      await Inquiry.create({
        type,
        fullName: data.fullName.trim(),
        phone: data.phone.trim(),
        city: data.city?.trim() || undefined,
        email: data.email?.trim().toLowerCase() || undefined,
        mode: data.mode?.trim(),
        concern: data.concern?.trim(),
        message: data.message?.trim(),
        status: "New",
      });
    } catch (error) {
      console.error("[inquiry] save failed:", error);
    }
  }

  sendBookingNotification({
    fullName: data.fullName.trim(),
    phone: data.phone.trim(),
    city: data.city?.trim(),
    email: data.email?.trim(),
    mode: data.mode,
    concern: data.concern,
    message: data.message ?? "",
  }).catch(() => {});

  return NextResponse.json({ ok: true }, { status: 201 });
}