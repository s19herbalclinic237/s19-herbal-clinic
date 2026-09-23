import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-server";
import { User, type PersonGender } from "@/lib/models/User";

type Params = { params: Promise<{ id: string }> };

const RELATIONS = ["child", "spouse", "parent", "sibling", "other"] as const;
const GENDERS = ["male", "female", "other"] as const;

export async function PATCH(request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to manage your family." }, { status: 401 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const payload = (body ?? {}) as Record<string, unknown>;
  const set: Record<string, unknown> = {};

  if (payload.name !== undefined) {
    const name = String(payload.name).trim();
    if (name.length < 2 || name.length > 80) {
      return NextResponse.json({ error: "Please provide the family member's name." }, { status: 400 });
    }
    set["familyMembers.$.name"] = name;
  }
  if (payload.dob !== undefined) {
    const dob = String(payload.dob).trim() || undefined;
    if (dob !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
      return NextResponse.json({ error: "Please use a valid date (YYYY-MM-DD)." }, { status: 400 });
    }
    set["familyMembers.$.dob"] = dob;
  }
  if (payload.gender !== undefined) {
    set["familyMembers.$.gender"] = GENDERS.includes(payload.gender as PersonGender)
      ? (payload.gender as PersonGender)
      : undefined;
  }
  if (payload.relation !== undefined) {
    set["familyMembers.$.relation"] = RELATIONS.includes(payload.relation as (typeof RELATIONS)[number])
      ? (payload.relation as (typeof RELATIONS)[number])
      : "other";
  }
  if (payload.notes !== undefined) {
    const notes = String(payload.notes).trim() || undefined;
    if (notes && notes.length > 300) {
      return NextResponse.json({ error: "Notes are too long (max 300 characters)." }, { status: 400 });
    }
    set["familyMembers.$.notes"] = notes;
  }

  if (Object.keys(set).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Family is temporarily unavailable." }, { status: 503 });
  }

  try {
    const updated = await User.findOneAndUpdate(
      { _id: user.id, "familyMembers._id": id },
      { $set: set },
      { new: true }
    )
      .select("familyMembers")
      .lean();
    if (!updated) return NextResponse.json({ error: "Family member not found." }, { status: 404 });

    const members = (updated.familyMembers || []).map((m) => ({ ...m, _id: String(m._id) }));
    return NextResponse.json({ success: true, members });
  } catch (error) {
    console.error("[family-members] update failed:", error);
    return NextResponse.json({ error: "Could not update the family member." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to manage your family." }, { status: 401 });
  }

  const { id } = await params;
  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Family is temporarily unavailable." }, { status: 503 });
  }

  try {
    const updated = await User.findByIdAndUpdate(
      user.id,
      { $pull: { familyMembers: { _id: id } } },
      { new: true }
    )
      .select("familyMembers")
      .lean();
    if (!updated) return NextResponse.json({ error: "Account not found." }, { status: 404 });

    const members = (updated.familyMembers || []).map((m) => ({ ...m, _id: String(m._id) }));
    return NextResponse.json({ success: true, members });
  } catch (error) {
    console.error("[family-members] delete failed:", error);
    return NextResponse.json({ error: "Could not remove the family member." }, { status: 500 });
  }
}