/* Smoke tests for the S19 patient-health APIs (run against the dev server).
   Usage: node scripts/smoke-health-api.mjs
   Expects a dev server on http://localhost:3000 and the seeded demo patient. */
const BASE = process.env.SMOKE_BASE || "http://localhost:3000";

let pass = 0;
let fail = 0;
const cookies = new Map();

function getCookieHeader() {
  const parts = [];
  for (const [k, v] of cookies) parts.push(`${k}=${v}`);
  return parts.join("; ");
}

function storeCookies(res) {
  const set = res.headers.getSetCookie?.() || [];
  for (const line of set) {
    const [pair] = line.split(";");
    const eq = pair.indexOf("=");
    if (eq > 0) cookies.set(pair.slice(0, eq), pair.slice(eq + 1));
  }
}

async function req(path, { method = "GET", body, expected, label, cookie = true } = {}) {
  const headers = { Accept: "application/json" };
  if (cookie) headers.Cookie = getCookieHeader();
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });
  storeCookies(res);
  const text = await res.text();
  let data = null;
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
  const extra = expected.checks;
  if (extra) {
    for (const [name, fn] of Object.entries(extra)) {
      try {
        const value = fn(data);
        if (value) {
          pass++;
          console.log(`    ✔ check: ${name}`);
        } else {
          fail++;
          console.log(`    ✘ check: ${name}`);
        }
      } catch (err) {
        fail++;
        console.log(`    ✘ check: ${name} threw ${err instanceof Error ? err.message : err}`);
      }
    }
  }
  return { status: res.status, data };
}

function dstr(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

const tomorrow = dstr(1);
const yesterday = dstr(-1);

console.log("── Setup ─────────────────────────────────────────────");
const login = await req("/api/auth/login", {
  method: "POST",
  body: { email: "demo.patient@s19clinic.com", password: "S19Demo2026!" },
  expected: { statuses: [200] },
  label: "Login demo patient",
});
if (login.status !== 200) {
  console.log("Cannot continue without login; demo user required (run `npm run seed:health`).");
  process.exit(1);
}

const docs = await req("/api/doctors", {
  expected: { statuses: [200], checks: { "doctors present": (d) => Array.isArray(d.doctors) && d.doctors.length >= 3 } },
  label: "List doctors",
});
const doctor = docs.data?.doctors?.[0];
const doctorId = doctor?._id;

// Find the nearest upcoming day (≤ 14 days out) where the doctor has slots.
let slot = null;
let slotDate = null;
for (let off = 1; off <= 14; off++) {
  const d = dstr(off);
  const res = await req(`/api/appointments/availability?doctor=${doctorId || ""}&date=${d}`, {
    expected: {
      statuses: [200],
      checks: { "slots is array": (dd) => Array.isArray(dd.slots) },
    },
    label: `Availability (${d})`,
  });
  if (res.status === 200 && res.data?.slots?.length) {
    slot = res.data.slots[0];
    slotDate = d;
    break;
  }
}
if (!slot) {
  console.log("  ⚠ no bookable slots in the next 14 days; skipping booking tests");
}

console.log("── Booking rules ─────────────────────────────────────");
await req("/api/appointments", {
  method: "POST",
  body: { doctor: doctorId, date: yesterday, time: "10:00", mode: "clinic" },
  expected: { statuses: [400] },
  label: "Reject past date",
});
await req("/api/appointments", {
  method: "POST",
  body: { doctor: doctorId, date: tomorrow, time: "02:00", mode: "clinic" },
  expected: { statuses: [400, 409] },
  label: "Reject off-schedule time (2:00 AM)",
});
await req("/api/appointments", {
  method: "POST",
  body: { doctor: doctorId, date: "not-a-date", time: "10:00", mode: "clinic" },
  expected: { statuses: [400] },
  label: "Reject malformed date",
});

let bookedId = null;
let rescheduleDate = null;
let rescheduleTime = null;
if (slot && slotDate) {
  for (let off = 1; off <= 14; off++) {
    const d = dstr(off);
    if (d === slotDate) continue;
    const rr = await fetch(`${BASE}/api/appointments/availability?doctor=${doctorId}&date=${d}`, {
      headers: { Cookie: getCookieHeader() },
    });
    if (rr.ok) {
      const payload = await rr.json();
      if (Array.isArray(payload.slots) && payload.slots.length) {
        rescheduleDate = d;
        rescheduleTime = payload.slots[0];
        break;
      }
    }
  }

  const booked = await req("/api/appointments", {
    method: "POST",
    body: { doctor: doctorId, date: slotDate, time: slot, mode: "video", concern: "Diabetes / Blood sugar", notes: "Smoke test booking" },
    expected: {
      statuses: [201, 200],
      checks: {
        "appointment returned": (d) => !!(d.appointment || d.booking),
        "status pending": (d) => (d.appointment?.status || d.booking?.status) === "pending",
        "confirmation message": (d) => typeof d.message === "string" && d.message.length > 0,
      },
    },
    label: `Book first slot ${slotDate} ${slot} (video)`,
  });
  bookedId = booked.data?.appointment?._id || booked.data?.booking?._id || null;

  await req("/api/appointments", {
    method: "POST",
    body: { doctor: doctorId, date: slotDate, time: slot, mode: "clinic" },
    expected: { statuses: [409] },
    label: "Reject double-booking of same slot (409)",
  });

  if (rescheduleDate && rescheduleTime) {
    await req(`/api/appointments/${bookedId}`, {
      method: "PATCH",
      body: { action: "reschedule", date: rescheduleDate, time: rescheduleTime },
      expected: { statuses: [200], checks: { "status back to pending": (d) => d.appointment?.status === "pending" } },
      label: `Reschedule to ${rescheduleDate} ${rescheduleTime}`,
    });
  } else {
    console.log("  ⚠ no second working day found; skipping reschedule test");
  }
} else {
  console.log("  ⚠ no slots found; skipping booking/reschedule/double-book tests");
}

console.log("── Patient data views ────────────────────────────────");
await req("/api/appointments", {
  expected: { statuses: [200], checks: { "has appointments": (d) => Array.isArray(d.appointments) && d.appointments.length > 0 } },
  label: "My appointments",
});
await req("/api/medical-records", {
  expected: { statuses: [200], checks: { "has records": (d) => Array.isArray(d.records) && d.records.length > 0 } },
  label: "My medical records",
});
await req("/api/prescriptions", {
  expected: {
    statuses: [200],
    checks: { "has prescriptions": (d) => Array.isArray(d.prescriptions) && d.prescriptions.length > 0 },
  },
  label: "My prescriptions",
});
await req("/api/family-members", {
  expected: { statuses: [200], checks: { "has members": (d) => Array.isArray(d.members) && d.members.length > 0 } },
  label: "My family members",
});

console.log("── Messages & replies ─────────────────────────────────");
const msgList = await req("/api/messages", {
  expected: {
    statuses: [200],
    checks: {
      "has messages": (d) => Array.isArray(d.messages) && d.messages.length > 0,
      "has reply author": (d) => d.messages.some((m) => m.author === "admin"),
    },
  },
  label: "My messages",
});
const adminRoot = (msgList.data?.messages || []).find((m) => m.author === "admin" && !m.thread);
const userReply = (msgList.data?.messages || []).find((m) => m.author === "user");

if (adminRoot) {
  await req("/api/messages", {
    method: "POST",
    body: { threadId: adminRoot._id, text: "Good, thanks for the update." },
    expected: {
      statuses: [201],
      checks: {
        "reply created": (d) => d.message?.author === "user" && d.message?.thread === adminRoot._id,
      },
    },
    label: "Reply inside a clinic thread",
  });
} else {
  console.log("  ⚠ no admin thread found; skipping reply test");
}

await req("/api/messages", {
  method: "POST",
  body: { threadId: "000000000000000000000000", text: "Hello?" },
  expected: { statuses: [404] },
  label: "Reject reply to a foreign/invalid thread",
});

if (userReply) {
  await req(`/api/messages/${userReply._id}/read`, {
    method: "POST",
    expected: { statuses: [404] },
    label: "User cannot mark their own reply as read",
  });
}

await req("/api/messages", {
  method: "POST",
  body: { subject: "New topic from smoke test", text: "Hello clinic, quick question." },
  expected: {
    statuses: [201],
    checks: { "new thread created": (d) => d.message?.author === "user" && !d.message?.thread },
  },
  label: "Patient starts a new thread",
});
await req("/api/messages", {
  method: "POST",
  body: { threadId: adminRoot ? adminRoot._id : "", text: "x" },
  expected: { statuses: [400] },
  label: "Reject too-short reply",
});

console.log("── Cancellation ──────────────────────────────────────");
if (bookedId) {
  await req(`/api/appointments/${bookedId}`, {
    method: "PATCH",
    body: { action: "cancel" },
    expected: { statuses: [200], checks: { "cancel acknowledged": (d) => d.success === true } },
    label: "Cancel appointment",
  });
}

console.log("── Unauthenticated guard ──────────────────────────────");
await req("/api/appointments", {
  cookie: false,
  expected: { statuses: [401] },
  label: "Appointments list requires login",
});

console.log(`\nResults: ${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);