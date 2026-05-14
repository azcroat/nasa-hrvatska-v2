/**
 * negation.contract.test.tsx — Pattern Y
 *
 * NegationScreen award auto-fires via handleAnswer when the last question is answered.
 * Buttons use inline styles (no .ob class) — the generic helper cannot drive the MC loop.
 * We verify the contract clauses are wired in source instead.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';

const source = readFileSync(
  join(__dirname, '../components/practice/exercises/NegationScreen.tsx'),
  'utf8',
);

describe('NegationScreen — contract clauses (Pattern Y)', () => {
  it('fires markQuest("grammar") on completion', () => {
    expect(source).toMatch(/markQuest\(['"]grammar['"]\)/);
  });

  it('calls writeDelta with gc:1 and vs:["negation"]', () => {
    expect(source).toMatch(/writeDelta\(\s*\{\s*gc:\s*1,\s*vs:\s*\[\s*['"]negation['"]\s*\]/);
  });

  it('calls setStats and increments gc by 1, appends "negation" to vs', () => {
    expect(source).toMatch(/gc:\s*\(prev\.gc\s*\|\|\s*0\)\s*\+\s*1/);
    expect(source).toMatch(/vs:\s*\[\.\.\.\(prev\.vs\s*\|\|\s*\[\]\),\s*['"]negation['"]\]/);
  });

  it('guards against duplicate first-time award (vs.includes check)', () => {
    expect(source).toMatch(/vs\?\.includes\(['"]negation['"]\)/);
  });
});
