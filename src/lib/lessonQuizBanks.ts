// src/lib/lessonQuizBanks.ts
// Authored end-of-lesson comprehension checks for grammar lessons that have no
// built-in quiz. Each gates completion at LESSON_PASS_THRESHOLD via <LessonQuiz>.
import type { LessonQuizQuestion } from '../components/learn/LessonQuiz';

export const LESSON_QUIZ_BANKS: Record<string, LessonQuizQuestion[]> = {
  // ── Verb aspect (perfective vs imperfective) ──
  aspect: [
    {
      prompt: 'Which aspect describes a single, completed action?',
      options: ['Imperfective', 'Perfective'],
      correctIdx: 1,
    },
    {
      prompt: 'Which aspect describes an ongoing or repeated action?',
      options: ['Imperfective', 'Perfective'],
      correctIdx: 0,
    },
    {
      prompt: '“pisati → napisati”: the prefix na- turns the verb into the…',
      options: ['perfective', 'plural', 'past tense'],
      correctIdx: 0,
    },
    {
      prompt: 'Which verb is imperfective?',
      options: ['čitati', 'pročitati'],
      correctIdx: 0,
    },
    {
      prompt: '“Svaki dan ___ kavu.” (every day) — which fits?',
      options: ['pijem (impf)', 'popijem (pf)'],
      correctIdx: 0,
    },
    {
      prompt: 'A perfective verb’s present-tense form usually expresses…',
      options: ['a future/completed sense', 'a habitual present'],
      correctIdx: 0,
    },
  ],

  // ── Word formation (prefixes on the motion verb ići) ──
  wordform: [
    {
      prompt: '“doći” means…',
      options: ['to arrive / come', 'to leave', 'to enter'],
      correctIdx: 0,
    },
    {
      prompt: '“otići” means…',
      options: ['to go away / leave', 'to arrive', 'to pass'],
      correctIdx: 0,
    },
    { prompt: '“ući” means…', options: ['to enter / go in', 'to exit', 'to come'], correctIdx: 0 },
    {
      prompt: '“izaći” means…',
      options: ['to exit / go out', 'to enter', 'to arrive'],
      correctIdx: 0,
    },
    {
      prompt: '“proći” means…',
      options: ['to pass / go through', 'to enter', 'to leave'],
      correctIdx: 0,
    },
    {
      prompt: 'Prefixes attached to a base verb mainly change its…',
      options: ['meaning/direction', 'gender', 'spelling only'],
      correctIdx: 0,
    },
  ],

  // ── Diminutives (umanjenice) ──
  diminutives: [
    {
      prompt: 'A diminutive makes a noun feel…',
      options: ['small / affectionate', 'plural', 'formal'],
      correctIdx: 0,
    },
    {
      prompt: 'Which suffixes commonly form diminutives?',
      options: ['-ić / -ica', '-ost / -nje', '-ovi / -evi'],
      correctIdx: 0,
    },
    {
      prompt: 'Diminutive of “kuća” (house)?',
      options: ['kućica', 'kućina', 'kuće'],
      correctIdx: 0,
    },
    {
      prompt: 'Diminutive of “stol” (table)?',
      options: ['stolić', 'stolovi', 'stolina'],
      correctIdx: 0,
    },
    { prompt: 'Diminutive of “pas” (dog)?', options: ['psić', 'psina', 'pasovi'], correctIdx: 0 },
    {
      prompt: 'The opposite of a diminutive (making something big) is an…',
      options: ['augmentative', 'a comparative', 'a vocative'],
      correctIdx: 0,
    },
  ],

  // ── Phonology (Croatian sound system) ──
  phonology: [
    {
      prompt: 'Croatian spelling is essentially…',
      options: ['phonetic (one letter ≈ one sound)', 'full of silent letters'],
      correctIdx: 0,
    },
    {
      prompt: 'How many vowels does Croatian have?',
      options: ['5 (a, e, i, o, u)', '7', '12'],
      correctIdx: 0,
    },
    {
      prompt: 'Which is the softer sound?',
      options: ['ć', 'č'],
      correctIdx: 0,
    },
    {
      prompt: 'The digraph “nj” represents…',
      options: ['a single sound', 'two separate sounds'],
      correctIdx: 0,
    },
    {
      prompt: 'Can “r” act as a syllable nucleus (as in “vrt”, “prst”)?',
      options: ['Yes', 'No'],
      correctIdx: 0,
    },
    {
      prompt: '“dž” and “đ” are…',
      options: ['each a single sound', 'always pronounced d + ž'],
      correctIdx: 0,
    },
  ],
};
