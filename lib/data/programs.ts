import type { TreatmentProgram } from "@/lib/site";

export const treatmentPrograms: TreatmentProgram[] = [
  {
    slug: "diabetes-metabolic",
    title: "Diabetes & Metabolic Health",
    short:
      "Individual assessment, specialized nutrition, lifestyle protocols, and herbal support targeting blood-sugar balance and metabolic stability.",
    detail:
      "Our diabetes program begins with a full review of your blood-sugar history, diet, and lifestyle. You receive a structured protocol combining the S19 Diabetes Pack, tailored nutrition, and regular follow-up to support steady glucose regulation.",
    conditions: ["Type 2 diabetes", "Pre-diabetes", "Metabolic syndrome", "Fatigue related to blood sugar"],
  },
  {
    slug: "hypertension-cardiovascular",
    title: "Hypertension & Cardiovascular",
    short:
      "Targeted herbal therapeutics focused on blood pressure modulation, micro-circulation enhancement, arterial elasticity, and metabolic risk reduction.",
    detail:
      "A supervision-based program pairing the S19 Hypertension Pack with regular blood-pressure tracking, dietary adjustment, and lifestyle coaching to support healthy arterial function.",
    conditions: ["High blood pressure", "Cholesterol concerns", "Circulatory conditions"],
  },
  {
    slug: "prostate-mens-health",
    title: "Prostate & Men's Health",
    short:
      "Natural support for prostate enlargement (BPH), urinary tract symptoms, vitality, reproductive health, and overall male wellness.",
    detail:
      "Focused support for male wellness including prostate comfort, healthy urinary flow, and vitality, built around the S19 Prostate Tea and individualized evaluation.",
    conditions: ["Enlarged prostate (BPH)", "Frequent urination", "Urinary discomfort", "Vitality and reproductive health"],
  },
  {
    slug: "womens-health-hormones",
    title: "Women's Health & Hormones",
    short:
      "Comprehensive care for menstrual irregularity, uterine health, pelvic inflammatory concerns, cysts/fibroids support, and hormonal equilibrium.",
    detail:
      "A gentle, individualized approach to hormonal balance and reproductive wellness, combining botanical support with nutrition and lifestyle alignment.",
    conditions: ["Irregular cycles", "Fibroids / cysts support", "Pelvic discomfort", "Hormonal imbalance"],
  },
  {
    slug: "digestive-gut-health",
    title: "Digestive & Gut Health",
    short:
      "Support for gastritis, severe constipation, hemorrhoids, acid reflux, and microbiome restoration through specialized botanical teas and cleansers.",
    detail:
      "A gut-focused protocol combining the S19 Gastritis Pack, digestive teas, and dietary guidance to restore comfortable digestion and a balanced microbiome.",
    conditions: ["Gastritis", "Acid reflux", "Constipation", "Hemorrhoids", "Poor digestion"],
  },
  {
    slug: "liver-metabolic-cleanse",
    title: "Liver & Metabolic Cleansing",
    short:
      "Clinical detoxification protocols to support hepatic enzyme balance, fatty liver management, kidney filtration, and toxin elimination.",
    detail:
      "A structured cleanse supporting your liver and kidneys, with controlled protocols, hydration guidance, and follow-up labs where appropriate.",
    conditions: ["Fatty liver", "Sluggish liver", "Detox support", "Metabolic reset"],
  },
  {
    slug: "integrative-cancer-care",
    title: "Integrative Cancer Care",
    short:
      "Supportive herbal care for patients alongside conventional oncology, focusing on immune fortification, vitality, and reducing treatment strain.",
    detail:
      "Compassionate supportive care designed to complement conventional oncology, focusing on immune fortification, appetite, energy, and well-being during treatment.",
    conditions: ["Supportive care during oncology treatment", "Immune fortification", "Energy and appetite support"],
  },
  {
    slug: "health-assessment",
    title: "Health Assessment & Review",
    short:
      "In-depth examination of your medical history, previous prescription therapies, diagnostic scans, and physical health concerns.",
    detail:
      "The starting point for every patient: a thorough review of your medical history, previous treatments, lab results, and physical health concerns to design a root-cause herbal strategy.",
    conditions: ["New consultations", "Full health review", "Second opinion on herbal strategy"],
  },
  {
    slug: "nutrition-lifestyle-coaching",
    title: "Nutrition & Lifestyle Coaching",
    short:
      "Personalized dietary regimes tailored to your exact metabolic condition in close collaboration with natural health specialists.",
    detail:
      "Long-term healing requires aligning your diet and daily habits with botanical therapeutics. Our coaches build a practical food and lifestyle plan around your condition.",
    conditions: ["Dietary planning", "Weight management", "Lifestyle alignment", "Preventive wellness"],
  },
];

export const telehealthSteps = [
  {
    step: "01",
    title: "Remote Health Assessment",
    text: "Review of your symptoms, medical history, and lab reports via WhatsApp or phone call.",
  },
  {
    step: "02",
    title: "Tailored Herbal Dispatch",
    text: "Your prescribed herbal treatment pack is safely shipped to your city or country.",
  },
  {
    step: "03",
    title: "Continuous Follow-Up",
    text: "Regular check-ins on symptom progression, lifestyle adjustment, and dosage.",
  },
];

export const coreStrengths = [
  {
    title: "Individualized",
    text: "Customized herbal treatments based on medical history & lab tests.",
  },
  {
    title: "Tele-Health",
    text: "Online evaluation, phone consults, and remote treatment follow-up.",
  },
  {
    title: "Standardized",
    text: "Pure, standardized herbal teas, extracts, and detox packs.",
  },
  {
    title: "Worldwide",
    text: "Reliable shipping across Cameroon and international destinations.",
  },
];

export const clinicalPrinciples = [
  {
    title: "Thorough Lab & Medical History Review",
    text: "We integrate conventional medical findings, previous treatments, and laboratory workups into your herbal strategy.",
  },
  {
    title: "Collaborative Lifestyle & Nutritional Coaching",
    text: "Long-term healing requires aligning your diet and daily habits with botanical therapeutics.",
  },
];

export const faqs = [
  {
    question: "How do consultations work at S19?",
    answer:
      "Every treatment starts with a health assessment. You can visit the Bafoussam clinic in person or consult remotely through our Tele-Health service via WhatsApp and phone.",
  },
  {
    question: "Can you deliver my herbal pack outside Cameroon?",
    answer:
      "Yes. We ship prescribed herbal packs nationwide in Cameroon (Douala, Yaounde, Bamenda, Buea and more) and worldwide via express courier. Delivery fees depend on your destination.",
  },
  {
    question: "How should I take my herbal remedies?",
    answer:
      "Each pack includes individualized usage instructions, for example '2 teaspoons in hot water, morning and evening'. Always follow the schedule given during your consultation.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept mobile money (MTN Mobile Money and Orange Money), bank transfer, and payment on pickup or delivery. You choose your method at checkout.",
  },
  {
    question: "Are S19 products a substitute for medical treatment?",
    answer:
      "No. Herbal support works alongside and never replaces conventional care. We review your full medical history and coordinate with your existing treatment where possible.",
  },
];

export const deliveryZones = ["Cameroon Nationwide", "Douala", "Yaounde", "Bamenda", "Buea", "Worldwide"];