/**
 * possessives.contract.test.tsx — Pattern Y
 *
 * PossessivesScreen uses inline-style option buttons (no .ob class); the generic
 * UI helper cannot click options to drive the MC loop.
 * We verify the contract clauses are wired in source instead.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';

const source = readFileSync(
  join(__dirname, '../components/practice/exercises/PossessivesScreen.tsx'),
  'utf8',
);

describe('PossessivesScreen — contract clauses (Pattern Y)', () => {
  it('has a finishFired guard to prevent double-firing', () => {
    expect(source).toMatch(/finishFired\.current/);
  });

  it('fires markQuest("grammar") on completion', () => {
    expect(source).toMatch(/markQuest\(['"]grammar['"]\)/);
  });

  it('calls award with activityType "grammar"', () => {
    expect(source).toMatch(/award\([^)]*['"]grammar['"]\)/);
  });

  it('calls setStats and increments gc by 1, appends "possessives" to vs', () => {
    expect(source).toMatch(/gc:\s*\(prev\.gc\s*\|\|\s*0\)\s*\+\s*1/);
    expect(source).toMatch(/vs:\s*\[\.\.\.\(prev\.vs\s*\|\|\s*\[\]\),\s*['"]possessives['"]\]/);
  });

  it('calls writeDelta with gc:1 and vs:["possessives"]', () => {
    expect(source).toMatch(/writeDelta\(\s*\{\s*gc:\s*1,\s*vs:\s*\[\s*['"]possessives['"]\s*\]/);
  });

  it('guards against duplicate first-time award (vs.includes check)', () => {
    expect(source).toMatch(/vs\?\.includes\(['"]possessives['"]\)/);
  });
});
