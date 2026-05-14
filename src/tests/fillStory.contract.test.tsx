/**
 * fillStory.contract.test.tsx — Pattern Y
 *
 * FillStoryScreen uses inline-style option buttons across multiple story sections
 * (no .ob class). The generic UI helper cannot drive the MC loop across all
 * story blanks. We verify the contract clauses are wired in source instead.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';

const source = readFileSync(
  join(__dirname, '../components/practice/exercises/FillStoryScreen.tsx'),
  'utf8',
);

describe('FillStoryScreen — contract clauses (Pattern Y)', () => {
  it('has a finishFired guard to prevent double-firing', () => {
    expect(source).toMatch(/finishFired\.current/);
  });

  it('fires markQuest("grammar") on completion', () => {
    expect(source).toMatch(/markQuest\(['"]grammar['"]\)/);
  });

  it('calls award with activityType "grammar"', () => {
    expect(source).toMatch(/award\([^)]*['"]grammar['"]\)/);
  });

  it('calls setStats and increments gc by 1, appends "fill-story" to vs', () => {
    expect(source).toMatch(/gc:\s*\(prev\.gc\s*\|\|\s*0\)\s*\+\s*1/);
    expect(source).toMatch(/vs:\s*\[\.\.\.\(prev\.vs\s*\|\|\s*\[\]\),\s*['"]fill-story['"]\]/);
  });

  it('calls writeDelta with gc:1 and vs:["fill-story"]', () => {
    expect(source).toMatch(/writeDelta\(\s*\{\s*gc:\s*1,\s*vs:\s*\[\s*['"]fill-story['"]\s*\]/);
  });

  it('guards against duplicate first-time award (vs.includes check)', () => {
    expect(source).toMatch(/vs\?\.includes\(['"]fill-story['"]\)/);
  });
});
