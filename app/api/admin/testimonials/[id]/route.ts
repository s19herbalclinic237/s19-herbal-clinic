import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDb } from "@/lib/db";
import { adminGuard } from "@/lib/admin-guard";
import { Testimonial } from "@/lib/models/Testimonial";
import { sendTestimonialLiveEmail } from "@/lib/email";

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

  if (body.textFr !== undefined) {
    const value = String(body.textFr).trim();
    if (value && value.length < 10) {
      return NextResponse.json(
        { error: "The French translation should be at least 10 characters, or leave it empty." },
        { status: 400 }
      );
    }
    // Store empty string so clearing an existing translation works ($set omits undefined).
    patch.textFr = value;
  }

  if (body.programFr !== undefined) {
    const value = String(body.programFr).trim();
    if (value && value.length < 2) {
      return NextResponse.json(
        { error: "The French program name should be at least 2 characters, or leave it empty." },
        { status: 400 }
      );
    }
    // Store empty string so clearing an existing translation works ($set omits undefined).
    patch.programFr = value;
  }

  if (body.email !== undefined) {
    const value = String(body.email).trim();
    if (value && (value.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))) {
      return NextResponse.json({ error: "Please provide a valid email address, or leave it empty." }, { status: 400 });
    }
    patch.email = value || undefined;
  }

  if (body.videoUrl !== undefined) {
    const value = String(body.videoUrl).trim();
    if (value && (value.length > 500 || !/^https?:\/\//i.test(value))) {
      return NextResponse.json(
        { error: "Please provide a valid video link (YouTube, Google Drive or Vimeo), or leave it empty." },
        { status: 400 }
      );
    }
    patch.videoUrl = value || undefined;
  }

  if (body.rating !== undefined) {
    const parsedRating = Number(body.rating);
    patch.rating =
      Number.isInteger(parsedRating) && parsedRating >= 1 && parsedRating <= 5 ? parsedRating : 5;
  }

  try {
    const testimonial = await Testimonial.findByIdAndUpdate(id, { $set: patch }, { new: true })
      .populate("user", "name email")
      .lean();

    // Let the author know when their story goes live.
    if (patch.status === "approved" && existing.status !== "approved") {
      const submitterEmail =
        (testimonial?.user as { email?: string } | null | undefined)?.email || testimonial?.email;
      if (submitterEmail) {
        try {
          await sendTestimonialLiveEmail(submitterEmail, testimonial?.name || "friend", testimonial?.text || "");
        } catch (error) {
          console.error("[admin/testimonials] live email failed:", error);
        }
      }
    }

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