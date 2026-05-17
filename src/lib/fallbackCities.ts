// src/lib/fallbackCities.ts
//
// Curated 12-city fallback pool — used by CityOfDayCard (home) and
// CityOfDayScreen (full profile) when content.CROATIAN_CITIES from the
// server isn't available yet (offline, stale cache, hydration race).
//
// Names + regions + brief intros are public knowledge — NOT curriculum IP.
// Safe to bundle client-side as a guaranteed-render fallback.

export interface FallbackCity {
  name: string;
  region: string;
  tagline: string;
  intro: string;
  icon: string;
  color: string;
}

export const FALLBACK_CITIES: FallbackCity[] = [
  {
    name: 'Zagreb',
    region: 'Continental Croatia',
    tagline: 'The capital and cultural heart of Croatia.',
    intro:
      'Zagreb is the political, cultural, and academic capital of Croatia. Founded in the 11th century, it combines Austro-Hungarian Baroque architecture with a vibrant café culture and Croatia’s richest concentration of museums.',
    icon: '🏛️',
    color: '#1e3a8a',
  },
  {
    name: 'Split',
    region: 'Dalmatia',
    tagline: "Diocletian's palace and Adriatic gateway.",
    intro:
      'Split is the second-largest city in Croatia and the largest in Dalmatia. The old town is built directly inside the 4th-century Roman palace of Emperor Diocletian — a living UNESCO World Heritage site.',
    icon: '🏖️',
    color: '#0e7490',
  },
  {
    name: 'Dubrovnik',
    region: 'Dalmatia',
    tagline: 'Pearl of the Adriatic — UNESCO World Heritage.',
    intro:
      'Dubrovnik is a fortified medieval city-state on the southern Dalmatian coast. Its walls, monasteries, and marble streets earned it the nickname "Pearl of the Adriatic" — and global fame as King’s Landing in Game of Thrones.',
    icon: '🏰',
    color: '#b91c1c',
  },
  {
    name: 'Rijeka',
    region: 'Kvarner',
    tagline: 'Croatia’s third-largest city and major port.',
    intro:
      'Rijeka is Croatia’s principal seaport and a multi-ethnic crossroads where Croatian, Italian, and Habsburg influences meet. It was the European Capital of Culture in 2020.',
    icon: '⚓',
    color: '#0d9488',
  },
  {
    name: 'Zadar',
    region: 'Dalmatia',
    tagline: 'Sea Organ and the most beautiful sunset in the world.',
    intro:
      'Zadar is famous for two seafront installations — the Sea Organ (a stone instrument played by the waves) and the Greeting to the Sun (a solar light display). Alfred Hitchcock called its sunset "the most beautiful in the world".',
    icon: '🌅',
    color: '#ea580c',
  },
  {
    name: 'Pula',
    region: 'Istria',
    tagline: 'Roman amphitheater older than the Colosseum.',
    intro:
      'Pula’s 1st-century Roman amphitheater is one of the six largest surviving from antiquity and the only one with all four side towers fully intact. The city anchors the southern Istrian peninsula.',
    icon: '🏟️',
    color: '#a16207',
  },
  {
    name: 'Osijek',
    region: 'Slavonia',
    tagline: 'Baroque fortress city on the Drava river.',
    intro:
      'Osijek is Slavonia’s capital and a Baroque-era stronghold on the Drava river. Tvrđa, its 18th-century fortress quarter, is one of the largest preserved Baroque urban ensembles in Europe.',
    icon: '🏞️',
    color: '#15803d',
  },
  {
    name: 'Šibenik',
    region: 'Dalmatia',
    tagline: 'Cathedral of St. James — Renaissance masterpiece.',
    intro:
      'Šibenik is the oldest Croatian city on the Adriatic founded by Croats themselves. The Cathedral of St. James, built entirely of stone without binding mortar, is a UNESCO World Heritage Site.',
    icon: '⛪',
    color: '#7c3aed',
  },
  {
    name: 'Trogir',
    region: 'Dalmatia',
    tagline: 'Medieval island town, UNESCO-listed.',
    intro:
      'Trogir sits on a small island between the mainland and the island of Čiovo. Its entire medieval core — Romanesque, Gothic, Renaissance, and Baroque buildings packed into 23 hectares — is a UNESCO World Heritage Site.',
    icon: '🏝️',
    color: '#0891b2',
  },
  {
    name: 'Varaždin',
    region: 'Continental Croatia',
    tagline: 'Baroque capital, once Croatia’s political center.',
    intro:
      'Varaždin was Croatia’s capital from 1767 to 1776 and remains one of the best-preserved Baroque towns in Central Europe. Known as "Little Vienna" for its architecture and music tradition.',
    icon: '🎻',
    color: '#be185d',
  },
  {
    name: 'Rovinj',
    region: 'Istria',
    tagline: 'Venetian-flavored fishing town and artist colony.',
    intro:
      'Rovinj is Istria’s most photogenic coastal town — pastel houses cling to a steep hillside crowned by St. Euphemia’s church. Its Venetian past gives it a bilingual Croatian-Italian character.',
    icon: '🎨',
    color: '#c026d3',
  },
  {
    name: 'Korčula',
    region: 'Dalmatia',
    tagline: 'Marco Polo’s legendary birthplace.',
    intro:
      'Korčula town is a fortified medieval settlement on the eastern tip of Korčula island. Local tradition claims Marco Polo was born here in 1254 — and you can visit the house his family is said to have lived in.',
    icon: '🗺️',
    color: '#0369a1',
  },
];
