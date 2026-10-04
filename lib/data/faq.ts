/**
 * The public FAQ, from
 * `docs/S19_New_Retouches/S19_FAQ_Page_Concise_Updated_v2.md`.
 *
 * ## Why the copy lives here and not in `lib/i18n.ts`
 *
 * `lib/i18n.ts` holds page chrome — labels, headings, buttons. This is 22
 * questions and answers of approved prose, which is the same shape as
 * `lib/data/programs.ts` and `lib/data/blog-posts.ts`, so it follows the
 * `...Fr` convention those files use rather than becoming 44 more i18n keys.
 * Only the hero and the two CTA blocks are chrome, so those stay in i18n.
 *
 * ## Answers are paragraph arrays
 *
 * Several answers are genuinely multi-paragraph (Q13 on cancer is four
 * paragraphs of separate claims). Storing them as one string would mean
 * embedding `\n\n` and re-splitting at render time, which silently collapses
 * to one block the moment anyone renders with `whitespace-pre-line` and a
 * different trim. An array cannot be rendered as a single run-on paragraph.
 *
 * ## The approved wording is not ours to improve
 *
 * The guide says: "Do not add medical claims or rewrite answers", "Do not
 * strengthen this into a treatment-success or cure claim", and "WHEN IN DOUBT:
 * Leave the approved wording unchanged and ask S19." Every `answer` below is
 * therefore the approved text, lightly adapted only where French agreement or
 * typography required it. Do not tidy the prose.
 */

/** One question. `answer` paragraphs are rendered as separate blocks. */
export interface FaqEntry {
  /** Position in the approved numbering, 1-22. Rendered, and used as the React key. */
  n: number;
  question: string;
  answer: string[];
  questionFr: string;
  answerFr: string[];
  /**
   * Contextual "see also" links. The guide asks for Refund Policy, Tele-Health,
   * Programs and Shop to be linked "where contextually useful" but forbids
   * rewriting the answers, so the links are rendered as separate chips beneath
   * the answer rather than interpolated into the approved sentence.
   */
  links?: { label: string; labelFr: string; href: string }[];
}

export interface FaqSection {
  id: string;
  title: string;
  titleFr: string;
  items: FaqEntry[];
}

export const faqSections: FaqSection[] = [
  {
    id: "about",
    title: "About S19",
    titleFr: "À propos de S19",
    items: [
      {
        n: 1,
        question: "What is S19 Herbal Clinic, and is it based in America?",
        answer: [
          "S19 Herbal Clinic is a science-based herbal and integrative wellness clinic based in Bafoussam, Cameroon — not the United States. We combine individualized assessment with herbal medicine, nutrition and lifestyle support, health education, monitoring and follow-up. Patients living abroad can also access S19 through Tele-Health and, where available, international product delivery.",
        ],
        questionFr:
          "Qu'est-ce que la Clinique S19, et est-elle basée en Amérique ?",
        answerFr: [
          "La Clinique S19 est une clinique de phytothérapie et de bien-être intégratif fondée sur la science, basée à Bafoussam, au Cameroun — et non aux États-Unis. Nous associons une évaluation individualisée à la phytothérapie, au soutien nutritionnel et au mode de vie, à l'éducation à la santé, au suivi et au contrôle. Les patients qui vivent à l'étranger peuvent également accéder à S19 par la Télé-santé et, lorsque cela est possible, par la livraison internationale de produits.",
        ],
      },
      {
        n: 2,
        question:
          "Is S19 against hospitals, doctors or pharmaceutical medicine — and does S19 work with Medical Doctors?",
        answer: [
          "S19 is not anti-conventional medicine. Pharmaceutical medicines, surgery, hospital care and specialist treatment can be necessary and lifesaving. Where appropriate, S19 can work alongside medical doctors, specialists, laboratories and other healthcare professionals involved in a patient's care. We can review available medical reports, laboratory results, imaging and existing treatment plans while providing individualized herbal, nutrition, lifestyle and supportive care. If you are already under medical care, bring or send your reports and current medication list.",
        ],
        questionFr:
          "S19 est-elle contre les hôpitaux, les médecins ou la médecine pharmaceutique — et S19 travaille-t-elle avec les médecins ?",
        answerFr: [
          "S19 n'est pas contre la médecine conventionnelle. Les médicaments, la chirurgie, les soins hospitaliers et les traitements spécialisés peuvent être nécessaires et salvateurs. Lorsque cela est approprié, S19 peut travailler aux côtés des médecins, des spécialistes, des laboratoires et des autres professionnels de santé impliqués dans les soins d'un patient. Nous pouvons examiner les rapports médicaux disponibles, les résultats de laboratoire, l'imagerie et les plans de traitement existants, tout en fournissant des soins individualisés à base de plantes, de nutrition, de mode de vie et de soutien. Si vous êtes déjà suivi médicalement, apportez ou envoyez vos rapports ainsi que votre liste actuelle de médicaments.",
        ],
        links: [{ label: "Our Approach", labelFr: "Notre approche", href: "/about" }],
      },
      {
        n: 3,
        question: "Why should I consult S19 instead of simply buying herbs myself?",
        answer: [
          "Because herbal medicine should not be guesswork. Two people with the same diagnosis can have very different medical histories, medications, laboratory findings and health needs. S19 focuses on assessment, personalization, education and monitoring rather than simply selling a herb because someone mentions a disease.",
        ],
        questionFr:
          "Pourquoi consulter S19 plutôt que d'acheter simplement des plantes moi-même ?",
        answerFr: [
          "Parce que la phytothérapie ne doit pas relever du hasard. Deux personnes présentant le même diagnostic peuvent avoir des antécédents médicaux, des traitements, des résultats de laboratoire et des besoins de santé très différents. S19 met l'accent sur l'évaluation, la personnalisation, l'éducation et le suivi, plutôt que sur la simple vente d'une plante parce que quelqu'un mentionne une maladie.",
        ],
        links: [{ label: "Programs", labelFr: "Programmes", href: "/programs" }],
      },
    ],
  },

  {
    id: "consultation",
    title: "Consultation & Care",
    titleFr: "Consultation & Soins",
    items: [
      {
        n: 4,
        question: "How much is a consultation, and what happens after I book?",
        answer: [
          "The standard S19 consultation fee is 10,000 FCFA for an in-person or online consultation. Bring or send any medical reports, laboratory results, scans and medication information you already have. After reviewing your situation, S19 may recommend additional investigations and an individualized program involving herbal support, nutrition and lifestyle measures, health education, monitoring and follow-up. Treatment products, investigations, accommodation and delivery are separate where applicable.",
        ],
        questionFr:
          "Combien coûte une consultation, et que se passe-t-il après la réservation ?",
        answerFr: [
          "Le tarif standard d'une consultation S19 est de 10 000 FCFA, pour une consultation en personne ou en ligne. Apportez ou envoyez les rapports médicaux, les résultats de laboratoire, les scanners et les informations sur vos médicaments dont vous disposez déjà. Après l'examen de votre situation, S19 peut recommander des investigations complémentaires et un programme individualisé comprenant un soutien herbal, la nutrition et des mesures de mode de vie, l'éducation à la santé, le suivi et le contrôle. Les produits de traitement, les investigations, l'hébergement et la livraison sont facturés séparément, le cas échéant.",
        ],
        links: [
          { label: "Book a Consultation", labelFr: "Réserver une consultation", href: "/contact" },
          { label: "Programs", labelFr: "Programmes", href: "/programs" },
        ],
      },
      {
        n: 5,
        question: "Why does S19 sometimes request laboratory tests or imaging?",
        answer: [
          "Because we do not believe in treating blindly. Depending on your condition, relevant laboratory tests, imaging or other medical investigations may help us understand your health, identify important contributing factors, monitor progress and guide appropriate care. We do not require every patient to perform the same tests.",
        ],
        questionFr:
          "Pourquoi S19 demande-t-elle parfois des analyses de laboratoire ou une imagerie ?",
        answerFr: [
          "Parce que nous ne croyons pas traiter à l'aveugle. Selon votre état, des analyses de laboratoire, une imagerie ou d'autres investigations médicales pertinentes peuvent nous aider à comprendre votre santé, à identifier des facteurs contributifs importants, à suivre les progrès et à guider des soins appropriés. Nous n'exigeons pas que tous les patients réalisent les mêmes examens.",
        ],
      },
      {
        n: 6,
        question:
          "How do I know whether S19 is right for my condition, especially if I have already tried many treatments?",
        answer: [
          "You do not need to diagnose yourself or choose your own S19 program. Start with a consultation and share your previous reports, investigations, medications and treatment history. S19 will review your situation and explain whether we can provide meaningful support, whether further investigation is needed, or whether hospital or specialist care should come first. The first step is understanding your health, not blindly buying treatment.",
        ],
        questionFr:
          "Comment savoir si S19 convient à mon état, en particulier si j'ai déjà essayé de nombreux traitements ?",
        answerFr: [
          "Vous n'avez pas besoin de vous auto-diagnostiquer ni de choisir vous-même votre programme S19. Commencez par une consultation et partagez vos rapports, investigations, médicaments et antécédents de traitement. S19 examinera votre situation et expliquera si nous pouvons apporter un soutien utile, si des investigations complémentaires sont nécessaires, ou si des soins hospitaliers ou spécialisés doivent venir en premier. La première étape est de comprendre votre santé, pas d'acheter un traitement à l'aveugle.",
        ],
      },
      {
        n: 7,
        question: "How long does treatment take, and how quickly should I expect results?",
        answer: [
          "There is no responsible fixed timeline for every patient. Progress depends on the condition, severity, duration, individual biology, adherence, nutrition, lifestyle and other treatments. Some changes may appear earlier than others. S19 focuses on monitoring progress and adjusting care rather than promising a guaranteed result within a fixed period.",
        ],
        questionFr:
          "Combien de temps dure un traitement, et à quelle vitesse dois-je attendre des résultats ?",
        answerFr: [
          "Il n'existe pas de délai fixe et responsable qui s'applique à tous les patients. Les progrès dépendent de l'affection, de sa gravité, de sa durée, de la biologie individuelle, de l'observance, de la nutrition, du mode de vie et des autres traitements. Certains changements peuvent apparaître plus tôt que d'autres. S19 se concentre sur le suivi des progrès et l'ajustement des soins, plutôt que sur la promesse d'un résultat garanti dans un délai fixe.",
        ],
      },
      {
        n: 8,
        question: "Will S19 continue to follow me after I receive my treatment?",
        answer: [
          "Yes. Follow-up and monitoring are important parts of S19 care. Depending on your program, this may include communication about symptoms, measurements, nutrition and lifestyle adherence, laboratory follow-up, treatment progress, refills and appointments. Care is not intended to end simply because a patient receives a product.",
        ],
        questionFr:
          "S19 continuera-t-elle à me suivre après que j'aurai reçu mon traitement ?",
        answerFr: [
          "Oui. Le suivi et le contrôle sont des composantes importantes des soins S19. Selon votre programme, cela peut inclure des échanges sur les symptômes, les mesures, l'observance nutritionnelle et liée au mode de vie, le suivi de laboratoire, la progression du traitement, les renouvellements de produits et les rendez-vous. Les soins ne sont pas censés prendre fin simplement parce qu'un patient a reçu un produit.",
        ],
      },
    ],
  },

  {
    id: "safety",
    title: "Herbs, Medications & Safety",
    titleFr: "Plantes, Médicaments & Sécurité",
    items: [
      {
        n: 9,
        question: "Do S19 herbs really work, and are natural herbs automatically safe?",
        answer: [
          "Herbs contain biologically active compounds and can have meaningful effects, but results are not identical for everyone and natural does not automatically mean safe. Herbs may have contraindications, side effects or interactions with medicines. S19 therefore considers the patient's health history, current treatment and individual context rather than promising the same outcome for every person.",
        ],
        questionFr:
          "Les plantes S19 fonctionnent-elles vraiment, et les plantes naturelles sont-elles automatiquement sûres ?",
        answerFr: [
          "Les plantes contiennent des composés biologiquement actifs et peuvent avoir des effets significatifs, mais les résultats ne sont pas identiques pour tous et le naturel ne signifie pas automatiquement l'innocuité. Les plantes peuvent avoir des contre-indications, des effets secondaires ou des interactions avec les médicaments. S19 tient donc compte des antécédents de santé du patient, de son traitement actuel et de son contexte individuel, plutôt que de promettre le même résultat à chaque personne.",
        ],
      },
      {
        n: 10,
        question:
          "Can I use S19 herbs with my pharmaceutical medication, and can I stop my drugs when I improve?",
        answer: [
          "Complementary herbal support can sometimes be used alongside prescribed medication, but suitability depends on the herb, medication and patient. Tell S19 about all medicines and supplements you take. Medication requirements can sometimes change as a person's condition changes, but prescribed medication should not be independently stopped or reduced simply because you started herbs or obtained one good reading. Changes should be made with appropriate clinical supervision.",
        ],
        questionFr:
          "Puis-je utiliser les plantes S19 avec mon traitement pharmaceutique, et puis-je arrêter mes médicaments quand je m'améliore ?",
        answerFr: [
          "Un soutien herbal complémentaire peut parfois être utilisé avec un traitement prescrit, mais l'appropriation dépend de la plante, du médicament et du patient. Indiquez à S19 tous les médicaments et compléments que vous prenez. Les besoins en médicaments peuvent parfois évoluer avec l'état de la personne, mais un traitement prescrit ne doit être ni arrêté ni réduit de sa propre initiative au seul motif que vous avez commencé des plantes ou obtenu une bonne mesure. Toute modification doit se faire sous supervision clinique appropriée.",
        ],
      },
    ],
  },

  {
    id: "conditions",
    title: "Diabetes, Hypertension & Cancer",
    titleFr: "Diabète, Hypertension & Cancer",
    items: [
      {
        n: 11,
        question: "Can S19 reverse Type 2 diabetes or help with high blood pressure?",
        answer: [
          "S19 provides individualized support for Type 2 diabetes, metabolic health and hypertension through nutrition, lifestyle measures, appropriate herbal support, education and monitoring. Some patients can achieve substantial improvements in blood-glucose or blood-pressure control, and medication requirements may sometimes change under appropriate clinical supervision. However, no individual outcome should be guaranteed before assessment.",
        ],
        questionFr:
          "S19 peut-elle inverser le diabète de type 2 ou aider en cas d'hypertension artérielle ?",
        answerFr: [
          "S19 fournit un soutien individualisé pour le diabète de type 2, la santé métabolique et l'hypertension par la nutrition, les mesures de mode de vie, un soutien herbal approprié, l'éducation et le suivi. Certains patients peuvent obtenir des améliorations substantielles du contrôle de la glycémie ou de la tension artérielle, et les besoins en médicaments peuvent parfois évoluer sous supervision clinique appropriée. Toutefois, aucun résultat individuel ne doit être garanti avant l'évaluation.",
        ],
        links: [
          { label: "Diabetes Program", labelFr: "Programme diabète", href: "/programs#diabetes-metabolic" },
          { label: "Hypertension Program", labelFr: "Programme hypertension", href: "/programs#hypertension-cardiovascular" },
        ],
      },
      {
        n: 12,
        question: "Can S19 treat Type 1 diabetes without insulin?",
        answer: [
          "No. Type 1 diabetes requires insulin replacement. S19 may provide complementary nutrition, lifestyle, monitoring and supportive care, but herbal medicine must never be presented as a replacement for lifesaving insulin.",
        ],
        questionFr:
          "S19 peut-elle traiter le diabète de type 1 sans insuline ?",
        answerFr: [
          "Non. Le diabète de type 1 nécessite un remplacement par l'insuline. S19 peut fournir un soutien complémentaire en nutrition, en mode de vie, en suivi et en soins de support, mais la phytothérapie ne doit jamais être présentée comme un substitut à l'insuline qui sauve des vies.",
        ],
        links: [
          { label: "Diabetes Program", labelFr: "Programme diabète", href: "/programs#diabetes-metabolic" },
        ],
      },
      {
        n: 13,
        question: "Does S19 cure cancer?",
        answer: [
          "Cancer is complex, and no responsible healthcare provider should promise a cure before understanding the individual patient and their condition.",
          "S19 provides personalized integrative cancer support. We review the diagnosis, available medical reports, laboratory and imaging results, current or previous treatments, nutrition, lifestyle and overall health. An individualized program may include herbal medicine, nutrition and lifestyle support, health education, monitoring and other appropriate supportive measures.",
          "S19 support may be used alongside appropriate conventional cancer treatment. We do not advise patients to delay or abandon medically necessary oncology care.",
          "If you or a loved one has cancer, book a consultation and send the available medical reports so we can understand the case and explain how S19 may be able to support you.",
        ],
        questionFr: "S19 guérit-elle le cancer ?",
        answerFr: [
          "Le cancer est complexe, et aucun professionnel de santé responsable ne devrait promettre une guérison avant de comprendre le patient et son état.",
          "S19 fournit un soutien intégratif personnalisé contre le cancer. Nous examinons le diagnostic, les rapports médicaux disponibles, les résultats de laboratoire et d'imagerie, les traitements en cours ou antérieurs, la nutrition, le mode de vie et l'état de santé général. Un programme individualisé peut inclure la phytothérapie, le soutien nutritionnel et le mode de vie, l'éducation à la santé, le suivi et d'autres mesures de soutien appropriées.",
          "Le soutien S19 peut être utilisé en complément d'un traitement oncologique conventionnel approprié. Nous ne conseillons pas aux patients de retarder ou d'abandonner des soins d'oncologie médicalement nécessaires.",
          "Si vous, ou un proche, êtes atteint d'un cancer, prenez rendez-vous et envoyez les rapports médicaux disponibles afin que nous puissions comprendre le cas et expliquer comment S19 pourrait vous soutenir.",
        ],
        links: [
          {
            label: "Integrative Cancer Support",
            labelFr: "Soutien intégratif du cancer",
            href: "/programs#integrative-cancer-support",
          },
        ],
      },
      {
        n: 14,
        question:
          "Can I use S19 while receiving chemotherapy or if I am unsure about the hospital treatment recommended to me?",
        answer: [
          "Potentially, but cancer care must be individualized. Cancer medicines can interact with herbs and supplements, so S19 should know what treatment you are receiving and your oncology team should be informed about complementary products. If you are uncertain about surgery, chemotherapy, radiotherapy or another recommendation, S19 can discuss our supportive role, but we do not advise patients to delay or abandon medically necessary oncology care.",
        ],
        questionFr:
          "Puis-je utiliser S19 pendant une chimiothérapie, ou en cas de doute sur le traitement hospitalier qui m'est recommandé ?",
        answerFr: [
          "Éventuellement, mais les soins du cancer doivent être individualisés. Les médicaments anticancéreux peuvent interagir avec les plantes et les compléments ; S19 doit donc connaître le traitement que vous suivez, et votre équipe d'oncologie doit être informée des produits complémentaires. Si vous avez un doute sur une chirurgie, une chimiothérapie, une radiothérapie ou toute autre recommandation, S19 peut discuter de notre rôle de soutien, mais nous ne conseillons pas aux patients de retarder ou d'abandonner des soins d'oncologie médicalement nécessaires.",
        ],
      },
    ],
  },

  {
    id: "telehealth",
    title: "Tele-Health, International Patients & Travel",
    titleFr: "Télé-santé, Patients Internationaux & Voyage",
    items: [
      {
        n: 15,
        question: "Do I have to travel to Bafoussam, or can S19 help me from abroad?",
        answer: [
          "No. S19 offers Tele-Health consultations by phone and WhatsApp, allowing patients in Cameroon and abroad to begin their care remotely, send available medical reports and receive follow-up without immediately travelling.",
          "However, some international patients choose to travel to Cameroon for in-clinic consultation, closer monitoring and access to S19's in-clinic supportive therapies. S19 has received patients travelling from the United States and other countries, including patients seeking additional support for complex health concerns such as cancer, diabetes and Lyme disease.",
          "Patients travelling to Bafoussam may also request accommodation within the S19 clinic premises, subject to availability.",
          "If you live abroad, you can start by contacting S19 and sending your available medical records. We can then advise whether Tele-Health is suitable or whether an in-person visit may provide additional benefit for your situation.",
        ],
        questionFr:
          "Dois-je voyager à Bafoussam, ou S19 peut-elle m'aider depuis l'étranger ?",
        answerFr: [
          "Non. S19 propose des consultations de Télé-santé par téléphone et WhatsApp, ce qui permet aux patients au Cameroun et à l'étranger de commencer leurs soins à distance, d'envoyer les rapports médicaux disponibles et de bénéficier d'un suivi sans avoir à voyager immédiatement.",
          "Cependant, certains patients internationaux choisissent de voyager au Cameroun pour une consultation en clinique, un suivi plus rapproché et l'accès aux thérapies de soutien en clinique de S19. S19 a reçu des patients voyageant depuis les États-Unis et d'autres pays, y compris des patients recherchant un soutien supplémentaire pour des problèmes de santé complexes tels que le cancer, le diabète et la maladie de Lyme.",
          "Les patients qui voyagent à Bafoussam peuvent également demander un hébergement au sein des locaux de la clinique S19, selon les disponibilités.",
          "Si vous vivez à l'étranger, vous pouvez commencer par contacter S19 et en envoyer vos dossiers médicaux disponibles. Nous pourrons alors vous indiquer si la Télé-santé convient à votre situation ou si une visite en personne pourrait apporter un bénéfice supplémentaire.",
        ],
        links: [
          { label: "Tele-Health", labelFr: "Télé-santé", href: "/telehealth" },
          { label: "Patient Accommodation", labelFr: "Hébergement des patients", href: "/contact#accommodation" },
        ],
      },
      {
        n: 16,
        question: "Can I stay at S19 if I travel from another city?",
        answer: [
          "Yes, subject to availability. S19 offers simple, comfortable and affordable accommodation within the clinic premises for patients travelling to Bafoussam. Accommodation includes free Starlink internet and cable TV. Please confirm your appointment, room availability and accommodation charges before travelling.",
        ],
        questionFr:
          "Puis-je séjourner à S19 si je viens d'une autre ville ?",
        answerFr: [
          "Oui, selon les disponibilités. S19 propose un hébergement simple, confortable et abordable au sein de la clinique pour les patients qui voyagent à Bafoussam. L'hébergement comprend un internet Starlink gratuit et la télévision câblée. Veuillez confirmer votre rendez-vous, la disponibilité des chambres et les frais d'hébergement avant de voyager.",
        ],
        links: [
          { label: "Patient Accommodation", labelFr: "Hébergement des patients", href: "/contact#accommodation" },
        ],
      },
      {
        n: 17,
        question: "Does S19 deliver throughout Cameroon and internationally?",
        answer: [
          "Yes. Within Cameroon, delivery can be arranged to Bafoussam, Bamenda, Buea, Limbe, Bertoua, Kumba, Douala, Yaoundé and other cities. S19 also ships to supported international destinations including the USA, Canada, UK, UAE, selected African countries and other supported locations. Contact S19 to confirm availability and applicable shipping charges.",
        ],
        questionFr:
          "S19 livre-t-elle partout au Cameroun et à l'international ?",
        answerFr: [
          "Oui. Au Cameroun, la livraison peut être organisée à Bafoussam, Bamenda, Buéa, Limbé, Bertoua, Kumba, Douala, Yaoundé et dans d'autres villes. S19 expédie également vers des destinations internationales prises en charge, notamment les USA, le Canada, le Royaume-Uni, les Émirats arabes unis, certains pays africains et d'autres destinations prises en charge. Contactez S19 pour confirmer la disponibilité et les frais d'expédition applicables.",
        ],
        links: [
          { label: "Herbal Catalog", labelFr: "Catalogue de plantes", href: "/shop" },
          { label: "Clinic & Delivery", labelFr: "Clinique & livraison", href: "/location" },
        ],
      },
      {
        n: 18,
        question:
          "Can a family member contact S19 or send medical reports for a sick relative?",
        answer: [
          "Yes. A family member can make the initial contact, especially when the patient is elderly, unwell or living elsewhere. You may send available medical reports and explain the situation. Where possible, the patient should still participate in the consultation and consent to the sharing and discussion of their health information.",
        ],
        questionFr:
          "Un membre de la famille peut-il contacter S19 ou envoyer des rapports médicaux pour un proche malade ?",
        answerFr: [
          "Oui. Un membre de la famille peut effectuer le premier contact, en particulier lorsque le patient est âgé, malade ou vit ailleurs. Vous pouvez envoyer les rapports médicaux disponibles et expliquer la situation. Dans la mesure du possible, le patient doit tout de même participer à la consultation et consentir au partage et à la discussion de ses informations de santé.",
        ],
      },
    ],
  },

  {
    id: "working",
    title: "Working with S19",
    titleFr: "Travailler avec S19",
    items: [
      {
        n: 19,
        question:
          "I am a Medical Doctor, Nurse or other healthcare professional. Can I work or collaborate with S19, including from abroad?",
        answer: [
          "S19 is open to hearing from qualified healthcare professionals interested in contributing to our work, whether based in Cameroon or abroad. Depending on current needs, opportunities may involve clinical collaboration, nursing, patient follow-up, Tele-Health, health education, care coordination, administration or other professional support.",
          "Send a brief introduction, your professional qualifications, current country of residence, relevant experience and CV to S19. Submitting an application or proposal does not guarantee that a position or collaboration opportunity is currently available, but suitable candidates may be considered when opportunities arise.",
        ],
        questionFr:
          "Je suis médecin, infirmier ou autre professionnel de santé. Puis-je travailler ou collaborer avec S19, y compris depuis l'étranger ?",
        answerFr: [
          "S19 est ouverte à l'écoute des professionnels de santé qualifiésraimés à contribuer à notre travail, qu'ils soient basés au Cameroun ou à l'étranger. Selon les besoins actuels, les opportunités peuvent inclure la collaboration clinique, les soins infirmiers, le suivi des patients, la Télé-santé, l'éducation à la santé, la coordination des soins, l'administration ou tout autre soutien professionnel.",
          "Envoyez à S19 une brève présentation, vos qualifications professionnelles, votre pays de résidence actuel, votre expérience pertinente et votre CV. Le fait de soumettre une candidature ou une proposition ne garantit pas qu'un poste ou une opportunité de collaboration est actuellement disponible, mais les candidats appropriés peuvent être considérés lorsque des opportunités se présentent.",
        ],
        links: [{ label: "Contact S19", labelFr: "Contactez S19", href: "/contact" }],
      },
      {
        n: 20,
        question:
          "Can healthcare organizations, laboratories or professionals refer patients or partner with S19?",
        answer: [
          "Yes. S19 welcomes appropriate professional collaboration and patient referrals. Medical doctors, specialists, laboratories and other healthcare organizations interested in working with S19 can contact the clinic to discuss the proposed collaboration and how it may benefit patient care.",
        ],
        questionFr:
          "Les organisations de santé, laboratoires ou professionnels peuvent-ils orienter des patients ou partenariat avec S19 ?",
        answerFr: [
          "Oui. S19 accueille une collaboration professionnelle appropriée et les orientations de patients. Les médecins, les spécialistes, les laboratoires et les autres organisations de santé intéressés à travailler avec S19 peuvent contacter la clinique pour discuter de la collaboration proposée et de la manière dont elle pourrait bénéficier aux soins des patients.",
        ],
        links: [{ label: "Contact S19", labelFr: "Contactez S19", href: "/contact" }],
      },
    ],
  },

  {
    id: "ordering",
    title: "Ordering, Results & Urgent Care",
    titleFr: "Commandes, Résultats & Soins Urgents",
    items: [
      {
        n: 21,
        question:
          "Can I buy a treatment package without consultation, and what if I do not get the result I expected?",
        answer: [
          "Some general S19 products can be purchased directly, but individualized programs for complex or long-term conditions should begin with assessment. Individual responses vary, and a specific health outcome cannot be guaranteed. Not achieving an expected result does not by itself make a product or program refundable; damaged, defective, incorrectly supplied or otherwise non-conforming products are handled under the S19 Refund, Return & Exchange Policy.",
        ],
        questionFr:
          "Puis-je acheter un pack de traitement sans consultation, et que se passe-t-il si je n'obtiens pas le résultat attendu ?",
        answerFr: [
          "Certains produits S19 génériques peuvent être achetés directement, mais les programmes individualisés pour des affections complexes ou de longue durée doivent commencer par une évaluation. Les réponses individuelles varient et aucun résultat de santé précis ne peut être garanti. Le fait de ne pas obtenir le résultat attendu ne rend pas, à lui seul, un produit ou un programme remboursable ; les produits endommagés, défectueux, fournis incorrectement ou non conformes sont traités selon la politique de remboursement, de retour et d'échange de S19.",
        ],
        links: [
          { label: "Herbal Catalog", labelFr: "Catalogue de plantes", href: "/shop" },
          {
            label: "Refund, Return & Exchange Policy",
            labelFr: "Politique de remboursement, de retour et d'échange",
            href: "/refund-and-returns",
          },
        ],
      },
      {
        n: 22,
        question: "Can I contact S19 for a medical emergency?",
        answer: [
          "S19 is not an emergency medical service. Severe breathing difficulty, loss of consciousness, signs of stroke, severe chest pain, uncontrolled bleeding, severe dehydration, diabetic emergencies or other potentially life-threatening symptoms require urgent evaluation at an appropriate hospital or emergency facility. S19 supportive care should never delay emergency treatment.",
        ],
        questionFr:
          "Puis-je contacter S19 en cas d'urgence médicale ?",
        answerFr: [
          "S19 n'est pas un service médical d'urgence. Une difficulté respiratoire sévère, une perte de connaissance, des signes d'accident vasculaire cérébral, une douleur thoracique intense, un saignement incontrôlé, une déshydratation sévère, une urgence diabétique ou tout autre symptôme potentiellement vital nécessitent une évaluation urgente à l'hôpital ou dans un service d'urgence approprié. Les soins de soutien S19 ne doivent jamais retarder un traitement d'urgence.",
        ],
      },
    ],
  },
];

/**
 * The mid-page CTA, which the guide places after Question 14 — that is, between
 * the "Diabetes, Hypertension & Cancer" section and "Tele-Health". Returned
 * separately so `app/faq/page.tsx` cannot drift from the required position.
 */
export const FAQ_MID_CTA_AFTER = 14;

/** Flattened, in approved order. Used by the tests to assert the count of 22. */
export const faqEntries: FaqEntry[] = faqSections.flatMap((s) => s.items);