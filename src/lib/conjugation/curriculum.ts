// src/lib/conjugation/curriculum.ts
import type { FormType } from './types';

export interface ConjUnit {
  id: string;
  cefr: 'A1' | 'A2' | 'B1' | 'B2';
  title: string;
  blurb: string;
  formTypes: FormType[];
  verbs: string[]; // infinitives — must exist in VERBS
  explainer?: string; // optional curEx to launch an existing explainer screen
}

// NOTE: `verbs` arrays must reference infinitives present in VERBS (grammar.js).
// As later phases author more form data, extend these lists in lockstep.
export const UNITS: ConjUnit[] = [
  {
    id: 'pres-classes',
    cefr: 'A1',
    title: 'Present — the 3 classes',
    blurb: '-am / -em / -im endings',
    formTypes: ['present'],
    verbs: ['čitati', 'pisati', 'govoriti', 'raditi'],
    explainer: 'tenses',
  },
  {
    id: 'biti',
    cefr: 'A1',
    title: 'biti (to be)',
    blurb: 'jesam/sam + nije/nisam',
    formTypes: ['present'],
    verbs: ['biti'],
  },
  {
    id: 'pres-irregular',
    cefr: 'A1',
    title: 'Irregular present',
    blurb: 'ići, jesti, piti, htjeti, moći',
    formTypes: ['present'],
    verbs: ['ići', 'jesti', 'piti'],
  },
  {
    id: 'negation',
    cefr: 'A1',
    title: 'Negation',
    blurb: 'ne + verb, nemam, nisam',
    formTypes: ['present'],
    verbs: ['imati', 'biti'],
  },
  {
    id: 'past',
    cefr: 'A2',
    title: 'Past (perfekt)',
    blurb: 'aux + l-participle, gender agreement',
    formTypes: ['past'],
    verbs: ['čitati', 'govoriti', 'ići'],
    explainer: 'past_tense_lesson',
  },
  {
    id: 'future1',
    cefr: 'A2',
    title: 'Future I (futur I)',
    blurb: 'inf + ću/ćeš, -t drop',
    formTypes: ['future1'],
    verbs: ['čitati', 'govoriti', 'ići'],
    explainer: 'future_tense_lesson',
  },
  {
    id: 'modals',
    cefr: 'A2',
    title: 'Modal verbs',
    blurb: 'morati, htjeti, moći + infinitive',
    formTypes: ['present'],
    verbs: ['htjeti', 'moći'],
    explainer: 'modal',
  },
  {
    id: 'aspect-intro',
    cefr: 'A2',
    title: 'Aspect — intro',
    blurb: 'impf vs pf; no perfective present-meaning',
    formTypes: ['present'],
    verbs: ['pisati'],
    explainer: 'aspectdrill',
  },
  {
    id: 'imperative',
    cefr: 'B1',
    title: 'Imperative',
    blurb: 'piši/pišimo/pišite; nemoj + inf',
    formTypes: ['imperative'],
    verbs: ['pisati', 'čitati'],
  },
  {
    id: 'aspect-tenses',
    cefr: 'B1',
    title: 'Aspect in past & future',
    blurb: 'pisao vs napisao',
    formTypes: ['past'],
    verbs: ['pisati'],
  },
  {
    id: 'reflexive',
    cefr: 'B1',
    title: 'Reflexive (se)',
    blurb: 'zovem se, osjećam se',
    formTypes: ['present'],
    verbs: ['govoriti'],
    explainer: 'reflexive',
  },
  {
    id: 'conditional',
    cefr: 'B1',
    title: 'Conditional I',
    blurb: 'bih/bi + l-participle',
    formTypes: ['conditional'],
    verbs: ['čitati', 'govoriti'],
    explainer: 'conditional',
  },
  {
    id: 'aspect-pairs',
    cefr: 'B2',
    title: 'Aspect pairs — formation',
    blurb: 'prefixation & suppletion',
    formTypes: ['present'],
    verbs: ['pisati'],
  },
  {
    id: 'aspect-matrix',
    cefr: 'B2',
    title: 'Aspect × tense matrix',
    blurb: 'perfective present = future meaning',
    formTypes: ['present', 'future1'],
    verbs: ['pisati'],
  },
  {
    id: 'motion-prefixes',
    cefr: 'B2',
    title: 'Verbs of motion + prefixes',
    blurb: 'ići → doći/otići/proći',
    formTypes: ['present'],
    verbs: ['ići'],
  },
  {
    id: 'consolidation',
    cefr: 'B2',
    title: 'Mixed mastery',
    blurb: 'interleaved review of everything',
    formTypes: ['present', 'past', 'future1'],
    verbs: ['čitati', 'pisati', 'govoriti', 'ići'],
  },
];
