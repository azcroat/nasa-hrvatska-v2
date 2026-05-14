/**
 * bojeGame.contract.test.tsx — Pattern Y
 *
 * BojeGame is a multi-mode game (learn → quiz → results) with non-.ob buttons.
 * We verify the contract clauses are wired in source instead.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';

const source = readFileSync(join(__dirname, '../components/practice/BojeGame.tsx'), 'utf8');

describe('BojeGame — contract clauses (Pattern Y)', () => {
  it('fires markQuest("vocab") on completion', () => {
    expect(source).toMatch(/markQuest\(['"]vocab['"]\)/);
  });

  it('calls writeDelta with gc:1 and vs:["boje"]', () => {
    expect(source).toMatch(/writeDelta\(\s*\{\s*gc:\s*1,\s*vs:\s*\[\s*['"]boje['"]\s*\]/);
  });

  it('calls setStats and increments gc by 1, appends "boje" to vs', () => {
    expect(source).toMatch(/gc:\s*\(prev\.gc\s*\|\|\s*0\)\s*\+\s*1/);
    expect(source).toMatch(/vs:\s*\[\.\.\.\(prev\.vs\s*\|\|\s*\[\]\),\s*['"]boje['"]\]/);
  });

  it('guards against duplicate first-time award (vs.includes check)', () => {
    expect(source).toMatch(/vs\?\.includes\(['"]boje['"]\)/);
  });
});
