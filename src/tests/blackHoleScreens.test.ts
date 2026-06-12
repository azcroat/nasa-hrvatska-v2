import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// Read the BLACK_HOLE_SCREENS object literal from the launcher source.
const src = readFileSync('src/hooks/useScreenLauncher.ts', 'utf8');
const start = src.indexOf('BLACK_HOLE_SCREENS');
const block = src.slice(start, src.indexOf('};', start));

describe('dwell-credit removal for gated screens', () => {
  // Lessons (now self-report via completeLesson) + drills that write their own vs flag.
  const removed = [
    'declension',
    'tenses',
    'conditional',
    'impersonal',
    'formalregister',
    'future_tense_lesson',
    'aspect',
    'wordform',
    'diminutives',
    'phonology',
    'conjdrill',
    'negation',
    'clitic',
  ];
  it('none of the gated/self-reporting screens are dwell-credited anymore', () => {
    for (const id of removed) {
      expect(block.includes(`${id}:`), `${id} still dwell-credited`).toBe(false);
    }
  });

  it('reference/culture/vocab screens still ARE dwell-credited (not over-removed)', () => {
    for (const id of ['weather', 'kings', 'top100', 'idioms', 'proverbs', 'recipes']) {
      expect(block.includes(`${id}:`), id).toBe(true);
    }
  });

  it('vs-less drills are intentionally KEPT (removal would break their completion)', () => {
    // These write no vs flag, so dwell-credit is their only LEARN_PATH completion path
    // until a self-report is added (documented follow-up). Must remain for now.
    for (const id of ['vocative', 'conjpractice', 'conjlab']) {
      expect(block.includes(`${id}:`), id).toBe(true);
    }
  });
});
