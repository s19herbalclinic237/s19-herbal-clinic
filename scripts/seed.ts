import dotenv from "dotenv";
import path from "path";
import mongoose from "mongoose";
import { Category } from "../lib/models/Category";
import { Product } from "../lib/models/Product";
import { productCategories, seedProducts } from "../lib/data/products";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function main() {
  const uri = process.env.MONGO_URL || process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGO_URL is not set. Set it before running the seed script.");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB.");

  await Category.deleteMany({});
  await Category.insertMany(
    productCategories.map((c) => ({ name: c.name, slug: c.slug, blurb: c.blurb, nameFr: c.nameFr }))
  );
  console.log(`Seeded ${productCategories.length} categories.`);

  await Product.deleteMany({});
  await Product.insertMany(
    seedProducts.map((p) => ({
      name: p.name,
      slug: p.slug,
      category: p.category,
      categorySlug: p.categorySlug,
      price: p.price,
      unit: p.unit,
      shortDescription: p.shortDescription,
      description: p.description,
      usage: p.usage,
      ingredients: p.ingredients,
      badge: p.badge,
      image: p.image,
      featured: p.featured,
      stock: p.stock,
      active: true,
      nameFr: p.nameFr,
      categoryFr: p.categoryFr,
      unitFr: p.unitFr,
      shortDescriptionFr: p.shortDescriptionFr,
      descriptionFr: p.descriptionFr,
      usageFr: p.usageFr,
      ingredientsFr: p.ingredientsFr,
      badgeFr: p.badgeFr,
    }))
  );
  console.log(`Seeded ${seedProducts.length} products.`);

  await mongoose.disconnect();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});