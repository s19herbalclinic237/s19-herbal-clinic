# Public page briefs — homepage and Programs page

**Implemented:** 2 October 2026
**Source documents:**

- `docs/S19_Homepage_Adjustments_Developer_Brief.md`
- `docs/S19_Programs_Page_Developer_Implementation_Brief.md`

**Scope:** the public home page and the public Programs page only. The About,
Tele-Health, Shop, blog and patient-portal pages are untouched.

---

## 1. Home page — the eleven sections, in order

The home page is now a single clinical narrative in the brief's order. Each
section is one `<Section>` or one full-bleed band in `app/page.tsx`, and each is
commented with its brief section number.

| # | Section | Rendering |
| --- | --- | --- |
| 1 | Hero | `ClinicPhotoFill` band, gold + glass CTA pair, trust line |
| 2 | More Than Symptom Management | Two-column, eight care components as a checklist |
| 3 | The S19 Patient Pathway | Six cards, one per step, numbered 01–06 |
| 4 | Areas We Support | Six program cards, each linking to its program anchor |
| 5 | Science-Based Herbalism | Dark band, nine safety keywords as chips |
| 6 | S19 Is Not Anti-Conventional Treatment | Centred, three paragraphs, safety line in a notice box |
| 7 | Personalized Care | Eight element cards, one icon each |
| 8 | Care Wherever You Are | Dark band, **includes the booking form** |
| 9 | Travelling to S19? | Two-column, four amenities as a checklist |
| 10 | Real Patient Experiences | **Disclaimer above the testimonials**, marquee, two CTAs |
| 11 | Your Health Deserves More Than Guesswork | Closing statement, CTA pair, health notice |

**Hero buttons** use the brief's verbatim labels — `Book a Consultation` and
`Explore Our Programs` — from dedicated keys `home.hero.ctaBook` and
`home.hero.ctaPrograms`, not from a generic CTA string, so a future edit to a
shared string cannot silently change the hero.

**The old four-step "Book → Protocol → Dispatch → Follow-up" is gone.** Those
`home.steps.*` keys were *deleted*, not left unused, and
`tests/public-content-guard.test.ts` asserts that reading them throws. That is
the only way to stop the retired version being quietly reintroduced.

### Retained below the narrative

The featured-products strip, the location section and the FAQ are **kept**, after
section 11 and before the global `CTABand`. The brief's eleven sections are a
clinical narrative and say nothing about these three, and each was already
earning its place on the live page (product discovery, directions, and search
traffic). Deleting working commercial surface area that no one asked about is
the more destructive choice. **Say the word and they come out.**

---

## 2. Programs page

Rebuilt in `app/programs/page.tsx`:

1. Hero — the brief's three statements plus the supporting line
   `Do Not Treat Blindly. Investigate. Understand. Personalize. Monitor.`
2. How S19 Programs Work — the six-step pathway, stacked on mobile
3. We Do Not Treat Blindly — the public investigation statement
4. The ten programs
5. Personalized Programs, Not One-Size-Fits-All Products
6. Supportive In-Clinic Therapies
7. Not Sure Where to Start? — final CTA

### Pathway difference, and why it is not drift

The two pages use deliberately different sixth-tenths steps:

- **Home:** Consult → Investigate → Understand → **Educate** → **Address & Support** → Monitor
- **Programs:** Consult → Investigate → Understand → **Personalize** → **Support** → Monitor

The About page's seven-step `patientJourney` is **unchanged**. All three arrays
live together in `lib/data/philosophy.ts` with a comment explaining the
divergence, so the process is described from one place and cannot drift by
accident.

---

## 3. The three renames, followed everywhere

The brief renamed three programs. A rename is not a one-line change; each old
name had at least one other home, and a missed one is a visible inconsistency.

| Old | New |
| --- | --- |
| `liver-metabolic-cleanse` — Liver & Metabolic Cleansing | `liver-metabolic-health` — Liver & Metabolic Health |
| `integrative-cancer-care` — Integrative Cancer Care | `integrative-cancer-support` — Integrative Cancer Support |
| `other-health-complications` — Other Health Complications | `other-health-concerns` — Other Health Concerns |

Every place the old names survived, and what was done:

| Location | Action |
| --- | --- |
| `lib/data/programs.ts` | Slug, EN title and FR title changed. |
| `components/layout/site-footer.tsx` | The one hardcoded anchor, `#integrative-cancer-care`, repointed. |
| `lib/i18n.ts` → `footer.cancer` | Label changed. This feeds that same footer link. |
| `lib/i18n.ts` → `concern.liver` | "Liver / Kidney **Detox**" → "Liver / Kidney Health". |
| `lib/i18n.ts` → `concern.cancer` | "Integrative Cancer **Care**" → "Integrative Cancer Support". |
| `lib/data/testimonials.ts` | Three testimonial *program labels* updated. |

**On the booking form:** the `concern.*` keys were **not** renamed. That string
is persisted on every booking record, so renaming the key would orphan past
bookings. Only the label a patient reads changed. A test asserts the label
follows the rename so the two cannot drift apart again.

**On the testimonials:** the *program label* is our metadata and was updated.
The testimonial **body text was not touched** — it is the patient's own words.
Rewording a real patient to match new positioning would make the disclaimer
directly above it untrue. Two of those testimonials say "detox" in the patient's
own words; that is a commercial decision about content, not a copy fix, and is
flagged below.

---

## 4. The confidentiality rule

The Programs brief is mostly a list of things **not** to publish. That is hard
to enforce by review, so it is enforced by test in
`tests/public-content-guard.test.ts`, across **both locales**:

- **No named S19 product** in program copy — no Diabetes Pack, Hypertension
  Pack, Prostate Tea or Gastritis Pack. These are real products in the Shop; a
  program description that names one turns a clinical page into a sales page.
- **No specific investigation** — no HbA1c, fasting insulin, creatinine, ALT,
  AST, TSH, PSA, CBC or lipid panel. The brief permits "relevant investigations
  may be requested when appropriate" and nothing more specific.
- **No over-claiming physiology** — micro-circulation enhancement, arterial
  elasticity, balanced microbiome, clinical detoxification, toxin elimination,
  immune fortification, detox, cure, guaranteed outcomes.
- **No guaranteed-outcome wording** on the home page either, across 14 copy
  keys in both languages.

The named-product and named-test checks also run against the six home-page
program cards, because those cards are program copy that happens to live on
another page.

The retail Shop is **not** covered by this rule and its product names are
unchanged. A product legitimately has a name; a program does not.

---

## 5. The three judgement calls to confirm

**1. The "Digestive & Liver Health" home card spans two programs.**
The brief's section 4 names six cards, and card 6 is "Digestive & Liver
Health". The Programs page has `digestive-gut-health` and
`liver-metabolic-health` as separate programs. The card links to
`#digestive-gut-health`, and the liver program is one card below it. The
alternatives are to split it into two cards (seven cards, not the brief's six)
or to give it a combined target. A test asserts every home card links to a real
program anchor, so whichever way you decide it cannot become a dead link.

**2. Two testimonials say "detox" in the patient's own words.**
`lib/data/testimonials.ts` — Kelly and Joseph Kamdem both describe a detox
programme. The labels now read "Liver & Metabolic Health", but the words are
theirs. Left deliberately. If you want them changed, that is a content decision
and a word-for-word approval, and it should be recorded here.

**3. The four-step pathway was deleted, not deprecated.**
Removing the `home.steps.*` keys means a later editor gets a type error rather
than an invisible old pathway. If anyone still needs that wording, it has to be
written again on purpose.

---

## 6. Verification performed

Not "the build passed" — the rendered HTML was read back from a production build.

- `npm.cmd run typecheck` — clean.
- `npm.cmd test` — **339 pass, 0 fail**, including the new
  `tests/public-content-guard.test.ts`.
- `npm.cmd run lint` — **0 errors**, 19 warnings, all pre-existing.
- `npm.cmd run build` — compiled.
- Rendered DOM, English and French, home page: all eleven headings present **in
  the brief's order**, both hero CTAs verbatim, the old four-step pathway gone.
- Rendered DOM, English and French, Programs page: all seven sections in order,
  all ten program anchors present, old slugs absent.
- Rendered DOM, all four page/locale combinations: clean of every banned term.
- Mobile: no `min-w-[…px]`, no `<table>`, no grid that splits before `sm`. The
  only `whitespace-nowrap` elements are desktop-only nav items behind
  `hidden … xl:flex`.
- Booking form concern labels verified as rendered.
