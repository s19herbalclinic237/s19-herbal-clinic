import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDb } from "@/lib/db";
import { adminGuard } from "@/lib/admin-guard";
import { Testimonial } from "@/lib/models/Testimonial";

const STATUSES = ["pending", "approved", "rejected"] as const;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await adminGuard();
  if (denied) return denied;

  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid testimonial id." }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) ?? {};
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Could not update the testimonial." }, { status: 503 });
  }

  const existing = await Testimonial.findById(id).lean();
  if (!existing) {
    return NextResponse.json({ error: "Testimonial not found." }, { status: 404 });
  }

  const patch: Record<string, unknown> = {};

  if (body.status !== undefined) {
    const value = String(body.status);
    if (!(STATUSES as readonly string[]).includes(value)) {
      return NextResponse.json({ error: "Invalid testimonial status." }, { status: 400 });
    }
    patch.status = value;
  }

  for (const key of ["name", "city", "program"] as const) {
    if (body[key] !== undefined) {
      const value = String(body[key]).trim();
      if (value.length < 2) {
        return NextResponse.json({ error: "Please complete the testimonial." }, { status: 400 });
      }
      patch[key] = value;
    }
  }

  if (body.country !== undefined) {
    patch.country = String(body.country).trim() || undefined;
  }

  if (body.text !== undefined) {
    const value = String(body.text).trim();
    if (value.length < 20) {
      return NextResponse.json({ error: "Please provide the full testimonial text." }, { status: 400 });
    }
    patch.text = value;
  }

  try {
    const testimonial = await Testimonial.findByIdAndUpdate(id, { $set: patch }, { new: true })
      .populate("user", "name email")
      .lean();
    return NextResponse.json({ success: true, testimonial });
  } catch (error) {
    console.error("[admin/testimonials] update failed:", error);
    return NextResponse.json({ error: "Could not update the testimonial." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await adminGuard();
  if (denied) return denied;

  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid testimonial id." }, { status: 400 });
  }

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Could not delete the testimonial." }, { status: 503 });
  }

  try {
    const deleted = await Testimonial.findByIdAndDelete(id).lean();
    if (!deleted) {
      return NextResponse.json({ error: "Testimonial not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[admin/testimonials] delete failed:", error);
    return NextResponse.json({ error: "Could not delete the testimonial." }, { status: 500 });
  }
}