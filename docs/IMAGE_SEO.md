# M17 — Image SEO audit and fixes

Status: **complete in code.** One external item remains (Search Console verification, §7).

Everything below was found by reading the actual files and the actual bytes on disk, not by
assuming. Where a change is deliberately *not* made, the reason is given — this is the part of
the audit that matters, because "convert every `<img>`" is not a correct goal on its own.

---

## 1. What was actually wrong

| # | Finding | Why it costs ranking or traffic |
|---|---|---|
| 1 | **All 12 editorial photographs were named after the prompts used to generate them.** e.g. `a different s19 staff still in lab doing some transfer of chemical all dresses in proper lab outfit with gloves.jpg` | Google Images treats the filename as a relevance signal. That string matches no query anyone types. It is also an unprofessional URL shown in every search result and every share. |
| 2 | **Two logo icons had spaces in their filenames** (`s19 icon for light mode.png`) | Same defect. Brand images matter for image search on the clinic's name. |
| 3 | **No intrinsic dimensions on any image.** Every page used a bare `<img>` with no `width`/`height`. | Cumulative Layout Shift — a Core Web Vitals metric and a ranking input. The blog post cover had no aspect-ratio container either, so every article was visibly shoved down as the cover loaded. |
| 4 | **No `next/image` anywhere in the site.** No WebP/AVIF negotiation, no `srcset`. | A 360px phone downloaded the full 1080px JPEG. Direct page-speed cost, and Core Web Vitals feed ranking. |
| 5 | **Five hero images rendered with an empty `alt`.** (`/terms`, `/privacy`, `/cookies`, `/refund-and-returns`, `/track`) | Told search engines the photograph carried no information, and left screen-reader users with nothing. |
| 6 | **Home page alt text was hardcoded English only**, on a bilingual site. | A French visitor's alt described a scene in a language they did not choose. French-language image search got nothing to match on. |
| 7 | **Four photographs were on disk and referenced by nothing.** (`labTransfer`, `pipetteTransfer`, `pipetteReading`, `nutritionBasket`) | Good, well-lit photographs of the clinic's laboratory that could never appear in Google Images because nothing linked to them. Pure lost opportunity. |
| 8 | **No image sitemap.** | Google finds images through links; a photograph used only as a CSS background or on one page is slow to be discovered and associated. |
| 9 | **No `ImageObject` structured data.** | Google has no name or description to show beside an image result. |
| 10 | **Blog covers were hardcoded copies of the prompt filenames in `lib/data/blog-posts.ts`, and the same values were copied into MongoDB by `seed-blog.ts`.** | Caught by the new test the moment the files were renamed: renaming a photo silently broke every post that used it. The seed file is fixed and now derives paths from the registry, but **four published posts in the live database still hold the old filenames** and are 404s. Repair script written, dry-run verified, waiting on your go-ahead. |
| 11 | **Hardcoded English alt text on the home page** (three photos) and `page-hero.tsx` defaulted `alt` to `""`. | A default of `""` meant forgetting to pass alt was invisible. |

---

## 2. What changed

### A. One registry, verified against the bytes

`lib/image-registry.ts` is the single place a clinic photograph is described: slug, intrinsic
width and height, alt text in **both** languages, caption in both languages, the pages it appears
on, and whether it is that page's Largest Contentful Paint element.

`src` is **derived from the slug**, never typed out. `lib/site-assets.ts` and
`lib/data/blog-posts.ts` now compute their paths from the registry, which is what makes the
filename-drift bug structurally impossible rather than merely fixed once.

`tests/image-seo.test.ts` parses the real JPEG/PNG headers of every file and asserts the
declared dimensions are exactly right. A registry that disagrees with the filesystem is worse
than none, because it makes images *look* described while Google indexes a 404.

### B. Filenames renamed

All 12 photographs moved from prompt text to descriptive slugs:

```
s19-herbal-clinic-shop-counter-bafoussam.jpg
s19-clinic-patient-records-bafoussam.jpg
s19-herbal-clinic-consultation-bafoussam.jpg
s19-clinic-blood-pressure-check-bafoussam.jpg
s19-herbal-clinic-laboratory-beakers.jpg
s19-laboratory-liquid-transfer.jpg
s19-laboratory-pipette-transfer.jpg
s19-laboratory-pipette-reading.jpg
s19-clinic-electrotherapy-treatment.jpg
s19-herbal-products-display-shelf.jpg
s19-nutrition-health-education-clinic-staff.jpg
s19-nutrition-health-education-workshop.jpg
```

Plus `s19-icon-for-light-mode.png` and `s19-icon-for-dark-mode.png`.

Files were **moved, not re-encoded** — no bytes changed, no visual regression possible.

### C. `next/image` where the dimensions are knowable

| Component | Change |
|---|---|
| `components/ui/page-hero.tsx` | `<img loading="eager">` → `<Image fill sizes="100vw" loading="eager" fetchPriority="high">`. **This one change covers 18 hero images across 14 pages.** |
| `app/page.tsx` | 3 full-bleed photographs → `ClinicPhotoFill`, alt localised |
| `app/programs/page.tsx`, `app/patient-stories/page.tsx`, `components/auth/coming-soon.tsx` | → `ClinicPhotoFill` |
| `components/layout/site-header.tsx`, `site-footer.tsx`, `components/auth/auth-shell.tsx` | wordmark → `ClinicLogoImage` with real dimensions |
| `components/ui/site-loader.tsx` | icon → `next/image` |
| `app/blog/[slug]/page.tsx` | cover → `next/image` **when the cover is a registry photograph**; conditional, explained in the file |

**Next 16 note.** `priority` is deprecated in favour of `preload`, and Next's own guidance is to
prefer `loading="eager"` with `fetchPriority="high"` in most cases — `preload` injects a `<link>`
into the head and is only correct when there is exactly one LCP candidate. This site has a hero
plus several full-bleed bands that can each be the largest depending on viewport, so the
`loading` + `fetchPriority` pattern is used. The registry field is named `lcp`, not `priority`, so
it means "the page's LCP image" rather than "which framework prop to set".

### D. Empty and English-only alt text fixed

Five empty hero alts now have bilingual alt text (`terms.hero.alt`, `privacy.hero.alt`,
`cookies.hero.alt`, `refund.hero.alt`, `track.hero.alt`). The home page's three photographs now
take their alt from the registry in the visitor's language.

### E. Image sitemap

Next 16's `MetadataRoute.Sitemap` supports an `images` field natively, so `app/sitemap.ts` declares
them — no hand-written XML to maintain. **54 image entries are being emitted**, verified in the
build output:

- the editorial photographs each page actually displays
- every blog post's cover (read from the DB, with the static seed list as fallback)
- every product's photograph

### F. `ImageObject` / `ImageGallery` structured data

`imageObjectJsonLd()` and `imageGalleryJsonLd()` in `lib/seo.ts`, rendered via
`components/seo/json-ld.tsx` on the home page and the About page. Both read from the registry, so
the structured data cannot claim an image the page does not display — the fastest way to get a
rich result rejected. `JsonLd` escapes every `<` as `\u003c`; a `<` inside a `<script>` body
closes the element for the HTML parser.

### G. The four orphaned photographs are now on a page

An "Inside the clinic" gallery on the About page (`about.gallery.*`), which is the natural home
for laboratory and nutrition-education photography. Those images were previously dead weight on
disk.

---

## 3. What was deliberately left as `<img>`, and why

This is the part of an audit that is easy to get wrong. "Zero `<img>` tags" is not a goal.

| Location | Reason |
|---|---|
| `components/blog/blog-explorer.tsx`, `components/health-library/library-explorer.tsx`, `components/blog/article-body.tsx` | Covers come from the database. Their intrinsic size is not knowable at build time, and the host is not knowable — `next/image` **hard-errors on a host outside `remotePatterns`**. Trading "slightly heavier image" for "an admin typo takes the page down" is the wrong trade. All are inside fixed aspect-ratio containers, so **there is no CLS**, and all now carry `loading`/`decoding` hints. |
| `components/account/*`, `components/admin/*` (~12 images) | Behind authentication — never crawled, never indexed. Several are patient-uploaded photographs whose dimensions are unknown. Not an SEO surface. |
| `app/page.tsx` nav icons, decorative `alt=""` images | Correctly marked decorative with `alt=""` + `aria-hidden`. Optimising a 1 KB icon is not worth a network request to the optimiser. |

Lint now reports **20 warnings instead of 25**, all 20 accounted for above. Zero errors.

---

## 4. Tests

`tests/image-seo.test.ts` — **29 tests**, raising the suite from 82 to **124 passing**.

They assert, against the real filesystem:

- every registered file exists; declared dimensions match the real JPEG/PNG header exactly
- no file in `public/s19-assets/` is left undescribed, so a prompt-named file cannot reappear
- no filename anywhere in `public/` contains a space
- every `S19_ASSETS` path is derived from the registry, not hand-typed
- alt text is present, non-trivial, genuinely translated (not English copied into the FR slot),
  more than a restatement of the filename, and free of cure claims
- every `pages` entry is a real route in `app/`
- at most one LCP image per page
- every `/s19-…` path referenced by the content data files resolves to a file that exists
  (this is the check that caught the broken blog covers)
- structured data contains exactly the photographs the page displays, and nothing for a page
  with none

---

## 5. What I could not verify

Honest limits on this work:

- **No Search Console, no live rankings.** Everything here is a well-established ranking
  factor applied correctly, but I cannot show you a traffic number until the site is verified.
- **No visual regression check.** I did not compare rendered output pixel-by-pixel. The photo
  renames are byte-identical moves, but the `page-hero` and home-page `<img>` → `Image` swaps do
  change the DOM. **Worth a look on staging before deploy.**
- **`next/image` adds build-time and first-request cost.** Vercel's image optimiser is fast but it
  is not free. With 12 photographs and ~30 products this is negligible, but if image traffic ever
  becomes a large share of hits, the `images.formats` / `deviceSizes` defaults in
  `next.config.ts` are the knob to revisit.

---

## 6. Follow-ups not done, and why

| Item | Why it was left |
|---|---|
| **Rename the 30 product images** (`S19 Diabetes Support Package.png`, spaces, accents, parentheses, 200–570 KB PNGs) | They are referenced from MongoDB documents. Renaming the files alone would break the shop; renaming them properly needs a data migration and a re-upload, which is a deliberate, reversible operation I should not run against a live catalogue unsupervised. **This is the single largest remaining image-SEO win and it needs your go-ahead.** |
| **Re-encode oversized PNGs** (`silent-killer.png` 1067 KB, `open-graph-thumbnail.png` 989 KB, `hepatitis-b.png` 842 KB) | Same reason — `open-graph-thumbnail.png` in particular should be a JPEG, and it is the image every social share uses. Needs a migration script and your approval. |
| **Convert `open-graph-thumbnail.png` and add per-page OG images** | `next/og` can generate them at request time from brand copy. Worth doing; a separate change. |
| **Add `image:title` / `image:caption` to the sitemap** | Next's built-in `images` field emits only `<image:loc>`. A hand-written route could add the rest — but the same text is already carried by `ImageObject`, so nothing is actually lost and the framework-native path is the one less likely to be wrong. |

---

## 7. The one thing that needs you

### 7.1 Run the blog cover repair (live data)

Four published posts have 404 cover images because the database still holds the pre-rename
filenames. **`npm.cmd run fix:blog-covers` is a dry run and writes nothing.** Run it, check it
reports `Covers needing repair: 4`, then add `-- --apply`.

### 7.2 Google Search Console verification

Until the site is verified there is no way to measure any of this: no image queries, no
click-through, no confirmation that the sitemap was accepted.

This is a DNS TXT record, so it is your action, not mine — about 20 minutes:

1. Go to <https://search.google.com/search-console>
2. Add a **Domain** property for `s19herbalclinic.com` (not a URL prefix — the domain property
   covers all subdomains and both the `www` and apex hosts, which the sitemap currently mixes)
3. Copy the TXT record it gives you
4. Add it in your DNS provider
5. Tell me when it has propagated and I will verify it and check that the sitemap and robots are
   accepted

**While you are there, note one thing to check:** the sitemap currently emits
`https://www.s19herbalclinic.com/...` (from `NEXT_PUBLIC_SITE_URL`). Confirm that is the host you
want canonicalised. If the apex is canonical instead, that environment variable needs changing —
and it affects every canonical URL, Open Graph tag and hreflang alternate on the site, not just
the sitemap.

### 7.3 Decide on the product images

The 30 product images still have their original filenames (spaces, accents, parentheses) and are
PNG at 200–570 KB each. They are referenced from MongoDB, so the rename needs a data migration
like §7.1. **It is the largest remaining image-SEO win on the site** — 146 URL-encoded paths
currently sit in the sitemap. Say the word and I will build it the same way: dry run first.

### 7.4 Look at it on staging

The `<img>` → `Image` conversions change the DOM. Please eyeball the home page, one hero page
and one About page on staging before deploying. The photograph files themselves are unchanged
bytes, so nothing can have shifted visually — but the rendered markup is different.
