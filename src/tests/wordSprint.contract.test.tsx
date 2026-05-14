/**
 * wordSprint.contract.test.tsx — Pattern Y
 *
 * WordSprint is a timer-based sprint game with a custom game loop (no .ob MC buttons).
 * We verify the contract clauses are wired in source instead.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';

const source = readFileSync(join(__dirname, '../components/practice/WordSprint.tsx'), 'utf8');

describe('WordSprint — contract clauses (Pattern Y)', () => {
  it('fires markQuest("grammar") on completion', () => {
    expect(source).toMatch(/markQuest\(['"]grammar['"]\)/);
  });

  it('calls writeDelta with gc:1 and vs:["wordsprint"]', () => {
    expect(source).toMatch(/writeDelta\(\s*\{\s*gc:\s*1,\s*vs:\s*\[\s*['"]wordsprint['"]\s*\]/);
  });

  it('calls setStats and increments gc by 1, appends "wordsprint" to vs', () => {
    expect(source).toMatch(/gc:\s*\(prev\.gc\s*\|\|\s*0\)\s*\+\s*1/);
    expect(source).toMatch(/vs:\s*\[\.\.\.\(prev\.vs\s*\|\|\s*\[\]\),\s*['"]wordsprint['"]\]/);
  });

  it('guards against duplicate first-time award (vs.includes check)', () => {
    expect(source).toMatch(/vs\?\.includes\(['"]wordsprint['"]\)/);
  });
});
