import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDb } from "@/lib/db";
import { clinicalGuard } from "@/lib/admin-guard";
import { Message } from "@/lib/models/Message";
import { User } from "@/lib/models/User";
import { sendClinicMessageEmail } from "@/lib/email";

export async function GET(request: Request) {
  const denied = await clinicalGuard();
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") || "";

  if (!isValidObjectId(userId)) {
    return NextResponse.json({ error: "Please choose a user." }, { status: 400 });
  }

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Could not load the conversation." }, { status: 503 });
  }

  try {
    // Opening the conversation marks any of the patient's replies as seen by admin.
    await Message.updateMany(
      { user: userId, author: "user", read: false },
      { $set: { read: true } }
    ).exec();
    const messages = await Message.find({ user: userId }).sort({ createdAt: 1 }).limit(500).lean();
    return NextResponse.json({ messages });
  } catch (error) {
    console.error("[admin/messages] list failed:", error);
    return NextResponse.json({ error: "Could not load the conversation." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await clinicalGuard();
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
  const thread = String(body.thread || "").trim();

  if (!isValidObjectId(userId)) {
    return NextResponse.json({ error: "Please choose a user." }, { status: 400 });
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

    // Replying inside an existing thread: reuse that thread's subject.
    let finalSubject = subject;
    let threadRef: string | undefined;
    if (thread) {
      if (!isValidObjectId(thread)) {
        return NextResponse.json({ error: "Invalid conversation." }, { status: 400 });
      }
      const root = await Message.findOne({ _id: thread, user: userId }).lean();
      if (!root) {
        return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
      }
      finalSubject = root.subject;
      threadRef = String(root._id);
    }
    if (finalSubject.length < 2 || finalSubject.length > 120) {
      return NextResponse.json({ error: "Please provide a subject." }, { status: 400 });
    }

    const message = await Message.create({
      user: userId,
      author: "admin",
      subject: finalSubject,
      body: text,
      thread: threadRef,
      read: false,
    });

    // Email the patient so they see the clinic message even when away from the app.
    if (target.email) {
      try {
        await sendClinicMessageEmail({
          to: target.email,
          name: target.name,
          subject: finalSubject,
          body: text,
        });
      } catch (error) {
        console.error("[admin/messages] patient email failed:", error);
      }
    }

    return NextResponse.json({ success: true, message }, { status: 201 });
  } catch (error) {
    console.error("[admin/messages] create failed:", error);
    return NextResponse.json({ error: "Could not send the message." }, { status: 500 });
  }
}