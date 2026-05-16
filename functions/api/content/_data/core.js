// SP11d: aggregator for 25 high-IP-density "core" content exports.
// 8 vocab + 9 cultural + 5 situational + 1 scenes + 2 misc (inline + appUtils) = 25.
//
// Deferred to SP11e (function-valued, need data/function split before JSON serialization):
//   LEARN_PATH (97 items × ck function)
//   SEASONAL_CAMPAIGNS (easter entry has dynamicWindow arrow function)

// === Vocab pools (8 — from vocabulary.js) ===
export {
  V,
  COUNTRIES,
  PROFESSIONS,
  WEATHER,
  CLOTHES,
  BODYDESC,
  TECH_VOC,
  BUREAUCRATIC,
} from './vocabulary.js';

// === Cultural (9 — from cultural/* and exercises.js for IDIOMS/BRZALICE) ===
export { PROVERBS } from './cultural/proverbs.js';
export { HISTORY, KINGS } from './cultural/history.js';
export { EVENTS } from './cultural/events.js';
export { REGIONS } from './cultural/regions.js';
export { DIALECTS, SHADOWING } from './cultural/language.js';
export { CROATIAN_CITIES } from './cultural/geography.js';
export { IDIOMS, BRZALICE } from './exercises.js';

// === Situational (5 — from scenarios.js) ===
export { FOODORDER, TRANSPORT, GROCERY, RECIPES, PRACTICAL } from './scenarios.js';

// === Scenes (1 — from vocabScenes.js, originally VocabSceneData.js) ===
export { SCENES } from './vocabScenes.js';

// === Inline-extracted from src/data/content.tsx lines 3254-3299 ===
export const LEVEL_NARRATIVE = {
  heritage: [
    'First Words',
    'Finding Your Voice',
    'Reconnecting',
    'Bridging Worlds',
    'Coming Home',
    'Naš Čovjek',
    'Naš Čovjek',
  ],
  family: [
    'Hello Family',
    'Family Stories',
    'Conversations',
    'Deep Talks',
    'Native Flow',
    'Naš Čovjek',
    'Naš Čovjek',
  ],
  travel: [
    'Survival Mode',
    'Getting Around',
    "Local's Path",
    'Off the Map',
    'Croatian Soul',
    'Naš Čovjek',
    'Naš Čovjek',
  ],
  culture: [
    'First Steps',
    'Culture Seeker',
    'Insider',
    'Deep Diver',
    'Living Croatia',
    'Naš Čovjek',
    'Naš Čovjek',
  ],
  fluent: ['Beginner', 'Elementary', 'Intermediate', 'Upper-Int', 'Advanced', 'Fluent', 'Fluent'],
  partner: [
    'Curious Spouse',
    'Family Observer',
    'Dinner Table Survivor',
    'Welcome Addition',
    'Part of the Family',
  ],
};
