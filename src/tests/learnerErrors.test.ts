import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  logError,
  getTopErrors,
  getErrorsByCategory,
  getErrorSummaryForAI,
  clearErrors,
  getErrorCount,
  detectAndLogCroatianErrors,
} from '../lib/learnerErrors';

beforeEach(() => {
  localStorage.clear();
  clearErrors();
});
afterEach(() => {
  localStorage.clear();
  clearErrors();
});

// ──────────────────────────────────────────────
// logError + getErrorCount
// ──────────────────────────────────────────────
describe('logError + getErrorCount', () => {
  it('starts with zero errors', () => {
    expect(getErrorCount()).toBe(0);
  });

  it('increments count after logging', () => {
    logError('c-vs-c', 'pronunciation', {});
    expect(getErrorCount()).toBe(1);
  });

  it('same pattern increments count (not duplicate entries)', () => {
    logError('c-vs-c', 'pronunciation', {});
    logError('c-vs-c', 'pronunciation', {});
    // same key → still one entry, but count = 2
    expect(getErrorCount()).toBe(1);
    const errors = getTopErrors();
    expect(errors[0].count).toBe(2);
  });

  it('different patterns create separate entries', () => {
    logError('pattern-a', 'grammar', {});
    logError('pattern-b', 'grammar', {});
    expect(getErrorCount()).toBe(2);
  });
});

// ──────────────────────────────────────────────
// getTopErrors
// ──────────────────────────────────────────────
describe('getTopErrors', () => {
  it('returns empty array when no errors', () => {
    expect(getTopErrors()).toEqual([]);
  });

  it('returns at most N errors', () => {
    for (let i = 0; i < 15; i++) logError(`pattern_${i}`, 'grammar', {});
    expect(getTopErrors(5)).toHaveLength(5);
  });

  it('higher count errors rank first', () => {
    logError('common', 'grammar', {});
    logError('common', 'grammar', {});
    logError('common', 'grammar', {});
    logError('rare', 'grammar', {});
    const top = getTopErrors(2);
    expect(top[0].pattern).toBe('common');
  });
});

// ──────────────────────────────────────────────
// getErrorsByCategory
// NOTE: getErrorsByCategory only populates the fixed buckets:
//   grammar | vocabulary | pronunciation | speaking | reading
// Errors logged with a category outside those buckets are not returned.
// ──────────────────────────────────────────────
describe('getErrorsByCategory', () => {
  it('groups errors by category', () => {
    logError('c-vs-c', 'pronunciation', {});
    logError('reflexive-missing', 'grammar', {});
    logError('dj-drop', 'pronunciation', {});
    const byCategory = getErrorsByCategory();
    expect(byCategory['pronunciation']).toHaveLength(2);
    expect(byCategory['grammar']).toHaveLength(1);
  });

  it('unknown category does not appear in result', () => {
    logError('some-error', 'unknown_cat', {});
    const byCategory = getErrorsByCategory();
    expect(byCategory['unknown_cat']).toBeUndefined();
  });

  it('returns empty arrays for categories with no errors', () => {
    const byCategory = getErrorsByCategory();
    expect(byCategory['vocabulary']).toEqual([]);
    expect(byCategory['speaking']).toEqual([]);
  });
});

// ──────────────────────────────────────────────
// getErrorSummaryForAI
// ──────────────────────────────────────────────
describe('getErrorSummaryForAI', () => {
  it('returns null when no errors', () => {
    expect(getErrorSummaryForAI()).toBeNull();
  });

  it('returns a string when errors exist', () => {
    logError('c-vs-c', 'pronunciation', {});
    const summary = getErrorSummaryForAI();
    expect(typeof summary).toBe('string');
    expect(summary).toContain('c-vs-c');
  });

  it('summary contains category and count', () => {
    logError('reflexive_missing', 'grammar', {});
    const summary = getErrorSummaryForAI()!;
    expect(summary).toContain('grammar');
    expect(summary).toContain('1x');
  });
});

// ──────────────────────────────────────────────
// clearErrors
// ──────────────────────────────────────────────
describe('clearErrors', () => {
  it('resets error count to zero', () => {
    logError('test', 'grammar', {});
    clearErrors();
    expect(getErrorCount()).toBe(0);
  });

  it('getTopErrors returns empty after clear', () => {
    logError('test', 'grammar', {});
    clearErrors();
    expect(getTopErrors()).toEqual([]);
  });
});

// ──────────────────────────────────────────────
// detectAndLogCroatianErrors
// NOTE: The implementation uses category 'pronunciation' (not 'diacritics')
//   for diacritic-related errors. Pattern logged: 'diacritics_dropped'
// ──────────────────────────────────────────────
describe('detectAndLogCroatianErrors', () => {
  it('detects diacritics dropped (kuca instead of kuća)', () => {
    detectAndLogCroatianErrors('kuca', 'kuća', 'exercise');
    expect(getErrorCount()).toBeGreaterThan(0);
  });

  it('logs diacritics_dropped pattern under pronunciation', () => {
    detectAndLogCroatianErrors('kuca', 'kuća', 'exercise');
    const byCategory = getErrorsByCategory();
    expect(byCategory['pronunciation'].length).toBeGreaterThan(0);
    const patterns = byCategory['pronunciation'].map((e) => e.pattern);
    expect(patterns).toContain('diacritics_dropped');
  });

  it('no errors logged for correct answer', () => {
    detectAndLogCroatianErrors('kuća', 'kuća', 'exercise');
    expect(getErrorCount()).toBe(0);
  });

  it('detects reflexive missing (grammar category)', () => {
    // 'nije' in correct triggers genitive_of_negation check
    detectAndLogCroatianErrors('Zovem Ivan', 'Zovem se Ivan', 'exercise');
    // reflexive_missing should be logged
    const errors = getTopErrors();
    const patterns = errors.map((e) => e.pattern);
    expect(patterns).toContain('reflexive_missing');
  });

  it('detects č vs ć confusion (pronunciation)', () => {
    // user uses č where ć is correct → c_vs_c_confusion
    detectAndLogCroatianErrors('noč', 'noć', 'exercise');
    const byCategory = getErrorsByCategory();
    const patterns = byCategory['pronunciation'].map((e) => e.pattern);
    expect(patterns).toContain('c_vs_c_confusion');
  });
});
