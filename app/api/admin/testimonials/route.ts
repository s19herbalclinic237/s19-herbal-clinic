import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { adminGuard } from "@/lib/admin-guard";
import { Testimonial, type TestimonialStatus } from "@/lib/models/Testimonial";

const STATUSES = ["pending", "approved", "rejected"] as const;

export async function GET(request: Request) {
  const denied = await adminGuard();
  if (denied) return denied;

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Testimonials are temporarily unavailable." }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  try {
    const filter: Record<string, unknown> = {};
    if (status && (STATUSES as readonly string[]).includes(status)) {
      filter.status = status;
    }
    const testimonials = await Testimonial.find(filter)
      .sort({ createdAt: -1 })
      .limit(500)
      .populate("user", "name email")
      .lean();
    return NextResponse.json({ testimonials });
  } catch (error) {
    console.error("[admin/testimonials] list failed:", error);
    return NextResponse.json({ error: "Could not load testimonials." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await adminGuard();
  if (denied) return denied;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) ?? {};
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = String(body.name || "").trim();
  const city = String(body.city || "").trim();
  const country = String(body.country || "").trim();
  const program = String(body.program || "").trim();
  const text = String(body.text || "").trim();

  if (name.length < 2) {
    return NextResponse.json({ error: "Please provide the customer name." }, { status: 400 });
  }
  if (city.length < 2) {
    return NextResponse.json({ error: "Please provide the city." }, { status: 400 });
  }
  if (program.length < 2) {
    return NextResponse.json({ error: "Please provide the program or concern." }, { status: 400 });
  }
  if (text.length < 20) {
    return NextResponse.json({ error: "Please provide the full testimonial text." }, { status: 400 });
  }

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Could not save the testimonial." }, { status: 503 });
  }

  try {
    const status: TestimonialStatus = (STATUSES as readonly string[]).includes(String(body.status))
      ? (String(body.status) as TestimonialStatus)
      : "pending";
    const testimonial = await Testimonial.create({
      name,
      city,
      country: country || undefined,
      program,
      text,
      status,
    });
    return NextResponse.json({ success: true, testimonial }, { status: 201 });
  } catch (error) {
    console.error("[admin/testimonials] create failed:", error);
    return NextResponse.json({ error: "Could not save the testimonial." }, { status: 500 });
  }
}