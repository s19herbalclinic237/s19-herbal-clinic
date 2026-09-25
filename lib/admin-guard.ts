import "server-only";
import { NextResponse } from "next/server";
import { isAdmin, isStaff } from "@/lib/auth-server";

export async function adminGuard(): Promise<NextResponse | null> {
  const ok = await isAdmin();
  if (!ok) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }
  return null;
}

/**
 * Guard for clinical-staff routes (appointments, records, prescriptions,
 * treatment plans/reminders/follow-ups, alerts, glucose, patient messaging).
 * Administrators and registered doctors may pass. Doctors do not gain access
 * to store, content, subscriber, doctor-directory, or user-administration
 * routes, which stay `adminGuard`-only.
 */
export async function clinicalGuard(): Promise<NextResponse | null> {
  const ok = await isStaff();
  if (!ok) {
    return NextResponse.json({ error: "Clinician access required." }, { status: 403 });
  }
  return null;
}