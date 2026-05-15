// src/data/grammar-advanced.js
// SP9: B2 + C1 grammar units. 10 total (5 B2 + 5 C1).
// Schema mirrors existing grammar.js exports (ASPECT_PAIRS shape).
//
// Each unit has:
//   id (kebab-case), cefr, title, subtitle, focus (comma-separated keywords),
//   intro (2-3 sentence prose),
//   forms (6+ rows of {label, hr, en?}),
//   examples (5+ entries of {hr, en, note?}),
//   tips (3+ strings),
//   drills (5+ {q, qEn?, opts (length 4), correct (index|string), explain?}).

export const FUTUR_II = {
  id: 'futur-ii',
  cefr: 'B2',
  title: 'Futur II — Future Perfect',
  subtitle: 'Used in time clauses ("when/if I have done X") and uncertainty about past',
  focus: 'futur ii, future perfect, conditional time clauses, kad ako future',
  intro:
    'Futur II is formed with the future of "biti" (budem, budeš, bude, budemo, budete, budu) plus the past participle. It appears almost exclusively in subordinate clauses introduced by ako (if), kad (when), čim (as soon as), or dok (while/until) when the main verb is in Futur I. Native speakers also use it to express uncertainty about a past event ("must have / might have").',
  forms: [
    { label: 'ja', hr: 'budem došao / došla', en: 'I will have come' },
    { label: 'ti', hr: 'budeš došao / došla', en: 'you will have come' },
    { label: 'on/ona/ono', hr: 'bude došao / došla / došlo', en: 's/he/it will have come' },
    { label: 'mi', hr: 'budemo došli / došle', en: 'we will have come' },
    { label: 'vi', hr: 'budete došli / došle', en: 'you (pl) will have come' },
    { label: 'oni/one/ona', hr: 'budu došli / došle / došla', en: 'they will have come' },
  ],
  examples: [
    {
      hr: 'Kad budem završio posao, nazvat ću te.',
      en: 'When I have finished work, I will call you.',
      note: 'Time clause: Futur II in `kad` clause + Futur I in main clause.',
    },
    {
      hr: 'Ako budeš imao vremena, dođi.',
      en: 'If you have time, come.',
      note: '`ako` clauses with future reference take Futur II, not Futur I.',
    },
    {
      hr: 'Čim budem stigao, javit ću ti.',
      en: 'As soon as I arrive, I will let you know.',
    },
    {
      hr: 'Dok ne budeš naučio ovo, nećeš proći ispit.',
      en: 'Until you have learned this, you will not pass the exam.',
    },
    {
      hr: 'Bude da je već otišao.',
      en: 'He has probably already left.',
      note: 'Colloquial — expresses speculation about a past event.',
    },
  ],
  tips: [
    'Always uses a past participle (radni glagolski pridjev) — same form used in Past Tense.',
    'Almost never appears in a main clause — look for ako / kad / čim / dok triggers.',
    'In modern speech, Futur I sometimes replaces Futur II in time clauses; both are accepted but Futur II is the literary / standard choice.',
    'The participle agrees in gender + number with the subject: muški došao, ženski došla, množina došli.',
  ],
  drills: [
    {
      q: 'Choose the correct form: Kad ____ vremena, javit ću se.',
      qEn: 'When I have time, I will get in touch.',
      opts: ['budem imati', 'budem imao', 'bit ću imao', 'imam'],
      correct: 1,
      explain: '`budem imao` — Futur II requires past participle after `budem`.',
    },
    {
      q: 'Ako ____ kasno, ne čekaj.',
      qEn: 'If I am late, do not wait.',
      opts: ['bit ću došao', 'budem došao', 'budem kasniti', 'budem zakasnio'],
      correct: 3,
      explain:
        '`budem zakasnio` — `kasniti` is imperfective; perfective `zakasniti` fits a single completed future action.',
    },
    {
      q: 'Čim ____ , idem doma.',
      qEn: 'As soon as I have finished, I am going home.',
      opts: ['budem završiti', 'završim', 'budem završio', 'bit ću završio'],
      correct: 2,
      explain:
        '`budem završio` — Futur II in `čim` clause. Present tense `završim` is also acceptable colloquially.',
    },
    {
      q: 'Singular feminine: "ona ____ ."',
      qEn: 'She will have come.',
      opts: ['bude došao', 'bude došla', 'bude došlo', 'budu došle'],
      correct: 1,
      explain: 'Feminine singular → `došla`. Participle agrees with subject gender.',
    },
    {
      q: 'Translate: "Until they have read the book, do not start the discussion."',
      opts: [
        'Dok ne budu pročitali knjigu, ne počinjite raspravu.',
        'Dok ne bude pročitao knjigu, ne počinjite raspravu.',
        'Dok ne čitaju knjigu, ne počinjite raspravu.',
        'Dok nisu pročitali knjigu, ne počinjite raspravu.',
      ],
      correct: 0,
      explain:
        'Plural subject `oni` → `budu pročitali`. `dok ne` introduces a future time clause taking Futur II.',
    },
  ],
};

// Aggregated array — Tasks 2-3 will extend this to all 10 units.
export const ADVANCED_UNITS = [FUTUR_II];

// O(1) lookup by id for GrammarUnitDetail.
export const GRAMMAR_UNIT_BY_ID = Object.fromEntries(ADVANCED_UNITS.map((u) => [u.id, u]));
