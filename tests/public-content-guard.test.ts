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

import { translate, type TranslationKey } from "@/lib/i18n";
import { treatmentPrograms, localizedPrograms, faqs } from "@/lib/data/programs";
import { homePathway, programsPathway, careBeyond } from "@/lib/data/philosophy";
import {
  homePrograms,
  localizedHomePrograms,
  careComponents,
  herbalSafetyKeywords,
  personalizedCareElements,
  accommodationAmenities,
} from "@/lib/data/home-content";
import { testimonials as staticTestimonials } from "@/lib/data/testimonials";
import { faqSections, faqEntries, FAQ_MID_CTA_AFTER } from "@/lib/data/faq";
import { deliveryZones, telehealthSteps, coreStrengths } from "@/lib/data/programs";
import { blogPosts } from "@/lib/data/blog-posts";
import { clinicJsonLd, SEO_KEYWORDS } from "@/lib/seo";

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
    // Delivery used to be asserted as the literal word "Worldwide". The delivery
    // guide forbids promising every country, so the third route is now delivery
    // coverage - Cameroon first, then supported international destinations - and
    // the assertion follows the copy rather than the old word.
    for (const route of ["Bafoussam", "Tele-Health", "Delivery across Cameroon"]) {
      assert.ok(trust.includes(route), `the trust line must name ${route}`);
    }
    assert.match(trust, /supported international destinations/i);
    assert.doesNotMatch(trust, /worldwide/i, "the trust line must not promise worldwide delivery");
    // The clinic and the remote service keep their place: the guide changed the
    // delivery claim, not the access routes around it.
    assert.equal(trust.split("·").length, 3, "the trust line still has three clauses");
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
  test("section 2 lists every component of care, including clinic-based therapies", () => {
    // Nine, not the brief's original eight: the in-clinic device therapies were
    // added as a ninth component rather than folded into an existing line, so the
    // list stays scannable and the referral boundary stays last.
    assert.equal(careComponents.length, 9);
    // Indexed, not positional: adding the device therapies moved the referral
    // boundary down a slot, and its position matters more than its index.
    assert.equal(
      careComponents[careComponents.length - 1].text,
      "Collaboration with or referral to conventional healthcare when appropriate",
      "the conventional-care referral must remain the last component of care"
    );
    assert.ok(
      careComponents.some((c) => /specialized high-technology devices/i.test(c.text)),
      "the components of care must name the clinic-based device therapies"
    );
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

  test("section 7 shows every personalization element, including clinic-based therapies", () => {
    // Nine, not the brief's original eight, for the same reason as the components
    // of care above: clinic-based therapies became their own element.
    assert.equal(personalizedCareElements.length, 9);
    assert.equal(personalizedCareElements[0].text, "Medical History Review");
    assert.equal(personalizedCareElements[8].text, "Follow-Up");
    assert.ok(
      personalizedCareElements.some((e) => e.text === "Clinic-Based Therapies"),
      "a personalized plan must include the clinic-based device therapies"
    );
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

describe("FAQ page: the approved 22-question structure holds", () => {
  // Source: docs/S19_New_Retouches/S19_FAQ_Page_Concise_Updated_v2.md
  //
  // Most of this guide is a refusal to say something, so it fails the same way
  // the Programs brief does: a well-designed page can still publish a cure claim
  // because nothing in the JSX stops it. These read the copy the page renders.

  test("there are exactly 22 questions, numbered 1 to 22 without a gap", () => {
    assert.equal(faqEntries.length, 22);
    assert.deepEqual(
      faqEntries.map((q) => q.n),
      Array.from({ length: 22 }, (_, i) => i + 1)
    );
  });

  test("the seven approved sections appear in the approved order", () => {
    assert.deepEqual(
      faqSections.map((s) => s.title),
      [
        "About S19",
        "Consultation & Care",
        "Herbs, Medications & Safety",
        "Diabetes, Hypertension & Cancer",
        "Tele-Health, International Patients & Travel",
        "Working with S19",
        "Ordering, Results & Urgent Care",
      ]
    );
  });

  test("the mid-page CTA is placed after Question 14, where the guide requires it", () => {
    assert.equal(FAQ_MID_CTA_AFTER, 14);
    const q14 = faqEntries.find((q) => q.n === 14);
    assert.ok(q14, "Question 14 must exist for the CTA anchor to mean anything");
    // And it really is the last question of its section, so the CTA falls
    // between Question 14 and Question 15 exactly as the guide writes it.
    const lastOfSection = Math.max(
      ...faqSections.find((s) => s.id === "conditions")!.items.map((i) => i.n)
    );
    assert.equal(q14.n, lastOfSection);
  });

  test("every question and answer is translated, not copied from English", () => {
    for (const q of faqEntries) {
      assert.ok(q.questionFr.trim().length > 0, `Q${q.n} has no French question`);
      assert.notEqual(q.questionFr, q.question, `Q${q.n} question is untranslated`);
      assert.equal(
        q.answerFr.length,
        q.answer.length,
        `Q${q.n} has ${q.answer.length} English paragraphs but ${q.answerFr.length} French ones`
      );
      for (const p of q.answerFr) {
        assert.ok(p.trim().length > 0, `Q${q.n} has an empty French paragraph`);
      }
    }
    for (const s of faqSections) {
      assert.ok(s.titleFr.trim().length > 0, `${s.title} has no French heading`);
      assert.notEqual(s.titleFr, s.title, `${s.title} heading is untranslated`);
    }
  });

  test("no FAQ answer promises a cure, a reversal or a guaranteed result", () => {
    // The guide's DO NOT IMPROVISE list, as patterns. Deliberately narrower than
    // BANNED_CLAIMS: Q9 legitimately says herbs "can have meaningful effects", and
    // Q7, Q11 and Q21 must each *refuse* a guarantee ("rather than promising a
    // guaranteed result", "no individual outcome should be guaranteed"). Asserting
    // on the bare word "guaranteed" would fail the very sentences that keep the
    // page honest, so these match the promise itself and not its refutation.
    const FORBIDDEN = [
      /\bwe (can|could|will|would) guarantee\b/i,
      /\bguaranteed to (cure|heal|reverse|recover)\b/i,
      /\bwe cure\b/i,
      /\bcures cancer\b/i,
      /\breverse (your |the )?(diabetes|cancer|tumou?r)\b/i,
      /\bpermanent cure\b/i,
      /\bwill definitely\b/i,
      /\b100% (effective|guaranteed)\b/i,
    ];
    for (const locale of LOCALES) {
      const text = faqEntries
        .flatMap((q) => (locale === "fr" ? q.answerFr : q.answer))
        .join(" ");
      assertNone(text, FORBIDDEN, `FAQ answers [${locale}]`);
    }
  });

  test("the safety answers keep their boundaries in both languages", () => {
    const byN = (n: number) => faqEntries.find((q) => q.n === n)!;

    // Q22 must say S19 is not an emergency service. The footer/navigation guide
    // forbids the opposite claim, and this is the one page where a visitor is
    // looking for urgent help, so it is asserted in both languages.
    assert.match(byN(22).answer[0], /not an emergency medical service/i);
    assert.match(byN(22).answerFr[0], /n'est pas un service médical d'urgence/i);

    // Q12 must refuse to present herbs as insulin replacement.
    assert.match(byN(12).answer[0], /^No\./);
    assert.match(byN(12).answer[0], /never be presented as a replacement for lifesaving insulin/i);
    assert.match(byN(12).answerFr[0], /ne doit jamais être présentée comme un substitut/i);

    // Q10 must not let a patient stop prescribed medication on their own.
    assert.match(byN(10).answer[0], /should not be independently stopped or reduced/i);
    assert.match(byN(10).answerFr[0], /ne doit être ni arrêté ni réduit de sa propre initiative/i);

    // Q7 must refuse a fixed timeline.
    assert.match(byN(7).answer[0], /no responsible fixed timeline/i);
    assert.match(byN(7).answerFr[0], /Il n'existe pas de délai fixe et responsable/i);
  });

  test("Q15 keeps the international-patient paragraph at the approved strength", () => {
    // The guide adds this question specifically for S19's experience receiving
    // patients from the United States, and explicitly forbids strengthening it
    // into a treatment-success claim. So the country and the three conditions
    // must be present, and no outcome language may sit near them.
    const q15 = faqEntries.find((q) => q.n === 15)!;
    // Locale-specific patterns on purpose: the French says "Télé-santé" and
    // "hébergement", so an English-only regex would fail the translation rather
    // than the copy, which is the opposite of what this test is for.
    for (const [locale, text, telehealth, accommodation, betterOutcome] of [
      ["en", q15.answer.join(" "), /Tele-Health/i, /accommodation/i, /better outcomes?/i],
      [
        "fr",
        q15.answerFr.join(" "),
        /Télé-santé/i,
        /hébergement/i,
        /meilleurs résultats/i,
      ],
    ] as const) {
      assert.match(text, telehealth, `Q15 [${locale}] must mention Tele-Health`);
      assert.match(text, accommodation, `Q15 [${locale}] must link accommodation to travel`);
      assert.doesNotMatch(
        text,
        betterOutcome,
        `Q15 [${locale}] must not imply travel guarantees a better outcome`
      );
    }
    assert.match(q15.answer[1], /United States/);
    assert.match(q15.answer[1], /cancer, diabetes and Lyme disease/);
    assert.match(q15.answerFr[1], /États-Unis/);
    assert.match(q15.answerFr[1], /cancer, le diabète et la maladie de Lyme/);
  });

  test("Q17 states supported destinations rather than worldwide delivery", () => {
    const q17 = faqEntries.find((q) => q.n === 17)!;
    assert.match(q17.answer[0], /supported international destinations/i);
    assert.match(q17.answerFr[0], /destinations internationales prises en charge/i);
    for (const [locale, text] of [
      ["en", q17.answer[0]],
      ["fr", q17.answerFr[0]],
    ] as const) {
      assert.doesNotMatch(text, /worldwide/i, `Q17 [${locale}] must not promise worldwide delivery`);
    }
  });

  test("the healthcare-professional and referral questions are retained", () => {
    // The guide's checklist requires professional recruitment and professional
    // referral to stay in. Deleting either would quietly drop a recruitment
    // channel, so they are pinned by question number.
    assert.match(faqEntries.find((q) => q.n === 19)!.question, /healthcare professional/i);
    assert.match(faqEntries.find((q) => q.n === 20)!.question, /refer patients or partner/i);
  });

  test("every contextual link points at a real S19 destination", () => {
    for (const q of faqEntries) {
      for (const l of q.links ?? []) {
        assert.ok(l.href.startsWith("/"), `Q${q.n} link ${l.href} is not a site path`);
        assert.ok(l.labelFr.trim().length > 0, `Q${q.n} link ${l.href} has no French label`);
      }
    }
  });
});

/* ------------------------------------------------------------------ *
 * Cameroon & International Delivery guide
 *
 * The delivery guide is mostly a list of things the site must stop saying.
 * "Worldwide delivery", "express courier", "DHL" and named courier companies
 * all read as guarantees, so each is pinned here against the copy the pages
 * actually render. The city list and country examples are pinned too: the
 * guide's promise is coverage, and coverage that quietly loses a city or a
 * country is still a coverage claim the clinic did not make.
 * ------------------------------------------------------------------ */

describe("Cameroon & international delivery guide", () => {
  /** Every delivery claim the site makes in customer-facing copy. */
  const DELIVERY_KEYS = [
    "home.hero.trust",
    "home.catalog.lead",
    "shop.meta.description",
    "shop.hero.lead",
    "shop.delivery.kicker",
    "shop.delivery.title",
    "shop.delivery.cameroonLabel",
    "shop.delivery.cameroon",
    "shop.delivery.internationalLabel",
    "shop.delivery.international",
    "shop.delivery.close",
    "tele.meta.description",
    "tele.adv12",
    "tele.delivery.kicker",
    "tele.delivery.title",
    "tele.delivery.cameroonLabel",
    "tele.delivery.cameroon",
    "tele.delivery.internationalLabel",
    "tele.delivery.international",
    "tele.delivery.close",
    "location.meta.description",
    "location.info.logisticsLine2",
    "location.deliver.infoText",
    "location.cta.text",
    "contact.noTravel.eyebrow",
    "contact.noTravel.title",
    "contact.noTravel.text",
    "contact.noTravel.cameroonLabel",
    "contact.noTravel.cameroon",
    "contact.noTravel.internationalLabel",
    "contact.noTravel.international",
    "contact.noTravel.close",
    "footer.delivery",
    "checkout.mode3.title",
    "checkout.mode3.desc",
  ] as const satisfies readonly TranslationKey[];

  /** Every delivery claim that lives in a data module rather than in i18n. */
  function dataDeliveryClaims(): Array<{ where: string; text: string }> {
    return [
      ...coreStrengths.map((s) => ({ where: `coreStrengths/${s.title}`, text: s.text })),
      ...coreStrengths.map((s) => ({ where: `coreStrengths/${s.title}`, text: s.textFr ?? "" })),
      ...faqs.map((f) => ({ where: `faqs/${f.question}`, text: f.answer })),
      ...faqs.map((f) => ({ where: `faqs/${f.question}`, text: f.answerFr ?? "" })),
      ...telehealthSteps.map((s) => ({ where: `telehealthSteps/${s.step}`, text: s.text })),
      ...telehealthSteps.map((s) => ({ where: `telehealthSteps/${s.step}`, text: s.textFr ?? "" })),
      ...careBeyond.map((s) => ({ where: `careBeyond/${s.title}`, text: s.text })),
    ];
  }

  /**
 * Every way this site has promised delivery beyond the coverage it offers.
 * The word "worldwide" is only one of them: the French home-page catalog line
 * said "en livraison mondiale" and the English one said "anywhere in the
 * world", and both survived several passes precisely because they never used
 * the word a grep was looking for. Any phrasing that promises *every* country
 * belongs here.
 */
const EVERY_COUNTRY =
  /worldwide|mondial|monde entier|anywhere in the world|livraison mondiale|any country|tout pays|every country|tous les pays|partout dans le monde/i;

  test("no delivery claim promises every country", () => {
    // Scoped to delivery copy on purpose. "Worldwide" is still correct for
    // Tele-Health access - a patient in another country can reach the clinic
    // remotely from anywhere - so tele.meta.title, tele.hero.lead, footer.bottom
    // and the contact-page callout keep it. What must never survive is a promise
    // that products reach everywhere.
    for (const key of DELIVERY_KEYS) {
      for (const locale of LOCALES) {
        assert.doesNotMatch(
          translate(locale, key),
          EVERY_COUNTRY,
          `${key} [${locale}] must not promise delivery to every country`,
        );
      }
    }
    for (const { where, text } of dataDeliveryClaims()) {
      assert.doesNotMatch(text, EVERY_COUNTRY, `${where} must not promise delivery to every country`);
    }
    for (const zone of deliveryZones) {
      assert.doesNotMatch(zone, EVERY_COUNTRY, `delivery zone "${zone}" must not promise every country`);
    }
  });

  test("the Tele-Health consultation reach is still worldwide", () => {
    // The complement of the test above. Tele-Health genuinely is available from
    // anywhere, so these claims stay; a future pass must not delete them while
    // removing the delivery promises.
    assert.match(translate("en", "tele.hero.title"), /anywhere in the world/i);
    assert.match(translate("en", "tele.meta.title"), /Worldwide/);
    assert.match(translate("en", "footer.bottom"), /Worldwide Tele-Health/);
  });

  test("no delivery claim names a courier company", () => {
    // The guide says not to invent courier companies, fees or times. DHL was the
    // concrete instance of that on the Tele-Health page and in its meta keywords.
    //
    // Case-sensitive on purpose. Carrier names are conventionally uppercase, and
    // a case-blind pattern for "UPS" matches ordinary medical prose such as
    // "regular check-ups" - which is what made the first version of this test
    // fail on a sentence that had nothing to do with couriers.
    const CARRIERS = /\b(DHL|FedEx|UPS|Aramex|EMS|DPD|GDEx)\b/;
    for (const key of DELIVERY_KEYS) {
      for (const locale of LOCALES) {
        assert.doesNotMatch(translate(locale, key), CARRIERS, `${key} [${locale}] must not name a courier`);
      }
    }
    const telePage = readFileSync(path.join(root, "app/telehealth/page.tsx"), "utf8");
    assert.doesNotMatch(telePage, CARRIERS, "the Tele-Health page must not name a courier");
    // The blog articles rendered the same promise, and so did the home catalog
    // lead. Both are asserted on the rendered document rather than on the source,
    // because a source read would also catch the comments that explain the fix.
    for (const post of blogPosts) {
      for (const body of [post.body, post.bodyFr ?? ""]) {
        assert.doesNotMatch(body, CARRIERS, `the "${post.slug}" article must not name a courier`);
      }
    }
  });

  test("the approved Cameroon city list is complete wherever it appears", () => {
    // The guide lists eight named cities plus "other cities across Cameroon".
    // Accented French spellings are part of the list, not a variant of it.
    const CAMEROON: Array<[TranslationKey, RegExp[]]> = [
      ["shop.delivery.cameroon", [/Bafoussam/, /Bamenda/, /Buea|Buéa/, /Limbe|Limbé/, /Bertoua/, /Kumba/, /Douala/, /Yaoundé|Yaounde/]],
      ["tele.delivery.cameroon", [/Bafoussam/, /Bamenda/, /Buea|Buéa/, /Limbe|Limbé/, /Bertoua/, /Kumba/, /Douala/, /Yaoundé|Yaounde/]],
      ["contact.noTravel.cameroon", [/Bafoussam/, /Bamenda/, /Buea|Buéa/, /Limbe|Limbé/, /Bertoua/, /Kumba/, /Douala/, /Yaoundé|Yaounde/]],
    ];
    for (const [key, patterns] of CAMEROON) {
      for (const locale of LOCALES) {
        for (const pattern of patterns) {
          assert.match(translate(locale, key), pattern, `${key} [${locale}] is missing a Cameroon city`);
        }
      }
    }
  });

  test("the approved international examples are complete wherever they appear", () => {
    // Long-form keys spell every country out with its abbreviation.
    const LONG_FORM: Array<[TranslationKey, RegExp[]]> = [
      ["shop.delivery.international", [/United States|USA|États-Unis/i, /Canada/i, /United Kingdom|R-U|Royaume-Uni/i, /United Arab Emirates|Émirats|ÉAU/i]],
      ["tele.delivery.international", [/United States|USA|États-Unis/i, /Canada/i, /United Kingdom|R-U|Royaume-Uni/i, /United Arab Emirates|Émirats|ÉAU/i]],
      ["shop.delivery.close", []],
      ["tele.delivery.close", []],
    ];
    for (const [key, patterns] of LONG_FORM) {
      for (const locale of LOCALES) {
        for (const pattern of patterns) {
          assert.match(translate(locale, key), pattern, `${key} [${locale}] is missing a country example`);
        }
      }
    }
    // The contact block uses the short form the contact guide approved.
    for (const locale of LOCALES) {
      assert.match(translate(locale, "contact.noTravel.international"), /USA|États-Unis/i);
      assert.match(translate(locale, "contact.noTravel.international"), /Canada/i);
    }
  });

  test("Cameroon is never subordinated to international delivery", () => {
    // The guide's DO NOT CHANGE: international must not be the more prominent
    // claim. In a two-column block that means Cameroon is the first column, and
    // in a one-line heading Cameroon comes first too.
    for (const key of ["shop.delivery.title", "tele.delivery.title"] as const) {
      for (const locale of LOCALES) {
        const text = translate(locale, key);
        const cameroon = text.search(/Cameroon|Cameroun/i);
        const international = text.search(/international/i);
        assert.ok(cameroon >= 0, `${key} [${locale}] must name Cameroon`);
        assert.ok(international >= 0, `${key} [${locale}] must name international shipping`);
        assert.ok(
          cameroon < international,
          `${key} [${locale}] puts international before Cameroon: "${text}"`,
        );
      }
    }
    // The footer compact line puts Cameroon first for the same reason.
    assert.match(translate("en", "footer.delivery"), /^Nationwide Delivery Across Cameroon/);
    assert.match(translate("fr", "footer.delivery"), /^Livraison nationale au Cameroun/);

    // And each block renders Cameroon before international in the markup.
    for (const page of ["app/shop/page.tsx", "app/telehealth/page.tsx", "app/contact/page.tsx"]) {
      const source = readFileSync(path.join(root, page), "utf8");
      const cameroonAt = source.indexOf("cameroonLabel");
      const internationalAt = source.indexOf("internationalLabel");
      assert.ok(cameroonAt > 0 && internationalAt > cameroonAt, `${page} must render Cameroon before international`);
    }
  });

  test("no delivery block states a price, customs fee or delivery time", () => {
    // The guide forbids inventing charges and times. Every one of these blocks
    // points the customer at S19 to confirm instead, which is the only way the
    // figures may be introduced.
    for (const key of [
      "shop.delivery.cameroon",
      "shop.delivery.international",
      "shop.delivery.close",
      "tele.delivery.cameroon",
      "tele.delivery.international",
      "tele.delivery.close",
      "contact.noTravel.cameroon",
      "contact.noTravel.international",
      "contact.noTravel.close",
    ] as const) {
      for (const locale of LOCALES) {
        const text = translate(locale, key);
        assert.doesNotMatch(text, /FCFA|XAF|CFA|franc/i, `${key} [${locale}] must not state a price`);
        assert.doesNotMatch(text, /[$€£]\s?\d|\d\s?[$€£]/, `${key} [${locale}] must not state a price`);
        assert.doesNotMatch(text, /customs|douane/i, `${key} [${locale}] must not state a customs fee`);
        assert.doesNotMatch(
          text,
          /\b\d+\s*(business\s+)?(day|days|week|weeks|jour|jours|semaine|semaines)\b/i,
          `${key} [${locale}] must not state a delivery time`,
        );
      }
    }
  });

  test("every delivery block tells the reader to confirm with S19", () => {
    for (const key of ["shop.delivery.close", "tele.delivery.close", "contact.noTravel.close"] as const) {
      for (const locale of LOCALES) {
        const text = translate(locale, key);
        assert.match(text, /S19/, `${key} [${locale}] must route the reader to S19`);
        assert.match(
          text,
          locale === "fr" ? /confirm/i : /confirm/i,
          `${key} [${locale}] must ask the reader to confirm availability and charges`,
        );
      }
    }
  });

  test("the shipping coverage chips no longer read as every country", () => {
    // Rendered as the coverage list on /location. The old final chip was
    // "Worldwide"; "Supported Destinations" says the same thing honestly.
    assert.equal(deliveryZones.at(-1), "Supported Destinations");
    assert.ok(
      deliveryZones.filter((z) => /Cameroon/i.test(z)).length > 0,
      "the chips must still show Cameroon coverage",
    );
  });

  test("Tele-Health keeps the message that products follow assessment", () => {
    // The delivery guide adds coverage detail but explicitly forbids removing the
    // existing promise that a Tele-Health patient receives their prescribed
    // products. Step 02 is where that promise lives.
    const dispatch = telehealthSteps.find((s) => /herbal dispatch/i.test(s.title));
    assert.ok(dispatch, "the Tailored Herbal Dispatch step must survive");
    assert.match(dispatch!.text, /prescribed herbal package/i);
    assert.match(dispatch!.textFr!, /pack de plantes prescrit/i);
    assert.match(dispatch!.text, /shipped/i);
  });

  test("the Tele-Health delivery block is rendered on the page", () => {
    const source = readFileSync(path.join(root, "app/telehealth/page.tsx"), "utf8");
    for (const key of [
      "tele.delivery.kicker",
      "tele.delivery.title",
      "tele.delivery.cameroon",
      "tele.delivery.international",
      "tele.delivery.close",
    ]) {
      assert.ok(source.includes(key), `the Tele-Health page must render ${key}`);
    }
  });

  test("the shop delivery block is rendered on the page", () => {
    const source = readFileSync(path.join(root, "app/shop/page.tsx"), "utf8");
    for (const key of [
      "shop.delivery.title",
      "shop.delivery.cameroon",
      "shop.delivery.international",
      "shop.delivery.close",
    ]) {
      assert.ok(source.includes(key), `the shop page must render ${key}`);
    }
  });

  test("the structured data does not promise every country or name a courier", () => {
    // This is the one delivery claim that outranks the visible copy: the
    // Organization schema is emitted on every page and is read by crawlers. It
    // carried "Worldwide (international DHL shipping)" in its areaServed list and
    // "worldwide DHL shipping" in its description, both of which the guide
    // forbids, and neither of which a reader of the page would ever see.
    const graph = clinicJsonLd()["@graph"];
    const clinic = graph.find((n) => n["@type"] === "MedicalClinic");
    assert.ok(clinic, "the clinic node must exist");
    assert.doesNotMatch(
      clinic!.description as string,
      /worldwide|DHL/i,
      "the Organization description must not promise worldwide delivery by courier",
    );
    assert.doesNotMatch(
      JSON.stringify(clinic!.areaServed),
      /worldwide|DHL/i,
      "areaServed must not promise every country or name a courier",
    );
    assert.match(
      JSON.stringify(clinic!.areaServed),
      /Supported International Destinations/,
      "areaServed must still declare the international coverage S19 offers",
    );

    // The clinic's physical coverage stays Cameroon-only in the local entries.
    const served = clinic!.areaServed as string[];
    assert.ok(served.includes("Cameroon"), "areaServed must keep Cameroon");
    assert.ok(served.includes("Bafoussam"), "areaServed must keep Bafoussam");
  });

  test("no search keyword promises worldwide shipping", () => {
    // A keyword is a promise made to a crawler. This one was the single widest
    // delivery claim on the site and appeared on every page's meta keywords.
    for (const kw of SEO_KEYWORDS) {
      assert.doesNotMatch(kw, /worldwide/i, `the keyword "${kw}" must not promise worldwide shipping`);
    }
    assert.ok(
      SEO_KEYWORDS.some((k) => /supported|international/i.test(k)),
      "the international delivery keyword must still be there, only honest",
    );
  });

  test("no page's root metadata promises worldwide courier shipping", () => {
    // The root description is inherited by pages that set no description of their
    // own, and it carried "worldwide DHL shipping".
    const layout = readFileSync(path.join(root, "app/layout.tsx"), "utf8");
    assert.doesNotMatch(layout, /worldwide DHL shipping/i, "the root description must not name a courier");
    const home = readFileSync(path.join(root, "app/page.tsx"), "utf8");
    assert.doesNotMatch(home, /worldwide DHL shipping/i, "the home metadata must not name a courier");
  });

  test("no blog article promises delivery to any country", () => {
    // Eight published articles ended with a contact block offering to "ship our
    // products to any country with a DHL service". The blog has no retouch guide,
    // but the delivery guide's rule is about the claim, not the page, and these
    // were rendered copy on /blog and /blog/[slug].
    for (const post of blogPosts) {
      const bodies: Array<[string, string]> = [
        ["body", post.body],
        ["bodyFr", post.bodyFr ?? ""],
      ];
      for (const [which, body] of bodies) {
        assert.doesNotMatch(
          body,
          /any country|tout pays/i,
          `"${post.slug}" ${which} must not promise delivery to any country`,
        );
        assert.doesNotMatch(body, /\bDHL\b/i, `"${post.slug}" ${which} must not name a courier`);
      }
      // The surrounding sentences survive: only the delivery claim was edited.
      // A post that still offers a delivery sentence must offer the supported
      // ones, and the free-consultation sentence must be untouched.
      for (const [which, body] of bodies) {
        if (/ship our products/i.test(body)) {
          assert.match(body, /ship our products to supported destinations/i, `"${post.slug}" ${which}`);
        }
        if (/expédions nos produits|expédier nos produits/i.test(body)) {
          assert.match(body, /prises en charge/i, `"${post.slug}" ${which}`);
        }
        if (/Online consultation is free/i.test(body)) {
          assert.match(body, /Online consultation is free/i, `"${post.slug}" ${which}`);
        }
        if (/La consultation en ligne est gratuite/i.test(body)) {
          assert.match(body, /La consultation en ligne est gratuite/i, `"${post.slug}" ${which}`);
        }
      }
    }
  });
});

/* ------------------------------------------------------------------ *
 * Contact, Booking & Patient Accommodation guide
 * ------------------------------------------------------------------ */

describe("contact, booking & accommodation guide", () => {
  test("no contact or location line claims an emergency service", () => {
    // The guide's DO NOT CHANGE for item 02: no "emergency line", no implied
    // 24/7 medical cover. This replaced a real line that said both.
    for (const key of ["contact.phoneSub", "contact.hoursSub", "location.info.hoursLine3"] as const) {
      for (const locale of LOCALES) {
        const text = translate(locale, key);
        assert.doesNotMatch(text, /emergency|urgence/i, `${key} [${locale}] must not say emergency`);
        assert.doesNotMatch(text, /24\/7|24h\/24|24-7/, `${key} [${locale}] must not imply 24/7 cover`);
      }
    }
  });

  test("the phone line states what it is for", () => {
    assert.equal(translate("en", "contact.phoneSub"), "For appointments, enquiries & Tele-Health support");
    // EN spells it "Tele-Health" and FR spells it "Télé-santé"; a single
    // locale-blind pattern would fail one of them by construction.
    assert.match(translate("en", "contact.phoneSub"), /Tele-Health/i);
    assert.match(translate("fr", "contact.phoneSub"), /Télé-santé/i);
  });

  test("accommodation states its inclusions in one sentence", () => {
    for (const locale of LOCALES) {
      const includes = translate(locale, "contact.accommodation.includes");
      assert.match(includes, /Starlink/i, `accommodation.includes [${locale}] must name the internet`);
      assert.match(includes, /TV|télévision/i, `accommodation.includes [${locale}] must name cable TV`);
    }
  });

  test("accommodation does not guarantee a room or publish a price", () => {
    for (const locale of LOCALES) {
      const note = translate(locale, "contact.accommodation.note");
      assert.match(note, /before travelling|avant le voyage/i, `accommodation.note [${locale}] must set the timing`);
      assert.doesNotMatch(note, /FCFA|CFA|franc/i, `accommodation.note [${locale}] must not publish a room price`);
      const all = [
        translate(locale, "contact.accommodation.text"),
        translate(locale, "contact.accommodation.bookingNote"),
        note,
      ].join(" ");
      assert.doesNotMatch(
        all,
        /\b(guaranteed|reserved for you|always available)\b/i,
        `accommodation copy [${locale}] must not guarantee a room`,
      );
    }
  });

  test("the booking form asks for city/country and never a full address", () => {
    for (const locale of LOCALES) {
      assert.match(translate(locale, "booking.city"), /City \/ Country|Ville \/ Pays/i);
      assert.ok(translate(locale, "booking.cityPlaceholder").trim().length > 0, "the city field needs a placeholder");
    }
    // The guide forbids a residential address on the consultation form. The
    // checkout still collects one, because a courier needs it - so this is
    // asserted on the booking form's own copy, not sitewide. The single
    // autoComplete="address-level2" token is allowed: it is the HTML
    // autocomplete level for a city, not a street-address field.
    const form = readFileSync(path.join(root, "components/sections/booking-form.tsx"), "utf8");
    assert.ok(form.includes("booking.city"), "the booking form must render the city field");
    assert.doesNotMatch(form, /booking\.address/, "the consultation form must not reuse the checkout address field");
    assert.doesNotMatch(form, /\bstreet\b/i, "the consultation form must not ask for a street");

    // Field order is specified: phone, then city/country, then email.
    const phoneAt = form.indexOf("booking.phone");
    const cityAt = form.indexOf("booking.city\"");
    const emailAt = form.indexOf("booking.email");
    assert.ok(phoneAt > 0 && cityAt > phoneAt && emailAt > cityAt, "city/country must sit between phone and email");
  });

  test("the submitted enquiry carries city/country to the clinic", () => {
    // A field that is collected but dropped on the server is not a field. It has
    // to reach the stored enquiry and the notification email, because that is
    // what routes the consultation and informs delivery.
    const route = readFileSync(path.join(root, "app/api/contact/route.ts"), "utf8");
    assert.match(route, /city: data\.city\?\.trim\(\)/, "the API must persist city/country");
    const model = readFileSync(path.join(root, "lib/models/Inquiry.ts"), "utf8");
    assert.match(model, /city\?: string/, "the Inquiry model must store city/country");
    const email = readFileSync(path.join(root, "lib/email.ts"), "utf8");
    assert.match(email, /City \/ Country/, "the notification email must show city/country");
  });

  test("submitting does not imply instant access to the doctor", () => {
    // The guide's item 05 replaces the submit label precisely because
    // "Submit & Connect to Dr on WhatsApp" promises a handover. The success
    // button made the same promise one click later, so both are checked.
    assert.equal(translate("en", "booking.submit"), "Submit & Continue on WhatsApp");
    for (const key of ["booking.submit", "booking.connectDr"] as const) {
      for (const locale of LOCALES) {
        assert.doesNotMatch(
          translate(locale, key),
          /\bDr\b|\bDr\.|docteur|médecin/i,
          `${key} [${locale}] must not promise direct doctor access`,
        );
        assert.match(
          translate(locale, key),
          /WhatsApp/i,
          `${key} [${locale}] must still say where the conversation continues`,
        );
      }
    }
  });

  test("the privacy reassurance is retained", () => {
    assert.match(translate("en", "booking.private"), /kept strictly private and confidential/i);
    assert.match(translate("fr", "booking.private"), /privées et confidentielles/i);
  });

  test("the cannot-travel block is rendered on the contact page", () => {
    const source = readFileSync(path.join(root, "app/contact/page.tsx"), "utf8");
    for (const key of [
      "contact.noTravel.eyebrow",
      "contact.noTravel.title",
      "contact.noTravel.text",
      "contact.noTravel.cameroon",
      "contact.noTravel.international",
      "contact.noTravel.close",
    ]) {
      assert.ok(source.includes(key), `the contact page must render ${key}`);
    }
    // Placed after Accommodation and before the footer.
    const accommodationAt = source.indexOf("contact.accommodation.tagline");
    const noTravelAt = source.indexOf("contact.noTravel.eyebrow");
    assert.ok(accommodationAt > 0 && noTravelAt > accommodationAt, "the block must follow Accommodation");
  });

  test("the hero and the clinic details are untouched", () => {
    // Item 01 and item 03 are explicit KEEP instructions. These assert the
    // address, email and opening hours still read as they did, so a future pass
    // cannot quietly rewrite them.
    assert.equal(translate("en", "contact.hoursValue"), "Monday – Saturday: 8:00 AM – 6:00 PM");
    assert.ok(translate("en", "contact.addressValue").includes("Bafoussam") === false, "street line has no town in it");
    assert.equal(translate("en", "contact.addressSub"), "Bafoussam, Cameroon");
  });
});

/* ------------------------------------------------------------------ *
 * Tele-Health developer adjustment brief
 * ------------------------------------------------------------------ */

describe("Tele-Health adjustment brief", () => {
  test("the remote assessment covers medications and records", () => {
    const assessment = telehealthSteps.find((s) => s.step === "01");
    assert.ok(assessment, "step 01 must survive");
    assert.match(assessment!.text, /medications/i, "the assessment must ask for current medications");
    assert.match(assessment!.text, /other relevant medical records/i, "the assessment must ask for medical records");
    assert.match(assessment!.text, /laboratory results/i);
    assert.match(assessment!.text, /WhatsApp or phone call/i);
    assert.match(assessment!.textFr!, /médicaments/i);
    assert.match(assessment!.textFr!, /dossier médical pertinent/i);
  });

  test("the document review is framed as health, not only herbs", () => {
    for (const locale of LOCALES) {
      const text = translate(locale, "tele.modality2.text");
      assert.match(
        text,
        /detailed health and treatment-plan review|examen détaillé de votre état de santé et de votre plan de traitement/i,
        `tele.modality2.text [${locale}] must use the approved review phrasing`,
      );
      assert.doesNotMatch(
        text,
        /herbal strategy review|stratégie à base de plantes/i,
        `tele.modality2.text [${locale}] must drop the herbal-only framing`,
      );
    }
  });

  test("Tele-Health no longer claims to equal a full in-clinic visit", () => {
    // The one "change only where necessary" item. The old line promised everything
    // an in-clinic visit delivers, which cannot be true remotely.
    for (const locale of LOCALES) {
      assert.doesNotMatch(
        translate(locale, "tele.modalities.text"),
        /Everything you would get|Tout ce que vous obtiendriez/i,
        "Tele-Health must not claim to reproduce an in-clinic visit",
      );
    }
    assert.equal(
      translate("en", "tele.modalities.text"),
      "Comprehensive S19 consultation and follow-up, wherever you are.",
    );
  });

  test("the consultation fee is FCFA and the foreign figures are marked approximate", () => {
    for (const locale of LOCALES) {
      assert.match(
        translate(locale, "tele.price.approx"),
        /approximate|approximatif/i,
        "the brief requires the USD/EUR figures to be visibly approximate",
      );
      assert.match(
        translate(locale, "tele.price.approx"),
        /may vary|peuvent varier/i,
        "the approximate note must say rates move",
      );
    }
    const source = readFileSync(path.join(root, "app/telehealth/page.tsx"), "utf8");
    assert.ok(source.includes("tele.price.approx"), "the fee block must render the approximate note");
    // The official price stays in FCFA; the other currencies are derived from it.
    assert.match(source, /formatFcfa\(10000\)/, "10,000 FCFA must remain the authoritative figure");
  });

  test("the fee is calculated rather than hard-coded", () => {
    // The brief prefers dynamic equivalents over frozen numbers. A hard-coded
    // US$17.20 would go stale the day the rate moved.
    const utils = readFileSync(path.join(root, "lib/utils.ts"), "utf8");
    assert.match(utils, /fcfaPerUsd/, "the USD equivalent must come from a rate constant");
    assert.match(utils, /fcfaPerEur/, "the EUR equivalent must come from a rate constant");
    const tele = readFileSync(path.join(root, "app/telehealth/page.tsx"), "utf8");
    assert.doesNotMatch(tele, /US\$\s?17|17\.20/, "the Tele-Health page must not hard-code a USD figure");
    assert.doesNotMatch(tele, /€\s?15\.24/, "the Tele-Health page must not hard-code a EUR figure");
  });

  test("the Tele-Health safety note is retained", () => {
    for (const locale of LOCALES) {
      assert.match(
        translate(locale, "tele.options.note"),
        /not an emergency service|pas un service d'urgence/i,
        "the brief requires the not-an-emergency-service limitation to stay",
      );
    }
  });

  test("the preserved sections are all still present", () => {
    // §1 of the brief is a list of things to keep. If one of these keys stops
    // being rendered the page has quietly lost something the clinic asked for.
    const source = readFileSync(path.join(root, "app/telehealth/page.tsx"), "utf8");
    for (const key of [
      "tele.advantages.title",
      "tele.price.title",
      "tele.price.text",
      "tele.steps.title",
    ]) {
      assert.ok(source.includes(key), `the Tele-Health page must still render ${key}`);
    }
    assert.equal(translate("en", "tele.advantages.title"), "Advantages of an Online Consultation");
    assert.equal(translate("en", "tele.price.text"), "The same standard consultation fee applies for both online and in-person consultations.");
  });
});