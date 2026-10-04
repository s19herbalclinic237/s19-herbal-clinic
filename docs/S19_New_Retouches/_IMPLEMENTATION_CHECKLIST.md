# S19 New Retouches — Developer Implementation Checklist

Tracking document. `S19_Final_Whole_Site_Master_Developer_Checklist.md` is the control
document: it sets priority, consistency rules and launch verification, and defers all
exact copy to the individual guides. This file records what has actually been
implemented, in the order the master checklist §20 prescribes.

## Order of work (master checklist §20)

| # | Guide | Status |
|---|-------|--------|
| 1 | `S19_Sitewide_Footer_Navigation_Consistency_Developer_Guide.md` | DONE — items 01 & 13 closed by guide 2 |
| 2 | `S19_FAQ_Page_Concise_Updated_v2.md` | DONE — awaiting S19 verification |
| 3 | `S19_Contact_Accommodation_…` + `S19_TeleHealth_…` + `S19_Cameroon_International_Delivery_…` | DONE — awaiting S19 verification; blog seed re-run outstanding |
| 4 | `S19_Shop_Herbal_Catalog_Copy_Paste_Developer_Guide.md` | DONE - awaiting S19 verification |
| 5 | `S19_Patient_Stories_…` | not started |
| 6 | `S19_Terms_Privacy_…` | not started |
| 7 | `S19_Patient_Portal_Developer_Recommendations.md` | not started |
| — | Blog article rewrites + S19 Clinical Observations addendum | no guide file in this folder |

Workflow: one guide at a time — implement fully, typecheck / lint / test / build,
then stop for S19 verification before the next guide.

---

## Guide 1 — Site-wide Footer & Navigation Consistency

### Audit of current state (before editing)

| Item | Requirement | Found on site | Action |
|------|-------------|----------------|--------|
| 01 | FAQ in main nav | no `/faq` route existed at the time | DEFERRED → done in guide 2 |
| 02 | `BOOK A CONSULTATION` as principal CTA | `common.bookConsultation` = "Book Consultation"; `programs.bookCta` = "Book a consultation" | CHANGE |
| 03 | `TALK TO S19 ON WHATSAPP` | `common.whatsappDr` = "WhatsApp / Dr Consultation"; also home hero, contact, product CTA | CHANGE |
| 04 | `Integrative Cancer Support` in footer | already correct (`footer.cancer`) | ALREADY DONE |
| 05 | New footer mission sentence | `CLINIC.mission` = "To provide safe, natural and effective herbal solutions…" | CHANGE |
| 06 | Clinic contact details standardised | address / phone / email already match the guide exactly | VERIFIED, no change |
| 07 | One compact site-wide delivery line | absent from the footer | ADD |
| 08 | Legal links discoverable | present, but two labels differ from the guide's exact copy | CHANGE |
| 09 | Terms shipping wording | "worldwide via express courier" | CHANGE |
| 10 | Shop header delivery wording | "pickup in Bafoussam and worldwide delivery" | CHANGE |
| 11 | Tele-Health safety principle | not present on `/telehealth`; **two places call S19 an emergency line** | CHANGE |
| 12 | Accommodation discoverable | present on `/contact#accommodation`, no "subject to availability" qualifier | CHANGE |
| 13 | FAQ linked from footer | no `/faq` route existed at the time | DEFERRED → done in guide 2 |
| 14 | EN/FR parity | every change below carries both locales | CHANGE |

### Blocking compliance violations found

- `contact.phoneSub` = "Tele-Health emergency line 24/7"
- `location.info.hoursLine3` = "Tele-Health emergency line 24/7 via WhatsApp"

Both directly contradict guide §17 "Do not call S19 an emergency service" and
§11 "Do not describe WhatsApp, messaging or Tele-Health as an emergency line."

### Regression found in the previous commit

`tests/public-content-guard.test.ts` asserts `careComponents.length === 8` and
`personalizedCareElements.length === 8`. The in-clinic device entries added in
`fa6f9bf` made both lists 9. `npm test` fails 2 of 345. The counts are intentional,
so the tests are what move.

### Deliberately out of scope for this guide

Delivery wording on `/programs` FAQ, `/location` logistics block, `deliveryZones` and
the checkout `Worldwide Delivery` mode belong to
`S19_Cameroon_International_Delivery_Copy_Paste_Developer_Guide_UPDATED.md` and the
Shop catalog guide. Changing them here would collide with those. Recorded, not edited.

The three surviving "worldwide delivery" claims are listed in "Open questions" below.

---

## Guide 2 — FAQ Page (v2)

### What was built

| Item | Requirement | Action |
|------|-------------|--------|
| Hero | eyebrow / title / lead / sub, exact copy | ADD `faq.hero.*` |
| 22 questions | exact approved wording, 7 sections, exact order | ADD `lib/data/faq.ts` |
| Accordion | mobile-friendly | native `<details>`, same pattern as the home FAQ strip |
| Mid-page CTA | after Question 14 | `FAQ_MID_CTA_AFTER = 14`, injected by question number |
| Final CTA | after Question 22 | end of page |
| Contextual links | Refund Policy / Tele-Health / Programs / Shop "where contextually useful" | per-question `links` chips |
| EN/FR parity | "if both versions are published" | every question, answer, heading and link label translated |
| Discoverability | not buried in the patient account | nav item + footer link + sitemap |

### Files

- `lib/data/faq.ts` (new) — the 22 questions. Answers are `string[]` paragraphs, not
  one string: Q13 on cancer is four separate claims that must not collapse.
- `app/faq/page.tsx` (new) — hero, section headings, accordion, two CTA blocks.
- `lib/i18n.ts` — `faq.metaTitle`, `faq.metaDescription`, `faq.hero.*`, `faq.midCta.text`,
  `faq.finalCta.*`, `nav.faq`, `footer.faq`.
- `components/layout/site-header.tsx` — nav entry (closes guide 1 item 01).
- `components/layout/site-footer.tsx` — footer link (closes guide 1 item 13).
- `app/sitemap.ts` — `/faq`, priority 0.8.
- `lib/image-registry.ts` — `/faq` added to the `consultationAdvice` photo, so the image
  sitemap declares the hero.
- `tests/public-content-guard.test.ts` — 10 new assertions, 345 → 355.

### Decisions taken

1. **Question wording follows guide 1, not guide 2, on WhatsApp labels.** Guide 2's
   final CTA says `CHAT ON WHATSAPP`; guide 1 item 03 standardised general WhatsApp
   links to "Talk to S19 on WhatsApp". Guide 1 is the sitewide consistency authority and
   is already implemented, so all three CTA blocks use its label. Flagged to S19.
2. **Answers are not rewritten.** The guide's DO NOT IMPROVISE list forbids adding
   medical claims or strengthening wording. Every answer is the approved text.
3. **Contextual links are chips, not inline.** Interpolating a link into an approved
   sentence would edit that sentence. The links render beneath the answer instead.
4. **Section headings are `<h2>`, not `<Kicker>`.** `Kicker` renders a `<p>`, which left
   a page of 22 questions with no document outline at all.
5. **Questions are not wrapped in `<h3>`.** `<summary>` is only a disclosure widget as
   the first child of `<details>`; nesting it in a heading changes that in some browsers.

### Verification (all clean)

- `tsc --noEmit` — 0 errors
- `eslint app components lib tests` — 0 errors, 19 pre-existing warnings
- `npm test` — 355/355
- `next build` — succeeds, `/faq` present
- Rendered `/faq` in both locales: 22 `<details>`, question numbers 1–22 in order,
  8 `<h2>`, 1 `<h1>`, mid CTA between Q14 and Q15, final CTA after Q22, no EN/FR bleed.
- Nav link, footer link and sitemap `<loc>` all confirmed in the built output.

### Open question for S19

Three "worldwide delivery" claims survive guide 1 and belong to the Cameroon /
International Delivery guide (step 3), which will have approved copy for them. Left
unedited rather than improvised:

| Location | Text |
|----------|------|
| `lib/data/programs.ts:319` (home FAQ answer) | "worldwide via express courier" |
| `lib/i18n.ts` `shop.metaDescription` | "worldwide delivery" |
| `app/location` logistics block | `location.info.logisticsLine2`, `location.deliver.infoText`, `location.cta.text` |
| `checkout` delivery mode label | "Worldwide Delivery" |

All four are resolved in guide 3 below.

---

## Guide 3 — Contact & Accommodation / Tele-Health / Cameroon & International Delivery

Three guides implemented in one pass. The delivery guide is the sitewide authority on
what S19 may claim about shipping, so its rules were applied across every page, not
only the ones it names.

### 3a — Contact & Accommodation

| Item | Action |
|------|--------|
| `contact.phoneSub` | "Tele-Health emergency line 24/7" → "For appointments, enquiries & Tele-Health support" (guide 1's wording superseded by this guide's) |
| `contact.accommodation.text` | comma fix |
| `contact.accommodation.includes` | ADD — the perk cards implied the Starlink and cable-TV inclusions but never stated them |
| `contact.accommodation.note` | "subject to availability" → the guide's sentence: "Room availability and accommodation charges should be confirmed before travelling." |
| `booking.city` + `booking.cityPlaceholder` | ADD — one free-text field, not two selects, so a patient can type a town S19 has not heard of |
| `booking.submit` | → "Submit & Continue on WhatsApp" |
| `booking.connectDr` | "Connect with Dr on WhatsApp" → "Continue on WhatsApp" |
| `contact.noTravel.*` (8 keys) | ADD — the "Can't travel to Bafoussam?" section, placed after Accommodation |

Plumbing for the new field: `app/api/contact/route.ts` accepts and persists `city`,
`lib/models/Inquiry.ts` gained an optional `city`, `lib/email.ts`
`sendBookingNotification` gained `city` and a "City / Country" row. A field that is
collected but dropped server-side is not a field.

### 3b — Tele-Health adjustment brief

| Item | Action |
|------|--------|
| `telehealthSteps[0]` "Remote Health Assessment" | ADD medications and "other relevant medical records" to the review list (EN + FR) |
| `tele.modality2.text` | "detailed herbal strategy review" → "detailed health and treatment-plan review" |
| `tele.modalities.text` | "Everything you would get from an in-clinic visit" → "Comprehensive S19 consultation and follow-up, wherever you are." |
| `tele.price.approx` | ADD — the USD/EUR equivalents are now visibly approximate |
| `tele.delivery.*` (7 keys) + section | ADD — after the modalities, before the booking block |
| `tele.adv12` | de-DHL'd |
| `tele.meta.description` | de-worldwide, de-DHL'd |
| telehealth meta keywords | `herbal medicine worldwide delivery` / `DHL herbal medicine shipping` → `herbal medicine delivery Cameroon` / `international herbal shipping` |

`telehealthSteps[1]` "Tailored Herbal Dispatch" is kept verbatim per §1 of the brief.
`tele.delivery` therefore *qualifies* that step rather than contradicting it.

### 3c — Cameroon & International Delivery

The four claims guide 1 deferred are all resolved, plus a wider sweep than the guide
names. `lib/seo.ts` turned out to hold the strongest delivery claims on the site.

| Location | Was | Now |
|----------|-----|-----|
| `shop.meta.description` | "worldwide delivery" | "delivery across Cameroon and to supported international destinations" |
| `location.meta.description` | "worldwide" | as above |
| `location.info.logisticsLine2` | "worldwide via express courier" | supported-destinations phrasing |
| `location.deliver.infoText` | "worldwide" | as above |
| `location.cta.text` | "worldwide" | as above |
| `home.hero.trust` | "Worldwide product delivery" | "Delivery across Cameroon and to supported international destinations" (Cameroon first, per DO NOT CHANGE) |
| `home.catalog.lead` | "get it delivered anywhere in the world" / "en livraison mondiale" | delivery across Cameroon, or shipping to supported international destinations |
| `checkout.mode3.title` | "Worldwide Delivery" | "International Delivery — supported destinations" |
| `lib/data/programs.ts` strength | "Worldwide" | "International" |
| `deliveryZones` last chip | "Worldwide" | "Supported Destinations" |
| `faqs[1]` answer, `careBeyond` | "worldwide" | supported-destinations phrasing |
| **`lib/seo.ts` `areaServed`** | **"Worldwide (international DHL shipping)"** | **"Supported International Destinations"** |
| **`lib/seo.ts` Organization `description`** | **"worldwide DHL shipping"** | **"delivery across Cameroon and shipping to supported international destinations"** |
| **`lib/seo.ts` `SEO_KEYWORDS`** | **"herbal medicine worldwide shipping"** | **"herbal medicine delivery Cameroon" + "international herbal shipping"** |
| **`app/layout.tsx` root description** | **"worldwide DHL shipping"** | as above |
| **`app/page.tsx` description / OG / Twitter** | **"worldwide DHL shipping"** | as above |
| **`lib/data/blog-posts.ts`** | **"ship our products to any country with a DHL service" ×18 (EN + FR)** | **"ship our products to supported destinations"** |

New `shop.delivery.*` (8 keys) + block directly below the product grid.

**The four bolded rows were not in any guide.** They were found by grepping the served
HTML for the guide's own forbidden phrases after the page copy was already clean. The
JSON-LD Organization node is emitted on every page and is what search engines read, so
it was making a wider promise than any sentence on the site. A keyword is also a promise
made to a crawler.

`app/refund-and-returns/page.tsx` names DHL, UPS, Musango, Avenir and General Express.
Deliberately **not** changed: it is a liability disclaimer listing third parties rather
than a coverage claim, and that page is owned by guide 6.

### Decisions taken

1. **Two approved-but-different international wordings are left unmerged.** The contact
   guide approves "USA, Canada, UK, UAE"; the delivery guide approves the long form
   "United States (USA), Canada, United Kingdom (UK), United Arab Emirates (UAE),
   selected countries across Africa". Both say "supported destinations" and both are
   S19-approved. Merging them would mean inventing a third wording. Flagged to S19.
2. **`EXCHANGE.fcfaPerUsd` was not changed.** The brief's reference figure is US$17.20;
   the site renders ~US$16.67 at the current rate of 600 FCFA/USD, and the EUR figure
   matches to the cent. Changing the shared constant would reprice every product on the
   site, which is well outside "TELE-HEALTH PAGE ONLY". `tele.price.approx` was added
   instead. **Flagged to S19 — see Open questions.**
3. **`booking.connectDr` was renamed.** The guide forbids implying that every submission
   reaches the doctor immediately; the success-state button made that promise one click
   after the submit button stopped making it.
4. **`checkout.mode3.title` label changed, stored value kept.** The persisted enum is
   `"Worldwide Delivery"` in `lib/models/Order.ts`; renaming it would orphan existing
   orders.
5. **`contactPoint.areaServed: "Worldwide"` was left alone.** That is the clinic's
   *consultation* reach, which is genuinely worldwide via Tele-Health, and the delivery
   guide governs delivery claims. Flagged to S19.

### Verification

- `tsc --noEmit` — 0 errors
- `eslint app components lib tests` — 0 errors, 19 pre-existing warnings
- `npm test` — 388/388
- `next build` — succeeds
- Rendered `/contact`, `/telehealth`, `/shop`, `/location`, `/`, `/faq`, `/checkout`,
  `/blog`, `/programs`, `/about` in EN and FR via DOM fetch (`cookie: s19_locale=fr`):
  208 assertions pass, 45 fail — all 45 are the blog article bodies described under
  Open questions.

### New tests (`tests/public-content-guard.test.ts`, 355 → 388)

Three suites: the delivery guide, the contact/booking guide, and the Tele-Health brief.
They pin the *claims* rather than the words, so an honest rewording still passes and a
reintroduced promise still fails:

- `EVERY_COUNTRY` matches eight phrasings, not just "worldwide". The French home catalog
  line said "en livraison mondiale" and the English one "anywhere in the world"; both
  survived earlier passes precisely because neither used the word a grep looked for.
- Carrier names are matched **case-sensitively**. A case-blind `UPS` matches "regular
  check-ups", which is what made the first version of this test fail on an unrelated
  sentence.
- One test asserts the *complement*: Tele-Health consultation reach is still worldwide,
  so a later pass cannot delete a claim S19 makes on purpose while removing the delivery
  promises.

### Open questions for S19

1. **The blog seed has to be re-run.** `/blog` and `/blog/[slug]` serve article bodies
   out of MongoDB, not out of `lib/data/blog-posts.ts`. The corrected sentence is in the
   seed file; 9 published articles still serve "ship our products to any country with a
   DHL service" until `npm run seed:blog` runs against the database. **Not run** — the
   script upserts every field of all 12 articles, so any edit made only in the database
   would be overwritten. That is S19's call.
2. **The USD figure.** See decision 2 above.
3. **Two international wordings.** See decision 1 above.
4. **`booking.connectDr` renamed.** See decision 3 above.

## Guide 4 - Shop / Herbal Product Catalog

`S19_Shop_Herbal_Catalog_Copy_Paste_Developer_Guide.md`

### What the guide asked for

A preservation-first pass over the catalog. No redesign, no new products, no price
changes - ten product descriptions that made claims the guide rules out, one added
sentence in the ordering section, one new safety note, and a referral-section tweak.

### The ten rewritten products

Each description is the guide's approved paragraph, verbatim, EN and FR:

| Product | What the old copy said | Guide's reason |
|---|---|---|
| Flat Tummy & Weight Loss Tea | "Naturally burns fat... reduce belly fat" | absolute |
| Vision - Herbal Eye Drops | "support for glaucoma, cataracts, conjunctivitis" | claims treatment |
| Malaria & Typhoid Combo | "powerful... boosting the immune system" | implies part of treating |
| Liver Support (Détox Foie) | "Supports hepatitis B and C... fatty-liver" | claims treatment |
| Black Seed Oil (BSO) | seven conditions, "asthma, sinusitis, allergies" | implies independent treatment |
| Natural Bathing Soap | "Also treats... fungal infections" | claims treatment |
| Feminine Fertility Booster | "may help improve fertility" | outcome as product claim |
| Parasite Cleanse Combo | "elimination of parasites at egg, larval, and adult stages" | evidence-free efficacy |
| Man Pikin | four named dysfunctions | outcome as product claim |
| Neuro-Protect | "relief from headaches... boost memory" | outcome as product claim |

Product **names, categories, images, prices, badges, usage instructions and
ingredients are untouched** - verified mechanically against `HEAD`
(10 products changed, 4 fields each, the other 12 byte-for-byte identical).

### Decisions taken

1. **`shortDescription` is the first sentence of the approved paragraph**, for the
   ten only. The guide supplies one paragraph per product; a card shows
   `shortDescription`. Setting both fields to the same text would put two sentences on
   every card. No wording is invented - the card text is a mechanical truncation of
   approved copy - and every limitation the guide adds (eye-care evaluation, medical
   diagnosis, clinical evaluation, parasitic evaluation) survives in the full
   description on the product page. The page-level safety note covers the caveats at
   card level. **This is the one judgment call in the guide and is worth S19's eye.**
2. **The delivery block keeps its guide-3 position.** Delivery guide item 03 asked for
   it directly below the product collection; shop guide §15 asked for it close to the
   WhatsApp ordering area. Below the grid satisfies both, since the ordering section is
   the next block down. The two guides' sentences differ slightly, and the shop guide's
   now stand, being the more specific authority for this page.
3. **Items 01, 13, 17 and 18 were already satisfied** and were left alone. §1's catalog
   lead and §18's mission sentence had already been set to that exact wording in guide
   1; §17's "Integrative Cancer Support" was guide 1's footer item.
4. **`usage` and `ingredients` are left alone** on all ten. The guide covers neither,
   and §20 forbids inventing dosage instructions.
5. **The seed is not the live catalog.** `/shop` and `/shop/[slug]` read MongoDB first
   (`lib/catalog.ts`) and only fall back to `lib/data/products.ts`, so editing the seed
   alone changes nothing a customer sees. New `scripts/backfill-product-copy.ts`
   writes only the four description fields on the ten named products.

### The backfill script - why it is not `npm run seed`

`scripts/seed.ts` does `Product.deleteMany({})` then `insertMany`. Running it would
discard stock levels, reorder thresholds and targets, `createdAt` (which drives the
catalog sort order), and any admin-panel edits. The new script is dry-run by default,
writes only behind `--apply`, is idempotent, and aborts if any target slug is missing
from the seed.

```
npm run backfill:product-copy              # dry run, prints before/after
npm run backfill:product-copy -- --apply   # writes
```

**Run with S19's approval** (it was approved and applied: 10 products, 40 fields, and a
second dry run then reported all ten "current").

### Verification

- `tsc --noEmit` 0 errors; `eslint app components lib tests` 0 errors, 19 pre-existing
  warnings; `npm test` **406/406** (388 → 406); `next build` succeeds.
- Rendered in EN and FR with `cookie: s19_locale`: **545 assertions pass, 0 fail**
  across the ten product pages, `/shop`, and the twelve KEEP products.
- Surgical-diff check: exactly the ten products, only `description` /
  `shortDescription` and their FR pairs. All twelve KEEP products byte-for-byte
  identical to `HEAD`.

### New tests (`tests/public-content-guard.test.ts`, 388 → 406)

One suite, 18 tests, `describe("Shop / Herbal Catalog guide")`:

- The ten approved paragraphs pinned **verbatim**, so an improvised rewording fails.
- The twelve KEEP descriptions pinned in full. A substring check would let a rewrite
  through by keeping its first clause.
- `shortDescription` must be the approved paragraph or its opening sentence - it can
  never become separate wording.
- The guide's four added cautions asserted present, so dropping one fails.
- The six §20 words banned in the ten descriptions.
- §19: the safety note must render **exactly once** on `/shop` and **not** in
  `product-card.tsx`, which is how "one compact note" is enforced.
- A test that fails if the backfill script is renamed or deleted, and that it contains
  no `deleteMany` / `insertMany`. Comments are stripped before that check, because the
  script explains at length why it avoids those calls.

### Findings for S19 - not actioned

1. **The Diabetes Support Package is not in the live catalog.** The seed has 22
   products; the `products` collection has 21. There is no document for it, so §13's
   product does not appear on `/shop` even though its page resolves. Adding it would be
   adding a product, which §20 forbids, so it has not been added. The guide's §21
   "22-product catalog structure is preserved" is true of the seed and not of the live
   site. **Needs an S19 decision.**
2. **Eight products have pre-existing DB/seed drift** - `oral-miracle`, `sea-salt`,
   `activated-charcoal`, `diabetes-support-package`, `shea-butter`, `sozo`,
   `hoodie-men`, `hoodie-women`. In seven of them the live `shortDescription` holds the
   seed's longer `description`; in `oral-miracle` both differ. **All eight are KEEP
   products**, so the guide says leave them alone and nothing was touched. Flagged
   because the unit tests pin the *seed* text for these twelve, and for eight of them
   that is not what the site serves.
3. **The Fertility Booster's "500 mL bottle" sentence is gone** from the description,
   because §9 replaces the description wholesale. Nothing is lost: the `unit` field
   already shows 500 mL beside the price.
4. **`Black Seed Oil`'s "100%" claim** no longer appears in the description, because the
   approved copy says "Cold-pressed". The `100% Cold-Pressed` badge and the
   `ingredients` line both still state it, and the guide covers neither field.

### Test-script lessons (recorded so they are not repeated)

- **Strip `<script>` before counting.** Next embeds the RSC flight payload in a
  `<script>`, so every visible string appears **twice** in the raw HTML. The §19 safety
  note first measured as 2 occurrences instead of 1.
- **The clinic's own registered name contains "Cure"** - "S19 King of Cure", in the
  Organization JSON-LD. A blanket ban on `cure` over a whole page flags the brand. Scope
  word bans to the copy that is supposed to avoid them.
- **`EVERY_COUNTRY` matched the footer tagline** until "Worldwide Tele-Health" and its
  French twin "Télé-santé mondiale" were excluded. Same trap the delivery-guide suite hit:
  consultation reach really is worldwide; only *shipping* is bounded.
- **`href` counting needs raw HTML, not stripped text.** `visibleText()` removes the tags
  the links live in, so the link count came back 0 against a page with 63 of them.
- **PowerShell mangling.** Accented FR needles written inline come through as `?` and
  produce false misses; the verification script is a UTF-8 `.mjs` run with `node`.
- **Assertion style.** Assert the promise, not its refutation. Pin the approved sentence;
  do not merely assert the old sentence is gone.
