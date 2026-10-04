# S19 New Retouches — Developer Implementation Checklist

Tracking document. `S19_Final_Whole_Site_Master_Developer_Checklist.md` is the control
document: it sets priority, consistency rules and launch verification, and defers all
exact copy to the individual guides. This file records what has actually been
implemented, in the order the master checklist §20 prescribes.

## Order of work (master checklist §20)

| # | Guide | Status |
|---|-------|--------|
| 1 | `S19_Sitewide_Footer_Navigation_Consistency_Developer_Guide.md` | IN PROGRESS |
| 2 | `S19_FAQ_Page_Concise_Updated_v2.md` | not started — blocked on 1 for nav/footer links |
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
| 01 | FAQ in main nav | no `/faq` route exists | DEFERRED — guide says "once published" |
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
| 13 | FAQ linked from footer | no `/faq` route exists | DEFERRED — blocked by item 01 |
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