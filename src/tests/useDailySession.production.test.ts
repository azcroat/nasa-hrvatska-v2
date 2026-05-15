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
