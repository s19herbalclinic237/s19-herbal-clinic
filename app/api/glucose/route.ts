import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-server";
import {
  GlucoseReading,
  isGlucoseConcerning,
  type GlucoseKind,
  type IGlucoseReading,
} from "@/lib/models/GlucoseReading";
import { TreatmentPlan, type ITreatmentPlan } from "@/lib/models/TreatmentPlan";
import { getCloudinary } from "@/lib/cloudinary";

export const runtime = "nodejs";

function parseGlucoseKind(v: unknown): GlucoseKind | null {
  return v === "fasting" || v === "post-lunch" ? v : null;
}

const FORBIDDEN = /[<>&]/;

/** The patient's own glucose readings, newest first, flagged when concerning. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to view your glucose readings." }, { status: 401 });
  }

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Glucose monitoring is temporarily unavailable." }, { status: 503 });
  }

  try {
    const readings = await GlucoseReading.find({ user: user.id })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean<IGlucoseReading[]>();
    return NextResponse.json({
      readings: readings.map((r) => ({ ...r, concerning: isGlucoseConcerning(r) })),
    });
  } catch (error) {
    console.error("[glucose] list failed:", error);
    return NextResponse.json({ error: "Could not load your glucose readings." }, { status: 500 });
  }
}

/**
 * Submits a glucose reading for a plan on the signed-in patient's account.
 * Multipart form: plan, kind, reading, mealInfo (optional), forMember
 * (optional), notes (optional) and an optional `photo` of the glucose-meter
 * result which is stored on Cloudinary and referenced by URL.
 */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to submit a glucose reading." }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const planId = String(formData.get("plan") || "").trim();
  const kind = parseGlucoseKind(formData.get("kind"));
  const readingRaw = Number(formData.get("reading"));
  const mealInfo = String(formData.get("mealInfo") || "").trim().slice(0, 500);
  const forMember = String(formData.get("forMember") || "").trim().slice(0, 120);
  const notes = String(formData.get("notes") || "").trim().slice(0, 1000);
  const photo = formData.get("photo");

  if (!planId || !kind) {
    return NextResponse.json({ error: "Choose the reading type and plan." }, { status: 400 });
  }
  if (!Number.isFinite(readingRaw) || readingRaw < 10 || readingRaw > 900) {
    return NextResponse.json({ error: "Enter a valid glucose reading (mg/dL)." }, { status: 400 });
  }
  if (FORBIDDEN.test(mealInfo + forMember + notes)) {
    return NextResponse.json({ error: "Please remove special characters from the text fields." }, { status: 400 });
  }

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Glucose monitoring is temporarily unavailable." }, { status: 503 });
  }

  try {
    const plan = await TreatmentPlan.findOne({ _id: planId, user: user.id })
      .select("_id")
      .lean<ITreatmentPlan | null>();
    if (!plan) {
      return NextResponse.json({ error: "Treatment plan not found on your account." }, { status: 404 });
    }

    let photoUrl: string | undefined;
    let photoPublicId: string | undefined;
    if (photo && typeof photo !== "string" && photo.size > 0) {
      if (photo.size > 6 * 1024 * 1024) {
        return NextResponse.json({ error: "The photo is too large (max 6 MB)." }, { status: 400 });
      }
      const cloudinary = getCloudinary();
      if (!cloudinary) {
        return NextResponse.json(
          { error: "Photo upload is temporarily unavailable - submit the reading without the photo." },
          { status: 503 }
        );
      }
      const buffer = Buffer.from(await photo.arrayBuffer());
      try {
        const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "s19-medical/glucose", resource_type: "auto" },
            (error, uploadResult) => {
              if (error) return reject(error);
              if (!uploadResult) return reject(new Error("Upload returned no result."));
              resolve({ secure_url: uploadResult.secure_url, public_id: uploadResult.public_id });
            }
          );
          stream.end(buffer);
        });
        photoUrl = result.secure_url;
        photoPublicId = result.public_id;
      } catch (error) {
        console.error("[glucose] photo upload failed:", error);
        return NextResponse.json({ error: "Could not upload the photo. Try again without it." }, { status: 500 });
      }
    }

    const created = await GlucoseReading.create({
      user: user.id,
      plan: planId,
      forMember: forMember || undefined,
      kind,
      reading: Math.round(readingRaw),
      mealInfo: mealInfo || undefined,
      notes: notes || undefined,
      photoUrl,
      photoPublicId,
    });

    return NextResponse.json(
      {
        reading: {
          ...created.toObject(),
          concerning: isGlucoseConcerning(created),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[glucose] create failed:", error);
    return NextResponse.json({ error: "Could not save the glucose reading." }, { status: 500 });
  }
}