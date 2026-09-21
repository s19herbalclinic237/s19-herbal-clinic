import dotenv from "dotenv";
import path from "path";
import mongoose from "mongoose";
import { Testimonial } from "../lib/models/Testimonial";
import { testimonials as staticTestimonials } from "../lib/data/testimonials";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

/**
 * SAFE backfill: adds the French translations (programFr / textFr) to existing
 * approved testimonials that match the static list by name. Never deletes or
 * touches other records. Safe to re-run (idempotent).
 */
async function main() {
  const uri = process.env.MONGO_URL || process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGO_URL is not set. Set it in .env.local before running this script.");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB.");

  let updated = 0;
  let skipped = 0;
  for (const s of staticTestimonials) {
    if (!s.textFr && !s.programFr) {
      skipped++;
      continue;
    }
    const res = await Testimonial.updateOne(
      { name: s.name, status: "approved" },
      {
        $set: {
          programFr: s.programFr || "",
          textFr: s.textFr || "",
        },
      }
    );
    if (res.modifiedCount || res.matchedCount) updated++;
    else skipped++;
  }

  const total = await Testimonial.countDocuments();
  const approved = await Testimonial.countDocuments({ status: "approved" });
  const approvedWithFr = await Testimonial.countDocuments({
    status: "approved",
    textFr: { $exists: true, $ne: "" },
  });
  console.log(`Backfilled/updated ${updated} approved testimonial(s); ${skipped} skipped (no match or no translation).`);
  console.log(`Total: ${total}, approved: ${approved}, approved with French text: ${approvedWithFr}.`);

  await mongoose.disconnect();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});