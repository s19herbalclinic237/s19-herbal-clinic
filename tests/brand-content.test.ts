/**
 * Brand-content tests.
 *
 * These lock in positioning decisions that were made deliberately, so they
 * cannot be quietly reverted by a later copy edit. The content is the clinic's
 * central claim about what it is, and it is the one part of the site where a
 * small wording change is a real business decision rather than a typo fix.
 *
 * Each test states the decision it protects, so a future failure explains which
 * choice was undone rather than just that a string changed.
 *
 * Run with: npm.cmd test
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { translate } from "@/lib/i18n";
import {
  careBeyond,
  centralMessage,
  closingStatement,
  healthPillars,
  patientJourney,
  philosophyTagline,
  rightIntervention,
  rootCauseSteps,
} from "@/lib/data/philosophy";

/** The agreed order of the care pathway. */
const EXPECTED_JOURNEY = [
  "Consult",
  "Investigate",
  "Understand",
  "Educate",
  "Address",
  "Support",
  "Monitor",
];

describe("herbalism leads the positioning", () => {
  test("the tagline opens with science-based herbalism", () => {
    // Decision: herbalism comes first, before "root-cause healthcare" and before
    // any non-conventional-therapy framing, because naming the practice
    // accurately is the stronger and more honest position.
    assert.match(philosophyTagline, /^Science-Based Herbalism\./);
  });

  test("the About hero opens with science-based herbalism", () => {
    const title = translate("en", "about.hero.title");
    assert.match(title, /^Science-Based Herbalism\./);
    // If non-conventional therapies are mentioned at all, they must come after
    // herbalism. Their absence satisfies this trivially and is the stronger
    // position, so the guard only applies when the phrase is actually present.
    const nonConventional = title.toLowerCase().indexOf("non-conventional");
    if (nonConventional !== -1) {
      assert.ok(
        title.toLowerCase().indexOf("herbalism") < nonConventional,
        "herbalism must be mentioned before non-conventional therapies"
      );
    }
  });

  test("the About hero and the tagline are the same line", () => {
    // Both are the canonical position line. If they drift, the site states its
    // own position two different ways.
    assert.equal(translate("en", "about.hero.title"), philosophyTagline);
  });

  test("the home hero carries the same positioning line as the tagline", () => {
    // The two pages must not drift: the home hero is the 30-second statement,
    // and the About page opens with the same claim.
    assert.equal(translate("en", "home.hero.titleB"), philosophyTagline);
  });

  test("the opening statement appears on the home page and the About page", () => {
    // A visitor should be able to answer "what is this clinic?" within about 30
    // seconds of landing, from either entry point.
    assert.equal(translate("en", "about.position.statement"), centralMessage);
    assert.equal(translate("en", "home.hero.lead"), centralMessage);
  });

  test("the goal line is stated on both pages", () => {
    assert.equal(translate("en", "about.position.goal"), closingStatement);
    assert.equal(translate("en", "home.hero.closing"), closingStatement);
  });
});

describe("the clinic is not positioned against conventional medicine", () => {
  test("the old 'anti-medicine' framing is gone from the French too", () => {
    // "Anti-medicine" reads as hostility to all treatment. "Anti-conventional
    // medicine" keeps the distinction that actually matters: never delay
    // necessary emergency or specialist care.
    const en = translate("en", "about.notAnti.title");
    const fr = translate("fr", "about.notAnti.title");
    assert.match(en, /not anti-conventional medicine/i);
    assert.match(fr, /pas contre la médecine conventionnelle/i);
    assert.doesNotMatch(en, /anti-medicine/i);
    assert.doesNotMatch(fr, /contre la médecine\s*$/i);
  });

  test("the text says complementary approaches must never delay necessary care", () => {
    const en = translate("en", "about.notAnti.text");
    assert.match(en, /should never delay/i);
    assert.match(translate("fr", "about.notAnti.text"), /ne doivent jamais retarder/i);
  });

  test("the 'right intervention, right patient, right time' line is stated", () => {
    assert.equal(
      rightIntervention,
      "Use the right intervention, for the right patient, at the right time."
    );
    assert.match(translate("en", "about.notAnti.goal"), /right intervention, for the right patient/i);
  });
});

describe("the care pathway runs in the agreed order", () => {
  test("education precedes intervention", () => {
    // Decision: educate before addressing. A patient who does not understand
    // their condition is complying, not adhering, and the two behave
    // differently over months.
    assert.deepEqual(patientJourney.map((s) => s.step), EXPECTED_JOURNEY);
    const educate = patientJourney.findIndex((s) => s.step === "Educate");
    const address = patientJourney.findIndex((s) => s.step === "Address");
    assert.ok(educate !== -1, "Educate must be a step");
    assert.ok(educate < address, "Educate must come before Address");
  });

  test("the compact form matches the full pathway", () => {
    // The About page renders both lists; a mismatch would show the clinic
    // contradicting its own process two sections apart.
    assert.deepEqual(rootCauseSteps, EXPECTED_JOURNEY);
  });

  test("no step retains the old wording", () => {
    // "Correct" and "Identify"/"Personalize"/"Implement"/"Adjust" were the
    // previous stage names. "Address" deliberately covers correction without
    // implying it is the only intervention.
    for (const removed of ["Correct", "Identify", "Personalize", "Implement", "Adjust", "Maintain"]) {
      assert.ok(
        !rootCauseSteps.includes(removed),
        `"${removed}" was replaced in the agreed pathway`
      );
    }
  });

  test("every step carries explanatory copy", () => {
    for (const step of patientJourney) {
      assert.ok(step.text.trim().length > 20, `${step.step} needs real copy, not a stub`);
    }
  });
});

describe("the care pillars", () => {
  test("herbal medicine is first", () => {
    assert.equal(healthPillars[0].title, "Herbal Medicine");
  });

  test("non-conventional therapies are included as a pillar", () => {
    // Requested explicitly, and deliberately placed last: selected approaches
    // used alongside herbal medicine, not instead of it.
    const pillar = healthPillars.find((p) => /non-conventional/i.test(p.title));
    assert.ok(pillar, "a Non-Conventional Therapies pillar is required");
    assert.match(pillar!.text, /alongside herbal medicine/i);
    assert.equal(healthPillars[healthPillars.length - 1].title, pillar!.title);
  });

  test("the pillars present in the agreed set are all still there", () => {
    const titles = healthPillars.map((p) => p.title);
    for (const required of [
      "Herbal Medicine",
      "Nutrition",
      "Lifestyle Medicine",
      "Metabolic Health",
      "Stress & Nervous-System Support",
      "Laboratory Monitoring",
      "Patient Education",
      "Non-Conventional Therapies",
    ]) {
      assert.ok(titles.includes(required), `missing pillar: ${required}`);
    }
  });

  test("every pillar has substantive copy", () => {
    for (const pillar of healthPillars) {
      assert.ok(pillar.text.trim().length > 30, `${pillar.title} needs real copy`);
    }
  });
});

describe("bilingual integrity", () => {
  const POSITION_KEYS = [
    "about.position.kicker",
    "about.position.tagline",
    "about.position.statement",
    "about.position.question",
    "about.position.goal",
    "about.notAnti.title",
    "about.notAnti.text",
    "about.notAnti.goal",
  ] as const;

  test("every position key is actually translated, not copied from English", () => {
    // A French visitor reading untranslated English is the most visible failure
    // this codebase can ship, and it is easy to do by adding a key and leaving
    // `fr` to fall back.
    for (const key of POSITION_KEYS) {
      const en = translate("en", key);
      const fr = translate("fr", key);
      assert.ok(en.trim().length > 0, `${key} has no English text`);
      assert.ok(fr.trim().length > 0, `${key} has no French text`);
      assert.notEqual(fr, en, `${key} is untranslated - French is identical to English`);
    }
  });

  test("the tagline is translated as well as restated", () => {
    const fr = translate("fr", "home.hero.titleB");
    assert.match(fr, /Phytothérapie fondée sur la science/);
    assert.match(fr, /Soins de la cause racine/);
  });
});

describe("supporting content stays consistent", () => {
  test("care-beyond entries have copy", () => {
    for (const item of careBeyond) {
      assert.ok(item.title.trim().length > 0);
      assert.ok(item.text.trim().length > 10, `${item.title} needs real copy`);
    }
  });

  test("the position statement does not overclaim", () => {
    // Guards against a future edit drifting into a cure claim, which for a
    // chronic-disease clinic is both a legal and a trust problem.
    const banned = /\b(cure|cures|guaranteed|guarantee|permanent cure)\b/i;
    for (const text of [centralMessage, philosophyTagline, closingStatement, rightIntervention]) {
      assert.doesNotMatch(text, banned, `overclaiming language in: ${text}`);
    }
  });
});
