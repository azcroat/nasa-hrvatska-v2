/**
 * Unjumble — contract test (Pattern Y, source-level)
 *
 * Unjumble is a word-tile assembly drill: tiles persist after clicking, so a
 * generic render-driver cannot reliably build the CORRECT sentence to clear the
 * 75% completion gate. We therefore verify the contract at the source level —
 * that completion routes through the single authority completeExercise with the
 * correct key. The gate/idempotency behavior itself is unit-tested in
 * useExerciseCompletion.test.ts.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';

const source = readFileSync(join(__dirname, '../components/practice/Unjumble.tsx'), 'utf8');

describe('Unjumble contract (Pattern Y)', () => {
  it('routes completion through completeExercise with key "unjumble"', () => {
    expect(source).toMatch(/completeExercise\(\{/);
    expect(source).toMatch(/key:\s*['"]unjumble['"]/);
  });

  it('passes score, total and xp to the gate', () => {
    expect(source).toMatch(/score:\s*ujS/);
    expect(source).toMatch(/total,/);
    expect(source).toMatch(/xp,/);
  });

  it('no longer hand-rolls the vs/gc/award write (single authority)', () => {
    expect(source).not.toMatch(/markQuest\(/);
    expect(source).not.toMatch(/vs:\s*\[\.\.\.\(prev\.vs/);
  });
});
