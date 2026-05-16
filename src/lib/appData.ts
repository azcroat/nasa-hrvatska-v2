// src/lib/appData.ts
// Public data module — re-exports Croatian language data from data.jsx.
// Import from here when a component only needs data (not utility functions).
//
// This module is mapped to the same 'chunk-data' Vite chunk as data.jsx
// (see vite.config.js manualChunks), so no bundle-size regression occurs.
//
// Grammar data (ASPECT, PADEZI, PADEZI_FULL, MODAL, GRAM, CONDITIONAL,
// FORMAL_REGISTER, IMPERSONAL, CONJ, PITCH_ACCENT, ASPECT_PAIRS, PHONOLOGY,
// TENSES) was moved server-side in SP11b. Use useGrammar() hook (components)
// or contentClient.getGrammar() (non-components) instead.
//
// SP11d: 25 high-IP exports (V, COUNTRIES, PROFESSIONS, WEATHER, CLOTHES,
// BODYDESC, TECH_VOC, BUREAUCRATIC, PROVERBS, IDIOMS, BRZALICE, HISTORY,
// EVENTS, KINGS, REGIONS, DIALECTS, CROATIAN_CITIES, FOODORDER, TRANSPORT,
// GROCERY, RECIPES, PRACTICAL, SCENES, LEVEL_NARRATIVE, SHADOWING) moved
// server-side. Use useContent() hook (components) or contentClient.getContent()
// (non-components) instead.
// SP11e: LEARN_PATH (97 items, ckRule JSON DSL) and SEASONAL_CAMPAIGNS (4
// entries, windowKind discriminator) also moved server-side via the same
// /api/content/core endpoint.

export {
  // Non-SP11d/b data — still client-side
  EMERGENCY,
  SCHOOL,
  FRIENDS,
  GYM,
  TEXTING,
  FOOTBALL,
  POPCULTURE,
  ROLEPLAY,
  // Grammar structures (still client-side)
  VOCATIVE,
  NUMCOUNT,
  NUMTIME,
  FALSEFR,
  DECL,
  PREPDRILL,
  DIMWORDS,
  WORDFORM,
  REFLEXIVE,
  SVOJMOJ,
  // Stories & practice content (still client-side)
  STORIES,
  LISTEN,
  HIST_FACTS,
  FILL_STORIES,
  ZNAM,
  BOJE,
  UNJUMBLE,
  PREPS,
  ALPHA,
  READ,
  // Exercises (still client-side)
  RIDDLES,
  LOGICQUIZ,
  ORDINALS,
  ORDQUIZ,
  RELPRON,
  EMOGENDER,
  QWORDS,
  NEGATION,
  COLORAGREE,
  SIBIL,
  PROFGENDER,
  COMPARE,
  COMPQUIZ,
  FUTURE,
  RESTCONV,
  POSSESS,
  ADJOPPOSITES,
  CITYLOC,
  AKUFOOD,
  AKUCLOTHES,
  CONVMATCH,
  VERBDRILL,
  VBPERSONS,
  TENSEFLIP,
  GENDERDRILL,
  SENTBUILD,
  PRONOUNCASE,
  COLORQUIRK,
  // Cultural & geographic data (still client-side)
  TOP100,
  MAPPLACES,
  MEDIA,
  BASKETBALL,
  // App structure (still client-side)
  BADGES,
  DAILY_QUESTS,
  PLACE,
  // Theme colors
  BG_LIGHT,
  BG_DARK,
} from '../data';
