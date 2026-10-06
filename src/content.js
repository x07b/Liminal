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

export {
  servicePillars as services,
  productionSteps as steps,
} from "./business-content.js";
