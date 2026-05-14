/**
 * sentenceBuilder.contract.test.tsx — Pattern Y
 *
 * SentenceBuilderScreen uses drag-to-build sentence interaction (not .ob MC buttons).
 * We verify the contract clauses are wired in source instead.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';

const source = readFileSync(
  join(__dirname, '../components/practice/exercises/SentenceBuilderScreen.tsx'),
  'utf8',
);

describe('SentenceBuilderScreen — contract clauses (Pattern Y)', () => {
  it('fires markQuest("grammar") on completion', () => {
    expect(source).toMatch(/markQuest\(['"]grammar['"]\)/);
  });

  it('calls writeDelta with gc:1 and vs:["sentence-builder"]', () => {
    expect(source).toMatch(
      /writeDelta\(\s*\{\s*gc:\s*1,\s*vs:\s*\[\s*['"]sentence-builder['"]\s*\]/,
    );
  });

  it('calls setStats and increments gc by 1, appends "sentence-builder" to vs', () => {
    expect(source).toMatch(/gc:\s*\(prev\.gc\s*\|\|\s*0\)\s*\+\s*1/);
    expect(source).toMatch(
      /vs:\s*\[\.\.\.\(prev\.vs\s*\|\|\s*\[\]\),\s*['"]sentence-builder['"]\]/,
    );
  });

  it('guards against duplicate first-time award (vs.includes check)', () => {
    expect(source).toMatch(/vs\?\.includes\(['"]sentence-builder['"]\)/);
  });
});
