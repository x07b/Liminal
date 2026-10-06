export const partnerExamples = [
  { name: 'FORMA', logo: '/images/partner-forma.svg' },
  { name: 'Atelier N.', logo: '/images/partner-atelier.svg' },
  { name: 'FIELDWORK', logo: '/images/partner-fieldwork.svg' },
  { name: 'orbit', logo: '/images/partner-orbit.svg' },
  { name: 'STILL', logo: '/images/partner-still.svg' },
  { name: 'maison', logo: '/images/partner-maison.svg' },
].map((p, order) => ({ ...p, order, published: true, example: true }));

export const testimonialExamples = [
  { name: 'Nadia Mansour', role: 'Brand Director', company: 'FORMA',
    quote: 'Nous sommes arrivés avec une intuition. Nous sommes repartis avec un univers, des contenus prêts à publier et du temps pour la suite.',
    avatar: '/images/testimonial-nadia.png', logo: '/images/partner-forma.svg', signature: 'Nadia M.', published: true, example: true },
  { name: 'Sami Ben Salem', role: 'Founder', company: 'Atelier N.',
    quote: 'Le bon rythme, les bonnes questions, puis cette sensation de voir enfin notre marque comme nous l’imaginions.',
    avatar: '/images/testimonial-sami.png', logo: '/images/partner-atelier.svg', signature: 'Sami B.', published: true, example: true },
];
