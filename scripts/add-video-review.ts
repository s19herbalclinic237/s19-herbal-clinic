import dotenv from "dotenv";
import path from "path";
import mongoose from "mongoose";
import { VideoReview } from "../lib/models/VideoReview";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

/**
 * Adds one live video review (Google Drive link) to the VideoReview
 * collection so it appears on /live-reviews. Idempotent: re-running
 * updates the title of the matching URL instead of duplicating it.
 */
async function main() {
  const uri = process.env.MONGO_URL || process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGO_URL is not set. Set it in .env.local before running this script.");
    process.exit(1);
  }

  const url =
    process.argv[2] ||
    "https://drive.google.com/file/d/17NjPfbTn-wJNU7aFTtgzS06MpTWCFwXK/view?usp=drivesdk";
  const title = process.argv[3] || "Video review";

  await mongoose.connect(uri);
  console.log("Connected to MongoDB.");

  const existing = await VideoReview.findOneAndUpdate(
    { url },
    { $set: { url, title, active: true } },
    { upsert: true, returnDocument: "after" }
  ).lean();
  console.log(`Video review ready (id: ${existing._id}, title: "${existing.title}").`);

  const total = await VideoReview.countDocuments();
  const active = await VideoReview.countDocuments({ active: true });
  console.log(`Total: ${total}, active: ${active}.`);

  await mongoose.disconnect();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});