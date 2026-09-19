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
  {
    id: "cat-merch",
    name: "Merch & Branded",
    slug: "merchandise",
    blurb: "Official S19-branded merchandise. Experience S19 in style.",
  },
];

const productImage = (file: string) =>
  `/s19-assets/products/${encodeURIComponent(file)}`;

export const seedProducts: SiteProduct[] = [
  {
    id: "p-oral-miracle",
    name: "S19 Oral Miracle",
    slug: "s19-oral-miracle",
    category: "Wellness Essentials",
    categorySlug: "wellness-essentials",
    price: 2500,
    unit: "Powder",
    badge: "Natural",
    shortDescription:
      "Natural oral-care powder for daily brushing. Cleanses the mouth, freshens breath, whitens teeth, supports healthy gums, and helps prevent cavities.",
    description:
      "A natural oral-care powder for daily brushing. It cleanses the mouth, freshens breath, whitens teeth, supports healthy gums, and helps prevent cavities - a gentle alternative to abrasive commercial toothpastes.",
    usage: "Apply a little to a damp brush and brush as usual, twice daily.",
    image: productImage("S19 Oral Miracle.png"),
    featured: false,
    stock: 80,
  },
  {
    id: "p-sea-salt",
    name: "S19 Sea Salt (Sel Mer)",
    slug: "s19-sea-salt",
    category: "Wellness Essentials",
    categorySlug: "wellness-essentials",
    price: 1000,
    unit: "Natural",
    badge: "Natural",
    shortDescription:
      "Natural sea salt for cooking, drinking water, and salt baths. Adds flavour to meals, provides natural minerals, and supports hydration and relaxation.",
    description:
      "Natural sea salt for cooking, drinking water, and salt baths. It adds flavour to meals, provides natural minerals, supports hydration and relaxation, and is traditionally used for cleansing and removing negative energy.",
    usage: "Use in cooking, in drinking water, or in salt baths as preferred.",
    ingredients: "100% natural sea salt.",
    image: productImage("S19 Sea Salt (Sel Mer).png"),
    featured: false,
    stock: 120,
  },
  {
    id: "p-vision-drops",
    name: "S19 Vision — Herbal Eye Drops",
    slug: "s19-vision-herbal-eye-drops",
    category: "Wellness Essentials",
    categorySlug: "wellness-essentials",
    price: 4800,
    unit: "Eye drops",
    badge: "Herbal",
    shortDescription:
      "A natural herbal eye drop for vision support, including support for glaucoma, cataracts, conjunctivitis, and tired or irritated eyes.",
    description:
      "A natural herbal eye drop for vision support, including support for glaucoma, cataracts, conjunctivitis, and tired or irritated eyes. Fits into a daily eye-care routine under guidance.",
    usage: "Use as recommended during your consultation. Avoid contact with the dropper tip.",
    image: productImage("S19 Vision — Herbal Eye Drops.png"),
    featured: false,
    stock: 60,
  },
  {
    id: "p-activated-charcoal",
    name: "S19 Charbon Médicinal (Activated Charcoal)",
    slug: "s19-activated-charcoal",
    category: "Wellness Essentials",
    categorySlug: "wellness-essentials",
    price: 5000,
    badge: "Pure",
    shortDescription:
      "A natural adsorbent that binds certain toxins in the digestive tract and supports detox care, digestion, and immune wellness.",
    description:
      "A natural adsorbent used to bind certain toxins in the digestive tract. Supports detox care, digestion, and immune wellness; helps with gas, bloating, constipation, diarrhoea, and bad breath linked to intestinal waste; and may support healthy cholesterol and triglyceride levels. Also used as supportive care in diabetes and cancer wellness programmes, and in hospital settings for certain poisonings and drug overdoses. Take away from medicines, vitamins, and meals.",
    usage: "Take as directed, away from medicines, vitamins, and meals.",
    ingredients: "High-grade activated charcoal.",
    image: productImage("S19 Charbon Médicinal (Activated Charcoal).png"),
    featured: false,
    stock: 80,
  },
  {
    id: "p-malaria-typhoid-combo",
    name: "S19 Malaria & Typhoid Combo",
    slug: "s19-malaria-typhoid-combo",
    category: "Treatment Packs",
    categorySlug: "treatment-packs",
    price: 10000,
    badge: "Combo",
    shortDescription:
      "A powerful herbal combination formulated to support recovery from malaria and typhoid fever while boosting the immune system.",
    description:
      "A powerful herbal combination formulated to support recovery from malaria and typhoid fever while boosting the immune system. Traditionally used during fever and convalescence to help restore strength.",
    usage: "Follow the dosing schedule provided with your pack. Take with warm water, away from strong meals.",
    image: productImage("S19 Malaria & Typhoid Combo.png"),
    featured: true,
    stock: 60,
  },
  {
    id: "p-liver-support",
    name: "S19 Liver Support (Détox Foie)",
    slug: "s19-liver-support",
    category: "Treatment Packs",
    categorySlug: "treatment-packs",
    price: 5000,
    badge: "Detox",
    shortDescription:
      "Supports hepatitis B and C care, strengthens liver function, healthy digestion, and fatty-liver management.",
    description:
      "Supports hepatitis B and C care, helps strengthen liver function, and supports the body's natural detoxification processes. Promotes healthy digestion and supports fatty-liver management and liver wellness.",
    usage: "Take as directed in your treatment plan. Drink plenty of water throughout the day.",
    image: productImage("S19 Liver Support (Détox Foie).png"),
    featured: false,
    stock: 60,
  },
  {
    id: "p-prostate-tea",
    name: "S19 Prostate Tea",
    slug: "s19-prostate-tea",
    category: "Herbal Teas",
    categorySlug: "herbal-teas",
    price: 5000,
    badge: "Standardized",
    shortDescription:
      "Supports prostate and kidney health, including men's wellness needs related to prostate enlargement (BPH) and prostatitis.",
    description:
      "Supports prostate and kidney health, including men's wellness needs related to prostate enlargement (BPH) and prostatitis. A pleasant standardized tea for daily use.",
    usage: "Steep one sachet in hot water for 10 minutes. Drink 1-2 cups daily, morning and evening.",
    image: productImage("S19 Prostate Tea.png"),
    featured: false,
    stock: 100,
  },
  {
    id: "p-diabetes-package",
    name: "S19 Diabetes Support Package",
    slug: "s19-diabetes-support-package",
    category: "Treatment Packs",
    categorySlug: "treatment-packs",
    price: 0,
    badge: "Personalized",
    shortDescription:
      "Personalized herbal, nutrition, and lifestyle support for blood-sugar management. Contact S19 for more information.",
    description:
      "Personalized herbal, nutrition, and lifestyle support for blood-sugar management. Each package is built around your individual assessment, lab results, and treatment goals. Contact S19 for more information and personalized pricing.",
    usage: "A personalized program is designed after your health assessment.",
    image: productImage("S19 Diabetes Support Package.png"),
    featured: false,
    stock: 0,
  },
  {
    id: "p-parasite-cleanse",
    name: "S19 Parasite Cleanse Combo",
    slug: "s19-parasite-cleanse-combo",
    category: "Treatment Packs",
    categorySlug: "treatment-packs",
    price: 0,
    badge: "Combo",
    shortDescription:
      "A complete herbal cleanse designed to support the elimination of parasites at egg, larval, and adult stages.",
    description:
      "A complete herbal cleanse designed to support the elimination of parasites at egg, larval, and adult stages. Best run as a supervised program. Contact S19 for more information and pricing.",
    usage: "Follow the step-by-step cleanse schedule provided with your order.",
    image: productImage("S19 Parasite Cleanse Combo.png"),
    featured: false,
    stock: 0,
  },
  {
    id: "p-hemorrhoid-tea",
    name: "S19 Hemorrhoid Tea",
    slug: "s19-hemorrhoid-tea",
    category: "Herbal Teas",
    categorySlug: "herbal-teas",
    price: 5000,
    badge: "Standardized",
    shortDescription:
      "Supports haemorrhoids (piles), indigestion, constipation, and regular bowel function.",
    description:
      "Supports haemorrhoids (piles), indigestion, constipation, and regular bowel function. A standardised botanical tea for gentle, daily digestive support.",
    usage: "Steep one sachet in hot water for 10 minutes. Drink twice daily as part of the program.",
    image: productImage("S19 Hemorrhoid Tea.png"),
    featured: false,
    stock: 100,
  },
  {
    id: "p-fertility-booster",
    name: "S19 Feminine Fertility Booster",
    slug: "s19-feminine-fertility-booster",
    category: "Extracts & Oils",
    categorySlug: "extracts-oils",
    price: 10000,
    unit: "500 mL",
    badge: "Herbal",
    shortDescription:
      "Supports women's reproductive health and may help improve fertility.",
    description:
      "Supports women's reproductive health and may help improve fertility. 500 mL bottle for sustained daily use as part of a reproductive wellness plan.",
    usage: "Take as recommended during your consultation.",
    image: productImage("S19 Feminine Fertility Booster.png"),
    featured: false,
    stock: 50,
  },
  {
    id: "p-black-seed-oil",
    name: "S19 Black Seed Oil (BSO)",
    slug: "s19-black-seed-oil",
    category: "Extracts & Oils",
    categorySlug: "extracts-oils",
    price: 5000,
    unit: "125 mL",
    badge: "100% Cold-Pressed",
    shortDescription:
      "Supports healthy blood-sugar and blood-pressure levels, weight loss, respiratory wellness, skin, cholesterol, and heart health.",
    description:
      "100% cold-pressed black seed oil supporting healthy blood-sugar and blood-pressure levels, weight loss, respiratory wellness (asthma, sinusitis, and allergies), skin health, healthy cholesterol, and heart health.",
    usage: "One teaspoon daily, directly or with food or warm water.",
    ingredients: "100% cold-pressed Nigella Sativa (black seed) oil.",
    image: productImage("S19 Black Seed Oil (BSO).png"),
    featured: false,
    stock: 60,
  },
  {
    id: "p-shea-butter",
    name: "S19 Shea Butter (Beurre de Karité)",
    slug: "s19-shea-butter",
    category: "Wellness Essentials",
    categorySlug: "wellness-essentials",
    price: 5000,
    badge: "Pure",
    shortDescription:
      "Natural moisturiser for dry skin and hair. Softens skin, calms itching and redness, and supports eczema and sunburn care.",
    description:
      "Natural moisturiser for dry skin and hair. Makes skin soft, calms itching and redness, supports eczema, psoriasis, and sunburn care, and keeps hair smooth and shiny. Also helps protect the skin from early signs of ageing.",
    usage: "Apply a small amount to skin or hair as needed.",
    ingredients: "100% pure shea butter.",
    image: productImage("S19 Shea Butter (Beurre de Karité).png"),
    featured: true,
    stock: 70,
  },
  {
    id: "p-natural-soap",
    name: "S19 Natural Soap",
    slug: "s19-natural-soap",
    category: "Wellness Essentials",
    categorySlug: "wellness-essentials",
    price: 750,
    badge: "Plant-Based",
    shortDescription:
      "Plant-based laundry soap for clothes, plates, and everyday home cleaning.",
    description:
      "Plant-based laundry soap for clothes, plates, and everyday home cleaning. A gentle alternative to harsh commercial detergents, helping reduce skin exposure to strong chemical residues.",
    usage: "Use for washing clothes, dishes, and general household cleaning.",
    image: productImage("S19 Natural Soap.png"),
    featured: false,
    stock: 150,
  },
  {
    id: "p-natural-bathing-soap",
    name: "S19 Natural Bathing Soap",
    slug: "s19-natural-bathing-soap",
    category: "Wellness Essentials",
    categorySlug: "wellness-essentials",
    price: 2500,
    badge: "Natural",
    shortDescription:
      "For smoother, brighter-looking skin. Also treats facial & skin acne, rashes, and fungal infections.",
    description:
      "A natural bathing soap for smoother, brighter-looking skin. Gently cleanses while helping to treat facial and body acne, rashes, and fungal infections.",
    usage: "Use daily when bathing. Lather over the skin and rinse well.",
    ingredients: "Natural plant-based soap blend.",
    image: productImage("S19 Natural Bathing Soap.jpg"),
    featured: false,
    stock: 100,
  },
  {
    id: "p-herbal-wine",
    name: "S19 Herbal Wine Reserve",
    slug: "s19-herbal-wine-reserve",
    category: "Extracts & Oils",
    categorySlug: "extracts-oils",
    price: 6000,
    badge: "Wellness Tonic",
    shortDescription:
      "A 100% natural herbal digestive tonic to enjoy before or after meals for comfortable digestion.",
    description:
      "A 100% natural herbal digestive tonic to enjoy before or after meals for comfortable digestion. Also supports natural body cleansing, kidney and liver health, memory, healthy blood-sugar control, and hair growth.",
    usage: "One small glass before or after meals. Not for people avoiding alcohol.",
    image: productImage("S19 Herbal Wine Reserve.png"),
    featured: true,
    stock: 60,
  },
  {
    id: "p-man-pikin",
    name: "S19 Man Pikin",
    slug: "s19-man-pikin",
    category: "Treatment Packs",
    categorySlug: "treatment-packs",
    price: 5000,
    badge: "Men's Health",
    shortDescription:
      "Supports weak erections, premature ejaculation, sperm count, and sperm motility.",
    description:
      "Herbal support for men's sexual and reproductive wellness, including weak erections, premature ejaculation, sperm count, and sperm motility.",
    usage: "Follow the dosing schedule provided with your pack.",
    image: productImage("S19 Man Pikin.png"),
    featured: false,
    stock: 70,
  },
  {
    id: "p-neuro-protect",
    name: "S19 Neuro-Protect",
    slug: "s19-neuro-protect",
    category: "Treatment Packs",
    categorySlug: "treatment-packs",
    price: 5000,
    badge: "Brain Support",
    shortDescription:
      "Supports relief from headaches, stress, insomnia, and mental fatigue. Helps boost memory and brain function.",
    description:
      "Supports relief from headaches, stress, insomnia, and mental fatigue. Helps boost memory and support healthy brain function.",
    usage: "Take as directed in your treatment plan.",
    image: productImage("S19 Neuro-Protect.png"),
    featured: false,
    stock: 70,
  },
  {
    id: "p-flat-tummy-tea",
    name: "S19 Flat Tummy & Weight Loss Herbal Tea",
    slug: "s19-flat-tummy-weight-loss-tea",
    category: "Herbal Teas",
    categorySlug: "herbal-teas",
    price: 0,
    badge: "Standardized",
    shortDescription:
      "Naturally burns fat, cleanses and tones the stomach, and supports metabolism, healthy weight, and regular bowel movement.",
    description:
      "Naturally burns fat, cleanses and tones the stomach, and supports metabolism. Helps reduce belly fat and bloating, supports digestive cleansing and detoxification, promotes healthy digestion and regular bowel movement, and supports healthy weight balance. Contact S19 for pricing.",
    usage: "Steep one sachet in hot water for 10 minutes. Drink once daily, ideally after the main meal.",
    image: productImage("S19 Flat Tummy & Weight Loss Herbal Tea.png"),
    featured: false,
    stock: 0,
  },
  {
    id: "p-experience-hoodie-men",
    name: "Experience S19 Hoodie (Men)",
    slug: "s19-experience-hoodie-men",
    category: "Merch & Branded",
    categorySlug: "merchandise",
    price: 25000,
    badge: "Merch",
    shortDescription:
      "Official Experience S19 hoodie for men. Available in Black, White, Red, Sky Blue, Purple and Pink. Wear the S19 brand wherever you go.",
    description:
      "Show your support for S19 with the official 'Experience S19' hoodie for men. The bold Experience S19 print with the machine-style graphic makes it a standout piece. Available in six colors - Black, White, Red, Sky Blue, Purple and Pink - so you can choose your favourite. Made for everyday comfort and built to last.",
    usage: "Machine wash cold, inside out. Do not bleach. Tumble dry low or hang to dry.",
    ingredients: "Colors: Black, White, Red, Sky Blue, Purple, Pink.",
    image: "/s19-assets/merche/male.jpg",
    featured: true,
    stock: 50,
  },
  {
    id: "p-experience-hoodie-women",
    name: "Experience S19 Hoodie (Women)",
    slug: "s19-experience-hoodie-women",
    category: "Merch & Branded",
    categorySlug: "merchandise",
    price: 25000,
    badge: "Merch",
    shortDescription:
      "Official Experience S19 hoodie for women. Available in Black, White, Red, Sky Blue, Purple and Pink. Wear the S19 brand wherever you go.",
    description:
      "Show your support for S19 with the official 'Experience S19' hoodie for women. The bold Experience S19 print with the machine-style graphic makes it a standout piece. Available in six colors - Black, White, Red, Sky Blue, Purple and Pink - so you can choose your favourite. Designed for a comfortable everyday fit that lasts.",
    usage: "Machine wash cold, inside out. Do not bleach. Tumble dry low or hang to dry.",
    ingredients: "Colors: Black, White, Red, Sky Blue, Purple, Pink.",
    image: "/s19-assets/merche/female.jpg",
    featured: true,
    stock: 50,
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