import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-server";
import { Testimonial } from "@/lib/models/Testimonial";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to view your testimonials." }, { status: 401 });
  }

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Testimonials are temporarily unavailable." }, { status: 503 });
  }

  try {
    const testimonials = await Testimonial.find({ user: user.id })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    return NextResponse.json({ testimonials });
  } catch (error) {
    console.error("[testimonials] list failed:", error);
    return NextResponse.json({ error: "Could not load your testimonials." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { name, city, country, program, text, rating, email } = (body ?? {}) as {
    name?: string;
    city?: string;
    country?: string;
    program?: string;
    text?: string;
    rating?: number | string;
    email?: string;
  };

  const cleanName = (name || "").trim();
  const cleanCity = (city || "").trim();
  const cleanProgram = (program || "").trim();
  const cleanText = (text || "").trim();
  const cleanCountry = (country || "").trim();
  const cleanEmail = (email || "").trim();

  if (cleanName.length < 2 || cleanName.length > 80) {
    return NextResponse.json({ error: "Please provide your name." }, { status: 400 });
  }
  if (cleanCity.length < 2 || cleanCity.length > 60) {
    return NextResponse.json({ error: "Please provide your city." }, { status: 400 });
  }
  if (cleanProgram.length < 2 || cleanProgram.length > 100) {
    return NextResponse.json({ error: "Please mention which program or product helped you." }, { status: 400 });
  }
  if (cleanText.length < 20 || cleanText.length > 2000) {
    return NextResponse.json(
      { error: "Your testimony should be between 20 and 2000 characters." },
      { status: 400 }
    );
  }
  if (cleanEmail && (cleanEmail.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail))) {
    return NextResponse.json({ error: "Please provide a valid email address, or leave it empty." }, { status: 400 });
  }

  const parsedRating = Number(rating);
  const cleanRating =
    Number.isInteger(parsedRating) && parsedRating >= 1 && parsedRating <= 5 ? parsedRating : 5;

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Testimonials are temporarily unavailable." }, { status: 503 });
  }

  const user = await getSessionUser();

  try {
    const testimonial = await Testimonial.create({
      user: user?.id,
      name: cleanName,
      city: cleanCity,
      country: cleanCountry || undefined,
      program: cleanProgram,
      text: cleanText,
      rating: cleanRating,
      email: cleanEmail || undefined,
      status: "pending",
    });
    return NextResponse.json(
      { success: true, testimonial, message: "Thank you! Your story is pending review and will appear on the site once approved." },
      { status: 201 }
    );
  } catch (error) {
    console.error("[testimonials] create failed:", error);
    return NextResponse.json({ error: "Could not save your testimony. Please try again." }, { status: 500 });
  }
}