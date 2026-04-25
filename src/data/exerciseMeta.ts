/**
 * exerciseMeta.ts
 *
 * Maps every exported exercise array name from exercises.js to a
 * { category: SkillCategory, difficulty: 1|2|3|4|5 } descriptor.
 *
 * Difficulty scale (structural, not per-item judgment):
 *   1 = recognition          — MC from 4 options
 *   2 = constrained          — fill blank with given word bank / unjumble
 *   3 = guided               — fill blank, no word bank
 *   4 = free production      — transform a full sentence
 *   5 = open production      — complex cross-level transform / translation
 */

import type { SkillCategory } from '../lib/adaptive';

export interface ExerciseMeta {
  difficulty: 1 | 2 | 3 | 4 | 5;
  category: SkillCategory;
}

export const EXERCISE_META: Record<string, ExerciseMeta> = {
  // ── General A2 vocabulary / recognition ─────────────────────────────────
  /** MC quiz covering basic vocab, greetings, numbers, culture */
  PLACE: { category: 'vocab-a2', difficulty: 1 },

  /** Listening comprehension — hear HR, pick English meaning (MC) */
  LISTEN: { category: 'vocab-a2', difficulty: 1 },

  /** Numbers & time reference + MC quiz */
  NUMTIME: { category: 'vocab-a2', difficulty: 1 },

  /** Number counting reference */
  NUMCOUNT: { category: 'vocab-a2', difficulty: 1 },

  /** Logic "right/wrong items" selection quiz */
  LOGICQUIZ: { category: 'vocab-a2', difficulty: 1 },

  /** Ordinal numbers reference */
  ORDINALS: { category: 'vocab-a2', difficulty: 1 },

  /** Question words drill (MC fill blank) */
  QWORDS: { category: 'vocab-a2', difficulty: 1 },

  /** Color adjective agreement MC (singular + plural) */
  COLORAGREE: { category: 'vocab-a2', difficulty: 1 },

  /** Possessive pronouns MC quiz */
  POSSESS: { category: 'vocab-a2', difficulty: 1 },

  /** 6 personal pronoun labels — used as conjugation axis */
  VBPERSONS: { category: 'vocab-a2', difficulty: 1 },

  /** Reading comprehension passages with MC comprehension questions */
  READ: { category: 'vocab-a2', difficulty: 2 },

  /** Emotion adjectives gender agreement drill */
  EMOGENDER: { category: 'vocab-a2', difficulty: 2 },

  /** Gender/plural/adjective agreement drill */
  GENDERDRILL: { category: 'vocab-a2', difficulty: 2 },

  // ── B1 vocabulary / cultural knowledge ──────────────────────────────────
  /** Idiomatic expressions (recognition) */
  IDIOMS: { category: 'vocab-b1', difficulty: 1 },

  /** False friends — recognise the correct meaning */
  FALSEFR: { category: 'vocab-b1', difficulty: 1 },

  /** Diminutive words reference */
  DIMWORDS: { category: 'vocab-b1', difficulty: 1 },

  /** Colour quirks in Croatian (recognise non-literal colour use) */
  COLORQUIRK: { category: 'vocab-b1', difficulty: 1 },

  /** Riddles (MC choose answer) */
  RIDDLES: { category: 'vocab-b1', difficulty: 1 },

  /** Professional noun gender pairs (reference) */
  PROFGENDER: { category: 'vocab-b1', difficulty: 1 },

  /** Comparatives / superlatives reference list */
  COMPARE: { category: 'vocab-b1', difficulty: 1 },

  /** Comparatives MC quiz (fill blank) */
  COMPQUIZ: { category: 'vocab-b1', difficulty: 1 },

  /** Adjective opposites pairs (reference) */
  ADJOPPOSITES: { category: 'vocab-b1', difficulty: 1 },

  /** Sentence building — choose the correct full Croatian sentence from MC */
  SENTBUILD: { category: 'vocab-b1', difficulty: 4 },

  /** Unscramble word-order to form a correct sentence */
  UNJUMBLE: { category: 'vocab-b1', difficulty: 2 },

  /** Word formation with prefixes on ići / pisati / raditi (reference) */
  WORDFORM: { category: 'vocab-b1', difficulty: 3 },

  // ── B2 vocabulary (translation production) ──────────────────────────────
  /** EN→HR translation MC across A2/B1/B2 levels — highest cognitive demand */
  TRANSLATE_DRILLS: { category: 'vocab-b2', difficulty: 5 },

  // ── Case: genitive ───────────────────────────────────────────────────────
  /** Full declension table (all 7 cases) — genitive is the most complex case */
  DECL: { category: 'genitive', difficulty: 3 },

  // ── Case: accusative ────────────────────────────────────────────────────
  /** Relative pronoun koji/koja/koje (MC fill blank — accusative, locative, dative) */
  RELPRON: { category: 'accusative', difficulty: 1 },

  /** Personal pronoun case forms MC (accusative + instrumental focus) */
  PRONOUNCASE: { category: 'accusative', difficulty: 1 },

  // ── Case: dative / locative ─────────────────────────────────────────────
  /** Preposition reference — cases covered include genitive, dative, locative, instrumental */
  PREPS: { category: 'dative-locative', difficulty: 1 },

  /** Preposition fill-blank (MC 4 options) — predominantly locative / accusative */
  PREPDRILL: { category: 'dative-locative', difficulty: 1 },

  /** Ordinal locative quiz (e.g. "na prvom katu") */
  ORDQUIZ: { category: 'dative-locative', difficulty: 1 },

  /** Sibilarization (k/g/h → c/z/s) in locative case (MC) */
  SIBIL: { category: 'dative-locative', difficulty: 1 },

  // ── Case: vocative ───────────────────────────────────────────────────────
  /** Vocative case rules + guided fill drill */
  VOCATIVE: { category: 'vocative', difficulty: 3 },

  // ── Tense: past ─────────────────────────────────────────────────────────
  /** Present-tense → past-tense + negative transformation (guided, no word bank) */
  TENSEFLIP: { category: 'past-tense', difficulty: 3 },

  /** Verb conjugation paradigms reference (imperfective verbs) */
  VERBDRILL: { category: 'past-tense', difficulty: 3 },

  // ── Tense: future ───────────────────────────────────────────────────────
  /** Future tense auxiliary (ću/ćeš/će…) MC fill blank */
  FUTURE: { category: 'future-tense', difficulty: 1 },

  // ── Aspect: negation ────────────────────────────────────────────────────
  /** Affirmative ↔ negative sentence pairs (reference + recognition) */
  NEGATION: { category: 'aspect-negation', difficulty: 1 },

  // ── Speaking / pronunciation ────────────────────────────────────────────
  /** Croatian tongue twisters for pronunciation practice */
  BRZALICE: { category: 'speaking', difficulty: 3 },

  // ── Placeholder arrays for Tasks 4 & 5 (not yet in exercises.js) ────────
  PAST_EXERCISES_MC: { category: 'past-tense', difficulty: 1 },
  PAST_EXERCISES_FILL: { category: 'past-tense', difficulty: 3 },
  PAST_EXERCISES_XFORM: { category: 'past-tense', difficulty: 4 },
  FUTURE_EXERCISES_MC: { category: 'future-tense', difficulty: 1 },
  FUTURE_EXERCISES_FILL: { category: 'future-tense', difficulty: 3 },
  FUTURE_EXERCISES_XFORM: { category: 'future-tense', difficulty: 4 },
};

/**
 * Look up metadata for a given exercise array name.
 * Returns a safe default for unknown arrays so callers never need to null-check.
 */
export function getExerciseMeta(arrayName: string): ExerciseMeta {
  return EXERCISE_META[arrayName] ?? { difficulty: 3, category: 'vocab-b1' };
}
