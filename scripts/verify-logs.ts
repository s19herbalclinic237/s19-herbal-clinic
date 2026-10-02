/**
 * Read-only triage of the error-log entries the clinic admin saw.
 *
 * `npm run verify:logs` prints the full documents behind the collapsed rows so
 * it is clear whether an entry is real clinic traffic or something else. Writes
 * nothing.
 */
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import mongoose from "mongoose";
import { AppLog } from "@/lib/models/AppLog";

async function main() {
  const url = process.env.MONGO_URL;
  if (!url) throw new Error("MONGO_URL is not set.");

  await mongoose.connect(url, { dbName: process.env.MONGO_DB || undefined });
  console.log(`Connected to ${mongoose.connection.name}.\n`);

  const entries = await AppLog.find({
    $or: [
      { scope: "whatsapp-webhook" },
      { scope: "cron" },
      { scope: "plan-schedule" },
    ],
  })
    .sort({ lastSeen: -1 })
    .limit(40)
    .lean();

  console.log(`${entries.length} entry/entries\n`);

  for (const e of entries) {
    console.log("=".repeat(78));
    console.log(`scope        ${e.scope}`);
    console.log(`level        ${e.level}   source ${e.source}`);
    console.log(`message      ${e.message}`);
    console.log(`route        ${e.method ?? ""} ${e.route ?? "(none)"}`);
    console.log(`status       ${e.status ?? "(none)"}`);
    console.log(`firstSeen    ${new Date(e.firstSeen).toISOString()}`);
    console.log(`lastSeen     ${new Date(e.lastSeen).toISOString()}`);
    console.log(`occurrences  ${e.occurrences}`);
    console.log(`fingerprint  ${e.fingerprint}`);
    console.log(`createdAt    ${new Date(e.createdAt).toISOString()}`);
    if (e.context) console.log(`context      ${e.context}`);
  }

  // Anything else at all in the log, so nothing is missed.
  const others = await AppLog.countDocuments({
    $nor: [{ scope: "whatsapp-webhook" }, { scope: "cron" }, { scope: "plan-schedule" }],
  });
  console.log("=".repeat(78));
  console.log(`\nOther entries of any scope: ${others}`);

  const byScope = await AppLog.aggregate<{ _id: string; n: number }>([
    { $group: { _id: "$scope", n: { $sum: 1 } } },
    { $sort: { n: -1 } },
  ]);
  console.log("\nAll scopes by volume:");
  for (const s of byScope) console.log(`  ${String(s.n).padStart(4)}  ${s._id}`);

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error("verify:logs failed:", error);
  process.exitCode = 1;
});