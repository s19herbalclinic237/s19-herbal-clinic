import dotenv from "dotenv";
import path from "path";
import mongoose from "mongoose";
import { Testimonial } from "../lib/models/Testimonial";
import { testimonials as staticTestimonials } from "../lib/data/testimonials";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function main() {
  const uri = process.env.MONGO_URL || process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGO_URL is not set. Set it in .env.local before running this script.");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB.");

  const removed = await Testimonial.deleteMany({ name: /^E2E/ });
  if (removed.deletedCount) {
    console.log(`Removed ${removed.deletedCount} leftover test testimonial(s).`);
  }

  const base = Date.now();
  let seeded = 0;
  for (let i = 0; i < staticTestimonials.length; i++) {
    const t = staticTestimonials[i];
    const createdAt = new Date(base + i * 1000);
    await Testimonial.findOneAndUpdate(
      { name: t.name },
      {
        $set: {
          name: t.name,
          city: t.city,
          country: t.country,
          program: t.program,
          text: t.text,
          status: "approved",
        },
        $setOnInsert: { createdAt },
      },
      { upsert: true }
    );
    seeded++;
  }

  const total = await Testimonial.countDocuments();
  const approved = await Testimonial.countDocuments({ status: "approved" });
  console.log(`Seeded ${seeded} testimonials (upsert).`)
  console.log(`Total: ${total}, approved: ${approved}.`);

  await mongoose.disconnect();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});