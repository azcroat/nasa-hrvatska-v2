/**
 * reflexive.contract.test.tsx — Pattern Y
 *
 * ReflexiveScreen has a multi-tab UI (rules/tenses/verbs/quiz) with inline-style
 * option buttons in the quiz tab (no .ob class). The generic UI helper cannot
 * navigate tabs and click options to drive the MC loop.
 * We verify the contract clauses are wired in source instead.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';

const source = readFileSync(
  join(__dirname, '../components/practice/exercises/ReflexiveScreen.tsx'),
  'utf8',
);

describe('ReflexiveScreen — contract clauses (Pattern Y)', () => {
  it('has a questFiredRef guard to prevent double-firing', () => {
    expect(source).toMatch(/questFiredRef\.current/);
  });

  it('fires markQuest("grammar") on completion', () => {
    expect(source).toMatch(/markQuest\(['"]grammar['"]\)/);
  });

  it('calls award with activityType "grammar"', () => {
    expect(source).toMatch(/award\([^)]*['"]grammar['"]\)/);
  });

  it('calls setStats and increments gc by 1, appends "reflexive" to vs', () => {
    expect(source).toMatch(/gc:\s*\(prev\.gc\s*\|\|\s*0\)\s*\+\s*1/);
    expect(source).toMatch(/vs:\s*\[\.\.\.\(prev\.vs\s*\|\|\s*\[\]\),\s*['"]reflexive['"]\]/);
  });

  it('calls writeDelta with gc:1 and vs:["reflexive"]', () => {
    expect(source).toMatch(/writeDelta\(\s*\{\s*gc:\s*1,\s*vs:\s*\[\s*['"]reflexive['"]\s*\]/);
  });

  it('guards against duplicate first-time award (vs.includes check)', () => {
    expect(source).toMatch(/vs\?\.includes\(['"]reflexive['"]\)/);
  });
});
