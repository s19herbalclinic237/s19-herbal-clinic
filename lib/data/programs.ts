import type { TreatmentProgram } from "@/lib/site";
import type { Locale } from "@/lib/i18n";

/**
 * The ten clinical programs.
 *
 * Source of truth: docs/S19_Programs_Page_Developer_Implementation_Brief.md.
 * Three things in that brief constrain this file and are enforced by
 * tests/programs-content.test.ts:
 *
 * 1. No named product. Programs are not defined by a pack or a tea; product
 *    selection belongs inside the individualized care plan. So no "S19
 *    Diabetes Pack" or "S19 Prostate Tea" appears below.
 * 2. No exact investigations. "Relevant laboratory tests" yes; "HbA1c and
 *    fasting insulin" no. The panels and the interpretation framework are
 *    proprietary.
 * 3. No physiology claims beyond what can be supported. "Micro-circulation
 *    enhancement", "arterial elasticity", "clinical detoxification",
 *    "toxin elimination" and "immune fortification" are gone, replaced with
 *    supportive-care language.
 *
 * Three titles were renamed by the same brief. The slugs changed with them,
 * so `site-footer.tsx` links to `#integrative-cancer-support`.
 */
export const treatmentPrograms: TreatmentProgram[] = [
  {
    slug: "diabetes-metabolic",
    title: "Diabetes & Metabolic Health",
    short:
      "Individualized support for people living with Type 2 diabetes, pre-diabetes and metabolic health concerns, with emphasis on nutrition, lifestyle, appropriate herbal support, education and ongoing monitoring.",
    detail:
      "We begin by reviewing your health history, blood-sugar history, current treatment, medications, nutrition and lifestyle. Relevant medical investigations may be requested where appropriate before your individualized care plan is developed.",
    conditions: ["Type 2 diabetes", "Pre-diabetes", "Metabolic health concerns", "Blood-sugar management support"],
    // Required safety statement: people with Type 1 must not read this program
    // as an alternative to insulin.
    note: "Type 1 diabetes requires insulin. S19 supportive care does not replace insulin therapy.",
    titleFr: "Diabète et santé métabolique",
    shortFr:
      "Soutien individualisé pour les personnes vivant avec un diabète de type 2, un prédiabète ou des préoccupations de santé métabolique, en mettant l'accent sur la nutrition, le mode de vie, un soutien herbal approprié, l'éducation et un suivi continu.",
    detailFr:
      "Nous commençons par revoir votre historique de santé, votre historique glycémique, votre traitement actuel, vos médicaments, votre nutrition et votre mode de vie. Des examens médicaux pertinents peuvent être demandés, le cas échéant, avant que votre plan de soins individualisé ne soit élaboré.",
    conditionsFr: ["Diabète de type 2", "Prédiabète", "Préoccupations métaboliques", "Soutien à la gestion de la glycémie"],
    noteFr: "Le diabète de type 1 nécessite de l'insuline. Les soins de soutien S19 ne remplacent pas l'insulinothérapie.",
  },
  {
    slug: "hypertension-cardiovascular",
    title: "Hypertension & Cardiovascular Wellness",
    short:
      "Individualized support for blood-pressure and cardiovascular wellness, with attention to nutrition, lifestyle, metabolic risk factors, appropriate herbal support and regular monitoring.",
    detail:
      "Care begins with an individualized review of your blood-pressure history, medications, medical information, lifestyle and relevant contributing factors. Additional investigations may be requested where appropriate before recommendations are made.",
    conditions: ["High blood pressure", "Cardiovascular wellness", "Circulatory health", "Metabolic risk-factor support"],
    note: "Patients should not independently stop or reduce prescribed blood-pressure medication.",
    noteKind: "safety",
    titleFr: "Hypertension et bien-être cardiovasculaire",
    shortFr:
      "Soutien individualisé pour la tension artérielle et le bien-être cardiovasculaire, en accordant de l'attention à la nutrition, au mode de vie, aux facteurs de risque métaboliques, à un soutien herbal approprié et à un suivi régulier.",
    detailFr:
      "Les soins commencent par une revue individualisée de votre historique tensionnel, de vos médicaments, de vos informations médicales, de votre mode de vie et des facteurs contributifs pertinents. Des examens complémentaires peuvent être demandés, le cas échéant, avant que des recommandations soient formulées.",
    conditionsFr: ["Hypertension artérielle", "Bien-être cardiovasculaire", "Santé circulatoire", "Soutien aux facteurs de risque métaboliques"],
    noteFr: "Les patients ne doivent pas arrêter ni réduire d'eux-mêmes un traitement antihypertenseur prescrit.",
  },
  {
    slug: "prostate-mens-health",
    title: "Prostate & Men's Health",
    short: "Personalized support for prostate, urinary, reproductive and general men's health concerns.",
    detail:
      "We review symptoms, health history, medications and available medical information before developing an individualized support plan. Relevant laboratory tests, imaging or other investigations may be requested where appropriate.",
    conditions: ["Prostate wellness", "Urinary symptoms", "Male reproductive wellness", "General men's health"],
    titleFr: "Prostate et santé masculine",
    shortFr: "Soutien personnalisé pour les préoccupations prostatiques, urinaires, reproductives et plus généralement de santé masculine.",
    detailFr:
      "Nous revoyons les symptômes, l'historique de santé, les médicaments et les informations médicales disponibles avant d'élaborer un plan de soutien individualisé. Les analyses de laboratoire, l'imagerie ou d'autres examens pertinents peuvent être demandés, le cas échéant.",
    conditionsFr: ["Bien-être prostatique", "Symptômes urinaires", "Bien-être reproductif masculin", "Santé masculine générale"],
  },
  {
    slug: "womens-health-hormones",
    title: "Women's Health & Hormones",
    short: "Individualized support for menstrual, reproductive, hormonal and metabolic health concerns in women.",
    detail:
      "Care begins with a detailed review of symptoms, menstrual and reproductive history, previous treatment, medications and available medical records. Relevant investigations may be requested where appropriate to guide individualized care.",
    conditions: ["Menstrual irregularities", "Fibroid/cyst support", "Pelvic health concerns", "Hormonal and metabolic wellness"],
    titleFr: "Santé féminine et hormones",
    shortFr: "Soutien individualisé pour les préoccupations menstruelles, reproductives, hormonales et métaboliques chez la femme.",
    detailFr:
      "Les soins commencent par une revue détaillée des symptômes, de l'historique menstruel et reproductif, des traitements antérieurs, des médicaments et des dossiers médicaux disponibles. Les examens pertinents peuvent être demandés, le cas échéant, afin d'orienter des soins individualisés.",
    conditionsFr: ["Irrégularités menstruelles", "Soutien fibromes / kystes", "Préoccupations pelviennes", "Bien-être hormonal et métabolique"],
  },
  {
    slug: "digestive-gut-health",
    title: "Digestive & Gut Health",
    short:
      "Individualized support for digestive symptoms and gastrointestinal wellness through appropriate herbal care, nutrition and lifestyle guidance.",
    detail:
      "We review symptoms, diet, medications, previous treatment and relevant medical history. Further medical investigations may be requested where appropriate before an individualized support plan is developed.",
    conditions: ["Gastritis support", "Reflux-related concerns", "Constipation", "Digestive discomfort", "General digestive wellness"],
    titleFr: "Santé digestive et intestinale",
    shortFr:
      "Soutien individualisé pour les symptômes digestifs et le bien-être gastro-intestinal par une phytothérapie appropriée, une nutrition adaptée et des conseils de mode de vie.",
    detailFr:
      "Nous revoyons les symptômes, l'alimentation, les médicaments, les traitements antérieurs et l'historique médical pertinent. Des examens médicaux complémentaires peuvent être demandés, le cas échéant, avant qu'un plan de soutien individualisé ne soit élaboré.",
    conditionsFr: ["Soutien gastrite", "Préoccupations de reflux", "Constipation", "Inconfort digestif", "Bien-être digestif général"],
  },
  {
    // Renamed from `liver-metabolic-cleanse` by the brief: "cleansing" implied a
    // detox the clinic does not offer.
    slug: "liver-metabolic-health",
    title: "Liver & Metabolic Health",
    short:
      "Personalized support for liver and metabolic wellness with attention to nutrition, lifestyle, medications, appropriate herbal support and relevant medical monitoring.",
    detail:
      "Your medical history, current treatment and available findings are reviewed before recommendations are made. Relevant laboratory tests, imaging or other investigations may be requested where appropriate.",
    conditions: ["Fatty-liver support", "Liver wellness", "Metabolic health", "Nutrition and lifestyle support"],
    titleFr: "Santé hépatique et métabolique",
    shortFr:
      "Soutien personnalisé pour le bien-être hépatique et métabolique, en accordant de l'attention à la nutrition, au mode de vie, aux médicaments, à un soutien herbal approprié et au suivi médical pertinent.",
    detailFr:
      "Votre historique médical, votre traitement actuel et les constatations disponibles sont revus avant que des recommandations soient formulées. Les analyses de laboratoire, l'imagerie ou d'autres examens pertinents peuvent être demandés, le cas échéant.",
    conditionsFr: ["Soutien foie gras", "Bien-être hépatique", "Santé métabolique", "Soutien nutrition et mode de vie"],
  },
  {
    // Renamed from `integrative-cancer-care`. "Support" is the honest word: the
    // clinic supports people through oncology treatment, it does not treat
    // cancer.
    slug: "integrative-cancer-support",
    title: "Integrative Cancer Support",
    short:
      "Individualized supportive care for people living with cancer, designed to work alongside appropriate conventional oncology care.",
    detail:
      "We review the patient's confirmed diagnosis, available medical records, current or previous treatment, medications, nutrition and overall health status. Additional medical investigations may be requested where appropriate. Support is individualized around the patient's needs and conventional treatment plan.",
    conditions: [
      "Nutrition and lifestyle support",
      "General wellbeing",
      "Appetite and energy support",
      "Supportive care alongside oncology",
    ],
    note: "S19 cancer support does not replace medically necessary oncology care, surgery, chemotherapy, radiotherapy or other specialist treatment when indicated.",
    titleFr: "Soutien intégratif du cancer",
    shortFr:
      "Soins de soutien individualisés pour les personnes vivant avec un cancer, conçus pour fonctionner en parallèle d'une prise en charge conventionnelle adaptée.",
    detailFr:
      "Nous revoyons le diagnostic confirmé du patient, les dossiers médicaux disponibles, le traitement actuel ou antérieur, les médicaments, la nutrition et l'état de santé général. Des examens médicaux complémentaires peuvent être demandés, le cas échéant. Le soutien est individualisé en fonction des besoins du patient et de son plan de traitement conventionnel.",
    conditionsFr: [
      "Soutien nutritionnel et de mode de vie",
      "Bien-être général",
      "Soutien de l'appétit et de l'énergie",
      "Soins de soutien en cancérologie",
    ],
    noteFr: "Le soutien S19 contre le cancer ne remplace pas les soins d'oncologie médicalement nécessaires, la chirurgie, la chimiothérapie, la radiothérapie ou tout autre traitement spécialisé lorsqu'ils sont indiqués.",
  },
  {
    slug: "health-assessment",
    title: "Health Assessment & Review",
    short:
      "A comprehensive starting point for patients who need their health history, symptoms, previous treatment and available medical information reviewed before deciding on the most appropriate S19 program.",
    detail:
      "We review your health concerns, medical history, medications, previous treatment and available records. Where necessary, further laboratory tests, imaging or other investigations may be requested before recommendations are made.",
    conditions: [
      "New consultations",
      "Comprehensive health review",
      "Review before personalized herbal support",
      "Unsure which program fits",
    ],
    titleFr: "Évaluation et bilan de santé",
    shortFr:
      "Un point de départ complet pour les patients qui souhaitent que leur historique de santé, leurs symptômes, leurs traitements antérieurs et les informations médicales disponibles soient revus avant de choisir le programme S19 le plus approprié.",
    detailFr:
      "Nous revoyons vos préoccupations de santé, votre historique médical, vos médicaments, vos traitements antérieurs et les dossiers disponibles. Si nécessaire, des analyses supplémentaires, une imagerie ou d'autres examens peuvent être demandés avant que des recommandations soient formulées.",
    conditionsFr: [
      "Nouvelles consultations",
      "Revue complète de la santé",
      "Revue avant un soutien herbal personnalisé",
      "Incertain du programme adapté",
    ],
  },
  {
    slug: "nutrition-lifestyle-support",
    title: "Nutrition & Lifestyle Support",
    short:
      "Personalized nutrition and lifestyle guidance designed to support the patient's wider care plan and long-term health goals.",
    detail:
      "Recommendations are individualized according to the patient's health condition, nutritional needs, lifestyle, treatment plan and practical circumstances, with ongoing education and follow-up where appropriate.",
    conditions: [
      "Dietary planning",
      "Weight-management support",
      "Lifestyle modification",
      "Preventive wellness",
      "Treatment-plan adherence",
    ],
    titleFr: "Soutien nutrition et mode de vie",
    shortFr:
      "Conseils nutritionnels et de mode de vie personnalisés, conçus pour soutenir le plan de soins global du patient et ses objectifs de santé à long terme.",
    detailFr:
      "Les recommandations sont individualisées selon l'état de santé du patient, ses besoins nutritionnels, son mode de vie, son plan de traitement et ses circonstances pratiques, avec une éducation continue et un suivi le cas échéant.",
    conditionsFr: [
      "Planification alimentaire",
      "Soutien à la gestion du poids",
      "Modification du mode de vie",
      "Bien-être préventif",
      "Observance du plan de traitement",
    ],
  },
  {
    // Renamed from `other-health-complications`. "Complications" reads as a
    // clinical severity claim on a page where we have not assessed anyone.
    slug: "other-health-concerns",
    title: "Other Health Concerns",
    short:
      "If your condition is not listed above, you can still book an assessment. Each case is reviewed individually before S19 determines whether and how we may appropriately support you.",
    detail:
      "Bring or submit your relevant medical history and available records. Further investigations may be requested where appropriate. If your needs fall outside the scope of S19 care, referral to an appropriate conventional healthcare professional may be recommended.",
    conditions: ["Unlisted health concerns", "Individual case review", "General consultation", "Referral where appropriate"],
    titleFr: "Autres préoccupations de santé",
    shortFr:
      "Si votre affection ne figure pas dans la liste ci-dessus, vous pouvez tout de même demander une évaluation. Chaque cas est revu individuellement avant que S19 ne détermine si et comment nous pouvons vous apporter un soutien approprié.",
    detailFr:
      "Apportez ou transmettez votre historique médical pertinent et les dossiers disponibles. Des examens complémentaires peuvent être demandés, le cas échéant. Si vos besoins sortent du champ des soins S19, une orientation vers un professionnel de santé conventionnel approprié peut être recommandée.",
    conditionsFr: [
      "Préoccupations non listées",
      "Revue individuelle du cas",
      "Consultation générale",
      "Orientation si nécessaire",
    ],
  },
];

export interface TelehealthStep {
  step: string;
  title: string;
  text: string;
  titleFr?: string;
  textFr?: string;
}

export const telehealthSteps: TelehealthStep[] = [
  {
    step: "01",
    title: "Remote Health Assessment",
    text: "Review of your symptoms, medical history, and lab reports via WhatsApp or phone call.",
    titleFr: "Évaluation de santé à distance",
    textFr:
      "Examen de vos symptômes, antécédents médicaux et rapports de laboratoire via WhatsApp ou appel téléphonique.",
  },
  {
    step: "02",
    title: "Tailored Herbal Dispatch",
    text: "Your prescribed herbal package is safely shipped to your city or country.",
    titleFr: "Envoi d'herbes sur mesure",
    textFr:
      "Votre pack de plantes prescrit est expédié en toute sécurité vers votre ville ou votre pays.",
  },
  {
    step: "03",
    title: "Continuous Follow-Up",
    text: "Regular check-ins on symptom progression, lifestyle adjustment, and dosage.",
    titleFr: "Suivi continu",
    textFr:
      "Points de contrôle réguliers sur l'évolution des symptômes, l'ajustement du mode de vie et le dosage.",
  },
];

export interface StrengthItem {
  title: string;
  text: string;
  titleFr?: string;
  textFr?: string;
}

export const coreStrengths: StrengthItem[] = [
  {
    title: "Individualized",
    text: "Customized herbal treatments based on medical history & lab tests.",
    titleFr: "Individualisé",
    textFr:
      "Traitements à base de plantes personnalisés selon les antécédents médicaux et les analyses de laboratoire.",
  },
  {
    title: "Tele-Health",
    text: "Online evaluation, phone consults, and remote treatment follow-up.",
    titleFr: "Télé-santé",
    textFr:
      "Évaluation en ligne, consultations téléphoniques et suivi de traitement à distance.",
  },
  {
    title: "Standardized",
    text: "Pure, standardized herbal teas, extracts, and detox packs.",
    titleFr: "Standardisé",
    textFr:
      "Tisanes, extraits et packs de détox à base de plantes purs et standardisés.",
  },
  {
    title: "Worldwide",
    text: "Reliable shipping across Cameroon and international destinations.",
    titleFr: "Mondial",
    textFr:
      "Livraison fiable au Cameroun et dans le monde entier.",
  },
];

export interface FaqItem {
  question: string;
  answer: string;
  questionFr?: string;
  answerFr?: string;
}

export const faqs: FaqItem[] = [
  {
    question: "How do consultations work at S19?",
    answer:
      "Every treatment starts with a health assessment. You can visit the Bafoussam clinic in person or consult remotely through our Tele-Health service via WhatsApp and phone.",
    questionFr: "Comment fonctionnent les consultations à S19 ?",
    answerFr:
      "Chaque traitement commence par une évaluation de santé. Vous pouvez vous rendre à la clinique de Bafoussam ou consulter à distance via notre service de Télé-santé par WhatsApp et téléphone.",
  },
  {
    question: "Can you deliver my herbal pack outside Cameroon?",
    answer:
      "Yes. We ship prescribed herbal packs nationwide in Cameroon (Douala, Yaounde, Bamenda, Buea and more) and worldwide via express courier. Delivery fees depend on your destination.",
    questionFr: "Pouvez-vous livrer mon pack d'herbes hors du Cameroun ?",
    answerFr:
      "Oui. Nous expédions les packs prescrits dans tout le Cameroun (Douala, Yaoundé, Bamenda, Buéa et plus) et dans le monde entier par coursier express. Les frais de livraison dépendent de votre destination.",
  },
  {
    question: "How should I take my herbal remedies?",
    answer:
      "Each pack includes individualized usage instructions, for example '2 teaspoons in hot water, morning and evening'. Always follow the schedule given during your consultation.",
    questionFr: "Comment dois-je prendre mes remèdes à base de plantes ?",
    answerFr:
      "Chaque pack comprend des instructions d'utilisation individualisées, par exemple « 2 cuillères à café dans l'eau chaude, matin et soir ». Suivez toujours le programme donné lors de votre consultation.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept mobile money (MTN Mobile Money and Orange Money), bank transfer, and payment on pickup or delivery. You choose your method at checkout.",
    questionFr: "Quels moyens de paiement acceptez-vous ?",
    answerFr:
      "Nous acceptons le mobile money (MTN Mobile Money et Orange Money), le virement bancaire et le paiement au retrait ou à la livraison. Vous choisissez votre méthode au moment du paiement.",
  },
  {
    question: "Are S19 products a substitute for medical treatment?",
    answer:
      "No. Herbal support works alongside and never replaces conventional care. We review your full medical history and coordinate with your existing treatment where possible.",
    questionFr: "Les produits S19 remplacent-ils un traitement médical ?",
    answerFr:
      "Non. Le soutien à base de plantes s'ajoute aux soins conventionnels et ne les remplace jamais. Nous examinons votre historique médical complet et coordonnons avec votre traitement existant chaque fois que possible.",
  },
];

export const deliveryZones = ["Cameroon Nationwide", "Douala", "Yaounde", "Bamenda", "Buea", "Worldwide"];

export function localizedPrograms(locale: Locale): TreatmentProgram[] {
  return treatmentPrograms.map((p) =>
    locale === "fr"
      ? {
          slug: p.slug,
          title: p.titleFr ?? p.title,
          short: p.shortFr ?? p.short,
          detail: p.detailFr ?? p.detail,
          conditions: p.conditionsFr ?? p.conditions,
          note: p.noteFr ?? p.note,
          noteKind: p.noteKind,
        }
      : { ...p }
  );
}

export function localizedTelehealthSteps(locale: Locale) {
  return telehealthSteps.map((s) => ({
    step: s.step,
    title: locale === "fr" ? s.titleFr ?? s.title : s.title,
    text: locale === "fr" ? s.textFr ?? s.text : s.text,
  }));
}

export function localizedCoreStrengths(locale: Locale) {
  return coreStrengths.map((s) => ({
    title: locale === "fr" ? s.titleFr ?? s.title : s.title,
    text: locale === "fr" ? s.textFr ?? s.text : s.text,
  }));
}

export function localizedFaqs(locale: Locale) {
  return faqs.map((f) => ({
    question: locale === "fr" ? f.questionFr ?? f.question : f.question,
    answer: locale === "fr" ? f.answerFr ?? f.answer : f.answer,
  }));
}