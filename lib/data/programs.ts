import type { TreatmentProgram } from "@/lib/site";
import type { Locale } from "@/lib/i18n";

export const treatmentPrograms: TreatmentProgram[] = [
  {
    slug: "diabetes-metabolic",
    title: "Diabetes & Metabolic Health",
    short:
      "Individual assessment, specialized nutrition, lifestyle protocols, and herbal support targeting blood-sugar balance and metabolic stability.",
    detail:
      "Our diabetes program begins with a full review of your blood-sugar history, diet, and lifestyle. You receive a structured protocol combining the S19 Diabetes Pack, tailored nutrition, and regular follow-up to support steady glucose regulation.",
    conditions: ["Type 2 diabetes", "Pre-diabetes", "Metabolic syndrome", "Fatigue related to blood sugar"],
    titleFr: "Diabète et santé métabolique",
    shortFr:
      "Évaluation individuelle, nutrition spécialisée, protocoles de style de vie et soutien à base de plantes pour l'équilibre glycémique et la stabilité métabolique.",
    detailFr:
      "Notre programme diabète commence par une revue complète de vos antécédents glycémiques, de votre alimentation et de votre mode de vie. Vous recevez un protocole structuré combinant le Pack Diabète S19, une nutrition adaptée et un suivi régulier pour soutenir une régulation stable du glucose.",
    conditionsFr: ["Diabète de type 2", "Pré-diabète", "Syndrome métabolique", "Fatigue liée à la glycémie"],
  },
  {
    slug: "hypertension-cardiovascular",
    title: "Hypertension & Cardiovascular",
    short:
      "Targeted herbal therapeutics focused on blood pressure modulation, micro-circulation enhancement, arterial elasticity, and metabolic risk reduction.",
    detail:
      "A supervision-based program pairing the S19 Hypertension Pack with regular blood-pressure tracking, dietary adjustment, and lifestyle coaching to support healthy arterial function.",
    conditions: ["High blood pressure", "Cholesterol concerns", "Circulatory conditions"],
    titleFr: "Hypertension et santé cardiovasculaire",
    shortFr:
      "Thérapeutiques à base de plantes ciblées sur la modulation de la pression artérielle, l'amélioration de la micro-circulation, l'élasticité artérielle et la réduction du risque métabolique.",
    detailFr:
      "Un programme supervisé associant le Pack Hypertension S19 au suivi régulier de la tension, à l'ajustement alimentaire et au coaching de style de vie pour soutenir une fonction artérielle saine.",
    conditionsFr: ["Tension artérielle élevée", "Problèmes de cholestérol", "Troubles circulatoires"],
  },
  {
    slug: "prostate-mens-health",
    title: "Prostate & Men's Health",
    short:
      "Natural support for prostate enlargement (BPH), urinary tract symptoms, vitality, reproductive health, and overall male wellness.",
    detail:
      "Focused support for male wellness including prostate comfort, healthy urinary flow, and vitality, built around the S19 Prostate Tea and individualized evaluation.",
    conditions: ["Enlarged prostate (BPH)", "Frequent urination", "Urinary discomfort", "Vitality and reproductive health"],
    titleFr: "Prostate et santé masculine",
    shortFr:
      "Soutien naturel pour l'hypertrophie de la prostate (HBP), les symptômes urinaires, la vitalité, la santé reproductive et le bien-être masculin en général.",
    detailFr:
      "Un soutien ciblé pour le bien-être masculin - confort de la prostate, flux urinaire sain et vitalité - autour du Thé Prostatique S19 et d'une évaluation individualisée.",
    conditionsFr: ["Hypertrophie de la prostate (HBP)", "Urinations fréquentes", "Inconfort urinaire", "Vitalité et santé reproductive"],
  },
  {
    slug: "womens-health-hormones",
    title: "Women's Health & Hormones",
    short:
      "Comprehensive care for menstrual irregularity, uterine health, pelvic inflammatory concerns, cysts/fibroids support, and hormonal equilibrium.",
    detail:
      "A gentle, individualized approach to hormonal balance and reproductive wellness, combining botanical support with nutrition and lifestyle alignment.",
    conditions: ["Irregular cycles", "Fibroids / cysts support", "Pelvic discomfort", "Hormonal imbalance"],
    titleFr: "Santé féminine et hormones",
    shortFr:
      "Soins complets pour les irrégularités menstruelles, la santé utérine, les inflammations pelviennes, le soutien des kystes/fibromes et l'équilibre hormonal.",
    detailFr:
      "Une approche douce et individualisée de l'équilibre hormonal et du bien-être reproductif, combinant soutien botanique, nutrition et alignement du mode de vie.",
    conditionsFr: ["Cycles irréguliers", "Soutien fibromes / kystes", "Inconfort pelvien", "Déséquilibre hormonal"],
  },
  {
    slug: "digestive-gut-health",
    title: "Digestive & Gut Health",
    short:
      "Support for gastritis, severe constipation, hemorrhoids, acid reflux, and microbiome restoration through specialized botanical teas and cleansers.",
    detail:
      "A gut-focused protocol combining the S19 Gastritis Pack, digestive teas, and dietary guidance to restore comfortable digestion and a balanced microbiome.",
    conditions: ["Gastritis", "Acid reflux", "Constipation", "Hemorrhoids", "Poor digestion"],
    titleFr: "Santé digestive et intestinale",
    shortFr:
      "Soutien pour la gastrite, la constipation sévère, les hémorroïdes, le reflux acide et la restauration du microbiote grâce à des tisanes et des nettoyants botaniques spécialisés.",
    detailFr:
      "Un protocole axé sur l'intestin combinant le Pack Gastrite S19, des tisanes digestives et des conseils nutritionnels pour restaurer une digestion confortable et un microbiote équilibré.",
    conditionsFr: ["Gastrite", "Reflux acide", "Constipation", "Hémorroïdes", "Mauvaise digestion"],
  },
  {
    slug: "liver-metabolic-cleanse",
    title: "Liver & Metabolic Cleansing",
    short:
      "Clinical detoxification protocols to support hepatic enzyme balance, fatty liver management, kidney filtration, and toxin elimination.",
    detail:
      "A structured cleanse supporting your liver and kidneys, with controlled protocols, hydration guidance, and follow-up labs where appropriate.",
    conditions: ["Fatty liver", "Sluggish liver", "Detox support", "Metabolic reset"],
    titleFr: "Nettoyage hépatique et métabolique",
    shortFr:
      "Protocoles de détoxification clinique pour soutenir l'équilibre des enzymes hépatiques, la gestion du foie gras, la filtration rénale et l'élimination des toxines.",
    detailFr:
      "Une cure structurée soutenant votre foie et vos reins, avec des protocoles encadrés, des conseils d'hydratation et des bilans de suivi lorsque cela est approprié.",
    conditionsFr: ["Foie gras", "Foie paresseux", "Soutien détox", "Réinitialisation métabolique"],
  },
  {
    slug: "integrative-cancer-care",
    title: "Integrative Cancer Care",
    short:
      "Supportive herbal care for patients alongside conventional oncology, focusing on immune fortification, vitality, and reducing treatment strain.",
    detail:
      "Compassionate supportive care designed to complement conventional oncology, focusing on immune fortification, appetite, energy, and well-being during treatment.",
    conditions: ["Supportive care during oncology treatment", "Immune fortification", "Energy and appetite support"],
    titleFr: "Soins intégratifs du cancer",
    shortFr:
      "Soins à base de plantes de soutien pour les patients suivant une oncologie conventionnelle, axés sur le renforcement immunitaire, la vitalité et la réduction de la fatigue du traitement.",
    detailFr:
      "Des soins de soutien compatissants conçus pour compléter l'oncologie conventionnelle - renforcement immunitaire, appétit, énergie et bien-être pendant le traitement.",
    conditionsFr: ["Soins de soutien pendant l'oncologie", "Renforcement immunitaire", "Soutien de l'énergie et de l'appétit"],
  },
  {
    slug: "health-assessment",
    title: "Health Assessment & Review",
    short:
      "In-depth examination of your medical history, previous prescription therapies, diagnostic scans, and physical health concerns.",
    detail:
      "The starting point for every patient: a thorough review of your medical history, previous treatments, lab results, and physical health concerns to design a root-cause herbal strategy.",
    conditions: ["New consultations", "Full health review", "Second opinion on herbal strategy"],
    titleFr: "Évaluation et bilan de santé",
    shortFr:
      "Examen approfondi de vos antécédents médicaux, de vos traitements prescrits antérieurs, de vos examens diagnostiques et de vos préoccupations physiques.",
    detailFr:
      "Le point de départ de chaque patient : une revue complète de vos antécédents médicaux, de vos traitements antérieurs, de vos résultats de laboratoire et de vos préoccupations de santé afin de concevoir une stratégie à base de plantes axée sur la cause racine.",
    conditionsFr: ["Nouvelles consultations", "Bilan de santé complet", "Deuxième avis sur la stratégie végétale"],
  },
  {
    slug: "nutrition-lifestyle-coaching",
    title: "Nutrition & Lifestyle Coaching",
    short:
      "Personalized dietary regimes tailored to your exact metabolic condition in close collaboration with natural health specialists.",
    detail:
      "Long-term healing requires aligning your diet and daily habits with botanical therapeutics. Our coaches build a practical food and lifestyle plan around your condition.",
    conditions: ["Dietary planning", "Weight management", "Lifestyle alignment", "Preventive wellness"],
    titleFr: "Coaching nutrition et mode de vie",
    shortFr:
      "Des régimes alimentaires personnalisés adaptés à votre condition métabolique exacte, en étroite collaboration avec des spécialistes en santé naturelle.",
    detailFr:
      "La guérison à long terme exige d'aligner votre alimentation et vos habitudes quotidiennes sur la thérapeutique botanique. Nos coachs construisent un plan alimentaire et de style de vie pratique autour de votre état.",
    conditionsFr: ["Planification alimentaire", "Gestion du poids", "Alignement du mode de vie", "Bien-être préventif"],
  },
  {
    slug: "other-health-complications",
    title: "Other Health Complications",
    short:
      "A condition not listed above? Tell us about it and we will review your case personally to find the right herbal support.",
    detail:
      "If your health concern is not covered by the programs above, book a consultation and bring your full medical history. We evaluate every situation case by case and design a root-cause herbal strategy for you.",
    conditions: ["Unlisted conditions", "Second opinion", "Personalized review"],
    titleFr: "Autres complications de santé",
    shortFr:
      "Une affection non listée ci-dessus ? Parlez-nous-en et nous examinerons votre cas personnellement pour trouver le soutien adapté.",
    detailFr:
      "Si votre problème de santé n'est pas couvert par les programmes ci-dessus, réservez une consultation et apportez votre historique médical complet. Nous évaluons chaque situation au cas par cas et concevons une stratégie à base de plantes axée sur la cause racine.",
    conditionsFr: ["Affections non listées", "Deuxième avis", "Examen personnalisé"],
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
    textFr: "Évaluation en ligne, consultations téléphoniques et suivi de traitement à distance.",
  },
  {
    title: "Standardized",
    text: "Pure, standardized herbal teas, extracts, and detox packs.",
    titleFr: "Standardisé",
    textFr: "Tisanes, extraits et packs de détox à base de plantes purs et standardisés.",
  },
  {
    title: "Worldwide",
    text: "Reliable shipping across Cameroon and international destinations.",
    titleFr: "Mondial",
    textFr: "Livraison fiable au Cameroun et dans le monde entier.",
  },
];

export interface ClinicalPrinciple {
  title: string;
  text: string;
  titleFr?: string;
  textFr?: string;
}

export const clinicalPrinciples: ClinicalPrinciple[] = [
  {
    title: "Thorough Lab & Medical History Review",
    text: "We integrate conventional medical findings, previous treatments, and laboratory workups into your herbal strategy.",
    titleFr: "Examen approfondi du laboratoire et des antécédents médicaux",
    textFr:
      "Nous intégrons les constats médicaux conventionnels, les traitements antérieurs et les bilans de laboratoire dans votre stratégie à base de plantes.",
  },
  {
    title: "Collaborative Lifestyle & Nutritional Coaching",
    text: "Long-term healing requires aligning your diet and daily habits with botanical therapeutics.",
    titleFr: "Coaching collaboratif en nutrition et style de vie",
    textFr:
      "La guérison à long terme exige d'aligner votre alimentation et vos habitudes quotidiennes sur la thérapeutique botanique.",
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
  if (locale !== "fr") return treatmentPrograms;
  return treatmentPrograms.map((p) => ({
    slug: p.slug,
    title: p.titleFr ?? p.title,
    short: p.shortFr ?? p.short,
    detail: p.detailFr ?? p.detail,
    conditions: p.conditionsFr ?? p.conditions,
  }));
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

export function localizedClinicalPrinciples(locale: Locale) {
  return clinicalPrinciples.map((s) => ({
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