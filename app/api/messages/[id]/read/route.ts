import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-server";
import { Message } from "@/lib/models/Message";

interface Props {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, { params }: Props) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to update messages." }, { status: 401 });
  }

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Messages are temporarily unavailable." }, { status: 503 });
  }

  const { id } = await params;
  try {
    const res = await Message.updateOne(
      { _id: id, user: user.id, read: false },
      { $set: { read: true } }
    ).exec();
    if (res.matchedCount === 0) {
      return NextResponse.json({ error: "Message not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[messages] mark-read failed:", error);
    return NextResponse.json({ error: "Could not update the message." }, { status: 500 });
  }
}