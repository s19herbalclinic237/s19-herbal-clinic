import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { adminGuard } from "@/lib/admin-guard";
import { Subscriber } from "@/lib/models/Subscriber";
import { User } from "@/lib/models/User";
import { Message } from "@/lib/models/Message";

export async function POST(request: Request) {
  const denied = await adminGuard();
  if (denied) return denied;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) ?? {};
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const subject = String(body.subject || "").trim();
  const text = String(body.text || "").trim();

  if (subject.length < 2 || subject.length > 120) {
    return NextResponse.json({ error: "Please provide a subject." }, { status: 400 });
  }
  if (text.length < 2 || text.length > 5000) {
    return NextResponse.json({ error: "Please provide the message text." }, { status: 400 });
  }

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Could not send the update." }, { status: 503 });
  }

  try {
    const subscribers = await Subscriber.find({ status: "subscribed" }).select("email").lean();
    const emails = subscribers.map((s) => s.email);

    const accounts = await User.find({ email: { $in: emails }, isActive: true }).select("_id email").lean();
    if (accounts.length > 0) {
      await Message.insertMany(
        accounts.map((a) => ({
          user: a._id,
          author: "admin" as const,
          subject,
          body: text,
          read: false,
        }))
      );
    }

    const delivered = accounts.length;
    const emailOnly = emails.length - delivered;

    return NextResponse.json({ success: true, delivered, emailOnly });
  } catch (error) {
    console.error("[admin/fanout] failed:", error);
    return NextResponse.json({ error: "Could not send the update." }, { status: 500 });
  }
}