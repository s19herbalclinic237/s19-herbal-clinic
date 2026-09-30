/**
 * Audit: what cover path does each published post actually hold, and does the
 * file it points at exist on disk? The migration script reports "0 to repair",
 * which contradicts docs/IMAGE_SEO.md claiming four posts are 404ing. One of
 * those two is wrong and this decides which.
 */
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import mongoose from "mongoose";
import { BlogPost } from "../lib/models/BlogPost";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function main() {
  const uri = process.env.MONGO_URL || process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGO_URL is not set");
  await mongoose.connect(uri);

  const { CLINIC_PHOTO_LIST, clinicPhotoFile, clinicPhotoSrc } = await import("../lib/image-registry");
  const known = new Set(CLINIC_PHOTO_LIST.map((p) => clinicPhotoFile(p)));
  console.log("Registry knows", known.size, "editorial photos.\n");

  // Walk all of public/ recursively. An earlier version scanned only the
  // top level plus s19-assets, which reported eight healthy posts as broken
  // simply because public/s19-blog was never looked at.
  const onDisk = new Set<string>();
  const walk = (dir: string, prefix: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const rel = prefix ? `${prefix}/${e.name}` : e.name;
      if (e.isDirectory()) walk(path.join(dir, e.name), rel);
      else onDisk.add(rel);
    }
  };
  walk("public", "");

  const posts = await BlogPost.find({}).select("slug status cover body").lean();
  console.log("Posts in DB:", posts.length, "\n");

  let broken = 0;
  for (const p of posts) {
    if (p.status !== "published") continue;
    const cover = p.cover || "";
    const rel = decodeURIComponent(cover.replace(/^\//, ""));
    const inRegistry = known.has(rel.replace(/^s19-assets\//, ""));
    const onDiskSet = onDisk.has(rel);

    // Does the body reference any file that is not on disk?
    const bodyBroken = new Set<string>();
    const re = /\/((?:s19-assets|s19-blog)\/[^)"'\s]+)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(p.body || ""))) {
      const bf = decodeURIComponent(m[1]);
      if (!onDisk.has(bf)) bodyBroken.add(bf);
    }

    const ok = onDiskSet && bodyBroken.size === 0;
    if (!ok) broken++;
    console.log(
      `${ok ? "OK  " : "BAD "} [${p.status}] ${p.slug}` +
        (onDiskSet ? "" : "  COVER MISSING ON DISK") +
        (inRegistry ? "" : "  (cover not in registry)") +
        (bodyBroken.size ? `  BODY MISSING: ${[...bodyBroken].join(", ")}` : "")
    );
    if (!ok) console.log(`       cover = ${cover}`);
  }
  console.log(`\nPublished posts with a broken image: ${broken}`);
  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });