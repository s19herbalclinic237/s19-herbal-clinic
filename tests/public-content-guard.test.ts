/**
 * Compliance tests for the two developer implementation briefs.
 *
 *   docs/S19_Homepage_Adjustments_Developer_Brief.md
 *   docs/S19_Programs_Page_Developer_Implementation_Brief.md
 *
 * These exist because most of what those briefs ask for is a *refusal* to say
 * something. A page can pass a visual review and still publish a named pack, a
 * lab panel, or a cure claim, because nothing about the JSX stops you. These
 * tests read the copy the pages render and fail if a prohibited string reappears.
 *
 * Run with: npm.cmd test
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import { translate } from "@/lib/i18n";
import { treatmentPrograms, localizedPrograms, faqs } from "@/lib/data/programs";
import { homePathway, programsPathway } from "@/lib/data/philosophy";
import {
  homePrograms,
  localizedHomePrograms,
  careComponents,
  herbalSafetyKeywords,
  personalizedCareElements,
  accommodationAmenities,
} from "@/lib/data/home-content";
import { testimonials as staticTestimonials } from "@/lib/data/testimonials";

const LOCALES = ["en", "fr"] as const;

/** Repo root, for the tests that read a page's source rather than its data. */
const root = path.resolve(process.cwd());

/** Every word the briefs forbid from appearing in program copy. */
const BANNED_CLAIMS = [
  /micro-?circulation/i,
  /arterial elasticity/i,
  /balanced microbiome/i,
  /restore a balanced microbiome/i,
  /clinical detoxification/i,
  /toxin elimination/i,
  /immune fortification/i,
  /\bdetox\b/i,
  /\bcure[sd]?\b/i,
  /guaranteed? (heal|reversal|result|outcome)/i,
  /permanent cure/i,
];

/**
 * Named S19 formulations must not appear in program copy. The clinic sells
 * these in the Shop; the Programs page is a clinical page. If a pack belongs in
 * a program description, that is a change of intent and needs the clinic's
 * decision, not a copy edit.
 */
const NAMED_PRODUCTS = [
  /S19\s+Diabetes\s+Pack/i,
  /S19\s+Hypertension\s+Pack/i,
  /S19\s+Prostate\s+Tea/i,
  /S19\s+Gastritis\s+Pack/i,
  /Pack\s+Diabète/i,
  /Pack\s+Hypertension/i,
  /Thé\s+Prostatique/i,
  /Pack\s+Gastrite/i,
];

/**
 * Specific lab analytes and named panels. The briefs treat these as proprietary
 * clinical methodology and forbid publishing them. Deliberately includes panels
 * only where they are named unambiguously, so ordinary prose about "laboratory
 * findings" does not trip this.
 */
const NAMED_TESTS = [
  /\bHbA1c\b/i,
  /\bHbA1C\b/,
  /fasting insulin/i,
  /\bcreatinine\b/i,
  /\bALT\b/,
  /\bAST\b/,
  /\bTSH\b/,
  /\bPSA\b/,
  /complete blood count/i,
  /\bCBC\b/,
  /lipid panel/i,
  /liver function tests?/i,
  /renal function tests?/i,
];

function allProgramCopy(locale: (typeof LOCALES)[number]) {
  const programs = localizedPrograms(locale);
  return programs.flatMap((p) => [p.title, p.short, p.detail, ...p.conditions, p.note ?? ""]);
}

function assertNone(text: string, patterns: RegExp[], where: string) {
  for (const re of patterns) {
    assert.doesNotMatch(text, re, `${where} matches prohibited pattern ${re}`);
  }
}

describe("programs page: confidential clinical detail stays private", () => {
  for (const locale of LOCALES) {
    test(`no named S19 product appears in ${locale} program copy`, () => {
      for (const [i, text] of allProgramCopy(locale).entries()) {
        assertNone(text, NAMED_PRODUCTS, `program copy [${locale}] #${i}: ${text.slice(0, 70)}`);
      }
    });

    test(`no specific laboratory test is named in ${locale} program copy`, () => {
      for (const [i, text] of allProgramCopy(locale).entries()) {
        assertNone(text, NAMED_TESTS, `program copy [${locale}] #${i}: ${text.slice(0, 70)}`);
      }
    });

    test(`no overclaiming physiology language in ${locale} program copy`, () => {
      for (const [i, text] of allProgramCopy(locale).entries()) {
        assertNone(text, BANNED_CLAIMS, `program copy [${locale}] #${i}: ${text.slice(0, 70)}`);
      }
    });
  }

  test("the home page makes the same promises about what it will not publish", () => {
    for (const locale of LOCALES) {
      const text = homePrograms
        .map((p) => (locale === "fr" ? `${p.titleFr} ${p.textFr}` : `${p.title} ${p.text}`))
        .join(" ");
      assertNone(text, NAMED_PRODUCTS, `home program cards [${locale}]`);
      assertNone(text, NAMED_TESTS, `home program cards [${locale}]`);
      assertNone(text, BANNED_CLAIMS, `home program cards [${locale}]`);
    }
  });
});

describe("programs page: the three renames are applied", () => {
  const bySlug = Object.fromEntries(treatmentPrograms.map((p) => [p.slug, p]));

  test("Liver & Metabolic Health replaces Liver & Metabolic Cleansing", () => {
    assert.ok(bySlug["liver-metabolic-health"], "liver-metabolic-health slug must exist");
    assert.equal(bySlug["liver-metabolic-health"].title, "Liver & Metabolic Health");
    assert.equal(bySlug["liver-metabolic-health"].titleFr, "Santé hépatique et métabolique");
    // The old slug is gone, so any stale anchor link 404s to the top of the page.
    assert.equal(bySlug["liver-metabolic-cleanse"], undefined);
  });

  test("Integrative Cancer Support replaces Integrative Cancer Care", () => {
    assert.ok(bySlug["integrative-cancer-support"], "integrative-cancer-support slug must exist");
    assert.equal(bySlug["integrative-cancer-support"].title, "Integrative Cancer Support");
    assert.equal(bySlug["integrative-cancer-support"].titleFr, "Soutien intégratif du cancer");
    assert.equal(bySlug["integrative-cancer-care"], undefined);
  });

  test("Other Health Concerns replaces Other Health Complications", () => {
    assert.ok(bySlug["other-health-concerns"], "other-health-concerns slug must exist");
    assert.equal(bySlug["other-health-concerns"].title, "Other Health Concerns");
    assert.equal(bySlug["other-health-concerns"].titleFr, "Autres préoccupations de santé");
    assert.equal(bySlug["other-health-complications"], undefined);
  });

  test("'cleansing' and 'complications' appear in no program title", () => {
    for (const p of treatmentPrograms) {
      for (const title of [p.title, p.titleFr ?? ""]) {
        assert.doesNotMatch(title, /cleansing|nettoyage|complications/i);
      }
    }
  });
});

describe("programs page: conventional-care boundaries stay visible", () => {
  test("Type 1 diabetes insulin statement is present in both locales", () => {
    const diabetes = treatmentPrograms.find((p) => p.slug === "diabetes-metabolic")!;
    assert.match(diabetes.note ?? "", /Type 1 diabetes requires insulin/i);
    assert.match(diabetes.note ?? "", /does not replace insulin therapy/i);
    assert.match(diabetes.noteFr ?? "", /diabète de type 1 nécessite de l'insuline/i);
    assert.match(diabetes.noteFr ?? "", /ne remplacent pas l'insulinothérapie/i);
  });

  test("the blood-pressure medication safety statement is present", () => {
    const bp = treatmentPrograms.find((p) => p.slug === "hypertension-cardiovascular")!;
    assert.match(bp.note ?? "", /should not independently stop or reduce/i);
    assert.match(bp.noteFr ?? "", /ne doivent pas arrêter ni réduire/i);
  });

  test("the oncology boundary statement names what S19 does not replace", () => {
    const cancer = treatmentPrograms.find((p) => p.slug === "integrative-cancer-support")!;
    for (const treatment of ["oncology care", "surgery", "chemotherapy", "radiotherapy"]) {
      assert.ok(
        (cancer.note ?? "").includes(treatment),
        `the cancer note must name ${treatment} as care S19 does not replace`
      );
    }
    assert.match(cancer.noteFr ?? "", /ne remplace pas les soins d'oncologie/i);
  });

  test("every note is prefixed at render time and does not carry its own label", () => {
    // The programs page prepends "Important:" or "Safety:" from a fixed pair of
    // i18n keys. Two consequences, both checked here: every note has a French
    // counterpart, and no note bakes its own label in - that would render as
    // "Important: Important: ..." or "Safety: Important: ...".
    for (const p of treatmentPrograms) {
      if (!p.note) continue;
      assert.ok(p.noteFr, `${p.slug} has a note but no French counterpart`);
      assert.ok(p.noteFr.length > 20, `${p.slug} French note is too short`);
      for (const [note, locale] of [
        [p.note, "en"],
        [p.noteFr!, "fr"],
      ] as const) {
        assert.doesNotMatch(
          note,
          /^(important|safety|attention|avertissement)\b/i,
          `${p.slug} ${locale} bakes its own label into the note; the page adds it`
        );
      }
    }
  });

  test("a note is classified as Safety or Important, and the two are distinguishable", () => {
    // `app/programs/page.tsx` picks the label from `noteKind`. Only the
    // medication note may claim "Safety": that word is the warning itself, and
    // a note that renders as "Important" where it means "stop changing your
    // antihypertensive without supervision" has been softened into something the
    // patient may reasonably skim.
    const bp = treatmentPrograms.find((p) => p.slug === "hypertension-cardiovascular")!;
    assert.equal(bp.noteKind, "safety");
    const others = treatmentPrograms.filter((p) => p.note && p.noteKind === "safety");
    assert.deepEqual(
      others.map((p) => p.slug),
      ["hypertension-cardiovascular"],
      "only the blood-pressure program may be labelled Safety"
    );
  });

  test("the therapies section says complement, never replace", () => {
    assert.match(translate("en", "programs.therapies.text"), /complement - not replace -/i);
    assert.match(translate("fr", "programs.therapies.text"), /compléter - et non à remplacer -/i);
  });

  test("the investigation statement names no test", () => {
    for (const locale of LOCALES) {
      assertNone(
        translate(locale, "programs.investigation.text"),
        NAMED_TESTS,
        `investigation statement [${locale}]`
      );
      assert.match(
        translate(locale, "programs.investigation.text"),
        /laboratory tests, imaging|analyses de laboratoire/i
      );
    }
  });
});

describe("programs page: programs are clinical pathways, not bundles", () => {
  test("the not-retail section exists in both locales and says the plan is individual", () => {
    assert.match(translate("en", "programs.notRetail.title"), /Not One-Size-Fits-All Products/i);
    assert.match(translate("en", "programs.notRetail.text"), /according to the individual care plan/i);
    assert.match(translate("fr", "programs.notRetail.title"), /pas des produits universels/i);
    assert.match(translate("fr", "programs.notRetail.text"), /selon le plan de soins individuel/i);
  });

  test("the six-step pathway is CONSULT -> INVESTIGATE -> UNDERSTAND -> PERSONALIZE -> SUPPORT -> MONITOR", () => {
    assert.deepEqual(
      programsPathway.map((s) => s.step),
      ["Consult", "Investigate", "Understand", "Personalize", "Support", "Monitor"]
    );
  });

  test("every pathway step carries real copy in both languages", () => {
    for (const step of programsPathway) {
      assert.ok(step.text.length > 30, `${step.step} needs real copy`);
      assert.ok((step.textFr ?? "").length > 30, `${step.step} needs French copy`);
      assert.ok(step.stepFr, `${step.step} needs a French label`);
    }
  });

  test("the pathway cards are six, matching the brief", () => {
    assert.equal(programsPathway.length, 6);
    assert.equal(homePathway.length, 6);
  });
});

describe("home page: the four-step pathway is gone", () => {
  test("the old Book / Protocol / Dispatch / Follow-up keys no longer exist", () => {
    // These were removed rather than left unused, so that a later edit cannot
    // quietly reintroduce the four-step version the brief replaced.
    const removed = [
      "home.steps.kicker",
      "home.steps.title",
      "home.steps.1.title",
      "home.steps.2.title",
      "home.steps.3.title",
      "home.steps.4.title",
    ];
    for (const key of removed) {
      assert.throws(
        () => translate("en", key as never),
        `${key} was removed by the brief and must not come back`
      );
    }
  });

  test("the home pathway is CONSULT -> INVESTIGATE -> UNDERSTAND -> EDUCATE -> ADDRESS & SUPPORT -> MONITOR", () => {
    assert.deepEqual(
      homePathway.map((s) => s.step),
      ["Consult", "Investigate", "Understand", "Educate", "Address & Support", "Monitor"]
    );
  });

  test("educate precedes addressing, on the home page as on About", () => {
    const steps = homePathway.map((s) => s.step);
    assert.ok(steps.indexOf("Educate") < steps.indexOf("Address & Support"));
  });
});

describe("home page: the testimonial disclaimer is required copy", () => {
  const REQUIRED_EN =
    "Testimonials describe individual experiences only. They do not establish that a treatment caused the reported outcome, are not evidence that another patient will experience the same result, and should not be interpreted as a guarantee, medical advice or substitute for appropriate medical evaluation.";

  test("the English disclaimer matches the brief verbatim", () => {
    assert.equal(translate("en", "home.experiences.disclaimer"), REQUIRED_EN);
  });

  test("the French disclaimer carries all four points", () => {
    const fr = translate("fr", "home.experiences.disclaimer");
    // expériences individuelles / n'établissent pas la causalité / pas une preuve pour
    // un autre patient / ni une garantie, ni un avis médical.
    assert.match(fr, /expériences individuelles/i);
    assert.match(fr, /n'établissent pas/i);
    assert.match(fr, /autre patient/i);
    assert.match(fr, /une garantie, un avis médical/i);
    assert.match(fr, /substitut/i);
    assert.notEqual(fr, REQUIRED_EN);
  });

  test("no testimonial is attributed to a program name the Programs page dropped", () => {
    // The program label under a testimonial is our metadata, so it has to track
    // the Programs page. The testimonial body itself is the patient's own words
    // and is deliberately not asserted on here - editing a patient's words to
    // match the new positioning would make the disclaimer above untrue.
    const slugs = new Set(treatmentPrograms.map((p) => p.slug));
    for (const s of staticTestimonials) {
      assert.ok(s.program && s.program.length > 0, `${s.name} has no program label`);
      assert.doesNotMatch(
        s.program,
        /cleansing|complications|detox|integrative cancer care/i,
        `${s.name}'s label still names a retired program: ${s.program}`
      );
      assert.doesNotMatch(s.programFr ?? "", /nettoyage|détox|soins intégratifs du cancer/i);
    }
    assert.ok(slugs.size === 10, "programs list changed; re-check testimonial labels");
  });

  test("the booking form's concern labels follow the renames", () => {
    // The stored value is the `concern.*` key, and past bookings are keyed on
    // it, so the key is not renamed - only the label a patient reads.
    for (const [locale, pattern] of [
      ["en", /integrative cancer support/i],
      ["fr", /soutien intégratif du cancer/i],
    ] as const) {
      assert.match(translate(locale, "concern.cancer"), pattern);
    }
    assert.doesNotMatch(translate("en", "concern.liver"), /detox/i);
    assert.doesNotMatch(translate("fr", "concern.liver"), /détox/i);
    assert.doesNotMatch(translate("en", "footer.cancer"), /integrative cancer care/i);
  });

  test("the disclaimer is a distinct key, not the /patient-stories one", () => {
    // They cover different questions - what results mean, versus what the page
    // shows - so folding them together would lose one of the two.
    assert.notEqual(
      translate("en", "home.experiences.disclaimer"),
      translate("en", "stories.disclaimer")
    );
  });
});

describe("home page: required sections and boundaries", () => {
  test("the health information notice is present and complete", () => {
    for (const locale of LOCALES) {
      const notice = translate(locale, "home.final.notice");
      assert.ok(notice.length > 150, `the ${locale} notice is too short to be a real notice`);
      assert.match(
        notice,
        /do not replace emergency care|ne remplacent ni les soins d'urgence/i
      );
    }
    // The brief's exact phrasing. Asserted on the outcome clause rather than on
    // "guaranteed" alone, because the sentence has to say outcomes vary too.
    assert.match(
      translate("en", "home.final.notice"),
      /no treatment outcome or cure can be guaranteed/i
    );
    assert.match(
      translate("fr", "home.final.notice"),
      /aucun résultat de traitement ni guérison ne peut être garanti/i
    );
    assert.match(translate("en", "home.final.statement"), /Don't Treat Blindly/i);
  });

  test("the trust line names all three access routes", () => {
    const trust = translate("en", "home.hero.trust");
    for (const route of ["Bafoussam", "Tele-Health", "Worldwide"]) {
      assert.ok(trust.includes(route), `the trust line must name ${route}`);
    }
  });

  test("the care-access section offers both in-person and remote", () => {
    assert.match(translate("en", "home.careWherever.tele"), /Tele-Health/i);
    assert.match(translate("en", "home.careWherever.inPerson"), /In-Person/i);
    assert.match(translate("fr", "home.careWherever.tele"), /Télé-consultation/i);
  });

  test("no home page copy promises an outcome", () => {
    const keys = [
      "home.hero.titleA",
      "home.hero.titleB",
      "home.hero.lead",
      "home.hero.lead2",
      "home.whole.lead",
      "home.whole.closing",
      "home.science.lead",
      "home.science.closing",
      "home.conventional.p2",
      "home.personal.closing",
      "home.careWherever.lead",
      "home.accommodation.lead",
      "home.experiences.lead",
      "home.final.lead",
    ] as const;
    for (const locale of LOCALES) {
      for (const key of keys) {
        assertNone(
          translate(locale, key),
          BANNED_CLAIMS,
          `home copy [${locale}] ${key}`
        );
      }
    }
  });
});

describe("home page: the brief's list sections are complete", () => {
  test("section 2 lists all eight components of care", () => {
    assert.equal(careComponents.length, 8);
    assert.match(careComponents[7].text, /referral to conventional healthcare/i);
  });

  test("section 4 shows exactly the six program areas the brief names", () => {
    assert.equal(homePrograms.length, 6);
    const slugs = homePrograms.map((p) => p.slug);
    for (const required of [
      "diabetes-metabolic",
      "hypertension-cardiovascular",
      "integrative-cancer-support",
      "womens-health-hormones",
      "prostate-mens-health",
      "digestive-gut-health",
    ]) {
      assert.ok(slugs.includes(required), `missing home card: ${required}`);
    }
  });

  test("every home program card points at a program that exists", () => {
    // A card linking to a stale anchor lands the visitor mid-page with no
    // context, which is worse than not linking at all. The one card allowed to
    // opt out of an anchor is checked separately below.
    const slugs = new Set(treatmentPrograms.map((p) => p.slug));
    for (const card of homePrograms) {
      if (card.href) continue;
      assert.ok(slugs.has(card.slug), `${card.slug} is not a program on the Programs page`);
    }
    for (const card of localizedHomePrograms("en")) {
      if (card.href !== "/programs") {
        const anchor = card.href.slice("/programs#".length);
        assert.ok(slugs.has(anchor), `${card.href} is not a program on the Programs page`);
      }
    }
  });

  test("the merged digestive + liver card goes to the Programs index, not one program", () => {
    // The brief names ONE card covering both, so it is not split here. But the
    // Programs page lists them as two separate programs, so anchoring the card
    // to either one would claim the card is about that program alone. It links
    // to the index, where both appear in order.
    const merged = homePrograms.find((c) => c.title === "Digestive & Liver Health");
    assert.ok(merged, "the Digestive & Liver Health card is missing");
    assert.equal(merged.href, "/programs");
    // And the Programs page really does still carry both halves.
    const slugs = new Set(treatmentPrograms.map((p) => p.slug));
    assert.ok(slugs.has("digestive-gut-health"));
    assert.ok(slugs.has("liver-metabolic-health"));
  });

  test("every home program card has an href in both locales", () => {
    for (const locale of ["en", "fr"] as const) {
      for (const card of localizedHomePrograms(locale)) {
        assert.ok(card.href.startsWith("/programs"), `${locale}: ${card.slug} has href ${card.href}`);
      }
    }
  });

  test("section 5 shows all nine herbal-safety considerations", () => {
    assert.equal(herbalSafetyKeywords.length, 9);
    assert.deepEqual(
      herbalSafetyKeywords.map((k) => k.text),
      [
        "Pharmacology",
        "Phytochemistry",
        "Dosage",
        "Contraindications",
        "Toxicity",
        "Herb-drug interactions",
        "Existing medications",
        "Laboratory findings",
        "Individual health status",
      ]
    );
  });

  test("section 7 shows all eight personalization elements", () => {
    assert.equal(personalizedCareElements.length, 8);
    assert.equal(personalizedCareElements[0].text, "Medical History Review");
    assert.equal(personalizedCareElements[7].text, "Follow-Up");
  });

  test("section 9 shows all four accommodation amenities", () => {
    assert.equal(accommodationAmenities.length, 4);
    assert.ok(accommodationAmenities.some((a) => /Starlink/i.test(a.text)));
    assert.ok(accommodationAmenities.some((a) => /cable/i.test(a.text)));
  });
});

describe("the home page does not restate what its own sections already say", () => {
  // The brief's order table ends at section 11. Three blocks sat below it and
  // two of them repeated content the page had already printed. These tests exist
  // so the removals hold.

  test("the standalone Location block is gone; section 8 carries the details", () => {
    const source = readFileSync(path.join(root, "app", "page.tsx"), "utf8");
    // No home.location.* key is rendered on the home page any more.
    assert.doesNotMatch(source, /home\.location\./);
    assert.doesNotMatch(source, /visitLocationPage/);
    // Section 8 is what prints the address and the hours now.
    assert.match(source, /\{clinic\.address\}/);
    assert.match(source, /clinic\.hours/);
  });

  test("the home page does not render a second final CTA after section 11", () => {
    const source = readFileSync(path.join(root, "app", "page.tsx"), "utf8");
    // `CTABand` renders "Start your consultation" + Book + WhatsApp, which is
    // the same three jobs section 11 already does. It stays on the seven other
    // pages that use it; only the home page drops it.
    assert.doesNotMatch(source, /CTABand/);
  });

  test("the home page does not render the address or hours a second time", () => {
    // The old Location block hardcoded the address and hours as string
    // literals, duplicating CLINIC.address / CLINIC.hours which section 8
    // already renders from the single source of truth.
    const source = readFileSync(path.join(root, "app", "page.tsx"), "utf8");
    assert.doesNotMatch(source, /Immeuble Cathédrale/);
    assert.doesNotMatch(source, /Monday – Saturday: 8:00 AM – 6:00 PM/);
  });

  test("the FAQ and product strip stay, because nothing else carries them", () => {
    // Their absence would delete real information: `faqs` is consumed only by
    // the home page, and two of its five answers (dosage, payment methods)
    // appear in none of the eleven sections.
    const source = readFileSync(path.join(root, "app", "page.tsx"), "utf8");
    assert.match(source, /home\.faq\.title/);
    assert.match(source, /home\.catalog\.title/);
    // And the payment/dosage answers are the reason, asserted so nobody deletes
    // the block without noticing what goes with it.
    const answers = faqs.map((f) => f.answer).join(" ");
    assert.match(answers, /payment/i);
    assert.match(answers, /teaspoon/i);
  });
});

describe("bilingual parity for the new content", () => {
  test("every home-content entry is translated, not copied from English", () => {
    // A handful of terms are the same word in both languages. Asserting they
    // differ would force a bad translation ("Dosage" has no other correct
    // French form), so they are listed as legitimately identical.
    const SAME_IN_BOTH = new Set(["Dosage", "Toxicity", "Nutrition", "Phytochemistry"]);
    const lists = [careComponents, herbalSafetyKeywords, personalizedCareElements, accommodationAmenities];
    for (const list of lists) {
      for (const item of list) {
        assert.ok(item.textFr.trim().length > 0, `missing French for "${item.text}"`);
        if (!SAME_IN_BOTH.has(item.text)) {
          assert.notEqual(item.textFr, item.text, `"${item.text}" is untranslated`);
        }
      }
    }
    for (const card of homePrograms) {
      assert.notEqual(card.titleFr, card.title, `"${card.title}" title is untranslated`);
      assert.notEqual(card.textFr, card.text, `"${card.title}" body is untranslated`);
    }
  });

  test("every new home i18n key has distinct French", () => {
    const keys = [
      "home.hero.titleA",
      "home.hero.titleB",
      "home.hero.lead",
      "home.hero.lead2",
      "home.hero.trust",
      "home.whole.title",
      "home.whole.subtitle",
      "home.whole.lead",
      "home.whole.depends",
      "home.whole.closing",
      "home.pathway.title",
      "home.pathway.lead",
      "home.areas.title",
      "home.areas.lead",
      "home.science.title",
      "home.science.subtitle",
      "home.science.lead",
      "home.science.closing",
      "home.conventional.title",
      "home.conventional.p1",
      "home.conventional.p2",
      "home.conventional.p3",
      "home.conventional.safety",
      "home.personal.title",
      "home.personal.lead",
      "home.personal.closing",
      "home.careWherever.title",
      "home.careWherever.lead",
      "home.accommodation.title",
      "home.accommodation.subtitle",
      "home.accommodation.lead",
      "home.experiences.title",
      "home.experiences.subtitle",
      "home.experiences.lead",
      "home.final.title",
      "home.final.lead",
      "home.final.statement",
      "home.final.notice",
      "programs.hero.p1",
      "programs.hero.p2",
      "programs.hero.p3",
      "programs.hero.tagline",
      "programs.pathway.lead",
      "programs.investigation.text",
      "programs.notRetail.title",
      "programs.notRetail.text",
      "programs.notSure.title",
      "programs.notSure.text",
      "programs.notSure.closing",
      "programs.therapies.text",
    ] as const;
    for (const key of keys) {
      const en = translate("en", key);
      const fr = translate("fr", key);
      assert.ok(en.trim().length > 0, `${key} has no English text`);
      assert.ok(fr.trim().length > 0, `${key} has no French text`);
      assert.notEqual(fr, en, `${key} is untranslated`);
    }
  });

  test("both program sets have complete French", () => {
    for (const locale of LOCALES) {
      for (const p of localizedPrograms(locale)) {
        assert.ok(p.title.trim().length > 0, `${p.slug} has no title in ${locale}`);
        assert.ok(p.short.trim().length > 40, `${p.slug} ${locale} summary is too short`);
        assert.ok(p.detail.trim().length > 60, `${p.slug} ${locale} description is too short`);
        assert.ok(p.conditions.length >= 4, `${p.slug} ${locale} needs at least four supports`);
      }
    }
  });
});