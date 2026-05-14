/**
 * genderDrill.contract.test.tsx — Pattern Y
 *
 * GenderDrillScreen has a multi-section UI (sort/plural/adj) with inline-style
 * option buttons — the generic helper cannot drive its MC loop.
 * We verify the contract clauses are wired in source instead.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';

const source = readFileSync(
  join(__dirname, '../components/practice/exercises/GenderDrillScreen.tsx'),
  'utf8',
);

describe('GenderDrillScreen — contract clauses (Pattern Y)', () => {
  it('fires markQuest("grammar") on completion', () => {
    expect(source).toMatch(/markQuest\(['"]grammar['"]\)/);
  });

  it('calls writeDelta with gc:1 and vs:["gender"]', () => {
    expect(source).toMatch(/writeDelta\(\s*\{\s*gc:\s*1,\s*vs:\s*\[\s*['"]gender['"]\s*\]/);
  });

  it('calls setStats and increments gc by 1, appends "gender" to vs', () => {
    expect(source).toMatch(/gc:\s*\(prev\.gc\s*\|\|\s*0\)\s*\+\s*1/);
    expect(source).toMatch(/vs:\s*\[\.\.\.\(prev\.vs\s*\|\|\s*\[\]\),\s*['"]gender['"]\]/);
  });

  it('guards against duplicate first-time award (vs.includes check)', () => {
    expect(source).toMatch(/vs\?\.includes\(['"]gender['"]\)/);
  });

  it('calls award with activityType "grammar"', () => {
    expect(source).toMatch(/award\(\s*\d+,\s*false,\s*['"]grammar['"]\)/);
  });
});
