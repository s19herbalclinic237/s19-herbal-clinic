import type { Locale } from "@/lib/i18n";

export const philosophyQuote =
  "Do not treat blindly. Understand the person, investigate the problem, identify its underlying drivers, and build a comprehensive strategy around them.";

export const whyQuestion = "We also ask: “Why is this happening?”";

export const philosophyDrivers = [
  "Insulin resistance and metabolic dysfunction",
  "Poor nutrition",
  "Chronic inflammation",
  "Oxidative stress",
  "Hormonal imbalance",
  "Nutrient deficiencies",
  "Poor sleep",
  "Chronic psychological stress",
  "Sedentary lifestyle",
  "Obesity and visceral fat",
  "Digestive and gut dysfunction",
  "Kidney or liver dysfunction",
  "Environmental and lifestyle exposures",
  "Persistent or recurrent infections",
  "Medication history",
  "Genetic and family risk factors",
];

/** Compact form of the care pathway, used in the root-cause section. */
export const rootCauseSteps = [
  "Consult",
  "Investigate",
  "Understand",
  "Educate",
  "Address",
  "Support",
  "Monitor",
];

export const assessmentAreas = [
  "Medical history",
  "Previous diagnoses",
  "Current medications",
  "Symptoms",
  "Laboratory investigations",
  "Medical imaging",
  "Blood pressure and other vital signs",
  "Blood glucose monitoring",
  "Nutritional assessment",
  "Lifestyle assessment",
  "Review of previous medical reports",
];

export const herbalismConsiderations = [
  "Pharmacology",
  "Phytochemistry",
  "Human physiology",
  "Appropriate preparation",
  "Dosage",
  "Herb-drug interactions",
  "Contraindications",
  "Toxicity",
  "Patient-specific factors",
  "Available scientific evidence",
];

export const traditionalPlusModern = "Traditional Herbal Knowledge + Modern Scientific Understanding";

/**
 * The pillars of care, in order of emphasis. Herbal medicine leads because
 * naming the practice accurately is both honest and a stronger position than
 * leading with a category the clinic does not primarily occupy.
 * Non-Conventional Therapies sits last: selected approaches used
 * alongside herbal medicine, nutrition and lifestyle, never instead of them.
 */
export const healthPillars = [
  {
    title: "Herbal Medicine",
    text: "Carefully selected medicinal plants and formulations according to the patient's needs.",
  },
  {
    title: "Nutrition",
    text: "Food is one of the most powerful environmental influences on human metabolism. Nutrition forms an important part of our chronic-disease programs.",
  },
  {
    title: "Lifestyle Medicine",
    text: "Physical activity, sunlight, sleep, circadian rhythm, hydration and other lifestyle factors may be addressed.",
  },
  {
    title: "Metabolic Health",
    text: "We pay particular attention to insulin resistance, glucose regulation, visceral fat, lipid abnormalities and other metabolic disturbances.",
  },
  {
    title: "Stress & Nervous-System Support",
    text: "Chronic stress, poor sleep and autonomic imbalance can influence metabolic and cardiovascular health. Breathing practices and relaxation strategies may form part of care.",
  },
  {
    title: "Laboratory Monitoring",
    text: "When appropriate, objective measurements are repeated to determine whether the patient's condition is improving.",
  },
  {
    title: "Patient Education",
    text: "We want patients to understand their bodies and their condition instead of remaining permanently dependent on instructions they do not understand.",
  },
  {
    title: "Non-Conventional Therapies",
    text: "Selected non-conventional therapies may form part of individualized care. When appropriate, they - including electromolecular medicine delivered with specialized high-technology devices - are used alongside herbal medicine, nutrition and lifestyle interventions to support symptom management, recovery and overall well-being.",
  },
];

export const educationQuote =
  "Society needs more health education and less dependence on medication.";

export const educationQuestions = [
  "What is happening?",
  "Why might it be happening?",
  "What can be changed?",
  "What needs to be monitored?",
  "What requires conventional medical treatment?",
  "What can nutrition, lifestyle and herbal medicine reasonably contribute?",
];

export const rightIntervention =
  "Use the right intervention, for the right patient, at the right time.";

export const diabetesIntro =
  "In Type 2 diabetes, reducing blood glucose is important - but we also consider the metabolic processes behind elevated glucose: insulin resistance, excess visceral fat, physical inactivity, nutrition, sleep, stress, inflammation and other relevant risk factors.";

export const diabetesGoals = [
  {
    title: "Blood Sugar Management",
    text: "Bring elevated blood glucose under better control and reduce immediate metabolic risk.",
  },
  {
    title: "Remission",
    text: "For appropriate patients with Type 2 diabetes, work toward maintaining glucose below the diabetic range without glucose-lowering medication where this can be achieved safely under appropriate medical supervision.",
  },
  {
    title: "Durable Metabolic Improvement",
    text: "Address modifiable drivers of Type 2 diabetes - particularly insulin resistance, excess visceral fat, nutrition and inactivity - to improve long-term glucose regulation and reduce the likelihood of recurrence.",
  },
];

export const diabetesJourney = "Management → Remission → Durable Metabolic Health";

export const type1Warning =
  "Type 1 diabetes is fundamentally different. People with Type 1 diabetes require insulin replacement; herbal medicine must never be presented as a substitute for lifesaving insulin.";

export const measurableOutcomes = [
  "Did HbA1c improve?",
  "Did fasting glucose improve?",
  "Did fasting insulin improve?",
  "Did blood pressure improve?",
  "Did inflammatory markers improve?",
  "Did the lipid profile improve?",
  "Did kidney or liver markers change?",
  "Did relevant imaging or other investigations improve?",
];

export const differentiators = [
  {
    title: "Science-Based Herbalism",
    text: "Traditional medicinal plants interpreted through modern scientific knowledge.",
  },
  {
    title: "Root-Cause Thinking",
    text: "Looking beyond symptoms toward contributing biological and lifestyle factors.",
  },
  {
    title: "Laboratory-Guided Care",
    text: "Using objective investigations whenever appropriate rather than treating blindly.",
  },
  {
    title: "Personalized Programs",
    text: "Treatment strategies based on the individual rather than a generic disease formula.",
  },
  {
    title: "Nutrition & Lifestyle Integration",
    text: "Food, movement, sleep, stress and metabolic health are considered part of healthcare.",
  },
  {
    title: "Patient Education",
    text: "Patients should understand their condition and the reasoning behind their program.",
  },
  {
    title: "Continuous Monitoring",
    text: "Progress is followed and strategies can be adjusted according to response.",
  },
  {
    title: "Integrative Thinking",
    text: "Natural medicine and conventional medicine do not have to be enemies. Each has appropriate applications.",
  },
];

export const participation = [
  "Nutrition",
  "Lifestyle changes",
  "Appropriate monitoring",
  "Following treatment instructions",
  "Reporting symptoms and changes",
  "Completing recommended investigations",
  "Learning about their condition",
];

/**
 * The S19 care pathway, in the order care actually happens.
 *
 * Education sits *before* intervention deliberately. A patient who does not
 * understand their own condition is not adhering - they are complying, and the
 * two behave differently over months. "Address" rather than "Correct" because
 * correction is one of several things we do, and naming only that step would
 * misrepresent the model.
 */
export const patientJourney = [
  {
    step: "Consult",
    text: "Understand symptoms, medical history, previous diagnoses, medications, lifestyle and the patient's health objectives.",
  },
  {
    step: "Investigate",
    text: "Review existing medical records and recommend relevant laboratory tests, imaging or other investigations where appropriate.",
  },
  {
    step: "Understand",
    text: "Identify important physiological, metabolic, nutritional, lifestyle and other contributing factors that may be influencing the patient's condition.",
  },
  {
    step: "Educate",
    text: "Explain what is happening and why, what can be changed, what needs monitoring, and what requires conventional medical treatment - so the patient is not permanently dependent on instructions they do not understand.",
  },
  {
    step: "Address",
    text: "Develop an individualized care plan combining herbal medicine, nutrition, lifestyle strategies and clinic-based supportive therapies using specialized high-technology devices.",
  },
  {
    step: "Support",
    text: "Begin the treatment program with clear instructions, patient education and, where appropriate, in-clinic supportive therapies delivered with specialized high-technology devices.",
  },
  {
    step: "Monitor",
    text: "Follow symptoms, treatment tolerance, adherence and objective health measurements such as laboratory results, blood glucose, blood pressure or other relevant markers - adjusting the plan as progress and new information require.",
  },
];

/**
 * Additional services that support the S19 model beyond the care pathway.
 * Surfaced on the About page so these are explicit and never hidden inside the
 * journey cards.
 */
export const careBeyond = [
  {
    title: "Telehealth & WhatsApp follow-up",
    text: "Consult remotely and send laboratory results, photos or updates without always being physically present.",
  },
  {
    title: "Continuous follow-up during treatment",
    text: "S19 actively follows patients throughout their program - not only at the start and the end.",
  },
  {
    title: "Nutrition as part of care",
    text: "Food is one of the most powerful influences on metabolism, so nutrition is built into every program.",
  },
  {
    title: "In-clinic supportive therapies",
    text: "Clinic-based supportive therapies using specialized high-technology devices, delivered alongside herbal and nutritional protocols during in-clinic programs.",
  },
  {
    title: "Treatment duration & progress tracking",
    text: "Structured programs with clear beginning, reassessment and completion points that patients can track.",
  },
  {
    title: "Medication & treatment review",
    text: "We review existing medications and consider herb-drug interactions before anything is prescribed.",
  },
  {
    title: "Referral & medical collaboration",
    text: "S19 is not an emergency facility; when hospital care, imaging, surgery or specialist assessment is needed, we refer and collaborate with conventional medicine.",
  },
  {
    title: "Travelling & international patients",
    text: "Telehealth, product delivery across Cameroon and to supported international destinations, and accommodation support for patients travelling to Bafoussam.",
  },
  {
    title: "Prevention",
    text: "Beyond treating illness, we help correct risk factors and maintain better health over the long term.",
  },
];

export const centralMessage =
  "S19 Herbal Clinic combines science-based herbal medicine, laboratory investigation, nutrition, lifestyle medicine, patient education, continuous monitoring and clinic-based supportive therapies using specialized high-technology devices to provide personalized healthcare focused on identifying and addressing important contributing factors.";

export const philosophyTagline =
  "Science-Based Herbalism. Root-Cause Healthcare. Education. Investigation. Personalization. Monitoring.";

export const closingStatement =
  "The goal is not simply to manage disease. The goal is to build better health.";

/* -------------------------------------------------------------------------- */
/* Public-facing presentations of the care pathway                            */
/* -------------------------------------------------------------------------- */

/**
 * One statement of the clinical process, several presentations of it.
 *
 * `patientJourney` (above) is the seven-step canonical form used on the About
 * page, where the full detail fits. The two arrays below are the shorter
 * public forms demanded by the developer briefs:
 *
 * - `homePathway` collapses Address and Support into one card, because a
 *   six-card grid is what stacks cleanly on a phone.
 * - `programsPathway` replaces the Educate step with Personalize, because the
 *   Programs page is being read by someone deciding what to book rather than
 *   someone learning the method.
 *
 * They are kept here rather than in a page module so the process is described
 * from one place and cannot drift between the two pages.
 */
export interface PathwayStep {
  step: string;
  text: string;
  stepFr?: string;
  textFr?: string;
}

/** Home page: CONSULT -> INVESTIGATE -> UNDERSTAND -> EDUCATE -> ADDRESS & SUPPORT -> MONITOR. */
export const homePathway: PathwayStep[] = [
  {
    step: "Consult",
    text: "Detailed consultation covering concerns, symptoms, medical history, previous treatments and current medications.",
    stepFr: "Consulter",
    textFr:
      "Consultation détaillée couvrant vos préoccupations, symptômes, antécédents médicaux, traitements antérieurs et médicaments actuels.",
  },
  {
    step: "Investigate",
    text: "Review existing laboratory tests, scans and medical records and, where appropriate, request further investigations.",
    stepFr: "Examiner",
    textFr:
      "Examen des analyses de laboratoire, imageries et dossiers médicaux existants et, le cas échéant, demande d'examens complémentaires.",
  },
  {
    step: "Understand",
    text: "Bring the findings together to better understand the condition and contributing factors.",
    stepFr: "Comprendre",
    textFr:
      "Rassembler les éléments pour mieux comprendre l'affection et les facteurs qui y contribuent.",
  },
  {
    step: "Educate",
    text: "Explain what has been identified, why it matters and how the patient can participate in care.",
    stepFr: "Éduquer",
    textFr:
      "Expliquer ce qui a été identifié, pourquoi c'est important et comment le patient peut participer à ses soins.",
  },
  {
    step: "Address & Support",
    text: "Develop an individualized plan that may combine herbal medicine, nutrition, lifestyle interventions and clinic-based supportive therapies using specialized high-technology devices.",
    stepFr: "Agir & Soutenir",
    textFr:
      "Élaborer un plan individualisé pouvant combiner phytothérapie, nutrition, interventions de mode de vie et thérapies de soutien en clinique utilisant des appareils spécialisés de haute technologie.",
  },
  {
    step: "Monitor",
    text: "Follow progress, review relevant measurements/laboratory findings and adjust the plan when appropriate.",
    stepFr: "Suivre",
    textFr:
      "Suivre l'évolution, examiner les mesures et analyses pertinentes et ajuster le plan lorsque c'est approprié.",
  },
];

/** Programs page: CONSULT -> INVESTIGATE -> UNDERSTAND -> PERSONALIZE -> SUPPORT -> MONITOR. */
export const programsPathway: PathwayStep[] = [
  {
    step: "Consult",
    text: "Review your concerns, symptoms, health history, medications and available medical records.",
    stepFr: "Consulter",
    textFr:
      "Examiner vos préoccupations, symptômes, historique de santé, médicaments et dossiers médicaux disponibles.",
  },
  {
    step: "Investigate",
    text: "Review existing findings and, where appropriate, request further laboratory tests, imaging or other medical investigations.",
    stepFr: "Examiner",
    textFr:
      "Examiner les éléments existants et, le cas échéant, demander des analyses, une imagerie ou d'autres examens médicaux complémentaires.",
  },
  {
    step: "Understand",
    text: "Bring the information together to understand your condition and the factors that may be contributing to it.",
    stepFr: "Comprendre",
    textFr:
      "Rassembler les informations pour comprendre votre affection et les facteurs qui peuvent y contribuer.",
  },
  {
    step: "Personalize",
    text: "Develop an individualized care plan suited to your health status, circumstances and objectives.",
    stepFr: "Personnaliser",
    textFr:
      "Élaborer un plan de soins individualisé adapté à votre état de santé, à votre situation et à vos objectifs.",
  },
  {
    step: "Support",
    text: "Begin your program with clear instructions, health education and, where appropriate, clinic-based supportive therapies using specialized high-technology devices.",
    stepFr: "Soutenir",
    textFr:
      "Commencer votre programme avec des consignes claires, une éducation à la santé et, le cas échéant, des thérapies de soutien en clinique utilisant des appareils spécialisés de haute technologie.",
  },
  {
    step: "Monitor",
    text: "Follow progress against your symptoms, measurements and relevant findings, and adjust the plan when appropriate.",
    stepFr: "Suivre",
    textFr:
      "Suivre l'évolution au regard de vos symptômes, mesures et éléments pertinents, et ajuster le plan lorsque c'est approprié.",
  },
];

function localizePathway(locale: Locale, steps: PathwayStep[]) {
  return steps.map((s) => ({
    step: locale === "fr" ? s.stepFr ?? s.step : s.step,
    text: locale === "fr" ? s.textFr ?? s.text : s.text,
  }));
}

export function localizedHomePathway(locale: Locale) {
  return localizePathway(locale, homePathway);
}

export function localizedProgramsPathway(locale: Locale) {
  return localizePathway(locale, programsPathway);
}