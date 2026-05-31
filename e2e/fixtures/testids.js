// e2e/fixtures/testids.js
// SP10: canonical e2e testid registry. Every spec imports from here so
// typos become impossible and refactoring is a single-file change.
//
// Naming convention: kebab-case, screen-scoped, action-suffixed.
//   {screen-or-feature}-{role-or-action}[-{id-fragment}]
//
// Components must use the literal string value (not the constant) as the
// data-testid attribute, because JSX shouldn't import e2e fixtures.

export const TID = Object.freeze({
  // ── Home tab ──────────────────────────────────────────────────────────
  STORY_OF_DAY_CARD: 'story-of-the-day-card',
  STORY_OF_DAY_CTA: 'story-of-the-day-cta',
  WORD_OF_DAY_CARD: 'word-of-day-card',
  PHRASE_OF_DAY_CARD: 'phrase-of-day-card',
  SESSION_CARD: 'session-card',
  SESSION_BEGIN_CTA: 'session-begin-cta',

  // ── Nav (matches TabBar's tab IDs: home/learn/practice/croatia/profile) ─
  NAV_TODAY: 'nav-home',
  NAV_LEARN: 'nav-learn',
  NAV_PRACTICE: 'nav-practice',
  NAV_CROATIA: 'nav-croatia',
  NAV_ME: 'nav-profile',

  // ── Practice tab ──────────────────────────────────────────────────────
  EXERCISE_CARD: (id) => `exercise-card-${id}`,
  PRACTICE_QUEUE_TOP: 'practice-queue-top',

  // ── Writing screen (SP6) ──────────────────────────────────────────────
  WRITING_INPUT: 'writing-input',
  WRITING_SUBMIT: 'writing-submit',
  WRITING_RESULT: 'writing-result',
  WRITING_RETRY: 'writing-retry',

  // ── Speaking / shadowing / production drill ───────────────────────────
  SPEAKING_RECORD: 'speaking-record',
  SPEAKING_SUBMIT: 'speaking-submit',
  SPEAKING_RESULT: 'speaking-result',
  SPEAKING_RETRY: 'speaking-retry',
  SHADOWING_RECORD: 'shadowing-record',
  SHADOWING_PLAY: 'shadowing-play',
  SHADOWING_RESULT: 'shadowing-result',
  PRODUCTION_DRILL_INPUT: 'production-drill-input',
  PRODUCTION_DRILL_SUBMIT: 'production-drill-submit',

  // ── Graded reading (SP7) ──────────────────────────────────────────────
  GRADED_STORY_CARD: (id) => `graded-story-card-${id}`,
  GRADED_STORY_START_QUIZ: 'graded-story-start-quiz',
  GRADED_STORY_QUIZ_OPTION: (i) => `graded-story-quiz-option-${i}`,

  // ── Cloze / MC / dictation / review ───────────────────────────────────
  CLOZE_INPUT: 'cloze-input',
  CLOZE_SUBMIT: 'cloze-submit',
  MC_OPTION: (i) => `mc-option-${i}`,
  DICTATION_INPUT: 'dictation-input',
  DICTATION_SUBMIT: 'dictation-submit',
  REVIEW_FLIP: 'review-flip',
  REVIEW_GRADE: (grade) => `review-grade-${grade}`,

  // ── Aspect drill / grammar drills ─────────────────────────────────────
  ASPECT_OPTION: (i) => `aspect-option-${i}`,
  CASE_DRILL_OPTION: (i) => `case-drill-option-${i}`,

  // ── Phoneme heat map (SP8) ────────────────────────────────────────────
  PHONEME_HEAT_MAP: 'phoneme-heat-map',
  PHONEME_CELL: 'phoneme-cell',
  WORD_HEAT_CARD: 'word-heat-card',

  // ── Correction diff (SP6) ─────────────────────────────────────────────
  CORRECTION_DIFF: 'correction-diff',

  // ── Grammar track (SP9) ───────────────────────────────────────────────
  GRAMMAR_LEVEL_TAB: (cefr) => `grammar-level-tab-${cefr.toLowerCase()}`,
  GRAMMAR_UNIT_DETAIL: 'grammar-unit-detail',
  GRAMMAR_UNIT_TITLE: 'unit-title',
  GRAMMAR_DRILL_QUESTION: 'drill-question',
  GRAMMAR_DRILL_EXPLAIN: 'drill-explain',

  // ── Reader / story detail (SP7) ───────────────────────────────────────
  STORY_READER_PARAGRAPH: (i) => `story-paragraph-${i}`,

  // ── Arcade / Alka (gamification G1) ───────────────────────────────────
  ALKA_OPTION: (i) => `alka-option-${i}`,
});
