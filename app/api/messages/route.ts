import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-server";
import { Message } from "@/lib/models/Message";
import { sendPatientReplyAdminEmail } from "@/lib/email";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to view your messages." }, { status: 401 });
  }

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Messages are temporarily unavailable." }, { status: 503 });
  }

  try {
    const [messages, unreadCount] = await Promise.all([
      Message.find({ user: user.id }).sort({ createdAt: -1 }).limit(200).lean(),
      Message.countDocuments({ user: user.id, author: "admin", read: false }),
    ]);
    return NextResponse.json({ messages, unreadCount });
  } catch (error) {
    console.error("[messages] list failed:", error);
    return NextResponse.json({ error: "Could not load your messages." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to send messages." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const payload = (body ?? {}) as {
    threadId?: string;
    subject?: string;
    text?: string;
  };
  const threadId = String(payload.threadId || "").trim();
  const subject = String(payload.subject || "").trim();
  const text = String(payload.text || "").trim();

  if (text.length < 2 || text.length > 5000) {
    return NextResponse.json({ error: "Please write a message between 2 and 5000 characters." }, { status: 400 });
  }

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Messages are temporarily unavailable." }, { status: 503 });
  }

  try {
    // Replying to an existing thread: reuse its subject and link the reply.
    if (threadId) {
      if (!isValidObjectId(threadId)) {
        return NextResponse.json({ error: "Invalid conversation." }, { status: 400 });
      }
      const root = await Message.findOne({ _id: threadId, user: user.id }).lean();
      if (!root) {
        return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
      }
      const message = await Message.create({
        user: user.id,
        author: "user",
        subject: root.subject,
        body: text,
        thread: root._id,
        read: false,
      });
      if (user.email) {
        try {
          await sendPatientReplyAdminEmail({
            patientName: user.name || "Patient",
            email: user.email,
            subject: root.subject,
            body: text,
          });
        } catch (error) {
          console.error("[messages] admin email failed:", error);
        }
      }
      return NextResponse.json({ success: true, message }, { status: 201 });
    }

    // Starting a brand-new conversation with the clinic.
    if (subject.length < 2 || subject.length > 120) {
      return NextResponse.json({ error: "Please provide a subject (2-120 characters)." }, { status: 400 });
    }
    const message = await Message.create({
      user: user.id,
      author: "user",
      subject,
      body: text,
      read: false,
    });
    if (user.email) {
      try {
        await sendPatientReplyAdminEmail({
          patientName: user.name || "Patient",
          email: user.email,
          subject,
          body: text,
        });
      } catch (error) {
        console.error("[messages] admin email failed:", error);
      }
    }
    return NextResponse.json({ success: true, message }, { status: 201 });
  } catch (error) {
    console.error("[messages] send failed:", error);
    return NextResponse.json({ error: "Could not send your message." }, { status: 500 });
  }
}