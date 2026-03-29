import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  recordError,
  getErrorLog,
  getWeakAreas,
  clearErrorLog,
} from '../hooks/useErrorTracking.js';

function clearLS() { localStorage.clear(); }
const KEY = (uid) => `nh_errors_${uid}`;

describe('useErrorTracking — pure utility functions', () => {
  beforeEach(clearLS);
  afterEach(clearLS);

  // ── recordError ───────────────────────────────────────────────────────────

  it('records a new error entry', () => {
    recordError('u1', 'case_error', 'kruh');
    const entries = JSON.parse(localStorage.getItem(KEY('u1')));
    expect(entries).toHaveLength(1);
    expect(entries[0].type).toBe('case_error');
    expect(entries[0].context).toBe('kruh');
    expect(typeof entries[0].ts).toBe('string');
  });

  it('ignores missing uid', () => {
    recordError(null, 'case_error');
    recordError(undefined, 'vocab_miss');
    recordError('', 'aspect_error');
    expect(localStorage.length).toBe(0);
  });

  it('ignores missing type', () => {
    recordError('u1', null);
    recordError('u1', undefined);
    recordError('u1', '');
    expect(localStorage.length).toBe(0);
  });

  it('prepends new entry (newest first)', () => {
    recordError('u1', 'case_error', 'first');
    recordError('u1', 'vocab_miss', 'second');
    const entries = JSON.parse(localStorage.getItem(KEY('u1')));
    expect(entries[0].type).toBe('vocab_miss');
    expect(entries[1].type).toBe('case_error');
  });

  it('caps at 200 entries', () => {
    for (let i = 0; i < 205; i++) {
      recordError('u1', 'vocab_miss', `word${i}`);
    }
    const entries = JSON.parse(localStorage.getItem(KEY('u1')));
    expect(entries).toHaveLength(200);
  });

  it('isolates entries by uid', () => {
    recordError('u1', 'case_error');
    recordError('u2', 'aspect_error');
    expect(JSON.parse(localStorage.getItem(KEY('u1')))).toHaveLength(1);
    expect(JSON.parse(localStorage.getItem(KEY('u2')))).toHaveLength(1);
    expect(JSON.parse(localStorage.getItem(KEY('u1')))[0].type).toBe('case_error');
  });

  it('dispatches nh:error-recorded custom event', () => {
    const listener = vi.fn();
    window.addEventListener('nh:error-recorded', listener);
    recordError('u1', 'case_error');
    window.removeEventListener('nh:error-recorded', listener);
    expect(listener).toHaveBeenCalledOnce();
    expect(listener.mock.calls[0][0].detail.uid).toBe('u1');
  });

  it('stores empty string context when omitted', () => {
    recordError('u1', 'vocab_miss');
    const entries = JSON.parse(localStorage.getItem(KEY('u1')));
    expect(entries[0].context).toBe('');
  });

  // ── getErrorLog ───────────────────────────────────────────────────────────

  it('returns empty array for unknown uid', () => {
    expect(getErrorLog('nobody')).toEqual([]);
  });

  it('returns empty array when uid is falsy', () => {
    expect(getErrorLog(null)).toEqual([]);
    expect(getErrorLog('')).toEqual([]);
  });

  it('returns up to 50 most recent entries', () => {
    for (let i = 0; i < 80; i++) recordError('u1', 'vocab_miss', `word${i}`);
    const log = getErrorLog('u1');
    expect(log).toHaveLength(50);
    // Most recent first
    expect(log[0].context).toBe('word79');
  });

  it('returns all entries when fewer than 50', () => {
    recordError('u1', 'case_error');
    recordError('u1', 'aspect_error');
    expect(getErrorLog('u1')).toHaveLength(2);
  });

  // ── getWeakAreas ──────────────────────────────────────────────────────────

  it('returns empty array for unknown uid', () => {
    expect(getWeakAreas('nobody')).toEqual([]);
  });

  it('returns empty array when uid is falsy', () => {
    expect(getWeakAreas(null)).toEqual([]);
  });

  it('returns empty array when no errors', () => {
    localStorage.setItem(KEY('u1'), '[]');
    expect(getWeakAreas('u1')).toEqual([]);
  });

  it('aggregates by type with count', () => {
    recordError('u1', 'case_error');
    recordError('u1', 'case_error');
    recordError('u1', 'vocab_miss');
    const areas = getWeakAreas('u1');
    const caseArea = areas.find(a => a.type === 'case_error');
    const vocabArea = areas.find(a => a.type === 'vocab_miss');
    expect(caseArea.count).toBe(2);
    expect(vocabArea.count).toBe(1);
  });

  it('sorts by count descending (worst first)', () => {
    recordError('u1', 'vocab_miss');
    recordError('u1', 'case_error');
    recordError('u1', 'case_error');
    recordError('u1', 'case_error');
    const areas = getWeakAreas('u1');
    expect(areas[0].type).toBe('case_error');
    expect(areas[0].count).toBe(3);
  });

  it('each entry has type, count, lastSeen fields', () => {
    recordError('u1', 'aspect_error', 'piti');
    const [area] = getWeakAreas('u1');
    expect(typeof area.type).toBe('string');
    expect(typeof area.count).toBe('number');
    expect(typeof area.lastSeen).toBe('string');
  });

  // ── clearErrorLog ─────────────────────────────────────────────────────────

  it('removes all entries for uid', () => {
    recordError('u1', 'case_error');
    clearErrorLog('u1');
    expect(localStorage.getItem(KEY('u1'))).toBeNull();
    expect(getErrorLog('u1')).toEqual([]);
  });

  it('does not affect other uids', () => {
    recordError('u1', 'case_error');
    recordError('u2', 'vocab_miss');
    clearErrorLog('u1');
    expect(getErrorLog('u2')).toHaveLength(1);
  });

  it('ignores missing uid', () => {
    recordError('u1', 'vocab_miss');
    clearErrorLog(null);
    clearErrorLog('');
    expect(getErrorLog('u1')).toHaveLength(1); // untouched
  });

  it('dispatches nh:error-recorded event on clear', () => {
    const listener = vi.fn();
    window.addEventListener('nh:error-recorded', listener);
    clearErrorLog('u1');
    window.removeEventListener('nh:error-recorded', listener);
    expect(listener).toHaveBeenCalledOnce();
  });
});
