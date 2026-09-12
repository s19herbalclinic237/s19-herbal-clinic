import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { Inquiry } from "@/lib/models/Inquiry";
import { sendBookingNotification } from "@/lib/email";

export async function POST(request: Request) {
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
    email?: string;
    mode?: string;
    concern?: string;
    message?: string;
  };

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
    email: data.email?.trim(),
    mode: data.mode,
    concern: data.concern,
    message: data.message ?? "",
  }).catch(() => {});

  return NextResponse.json({ ok: true }, { status: 201 });
}