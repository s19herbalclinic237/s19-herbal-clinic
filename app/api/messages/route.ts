import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-server";
import { Message } from "@/lib/models/Message";

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
      Message.find({ user: user.id }).sort({ createdAt: -1 }).limit(100).lean(),
      Message.countDocuments({ user: user.id, read: false }),
    ]);
    return NextResponse.json({ messages, unreadCount });
  } catch (error) {
    console.error("[messages] list failed:", error);
    return NextResponse.json({ error: "Could not load your messages." }, { status: 500 });
  }
}