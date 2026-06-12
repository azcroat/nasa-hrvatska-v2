// Single source of truth for screen completion policy.
//
// One row per `vs` completion key. `completeExercise` (src/hooks/useExerciseCompletion.ts)
// reads this to decide HOW a screen counts as complete:
//   gated   — score-bearing: credited only at >= LESSON_PASS_THRESHOLD (75%)
//   effort  — productive task (no MCQ correctness): credited on genuine finish
//   passive — reference/reading: credited on read/dwell
//
// vsKey ALWAYS equals the map key (no renames) so existing user progress is preserved.
// statKind/activityType/questKind for not-yet-migrated rows are best-known from the audit
// and are re-verified against each component when that screen is wired up (Phases 1–4).

export type StatKind = 'lc' | 'gc' | 'sp' | 'rc';

export type CompletionPolicy =
  | { kind: 'gated'; statKind: StatKind }
  | { kind: 'effort'; statKind: StatKind }
  | { kind: 'passive'; statKind: StatKind };

export interface ExerciseEntry {
  vsKey: string;
  policy: CompletionPolicy;
  /** markQuest id (e.g. 'grammar' | 'vocab' | 'speaking' | 'listening' | 'culture'). */
  questKind?: string;
  /** award() activityType (e.g. 'grammar' | 'vocabulary' | 'speaking' | 'lesson'). */
  activityType?: string;
}

const g = (statKind: StatKind, questKind?: string, activityType?: string): ExerciseEntry => ({
  vsKey: '',
  policy: { kind: 'gated', statKind },
  questKind,
  activityType,
});
const e = (statKind: StatKind, questKind?: string, activityType?: string): ExerciseEntry => ({
  vsKey: '',
  policy: { kind: 'effort', statKind },
  questKind,
  activityType,
});
const p = (statKind: StatKind): ExerciseEntry => ({
  vsKey: '',
  policy: { kind: 'passive', statKind },
});

const RAW: Record<string, ExerciseEntry> = {
  // ── Passive lessons gated by PRs #36–#38 (completeLesson) ──
  declension: g('gc', 'grammar', 'lesson'),
  tenses: g('gc', 'grammar', 'lesson'),
  conditional: g('gc', 'grammar', 'lesson'),
  impersonal: g('gc', 'grammar', 'lesson'),
  formalregister: g('gc', 'grammar', 'lesson'),
  future_tense_lesson: g('gc', 'grammar', 'lesson'),
  wordform: g('lc', 'grammar', 'lesson'),
  diminutives: g('lc', 'grammar', 'lesson'),
  phonology: g('lc', 'grammar', 'lesson'),

  // ── Gated score-bearing grammar drills (Phases 1–2) ──
  accusative: g('gc', 'grammar', 'grammar'),
  animateacc: g('gc', 'grammar', 'grammar'),
  aspect: g('gc', 'grammar', 'grammar'), // shared by AspectScreen (lesson) + AspectDrillScreen — both gated
  clitic: g('gc', 'grammar', 'grammar'),
  cloze: g('gc', 'grammar', 'grammar'),
  conjugation: g('gc', 'grammar', 'grammar'),
  comparatives: g('gc', 'grammar', 'grammar'),
  'conv-match': g('gc', 'grammar', 'grammar'),
  dative: g('gc', 'grammar', 'grammar'),
  'fill-story': g('gc', 'grammar', 'grammar'),
  fleetinga: g('gc', 'grammar', 'grammar'),
  'future-tense': g('gc', 'grammar', 'grammar'),
  gender: g('gc', 'grammar', 'grammar'),
  genitive: g('gc', 'grammar', 'grammar'),
  imperative: g('gc', 'grammar', 'grammar'),
  instrumental: g('gc', 'grammar', 'grammar'),
  locative: g('gc', 'grammar', 'grammar'),
  negation: g('gc', 'grammar', 'grammar'),
  negationgen: g('gc', 'grammar', 'grammar'),
  nominative: g('gc', 'grammar', 'grammar'),
  'numbers-cases': g('gc', 'grammar', 'grammar'),
  numtime: g('gc', 'grammar', 'grammar'),
  passive: g('gc', 'grammar', 'grammar'),
  possessives: g('gc', 'grammar', 'grammar'),
  preposition: g('gc', 'grammar', 'grammar'),
  production: g('gc', 'grammar', 'grammar'),
  pronouns: g('gc', 'grammar', 'grammar'),
  reflexive: g('gc', 'grammar', 'grammar'),
  'sentence-builder': g('gc', 'grammar', 'grammar'),
  'sentence-tile': g('gc', 'grammar', 'grammar'),
  translate: g('gc', 'vocab', 'grammar'),
  typing: g('gc', 'vocab', 'vocabulary'),
  unjumble: g('gc', 'grammar', 'grammar'),
  'verb-drill': g('gc', 'grammar', 'grammar'),
  'city-locative': g('gc', 'grammar', 'grammar'),

  // ── Gated vocab games (Phase 2) ──
  collocations: g('gc', 'vocab', 'vocabulary'),
  boje: g('gc', 'vocab', 'vocabulary'),
  znam: g('gc', 'vocab', 'vocabulary'),
  match: g('gc', 'vocab', 'vocabulary'),
  wordsprint: g('gc', 'grammar', 'vocabulary'),
  'word-families': g('gc', 'grammar', 'grammar'),

  // ── Tier-1 true-bypass screens (Phase 3): gated; quiz wired/added there ──
  padezifull: g('gc', 'grammar', 'grammar'),
  padezi: g('gc', 'grammar', 'grammar'),
  svojmoj: g('gc', 'grammar', 'grammar'),
  modal: g('gc', 'grammar', 'grammar'),
  vocative: g('gc', 'grammar', 'grammar'),
  conjpractice: g('gc', 'grammar', 'grammar'),

  // ── Effort: productive tasks (no MCQ correctness) — credited on genuine finish (Phase 4) ──
  speaking: e('sp', 'speaking', 'speaking'),
  shadowing: e('lc', 'speaking', 'speaking'),
  writing: e('lc', 'grammar', 'grammar'),
  dictation: e('lc', 'listening', 'listening'),
  listening: e('lc', 'listening', 'listening'),
  'pitch-accent': e('gc', 'grammar', 'grammar'),
  'pronunciation-contrast': e('gc', 'grammar', 'grammar'),
  srsreview: e('rc', 'grammar', 'default'),
  'flashcards-quiz': e('lc', 'vocab', 'vocabulary'),
  'story-comprehension': e('lc', 'listening', 'listening'),

  // ── Passive reference (Phase 4): read/dwell credit ──
  alphabet: p('lc'),
  techvoc: p('lc'),
  dialects: p('lc'),
  falsefr: p('lc'),
  grammarmap: p('gc'),
};

export const EXERCISE_COMPLETION: Record<string, ExerciseEntry> = Object.fromEntries(
  Object.entries(RAW).map(([k, v]) => [k, { ...v, vsKey: v.vsKey || k }]),
);
