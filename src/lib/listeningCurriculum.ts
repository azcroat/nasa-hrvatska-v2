/**
 * listeningCurriculum — a structured, ordered listening path over the AI
 * generator (Content-Rec #1).
 *
 * The audit flagged that AI Listening was a flat free-pick of topics with no
 * sense of progression — the learner had no answer to "what should I listen to
 * next?". This module gives listening the same structured treatment the Grammar
 * Track gives grammar: per-CEFR-level ordered units, each pinned to an existing
 * `/api/listening` topic + style, with localStorage progress (mirroring
 * `nh_grammar_track_done`).
 *
 * It ships NO machine-authored Croatian to learners — every unit is just a
 * pointer (level + topic + style) into the already-reviewed AI generator. The
 * Croatian is produced at runtime by the same reviewed endpoint the free-pick
 * grid already uses, so the engine-first content rule is preserved.
 *
 * Units progress from concrete, dialogue-heavy topics at A1 toward abstract,
 * monologue-heavy discourse at C1/C2 — the natural difficulty curve for
 * listening comprehension.
 */

export type ListeningStyle = 'dialogue' | 'monologue';

export interface ListeningUnit {
  id: string;
  level: string; // CEFR: A1 | A2 | B1 | B2 | C1 | C2
  topic: string; // must be a member of /api/listening VALID_TOPICS
  style: ListeningStyle;
  title: string; // English label shown in the path UI
  desc: string; // one-line English description
}

// Ordered within each level easiest → hardest. Every `topic` here is in the
// VALID_TOPICS allowlist in functions/api/listening.js, and every `style` is a
// VALID_STYLES member, so each unit generates a real exercise.
export const LISTENING_CURRICULUM: ListeningUnit[] = [
  // ── A1 — concrete, slow, dialogue-first ──
  {
    id: 'a1_cafe',
    level: 'A1',
    topic: 'cafe',
    style: 'dialogue',
    title: 'Ordering at a Café',
    desc: 'Greetings and ordering a drink',
  },
  {
    id: 'a1_family',
    level: 'A1',
    topic: 'family',
    style: 'dialogue',
    title: 'Meeting the Family',
    desc: 'Introductions and family members',
  },
  {
    id: 'a1_market',
    level: 'A1',
    topic: 'market',
    style: 'dialogue',
    title: 'At the Market',
    desc: 'Buying food, numbers and prices',
  },
  {
    id: 'a1_weather',
    level: 'A1',
    topic: 'weather',
    style: 'monologue',
    title: "Today's Weather",
    desc: 'A short, clear weather report',
  },
  // ── A2 — everyday situations, longer exchanges ──
  {
    id: 'a2_restaurant',
    level: 'A2',
    topic: 'restaurant',
    style: 'dialogue',
    title: 'At the Restaurant',
    desc: 'Ordering a meal and asking for the bill',
  },
  {
    id: 'a2_weekend',
    level: 'A2',
    topic: 'weekend',
    style: 'dialogue',
    title: 'Weekend Plans',
    desc: 'Talking about free-time plans',
  },
  {
    id: 'a2_travel',
    level: 'A2',
    topic: 'travel',
    style: 'dialogue',
    title: 'Getting Around',
    desc: 'Directions, tickets and travel',
  },
  {
    id: 'a2_city',
    level: 'A2',
    topic: 'city',
    style: 'monologue',
    title: 'A Walk Through the City',
    desc: 'Describing places around town',
  },
  // ── B1 — opinions, work and study, first monologues ──
  {
    id: 'b1_work',
    level: 'B1',
    topic: 'work',
    style: 'dialogue',
    title: 'At Work',
    desc: 'Workplace conversations and tasks',
  },
  {
    id: 'b1_school',
    level: 'B1',
    topic: 'school',
    style: 'dialogue',
    title: 'School & Study',
    desc: 'Education and learning',
  },
  {
    id: 'b1_sports',
    level: 'B1',
    topic: 'sports',
    style: 'monologue',
    title: 'Sports Report',
    desc: 'A short spoken sports report',
  },
  {
    id: 'b1_nature',
    level: 'B1',
    topic: 'nature',
    style: 'monologue',
    title: 'The Natural World',
    desc: 'Describing nature and the outdoors',
  },
  // ── B2 — abstract topics, extended monologue ──
  {
    id: 'b2_health',
    level: 'B2',
    topic: 'health',
    style: 'dialogue',
    title: 'At the Doctor',
    desc: 'Symptoms, advice and appointments',
  },
  {
    id: 'b2_culture',
    level: 'B2',
    topic: 'culture',
    style: 'monologue',
    title: 'Croatian Culture',
    desc: 'A talk on cultural life',
  },
  {
    id: 'b2_history',
    level: 'B2',
    topic: 'history',
    style: 'monologue',
    title: 'A Page of History',
    desc: 'A short historical narrative',
  },
  {
    id: 'b2_travel',
    level: 'B2',
    topic: 'travel',
    style: 'monologue',
    title: 'Travel Story',
    desc: 'An extended first-person travel account',
  },
  // ── C1 — formal register, analysis, opinion ──
  {
    id: 'c1_culture',
    level: 'C1',
    topic: 'culture',
    style: 'monologue',
    title: 'Cultural Commentary',
    desc: 'An opinion piece on cultural life',
  },
  {
    id: 'c1_history',
    level: 'C1',
    topic: 'history',
    style: 'monologue',
    title: 'Historical Analysis',
    desc: 'A deeper, argued historical discussion',
  },
  {
    id: 'c1_work',
    level: 'C1',
    topic: 'work',
    style: 'monologue',
    title: 'Professional Briefing',
    desc: 'A formal workplace briefing',
  },
  // ── C2 — dense, idiomatic, literary ──
  {
    id: 'c2_culture',
    level: 'C2',
    topic: 'culture',
    style: 'monologue',
    title: 'Nuanced Discourse',
    desc: 'Idiomatic, abstract spoken Croatian',
  },
  {
    id: 'c2_history',
    level: 'C2',
    topic: 'history',
    style: 'monologue',
    title: 'Scholarly Narrative',
    desc: 'Dense, literary historical prose',
  },
];

const DONE_KEY = 'nh_listening_track_done';
const VALID_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

/** The set of completed listening-unit ids (device-local). Never throws. */
export function getListeningDone(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(DONE_KEY) || '[]');
    return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

/** Mark a unit complete. Idempotent; safe to call on every completion. */
export function markListeningUnitDone(unitId: string): void {
  if (!unitId) return;
  try {
    const done = getListeningDone();
    if (!done.includes(unitId)) {
      localStorage.setItem(DONE_KEY, JSON.stringify([...done, unitId]));
    }
  } catch {
    // localStorage unavailable / quota — non-fatal; progress is best-effort.
  }
}

function normLevel(level: string | null | undefined): string {
  return level && VALID_LEVELS.includes(level) ? level : 'B1';
}

/** All units at a given CEFR level, in curriculum order. */
export function getUnitsForLevel(level: string): ListeningUnit[] {
  const lv = normLevel(level);
  return LISTENING_CURRICULUM.filter((u) => u.level === lv);
}

/**
 * The unit a curriculum exercise should mark complete, matched by the exact
 * (level, topic, style) the generator was run with. Returns undefined for a
 * free-pick combo that isn't part of the path.
 */
export function findListeningUnit(
  level: string,
  topic: string,
  style: string,
): ListeningUnit | undefined {
  const lv = normLevel(level);
  return LISTENING_CURRICULUM.find((u) => u.level === lv && u.topic === topic && u.style === style);
}

/**
 * The recommended next unit at the learner's current level: the first one not
 * yet completed, in curriculum order. Returns null when every unit at that
 * level is done (the UI then shows a "level complete" state). Scoped to the
 * current level so the generator always runs at the unit's own CEFR level.
 */
export function getNextListeningUnit(level: string): ListeningUnit | null {
  const done = getListeningDone();
  const units = getUnitsForLevel(level);
  return units.find((u) => !done.includes(u.id)) || null;
}

/** Done / total counts for the learner's current level. */
export function getListeningProgress(level: string): { done: number; total: number } {
  const done = getListeningDone();
  const units = getUnitsForLevel(level);
  return { done: units.filter((u) => done.includes(u.id)).length, total: units.length };
}
