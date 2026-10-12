import dotenv from "dotenv";
import path from "path";
import mongoose from "mongoose";
import { Service } from "../lib/models/Service";
import { treatmentPrograms } from "../lib/data/programs";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

/**
 * Copies the built-in services (formerly the hard-coded `treatmentPrograms`)
 * into MongoDB. Runs only when the collection is empty so it never clobbers
 * edits made from the admin dashboard; the admin panel performs the same
 * one-time seed automatically the first time the Services tab is opened.
 */
async function main() {
  const uri = process.env.MONGO_URL || process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGO_URL is not set. Set it in .env.local before running this script.");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB.");

  const existing = await Service.countDocuments();
  if (existing > 0) {
    console.log(`Collection already has ${existing} service(s); nothing to do.`);
    await mongoose.disconnect();
    return;
  }

  await Service.bulkWrite(
    treatmentPrograms.map((p, index) => ({
      updateOne: {
        filter: { slug: p.slug },
        update: {
          $setOnInsert: {
            slug: p.slug,
            title: p.title,
            short: p.short,
            detail: p.detail,
            conditions: p.conditions,
            note: p.note,
            noteKind: p.noteKind ?? "important",
            order: index,
            status: "published" as const,
            publishedAt: new Date(),
            titleFr: p.titleFr,
            shortFr: p.shortFr,
            detailFr: p.detailFr,
            conditionsFr: p.conditionsFr,
            noteFr: p.noteFr,
          },
        },
        upsert: true,
      },
    })),
    { ordered: false }
  );

  const total = await Service.countDocuments();
  console.log(`Seeded ${total} service(s).`);
  await mongoose.disconnect();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
