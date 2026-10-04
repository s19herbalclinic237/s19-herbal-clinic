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
| 3 | `S19_Contact_Accommodation_…` + `S19_TeleHealth_…` + `S19_Cameroon_International_Delivery_…` | not started |
| 4 | `S19_Shop_Herbal_Catalog_…` | not started |
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