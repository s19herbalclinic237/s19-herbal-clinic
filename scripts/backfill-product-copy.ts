import dotenv from "dotenv";
import path from "path";
import mongoose from "mongoose";
import { Product } from "../lib/models/Product";
import { seedProducts } from "../lib/data/products";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

/**
 * Applies the ten rewritten product descriptions from the Shop / Herbal Catalog
 * guide to the live catalog.
 *
 * WHY THIS EXISTS
 * /shop and /shop/[slug] read from MongoDB first and only fall back to
 * lib/data/products.ts, so editing the seed file does not by itself change what a
 * customer reads. The live catalog was verified to be in sync with the seed before
 * this rewrite, so the seed copy is the correct target.
 *
 * WHY IT IS NOT scripts/seed.ts
 * seed.ts does Product.deleteMany({}) then insertMany. That would discard stock
 * levels, reorder thresholds, reorder targets, creation dates (which drive the
 * catalog sort order) and any edits made through the admin panel. This script
 * touches four text fields on ten named products and nothing else.
 *
 * SAFE: dry run by default. Writes require an explicit --apply. Idempotent - it
 * only ever sets fields to the seed values, so re-running is a no-op.
 */

const FIELDS = [
  "shortDescription",
  "description",
  "shortDescriptionFr",
  "descriptionFr",
] as const;

/** The ten products whose descriptions the guide rewrites. */
const TARGET_SLUGS = [
  "s19-flat-tummy-weight-loss-tea",
  "s19-vision-herbal-eye-drops",
  "s19-malaria-typhoid-combo",
  "s19-liver-support",
  "s19-black-seed-oil",
  "s19-natural-bathing-soap",
  "s19-feminine-fertility-booster",
  "s19-parasite-cleanse-combo",
  "s19-man-pikin",
  "s19-neuro-protect",
] as const;

const apply = process.argv.includes("--apply");

async function main() {
  const uri = process.env.MONGO_URL || process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGO_URL is not set. Set it in .env.local before running this script.");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log(`Connected to MongoDB. Mode: ${apply ? "APPLY (writing)" : "DRY RUN (no writes)"}\n`);

  let changed = 0;
  let alreadyCurrent = 0;
  let missing = 0;

  for (const slug of TARGET_SLUGS) {
    const seed = seedProducts.find((p) => p.slug === slug);
    if (!seed) {
      console.error(`  ABORT: ${slug} is not in lib/data/products.ts. Nothing has been written.`);
      process.exit(1);
    }

    const live = await Product.findOne({ slug }).lean<Record<string, unknown> | null>();
    if (!live) {
      missing++;
      console.log(`  MISSING  ${slug} - not in the database. The seed value will not be inserted here.`);
      continue;
    }

    const next: Record<string, string> = {};
    const changedFields: string[] = [];
    for (const f of FIELDS) {
      const value = seed[f] ?? "";
      if (live[f] !== value) {
        next[f] = value;
        changedFields.push(f);
      }
    }

    if (!changedFields.length) {
      alreadyCurrent++;
      console.log(`  current  ${slug}`);
      continue;
    }

    changed++;
    console.log(`  UPDATE   ${slug}`);
    for (const f of changedFields) {
      console.log(`             ${f}`);
      console.log(`               from: ${String(live[f] ?? "(empty)").slice(0, 150)}`);
      console.log(`               to:   ${next[f].slice(0, 150)}`);
    }

    if (apply) {
      await Product.updateOne({ slug }, { $set: next });
    }
  }

  console.log(
    `\n${changed} product(s) need updating, ${alreadyCurrent} already current, ${missing} missing.`,
  );
  if (missing > 0) {
    console.log("A missing product is expected only if it was added or removed by hand; check before applying.");
  }

  if (!apply) {
    console.log("\nDry run. Re-run with --apply to write these four fields on these ten products.");
  }

  await mongoose.disconnect();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
