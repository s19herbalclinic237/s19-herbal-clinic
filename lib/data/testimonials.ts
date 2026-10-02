export interface Testimonial {
  name: string;
  city: string;
  country?: string;
  program: string;
  /** French translation of program (displayed on the French site when present). */
  programFr?: string;
  text: string;
  /** French translation of text (displayed on the French site when present). */
  textFr?: string;
  rating?: number;
}

export const testimonials: Testimonial[] = [
  {
    name: "Madeleine Tchatchou",
    city: "Bafoussam",
    country: "Cameroun",
    program: "Hypertension & Cardiovascular Wellness",
    programFr: "Hypertension et bien-être cardiovasculaire",
    text: "Doc, I don't even know how to say thank you enough. Before I came to S19, my blood pressure was always high and the conventional medicine was just managing me, not healing me. They looked at my whole life - my food, my stress, my sleep - and built something just for me. Today my readings are normal and I feel like myself again. Healing is truly ours.",
    textFr:
      "Doc, je ne sais même pas comment vous remercier assez. Avant de venir à S19, ma tension était toujours élevée et la médecine conventionnelle ne faisait que me gérer, sans me guérir. Ils ont examiné toute ma vie - mon alimentation, mon stress, mon sommeil - et construit quelque chose rien que pour moi. Aujourd'hui, mes chiffres sont normaux et je me sens redevenue moi-même. La guérison est vraiment à nous.",
    rating: 5,
  },
  {
    name: "Jean-Baptiste Nkeng",
    city: "Douala",
    country: "Cameroun",
    program: "Diabetes & Metabolic Health Support",
    programFr: "Soutien au diabète et à la santé métabolique",
    text: "I started taking the treatment and within a few weeks I just started feeling the difference - even my urine changed. My sugar levels are coming down and the doctor at the hospital confirmed things are improving. What I appreciate most is that they didn't just give me something and send me home. They explained what was happening in my body and why. That is what makes S19 different.",
    textFr:
      "J'ai commencé le traitement et en quelques semaines j'ai commencé à sentir la différence - même mes urines ont changé. Mon taux de sucre descend et le médecin de l'hôpital a confirmé que les choses s'améliorent. Ce que j'apprécie le plus, c'est qu'ils ne m'ont pas juste remis quelque chose en me renvoyant chez moi. Ils m'ont expliqué ce qui se passait dans mon corps et pourquoi. C'est ça qui rend S19 différent.",
    rating: 5,
  },
  {
    name: "Brigitte Fomekong",
    city: "Yaoundé",
    country: "Cameroun",
    program: "Women's Health - Uterine & Hormonal Support",
    programFr: "Santé de la femme - Soutien utérin et hormonal",
    text: "I had fibroids that were making my life unbearable - painful periods every month, heavy bleeding, I could not function. I came to S19 and they assessed me properly before giving me anything. Three months into the program, the pain reduced significantly and my last scan showed improvement. I am so grateful. You are truly God-sent to my life.",
    textFr:
      "J'avais des fibromes qui rendaient ma vie insupportable - des règles douloureuses chaque mois, des saignements abondants, je ne pouvais plus fonctionner. Je suis venue à S19 et ils m'ont évaluée correctement avant de me donner quoi que ce soit. Trois mois après le début du programme, la douleur a nettement diminué et mon dernier examen a montré une amélioration. Je suis tellement reconnaissante. Vous êtes vraiment envoyés par Dieu dans ma vie.",
    rating: 5,
  },
  {
    name: "Patrice Awono Mballa",
    city: "Buea",
    country: "Cameroun",
    program: "Digestive & Gut Health",
    programFr: "Santé digestive et intestinale",
    text: "Gastritis was something I had been suffering with for years. Doctors kept giving me antacids but nothing was resolving the root problem. S19 reviewed my history, asked about my nutrition and lifestyle, and built a program that actually targeted what was causing it. After two months I can eat properly again without pain. This is what real treatment looks like.",
    textFr:
      "La gastrite me faisait souffrir depuis des années. Les médecins me donnaient des antiacides sans jamais résoudre le problème de fond. S19 a examiné mon historique, m'a demandé mon alimentation et mon mode de vie, et a construit un programme qui ciblait vraiment la cause. Après deux mois, je peux à nouveau manger correctement sans douleur. C'est ça, un vrai traitement.",
    rating: 5,
  },
  {
    name: "Rosalie Nguefack",
    city: "Bafoussam",
    country: "Cameroun",
    program: "Liver & Metabolic Support",
    programFr: "Soutien hépatique et métabolique",
    text: "I am just from the hospital now and the doctor said everything is fine. Everything is gone. My liver enzymes are back to normal after the program they designed for me at S19. They combined herbal formulations with nutrition guidance and it made all the difference. I can never truly thank them enough for everything including the teachings. Thank you so very much.",
    textFr:
      "Je reviens juste de l'hôpital et le médecin a dit que tout va bien. Tout est parti. Mes enzymes hépatiques sont revenues à la normale grâce au programme qu'ils ont conçu pour moi à S19. Ils ont combiné des formulations à base de plantes avec des conseils nutritionnels et cela a fait toute la différence. Je ne pourrai jamais assez les remercier, y compris pour tous les enseignements. Merci infiniment.",
    rating: 5,
  },
  {
    name: "Hervé Djomgoue",
    city: "Ngaoundéré",
    country: "Cameroun",
    program: "Prostate & Men's Health",
    programFr: "Prostate et santé masculine",
    text: "At my age, the prostate problems were beginning to affect everything - sleep, daily life, my confidence. S19 did a proper assessment, looked at my test results and previous treatments, and explained clearly what was contributing to the problem. The herbal program they gave me alongside lifestyle changes has made a real difference. I feel like a younger man again.",
    textFr:
      "À mon âge, les problèmes de prostate commençaient à affecter tout - le sommeil, la vie quotidienne, ma confiance. S19 a fait une évaluation complète, a examiné mes résultats d'analyses et mes traitements précédents, et m'a expliqué clairement ce qui contribuait au problème. Le programme à base de plantes qu'ils m'ont donné avec les changements de mode de vie a fait une vraie différence. Je me sens redevenu plus jeune.",
    rating: 5,
  },
  {
    name: "Clarissa Fontem",
    city: "Houston, Texas",
    country: "USA",
    program: "Viral Wellness Program - International",
    programFr: "Programme bien-être viral - International",
    text: "I did my test today and it came back negative. I can never truly thank you enough for everything including your teachings. I have been following the full 60-day protocol and the difference has been beyond what I imagined. My friend will send the receipts as a small token of my gratitude. What S19 does is not just selling products - they walk with you through the whole process. Thanks boo.",
    textFr:
      "J'ai fait mon test aujourd'hui et il est revenu négatif. Je ne pourrai jamais assez vous remercier, y compris pour vos enseignements. Je suis le protocole complet de 60 jours et la différence a dépassé ce que j'imaginais. Mon amie enverra les reçus comme petit témoignage de ma gratitude. Ce que fait S19, ce n'est pas juste vendre des produits - ils vous accompagnent tout au long du processus. Merci beaucoup.",
    rating: 5,
  },
  {
    name: "Darnell Kamga-Williams",
    city: "Atlanta, Georgia",
    country: "USA",
    program: "Viral Wellness Program - International Delivery",
    programFr: "Programme bien-être viral - Livraison internationale",
    text: "I'm a living testimony for this and I thank God every day for finding S19 on social media. My wife was returning from deployment and needed the treatment urgently - they shipped it to us in the USA within 5 days and she started her program right away. We are both on the other side now. You gave us hope again. Healing is ours.",
    textFr:
      "Je suis un témoignage vivant et je remercie Dieu chaque jour d'avoir trouvé S19 sur les réseaux sociaux. Ma femme rentrait de déploiement et avait besoin du traitement de toute urgence - ils nous l'ont expédié aux USA en 5 jours et elle a commencé son programme immédiatement. Nous sommes tous les deux de l'autre côté maintenant. Vous nous avez redonné espoir. La guérison est à nous.",
    rating: 5,
  },
  {
    name: "Mme Tracey Ngwa",
    city: "Buea",
    country: "Cameroun",
    program: "Digestive & Gut Health - Chronic Wellness Program",
    programFr: "Santé digestive et intestinale - Programme bien-être chronique",
    text: "Boo I won't lie, I was skeptical at first because I had tried so many things. But S19 is different - they actually assessed me before giving me anything. They looked at my lab results, my history, everything. The program they designed was specific to me, not some generic thing. After two months my digestion issues that I had been carrying for years are gone. I am so grateful I found them.",
    textFr:
      "Je ne vais pas mentir, j'étais sceptique au début parce que j'avais essayé tellement de choses. Mais S19 est différent - ils m'ont réellement évaluée avant de me donner quoi que ce soit. Ils ont regardé mes résultats de laboratoire, mon historique, tout. Le programme qu'ils ont conçu était spécifique à moi, pas quelque chose de générique. Après deux mois, mes problèmes de digestion que je traînais depuis des années ont disparu. Je suis tellement reconnaissante de les avoir trouvés.",
    rating: 5,
  },
  {
    name: "Papa Tanko",
    city: "Bamenda",
    country: "Cameroun",
    program: "Diabetes & Metabolic Health Support",
    programFr: "Soutien au diabète et à la santé métabolique",
    text: "Those who took or are currently taking the weight loss and metabolic programs at S19 - I am a living testimony for you. My blood sugar was out of control and conventional medicine was just managing the numbers without addressing why. S19 investigated my insulin resistance, my nutrition, my lifestyle. Six months later my HbA1c has improved significantly and I feel energetic again. This is science-based care that actually works.",
    textFr:
      "Ceux qui ont pris ou prennent actuellement les programmes de perte de poids et métaboliques à S19 - je suis un témoignage vivant pour vous. Ma glycémie était incontrôlable et la médecine conventionnelle gérait juste les chiffres sans s'attaquer au pourquoi. S19 a investigué ma résistance à l'insuline, ma nutrition, mon mode de vie. Six mois plus tard, mon HbA1c s'est nettement amélioré et je me sens plein d'énergie. C'est un soin fondé sur la science qui fonctionne vraiment.",
    rating: 5,
  },
  {
    name: "Alice Fotso",
    city: "Bafoussam",
    country: "Cameroun",
    program: "S19 Oral Miracle - Natural Oral Care",
    programFr: "S19 Merveille buccale - Soins bucco-dentaires naturels",
    text: "I really testify ooo! Since I bought that natural toothpaste from your clinic, my teeth are getting brighter. I used to always find blood in my mouth when brushing, but since I started using the natural toothpaste I haven't noticed it again.",
    textFr:
      "Je témoigne vraiment ooo ! Depuis que j'ai acheté cette pâte dentifrice naturelle de votre clinique, mes dents deviennent plus blanches. Je trouvais toujours du sang dans ma bouche en brossant, mais depuis que j'utilise la pâte naturelle, je n'ai plus remarqué ça.",
    rating: 5,
  },
  {
    name: "Steve Mbarga",
    city: "Douala",
    country: "Cameroun",
    program: "Oral Health & Toothache Relief",
    programFr: "Santé bucco-dentaire et soulagement des maux de dents",
    text: "Good evening Doc. Thanks so much for reaching out! I'm fine now, strong, no toothache again! I've been brushing twice daily after meals and before bed just as you instructed.",
    textFr:
      "Bonjour Doc. Merci beaucoup d'avoir pris des nouvelles ! Je vais bien maintenant, fort, plus de maux de dents ! Je me brosse deux fois par jour après les repas et avant de dormir comme vous l'avez indiqué.",
    rating: 4,
  },
  {
    name: "Mama Rachel",
    city: "Kumba",
    country: "Cameroun",
    program: "Urinary Health & Pain Relief",
    programFr: "Santé urinaire et soulagement de la douleur",
    text: "Doctor, I want to thank you again for this testimony. Remember I told you I had been suffering with a burning sensation when I pee for almost 6 years? For one month now I can assure you I don't feel it anymore since taking your medication. The worst part was always when I got dehydrated - the burning got worse. But today, even if I don't drink enough water during the day, I don't feel it again. Doctor, thank you for helping me heal. I am an ambassador of S19 forever!",
    textFr:
      "Docteur, je veux vous remercier encore pour ce témoignage. Vous vous souvenez que je vous avais dit que je souffrais d'une sensation de brûlure en urinant depuis presque 6 ans ? Depuis un mois, je peux vous assurer que je ne la ressens plus grâce à votre médicament. Le pire, c'était quand j'étais déshydratée - la brûlure empirait. Mais aujourd'hui, même si je ne bois pas assez d'eau dans la journée, je ne la ressens plus. Docteur, merci de m'avoir aidée à guérir. Je suis une ambassadrice de S19 pour toujours !",
    rating: 5,
  },
  {
    name: "Nadine Kenfack",
    city: "Yaoundé",
    country: "Cameroun",
    program: "Women's Health - Uterine & Reproductive Care",
    programFr: "Santé de la femme - Soins utérins et reproductifs",
    text: "Now that you are sharing testimonies, let me share my own small one. Remember those cancer tea I bought from you years back on Snapchat? I was diagnosed with precancerous cervical cells and my doctor advised an operation to remove the bad cells, but I refused and tried your Cancer tea instead. I drank all the package you sent for some months... a few months later I stopped feeling the pain. I didn't go back immediately - I waited about a year, then went for a check-up and there was no sign of any problem with my uterus. The doctor asked me to redo it after 6 months and it still shows that it is cleared. So this is my official thank you - you may never truly know the full impact your teachings have had on my life. I still give you flowers!",
    textFr:
      "Maintenant que vous partagez des témoignages, laissez-moi partager le mien. Vous vous souvenez de ce thé anticancéreux que j'avais acheté chez vous il y a des années sur Snapchat ? J'avais été diagnostiquée avec des cellules cervicales précancéreuses et mon médecin conseillait une opération pour retirer les mauvaises cellules, mais j'ai refusé et essayé votre thé anticancéreux à la place. J'ai bu tout le paquet que vous m'avez envoyé pendant plusieurs mois... quelques mois plus tard, j'ai arrêté de ressentir la douleur. Je n'y suis pas retournée tout de suite - j'ai attendu environ un an, puis je suis allée faire un contrôle et il n'y avait aucun signe de problème à mon utérus. Le médecin m'a demandé de refaire le test après 6 mois et il montre toujours que c'est clarifié. Alors voici mon remerciement officiel - vous ne saurez peut-être jamais vraiment l'impact de vos enseignements sur ma vie. Je vous envoie encore des fleurs !",
    rating: 5,
  },
  {
    name: "Njuh Fuh",
    city: "Limbe",
    country: "Cameroun",
    program: "Integrative Treatment & Pain Relief",
    programFr: "Traitement intégratif et soulagement de la douleur",
    text: "Good evening Doc. I just want to say thank you! You know your thing - the medication is working for me. Gladness is also doing well, her pains are gone. Your medications work magically.",
    textFr:
      "Bonjour Doc. Je veux juste dire merci ! Vous connaissez votre affaire - le médicament fonctionne pour moi. Gladness va aussi bien, ses douleurs ont disparu. Vos médicaments agissent comme par magie.",
    rating: 5,
  },
  {
    name: "Kelly",
    city: "Maryland",
    country: "USA",
    // The program label is our metadata, so it follows the programs-page
    // rename. The testimonial body below is Kelly's own wording and is left
    // exactly as given: rewriting a patient's words to match new positioning
    // would make the disclaimer on the testimonial section untrue.
    program: "Liver & Metabolic Health",
    programFr: "Santé hépatique et métabolique",
    text: "That Detox is honestly the best thing I've given myself in 2026, hands down! I've been doing the detox routine and I can see the results directly. It really is the secret not just to healing, but to prevention.",
    textFr:
      "Cette détox est honnêtement la meilleure chose que je me suis offerte en 2026, sans hésiter ! Je fais la routine de détox et je vois les résultats directement. C'est vraiment le secret non seulement pour guérir, mais aussi pour prévenir.",
    rating: 5,
  },
  {
    name: "Sherill",
    city: "Minnesota",
    country: "USA",
    program: "Wellness Essentials & Long-Term Relief",
    programFr: "Essentiels bien-être et soulagement à long terme",
    text: "And her eyes are getting better - something that has been bothering her for years! Healing is truly possible.",
    textFr:
      "Et ses yeux vont de mieux en mieux - quelque chose qui la gênait depuis des années ! La guérison est vraiment possible.",
    rating: 4,
  },
  {
    name: "Marthe Djoumo",
    city: "Bafoussam",
    country: "Cameroun",
    program: "S19 Oral Miracle - Dental Wellness",
    programFr: "S19 Merveille buccale - Bien-être dentaire",
    text: "My mom really likes the toothpaste, and she gave positive feedback after I spoke with her today. Her tooth pain has drastically decreased and there is no more gum bleeding!",
    textFr:
      "Ma maman aime beaucoup la pâte dentifrice et elle m'a donné un retour positif après que je lui ai parlé aujourd'hui. Sa douleur dentaire a drastiquement diminué et il n'y a plus de saignement des gencives !",
    rating: 5,
  },
  {
    name: "Enow Magnificat",
    city: "Yaoundé",
    country: "Cameroun",
    program: "Oral Health & Gum Care",
    programFr: "Santé bucco-dentaire et soin des gencives",
    text: "Since I started taking the S19 oral care, I haven't suffered from inflammation of my gums since the beginning of this year. I should have shared this miracle with you earlier. Please add another pack for me!",
    textFr:
      "Depuis que j'ai commencé les soins bucco-dentaires S19, je n'ai plus souffert d'inflammation des gencives depuis le début de cette année. J'aurais dû partager ce miracle plus tôt avec vous. Ajoutez-moi un autre paquet, s'il vous plaît !",
    rating: 5,
  },
  {
    name: "Joseph Kamdem",
    city: "Bafoussam",
    country: "Cameroun",
    program: "Liver & Metabolic Health",
    programFr: "Santé hépatique et métabolique",
    text: "Thank you for the detox Doc! Just before I detoxed, I was having difficulties sleeping which resulted in stress during the day. But last night I slept like a baby, and I feel my strength renewed!",
    textFr:
      "Merci pour la détox Doc ! Juste avant la détox, j'avais des difficultés à dormir ce qui entraînait du stress pendant la journée. Mais hier nuit, j'ai dormi comme un bébé et je sens ma force revenue !",
    rating: 5,
  },
  {
    name: "Ebong Sone",
    city: "Bamenda",
    country: "Cameroun",
    program: "Liver & Metabolic Health",
    programFr: "Santé hépatique et métabolique",
    text: "Good morning Dr. I'm done with the detox program and those stones are coming out. I can really feel the results and the improvement in my body system.",
    textFr:
      "Bonjour Docteur. J'ai terminé le programme de détox et ces pierres sortent. Je ressens vraiment les résultats et l'amélioration de mon organisme.",
    rating: 5,
  },
  {
    name: "Marcus Johnson",
    city: "Dallas, Texas",
    country: "USA",
    program: "Holistic Care & Lifestyle Coaching",
    programFr: "Soins holistiques et coaching de mode de vie",
    text: "Thanks - I have never seen a doctor like you! You take the time to analyze everything and explain how even mild problems can be corrected with natural herbs and the right food.",
    textFr:
      "Merci - je n'ai jamais vu un médecin comme vous ! Vous prenez le temps d'analyser tout et d'expliquer comment même les problèmes légers peuvent être corrigés avec des herbes naturelles et la bonne alimentation.",
    rating: 5,
  },
];