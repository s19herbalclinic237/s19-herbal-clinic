/**
 * Adds the "Wine" product category and moves every wine product into it.
 *
 * Wine is its own product line (more wines are in development), so the
 * "S19 Herbal Wine Reserve" (and any future wine products) must not live
 * under "Extracts & Oils".
 *
 * Safe to re-run: upserts categories, matches products by slug.
 */
import dotenv from "dotenv";
import path from "path";
import mongoose from "mongoose";
import { Category } from "../lib/models/Category";
import { Product } from "../lib/models/Product";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function main() {
  const uri = process.env.MONGO_URL || process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGO_URL is not set.");
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log("Connected to MongoDB.\n");

  // 1. Inspect the current categories.
  const categories = await Category.find().lean();
  console.log("Current categories:", categories.map((c) => `${c.name} (${c.slug})`).join(", "));

  // 2. Upsert the Wine category.
  const wineSlug = "wine";
  const existing = await Category.findOne({ slug: wineSlug }).lean();
  const wineCat = { name: "Wine", slug: wineSlug, blurb: "Natural herbal wines and botanical tonics.", nameFr: "Vin" };
  if (existing) {
    await Category.updateOne({ slug: wineSlug }, { $set: wineCat });
    console.log(`Updated category "Wine" (${existing._id}).`);
  } else {
    await Category.create(wineCat);
    console.log(`Created category "Wine" (${wineSlug}).`);
  }

  // 3. Move every wine product to the Wine category (seed + admin-created).
  const candidates = await Product.find({
    $or: [{ name: /wine/i }, { name: /vin/i }, { category: "Wine" }],
  }).lean();
  console.log(`\nFound ${candidates.length} wine product(s).`);

  for (const p of candidates) {
    const old = `${p.category} (${p.categorySlug})`;
    const next = { category: "Wine", categoryFr: "Vin", categorySlug: "wine" };
    if (p.categorySlug === "wine") {
      console.log(`- ${p.name}: already in Wine.`);
      continue;
    }
    await Product.updateOne({ _id: p._id }, { $set: next });
    console.log(`- ${p.name}: ${old} -> Wine (wine).`);
  }

  // 4. Confirm the new category order matches the seed list.
  const after = await Category.find().sort({ name: 1 }).lean();
  console.log("\nCategories now:", after.map((c) => `${c.name} (${c.slug})`).join(", "));

  await mongoose.disconnect();
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});