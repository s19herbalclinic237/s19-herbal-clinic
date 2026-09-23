/**
 * Admin API smoke tests for the S19 health features.
 * Run: npx tsx scripts/smoke-health-admin.ts
 * Requires a dev server on :3000 and MONGO_URL (from .env.local).
 */
import dotenv from "dotenv";
import path from "path";
import mongoose from "mongoose";
import { User } from "../lib/models/User";
import { hashPassword } from "../lib/auth";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const BASE = process.env.SMOKE_BASE || "http://localhost:3000";
const ADMIN_EMAIL = "smoke.admin@s19clinic.com";
const ADMIN_PASSWORD = "SmokeAdmin2026!";

let pass = 0;
let fail = 0;
const cookies = new Map<string, string>();

function storeCookies(res: Response) {
  const set = res.headers.getSetCookie?.() || [];
  for (const line of set) {
    const [pair] = line.split(";");
    const eq = pair.indexOf("=");
    if (eq > 0) cookies.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
  }
}

function cookieHeader(): string {
  const parts: string[] = [];
  for (const [k, v] of cookies) parts.push(`${k}=${v}`);
  return parts.join("; ");
}

interface Expected {
  statuses: number[];
  checks?: Record<string, (d: any) => boolean>;
}

async function req(
  pathname: string,
  opts?: { method?: string; body?: unknown; expected?: Expected; label?: string; cookie?: boolean }
) {
  const { method = "GET", body, expected = { statuses: [200] }, label = pathname, cookie = true } = opts ?? {};
  const headers: Record<string, string> = { Accept: "application/json" };
  if (cookie) {
    const jar = cookieHeader();
    if (jar) headers.Cookie = jar;
  }
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const res = await fetch(`${BASE}${pathname}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });
  storeCookies(res);
  const text = await res.text();
  let data: any = null;
  try {
    data = JSON.parse(text);
  } catch {
    /* not JSON */
  }
  const ok = expected.statuses.includes(res.status);
  if (ok) {
    pass++;
    console.log(`  ✔ ${label}  (HTTP ${res.status})`);
  } else {
    fail++;
    console.log(`  ✘ ${label}  got ${res.status}, wanted ${expected.statuses.join("/")}`);
    console.log(`    body: ${text.slice(0, 300)}`);
  }
  for (const [name, fn] of Object.entries(expected.checks || {})) {
    try {
      if (fn(data)) {
        pass++;
        console.log(`    ✔ check: ${name}`);
      } else {
        fail++;
        console.log(`    ✘ check: ${name}`);
      }
    } catch (err) {
      fail++;
      console.log(`    ✘ check: ${name} threw ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  return { status: res.status, data };
}

async function main() {
  const uri = process.env.MONGO_URL || process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGO_URL is not set.");
    process.exit(1);
  }

  /* Bootstrap temp admin */
  await mongoose.connect(uri);
  await User.deleteOne({ email: ADMIN_EMAIL });
  await User.create({
    name: "Smoke Admin",
    email: ADMIN_EMAIL,
    passwordHash: hashPassword(ADMIN_PASSWORD),
    role: "admin",
    emailVerified: true,
    isActive: true,
  });
  console.log(`Temp admin created: ${ADMIN_EMAIL}`);
  await mongoose.disconnect();

  const createdByIds: Array<["doctor" | "record" | "prescription", string]> = [];

  try {
    console.log("── Admin auth ────────────────────────────────────────────");
    await req("/api/admin/doctors", {
      cookie: false,
      expected: { statuses: [403] },
      label: "Block anonymous admin access",
    });
    const login = await req("/api/auth/login", {
      method: "POST",
      body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
      expected: { statuses: [200] },
      label: "Login temp admin",
    });
    if (login.status !== 200) throw new Error("Admin login failed");

    console.log("── Admin catalog ─────────────────────────────────────────");
    const usersRes = await req("/api/admin/users", {
      expected: {
        statuses: [200],
        checks: {
          "demo patient present": (d) =>
            Array.isArray(d.users) && d.users.some((u: any) => u.email === "demo.patient@s19clinic.com"),
        },
      },
      label: "List users (patients)",
    });
    const demo = usersRes.data?.users?.find((u: any) => u.email === "demo.patient@s19clinic.com") as
      | { id: string }
      | undefined;

    await req("/api/admin/doctors", {
      expected: {
        statuses: [200],
        checks: { "doctors present": (d) => Array.isArray(d.doctors) && d.doctors.length >= 3 },
      },
      label: "List admin doctors",
    });

    const newDoctor = await req("/api/admin/doctors", {
      method: "POST",
      body: {
        name: "Dr. Smoke Test",
        specialty: "Smoke Testing",
        specialtyFr: "Tests de fumée",
        bio: "Temporary doctor created by the smoke suite.",
        schedule: [{ day: 2, start: "09:00", end: "11:00", slotMinutes: 30 }],
        active: true,
      },
      expected: { statuses: [201], checks: { "doctor returned": (d) => !!d.doctor?._id } },
      label: "Create a doctor",
    });
    const smokeDoctorId = newDoctor.data?.doctor?._id as string | undefined;
    if (smokeDoctorId) createdByIds.push(["doctor", smokeDoctorId]);

    console.log("── Admin messaging ───────────────────────────────────────");
    await req("/api/admin/users", {
      expected: {
        statuses: [200],
        checks: {
          "demo has family members": (d) => {
            const u = (d.users || []).find((x: any) => x.email === "demo.patient@s19clinic.com");
            return (
              Array.isArray(u?.familyMembers) &&
              u.familyMembers.length > 0 &&
              u.familyMembers.some((m: any) => m.name === "Clarisse Kamdem")
            );
          },
        },
      },
      label: "Users list includes family members",
    });
    const conv = await req(`/api/admin/messages?userId=${demo?.id}`, {
      expected: {
        statuses: [200],
        checks: {
          "conversation has messages": (d) => Array.isArray(d.messages) && d.messages.length > 0,
          "has patient reply": (d) => d.messages.some((m: any) => m.author === "user"),
        },
      },
      label: "Admin reads conversation (marks replies seen)",
    });
    const rootThread = conv.data?.messages?.find((m: any) => m.author === "admin" && !m.thread);
    if (rootThread) {
      await req("/api/admin/messages", {
        method: "POST",
        body: { userId: demo?.id, text: "Thanks for confirming - see you then.", thread: rootThread._id },
        expected: {
          statuses: [201],
          checks: {
            "reply stays in thread": (d) =>
              d.message?.author === "admin" && d.message?.thread === rootThread._id,
          },
        },
        label: "Admin replies inside thread",
      });
    } else {
      console.log("  ⚠ no admin thread found; skipping admin thread reply test");
    }

    console.log("── Admin appointments ────────────────────────────────────");
    const appts = await req("/api/admin/appointments", {
      expected: {
        statuses: [200],
        checks: { "has appointments": (d) => Array.isArray(d.appointments) && d.appointments.length > 0 },
      },
      label: "List all appointments",
    });
    const video = appts.data?.appointments?.find(
      (a: any) => a.mode === "video" && a.user?.email === "demo.patient@s19clinic.com"
    ) as { _id: string; status: string; time: string } | undefined;
    if (video) {
      if (video.status !== "pending") {
        await req(`/api/admin/appointments/${video._id}`, {
          method: "PATCH",
          body: { status: "pending", meetingUrl: "" },
          expected: { statuses: [200], checks: { "reset to pending": (d) => d.appointment?.status === "pending" } },
          label: "Reset demo video appointment to pending",
        });
      }
      await req(`/api/admin/appointments/${video._id}`, {
        method: "PATCH",
        body: { status: "confirmed", meetingUrl: "https://meet.google.com/smoke-confirm" },
        expected: {
          statuses: [200],
          checks: {
            "confirmed + meeting saved": (d) =>
              d.appointment?.status === "confirmed" &&
              String(d.appointment?.meetingUrl || "").includes("meet.google.com/smoke-confirm"),
          },
        },
        label: "Confirm video appointment with meeting link",
      });
      await req(`/api/admin/appointments/${video._id}`, {
        method: "PATCH",
        body: { status: "completed" },
        expected: { statuses: [200], checks: { "marked completed": (d) => d.appointment?.status === "completed" } },
        label: "Complete appointment",
      });
    } else {
      console.log("  ⚠ no demo video appointments found; skip confirm flow");
    }

    console.log("── Admin medical records ─────────────────────────────────");
    const record = await req("/api/admin/medical-records", {
      method: "POST",
      body: {
        user: demo?.id,
        type: "note",
        title: "Smoke test note",
        date: `${new Date().toISOString().slice(0, 10)}T12:00:00`,
        doctorName: "Dr. Smoke Test",
        diagnosis: "No findings.",
        notes: "Row created by the admin smoke suite.",
        attachments: [],
      },
      expected: {
        statuses: [201],
        checks: {
          "record returned": (d) => !!d.record?._id,
          "patient notified": (d) => d.notified === true,
        },
      },
      label: "Create medical record for demo patient",
    });
    const recordId = record.data?.record?._id as string | undefined;
    if (recordId) createdByIds.push(["record", recordId]);

    console.log("── Admin prescriptions ───────────────────────────────────");
    const script = await req("/api/admin/prescriptions", {
      method: "POST",
      body: {
        user: demo?.id,
        doctorName: "Dr. Smoke Test",
        issuedDate: `${new Date().toISOString().slice(0, 10)}T12:00:00`,
        status: "active",
        medications: [
          { name: "SmokeTonic", dosage: "5 ml", frequency: "1x daily", duration: "7 days", instructions: "Test only." },
        ],
      },
      expected: {
        statuses: [201],
        checks: {
          "prescription returned": (d) => !!d.prescription?._id,
          "patient notified": (d) => d.notified === true,
        },
      },
      label: "Issue prescription for demo patient",
    });
    const scriptId = script.data?.prescription?._id as string | undefined;
    if (scriptId) createdByIds.push(["prescription", scriptId]);

    console.log("── Patient notifications ──────────────────────────────────");
    await req(`/api/admin/messages?userId=${demo?.id}`, {
      expected: {
        statuses: [200],
        checks: {
          "record notification in inbox": (d) =>
            (d.messages || []).some((m: any) => String(m.subject || "").startsWith("New medical record - Smoke test note")),
          "prescription notification in inbox": (d) =>
            (d.messages || []).some((m: any) => String(m.subject || "").startsWith("New prescription - SmokeTonic")),
        },
      },
      label: "Patient inbox received record + prescription notifications",
    });

    console.log("── Cleanup of created rows ───────────────────────────────");
    for (const [kind, id] of createdByIds) {
      const base =
        kind === "doctor" ? "doctors" : kind === "record" ? "medical-records" : "prescriptions";
      await req(`/api/admin/${base}/${id}`, {
        method: "DELETE",
        expected: { statuses: [200] },
        label: `Delete ${kind} ${id.slice(0, 8)}`,
      });
    }
  } finally {
    await mongoose.connect(uri);
    await User.deleteOne({ email: ADMIN_EMAIL });
    await mongoose.disconnect();
    console.log("Temp admin removed.");
  }

  console.log(`\nResults: ${pass} passed, ${fail} failed`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});