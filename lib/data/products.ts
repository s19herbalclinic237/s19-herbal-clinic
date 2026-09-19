import type { SiteCategory, SiteProduct } from "@/lib/site";

export const productCategories: SiteCategory[] = [
  {
    id: "cat-treatment",
    name: "Treatment Packs",
    nameFr: "Packs de traitement",
    slug: "treatment-packs",
    blurb: "Complete herbal programs for specific health conditions.",
  },
  {
    id: "cat-teas",
    name: "Herbal Teas",
    nameFr: "Tisanes",
    slug: "herbal-teas",
    blurb: "Standardized botanical tea blends for daily therapeutic support.",
  },
  {
    id: "cat-extracts",
    name: "Extracts & Oils",
    nameFr: "Extraits & huiles",
    slug: "extracts-oils",
    blurb: "Pure cold-pressed oils and concentrated botanical extracts.",
  },
  {
    id: "cat-wellness",
    name: "Wellness Essentials",
    nameFr: "Essentiels bien-être",
    slug: "wellness-essentials",
    blurb: "Everyday natural health products for the whole home.",
  },
  {
    id: "cat-merch",
    name: "Merch & Branded",
    nameFr: "Merchandising & marque",
    slug: "merchandise",
    blurb: "Official S19-branded merchandise. Experience S19 in style.",
  },
];

const productImage = (file: string) =>
  `/s19-assets/products/${encodeURIComponent(file)}`;

const CATEGORY_FR: Record<string, string> = {
  "Treatment Packs": "Packs de traitement",
  "Herbal Teas": "Tisanes",
  "Extracts & Oils": "Extraits & huiles",
  "Wellness Essentials": "Essentiels bien-être",
  "Merch & Branded": "Merchandising & marque",
};

export const seedProducts: SiteProduct[] = [
  {
    id: "p-oral-miracle",
    name: "S19 Oral Miracle",
    nameFr: "S19 Oral Miracle",
    slug: "s19-oral-miracle",
    category: "Wellness Essentials",
    categoryFr: CATEGORY_FR["Wellness Essentials"],
    categorySlug: "wellness-essentials",
    price: 2500,
    unit: "Powder",
    unitFr: "Poudre",
    badge: "Natural",
    badgeFr: "Naturel",
    shortDescription:
      "Natural oral-care powder for daily brushing. Cleanses the mouth, freshens breath, whitens teeth, supports healthy gums, and helps prevent cavities.",
    shortDescriptionFr:
      "Poudre naturelle de soin bucco-dentaire pour le brossage quotidien. Nettoie la bouche, rafraîchit l'haleine, blanchit les dents, soutient des gencives saines et aide à prévenir les caries.",
    description:
      "A natural oral-care powder for daily brushing. It cleanses the mouth, freshens breath, whitens teeth, supports healthy gums, and helps prevent cavities - a gentle alternative to abrasive commercial toothpastes.",
    descriptionFr:
      "Une poudre naturelle de soin bucco-dentaire pour le brossage quotidien. Elle nettoie la bouche, rafraîchit l'haleine, blanchit les dents, soutient des gencives saines et aide à prévenir les caries - une alternative douce aux dentifrices commerciaux abrasifs.",
    usage: "Apply a little to a damp brush and brush as usual, twice daily.",
    usageFr:
      "Appliquez un peu de poudre sur une brosse humide et brossez comme d'habitude, deux fois par jour.",
    image: productImage("S19 Oral Miracle.png"),
    featured: false,
    stock: 80,
  },
  {
    id: "p-sea-salt",
    name: "S19 Sea Salt (Sel Mer)",
    nameFr: "S19 Sel de mer (Sel Mer)",
    slug: "s19-sea-salt",
    category: "Wellness Essentials",
    categoryFr: CATEGORY_FR["Wellness Essentials"],
    categorySlug: "wellness-essentials",
    price: 1000,
    unit: "Natural",
    unitFr: "Naturel",
    badge: "Natural",
    badgeFr: "Naturel",
    shortDescription:
      "Natural sea salt for cooking, drinking water, and salt baths. Adds flavour to meals, provides natural minerals, and supports hydration and relaxation.",
    shortDescriptionFr:
      "Sel de mer naturel pour la cuisine, l'eau de boisson et les bains de sel. Ajoute de la saveur aux repas, apporte des minéraux naturels et soutient l'hydratation et la relaxation.",
    description:
      "Natural sea salt for cooking, drinking water, and salt baths. It adds flavour to meals, provides natural minerals, supports hydration and relaxation, and is traditionally used for cleansing and removing negative energy.",
    descriptionFr:
      "Sel de mer naturel pour la cuisine, l'eau de boisson et les bains de sel. Il ajoute de la saveur aux repas, apporte des minéraux naturels, soutient l'hydratation et la relaxation, et est traditionnellement utilisé pour la purification et l'élimination des énergies négatives.",
    usage: "Use in cooking, in drinking water, or in salt baths as preferred.",
    usageFr:
      "Utilisez en cuisine, dans l'eau de boisson ou dans les bains de sel selon vos préférences.",
    ingredients: "100% natural sea salt.",
    ingredientsFr: "100 % sel de mer naturel.",
    image: productImage("S19 Sea Salt (Sel Mer).png"),
    featured: false,
    stock: 120,
  },
  {
    id: "p-vision-drops",
    name: "S19 Vision — Herbal Eye Drops",
    nameFr: "S19 Vision — Gouttes oculaires à base de plantes",
    slug: "s19-vision-herbal-eye-drops",
    category: "Wellness Essentials",
    categoryFr: CATEGORY_FR["Wellness Essentials"],
    categorySlug: "wellness-essentials",
    price: 4800,
    unit: "Eye drops",
    unitFr: "Gouttes oculaires",
    badge: "Herbal",
    badgeFr: "Plantes",
    shortDescription:
      "A natural herbal eye drop for vision support, including support for glaucoma, cataracts, conjunctivitis, and tired or irritated eyes.",
    shortDescriptionFr:
      "Une goutte oculaire naturelle à base de plantes pour le soutien de la vision, notamment en cas de glaucome, de cataracte, de conjonctivite et d'yeux fatigués ou irrités.",
    description:
      "A natural herbal eye drop for vision support, including support for glaucoma, cataracts, conjunctivitis, and tired or irritated eyes. Fits into a daily eye-care routine under guidance.",
    descriptionFr:
      "Une goutte oculaire naturelle à base de plantes pour le soutien de la vision, notamment en cas de glaucome, de cataracte, de conjonctivite et d'yeux fatigués ou irrités. S'intègre à une routine quotidienne de soins des yeux sous supervision.",
    usage: "Use as recommended during your consultation. Avoid contact with the dropper tip.",
    usageFr:
      "Utilisez selon les recommandations de votre consultation. Évitez tout contact de l'embout avec les yeux.",
    image: productImage("S19 Vision — Herbal Eye Drops.png"),
    featured: false,
    stock: 60,
  },
  {
    id: "p-activated-charcoal",
    name: "S19 Charbon Médicinal (Activated Charcoal)",
    nameFr: "S19 Charbon Médicinal (Charbon actif)",
    slug: "s19-activated-charcoal",
    category: "Wellness Essentials",
    categoryFr: CATEGORY_FR["Wellness Essentials"],
    categorySlug: "wellness-essentials",
    price: 5000,
    badge: "Pure",
    badgeFr: "Pur",
    shortDescription:
      "A natural adsorbent that binds certain toxins in the digestive tract and supports detox care, digestion, and immune wellness.",
    shortDescriptionFr:
      "Un adsorbant naturel qui fixe certaines toxines dans le tube digestif et soutient la détoxification, la digestion et le bien-être immunitaire.",
    description:
      "A natural adsorbent used to bind certain toxins in the digestive tract. Supports detox care, digestion, and immune wellness; helps with gas, bloating, constipation, diarrhoea, and bad breath linked to intestinal waste; and may support healthy cholesterol and triglyceride levels. Also used as supportive care in diabetes and cancer wellness programmes, and in hospital settings for certain poisonings and drug overdoses. Take away from medicines, vitamins, and meals.",
    descriptionFr:
      "Un adsorbant naturel utilisé pour fixer certaines toxines dans le tube digestif. Soutient la détoxification, la digestion et le bien-être immunitaire ; aide en cas de gaz, ballonnements, constipation, diarrhée et mauvaise haleine liée aux déchets intestinaux ; et peut soutenir des taux sains de cholestérol et de triglycérides. Également utilisé comme soin de soutien dans les programmes de bien-être contre le diabète et le cancer, ainsi qu'en milieu hospitalier pour certaines intoxications et surdoses de médicaments. À prendre à distance des médicaments, des vitamines et des repas.",
    usage: "Take as directed, away from medicines, vitamins, and meals.",
    usageFr:
      "À prendre selon les instructions, à distance des médicaments, des vitamines et des repas.",
    ingredients: "High-grade activated charcoal.",
    ingredientsFr: "Charbon actif de haute qualité.",
    image: productImage("S19 Charbon Médicinal (Activated Charcoal).png"),
    featured: false,
    stock: 80,
  },
  {
    id: "p-malaria-typhoid-combo",
    name: "S19 Malaria & Typhoid Combo",
    nameFr: "S19 Combo Paludisme & Typhoïde",
    slug: "s19-malaria-typhoid-combo",
    category: "Treatment Packs",
    categoryFr: CATEGORY_FR["Treatment Packs"],
    categorySlug: "treatment-packs",
    price: 10000,
    badge: "Combo",
    badgeFr: "Combo",
    shortDescription:
      "A powerful herbal combination formulated to support recovery from malaria and typhoid fever while boosting the immune system.",
    shortDescriptionFr:
      "Une combinaison de plantes puissante formulée pour soutenir la guérison du paludisme et de la fièvre typhoïde tout en renforçant le système immunitaire.",
    description:
      "A powerful herbal combination formulated to support recovery from malaria and typhoid fever while boosting the immune system. Traditionally used during fever and convalescence to help restore strength.",
    descriptionFr:
      "Une combinaison de plantes puissante formulée pour soutenir la guérison du paludisme et de la fièvre typhoïde tout en renforçant le système immunitaire. Traditionnellement utilisée pendant la fièvre et la convalescence pour aider à restaurer les forces.",
    usage: "Follow the dosing schedule provided with your pack. Take with warm water, away from strong meals.",
    usageFr:
      "Suivez le programme de dosage fourni avec votre pack. À prendre avec de l'eau tiède, à distance des repas copieux.",
    image: productImage("S19 Malaria & Typhoid Combo.png"),
    featured: true,
    stock: 60,
  },
  {
    id: "p-liver-support",
    name: "S19 Liver Support (Détox Foie)",
    nameFr: "S19 Soutien du foie (Détox Foie)",
    slug: "s19-liver-support",
    category: "Treatment Packs",
    categoryFr: CATEGORY_FR["Treatment Packs"],
    categorySlug: "treatment-packs",
    price: 5000,
    badge: "Detox",
    badgeFr: "Détox",
    shortDescription:
      "Supports hepatitis B and C care, strengthens liver function, healthy digestion, and fatty-liver management.",
    shortDescriptionFr:
      "Soutient la prise en charge de l'hépatite B et C, renforce la fonction hépatique, la digestion saine et la prise en charge du foie gras.",
    description:
      "Supports hepatitis B and C care, helps strengthen liver function, and supports the body's natural detoxification processes. Promotes healthy digestion and supports fatty-liver management and liver wellness.",
    descriptionFr:
      "Soutient la prise en charge de l'hépatite B et C, aide à renforcer la fonction hépatique et soutient les processus naturels de détoxification du corps. Favorise une digestion saine et soutient la prise en charge du foie gras et le bien-être du foie.",
    usage: "Take as directed in your treatment plan. Drink plenty of water throughout the day.",
    usageFr:
      "À prendre selon les instructions de votre plan de traitement. Buvez beaucoup d'eau tout au long de la journée.",
    image: productImage("S19 Liver Support (Détox Foie).png"),
    featured: false,
    stock: 60,
  },
  {
    id: "p-prostate-tea",
    name: "S19 Prostate Tea",
    nameFr: "S19 Tisane de la prostate",
    slug: "s19-prostate-tea",
    category: "Herbal Teas",
    categoryFr: CATEGORY_FR["Herbal Teas"],
    categorySlug: "herbal-teas",
    price: 5000,
    badge: "Standardized",
    badgeFr: "Standardisée",
    shortDescription:
      "Supports prostate and kidney health, including men's wellness needs related to prostate enlargement (BPH) and prostatitis.",
    shortDescriptionFr:
      "Soutient la santé de la prostate et des reins, y compris les besoins de bien-être masculin liés à l'hypertrophie de la prostate (HBP) et à la prostatite.",
    description:
      "Supports prostate and kidney health, including men's wellness needs related to prostate enlargement (BPH) and prostatitis. A pleasant standardized tea for daily use.",
    descriptionFr:
      "Soutient la santé de la prostate et des reins, y compris les besoins de bien-être masculin liés à l'hypertrophie de la prostate (HBP) et à la prostatite. Une tisane standardisée agréable pour un usage quotidien.",
    usage: "Steep one sachet in hot water for 10 minutes. Drink 1-2 cups daily, morning and evening.",
    usageFr:
      "Infusez un sachet dans de l'eau chaude pendant 10 minutes. Buvez 1 à 2 tasses par jour, matin et soir.",
    image: productImage("S19 Prostate Tea.png"),
    featured: false,
    stock: 100,
  },
  {
    id: "p-diabetes-package",
    name: "S19 Diabetes Support Package",
    nameFr: "S19 Pack de soutien au diabète",
    slug: "s19-diabetes-support-package",
    category: "Treatment Packs",
    categoryFr: CATEGORY_FR["Treatment Packs"],
    categorySlug: "treatment-packs",
    price: 0,
    badge: "Personalized",
    badgeFr: "Personnalisé",
    shortDescription:
      "Personalized herbal, nutrition, and lifestyle support for blood-sugar management. Contact S19 for more information.",
    shortDescriptionFr:
      "Soutien personnalisé à base de plantes, nutritionnel et lié au mode de vie pour la gestion de la glycémie. Contactez S19 pour plus d'informations.",
    description:
      "Personalized herbal, nutrition, and lifestyle support for blood-sugar management. Each package is built around your individual assessment, lab results, and treatment goals. Contact S19 for more information and personalized pricing.",
    descriptionFr:
      "Soutien personnalisé à base de plantes, nutritionnel et lié au mode de vie pour la gestion de la glycémie. Chaque pack est construit autour de votre évaluation individuelle, de vos résultats de laboratoire et de vos objectifs de traitement. Contactez S19 pour plus d'informations et une tarification personnalisée.",
    usage: "A personalized program is designed after your health assessment.",
    usageFr:
      "Un programme personnalisé est conçu après votre évaluation de santé.",
    image: productImage("S19 Diabetes Support Package.png"),
    featured: false,
    stock: 0,
  },
  {
    id: "p-parasite-cleanse",
    name: "S19 Parasite Cleanse Combo",
    nameFr: "S19 Combo nettoyage des parasites",
    slug: "s19-parasite-cleanse-combo",
    category: "Treatment Packs",
    categoryFr: CATEGORY_FR["Treatment Packs"],
    categorySlug: "treatment-packs",
    price: 0,
    badge: "Combo",
    badgeFr: "Combo",
    shortDescription:
      "A complete herbal cleanse designed to support the elimination of parasites at egg, larval, and adult stages.",
    shortDescriptionFr:
      "Un nettoyage à base de plantes complet conçu pour soutenir l'élimination des parasites aux stades œuf, larvaire et adulte.",
    description:
      "A complete herbal cleanse designed to support the elimination of parasites at egg, larval, and adult stages. Best run as a supervised program. Contact S19 for more information and pricing.",
    descriptionFr:
      "Un nettoyage à base de plantes complet conçu pour soutenir l'élimination des parasites aux stades œuf, larvaire et adulte. Mieux réalisé dans le cadre d'un programme supervisé. Contactez S19 pour plus d'informations et une tarification.",
    usage: "Follow the step-by-step cleanse schedule provided with your order.",
    usageFr:
      "Suivez le programme de nettoyage étape par étape fourni avec votre commande.",
    image: productImage("S19 Parasite Cleanse Combo.png"),
    featured: false,
    stock: 0,
  },
  {
    id: "p-hemorrhoid-tea",
    name: "S19 Hemorrhoid Tea",
    nameFr: "S19 Tisane des hémorroïdes",
    slug: "s19-hemorrhoid-tea",
    category: "Herbal Teas",
    categoryFr: CATEGORY_FR["Herbal Teas"],
    categorySlug: "herbal-teas",
    price: 5000,
    badge: "Standardized",
    badgeFr: "Standardisée",
    shortDescription:
      "Supports haemorrhoids (piles), indigestion, constipation, and regular bowel function.",
    shortDescriptionFr:
      "Soutient les hémorroïdes, l'indigestion, la constipation et le bon fonctionnement intestinal.",
    description:
      "Supports haemorrhoids (piles), indigestion, constipation, and regular bowel function. A standardised botanical tea for gentle, daily digestive support.",
    descriptionFr:
      "Soutient les hémorroïdes, l'indigestion, la constipation et le bon fonctionnement intestinal. Une tisane botanique standardisée pour un soutien digestif doux et quotidien.",
    usage: "Steep one sachet in hot water for 10 minutes. Drink twice daily as part of the program.",
    usageFr:
      "Infusez un sachet dans de l'eau chaude pendant 10 minutes. Buvez deux fois par jour dans le cadre du programme.",
    image: productImage("S19 Hemorrhoid Tea.png"),
    featured: false,
    stock: 100,
  },
  {
    id: "p-fertility-booster",
    name: "S19 Feminine Fertility Booster",
    nameFr: "S19 Stimulateur de fertilité féminine",
    slug: "s19-feminine-fertility-booster",
    category: "Extracts & Oils",
    categoryFr: CATEGORY_FR["Extracts & Oils"],
    categorySlug: "extracts-oils",
    price: 10000,
    unit: "500 mL",
    unitFr: "500 ml",
    badge: "Herbal",
    badgeFr: "Plantes",
    shortDescription:
      "Supports women's reproductive health and may help improve fertility.",
    shortDescriptionFr:
      "Soutient la santé reproductive des femmes et peut aider à améliorer la fertilité.",
    description:
      "Supports women's reproductive health and may help improve fertility. 500 mL bottle for sustained daily use as part of a reproductive wellness plan.",
    descriptionFr:
      "Soutient la santé reproductive des femmes et peut aider à améliorer la fertilité. Flacon de 500 ml pour une utilisation quotidienne soutenue dans le cadre d'un plan de bien-être reproductif.",
    usage: "Take as recommended during your consultation.",
    usageFr:
      "À prendre selon les recommandations de votre consultation.",
    image: productImage("S19 Feminine Fertility Booster.png"),
    featured: false,
    stock: 50,
  },
  {
    id: "p-black-seed-oil",
    name: "S19 Black Seed Oil (BSO)",
    nameFr: "S19 Huile de nigelle (BSO)",
    slug: "s19-black-seed-oil",
    category: "Extracts & Oils",
    categoryFr: CATEGORY_FR["Extracts & Oils"],
    categorySlug: "extracts-oils",
    price: 5000,
    unit: "125 mL",
    unitFr: "125 ml",
    badge: "100% Cold-Pressed",
    badgeFr: "100 % pressée à froid",
    shortDescription:
      "Supports healthy blood-sugar and blood-pressure levels, weight loss, respiratory wellness, skin, cholesterol, and heart health.",
    shortDescriptionFr:
      "Soutient des taux sains de glycémie et de tension artérielle, la perte de poids, le bien-être respiratoire, la peau, le cholestérol et la santé cardiaque.",
    description:
      "100% cold-pressed black seed oil supporting healthy blood-sugar and blood-pressure levels, weight loss, respiratory wellness (asthma, sinusitis, and allergies), skin health, healthy cholesterol, and heart health.",
    descriptionFr:
      "Huile de nigelle 100 % pressée à froid soutenant des taux sains de glycémie et de tension artérielle, la perte de poids, le bien-être respiratoire (asthme, sinusite et allergies), la santé de la peau, un cholestérol sain et la santé cardiaque.",
    usage: "One teaspoon daily, directly or with food or warm water.",
    usageFr:
      "Une cuillère à café par jour, directement ou avec de la nourriture ou de l'eau tiède.",
    ingredients: "100% cold-pressed Nigella Sativa (black seed) oil.",
    ingredientsFr: "Huile de nigelle (Nigella Sativa) 100 % pressée à froid.",
    image: productImage("S19 Black Seed Oil (BSO).png"),
    featured: false,
    stock: 60,
  },
  {
    id: "p-shea-butter",
    name: "S19 Shea Butter (Beurre de Karité)",
    nameFr: "S19 Beurre de karité",
    slug: "s19-shea-butter",
    category: "Wellness Essentials",
    categoryFr: CATEGORY_FR["Wellness Essentials"],
    categorySlug: "wellness-essentials",
    price: 5000,
    badge: "Pure",
    badgeFr: "Pur",
    shortDescription:
      "Natural moisturiser for dry skin and hair. Softens skin, calms itching and redness, and supports eczema and sunburn care.",
    shortDescriptionFr:
      "Hydratant naturel pour peaux et cheveux secs. Adoucit la peau, calme les démangeaisons et les rougeurs, et soutient le soin de l'eczéma et des coups de soleil.",
    description:
      "Natural moisturiser for dry skin and hair. Makes skin soft, calms itching and redness, supports eczema, psoriasis, and sunburn care, and keeps hair smooth and shiny. Also helps protect the skin from early signs of ageing.",
    descriptionFr:
      "Hydratant naturel pour peaux et cheveux secs. Rend la peau douce, calme les démangeaisons et les rougeurs, soutient le soin de l'eczéma, du psoriasis et des coups de soleil, et garde les cheveux lisses et brillants. Aide également à protéger la peau des premiers signes de vieillissement.",
    usage: "Apply a small amount to skin or hair as needed.",
    usageFr:
      "Appliquez une petite quantité sur la peau ou les cheveux selon les besoins.",
    ingredients: "100% pure shea butter.",
    ingredientsFr: "100 % beurre de karité pur.",
    image: productImage("S19 Shea Butter (Beurre de Karité).png"),
    featured: true,
    stock: 70,
  },
  {
    id: "p-natural-soap",
    name: "S19 Natural Soap",
    nameFr: "S19 Savon naturel",
    slug: "s19-natural-soap",
    category: "Wellness Essentials",
    categoryFr: CATEGORY_FR["Wellness Essentials"],
    categorySlug: "wellness-essentials",
    price: 750,
    badge: "Plant-Based",
    badgeFr: "Végétal",
    shortDescription:
      "Plant-based laundry soap for clothes, plates, and everyday home cleaning.",
    shortDescriptionFr:
      "Savon de lessive à base de plantes pour les vêtements, la vaisselle et le nettoyage domestique quotidien.",
    description:
      "Plant-based laundry soap for clothes, plates, and everyday home cleaning. A gentle alternative to harsh commercial detergents, helping reduce skin exposure to strong chemical residues.",
    descriptionFr:
      "Savon de lessive à base de plantes pour les vêtements, la vaisselle et le nettoyage domestique quotidien. Une alternative douce aux détergents commerciaux agressifs, contribuant à réduire l'exposition de la peau aux résidus chimiques puissants.",
    usage: "Use for washing clothes, dishes, and general household cleaning.",
    usageFr:
      "Utilisez pour laver les vêtements, la vaisselle et le nettoyage général de la maison.",
    image: productImage("S19 Natural Soap.png"),
    featured: false,
    stock: 150,
  },
  {
    id: "p-natural-bathing-soap",
    name: "S19 Natural Bathing Soap",
    nameFr: "S19 Savon de bain naturel",
    slug: "s19-natural-bathing-soap",
    category: "Wellness Essentials",
    categoryFr: CATEGORY_FR["Wellness Essentials"],
    categorySlug: "wellness-essentials",
    price: 2500,
    badge: "Natural",
    badgeFr: "Naturel",
    shortDescription:
      "For smoother, brighter-looking skin. Also treats facial & skin acne, rashes, and fungal infections.",
    shortDescriptionFr:
      "Pour une peau plus lisse et plus éclatante. Traite également l'acné du visage et de la peau, les éruptions cutanées et les infections fongiques.",
    description:
      "A natural bathing soap for smoother, brighter-looking skin. Gently cleanses while helping to treat facial and body acne, rashes, and fungal infections.",
    descriptionFr:
      "Un savon de bain naturel pour une peau plus lisse et plus éclatante. Nettoie en douceur tout en aidant à traiter l'acné du visage et du corps, les éruptions cutanées et les infections fongiques.",
    usage: "Use daily when bathing. Lather over the skin and rinse well.",
    usageFr:
      "Utilisez quotidiennement au bain. Faites mousser sur la peau puis rincez abondamment.",
    ingredients: "Natural plant-based soap blend.",
    ingredientsFr: "Mélange naturel de savon à base de plantes.",
    image: productImage("S19 Natural Bathing Soap.jpg"),
    featured: false,
    stock: 100,
  },
  {
    id: "p-herbal-wine",
    name: "S19 Herbal Wine Reserve",
    nameFr: "S19 Réserve de vin aux plantes",
    slug: "s19-herbal-wine-reserve",
    category: "Extracts & Oils",
    categoryFr: CATEGORY_FR["Extracts & Oils"],
    categorySlug: "extracts-oils",
    price: 6000,
    badge: "Wellness Tonic",
    badgeFr: "Tonique de bien-être",
    shortDescription:
      "A 100% natural herbal digestive tonic to enjoy before or after meals for comfortable digestion.",
    shortDescriptionFr:
      "Un tonique digestif aux plantes 100 % naturel à savourer avant ou après les repas pour une digestion confortable.",
    description:
      "A 100% natural herbal digestive tonic to enjoy before or after meals for comfortable digestion. Also supports natural body cleansing, kidney and liver health, memory, healthy blood-sugar control, and hair growth.",
    descriptionFr:
      "Un tonique digestif aux plantes 100 % naturel à savourer avant ou après les repas pour une digestion confortable. Soutient également la purification naturelle du corps, la santé des reins et du foie, la mémoire, un contrôle sain de la glycémie et la croissance des cheveux.",
    usage: "One small glass before or after meals. Not for people avoiding alcohol.",
    usageFr:
      "Un petit verre avant ou après les repas. Déconseillé aux personnes qui évitent l'alcool.",
    image: productImage("S19 Herbal Wine Reserve.png"),
    featured: true,
    stock: 60,
  },
  {
    id: "p-man-pikin",
    name: "S19 Man Pikin",
    nameFr: "S19 Man Pikin",
    slug: "s19-man-pikin",
    category: "Treatment Packs",
    categoryFr: CATEGORY_FR["Treatment Packs"],
    categorySlug: "treatment-packs",
    price: 5000,
    badge: "Men's Health",
    badgeFr: "Santé masculine",
    shortDescription:
      "Supports weak erections, premature ejaculation, sperm count, and sperm motility.",
    shortDescriptionFr:
      "Soutient les érections faibles, l'éjaculation précoce, le nombre de spermatozoïdes et leur mobilité.",
    description:
      "Herbal support for men's sexual and reproductive wellness, including weak erections, premature ejaculation, sperm count, and sperm motility.",
    descriptionFr:
      "Soutien à base de plantes pour le bien-être sexuel et reproductif masculin, notamment les érections faibles, l'éjaculation précoce, le nombre de spermatozoïdes et leur mobilité.",
    usage: "Follow the dosing schedule provided with your pack.",
    usageFr:
      "Suivez le programme de dosage fourni avec votre pack.",
    image: productImage("S19 Man Pikin.png"),
    featured: false,
    stock: 70,
  },
  {
    id: "p-neuro-protect",
    name: "S19 Neuro-Protect",
    nameFr: "S19 Neuro-Protect",
    slug: "s19-neuro-protect",
    category: "Treatment Packs",
    categoryFr: CATEGORY_FR["Treatment Packs"],
    categorySlug: "treatment-packs",
    price: 5000,
    badge: "Brain Support",
    badgeFr: "Soutien cérébral",
    shortDescription:
      "Supports relief from headaches, stress, insomnia, and mental fatigue. Helps boost memory and brain function.",
    shortDescriptionFr:
      "Soutient le soulagement des maux de tête, du stress, de l'insomnie et de la fatigue mentale. Aide à stimuler la mémoire et les fonctions cérébrales.",
    description:
      "Supports relief from headaches, stress, insomnia, and mental fatigue. Helps boost memory and support healthy brain function.",
    descriptionFr:
      "Soutient le soulagement des maux de tête, du stress, de l'insomnie et de la fatigue mentale. Aide à stimuler la mémoire et à soutenir le bon fonctionnement du cerveau.",
    usage: "Take as directed in your treatment plan.",
    usageFr:
      "À prendre selon les instructions de votre plan de traitement.",
    image: productImage("S19 Neuro-Protect.png"),
    featured: false,
    stock: 70,
  },
  {
    id: "p-flat-tummy-tea",
    name: "S19 Flat Tummy & Weight Loss Herbal Tea",
    nameFr: "S19 Tisane ventre plat & minceur",
    slug: "s19-flat-tummy-weight-loss-tea",
    category: "Herbal Teas",
    categoryFr: CATEGORY_FR["Herbal Teas"],
    categorySlug: "herbal-teas",
    price: 0,
    badge: "Standardized",
    badgeFr: "Standardisée",
    shortDescription:
      "Naturally burns fat, cleanses and tones the stomach, and supports metabolism, healthy weight, and regular bowel movement.",
    shortDescriptionFr:
      "Brûle naturellement les graisses, nettoie et tonifie l'estomac, et soutient le métabolisme, un poids sain et un transit régulier.",
    description:
      "Naturally burns fat, cleanses and tones the stomach, and supports metabolism. Helps reduce belly fat and bloating, supports digestive cleansing and detoxification, promotes healthy digestion and regular bowel movement, and supports healthy weight balance. Contact S19 for pricing.",
    descriptionFr:
      "Brûle naturellement les graisses, nettoie et tonifie l'estomac, et soutient le métabolisme. Aide à réduire la graisse du ventre et les ballonnements, soutient le nettoyage digestif et la détoxification, favorise une digestion saine et un transit régulier, et soutient un poids équilibré. Contactez S19 pour la tarification.",
    usage: "Steep one sachet in hot water for 10 minutes. Drink once daily, ideally after the main meal.",
    usageFr:
      "Infusez un sachet dans de l'eau chaude pendant 10 minutes. Buvez une fois par jour, idéalement après le repas principal.",
    image: productImage("S19 Flat Tummy & Weight Loss Herbal Tea.png"),
    featured: false,
    stock: 0,
  },
  {
    id: "p-sozo",
    name: "S19 SOZO — Advanced Herbal Wellness Package",
    nameFr: "S19 SOZO — Pack de bien-être avancé à base de plantes",
    slug: "s19-sozo",
    category: "Treatment Packs",
    categoryFr: CATEGORY_FR["Treatment Packs"],
    categorySlug: "treatment-packs",
    price: 19500,
    badge: "Advanced",
    badgeFr: "Avancé",
    shortDescription:
      "S19's most powerful herbal wellness package, formulated to support whole-body cleansing, immune health, vitality, and general wellbeing.",
    shortDescriptionFr:
      "Le pack de bien-être à base de plantes le plus puissant de S19, formulé pour soutenir la purification du corps entier, la santé immunitaire, la vitalité et le bien-être général.",
    description:
      "SOZO is our most powerful herbal wellness package, formulated to support whole-body cleansing, immune health, vitality, and general wellbeing. It is designed to support the body's natural detoxification processes, promote healthy metabolism, and help strengthen the body's resilience against illness. SOZO may also provide supportive antioxidant and immune benefits for people seeking to improve their overall health. It may also be used as part of a wellness routine or as supportive care alongside appropriate medical treatment for people living with chronic health concerns including certain types of Cancers.",
    descriptionFr:
      "SOZO est notre pack de bien-être à base de plantes le plus puissant, formulé pour soutenir la purification du corps entier, la santé immunitaire, la vitalité et le bien-être général. Il est conçu pour soutenir les processus naturels de détoxification du corps, favoriser un métabolisme sain et renforcer la résistance du corps contre les maladies. SOZO peut également offrir des bienfaits antioxydants et immunitaires de soutien aux personnes cherchant à améliorer leur santé globale. Il peut également être utilisé dans le cadre d'une routine de bien-être ou comme soin de soutien aux côtés d'un traitement médical approprié pour les personnes vivant avec des problèmes de santé chroniques, y compris certains types de cancers.",
    usage: "Follow the dosing schedule provided with your pack.",
    usageFr:
      "Suivez le programme de dosage fourni avec votre pack.",
    image: productImage("S19 SOZO.jpg"),
    featured: false,
    stock: 60,
  },
  {
    id: "p-experience-hoodie-men",
    name: "Experience S19 Hoodie (Men)",
    nameFr: "Hoodie Experience S19 (Homme)",
    slug: "s19-experience-hoodie-men",
    category: "Merch & Branded",
    categoryFr: CATEGORY_FR["Merch & Branded"],
    categorySlug: "merchandise",
    price: 25000,
    badge: "Merch",
    badgeFr: "Merch",
    shortDescription:
      "Official Experience S19 hoodie for men. Available in Black, White, Red, Sky Blue, Purple and Pink. Wear the S19 brand wherever you go.",
    shortDescriptionFr:
      "Hoodie officiel Experience S19 pour hommes. Disponible en noir, blanc, rouge, bleu ciel, violet et rose. Portez la marque S19 partout où vous allez.",
    description:
      "Show your support for S19 with the official 'Experience S19' hoodie for men. The bold Experience S19 print with the machine-style graphic makes it a standout piece. Available in six colors - Black, White, Red, Sky Blue, Purple and Pink - so you can choose your favourite. Made for everyday comfort and built to last.",
    descriptionFr:
      "Montrez votre soutien à S19 avec le hoodie officiel « Experience S19 » pour hommes. L'impression audacieuse Experience S19 avec le graphique style machine en fait une pièce remarquable. Disponible en six couleurs - noir, blanc, rouge, bleu ciel, violet et rose - pour que vous puissiez choisir votre préférée. Conçu pour un confort quotidien et conçu pour durer.",
    usage: "Machine wash cold, inside out. Do not bleach. Tumble dry low or hang to dry.",
    usageFr:
      "Lavage en machine à froid, à l'envers. Ne pas utiliser d'eau de Javel. Séchage en tambour à basse température ou séchage à l'air libre.",
    ingredients: "Colors: Black, White, Red, Sky Blue, Purple, Pink.",
    ingredientsFr:
      "Couleurs : noir, blanc, rouge, bleu ciel, violet, rose.",
    image: "/s19-assets/merche/male.jpg",
    featured: true,
    stock: 50,
  },
  {
    id: "p-experience-hoodie-women",
    name: "Experience S19 Hoodie (Women)",
    nameFr: "Hoodie Experience S19 (Femme)",
    slug: "s19-experience-hoodie-women",
    category: "Merch & Branded",
    categoryFr: CATEGORY_FR["Merch & Branded"],
    categorySlug: "merchandise",
    price: 25000,
    badge: "Merch",
    badgeFr: "Merch",
    shortDescription:
      "Official Experience S19 hoodie for women. Available in Black, White, Red, Sky Blue, Purple and Pink. Wear the S19 brand wherever you go.",
    shortDescriptionFr:
      "Hoodie officiel Experience S19 pour femmes. Disponible en noir, blanc, rouge, bleu ciel, violet et rose. Portez la marque S19 partout où vous allez.",
    description:
      "Show your support for S19 with the official 'Experience S19' hoodie for women. The bold Experience S19 print with the machine-style graphic makes it a standout piece. Available in six colors - Black, White, Red, Sky Blue, Purple and Pink - so you can choose your favourite. Designed for a comfortable everyday fit that lasts.",
    descriptionFr:
      "Montrez votre soutien à S19 avec le hoodie officiel « Experience S19 » pour femmes. L'impression audacieuse Experience S19 avec le graphique style machine en fait une pièce remarquable. Disponible en six couleurs - noir, blanc, rouge, bleu ciel, violet et rose - pour que vous puissiez choisir votre préférée. Conçu pour un ajustement quotidien confortable qui dure.",
    usage: "Machine wash cold, inside out. Do not bleach. Tumble dry low or hang to dry.",
    usageFr:
      "Lavage en machine à froid, à l'envers. Ne pas utiliser d'eau de Javel. Séchage en tambour à basse température ou séchage à l'air libre.",
    ingredients: "Colors: Black, White, Red, Sky Blue, Purple, Pink.",
    ingredientsFr:
      "Couleurs : noir, blanc, rouge, bleu ciel, violet, rose.",
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