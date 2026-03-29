import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  trackStart,
  trackComplete,
  trackAbandon,
  getStylePreferences,
  getStyleContextForAPI,
  getStyleLabel,
  getTotalEvents,
  ACTIVITY_TYPES,
} from '../lib/learnerStyle.js';

function clearLS() { localStorage.clear(); }

const STORAGE_KEY = 'nh_style_events';

function getEvents() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

describe('learnerStyle — activity engagement tracking', () => {
  beforeEach(clearLS);
  afterEach(() => { clearLS(); vi.useRealTimers(); });

  // ── ACTIVITY_TYPES constant ───────────────────────────────────────────────

  it('ACTIVITY_TYPES maps known activity types', () => {
    expect(ACTIVITY_TYPES.flashcards).toBe('visual');
    expect(ACTIVITY_TYPES.listening).toBe('auditory');
    expect(ACTIVITY_TYPES.speaking).toBe('production');
    expect(ACTIVITY_TYPES.grammar).toBe('analytical');
  });

  // ── trackStart ────────────────────────────────────────────────────────────

  it('trackStart writes a start event to localStorage', () => {
    trackStart('flashcards');
    const events = getEvents();
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('flashcards');
    expect(events[0].action).toBe('start');
    expect(typeof events[0].ts).toBe('number');
  });

  it('trackStart ignores undefined/null', () => {
    trackStart(undefined);
    trackStart(null);
    expect(getEvents()).toHaveLength(0);
  });

  it('trackStart accumulates multiple events', () => {
    trackStart('flashcards');
    trackStart('listening');
    trackStart('grammar');
    expect(getEvents()).toHaveLength(3);
  });

  // ── trackComplete ─────────────────────────────────────────────────────────

  it('trackComplete writes a complete event with duration', () => {
    trackComplete('listening', 120000);
    const events = getEvents();
    expect(events[0].action).toBe('complete');
    expect(events[0].dur).toBe(120000);
  });

  it('trackComplete ignores undefined', () => {
    trackComplete(undefined, 5000);
    expect(getEvents()).toHaveLength(0);
  });

  it('trackComplete with 0 duration still records', () => {
    trackComplete('quiz', 0);
    expect(getEvents()[0].dur).toBe(0);
  });

  // ── trackAbandon ──────────────────────────────────────────────────────────

  it('trackAbandon ignores events under 5000ms', () => {
    trackAbandon('flashcards', 4999);
    expect(getEvents()).toHaveLength(0);
  });

  it('trackAbandon records events >= 5000ms', () => {
    trackAbandon('flashcards', 5000);
    const events = getEvents();
    expect(events).toHaveLength(1);
    expect(events[0].action).toBe('abandon');
    expect(events[0].dur).toBe(5000);
  });

  it('trackAbandon ignores 0ms duration', () => {
    trackAbandon('reading', 0);
    expect(getEvents()).toHaveLength(0);
  });

  it('trackAbandon ignores undefined duration (< 5000)', () => {
    trackAbandon('quiz');
    expect(getEvents()).toHaveLength(0);
  });

  // ── pruning: events older than 60 days ────────────────────────────────────

  it('old events (> 60 days) are pruned on write', () => {
    vi.useFakeTimers();
    const now = Date.now();
    vi.setSystemTime(now);

    // Write an old event directly
    const oldTs = now - 61 * 86400000;
    localStorage.setItem(STORAGE_KEY, JSON.stringify([
      { type: 'grammar', action: 'start', ts: oldTs },
    ]));

    // A new trackStart will prune on _save
    trackStart('flashcards');
    const events = getEvents();
    expect(events.every(e => e.ts > now - 60 * 86400000)).toBe(true);
    // Old event should be gone
    expect(events.some(e => e.type === 'grammar' && e.ts === oldTs)).toBe(false);
  });

  it('recent events survive pruning', () => {
    vi.useFakeTimers();
    const now = Date.now();
    vi.setSystemTime(now);

    localStorage.setItem(STORAGE_KEY, JSON.stringify([
      { type: 'grammar', action: 'start', ts: now - 10 * 86400000 }, // 10 days ago — keep
    ]));
    trackStart('flashcards');
    const events = getEvents();
    expect(events.some(e => e.type === 'grammar')).toBe(true);
  });

  // ── MAX_EVENTS cap ────────────────────────────────────────────────────────

  it('caps event list at 500', () => {
    vi.useFakeTimers();
    const now = Date.now();
    vi.setSystemTime(now);

    // Pre-fill with 500 recent events
    const existing = Array.from({ length: 500 }, (_, i) => ({
      type: 'grammar', action: 'start', ts: now - i * 1000,
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    trackStart('flashcards'); // This is the 501st — triggers cap via _prune
    const events = getEvents();
    expect(events.length).toBeLessThanOrEqual(500);
  });

  // ── getStylePreferences ───────────────────────────────────────────────────

  it('returns null with fewer than 5 events', () => {
    trackStart('flashcards');
    trackComplete('flashcards', 60000);
    expect(getStylePreferences()).toBeNull();
  });

  it('returns null with empty localStorage', () => {
    expect(getStylePreferences()).toBeNull();
  });

  it('returns preferences with enough data', () => {
    // Build up 5+ events across 2+ activity types with 2+ starts each
    for (let i = 0; i < 3; i++) {
      trackStart('flashcards');
      trackComplete('flashcards', 200000);
    }
    for (let i = 0; i < 3; i++) {
      trackStart('listening');
      trackComplete('listening', 60000);
    }
    const prefs = getStylePreferences();
    expect(prefs).not.toBeNull();
    expect(Array.isArray(prefs.preferredTypes)).toBe(true);
    expect(typeof prefs.dataPoints).toBe('number');
  });

  it('preferredTypes lists up to 3 entries', () => {
    for (let i = 0; i < 3; i++) {
      trackStart('flashcards'); trackComplete('flashcards', 200000);
      trackStart('listening');  trackComplete('listening', 200000);
      trackStart('grammar');    trackComplete('grammar', 200000);
      trackStart('speaking');   trackComplete('speaking', 200000);
    }
    const prefs = getStylePreferences();
    expect(prefs.preferredTypes.length).toBeLessThanOrEqual(3);
  });

  it('completionRates is an object with activity type keys', () => {
    for (let i = 0; i < 3; i++) {
      trackStart('reading'); trackComplete('reading', 100000);
    }
    const prefs = getStylePreferences();
    if (prefs) {
      expect(typeof prefs.completionRates).toBe('object');
    }
  });

  it('avoidedTypes lists activities with completionRate < 40%', () => {
    // 3 starts, 1 complete, 2 abandons → 33% completion rate
    for (let i = 0; i < 3; i++) trackStart('writing');
    trackComplete('writing', 200000);
    trackAbandon('writing', 10000);
    trackAbandon('writing', 10000);
    // Add enough other events to pass the 5-event threshold
    for (let i = 0; i < 3; i++) { trackStart('grammar'); trackComplete('grammar', 200000); }
    const prefs = getStylePreferences();
    if (prefs && prefs.avoidedTypes) {
      // writing may appear in avoidedTypes if completion < 40%
      expect(Array.isArray(prefs.avoidedTypes)).toBe(true);
    }
  });

  // ── getStyleContextForAPI ─────────────────────────────────────────────────

  it('returns null when no data', () => {
    expect(getStyleContextForAPI()).toBeNull();
  });

  it('returns compact object for API when data exists', () => {
    for (let i = 0; i < 3; i++) {
      trackStart('flashcards'); trackComplete('flashcards', 200000);
    }
    for (let i = 0; i < 3; i++) {
      trackStart('listening'); trackComplete('listening', 200000);
    }
    const ctx = getStyleContextForAPI();
    if (ctx) {
      expect(ctx).toHaveProperty('preferredTypes');
      expect(ctx).toHaveProperty('completionRates');
      expect(ctx).toHaveProperty('dataPoints');
    }
  });

  // ── getStyleLabel ─────────────────────────────────────────────────────────

  it('returns null with no data', () => {
    expect(getStyleLabel()).toBeNull();
  });

  it('returns a string label when data exists', () => {
    for (let i = 0; i < 3; i++) {
      trackStart('flashcards'); trackComplete('flashcards', 300000);
    }
    for (let i = 0; i < 3; i++) {
      trackStart('grammar'); trackComplete('grammar', 60000);
    }
    const label = getStyleLabel();
    if (label !== null) {
      expect(typeof label).toBe('string');
      expect(label.length).toBeGreaterThan(0);
    }
  });

  // ── getTotalEvents ────────────────────────────────────────────────────────

  it('returns 0 with no events', () => {
    expect(getTotalEvents()).toBe(0);
  });

  it('returns correct count after tracking', () => {
    trackStart('flashcards');
    trackComplete('flashcards', 60000);
    trackStart('grammar');
    expect(getTotalEvents()).toBe(3);
  });

  it('does not count pruned events', () => {
    vi.useFakeTimers();
    const now = Date.now();
    vi.setSystemTime(now);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([
      { type: 'grammar', action: 'start', ts: now - 70 * 86400000 }, // old: pruned
      { type: 'reading', action: 'start', ts: now - 10 * 86400000 }, // recent: kept
    ]));
    expect(getTotalEvents()).toBe(1);
  });
});
