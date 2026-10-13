export const COOKIE_NAME = "s19_locale";

export type Locale = "en" | "fr";

export interface LocaleEntry {
  en: string;
  fr: string;
}

const dict = {
  "nav.home": { en: "Home", fr: "Accueil" },
  "nav.programs": { en: "Services", fr: "Services" },
  "nav.telehealth": { en: "Tele-Health", fr: "Télé-santé" },
  "nav.shop": { en: "Shop", fr: "Boutique" },
  "nav.blog": { en: "Blog", fr: "Blog" },
  "nav.videos": { en: "Videos", fr: "Vidéos" },
  "nav.about": { en: "About", fr: "À propos" },
  // Items 01 and 13 of the footer/navigation guide, unblocked now that /faq
  // exists. The guide wants FAQ "clearly visible" in the main navigation and
  // linked from the footer as well, not buried in an account screen.
  "nav.faq": { en: "FAQ", fr: "FAQ" },
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
  "aria.telegram": { en: "S19 on Telegram", fr: "S19 sur Telegram" },
  "aria.whatsapp": { en: "Chat with S19 on WhatsApp", fr: "Discuter avec S19 sur WhatsApp" },
  "aria.openMenu": { en: "Open menu", fr: "Ouvrir le menu" },
  "aria.closeMenu": { en: "Close menu", fr: "Fermer le menu" },
  "aria.account": { en: "Account", fr: "Compte" },
  "aria.chooseDate": { en: "Open the date picker", fr: "Ouvrir le sélecteur de date" },
  "field.dateInvalid": {
    en: "Enter the date as dd/mm/yyyy.",
    fr: "Saisissez la date au format jj/mm/aaaa.",
  },
  "field.dateOutOfRange": {
    en: "Pick a date within the allowed range.",
    fr: "Choisissez une date dans la plage autorisée.",
  },

  // Items 02 and 03 of the footer/navigation guide. The header renders
  // common.bookConsultation as its principal CTA, so this label is the one most
  // visitors read; it used to read "Book Consultation" without the article.
  "common.bookConsultation": { en: "Book a Consultation", fr: "Réserver une consultation" },
  "common.bookConsultationLower": { en: "Book a Consultation", fr: "Réserver une consultation" },
  "common.viewCatalog": { en: "View full catalog", fr: "Voir le catalogue complet" },
  "common.browseCatalog": { en: "Browse Catalog", fr: "Parcourir le catalogue" },
  "common.viewAllPrograms": { en: "View all services", fr: "Voir tous les services" },
  "common.contactPricing": { en: "Contact S19 for pricing", fr: "Contactez S19 pour le prix" },
  "common.orderWhatsApp": { en: "Order via WhatsApp", fr: "Commander via WhatsApp" },
  "common.view": { en: "View", fr: "Voir" },
  // Item 03. This was "WhatsApp / Dr Consultation" and is the footer's WhatsApp
  // link on every page, so it read as a second clinical booking CTA. Ordering
  // pages keep "Order via WhatsApp" (common.orderWhatsApp / cart.orderWhatsApp),
  // which the guide explicitly allows.
  "common.whatsappDr": { en: "Talk to S19 on WhatsApp", fr: "Parlez à S19 sur WhatsApp" },
  "common.readMore": { en: "Read article", fr: "Lire l'article" },
  "common.backHome": { en: "Back to Home", fr: "Retour à l'accueil" },
  "common.contactPage": { en: "Contact", fr: "Contact" },
  "common.questions": { en: "Common questions", fr: "Questions fréquentes" },
  "common.sendMessage": { en: "Send Message", fr: "Envoyer le message" },
  "common.submit": { en: "Submit", fr: "Envoyer" },
  "common.optional": { en: "optional", fr: "facultatif" },

  "home.hero.kicker": { en: "S19 Herbal Clinic", fr: "Clinique de phytothérapie S19" },
  // Hero copy is set by docs/S19_Homepage_Adjustments_Developer_Brief.md §2.1.
  // The headline names the practice ("Science-Based Herbalism") rather than
  // promising an outcome, which is the positioning the About page also uses.
  "home.hero.titleA": {
    en: "Natural Healing. Personalized Care. Science-Based Herbalism.",
    fr: "Guérison naturelle. Soins personnalisés. Phytothérapie fondée sur la science.",
  },
  "home.hero.titleB": {
    en: "Where Natural Wellness Meets Personalized Care.",
    fr: "Où le bien-être naturel rencontre les soins personnalisés.",
  },
  "home.hero.lead": {
    en: "At S19 Herbal Clinic, we combine evidence-informed herbal medicine with individualized assessment, nutrition, lifestyle support, health education, continuous monitoring and clinic-based supportive therapies using specialized high-technology devices.",
    fr: "À la Clinique de phytothérapie S19, nous associons une phytothérapie fondée sur les données probantes à une évaluation individualisée, un soutien nutritionnel, un accompagnement du mode de vie, une éducation à la santé, un suivi continu et des thérapies de soutien en clinique utilisant des appareils spécialisés de haute technologie.",
  },
  "home.hero.lead2": {
    en: "We don't believe in treating blindly. Before developing a personalized care plan, we seek to understand your medical history, current medications, laboratory findings, lifestyle, nutrition and the wider factors that may be contributing to your health condition.",
    fr: "Nous ne croyons pas traiter à l'aveugle. Avant d'élaborer un plan de soins personnalisé, nous cherchons à comprendre votre antécédent médical, vos médicaments actuels, vos résultats de laboratoire, votre mode de vie, votre nutrition et les facteurs plus larges qui peuvent contribuer à votre état de santé.",
  },
  // Item 01 of the Cameroon/International Delivery guide. The third item was
  // "Worldwide product delivery", which the guide forbids. Only that item is
  // rewritten: the other two name the clinic and the Tele-Health service, and
  // the guide says nothing about them, so they stay. "Supported international
  // destinations" carries the guide's "supported destinations" rule, and
  // Cameroon is named before international shipping.
  "home.hero.trust": {
    en: "In-person care in Bafoussam · Tele-Health consultations available · Delivery across Cameroon and to supported international destinations",
    fr: "Soins en personne à Bafoussam · Consultations en Télé-santé disponibles · Livraison dans tout le Cameroun et vers des destinations internationales prises en charge",
  },
  // Brief §2.1 gives these two labels verbatim, so they get their own keys
  // rather than borrowing a generic CTA string that could drift.
  "home.hero.ctaBook": { en: "Book a Consultation", fr: "Réserver une consultation" },
  "home.hero.ctaPrograms": { en: "Explore Our Services", fr: "Découvrir nos services" },
  "home.hero.whatsapp": { en: "Talk to S19 on WhatsApp", fr: "Parlez à S19 sur WhatsApp" },
  "home.hero.claim": {
    en: "Specialized Support for Diabetes and Cancer Care.",
    fr: "Soutien spécialisé pour le diabète et les soins du cancer.",
  },

  // SECTION 2 - More Than Symptom Management.
  "home.whole.kicker": { en: "The S19 approach", fr: "L'approche S19" },
  "home.whole.title": { en: "More Than Symptom Management", fr: "Plus que la gestion des symptômes" },
  "home.whole.subtitle": { en: "We Look at the Whole Person", fr: "Nous considérons la personne dans sa globalité" },
  "home.whole.lead": {
    en: "Symptoms matter - but they don't always tell the whole story. Our approach looks beyond the immediate complaint to better understand the metabolic, nutritional, lifestyle, environmental and other modifiable factors that may be affecting your health.",
    fr: "Les symptômes comptent, mais ils ne racontent pas toujours toute l'histoire. Notre approche va au-delà de la plainte immédiate pour mieux comprendre les facteurs métaboliques, nutritionnels, liés au mode de vie, environnementaux et autres facteurs modifiables qui peuvent affecter votre santé.",
  },
  "home.whole.depends": { en: "Depending on the individual situation, care may include:", fr: "Selon la situation individuelle, les soins peuvent inclure :" },
  "home.whole.closing": {
    en: "Our goal is not simply to give you products. It is to help you understand your health and participate actively in your care.",
    fr: "Notre objectif n'est pas simplement de vous donner des produits. Il est de vous aider à comprendre votre santé et à participer activement à vos soins.",
  },
  "home.whole.cta": { en: "Learn About the S19 Approach", fr: "En savoir plus sur l'approche S19" },

  // SECTION 3 - S19 Patient Pathway.
  "home.pathway.kicker": { en: "How care works", fr: "Comment les soins fonctionnent" },
  "home.pathway.title": { en: "The S19 Patient Pathway", fr: "Le parcours patient S19" },
  "home.pathway.lead": {
    en: "This is the process your consultation follows, from the first conversation to ongoing monitoring.",
    fr: "Voici le processus que suit votre consultation, de la première conversation au suivi continu.",
  },
  "home.pathway.cta": { en: "Start Your S19 Journey", fr: "Commencez votre parcours S19" },

  // SECTION 4 - Areas We Support.
  "home.areas.kicker": { en: "Areas we support", fr: "Domaines que nous couvrons" },
  "home.areas.title": {
    en: "Personalized Care for Complex and Chronic Health Needs",
    fr: "Des soins personnalisés pour les besoins de santé complexes et chroniques",
  },
  "home.areas.lead": {
    en: "Each program begins with an assessment and is built around the individual, not a fixed bundle.",
    fr: "Chaque programme commence par une évaluation et se construit autour de l'individu, non autour d'un ensemble fixe.",
  },
  "home.areas.cta": { en: "Explore All Services", fr: "Découvrir tous les services" },

  // SECTION 5 - Science-Based Herbalism.
  "home.science.kicker": { en: "Science-based herbalism", fr: "Phytothérapie fondée sur la science" },
  "home.science.title": { en: "Science-Based Herbalism", fr: "Phytothérapie fondée sur la science" },
  "home.science.subtitle": { en: "Natural Does Not Automatically Mean Safe", fr: "Naturel ne veut pas dire automatiquement sans danger" },
  "home.science.lead": {
    en: "Herbs contain biologically active compounds. They can produce physiological effects, interact with medications and may not be appropriate for every person. Responsible herbal care therefore requires more than simply choosing a plant for a symptom.",
    fr: "Les plantes contiennent des composés biologiquement actifs. Elles peuvent produire des effets physiologiques, interagir avec des médicaments et ne pas convenir à tout le monde. Une phytothérapie responsable exige donc bien plus que le simple choix d'une plante pour un symptôme.",
  },
  "home.science.closing": {
    en: "We combine traditional knowledge with modern scientific understanding and available evidence to make herbal care more responsible and individualized.",
    fr: "Nous combinons les connaissances traditionnelles avec la compréhension scientifique moderne et les données disponibles afin de rendre les soins à base de plantes plus responsables et plus personnalisés.",
  },
  "home.science.cta": {
    en: "Learn How We Practice Herbal Medicine",
    fr: "Découvrez notre pratique de la phytothérapie",
  },

  // SECTION 6 - Not Anti-Conventional.
  "home.conventional.kicker": { en: "Our position", fr: "Notre position" },
  "home.conventional.title": {
    en: "S19 Is Not Anti-Conventional Treatment",
    fr: "S19 n'est pas contre le traitement conventionnel",
  },
  "home.conventional.p1": {
    en: "S19 Herbal Clinic recognizes the essential role of conventional healthcare. Pharmaceutical drugs, surgery, emergency medicine, hospitalization and specialist care can be necessary and lifesaving.",
    fr: "La Clinique de phytothérapie S19 reconnaît le rôle essentiel des soins conventionnels. Les médicaments, la chirurgie, la médecine d'urgence, l'hospitalisation et les soins spécialisés peuvent être nécessaires et salvateurs.",
  },
  "home.conventional.p2": {
    en: "Our approach is not about choosing \"natural versus conventional.\" It is about understanding the individual and using appropriate strategies responsibly.",
    fr: "Notre approche ne consiste pas à choisir entre « naturel » et « conventionnel ». Il s'agit de comprendre l'individu et d'utiliser des stratégies appropriées de manière responsable.",
  },
  "home.conventional.p3": {
    en: "Where conventional treatment is necessary, herbal and lifestyle support should complement - not delay or replace - appropriate medical care.",
    fr: "Lorsqu'un traitement conventionnel est nécessaire, le soutien herbal et de mode de vie doit compléter - et non retarder ni remplacer - les soins médicaux appropriés.",
  },
  "home.conventional.safety": {
    en: "Patients should never stop or reduce prescribed medication without appropriate clinical supervision.",
    fr: "Les patients ne doivent jamais arrêter ni réduire un médicament prescrit sans supervision clinique appropriée.",
  },

  // SECTION 7 - Personalized Care.
  "home.personal.kicker": { en: "Personalized care", fr: "Soins personnalisés" },
  "home.personal.title": {
    en: "Personalized Care - Not One-Size-Fits-All Treatment",
    fr: "Des soins personnalisés - pas un traitement unique pour tous",
  },
  "home.personal.lead": {
    en: "Two people can have the same diagnosis and still have very different medical histories, medications, nutritional patterns, risk factors and treatment needs.",
    fr: "Deux personnes peuvent partager le même diagnostic et avoir des antécédents médicaux, des médicaments, des habitudes alimentaires, des facteurs de risque et des besoins de traitement très différents.",
  },
  "home.personal.closing": {
    en: "Your plan is developed according to your individual circumstances and may change as your health status and objective findings change.",
    fr: "Votre plan est élaboré selon votre situation individuelle et peut évoluer à mesure que votre état de santé et vos constatations objectives changent.",
  },

  // SECTION 8 - In-Person + Tele-Health.
  "home.careWherever.kicker": { en: "In person or remote", fr: "En personne ou à distance" },
  "home.careWherever.title": { en: "Care Wherever You Are", fr: "Des soins où que vous soyez" },
  "home.careWherever.lead": {
    en: "Patients can consult at our Bafoussam clinic or remotely through Tele-Health. Relevant laboratory results and medical information can be shared for review, individualized recommendations can be provided, and follow-up can continue remotely where appropriate.",
    fr: "Les patients peuvent consulter à notre clinique de Bafoussam ou à distance via la Télé-santé. Les résultats de laboratoire pertinents et les informations médicales peuvent être partagés pour examen, des recommandations individualisées peuvent être fournies, et le suivi peut se poursuivre à distance le cas échéant.",
  },
  "home.careWherever.tele": { en: "Book Tele-Health", fr: "Réserver une Télé-consultation" },
  "home.careWherever.inPerson": { en: "Book an In-Person Consultation", fr: "Réserver une consultation en personne" },

  // SECTION 9 - Patient Accommodation.
  "home.accommodation.kicker": { en: "Travelling for care", fr: "Se déplacer pour se faire soigner" },
  "home.accommodation.title": { en: "Travelling to S19?", fr: "Vous vous déplacez vers S19 ?" },
  "home.accommodation.subtitle": { en: "On-Site Patient Accommodation", fr: "Hébergement des patients sur place" },
  "home.accommodation.lead": {
    en: "For patients travelling from outside Bafoussam who require several days of assessment, treatment or follow-up, simple and affordable accommodation is available within the clinic premises.",
    fr: "Pour les patients venant de l'extérieur de Bafoussam qui nécessitent plusieurs jours d'évaluation, de traitement ou de suivi, un hébergement simple et abordable est disponible dans les locaux de la clinique.",
  },
  "home.accommodation.cta": { en: "Learn About Accommodation", fr: "En savoir plus sur l'hébergement" },

  // SECTION 10 - Patient Experiences.
  "home.experiences.kicker": { en: "Patient experiences", fr: "Expériences de patients" },
  "home.experiences.title": { en: "Real Patient Experiences", fr: "De vraies expériences de patients" },
  "home.experiences.subtitle": { en: "Their Experience. Their Story.", fr: "Leur expérience. Leur histoire." },
  "home.experiences.lead": {
    en: "Read experiences voluntarily shared by people who have consulted S19 or used our programs.",
    fr: "Lisez des expériences partagées volontairement par des personnes qui ont consulté S19 ou utilisé nos programmes.",
  },
  // Required verbatim by the brief and by the existing /patient-stories page.
  // Kept adjacent to the testimonials, not on the Terms page.
  "home.experiences.disclaimer": {
    en: "Testimonials describe individual experiences only. They do not establish that a treatment caused the reported outcome, are not evidence that another patient will experience the same result, and should not be interpreted as a guarantee, medical advice or substitute for appropriate medical evaluation.",
    fr: "Les témoignages décrivent des expériences individuelles uniquement. Ils n'établissent pas qu'un traitement a causé le résultat rapporté, ne constituent pas une preuve qu'un autre patient obtiendra le même résultat, et ne doivent pas être interprétés comme une garantie, un avis médical ou un substitut à une évaluation médicale appropriée.",
  },
  "home.experiences.cta": { en: "View Patient Stories", fr: "Voir les témoignages" },

  // Section 3's pathway cards, section 5's keyword chips, section 7's element
  // cards and section 9's amenity list all live in lib/data/home-content.ts.
  // They are content the clinic edits, not UI chrome, and their French sits
  // beside the English there so a translator sees both.

  "home.catalog.kicker": { en: "Standardized formulas", fr: "Formules standardisées" },
  "home.catalog.title": { en: "S19 Herbal Catalog", fr: "Catalogue de plantes S19" },
  "home.catalog.lead": {
    // Was "Pick up your order in Bafoussam or get it delivered anywhere in the
    // world" / "en livraison mondiale" - the widest delivery promise on the site,
    // and the French one outlived several passes because it never used the word
    // "worldwide". Both now name the coverage S19 actually offers.
    en: "Carefully made herbal products. Pick up your order in Bafoussam, get it delivered across Cameroon, or have it shipped to supported international destinations.",
    fr: "Des solutions botaniques soigneusement formulées. Disponibles au retrait à Bafoussam, à la livraison dans tout le Cameroun et à l'expédition vers des destinations internationales prises en charge.",
  },
  "home.catalog.note": {
    en: "Also in the clinic: Malaria & Typhoid Tea, Activated Charcoal, Oral Powder, Castor Oil, and Weight-loss Tea.",
    fr: "Également disponibles en clinique : Tisane Malaria & Typhoïde, Charbon actif, Poudre buccale, Huile de ricin et Tisane minceur.",
  },

  "home.videos.kicker": { en: "Patient Stories on Video", fr: "Témoignages de patients en vidéo" },
  "home.videos.title": { en: "Hear it from our patients, on video.", fr: "Écoutez nos patients, en vidéo." },
  "home.videos.lead": {
    en: "Real patients telling their own healing stories on camera. Swipe through the latest video reviews, then explore the full collection.",
    fr: "De vrais patients racontent leurs histoires de guérison en vidéo. Parcourez les témoignages vidéo les plus récents, puis explorez toute la collection.",
  },
  "home.videos.cta": { en: "Watch all video reviews", fr: "Voir tous les avis vidéo" },
  "home.videos.prev": { en: "Previous videos", fr: "Vidéos précédentes" },
  "home.videos.next": { en: "Next videos", fr: "Vidéos suivantes" },
  "home.videos.empty": {
    en: "New patient videos are being prepared. The clinic will publish them here shortly.",
    fr: "De nouvelles vidéos de patients sont en préparation. La clinique les publiera ici très bientôt.",
  },

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
    en: "The experiences shared on this page are personal accounts from individual S19 patients and clients. Individual experiences and outcomes vary, and the results described should not be considered typical, guaranteed or expected for every patient. Testimonials do not establish that an S19 product, herbal formulation or treatment program caused a reported improvement or outcome. They are shared for informational purposes and should not be interpreted as medical advice or as a substitute for individualized medical assessment. Some testimonials may have been lightly edited for spelling, grammar, length or clarity, or translated from another language, while preserving the patient's intended meaning. Patients taking prescribed medication should not stop or reduce their medication based on another patient's experience. Medication changes should be made only with appropriate clinical supervision.",
    fr: "Les expériences partagées sur cette page sont des récits personnels de patients et de clients individuels de S19. Les expériences et les résultats varient d'une personne à l'autre, et les résultats décrits ne doivent pas être considérés comme typiques, garantis ou attendus pour tous les patients. Les témoignages n'établissent pas qu'un produit S19, une formulation à base de plantes ou un programme de traitement a provoqué une amélioration ou un résultat rapporté. Ils sont partagés à des fins d'information uniquement et ne doivent pas être interprétés comme un avis médical ni comme un substitut à une évaluation médicale individualisée. Certains témoignages peuvent avoir été légèrement édités pour l'orthographe, la grammaire, la longueur ou la clarté, ou traduits d'une autre langue, tout en préservant le sens voulu par le patient. Les patients prenant des médicaments prescrits ne doivent pas arrêter ou réduire leur médication sur la base de l'expérience d'un autre patient. Toute modification de traitement doit être faite uniquement sous supervision clinique appropriée.",
  },
  /**
   * Consent and privacy disclaimer for patient video testimonials. Kept apart
   * from `stories.disclaimer` on purpose: that one is about what results mean,
   * this one is about permission to publish a person at all. Rendered only on
   * the video testimonial page (/live-reviews).
   */
  "stories.consent.title": {
    en: "Patient Privacy & Consent",
    fr: "Confidentialité et consentement des patients",
  },
  "stories.consent.p1": {
    en: "Testimonials published on this page are shared with the patient's consent.",
    fr: "Les témoignages publiés sur cette page sont partagés avec le consentement du patient.",
  },
  "stories.consent.p2": {
    en: "Participation is entirely voluntary, and no patient is required to provide a testimonial.",
    fr: "La participation est entièrement volontaire et aucun patient n'est tenu de fournir un témoignage.",
  },
  "stories.consent.p3": {
    en: "Some patients choose to keep their experiences private, and S19 respects that decision.",
    fr: "Certains patients préfèrent garder leurs expériences privées et S19 respecte cette décision.",
  },
  "stories.consent.p4": {
    en: "S19 does not publish or share a patient's testimonial, photograph or video without appropriate consent.",
    fr: "S19 ne publie ni ne partage le témoignage, la photographie ou la vidéo d'un patient sans son consentement approprié.",
  },
  "liveReviews.cta.title": {
    en: "Would you rather read it first?",
    fr: "Vous préférez d'abord lire ?",
  },
  "liveReviews.cta.text": {
    en: "Every patient who agreed to share their experience is listed on the testimonials page, where there is room to say what the treatment was, how long it took and what changed.",
    fr: "Tous les patients qui ont accepté de partager leur expérience figurent sur la page des témoignages, où il y a la place de dire quel était le traitement, sa durée et ce qui a changé.",
  },
  "liveReviews.cta.button": { en: "Testimonials", fr: "Témoignages" },

  "stories.count": { en: "{count} story", fr: "{count} histoire" },
  "stories.countPlural": { en: "{count} stories", fr: "{count} histoires" },
  "stories.share.kicker": { en: "Share your experience", fr: "Partagez votre expérience" },
  "stories.share.title": { en: "Your story matters.", fr: "Votre histoire compte." },
  "stories.share.text": {
    en: "Treated by S19 or used our products? Tell others how it went - no account needed. Your review is checked by our clinic before it is published. By submitting a testimonial, you may be contacted by S19 to confirm your permission and how you would like your story, name, image or video to be displayed. Submission does not automatically mean the testimonial will be published.",
    fr: "Vous avez été traité(e) par S19 ou avez utilisé nos produits ? Dites aux autres comment cela s'est passé - aucun compte requis. Votre avis est vérifié par notre clinique avant publication. En soumettant un témoignage, vous pouvez être contacté(e) par S19 pour confirmer votre autorisation et la manière dont vous souhaitez que votre histoire, votre nom, votre image ou votre vidéo soient affichés. L'envoi ne signifie pas automatiquement que le témoignage sera publié.",
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
  "home.consultFee.title": { en: "Standard Consultation", fr: "Consultation standard" },
  "home.consultFee.note": {
    en: "The standard consultation fee is 5,000 FCFA. The same standard consultation fee applies for both online and in-person consultations.",
    fr: "Les frais de consultation standard sont de 5 000 FCFA. Les mêmes frais de consultation standard s'appliquent aux consultations en ligne et en personne.",
  },
  "home.booking.accommodation": {
    en: "Travelling to Bafoussam? Affordable on-site accommodation is available — with free Starlink internet & cable TV.",
    fr: "Vous voyagez vers Bafoussam ? Un hébergement abordable est disponible sur place — avec Internet Starlink gratuit & TV câblée.",
  },
  "home.booking.accommodationLink": {
    en: "See accommodation details",
    fr: "Voir les détails de l'hébergement",
  },

  // SECTION 11 - Final CTA + health information notice.
  "home.final.kicker": { en: "Start properly", fr: "Commencez correctement" },
  "home.final.title": { en: "Your Health Deserves More Than Guesswork", fr: "Votre santé mérite mieux que des approximations" },
  "home.final.lead": {
    en: "Whether you are living with a chronic condition, seeking complementary support during conventional treatment, or simply trying to better understand your health, your journey should begin with proper assessment.",
    fr: "Que vous viviez avec une maladie chronique, que vous recherchiez un soutien complémentaire pendant un traitement conventionnel, ou que vous cherchiez simplement à mieux comprendre votre santé, votre parcours devrait commencer par une évaluation appropriée.",
  },
  // The brief's large closing statement. Screen-reader-wise this is body copy
  // in the gold display face, not a second heading.
  "home.final.statement": {
    en: "Don't Treat Blindly. Investigate. Understand. Educate. Support. Monitor.",
    fr: "Ne pas traiter à l'aveugle. Examiner. Comprendre. Éduquer. Soutenir. Suivre.",
  },
  "home.final.book": { en: "Book Your Consultation", fr: "Réservez votre consultation" },
  "home.final.whatsapp": { en: "Talk to S19 on WhatsApp", fr: "Parlez à S19 sur WhatsApp" },
  // Footer health notice. Required to be visible and clear on the home page;
  // this is the notice, not a link to the Terms page.
  "home.final.noticeTitle": { en: "Health information notice", fr: "Avis d'information de santé" },
  "home.final.notice": {
    en: "S19 Herbal Clinic provides herbal, nutrition, lifestyle and supportive wellness services. Our services do not replace emergency care or medically necessary conventional treatment. Individual outcomes vary, and no treatment outcome or cure can be guaranteed. Patients taking prescription medicines or receiving specialist care should discuss complementary therapies with their healthcare professionals.",
    fr: "La Clinique de phytothérapie S19 fournit des services de phytothérapie, de nutrition, de mode de vie et de bien-être de soutien. Nos services ne remplacent ni les soins d'urgence ni un traitement conventionnel médicalement nécessaire. Les résultats varient d'une personne à l'autre, et aucun résultat de traitement ni guérison ne peut être garanti. Les patients prenant des médicaments prescrits ou recevant des soins spécialisés doivent discuter des thérapies complémentaires avec leurs professionnels de santé.",
  },

  // The home page's standalone Location block was removed: section 8 prints
  // CLINIC.address and CLINIC.hours, and the hero trust line already names
  // Bafoussam. These keys went with it. /location keeps its own `location.*`
  // copy and /contact still links there.

  "home.faq.kicker": { en: "Common questions", fr: "Questions fréquentes" },
  "home.faq.title": { en: "Frequently asked questions.", fr: "Questions fréquemment posées." },
  "home.faq.lead": {
    en: "Straight answers about consultations, delivery, payments, and how S19 remedies work.",
    fr: "Des réponses claires sur les consultations, la livraison, les paiements et le fonctionnement des remèdes S19.",
  },

  "cta.title": { en: "Start your consultation", fr: "Commencez votre consultation" },
  "cta.text": {
    en: "Your health journey is personal. Book a consultation to discuss your individual health concerns and determine the appropriate next step with S19.",
    fr: "Votre parcours de santé est personnel. Réservez une consultation pour discuter de vos préoccupations de santé individuelles et déterminer la prochaine étape appropriée avec S19.",
  },
  "cta.primary": { en: "Book a Consultation", fr: "Réserver une consultation" },
  "cta.secondary": { en: "WhatsApp: +237 672 595 989", fr: "WhatsApp : +237 672 595 989" },

  "footer.treatment": { en: "Treatment Focus", fr: "Domaines de traitement" },
  "footer.clinicContact": { en: "Clinic & Contact", fr: "Clinique & Contact" },
  "footer.explore": { en: "Explore", fr: "Explorer" },
  // Item 07 of the footer/navigation guide: one compact site-wide delivery line.
  // "Supported destinations" is deliberate - the guide forbids guaranteeing
  // worldwide delivery. Do not shorten this back to "worldwide delivery".
  "footer.deliveryHeading": { en: "Delivery", fr: "Livraison" },
  "footer.delivery": {
    en: "Nationwide Delivery Across Cameroon | International Shipping — USA, Canada, UK, UAE, Africa & Other Supported Destinations",
    fr: "Livraison nationale au Cameroun | Expédition internationale — USA, Canada, Royaume-Uni, Émirats arabes unis, Afrique et autres destinations prises en charge",
  },
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
  "footer.library": { en: "Health Library", fr: "Bibliothèque santé" },
  "footer.contactUs": { en: "Contact Us", fr: "Contactez-nous" },
  "footer.trackOrder": { en: "Track Your Order", fr: "Suivre votre commande" },
  // Legal link labels follow the footer/navigation guide, item 08. They were
  // "Terms of Service" and "Refund & Returns", which did not name the exchange
  // part of the returns policy the links point at.
  "footer.refundReturns": {
    en: "Refund, Return & Exchange Policy",
    fr: "Politique de remboursement, de retour et d'échange",
  },
  "footer.stories": { en: "Patient Stories", fr: "Histoires de patients" },
  "footer.privacy": { en: "Privacy Policy", fr: "Politique de confidentialité" },
  "footer.terms": { en: "Terms of Use", fr: "Conditions d'utilisation" },
  "footer.cookies": { en: "Cookie Policy", fr: "Politique de cookies" },
  "footer.diabetes": { en: "Diabetes & Metabolic Health", fr: "Diabète et santé métabolique" },
  "footer.hypertension": { en: "Hypertension & Heart Health", fr: "Hypertension et santé cardiaque" },
  "footer.prostate": { en: "Prostate & Men's Health", fr: "Prostate et santé masculine" },
  "footer.womens": { en: "Women's Reproductive Wellness", fr: "Bien-être reproductif féminin" },
  "footer.gastritis": { en: "Gastritis & Digestive Disorders", fr: "Gastrite et troubles digestifs" },
  "footer.cancer": { en: "Integrative Cancer Support", fr: "Soutien intégratif du cancer" },
  "footer.liveReviews": { en: "Live Reviews", fr: "Avis vidéo" },
  "footer.faq": { en: "Frequently Asked Questions", fr: "Questions fréquemment posées" },

  "refer.kicker": { en: "Kindness that heals", fr: "Une bonté qui guérit" },
  "refer.title": { en: "Refer a Loved One to S19", fr: "Parrainez un proche vers S19" },
  "refer.lead1": {
    en: "Do you know someone living with diabetes, high blood pressure, prostate or heart complications, cancer, or another long-term health condition?",
    fr: "Connaissez-vous quelqu'un qui vit avec le diabète, l'hypertension artérielle, des complications de la prostate ou du cœur, le cancer ou une autre maladie de longue durée ?",
  },
  // Item 16 of the Shop / Herbal Catalog guide asks for one small adjustment so the
  // referral does not read as if long-term conditions generally need something
  // "more than" symptom control. The guide's sentence keeps the referral and the warm
  // tone and puts appropriate medical care alongside S19's support instead of
  // against it.
  "refer.lead2": {
    en: "Please refer them to S19 Herbal Clinic. Alongside appropriate medical care, many people can benefit from proper evaluation, health education, lifestyle guidance and supportive care that considers the wider factors affecting their health and quality of life.",
    fr: "Veuillez les orienter vers la Clinique de phytothérapie S19. En complément des soins médicaux appropriés, de nombreuses personnes peuvent bénéficier d'une évaluation appropriée, d'une éducation à la santé, de conseils de mode de vie et de soins de soutien qui prennent en compte les facteurs plus larges affectant leur santé et leur qualité de vie.",
  },
  "refer.lead3": {
    en: "By referring a loved one, you are not only supporting S19; you may be helping someone access additional care, education, support and a healthier path forward. You are also contributing to a healthier community and doing a meaningful act of kindness before God.",
    fr: "En parrainant un proche, vous ne soutenez pas seulement S19 : vous pouvez aider quelqu'un à accéder à des soins supplémentaires, à l'éducation, au soutien et à une voie plus saine. Vous contribuez également à une communauté plus saine et vous accomplissez un acte de bonté significatif devant Dieu.",
  },
  "refer.lead4": {
    en: "A simple referral could make a real difference in someone's life.",
    fr: "Une simple recommandation peut faire une réelle différence dans la vie de quelqu'un.",
  },
  "refer.whatsapp": { en: "Refer via WhatsApp", fr: "Parrainer via WhatsApp" },
  "refer.book": { en: "Book a Consultation", fr: "Réserver une consultation" },

  "liveReviews.meta.title": { en: "Live Reviews", fr: "Avis vidéo" },
  "liveReviews.meta.description": {
    en: "Watch real patients share their healing journeys at S19 Herbal Clinic through live video reviews.",
    fr: "Regardez de vrais patients partager leur parcours de guérison à la Clinique de phytothérapie S19 à travers des avis vidéo.",
  },
  "liveReviews.hero.eyebrow": { en: "Patient Stories on Video", fr: "Témoignages de patients en vidéo" },
  "liveReviews.hero.title": { en: "Live Reviews", fr: "Avis vidéo" },
  "liveReviews.hero.lead": {
    en: "Real patients, real results. Watch our community share their health journeys in their own words.",
    fr: "De vrais patients, de vrais résultats. Regardez notre communauté partager son parcours de santé avec ses propres mots.",
  },
  "liveReviews.empty": {
    en: "New video reviews will appear here as they are added.",
    fr: "De nouveaux avis vidéo apparaîtront ici au fur et à mesure qu'ils seront ajoutés.",
  },

  "booking.title": { en: "Request received", fr: "Demande reçue" },
  "booking.thanks": {
    en: "Thank you, {name}. Our team will contact you shortly at {phone}. For an immediate response, connect with the clinic directly on WhatsApp.",
    fr: "Merci, {name}. Notre équipe vous contactera très vite au {phone}. Pour une réponse immédiate, contactez directement la clinique sur WhatsApp.",
  },
  // The success screen's WhatsApp button. Renamed from "Connect with Dr on
  // WhatsApp" alongside the submit button: the contact guide says a submission
  // must not imply the patient is immediately connected to the doctor, and this
  // label made that same promise one click later. It now continues the
  // conversation rather than claiming a handover.
  "booking.connectDr": { en: "Continue on WhatsApp", fr: "Continuer sur WhatsApp" },
  "booking.fullName": { en: "Full Name", fr: "Nom complet" },
  "booking.namePlaceholder": { en: "Your name", fr: "Votre nom" },
  "booking.phone": { en: "Phone / WhatsApp Number", fr: "Téléphone / Numéro WhatsApp" },
  // Item 04 of the Contact & Accommodation guide. Added after the phone field and
  // before email. The guide's DO NOT CHANGE forbids asking for a full residential
  // address here, so this is a single free-text "city / country" and nothing more.
  "booking.city": { en: "City / Country", fr: "Ville / Pays" },
  "booking.cityPlaceholder": {
    en: "Where are you contacting us from?",
    fr: "D'où vous contactez-nous ?",
  },
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
  // Item 05 of the Contact & Accommodation guide. The old label, "Submit & Connect
  // to Dr on WhatsApp", is exactly what the guide's DO NOT CHANGE forbids: it
  // implies the submission puts the patient in direct contact with the doctor.
  "booking.submit": {
    en: "Submit & Continue on WhatsApp",
    fr: "Envoyer et continuer sur WhatsApp",
  },
  "booking.sending": { en: "Sending...", fr: "Envoi..." },
  "booking.private": { en: "Your health details are kept strictly private and confidential.", fr: "Vos informations de santé restent strictement privées et confidentielles." },
  "booking.error": { en: "Something went wrong. Please try again or use WhatsApp.", fr: "Une erreur est survenue. Veuillez réessayer ou utiliser WhatsApp." },
  "concern.diabetes": { en: "Diabetes / Blood Sugar", fr: "Diabète / Glycémie" },
  "concern.hypertension": { en: "Hypertension / Cardiovascular", fr: "Hypertension / Cardiovasculaire" },
  "concern.prostate": { en: "Prostate / Men's Health", fr: "Prostate / Santé masculine" },
  "concern.women": { en: "Women's Health / Hormones", fr: "Santé féminine / Hormones" },
  "concern.gastritis": { en: "Gastritis / Digestion / Hemorrhoids", fr: "Gastrite / Digestion / Hémorroïdes" },
  // Label only. The stored value is this key, and past bookings are keyed on
  // it, so the key stays "liver" and "cancer" while the visible text follows
  // the programs page renames. "Detox" and "Care" both went against the
  // programs brief: one promised an effect, the other implied treating cancer.
  "concern.liver": { en: "Liver / Kidney Health", fr: "Santé du foie / des reins" },
  "concern.cancer": { en: "Integrative Cancer Support", fr: "Soutien intégratif du cancer" },
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
  "product.outOfStock": { en: "Out of stock", fr: "En rupture de stock" },
  "product.outOfStockNote": {
    en: "This product is currently out of stock. Order it on WhatsApp and we will let you know as soon as it is available again.",
    fr: "Ce produit est actuellement en rupture de stock. Commandez-le sur WhatsApp et nous vous informerons dès qu'il sera de nouveau disponible.",
  },
  "product.contactWhatsApp": { en: "Talk to S19 on WhatsApp", fr: "Parlez à S19 sur WhatsApp" },
  "product.contactWhatsAppInfo": {
    en: "Hello S19, I would like more information about the {name}.",
    fr: "Bonjour S19, je souhaite plus d'informations sur {name}.",
  },
  "product.orderMessage": {
    en: "Hello S19, I am interested in ordering the {name}.",
    fr: "Bonjour S19, je souhaite commander {name}.",
  },
  "product.notifyWhatsApp": { en: "Notify me on WhatsApp", fr: "Prévenez-moi sur WhatsApp" },
  "product.restockMessage": {
    en: "Hello S19, please let me know when the {name} is back in stock.",
    fr: "Bonjour S19, veuillez me prévenir lorsque {name} est de nouveau disponible.",
  },
  "notFound.title": { en: "Page not found", fr: "Page introuvable" },
  "notFound.text": {
    en: "The page you are looking for does not exist or has been moved.",
    fr: "La page que vous recherchez n'existe pas ou a été déplacée.",
  },

  "shop.hero.eyebrow": { en: "Standardized Formulas", fr: "Formules standardisées" },
  "shop.hero.title": { en: "S19 Herbal Product Catalog", fr: "Catalogue de produits S19" },
  "shop.meta.title": { en: "Herbal Product Catalog", fr: "Catalogue de produits" },
  // The delivery guide owns this string now. It previously ended "Pickup in
  // Bafoussam and worldwide delivery", which guide 1 flagged and left alone because
  // it had no authority over meta copy; the delivery guide does, so it is fixed here.
  "shop.meta.description": {
    en: "Browse the S19 Herbal Clinic standardized product catalog - treatment packs, herbal teas, extracts and oils, and wellness essentials. Pickup in Bafoussam, delivery across Cameroon and shipping to supported international destinations.",
    fr: "Parcourez le catalogue de produits standardisés de la clinique S19 - packs de traitement, tisanes, extraits et huiles, et essentiels de bien-être. Retrait à Bafoussam, livraison dans tout le Cameroun et expédition vers des destinations internationales prises en charge.",
  },
  // Item 10 of the footer/navigation guide. The old line ended "and worldwide
  // delivery", which the guide forbids.
  "shop.hero.lead": {
    en: "Carefully formulated botanical solutions. Available for pickup in Bafoussam, delivery across Cameroon, and shipping to supported international destinations.",
    fr: "Des solutions botaniques soigneusement formulées. Disponibles au retrait à Bafoussam, à la livraison dans tout le Cameroun et à l'expédition vers des destinations internationales prises en charge.",
  },
  // Item 15 of the Shop / Herbal Catalog guide. The delivery guide (item 03)
  // created this block for the shop page with its own wording; the shop guide is
  // the more specific authority for this page, so its exact sentences now stand.
  // They say the same thing — supported destinations, no worldwide promise, no
  // courier, no price, no customs fee and no delivery date — so nothing that was
  // already compliant is lost.
  "shop.delivery.kicker": { en: "Delivery", fr: "Livraison" },
  "shop.delivery.title": {
    en: "Delivery Across Cameroon & Internationally",
    fr: "Livraison au Cameroun et à l'international",
  },
  "shop.delivery.cameroonLabel": { en: "Within Cameroon", fr: "Au Cameroun" },
  "shop.delivery.cameroon": {
    en: "S19 products can be delivered to Bafoussam, Bamenda, Buea, Limbe, Bertoua, Kumba, Douala, Yaoundé and other cities across Cameroon.",
    fr: "Les produits S19 peuvent être livrés à Bafoussam, Bamenda, Buéa, Limbé, Bertoua, Kumba, Douala, Yaoundé et dans d'autres villes du Cameroun.",
  },
  "shop.delivery.internationalLabel": {
    en: "International",
    fr: "International",
  },
  "shop.delivery.international": {
    en: "S19 also ships to supported destinations, including the United States (USA), Canada, United Kingdom (UK), United Arab Emirates (UAE), selected countries across Africa and other supported international destinations.",
    fr: "S19 expédie également vers des destinations prises en charge, notamment les États-Unis (USA), le Canada, le Royaume-Uni (R-U), les Émirats arabes unis (ÉAU), certains pays d'Afrique et d'autres destinations internationales prises en charge.",
  },
  "shop.delivery.close": {
    en: "Contact S19 on WhatsApp to confirm shipping availability, delivery options and applicable charges for your destination.",
    fr: "Contactez S19 sur WhatsApp pour confirmer la disponibilité de l'expédition, les options de livraison et les frais applicables à votre destination.",
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
  "shop.alternativeOrder.kicker": { en: "No account? No problem.", fr: "Pas de compte ? Pas de problème." },
  "shop.alternativeOrder.title": { en: "Alternative Way to Order", fr: "Autre façon de commander" },
  "shop.alternativeOrder.text": {
    en: "If you prefer, you can screenshot the product(s) you want and send the images to us on WhatsApp or by email at info@s19herbalclinic.com.",
    fr: "Si vous préférez, vous pouvez faire une capture d'écran du ou des produits souhaités et nous envoyer les images sur WhatsApp ou par e-mail à info@s19herbalclinic.com.",
  },
  "shop.alternativeOrder.details": {
    en: "Please include your full name, phone number, delivery location, and the quantity you need. Our team will reply to confirm availability, price, payment, and delivery.",
    fr: "Veuillez indiquer votre nom complet, votre numéro de téléphone, votre lieu de livraison et la quantité souhaitée. Notre équipe répondra pour confirmer la disponibilité, le prix, le paiement et la livraison.",
  },
  // Item 14 of the Shop / Herbal Catalog guide: the existing screenshot workflow
  // is kept exactly as it was, and this closing sentence is added. It is the third
  // of the guide's three approved paragraphs and is what stops the screenshot route
  // reading as a promise that anything ships anywhere. Its DO NOT CHANGE forbids a
  // fixed international price, so the sentence points at S19 instead.
  "shop.alternativeOrder.international": {
    en: "For international orders, please contact S19 to confirm whether shipping is available to your destination and the applicable shipping charges.",
    fr: "Pour les commandes internationales, veuillez contacter S19 pour confirmer si l'expédition est disponible vers votre destination et quels sont les frais d'expédition applicables.",
  },
  "shop.alternativeOrder.whatsapp": { en: "Send a screenshot on WhatsApp", fr: "Envoyer une capture d'écran sur WhatsApp" },
  "shop.alternativeOrder.email": { en: "Email: info@s19herbalclinic.com", fr: "Email : info@s19herbalclinic.com" },
  "shop.contactPricing": { en: "Contact S19 for pricing", fr: "Contactez S19 pour le prix" },

  // Item 19 of the Shop / Herbal Catalog guide: one compact safety note, added once
  // near the bottom of the catalog rather than under every product card. It is the
  // page-level counterpart to the per-product limitations the guide writes into the
  // ten rewritten descriptions — a card summarises a product, this is the standing
  // caveat a shopper reads before choosing anything.
  "shop.safety.title": {
    en: "Important Health Information",
    fr: "Information importante sur la santé",
  },
  "shop.safety.text": {
    en: "S19 herbal products are intended to support individualized health and wellness care. Product suitability may vary according to your health condition, medications, pregnancy or breastfeeding status, allergies and other individual factors. Some health conditions require laboratory testing, medical diagnosis or conventional treatment. Do not delay urgent or medically necessary care because of an herbal product. If you are taking prescribed medication or receiving specialist treatment, discuss complementary herbal use with an appropriately qualified healthcare professional.",
    fr: "Les produits à base de plantes de S19 sont destinés à soutenir une prise en charge individualisée de la santé et du bien-être. L'adéquation du produit peut varier selon votre état de santé, vos médicaments, votre statut de grossesse ou d'allaitement, vos allergies et d'autres facteurs individuels. Certaines affections nécessitent des analyses de laboratoire, un diagnostic médical ou un traitement conventionnel. Ne retardez pas une prise en charge urgente ou médicalement nécessaire en raison d'un produit à base de plantes. Si vous prenez un traitement prescrit ou suivez un traitement spécialisé, parlez de l'usage complémentaire de plantes à un professionnel de santé qualifié.",
  },

  "addToCart.quantity": { en: "Quantity", fr: "Quantité" },
  "addToCart.label": { en: "Add to Cart", fr: "Ajouter au panier" },
  "addToCart.note": {
    en: "Prices in FCFA. Delivery and payment options are confirmed at checkout.",
    fr: "Prix en FCFA. Les options de livraison et de paiement sont confirmées lors du paiement.",
  },
  "aria.decreaseQty": { en: "Decrease quantity", fr: "Diminuer la quantité" },
  "aria.increaseQty": { en: "Increase quantity", fr: "Augmenter la quantité" },

"about.position.kicker": { en: "What we are about", fr: "Ce qui nous Defines" },
  "about.position.tagline": {
    en: "Science-Based Herbalism. Root-Cause Healthcare. Education. Investigation. Personalization. Monitoring.",
    fr: "Phytothérapie fondée sur la science. Soins de la cause racine. Éducation. Investigation. Personnalisation. Suivi.",
  },
  "about.position.statement": {
    en: "S19 Herbal Clinic combines science-based herbal medicine, laboratory investigation, nutrition, lifestyle medicine, patient education, continuous monitoring and clinic-based supportive therapies using specialized high-technology devices to provide personalized healthcare focused on identifying and addressing important contributing factors.",
    fr: "La Clinique S19 associe une phytothérapie fondée sur la science, l'investigation de laboratoire, la nutrition, la médecine du mode de vie, l'éducation du patient, un suivi continu et des thérapies de soutien en clinique utilisant des appareils spécialisés de haute technologie, afin d'offrir des soins personnalisés axés sur l'identification et le traitement de facteurs contributifs importants.",
  },
  "about.position.question": {
    en: "We do not simply ask: “What medicine treats this disease?” We ask: what is happening inside this person, what factors are contributing to it, what can be changed, and how can we measure whether those changes are working?",
    fr: "Nous ne posons pas simplement la question : « Quel médicament traite cette maladie ? » Nous posons la question : que se passe-t-il dans cette personne, quels facteurs y contribuent, qu'est-ce qui peut être modifié, et comment mesurer si ces changements sont efficaces ?",
  },
  "about.position.goal": {
    en: "The goal is not simply to manage disease. The goal is to build better health.",
    fr: "L'objectif n'est pas simplement de gérer la maladie. L'objectif est de construire une meilleure santé.",
  },
  "about.notAnti.title": {
    en: "S19 Is Not Anti-Conventional Medicine",
    fr: "S19 n'est pas contre la médecine conventionnelle",
  },
  "about.notAnti.goal": {
    en: "The goal is not to choose sides in medicine. It is to use the right intervention, for the right patient, at the right time.",
    fr: "L'objectif n'est pas de choisir un camp dans la médecine. Il est d'utiliser la bonne intervention, pour le bon patient, au bon moment.",
  },
  "about.gallery.kicker": { en: "Inside the clinic", fr: "Dans la clinique" },
  "about.gallery.title": { en: "The rooms where the work happens", fr: "Les pièces où le travail se fait" },
  "about.gallery.text": {
    en: "Care at S19 is not a prescription alone. It is a conversation, an investigation, and a plan you understand and take part in. These are the laboratory and consultation rooms where that takes place in Bafoussam.",
    fr: "Le suivi chez S19 ne repose pas sur une seule ordonnance. C'est une conversation, une investigation et un plan que vous comprenez et auquel vous participez. Voici les laboratoires et les salles de consultation où cela se passe à Bafoussam.",
  },
  "terms.hero.alt": {
    en: "An S19 Herbal Clinic laboratory technician in protective equipment working with glass beakers of herbal preparation in Bafoussam",
    fr: "Une technicienne du laboratoire de la Clinique S19, en équipement de protection, travaillant avec des béchers de préparation à base de plantes à Bafoussam",
  },
  "privacy.hero.alt": {
    en: "An S19 Herbal Clinic staff member recording a patient's health history in a medical booklet at the clinic office in Bafoussam",
    fr: "Un membre du personnel de la Clinique S19 consignant les antécédents sanitaires d'un patient dans un carnet médical, au bureau de la clinique à Bafoussam",
  },
  "cookies.hero.alt": {
    en: "Shelves of S19 Herbal Clinic herbal products, medicinal teas and supplements in the Bafoussam clinic dispensary",
    fr: "Rayonnages de produits à base de plantes, de tisanes médicinales et de compléments de la Clinique S19 dans la dispensaire de Bafoussam",
  },
  "refund.hero.alt": {
    en: "Shelves of S19 Herbal Clinic herbal products, medicinal teas and supplements in the Bafoussam clinic dispensary",
    fr: "Rayonnages de produits à base de plantes, de tisanes médicinales et de compléments de la Clinique S19 dans la dispensaire de Bafoussam",
  },
  "track.hero.alt": {
    en: "The S19 Herbal Clinic product counter in Bafoussam, with herbal remedies and health products displayed in the cupboards behind it",
    fr: "Le comptoir produits de la Clinique S19 à Bafoussam, avec des remèdes à base de plantes et des produits de santé présentés dans les placards derrière",
  },
  "dash.treatment.onDate": { en: " · on {date}", fr: " · le {date}" },

  "about.meta.title": {
    en: "About S19 Herbal Clinic – Root-Cause Herbal Medicine in Bafoussam",
    fr: "À propos de la Clinique S19 – Médecine par les plantes à Bafoussam",
  },
  "about.meta.description": {
    en: "How S19 Herbal Clinic in Bafoussam, Cameroon combines African medicinal plants with science-based herbalism, lab testing, nutrition and lifestyle medicine.",
    fr: "Comment la Clinique S19 à Bafoussam, Cameroun, combine les plantes médicinales africaines avec une phytothérapie fondée sur la science, les analyses de laboratoire, la nutrition et la médecine du mode de vie.",
  },
  "about.hero.eyebrow": { en: "Our Approach", fr: "Notre approche" },
  "about.hero.alt": {
    en: "Fresh botanical herbs used at S19 Herbal Clinic",
    fr: "Plantes botaniques fraîches utilisées à la clinique S19",
  },
  "about.hero.title": {
    en: "Science-Based Herbalism. Root-Cause Healthcare. Education. Investigation. Personalization. Monitoring.",
    fr: "Phytothérapie fondée sur la science. Soins de la cause racine. Éducation. Investigation. Personnalisation. Suivi.",
  },
  "about.hero.lead": {
    en: "{brand} is an integrative herbal and wellness clinic based in Bafoussam, Cameroon. We combine evidence-informed herbal medicine with individualized assessment, nutrition, lifestyle support, health education and continuous monitoring. Our approach is built around one simple principle: Do Not Treat Blindly. Before developing a personalized care plan, we seek to understand the patient, their health history, current and previous treatments, medications, available medical records and individual needs. Where appropriate, additional laboratory tests, imaging or other medical investigations may be requested to guide care.",
    fr: "La {brand} est une clinique de bien-être à base de plantes et intégrative basée à Bafoussam, Cameroun. Nous combinons une phytothérapie fondée sur des preuves avec une évaluation individualisée, la nutrition, le soutien au mode de vie, l'éducation à la santé et un suivi continu. Notre approche repose sur un principe simple : Ne pas traiter à l'aveugle. Avant d'élaborer un plan de soins personnalisé, nous cherchons à comprendre le patient, son historique de santé, ses traitements actuels et antérieurs, ses médicaments, ses dossiers médicaux disponibles et ses besoins individuels. Le cas échéant, des analyses de laboratoire, des examens d'imagerie ou d'autres investigations médicales peuvent être demandés pour guider les soins.",
  },
  "about.phil.kicker": { en: "Our Philosophy", fr: "Notre Philosophie" },
  "about.phil.p1": {
    en: "Symptoms matter, but they do not always tell the whole story. At S19, we look beyond the immediate complaint and consider relevant physiological, metabolic, nutritional, lifestyle and other contributing factors according to the individual patient.",
    fr: "Les symptômes sont importants, mais ils ne racontent pas toujours toute l'histoire. Chez S19, nous allons au-delà de la plainte immédiate et considérons les facteurs physiologiques, métaboliques, nutritionnels, liés au mode de vie et autres facteurs contributifs pertinents selon chaque patient.",
  },
  "about.phil.p2": {
    en: "Our goal is not to apply the same treatment to every person with the same diagnosis. We aim to understand the patient first, then personalize care accordingly.",
    fr: "Notre objectif n'est pas d'appliquer le même traitement à chaque personne ayant le même diagnostic. Nous cherchons d'abord à comprendre le patient, puis à personnaliser les soins en conséquence.",
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
    en: "This applies across chronic and metabolic diseases. At S19, care begins with understanding the individual—not simply the symptoms. Through consultation, investigation, patient education, personalized support and continuous monitoring, we work to identify and address relevant underlying and modifiable factors while tracking progress over time.",
    fr: "Cela s'applique à toutes les maladies chroniques et métaboliques. Chez S19, la prise en charge commence par la compréhension de la personne, et pas seulement des symptômes. Par la consultation, l'investigation, l'éducation du patient, un soutien personnalisé et un suivi continu, nous cherchons à identifier et à traiter les facteurs sous-jacents et modifiables pertinents, tout en suivant les progrès dans le temps.",
  },

  "about.blind.title": { en: "Do Not Treat Blindly", fr: "Ne pas traiter à l'aveugle" },
  "about.blind.text": {
    en: "Whenever appropriate, we encourage objective assessment before designing a health program. Treatment should be guided by information - not guesswork. These findings help us understand what may be happening physiologically and establish measurable baselines.",
    fr: "Chaque fois que cela est approprié, nous encourageons une évaluation objective avant de concevoir un programme de santé. Le traitement doit être guidé par l'information - pas par le hasard. Ces résultats nous aident à comprendre ce qui peut se passer physiologiquement et à établir des références mesurables.",
  },
  "about.science.title": { en: "Science-based herbalism", fr: "Phytothérapie fondée sur la science" },
  "about.science.text": {
    en: "We respect the long history of medicinal plants, but we do not believe that “natural” automatically means effective or safe. Herbs contain biologically active compounds, so we evaluate pharmacology, dosing, interactions, contraindications and the available scientific evidence before anything is prescribed.",
    fr: "Nous respectons la longue histoire des plantes médicinales, mais nous ne croyons pas que « naturel » signifie automatiquement efficace ou sûr. Les plantes contiennent des composés biologiquement actifs ; nous évaluons donc la pharmacologie, les doses, les interactions, les contre-indications et les preuves scientifiques disponibles avant toute prescription.",
  },
  "about.sciencebased.kicker": { en: "Science-Based Herbalism", fr: "Phytothérapie fondée sur la science" },
  "about.sciencebased.title": { en: "What Science-Based Herbalism Means", fr: "Ce que signifie la phytothérapie fondée sur la science" },
  "about.sciencebased.p1": {
    en: "Herbal medicine is biologically active. Natural does not automatically mean safe, appropriate or effective for every person.",
    fr: "La phytothérapie est biologiquement active. Le fait qu'un produit soit naturel ne signifie pas automatiquement qu'il est sûr, approprié ou efficace pour chaque personne.",
  },
  "about.sciencebased.p2": {
    en: "Responsible herbal care requires consideration of available scientific evidence, traditional knowledge, pharmacology, phytochemistry, dosage, contraindications, toxicity, potential herb-drug interactions and the individual patient's health situation. At S19, herbs are selected and used within a broader clinical context rather than simply matched to symptoms.",
    fr: "Une phytothérapie responsable exige de prendre en compte les données scientifiques disponibles, les connaissances traditionnelles, la pharmacologie, la phytochimie, les posologies, les contre-indications, la toxicité, les interactions potentielles entre plantes et médicaments, ainsi que la situation de santé individuelle du patient. Chez S19, les plantes sont sélectionnées et utilisées dans un contexte clinique plus large, plutôt que simplement en fonction des symptômes.",
  },
  "about.pillars.kicker": { en: "Holistic Care", fr: "Soins holistiques" },
  "about.pillars.title": { en: "More Than Herbal Products", fr: "Plus que des produits à base de plantes" },
  "about.education.kicker": { en: "Education Before Intervention", fr: "L'éducation avant l'intervention" },
  "about.education.text": {
    en: "We believe patients should understand what is happening in their health, what may be contributing to their condition, what the care plan is trying to achieve, what lifestyle or nutritional changes may matter and what needs to be monitored. A patient who understands the plan is better positioned to participate actively and consistently in their care.",
    fr: "Nous croyons que les patients doivent comprendre ce qui se passe dans leur santé, ce qui peut contribuer à leur état, ce que le plan de soins cherche à atteindre, quels changements de mode de vie ou nutritionnels peuvent importer et ce qui doit être surveillé. Un patient qui comprend le plan est mieux positionné pour participer activement et de manière cohérente à ses soins.",
  },
  "about.notAnti.text": {
    en: "We believe good healthcare is not a competition between natural and conventional medicine. Pharmaceutical drugs, surgery, emergency medicine, hospitalization and specialist care can be essential and lifesaving. Likewise, nutrition, lifestyle, patient education and appropriately used herbal medicine may have important supportive roles. Our responsibility is to understand the patient and determine where S19 can appropriately contribute - and when conventional investigation, treatment or referral is necessary. Herbal and lifestyle support should never delay or replace medically necessary conventional care.",
    fr: "Nous croyons que de bons soins de santé ne sont pas une compétition entre la médecine naturelle et conventionnelle. Les médicaments, la chirurgie, la médecine d'urgence, l'hospitalisation et les soins spécialisés peuvent être essentiels et vitaux. De même, la nutrition, le mode de vie, l'éducation du patient et la phytothérapie utilisée de manière appropriée peuvent avoir des rôles de soutien importants. Notre responsabilité est de comprendre le patient et de déterminer où S19 peut contribuer de manière appropriée - et quand une investigation, un traitement ou une référence conventionnelle est nécessaire. Le soutien à base de plantes et le soutien au mode de vie ne doivent jamais retarder ou remplacer les soins conventionnels médicalement nécessaires.",
  },
  "about.metabolic.kicker": { en: "Chronic & metabolic health", fr: "Santé chronique & métabolique" },
  "about.metabolic.title": { en: "More than symptom control.", fr: "Plus qu'un simple contrôle des symptômes." },
  "about.metabolic.p1": {
    en: "Chronic and metabolic diseases develop over years and involve multiple interacting factors. {diabetesIntro}",
    fr: "Les maladies chroniques et métaboliques se développent sur des années et impliquent de multiples facteurs qui interagissent. {diabetesIntro}",
  },
  "about.metabolic.diabetesTitle": { en: "Our approach to Type 2 diabetes", fr: "Notre approche du diabète de type 2" },
  "about.measure.title": { en: "Measurement Matters", fr: "La mesure compte" },
  "about.measure.text": {
    en: "Feeling better matters - but where appropriate, we also look for objective evidence of progress. Relevant health measurements, laboratory findings, medical reports, imaging or other investigations may be reviewed or repeated to help assess response and guide adjustments to care.",
    fr: "Se sentir mieux est important - mais le cas échéant, nous cherchons également des preuves objectives de progrès. Des mesures de santé pertinentes, des résultats de laboratoire, des rapports médicaux, des examens d'imagerie ou d'autres investigations peuvent être examinés ou répétés pour aider à évaluer la réponse et guider les ajustements des soins.",
  },
  "about.personalized.title": { en: "Personalized Care Requires Patient Participation", fr: "Des soins personnalisés nécessitent la participation du patient" },
  "about.personalized.text": {
    en: "Two people can have the same diagnosis and still have very different health histories, medications, nutritional patterns, lifestyle factors and treatment needs. For that reason, S19 does not rely on a one-size-fits-all approach. Patient participation is also essential. Following agreed nutrition and lifestyle guidance, taking treatment as directed, providing requested updates and attending follow-up all contribute to better continuity of care.",
    fr: "Deux personnes peuvent avoir le même diagnostic tout en ayant des antécédents médicaux, des médicaments, des habitudes nutritionnelles, des facteurs de mode de vie et des besoins de traitement très différents. Pour cette raison, S19 ne s'appuie pas sur une approche unique. La participation du patient est également essentielle. Suivre les conseils nutritionnels et de mode de vie convenus, prendre le traitement tel que prescrit, fournir les mises à jour demandées et assister au suivi contribuent tous à une meilleure continuité des soins.",
  },
  "about.participation.title": { en: "Patient Participation", fr: "Participation du patient" },
  "about.participation.text": {
    en: "The patient is not a passive recipient of medicine; the patient becomes part of the treatment process.",
    fr: "Le patient n'est pas un simple receveur passif de médicaments ; le patient devient partie intégrante du processus de traitement.",
  },
  "about.monitoring.title": { en: "Care Does Not End When Treatment Is Dispensed", fr: "Les soins ne s'arrêtent pas lorsque le traitement est dispensé" },
  "about.monitoring.text": {
    en: "Follow-up is an important part of the S19 approach. Depending on the patient's condition, progress may be evaluated through symptoms, relevant health measurements, medical reports and appropriate investigations. Treatment plans may then be reviewed or adjusted according to the patient's progress.",
    fr: "Le suivi est une partie importante de l'approche S19. Selon l'état du patient, les progrès peuvent être évalués par les symptômes, les mesures de santé pertinentes, les rapports médicaux et les investigations appropriées. Les plans de traitement peuvent ensuite être examinés et ajustés en fonction des progrès du patient.",
  },
  "about.different.kicker": { en: "Our Difference", fr: "Notre Différence" },
  "about.different.title": { en: "What Makes S19 Different", fr: "Ce qui rend S19 différent" },
  "about.journey.kicker": { en: "How we approach care", fr: "Comment nous approchons les soins" },
  "about.journey.title": { en: "The S19 Care Approach", fr: "L'approche de soins S19" },
  "about.journey.text": {
    en: "CONSULT → INVESTIGATE → UNDERSTAND → EDUCATE → ADDRESS & SUPPORT → MONITOR",
    fr: "CONSULTER → ENQUÊTER → COMPRENDRE → ÉDUQUER → TRAITER ET SOUTENIR → SUIVRE",
  },
  "about.beyond.kicker": { en: "Beyond the journey", fr: "Au-delà du parcours" },
  "about.beyond.title": { en: "Care that goes further.", fr: "Des soins qui vont plus loin." },
  "about.beyond.text": {
    en: "Beyond the pathway, these services run through everything S19 does - so they are never hidden inside the journey cards.",
    fr: "Au-delà du parcours, ces services traversent tout ce que fait S19 - ils ne sont donc jamais cachés dans les cartes du parcours.",
  },
  "about.central.kicker": { en: "S19 in 30 seconds", fr: "S19 en 30 secondes" },
  "about.central.text": {
    en: "We do not simply ask: “What medicine treats this disease?” We ask: what is happening inside this person, what factors are contributing to it, what can be changed, and how can we measure whether those changes are working?",
    fr: "Nous ne posons pas simplement la question : « Quel médicament traite cette maladie ? » Nous posons la question : que se passe-t-il dans cette personne, quels facteurs y contribuent, qu'est-ce qui peut être modifié, et comment mesurer si ces changements sont efficaces ?",
  },
  "about.cta.title": {
    en: "Start With Proper Assessment",
    fr: "Commencez par une évaluation appropriée",
  },
  "about.cta.text": {
    en: "If you are seeking personalized herbal and wellness support, the first step is not choosing a product - it is understanding your health situation. Book a consultation or talk to S19 on WhatsApp. Do Not Treat Blindly. Investigate. Understand. Personalize. Monitor.",
    fr: "Si vous recherchez un soutien personnalisé à base de plantes et de bien-être, la première étape n'est pas de choisir un produit - c'est de comprendre votre situation de santé. Réservez une consultation ou parlez à S19 sur WhatsApp. Ne traitez pas à l'aveugle. Enquêter. Comprendre. Personnaliser. Suivre.",
  },

  "programs.meta.title": {
    en: "Herbal Treatment Programs in Bafoussam",
    fr: "Programmes de traitement à base de plantes à Bafoussam",
  },
  "programs.meta.description": {
    en: "Individualized herbal treatment programs in Bafoussam, Cameroon: diabetes, hypertension, prostate and men's health, women's health and hormones, malaria and typhoid, and digestive health.",
    fr: "Programmes de traitement personnalisés à base de plantes à Bafoussam, Cameroun : diabète, hypertension, prostate et santé masculine, santé féminine et hormones, paludisme et typhoïde et santé digestive.",
  },
  "programs.hero.eyebrow": { en: "Clinical Care Focus", fr: "Focus des soins cliniques" },
  "programs.hero.title": { en: "Personalized Integrative Health Programs", fr: "Programmes de santé intégratifs personnalisés" },
  // Brief §2. Four statements in order, all supplied by the clinic.
  "programs.hero.p1": {
    en: "Every S19 care plan begins with an individualized assessment. We consider your health history, symptoms, current and previous treatments, medications, available medical records and individual needs before developing your plan.",
    fr: "Chaque plan de soins S19 commence par une évaluation individualisée. Nous considérons votre historique de santé, vos symptômes, vos traitements actuels et antérieurs, vos médicaments, les dossiers médicaux disponibles et vos besoins individuels avant d'élaborer votre plan.",
  },
  "programs.hero.p2": {
    en: "Where appropriate, relevant laboratory tests, imaging or other medical investigations may be requested to help us better understand your condition and guide care.",
    fr: "Le cas échéant, les analyses de laboratoire, l'imagerie ou d'autres examens médicaux pertinents peuvent être demandés afin de nous aider à mieux comprendre votre affection et à orienter les soins.",
  },
  "programs.hero.p3": {
    en: "Treatment duration, recommendations and cost are determined after consultation and evaluation.",
    fr: "La durée du traitement, les recommandations et le coût sont déterminés après la consultation et l'évaluation.",
  },
  "programs.hero.tagline": {
    en: "Do Not Treat Blindly. Investigate. Understand. Personalize. Monitor.",
    fr: "Ne pas traiter à l'aveugle. Examiner. Comprendre. Personnaliser. Suivre.",
  },
  "programs.hero.alt": {
    en: "Healthy green leaves representing herbal treatment programs",
    fr: "Feuilles vertes représentant les programmes de traitement à base de plantes",
  },
  "programs.kicker": { en: "Services", fr: "Services" },
  "programs.title": { en: "Services We Offer at S19 Herbal Clinic", fr: "Services offerts par S19 Herbal Clinic" },
  "programs.intro": {
    en: "Start with a consultation and we will build the right protocol around you.",
    fr: "Commencez par une consultation et nous construirons le bon protocole autour de vous.",
  },
  "programs.badge": { en: "Service", fr: "Service" },
  "programs.supports": { en: "Supports", fr: "Soutient" },
  "programs.inquire": { en: "Inquire via WhatsApp", fr: "S'informer via WhatsApp" },
  "programs.bookCta": { en: "Book a Consultation", fr: "Réserver une consultation" },
  // Brief §7. "Important" / "Safety" prefix is part of the label, so a reader
  // scanning the card sees the boundary before they read the detail.
  "programs.noteImportant": { en: "Important:", fr: "Important :" },
  "programs.noteSafety": { en: "Safety:", fr: "Sécurité :" },

  // Brief §3 - How S19 Programs Work.
  "programs.pathway.kicker": { en: "How our programs work", fr: "Comment fonctionnent nos programmes" },
  "programs.pathway.title": { en: "How S19 Programs Work", fr: "Comment fonctionnent les programmes S19" },
  "programs.pathway.lead": {
    en: "Your program is developed around you. Depending on your situation, care may involve review of medical information, additional investigations where necessary, individualized herbal support, nutrition and lifestyle guidance, health education, monitoring and follow-up.",
    fr: "Votre programme est élaboré autour de vous. Selon votre situation, les soins peuvent inclure la revue de vos informations médicales, des examens complémentaires si nécessaire, un soutien herbal individualisé, des conseils nutritionnels et de mode de vie, une éducation à la santé, un suivi et des contrôles.",
  },

  // Brief §5. Deliberately names no test, panel or sequence: those are
  // proprietary and must not be published. Opens on the statement itself -
  // there is no "we do not treat blindly" headline or lead-in above it.
  "programs.investigation.kicker": { en: "Investigations", fr: "Examens" },
  "programs.investigation.text": {
    en: "Depending on your health condition and individual situation, relevant laboratory tests, imaging or other medical investigations may be requested before or during your program. These investigations help us better understand your health, monitor progress and guide appropriate adjustments to your care plan.",
    fr: "Selon votre état de santé et votre situation individuelle, les analyses de laboratoire, l'imagerie ou d'autres examens médicaux pertinents peuvent être demandés avant ou pendant votre programme. Ces examens nous aident à mieux comprendre votre santé, à suivre les progrès et à orienter les ajustements appropriés de votre plan de soins.",
  },

  // Brief §6 - programs are clinical pathways, not retail bundles.
  "programs.notRetail.kicker": { en: "How we work", fr: "Notre façon de travailler" },
  "programs.notRetail.title": {
    en: "Personalized Programs, Not One-Size-Fits-All Products",
    fr: "Des programmes personnalisés, pas des produits universels",
  },
  "programs.notRetail.text": {
    en: "An S19 clinical program begins with consultation and assessment. Depending on the patient's needs, the plan may include individualized herbal support, clinic-based scientific therapies, nutrition and lifestyle guidance, health education, relevant investigations, monitoring and follow-up. Products or formulations are selected according to the individual care plan and are not necessarily the same for every patient with the same diagnosis.",
    fr: "Un programme clinique S19 commence par une consultation et une évaluation. Selon les besoins du patient, le plan peut inclure un soutien herbal individualisé, des thérapies scientifiques en clinique, des conseils nutritionnels et de mode de vie, une éducation à la santé, des examens pertinents, un suivi et des contrôles. Les produits ou formulations sont sélectionnés selon le plan de soins individuel et ne sont pas nécessairement les mêmes pour chaque patient présentant le même diagnostic.",
  },

  "programs.notSure.title": { en: "Not Sure Where to Start?", fr: "Vous ne savez pas par où commencer ?" },
  "programs.notSure.text": {
    en: "You do not need to choose your own treatment program. Book a consultation and tell us about your health concerns. We will review your situation and guide you toward the most appropriate next step. {brand} · {phone}",
    fr: "Vous n'avez pas besoin de choisir votre propre programme de traitement. Réservez une consultation et parlez-nous de vos préoccupations de santé. Nous examinerons votre situation et vous guiderons vers l'étape la plus appropriée. {brand} · {phone}",
  },
  "programs.notSure.closing": {
    en: "Do Not Treat Blindly. Start With Proper Assessment.",
    fr: "Ne pas traiter à l'aveugle. Commencer par une évaluation appropriée.",
  },
  "programs.notSure.whatsapp": { en: "Talk to S19 on WhatsApp", fr: "Parlez à S19 sur WhatsApp" },

  "programs.therapies.kicker": { en: "Supportive therapies", fr: "Thérapies de soutien" },
  "programs.therapies.alt": {
    en: "S19 therapist performing an in-clinic wellness therapy",
    fr: "Thérapeute S19 réalisant une thérapie de bien-être en clinique",
  },
  "programs.therapies.title": { en: "Supportive In-Clinic Therapies", fr: "Thérapies de soutien en clinique" },
  // Brief §7. "Complement - not replace -" is mandatory here: this is the one
  // place a reader might infer the therapies stand on their own.
  "programs.therapies.text": {
    en: "Beyond herbal medicine, S19 may incorporate selected in-clinic supportive therapies as part of an individualized care plan, including electromolecular medicine delivered with specialized high-technology devices. These therapies are used to complement - not replace - appropriate medical assessment, nutrition, lifestyle support and medically necessary conventional treatment.",
    fr: "Au-delà de la phytothérapie, S19 peut intégrer des thérapies de soutien en clinique sélectionnées dans le cadre d'un plan de soins individualisé, notamment la médecine électromoléculaire administrée au moyen d'appareils spécialisés de haute technologie. Ces thérapies servent à compléter - et non à remplacer - l'évaluation médicale appropriée, la nutrition, le soutien de mode de vie et le traitement conventionnel médicalement nécessaire.",
  },
  "programs.therapies.sessions": { en: "How sessions support your program", fr: "Comment les séances soutiennent votre programme" },
  "programs.therapies.item1": {
    en: "Using electromolecular medicine with specialized high-technology devices as part of our clinic-based supportive therapies to support the body's natural processes and promote overall physiological balance (healing).",
    fr: "Utilisation de la médecine électromoléculaire avec des appareils spécialisés de haute technologie dans le cadre de nos thérapies de soutien en clinique, afin de soutenir les processus naturels de l'organisme et de promouvoir un équilibre physiologique global (guérison).",
  },
  "programs.therapies.item2": {
    en: "Relaxation sessions complementing your herbal and nutrition protocol.",
    fr: "Des séances de relaxation complétant votre protocole à base de plantes et de nutrition.",
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
    en: "Book an appointment at our clinic or online. Our team will call or WhatsApp you to confirm.",
    fr: "Prenez rendez-vous dans notre clinique ou en ligne. Notre équipe vous appellera ou vous contactera par WhatsApp pour confirmer.",
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
  "contact.chatWhatsApp": { en: "Talk to S19 on WhatsApp", fr: "Parlez à S19 sur WhatsApp" },
  "contact.phoneLabel": { en: "Phone & WhatsApp", fr: "Téléphone & WhatsApp" },
  // Item 02 of the Contact & Accommodation guide, which supplies the exact line.
  // This replaced "Tele-Health emergency line 24/7" in guide 1, but with our own
  // wording rather than the guide's, so it is corrected here to the approved copy.
  // The guide's DO NOT CHANGE still applies: no "emergency line", no implied 24/7.
  "contact.phoneSub": {
    en: "For appointments, enquiries & Tele-Health support",
    fr: "Pour rendez-vous, demandes et soutien de Télé-santé",
  },
  "contact.emailLabel": { en: "Email", fr: "E-mail" },
  "contact.emailSub": { en: "We reply within 24 hours", fr: "Nous répondons sous 24 heures" },
  "contact.addressLabel": { en: "Clinic Address", fr: "Adresse de la clinique" },
  "contact.addressValue": { en: "Immeuble Cathédrale, 3rd Floor, Apartment E305", fr: "Immeuble Cathédrale, 3ᵉ étage, Appartement E305" },
  "contact.addressSub": { en: "Bafoussam, Cameroon", fr: "Bafoussam, Cameroun" },
  "contact.hoursLabel": { en: "Opening Hours", fr: "Heures d'ouverture" },
  "contact.hoursValue": { en: "Monday – Saturday: 8:00 AM – 6:00 PM", fr: "Lundi – Samedi : 8h00 – 18h00" },
  "contact.hoursSub": { en: "Tele-Health consultations available on request", fr: "Consultations Télé-santé disponibles sur demande" },

  "contact.accommodation.eyebrow": { en: "Patient accommodation", fr: "Hébergement des patients" },
  "contact.accommodation.title": {
    en: "Coming from outside Bafoussam?",
    fr: "Vous venez de l'extérieur de Bafoussam ?",
  },
  "contact.accommodation.text": {
    en: "Travelling from another town or region? S19 Herbal Clinic offers simple, comfortable and affordable accommodation within the clinic premises for patients who may need to stay during their visit, treatment or follow-up.",
    fr: "Vous voyagez depuis une autre ville ou région ? La Clinique S19 propose un hébergement simple, confortable et abordable au sein même de la clinique, pour les patients qui doivent rester pendant leur visite, leur traitement ou leur suivi.",
  },
  // Item 07 of the Contact & Accommodation guide. The guide requires this as a
  // single sentence stating both inclusions. It was previously only implied by the
  // two perk cards, which name the inclusions separately and never say that the
  // accommodation includes them.
  "contact.accommodation.includes": {
    en: "Accommodation includes free Starlink internet and cable TV.",
    fr: "L'hébergement comprend un internet Starlink gratuit et la télévision câblée.",
  },
  "contact.accommodation.perkRoom.title": {
    en: "Comfortable rooms on site",
    fr: "Chambres confortables sur place",
  },
  "contact.accommodation.perkRoom.text": {
    en: "Simple, comfortable and affordable rooms within the clinic premises.",
    fr: "Des chambres simples, confortables et abordables au sein de la clinique.",
  },
  "contact.accommodation.perkInternet.title": {
    en: "Free high-speed Starlink internet",
    fr: "Internet Starlink haut débit gratuit",
  },
  "contact.accommodation.perkInternet.text": {
    en: "Stay connected throughout your stay — at no extra cost.",
    fr: "Restez connecté pendant tout le séjour — sans frais supplémentaires.",
  },
  "contact.accommodation.perkTv.title": {
    en: "Cable TV during your stay",
    fr: "TV câblée pendant votre séjour",
  },
  "contact.accommodation.perkTv.text": {
    en: "Relax and unwind with cable TV in your room.",
    fr: "Détendez-vous avec la TV câblée dans votre chambre.",
  },
  // Item 07 of the Contact & Accommodation guide, which supplies the exact
  // sentence. Guide 1 item 12 first replaced an "ask when you book" line that read
  // as a room guarantee; the approved wording here says the same thing about
  // availability and adds that charges must be confirmed before travelling. The
  // guide forbids publishing an accommodation price, so no figure appears.
  "contact.accommodation.note": {
    en: "Room availability and accommodation charges should be confirmed before travelling.",
    fr: "La disponibilité des chambres et les frais d'hébergement doivent être confirmés avant le voyage.",
  },
  "contact.accommodation.bookingNote": {
    en: "Just let us know when booking your appointment if you will need a room.",
    fr: "Indiquez-nous simplement, lors de la réservation de votre rendez-vous, si vous aurez besoin d'une chambre.",
  },
  "contact.accommodation.cta": {
    en: "Ask about a room on WhatsApp",
    fr: "Demandez une chambre sur WhatsApp",
  },
  "contact.accommodation.tagline": {
    en: "Book before you travel. Come prepared. Stay connected. Stay conveniently close to your care.",
    fr: "Réservez avant de voyager. Venez préparé. Restez connecté. Restez commodément proche de vos soins.",
  },

  // Item 08 of the Contact & Accommodation guide: a new block after Accommodation
  // and before the footer, for patients who cannot travel to Bafoussam. It
  // complements the accommodation section; it does not replace it.
  //
  // The delivery wording here is the contact guide's own approved variant. It is
  // shorter than the Cameroon/International Delivery guide's version and names the
  // countries in short form ("USA, Canada, UK, UAE"). Both are S19-approved and
  // both say "supported destinations"; neither promises every country. The two
  // guides have not been reconciled into one string, because that would mean
  // choosing between two approved variants without being asked to.
  "contact.noTravel.eyebrow": {
    en: "Can't travel to Bafoussam?",
    fr: "Vous ne pouvez pas vous rendre à Bafoussam ?",
  },
  "contact.noTravel.title": {
    en: "Tele-Health & Product Delivery",
    fr: "Télé-santé & livraison de produits",
  },
  "contact.noTravel.text": {
    en: "You don't always need to travel to Bafoussam. S19 offers Tele-Health consultations and can arrange delivery of S19 products following your consultation and care recommendations.",
    fr: "Vous n'avez pas toujours besoin de vous rendre à Bafoussam. S19 propose des consultations de Télé-santé et peut organiser la livraison de produits S19 à la suite de votre consultation et des recommandations de vos soins.",
  },
  "contact.noTravel.cameroonLabel": { en: "Within Cameroon:", fr: "Au Cameroun :" },
  "contact.noTravel.cameroon": {
    en: "Delivery is available to Bafoussam, Bamenda, Buea, Limbe, Bertoua, Kumba, Douala, Yaoundé and other cities across Cameroon.",
    fr: "La livraison est disponible à Bafoussam, Bamenda, Buéa, Limbé, Bertoua, Kumba, Douala, Yaoundé et dans d'autres villes du Cameroun.",
  },
  "contact.noTravel.internationalLabel": { en: "International:", fr: "À l'international :" },
  "contact.noTravel.international": {
    en: "S19 also ships to supported destinations including the USA, Canada, UK, UAE, selected African countries and other international destinations.",
    fr: "S19 expédie également vers des destinations prises en charge, notamment les USA, le Canada, le Royaume-Uni, les Émirats arabes unis, certains pays africains et d'autres destinations internationales.",
  },
  "contact.noTravel.close": {
    en: "Contact S19 on WhatsApp to confirm consultation, delivery availability and applicable shipping charges for your location.",
    fr: "Contactez S19 sur WhatsApp pour confirmer la consultation, la disponibilité de la livraison et les frais d'expédition applicables à votre localisation.",
  },

  "location.meta.title": { en: "Bafoussam Clinic & Delivery", fr: "Clinique de Bafoussam & Livraison" },
  // "Nationwide and worldwide delivery available" was one of the surviving
  // "worldwide" claims guide 1 deferred. The delivery guide owns it.
  "location.meta.description": {
    en: "Visit the S19 Herbal Clinic at {address}. Delivery across Cameroon and to supported international destinations.",
    fr: "Visitez la clinique S19 à l'adresse {address}. Livraison dans tout le Cameroun et vers des destinations internationales prises en charge.",
  },
  "location.hero.eyebrow": { en: "Visit Our Physical Facility", fr: "Visitez nos installations physiques" },
  "location.hero.title": { en: "S19 Herbal Clinic, Bafoussam.", fr: "Clinique de phytothérapie S19, Bafoussam." },
  "location.hero.lead": {
    en: "In-house consultation, pharmacy pickup, and dispatch logistics - at the heart of Bafoussam, Cameroon. Our clinic-based supportive therapies use specialized high-technology devices alongside herbal medicine, nutrition and lifestyle care.",
    fr: "Consultation sur place, retrait en pharmacie et logistique d'expédition - au cœur de Bafoussam, Cameroun. Nos thérapies de soutien en clinique utilisent des appareils spécialisés de haute technologie, en complément de la phytothérapie, de la nutrition et des soins de mode de vie.",
  },
  "location.hero.alt": { en: "S19 Herbal Clinic location in Bafoussam, Cameroon", fr: "Emplacement de la clinique S19 à Bafoussam, Cameroun" },
  "location.info.address": { en: "Exact Physical Address", fr: "Adresse physique exacte" },
  "location.info.hours": { en: "Opening Hours", fr: "Heures d'ouverture" },
  "location.info.hoursLine2": { en: "In-house consultation & pharmacy pickup", fr: "Consultation sur place & retrait en pharmacie" },
  // Was "Tele-Health emergency line 24/7 via WhatsApp" - see contact.phoneSub.
  "location.info.hoursLine3": {
    en: "Tele-Health consultations by appointment",
    fr: "Consultations de Télé-santé sur rendez-vous",
  },
  "location.info.logistics": { en: "Dispatch / Logistics", fr: "Expédition / Logistique" },
  "location.info.logisticsLine1": {
    en: "Fast dispatch of prescribed herbal packs anywhere in Cameroon",
    fr: "Expédition rapide de packs de plantes prescrits partout au Cameroun",
  },
  // Was "Worldwide delivery via express courier - fees based on destination".
  // "Supported destinations" replaces "worldwide", and the courier is no longer
  // named in the headline line. No fee, customs charge or delivery time is stated.
  "location.info.logisticsLine2": {
    en: "Shipping to supported international destinations - fees based on destination",
    fr: "Expédition vers des destinations internationales prises en charge - frais selon la destination",
  },
  "location.info.logisticsLine3": { en: "Local clinic pickup available", fr: "Retrait local à la clinique disponible" },
  "location.mapTitle": { en: "S19 Herbal Clinic on Google Maps", fr: "Clinique S19 sur Google Maps" },
  "location.deliver.kicker": { en: "We deliver to", fr: "Nous livrons à" },
  "location.deliver.title": { en: "Shipping coverage", fr: "Zone de livraison" },
  "location.deliver.infoTitle": { en: "Delivery information", fr: "Informations de livraison" },
  // Was "...within Cameroon and worldwide." One of the surviving "worldwide" claims
  // from guide 1, now owned by the delivery guide.
  "location.deliver.infoText": {
    en: "S19 can arrange delivery of herbal products across Cameroon and to supported international destinations. Delivery fees are based on destination and transport/courier charges. Pickup can also be arranged where applicable.",
    fr: "S19 peut organiser la livraison de produits à base de plantes dans tout le Cameroun et vers des destinations internationales prises en charge. Les frais de livraison dépendent de la destination et des frais de transport/coursier. Le retrait peut également être organisé le cas échéant.",
  },
  "location.directions": { en: "Directions via WhatsApp", fr: "Itinéraire via WhatsApp" },
  "location.bookVisit": { en: "Book a visit", fr: "Réserver une visite" },
  "location.cta.title": { en: "Visit us in Bafoussam or consult remotely", fr: "Rendez-nous visite à Bafoussam ou consultez à distance" },
  "location.cta.text": {
    en: "In-clinic consultations, Tele-health, and herbal dispatch across Cameroon and to supported international destinations.",
    fr: "Consultations en clinique, Télé-santé, et expédition de plantes dans tout le Cameroun et vers des destinations internationales prises en charge.",
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

  "tele.meta.title": {
    en: "Herbal Telehealth Consultations Worldwide",
    fr: "Téléconsultations en phytothérapie dans le monde",
  },
  // Was "...and worldwide DHL shipping of your herbal program." The delivery guide
  // forbids promising every country and forbids naming a courier company, so this
  // now says "supported destinations" and names no carrier.
  "tele.meta.description": {
    en: "Virtual herbal medicine consultations with S19 Herbal Clinic in Bafoussam, Cameroon. Online assessment, personalized natural protocols and shipping of your herbal program to Cameroon and supported international destinations.",
    fr: "Consultations virtuelles de médecine naturelle avec la Clinique S19 à Bafoussam, Cameroun. Évaluation en ligne, protocoles naturels personnalisés et expédition de votre programme à base de plantes au Cameroun et vers des destinations internationales prises en charge.",
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
  "tele.price.title": { en: "Standard Consultation", fr: "Consultation standard" },
  "tele.price.text": {
    en: "The standard consultation fee is 5,000 FCFA. The same standard consultation fee applies for both online and in-person consultations.",
    fr: "Les frais de consultation standard sont de 5 000 FCFA. Les mêmes frais de consultation standard s'appliquent aux consultations en ligne et en personne.",
  },
  // The clinic sets 5,000 FCFA as the authoritative consultation price and requires
  // the foreign figures to be marked approximate. The values themselves come from
  // EXCHANGE in lib/utils.ts, so they follow the rate rather than going stale; this
  // line is the disclaimer the brief asks for.
  "tele.price.approx": {
    en: "Approximate equivalent - exchange rates may vary.",
    fr: "Équivalent approximatif - les taux de change peuvent varier.",
  },
  "tele.advantages.kicker": { en: "Why go virtual", fr: "Pourquoi consulter en ligne" },
  "tele.advantages.title": {
    en: "Advantages of an Online Consultation",
    fr: "Avantages d'une consultation en ligne",
  },
  "tele.advantages.lead": {
    en: "An online consultation allows you to speak with the S19 team from wherever you are, without needing to travel to the clinic.",
    fr: "Une consultation en ligne vous permet de parler avec l'équipe S19 où que vous soyez, sans avoir à vous déplacer à la clinique.",
  },
  "tele.adv1": {
    en: "Convenient access from home or from another city or country",
    fr: "Un accès pratique depuis chez vous, d'une autre ville ou d'un autre pays",
  },
  "tele.adv2": {
    en: "One-on-one consultation with the S19 Head Herbalist",
    fr: "Consultation individuelle avec le chef herboriste de S19",
  },
  "tele.adv3": {
    en: "Opportunity to discuss your symptoms, medical history, medications and health concerns",
    fr: "Possibilité de discuter de vos symptômes, antécédents médicaux, médicaments et préoccupations de santé",
  },
  "tele.adv4": {
    en: "Ability to send laboratory results, scans, prescriptions and previous medical records for review",
    fr: "Possibilité d'envoyer vos résultats de laboratoire, scanners, ordonnances et antécédents médicaux pour examen",
  },
  "tele.adv5": {
    en: "Guidance on herbal treatment, nutrition, lifestyle and daily health habits",
    fr: "Conseils sur le traitement à base de plantes, la nutrition, le mode de vie et les habitudes de santé quotidiennes",
  },
  "tele.adv6": {
    en: "Clear explanation of your recommended treatment plan and product instructions",
    fr: "Explication claire de votre plan de traitement recommandé et des instructions produit",
  },
  "tele.adv7": {
    en: "Opportunity to ask questions and receive direct clarification",
    fr: "Possibilité de poser des questions et d'obtenir des éclaircissements directs",
  },
  "tele.adv8": {
    en: "Useful for follow-up consultations and treatment progress reviews",
    fr: "Utile pour les consultations de suivi et l'examen des progrès du traitement",
  },
  "tele.adv9": {
    en: "Easier access for patients who are elderly, busy, traveling or unable to visit Bafoussam",
    fr: "Accès plus facile pour les patients âgés, occupés, en voyage ou dans l'incapacité de se rendre à Bafoussam",
  },
  "tele.adv10": {
    en: "Continued communication and support even when you live outside Cameroon",
    fr: "Communication et soutien continus même lorsque vous vivez hors du Cameroun",
  },
  "tele.adv11": {
    en: "Ability to discuss whether additional laboratory tests, scans or medical evaluation may be necessary before starting or adjusting a program",
    fr: "Possibilité de discuter de la nécessité de tests de laboratoire, scanners ou évaluations médicales supplémentaires avant de commencer ou d'ajuster un programme",
  },
  // Was "Products can be shipped to countries where DHL delivery service is
  // available". Two problems the delivery guide forbids: it named a courier
  // company, and it tied coverage to that courier's network rather than to S19's
  // supported destinations. The full detail is in the Product Delivery section.
  "tele.adv12": {
    en: "Products can be delivered across Cameroon and shipped to supported international destinations",
    fr: "Les produits peuvent être livrés dans tout le Cameroun et expédiés vers des destinations internationales prises en charge",
  },
  "tele.fee.title": { en: "Standard Consultation Fee", fr: "Frais de consultation standard" },
  "tele.options.kicker": { en: "Pick the right fit", fr: "Choisissez la bonne formule" },
  "tele.options.title": {
    en: "Which Option Should You Choose?",
    fr: "Quelle option devriez-vous choisir ?",
  },
  "tele.options.inPerson.title": { en: "In-person consultation", fr: "Consultation en personne" },
  "tele.options.inPerson.text": {
    en: "Choose an in-person consultation if you want direct physical assessment, blood-pressure and blood-sugar checks, and face-to-face interaction with the S19 team.",
    fr: "Choisissez une consultation en personne si vous souhaitez une évaluation physique directe, des contrôles de tension artérielle et de glycémie, et une interaction en face à face avec l'équipe S19.",
  },
  "tele.options.online.title": { en: "Online consultation", fr: "Consultation en ligne" },
  "tele.options.online.text": {
    en: "Choose an online consultation if traveling is difficult or you live outside Bafoussam or Cameroon and want to discuss your case remotely.",
    fr: "Choisissez une consultation en ligne si les déplacements sont difficiles ou si vous vivez hors de Bafoussam ou du Cameroun et souhaitez discuter de votre cas à distance.",
  },
  // Item 11 of the footer/navigation guide: the same Tele-Health safety principle
  // wherever remote consultation is promoted. This paragraph already sat in the
  // "in person or online" section but did not carry the not-an-emergency-service
  // limitation, which until now appeared only in the Terms.
  "tele.options.note": {
    en: "Tele-Health is not an emergency service. Some health situations may require physical examination, urgent medical care, specialist evaluation or other in-person assessment. Where necessary, the S19 team will advise you accordingly.",
    fr: "La Télé-santé n'est pas un service d'urgence. Certaines situations de santé peuvent nécessiter un examen physique, des soins urgents, une évaluation spécialisée ou toute autre évaluation en personne. Lorsque c'est nécessaire, l'équipe S19 vous le confirmera.",
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
  // The brief's one "change only where necessary" item. The old line claimed Tele-Health
  // reproduces a whole in-clinic visit, which cannot be true: no remote consultation
  // can perform the physical examination that `tele.options.inPerson.text` offers.
  "tele.modalities.text": {
    en: "Comprehensive S19 consultation and follow-up, wherever you are.",
    fr: "Consultation et suivi complets S19, où que vous soyez.",
  },
  "tele.modality1.title": { en: "Online Consultation", fr: "Consultation en ligne" },
  "tele.modality1.text": {
    en: "A structured call or WhatsApp session covering your symptoms, medical history, and lab results.",
    fr: "Un appel structuré ou une session WhatsApp couvrant vos symptômes, vos antécédents médicaux et vos résultats de laboratoire.",
  },
  "tele.modality2.title": { en: "Lab & Document Review", fr: "Analyse de laboratoire & de documents" },
  // The brief replaces only the phrase "detailed herbal strategy review" here, so
  // the rest of the sentence is untouched. Herbal support stays the point of the
  // programme; the records are read to understand the whole case.
  "tele.modality2.text": {
    en: "Send us your lab reports and previous treatment records for a detailed health and treatment-plan review.",
    fr: "Envoyez-nous vos rapports de laboratoire et vos dossiers de traitement antérieurs pour un examen détaillé de votre état de santé et de votre plan de traitement.",
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
  // Product delivery, Cameroon/International Delivery guide §04. Cameroon and
  // international are separated as the guide requires, and neither states a price,
  // a courier, a customs fee or a delivery time.
  "tele.delivery.kicker": { en: "Product delivery", fr: "Livraison de produits" },
  "tele.delivery.title": {
    en: "Delivery Across Cameroon & Internationally",
    fr: "Livraison au Cameroun et à l'international",
  },
  "tele.delivery.cameroonLabel": { en: "Within Cameroon", fr: "Au Cameroun" },
  "tele.delivery.cameroon": {
    en: "S19 products can be delivered to patients in Bafoussam, Bamenda, Buea, Limbe, Bertoua, Kumba, Douala, Yaoundé and other cities across Cameroon.",
    fr: "Les produits S19 peuvent être livrés aux patients à Bafoussam, Bamenda, Buéa, Limbé, Bertoua, Kumba, Douala, Yaoundé et dans d'autres villes du Cameroun.",
  },
  "tele.delivery.internationalLabel": { en: "International", fr: "International" },
  "tele.delivery.international": {
    en: "S19 also ships to supported international destinations, including the United States (USA), Canada, United Kingdom (UK), United Arab Emirates (UAE), selected countries across Africa and other supported international destinations. Contact S19 to confirm shipping availability and applicable charges for your location.",
    fr: "S19 expédie également vers des destinations internationales prises en charge, notamment les États-Unis (USA), le Canada, le Royaume-Uni (R-U), les Émirats arabes unis (ÉAU), certains pays en Afrique et d'autres destinations internationales prises en charge. Contactez S19 pour confirmer la disponibilité de l'expédition et les frais applicables à votre localisation.",
  },
  "tele.delivery.close": {
    en: "Contact S19 on WhatsApp to confirm shipping availability, delivery options and applicable charges for your destination.",
    fr: "Contactez S19 sur WhatsApp pour confirmer la disponibilité de l'expédition, les options de livraison et les frais applicables à votre destination.",
  },
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
  // The delivery guide forbids promising delivery to every country worldwide, and
  // this option was labelled exactly that. The stored enum value stays
  // "Worldwide Delivery" because it is persisted on existing orders in
  // lib/models/Order.ts; only the customer-facing label changes. "Express courier"
  // is replaced with the guide's "supported destinations" phrasing, and no
  // shipping price, customs fee or delivery time is stated.
  "checkout.mode3.title": {
    en: "International (Supported Destinations)",
    fr: "International (destinations prises en charge)",
  },
  "checkout.mode3.desc": {
    en: "Shipping to supported destinations outside Cameroon. Fee confirmed by our team after ordering.",
    fr: "Expédition vers les destinations prises en charge hors Cameroun. Frais confirmés par notre équipe après la commande.",
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
  "terms.section.telemedicine": { en: "Online Consultations (Telemedicine)", fr: "Consultations en ligne (télémédecine)" },
  "terms.section.appointments": { en: "Appointments & Reminders", fr: "Rendez-vous & rappels" },
  "terms.section.records": { en: "Medical Records & Prescriptions", fr: "Dossiers médicaux & ordonnances" },
  "terms.section.family": { en: "Family Accounts & Children", fr: "Comptes familiaux & enfants" },
  "terms.section.messages": { en: "Messaging & Communication", fr: "Messagerie & communication" },
  "terms.section.ids": { en: "ID Document Verification", fr: "Vérification des pièces d'identité" },
  "terms.section.governingLaw": { en: "Governing Law & Disputes", fr: "Droit applicable & litiges" },
  "terms.section.noGuarantee": { en: "No Guaranteed Results", fr: "Aucun résultat garanti" },
  "terms.section.changes": { en: "Changes to These Terms", fr: "Modifications de ces conditions" },
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
  "privacy.section.legalBasis": { en: "Legal Basis for Processing", fr: "Base légale du traitement" },
  "privacy.section.health": { en: "Health Information", fr: "Informations de santé" },
  "privacy.section.payments": { en: "Payments", fr: "Paiements" },
  "privacy.section.cookies": { en: "Cookies & Local Storage", fr: "Cookies & stockage local" },
  "privacy.section.rights": { en: "Your Rights", fr: "Vos droits" },
  "privacy.section.retention": { en: "Data Retention", fr: "Conservation des données" },
  "privacy.section.profile": { en: "Account & Profile Data", fr: "Données de compte & de profil" },
  "privacy.section.telemedicine": { en: "Telemedicine Video Sessions", fr: "Sessions vidéo de télémédecine" },
  "privacy.section.family": { en: "Family Members & Children", fr: "Membres de la famille & enfants" },
  "privacy.section.transfers": { en: "Hosting & Data Transfers", fr: "Hébergement & transferts de données" },
  "privacy.section.marketing": { en: "Marketing Communications", fr: "Communications marketing" },
  "privacy.section.breaches": { en: "Data Breach Notification", fr: "Notification de violation de données" },
  "privacy.section.controller": { en: "Data Controller & Contact", fr: "Responsable du traitement & contact" },
  "privacy.section.complaints": { en: "Complaints & Contact", fr: "Réclamations & contact" },
  "privacy.questions": {
    en: "Questions about privacy? Contact us at {email} or {phone}.",
    fr: "Des questions sur la confidentialité ? Contactez-nous à {email} ou au {phone}.",
  },
  "cookies.metaTitle": { en: "Cookie Policy", fr: "Politique de cookies" },
  "cookies.metaDescription": {
    en: "How S19 Herbal Clinic uses cookies and local storage on this website.",
    fr: "Comment la clinique S19 utilise les cookies et le stockage local sur ce site.",
  },
  "cookies.lead": { en: "Last updated: September 2026", fr: "Dernière mise à jour : septembre 2026" },
  "cookies.intro": {
    en: "This policy explains how {brand} uses cookies and similar local storage technologies so the website works reliably, keeps your data secure, and remembers your choices.",
    fr: "Cette politique explique comment la {brand} utilise les cookies et technologies de stockage local similaires pour que le site fonctionne de manière fiable, protège vos données et mémorise vos choix.",
  },
  "cookies.section1": { en: "1. Essential Cookies", fr: "1. Cookies essentiels" },
  "cookies.section2": { en: "2. Preference & Functionality", fr: "2. Préférences & fonctionnalités" },
  "cookies.section3": { en: "3. No Analytics or Advertising", fr: "3. Pas d'analyse ni de publicité" },
  "cookies.section4": { en: "4. Third-Party Services", fr: "4. Services tiers" },
  "cookies.section5": { en: "5. Managing Cookies", fr: "5. Gestion des cookies" },
  "cookies.section6": { en: "6. Contact", fr: "6. Contact" },
  "cookies.questions": {
    en: "Questions about cookies? Contact us at {email} or {phone}.",
    fr: "Des questions sur les cookies ? Contactez-nous à {email} ou au {phone}.",
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

  // Page chrome for /faq. The 22 questions and answers live in lib/data/faq.ts
  // because that is approved prose, not UI labels — see the note at the top of
  // that file.
  "faq.metaTitle": { en: "Frequently Asked Questions", fr: "Questions fréquemment posées" },
  "faq.metaDescription": {
    en: "Answers to common questions about S19 Herbal Clinic in Bafoussam, Cameroon: consultations, herbal support, safety, Tele-Health, international patients, accommodation, delivery and urgent care.",
    fr: "Réponses aux questions fréquentes sur la Clinique S19 à Bafoussam, Cameroun : consultations, soutien herbal, sécurité, Télé-santé, patients internationaux, hébergement, livraison et soins urgents.",
  },
  "faq.hero.eyebrow": { en: "Frequently Asked Questions", fr: "Questions fréquemment posées" },
  "faq.hero.title": { en: "Your Questions. Clear Answers.", fr: "Vos questions. Des réponses claires." },
  "faq.hero.lead": {
    en: "Choosing the right support for your health is an important decision. Here are answers to common questions about S19 Herbal Clinic, our approach, consultations, herbal support, Tele-Health and patient services.",
    fr: "Choisir le bon soutien pour votre santé est une décision importante. Voici des réponses aux questions fréquentes sur la Clinique S19, notre approche, les consultations, le soutien herbal, la Télé-santé et les services aux patients.",
  },
  "faq.hero.sub": {
    en: "Still have a question? Talk to S19 on WhatsApp or book a consultation.",
    fr: "Encore une question ? Parlez à S19 sur WhatsApp ou réservez une consultation.",
  },
  // Mid-page CTA, rendered after Question 14 as the guide requires.
  "faq.midCta.text": {
    en: "Not sure whether S19 is right for your condition? Start with a consultation. Tell us about your health concerns and let us review your situation before you decide on the next step.",
    fr: "Vous ne savez pas si S19 convient à votre état ? Commencez par une consultation. Dites-nous ce qui vous préoccupe et laissez-nous examiner votre situation avant que vous ne décidiez de la prochaine étape.",
  },
  // Final CTA, rendered after Question 22.
  "faq.finalCta.title": { en: "Still Have Questions?", fr: "Encore des questions ?" },
  "faq.finalCta.text": {
    en: "Every patient is different. If your question is specific to your diagnosis, medications, laboratory results or treatment history, the best next step is an individualized consultation.",
    fr: "Chaque patient est différent. Si votre question porte sur votre diagnostic, vos médicaments, vos résultats de laboratoire ou votre historique de traitement, la meilleure étape suivante est une consultation individualisée.",
  },
  "faq.finalCta.statement": {
    en: "Do Not Treat Blindly. Investigate. Understand. Personalize. Monitor.",
    fr: "Ne traitez pas à l'aveugle. Investiguez. Comprenez. Personnalisez. Surveillez.",
  },

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

  "library.meta.title": { en: "Health Education Library | S19 Herbal Clinic", fr: "Bibliothèque d'éducation santé | Clinique S19" },
  "library.meta.description": {
    en: "Trusted health education from S19 Herbal Clinic - articles and patient videos on diabetes, heart health, digestion, women's and men's health, detox and natural healing.",
    fr: "Des conseils santé fiables de la Clinique S19 - articles et vidéos sur le diabète, la santé du cœur, la digestion, la santé des femmes et des hommes, la détox et la guérison naturelle.",
  },
  "library.hero.eyebrow": { en: "Health Education Library", fr: "Bibliothèque d'éducation santé" },
  "library.hero.title": { en: "Understand Your Body, Heal Naturally", fr: "Comprendre son corps, guérir naturellement" },
  "library.hero.lead": {
    en: "Simple, science-based articles and real patient videos covering the conditions S19 treats every day - so you can make informed decisions for yourself and your family.",
    fr: "Des articles simples et fondés sur la science, ainsi que des vidéos de vrais patients, sur les pathologies que S19 traite chaque jour - pour décider en toute connaissance de cause pour vous et votre famille.",
  },
  "library.hero.alt": {
    en: "Healthy food and herbs arranged on a table at the S19 clinic",
    fr: "Aliments sains et plantes disposés sur une table à la clinique S19",
  },
  "library.topics.all": { en: "All topics", fr: "Tous les sujets" },
  "library.topics.diabetes": { en: "Diabetes & blood sugar", fr: "Diabète et glycémie" },
  "library.topics.heart": { en: "Heart & blood pressure", fr: "Cœur et tension" },
  "library.topics.digestion": { en: "Digestion & stomach", fr: "Digestion et estomac" },
  "library.topics.women": { en: "Women's health", fr: "Santé des femmes" },
  "library.topics.men": { en: "Men's & prostate", fr: "Santé des hommes et prostate" },
  "library.topics.detox": { en: "Detox & immunity", fr: "Détox et immunité" },
  "library.articles.title": { en: "Health Articles", fr: "Articles santé" },
  "library.articles.lead": {
    en: "Short, practical articles written by the S19 team.",
    fr: "Des articles courts et pratiques rédigés par l'équipe S19.",
  },
  "library.videos.title": { en: "In Their Own Words", fr: "Dans leurs propres mots" },
  "library.videos.lead": {
    en: "Real patients sharing their healing journeys on video.",
    fr: "De vrais patients qui partagent leur parcours de guérison en vidéo.",
  },
  "library.empty.articles": {
    en: "No articles for this topic yet. Check back soon or ask the clinic on WhatsApp.",
    fr: "Aucun article pour ce sujet pour l'instant. Revenez bientôt ou demandez à la clinique sur WhatsApp.",
  },
  "library.empty.videos": {
    en: "No videos for this topic yet. Browse all patient stories on the Live Reviews page.",
    fr: "Aucune vidéo pour ce sujet pour l'instant. Parcourez toutes les histoires de patients sur la page Témoignages vidéo.",
  },
  "library.readArticle": { en: "Read article", fr: "Lire l'article" },
  "library.watchAll": { en: "Watch all stories", fr: "Voir toutes les histoires" },
  "library.cta.title": {
    en: "Not sure where to start?",
    fr: "Vous ne savez pas par où commencer ?",
  },
  "library.cta.text": {
    en: "Book a consultation - in the clinic or by video call - and a qualified practitioner will guide you.",
    fr: "Réservez une consultation - à la clinique ou en visioconférence - et un praticien qualifié vous guidera.",
  },
  // Item 02: the health library's closing CTA button was the last clinical CTA on
  // the site still labelled without the article.
  "library.cta.button": { en: "Book a Consultation", fr: "Réserver une consultation" },

  // ── Account / auth screens (front-end only) ────────────────────────────
  "auth.checkingSession": { en: "Checking your session…", fr: "Vérification de votre session…" },
  "auth.login.title": { en: "Welcome back", fr: "Bon retour" },
  "auth.register.title": { en: "Create your account", fr: "Créer votre compte" },
  "auth.login.tab": { en: "Sign in", fr: "Se connecter" },
  "auth.register.tab": { en: "Create account", fr: "Créer un compte" },
  "auth.fullName": { en: "Full name", fr: "Nom complet" },
  "auth.fullNamePh": { en: "Your full name", fr: "Votre nom complet" },
  "auth.emailOrPhone": { en: "Email or phone", fr: "E-mail ou téléphone" },
  "auth.email": { en: "Email", fr: "E-mail" },
  "auth.emailPh": { en: "you@example.com", fr: "vous@exemple.com" },
  "auth.phone": { en: "Phone / WhatsApp (optional)", fr: "Téléphone / WhatsApp (facultatif)" },
  "auth.phonePh": { en: "+237 6xx xxx xxx", fr: "+237 6xx xxx xxx" },
  "auth.password": { en: "Password", fr: "Mot de passe" },
  "auth.passwordHint": { en: "At least 8 characters.", fr: "8 caractères minimum." },
  "auth.confirmPassword": { en: "Confirm password", fr: "Confirmez le mot de passe" },
  "auth.passwordsMismatch": {
    en: "Passwords do not match.",
    fr: "Les mots de passe ne correspondent pas.",
  },
  "auth.submitting": { en: "Please wait...", fr: "Veuillez patienter..." },
  "auth.submitSignIn": { en: "Sign in", fr: "Se connecter" },
  "auth.submitRegister": { en: "Create account", fr: "Créer un compte" },
  "auth.forgotPassword": { en: "Forgot your password?", fr: "Mot de passe oublié ?" },
  "auth.enterAccount": {
    en: "Enter your email or phone and password.",
    fr: "Saisissez votre e-mail ou téléphone et votre mot de passe.",
  },
  "auth.agreement": {
    en: "By creating an account you agree to the S19 privacy and terms policies. We will send a verification email - please check your inbox.",
    fr: "En créant un compte, vous acceptez les politiques de confidentialité et les conditions de S19. Nous vous enverrons un e-mail de vérification - veuillez vérifier votre boîte de réception.",
  },
  "auth.createdNotice": {
    en: "Your account was created. We sent a verification link to {email} - please check your inbox, verify your email, then sign in.",
    fr: "Votre compte a été créé. Un lien de vérification a été envoyé à {email} - veuillez vérifier votre boîte de réception, confirmer votre e-mail, puis vous connecter.",
  },

  "auth.recoveryEyebrow": { en: "Account recovery", fr: "Récupération de compte" },
  "auth.forgotTitle": { en: "Forgot your password?", fr: "Mot de passe oublié ?" },
  "auth.forgotLead": {
    en: "Enter the email for your account and we will send you a link to reset your password.",
    fr: "Saisissez l'e-mail de votre compte et nous vous enverrons un lien pour réinitialiser votre mot de passe.",
  },
  "auth.rememberPassword": { en: "Remember your password?", fr: "Vous vous souvenez de votre mot de passe ?" },
  "auth.forgotSent": {
    en: "If an account exists for {email}, a password reset link has been sent. Check your inbox (and spam folder).",
    fr: "Si un compte existe pour {email}, un lien de réinitialisation a été envoyé. Vérifiez votre boîte de réception (et vos courriers indésirables).",
  },
  "auth.sendResetLink": { en: "Send reset link", fr: "Envoyer le lien de réinitialisation" },
  "auth.sending": { en: "Sending...", fr: "Envoi en cours..." },

  "auth.resetTitle": { en: "Choose a new password", fr: "Choisissez un nouveau mot de passe" },
  "auth.resetLead": {
    en: "Your new password must be at least 8 characters long.",
    fr: "Votre nouveau mot de passe doit contenir au moins 8 caractères.",
  },
  "auth.newPassword": { en: "New password", fr: "Nouveau mot de passe" },
  "auth.confirmNewPassword": { en: "Confirm new password", fr: "Confirmez le nouveau mot de passe" },
  "auth.resetDone": {
    en: "Your password has been reset. You can now sign in with your new password.",
    fr: "Votre mot de passe a été réinitialisé. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.",
  },
  "auth.saving": { en: "Saving...", fr: "Enregistrement en cours..." },
  "auth.resetSubmit": { en: "Reset password", fr: "Réinitialiser le mot de passe" },
  "auth.invalidResetTitle": { en: "Invalid reset link", fr: "Lien de réinitialisation invalide" },
  "auth.invalidResetLead": {
    en: "This password reset link is missing or invalid. Request a new one below.",
    fr: "Ce lien de réinitialisation est manquant ou invalide. Demandez-en un nouveau ci-dessous.",
  },
  "auth.requestNewLink": { en: "Request a new reset link", fr: "Demander un nouveau lien de réinitialisation" },
  "auth.signIn": { en: "Sign in", fr: "Se connecter" },

  "auth.accountEyebrow": { en: "Account", fr: "Compte" },
  "auth.verifyingTitle": { en: "Verifying your email...", fr: "Vérification de votre e-mail..." },
  "auth.verifiedTitle": { en: "Email verified", fr: "E-mail vérifié" },
  "auth.verifiedLead": {
    en: "Your email address has been verified. You can now sign in to your account.",
    fr: "Votre adresse e-mail a été vérifiée. Vous pouvez maintenant vous connecter à votre compte.",
  },
  "auth.goToAccount": { en: "Go to your account", fr: "Accéder à mon compte" },
  "auth.verifyFailedTitle": { en: "Verification failed", fr: "Échec de la vérification" },
  "auth.verifyFailedLead": {
    en: "This verification link is invalid or has expired.",
    fr: "Ce lien de vérification est invalide ou a expiré.",
  },
  "auth.signInNewLink": { en: "Sign in to request a new link", fr: "Se connecter pour demander un nouveau lien" },
  "auth.alreadyVerified": { en: "Already verified?", fr: "Déjà vérifié ?" },

  "auth.metaForgotTitle": { en: "Forgot password | S19 Herbal Clinic", fr: "Mot de passe oublié | Clinique S19" },
  "auth.metaForgotDescription": {
    en: "Reset your S19 Herbal Clinic account password.",
    fr: "Réinitialisez le mot de passe de votre compte Clinique S19.",
  },
  "auth.metaResetTitle": { en: "Reset password | S19 Herbal Clinic", fr: "Réinitialiser le mot de passe | Clinique S19" },
  "auth.metaResetDescription": {
    en: "Choose a new password for your S19 Herbal Clinic account.",
    fr: "Choisissez un nouveau mot de passe pour votre compte Clinique S19.",
  },
  "auth.metaVerifyTitle": { en: "Verify email | S19 Herbal Clinic", fr: "Vérifier l'e-mail | Clinique S19" },
  "auth.metaVerifyDescription": {
    en: "Confirm your email address for your S19 Herbal Clinic account.",
    fr: "Confirmez votre adresse e-mail pour votre compte Clinique S19.",
  },

  /* ── Account dashboard (patient portal) ────────────────────────────────── */

  "dash.shell.nav.overview": { en: "Dashboard", fr: "Tableau de bord" },
  "dash.shell.nav.appointments": { en: "Appointments", fr: "Rendez-vous" },
  "dash.shell.nav.orders": { en: "Orders", fr: "Commandes" },
  "dash.shell.nav.messages": { en: "Messages", fr: "Messages" },
  "dash.shell.nav.records": { en: "Medical Records", fr: "Dossier médical" },
  "dash.shell.nav.prescriptions": { en: "Prescriptions", fr: "Prescriptions" },
  "dash.shell.nav.treatment": { en: "Treatment Plan", fr: "Plan de traitement" },
  "dash.shell.nav.family": { en: "Family", fr: "Famille" },
  "dash.shell.nav.testimonials": { en: "Your Stories", fr: "Vos témoignages" },
  "dash.shell.nav.settings": { en: "Settings", fr: "Paramètres" },
  "dash.shell.nav.adminProducts": { en: "Products", fr: "Produits" },
  "dash.shell.nav.adminServices": { en: "Services", fr: "Services" },
  "dash.shell.nav.adminDoctors": { en: "Staff", fr: "Équipe" },
  "dash.shell.nav.adminAppointments": { en: "Appointments", fr: "Rendez-vous" },
  "dash.shell.nav.adminRecords": { en: "Medical Records", fr: "Dossier médical" },
  "dash.shell.nav.adminPrescriptions": { en: "Prescriptions", fr: "Prescriptions" },
  "dash.shell.nav.adminTreatmentPlans": { en: "Treatment Plans", fr: "Plans de traitement" },
  "dash.shell.nav.adminTreatmentAlerts": { en: "Treatment Alerts", fr: "Alertes de traitement" },
  "dash.shell.nav.adminOrders": { en: "Orders", fr: "Commandes" },
  "dash.shell.nav.adminTestimonials": { en: "Testimonials", fr: "Témoignages" },
  "dash.shell.nav.adminMessaging": { en: "Users & Messages", fr: "Utilisateurs et messages" },
  "dash.shell.nav.adminPosts": { en: "Blog", fr: "Blog" },
  "dash.shell.nav.adminSubscribers": { en: "Subscribers", fr: "Abonnés" },
  "dash.shell.nav.adminVideos": { en: "Live Reviews", fr: "Avis vidéo" },
  "dash.shell.nav.adminUsers": { en: "Users", fr: "Utilisateurs" },
  "dash.shell.nav.adminRoles": { en: "Staff & Roles", fr: "Équipe et rôles" },
  "dash.shell.nav.adminBackups": { en: "Data Backups", fr: "Sauvegardes des données" },
  "dash.shell.nav.adminStorage": { en: "Storage", fr: "Stockage" },
  "dash.shell.nav.adminLogs": { en: "Error Log", fr: "Journal d'erreurs" },
  "dash.shell.nav.doctorAppointments": { en: "Appointments", fr: "Rendez-vous" },
  "dash.shell.nav.doctorRecords": { en: "Medical Records", fr: "Dossier médical" },
  "dash.shell.nav.doctorPrescriptions": { en: "Prescriptions", fr: "Prescriptions" },
  "dash.shell.nav.doctorTreatmentPlans": { en: "Treatment Plans", fr: "Plans de traitement" },
  "dash.shell.nav.doctorTreatmentAlerts": { en: "Treatment Alerts", fr: "Alertes de traitement" },
  "dash.shell.nav.doctorMessaging": { en: "Patients & Messages", fr: "Patients et messages" },

  "dash.shell.section.myAccount": { en: "My account", fr: "Mon compte" },
  "dash.shell.section.clinicAdmin": { en: "Clinic admin", fr: "Administration de la clinique" },
  "dash.shell.section.clinicalWork": { en: "Clinical work", fr: "Travail clinique" },

  "dash.shell.short.home": { en: "Home", fr: "Accueil" },
  "dash.shell.short.bookings": { en: "Bookings", fr: "Rendez-vous" },
  "dash.shell.short.orders": { en: "Orders", fr: "Commandes" },
  "dash.shell.short.inbox": { en: "Inbox", fr: "Boîte" },
  "dash.shell.short.records": { en: "Records", fr: "Dossiers" },
  "dash.shell.short.rx": { en: "Rx", fr: "Ordo" },
  "dash.shell.short.plan": { en: "Plan", fr: "Plan" },
  "dash.shell.short.alerts": { en: "Alerts", fr: "Alertes" },
  "dash.shell.short.family": { en: "Family", fr: "Famille" },
  "dash.shell.short.stories": { en: "Stories", fr: "Témoignages" },
  "dash.shell.short.settings": { en: "Settings", fr: "Paramètres" },

  "dash.shell.greeting.morning": { en: "Good morning", fr: "Bonjour" },
  "dash.shell.greeting.afternoon": { en: "Good afternoon", fr: "Bon après-midi" },
  "dash.shell.greeting.evening": { en: "Good evening", fr: "Bonsoir" },
  "dash.shell.welcome": { en: "Welcome", fr: "Bienvenue" },
  "dash.shell.badge.clinicAdmin": { en: "Clinic admin", fr: "Administrateur" },
  "dash.shell.badge.staff": { en: "Staff", fr: "Équipe" },
  "dash.shell.badge.verified": { en: "Verified", fr: "Vérifié" },
  "dash.shell.backToSite": { en: "Back to main site", fr: "Retour au site principal" },
  "dash.shell.signOut": { en: "Sign out", fr: "Se déconnecter" },
  "dash.shell.ariaMessages": { en: "Messages", fr: "Messages" },
  "dash.shell.ariaSettings": { en: "Account settings", fr: "Paramètres du compte" },

  "dash.shell.h.appointments.title": { en: "Appointments", fr: "Rendez-vous" },
  "dash.shell.h.appointments.sub": {
    en: "Book, reschedule or cancel consultations with the clinic",
    fr: "Réservez, reportez ou annulez vos consultations avec la clinique",
  },
  "dash.shell.h.orders.title": { en: "My Orders", fr: "Mes commandes" },
  "dash.shell.h.orders.sub": {
    en: "Order history, totals and tracking links",
    fr: "Historique des commandes, totaux et liens de suivi",
  },
  "dash.shell.h.orders.browse": { en: "Browse catalog", fr: "Parcourir le catalogue" },
  "dash.shell.h.messages.title": { en: "Messages", fr: "Messages" },
  "dash.shell.h.messages.sub": {
    en: "Updates and notes from the clinic",
    fr: "Mises à jour et notes de la clinique",
  },
  "dash.shell.h.records.title": { en: "Medical Records", fr: "Dossier médical" },
  "dash.shell.h.records.sub": {
    en: "Visits, diagnoses, lab results and scans - downloadable as PDF",
    fr: "Visites, diagnostics, résultats de laboratoire et examens - téléchargeables en PDF",
  },
  "dash.shell.h.prescriptions.title": { en: "Prescriptions", fr: "Prescriptions" },
  "dash.shell.h.prescriptions.sub": {
    en: "Your current and past treatment plans with dosage instructions",
    fr: "Vos plans de traitement actuels et passés avec instructions de dosage",
  },
  "dash.shell.h.treatment.title": { en: "Treatment Plan", fr: "Plan de traitement" },
  "dash.shell.h.treatment.sub": {
    en: "Your personalized treatment timeline - when it started, when it ends and its live status",
    fr: "Votre chronologie de traitement personnalisée - date de début, date de fin et statut en direct",
  },
  "dash.shell.h.family.title": { en: "Family", fr: "Famille" },
  "dash.shell.h.family.sub": {
    en: "Manage profiles for your children and loved ones",
    fr: "Gérez les profils de vos enfants et de vos proches",
  },
  "dash.shell.h.testimonials.title": { en: "Your Stories", fr: "Vos témoignages" },
  "dash.shell.h.testimonials.sub": {
    en: "Testimonies you have shared with the S19 community",
    fr: "Les témoignages que vous avez partagés avec la communauté S19",
  },
  "dash.shell.h.settings.title": { en: "Account Settings", fr: "Paramètres du compte" },
  "dash.shell.h.settings.sub": {
    en: "Profile details, photo, password and sign-out",
    fr: "Coordonnées du profil, photo, mot de passe et déconnexion",
  },
  "dash.shell.h.adminDoctors.title": { en: "Staff", fr: "Équipe" },
  "dash.shell.h.adminDoctors.sub": {
    en: "Manage staff members and their weekly availability",
    fr: "Gérez les membres de l'équipe et leur disponibilité hebdomadaire",
  },
  "dash.shell.h.adminAppointments.title": { en: "Appointments", fr: "Rendez-vous" },
  "dash.shell.h.adminAppointments.sub": {
    en: "Confirm, complete or cancel patient bookings",
    fr: "Confirmez, terminez ou annulez les réservations des patients",
  },
  "dash.shell.h.adminRecords.title": { en: "Medical Records", fr: "Dossier médical" },
  "dash.shell.h.adminRecords.sub": {
    en: "Log visits, diagnoses, lab results and scans",
    fr: "Consignez visites, diagnostics, résultats de laboratoire et examens",
  },
  "dash.shell.h.adminPrescriptions.title": { en: "Prescriptions", fr: "Prescriptions" },
  "dash.shell.h.adminPrescriptions.sub": {
    en: "Issue treatment plans with dosage instructions",
    fr: "Émettez des plans de traitement avec instructions de dosage",
  },
  "dash.shell.h.adminTreatmentPlans.title": { en: "Treatment Plans", fr: "Plans de traitement" },
  "dash.shell.h.adminTreatmentPlans.sub": {
    en: "Personalized treatment timelines, progress notes, reminders & installments, glucose monitoring and final reviews",
    fr: "Chronologies de traitement personnalisées, notes de progrès, rappels & échéances, suivi de la glycémie et bilans finaux",
  },
  "dash.shell.h.adminTreatmentAlerts.title": { en: "Treatment Alerts", fr: "Alertes de traitement" },
  "dash.shell.h.adminTreatmentAlerts.sub": {
    en: "Missed glucose submissions, overdue payments, missed follow-ups, treatments ending, concerning readings and new complications",
    fr: "Glycémies manquées, paiements en retard, suivis manqués, traitements qui se terminent, lectures préoccupantes et nouvelles complications",
  },
  "dash.shell.h.adminUsers.title": { en: "Users", fr: "Utilisateurs" },
  "dash.shell.h.adminUsers.sub": {
    en: "Every account on the site, with the Medical Record Number each patient is filed under",
    fr: "Tous les comptes du site, avec le numéro de dossier médical de chaque patient",
  },
  "dash.shell.h.adminRoles.title": { en: "Staff & Roles", fr: "Équipe et rôles" },
  "dash.shell.h.adminRoles.sub": {
    en: "Promote verified accounts to staff, or back to patient",
    fr: "Promouvez des comptes vérifiés au rang d'équipe, ou remettez-les au rang de patient",
  },
  "dash.shell.h.adminBackups.title": { en: "Data Backups", fr: "Sauvegardes des données" },
  "dash.shell.h.adminBackups.sub": {
    en: "Daily automated and manual full-database backups, emailed to the clinic admin",
    fr: "Sauvegardes complètes de la base automatiques et manuelles, envoyées par e-mail à l'administrateur",
  },
  "dash.shell.h.adminStorage.title": { en: "Storage", fr: "Stockage" },
  "dash.shell.h.adminStorage.sub": {
    en: "How much database and media space is used, and how much is left",
    fr: "L'espace de base de données et de médias utilisé, et ce qu'il reste",
  },
  "dash.shell.h.adminLogs.title": { en: "Error Log", fr: "Journal d'erreurs" },
  "dash.shell.h.adminLogs.sub": {
    en: "Every error the site records, kept 90 days and summarised by email each morning",
    fr: "Toutes les erreurs enregistrées par le site, conservées 90 jours et résumées par e-mail chaque matin",
  },

  /* ── Dashboard status badges ────────────────────────────────────────────── */

  "dash.badges.order.pending": { en: "Pending", fr: "En attente" },
  "dash.badges.order.processing": { en: "Processing", fr: "En traitement" },
  "dash.badges.order.readyPickup": { en: "Ready for Pickup", fr: "Prêt au retrait" },
  "dash.badges.order.outDelivery": { en: "Out for Delivery", fr: "En cours de livraison" },
  "dash.badges.order.delivered": { en: "Delivered", fr: "Livré" },
  "dash.badges.order.cancelled": { en: "Cancelled", fr: "Annulé" },
  "dash.badges.testimonial.pending": { en: "Pending review", fr: "En attente de validation" },
  "dash.badges.testimonial.approved": { en: "Approved & live", fr: "Approuvé et publié" },
  "dash.badges.testimonial.rejected": { en: "Not approved", fr: "Non approuvé" },
  "dash.badges.appointment.pending": { en: "Awaiting confirmation", fr: "En attente de confirmation" },
  "dash.badges.appointment.confirmed": { en: "Confirmed", fr: "Confirmé" },
  "dash.badges.appointment.completed": { en: "Completed", fr: "Terminé" },
  "dash.badges.appointment.cancelled": { en: "Cancelled", fr: "Annulé" },
  "dash.badges.prescription.active": { en: "Active", fr: "Actif" },
  "dash.badges.prescription.past": { en: "Past", fr: "Passé" },
  "dash.badges.treatment.active": { en: "Active Treatment", fr: "Traitement en cours" },
  "dash.badges.treatment.expired": { en: "Treatment Period Ended", fr: "Période de traitement terminée" },
  "dash.badges.treatment.scheduled": { en: "Scheduled", fr: "Planifié" },
  "dash.badges.treatment.completed": { en: "Completed", fr: "Terminé" },
  "dash.badges.recordType.visit": { en: "Visit", fr: "Visite" },
  "dash.badges.recordType.diagnosis": { en: "Diagnosis", fr: "Diagnostic" },
  "dash.badges.recordType.lab": { en: "Lab result", fr: "Résultat de laboratoire" },
  "dash.badges.recordType.scan": { en: "Scan / Imaging", fr: "Examen / Imagerie" },
  "dash.badges.recordType.note": { en: "Clinical note", fr: "Note clinique" },

  /* ── Dashboard: overview ────────────────────────────────────────────────── */

  "dash.overview.recentOrders": { en: "Recent Orders", fr: "Commandes récentes" },
  "dash.overview.viewAll": { en: "View all", fr: "Tout voir" },
  "dash.overview.noOrdersTitle": { en: "No orders yet", fr: "Aucune commande pour l'instant" },
  "dash.overview.noOrdersSub": {
    en: "Browse the online catalog and place your first order - we will track it here for you.",
    fr: "Parcourez le catalogue en ligne et passez votre première commande - nous la suivrons ici pour vous.",
  },
  "dash.overview.browseCatalog": { en: "Browse the catalog", fr: "Parcourir le catalogue" },
  "dash.overview.item": { en: "{n} item", fr: "{n} article" },
  "dash.overview.items": { en: "{n} items", fr: "{n} articles" },
  "dash.overview.messagesFromClinic": { en: "Messages from the Clinic", fr: "Messages de la clinique" },
  "dash.overview.noMessagesTitle": { en: "No messages yet", fr: "Aucun message pour l'instant" },
  "dash.overview.noMessagesSub": {
    en: "The clinic will reach out here with order updates and wellness notes.",
    fr: "La clinique vous contactera ici pour les mises à jour de commandes et les conseils de bien-être.",
  },
  "dash.overview.openMessages": { en: "Open messages", fr: "Ouvrir les messages" },
  "dash.overview.yourStory": { en: "Your Story", fr: "Votre histoire" },
  "dash.overview.all": { en: "All", fr: "Tout" },
  "dash.overview.tellStoryTitle": { en: "Tell your S19 story", fr: "Racontez votre histoire S19" },
  "dash.overview.tellStorySub": {
    en: "Share how your healing journey is going - it encourages others on the same path.",
    fr: "Partagez le déroulement de votre parcours de guérison - cela encourage les autres sur le même chemin.",
  },
  "dash.overview.dropTestimony": { en: "Drop a testimony", fr: "Déposez un témoignage" },
  "dash.overview.shareAnother": { en: "Share another story", fr: "Partager une autre histoire" },
  "dash.overview.treatmentPlan": { en: "Treatment Plan", fr: "Plan de traitement" },
  "dash.overview.noPlanTitle": { en: "No treatment plan yet", fr: "Pas encore de plan de traitement" },
  "dash.overview.noPlanSub": {
    en: "The clinic builds every patient a personalized 3-month or 6-month plan. It will appear here with its start and end dates as soon as it is set up.",
    fr: "La clinique élabore pour chaque patient un plan personnalisé de 3 ou 6 mois. Il apparaîtra ici avec ses dates de début et de fin dès sa mise en place.",
  },
  "dash.overview.starts": { en: "Starts", fr: "Début" },
  "dash.overview.started": { en: "Started", fr: "Débuté" },
  "dash.overview.expectedCompletion": { en: "Expected completion", fr: "Fin prévue" },
  "dash.overview.completed": { en: "Completed", fr: "Terminé" },
  "dash.overview.monthOf": { en: "Month {m} of {n}", fr: "Mois {m} sur {n}" },
  "dash.overview.dayOf": { en: "Day {d} of {n} days", fr: "Jour {d} sur {n}" },
  "dash.overview.daysLeft": { en: "{n} days left on this treatment", fr: "Encore {n} jours de traitement" },
  "dash.overview.dayLeft": { en: "{n} day left on this treatment", fr: "Encore {n} jour de traitement" },
  "dash.overview.finalDay": { en: "Final day of treatment", fr: "Dernier jour de traitement" },
  "dash.overview.notStartedYet": { en: "Not started yet", fr: "Pas encore commencé" },
  "dash.overview.periodEnded": {
    en: "Period ended - the clinic will record the final review",
    fr: "Période terminée - la clinique enregistrera le bilan final",
  },
  "dash.overview.viewTimeline": { en: "View treatment timeline", fr: "Voir la chronologie du traitement" },
  "dash.overview.quickActions": { en: "Quick Actions", fr: "Actions rapides" },
  "dash.overview.quick.book": { en: "Book appointment", fr: "Réserver un rendez-vous" },
  "dash.overview.quick.bookSub": { en: "Clinic or Online", fr: "En clinique ou en ligne" },
  "dash.overview.quick.rate": { en: "Rate your visit", fr: "Notez votre visite" },
  "dash.overview.quick.rateSub": { en: "Reviews & stories", fr: "Avis et témoignages" },
  "dash.overview.quick.orders": { en: "View orders", fr: "Voir les commandes" },
  "dash.overview.quick.ordersSub": { en: "History & tracking", fr: "Historique et suivi" },
  "dash.overview.quick.messages": { en: "Read messages", fr: "Lire les messages" },
  "dash.overview.quick.messagesSub": { en: "Clinic updates", fr: "Mises à jour de la clinique" },
  "dash.overview.quick.records": { en: "Medical records", fr: "Dossier médical" },
  "dash.overview.quick.recordsSub": { en: "Visits, labs, scans", fr: "Visites, labo, examens" },
  "dash.overview.quick.prescriptions": { en: "Prescriptions", fr: "Prescriptions" },
  "dash.overview.quick.prescriptionsSub": { en: "Dosage instructions", fr: "Instructions de dosage" },
  "dash.overview.quick.family": { en: "Family profile", fr: "Profil familial" },
  "dash.overview.quick.familySub": { en: "Manage dependants", fr: "Gérez vos proches" },
  "dash.overview.quick.settings": { en: "Account settings", fr: "Paramètres du compte" },
  "dash.overview.quick.settingsSub": { en: "Profile & password", fr: "Profil et mot de passe" },
  "dash.overview.help.title": { en: "Need help?", fr: "Besoin d'aide ?" },
  "dash.overview.help.text": {
    en: "Questions about your order, a remedy, or your account?",
    fr: "Des questions sur votre commande, un remède ou votre compte ?",
  },
  "dash.overview.help.chat": { en: "Chat on WhatsApp", fr: "Discuter sur WhatsApp" },
  "dash.overview.emailNotVerified": {
    en: "Your email is not verified yet. Check your inbox for the verification link, or",
    fr: "Votre e-mail n'est pas encore vérifié. Consultez votre boîte de réception pour le lien de vérification, ou",
  },
  "dash.overview.resendIt": { en: "resend it", fr: "renvoyez-le" },
  "dash.overview.resentNote": {
    en: " (sent - check your inbox)",
    fr: " (envoyé - consultez votre boîte de réception)",
  },
  "dash.overview.vitalOrders": { en: "Orders", fr: "Commandes" },
  "dash.overview.vitalUnread": { en: "Unread", fr: "Non lus" },
  "dash.overview.vitalStories": { en: "Stories", fr: "Témoignages" },
  "dash.overview.statOrders": { en: "Orders placed", fr: "Commandes passées" },
  "dash.overview.stat.inProgress": { en: "{n} in progress", fr: "{n} en cours" },
  "dash.overview.stat.allDelivered": { en: "All delivered", fr: "Tout livré" },
  "dash.overview.stat.noOrders": { en: "No orders yet", fr: "Aucune commande" },
  "dash.overview.statUnread": { en: "Unread messages", fr: "Messages non lus" },
  "dash.overview.stat.unreadWaiting": { en: "Waiting from the clinic", fr: "En attente de la clinique" },
  "dash.overview.stat.caughtUp": { en: "You're all caught up", fr: "Tout est à jour" },
  "dash.overview.stat.new": { en: "New", fr: "Nouveau" },
  "dash.overview.statStories": { en: "Your stories", fr: "Vos témoignages" },
  "dash.overview.stat.storiesAwaiting": { en: "{n} awaiting review", fr: "{n} en attente de validation" },
  "dash.overview.stat.storiesShared": { en: "Shared with S19", fr: "Partagé avec S19" },
  "dash.overview.stat.storiesShare": { en: "Share your experience", fr: "Partagez votre expérience" },
  "dash.overview.statAccount": { en: "Account", fr: "Compte" },
  "dash.overview.stat.verified": { en: "Verified", fr: "Vérifié" },
  "dash.overview.stat.verifyEmail": { en: "Verify email", fr: "Vérifier l'e-mail" },
  "dash.overview.stat.memberSince": { en: "Member since {date}", fr: "Membre depuis {date}" },
  "dash.overview.stat.updateProfile": { en: "Update your profile", fr: "Mettez à jour votre profil" },
  "dash.overview.viewOrder": { en: "View order {ref}", fr: "Voir la commande {ref}" },
  "dash.overview.fallbackName": { en: "there", fr: "là" },
  "dash.overview.help.waMessage": {
    en: "Hello S19 Herbal Clinic, I have a question about my account or my order.",
    fr: "Bonjour Clinique S19 Herbal, j'ai une question sur mon compte ou ma commande.",
  },

  /* ── Dashboard: orders ──────────────────────────────────────────────────── */

  "dash.orders.loadError": { en: "Could not load your orders.", fr: "Impossible de charger vos commandes." },
  "dash.orders.empty": {
    en: "You have not placed any orders yet.",
    fr: "Vous n'avez pas encore passé de commande.",
  },
  "dash.orders.browse": { en: "Browse the catalog", fr: "Parcourir le catalogue" },
  "dash.orders.viewTrack": { en: "View & track", fr: "Voir et suivre" },
  "dash.orders.items": { en: "{n} items", fr: "{n} articles" },
  "dash.orders.item": { en: "{n} item", fr: "{n} article" },

  /* ── Dashboard: messages ────────────────────────────────────────────────── */

  "dash.messages.intro": {
    en: "Messages from the clinic - order updates, reports and follow-up notes. Reply to any conversation and the team will see it.",
    fr: "Messages de la clinique - mises à jour de commandes, rapports et notes de suivi. Répondez à toute conversation et l'équipe la verra.",
  },
  "dash.messages.cancel": { en: "Cancel", fr: "Annuler" },
  "dash.messages.new": { en: "New message", fr: "Nouveau message" },
  "dash.messages.loadError": { en: "Could not load your messages.", fr: "Impossible de charger vos messages." },
  "dash.messages.empty": {
    en: "No conversations yet. The clinic will reach out here with order updates, reports, and news - or start one yourself with \"New message\".",
    fr: "Aucune conversation pour l'instant. La clinique vous contactera ici pour les mises à jour de commandes, rapports et nouvelles - ou lancez-en une vous-même avec « Nouveau message ».",
  },
  "dash.messages.you": { en: "You", fr: "Vous" },
  "dash.messages.clinicShort": { en: "Clinic", fr: "Clinique" },
  "dash.messages.clinic": { en: "S19 Clinic", fr: "Clinique S19" },
  "dash.messages.newThread": { en: "New message to the clinic", fr: "Nouveau message à la clinique" },
  "dash.messages.subject": { en: "Subject", fr: "Objet" },
  "dash.messages.subjectPh": {
    en: "e.g. Question about my treatment plan",
    fr: "ex. Question sur mon plan de traitement",
  },
  "dash.messages.message": { en: "Message", fr: "Message" },
  "dash.messages.messagePh": { en: "Write your question or update…", fr: "Écrivez votre question ou votre mise à jour…" },
  "dash.messages.sending": { en: "Sending…", fr: "Envoi…" },
  "dash.messages.send": { en: "Send", fr: "Envoyer" },
  "dash.messages.sendError": { en: "Could not send your message.", fr: "Impossible d'envoyer votre message." },
  "dash.messages.reply": { en: "Reply", fr: "Répondre" },
  "dash.messages.replyPh": { en: "Write a reply for the clinic…", fr: "Écrivez une réponse pour la clinique…" },
  "dash.messages.sendReply": { en: "Send reply", fr: "Envoyer la réponse" },
  "dash.messages.replyError": { en: "Could not send your reply.", fr: "Impossible d'envoyer votre réponse." },
  "dash.messages.responseTime": {
    en: "We aim to reply during clinic hours. Response time is typically within the same day or next business day.",
    fr: "Nous visons à répondre pendant les heures de la clinique. Le délai de réponse est généralement le jour même ou le jour ouvrable suivant.",
  },
  "dash.messages.emergencyNote": {
    en: "This is not an emergency channel. If you have a medical emergency, call local emergency services or go to the nearest hospital immediately.",
    fr: "Ce n'est pas un canal d'urgence. En cas d'urgence médicale, appelez les services d'urgence locaux ou rendez-vous immédiatement à l'hôpital le plus proche.",
  },
  "dash.messages.urgentHeading": { en: "Urgent medical matters", fr: "Urgences médicales" },
  "dash.messages.urgentBody": {
    en: "Do not wait for a portal reply if you're experiencing a medical emergency. Call emergency services or go to the nearest hospital right away.",
    fr: "N'attendez pas une réponse du portail en cas d'urgence médicale. Appelez les services d'urgence ou rendez-vous immédiatement à l'hôpital le plus proche.",
  },

  /* ── Dashboard: appointments ────────────────────────────────────────────── */

  "dash.appointments.chooseFirst": {
    en: "Choose a doctor, date and time first.",
    fr: "Choisissez d'abord le praticien, la date et l'heure.",
  },
  "dash.appointments.loadAvailability": { en: "Could not load availability.", fr: "Impossible de charger les disponibilités." },
  "dash.appointments.bookError": { en: "Could not book the appointment.", fr: "Impossible de réserver le rendez-vous." },
  "dash.appointments.booked": { en: "Appointment requested.", fr: "Rendez-vous demandé." },
  "dash.appointments.bookTitle": { en: "Book an appointment", fr: "Réserver un rendez-vous" },
  "dash.appointments.stepDoctor": { en: "1. Doctor", fr: "1. Praticien" },
  "dash.appointments.chooseDoctor": { en: "Choose a doctor…", fr: "Choisir un praticien…" },
  "dash.appointments.stepDate": { en: "2. Date", fr: "2. Date" },
  "dash.appointments.availableFor": {
    en: "Available times for {name}",
    fr: "Disponibilités pour {name}",
  },
  "dash.appointments.pickDoctorDate": {
    en: "Choose a doctor and a future date to see available times.",
    fr: "Choisissez un praticien et une date future pour voir les disponibilités.",
  },
  "dash.appointments.noSlots": {
    en: "No available slots that day. Try another date.",
    fr: "Aucun créneau disponible ce jour-là. Essayez une autre date.",
  },
  "dash.appointments.mode": { en: "Consultation mode", fr: "Mode de consultation" },
  "dash.appointments.modeClinic": { en: "In-clinic", fr: "En clinique" },
  "dash.appointments.modeClinicHint": { en: "Bafoussam clinic", fr: "Clinique de Bafoussam" },
  "dash.appointments.modeVideo": { en: "Video call", fr: "Appel vidéo" },
  "dash.appointments.modeVideoHint": { en: "Telehealth", fr: "Télé-santé" },
  "dash.appointments.whoFor": { en: "Who is the visit for?", fr: "Pour qui est la visite ?" },
  "dash.appointments.myself": { en: "Myself", fr: "Moi-même" },
  "dash.appointments.concern": { en: "Health concern (optional)", fr: "Motif de santé (facultatif)" },
  "dash.appointments.concernGeneral": { en: "General / not listed", fr: "Général / non listé" },
  "dash.appointments.concernDiabetes": { en: "Diabetes / Blood sugar", fr: "Diabète / Glycémie" },
  "dash.appointments.concernHypertension": { en: "Hypertension / Heart health", fr: "Hypertension / Santé cardiaque" },
  "dash.appointments.concernProstate": { en: "Prostate / Men's health", fr: "Prostate / Santé masculine" },
  "dash.appointments.concernWomen": { en: "Women's health / Hormones", fr: "Santé féminine / Hormones" },
  "dash.appointments.concernGastritis": { en: "Gastritis / Digestion", fr: "Gastrite / Digestion" },
  "dash.appointments.concernLiver": { en: "Liver / Kidney detox", fr: "Détox foie / reins" },
  "dash.appointments.concernCancer": { en: "Integrative cancer care", fr: "Soins intégratifs du cancer" },
  "dash.appointments.notes": { en: "Notes for the clinic (optional)", fr: "Notes pour la clinique (facultatif)" },
  "dash.appointments.notesPh": { en: "Anything the clinic should know", fr: "Tout ce que la clinique devrait savoir" },
  "dash.appointments.booking": { en: "Booking...", fr: "Réservation..." },
  "dash.appointments.request": { en: "Request appointment", fr: "Demander un rendez-vous" },
  "dash.appointments.videoHint": {
    en: "Video visits: the clinic will share your consultation link when your appointment is confirmed.",
    fr: "Visites vidéo : la clinique partagera votre lien de consultation dès que votre rendez-vous sera confirmé.",
  },
  "dash.appointments.rescheduleTitle": { en: "Reschedule appointment", fr: "Reporter le rendez-vous" },
  "dash.appointments.newDate": { en: "New date", fr: "Nouvelle date" },
  "dash.appointments.newTime": { en: "New time", fr: "Nouvelle heure" },
  "dash.appointments.pickDate": { en: "Pick a date first…", fr: "Choisissez d'abord une date…" },
  "dash.appointments.noSlotsDay": { en: "No slots that day", fr: "Aucun créneau ce jour-là" },
  "dash.appointments.rescheduleError": { en: "Could not reschedule.", fr: "Impossible de reporter." },
  "dash.appointments.rescheduled": { en: "Appointment rescheduled.", fr: "Rendez-vous reporté." },
  "dash.appointments.saving": { en: "Saving...", fr: "Enregistrement..." },
  "dash.appointments.confirmReschedule": { en: "Confirm reschedule", fr: "Confirmer le report" },
  "dash.appointments.cancel": { en: "Cancel", fr: "Annuler" },
  "dash.appointments.cancelPrompt": { en: "Cancel this appointment?", fr: "Annuler ce rendez-vous ?" },
  "dash.appointments.cancelError": { en: "Could not cancel.", fr: "Impossible d'annuler." },
  "dash.appointments.cancelled": { en: "Appointment cancelled.", fr: "Rendez-vous annulé." },
  "dash.appointments.reminderVideo": { en: "video consultation", fr: "consultation vidéo" },
  "dash.appointments.reminderAppt": { en: "appointment", fr: "rendez-vous" },
  "dash.appointments.reminderTele": { en: "telehealth", fr: "télé-santé" },
  "dash.appointments.reminderClinic": { en: "in-clinic", fr: "en clinique" },
  "dash.appointments.videoBadge": { en: "Video", fr: "Vidéo" },
  "dash.appointments.patient": { en: "Patient: ", fr: "Patient : " },
  "dash.appointments.concernLabel": { en: "Concern: ", fr: "Motif : " },
  "dash.appointments.videoConsult": { en: "Video consultation", fr: "Consultation vidéo" },
  "dash.appointments.join": { en: "Join consultation", fr: "Rejoindre la consultation" },
  "dash.appointments.joinSoon": {
    en: "Your join link will appear here once the clinic confirms your appointment.",
    fr: "Votre lien d'accès apparaîtra ici dès que la clinique aura confirmé votre rendez-vous.",
  },
  "dash.appointments.whatsappReminder": { en: "Set WhatsApp reminder", fr: "Définir un rappel WhatsApp" },
  "dash.appointments.reschedule": { en: "Reschedule", fr: "Reporter" },
  "dash.appointments.cancelBtn": { en: "Cancel appointment", fr: "Annuler le rendez-vous" },
  "dash.appointments.loadError": { en: "Could not load your appointments.", fr: "Impossible de charger vos rendez-vous." },
  "dash.appointments.viewAll": { en: "All", fr: "Tous" },
  "dash.appointments.viewUpcoming": { en: "Upcoming", fr: "À venir" },
  "dash.appointments.viewPast": { en: "Past", fr: "Passés" },
  "dash.appointments.bookVideo": { en: "Book video visit", fr: "Réserver une visite vidéo" },
  "dash.appointments.bookBtn": { en: "Book appointment", fr: "Réserver un rendez-vous" },
  "dash.appointments.empty": {
    en: "No appointments here yet. Book a consultation with the S19 clinic - in person or online consultation.",
    fr: "Aucun rendez-vous pour l'instant. Réservez une consultation avec la clinique S19 - en personne ou en ligne.",
  },
  "dash.appointments.bookFirst": { en: "Book your first appointment", fr: "Réserver votre premier rendez-vous" },
  "dash.appointments.noBooking": {
    en: "Online booking is not available right now. You can still reach the clinic on WhatsApp.",
    fr: "La réservation en ligne n'est pas disponible pour le moment. Vous pouvez toujours joindre la clinique sur WhatsApp.",
  },
  "dash.appointments.clinic": { en: "Clinic", fr: "Clinique" },
  "dash.appointments.closeBooking": { en: "Close booking form", fr: "Fermer le formulaire de réservation" },
  "dash.appointments.reminderMsg": {
    en: "Hello S19 Herbal Clinic, this is a friendly reminder about my {kind} with {doctor} on {date} at {time} ({mode}).",
    fr: "Bonjour Clinique S19 Herbal, ceci est un rappel amical concernant mon {kind} avec {doctor} le {date} à {time} ({mode}).",
  },

  /* ── Dashboard: medical records ─────────────────────────────────────────── */

  "dash.records.downloadPdf": { en: "Download PDF", fr: "Télécharger le PDF" },
  "dash.records.diagnosis": { en: "Diagnosis", fr: "Diagnostic" },
  "dash.records.results": { en: "Results", fr: "Résultats" },
  "dash.records.notes": { en: "Notes", fr: "Notes" },
  "dash.records.attachments": { en: "Attachments ({n})", fr: "Pièces jointes ({n})" },
  "dash.records.document": { en: "Document", fr: "Document" },
  "dash.records.open": { en: "· open", fr: "· ouvrir" },
  "dash.records.footer": {
    en: "S19 Herbal Clinic · Document provided to the patient for personal records.",
    fr: "Clinique S19 · Document remis au patient pour son dossier personnel.",
  },
  "dash.records.intro": {
    en: "Your visit history, diagnoses, lab results and scans - kept private and downloadable as PDF.",
    fr: "Votre historique de visites, diagnostics, résultats de laboratoire et examens - confidentiel et téléchargeable en PDF.",
  },
  "dash.records.count": { en: "{n} records", fr: "{n} dossiers" },
  "dash.records.countOne": { en: "{n} record", fr: "{n} dossier" },
  "dash.records.all": { en: "All", fr: "Tous" },
  "dash.records.me": { en: "Me", fr: "Moi" },
  "dash.records.loadError": { en: "Could not load your medical records.", fr: "Impossible de charger votre dossier médical." },
  "dash.records.emptyAll": {
    en: "No medical records yet. Records from your visits, lab work and scans with the clinic will appear here.",
    fr: "Aucun dossier médical pour l'instant. Les dossiers de vos visites, analyses et examens avec la clinique apparaîtront ici.",
  },
  "dash.records.emptyFiltered": { en: "No medical records match this view.", fr: "Aucun dossier médical ne correspond à cette vue." },
  "dash.records.emptyMember": { en: "No medical records for {name} yet.", fr: "Aucun dossier médical pour {name} pour l'instant." },
  "dash.records.privacy": {
    en: "Your records are only visible to you and the clinic team. Use \"Download PDF\" to keep a copy for other providers.",
    fr: "Vos dossiers ne sont visibles que par vous et l'équipe de la clinique. Utilisez « Télécharger le PDF » pour en garder une copie pour d'autres prestataires.",
  },
  "dash.records.patient": { en: "Patient: {name}", fr: "Patient : {name}" },

  /* ── Dashboard: prescriptions ───────────────────────────────────────────── */

  "dash.prescriptions.title": { en: "Prescription · {date}", fr: "Ordonnance · {date}" },
  "dash.prescriptions.issued": { en: "Issued {date}", fr: "Émise le {date}" },
  "dash.prescriptions.byDoctor": { en: " by {name}", fr: " par {name}" },
  "dash.prescriptions.validTo": { en: " · valid to {date}", fr: " · valable jusqu'au {date}" },
  "dash.prescriptions.patient": { en: " · Patient: {name}", fr: " · Patient : {name}" },
  "dash.prescriptions.medication": { en: "Medication", fr: "Médicament" },
  "dash.prescriptions.dosage": { en: "Dosage", fr: "Dosage" },
  "dash.prescriptions.frequency": { en: "Frequency", fr: "Fréquence" },
  "dash.prescriptions.duration": { en: "Duration", fr: "Durée" },
  "dash.prescriptions.directions": { en: "Directions", fr: "Directives" },
  "dash.prescriptions.notes": { en: "Notes", fr: "Notes" },
  "dash.prescriptions.medPhotoAlt": { en: "Photo of {name}", fr: "Photo de {name}" },
  "dash.prescriptions.coverPhotoAlt": { en: "Prescription photo", fr: "Photo de l'ordonnance" },
  "dash.prescriptions.photoHint": {
    en: "These photos show you exactly which product to look for.",
    fr: "Ces photos vous montrent exactement quel produit rechercher.",
  },
  "dash.prescriptions.footer": {
    en: "S19 Herbal Clinic · Follow your provider's instructions. Contact the clinic before changing any treatment.",
    fr: "Clinique S19 · Suivez les instructions de votre prestataire. Contactez la clinique avant de modifier un traitement.",
  },
  "dash.prescriptions.all": { en: "All", fr: "Tous" },
  "dash.prescriptions.me": { en: "Me", fr: "Moi" },
  "dash.prescriptions.current": { en: "Current ({n})", fr: "En cours ({n})" },
  "dash.prescriptions.past": { en: "Past ({n})", fr: "Passés ({n})" },
  "dash.prescriptions.loadError": { en: "Could not load your prescriptions.", fr: "Impossible de charger vos prescriptions." },
  "dash.prescriptions.emptyCurrentAll": {
    en: "No current prescriptions. Your active treatment plans will appear here.",
    fr: "Aucune prescription en cours. Vos plans de traitement actifs apparaîtront ici.",
  },
  "dash.prescriptions.emptyCurrentMember": {
    en: "No current prescriptions for {name}.",
    fr: "Aucune prescription en cours pour {name}.",
  },
  "dash.prescriptions.emptyPastAll": { en: "No past prescriptions yet.", fr: "Aucune prescription passée pour l'instant." },
  "dash.prescriptions.emptyPastMember": { en: "No past prescriptions for {name}.", fr: "Aucune prescription passée pour {name}." },

  /* ── Dashboard: treatment plan ──────────────────────────────────────────── */

  "dash.treatment.planLabel": { en: "Personalized Treatment Plan", fr: "Plan de traitement personnalisé" },
  "dash.treatment.patient": { en: "Patient: {name}", fr: "Patient : {name}" },
  "dash.treatment.started": { en: "Started", fr: "Début" },
  "dash.treatment.completed": { en: "Completed", fr: "Terminé" },
  "dash.treatment.expectedCompletion": { en: "Expected completion", fr: "Fin prévue" },
  "dash.treatment.duration": { en: "Duration", fr: "Durée" },
  "dash.treatment.months": { en: "{n} months", fr: "{n} mois" },
  "dash.treatment.month": { en: "{n} month", fr: "{n} mois" },
  "dash.treatment.monthOf": { en: " · Month {m} of {n}", fr: " · Mois {m} sur {n}" },
  "dash.treatment.dayOf": { en: "Day {d} of {days} · Month {m} of {months}", fr: "Jour {d} sur {days} · Mois {m} sur {months}" },
  "dash.treatment.dayZero": { en: "Day 0 of {days}", fr: "Jour 0 sur {days}" },
  "dash.treatment.remaining": { en: "{n} days remaining", fr: "Encore {n} jours" },
  "dash.treatment.dayRemaining": { en: "{n} day remaining", fr: "Encore {n} jour" },
  "dash.treatment.finalDay": { en: "Final day of treatment", fr: "Dernier jour de traitement" },
  "dash.treatment.awaitingStart": { en: "Awaiting start", fr: "En attente de début" },
  "dash.treatment.notScheduled": { en: "Not started yet - the clinic will follow your progress once it begins.", fr: "Pas encore commencé - la clinique suivra vos progrès dès le début." },
  "dash.treatment.periodEnded": { en: "Your treatment period has ended. The clinic will record the final review and close your plan shortly.", fr: "Votre période de traitement est terminée. La clinique enregistrera le bilan final et clôturera votre plan très bientôt." },
  "dash.treatment.completedMaintenance": { en: "Treatment completed - you continue on a maintenance program.", fr: "Traitement terminé - vous poursuivez avec un programme d'entretien." },
  "dash.treatment.completedExtended": { en: "Treatment completed - the clinic has extended your care in a new phase.", fr: "Traitement terminé - la clinique a prolongé vos soins dans une nouvelle phase." },
  "dash.treatment.completedClosed": { en: "Treatment completed - the clinic closed your plan after the final review.", fr: "Traitement terminé - la clinique a clôturé votre plan après le bilan final." },
  "dash.treatment.glucoseMonitor": {
    en: "Daily glucose monitoring required - fasting {from}–{to} and 2h post-lunch {pfrom}–{pto}.",
    fr: "Suivi glycémique quotidien requis - à jeun {from}–{to} et 2h après le déjeuner {pfrom}–{pto}.",
  },
  "dash.treatment.finalReview": { en: "Final review · {outcome}", fr: "Bilan final · {outcome}" },
  "dash.treatment.review.improvements": { en: "Improvements: ", fr: "Améliorations : " },
  "dash.treatment.review.resolved": { en: "Resolved: ", fr: "Résolu : " },
  "dash.treatment.review.unresolved": { en: "Unresolved: ", fr: "Non résolu : " },
  "dash.treatment.review.complications": { en: "Complications: ", fr: "Complications : " },
  "dash.treatment.review.followUpLabs": { en: "Follow-up labs: ", fr: "Analyses de suivi : " },
  "dash.treatment.review.notes": { en: "Notes: ", fr: "Notes : " },
  "dash.treatment.glucoseSection": { en: "Diabetes monitoring", fr: "Suivi du diabète" },
  "dash.treatment.logReading": { en: "Log reading", fr: "Saisir une mesure" },
  "dash.treatment.close": { en: "Close", fr: "Fermer" },
  "dash.treatment.fastingStatus": { en: "Fasting {status}", fr: "À jeun {status}" },
  "dash.treatment.loggedToday": { en: "logged today", fr: "saisi aujourd'hui" },
  "dash.treatment.pending": { en: "pending", fr: "en attente" },
  "dash.treatment.postLunchStatus": { en: "2h post-lunch {status}", fr: "2h après déjeuner {status}" },
  "dash.treatment.readingType": { en: "Reading type", fr: "Type de mesure" },
  "dash.treatment.fastingBtn": { en: "Fasting (6–10 AM)", fr: "À jeun (6–10 h)" },
  "dash.treatment.postLunchBtn": { en: "2h post-lunch", fr: "2h après déjeuner" },
  "dash.treatment.readingValue": { en: "Reading (mg/dL)", fr: "Mesure (mg/dL)" },
  "dash.treatment.readingPh": { en: "e.g. 104", fr: "ex. 104" },
  "dash.treatment.readingInvalid": { en: "Enter a valid reading between 10 and 900 mg/dL.", fr: "Saisissez une mesure valide entre 10 et 900 mg/dL." },
  "dash.treatment.mealInfo": { en: "What did you eat? (optional)", fr: "Qu'avez-vous mangé ? (facultatif)" },
  "dash.treatment.mealPh": { en: "e.g. Rice, beans and fish", fr: "ex. Riz, haricots et poisson" },
  "dash.treatment.photoLabel": { en: "Photo of the glucose meter result (optional)", fr: "Photo du résultat du lecteur de glycémie (facultatif)" },
  "dash.treatment.photoHint": { en: "Clear photo of the meter screen. Max 6 MB.", fr: "Photo nette de l'écran du lecteur. 6 Mo max." },
  "dash.treatment.choosePhoto": { en: "Choose photo", fr: "Choisir une photo" },
  "dash.treatment.photoPreviewAlt": { en: "Glucose meter result preview", fr: "Aperçu du résultat du lecteur de glycémie" },
  "dash.treatment.remove": { en: "Remove", fr: "Retirer" },
  "dash.treatment.saveReading": { en: "Save reading", fr: "Enregistrer la mesure" },
  "dash.treatment.readingSaved": { en: "Reading saved. Thank you for monitoring your glucose!", fr: "Mesure enregistrée. Merci de surveiller votre glycémie !" },
  "dash.treatment.readingSaveError": { en: "Could not save the reading.", fr: "Impossible d'enregistrer la mesure." },
  "dash.treatment.fasting": { en: "Fasting", fr: "À jeun" },
  "dash.treatment.postLunch": { en: "2h post-lunch", fr: "2h après déjeuner" },
  "dash.treatment.level.high": { en: "High", fr: "Élevée" },
  "dash.treatment.level.elevated": { en: "Elevated", fr: "Légèrement élevée" },
  "dash.treatment.level.normal": { en: "Normal", fr: "Normale" },
  "dash.treatment.viewPhoto": { en: "View photo", fr: "Voir la photo" },
  "dash.treatment.recent6": { en: "Showing the 6 most recent readings.", fr: "Affichage des 6 mesures les plus récentes." },
  "dash.treatment.noReadings": { en: "No readings yet - log your first fasting or post-lunch reading above.", fr: "Aucune mesure pour l'instant - saisissez votre première mesure à jeun ou après déjeuner ci-dessus." },
  "dash.treatment.tasksTitle": { en: "Today's tasks & reminders", fr: "Tâches et rappels du jour" },
  "dash.treatment.tasksEmpty": {
    en: "The clinic will post reminders here for payments, refills, follow-up calls, lab tests and daily monitoring.",
    fr: "La clinique publiera ici les rappels de paiements, renouvellements, appels de suivi, analyses et suivi quotidien.",
  },
  "dash.treatment.dueToday": { en: "Due today", fr: "À faire aujourd'hui" },
  "dash.treatment.overdue": { en: "Overdue · due {date}", fr: "En retard · prévu le {date}" },
  "dash.treatment.due": { en: "Due {date}", fr: "Prévu le {date}" },
  "dash.treatment.done": { en: "Done", fr: "Fait" },
  "dash.treatment.allTasksDone": { en: "All tasks done - great job!", fr: "Toutes les tâches sont faites - bravo !" },
  "dash.treatment.recentlyDone": { en: "Recently done", fr: "Récemment fait" },
  "dash.treatment.progressTitle": { en: "Treatment progress", fr: "Progression du traitement" },
  "dash.treatment.progressEmpty": {
    en: "The clinic records your progress at each follow-up - Baseline, Month 1, Month 2... Final assessment. Updates will appear here as a dated history.",
    fr: "La clinique enregistre vos progrès à chaque suivi - Base, Mois 1, Mois 2... Bilan final. Les mises à jour apparaîtront ici sous forme d'historique daté.",
  },
  "dash.treatment.milestone.baseline": { en: "Baseline", fr: "Base" },
  "dash.treatment.milestone.final": { en: "Final assessment", fr: "Bilan final" },
  "dash.treatment.milestone.review": { en: "Review", fr: "Point de suivi" },
  "dash.treatment.milestone.month": { en: "Month {n}", fr: "Mois {n}" },
  "dash.treatment.chips.resolved": { en: "Resolved", fr: "Résolu" },
  "dash.treatment.chips.improved": { en: "Improved", fr: "Amélioré" },
  "dash.treatment.chips.persistent": { en: "Persistent", fr: "Persistant" },
  "dash.treatment.chips.new": { en: "New / complications", fr: "Nouveau / complications" },
  "dash.treatment.chips.adverse": { en: "Adverse reactions", fr: "Réactions indésirables" },
  "dash.treatment.vitals": { en: "Vitals: ", fr: "Constantes : " },
  "dash.treatment.followUpLabsLabel": { en: "Follow-up labs: ", fr: "Analyses de suivi : " },
  "dash.treatment.clinicianNotes": { en: "Clinician notes: ", fr: "Notes du clinicien : " },
  "dash.treatment.loadError": { en: "Could not load your treatment dashboard.", fr: "Impossible de charger votre tableau de suivi." },
  "dash.treatment.intro": {
    en: "Your personalized treatment dashboard - timeline, progress, today's tasks and required readings, all in one place.",
    fr: "Votre tableau de suivi personnalisé - chronologie, progression, tâches du jour et mesures requises, tout au même endroit.",
  },
  "dash.treatment.refresh": { en: "Refresh", fr: "Actualiser" },
  "dash.treatment.emptyPlan": {
    en: "No treatment plan yet. The clinic sets up a personalized 3-month or 6-month plan for you - once it is ready, your treatment dashboard will appear here.",
    fr: "Pas encore de plan de traitement. La clinique prépare pour vous un plan personnalisé de 3 ou 6 mois - dès qu'il sera prêt, votre tableau de suivi apparaîtra ici.",
  },
  "dash.treatment.reminderError": { en: "Could not update the reminder.", fr: "Impossible de mettre à jour le rappel." },
  "dash.treatment.saving": { en: "Saving...", fr: "Enregistrement..." },
  "dash.treatment.vital.weight": { en: "{n} kg", fr: "{n} kg" },
  "dash.treatment.vital.bp": { en: "BP {sys}/{dia}", fr: "TA {sys}/{dia}" },
  "dash.treatment.vital.glucose": { en: "Glucose {n} mg/dL", fr: "Glycémie {n} mg/dL" },

  /* ── Dashboard: family ──────────────────────────────────────────────────── */

  "dash.family.relation.child": { en: "Child", fr: "Enfant" },
  "dash.family.relation.spouse": { en: "Spouse", fr: "Conjoint(e)" },
  "dash.family.relation.parent": { en: "Parent", fr: "Parent" },
  "dash.family.relation.sibling": { en: "Sibling", fr: "Frère / Sœur" },
  "dash.family.relation.other": { en: "Other", fr: "Autre" },
  "dash.family.nameRequired": { en: "Please provide the family member's name.", fr: "Veuillez fournir le nom du membre de la famille." },
  "dash.family.saveError": { en: "Could not save the family member.", fr: "Impossible d'enregistrer le membre de la famille." },
  "dash.family.updated": { en: "Family member updated.", fr: "Membre de la famille mis à jour." },
  "dash.family.added": { en: "Family member added.", fr: "Membre de la famille ajouté." },
  "dash.family.editTitle": { en: "Edit family member", fr: "Modifier le membre de la famille" },
  "dash.family.addTitle": { en: "Add a family member", fr: "Ajouter un membre de la famille" },
  "dash.family.fullName": { en: "Full name", fr: "Nom complet" },
  "dash.family.namePh": { en: "e.g. Ada Tchoupo", fr: "ex. Ada Tchoupo" },
  "dash.family.dob": { en: "Date of birth", fr: "Date de naissance" },
  "dash.family.gender": { en: "Gender", fr: "Genre" },
  "dash.family.genderUndisclosed": { en: "Prefer not to say", fr: "Préfère ne pas dire" },
  "dash.family.male": { en: "Male", fr: "Masculin" },
  "dash.family.female": { en: "Female", fr: "Féminin" },
  "dash.family.other": { en: "Other", fr: "Autre" },
  "dash.family.relationship": { en: "Relationship", fr: "Lien de parenté" },
  "dash.family.notesLabel": { en: "Notes (optional)", fr: "Notes (facultatif)" },
  "dash.family.notesPh": {
    en: "Allergies, medications, school, anything useful for the clinic",
    fr: "Allergies, médicaments, école, tout ce qui peut être utile à la clinique",
  },
  "dash.family.saving": { en: "Saving...", fr: "Enregistrement..." },
  "dash.family.saveChanges": { en: "Save changes", fr: "Enregistrer les modifications" },
  "dash.family.addMember": { en: "Add member", fr: "Ajouter un membre" },
  "dash.family.cancel": { en: "Cancel", fr: "Annuler" },
  "dash.family.loadError": { en: "Could not load your family members.", fr: "Impossible de charger les membres de votre famille." },
  "dash.family.removePrompt": { en: "Remove {name} from your family profile?", fr: "Retirer {name} de votre profil familial ?" },
  "dash.family.removeError": { en: "Could not remove the family member.", fr: "Impossible de retirer le membre de la famille." },
  "dash.family.removed": { en: "Family member removed.", fr: "Membre de la famille retiré." },
  "dash.family.intro": {
    en: "Manage profiles for your children and loved ones so the clinic can care for the whole family.",
    fr: "Gérez les profils de vos enfants et de vos proches afin que la clinique puisse prendre soin de toute la famille.",
  },
  "dash.family.addBtn": { en: "Add family member", fr: "Ajouter un membre de la famille" },
  "dash.family.empty": {
    en: "No family members yet. Add a child or loved one to book visits and keep their records under your account.",
    fr: "Aucun membre de la famille pour l'instant. Ajoutez un enfant ou un proche pour réserver des visites et conserver leurs dossiers sous votre compte.",
  },
  "dash.family.born": { en: " · born {date}", fr: " · né(e) le {date}" },
  "dash.family.relationLabel": { en: " · {relation}", fr: " · {relation}" },
  "dash.family.genderLabel": { en: " · {gender}", fr: " · {gender}" },
  "dash.family.notesDetail": { en: " · {notes}", fr: " · {notes}" },

  /* ── Dashboard: testimonials ────────────────────────────────────────────── */

  "dash.testimonials.intro": {
    en: "The stories you have shared with the S19 community.",
    fr: "Les témoignages que vous avez partagés avec la communauté S19.",
  },
  "dash.testimonials.drop": { en: "Drop a testimony", fr: "Déposez un témoignage" },
  "dash.testimonials.loadError": { en: "Could not load your testimonials.", fr: "Impossible de charger vos témoignages." },
  "dash.testimonials.saveError": { en: "Could not save your testimony.", fr: "Impossible d'enregistrer votre témoignage." },
  "dash.testimonials.saved": {
    en: "Thank you! Your testimony is pending review.",
    fr: "Merci ! Votre témoignage est en attente de validation.",
  },
  "dash.testimonials.name": { en: "Your Name", fr: "Votre nom" },
  "dash.testimonials.namePh": { en: "Full name", fr: "Nom complet" },
  "dash.testimonials.city": { en: "City", fr: "Ville" },
  "dash.testimonials.cityPh": { en: "e.g. Bafoussam", fr: "ex. Bafoussam" },
  "dash.testimonials.country": { en: "Country (optional)", fr: "Pays (facultatif)" },
  "dash.testimonials.countryPh": { en: "e.g. Cameroun / USA", fr: "ex. Cameroun / USA" },
  "dash.testimonials.program": { en: "Program or Product", fr: "Programme ou produit" },
  "dash.testimonials.programPh": { en: "e.g. Diabetes & Metabolic Health Support", fr: "ex. Soutien diabète et santé métabolique" },
  "dash.testimonials.rating": { en: "Your Rating", fr: "Votre note" },
  "dash.testimonials.ratingHint": { en: "How was your visit with S19?", fr: "Comment s'est passée votre visite avec S19 ?" },
  "dash.testimonials.ratingExcellent": { en: "Excellent", fr: "Excellent" },
  "dash.testimonials.ratingGood": { en: "Good", fr: "Bien" },
  "dash.testimonials.ratingOkay": { en: "Okay", fr: "Moyen" },
  "dash.testimonials.ratingPoor": { en: "Poor", fr: "Faible" },
  "dash.testimonials.ratingVeryPoor": { en: "Very poor", fr: "Très faible" },
  "dash.testimonials.ratingNone": { en: "Select a rating", fr: "Sélectionnez une note" },
  "dash.testimonials.consentTitle": { en: "Publication Consent", fr: "Consentement à la publication" },
  "dash.testimonials.consentText": {
    en: "By submitting this testimonial, you consent to S19 Herbal Clinic publishing it on our website (including patient stories and reviews). We may display your name, city/country, program and your comments as provided.",
    fr: "En soumettant ce témoignage, vous acceptez que S19 Herbal Clinic le publie sur notre site web (y compris les témoignages et avis des patients). Nous pouvons afficher votre nom, votre ville/pays, le programme et vos commentaires tels que fournis.",
  },
  "dash.testimonials.consentWithdraw": {
    en: "You can withdraw your consent at any time by contacting us and we will remove it promptly.",
    fr: "Vous pouvez retirer votre consentement à tout moment en nous contactant et nous le supprimerons rapidement.",
  },
  "dash.testimonials.consentCheckbox": {
    en: "I consent to having my testimonial published as described above.",
    fr: "J'accepte que mon témoignage soit publié tel que décrit ci-dessus.",
  },
  "dash.testimonials.testimony": { en: "Your Testimony", fr: "Votre témoignage" },
  "dash.testimonials.testimonyHint": { en: "Share your experience in at least 20 characters.", fr: "Partagez votre expérience en au moins 20 caractères." },
  "dash.testimonials.testimonyPh": { en: "How did S19 help you?...", fr: "Comment S19 vous a-t-il aidé(e) ?..." },
  "dash.testimonials.submitting": { en: "Submitting...", fr: "Envoi..." },
  "dash.testimonials.submit": { en: "Submit for review", fr: "Envoyer pour validation" },
  "dash.testimonials.cancel": { en: "Cancel", fr: "Annuler" },
  "dash.testimonials.empty": {
    en: "You have not dropped a testimony yet. Share your S19 story - it encourages others.",
    fr: "Vous n'avez pas encore déposé de témoignage. Partagez votre histoire S19 - cela encourage les autres.",
  },

  /* ── Dashboard: settings ────────────────────────────────────────────────── */

  "dash.settings.profilePhoto": { en: "Profile photo", fr: "Photo de profil" },
  "dash.settings.photoHint": {
    en: "A clear portrait helps the clinic recognise you. JPG, PNG, WebP or AVIF up to 4 MB.",
    fr: "Un portrait net aide la clinique à vous reconnaître. JPG, PNG, WebP ou AVIF jusqu'à 4 Mo.",
  },
  "dash.settings.uploading": { en: "Uploading...", fr: "Téléversement..." },
  "dash.settings.changePhoto": { en: "Change photo", fr: "Changer la photo" },
  "dash.settings.uploadPhoto": { en: "Upload photo", fr: "Téléverser la photo" },
  "dash.settings.remove": { en: "Remove", fr: "Retirer" },
  "dash.settings.profile": { en: "Profile", fr: "Profil" },
  "dash.settings.mrn": { en: "Medical Record Number (MRN)", fr: "Numéro de dossier médical (MRN)" },
  "dash.settings.mrnMissing": {
    en: "Not assigned yet. Your MRN is issued by the clinic for your medical record.",
    fr: "Pas encore attribué. Votre MRN est délivré par la clinique pour votre dossier médical.",
  },
  "dash.settings.mrnNote": {
    en: "The MRN is managed by the clinic and cannot be changed from this page.",
    fr: "Le MRN est géré par la clinique et ne peut pas être modifié depuis cette page.",
  },
  "dash.settings.fullName": { en: "Full Name", fr: "Nom complet" },
  "dash.settings.phone": { en: "Phone / WhatsApp", fr: "Téléphone / WhatsApp" },
  "dash.settings.dob": { en: "Date of Birth", fr: "Date de naissance" },
  "dash.settings.gender": { en: "Gender", fr: "Genre" },
  "dash.settings.genderSelect": { en: "Select gender", fr: "Sélectionnez le genre" },
  "dash.settings.genderRequired": { en: "Please select your gender - it is required.", fr: "Veuillez sélectionner votre genre - c'est obligatoire." },
  "dash.settings.genderMale": { en: "Male", fr: "Masculin" },
  "dash.settings.genderFemale": { en: "Female", fr: "Féminin" },
  "dash.settings.genderOther": { en: "Other", fr: "Autre" },
  "dash.settings.address": { en: "Home Address", fr: "Adresse du domicile" },
  "dash.settings.addressPh": { en: "Street, town/city, country", fr: "Rue, ville, pays" },
  "dash.settings.emergency": { en: "Emergency contact", fr: "Contact d'urgence" },
  "dash.settings.emergencyName": { en: "Name", fr: "Nom" },
  "dash.settings.emergencyPhone": { en: "Phone", fr: "Téléphone" },
  "dash.settings.emergencyRelation": { en: "Relationship", fr: "Lien" },
  "dash.settings.emergencyRelationPh": { en: "e.g. Spouse, Parent", fr: "ex. Conjoint(e), Parent" },
  "dash.settings.emailLocked": { en: "Your email is your sign-in and cannot be changed here.", fr: "Votre e-mail est votre identifiant et ne peut pas être modifié ici." },
  "dash.settings.notifications": { en: "Notifications", fr: "Notifications" },
  "dash.settings.waOptIn": { en: "Send me WhatsApp notifications", fr: "Recevoir mes notifications par WhatsApp" },
  "dash.settings.waOptInHelp": {
    en: "Appointment confirmations and changes, order updates, new prescriptions, medical records, treatment plans and clinic messages. Turn this off at any time.",
    fr: "Confirmations et modifications de rendez-vous, suivi des commandes, nouvelles ordonnances, dossiers médicaux, plans de traitement et messages de la clinique. Vous pouvez le désactiver à tout moment.",
  },
  "dash.settings.waNeedsPhone": {
    en: "Add your phone number above first, then you can turn this on.",
    fr: "Ajoutez d'abord votre numéro de téléphone ci-dessus, puis vous pourrez l'activer.",
  },
  "dash.settings.waSaved": { en: "Notification preferences saved.", fr: "Préférences de notification enregistrées." },
  "dash.settings.notifLanguage": { en: "Message language", fr: "Langue des messages" },
  "dash.settings.notifLanguageHelp": {
    en: "WhatsApp messages are sent in this language. Your dashboard language is unaffected.",
    fr: "Les messages WhatsApp sont envoyés dans cette langue. La langue de votre tableau de bord n'est pas modifiée.",
  },
  "dash.settings.saveProfile": { en: "Save profile", fr: "Enregistrer le profil" },
  "dash.settings.profileUpdated": { en: "Profile updated.", fr: "Profil mis à jour." },
  "dash.settings.profileError": { en: "Could not update your profile.", fr: "Impossible de mettre à jour votre profil." },
  "dash.settings.photoUpdated": { en: "Photo updated.", fr: "Photo mise à jour." },
  "dash.settings.photoError": { en: "Could not upload your photo.", fr: "Impossible de téléverser votre photo." },
  "dash.settings.photoRemoved": { en: "Photo removed.", fr: "Photo retirée." },
  "dash.settings.photoRemoveError": { en: "Could not remove your photo.", fr: "Impossible de retirer votre photo." },
  "dash.settings.uploadFailed": { en: "Upload failed.", fr: "Échec du téléversement." },
  "dash.settings.idDocument": { en: "ID document", fr: "Pièce d'identité" },
  "dash.settings.idHint": {
    en: "Upload the front and back of your NIN, passport or birth certificate so the clinic can identify you. You'll see a preview of each side before anything is saved. JPG, PNG, WebP, AVIF or PDF up to 8 MB per side.",
    fr: "Téléversez le recto et le verso de votre NIN, passeport ou acte de naissance afin que la clinique puisse vous identifier. Vous verrez un aperçu de chaque face avant tout enregistrement. JPG, PNG, WebP, AVIF ou PDF jusqu'à 8 Mo par face.",
  },
  "dash.settings.idFront": { en: "Front of document", fr: "Recto du document" },
  "dash.settings.idBack": { en: "Back of document", fr: "Verso du document" },
  "dash.settings.idFrontSaved": { en: "Front of ID document uploaded.", fr: "Recto de la pièce d'identité téléversé." },
  "dash.settings.idBackSaved": { en: "Back of ID document uploaded.", fr: "Verso de la pièce d'identité téléversé." },
  "dash.settings.idError": { en: "Could not upload your ID document.", fr: "Impossible de téléverser votre pièce d'identité." },
  "dash.settings.idRemoveError": { en: "Could not remove the document.", fr: "Impossible de retirer le document." },
  "dash.settings.idRemoved": { en: "ID document removed.", fr: "Pièce d'identité retirée." },
  "dash.settings.uploadSave": { en: "Upload & save", fr: "Téléverser et enregistrer" },
  "dash.settings.cancel": { en: "Cancel", fr: "Annuler" },
  "dash.settings.viewPdf": { en: "View saved document (PDF)", fr: "Voir le document enregistré (PDF)" },
  "dash.settings.replace": { en: "Replace", fr: "Remplacer" },
  "dash.settings.chooseFile": { en: "Choose file", fr: "Choisir un fichier" },
  "dash.settings.changePassword": { en: "Change password", fr: "Changer le mot de passe" },
  "dash.settings.currentPassword": { en: "Current Password", fr: "Mot de passe actuel" },
  "dash.settings.newPassword": { en: "New Password", fr: "Nouveau mot de passe" },
  "dash.settings.passwordHint": { en: "At least 8 characters.", fr: "Au moins 8 caractères." },
  "dash.settings.confirmPassword": { en: "Confirm New Password", fr: "Confirmer le nouveau mot de passe" },
  "dash.settings.passwordMismatch": { en: "New passwords do not match.", fr: "Les nouveaux mots de passe ne correspondent pas." },
  "dash.settings.passwordChanged": { en: "Password changed.", fr: "Mot de passe modifié." },
  "dash.settings.passwordError": { en: "Could not change your password.", fr: "Impossible de changer votre mot de passe." },
  "dash.settings.updating": { en: "Updating...", fr: "Mise à jour..." },
  "dash.settings.updatePassword": { en: "Update password", fr: "Mettre à jour le mot de passe" },
  "dash.settings.signOutTitle": { en: "Sign out", fr: "Se déconnecter" },
  "dash.settings.signOutNote": { en: "You will need your email and password to sign back in.", fr: "Vous aurez besoin de votre e-mail et de votre mot de passe pour vous reconnecter." },
  "dash.settings.signOut": { en: "Sign out", fr: "Se déconnecter" },
  "dash.settings.choosePhoto": { en: "Choose a profile photo", fr: "Choisir une photo de profil" },
  "dash.settings.email": { en: "Email", fr: "E-mail" },
  "dash.settings.phonePh": { en: "+237 ...", fr: "+237 ..." },
  "dash.settings.saving": { en: "Saving...", fr: "Enregistrement..." },
  "dash.settings.idPreview": { en: "{side} preview", fr: "Aperçu : {side}" },
  "dash.settings.idSaved": { en: "{side} - saved", fr: "{side} - enregistré" },
  "dash.settings.chooseSide": { en: "Choose {side}", fr: "Choisir : {side}" },

  /* ── System error pages ───────────────────────────────────────────────── */

  "sys.error.title": { en: "Something went wrong", fr: "Une erreur est survenue" },
  "sys.error.body": {
    en: "The clinic website ran into a problem and could not load this page. Nothing you typed has been sent anywhere. Please try again.",
    fr: "Le site de la clinique a rencontré un problème et n'a pas pu charger cette page. Rien de ce que vous avez saisi n'a été envoyé. Veuillez réessayer.",
  },
  "sys.error.retry": { en: "Try again", fr: "Réessayer" },
  "sys.error.home": { en: "Back to home", fr: "Retour à l'accueil" },
  "sys.error.call": {
    en: "if this keeps happening",
    fr: "si cela continue",
  },
  "sys.error.reference": { en: "Reference code", fr: "Code de référence" },
  "sys.error.referenceHint": {
    en: "Quote this code if you contact the clinic, so we can find the exact problem.",
    fr: "Indiquez ce code si vous contactez la clinique, afin que nous puissions retrouver le problème exact.",
  },
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