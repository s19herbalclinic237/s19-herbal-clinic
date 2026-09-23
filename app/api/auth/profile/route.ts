import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { getSessionUser, toAuthUser } from "@/lib/auth-server";
import { User } from "@/lib/models/User";

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to update your profile." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const payload = (body ?? {}) as {
    name?: string;
    phone?: string;
    avatar?: string;
    dob?: string;
    gender?: string;
    address?: string;
    emergencyContact?: { name?: string; phone?: string; relation?: string };
    idCardUrl?: string;
  };
  const name = payload.name?.trim();
  const phone = payload.phone?.trim() || undefined;
  const avatarRaw = payload.avatar;
  const avatarProvided = avatarRaw !== undefined;
  const avatar = avatarProvided ? avatarRaw.trim() : undefined;

  if (name !== undefined && (name.length < 2 || name.length > 100)) {
    return NextResponse.json({ error: "Please provide a valid name." }, { status: 400 });
  }
  if (phone !== undefined && phone.length > 30) {
    return NextResponse.json({ error: "Please provide a valid phone number." }, { status: 400 });
  }
  if (
    avatar !== undefined &&
    avatar !== "" &&
    (avatar.length < 8 || avatar.length > 500 || !/^https?:\/\//.test(avatar))
  ) {
    return NextResponse.json({ error: "Please provide a valid avatar URL." }, { status: 400 });
  }

  // ── Extended patient profile fields ─────────────────────────────────────
  const dobRaw = payload.dob;
  const dobProvided = dobRaw !== undefined;
  const dob = dobRaw === undefined ? undefined : dobRaw.trim() || undefined;
  if (dob !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
    return NextResponse.json({ error: "Please use a valid date of birth (YYYY-MM-DD)." }, { status: 400 });
  }

  const genderRaw = payload.gender;
  const genderProvided = genderRaw !== undefined;
  const gender = genderRaw === undefined ? undefined : genderRaw?.trim() || undefined;
  if (gender !== undefined && !["male", "female", "other"].includes(gender)) {
    return NextResponse.json({ error: "Please choose a valid option for gender." }, { status: 400 });
  }

  const addressRaw = payload.address;
  const addressProvided = addressRaw !== undefined;
  const address = addressRaw === undefined ? undefined : addressRaw.trim() || undefined;
  if (address !== undefined && address.length > 250) {
    return NextResponse.json({ error: "The address is too long (max 250 characters)." }, { status: 400 });
  }

  const ecProvided = payload.emergencyContact !== undefined;
  const ecName = payload.emergencyContact?.name?.trim() || undefined;
  const ecPhone = payload.emergencyContact?.phone?.trim() || undefined;
  const ecRelation = payload.emergencyContact?.relation?.trim() || undefined;
  if (ecName !== undefined && ecName.length > 100) {
    return NextResponse.json({ error: "The emergency contact name is too long." }, { status: 400 });
  }
  if (ecPhone !== undefined && ecPhone.length > 30) {
    return NextResponse.json({ error: "The emergency contact phone is too long." }, { status: 400 });
  }
  if (ecRelation !== undefined && ecRelation.length > 50) {
    return NextResponse.json({ error: "The emergency contact relation is too long." }, { status: 400 });
  }

  const idCardRaw = payload.idCardUrl;
  const idCardProvided = idCardRaw !== undefined;
  const idCardUrl = idCardRaw === undefined ? undefined : idCardRaw.trim() || undefined;
  if (idCardUrl !== undefined && idCardUrl !== "" && !/^https?:\/\//.test(idCardUrl)) {
    return NextResponse.json({ error: "Please provide a valid document URL." }, { status: 400 });
  }

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Profile updates are temporarily unavailable." }, { status: 503 });
  }

  try {
    const updated = await User.findByIdAndUpdate(
      user.id,
      {
        $set: {
          ...(name !== undefined ? { name } : {}),
          ...(phone !== undefined ? { phone } : {}),
          ...(avatarProvided && avatar !== "" ? { avatar } : {}),
          ...(dobProvided && dob ? { dob } : {}),
          ...(genderProvided && gender ? { gender } : {}),
          ...(addressProvided && address ? { address } : {}),
          ...(ecProvided ? { emergencyContact: { name: ecName, phone: ecPhone, relation: ecRelation } } : {}),
          ...(idCardProvided && idCardUrl ? { idCardUrl } : {}),
        },
        ...(avatarProvided && avatar === "" ? { $unset: { avatar: 1 } } : {}),
        ...(dobProvided && !dob ? { $unset: { dob: 1 } } : {}),
        ...(genderProvided && !gender ? { $unset: { gender: 1 } } : {}),
        ...(addressProvided && !address ? { $unset: { address: 1 } } : {}),
        ...(ecProvided && !ecName && !ecPhone && !ecRelation
          ? { $unset: { emergencyContact: 1 } }
          : {}),
        ...(idCardProvided && !idCardUrl ? { $unset: { idCardUrl: 1 } } : {}),
      },
      { new: true }
    ).lean();
    if (!updated) {
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "Profile updated.", user: toAuthUser(updated) });
  } catch (error) {
    console.error("[profile] update failed:", error);
    return NextResponse.json({ error: "Could not update your profile." }, { status: 500 });
  }
}