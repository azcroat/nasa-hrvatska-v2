/**
 * contentDepth.test.ts — regression guard for the A1–B1 content-depth plan.
 *
 * The high-traffic drill pools were doubled (content-depth Batches 1–6) so daily
 * users don't re-see the same items within days. This guard makes "thin pool" a
 * test failure, not a silent complaint: if anyone trims a pool back below its
 * minimum, CI fails here.
 *
 * Drill/Cloze item arrays are module-local consts (not exported), so we count
 * items by reading the source text; ZNAM is exported, so we count it directly.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function countMatches(relPathFromRoot: string, re: RegExp): number {
  const src = readFileSync(resolve(process.cwd(), relPathFromRoot), 'utf8');
  return (src.match(re) || []).length;
}

describe('content depth — high-traffic A1–B1 pools meet minimum size', () => {
  const drills: Array<{ name: string; path: string; re: RegExp; min: number }> = [
    {
      name: 'GenitiveDrill',
      path: 'src/components/practice/GenitiveDrill.tsx',
      re: /answer:/g,
      min: 50,
    },
    {
      name: 'AccusativeDrill',
      path: 'src/components/practice/AccusativeDrill.tsx',
      re: /answer:/g,
      min: 50,
    },
    {
      name: 'LocativeDrill',
      path: 'src/components/practice/LocativeDrill.tsx',
      re: /answer:/g,
      min: 50,
    },
    {
      name: 'CliticDrill',
      path: 'src/components/practice/CliticDrill.tsx',
      re: /answer:/g,
      min: 50,
    },
    {
      name: 'ClozeEngine SENTENCE_BANK',
      path: 'src/components/practice/ClozeEngine.tsx',
      re: /blank:/g,
      min: 60,
    },
  ];

  for (const d of drills) {
    it(`${d.name} has at least ${d.min} items`, () => {
      expect(countMatches(d.path, d.re)).toBeGreaterThanOrEqual(d.min);
    });
  }

  it('ZNAM has at least 100 sentences', async () => {
    const { ZNAM } = (await import('../data/vocabulary.js')) as {
      ZNAM: { sections: Array<{ sentences: unknown[] }> };
    };
    const total = ZNAM.sections.reduce((sum, s) => sum + s.sentences.length, 0);
    expect(total).toBeGreaterThanOrEqual(100);
  });
});
