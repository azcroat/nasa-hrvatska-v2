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
  // Completion now routes through the single authority completeExercise, which owns
  // the 75% gate, idempotent vs write, gc increment, XP award and quest mark. The
  // gate/idempotency logic itself is unit-tested in useExerciseCompletion.test.ts.
  it('routes completion through completeExercise with key "sentence-tile"', () => {
    expect(source).toMatch(/completeExercise\(\{/);
    expect(source).toMatch(/key:\s*['"]sentence-tile['"]/);
  });

  it('passes score, total and xp to the gate', () => {
    expect(source).toMatch(/score,/);
    expect(source).toMatch(/total:\s*questions\.length/);
    expect(source).toMatch(/xp:\s*score\s*\*\s*4\s*\+\s*5/);
  });

  it('preserves the completion celebration (celebrate: true)', () => {
    expect(source).toMatch(/celebrate:\s*true/);
  });

  it('no longer hand-rolls the vs/gc/award write (single authority)', () => {
    expect(source).not.toMatch(/markQuest\(/);
    expect(source).not.toMatch(/vs:\s*\[\.\.\.\(prev\.vs/);
  });
});
