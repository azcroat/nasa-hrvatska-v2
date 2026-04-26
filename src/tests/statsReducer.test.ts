import { describe, it, expect } from 'vitest';
import { statsReducer } from '../lib/statsReducer';

// Minimal valid Stats shape — all required fields present
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DS: any = {
  xp: 0,
  lc: 0,
  gc: 0,
  sp: 0,
  de: 0,
  rc: 0,
  str: 0,
  pf: 0,
  mv: 0,
  hi: 0,
  authLoading: 0,
  diff: 'beginner',
  ct: [],
  vs: [],
  rs: [],
  badges: [],
  srsTotal: 0,
  mistakesMastered: 0,
  readingDone: 0,
  mediaVisits: 0,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeState(overrides: Record<string, unknown> = {}): any {
  return { ...DS, ...overrides };
}

describe('statsReducer — RESET', () => {
  it('replaces entire state with payload', () => {
    const state = makeState({ xp: 500, lc: 10 });
    const payload = makeState({ xp: 0, lc: 0 });
    const result = statsReducer(state, { type: 'RESET', payload });
    expect(result.xp).toBe(0);
    expect(result.lc).toBe(0);
  });

  it('does not mutate original state', () => {
    const state = makeState({ xp: 100 });
    const payload = makeState({ xp: 200 });
    statsReducer(state, { type: 'RESET', payload });
    expect(state.xp).toBe(100);
  });

  it('RESET with empty payload produces default-like state', () => {
    const state = makeState({ xp: 9999 });
    const result = statsReducer(state, { type: 'RESET', payload: DS });
    expect(result.xp).toBe(0);
    expect(result.ct).toEqual([]);
  });
});

describe('statsReducer — APPLY', () => {
  it('calls the function with current state and returns result', () => {
    const state = makeState({ xp: 100 });
    const result = statsReducer(state, {
      type: 'APPLY',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      payload: (prev: any) => ({ ...prev, xp: prev.xp + 50 }),
    });
    expect(result.xp).toBe(150);
  });

  it('does not mutate original state', () => {
    const state = makeState({ xp: 100 });
    statsReducer(state, {
      type: 'APPLY',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      payload: (prev: any) => ({ ...prev, xp: 999 }),
    });
    expect(state.xp).toBe(100);
  });

  it('APPLY function receives full state', () => {
    const state = makeState({ xp: 10, lc: 5, ct: ['food'] });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let received: any;
    statsReducer(state, {
      type: 'APPLY',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      payload: (prev: any) => {
        received = prev;
        return prev;
      },
    });
    expect(received.lc).toBe(5);
    expect(received.ct).toEqual(['food']);
  });
});

describe('statsReducer — MERGE_REMOTE', () => {
  it('xp takes Math.max(local, remote)', () => {
    const state = makeState({ xp: 500 });
    const result = statsReducer(state, {
      type: 'MERGE_REMOTE',
      payload: { xp: 200 },
      ds: DS,
    });
    expect(result.xp).toBe(500);
  });

  it('remote xp wins when remote is higher', () => {
    const state = makeState({ xp: 100 });
    const result = statsReducer(state, {
      type: 'MERGE_REMOTE',
      payload: { xp: 800 },
      ds: DS,
    });
    expect(result.xp).toBe(800);
  });

  it('ct array is union of local and remote', () => {
    const state = makeState({ ct: ['greetings'] });
    const result = statsReducer(state, {
      type: 'MERGE_REMOTE',
      payload: { ct: ['numbers'] },
      ds: DS,
    });
    expect(result.ct).toContain('greetings');
    expect(result.ct).toContain('numbers');
  });

  it('null remote payload returns current state with local values preserved', () => {
    const state = makeState({ xp: 300, lc: 7 });
    const result = statsReducer(state, {
      type: 'MERGE_REMOTE',
      payload: null,
      ds: DS,
    });
    expect(result.xp).toBe(300);
    expect(result.lc).toBe(7);
  });
});

describe('statsReducer — unknown action', () => {
  it('returns current state unchanged for unrecognised action type', () => {
    const state = makeState({ xp: 42, lc: 3 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = statsReducer(state, { type: 'UNKNOWN_ACTION' } as any);
    expect(result).toBe(state);
  });
});
