// src/lib/__tests__/adaptiveFeedback.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import {
  applyExamScoresToAdaptive,
  applyWritingErrorsToAdaptive,
  applyConversationCategoriesToAdaptive,
} from '../adaptiveFeedback.js';
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

describe('applyWritingErrorsToAdaptive — writing corrections (3b)', () => {
  beforeEach(() => localStorage.clear());

  it('maps each error-type to its representative adaptive category', () => {
    applyWritingErrorsToAdaptive(['case', 'aspect', 'tense', 'word_order', 'vocab']);
    const store = catStore();
    expect(store['genitive']).toBeTruthy(); // case
    expect(store['aspect-imperfective']).toBeTruthy(); // aspect
    expect(store['past-tense']).toBeTruthy(); // tense
    expect(store['word-order']).toBeTruthy(); // word_order
    expect(store['vocab-a2']).toBeTruthy(); // vocab
  });

  it('de-dupes per submission: repeated error-types reschedule a category once', () => {
    applyWritingErrorsToAdaptive(['case', 'case', 'case']);
    const card = catStore()['genitive'] as { recentAccuracy: number };
    // One application of ERROR_SCORE (0.45): EWMA = 0.3*0.45 + 0.7*0.5 = 0.485.
    // Three applications would compound below that — proving the de-dupe.
    expect(card.recentAccuracy).toBeCloseTo(0.485, 3);
  });

  it('ignores unmapped / unknown error-types (agreement, spelling, other, null)', () => {
    applyWritingErrorsToAdaptive(['agreement', 'spelling', 'other', null, undefined, 'bogus']);
    expect(Object.keys(catStore())).toHaveLength(0);
  });
});

describe('applyConversationCategoriesToAdaptive — maja-debrief (3b)', () => {
  beforeEach(() => localStorage.clear());

  it('reschedules valid taxonomy categories from the debrief', () => {
    applyConversationCategoriesToAdaptive(['genitive', 'aspect-imperfective']);
    const store = catStore();
    expect(store['genitive']).toBeTruthy();
    expect(store['aspect-imperfective']).toBeTruthy();
  });

  it('drops stray/hallucinated tokens not in the real taxonomy', () => {
    applyConversationCategoriesToAdaptive(['genitive', 'totally-made-up', 'GENITIVE', 42, null]);
    const store = catStore();
    expect(store['genitive']).toBeTruthy(); // valid
    expect(Object.keys(store)).toHaveLength(1); // the junk tokens are ignored
  });

  it('is a no-op for non-array / empty input', () => {
    applyConversationCategoriesToAdaptive(undefined);
    applyConversationCategoriesToAdaptive([]);
    applyConversationCategoriesToAdaptive('genitive');
    expect(Object.keys(catStore())).toHaveLength(0);
  });
});
