// Proves the session→category bridge actually advances the adaptive scheduler,
// against the REAL adaptive module (no mock) — i.e. it proves the "genitive
// served every session forever" loop is broken at its root.
import { describe, it, expect, beforeEach } from 'vitest';
import {
  setSessionCategory,
  consumeSessionCategoryOutcome,
  clearSessionCategory,
} from '../lib/sessionCategory';
import { getDueCategoryQueue, ALL_CATEGORIES } from '../lib/adaptive';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe('sessionCategory bridge', () => {
  it('REGRESSION: a fresh user has genitive first (the bug we are fixing)', () => {
    // Every category defaults to due:0 → all "due" → ALL_CATEGORIES[0] wins.
    expect(ALL_CATEGORIES[0]).toBe('genitive');
    const queue = getDueCategoryQueue(6).map((q) => q.category);
    expect(queue[0]).toBe('genitive');
  });

  it('completing the genitive session activity advances it out of the due-front', () => {
    setSessionCategory('cat_genitive');
    expect(sessionStorage.getItem('nh_session_category')).toBe('genitive');

    // Real performance: 8/10 → schedules genitive into the future.
    consumeSessionCategoryOutcome(8, 10);

    // The key is consumed (idempotent) ...
    expect(sessionStorage.getItem('nh_session_category')).toBeNull();
    // ... and genitive is no longer the first due category — rotation works.
    const queue = getDueCategoryQueue(6).map((q) => q.category);
    expect(queue[0]).not.toBe('genitive');
  });

  it('two completions in a row rotate to different categories', () => {
    const first = getDueCategoryQueue(1)[0]!.category;
    setSessionCategory(`cat_${first}`);
    consumeSessionCategoryOutcome(9, 10);
    const second = getDueCategoryQueue(1)[0]!.category;
    expect(second).not.toBe(first);
  });

  it('non-adaptive activities clear the key (no mis-attribution)', () => {
    setSessionCategory('cat_genitive');
    setSessionCategory('srsreview'); // e.g. SRS slot launched next
    expect(sessionStorage.getItem('nh_session_category')).toBeNull();
    // consume is a safe no-op with nothing pending
    expect(() => consumeSessionCategoryOutcome(5, 5)).not.toThrow();
    const queue = getDueCategoryQueue(1).map((q) => q.category);
    expect(queue[0]).toBe('genitive'); // genitive untouched
  });

  it('clearSessionCategory removes a pending category (back-out case)', () => {
    setSessionCategory('cat_accusative');
    clearSessionCategory();
    consumeSessionCategoryOutcome(10, 10);
    // accusative was never scheduled → still due-front behavior unchanged
    expect(sessionStorage.getItem('nh_session_category')).toBeNull();
  });

  it('neutral consume (no score) still rotates — covers award-only screens (cloze/future/znam)', () => {
    const first = getDueCategoryQueue(1)[0]!.category;
    setSessionCategory(`cat_${first}`);
    // No score/total: award-only screens don't surface a per-session score, so
    // completion reschedules the category with a neutral grade. Still rotates.
    consumeSessionCategoryOutcome();
    expect(getDueCategoryQueue(1)[0]!.category).not.toBe(first);
  });
});
