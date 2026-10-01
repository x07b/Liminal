export const studio = {
  name: "LIMINAL",
  descriptor: "Creative Production House",
  email: "itsazizsaidi@gmail.com",
  location: "Tunisie",
  founder: "Aziz Saidi",
  // Set the real domain and social accounts here when confirmed.
  domain: null,
  instagram: null,
};

const copy = (fr, en, ar) => ({ fr, en, ar });

export const projects = [
  {
    slug: "le-geste",
    title: "Le geste.",
    category: "Image",
    number: "01",
    type: "Exploration visuelle · Image générée par IA",
    tags: "DIRECTION VISUELLE / EXPLORATION IA",
    visual: "editorial",
    description: "Un mouvement. Une présence. Quelque chose reste.",
    context:
      "Une exploration créée pour l’univers visuel de LIMINAL. Le corps, presque invisible, devient le point de départ d’une image : un geste, un tissu et la lumière.",
    intention:
      "Faire ressentir avant d’expliquer. Le contraste entre une architecture immobile et un tissu en mouvement raconte cet espace entre ce que l’on voit et ce que l’on imagine.",
    execution:
      "Une étude d’image assistée par IA, construite autour d’une palette terre cuite, de textures tactiles et d’un cadrage cinématique. Il s’agit d’une image conceptuelle, pas d’un film ou d’une campagne client.",
    deliverables: [
      "Image éditoriale",
      "Déclinaisons de cadrage",
      "Direction chromatique",
    ],
    credit: "Étude conceptuelle pour LIMINAL · Image générée avec ImageGen.",
  },
  {
    slug: "resonance",
    title: "Résonance.",
    category: "Identité",
    number: "02",
    type: "Étude graphique · Concept de marque",
    tags: "EXPRESSION GRAPHIQUE / MOUVEMENT",
    visual: "resonance",
    description: "Une idée prend forme. Puis elle résonne.",
    context:
      "Une étude graphique originale autour du sens de LIMINAL : le passage de l’intention à l’expression, puis de l’expression à la perception.",
    intention:
      "Créer une présence avec très peu. Des lignes qui se rapprochent, s’éloignent et dessinent un espace commun. Un geste abstrait, ouvert à l’interprétation.",
    execution:
      "Un système vectoriel léger, composé de contours organiques et d’une typographie franche. Le mouvement est construit dans le navigateur et respecte les préférences de réduction des animations.",
    deliverables: [
      "Composition vectorielle",
      "Étude de mouvement",
      "Palette de marque",
    ],
    credit:
      "Exploration graphique réalisée pour ce site · Aucun commanditaire externe.",
  },
];

export const services = [
  {
    title: copy("Clarté créative", "Creative clarity", "وضوح إبداعي"),
    subtitle: copy(
      "Trouver la phrase avant le cadre.",
      "Find the sentence before the frame.",
      "نجد العبارة قبل الكادر.",
    ),
    text: copy(
      "Nous transformons l’objectif en territoire créatif : une tension juste, une voix reconnaissable et des concepts prêts à produire.",
      "We turn the objective into creative territory: the right tension, a recognisable voice and concepts ready to produce.",
      "نحوّل الهدف إلى مساحة إبداعية: توتر مناسب وصوت واضح ومفاهيم جاهزة للإنتاج.",
    ),
    tags: [
      copy("Direction créative", "Creative direction", "توجيه إبداعي"),
      copy("Concepts & scripts", "Concepts & scripts", "مفاهيم وسيناريوهات"),
      copy("Ligne éditoriale", "Editorial direction", "خط تحريري"),
    ],
  },
  {
    title: copy("Reels & production", "Reels & production", "ريلز وإنتاج"),
    subtitle: copy(
      "Quand le plan devient présence.",
      "When the shot becomes presence.",
      "حين تتحول اللقطة إلى حضور.",
    ),
    text: copy(
      "Casting, décor, lumière, rythme : nous préparons le tournage pour capturer juste, puis décliner sans diluer.",
      "Casting, location, light, rhythm: we prepare the shoot to capture the right moment, then adapt it without dilution.",
      "الكاستينغ والمكان والضوء والإيقاع: نُحكم التحضير لنلتقط اللحظة الصحيحة ثم نكيّفها دون أن تفقد معناها.",
    ),
    tags: [
      copy("Préproduction", "Pre-production", "ما قبل الإنتاج"),
      copy("Tournage", "Filming", "تصوير"),
      copy("Formats sociaux", "Social formats", "صيغ اجتماعية"),
    ],
  },
  {
    title: copy("Montage & sensation", "Editing & feeling", "مونتاج وإحساس"),
    subtitle: copy(
      "Le rythme écrit ce que l’image ne dit pas.",
      "Rhythm writes what the image cannot say.",
      "الإيقاع يكتب ما لا تقوله الصورة.",
    ),
    text: copy(
      "Au montage, les silences, la couleur, le mouvement et le son composent une sensation précise — celle que le public emporte.",
      "In the edit, silence, colour, motion and sound shape one precise feeling — the one the audience takes away.",
      "في المونتاج، يصنع الصمت واللون والحركة والصوت إحساساً دقيقاً يحمله الجمهور معه.",
    ),
    tags: [
      copy("Postproduction", "Post-production", "ما بعد الإنتاج"),
      copy("Motion design", "Motion design", "تصميم الحركة"),
      copy("Sound design", "Sound design", "تصميم الصوت"),
    ],
  },
  {
    title: copy("Création & IA", "Creation & AI", "إبداع وذكاء اصطناعي"),
    subtitle: copy(
      "Aller plus loin, sans perdre la main.",
      "Go further without losing the human hand.",
      "نذهب أبعد دون أن نفقد اللمسة البشرية.",
    ),
    text: copy(
      "Nous utilisons l’IA pour ouvrir des pistes, prévisualiser et gagner du temps. La sélection, le goût et la décision restent humains.",
      "We use AI to open paths, previsualise and save time. Selection, taste and decisions remain human.",
      "نستخدم الذكاء الاصطناعي لفتح مسارات جديدة والتصور المسبق وكسب الوقت. الاختيار والذوق والقرار تبقى بشرية.",
    ),
    tags: [
      copy("Exploration visuelle", "Visual exploration", "استكشاف بصري"),
      copy("Prévisualisation", "Previsualisation", "تصور مسبق"),
      copy("Traitements créatifs", "Creative treatments", "معالجات إبداعية"),
    ],
  },
];

export const steps = [
  [
    copy("Trouver le nord.", "Find north.", "نحدد الاتجاه."),
    copy(
      "On écoute ce qui vous amène, ce qui bloque et ce qui doit changer. Le brief devient une direction que chacun peut voir.",
      "We listen to what brings you here, what is stuck and what needs to change. The brief becomes a direction everyone can see.",
      "نستمع لما أتى بكم وما يعرقل وما يجب أن يتغير. ويتحول الملخص إلى اتجاه يراه الجميع.",
    ),
  ],
  [
    copy("Écrire l’élan.", "Write the momentum.", "نكتب الزخم."),
    copy(
      "Concept, script, références et choix visuels s’alignent. Vous validez une intention concrète, pas une promesse abstraite.",
      "Concept, script, references and visual choices align. You approve a concrete intention, not an abstract promise.",
      "ننسّق المفهوم والسيناريو والمراجع والاختيارات البصرية. فتوافقون على نية ملموسة لا على وعد غامض.",
    ),
  ],
  [
    copy("Faire exister.", "Make it real.", "نجعله واقعاً."),
    copy(
      "La production se déroule avec un cap partagé. Nous gérons l’exécution et vous gardons dans la boucle aux décisions utiles.",
      "Production moves with a shared direction. We handle execution and keep you in the loop for the decisions that matter.",
      "يمضي الإنتاج باتجاه مشترك. نتولى التنفيذ ونبقيكم في الصورة عند القرارات المهمة.",
    ),
  ],
  [
    copy("Finir juste.", "Finish right.", "ننهي بدقة."),
    copy(
      "Chaque format est revu, nommé et prêt à publier. La livraison clôt le projet proprement et prépare ce qui vient après.",
      "Every format is reviewed, named and ready to publish. Delivery closes the project cleanly and prepares what comes next.",
      "تُراجع كل صيغة وتُسمّى وتصبح جاهزة للنشر. يغلق التسليم المشروع بوضوح ويمهّد لما بعده.",
    ),
  ],
];

export const faqs = [
  [
    "Je n’ai pas encore d’idée précise. On commence où ?",
    "Par une conversation. Nous clarifions votre objectif, votre audience et ce que vous souhaitez faire ressentir. La recherche de concept peut faire partie de la mission.",
  ],
  [
    "Comment se déroule un projet ?",
    "Nous définissons ensemble le brief, les livrables, les étapes et les validations. Après accord sur la direction créative, nous passons à la production, puis aux retours et à la livraison.",
  ],
  [
    "Quelle place prend l’intelligence artificielle ?",
    "Celle d’un outil au service de l’idée. Elle peut aider à explorer une direction, prévisualiser un concept ou créer un traitement visuel. Son usage dépend du projet et est discuté avec vous.",
  ],
  [
    "Quels formats vais-je recevoir ?",
    "Les formats sont définis dans le périmètre du projet : reels verticaux, déclinaisons pour les réseaux, sous-titres ou autres exports. Vous savez ce qui est prévu avant le début de la production.",
  ],
  [
    "Quel budget et quel délai prévoir ?",
    "Ils dépendent du concept, du tournage, du nombre de contenus et des traitements nécessaires. Après un premier échange, nous vous proposons un périmètre et un planning adaptés.",
  ],
];
