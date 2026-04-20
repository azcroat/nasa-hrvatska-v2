/**
 * content-validation.test.js
 * Validates the shape and integrity of all content data exported from appData.js.
 * These are structural/contract tests — they should always pass on the real data.
 */
import { describe, it, expect, vi } from 'vitest';

// ── Firebase mocks (required because data.jsx imports firebase) ──────────────
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
  getApps: vi.fn(() => []),
}));
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  setPersistence: vi.fn(() => Promise.resolve()),
  browserLocalPersistence: {},
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  onAuthStateChanged: vi.fn(() => () => {}),
  updateProfile: vi.fn(),
  initializeAuth: vi.fn(() => ({})),
  indexedDBLocalPersistence: {},
  browserSessionPersistence: {},
  inMemoryPersistence: {},
  GoogleAuthProvider: vi.fn(() => ({})),
  signInWithPopup: vi.fn(),
  sendEmailVerification: vi.fn(),
  deleteUser: vi.fn(),
}));
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  collection: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  limit: vi.fn(),
  orderBy: vi.fn(),
}));

import {
  V,
  ASPECT,
  ASPECT_PAIRS,
  PADEZI,
  STORIES,
  PROVERBS,
  VOCATIVE,
  NUMCOUNT,
  FALSEFR,
  BRZALICE,
  DECL,
  PREPDRILL,
  UNJUMBLE,
} from '../lib/appData.js';
import { TRANSLATE_DRILLS } from '../data/exercises.js';
import { V_B2 } from '../data/vocabulary.js';
import { LESSONS } from '../data/lessons.js';

// ═══════════════════════════════════════════════════════════════════════════════
// V — Vocabulary object (keys → arrays of [hr, en, ...optional] tuples)
// ═══════════════════════════════════════════════════════════════════════════════
describe('V (vocabulary categories)', () => {
  it('V is a non-null object', () => {
    expect(V).toBeDefined();
    expect(typeof V).toBe('object');
    expect(V).not.toBeNull();
    expect(Array.isArray(V)).toBe(false);
  });

  it('V has at least 10 category keys', () => {
    expect(Object.keys(V).length).toBeGreaterThanOrEqual(10);
  });

  it('known essential categories exist', () => {
    expect(V).toHaveProperty('greetings');
    expect(V).toHaveProperty('numbers');
    expect(V).toHaveProperty('family');
    expect(V).toHaveProperty('colors');
    expect(V).toHaveProperty('adjectives');
  });

  it('every category value is a non-empty array', () => {
    for (const [cat, entries] of Object.entries(V)) {
      expect(Array.isArray(entries), `${cat} should be an array`).toBe(true);
      expect(entries.length, `${cat} should be non-empty`).toBeGreaterThan(0);
    }
  });

  it('every entry in every category is an array with at least 2 elements', () => {
    for (const [cat, entries] of Object.entries(V)) {
      for (const entry of entries) {
        expect(
          Array.isArray(entry),
          `entry in ${cat} should be array: ${JSON.stringify(entry)}`,
        ).toBe(true);
        expect(
          entry.length,
          `entry in ${cat} needs hr+en: ${JSON.stringify(entry)}`,
        ).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('every entry has a non-empty Croatian string (index 0)', () => {
    for (const [cat, entries] of Object.entries(V)) {
      for (const entry of entries) {
        expect(typeof entry[0], `hr in ${cat} should be string`).toBe('string');
        expect(
          entry[0].trim().length,
          `hr in ${cat} is empty: ${JSON.stringify(entry)}`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it('every entry has a non-empty English string (index 1)', () => {
    for (const [cat, entries] of Object.entries(V)) {
      for (const entry of entries) {
        expect(typeof entry[1], `en in ${cat} should be string`).toBe('string');
        expect(
          entry[1].trim().length,
          `en in ${cat} is empty: ${JSON.stringify(entry)}`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it('greetings category has Bog and Hvala', () => {
    const hrWords = V.greetings.map((e) => e[0]);
    expect(hrWords).toContain('Bog');
    expect(hrWords).toContain('Hvala');
  });

  it('numbers category has 1–10 in Croatian', () => {
    const hrWords = V.numbers.map((e) => e[0]);
    expect(hrWords).toContain('Jedan');
    expect(hrWords).toContain('Deset');
  });

  it('counts total vocabulary items and logs the total', () => {
    const total = Object.values(V).reduce((sum, entries) => sum + entries.length, 0);
    console.info(`Total vocabulary items across all V categories: ${total}`);
    expect(total).toBeGreaterThan(200);
  });

  it('no category has duplicate Croatian words within itself', () => {
    for (const [cat, entries] of Object.entries(V)) {
      const hrWords = entries.map((e) => e[0].toLowerCase().trim());
      const unique = new Set(hrWords);
      expect(unique.size, `Duplicate Croatian words found in category "${cat}"`).toBe(
        hrWords.length,
      );
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// ASPECT — verb aspect object with pairs array
// ═══════════════════════════════════════════════════════════════════════════════
describe('ASPECT (verb aspect object)', () => {
  it('ASPECT is a non-null object', () => {
    expect(ASPECT).toBeDefined();
    expect(typeof ASPECT).toBe('object');
    expect(ASPECT).not.toBeNull();
  });

  it('ASPECT has title and intro strings', () => {
    expect(typeof ASPECT.title).toBe('string');
    expect(ASPECT.title.length).toBeGreaterThan(0);
    expect(typeof ASPECT.intro).toBe('string');
    expect(ASPECT.intro.length).toBeGreaterThan(0);
  });

  it('ASPECT.pairs is a non-empty array', () => {
    expect(Array.isArray(ASPECT.pairs)).toBe(true);
    expect(ASPECT.pairs.length).toBeGreaterThan(0);
  });

  it('each ASPECT pair has impf and perf string fields', () => {
    for (const pair of ASPECT.pairs) {
      expect(typeof pair.impf, `impf missing in pair: ${JSON.stringify(pair)}`).toBe('string');
      expect(pair.impf.trim().length).toBeGreaterThan(0);
      expect(typeof pair.perf, `perf missing in pair: ${JSON.stringify(pair)}`).toBe('string');
      expect(pair.perf.trim().length).toBeGreaterThan(0);
    }
  });

  it('each ASPECT pair has an English translation', () => {
    for (const pair of ASPECT.pairs) {
      expect(typeof pair.en).toBe('string');
      expect(pair.en.trim().length).toBeGreaterThan(0);
    }
  });

  it('ASPECT.pairs has at least 5 pairs', () => {
    expect(ASPECT.pairs.length).toBeGreaterThanOrEqual(5);
  });

  it('ASPECT.quiz is a non-empty array', () => {
    expect(Array.isArray(ASPECT.quiz)).toBe(true);
    expect(ASPECT.quiz.length).toBeGreaterThan(0);
  });

  it('each ASPECT quiz item has q, a, and al fields', () => {
    for (const item of ASPECT.quiz) {
      expect(typeof item.q).toBe('string');
      expect(typeof item.a).toBe('string');
      expect(Array.isArray(item.al)).toBe(true);
      expect(item.al.length).toBeGreaterThan(0);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// ASPECT_PAIRS — standalone aspect pairs array
// ═══════════════════════════════════════════════════════════════════════════════
describe('ASPECT_PAIRS (standalone verb pairs)', () => {
  it('ASPECT_PAIRS is a non-empty array', () => {
    expect(Array.isArray(ASPECT_PAIRS)).toBe(true);
    expect(ASPECT_PAIRS.length).toBeGreaterThan(0);
  });

  it('each pair has impf (imperfective) string', () => {
    for (const pair of ASPECT_PAIRS) {
      expect(typeof pair.impf, `impf missing: ${JSON.stringify(pair)}`).toBe('string');
      expect(pair.impf.trim().length).toBeGreaterThan(0);
    }
  });

  it('each pair has pf (perfective) string', () => {
    for (const pair of ASPECT_PAIRS) {
      expect(typeof pair.pf, `pf missing: ${JSON.stringify(pair)}`).toBe('string');
      expect(pair.pf.trim().length).toBeGreaterThan(0);
    }
  });

  it('each pair has an English translation', () => {
    for (const pair of ASPECT_PAIRS) {
      expect(typeof pair.en).toBe('string');
      expect(pair.en.trim().length).toBeGreaterThan(0);
    }
  });

  it('each pair has a rule explanation string', () => {
    for (const pair of ASPECT_PAIRS) {
      expect(typeof pair.rule).toBe('string');
      expect(pair.rule.trim().length).toBeGreaterThan(0);
    }
  });

  it('each pair has a ctx (context examples) string', () => {
    for (const pair of ASPECT_PAIRS) {
      expect(typeof pair.ctx).toBe('string');
      expect(pair.ctx.trim().length).toBeGreaterThan(0);
    }
  });

  it('ASPECT_PAIRS has at least 20 pairs', () => {
    expect(ASPECT_PAIRS.length).toBeGreaterThanOrEqual(20);
  });

  it('impf and pf values are always different', () => {
    for (const pair of ASPECT_PAIRS) {
      expect(pair.impf).not.toBe(pair.pf);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// PADEZI — Croatian cases object
// ═══════════════════════════════════════════════════════════════════════════════
describe('PADEZI (Croatian cases)', () => {
  it('PADEZI is a non-null object', () => {
    expect(PADEZI).toBeDefined();
    expect(typeof PADEZI).toBe('object');
    expect(PADEZI).not.toBeNull();
  });

  it('PADEZI has a title string', () => {
    expect(typeof PADEZI.title).toBe('string');
    expect(PADEZI.title.length).toBeGreaterThan(0);
  });

  it('PADEZI.cases is a non-empty array', () => {
    expect(Array.isArray(PADEZI.cases)).toBe(true);
    expect(PADEZI.cases.length).toBeGreaterThan(0);
  });

  it('PADEZI has exactly 7 cases (all Croatian cases)', () => {
    expect(PADEZI.cases.length).toBe(7);
  });

  it('each case entry has a name string', () => {
    for (const c of PADEZI.cases) {
      expect(typeof c.name, `name missing in case: ${JSON.stringify(c)}`).toBe('string');
      expect(c.name.trim().length).toBeGreaterThan(0);
    }
  });

  it('each case entry has an English name (en field)', () => {
    for (const c of PADEZI.cases) {
      expect(typeof c.en, `en missing in case ${c.name}`).toBe('string');
      expect(c.en.trim().length).toBeGreaterThan(0);
    }
  });

  it('each case entry has a use description', () => {
    for (const c of PADEZI.cases) {
      expect(typeof c.use, `use missing in case ${c.name}`).toBe('string');
      expect(c.use.trim().length).toBeGreaterThan(0);
    }
  });

  it('each case entry has example sentences (exs array)', () => {
    for (const c of PADEZI.cases) {
      expect(Array.isArray(c.exs), `exs missing in case ${c.name}`).toBe(true);
      expect(c.exs.length).toBeGreaterThan(0);
    }
  });

  it('case names include Nominativ, Genitiv, Akuzativ, Dativ', () => {
    const names = PADEZI.cases.map((c) => c.name);
    expect(names).toContain('Nominativ');
    expect(names).toContain('Genitiv');
    expect(names).toContain('Akuzativ');
    expect(names).toContain('Dativ');
  });

  it('PADEZI.quiz is an array of quiz questions', () => {
    expect(Array.isArray(PADEZI.quiz)).toBe(true);
    expect(PADEZI.quiz.length).toBeGreaterThan(0);
  });

  it('each quiz item has q, a, and al fields', () => {
    for (const item of PADEZI.quiz) {
      expect(typeof item.q).toBe('string');
      expect(typeof item.a).toBe('string');
      expect(Array.isArray(item.al)).toBe(true);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// STORIES — interactive story array
// ═══════════════════════════════════════════════════════════════════════════════
describe('STORIES (interactive stories)', () => {
  it('STORIES is a non-empty array', () => {
    expect(Array.isArray(STORIES)).toBe(true);
    expect(STORIES.length).toBeGreaterThan(0);
  });

  it('each story has a title string', () => {
    for (const story of STORIES) {
      expect(
        typeof story.title,
        `title missing in story: ${JSON.stringify(story).slice(0, 80)}`,
      ).toBe('string');
      expect(story.title.trim().length).toBeGreaterThan(0);
    }
  });

  it('each story has a CEFR level string', () => {
    const validCEFR = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    for (const story of STORIES) {
      expect(typeof story.cefr).toBe('string');
      expect(validCEFR).toContain(story.cefr);
    }
  });

  it('each story has a scenes array', () => {
    for (const story of STORIES) {
      expect(Array.isArray(story.scenes), `scenes missing in story "${story.title}"`).toBe(true);
      expect(story.scenes.length).toBeGreaterThan(0);
    }
  });

  it('each scene has a text string', () => {
    for (const story of STORIES) {
      for (const scene of story.scenes) {
        expect(typeof scene.text, `scene text missing in "${story.title}"`).toBe('string');
        expect(scene.text.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('each scene has an English translation (en)', () => {
    for (const story of STORIES) {
      for (const scene of story.scenes) {
        expect(typeof scene.en, `scene en missing in "${story.title}"`).toBe('string');
        expect(scene.en.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('each scene has a choices array', () => {
    for (const story of STORIES) {
      for (const scene of story.scenes) {
        expect(Array.isArray(scene.choices), `choices missing in scene of "${story.title}"`).toBe(
          true,
        );
      }
    }
  });

  it('STORIES has at least 3 stories', () => {
    expect(STORIES.length).toBeGreaterThanOrEqual(3);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// PROVERBS — Croatian proverbs array
// ═══════════════════════════════════════════════════════════════════════════════
describe('PROVERBS (Croatian proverbs)', () => {
  it('PROVERBS is a non-empty array', () => {
    expect(Array.isArray(PROVERBS)).toBe(true);
    expect(PROVERBS.length).toBeGreaterThan(0);
  });

  it('each proverb has a Croatian hr string', () => {
    for (const p of PROVERBS) {
      expect(typeof p.hr, `hr missing in proverb: ${JSON.stringify(p)}`).toBe('string');
      expect(p.hr.trim().length).toBeGreaterThan(0);
    }
  });

  it('each proverb has an English en string', () => {
    for (const p of PROVERBS) {
      expect(typeof p.en, `en missing in proverb: ${JSON.stringify(p)}`).toBe('string');
      expect(p.en.trim().length).toBeGreaterThan(0);
    }
  });

  it('PROVERBS has at least 20 proverbs', () => {
    expect(PROVERBS.length).toBeGreaterThanOrEqual(20);
  });

  it('contains the classic "Tko rano rani" proverb', () => {
    const found = PROVERBS.some((p) => p.hr.includes('Tko rano rani'));
    expect(found).toBe(true);
  });

  it('no proverb has an empty Croatian text', () => {
    for (const p of PROVERBS) {
      expect(p.hr.trim()).not.toBe('');
    }
  });

  it('no proverb has an empty English text', () => {
    for (const p of PROVERBS) {
      expect(p.en.trim()).not.toBe('');
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// VOCATIVE — vocative case rules object
// ═══════════════════════════════════════════════════════════════════════════════
describe('VOCATIVE (vocative case)', () => {
  it('VOCATIVE is a non-null object', () => {
    expect(VOCATIVE).toBeDefined();
    expect(typeof VOCATIVE).toBe('object');
    expect(VOCATIVE).not.toBeNull();
  });

  it('VOCATIVE has a title string', () => {
    expect(typeof VOCATIVE.title).toBe('string');
    expect(VOCATIVE.title.length).toBeGreaterThan(0);
  });

  it('VOCATIVE.rules is a non-empty array', () => {
    expect(Array.isArray(VOCATIVE.rules)).toBe(true);
    expect(VOCATIVE.rules.length).toBeGreaterThan(0);
  });

  it('each rule has pattern and transform strings', () => {
    for (const rule of VOCATIVE.rules) {
      expect(typeof rule.pattern).toBe('string');
      expect(rule.pattern.trim().length).toBeGreaterThan(0);
      expect(typeof rule.transform).toBe('string');
      expect(rule.transform.trim().length).toBeGreaterThan(0);
    }
  });

  it('each rule has examples array', () => {
    for (const rule of VOCATIVE.rules) {
      expect(Array.isArray(rule.examples)).toBe(true);
      expect(rule.examples.length).toBeGreaterThan(0);
    }
  });

  it('VOCATIVE.quiz is a non-empty array', () => {
    expect(Array.isArray(VOCATIVE.quiz)).toBe(true);
    expect(VOCATIVE.quiz.length).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// NUMCOUNT — number + noun agreement object
// ═══════════════════════════════════════════════════════════════════════════════
describe('NUMCOUNT (number + noun agreement)', () => {
  it('NUMCOUNT is a non-null object', () => {
    expect(NUMCOUNT).toBeDefined();
    expect(typeof NUMCOUNT).toBe('object');
    expect(NUMCOUNT).not.toBeNull();
  });

  it('NUMCOUNT has a title string', () => {
    expect(typeof NUMCOUNT.title).toBe('string');
    expect(NUMCOUNT.title.length).toBeGreaterThan(0);
  });

  it('NUMCOUNT.rule is a non-empty array', () => {
    expect(Array.isArray(NUMCOUNT.rule)).toBe(true);
    expect(NUMCOUNT.rule.length).toBeGreaterThan(0);
  });

  it('each rule entry has num, form, and rule strings', () => {
    for (const r of NUMCOUNT.rule) {
      expect(typeof r.num).toBe('string');
      expect(typeof r.form).toBe('string');
      expect(typeof r.rule).toBe('string');
    }
  });

  it('NUMCOUNT.quiz is a non-empty array', () => {
    expect(Array.isArray(NUMCOUNT.quiz)).toBe(true);
    expect(NUMCOUNT.quiz.length).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// FALSEFR — false friends array
// ═══════════════════════════════════════════════════════════════════════════════
describe('FALSEFR (false friends)', () => {
  it('FALSEFR is a non-empty array', () => {
    expect(Array.isArray(FALSEFR)).toBe(true);
    expect(FALSEFR.length).toBeGreaterThan(0);
  });

  it('each false friend has hr, looks, and means strings', () => {
    for (const ff of FALSEFR) {
      expect(typeof ff.hr).toBe('string');
      expect(ff.hr.trim().length).toBeGreaterThan(0);
      expect(typeof ff.looks).toBe('string');
      expect(ff.looks.trim().length).toBeGreaterThan(0);
      expect(typeof ff.means).toBe('string');
      expect(ff.means.trim().length).toBeGreaterThan(0);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// BRZALICE — tongue twisters array
// ═══════════════════════════════════════════════════════════════════════════════
describe('BRZALICE (tongue twisters)', () => {
  it('BRZALICE is a non-empty array', () => {
    expect(Array.isArray(BRZALICE)).toBe(true);
    expect(BRZALICE.length).toBeGreaterThan(0);
  });

  it('each tongue twister has hr and en strings', () => {
    for (const b of BRZALICE) {
      expect(typeof b.hr).toBe('string');
      expect(b.hr.trim().length).toBeGreaterThan(0);
      expect(typeof b.en).toBe('string');
      expect(b.en.trim().length).toBeGreaterThan(0);
    }
  });

  it('each tongue twister has a focus field', () => {
    for (const b of BRZALICE) {
      expect(typeof b.focus).toBe('string');
      expect(b.focus.trim().length).toBeGreaterThan(0);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// DECL — noun declension trainer object
// ═══════════════════════════════════════════════════════════════════════════════
describe('DECL (noun declension trainer)', () => {
  it('DECL is a non-null object', () => {
    expect(DECL).toBeDefined();
    expect(typeof DECL).toBe('object');
    expect(DECL).not.toBeNull();
  });

  it('DECL.nouns is a non-empty array', () => {
    expect(Array.isArray(DECL.nouns)).toBe(true);
    expect(DECL.nouns.length).toBeGreaterThan(0);
  });

  it('each noun has nom, en, g, and cases fields', () => {
    for (const noun of DECL.nouns) {
      expect(typeof noun.nom).toBe('string');
      expect(typeof noun.en).toBe('string');
      expect(['m', 'f', 'n']).toContain(noun.g);
      expect(Array.isArray(noun.cases)).toBe(true);
      expect(noun.cases.length).toBe(7);
    }
  });

  it('DECL.caseNames has 7 entries (all Croatian cases)', () => {
    expect(Array.isArray(DECL.caseNames)).toBe(true);
    expect(DECL.caseNames.length).toBe(7);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// PREPDRILL — preposition drill array
// ═══════════════════════════════════════════════════════════════════════════════
describe('PREPDRILL (preposition drills)', () => {
  it('PREPDRILL is a non-empty array', () => {
    expect(Array.isArray(PREPDRILL)).toBe(true);
    expect(PREPDRILL.length).toBeGreaterThan(0);
  });

  it('each drill has sentence, answer, opts, and en fields', () => {
    for (const drill of PREPDRILL) {
      expect(typeof drill.sentence).toBe('string');
      expect(drill.sentence.trim().length).toBeGreaterThan(0);
      expect(typeof drill.answer).toBe('string');
      expect(drill.answer.trim().length).toBeGreaterThan(0);
      expect(Array.isArray(drill.opts)).toBe(true);
      expect(drill.opts.length).toBeGreaterThan(1);
      expect(typeof drill.en).toBe('string');
      expect(drill.en.trim().length).toBeGreaterThan(0);
    }
  });

  it('correct answer is always present in the opts array', () => {
    for (const drill of PREPDRILL) {
      expect(drill.opts).toContain(drill.answer);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// UNJUMBLE — word-order drill array
// ═══════════════════════════════════════════════════════════════════════════════
describe('UNJUMBLE (word-order drills)', () => {
  it('UNJUMBLE is a non-empty array', () => {
    expect(Array.isArray(UNJUMBLE)).toBe(true);
    expect(UNJUMBLE.length).toBeGreaterThan(0);
  });

  it('each item has words, correct, and en fields', () => {
    for (const item of UNJUMBLE) {
      expect(Array.isArray(item.words)).toBe(true);
      expect(item.words.length).toBeGreaterThan(1);
      expect(typeof item.correct).toBe('string');
      expect(item.correct.trim().length).toBeGreaterThan(0);
      expect(typeof item.en).toBe('string');
      expect(item.en.trim().length).toBeGreaterThan(0);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Cross-cutting / summary checks
// ═══════════════════════════════════════════════════════════════════════════════
describe('Cross-cutting integrity checks', () => {
  it('all key arrays (ASPECT_PAIRS, STORIES, PROVERBS, BRZALICE, PREPDRILL, UNJUMBLE) are non-empty', () => {
    expect(ASPECT_PAIRS.length).toBeGreaterThan(0);
    expect(STORIES.length).toBeGreaterThan(0);
    expect(PROVERBS.length).toBeGreaterThan(0);
    expect(BRZALICE.length).toBeGreaterThan(0);
    expect(PREPDRILL.length).toBeGreaterThan(0);
    expect(UNJUMBLE.length).toBeGreaterThan(0);
  });

  it('V categories total over 200 vocabulary items', () => {
    const total = Object.values(V).reduce((sum, entries) => sum + entries.length, 0);
    expect(total).toBeGreaterThan(200);
  });

  it('PROVERBS hr values are all unique (no duplicate proverbs)', () => {
    const hrTexts = PROVERBS.map((p) => p.hr.trim());
    const unique = new Set(hrTexts);
    expect(unique.size).toBe(hrTexts.length);
  });

  it('ASPECT.pairs impf values are all unique', () => {
    const impfValues = ASPECT.pairs.map((p) => p.impf.trim());
    const unique = new Set(impfValues);
    expect(unique.size).toBe(impfValues.length);
  });

  it('ASPECT_PAIRS impf values are all unique', () => {
    const impfValues = ASPECT_PAIRS.map((p) => p.impf.trim());
    const unique = new Set(impfValues);
    expect(unique.size).toBe(impfValues.length);
  });

  it('DECL nouns nominative forms are all unique', () => {
    const nomForms = DECL.nouns.map((n) => n.nom.trim());
    const unique = new Set(nomForms);
    expect(unique.size).toBe(nomForms.length);
  });

  it('STORIES titles are all unique', () => {
    const titles = STORIES.map((s) => s.title.trim());
    const unique = new Set(titles);
    expect(unique.size).toBe(titles.length);
  });

  it('PADEZI case names are all unique', () => {
    const names = PADEZI.cases.map((c) => c.name.trim());
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });

  it('PREPDRILL sentences are all unique', () => {
    const sentences = PREPDRILL.map((d) => d.sentence.trim());
    const unique = new Set(sentences);
    expect(unique.size).toBe(sentences.length);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TRANSLATE_DRILLS — EN→HR production drills
// ═══════════════════════════════════════════════════════════════════════════════
describe('TRANSLATE_DRILLS', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(TRANSLATE_DRILLS)).toBe(true);
    expect(TRANSLATE_DRILLS.length).toBeGreaterThan(0);
  });

  it('every drill has en, hr, opts, level fields', () => {
    for (const d of TRANSLATE_DRILLS) {
      expect(typeof d.en).toBe('string');
      expect(typeof d.hr).toBe('string');
      expect(Array.isArray(d.opts)).toBe(true);
      expect(['A2', 'B1', 'B2']).toContain(d.level);
    }
  });

  it('every drill has exactly 4 options', () => {
    for (const d of TRANSLATE_DRILLS) {
      expect(d.opts.length).toBe(4);
    }
  });

  it('correct answer is always one of the options', () => {
    for (const d of TRANSLATE_DRILLS) {
      expect(d.opts).toContain(d.hr);
    }
  });

  it('no duplicate correct answers (hr values are unique within drills)', () => {
    const hrs = TRANSLATE_DRILLS.map((d) => d.hr);
    const unique = new Set(hrs);
    expect(unique.size).toBe(hrs.length);
  });

  it('options within each drill are unique', () => {
    for (const d of TRANSLATE_DRILLS) {
      const unique = new Set(d.opts);
      expect(unique.size).toBe(d.opts.length);
    }
  });

  it('has drills at each level: A2, B1, B2', () => {
    const levels = new Set(TRANSLATE_DRILLS.map((d) => d.level));
    expect(levels.has('A2')).toBe(true);
    expect(levels.has('B1')).toBe(true);
    expect(levels.has('B2')).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// V_B2 — B2/C1 vocabulary module
// ═══════════════════════════════════════════════════════════════════════════════
describe('V_B2', () => {
  it('is a non-null object with topic keys', () => {
    expect(V_B2).toBeDefined();
    expect(typeof V_B2).toBe('object');
    expect(Object.keys(V_B2).length).toBeGreaterThan(0);
  });

  it('every topic is a non-empty array of entries', () => {
    for (const [topic, entries] of Object.entries(V_B2)) {
      expect(Array.isArray(entries), `${topic} should be array`).toBe(true);
      expect(entries.length, `${topic} should be non-empty`).toBeGreaterThan(0);
    }
  });

  it('every entry has at least 2 elements (Croatian and English)', () => {
    for (const [topic, entries] of Object.entries(V_B2)) {
      for (const entry of entries) {
        expect(Array.isArray(entry), `entry in ${topic} should be array`).toBe(true);
        expect(entry.length, `entry in ${topic} needs hr+en`).toBeGreaterThanOrEqual(2);
        expect(typeof entry[0]).toBe('string');
        expect(typeof entry[1]).toBe('string');
      }
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// LESSONS — animated lesson definitions
// ═══════════════════════════════════════════════════════════════════════════════
describe('LESSONS', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(LESSONS)).toBe(true);
    expect(LESSONS.length).toBeGreaterThan(0);
  });

  it('every lesson has required fields: id, title, level, slides', () => {
    for (const lesson of LESSONS) {
      expect(typeof lesson.id).toBe('string');
      expect(typeof lesson.title).toBe('string');
      expect(typeof lesson.level).toBe('string');
      expect(Array.isArray(lesson.slides)).toBe(true);
      expect(lesson.slides.length).toBeGreaterThan(0);
    }
  });

  it('lesson IDs are unique', () => {
    const ids = LESSONS.map((l) => l.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('expected lessons exist: alphabet, past-tense, future-tense, vi-vs-ti', () => {
    const ids = LESSONS.map((l) => l.id);
    expect(ids).toContain('alphabet');
    expect(ids).toContain('past-tense');
    expect(ids).toContain('future-tense');
    expect(ids).toContain('vi-vs-ti');
  });

  it('every slide has a type field', () => {
    for (const lesson of LESSONS) {
      for (const slide of lesson.slides) {
        expect(typeof slide.type).toBe('string');
      }
    }
  });
});
