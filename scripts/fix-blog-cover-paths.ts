/**
 * Repair blog post cover paths after the editorial photos were renamed.
 *
 * ## Why this exists
 *
 * The clinic's twelve editorial photographs were named after the prompts used to
 * generate them. They have been renamed to descriptive slugs (see
 * `lib/image-registry.ts` and `docs/IMAGE_SEO.md`), and every path in
 * `lib/site-assets.ts` and `lib/data/blog-posts.ts` is now derived from the
 * registry so the filenames cannot drift again.
 *
 * The MongoDB documents are the exception. `scripts/seed-blog.ts` copied the
 * cover path into each post document verbatim, so **the database still holds the
 * old prompt filenames**. Those are now 404s on four published posts, and they
 * are also being emitted into `sitemap.xml`, where a broken `<image:loc>` is
 * worse than a missing one.
 *
 * ## Safety
 *
 * - **Dry run by default.** Nothing is written unless you pass `--apply`.
 * - **Idempotent.** Safe to re-run; posts already on a new path are skipped.
 * - **Scoped.** Only `cover` and `body` are touched, and only on documents whose
 *   value actually contains one of the listed legacy filenames.
 * - **Reversible.** The old paths are printed, so the inverse update can be
 *   written by hand if it turns out to be wrong.
 *
 * ## Usage
 *
 * ```
 * npm.cmd run fix:blog-covers           # audit only, writes nothing
 * npm.cmd run fix:blog-covers -- --apply
 * ```
 */

import dotenv from "dotenv";
import path from "path";
import mongoose from "mongoose";
import { BlogPost } from "../lib/models/BlogPost";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const PHOTO_DIR = "/s19-assets";

/**
 * Legacy prompt filename -> current slug.
 *
 * Written out in full rather than derived, so the migration is reviewable: this
 * is the complete, auditable list of what changed and what it became. The
 * current side is checked against `lib/image-registry.ts` at runtime, so a typo
 * here fails loudly instead of writing a path that 404s.
 */
const LEGACY_FILENAMES: Record<string, string> = {
  "a different s19 staff still in lab doing some work on the table with some beakers having liquids all dresses in proper lab outfit with gloves.jpg":
    "s19-herbal-clinic-laboratory-beakers.jpg",
  "a different s19 staff still in lab doing some transfer of chemical all dresses in proper lab outfit with gloves.jpg":
    "s19-laboratory-liquid-transfer.jpg",
  "s19-expert with lab dress in lab doing some transfer of a chemical using a pipet.jpg":
    "s19-laboratory-pipette-transfer.jpg",
  "s19-expert with lab dress in lab doing some transfer of a chemical using a pipet but this time she is looking at the reading on the pipet.jpg":
    "s19-laboratory-pipette-reading.jpg",
  "female s19 staff taking down records into medical booklet on office table in s19 uniform.jpg":
    "s19-clinic-patient-records-bafoussam.jpg",
  "main welcom spot in s19 shop with one staff at counter and pproducts in cupboards behind her.jpg":
    "s19-herbal-clinic-shop-counter-bafoussam.jpg",
  "male s19 staff on the office table in s16 uniform giving some analysis advice to two clients who listen and follow up closely.jpg":
    "s19-herbal-clinic-consultation-bafoussam.jpg",
  "s19 staff taking blood pressure level of persong with machine and two older people are watching all in the s19 headqueater office.jpg":
    "s19-clinic-blood-pressure-check-bafoussam.jpg",
  "s19-staff holding basket of natural vegetables and fruits explaining something to a circle of people.jpg":
    "s19-nutrition-health-education-workshop.jpg",
  "s19-staff holding basket of natural vegetables and fruits explaining something to a circle of people but this time she is wearing the s19 uniform.jpg":
    "s19-nutrition-health-education-clinic-staff.jpg",
  "female s19 staff doing electrolysis.jpg": "s19-clinic-electrotherapy-treatment.jpg",
  "cupboard-with-many-different-s19-products.jpg": "s19-herbal-products-display-shelf.jpg",
};

/**
 * Every representation of a legacy path that could be stored in the database.
 *
 * A post may hold the URL-encoded form (because it was copied from a JS string
 * literal) or the decoded form, and a cover might be stored with or without a
 * leading slash. All four combinations are matched so nothing is missed.
 */
function legacyPatternFor(filename: string): RegExp {
  const encoded = encodeURIComponent(filename).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const decoded = filename.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`${PHOTO_DIR}/(?:${encoded}|${decoded})`, "g");
}

/** True when the value contains no legacy path, i.e. it needs no change. */
function needsRepair(value: string | undefined | null): boolean {
  if (!value) return false;
  return Object.keys(LEGACY_FILENAMES).some((filename) =>
    legacyPatternFor(filename).test(value)
  );
}

async function main() {
  const apply = process.argv.slice(2).includes("--apply");

  const uri = process.env.MONGO_URL || process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGO_URL is not set. Set it in .env.local before running this script.");
    process.exit(1);
  }

  // Fail before connecting if the migration's idea of the new filenames does not
  // match the registry. Writing a path the registry does not know about would
  // trade one 404 for another.
  const { CLINIC_PHOTO_LIST, clinicPhotoFile } = await import("../lib/image-registry");
  const knownFiles = new Set(CLINIC_PHOTO_LIST.map((p) => clinicPhotoFile(p)));
  const unknownTargets = Object.entries(LEGACY_FILENAMES)
    .filter(([, target]) => !knownFiles.has(target))
    .map(([legacy, target]) => `${legacy} -> ${target}`);
  if (unknownTargets.length) {
    console.error("Refusing to run: these targets are not in lib/image-registry.ts:");
    for (const line of unknownTargets) console.error("  " + line);
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB.");
  console.log(apply ? "MODE: APPLY (writes will be committed)" : "MODE: DRY RUN (nothing is written)");

  const published = await BlogPost.find({ status: "published" }).select("slug cover body").lean();
  console.log(`Published posts: ${published.length}`);

  let fixedCovers = 0;
  let fixedBodies = 0;

  for (const post of published) {
    const coverStale = needsRepair(post.cover);
    const bodyStale = needsRepair(post.body);
    if (!coverStale && !bodyStale) continue;

    console.log(`\n${post.slug}`);
    if (coverStale) console.log(`  cover: ${post.cover}`);
    if (bodyStale) console.log("  body:  contains a legacy image path");

    const rewrite = (value: string): string => {
      let out = value;
      for (const [legacy, target] of Object.entries(LEGACY_FILENAMES)) {
        out = out.replace(legacyPatternFor(legacy), `${PHOTO_DIR}/${target}`);
      }
      return out;
    };

    const update: Record<string, string> = {};
    if (coverStale) {
      update.cover = rewrite(post.cover as string);
      fixedCovers++;
    }
    if (bodyStale) {
      update.body = rewrite(post.body as string);
      fixedBodies++;
    }

    if (apply) {
      await BlogPost.updateOne({ _id: post._id }, { $set: update });
      console.log(`  -> written: ${Object.keys(update).join(", ")}`);
    } else {
      for (const [field, value] of Object.entries(update)) {
        console.log(`  -> would set ${field} = ${value.length > 160 ? value.slice(0, 160) + "…" : value}`);
      }
    }
  }

  console.log("");
  console.log(`Covers needing repair: ${fixedCovers}`);
  console.log(`Bodies needing repair:  ${fixedBodies}`);

  if (!apply && (fixedCovers || fixedBodies)) {
    console.log("");
    console.log("Nothing was written. Re-run with --apply to commit.");
  }
  if (apply) {
    console.log("");
    console.log("Done. Re-run without --apply to confirm nothing is left to repair.");
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
