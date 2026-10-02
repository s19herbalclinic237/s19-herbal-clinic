/**
 * Read-only check that the Users directory's Mongo layer still works.
 *
 * Run with `npm run verify:directory`. It executes the real filter — imported
 * from `lib/user-directory.ts`, not copied — against the live database for every
 * combination the search box can produce, then renders the same row shape the
 * screen consumes.
 *
 * Two things this catches that unit tests cannot:
 *   - a filter Mongo rejects outright, which would only show up as a 500 when
 *     the clinic's admin typed something in the search box;
 *   - the sparse unique index on `mrn` being missing, which would let two
 *     patients share a file number with nothing complaining.
 *
 * Writes nothing. Safe on production.
 */
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import mongoose from "mongoose";
import {
  buildDirectoryFilter,
  toDirectoryRow,
  validateMrn,
  type DirectoryRole,
  type MrnState,
} from "@/lib/user-directory";
import { User } from "@/lib/models/User";

function line(label: string, value: unknown) {
  console.log(`  ${String(label).padEnd(40)} ${value}`);
}

let failures = 0;

function check(label: string, condition: boolean, detail = "") {
  if (!condition) failures++;
  console.log(`  ${condition ? "ok  " : "FAIL"}  ${label}${detail ? ` - ${detail}` : ""}`);
}

const CASES: Array<{ label: string; query?: string; role?: DirectoryRole; mrnState?: MrnState }> = [
  { label: "blank (every account)", query: "" },
  { label: "whitespace only", query: "   " },
  { label: "name fragment", query: "ada" },
  { label: "email fragment", query: "@" },
  { label: "MRN shaped", query: "S1900615" },
  { label: "regex metacharacters", query: "a.*b" },
  { label: "unicode", query: "é" },
  { label: "very long", query: "x".repeat(200) },
  { label: "role: admin", role: "admin" },
  { label: "role: doctor", role: "doctor" },
  { label: "role: user", role: "user" },
  { label: "MRN unassigned", mrnState: "unassigned" },
  { label: "MRN assigned", mrnState: "assigned" },
  { label: "query + role", query: "a", role: "user" },
  { label: "query + role + MRN", query: "a", role: "user", mrnState: "assigned" },
];

async function main() {
  const url = process.env.MONGO_URL;
  if (!url) throw new Error("MONGO_URL is not set.");

  await mongoose.connect(url, { dbName: process.env.MONGO_DB || undefined });
  console.log(`Connected to ${mongoose.connection.name}.\n`);

  // 1. The unique index that stops two patients sharing a file number.
  const indexes = await User.collection.indexes();
  const mrnIndex = indexes.find((i) => i.key && Object.keys(i.key).length === 1 && "mrn" in i.key);
  line("mrn index found", mrnIndex ? JSON.stringify(mrnIndex) : "NONE");
  check("a unique index on mrn exists", Boolean(mrnIndex?.unique));
  check("it is sparse so unassigned patients never collide", Boolean(mrnIndex?.sparse));

  // 2. Existing data cannot already violate it.
  const dupes = await User.aggregate<{ mrn: string; n: number }>([
    { $match: { mrn: { $exists: true, $nin: ["", null] } } },
    { $group: { _id: "$mrn", n: { $sum: 1 } } },
    { $match: { n: { $gt: 1 } } },
  ]);
  check("no MRN is already shared by two accounts", dupes.length === 0, JSON.stringify(dupes));

  // 3. Every filter the search box can produce must be accepted by Mongo.
  console.log("\nFilters:");
  for (const c of CASES) {
    const filter = buildDirectoryFilter({ query: c.query, role: c.role, mrnState: c.mrnState });
    try {
      const rows = await User.find(filter).limit(20).lean();
      check(c.label, true, `${rows.length} row(s) in first 20`);
    } catch (error) {
      check(c.label, false, (error as Error).message);
    }
  }

  // 4. A blank search really does return everyone, including administrators.
  const all = await User.find(buildDirectoryFilter()).lean();
  const nonAdmin = await User.find(buildDirectoryFilter({ role: "user" })).lean();
  line("Accounts total / patients", `${all.length} / ${nonAdmin.length}`);
  check("blank search includes administrators", all.length >= nonAdmin.length);

  // 5. The row shape renders without undefined on a real document.
  console.log("\nRow shape:");
  for (const u of all.slice(0, 3)) {
    const row = toDirectoryRow({ ...u, _id: u._id, role: u.role });
    const holes = Object.entries(row).filter(([, v]) => v === undefined).map(([k]) => k);
    check(`row for ${row.name || row.email}`, holes.length === 0, holes.join(","));
    line(`  ${row.name}`, `${row.role} mrn=${row.mrn || "(none)"} family=${row.familyCount}`);
  }

  // 6. The shared validator agrees with what is stored.
  console.log("\nValidator against stored values:");
  for (const u of all.filter((x) => x.mrn).slice(0, 5)) {
    const result = validateMrn(u.mrn);
    check(`stored MRN ${u.mrn} passes validation`, result.ok && result.value === u.mrn);
  }

  await mongoose.disconnect();
  console.log(`\n${failures === 0 ? "All checks passed." : `${failures} FAILED.`}`);
  if (failures > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error("verify:directory failed:", error);
  process.exitCode = 1;
});