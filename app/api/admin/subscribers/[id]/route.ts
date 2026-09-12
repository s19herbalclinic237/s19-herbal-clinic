import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDb } from "@/lib/db";
import { adminGuard } from "@/lib/admin-guard";
import { Subscriber } from "@/lib/models/Subscriber";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await adminGuard();
  if (denied) return denied;

  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid subscriber id." }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) ?? {};
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Could not update the subscriber." }, { status: 503 });
  }

  const existing = await Subscriber.findById(id).lean();
  if (!existing) {
    return NextResponse.json({ error: "Subscriber not found." }, { status: 404 });
  }

  const patch: Record<string, unknown> = {};
  if (body.status !== undefined) {
    const value = String(body.status);
    if (value !== "subscribed" && value !== "unsubscribed") {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }
    patch.status = value;
  }
  if (body.name !== undefined) {
    patch.name = String(body.name).trim() || undefined;
  }

  try {
    const subscriber = await Subscriber.findByIdAndUpdate(id, { $set: patch }, { new: true }).lean();
    return NextResponse.json({ success: true, subscriber });
  } catch (error) {
    console.error("[admin/subscribers] update failed:", error);
    return NextResponse.json({ error: "Could not update the subscriber." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await adminGuard();
  if (denied) return denied;

  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid subscriber id." }, { status: 400 });
  }

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Could not delete the subscriber." }, { status: 503 });
  }

  try {
    const deleted = await Subscriber.findByIdAndDelete(id).lean();
    if (!deleted) {
      return NextResponse.json({ error: "Subscriber not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[admin/subscribers] delete failed:", error);
    return NextResponse.json({ error: "Could not delete the subscriber." }, { status: 500 });
  }
}