/**
 * Comprehension-gate bypass — contract test (Pattern Y, source-level)
 *
 * Audit finding #1: four "Tier-1" grammar screens (modal, padezi, padezifull,
 * vocative) credited lesson completion (gc + XP + quest) UNCONDITIONALLY on the
 * Finish/"Continue anyway" button — regardless of the quiz score. That defeated
 * the 75% comprehension gate the registry declares for them (the same gate the
 * June-12 lesson-gate work was meant to enforce).
 *
 * These screens are multi-phase quizzes (rules → examples → quiz → done) whose UI
 * a generic render-driver cannot reliably drive to a deterministic pass/fail, so
 * we verify the contract at the source level (Pattern Y, same as unjumble): each
 * routes completion through the single authority `completeExercise` (which credits
 * ONLY on a >=75% pass) and no longer hand-rolls the credit. The gate behavior
 * itself is unit-tested in useExerciseCompletion.test.ts.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';
import { EXERCISE_COMPLETION } from '../lib/completion/exerciseRegistry';

const SCREENS: Array<{ key: string; file: string }> = [
  { key: 'modal', file: '../components/learn/ModalScreen.tsx' },
  { key: 'padezi', file: '../components/learn/PadeziScreen.tsx' },
  { key: 'padezifull', file: '../components/learn/PadezifullScreen.tsx' },
  { key: 'vocative', file: '../components/practice/VocativeScreen.tsx' },
];

describe('comprehension-gate bypass fix (Pattern Y)', () => {
  for (const { key, file } of SCREENS) {
    describe(`${key} (${file.split('/').pop()})`, () => {
      const source = readFileSync(join(__dirname, file), 'utf8');

      it('is registered as a GATED policy (credit requires >=75%)', () => {
        expect(EXERCISE_COMPLETION[key]?.policy.kind).toBe('gated');
      });

      it('routes completion through completeExercise with the correct key', () => {
        expect(source).toMatch(/completeExercise\(\{/);
        expect(source).toMatch(new RegExp(`key:\\s*['"]${key}['"]`));
      });

      it('passes score + total to the gate (so a fail earns no credit)', () => {
        // `score:` (e.g. `score: m7s`) or shorthand `score,` when the var is named score.
        expect(source).toMatch(/\bscore[:,]/);
        expect(source).toMatch(/\btotal,/);
      });

      it('no longer hand-rolls an unconditional gc credit in the finish handler', () => {
        // The bypass signature: a direct `gc: (s.gc || 0) + 1` / `gc: s.gc + 1`
        // increment fired from the Finish button regardless of score.
        expect(source).not.toMatch(/gc:\s*\(?\s*s\.gc/);
        expect(source).not.toMatch(/gc:\s*\(prev\.gc/);
      });
    });
  }

  it('vocative + padezi no longer hand-roll markQuest (the quest mark now comes from the gate)', () => {
    const vocative = readFileSync(
      join(__dirname, '../components/practice/VocativeScreen.tsx'),
      'utf8',
    );
    const padezi = readFileSync(join(__dirname, '../components/learn/PadeziScreen.tsx'), 'utf8');
    expect(vocative).not.toMatch(/markQuest\(/);
    expect(padezi).not.toMatch(/markQuest\(/);
  });
});
