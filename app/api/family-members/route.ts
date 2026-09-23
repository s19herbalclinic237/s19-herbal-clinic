import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-server";
import { User, type FamilyMember, type PersonGender } from "@/lib/models/User";

const RELATIONS = ["child", "spouse", "parent", "sibling", "other"] as const;
const GENDERS = ["male", "female", "other"] as const;

function cleanMember(body: Record<string, unknown>) {
  const name = String(body.name || "").trim();
  const dob = String(body.dob || "").trim() || undefined;
  const gender = GENDERS.includes(body.gender as PersonGender)
    ? (body.gender as PersonGender)
    : undefined;
  const relation = RELATIONS.includes(body.relation as (typeof RELATIONS)[number])
    ? (body.relation as (typeof RELATIONS)[number])
    : "other";
  const notes = String(body.notes || "").trim() || undefined;
  return { name, dob, gender, relation, notes };
}

function serializeMembers(doc: { familyMembers?: FamilyMember[] }): FamilyMember[] {
  const raw = doc.familyMembers || [];
  return raw.map((m) => ({
    ...m,
    _id: String(m._id),
  }));
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to view your family." }, { status: 401 });
  }

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Family is temporarily unavailable." }, { status: 503 });
  }

  try {
    const doc = await User.findById(user.id).select("familyMembers").lean();
    return NextResponse.json({ members: serializeMembers(doc ?? { familyMembers: [] }) });
  } catch (error) {
    console.error("[family-members] list failed:", error);
    return NextResponse.json({ error: "Could not load your family members." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to manage your family." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const clean = cleanMember((body ?? {}) as Record<string, unknown>);
  if (clean.name.length < 2 || clean.name.length > 80) {
    return NextResponse.json({ error: "Please provide the family member's name." }, { status: 400 });
  }
  if (clean.dob !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(clean.dob)) {
    return NextResponse.json({ error: "Please use a valid date (YYYY-MM-DD)." }, { status: 400 });
  }
  if (clean.notes && clean.notes.length > 300) {
    return NextResponse.json({ error: "Notes are too long (max 300 characters)." }, { status: 400 });
  }

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Family is temporarily unavailable." }, { status: 503 });
  }

  try {
    const doc = await User.findById(user.id).select("familyMembers").lean();
    const members = (doc?.familyMembers || []) as FamilyMember[];
    if (members.length >= 10) {
      return NextResponse.json({ error: "You can manage up to 10 family members." }, { status: 400 });
    }

    const updated = await User.findByIdAndUpdate(
      user.id,
      { $push: { familyMembers: clean } },
      { new: true }
    )
      .select("familyMembers")
      .lean();
    if (!updated) return NextResponse.json({ error: "Account not found." }, { status: 404 });

    const all = serializeMembers(updated);
    return NextResponse.json({ success: true, member: all[all.length - 1], members: all }, { status: 201 });
  } catch (error) {
    console.error("[family-members] create failed:", error);
    return NextResponse.json({ error: "Could not add the family member." }, { status: 500 });
  }
}