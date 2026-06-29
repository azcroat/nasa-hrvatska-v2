// src/lib/__tests__/adaptiveFeedback.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { applyExamScoresToAdaptive } from '../adaptiveFeedback.js';
import type { SkillScores } from '../cefrCertification.js';

// Read the adaptive category SR store the same way adaptive.ts persists it.
function catStore(): Record<string, unknown> {
  return JSON.parse(localStorage.getItem('nh_cat_sr') || '{}');
}

describe('applyExamScoresToAdaptive — feedback loop (3a)', () => {
  beforeEach(() => localStorage.clear());

  it('a weak grammar score reschedules grammar categories (now tracked)', () => {
    const scores: SkillScores = { vocab: 0.95, grammar: 0.5 };
    applyExamScoresToAdaptive(scores);
    const store = catStore();
    // grammar weak → its representative categories are now in the scheduler
    expect(store['genitive']).toBeTruthy();
    expect(store['accusative']).toBeTruthy();
    expect(store['aspect-imperfective']).toBeTruthy();
    // vocab strong → untouched
    expect(store['vocab-a2']).toBeUndefined();
    expect(store['vocab-b1']).toBeUndefined();
  });

  it('weaker scores schedule sooner than stronger ones (performance gradient)', () => {
    applyExamScoresToAdaptive({ vocab: 0.4, grammar: 0.95 });
    const weak = catStore()['vocab-a2'] as { due: number } | undefined;
    localStorage.clear();
    applyExamScoresToAdaptive({ vocab: 0.75, grammar: 0.95 });
    const lessWeak = catStore()['vocab-a2'] as { due: number } | undefined;
    expect(weak).toBeTruthy();
    expect(lessWeak).toBeTruthy();
    // 0.4 (grade 1 → ~1 day) is due sooner than 0.75 (grade 3 → ~7 days).
    expect(weak!.due).toBeLessThan(lessWeak!.due);
  });

  it('strong skills (≥ pass bar) never reschedule anything', () => {
    applyExamScoresToAdaptive({ vocab: 0.9, grammar: 0.85, speaking: 0.8 });
    expect(Object.keys(catStore())).toHaveLength(0);
  });

  it('reading/listening are no-ops (no drillable adaptive category)', () => {
    applyExamScoresToAdaptive({ vocab: 0.95, grammar: 0.95, reading: 0.2, listening: 0.1 });
    expect(Object.keys(catStore())).toHaveLength(0);
  });

  it('a weak speaking score reschedules the speaking category', () => {
    applyExamScoresToAdaptive({ vocab: 0.95, grammar: 0.95, speaking: 0.4 });
    expect(catStore()['speaking']).toBeTruthy();
  });
});
