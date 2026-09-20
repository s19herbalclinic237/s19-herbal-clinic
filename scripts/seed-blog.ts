import dotenv from "dotenv";
import path from "path";
import mongoose from "mongoose";
import { BlogPost } from "../lib/models/BlogPost";
import { blogPosts as seedPosts } from "../lib/data/blog-posts";

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

  let seeded = 0;
  for (const post of seedPosts) {
    await BlogPost.findOneAndUpdate(
      { slug: post.slug },
      {
        $set: {
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          body: post.body,
          cover: post.cover ?? null,
          author: post.author,
          status: post.status,
          featured: post.featured,
          publishedAt: new Date(post.publishedAt),
          titleFr: post.titleFr,
          excerptFr: post.excerptFr,
          bodyFr: post.bodyFr,
          authorFr: post.authorFr,
        },
      },
      { upsert: true }
    );
    seeded++;
  }

  const total = await BlogPost.countDocuments();
  const published = await BlogPost.countDocuments({ status: "published" });
  console.log(`Seeded ${seeded} blog posts (upsert).`);
  console.log(`Total: ${total}, published: ${published}.`);

  await mongoose.disconnect();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});