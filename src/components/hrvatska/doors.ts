import type { CharacterName } from '../family/portraits';

export type DoorId = 'price' | 'krajevi' | 'zivot' | 'povijest' | 'mediji';

export interface Door {
  id: DoorId;
  title: string;
  host: CharacterName;
  icon: string;
  tint: string; // rgba seed for the hero gradient
  voiceLine: { hr: string; en: string };
  embeds?: 'stories' | 'media'; // reuse an existing sub-component inside the door
}

export interface DoorItem {
  id: string; // the screen id handed to setScr (unchanged from the old cards)
  doorId: DoorId;
  icon: string;
  title: string;
  sub: string;
  color: string;
  seasonal?: 'easter'; // rendered only during the Easter window
}

export const DOORS: Door[] = [
  {
    id: 'price',
    title: 'Priče',
    host: 'baka',
    icon: '📖',
    tint: 'rgba(194,65,12,.14)',
    voiceLine: {
      hr: 'Dođi, sjedni — ispričat ću ti priču.',
      en: 'Come, sit — let me tell you a story.',
    },
    embeds: 'stories',
  },
  {
    id: 'krajevi',
    title: 'Krajevi',
    host: 'marko',
    icon: '🗺️',
    tint: 'rgba(5,150,105,.14)',
    voiceLine: {
      hr: 'Idemo putovati — od mora do Slavonije.',
      en: "Let's travel — from the sea to Slavonia.",
    },
  },
  {
    id: 'zivot',
    title: 'Život',
    host: 'ana',
    icon: '🏡',
    tint: 'rgba(14,116,144,.14)',
    voiceLine: {
      hr: 'Svakodnevni život — trgovina, kafić, prijatelji.',
      en: 'Everyday life — shops, cafés, friends.',
    },
  },
  {
    id: 'povijest',
    title: 'Povijest i jezik',
    host: 'kovac',
    icon: '🏛️',
    tint: 'rgba(124,58,237,.14)',
    voiceLine: {
      hr: 'Povijest i jezik — odakle dolazimo.',
      en: 'History and language — where we come from.',
    },
  },
  {
    id: 'mediji',
    title: 'Mediji',
    host: 'ivo',
    icon: '🎬',
    tint: 'rgba(37,99,235,.14)',
    voiceLine: {
      hr: 'TV, glazba, vijesti — kako se stvarno priča.',
      en: 'TV, music, news — how people really talk.',
    },
    embeds: 'media',
  },
];

export const DOOR_ITEMS: DoorItem[] = [
  // ── PRIČE (baka) ──
  {
    id: 'baka_summer',
    doorId: 'price',
    icon: '📖',
    title: "Baka's Summer",
    sub: '16-chapter story',
    color: '#b45309',
  },
  {
    id: 'survival_dinner',
    doorId: 'price',
    icon: '🍽️',
    title: 'At the Table',
    sub: 'Navigate any dinner',
    color: '#16a34a',
  },
  {
    id: 'storymode',
    doorId: 'price',
    icon: '📖',
    title: 'Immersive Stories',
    sub: 'AI stories set in Croatia',
    color: '#0e7490',
  },
  {
    id: 'heritage',
    doorId: 'price',
    icon: '🧬',
    title: 'Your Heritage',
    sub: 'Discover your Croatian roots',
    color: '#b45309',
  },
  {
    id: 'postcard',
    doorId: 'price',
    icon: '📮',
    title: 'Postcard',
    sub: 'Write & share in Croatian',
    color: '#7c3aed',
  },
  {
    id: 'diaspora',
    doorId: 'price',
    icon: '💙',
    title: 'Diaspora Croatian',
    sub: 'Code-switching & heritage language',
    color: '#0e7490',
  },
  {
    id: 'lifeevents',
    doorId: 'price',
    icon: '🎊',
    title: 'Life Events',
    sub: 'Weddings, funerals, baptisms',
    color: '#7c3aed',
  },
  {
    id: 'easter',
    doorId: 'price',
    icon: '🥚',
    title: 'Uskrs u Hrvatskoj',
    sub: 'Easter traditions & phrases',
    color: '#166534',
    seasonal: 'easter',
  },

  // ── KRAJEVI (marko) ──
  {
    id: 'crmap',
    doorId: 'krajevi',
    icon: '🗺️',
    title: 'Interaktivna karta',
    sub: 'Cities, parks, beaches & islands',
    color: '#0e7490',
  },
  {
    id: 'region_vukovar',
    doorId: 'krajevi',
    icon: '🕯️',
    title: 'Vukovar',
    sub: 'Hero city — a deep dive',
    color: '#dc2626',
  },
  {
    id: 'region_zagreb',
    doorId: 'krajevi',
    icon: '🏛️',
    title: 'Zagreb',
    sub: "Croatia's capital",
    color: '#0e7490',
  },
  {
    id: 'region_split',
    doorId: 'krajevi',
    icon: '🌊',
    title: 'Split',
    sub: 'Rome on the Adriatic',
    color: '#0284c7',
  },
  {
    id: 'region_mostar',
    doorId: 'krajevi',
    icon: '🌉',
    title: 'Mostar',
    sub: 'The bridge reborn',
    color: '#7c3aed',
  },
  {
    id: 'region_tomislavgrad',
    doorId: 'krajevi',
    icon: '👑',
    title: 'Tomislavgrad',
    sub: 'Where the kingdom was born',
    color: '#b45309',
  },
  {
    id: 'region_knin',
    doorId: 'krajevi',
    icon: '🏰',
    title: 'Knin',
    sub: 'Liberated August 5, 1995',
    color: '#dc2626',
  },
  {
    id: 'region_labin',
    doorId: 'krajevi',
    icon: '⛵',
    title: 'Labin & Rabac',
    sub: 'Our home in Istria',
    color: '#0e7490',
  },
  {
    id: 'region_bibinje',
    doorId: 'krajevi',
    icon: '🏖️',
    title: 'Bibinje & Zadar',
    sub: 'Dalmatian gateway',
    color: '#0284c7',
  },
  {
    id: 'region_hercegovina',
    doorId: 'krajevi',
    icon: '⚔️',
    title: 'Hercegovina',
    sub: 'Croatian heritage',
    color: '#b45309',
  },
  {
    id: 'region_vinkovci',
    doorId: 'krajevi',
    icon: '🏛️',
    title: 'Vinkovci',
    sub: '8,300 years of history',
    color: '#78716c',
  },

  // ── ŽIVOT (ana) ──
  {
    id: 'grocery',
    doorId: 'zivot',
    icon: '🛒',
    title: 'Grocery Shopping',
    sub: 'Supermarket vocab',
    color: '#16a34a',
  },
  {
    id: 'recipes',
    doorId: 'zivot',
    icon: '🍳',
    title: 'Croatian Recipes',
    sub: 'Traditional dishes',
    color: '#b45309',
  },
  {
    id: 'roleplay',
    doorId: 'zivot',
    icon: '🎭',
    title: 'Role-Play',
    sub: 'Real-life conversations',
    color: '#7c3aed',
  },
  {
    id: 'school',
    doorId: 'zivot',
    icon: '🏫',
    title: 'School Kit',
    sub: 'For parents & students',
    color: '#0e7490',
  },
  {
    id: 'friends',
    doorId: 'zivot',
    icon: '🤝',
    title: 'Making Friends',
    sub: 'Social life',
    color: '#16a34a',
  },
  {
    id: 'foodorder',
    doorId: 'zivot',
    icon: '🍕',
    title: 'Ordering Food',
    sub: 'Restaurants & cafés',
    color: '#b45309',
  },
  {
    id: 'transport',
    doorId: 'zivot',
    icon: '🚌',
    title: 'Transport',
    sub: 'Buses, taxis & trams',
    color: '#0284c7',
  },
  {
    id: 'emergency',
    doorId: 'zivot',
    icon: '🚨',
    title: 'Emergency',
    sub: 'Essential phrases',
    color: '#dc2626',
  },
  {
    id: 'practical',
    doorId: 'zivot',
    icon: '💼',
    title: 'Practical Life',
    sub: 'Banks, doctors, admin',
    color: '#78716c',
  },
  {
    id: 'basketball',
    doorId: 'zivot',
    icon: '🏀',
    title: 'At Basketball',
    sub: 'Croatian basketball',
    color: '#b45309',
  },
  {
    id: 'gym',
    doorId: 'zivot',
    icon: '🏋️',
    title: 'At the Gym',
    sub: 'Fitness vocabulary',
    color: '#16a34a',
  },
  {
    id: 'kafic',
    doorId: 'zivot',
    icon: '☕',
    title: 'U Kafiću',
    sub: 'The art of Croatian coffee culture',
    color: '#c2410c',
  },

  // ── POVIJEST I JEZIK (kovac) ──
  {
    id: 'history',
    doorId: 'povijest',
    icon: '🇭🇷',
    title: 'Domovinski Rat',
    sub: '1991–1995 Homeland War',
    color: '#dc2626',
  },
  {
    id: 'kings',
    doorId: 'povijest',
    icon: '👑',
    title: 'Croatian Kings',
    sub: 'Medieval dynasty',
    color: '#b45309',
  },
  {
    id: 'civic',
    doorId: 'povijest',
    icon: '🏛️',
    title: 'Civic Croatian',
    sub: 'Vocabulary to read the news',
    color: '#16a34a',
  },
  {
    id: 'dialect_awareness',
    doorId: 'povijest',
    icon: '🗣️',
    title: 'Dialect Explorer',
    sub: 'Što vs Ča vs Kaj',
    color: '#2563eb',
  },
  {
    id: 'immersion',
    doorId: 'povijest',
    icon: '🌊',
    title: 'Immersion Hub',
    sub: 'A1 → C2 pathway',
    color: '#0e7490',
  },

  // ── MEDIJI (ivo) ──
  {
    id: 'texting',
    doorId: 'mediji',
    icon: '📱',
    title: 'Texting & Slang',
    sub: 'How Croatians text',
    color: '#7c3aed',
  },
  {
    id: 'croatia_today',
    doorId: 'mediji',
    icon: '📰',
    title: 'Croatia Today',
    sub: 'Daily Croatian news',
    color: '#0e7490',
  },
  {
    id: 'croatianews',
    doorId: 'mediji',
    icon: '🗞️',
    title: 'Croatian News',
    sub: 'Real news at your level',
    color: '#0369a1',
  },
  {
    id: 'phraseofday',
    doorId: 'mediji',
    icon: '💬',
    title: 'Phrase of the Day',
    sub: 'Daily cultural expressions',
    color: '#db2777',
  },
];

// Every entry point that must remain reachable, transcribed from the old
// CroatiaTab subtree (CultureTab + DiscoverTab `setScr(...)` cards) BEFORE the
// doors redesign. This is deliberately a hand-maintained literal, NOT derived
// from DOOR_ITEMS — that independence is what lets `hrvatska.test.ts` catch a
// screen that gets dropped from DOOR_ITEMS (a derived list would make the
// coverage check a tautology). The StoriesTab letters (price) and the MediaTab
// carousels (mediji) stay reachable via the door embeds, asserted separately in
// DoorScreen.test.tsx.
export const MUST_NOT_ORPHAN: string[] = [
  // Stories & News (old CultureTab) + Language & Culture story cards
  'baka_summer',
  'survival_dinner',
  'storymode',
  'heritage',
  'postcard',
  'diaspora',
  'lifeevents',
  'easter',
  // History & Regions (old CultureTab) — regions + map
  'crmap',
  'region_vukovar',
  'region_zagreb',
  'region_split',
  'region_mostar',
  'region_tomislavgrad',
  'region_knin',
  'region_labin',
  'region_bibinje',
  'region_hercegovina',
  'region_vinkovci',
  // Croatian Life (old CultureTab) + kafic
  'grocery',
  'recipes',
  'roleplay',
  'school',
  'friends',
  'foodorder',
  'transport',
  'emergency',
  'practical',
  'basketball',
  'gym',
  'kafic',
  // History & language (old CultureTab History + Language&Culture + DiscoverTab)
  'history',
  'kings',
  'civic',
  'dialect_awareness',
  'immersion',
  // Media (old CultureTab Stories&News) — texting moved here
  'texting',
  'croatia_today',
  'croatianews',
  'phraseofday',
];

export function itemsForDoor(id: DoorId): DoorItem[] {
  return DOOR_ITEMS.filter((i) => i.doorId === id);
}

// Non-seasonal daily rotation surfaced on the "Danas u Hrvatskoj" card.
const DANAS_POOL = ['phraseofday', 'croatia_today', 'croatianews', 'postcard'];

export function recommendedDaily(dayIdx: number): DoorItem {
  const n = DANAS_POOL.length;
  const idx = ((dayIdx % n) + n) % n;
  const id = DANAS_POOL[idx]!;
  return DOOR_ITEMS.find((i) => i.id === id)!;
}

/** Shared launcher: key the activity by the screen id, then navigate. */
export function launchDoorItem(
  item: { id: string },
  nav: { setScr: (s: string) => void; sCurEx?: (e: string) => void },
): void {
  nav.sCurEx?.(item.id);
  nav.setScr(item.id);
}
