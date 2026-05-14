/**
 * convMatch.contract.test.tsx — Pattern Y
 *
 * ConvMatchScreen uses dialogue-matching interaction with inline-style option buttons
 * across multiple conversation sections (no .ob class). The generic UI helper cannot
 * drive the full multi-section MC loop. We verify the contract clauses in source instead.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';

const source = readFileSync(
  join(__dirname, '../components/practice/exercises/ConvMatchScreen.tsx'),
  'utf8',
);

describe('ConvMatchScreen — contract clauses (Pattern Y)', () => {
  it('has a finishFired guard to prevent double-firing', () => {
    expect(source).toMatch(/finishFired\.current/);
  });

  it('fires markQuest("grammar") on completion', () => {
    expect(source).toMatch(/markQuest\(['"]grammar['"]\)/);
  });

  it('calls award with activityType "grammar"', () => {
    expect(source).toMatch(/award\([^)]*['"]grammar['"]\)/);
  });

  it('calls setStats and increments gc by 1, appends "conv-match" to vs', () => {
    expect(source).toMatch(/gc:\s*\(prev\.gc\s*\|\|\s*0\)\s*\+\s*1/);
    expect(source).toMatch(/vs:\s*\[\.\.\.\(prev\.vs\s*\|\|\s*\[\]\),\s*['"]conv-match['"]\]/);
  });

  it('calls writeDelta with gc:1 and vs:["conv-match"]', () => {
    expect(source).toMatch(/writeDelta\(\s*\{\s*gc:\s*1,\s*vs:\s*\[\s*['"]conv-match['"]\s*\]/);
  });

  it('guards against duplicate first-time award (vs.includes check)', () => {
    expect(source).toMatch(/vs\?\.includes\(['"]conv-match['"]\)/);
  });
});
