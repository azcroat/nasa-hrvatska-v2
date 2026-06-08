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
  // ── VOCAB (60 items total: 20 original + 40 new) ───────────────────────────

  // Original 20 vocab items
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

  // New vocab — recognition items (25 items)
  {
    q: "What does 'dobro jutro' mean?",
    o: ['Good evening', 'Good afternoon', 'Good morning', 'Good night'],
    c: 2,
    skill: 'vocab',
  },
  {
    q: "What does 'laku noć' mean?",
    o: ['Good morning', 'Good day', 'See you', 'Good night'],
    c: 3,
    skill: 'vocab',
  },
  {
    q: "Translate 'dobra večer'.",
    o: ['Good morning', 'Good afternoon', 'Good evening', 'Good night'],
    c: 2,
    skill: 'vocab',
  },
  {
    q: "What does 'molim' mean?",
    o: ['Thank you', 'Sorry', 'Please', 'Hello'],
    c: 2,
    skill: 'vocab',
  },
  {
    q: "What does 'oprostite' mean?",
    o: ['You are welcome', 'Excuse me / Sorry', 'Good luck', 'Goodbye'],
    c: 1,
    skill: 'vocab',
  },
  {
    q: "Translate 'sestra'.",
    o: ['mother', 'aunt', 'sister', 'grandmother'],
    c: 2,
    skill: 'vocab',
  },
  {
    q: "Translate 'otac'.",
    o: ['brother', 'father', 'son', 'uncle'],
    c: 1,
    skill: 'vocab',
  },
  {
    q: "What is 'baka'?",
    o: ['mother', 'aunt', 'sister', 'grandmother'],
    c: 3,
    skill: 'vocab',
  },
  {
    q: "What does 'dijete' mean?",
    o: ['baby', 'boy', 'child', 'girl'],
    c: 2,
    skill: 'vocab',
  },
  {
    q: "What is 'mlijeko'?",
    o: ['water', 'juice', 'wine', 'milk'],
    c: 3,
    skill: 'vocab',
  },
  {
    q: "What is 'kava'?",
    o: ['tea', 'coffee', 'juice', 'water'],
    c: 1,
    skill: 'vocab',
  },
  {
    q: "What is 'sir'?",
    o: ['butter', 'cheese', 'bread', 'egg'],
    c: 1,
    skill: 'vocab',
  },
  {
    q: "Translate 'jaje'.",
    o: ['bread', 'butter', 'egg', 'milk'],
    c: 2,
    skill: 'vocab',
  },
  {
    q: "What colour is 'zeleno'?",
    o: ['yellow', 'green', 'blue', 'brown'],
    c: 1,
    skill: 'vocab',
  },
  {
    q: "What colour is 'žuto'?",
    o: ['red', 'orange', 'yellow', 'white'],
    c: 2,
    skill: 'vocab',
  },
  {
    q: "What colour is 'bijelo'?",
    o: ['black', 'grey', 'brown', 'white'],
    c: 3,
    skill: 'vocab',
  },
  {
    q: "Which number is 'tri'?",
    o: ['two', 'three', 'four', 'thirteen'],
    c: 1,
    skill: 'vocab',
  },
  {
    q: "Which number is 'dvadeset'?",
    o: ['two', 'twelve', 'twenty', 'two hundred'],
    c: 2,
    skill: 'vocab',
  },
  {
    q: "What does the verb 'jesti' mean?",
    o: ['to drink', 'to eat', 'to sleep', 'to walk'],
    c: 1,
    skill: 'vocab',
  },
  {
    q: "What does the verb 'piti' mean?",
    o: ['to eat', 'to cook', 'to drink', 'to buy'],
    c: 2,
    skill: 'vocab',
  },
  {
    q: "What does the verb 'spavati' mean?",
    o: ['to eat', 'to walk', 'to work', 'to sleep'],
    c: 3,
    skill: 'vocab',
  },
  {
    q: "Translate 'škola'.",
    o: ['hospital', 'shop', 'school', 'park'],
    c: 2,
    skill: 'vocab',
  },
  {
    q: "What is 'auto'?",
    o: ['bus', 'car', 'train', 'bicycle'],
    c: 1,
    skill: 'vocab',
  },
  {
    q: "Translate 'grad'.",
    o: ['village', 'street', 'city / town', 'country'],
    c: 2,
    skill: 'vocab',
  },
  {
    q: "What does 'mali' mean?",
    o: ['big', 'old', 'small', 'new'],
    c: 2,
    skill: 'vocab',
  },

  // New vocab — harder/nuanced A1 items (15 items)
  {
    q: 'Which greeting would you use when meeting someone for the first time in a formal context?',
    o: ['Bok!', 'Dobar dan!', 'Cao!', 'Hej!'],
    c: 1,
    skill: 'vocab',
  },
  {
    q: "'Bog' in Croatian is used as:",
    o: [
      'A greeting meaning hello or goodbye (informal)',
      'A formal greeting meaning good day',
      'A word meaning God only',
      'A farewell used only in the evening',
    ],
    c: 0,
    skill: 'vocab',
  },
  {
    q: "Which word means 'goodbye' in a formal or neutral context?",
    o: ['Bok', 'Doviđenja', 'Cao', 'Hej'],
    c: 1,
    skill: 'vocab',
  },
  {
    q: "The Croatian word 'molim' can mean both 'please' and:",
    o: ['Thank you', "You're welcome / Here you are", "I'm sorry", 'Good morning'],
    c: 1,
    skill: 'vocab',
  },
  {
    q: "'Kako se zoveš?' literally translates as:",
    o: [
      'How old are you?',
      'Where are you from?',
      'How do you call yourself? (What is your name?)',
      'How are you?',
    ],
    c: 2,
    skill: 'vocab',
  },
  {
    q: "What is the difference between 'Kako si?' and 'Kako ste?'",
    o: [
      "'Kako si?' is formal; 'Kako ste?' is informal",
      "'Kako si?' is informal (ti); 'Kako ste?' is formal/plural (Vi/vi)",
      'They are identical in meaning and register',
      "'Kako si?' is used in Zagreb; 'Kako ste?' is used in Split",
    ],
    c: 1,
    skill: 'vocab',
  },
  {
    q: "You want to say 'I don't understand' in Croatian. Which phrase is correct?",
    o: ['Ne govorim.', 'Ne znam.', 'Ne razumijem.', 'Nisam siguran.'],
    c: 2,
    skill: 'vocab',
  },
  {
    q: "Which word means 'now' in Croatian?",
    o: ['onda', 'tada', 'ovdje', 'sada'],
    c: 3,
    skill: 'vocab',
  },
  {
    q: "What does 'svaki dan' mean?",
    o: ['some days', 'yesterday', 'every day', 'today only'],
    c: 2,
    skill: 'vocab',
  },
  {
    q: "The word 'stan' means:",
    o: ['house', 'flat / apartment', 'room', 'garden'],
    c: 1,
    skill: 'vocab',
  },
  {
    q: "What does 'lijepo' mean when used as an adjective agreeing with a neuter noun?",
    o: ['ugly', 'big', 'beautiful / nice', 'old'],
    c: 2,
    skill: 'vocab',
  },
  {
    q: "'Hladan' means cold. What is the Croatian word for 'warm' (pleasant warmth)?",
    o: ['topao', 'vrući', 'sunčan', 'težak'],
    c: 0,
    skill: 'vocab',
  },
  {
    q: "Which word is the opposite of 'star' (old)?",
    o: ['velik', 'mali', 'mlad', 'dobar'],
    c: 2,
    skill: 'vocab',
  },
  {
    q: "The correct way to say 'I am hungry' in Croatian is:",
    o: ['Ja sam gladan/gladna.', 'Imam glad.', 'Gledan sam.', 'Gladim se.'],
    c: 0,
    skill: 'vocab',
  },
  {
    q: "'Koliko košta?' means 'How much does it cost?' — 'košta' is a form of which verb?",
    o: ['koštati', 'kupiti', 'platiti', 'tražiti'],
    c: 0,
    skill: 'vocab',
  },

  // ── GRAMMAR (60 items total: 20 original + 40 new) ────────────────────────

  // Original 20 grammar items
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
    q: 'Which sentence is correct?',
    o: ['Ja sam imam pas.', 'Imam ja pas.', 'Ja imam psa.', 'Ja pas imam.'],
    c: 2,
    skill: 'grammar',
  },

  // New grammar — recognition-level conjugation and form items (15 items)
  {
    q: "Choose the correct form: 'Vi ___ učitelji.' (You are teachers — formal/plural.)",
    o: ['sam', 'si', 'je', 'ste'],
    c: 3,
    skill: 'grammar',
  },
  {
    q: "Choose the present-tense form of 'piti' for 'she drinks': 'Ona ___ kavu.'",
    o: ['pijem', 'piješ', 'pije', 'pijemo'],
    c: 2,
    skill: 'grammar',
  },
  {
    q: "Choose the present-tense form of 'jesti' for 'we eat': 'Mi ___ kruh.'",
    o: ['jedem', 'jedeš', 'jede', 'jedemo'],
    c: 3,
    skill: 'grammar',
  },
  {
    q: "Choose the correct form of 'živjeti' for 'I live': 'Ja ___ u Splitu.'",
    o: ['živim', 'živiš', 'živi', 'živimo'],
    c: 0,
    skill: 'grammar',
  },
  {
    q: "Choose the correct form of 'učiti' for 'you learn' (singular informal): 'Ti ___ hrvatski.'",
    o: ['učim', 'učiš', 'uči', 'učimo'],
    c: 1,
    skill: 'grammar',
  },
  {
    q: "Choose the correct form of 'voljeti' for 'he loves': 'On ___ nogomet.'",
    o: ['volim', 'voliš', 'voli', 'volimo'],
    c: 2,
    skill: 'grammar',
  },
  {
    q: "Choose the correct form of 'imati' for 'you have' (plural/formal): 'Vi ___ auto.'",
    o: ['imam', 'imaš', 'ima', 'imate'],
    c: 3,
    skill: 'grammar',
  },
  {
    q: "What is the gender of 'kuća' (house)?",
    o: ['masculine', 'feminine', 'neuter', 'it varies'],
    c: 1,
    skill: 'grammar',
  },
  {
    q: "What is the gender of 'more' (sea)?",
    o: ['masculine', 'feminine', 'neuter', 'it varies'],
    c: 2,
    skill: 'grammar',
  },
  {
    q: "The accusative singular of 'sestra' (sister) is:",
    o: ['sestra', 'sestre', 'sestru', 'sestri'],
    c: 2,
    skill: 'grammar',
  },
  {
    q: "The accusative singular of 'brat' (brother, masculine animate) is:",
    o: ['brat', 'brata', 'bratu', 'braće'],
    c: 1,
    skill: 'grammar',
  },
  {
    q: 'Which sentence uses the accusative correctly? (I eat bread.)',
    o: ['Jedem kruh.', 'Jedem kruha.', 'Jedem kruhu.', 'Jedem kruhom.'],
    c: 0,
    skill: 'grammar',
  },
  {
    q: "Choose the correct negative of 'Ona ima sestru.'",
    o: ['Ona ne ima sestru.', 'Ona nema sestru.', 'Ona nije ima sestru.', 'Ona sestru nema ima.'],
    c: 1,
    skill: 'grammar',
  },
  {
    q: "Which is the correct negative form of 'biti' for 'we are not'?",
    o: ['ne smo', 'nismo', 'nije smo', 'smo ne'],
    c: 1,
    skill: 'grammar',
  },
  {
    q: "Choose the correct pronoun for a neuter noun like 'dijete' (child): '___ je malo.'",
    o: ['On', 'Ona', 'Ono', 'Oni'],
    c: 2,
    skill: 'grammar',
  },

  // New grammar — harder A1 items (25 items): case endings in context, register, nuance
  {
    q: "A friend asks: 'Imaš li brata?' — the correct reply for 'Yes, I have one brother' is:",
    o: [
      'Da, imam jedan brat.',
      'Da, imam jednog brata.',
      'Da, imam jednu brata.',
      'Da, ja imam brat.',
    ],
    c: 1,
    skill: 'grammar',
  },
  {
    q: "You want to address your teacher respectfully. Which form of 'you' do you use?",
    o: ['ti', 'Vi (capital V)', 'Oni', 'mi'],
    c: 1,
    skill: 'grammar',
  },
  {
    q: "Which sentence is the polite/formal version of 'Kako si?'",
    o: ['Kako ste?', 'Kako je?', 'Kako smo?', 'Kako su?'],
    c: 0,
    skill: 'grammar',
  },
  {
    q: "Why is the accusative of 'pas' (dog, masculine animate) 'psa' rather than 'pas'?",
    o: [
      "Because 'pas' is inanimate, so the accusative adds -a",
      'Because masculine animate nouns take the genitive form in accusative',
      'Because accusative always ends in -a for masculine nouns',
      "Because 'pas' is an irregular noun",
    ],
    c: 1,
    skill: 'grammar',
  },
  {
    q: "Fill in with the correct accusative: 'Volim ___ .' (I love the city — 'grad', masc. inanimate.)",
    o: ['grad', 'grada', 'gradu', 'gradom'],
    c: 0,
    skill: 'grammar',
  },
  {
    q: "Choose the correct sentence: 'I eat an apple.' ('jabuka' is feminine.)",
    o: ['Jedem jabuka.', 'Jedem jabuke.', 'Jedem jabuku.', 'Jedem jabuki.'],
    c: 2,
    skill: 'grammar',
  },
  {
    q: "'Ona pije ___.' — Which form correctly fills the blank with 'voda' (water) as the object?",
    o: ['voda', 'vode', 'vodu', 'vodi'],
    c: 2,
    skill: 'grammar',
  },
  {
    q: "Which sentence correctly means 'They have a dog'?",
    o: ['Oni ima psa.', 'Oni imamo psa.', 'Oni imaju psa.', 'Oni imaju pas.'],
    c: 2,
    skill: 'grammar',
  },
  {
    q: "What is the correct present-tense form of 'spavati' for 'you sleep' (informal singular)?",
    o: ['spavam', 'spavaš', 'spava', 'spavamo'],
    c: 1,
    skill: 'grammar',
  },
  {
    q: "'Ona je lijepa.' — 'lijepa' is in the feminine form because it agrees with:",
    o: ['the verb je', 'the subject ona', 'the object of the sentence', 'the adverb'],
    c: 1,
    skill: 'grammar',
  },
  {
    q: "Choose the correct form: 'To ___ moja sestra.' (That is my sister.)",
    o: ['sam', 'si', 'je', 'su'],
    c: 2,
    skill: 'grammar',
  },
  {
    q: "Which question word is used to ask 'What?' in Croatian?",
    o: ['tko', 'što', 'gdje', 'kada'],
    c: 1,
    skill: 'grammar',
  },
  {
    q: "Which question word is used to ask 'Who?' in Croatian?",
    o: ['što', 'gdje', 'tko', 'zašto'],
    c: 2,
    skill: 'grammar',
  },
  {
    q: "Choose the most natural word order for the statement 'I speak Croatian.'",
    o: [
      'Govorim ja hrvatski.',
      'Ja govorim hrvatski.',
      'Hrvatski govorim ja.',
      'Ja hrvatski govorim.',
    ],
    c: 1,
    skill: 'grammar',
  },
  {
    q: "'Ja pijem kavu' — what does the ending '-em' in 'pijem' tell us about the subject?",
    o: [
      'The subject is second person singular (ti)',
      'The subject is first person singular (ja)',
      'The subject is third person singular (on/ona)',
      'The subject is first person plural (mi)',
    ],
    c: 1,
    skill: 'grammar',
  },
  {
    q: "Which form of 'biti' is correct in the yes/no question: '___ li ti učenik?'",
    o: ['Sam', 'Si', 'Je', 'Jesi'],
    c: 3,
    skill: 'grammar',
  },
  {
    q: "In 'Imam sestru i brata.' — 'sestru' and 'brata' are accusative because:",
    o: [
      'The conjunction i (and) always requires accusative',
      'They are the direct objects of the verb imam',
      'All nouns after imati are always accusative',
      'They follow a preposition',
    ],
    c: 1,
    skill: 'grammar',
  },
  {
    q: "What is the correct nominative plural of 'kuća' (house)?",
    o: ['kuću', 'kuće', 'kućama', 'kućan'],
    c: 1,
    skill: 'grammar',
  },
  {
    q: "Choose the correct sentence for 'The cat is white.' ('mačka' = cat, fem.)",
    o: ['Mačka je bijel.', 'Mačka je bijela.', 'Mačka je bijelo.', 'Mačka je bijeli.'],
    c: 1,
    skill: 'grammar',
  },
  {
    q: "Which form correctly completes: 'Marko ___ nogomet.' (Marko plays football.)",
    o: ['igram', 'igraš', 'igra', 'igramo'],
    c: 2,
    skill: 'grammar',
  },
  {
    q: "In 'Ona ima psa i mačku.' — which word is in the nominative case?",
    o: ['psa', 'mačku', 'Ona', 'ima'],
    c: 2,
    skill: 'grammar',
  },
  {
    q: "Which present-tense form of 'čitati' is used for 'we read'?",
    o: ['čitam', 'čitaš', 'čita', 'čitamo'],
    c: 3,
    skill: 'grammar',
  },
  {
    q: "Choose the correct form: 'Mama ___ u kuhinji.' (Mum is in the kitchen.)",
    o: ['sam', 'si', 'je', 'su'],
    c: 2,
    skill: 'grammar',
  },
  {
    q: "'Imam mačku.' — what case is 'mačku' in, and why?",
    o: [
      'Nominative, because it is the subject',
      'Accusative, because it is the direct object of imam',
      'Genitive, because it follows a verb of having',
      'Dative, because it is an indirect object',
    ],
    c: 1,
    skill: 'grammar',
  },
  {
    q: "A learner writes 'Ja volim kava.' — what is wrong?",
    o: [
      "The verb 'volim' is incorrect; should be 'voljim'",
      "'Kava' should be in the accusative 'kavu'",
      "The pronoun 'Ja' should be omitted",
      'Nothing is wrong',
    ],
    c: 1,
    skill: 'grammar',
  },

  // ── READING (30 items total: 10 original + 20 new) ────────────────────────

  // Original 10 reading items — passages 1–4
  {
    passage:
      'Ja sam Ana. Imam dvije sestre i jednog brata. Moja mama je doktor, a tata je inženjer. Živim u Zagrebu.',
    q: 'How many siblings does Ana have in total?',
    o: ['Two', 'Three', 'Four', 'One'],
    c: 1,
    skill: 'reading',
  },
  {
    passage:
      'Ja sam Ana. Imam dvije sestre i jednog brata. Moja mama je doktor, a tata je inženjer. Živim u Zagrebu.',
    q: "What is Ana's father's job?",
    o: ['Doctor', 'Engineer', 'Teacher', 'Student'],
    c: 1,
    skill: 'reading',
  },
  {
    passage:
      'Ja sam Ana. Imam dvije sestre i jednog brata. Moja mama je doktor, a tata je inženjer. Živim u Zagrebu.',
    q: 'Where does Ana live?',
    o: ['Split', 'Dubrovnik', 'Zagreb', 'Rijeka'],
    c: 2,
    skill: 'reading',
  },
  {
    passage:
      'Marko ima psa. Pas se zove Rex. Rex je crn i velik. Marko i Rex svaki dan idu u park.',
    q: "What is the dog's name?",
    o: ['Marko', 'Rex', 'Ana', 'Park'],
    c: 1,
    skill: 'reading',
  },
  {
    passage:
      'Marko ima psa. Pas se zove Rex. Rex je crn i velik. Marko i Rex svaki dan idu u park.',
    q: 'What colour is Rex?',
    o: ['white', 'brown', 'black', 'red'],
    c: 2,
    skill: 'reading',
  },
  {
    passage:
      'Marko ima psa. Pas se zove Rex. Rex je crn i velik. Marko i Rex svaki dan idu u park.',
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
    q: 'What does the speaker not like?',
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

  // New reading — passage 5: Luka's family and home (4 items)
  {
    passage:
      'Zovem se Luka. Imam petnaest godina. Živim s mamom, tatom i sestrom. Naša kuća je mala, ali lijepa. Imam svoju sobu.',
    q: 'How old is Luka?',
    o: ['Twelve', 'Fourteen', 'Fifteen', 'Sixteen'],
    c: 2,
    skill: 'reading',
  },
  {
    passage:
      'Zovem se Luka. Imam petnaest godina. Živim s mamom, tatom i sestrom. Naša kuća je mala, ali lijepa. Imam svoju sobu.',
    q: 'Who does Luka live with?',
    o: [
      'Alone',
      'With his mother, father, and sister',
      'With his grandparents',
      'With his brother and sister',
    ],
    c: 1,
    skill: 'reading',
  },
  {
    passage:
      'Zovem se Luka. Imam petnaest godina. Živim s mamom, tatom i sestrom. Naša kuća je mala, ali lijepa. Imam svoju sobu.',
    q: 'How does Luka describe his house?',
    o: ['Big and beautiful', 'Small but beautiful', 'Old and ugly', 'New and large'],
    c: 1,
    skill: 'reading',
  },
  {
    passage:
      'Zovem se Luka. Imam petnaest godina. Živim s mamom, tatom i sestrom. Naša kuća je mala, ali lijepa. Imam svoju sobu.',
    q: 'Does Luka have his own room?',
    o: [
      'No, he shares a room.',
      'Yes, he has his own room.',
      'The text does not say.',
      'He sleeps in the living room.',
    ],
    c: 1,
    skill: 'reading',
  },

  // New reading — passage 6: Mia at the market (4 items)
  {
    passage:
      'Mia ide na tržnicu svaki petak. Kupuje voće i povrće. Danas kupuje jabuke, mrkve i kruh. Tržnica je blizu njene kuće.',
    q: 'How often does Mia go to the market?',
    o: ['Every day', 'Every Saturday', 'Every Friday', 'Once a month'],
    c: 2,
    skill: 'reading',
  },
  {
    passage:
      'Mia ide na tržnicu svaki petak. Kupuje voće i povrće. Danas kupuje jabuke, mrkve i kruh. Tržnica je blizu njene kuće.',
    q: 'What does Mia buy at the market in general?',
    o: ['Meat and fish', 'Fruit and vegetables', 'Bread and milk', 'Clothes and shoes'],
    c: 1,
    skill: 'reading',
  },
  {
    passage:
      'Mia ide na tržnicu svaki petak. Kupuje voće i povrće. Danas kupuje jabuke, mrkve i kruh. Tržnica je blizu njene kuće.',
    q: 'Which of the following does Mia buy today?',
    o: ['Oranges', 'Carrots', 'Cheese', 'Tomatoes'],
    c: 1,
    skill: 'reading',
  },
  {
    passage:
      'Mia ide na tržnicu svaki petak. Kupuje voće i povrće. Danas kupuje jabuke, mrkve i kruh. Tržnica je blizu njene kuće.',
    q: "Where is the market in relation to Mia's house?",
    o: ['Far away', 'In the city centre', 'Near her house', 'In another town'],
    c: 2,
    skill: 'reading',
  },

  // New reading — passage 7: Tomislav's morning routine (5 items)
  {
    passage:
      'Tomislav ustaje u sedam sati. Pije kavu i jede kruh s maslacem. Ne jede jaja. Ide na posao autobusom. Radi od osam do četiri.',
    q: 'What time does Tomislav wake up?',
    o: ["Six o'clock", "Seven o'clock", "Eight o'clock", "Nine o'clock"],
    c: 1,
    skill: 'reading',
  },
  {
    passage:
      'Tomislav ustaje u sedam sati. Pije kavu i jede kruh s maslacem. Ne jede jaja. Ide na posao autobusom. Radi od osam do četiri.',
    q: 'What does Tomislav eat for breakfast?',
    o: ['Eggs', 'Bread with butter', 'Cheese and ham', 'Yoghurt'],
    c: 1,
    skill: 'reading',
  },
  {
    passage:
      'Tomislav ustaje u sedam sati. Pije kavu i jede kruh s maslacem. Ne jede jaja. Ide na posao autobusom. Radi od osam do četiri.',
    q: 'How does Tomislav get to work?',
    o: ['By car', 'On foot', 'By bus', 'By tram'],
    c: 2,
    skill: 'reading',
  },
  {
    passage:
      'Tomislav ustaje u sedam sati. Pije kavu i jede kruh s maslacem. Ne jede jaja. Ide na posao autobusom. Radi od osam do četiri.',
    q: 'What does Tomislav NOT eat for breakfast?',
    o: ['Bread', 'Butter', 'Coffee', 'Eggs'],
    c: 3,
    skill: 'reading',
  },
  {
    passage:
      'Tomislav ustaje u sedam sati. Pije kavu i jede kruh s maslacem. Ne jede jaja. Ide na posao autobusom. Radi od osam do četiri.',
    q: 'At what time does Tomislav finish work?',
    o: ['At three', 'At four', 'At five', 'At six'],
    c: 1,
    skill: 'reading',
  },

  // New reading — passage 8: Café dialogue, harder inference items (7 items)
  {
    passage:
      'Konobar: Dobar dan! Što želite? Gost: Jednu kavu, molim. Konobar: Veliku ili malu? Gost: Malu, hvala. Konobar: Izvolite!',
    q: 'Who says the last line, "Izvolite!"?',
    o: ['The guest', 'The waiter', 'A third person', 'Cannot be determined'],
    c: 1,
    skill: 'reading',
  },
  {
    passage:
      'Konobar: Dobar dan! Što želite? Gost: Jednu kavu, molim. Konobar: Veliku ili malu? Gost: Malu, hvala. Konobar: Izvolite!',
    q: 'What size coffee does the guest order?',
    o: ['Large', 'Medium', 'Small', 'Extra large'],
    c: 2,
    skill: 'reading',
  },
  {
    passage:
      'Konobar: Dobar dan! Što želite? Gost: Jednu kavu, molim. Konobar: Veliku ili malu? Gost: Malu, hvala. Konobar: Izvolite!',
    q: "The waiter says 'Što želite?' — which pronoun register does 'želite' indicate?",
    o: [
      'Informal singular (ti)',
      'Formal/plural (Vi or vi)',
      'Third person singular (on/ona)',
      'First person plural (mi)',
    ],
    c: 1,
    skill: 'reading',
  },
  {
    passage:
      'Konobar: Dobar dan! Što želite? Gost: Jednu kavu, molim. Konobar: Veliku ili malu? Gost: Malu, hvala. Konobar: Izvolite!',
    q: "What does 'Izvolite!' most likely mean in this context?",
    o: ['Please sit down!', 'Here you are!', 'Thank you!', 'Goodbye!'],
    c: 1,
    skill: 'reading',
  },
  {
    passage:
      'Konobar: Dobar dan! Što želite? Gost: Jednu kavu, molim. Konobar: Veliku ili malu? Gost: Malu, hvala. Konobar: Izvolite!',
    q: "'Jednu kavu' — why is the feminine form 'jednu' used here?",
    o: [
      "Because 'kava' (coffee) is a feminine noun",
      "Because 'jednu' is always used before food and drinks",
      'Because the guest is female',
      "Because it follows the verb 'želite'",
    ],
    c: 0,
    skill: 'reading',
  },
  {
    passage:
      'Konobar: Dobar dan! Što želite? Gost: Jednu kavu, molim. Konobar: Veliku ili malu? Gost: Malu, hvala. Konobar: Izvolite!',
    q: 'What greeting does the waiter use?',
    o: ['Dobro jutro', 'Dobar dan', 'Dobra večer', 'Bok'],
    c: 1,
    skill: 'reading',
  },
  {
    passage:
      'Konobar: Dobar dan! Što želite? Gost: Jednu kavu, molim. Konobar: Veliku ili malu? Gost: Malu, hvala. Konobar: Izvolite!',
    q: "The guest says 'Jednu kavu, molim.' — which word expresses politeness?",
    o: ['Jednu', 'Kavu', 'Molim', 'Malu'],
    c: 2,
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

function loadFromJson(
  raw: unknown,
  levelFrom: CefrLevel,
  levelTo: CefrLevel,
): EquivalencyTestSet | null {
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
    description:
      typeof r.description === 'string' ? r.description : `Tests ${levelFrom} competency.`,
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
