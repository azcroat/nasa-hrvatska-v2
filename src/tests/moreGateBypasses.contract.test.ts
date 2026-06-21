/**
 * More completion-gate bypasses — contract test (Pattern Y, source-level)
 *
 * Deeper-audit finding: the completion-integrity sweep across all registry keys
 * found four more score-bearing screens that credited lesson completion (gc)
 * regardless of score — the same class as the #83 fix:
 *   - typing / znam / boje  — registered GATED, but credited on finish at any score
 *   - wordsprint            — credited on any score > 0 (a timed sprint, no pass
 *                             threshold) → reclassified to EFFORT
 *
 * Two of them also had XP-integrity bugs the fix corrects: znam DISPLAYED
 * "+znSc*5 XP" but never called award(); boje displayed bjSc*7 but awarded bjSc*2.
 * Routing through completeExercise makes the awarded XP match the displayed XP.
 *
 * These are multi-phase / timed games a render-driver can't reliably drive to a
 * deterministic pass/fail, so we verify the contract at the source level: each
 * routes completion through the single authority completeExercise, no longer
 * hand-rolls the credit, and carries the right registry policy. The gate behavior
 * itself is unit-tested in useExerciseCompletion.test.ts.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';
import { EXERCISE_COMPLETION } from '../lib/completion/exerciseRegistry';

const GATED: Array<{ key: string; file: string; scoreVar: string }> = [
  { key: 'typing', file: '../components/practice/TypingScreen.tsx', scoreVar: 'tyS' },
  { key: 'znam', file: '../components/practice/ZnamGame.tsx', scoreVar: 'znSc' },
  { key: 'boje', file: '../components/practice/BojeGame.tsx', scoreVar: 'bjSc' },
];

describe('more gate bypasses — fixed (Pattern Y)', () => {
  for (const { key, file, scoreVar } of GATED) {
    describe(`${key} (${file.split('/').pop()})`, () => {
      const source = readFileSync(join(__dirname, file), 'utf8');

      it('is registered GATED (credit requires >=75%)', () => {
        expect(EXERCISE_COMPLETION[key]?.policy.kind).toBe('gated');
      });

      it('routes completion through completeExercise with the correct key + score', () => {
        expect(source).toMatch(/completeExercise\(\{/);
        expect(source).toMatch(new RegExp(`key:\\s*['"]${key}['"]`));
        expect(source).toMatch(new RegExp(`score:\\s*${scoreVar}`));
      });

      it('no longer hand-rolls the credit (no markQuest, no hand-rolled vs push)', () => {
        expect(source).not.toMatch(/markQuest\(/);
        expect(source).not.toMatch(
          new RegExp(`vs:\\s*\\[\\.\\.\\.\\(prev\\.vs \\|\\| \\[\\]\\), ['"]${key}['"]\\]`),
        );
      });
    });
  }

  describe('wordsprint (WordSprint.tsx)', () => {
    const source = readFileSync(join(__dirname, '../components/practice/WordSprint.tsx'), 'utf8');

    it('is reclassified to EFFORT (timed sprint — no pass threshold)', () => {
      expect(EXERCISE_COMPLETION['wordsprint']?.policy.kind).toBe('effort');
    });

    it('routes completion through completeExercise with key "wordsprint"', () => {
      expect(source).toMatch(/completeExercise\(\{/);
      expect(source).toMatch(/key:\s*['"]wordsprint['"]/);
    });

    it('no longer hand-rolls the credit', () => {
      expect(source).not.toMatch(/markQuest\(/);
      expect(source).not.toMatch(/vs:\s*\[\.\.\.\(prev\.vs \|\| \[\]\), ['"]wordsprint['"]\]/);
    });
  });
});
