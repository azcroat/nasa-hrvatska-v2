export const CULTURAL_FACTS = [
  { emoji: '🏖️', fact: 'Croatia has over 1,200 islands — more than any country in the Mediterranean.' },
  { emoji: '🎨', fact: 'The necktie (kravata) was invented by Croatian soldiers in the 17th century — "cravat" comes from "Croat".' },
  { emoji: '⚽', fact: 'Croatia finished 2nd at the 2018 World Cup with a squad smaller than most club teams.' },
  { emoji: '🔬', fact: 'Nikola Tesla was born in Smiljan, Croatia (then the Austrian Empire) in 1856.' },
  { emoji: '🌊', fact: 'The Adriatic Sea off Croatia is so clear you can see the bottom at 40 metres depth.' },
  { emoji: '🏰', fact: 'Dubrovnik\'s Old City walls, built in the 13th century, have never been breached.' },
  { emoji: '🍷', fact: 'Zinfandel wine originated in Croatia — DNA testing proved it\'s identical to the Crljenak Kaštelanski grape.' },
  { emoji: '🖊️', fact: 'The mechanical pencil was invented by Slavoljub Penkala, a Croatian-Czech inventor, in 1906.' },
  { emoji: '🎭', fact: 'The word "dalmatian" (the dog breed) comes from Dalmatia, the Croatian coastal region.' },
  { emoji: '🌍', fact: 'Croatia joined the EU in 2013 and adopted the Euro in 2023 — one of the newest Eurozone members.' },
  { emoji: '🎵', fact: 'Klapa — Croatian a cappella singing — is on UNESCO\'s Intangible Cultural Heritage list.' },
  { emoji: '🏆', fact: 'With 4 million people, Croatia produces more top-10 tennis players per capita than any other country.' },
  { emoji: '🌺', fact: 'The Plitvice Lakes cascade through 16 terraced lakes connected by waterfalls and wooden walkways.' },
  { emoji: '🍕', fact: 'Paški sir (Pag cheese) is so unique to Pag Island\'s salt-wind-grazed sheep that it has EU Protected Designation of Origin.' },
  { emoji: '🎯', fact: 'The Sinjska alka — a medieval knights\' tournament in Sinj — has been held every August since 1715.' },
  { emoji: '⚓', fact: 'Marco Polo, the famous explorer, was likely born on the island of Korčula, Croatia.' },
  { emoji: '🦁', fact: 'Croatia\'s coat of arms (the šahovnica — the red-and-white checkerboard) is one of the oldest national symbols in Europe.' },
  { emoji: '🌿', fact: 'Lavender from the island of Hvar is considered among the finest in the world and has been cultivated there for centuries.' },
  { emoji: '🔭', fact: 'The Ruđer Bošković Institute in Zagreb is one of Europe\'s leading physics and chemistry research centres.' },
  { emoji: '🎪', fact: 'Croatian lace-making (čipkarstvo) from Lepoglava and Pag is also on UNESCO\'s Intangible Cultural Heritage list.' },
];

export function getDailyFact() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  return CULTURAL_FACTS[dayOfYear % CULTURAL_FACTS.length];
}
