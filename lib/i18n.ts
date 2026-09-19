export const COOKIE_NAME = "s19_locale";

export type Locale = "en" | "fr";

export interface LocaleEntry {
  en: string;
  fr: string;
}

const dict = {
  "nav.home": { en: "Home", fr: "Accueil" },
  "nav.programs": { en: "Programs", fr: "Programmes" },
  "nav.telehealth": { en: "Tele-Health", fr: "Télé-santé" },
  "nav.shop": { en: "Shop", fr: "Boutique" },
  "nav.blog": { en: "Blog", fr: "Blog" },
  "nav.about": { en: "About", fr: "À propos" },
  "nav.stories": { en: "Testimonials", fr: "Témoignages" },
  "nav.account": { en: "My Account", fr: "Mon compte" },
  "nav.cart": { en: "Shopping cart", fr: "Panier" },
  "nav.language": { en: "Language", fr: "Langue" },

  "announcement.tagline": {
    en: "Natural Healing, Lasting Wellness · Bafoussam, Cameroon",
    fr: "Guérison naturelle, Bien-être durable · Bafoussam, Cameroun",
  },

  "aria.instagram": { en: "S19 on Instagram", fr: "S19 sur Instagram" },
  "aria.facebook": { en: "S19 on Facebook", fr: "S19 sur Facebook" },
  "aria.whatsapp": { en: "Chat with S19 on WhatsApp", fr: "Discuter avec S19 sur WhatsApp" },
  "aria.openMenu": { en: "Open menu", fr: "Ouvrir le menu" },
  "aria.closeMenu": { en: "Close menu", fr: "Fermer le menu" },
  "aria.account": { en: "Account", fr: "Compte" },

  "common.bookConsultation": { en: "Book Consultation", fr: "Réserver une consultation" },
  "common.bookConsultationLower": { en: "Book a Consultation", fr: "Réserver une consultation" },
  "common.viewCatalog": { en: "View full catalog", fr: "Voir le catalogue complet" },
  "common.browseCatalog": { en: "Browse Catalog", fr: "Parcourir le catalogue" },
  "common.viewAllPrograms": { en: "View all programs", fr: "Voir tous les programmes" },
  "common.visitLocationPage": { en: "Visit our location page", fr: "Consulter notre page localisation" },
  "common.contactPricing": { en: "Contact S19 for pricing", fr: "Contactez S19 pour le prix" },
  "common.orderWhatsApp": { en: "Order via WhatsApp", fr: "Commander via WhatsApp" },
  "common.view": { en: "View", fr: "Voir" },
  "common.whatsappDr": { en: "WhatsApp / Dr Consultation", fr: "WhatsApp / Consultation Dr" },
  "common.readMore": { en: "Read article", fr: "Lire l'article" },
  "common.backHome": { en: "Back to Home", fr: "Retour à l'accueil" },
  "common.contactPage": { en: "Contact", fr: "Contact" },
  "common.questions": { en: "Common questions", fr: "Questions fréquentes" },
  "common.sendMessage": { en: "Send Message", fr: "Envoyer le message" },
  "common.submit": { en: "Submit", fr: "Envoyer" },
  "common.optional": { en: "optional", fr: "facultatif" },

  "home.hero.kicker": { en: "S19 Herbal Clinic", fr: "Clinique de phytothérapie S19" },
  "home.hero.titleA": { en: "Natural healing,", fr: "Guérison naturelle," },
  "home.hero.titleB": { en: "lasting wellness.", fr: "bien-être durable." },
  "home.hero.lead": {
    en: "Welcome to {brand} in Bafoussam. We help you with safe, natural herbal care for long-term health — clinic visits, consultations by phone or WhatsApp, and herbal products delivered anywhere.",
    fr: "Bienvenue à la {brand} de Bafoussam. Notre mission est de fournir des solutions à base de plantes sûres, naturelles et efficaces qui soutiennent la santé et le bien-être à long terme - des consultations fondées sur la science, des formulations individualisées et la Télé-consultation, une clinique avec une portée mondiale.",
  },
  "home.hero.whatsapp": { en: "WhatsApp the Clinic", fr: "Écrire à la clinique sur WhatsApp" },

  "home.focus.kicker": { en: "What we offer", fr: "Ce que nous proposons" },
  "home.focus.title": { en: "Three ways to care.", fr: "Trois façons de prendre soin de vous." },
  "home.focus.lead": {
    en: "One clinic, a worldwide reach — come and see us, talk to us from home, or order from our catalog.",
    fr: "Une clinique, une portée mondiale - soins en clinique, Télé-consultation à distance et un catalogue de plantes médicinales standardisées livré à votre porte.",
  },
  "home.focus.clinical.title": { en: "In-Clinic Care", fr: "Soins en clinique" },
  "home.focus.clinical.desc": {
    en: "Come and see us in Bafoussam. We review your health history and lab results before any remedy.",
    fr: "Consultations en clinique et plans de traitement à base de plantes individualisés, examinés en fonction de vos antécédents médicaux et de vos résultats de laboratoire.",
  },
  "home.focus.clinical.label": { en: "Clinical Programs", fr: "Programmes cliniques" },
  "home.focus.tele.title": { en: "Talk to Us From Home", fr: "Parlez-nous depuis chez vous" },
  "home.focus.tele.desc": {
    en: "Phone or WhatsApp consultation from anywhere in the world. Send us your lab results for review.",
    fr: "Consultations à distance structurées, examen des résultats de laboratoire et suivis programmés - partout dans le monde par téléphone et WhatsApp.",
  },
  "home.focus.tele.label": { en: "Book online consultation", fr: "Réserver une consultation en ligne" },
  "home.focus.catalog.title": { en: "Herbal Catalog", fr: "Catalogue de plantes médicinales" },
  "home.focus.catalog.desc": {
    en: "Herbal teas, extracts, and detox packs. Pick up in Bafoussam or get worldwide delivery.",
    fr: "Tisanes, extraits et packs de détox à base de plantes standardisés. Disponibles au retrait à Bafoussam et en livraison mondiale.",
  },
  "home.focus.catalog.label": { en: "Browse Catalog", fr: "Parcourir le catalogue" },

  "home.programs.kicker": { en: "Clinical care focus", fr: "Focus soins cliniques" },
  "home.programs.title": { en: "Integrative Treatment Programs.", fr: "Programmes de traitement intégratifs." },
  "home.programs.lead": {
    en: "Every plan is built for you after your first consultation. We confirm the price per patient after your evaluation.",
    fr: "Chaque plan est personnalisé après votre consultation initiale. Le prix est confirmé par patient après votre évaluation.",
  },

  "home.why.kicker": { en: "Why S19", fr: "Pourquoi S19" },
  "home.why.title": { en: "Built on review, reason, and follow-through.", fr: "Bâti sur l'examen, la raison et le suivi." },
  "home.why.lead": {
    en: "{brand} is a herbal clinic in Bafoussam. We start with you — your health history, your lab tests, and your daily life — before we give any remedy.",
    fr: "La {brand} est une clinique de bien-être à base de plantes et de médecine intégrative située à Bafoussam. Notre philosophie clinique commence par l'individu - ses antécédents, ses analyses, sa réalité quotidienne - avant toute prescription.",
  },

  "home.catalog.kicker": { en: "Standardized formulas", fr: "Formules standardisées" },
  "home.catalog.title": { en: "S19 Herbal Catalog", fr: "Catalogue de plantes S19" },
  "home.catalog.lead": {
    en: "Carefully made herbal products. Pick up your order in Bafoussam or get it delivered anywhere in the world.",
    fr: "Des solutions botaniques soigneusement formulées, disponibles au retrait à Bafoussam et en livraison mondiale.",
  },
  "home.catalog.note": {
    en: "Also in the clinic: Malaria & Typhoid Tea, Activated Charcoal, Oral Powder, Castor Oil, and Weight-loss Tea.",
    fr: "Également disponibles en clinique : Tisane Malaria & Typhoïde, Charbon actif, Poudre buccale, Huile de ricin et Tisane minceur.",
  },

  "home.tele.kicker": { en: "Talk to us from home", fr: "Parlez-nous depuis chez vous" },
  "home.tele.title": {
    en: "Care from home, anywhere in the world.",
    fr: "Consultations et suivis à distance, partout.",
  },
  "home.tele.lead": {
    en: "Cannot make it to Bafoussam? Talk to us about your health from anywhere in the world via phone or WhatsApp. Send us your lab test results for review, discuss your health concerns with us, and receive regular follow-up.",
    fr: "Impossible de venir à Bafoussam ? Nous organisons des consultations en ligne structurées - symptômes, antécédents médicaux et rapports de laboratoire - puis nous envoyons votre protocole et restons à vos côtés grâce à des suivis programmés.",
  },
  "home.tele.cta": { en: "Book online consultation", fr: "Réserver une consultation en ligne" },

  "home.steps.kicker": { en: "Getting care", fr: "Accéder aux soins" },
  "home.steps.title": { en: "Four steps, start to follow-up.", fr: "Quatre étapes, du début au suivi." },
  "home.steps.1.title": { en: "Book", fr: "Réserver" },
  "home.steps.1.text": { en: "Book a consultation — in clinic or from home.", fr: "Réservez une consultation - en clinique ou à distance." },
  "home.steps.2.title": { en: "Protocol", fr: "Protocole" },
  "home.steps.2.text": { en: "We build a personalized treatment plan for you.", fr: "Nous construisons un plan de traitement personnalisé pour vous." },
  "home.steps.3.title": { en: "Dispatch", fr: "Expédition" },
  "home.steps.3.text": { en: "Your pack is sent to your door.", fr: "Votre pack est livré à votre porte." },
  "home.steps.4.title": { en: "Follow-up", fr: "Suivi" },
  "home.steps.4.text": { en: "We check on your progress and adjust.", fr: "Des points de contrôle programmés sur vos progrès." },

  "home.testimonials.kicker": { en: "Patient stories", fr: "Témoignages de patients" },
  "home.testimonials.title": { en: "Care that people talk about.", fr: "Des soins dont les gens parlent." },
  "home.testimonials.cta": { en: "Share your experience with S19", fr: "Partagez votre expérience avec S19" },

  "stories.meta.title": { en: "Patient Stories & Reviews", fr: "Histoires et avis de patients" },
  "stories.meta.description": {
    en: "Real experiences from S19 Herbal Clinic patients in Cameroon and around the world. Leave your own review - it is checked by the clinic before being published.",
    fr: "Des expériences réelles de patients de la clinique S19, au Cameroun et dans le monde. Laissez votre propre avis - il est vérifié par la clinique avant publication.",
  },
  "stories.hero.eyebrow": { en: "Patient Stories", fr: "Histoires de patients" },
  "stories.hero.title": { en: "What our patients say about us.", fr: "Ce que nos patients disent de nous." },
  "stories.hero.lead": {
    en: "Real experiences shared through phone calls, text messages, emails, and social media comments - from Cameroon and around the world.",
    fr: "Des expériences réelles partagées par appels téléphoniques, messages texte, e-mails et commentaires sur les réseaux sociaux - du Cameroun et du monde entier.",
  },
  "stories.hero.alt": {
    en: "S19 Herbal Clinic patient stories and reviews",
    fr: "Histoires et avis de patients de la clinique S19",
  },
  "stories.disclaimer": {
    en: "The testimonials shared here represent the personal experiences and views of individual S19 clients. Results may differ from person to person and should not be considered typical or guaranteed. These testimonials are provided for general informational purposes only and should not be interpreted as medical advice or as a promise that others will experience the same outcomes. Some of these experiences were shared with us through text messages, phone calls, comments, and emails. For clarity and better understanding, some have been lightly edited to improve grammar and readability or translated into English, while preserving the original meaning and experience shared by the client.",
    fr: "Les témoignages présentés ici reflètent les expériences et opinions personnelles de clients individuels de S19. Les résultats peuvent varier d'une personne à l'autre et ne doivent pas être considérés comme typiques ou garantis. Ces témoignages sont fournis à titre d'information générale uniquement et ne doivent pas être interprétés comme un avis médical ni comme une promesse que d'autres obtiendront les mêmes résultats. Certaines de ces expériences nous ont été partagées par messages texte, appels téléphoniques, commentaires et e-mails. Par souci de clarté et de compréhension, certains ont été légèrement retouchés pour améliorer la grammaire et la lisibilité, ou traduits en anglais, tout en préservant le sens et l'expérience d'origine partagés par le client.",
  },
  "stories.count": { en: "{count} story", fr: "{count} histoire" },
  "stories.countPlural": { en: "{count} stories", fr: "{count} histoires" },
  "stories.share.kicker": { en: "Share your experience", fr: "Partagez votre expérience" },
  "stories.share.title": { en: "Your story matters.", fr: "Votre histoire compte." },
  "stories.share.text": {
    en: "Treated by S19 or used our products? Tell others how it went - no account needed. Your review is checked by our clinic before it is published.",
    fr: "Traitement avec S19 ou utilisation de nos produits ? Dites aux autres comment cela s'est passé - aucun compte requis. Votre avis est vérifié par notre clinique avant publication.",
  },
  "stories.name": { en: "Your name", fr: "Votre nom" },
  "stories.namePh": { en: "e.g. Marie Ndongo", fr: "ex. Marie Ndongo" },
  "stories.rating": { en: "Your rating", fr: "Votre note" },
  "stories.city": { en: "City / Town", fr: "Ville" },
  "stories.cityPh": { en: "e.g. Buea, Bamenda", fr: "ex. Buéa, Bamenda" },
  "stories.country": { en: "Country (optional)", fr: "Pays (facultatif)" },
  "stories.countryPh": { en: "e.g. Cameroun, USA, UK", fr: "ex. Cameroun, USA, Royaume-Uni" },
  "stories.program": { en: "Program or product that helped you", fr: "Programme ou produit qui vous a aidé(e)" },
  "stories.programPh": { en: "e.g. Diabetes & Metabolic Health Support", fr: "ex. Soutien diabète et santé métabolique" },
  "stories.email": { en: "Email (optional)", fr: "Email (facultatif)" },
  "stories.emailPh": { en: "you@example.com", fr: "vous@exemple.com" },
  "stories.text": { en: "Your review", fr: "Votre avis" },
  "stories.textPh": {
    en: "How did S19 help you? What changed for you?",
    fr: "Comment S19 vous a-t-il aidé(e) ? Qu'est-ce qui a changé pour vous ?",
  },
  "stories.submit": { en: "Submit for review", fr: "Envoyer pour modération" },
  "stories.sending": { en: "Submitting...", fr: "Envoi..." },
  "stories.private": {
    en: "Your details stay private. Reviews are published anonymously by first name and location only.",
    fr: "Vos informations restent privées. Les avis sont publiés avec le prénom et le lieu uniquement.",
  },
  "stories.error": { en: "Something went wrong. Please try again.", fr: "Une erreur est survenue. Veuillez réessayer." },
  "stories.success.title": { en: "Thank you!", fr: "Merci !" },
  "stories.success.text": {
    en: "Your review has been received. It will appear on this page once it has been checked and approved by the S19 clinic.",
    fr: "Votre avis a bien été reçu. Il apparaîtra sur cette page une fois vérifié et approuvé par la clinique S19.",
  },
  "stories.shareAnother": { en: "Share another review", fr: "Partager un autre avis" },

  "home.booking.kicker": { en: "Direct consultation", fr: "Consultation directe" },
  "home.booking.title": { en: "Book your consultation.", fr: "Réservez votre consultation." },
  "home.booking.lead": {
    en: "Fill in the form to ask for a clinic appointment or a consultation by phone or WhatsApp. Our team confirms your booking.",
    fr: "Remplissez le formulaire pour demander un rendez-vous prioritaire en clinique ou une consultation de Télé-consultation. Notre équipe clinique confirme votre réservation par téléphone ou WhatsApp.",
  },
  "home.booking.whatsapp": {
    en: "Prefer WhatsApp? Chat directly at {phone}.",
    fr: "Vous préférez WhatsApp ? Discutez directement au {phone}.",
  },
  "home.booking.hours": {
    en: "{hours} · In-clinic, or book a remote Tele-Health visit.",
    fr: "{hours} · En clinique, ou réservez une Télé-consultation à distance.",
  },

  "home.location.kicker": { en: "Find the clinic", fr: "Trouver la clinique" },
  "home.location.title": { en: "Care across Cameroon and the world.", fr: "Des soins partout au Cameroun et dans le monde." },
  "home.location.clinic": { en: "Bafoussam Clinic", fr: "Clinique de Bafoussam" },
  "home.location.hours": { en: "Opening Hours", fr: "Heures d'ouverture" },
  "home.location.coverage": { en: "Delivery Coverage", fr: "Zone de livraison" },

  "home.faq.kicker": { en: "Common questions", fr: "Questions fréquentes" },
  "home.faq.title": { en: "Frequently asked questions.", fr: "Questions fréquemment posées." },
  "home.faq.lead": {
    en: "Straight answers about consultations, delivery, payments, and how S19 remedies work.",
    fr: "Des réponses claires sur les consultations, la livraison, les paiements et le fonctionnement des remèdes S19.",
  },

  "cta.title": { en: "Start your consultation", fr: "Commencez votre consultation" },
  "cta.text": {
    en: "Book a clinic appointment or a phone/WhatsApp consultation with the S19 clinic today.",
    fr: "Réservez dès aujourd'hui un rendez-vous prioritaire en clinique ou une télé-consultation avec la clinique S19.",
  },
  "cta.primary": { en: "Book a Consultation", fr: "Réserver une consultation" },
  "cta.secondary": { en: "WhatsApp: +237 672 595 989", fr: "WhatsApp : +237 672 595 989" },

  "footer.treatment": { en: "Treatment Focus", fr: "Domaines de traitement" },
  "footer.clinicContact": { en: "Clinic & Contact", fr: "Clinique & Contact" },
  "footer.explore": { en: "Explore", fr: "Explorer" },
  "footer.rights": {
    en: "© {year} {brand} ({slogan}). All rights reserved.",
    fr: "© {year} {brand} ({slogan}). Tous droits réservés.",
  },
  "footer.bottom": {
    en: "Science-Based Herbalism · Bafoussam · Worldwide Tele-Health",
    fr: "Phytothérapie fondée sur la science · Bafoussam · Télé-santé mondiale",
  },
  "footer.home": { en: "Home", fr: "Accueil" },
  "footer.approach": { en: "Our Approach", fr: "Notre approche" },
  "footer.catalog": { en: "Herbal Catalog", fr: "Catalogue de plantes" },
  "footer.blog": { en: "Health Blog", fr: "Blog santé" },
  "footer.contactUs": { en: "Contact Us", fr: "Contactez-nous" },
  "footer.trackOrder": { en: "Track Your Order", fr: "Suivre votre commande" },
  "footer.refundReturns": { en: "Refund & Returns", fr: "Remboursements & Retours" },
  "footer.stories": { en: "Patient Stories", fr: "Histoires de patients" },
  "footer.privacy": { en: "Privacy Policy", fr: "Politique de confidentialité" },
  "footer.terms": { en: "Terms of Service", fr: "Conditions d'utilisation" },
  "footer.diabetes": { en: "Diabetes & Metabolic Health", fr: "Diabète et santé métabolique" },
  "footer.hypertension": { en: "Hypertension & Heart Health", fr: "Hypertension et santé cardiaque" },
  "footer.prostate": { en: "Prostate & Men's Health", fr: "Prostate et santé masculine" },
  "footer.womens": { en: "Women's Reproductive Wellness", fr: "Bien-être reproductif féminin" },
  "footer.gastritis": { en: "Gastritis & Digestive Disorders", fr: "Gastrite et troubles digestifs" },

  "booking.title": { en: "Request received", fr: "Demande reçue" },
  "booking.thanks": {
    en: "Thank you, {name}. Our team will contact you shortly at {phone}. For an immediate response, connect with the clinic directly on WhatsApp.",
    fr: "Merci, {name}. Notre équipe vous contactera très vite au {phone}. Pour une réponse immédiate, contactez directement la clinique sur WhatsApp.",
  },
  "booking.connectDr": { en: "Connect with Dr on WhatsApp", fr: "Joindre le Dr sur WhatsApp" },
  "booking.fullName": { en: "Full Name", fr: "Nom complet" },
  "booking.namePlaceholder": { en: "Your name", fr: "Votre nom" },
  "booking.phone": { en: "Phone / WhatsApp Number", fr: "Téléphone / Numéro WhatsApp" },
  "booking.email": { en: "Email (optional)", fr: "Email (facultatif)" },
  "booking.mode": { en: "Consultation Mode", fr: "Mode de consultation" },
  "booking.modeTele": { en: "Telehealth (Online / WhatsApp / Call)", fr: "Télé-santé (En ligne / WhatsApp / Appel)" },
  "booking.modeClinic": { en: "In-Clinic Visit (Bafoussam Clinic)", fr: "Visite en clinique (Clinique de Bafoussam)" },
  "booking.concern": { en: "Primary Health Concern", fr: "Principal souci de santé" },
  "booking.concernHint": { en: "Select the area closest to your situation.", fr: "Sélectionnez le domaine le plus proche de votre situation." },
  "booking.concernPlaceholder": { en: "Select a concern...", fr: "Sélectionnez un motif..." },
  "booking.summary": { en: "Brief Summary of Symptoms / Previous Treatments", fr: "Résumé bref des symptômes / traitements antérieurs" },
  "booking.summaryPlaceholder": {
    en: "A short summary helps us prepare for your consultation.",
    fr: "Un bref résumé nous aide à préparer votre consultation.",
  },
  "booking.submit": { en: "Submit & Connect to Dr on WhatsApp", fr: "Envoyer et joindre le Dr sur WhatsApp" },
  "booking.sending": { en: "Sending...", fr: "Envoi..." },
  "booking.private": { en: "Your health details are kept strictly private and confidential.", fr: "Vos informations de santé restent strictement privées et confidentielles." },
  "booking.error": { en: "Something went wrong. Please try again or use WhatsApp.", fr: "Une erreur est survenue. Veuillez réessayer ou utiliser WhatsApp." },
  "concern.diabetes": { en: "Diabetes / Blood Sugar", fr: "Diabète / Glycémie" },
  "concern.hypertension": { en: "Hypertension / Cardiovascular", fr: "Hypertension / Cardiovasculaire" },
  "concern.prostate": { en: "Prostate / Men's Health", fr: "Prostate / Santé masculine" },
  "concern.women": { en: "Women's Health / Hormones", fr: "Santé féminine / Hormones" },
  "concern.gastritis": { en: "Gastritis / Digestion / Hemorrhoids", fr: "Gastrite / Digestion / Hémorroïdes" },
  "concern.liver": { en: "Liver / Kidney Detox", fr: "Détox foie / reins" },
  "concern.cancer": { en: "Integrative Cancer Care", fr: "Soins intégratifs du cancer" },
  "concern.general": { en: "General Health Consultation", fr: "Consultation de santé générale" },
  "concern.other": { en: "Other / Not listed", fr: "Autre / Non listé" },
  "booking.concernOtherPlaceholder": {
    en: "Please describe your health concern",
    fr: "Veuillez décrire votre souci de santé",
  },

  "product.usage": { en: "Usage Instructions", fr: "Mode d'emploi" },
  "product.notes": { en: "Product Notes", fr: "Notes sur le produit" },
  "product.usageDefault": {
    en: "Usage is individualized. Follow the schedule given during your consultation or on the pack label.",
    fr: "L'utilisation est individualisée. Suivez le programme donné lors de votre consultation ou sur l'étiquette du pack.",
  },
  "product.care.title": { en: "A note on care:", fr: "Une note sur les soins :" },
  "product.care.text": {
    en: "S19 herbal remedies are standardized and individually prescribed. For best results and correct dosage, complete a consultation before starting any program.",
    fr: "Les remèdes à base de plantes S19 sont standardisés et prescrits individuellement. Pour de meilleurs résultats et un dosage correct, effectuez une consultation avant de commencer tout programme.",
  },
  "product.bookConsultation": { en: "Book a Consultation", fr: "Réserver une consultation" },
  "product.trackOrder": { en: "Track an Order", fr: "Suivre une commande" },
  "product.moreInCat": { en: "More in {category}", fr: "Plus dans {category}" },
  "product.customized": {
    en: "This package is personalized to your consultation. Contact S19 to discuss your condition and receive your individual protocol and pricing.",
    fr: "Ce pack est personnalisé pour votre consultation. Contactez S19 pour discuter de votre état et recevoir votre protocole et prix individuels.",
  },
  "product.contactWhatsApp": { en: "Contact S19 on WhatsApp", fr: "Contacter S19 sur WhatsApp" },
  "product.contactWhatsAppInfo": {
    en: "Hello S19, I would like more information about the {name}.",
    fr: "Bonjour S19, je souhaite plus d'informations sur {name}.",
  },
  "product.orderMessage": {
    en: "Hello S19, I am interested in ordering the {name}.",
    fr: "Bonjour S19, je souhaite commander {name}.",
  },
  "notFound.title": { en: "Page not found", fr: "Page introuvable" },
  "notFound.text": {
    en: "The page you are looking for does not exist or has been moved.",
    fr: "La page que vous recherchez n'existe pas ou a été déplacée.",
  },

  "shop.hero.eyebrow": { en: "Standardized Formulas", fr: "Formules standardisées" },
  "shop.hero.title": { en: "S19 Herbal Product Catalog", fr: "Catalogue de produits S19" },
  "shop.hero.lead": {
    en: "Carefully formulated botanical solutions. Available for pickup in Bafoussam and worldwide delivery.",
    fr: "Des solutions botaniques soigneusement formulées. Disponibles au retrait à Bafoussam et en livraison mondiale.",
  },
  "shop.search.placeholder": { en: "Search the catalog...", fr: "Rechercher dans le catalogue..." },
  "shop.sort.featured": { en: "Featured", fr: "En vedette" },
  "shop.sort.priceAsc": { en: "Price: Low to High", fr: "Prix : croissant" },
  "shop.sort.priceDesc": { en: "Price: High to Low", fr: "Prix : décroissant" },
  "shop.sort.name": { en: "Name: A to Z", fr: "Nom : A à Z" },
  "shop.filter.all": { en: "All ({count})", fr: "Tous ({count})" },
  "shop.empty": {
    en: "No products match your search. Try a different term or category.",
    fr: "Aucun produit ne correspond à votre recherche. Essayez un autre terme ou une autre catégorie.",
  },
  "shop.orderByChatA": { en: "Prefer to order by chat?", fr: "Vous préférez commander par chat ?" },
  "shop.orderByChatB": { en: "Order direct via WhatsApp", fr: "Commander directement via WhatsApp" },
  "shop.orderByChatC": {
    en: ". Personalized treatment packs and programs are priced after your consultation.",
    fr: ". Les packs et programmes de traitement personnalisés sont tarifés après votre consultation.",
  },
  "shop.contactPricing": { en: "Contact S19 for pricing", fr: "Contactez S19 pour le prix" },

  "addToCart.quantity": { en: "Quantity", fr: "Quantité" },
  "addToCart.label": { en: "Add to Cart", fr: "Ajouter au panier" },
  "addToCart.note": {
    en: "Prices in FCFA. Delivery and payment options are confirmed at checkout.",
    fr: "Prix en FCFA. Les options de livraison et de paiement sont confirmées lors du paiement.",
  },
  "aria.decreaseQty": { en: "Decrease quantity", fr: "Diminuer la quantité" },
  "aria.increaseQty": { en: "Increase quantity", fr: "Augmenter la quantité" },

  "about.hero.eyebrow": { en: "Our Approach", fr: "Notre approche" },
  "about.hero.alt": {
    en: "Fresh botanical herbs used at S19 Herbal Clinic",
    fr: "Plantes botaniques fraîches utilisées à la clinique S19",
  },
  "about.hero.title": {
    en: "Non-conventional therapies. Science-based herbalism. Root-cause healthcare. Personalization. Monitoring.",
    fr: "Thérapies non conventionnelles. Phytothérapie fondée sur la science. Soins de la cause racine. Personnalisation. Suivi.",
  },
  "about.hero.lead": {
    en: "{brand} is a Bafoussam-based herbal and integrative wellness clinic. We combine traditional knowledge of medicinal plants with modern laboratory testing, nutrition, lifestyle medicine, health education and evidence-informed natural interventions.",
    fr: "La {brand} est une clinique de bien-être à base de plantes et de médecine intégrative située à Bafoussam. Nous combinons le savoir traditionnel des plantes médicinales avec les tests de laboratoire modernes, la nutrition, la médecine du mode de vie, l'éducation à la santé et des interventions naturelles fondées sur des preuves.",
  },
  "about.phil.kicker": { en: "The S19 philosophy", fr: "La philosophie S19" },
  "about.phil.p1": {
    en: "When someone develops diabetes, hypertension, chronic inflammation, metabolic dysfunction, digestive or hormonal problems, recurrent infections, or another chronic health condition, our first question is not simply: “What can we give this person for the symptoms?”",
    fr: "Lorsqu'une personne développe un diabète, une hypertension, une inflammation chronique, un dysfonctionnement métabolique, des problèmes digestifs ou hormonaux, des infections récurrentes ou une autre pathologie chronique, notre première question n'est pas simplement : « Que pouvons-nous donner à cette personne pour les symptômes ? »",
  },
  "about.phil.p2": {
    en: "Treatment is then designed around the individual rather than around the name of the disease alone. S19 is not simply a place that sells herbal medicines - it is a healthcare system and a philosophy.",
    fr: "Le traitement est alors conçu autour de l'individu plutôt qu'autour du seul nom de la maladie. S19 n'est pas simplement un endroit qui vend des remèdes à base de plantes - c'est un système de santé et une philosophie.",
  },
  "about.phil.explorePrograms": { en: "Explore treatment programs", fr: "Découvrir les programmes de traitement" },
  "about.phil.drivers": { en: "Root-cause drivers we investigate", fr: "Facteurs de cause racine que nous étudions" },

  "about.rootcause.kicker": { en: "Root-cause healthcare", fr: "Soins de la cause racine" },
  "about.rootcause.title": { en: "Not masking symptoms - treating the root cause.", fr: "Ne pas masquer les symptômes - traiter la cause racine." },
  "about.rootcause.p1": {
    en: "Symptoms are important, but they may represent only the visible part of a deeper physiological problem. In Type 2 diabetes, reducing blood glucose is important - but we also consider the metabolic processes behind elevated glucose, particularly insulin resistance, excess visceral fat, physical inactivity, nutrition, sleep, stress, inflammation and other relevant risk factors.",
    fr: "Les symptômes sont importants, mais ils peuvent ne représenter que la partie visible d'un problème physiologique plus profond. Dans le diabète de type 2, réduire la glycémie est important - mais nous considérons aussi les processus métaboliques derrière l'hyperglycémie, en particulier la résistance à l'insuline, l'excès de graisse viscérale, l'inactivité physique, la nutrition, le sommeil, le stress, l'inflammation et d'autres facteurs de risque pertinents.",
  },
  "about.rootcause.p2": {
    en: "This applies across chronic and metabolic diseases. Our approach can be summarized as: Investigate, understand, correct, support, monitor and educate.",
    fr: "Cela s'applique à toutes les maladies chroniques et métaboliques. Notre approche peut se résumer ainsi : Enquêter, comprendre, corriger, soutenir, surveiller et éduquer.",
  },

  "about.blind.title": { en: "We do not treat blindly", fr: "Nous ne traitons pas à l'aveugle" },
  "about.blind.text": {
    en: "Whenever appropriate, we encourage objective assessment before designing a health program. Treatment should be guided by information - not guesswork. These findings help us understand what may be happening physiologically and establish measurable baselines.",
    fr: "Chaque fois que cela est approprié, nous encourageons une évaluation objective avant de concevoir un programme de santé. Le traitement doit être guidé par l'information - pas par le hasard. Ces résultats nous aident à comprendre ce qui peut se passer physiologiquement et à établir des références mesurables.",
  },
  "about.science.title": { en: "Science-based herbalism", fr: "Phytothérapie fondée sur la science" },
  "about.science.text": {
    en: "We respect the long history of medicinal plants, but we do not believe that “natural” automatically means effective or safe. Herbs contain biologically active compounds, so we evaluate pharmacology, dosing, interactions, contraindications and the available scientific evidence before anything is prescribed.",
    fr: "Nous respectons la longue histoire des plantes médicinales, mais nous ne croyons pas que « naturel » signifie automatiquement efficace ou sûr. Les plantes contiennent des composés biologiquement actifs ; nous évaluons donc la pharmacologie, les doses, les interactions, les contre-indications et les preuves scientifiques disponibles avant toute prescription.",
  },
  "about.pillars.kicker": { en: "How we work", fr: "Comment nous travaillons" },
  "about.pillars.title": { en: "Herbs are only one part of S19.", fr: "Les plantes ne sont qu'une partie de S19." },
  "about.pillars.text": {
    en: "A major mistake would be to present S19 as a place that simply gives patients herbal mixtures. Our philosophy is much broader.",
    fr: "Une grossière erreur serait de présenter S19 comme un endroit qui se contente de donner des mélanges de plantes aux patients. Notre philosophie est bien plus large.",
  },
  "about.education.kicker": { en: "Education before medication", fr: "L'éducation avant le médicament" },
  "about.education.text": {
    en: "This does not mean S19 is against pharmaceutical medicine - medicines can be essential and lifesaving. But healthcare becomes incomplete when long-term treatment focuses only on medication while modifiable contributors such as nutrition, obesity, insulin resistance, inactivity, smoking, alcohol, stress and poor sleep are ignored.",
    fr: "Cela ne signifie pas que S19 est contre la médecine pharmaceutique - les médicaments peuvent être essentiels et vitaux. Mais les soins deviennent incomplets lorsque le traitement à long terme se concentre uniquement sur les médicaments tandis que des facteurs modifiables comme la nutrition, l'obésité, la résistance à l'insuline, l'inactivité, le tabac, l'alcool, le stress et le manque de sommeil sont ignorés.",
  },
  "about.notAnti.title": { en: "S19 is not anti-medicine", fr: "S19 n'est pas contre la médecine" },
  "about.notAnti.text": {
    en: "Different medical tools have different roles. There are circumstances where pharmaceuticals, surgery, emergency medicine, hospitalization or specialist intervention are indispensable, and natural medicine should never delay necessary emergency or specialist care.",
    fr: "Les différents outils médicaux ont des rôles différents. Il existe des situations où les médicaments, la chirurgie, la médecine d'urgence, l'hospitalisation ou l'intervention d'un spécialiste sont indispensables, et la médecine naturelle ne doit jamais retarder les soins d'urgence ou spécialisés nécessaires.",
  },
  "about.metabolic.kicker": { en: "Chronic & metabolic health", fr: "Santé chronique & métabolique" },
  "about.metabolic.title": { en: "More than symptom control.", fr: "Plus qu'un simple contrôle des symptômes." },
  "about.metabolic.p1": {
    en: "Chronic and metabolic diseases develop over years and involve multiple interacting factors. {diabetesIntro}",
    fr: "Les maladies chroniques et métaboliques se développent sur des années et impliquent de multiples facteurs qui interagissent. {diabetesIntro}",
  },
  "about.metabolic.diabetesTitle": { en: "Our approach to Type 2 diabetes", fr: "Notre approche du diabète de type 2" },
  "about.measure.title": { en: "Measurement matters", fr: "La mesure compte" },
  "about.measure.text": {
    en: "A patient saying “I feel better” is valuable, but where appropriate we also want measurable evidence of progress. This is one of the central differences between S19 and purely traditional herbal practice.",
    fr: "Un patient qui dit « je me sens mieux » est précieux, mais lorsque c'est approprié, nous voulons aussi des preuves mesurables de progrès. C'est l'une des différences centrales entre S19 et la pratique traditionnelle de la phytothérapie.",
  },
  "about.personalized.title": { en: "Personalized care", fr: "Soins personnalisés" },
  "about.personalized.text": {
    en: "Two people can have the same diagnosis while having very different underlying problems. Age, medical history, medications, laboratory findings, nutrition, lifestyle, disease severity and other conditions all shape an S19 program. Same disease does not automatically mean the same treatment.",
    fr: "Deux personnes peuvent avoir le même diagnostic tout en ayant des problèmes sous-jacents très différents. L'âge, les antécédents médicaux, les médicaments, les résultats de laboratoire, la nutrition, le mode de vie, la gravité de la maladie et d'autres conditions façonnent tous un programme S19. Même maladie ne signifie pas automatiquement même traitement.",
  },
  "about.participation.title": { en: "Patient participation", fr: "Participation du patient" },
  "about.participation.text": {
    en: "The patient is not a passive recipient of medicine; the patient becomes part of the treatment process.",
    fr: "Le patient n'est pas un simple receveur passif de médicaments ; le patient devient partie intégrante du processus de traitement.",
  },
  "about.monitoring.title": { en: "Continuous monitoring", fr: "Suivi continu" },
  "about.monitoring.text": {
    en: "Chronic-disease management is never Consultation → Medication → Go home. We emphasize follow-up: patients may be asked to monitor glucose, blood pressure, symptoms, nutrition and treatment response, and investigations may be repeated when appropriate - so programs evolve according to real-world response.",
    fr: "La prise en charge des maladies chroniques n'est jamais Consultation → Médicament → Rentrer chez soi. Nous insistons sur le suivi : les patients peuvent être invités à surveiller leur glycémie, leur tension artérielle, leurs symptômes, leur nutrition et leur réponse au traitement, et les examens peuvent être renouvelés si nécessaire - les programmes évoluent donc en fonction de la réponse réelle.",
  },
  "about.different.kicker": { en: "What makes S19 different", fr: "Ce qui rend S19 différent" },
  "about.different.title": { en: "A modern African integrative health clinic.", fr: "Une clinique de santé intégrative africaine moderne." },
  "about.journey.kicker": { en: "Getting care", fr: "Accéder aux soins" },
  "about.journey.title": { en: "The S19 patient journey.", fr: "Le parcours du patient S19." },
  "about.journey.text": {
    en: "Eight stages, from first contact to long-term maintenance of better health.",
    fr: "Huit étapes, du premier contact au maintien à long terme d'une meilleure santé.",
  },
  "about.central.kicker": { en: "S19 in 30 seconds", fr: "S19 en 30 secondes" },
  "about.central.text": {
    en: "We do not simply ask: “What medicine treats this disease?” We ask: “What is happening inside this person, what factors are contributing to it, what can be changed, and how can we measure whether those changes are working?”",
    fr: "Nous ne nous contentons pas de demander : « Quel médicament traite cette maladie ? » Nous demandons : « Que se passe-t-il chez cette personne, quels facteurs y contribuent, que peut-on changer, et comment pouvons-nous mesurer si ces changements fonctionnent ? »",
  },
  "about.cta.title": {
    en: "Ready for a root-cause approach to your health?",
    fr: "Prêt pour une approche de la cause racine de votre santé ?",
  },
  "about.cta.text": {
    en: "Book an in-clinic consultation at our Bafoussam headquarters, or a remote Tele-health session. Investigate, understand, then treat - never blindly.",
    fr: "Réservez une consultation en clinique à notre siège de Bafoussam, ou une session de Télé-santé à distance. Enquêter, comprendre, puis traiter - jamais à l'aveugle.",
  },

  "programs.hero.eyebrow": { en: "Clinical Care Focus", fr: "Focus des soins cliniques" },
  "programs.hero.title": { en: "Integrative Treatment Programs", fr: "Programmes de traitement intégratifs" },
  "programs.hero.lead": {
    en: "Each treatment plan is customized according to individual patient evaluation. Pricing is confirmed after your consultation and personalized treatment plan cost.",
    fr: "Chaque plan de traitement est personnalisé en fonction de l'évaluation individuelle du patient. Le prix est confirmé après votre consultation et le coût de votre plan de traitement personnalisé.",
  },
  "programs.hero.alt": {
    en: "Healthy green leaves representing herbal treatment programs",
    fr: "Feuilles vertes représentant les programmes de traitement à base de plantes",
  },
  "programs.kicker": { en: "Programs", fr: "Programmes" },
  "programs.title": { en: "Choose the program closest to your situation.", fr: "Choisissez le programme le plus proche de votre situation." },
  "programs.intro": {
    en: "Start with a consultation and we will build the right protocol around you.",
    fr: "Commencez par une consultation et nous construirons le bon protocole autour de vous.",
  },
  "programs.badge": { en: "Program", fr: "Programme" },
  "programs.supports": { en: "Supports", fr: "Soutient" },
  "programs.inquire": { en: "Inquire via WhatsApp", fr: "S'informer via WhatsApp" },
  "programs.bookCta": { en: "Book a consultation", fr: "Réserver une consultation" },
  "programs.notSure.title": { en: "Not sure where to start?", fr: "Vous ne savez pas par où commencer ?" },
  "programs.notSure.text": {
    en: "Book a general consultation and we will recommend the right program for you. {brand} · {phone}",
    fr: "Réservez une consultation générale et nous vous recommanderons le programme qui vous convient. {brand} · {phone}",
  },
  "programs.therapies.kicker": { en: "Supportive therapies", fr: "Thérapies de soutien" },
  "programs.therapies.alt": {
    en: "S19 therapist performing an in-clinic wellness therapy",
    fr: "Thérapeute S19 réalisant une thérapie de bien-être en clinique",
  },
  "programs.therapies.title": { en: "Therapies We Perform", fr: "Les thérapies que nous pratiquons" },
  "programs.therapies.text": {
    en: "Beyond herbal medicine, S19 offers supportive and alternative therapies inspired by traditional healing practices and complemented by modern scientific wellness devices and instruments - including in-clinic electrolysis and therapy sessions - with the aim of supporting patient well-being and improving overall care outcomes.",
    fr: "Au-delà de la phytothérapie, S19 propose des thérapies de soutien et alternatives inspirées des pratiques de guérison traditionnelles et complétées par des appareils et instruments de bien-être scientifiques modernes - notamment l'électrolyse en clinique et des séances de thérapie - dans le but de soutenir le bien-être des patients et d'améliorer les résultats globaux des soins.",
  },
  "programs.therapies.sessions": { en: "How sessions support your program", fr: "Comment les séances soutiennent votre programme" },
  "programs.therapies.item1": {
    en: "Relaxation sessions complementing your herbal and nutrition protocol.",
    fr: "Des séances de relaxation complétant votre protocole à base de plantes et de nutrition.",
  },
  "programs.therapies.item2": {
    en: "Supportive care alongside medical assessment and conventional treatment.",
    fr: "Des soins de soutien aux côtés de l'évaluation médicale et du traitement conventionnel.",
  },
  "programs.therapies.item3": {
    en: "Lifestyle and wellness coaching to reinforce long-term habits.",
    fr: "Un coaching de mode de vie et de bien-être pour renforcer les habitudes à long terme.",
  },
  "programs.cta.title": {
    en: "Talk to the clinic about your condition",
    fr: "Parlez de votre état de santé à la clinique",
  },
  "programs.cta.text": {
    en: "Describe your symptoms and our clinical team will guide you to the right program.",
    fr: "Décrivez vos symptômes et notre équipe clinique vous orientera vers le bon programme.",
  },

  "contact.meta.title": { en: "Contact & Book a Consultation", fr: "Contact & Réservation d'une consultation" },
  "contact.meta.description": {
    en: "Book a consultation or Tele-health session with S19 Herbal Clinic. Contact us by WhatsApp, phone, or email.",
    fr: "Réservez une consultation ou une session de Télé-santé avec S19 Herbal Clinic. Contactez-nous par WhatsApp, téléphone ou e-mail.",
  },
  "contact.hero.eyebrow": { en: "Contact & Consultations", fr: "Contact & Consultations" },
  "contact.hero.title": { en: "Book your consultation.", fr: "Réservez votre consultation." },
  "contact.hero.lead": {
    en: "Generate a priority in-clinic appointment or a Tele-Health consultation. A member of our clinical team confirms your booking by phone or WhatsApp.",
    fr: "Générez un rendez-vous prioritaire en clinique ou une consultation de Télé-santé. Un membre de notre équipe clinique confirme votre réservation par téléphone ou WhatsApp.",
  },
  "contact.hero.alt": {
    en: "S19 Herbal Clinic remedy shelves and products",
    fr: "Rayons de remèdes et produits de la clinique S19",
  },
  "contact.form.kicker": { en: "Consultation form", fr: "Formulaire de consultation" },
  "contact.form.title": { en: "Tell us about your health.", fr: "Parlez-nous de votre santé." },
  "contact.form.text": {
    en: "Fill in the form to request a priority appointment or Tele-Health consultation. Our clinical team confirms your booking by phone or WhatsApp.",
    fr: "Remplissez le formulaire pour demander un rendez-vous prioritaire ou une consultation de Télé-santé. Notre équipe clinique confirme votre réservation par téléphone ou WhatsApp.",
  },
  "contact.chatWhatsApp": { en: "Chat directly on WhatsApp", fr: "Discuter directement sur WhatsApp" },
  "contact.phoneLabel": { en: "Phone & WhatsApp", fr: "Téléphone & WhatsApp" },
  "contact.phoneSub": { en: "Tele-Health emergency line 24/7", fr: "Ligne d'urgence Télé-santé 24h/24" },
  "contact.emailLabel": { en: "Email", fr: "E-mail" },
  "contact.emailSub": { en: "We reply within 24 hours", fr: "Nous répondons sous 24 heures" },
  "contact.addressLabel": { en: "Clinic Address", fr: "Adresse de la clinique" },
  "contact.addressValue": { en: "Immeuble Cathédrale, 3rd Floor, Apartment E305", fr: "Immeuble Cathédrale, 3ᵉ étage, Appartement E305" },
  "contact.addressSub": { en: "Bafoussam, Cameroon", fr: "Bafoussam, Cameroun" },
  "contact.hoursLabel": { en: "Opening Hours", fr: "Heures d'ouverture" },
  "contact.hoursValue": { en: "Monday – Saturday: 8:00 AM – 6:00 PM", fr: "Lundi – Samedi : 8h00 – 18h00" },
  "contact.hoursSub": { en: "Tele-Health consultations available on request", fr: "Consultations Télé-santé disponibles sur demande" },

  "location.meta.title": { en: "Bafoussam Clinic & Delivery", fr: "Clinique de Bafoussam & Livraison" },
  "location.meta.description": {
    en: "Visit the S19 Herbal Clinic at {address}. Nationwide and worldwide delivery available.",
    fr: "Visitez la clinique S19 à l'adresse {address}. Livraison nationale et internationale disponible.",
  },
  "location.hero.eyebrow": { en: "Visit Our Physical Facility", fr: "Visitez nos installations physiques" },
  "location.hero.title": { en: "S19 Herbal Clinic, Bafoussam.", fr: "Clinique de phytothérapie S19, Bafoussam." },
  "location.hero.lead": {
    en: "In-house consultation, pharmacy pickup, and dispatch logistics - at the heart of Bafoussam, Cameroon.",
    fr: "Consultation sur place, retrait en pharmacie et logistique d'expédition - au cœur de Bafoussam, Cameroun.",
  },
  "location.hero.alt": { en: "S19 Herbal Clinic location in Bafoussam, Cameroon", fr: "Emplacement de la clinique S19 à Bafoussam, Cameroun" },
  "location.info.address": { en: "Exact Physical Address", fr: "Adresse physique exacte" },
  "location.info.hours": { en: "Opening Hours", fr: "Heures d'ouverture" },
  "location.info.hoursLine2": { en: "In-house consultation & pharmacy pickup", fr: "Consultation sur place & retrait en pharmacie" },
  "location.info.hoursLine3": { en: "Tele-Health emergency line 24/7 via WhatsApp", fr: "Ligne d'urgence Télé-santé 24h/24 via WhatsApp" },
  "location.info.logistics": { en: "Dispatch / Logistics", fr: "Expédition / Logistique" },
  "location.info.logisticsLine1": {
    en: "Fast dispatch of prescribed herbal packs anywhere in Cameroon",
    fr: "Expédition rapide de packs de plantes prescrits partout au Cameroun",
  },
  "location.info.logisticsLine2": {
    en: "Worldwide delivery via express courier - fees based on destination",
    fr: "Livraison mondiale par coursier express - frais selon la destination",
  },
  "location.info.logisticsLine3": { en: "Local clinic pickup available", fr: "Retrait local à la clinique disponible" },
  "location.mapTitle": { en: "S19 Herbal Clinic on Google Maps", fr: "Clinique S19 sur Google Maps" },
  "location.deliver.kicker": { en: "We deliver to", fr: "Nous livrons à" },
  "location.deliver.title": { en: "Shipping coverage", fr: "Zone de livraison" },
  "location.deliver.infoTitle": { en: "Delivery information", fr: "Informations de livraison" },
  "location.deliver.infoText": {
    en: "S19 can arrange delivery of herbal products within Cameroon and worldwide. Delivery fees are based on destination and transport/courier charges. Pickup can also be arranged where applicable.",
    fr: "S19 peut organiser la livraison de produits à base de plantes au Cameroun et dans le monde entier. Les frais de livraison dépendent de la destination et des frais de transport/coursier. Le retrait peut également être organisé le cas échéant.",
  },
  "location.directions": { en: "Directions via WhatsApp", fr: "Itinéraire via WhatsApp" },
  "location.bookVisit": { en: "Book a visit", fr: "Réserver une visite" },
  "location.cta.title": { en: "Visit us in Bafoussam or consult remotely", fr: "Rendez-nous visite à Bafoussam ou consultez à distance" },
  "location.cta.text": {
    en: "In-clinic consultations, Tele-health, and worldwide herbal dispatch - however far you are.",
    fr: "Consultations en clinique, Télé-santé, et expédition de plantes dans le monde entier - où que vous soyez.",
  },

  "track.hero.eyebrow": { en: "Order Tracking", fr: "Suivi de commande" },
  "track.hero.title": { en: "Track Your Order", fr: "Suivez votre commande" },
  "track.hero.lead": {
    en: "Enter the order reference from your confirmation and the email you used at checkout.",
    fr: "Saisissez la référence de commande de votre confirmation et l'e-mail utilisé lors du paiement.",
  },
  "track.title": { en: "Where is my order?", fr: "Où est ma commande ?" },
  "track.refLabel": { en: "Order Reference", fr: "Référence de commande" },
  "track.refPlaceholder": { en: "e.g. S19-20260101-AB12C", fr: "ex. S19-20260101-AB12C" },
  "track.emailLabel": { en: "Email Used at Checkout", fr: "E-mail utilisé lors du paiement" },
  "track.emailPlaceholder": { en: "you@example.com", fr: "vous@exemple.com" },
  "track.searching": { en: "Searching...", fr: "Recherche..." },
  "track.submit": { en: "Track Order", fr: "Suivre la commande" },
  "track.emptyError": { en: "Enter your order reference and email.", fr: "Saisissez votre référence de commande et votre e-mail." },
  "track.notFound": { en: "No order matches that reference and email.", fr: "Aucune commande ne correspond à cette référence et cet e-mail." },
  "track.hint": {
    en: "Orders are confirmed by our clinic on WhatsApp and SMS. Delivery status updates are shared in real time with you.",
    fr: "Les commandes sont confirmées par notre clinique via WhatsApp et SMS. Les mises à jour du statut de livraison vous sont communiquées en temps réel.",
  },

  "blog.meta.title": { en: "Health Blog & News", fr: "Blog santé & Actualités" },
  "blog.meta.description": {
    en: "Educational herbal health articles from S19 Herbal Clinic - natural remedies, nutrition, lifestyle medicine and clinic updates.",
    fr: "Articles éducatifs sur la santé à base de plantes de la clinique S19 - remèdes naturels, nutrition, médecine du mode de vie et actualités de la clinique.",
  },
  "blog.hero.eyebrow": { en: "Health Blog", fr: "Blog santé" },
  "blog.hero.title": { en: "Education & Clinic News", fr: "Éducation & Actualités de la clinique" },
  "blog.hero.lead": {
    en: "Evidence-informed herbal health articles, nutrition guidance and updates from the S19 wellness team.",
    fr: "Articles sur la santé à base de plantes fondés sur des preuves, conseils nutritionnels et actualités de l'équipe bien-être S19.",
  },
  "blog.hero.alt": {
    en: "Fresh fruit and vegetables from the S19 nutrition program",
    fr: "Fruits et légumes frais du programme nutrition S19",
  },
  "blog.empty.title": { en: "Articles are on the way", fr: "Les articles arrivent bientôt" },
  "blog.empty.text": {
    en: "The clinic is preparing its first articles. Subscribe below and you will be notified as soon as they are published.",
    fr: "La clinique prépare ses premiers articles. Abonnez-vous ci-dessous et vous serez notifié dès leur publication.",
  },
  "blog.featured": { en: "Featured", fr: "À la une" },
  "blog.read": { en: "Read article", fr: "Lire l'article" },
  "blog.search.placeholder": { en: "Search articles...", fr: "Rechercher des articles..." },
  "blog.filter.all": { en: "All", fr: "Tous" },
  "blog.filter.featured": { en: "Featured", fr: "À la une" },
  "blog.search.empty": { en: "No articles match your search.", fr: "Aucun article ne correspond à votre recherche." },
  "blog.newsletter.title": { en: "Get new articles by email", fr: "Recevez les nouveaux articles par e-mail" },
  "blog.newsletter.text": {
    en: "Health tips, clinic updates and new articles - no spam, unsubscribe anytime.",
    fr: "Conseils santé, actualités de la clinique et nouveaux articles - pas de spam, désinscription à tout moment.",
  },

  "tele.hero.eyebrow": { en: "Care From Home", fr: "Soins médicaux virtuels disponibles" },
  "tele.hero.title": {
    en: "Talk to S19 from home, anywhere in the world.",
    fr: "Télé-santé S19 : consultations à distance et suivis où que vous soyez.",
  },
  "tele.hero.lead": {
    en: "Cannot make it to our clinic in Bafoussam? You can send us your lab results, discuss your health concerns by phone or WhatsApp, and get regular follow-up — wherever you are.",
    fr: "Impossible de venir à notre clinique physique de Bafoussam ? Nous proposons des consultations en ligne structurées, l'évaluation de vos résultats de laboratoire, et des suivis de traitement planifiés par téléphone et messagerie sécurisée.",
  },
  "tele.hero.alt": { en: "Doctor preparing for a remote Tele-Health consultation", fr: "Médecin se préparant pour une consultation de Télé-santé à distance" },
  "tele.price.title": { en: "Online consultation", fr: "Consultation en ligne" },
  "tele.price.text": {
    en: "One phone or WhatsApp consultation. Your lab results are reviewed and you get a personal herbal plan.",
    fr: "Une consultation par téléphone ou WhatsApp. Vos résultats de laboratoire sont examinés et vous recevez un plan personnel à base de plantes.",
  },
  "tele.steps.kicker": { en: "How remote care works", fr: "Comment fonctionnent les soins à distance" },
  "tele.steps.title": { en: "From consultation to follow-up, wherever you are.", fr: "De la consultation au suivi, où que vous soyez." },
  "tele.step4.title": { en: "Anywhere, Anytime", fr: "Partout, à tout moment" },
  "tele.step4.text": {
    en: "WhatsApp, phone, or secure messaging - structured care that fits around your life.",
    fr: "WhatsApp, téléphone ou messagerie sécurisée - des soins structurés qui s'adaptent à votre vie.",
  },
  "tele.modalities.kicker": { en: "What you can expect", fr: "Ce à quoi vous pouvez vous attendre" },
  "tele.modalities.title": { en: "A complete remote consultation.", fr: "Une consultation à distance complète." },
  "tele.modalities.text": {
    en: "Everything you would get from an in-clinic visit, delivered wherever you are.",
    fr: "Tout ce que vous obtiendriez lors d'une visite en clinique, livré où que vous soyez.",
  },
  "tele.modality1.title": { en: "Online Consultation", fr: "Consultation en ligne" },
  "tele.modality1.text": {
    en: "A structured call or WhatsApp session covering your symptoms, medical history, and lab results.",
    fr: "Un appel structuré ou une session WhatsApp couvrant vos symptômes, vos antécédents médicaux et vos résultats de laboratoire.",
  },
  "tele.modality2.title": { en: "Lab & Document Review", fr: "Analyse de laboratoire & de documents" },
  "tele.modality2.text": {
    en: "Send us your lab reports and previous treatment records for a detailed herbal strategy review.",
    fr: "Envoyez-nous vos rapports de laboratoire et vos dossiers de traitement antérieurs pour une analyse détaillée de la stratégie à base de plantes.",
  },
  "tele.modality3.title": { en: "Scheduled Follow-Ups", fr: "Suivis planifiés" },
  "tele.modality3.text": {
    en: "Regular check-ins on symptom progression, lifestyle adjustment, and dosage.",
    fr: "Des points réguliers sur l'évolution des symptômes, l'ajustement du mode de vie et le dosage.",
  },
  "tele.modality4.title": { en: "Private & Confidential", fr: "Privé et confidentiel" },
  "tele.modality4.text": {
    en: "Your health details are kept strictly private and only shared with authorized clinic staff.",
    fr: "Vos données de santé restent strictement privées et ne sont partagées qu'avec le personnel clinique autorisé.",
  },
  "tele.bookVirtual": { en: "Book Virtual Consult Now", fr: "Réserver une consultation virtuelle" },
  "tele.cta.title": { en: "Consult S19 specialists from anywhere", fr: "Consultez les spécialistes S19 de n'importe où" },
  "tele.cta.text": {
    en: "Connect directly with S19 Herbal Clinic specialists right now, from Cameroon or anywhere in the world.",
    fr: "Connectez-vous directement aux spécialistes de la clinique S19 dès maintenant, depuis le Cameroun ou n'importe où dans le monde.",
  },

  "blogPost.notFound": { en: "Article not found | S19 Health Blog", fr: "Article introuvable | Blog santé S19" },
  "blogPost.metaBlog": { en: "S19 Health Blog", fr: "Blog santé S19" },
  "blogPost.back": { en: "Back to the blog", fr: "Retour au blog" },
  "blogPost.by": { en: "By {author}", fr: "Par {author}" },
  "blogPost.minRead": { en: "{minutes} min read", fr: "{minutes} min de lecture" },
  "blogPost.enjoyed": { en: "Enjoyed this article?", fr: "Cet article vous a plu ?" },
  "blogPost.newsletter.text": {
    en: "Subscribe for the next health update - tips, new articles and clinic news, straight to your inbox.",
    fr: "Abonnez-vous pour la prochaine mise à jour santé - conseils, nouveaux articles et actualités de la clinique, directement dans votre boîte de réception.",
  },

  "newsletter.placeholder": { en: "you@example.com", fr: "vous@exemple.com" },
  "newsletter.aria": { en: "Email address", fr: "Adresse e-mail" },
  "newsletter.submitting": { en: "Subscribing…", fr: "Inscription…" },
  "newsletter.subscribe": { en: "Subscribe", fr: "S'abonner" },
  "newsletter.success": {
    en: "You are subscribed. We will send health updates and new articles.",
    fr: "Vous êtes abonné. Nous enverrons des mises à jour santé et de nouveaux articles.",
  },
  "newsletter.errorDefault": { en: "Could not subscribe right now.", fr: "Impossible de s'abonner pour le moment." },

  "cart.hero.eyebrow": { en: "Shopping Cart", fr: "Panier" },
  "cart.hero.title": { en: "Your Cart", fr: "Votre panier" },
  "cart.hero.alt": {
    en: "Shopping basket with fresh products",
    fr: "Panier de courses avec des produits frais",
  },
  "cart.metaDescription": {
    en: "Review your S19 Herbal Clinic order and proceed to checkout.",
    fr: "Révisez votre commande de la clinique S19 et passez au paiement.",
  },
  "cart.countTitle": { en: "Your Cart ({count})", fr: "Votre panier ({count})" },
  "cart.empty.title": { en: "Your cart is empty", fr: "Votre panier est vide" },
  "cart.empty.text": {
    en: "Browse the catalog and add some standardized S19 formulas.",
    fr: "Parcourez le catalogue et ajoutez des formules S19 standardisées.",
  },
  "cart.browse": { en: "Browse the Catalog", fr: "Parcourir le catalogue" },
  "cart.continue": { en: "Continue Shopping", fr: "Continuer mes achats" },
  "cart.orderWhatsApp": { en: "Order via WhatsApp", fr: "Commander via WhatsApp" },
  "cart.summary": { en: "Order Summary", fr: "Résumé de la commande" },
  "cart.subtotalOne": { en: "Subtotal ({count} item)", fr: "Sous-total ({count} article)" },
  "cart.subtotalMany": { en: "Subtotal ({count} items)", fr: "Sous-total ({count} articles)" },
  "cart.delivery": { en: "Delivery", fr: "Livraison" },
  "cart.deliveryCalc": { en: "Calculated at checkout", fr: "Calculé au paiement" },
  "cart.total": { en: "Total", fr: "Total" },
  "cart.checkout": { en: "Proceed to Checkout", fr: "Passer au paiement" },
  "cart.paymentHint": {
    en: "Pay by MTN MoMo, Orange Money, bank transfer, or on pickup/delivery.",
    fr: "Payez par MTN MoMo, Orange Money, virement bancaire, ou à la livraison/au retrait.",
  },
  "cart.remove": { en: "Remove {name}", fr: "Retirer {name}" },
  "cart.itemUnit": { en: "{price}", fr: "{price}" },

  "checkout.hero.eyebrow": { en: "Checkout", fr: "Paiement" },
  "checkout.metaDescription": {
    en: "Complete your S19 Herbal Clinic order.",
    fr: "Finalisez votre commande de la clinique S19.",
  },
  "checkout.hero.title": { en: "Complete Your Order", fr: "Finaliser votre commande" },
  "checkout.empty.text": {
    en: "Your cart is empty. Add products before checking out.",
    fr: "Votre panier est vide. Ajoutez des produits avant de passer au paiement.",
  },
  "checkout.contactTitle": { en: "Contact & Delivery", fr: "Contact & Livraison" },
  "checkout.fullName": { en: "Full Name", fr: "Nom complet" },
  "checkout.fullNamePh": { en: "Your full name", fr: "Votre nom complet" },
  "checkout.phone": { en: "Phone / WhatsApp", fr: "Téléphone / WhatsApp" },
  "checkout.emailPh": { en: "you@example.com", fr: "vous@exemple.com" },
  "checkout.deliveryMode": { en: "Delivery Mode", fr: "Mode de livraison" },
  "checkout.mode1.title": { en: "Clinic Pickup (Bafoussam)", fr: "Retrait à la clinique (Bafoussam)" },
  "checkout.mode1.desc": {
    en: "Collect your order at Cathedrale Market Entrance B, Bafoussam. Free.",
    fr: "Retirez votre commande à l'entrée B du marché Cathédrale, Bafoussam. Gratuit.",
  },
  "checkout.mode2.title": { en: "Cameroon Nationwide", fr: "Cameroun, partout dans le pays" },
  "checkout.mode2.desc": {
    en: "Courier delivery to Douala, Yaounde, Bamenda, Buea and more.",
    fr: "Livraison par coursier vers Douala, Yaoundé, Bamenda, Buéa et plus encore.",
  },
  "checkout.mode3.title": { en: "Worldwide", fr: "Dans le monde entier" },
  "checkout.mode3.desc": {
    en: "Express courier internationally. Fee confirmed by our team after ordering.",
    fr: "Coursier express à l'international. Frais confirmés par notre équipe après la commande.",
  },
  "checkout.fee": { en: " Fee: {fee}", fr: " Frais : {fee}" },
  "checkout.city": { en: "City / Country", fr: "Ville / Pays" },
  "checkout.cityPh": { en: "e.g. Yaounde / France", fr: "ex. Yaoundé / France" },
  "checkout.address": { en: "Delivery Address", fr: "Adresse de livraison" },
  "checkout.addressPh": { en: "Street, landmark, neighborhood", fr: "Rue, repère, quartier" },
  "checkout.addressHint": {
    en: "Optional note for clinic pickup coordination.",
    fr: "Note facultative pour la coordination du retrait à la clinique.",
  },
  "checkout.paymentTitle": { en: "Payment Method", fr: "Méthode de paiement" },
  "checkout.notes": { en: "Order Notes (optional)", fr: "Notes de commande (facultatif)" },
  "checkout.notesPh": {
    en: "Anything the clinic should know about this order.",
    fr: "Tout ce que la clinique devrait savoir sur cette commande.",
  },
  "checkout.placeOrder": { en: "Place Order", fr: "Passer la commande" },
  "checkout.placing": { en: "Placing order...", fr: "Passage de la commande..." },
  "checkout.privacy": {
    en: "Your details are kept private and only used to fulfil this order.",
    fr: "Vos informations restent privées et ne sont utilisées que pour traiter cette commande.",
  },
  "checkout.qty": { en: "Qty {qty} × {price}", fr: "Qté {qty} × {price}" },
  "checkout.subtotal": { en: "Subtotal", fr: "Sous-total" },
  "checkout.deliveryConfirmed": { en: "Confirmed after order", fr: "Confirmé après la commande" },
  "checkout.whatsappNote": {
    en: "Our clinic will contact you on WhatsApp to confirm payment and delivery.",
    fr: "Notre clinique vous contactera sur WhatsApp pour confirmer le paiement et la livraison.",
  },
  "checkout.contactUs": { en: "Contact us", fr: "Contactez-nous" },
  "checkout.orderFailed": {
    en: "We could not place your order. Please try again or order via WhatsApp.",
    fr: "Nous n'avons pas pu enregistrer votre commande. Veuillez réessayer ou commander via WhatsApp.",
  },

  "order.metaTitle": { en: "Order Confirmation", fr: "Confirmation de commande" },
  "order.notFoundTitle": { en: "Order {reference}", fr: "Commande {reference}" },
  "order.notFoundText": {
    en: "Your order has been submitted. If you reload this page later, you can fetch it again with the tracking tool. A confirmation copy was also sent to your email and WhatsApp.",
    fr: "Votre commande a été soumise. Si vous rechargez cette page plus tard, vous pourrez la retrouver avec l'outil de suivi. Une copie de confirmation a également été envoyée à votre e-mail et sur WhatsApp.",
  },
  "order.confirmWhatsApp": { en: "Confirm via WhatsApp", fr: "Confirmer via WhatsApp" },
  "order.thankYou": { en: "Thank you, {name}", fr: "Merci, {name}" },
  "order.received": { en: "Your order has been received. Reference: {reference}", fr: "Votre commande a été reçue. Référence : {reference}" },
  "order.qty": { en: "Qty {qty}", fr: "Qté {qty}" },
  "order.deliveryPayment": { en: "Delivery & Payment", fr: "Livraison & Paiement" },
  "order.deliveryLabel": { en: "Delivery", fr: "Livraison" },
  "order.paymentLabel": { en: "Payment", fr: "Paiement" },
  "order.confirmNote": {
    en: "Our team will confirm details on WhatsApp.",
    fr: "Notre équipe confirmera les détails sur WhatsApp.",
  },
  "order.trackThis": { en: "Track This Order", fr: "Suivre cette commande" },

  "legal.eyebrow": { en: "Legal", fr: "Mentions légales" },
  "terms.metaTitle": { en: "Terms of Use", fr: "Conditions d'utilisation" },
  "terms.lead": { en: "Last updated: September 2026", fr: "Dernière mise à jour : septembre 2026" },
  "terms.section.general": { en: "General", fr: "Général" },
  "terms.section.healthDisclaimer": { en: "Health Disclaimer", fr: "Avertissement sanitaire" },
  "terms.section.orders": { en: "Orders & Payment", fr: "Commandes & Paiement" },
  "terms.section.shipping": { en: "Shipping & Delivery", fr: "Expédition & Livraison" },
  "terms.section.returns": { en: "Returns & Refunds", fr: "Retours & Remboursements" },
  "terms.section.liability": { en: "Liability", fr: "Responsabilité" },
  "terms.contact": {
    en: "Contact us at {email} or {phone} with any questions about these terms.",
    fr: "Contactez-nous à {email} ou au {phone} pour toute question concernant ces conditions.",
  },
  "terms.readRefundBefore": {
    en: "Read our",
    fr: "Lisez notre",
  },
  "terms.readRefundAfter": {
    en: "for details on returns and refunds.",
    fr: "pour plus de détails sur les retours et remboursements.",
  },
  "terms.refundPolicy": {
    en: "Refund, Return & Exchange Policy",
    fr: "Politique de remboursement, retour et échange",
  },
  "privacy.metaTitle": { en: "Privacy Policy", fr: "Politique de confidentialité" },
  "privacy.metaDescription": {
    en: "How S19 Herbal Clinic collects, uses, and protects your personal and health information.",
    fr: "Comment la clinique S19 collecte, utilise et protège vos informations personnelles et de santé.",
  },
  "privacy.lead": { en: "Last updated: September 2026", fr: "Dernière mise à jour : septembre 2026" },
  "privacy.intro": {
    en: "{brand} ({slogan}) respects your privacy. This policy explains what we collect, why, and how it is protected.",
    fr: "La {brand} ({slogan}) respecte votre vie privée. Cette politique explique ce que nous collectons, pourquoi, et comment ces informations sont protégées.",
  },
  "privacy.section.info": { en: "Information We Collect", fr: "Informations que nous collectons" },
  "privacy.section.use": { en: "How We Use Your Information", fr: "Comment nous utilisons vos informations" },
  "privacy.section.health": { en: "Health Information", fr: "Informations de santé" },
  "privacy.section.payments": { en: "Payments", fr: "Paiements" },
  "privacy.section.cookies": { en: "Cookies & Local Storage", fr: "Cookies & stockage local" },
  "privacy.section.rights": { en: "Your Rights", fr: "Vos droits" },
  "privacy.section.retention": { en: "Data Retention", fr: "Conservation des données" },
  "privacy.questions": {
    en: "Questions about privacy? Contact us at {email} or {phone}.",
    fr: "Des questions sur la confidentialité ? Contactez-nous à {email} ou au {phone}.",
  },
  "refund.metaTitle": { en: "Refund, Return & Exchange Policy", fr: "Politique de remboursement, retour et échange" },
  "refund.metaDescription": {
    en: "How S19 Herbal Clinic handles refunds, returns, and exchanges for herbal products and consultations.",
    fr: "Comment la clinique S19 gère les remboursements, retours et échanges de produits à base de plantes et de consultations.",
  },
  "refund.hero.eyebrow": { en: "Policy", fr: "Politique" },
  "refund.lead": { en: "Last updated: September 2026", fr: "Dernière mise à jour : septembre 2026" },
  "refund.hero.lead": {
    en: "How S19 Herbal Clinic handles refunds, returns, and exchanges for herbal products and professional services.",
    fr: "Comment la clinique S19 gère les remboursements, retours et échanges de produits à base de plantes et de services professionnels.",
  },
  "refund.intro": {
    en: "Last updated: September 2026. At {brand} we are committed to providing quality herbal products and professional services. All requests are subject to verification, this policy, and applicable law.",
    fr: "Dernière mise à jour : septembre 2026. À la {brand}, nous nous engageons à fournir des produits à base de plantes de qualité et des services professionnels. Toutes les demandes sont soumises à vérification, à cette politique et à la loi applicable.",
  },
  "refund.section1": { en: "1. Returns & Eligibility", fr: "1. Retours & éligibilité" },
  "refund.section2": { en: "2. Damaged, Defective or Incorrect Products", fr: "2. Produits endommagés, défectueux ou incorrects" },
  "refund.section3": { en: "3. Opened, Used & Health Products", fr: "3. Produits ouverts, utilisés & produits de santé" },
  "refund.section4": { en: "4. Personalized & Custom Preparations", fr: "4. Préparations personnalisées & sur mesure" },
  "refund.section5": { en: "5. Consultations, Treatments & Programs", fr: "5. Consultations, traitements & programmes" },
  "refund.section6": { en: "6. Health Results", fr: "6. Résultats de santé" },
  "refund.section7": { en: "7. Shipping, Courier & Transport Agencies", fr: "7. Expédition, coursiers & agences de transport" },
  "refund.section8": { en: "8. Exchanges", fr: "8. Échanges" },
  "refund.section9": { en: "9. Return & Delivery Costs", fr: "9. Frais de retour & de livraison" },
  "refund.section10": { en: "10. Refund Processing", fr: "10. Traitement des remboursements" },
  "refund.section11": { en: "11. Verification & Inspection", fr: "11. Vérification & inspection" },
  "refund.section12": { en: "12. How to Submit a Request", fr: "12. Comment soumettre une demande" },
  "refund.section13": { en: "13. Consumer Rights", fr: "13. Droits des consommateurs" },
  "refund.serviceTitle": { en: "How to reach customer service", fr: "Comment joindre le service client" },
  "refund.whatsappPhone": { en: "WhatsApp / Phone:", fr: "WhatsApp / Téléphone :" },
  "refund.openRequest": { en: "Open a request on WhatsApp", fr: "Ouvrir une demande sur WhatsApp" },
  "refund.readTerms": {
    en: "See our full {terms} for more information.",
    fr: "Consultez nos {terms} complètes pour plus d'informations.",
  },
  "refund.tos": { en: "Terms of Use", fr: "Conditions d'utilisation" },

  "account.metaTitle": { en: "Your account", fr: "Votre compte" },
  "account.metaDescription": {
    en: "Sign in to your S19 Herbal Clinic account to track orders, manage testimonials, read messages, and receive updates.",
    fr: "Connectez-vous à votre compte de la clinique S19 pour suivre vos commandes, gérer vos témoignages, lire vos messages et recevoir des mises à jour.",
  },
  "account.kicker": { en: "User Portal", fr: "Portail utilisateur" },
  "account.title": { en: "Coming Soon.", fr: "Bientôt disponible." },
  "account.text": {
    en: "The S19 patient portal is being prepared for you. Soon you will be able to track orders, manage your testimonials, receive clinic messages, and more - all in one place. Follow our WhatsApp for early access.",
    fr: "Le portail patient S19 est en préparation pour vous. Bientôt, vous pourrez suivre vos commandes, gérer vos témoignages, recevoir les messages de la clinique et plus encore - tout au même endroit. Suivez notre WhatsApp pour un accès anticipé.",
  },
  "account.bookConsultation": { en: "Book a Consultation", fr: "Réserver une consultation" },
  "account.backHome": { en: "Back to Home", fr: "Retour à l'accueil" },
} as const;

export type TranslationKey = keyof typeof dict;
export type TranslationParams = Record<string, string | number>;

export function translate(locale: Locale, key: TranslationKey, params?: TranslationParams): string {
  const entry = dict[key];
  const text = locale === "fr" ? entry.fr : entry.en;
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (m, k) => (k in params ? String(params[k]) : m));
}

export function parseLocale(value: string | undefined | null): Locale {
  return value === "fr" ? "fr" : "en";
}

export const LOCALE_OPTIONS: { code: Locale; short: string; label: string }[] = [
  { code: "en", short: "EN", label: "English" },
  { code: "fr", short: "FR", label: "Français" },
];