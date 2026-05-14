/**
 * znamGame.contract.test.tsx — Pattern Y
 *
 * ZnamGame uses .tc section tiles + flashcard flip interaction (not .ob MC buttons).
 * We verify the contract clauses are wired in source instead.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';

const source = readFileSync(join(__dirname, '../components/practice/ZnamGame.tsx'), 'utf8');

describe('ZnamGame — contract clauses (Pattern Y)', () => {
  it('fires markQuest("vocab") on completion', () => {
    expect(source).toMatch(/markQuest\(['"]vocab['"]\)/);
  });

  it('calls writeDelta with gc:1 and vs:["znam"]', () => {
    expect(source).toMatch(/writeDelta\(\s*\{\s*gc:\s*1,\s*vs:\s*\[\s*['"]znam['"]\s*\]/);
  });

  it('calls setStats and increments gc by 1, appends "znam" to vs', () => {
    expect(source).toMatch(/gc:\s*\(prev\.gc\s*\|\|\s*0\)\s*\+\s*1/);
    expect(source).toMatch(/vs:\s*\[\.\.\.\(prev\.vs\s*\|\|\s*\[\]\),\s*['"]znam['"]\]/);
  });

  it('guards against duplicate first-time award (vs.includes check)', () => {
    expect(source).toMatch(/vs\?\.includes\(['"]znam['"]\)/);
  });
});
