import type { SiteCategory, SiteProduct } from "@/lib/site";

export const productCategories: SiteCategory[] = [
  {
    id: "cat-treatment",
    name: "Treatment Packs",
    slug: "treatment-packs",
    blurb: "Complete herbal programs for specific health conditions.",
  },
  {
    id: "cat-teas",
    name: "Herbal Teas",
    slug: "herbal-teas",
    blurb: "Standardized botanical tea blends for daily therapeutic support.",
  },
  {
    id: "cat-extracts",
    name: "Extracts & Oils",
    slug: "extracts-oils",
    blurb: "Pure cold-pressed oils and concentrated botanical extracts.",
  },
  {
    id: "cat-wellness",
    name: "Wellness Essentials",
    slug: "wellness-essentials",
    blurb: "Everyday natural health products for the whole home.",
  },
];

const img = (id: string, w = 900) =>
  `https://images.unsplash.com/${id}?q=80&w=${w}&auto=format&fit=crop`;

export const seedProducts: SiteProduct[] = [
  {
    id: "p-diabetes",
    name: "S19 Diabetes Pack",
    slug: "s19-diabetes-pack",
    category: "Treatment Packs",
    categorySlug: "treatment-packs",
    price: 35000,
    badge: "Standardized",
    shortDescription:
      "Herbal compound designed to support blood-glucose regulation and pancreatic vitality.",
    description:
      "A complete herbal program supporting blood-sugar balance and metabolic stability. Combined with a tailored diet and lifestyle protocol, the S19 Diabetes Pack supports steady glucose regulation, improves energy, and helps protect pancreatic function under clinical supervision.",
    usage:
      "Recommended dosage depends on your individual assessment. Typical use is one measure in warm water, morning and evening. Always follow the exact schedule given during your consultation.",
    ingredients:
      "Standardized botanical blend. Full ingredient list is provided with your pack and depends on your individual assessment.",
    image: img("photo-1544787219-7f47ccb76574"),
    featured: true,
    stock: 50,
  },
  {
    id: "p-hypertension",
    name: "S19 Hypertension Pack",
    slug: "s19-hypertension-pack",
    category: "Treatment Packs",
    categorySlug: "treatment-packs",
    price: 32000,
    badge: "Standardized",
    shortDescription:
      "Cardiovascular botanical formula aiding natural arterial pressure balance.",
    description:
      "Targeted herbal therapeutics focused on blood pressure modulation, micro-circulation enhancement, arterial elasticity, and metabolic risk reduction. Best taken as part of a supervised program with regular pressure checks.",
    usage:
      "Follow the individualized dosing schedule from your consultation. Usually taken twice daily with water before meals.",
    image: img("photo-1576092768241-dec231879fc3"),
    featured: true,
    stock: 50,
  },
  {
    id: "p-gastritis",
    name: "S19 Gastritis Pack",
    slug: "s19-gastritis-pack",
    category: "Treatment Packs",
    categorySlug: "treatment-packs",
    price: 28000,
    badge: "Standardized",
    shortDescription:
      "Soothes stomach lining inflammation, ulcers, and acute gastrointestinal discomfort.",
    description:
      "Formulated to calm irritated stomach lining, reduce acidity distress, and support healing of ulcers. Often combined with the digestive tea protocol for gastritis, severe constipation, hemorrhoids, acid reflux, and microbiome restoration.",
    usage:
      "Take as directed in your treatment plan. Typically dissolved in warm water and taken on a settled stomach.",
    image: img("photo-1597481499750-3e6b22637e12"),
    featured: true,
    stock: 50,
  },
  {
    id: "p-liver-kidney",
    name: "S19 Liver & Kidney Cleanse",
    slug: "s19-liver-kidney-cleanse",
    category: "Treatment Packs",
    categorySlug: "treatment-packs",
    price: 30000,
    badge: "Detox",
    shortDescription:
      "Detoxifying formula facilitating renal and hepatic elimination of waste.",
    description:
      "Clinical detoxification protocol to support hepatic enzyme balance, fatty liver management, kidney filtration, and toxin elimination. Best paired with the S19 nutrition coaching plan.",
    usage:
      "One course typically lasts 2-4 weeks. Drink plenty of water and follow the program hand-out provided with your order.",
    image: img("photo-1563178406-4cdc2923acbc"),
    featured: false,
    stock: 50,
  },
  {
    id: "p-prostate",
    name: "S19 Prostate Tea",
    slug: "s19-prostate-tea",
    category: "Herbal Teas",
    categorySlug: "herbal-teas",
    price: 25000,
    badge: "Standardized",
    shortDescription:
      "Botanical blend supporting healthy urinary flow and prostate wellness in men.",
    description:
      "Natural support for prostate enlargement (BPH), urinary tract symptoms, vitality, reproductive health, and overall male wellness. A pleasant standardized tea for daily use.",
    usage: "Steep one sachet in hot water for 10 minutes. Drink 1-2 cups daily, morning and evening.",
    image: img("photo-1416879595882-3373a0480b5b"),
    featured: true,
    stock: 100,
  },
  {
    id: "p-hemorrhoids",
    name: "S19 Hemorrhoids Tea",
    slug: "s19-hemorrhoids-tea",
    category: "Herbal Teas",
    categorySlug: "herbal-teas",
    price: 22000,
    badge: "Standardized",
    shortDescription:
      "Relieves pile symptoms, strengthens venous tone, and eases bowel movements.",
    description:
      "Targeted botanical tea supporting venous tone and regularity, easing the discomfort of hemorrhoids and severe constipation.",
    usage: "Steep one sachet in hot water for 10 minutes. Drink twice daily as part of the program.",
    image: img("photo-1564890369478-c89ca6d9cde9"),
    featured: false,
    stock: 100,
  },
  {
    id: "p-malaria-typhoid",
    name: "S19 Malaria & Typhoid Tea",
    slug: "s19-malaria-typhoid-tea",
    category: "Herbal Teas",
    categorySlug: "herbal-teas",
    price: 15000,
    badge: "Standardized",
    shortDescription:
      "Time-honored bitter botanical blend for fever support and convalescence.",
    description:
      "A standardized bitter formula traditionally used in support of recovery from malaria and typhoid, helping restore appetite and strength during convalescence.",
    usage: "Steep one sachet in hot water for 10 minutes. Drink morning and evening for 1-2 weeks.",
    image: img("photo-1512621776951-a57141f2eefd"),
    featured: false,
    stock: 100,
  },
  {
    id: "p-slimming-tea",
    name: "S19 Slimming Tea",
    slug: "s19-slimming-tea",
    category: "Herbal Teas",
    categorySlug: "herbal-teas",
    price: 25000,
    badge: "Standardized",
    shortDescription:
      "Weight-management tea supporting metabolism, digestion, and appetite balance.",
    description:
      "Formulated to support a healthy metabolism and gentle digestion as part of the S19 nutrition and lifestyle program for weight management.",
    usage: "Steep one sachet in hot water for 10 minutes. Drink once daily, ideally after the main meal.",
    image: img("photo-1498837167922-ddd27525d352"),
    featured: false,
    stock: 80,
  },
  {
    id: "p-black-seed-oil",
    name: "S19 Pure Black Seed Oil",
    slug: "s19-pure-black-seed-oil",
    category: "Extracts & Oils",
    categorySlug: "extracts-oils",
    price: 20000,
    badge: "100% Cold-Pressed",
    shortDescription:
      "Cold-pressed Nigella Sativa oil for immune boosting and cellular defense.",
    description:
      "100% cold-pressed Nigella Sativa (black seed) oil, prized for its immune-supporting and antioxidant properties. A versatile daily addition to the diet.",
    usage: "One teaspoon daily, directly or with food or warm water. Not a replacement for medical treatment.",
    ingredients: "100% cold-pressed Nigella Sativa oil.",
    image: img("photo-1608571423902-eed4a5ad8108"),
    featured: true,
    stock: 60,
  },
  {
    id: "p-raw-honey",
    name: "S19 Raw Medicinal Honey",
    slug: "s19-raw-medicinal-honey",
    category: "Wellness Essentials",
    categorySlug: "wellness-essentials",
    price: 18000,
    badge: "Unpasteurized",
    shortDescription:
      "Unpasteurized, pure forest honey rich in active enzymes and antimicrobials.",
    description:
      "Pure raw forest honey, unpasteurized and unprocessed, rich in natural enzymes and antimicrobial activity. Ideal with herbal teas or as a natural sweetener.",
    usage: "One teaspoon with warm water or tea, once or twice daily.",
    ingredients: "100% raw forest honey. Not suitable for infants under 12 months.",
    image: img("photo-1587049352846-4a222e784d38"),
    featured: false,
    stock: 60,
  },
  {
    id: "p-activated-charcoal",
    name: "S19 Activated Charcoal",
    slug: "s19-activated-charcoal",
    category: "Wellness Essentials",
    categorySlug: "wellness-essentials",
    price: 10000,
    badge: "Pure",
    shortDescription:
      "High-grade activated charcoal for digestive comfort and toxin binding support.",
    description:
      "A quality activated charcoal used traditionally to support digestive comfort and assist the body's natural elimination of ingested impurities.",
    usage: "Take as directed on the label, away from meals and other medications.",
    image: img("photo-1466637574441-749b8f19452f"),
    featured: false,
    stock: 80,
  },
  {
    id: "p-toothpaste-powder",
    name: "S19 Toothpaste Powder",
    slug: "s19-toothpaste-powder",
    category: "Wellness Essentials",
    categorySlug: "wellness-essentials",
    price: 8000,
    badge: "Natural",
    shortDescription:
      "Traditional herbal tooth powder for gum support and a clean mouth.",
    description:
      "An herbal tooth powder without harsh synthetic additives, supporting healthy gums, fresh breath, and natural oral care.",
    usage: "Apply a little to a damp brush and brush as usual, twice daily.",
    image: img("photo-1441986300917-64674bd600d8"),
    featured: false,
    stock: 80,
  },
  {
    id: "p-castor-oil",
    name: "S19 Castor Oil",
    slug: "s19-castor-oil",
    category: "Extracts & Oils",
    categorySlug: "extracts-oils",
    price: 12000,
    badge: "Pure",
    shortDescription:
      "Pure, cold-pressed castor oil for topical and household wellness use.",
    description:
      "A pure grade castor oil used traditionally for topical relief, skin and hair conditioning, and cleansing rituals.",
    usage: "For external use. Apply a small amount as directed.",
    ingredients: "100% pure cold-pressed castor oil.",
    image: img("photo-1587474260584-136574528ed5"),
    featured: false,
    stock: 60,
  },
  {
    id: "p-herbal-wine",
    name: "S19 Herbal Wine",
    slug: "s19-herbal-wine",
    category: "Extracts & Oils",
    categorySlug: "extracts-oils",
    price: 20000,
    badge: "Wellness Tonic",
    shortDescription:
      "Botanical-infused tonic wine supporting circulation and vitality.",
    description:
      "A carefully crafted herbal tonic wine, traditionally used to support circulation, appetite, and general vitality.",
    usage: "One small glass (about 25ml) after a meal. Not for people avoiding alcohol.",
    image: img("photo-1510812431401-41d2bd2722f3"),
    featured: false,
    stock: 60,
  },
];

export function getStaticProductBySlug(slug: string): SiteProduct | undefined {
  return seedProducts.find((p) => p.slug === slug);
}

export function getStaticProducts(): SiteProduct[] {
  return seedProducts.slice();
}

export function getStaticFeaturedProducts(): SiteProduct[] {
  return seedProducts.filter((p) => p.featured);
}

export function getStaticCategories(): SiteCategory[] {
  return productCategories.slice();
}