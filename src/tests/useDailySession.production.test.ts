// src/tests/useDailySession.production.test.ts
// Full unit test file — replaces the partial version from Task 1.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readMicState, selectProductionExercise } from '../hooks/useDailySession';

vi.mock('../lib/random.js', () => ({ rnd: () => 0 }));

describe('readMicState', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  it('returns "unknown" when nh_mic_state is unset', () => {
    expect(readMicState()).toBe('unknown');
  });
  it('returns "available" when nh_mic_state is "available"', () => {
    localStorage.setItem('nh_mic_state', 'available');
    expect(readMicState()).toBe('available');
  });
  it('returns "denied" when nh_mic_state is "denied"', () => {
    localStorage.setItem('nh_mic_state', 'denied');
    expect(readMicState()).toBe('denied');
  });
  it('returns "unsupported" when nh_mic_state is "unsupported"', () => {
    localStorage.setItem('nh_mic_state', 'unsupported');
    expect(readMicState()).toBe('unsupported');
  });
  it('returns "unknown" for any unknown value (corruption)', () => {
    localStorage.setItem('nh_mic_state', 'pwned');
    expect(readMicState()).toBe('unknown');
  });
});

describe('selectProductionExercise — happy path', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('A2 user with mic available + no recent returns a pool member', () => {
    const result = selectProductionExercise({
      cefr: 'A2',
      micState: 'available',
      recentScreens: [],
    });
    expect(result).not.toBeNull();
    expect(['speaking_sprint', 'shadowing', 'writing', 'dictation', 'productiondrill']).toContain(
      result!.screen,
    );
  });
});

describe('selectProductionExercise — CEFR gating', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('A1 user → returns null (all exercises require A2+)', () => {
    const result = selectProductionExercise({
      cefr: 'A1',
      micState: 'available',
      recentScreens: [],
    });
    expect(result).toBeNull();
  });

  it('A2 user → has access to 2 of 5 (speaking_sprint, shadowing)', () => {
    // With rnd()=0 mocked, returns the first eligible item: speaking_sprint
    const result = selectProductionExercise({
      cefr: 'A2',
      micState: 'available',
      recentScreens: [],
    });
    expect(result?.screen).toBe('speaking_sprint');
  });

  it('B1 user → has access to all 5', () => {
    const result = selectProductionExercise({
      cefr: 'B1',
      micState: 'available',
      recentScreens: [],
    });
    expect(result).not.toBeNull();
    // With rnd()=0, returns first item: speaking_sprint
    expect(result?.screen).toBe('speaking_sprint');
  });
});

describe('selectProductionExercise — mic state filtering', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('mic denied at B1 → returns Writing or Dictation only', () => {
    const result = selectProductionExercise({
      cefr: 'B1',
      micState: 'denied',
      recentScreens: [],
    });
    expect(['writing', 'dictation']).toContain(result?.screen);
  });

  it('mic unsupported at B1 → returns Writing or Dictation only', () => {
    const result = selectProductionExercise({
      cefr: 'B1',
      micState: 'unsupported',
      recentScreens: [],
    });
    expect(['writing', 'dictation']).toContain(result?.screen);
  });

  it('mic unknown → fail-open (treated as available)', () => {
    const result = selectProductionExercise({
      cefr: 'B1',
      micState: 'unknown',
      recentScreens: [],
    });
    expect(result).not.toBeNull();
    // With rnd()=0 and B1 unlocking all, picks the first: speaking_sprint
    expect(result?.screen).toBe('speaking_sprint');
  });

  it('mic denied at A2 → returns null (no keyboard-only exercises at A2)', () => {
    // Writing + Dictation both require B1; A2 user with denied mic gets nothing.
    const result = selectProductionExercise({
      cefr: 'A2',
      micState: 'denied',
      recentScreens: [],
    });
    expect(result).toBeNull();
  });
});

describe('selectProductionExercise — recent-exclusion', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('excludes recent screens from selection', () => {
    // With rnd()=0 and B1 user, normally returns speaking_sprint.
    // Pre-seeded recent excludes it → returns shadowing (next in pool).
    const result = selectProductionExercise({
      cefr: 'B1',
      micState: 'available',
      recentScreens: ['speaking_sprint'],
    });
    expect(result?.screen).toBe('shadowing');
  });

  it('falls back to full pool when recent-exclusion empties it', () => {
    // All 5 in recent list — fallback returns pre-exclusion first item.
    const result = selectProductionExercise({
      cefr: 'B1',
      micState: 'available',
      recentScreens: ['speaking_sprint', 'shadowing', 'productiondrill', 'writing', 'dictation'],
    });
    expect(result).not.toBeNull();
    expect(result?.screen).toBe('speaking_sprint'); // first in pool with rnd()=0
  });

  it('mic-denied + recent-eliminates-keyboard → falls back to keyboard pool', () => {
    // Mic denied filters to writing+dictation. Both in recent list — fallback returns writing.
    const result = selectProductionExercise({
      cefr: 'B1',
      micState: 'denied',
      recentScreens: ['writing', 'dictation'],
    });
    expect(['writing', 'dictation']).toContain(result?.screen);
  });
});
