/**
 * sentenceTile.contract.test.tsx — Pattern Y
 *
 * SentenceTileScreen uses tile drag/click ordering interaction (not .ob MC buttons).
 * We verify the contract clauses are wired in source instead.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';

const source = readFileSync(
  join(__dirname, '../components/practice/SentenceTileScreen.tsx'),
  'utf8',
);

describe('SentenceTileScreen — contract clauses (Pattern Y)', () => {
  it('fires markQuest("grammar") on completion', () => {
    expect(source).toMatch(/markQuest\(['"]grammar['"]\)/);
  });

  it('calls writeDelta with gc:1 and vs:["sentence-tile"]', () => {
    expect(source).toMatch(/writeDelta\(\s*\{\s*gc:\s*1,\s*vs:\s*\[\s*['"]sentence-tile['"]\s*\]/);
  });

  it('calls setStats and increments gc by 1, appends "sentence-tile" to vs', () => {
    expect(source).toMatch(/gc:\s*\(prev\.gc\s*\|\|\s*0\)\s*\+\s*1/);
    expect(source).toMatch(/vs:\s*\[\.\.\.\(prev\.vs\s*\|\|\s*\[\]\),\s*['"]sentence-tile['"]\]/);
  });

  it('guards against duplicate first-time award (vs.includes check)', () => {
    expect(source).toMatch(/vs\?\.includes\(['"]sentence-tile['"]\)/);
  });
});
