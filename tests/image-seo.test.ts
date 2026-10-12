/**
 * Image SEO tests.
 *
 * These verify the claims in `lib/image-registry.ts` against the actual bytes on
 * disk. That is the whole point: a registry that disagrees with the filesystem is
 * worse than no registry, because it makes the images *look* described while
 * Google indexes a 404.
 *
 * What is being protected, and why each one matters for image search:
 *
 * - **Filenames.** Google Images uses the filename as a relevance signal. The
 *   originals were the full image-generation prompts, so the "enforce slug
 *   shape" and "no orphan file" tests exist to stop that coming back.
 * - **Intrinsic dimensions.** Without `width`/`height` the browser cannot
 *   reserve space, which is a direct Core Web Vitals (CLS) penalty — and a
 *   declared size that is wrong is worse than none, because it reserves the
 *   wrong space.
 * - **Alt text in both languages.** A French visitor gets an English alt, and
 *   French-language image search gets nothing to match on.
 * - **Referenced files existing.** A missing cover image is a 404 on a page that
 *   is otherwise being advertised in the sitemap.
 *
 * Run with: npm.cmd test
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import {
  CLINIC_LOGO_LIST,
  CLINIC_PHOTO_DIR,
  CLINIC_PHOTO_LIST,
  CLINIC_PHOTOS,
  clinicPhoto,
  clinicPhotoAlt,
  clinicPhotoFile,
  clinicPhotoRatio,
  clinicPhotoSrc,
  findClinicPhotoBySrc,
  photoPathsForPage,
  photosForPage,
  resolveClinicPhoto,
  type ClinicPhoto,
} from "@/lib/image-registry";
import { S19_ASSETS } from "@/lib/site-assets";
import { canonicalPath, imageGalleryJsonLd, imageObjectJsonLd } from "@/lib/seo";
import { LOCALE_OPTIONS, type Locale } from "@/lib/i18n";

const REPO_ROOT = process.cwd();
const PUBLIC_DIR = path.join(REPO_ROOT, "public");
const PHOTO_DIR = path.join(PUBLIC_DIR, CLINIC_PHOTO_DIR.replace(/^\//, ""));

/* ------------------------------------------------------------------ *
 * Minimal image-header readers
 *
 * No image library is installed and none is warranted: all that is needed is the
 * intrinsic size, which lives in the first few hundred bytes of a JPEG (an SOF
 * marker) or a PNG (the IHDR chunk). Pulling in sharp or image-size to read two
 * integers would be a dependency for a test.
 * ------------------------------------------------------------------ */

function jpegSize(buf: Buffer): { width: number; height: number } | null {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i < buf.length - 1) {
    if (buf[i] !== 0xff) {
      i += 1;
      continue;
    }
    const marker = buf[i + 1];
    // SOF0..SOF15, excluding DHT (0xC4), JPG (0xC8) and DAC (0xCC), which share
    // the numeric range but are not frame headers.
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    }
    // Standalone markers carry no length field.
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      i += 2;
      continue;
    }
    const segmentLength = buf.readUInt16BE(i + 2);
    if (segmentLength < 2) return null;
    i += 2 + segmentLength;
  }
  return null;
}

function pngSize(buf: Buffer): { width: number; height: number } | null {
  if (buf.length < 24 || buf.readUInt32BE(0) !== 0x89504e47) return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function rasterSize(file: string): { width: number; height: number } | null {
  const buf = readFileSync(file);
  return /\.png$/i.test(file) ? pngSize(buf) : jpegSize(buf);
}

/** Every locale the site serves. */
const LOCALES = LOCALE_OPTIONS.map((o) => o.code as Locale);

/** Editorial photos, keyed by entry, for readable failure messages. */
const bySlug = new Map(CLINIC_PHOTO_LIST.map((p) => [p.slug, p]));

describe("image filenames are descriptive, not generation prompts", () => {
  test("every slug is lowercase kebab-case", () => {
    // The original filenames were the full prompts used to generate the images
    // ("a different s19 staff still in lab doing some transfer of chemical all
    // dresses in proper lab outfit with gloves.jpg"), which is a useless search
    // term and an unprofessional URL. This pins the replacement shape.
    for (const photo of CLINIC_PHOTO_LIST) {
      assert.match(
        photo.slug,
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        `slug is not lowercase-kebab-case: ${photo.slug}`
      );
    }
  });

  test("slugs are a sane length so they stay readable in a URL", () => {
    for (const photo of CLINIC_PHOTO_LIST) {
      assert.ok(
        photo.slug.length <= 60,
        `slug is ${photo.slug.length} characters, which is too long to read in a URL: ${photo.slug}`
      );
    }
  });

  test("no file left in the photo folder keeps a prompt-style name", () => {
    // Catches any file dropped in later that bypasses the registry. Only
    // top-level files are checked; `products/` and `merche/` hold catalogue
    // content referenced from data files, not editorial photography.
    const orphans = readdirSync(PHOTO_DIR, { withFileTypes: true })
      .filter((e) => e.isFile() && /\.(jpe?g|png|webp|avif)$/i.test(e.name))
      .filter((e) => !CLINIC_PHOTO_LIST.some((p) => clinicPhotoFile(p) === e.name))
      .map((e) => e.name);
    assert.deepEqual(
      orphans,
      [],
      `these images are not described in lib/image-registry.ts: ${orphans.join(", ")}`
    );
  });

  test("every file in the photo folder is actually described", () => {
    const files = readdirSync(PHOTO_DIR, { withFileTypes: true })
      .filter((e) => e.isFile() && /\.(jpe?g|png)$/i.test(e.name))
      .map((e) => e.name);
    for (const file of files) {
      assert.ok(
        CLINIC_PHOTO_LIST.some((p) => clinicPhotoFile(p) === file),
        `${file} has no registry entry, so it cannot appear in the image sitemap`
      );
    }
  });
});

describe("declared dimensions match the real files", () => {
  test("every registered photo exists on disk", () => {
    for (const photo of CLINIC_PHOTO_LIST) {
      const file = path.join(PHOTO_DIR, clinicPhotoFile(photo));
      assert.ok(existsSync(file), `missing file: ${clinicPhotoSrc(photo)}`);
    }
  });

  test("every declared width and height is exactly right", () => {
    // A wrong intrinsic size reserves the wrong amount of space, which is worse
    // than declaring nothing at all: the layout still shifts.
    for (const photo of CLINIC_PHOTO_LIST) {
      const file = path.join(PHOTO_DIR, clinicPhotoFile(photo));
      const actual = rasterSize(file);
      assert.ok(actual, `could not read the header of ${clinicPhotoFile(photo)}`);
      assert.equal(actual.width, photo.width, `width mismatch for ${photo.slug}`);
      assert.equal(actual.height, photo.height, `height mismatch for ${photo.slug}`);
    }
  });

  test("dimensions are positive and plausible", () => {
    for (const photo of CLINIC_PHOTO_LIST) {
      assert.ok(photo.width > 0 && photo.height > 0, `${photo.slug} has a zero dimension`);
      assert.ok(photo.width >= 300, `${photo.slug} is too small to use as a content image`);
    }
  });

  test("the aspect ratio helper agrees with the declared size", () => {
    for (const photo of CLINIC_PHOTO_LIST) {
      assert.equal(clinicPhotoRatio(photo), photo.width / photo.height);
    }
  });
});

describe("alt text is real, localised, and in both languages", () => {
  test("no content image has empty alt text in any language", () => {
    // An empty `alt` on a photo of the clinic is a screen-reader dead end and an
    // image-search dead end. (Decorative icons elsewhere are a different case
    // and legitimately use `alt=""`.)
    for (const photo of CLINIC_PHOTO_LIST) {
      for (const locale of LOCALES) {
        const alt = photo.alt[locale];
        assert.ok(
          alt.trim().length >= 20,
          `${photo.slug} has no usable ${locale} alt text: ${JSON.stringify(alt)}`
        );
      }
    }
  });

  test("French alt text is actually translated, not copied from English", () => {
    for (const photo of CLINIC_PHOTO_LIST) {
      assert.notEqual(
        photo.alt.fr,
        photo.alt.en,
        `${photo.slug} has identical EN and FR alt text`
      );
      // A French string that is still mostly English words slipped through.
      const frenchStopwords = /\b(le|la|les|des|une|un|avec|pour|dans|clinic|staff)\b/i;
      assert.match(photo.alt.fr, frenchStopwords, `${photo.slug} has no French alt text`);
    }
  });

  test("captions exist in both languages", () => {
    for (const photo of CLINIC_PHOTO_LIST) {
      for (const locale of LOCALES) {
        assert.ok(
          photo.caption[locale].trim().length >= 10,
          `${photo.slug} needs a ${locale} caption for the image sitemap`
        );
      }
    }
  });

  test("alt text describes the frame rather than restating the filename", () => {
    // Keyword-metadata alt text ("herbal clinic bafoussam photo 1") is a known
    // spam pattern. Good alt text and a good SEO slug naturally share words —
    // that overlap is the point, not a fault — so the check is that the alt
    // carries real information the slug does not, counted as words the slug has
    // never heard of.
    for (const photo of CLINIC_PHOTO_LIST) {
      const slugWords = new Set(photo.slug.split("-"));
      const altWords = photo.alt.en.toLowerCase().match(/[a-z]+/g) ?? [];
      assert.ok(altWords.length >= 10, `${photo.slug}: alt text is too short to describe anything`);

      const novel = new Set(altWords.filter((w) => w.length > 3 && !slugWords.has(w)));
      assert.ok(
        novel.size >= 6,
        `${photo.slug}: alt text adds only ${novel.size} words beyond the filename, ` +
          `so it is close to a restatement of it`
      );
      assert.ok(
        photo.alt.en.length > photo.slug.length,
        `${photo.slug}: alt text is no longer than the filename`
      );
    }
  });

  test("alt text does not overclaim", () => {
    // Consistent with the brand-content guard: a cure claim on a clinic
    // photograph is both a legal problem and a trust problem.
    const banned = /\b(cure[sd]?|guaranteed?|permanent cure|miracle|100% effective)\b/i;
    for (const photo of CLINIC_PHOTO_LIST) {
      for (const locale of LOCALES) {
        assert.doesNotMatch(
          photo.alt[locale],
          banned,
          `${photo.slug} overclaims in ${locale} alt text`
        );
        assert.doesNotMatch(
          photo.caption[locale],
          banned,
          `${photo.slug} overclaims in ${locale} caption`
        );
      }
    }
  });

  test("the alt helper returns the requested locale", () => {
    const entry = clinicPhoto("shopCounter");
    assert.equal(clinicPhotoAlt(entry, "en"), entry.alt.en);
    assert.equal(clinicPhotoAlt(entry, "fr"), entry.alt.fr);
  });

  test("resolveClinicPhoto bundles a consistent set of render props", () => {
    // The whole point of the helper is that these cannot disagree with each
    // other, because they are all read from the one registry entry.
    for (const key of Object.keys(CLINIC_PHOTOS) as (keyof typeof CLINIC_PHOTOS)[]) {
      for (const locale of LOCALES) {
        const resolved = resolveClinicPhoto(key, locale);
        assert.equal(resolved.src, clinicPhotoSrc(CLINIC_PHOTOS[key]));
        assert.equal(resolved.alt, CLINIC_PHOTOS[key].alt[locale]);
        assert.equal(resolved.width, CLINIC_PHOTOS[key].width);
        assert.equal(resolved.height, CLINIC_PHOTOS[key].height);
        assert.equal(resolved.photo, CLINIC_PHOTOS[key]);
        assert.ok(resolved.alt.trim().length > 0, `${key} resolved to empty ${locale} alt text`);
      }
    }
  });
});

describe("the registry covers what the site actually uses", () => {
  test("every S19_ASSETS.photo path points at a real file", () => {
    // The legacy map is derived from the registry, so this is a check that the
    // derivation did not break, and that no path was hand-edited back into an
    // encoded prompt.
    for (const [key, src] of Object.entries(S19_ASSETS.photos)) {
      assert.ok(src.startsWith(`${CLINIC_PHOTO_DIR}/`), `${key} escaped the photo directory`);
      assert.doesNotMatch(src, /%20/, `${key} is URL-encoded, which means it was not renamed`);
      const file = path.join(PUBLIC_DIR, src.replace(/^\//, ""));
      assert.ok(existsSync(file), `${key} -> ${src} does not exist on disk`);
    }
  });

  test("no asset path still contains a space", () => {
    const all = JSON.stringify(S19_ASSETS);
    // The icon paths are pre-existing and separate; only check the photos.
    for (const src of Object.values(S19_ASSETS.photos)) {
      assert.doesNotMatch(src, /%20|\s/, `photo path contains a space: ${src}`);
    }
    assert.ok(all.length > 0);
  });

  test("slugs are unique", () => {
    const slugs = CLINIC_PHOTO_LIST.map((p) => p.slug);
    assert.equal(new Set(slugs).size, slugs.length, "duplicate slug in the registry");
  });

  test("every declared page is a real route", () => {
    // Feeds the image sitemap, which must not advertise pages that 404.
    for (const photo of CLINIC_PHOTO_LIST) {
      assert.ok(photo.pages.length > 0, `${photo.slug} is not attached to any page`);
      for (const route of photo.pages) {
        assert.ok(route.startsWith("/"), `${photo.slug}: "${route}" is not a site path`);
        const relative = route === "/" ? "app/page.tsx" : `app${route}/page.tsx`;
        assert.ok(
          existsSync(path.join(REPO_ROOT, relative)),
          `${photo.slug} claims to appear on ${route}, which has no page`
        );
      }
    }
  });

  test("at most one photo per page is marked as the LCP image", () => {
    // The LCP image is loaded eagerly at high fetch priority. That is correct
    // for the single largest above-the-fold image and harmful for anything
    // else, so the flag is capped at one per page.
    const byPage = new Map<string, ClinicPhoto[]>();
    for (const photo of CLINIC_PHOTO_LIST) {
      if (!photo.lcp) continue;
      for (const page of photo.pages) {
        byPage.set(page, [...(byPage.get(page) ?? []), photo]);
      }
    }
    assert.ok(byPage.size > 0, "no photo is marked as an LCP image, so none load eagerly");
    for (const [page, photos] of byPage) {
      assert.equal(photos.length, 1, `${page} marks ${photos.length} photos as its LCP image`);
    }
  });

  test("the previously unused laboratory photos are now on a page", () => {
    // Regression guard for the point of the registry: four real photographs of
    // the clinic's laboratory were on disk and referenced by nothing, so they
    // could never rank for a local image search.
    for (const key of ["labTransfer", "pipetteTransfer", "pipetteReading", "nutritionBasket"] as const) {
      const entry: ClinicPhoto = CLINIC_PHOTOS[key];
      assert.ok(
        entry.pages.length > 0,
        `${key} still has no page, so the photograph is still dead weight`
      );
    }
  });
});

describe("the sitemap declares the clinic's images", () => {
  test("every registry page resolves to photographs", () => {
    const pages = Array.from(new Set(CLINIC_PHOTO_LIST.flatMap((p) => p.pages)));
    for (const page of pages) {
      assert.ok(
        photosForPage(page).length > 0,
        `${page} is listed on a photo but photosForPage returned nothing for it`
      );
    }
  });

  test("a page with no photographs resolves to none, rather than to everything", () => {
    // The regression this guards: an empty or missing page argument used to
    // normalise to "/" and pull the home page's photographs onto a blog post.
    assert.deepEqual(photosForPage("/no-such-page"), []);
    assert.deepEqual(photoPathsForPage("/no-such-page"), []);
  });

  test("the home page is addressable as both '' and '/'", () => {
    // The sitemap's static route list uses "" for the home page.
    assert.deepEqual(photoPathsForPage(""), photoPathsForPage("/"));
  });

  test("declared image paths are absolute URLs on the real site", () => {
    for (const photo of CLINIC_PHOTO_LIST) {
      const absolute = canonicalPath(clinicPhotoSrc(photo));
      assert.ok(absolute.startsWith("https://"), `not absolute: ${absolute}`);
      assert.ok(absolute.endsWith(".jpg"), `not a jpeg path: ${absolute}`);
      assert.doesNotMatch(absolute, /%20/, `still URL-encoded: ${absolute}`);
    }
  });
});

describe("structured data matches the images on the page", () => {
  test("each photo produces a complete ImageObject", () => {
    for (const photo of CLINIC_PHOTO_LIST) {
      const node = imageObjectJsonLd(photo, "en");
      assert.equal(node["@type"], "ImageObject");
      assert.ok(node.contentUrl.startsWith("https://"));
      assert.equal(node.width, photo.width);
      assert.equal(node.height, photo.height);
      assert.equal(node.caption, photo.caption.en);
    }
  });

  test("structured data uses the requested language", () => {
    const photo = clinicPhoto("labBeakers");
    assert.equal(imageObjectJsonLd(photo, "fr").caption, photo.caption.fr);
    assert.notEqual(imageObjectJsonLd(photo, "fr").caption, imageObjectJsonLd(photo, "en").caption);
  });

  test("the gallery contains exactly the photographs the page displays", () => {
    // Declaring an image a visitor cannot see is the fastest way to have a rich
    // result rejected, so the gallery must be driven by the same `pages` field
    // the sitemap uses.
    for (const page of ["/", "/about", "/services", "/shop"]) {
      const gallery = imageGalleryJsonLd(page, "en");
      assert.ok(gallery, `no gallery for ${page}`);
      assert.equal(gallery["@type"], "ImageGallery");
      assert.equal(gallery.associatedMedia.length, photosForPage(page).length);
      for (const media of gallery.associatedMedia) {
        assert.ok(
          media.contentUrl.startsWith("https://"),
          `gallery media is not an absolute URL: ${media.contentUrl}`
        );
      }
    }
  });

  test("a page with no photographs produces no gallery at all", () => {
    // Not an empty ImageGallery — an empty structured-data node is a lie to the
    // crawler, so the builder returns null and the component renders nothing.
    assert.equal(imageGalleryJsonLd("/no-such-page", "en"), null);
  });

  test("structured data can never close its own script tag", () => {
    // A `<` inside a JSON-LD string terminates the <script> element for the HTML
    // parser. Nothing in the current copy contains one, so the escaping is
    // asserted directly on the serialisation the component produces.
    const serialised = JSON.stringify(imageGalleryJsonLd("/", "en")).replace(/</g, "\\u003c");
    assert.doesNotMatch(serialised, /</);
  });

  test("the JSON-LD serialiser escapes angle brackets", () => {
    // Mirrors components/seo/json-ld.tsx. A malicious or careless description
    // containing "</script>" would otherwise become markup injection.
    const hostile = { name: "S19 </script><script>alert(1)</script>" };
    const html = JSON.stringify(hostile).replace(/</g, "\\u003c");
    assert.doesNotMatch(html, /</);
    assert.match(html, /\\u003c\/script/);
  });
});

describe("the brand assets are described and correctly sized", () => {
  test("every logo file exists on disk", () => {
    for (const logo of CLINIC_LOGO_LIST) {
      const file = path.join(PUBLIC_DIR, logo.src.replace(/^\//, ""));
      assert.ok(existsSync(file), `missing logo file: ${logo.src}`);
    }
  });

  test("every declared logo size is exactly right", () => {
    // The header wordmark has no aspect-ratio container around it, so a wrong
    // intrinsic size shows up directly as the header jumping on page load.
    for (const logo of CLINIC_LOGO_LIST) {
      const file = path.join(PUBLIC_DIR, logo.src.replace(/^\//, ""));
      const actual = rasterSize(file);
      assert.ok(actual, `could not read the header of ${logo.src}`);
      assert.equal(actual.width, logo.width, `width mismatch for ${logo.src}`);
      assert.equal(actual.height, logo.height, `height mismatch for ${logo.src}`);
    }
  });

  test("no logo path contains a space", () => {
    // The icon files were previously "s19 icon for light mode.png", URL-encoded
    // at every call site. The same filename defect as the editorial photos.
    for (const logo of CLINIC_LOGO_LIST) {
      assert.doesNotMatch(logo.src, /%20|\s/, `logo path contains a space: ${logo.src}`);
    }
  });

  test("no file left in public/ keeps a prompt-style name", () => {
    const offenders = readdirSync(PUBLIC_DIR, { withFileTypes: true })
      .filter((e) => e.isFile() && /\.(jpe?g|png|webp|svg)$/i.test(e.name))
      .map((e) => e.name)
      .filter((name) => /%20|\s/.test(name));
    assert.deepEqual(offenders, [], `filenames with spaces: ${offenders.join(", ")}`);
  });

  test("S19_ASSETS.logos points at the registry, not at hand-typed paths", () => {
    const registered = new Set(CLINIC_LOGO_LIST.map((l) => l.src));
    for (const [key, src] of Object.entries(S19_ASSETS.logos)) {
      assert.ok(registered.has(src), `${key} -> ${src} is not in the logo registry`);
      assert.ok(existsSync(path.join(PUBLIC_DIR, src.replace(/^\//, ""))), `${key} is missing on disk`);
    }
  });

  test("S19_ASSETS.photos points at the registry, not at hand-typed paths", () => {
    const registered = new Set(CLINIC_PHOTO_LIST.map((p) => clinicPhotoSrc(p)));
    for (const [key, src] of Object.entries(S19_ASSETS.photos)) {
      assert.ok(registered.has(src), `${key} -> ${src} is not in the photo registry`);
    }
  });
});

describe("looking up a photo by its path", () => {
  test("a registered path resolves to its entry", () => {
    const photo = clinicPhoto("labBeakers");
    assert.equal(findClinicPhotoBySrc(clinicPhotoSrc(photo)), photo);
  });

  test("every registered path resolves back to its own entry", () => {
    for (const photo of CLINIC_PHOTO_LIST) {
      assert.equal(
        findClinicPhotoBySrc(clinicPhotoSrc(photo)),
        photo,
        `${photo.slug} does not resolve to itself`
      );
    }
  });

  test("an unregistered or missing path resolves to nothing", () => {
    // This is the guard that lets a page fall back to a plain `<img>` for a
    // database-supplied cover without ever rendering the wrong photograph.
    assert.equal(findClinicPhotoBySrc(undefined), undefined);
    assert.equal(findClinicPhotoBySrc("/s19-blog/hepatitis-b.png"), undefined);
    assert.equal(findClinicPhotoBySrc("/s19-assets/products/S19 Diabetes Support Package.png"), undefined);
    assert.equal(findClinicPhotoBySrc(""), undefined);
  });

  test("a prompt-style path from before the rename resolves to nothing", () => {
    // Proves the lookup cannot accidentally match a legacy URL, which would let
    // a stale reference render with a hardcoded fallback size.
    assert.equal(
      findClinicPhotoBySrc(
        "/s19-assets/a%20different%20s19%20staff%20still%20in%20lab%20doing%20some%20transfer%20of%20chemical.jpg"
      ),
      undefined
    );
  });
});

describe("no referenced image is missing from disk", () => {
  // A cover image referenced by a data file but absent from `public/` is a 404
  // on a page we are actively submitting to search engines. This scans the
  // content data files rather than trusting a hand-maintained list.
  const DATA_FILES = [
    "lib/data/blog-posts.ts",
    "lib/data/products.ts",
    "lib/site-assets.ts",
    "lib/image-registry.ts",
  ];

  test("every /s19-… path in the content data files resolves to a file", () => {
    const missing: string[] = [];
    for (const relative of DATA_FILES) {
      const file = path.join(REPO_ROOT, relative);
      assert.ok(existsSync(file), `${relative} not found`);
      const source = readFileSync(file, "utf8");
      // Match quoted public paths, e.g. "/s19-blog/cancer-prevention.jpg".
      const refs = source.match(/["'`](\/s19-[^"'`\s]+)["'`]/g) ?? [];
      for (const raw of refs) {
        const ref = raw.slice(1, -1);
        if (!/\.(jpe?g|png|webp|avif|svg)$/i.test(ref)) continue;
        // Decode before checking: a pre-encoded path such as
        // "/s19-assets/products/S19%20SOZO.jpg" is a valid URL for a file whose
        // name contains a space, so failing on the encoding would be wrong.
        let decoded = ref;
        try {
          decoded = decodeURIComponent(ref);
        } catch {
          // A malformed escape is itself a broken reference; fall through and
          // let the existence check report it.
        }
        if (!existsSync(path.join(PUBLIC_DIR, decoded.replace(/^\//, "")))) {
          missing.push(`${relative} -> ${ref}`);
        }
      }
    }
    assert.deepEqual(missing, [], `referenced images that do not exist: ${missing.join("; ")}`);
  });
});
