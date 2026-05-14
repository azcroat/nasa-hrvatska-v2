/**
 * matchGame.contract.test.tsx — Pattern Y
 *
 * MatchGame uses role="button" div pairs for matching (not .ob MC buttons).
 * The generic UI helper cannot drive the pair-selection loop.
 * We verify the contract clauses are wired in source instead.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';

const source = readFileSync(join(__dirname, '../components/practice/MatchGame.tsx'), 'utf8');

describe('MatchGame — contract clauses (Pattern Y)', () => {
  it('fires markQuest("vocab") on completion', () => {
    expect(source).toMatch(/markQuest\(['"]vocab['"]\)/);
  });

  it('calls writeDelta with gc:1 and vs:["match"]', () => {
    expect(source).toMatch(/writeDelta\(\s*\{\s*gc:\s*1,\s*vs:\s*\[\s*['"]match['"]\s*\]/);
  });

  it('calls setStats and increments gc by 1, appends "match" to vs', () => {
    expect(source).toMatch(/gc:\s*\(prev\.gc\s*\|\|\s*0\)\s*\+\s*1/);
    expect(source).toMatch(/vs:\s*\[\.\.\.\(prev\.vs\s*\|\|\s*\[\]\),\s*['"]match['"]\]/);
  });

  it('guards against duplicate first-time award (vs.includes check)', () => {
    expect(source).toMatch(/vs\?\.includes\(['"]match['"]\)/);
  });

  it('calls award with activityType "vocabulary"', () => {
    expect(source).toMatch(/award\(\s*\d+,\s*false,\s*['"]vocabulary['"]\)/);
  });
});
