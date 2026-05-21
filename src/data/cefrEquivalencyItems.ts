/**
 * src/data/cefrEquivalencyItems.ts
 *
 * CEFR equivalency-test item bank. One test set per CEFR level threshold:
 *   - A1 → A2 (this user has passed A1, tests A1 mastery to advance to A2)
 *   - A2 → B1
 *   - B1 → B2
 *   - B2 → C1
 *   - C1 → C2  (C2 is the cap — no further tier)
 *
 * Items are 4-option multiple choice. Each item tests one of:
 *   - vocab: word recognition (English↔Croatian or fill-in-blank)
 *   - grammar: structural choice (case, aspect, word order, pronoun)
 *   - reading: comprehension of a short passage
 *
 * Scoring: 80% per-skill AND 80% overall to pass (see cefrCertification.ts).
 *
 * Item count per test: ~50, distributed roughly 20 vocab / 20 grammar /
 * 10 reading. This balance reflects how CEFR practitioners typically score
 * equivalency — vocab and grammar carry the bulk; reading anchors
 * passage-level comprehension.
 *
 * Content authoring: A1→A2 hand-authored; A2→B1, B1→B2, B2→C1, C1→C2
 * sub-agent-authored from scripts/_equivalencyItems_*.json files per
 * docs/audit-cefr-drift-2026-05-20.md rubric. All items go through the
 * `lintCroatianText.mjs` encoding-bleed check via the unified `npm run
 * lint:croatian` script (now extended to scan this file).
 *
 * @see src/lib/cefrCertification.ts — scoring, recording, retake logic
 * @see src/components/profile/EquivalencyTestScreen.tsx — test runner UI
 */

import type { CefrLevel } from '../lib/cefr.js';

export type EquivalencySkill = 'vocab' | 'grammar' | 'reading';

export interface EquivalencyItem {
  /** Question shown to the learner. */
  q: string;
  /** Four answer options. Length must be 4. */
  o: [string, string, string, string];
  /** Correct option index, 0..3. */
  c: 0 | 1 | 2 | 3;
  /** Which skill the item primarily tests. */
  skill: EquivalencySkill;
  /** Optional reading passage that `q` refers to. */
  passage?: string;
}

export interface EquivalencyTestSet {
  /** The level being tested for. Passing demonstrates competency AT this level. */
  levelFrom: CefrLevel;
  /** The level the user advances to on pass. */
  levelTo: CefrLevel;
  /** Short description shown on the test entry screen. */
  description: string;
  /** Approximate minutes to complete; sets user expectation. */
  minutes: number;
  /** The 50 items, mixed across skills. */
  items: EquivalencyItem[];
}

// ── A1 → A2 (hand-authored, gold-standard reference) ─────────────────────────
//
// Tests A1 competency. Passing advances the learner to A2. A1 rubric:
// present tense only, nominative + accusative, ~300 words, single-clause
// greetings/intros/numbers/family/food/colors basics.

const A1_TO_A2_ITEMS: EquivalencyItem[] = [
  // ── VOCAB (20 items: greetings, family, food, colors, numbers, basic verbs) ─
  {
    q: "What does 'Dobar dan' mean?",
    o: ['Good morning', 'Good day', 'Good evening', 'Goodbye'],
    c: 1,
    skill: 'vocab',
  },
  {
    q: "What does 'Hvala' mean?",
    o: ['Please', 'Hello', 'Thank you', 'Goodbye'],
    c: 2,
    skill: 'vocab',
  },
  {
    q: "Translate 'mama'.",
    o: ['father', 'mother', 'sister', 'aunt'],
    c: 1,
    skill: 'vocab',
  },
  {
    q: "Translate 'brat'.",
    o: ['father', 'son', 'brother', 'cousin'],
    c: 2,
    skill: 'vocab',
  },
  {
    q: "What is 'kruh'?",
    o: ['water', 'bread', 'cheese', 'milk'],
    c: 1,
    skill: 'vocab',
  },
  {
    q: "What is 'voda'?",
    o: ['water', 'wine', 'juice', 'tea'],
    c: 0,
    skill: 'vocab',
  },
  {
    q: "What colour is 'crveno'?",
    o: ['blue', 'green', 'red', 'white'],
    c: 2,
    skill: 'vocab',
  },
  {
    q: "What colour is 'plavo'?",
    o: ['blue', 'yellow', 'black', 'orange'],
    c: 0,
    skill: 'vocab',
  },
  {
    q: "Which number is 'pet'?",
    o: ['three', 'four', 'five', 'six'],
    c: 2,
    skill: 'vocab',
  },
  {
    q: "Which number is 'deset'?",
    o: ['ten', 'twenty', 'eleven', 'one hundred'],
    c: 0,
    skill: 'vocab',
  },
  {
    q: "What does the verb 'imati' mean?",
    o: ['to be', 'to have', 'to want', 'to know'],
    c: 1,
    skill: 'vocab',
  },
  {
    q: "What does the verb 'biti' mean?",
    o: ['to give', 'to take', 'to be', 'to come'],
    c: 2,
    skill: 'vocab',
  },
  {
    q: "What does 'kuća' mean?",
    o: ['car', 'kitchen', 'house', 'door'],
    c: 2,
    skill: 'vocab',
  },
  {
    q: "What is 'pas'?",
    o: ['cat', 'dog', 'bird', 'fish'],
    c: 1,
    skill: 'vocab',
  },
  {
    q: "Translate 'jutro'.",
    o: ['morning', 'evening', 'night', 'afternoon'],
    c: 0,
    skill: 'vocab',
  },
  {
    q: "Translate 'noć'.",
    o: ['morning', 'noon', 'night', 'today'],
    c: 2,
    skill: 'vocab',
  },
  {
    q: "What does 'da' mean?",
    o: ['no', 'maybe', 'yes', 'please'],
    c: 2,
    skill: 'vocab',
  },
  {
    q: "What does 'ne' mean?",
    o: ['yes', 'no', 'never', 'now'],
    c: 1,
    skill: 'vocab',
  },
  {
    q: "What does 'jabuka' mean?",
    o: ['orange', 'apple', 'banana', 'grape'],
    c: 1,
    skill: 'vocab',
  },
  {
    q: "Translate 'velik'.",
    o: ['small', 'old', 'big', 'new'],
    c: 2,
    skill: 'vocab',
  },

  // ── GRAMMAR (20 items: biti, imati, nominative, accusative, basic word order) ─
  {
    q: "Choose the correct form: 'Ja ___ Hrvat.'",
    o: ['sam', 'si', 'je', 'smo'],
    c: 0,
    skill: 'grammar',
  },
  {
    q: "Choose the correct form: 'Ti ___ student.'",
    o: ['sam', 'si', 'je', 'su'],
    c: 1,
    skill: 'grammar',
  },
  {
    q: "Choose the correct form: 'On ___ doktor.'",
    o: ['sam', 'si', 'je', 'ste'],
    c: 2,
    skill: 'grammar',
  },
  {
    q: "Choose the correct form: 'Mi ___ Hrvati.'",
    o: ['sam', 'si', 'smo', 'ste'],
    c: 2,
    skill: 'grammar',
  },
  {
    q: "Choose the correct form: 'Oni ___ studenti.'",
    o: ['sam', 'je', 'ste', 'su'],
    c: 3,
    skill: 'grammar',
  },
  {
    q: "Choose the correct form of 'imati' for 'I have a brother': 'Ja ___ brata.'",
    o: ['imam', 'imaš', 'ima', 'imamo'],
    c: 0,
    skill: 'grammar',
  },
  {
    q: "Choose the correct form: 'Ona ___ sestru.'",
    o: ['imam', 'imaš', 'ima', 'imate'],
    c: 2,
    skill: 'grammar',
  },
  {
    q: "Choose the negative: 'I am not a student.'",
    o: ['Ja sam student.', 'Ja nisam student.', 'Ja sam ne student.', 'Ja ne sam student.'],
    c: 1,
    skill: 'grammar',
  },
  {
    q: "Choose the negative: 'He does not have a car.'",
    o: ['On ima auto.', 'On nema auto.', 'On ne ima auto.', 'On je ne auto.'],
    c: 1,
    skill: 'grammar',
  },
  {
    q: "Choose the correct accusative: 'I see ___ (the house).'",
    o: ['Vidim kuću.', 'Vidim kuća.', 'Vidim kući.', 'Vidim kuće.'],
    c: 0,
    skill: 'grammar',
  },
  {
    q: "Choose the correct accusative: 'I love ___ (my mother).'",
    o: ['Volim mama.', 'Volim mami.', 'Volim mamu.', 'Volim mame.'],
    c: 2,
    skill: 'grammar',
  },
  {
    q: "Choose the correct gender for 'pas' (dog).",
    o: ['masculine', 'feminine', 'neuter', 'plural'],
    c: 0,
    skill: 'grammar',
  },
  {
    q: "Choose the correct gender for 'voda' (water).",
    o: ['masculine', 'feminine', 'neuter', 'depends on context'],
    c: 1,
    skill: 'grammar',
  },
  {
    q: "Choose the correct gender for 'jutro' (morning).",
    o: ['masculine', 'feminine', 'neuter', 'plural'],
    c: 2,
    skill: 'grammar',
  },
  {
    q: "Pick the right pronoun: '___ je moja mama.' (She is my mother.)",
    o: ['On', 'Ona', 'Oni', 'Ono'],
    c: 1,
    skill: 'grammar',
  },
  {
    q: "Pick the right form: 'Kako ___ ti?' (How are you?)",
    o: ['sam', 'si', 'je', 'smo'],
    c: 1,
    skill: 'grammar',
  },
  {
    q: "Choose the present-tense form of 'raditi' for 'I work':",
    o: ['radim', 'radiš', 'radi', 'rade'],
    c: 0,
    skill: 'grammar',
  },
  {
    q: "Choose the present-tense form of 'govoriti' for 'they speak':",
    o: ['govorim', 'govorite', 'govori', 'govore'],
    c: 3,
    skill: 'grammar',
  },
  {
    q: "What is the plural of 'pas' (dog)?",
    o: ['pasa', 'psi', 'pasove', 'pase'],
    c: 1,
    skill: 'grammar',
  },
  {
    q: "Which sentence is correct?",
    o: [
      'Ja sam imam pas.',
      'Imam ja pas.',
      'Ja imam psa.',
      'Ja pas imam.',
    ],
    c: 2,
    skill: 'grammar',
  },

  // ── READING (10 items, ~3 passages) ───────────────────────────────────────
  {
    passage: 'Ja sam Ana. Imam dvije sestre i jednog brata. Moja mama je doktor, a tata je inženjer. Živim u Zagrebu.',
    q: 'How many siblings does Ana have in total?',
    o: ['Two', 'Three', 'Four', 'One'],
    c: 1,
    skill: 'reading',
  },
  {
    passage: 'Ja sam Ana. Imam dvije sestre i jednog brata. Moja mama je doktor, a tata je inženjer. Živim u Zagrebu.',
    q: "What is Ana's father's job?",
    o: ['Doctor', 'Engineer', 'Teacher', 'Student'],
    c: 1,
    skill: 'reading',
  },
  {
    passage: 'Ja sam Ana. Imam dvije sestre i jednog brata. Moja mama je doktor, a tata je inženjer. Živim u Zagrebu.',
    q: 'Where does Ana live?',
    o: ['Split', 'Dubrovnik', 'Zagreb', 'Rijeka'],
    c: 2,
    skill: 'reading',
  },
  {
    passage: 'Marko ima psa. Pas se zove Rex. Rex je crn i velik. Marko i Rex svaki dan idu u park.',
    q: "What is the dog's name?",
    o: ['Marko', 'Rex', 'Ana', 'Park'],
    c: 1,
    skill: 'reading',
  },
  {
    passage: 'Marko ima psa. Pas se zove Rex. Rex je crn i velik. Marko i Rex svaki dan idu u park.',
    q: 'What colour is Rex?',
    o: ['white', 'brown', 'black', 'red'],
    c: 2,
    skill: 'reading',
  },
  {
    passage: 'Marko ima psa. Pas se zove Rex. Rex je crn i velik. Marko i Rex svaki dan idu u park.',
    q: 'How often do they go to the park?',
    o: ['Every day', 'Once a week', 'Never', 'Only on Sundays'],
    c: 0,
    skill: 'reading',
  },
  {
    passage: 'Danas je lijep dan. Sunce sija. Idem na plažu. Ne volim kišu.',
    q: 'What is the weather like today?',
    o: ['Raining', 'Snowing', 'Sunny', 'Cloudy'],
    c: 2,
    skill: 'reading',
  },
  {
    passage: 'Danas je lijep dan. Sunce sija. Idem na plažu. Ne volim kišu.',
    q: 'Where is the speaker going?',
    o: ['To work', 'To the beach', 'To school', 'Home'],
    c: 1,
    skill: 'reading',
  },
  {
    passage: 'Danas je lijep dan. Sunce sija. Idem na plažu. Ne volim kišu.',
    q: "What does the speaker not like?",
    o: ['Sun', 'Beach', 'Rain', 'Wind'],
    c: 2,
    skill: 'reading',
  },
  {
    passage: 'Petra pije kavu svako jutro. Ona ne pije čaj. Voli mlijeko.',
    q: 'What does Petra drink every morning?',
    o: ['Tea', 'Coffee', 'Juice', 'Water'],
    c: 1,
    skill: 'reading',
  },
];

// ── Item-bank index ──────────────────────────────────────────────────────────
//
// At module load, this index is empty for non-A1 sets. The Vite build-time
// import of the subagent-authored JSON files (in src/data/cefrEquivalencyItems
// /*.json) wires them in. If a JSON file is missing or malformed at build,
// the level is omitted from EQUIVALENCY_TESTS rather than crashing — the
// UI shows a "test items not yet available" state for that level.

import a2ToB1Raw from './cefrEquivalencyItems/a2_to_b1.json';
import b1ToB2Raw from './cefrEquivalencyItems/b1_to_b2.json';
import b2ToC1Raw from './cefrEquivalencyItems/b2_to_c1.json';
import c1ToC2Raw from './cefrEquivalencyItems/c1_to_c2.json';

function loadFromJson(raw: unknown, levelFrom: CefrLevel, levelTo: CefrLevel): EquivalencyTestSet | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as { items?: unknown[]; description?: unknown; minutes?: unknown };
  if (!Array.isArray(r.items)) return null;
  const items: EquivalencyItem[] = [];
  for (const it of r.items) {
    if (!it || typeof it !== 'object') continue;
    const item = it as Partial<EquivalencyItem>;
    if (
      typeof item.q !== 'string' ||
      !Array.isArray(item.o) ||
      item.o.length !== 4 ||
      typeof item.c !== 'number' ||
      item.c < 0 ||
      item.c > 3 ||
      (item.skill !== 'vocab' && item.skill !== 'grammar' && item.skill !== 'reading')
    ) {
      continue; // skip malformed
    }
    items.push({
      q: item.q,
      o: [String(item.o[0]), String(item.o[1]), String(item.o[2]), String(item.o[3])],
      c: item.c as 0 | 1 | 2 | 3,
      skill: item.skill,
      passage: typeof item.passage === 'string' ? item.passage : undefined,
    });
  }
  if (items.length === 0) return null;
  return {
    levelFrom,
    levelTo,
    description: typeof r.description === 'string' ? r.description : `Tests ${levelFrom} competency.`,
    minutes: typeof r.minutes === 'number' ? r.minutes : 25,
    items,
  };
}

// ── Master test bank ─────────────────────────────────────────────────────────

export const EQUIVALENCY_TESTS: Partial<Record<CefrLevel, EquivalencyTestSet>> = {
  A1: {
    levelFrom: 'A1',
    levelTo: 'A2',
    description: 'Tests A1 competency — passing advances to A2.',
    minutes: 20,
    items: A1_TO_A2_ITEMS,
  },
};

const _maybeSets: Array<[CefrLevel, CefrLevel, unknown]> = [
  ['A2', 'B1', a2ToB1Raw],
  ['B1', 'B2', b1ToB2Raw],
  ['B2', 'C1', b2ToC1Raw],
  ['C1', 'C2', c1ToC2Raw],
];
for (const [from, to, raw] of _maybeSets) {
  const set = loadFromJson(raw, from, to);
  if (set) EQUIVALENCY_TESTS[from] = set;
}

/**
 * Returns the test set for the level the user needs to pass to advance.
 * `userCertified` is the level they've already certified at; the function
 * returns the test that would advance them to the next level.
 * Returns null if there's no next test (user is already C2).
 */
export function getNextTestFor(userCertified: CefrLevel): EquivalencyTestSet | null {
  return EQUIVALENCY_TESTS[userCertified] ?? null;
}
