import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDb } from "@/lib/db";
import { adminGuard } from "@/lib/admin-guard";
import { Message } from "@/lib/models/Message";
import { User } from "@/lib/models/User";

export async function POST(request: Request) {
  const denied = await adminGuard();
  if (denied) return denied;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) ?? {};
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const userId = String(body.userId || "");
  const subject = String(body.subject || "").trim();
  const text = String(body.text || "").trim();

  if (!isValidObjectId(userId)) {
    return NextResponse.json({ error: "Please choose a user." }, { status: 400 });
  }
  if (subject.length < 2 || subject.length > 120) {
    return NextResponse.json({ error: "Please provide a subject." }, { status: 400 });
  }
  if (text.length < 2 || text.length > 5000) {
    return NextResponse.json({ error: "Please provide the message text." }, { status: 400 });
  }

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Could not send the message." }, { status: 503 });
  }

  try {
    const target = await User.findById(userId).lean();
    if (!target) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
    const message = await Message.create({
      user: userId,
      author: "admin",
      subject,
      body: text,
      read: false,
    });
    return NextResponse.json({ success: true, message }, { status: 201 });
  } catch (error) {
    console.error("[admin/messages] create failed:", error);
    return NextResponse.json({ error: "Could not send the message." }, { status: 500 });
  }
}