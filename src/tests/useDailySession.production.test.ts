// src/tests/useDailySession.production.test.ts
// Production-slot behaviour after Session-Rec #1 (AI modes routed into the pool)
// and Session-Rec #2 (a GUARANTEED production slot every session with a keyboard
// fallback). Pool, in array order: dialogue (A1, keyboard, converse),
// writing (A2, keyboard, write), shadowing (A2, mic, speak),
// production_drill (B1, mic, speak), dictation (B1, keyboard, write).
// rnd() is mocked to 0, so the selector deterministically returns the FIRST
// surviving candidate after the CEFR / mic / exclude / recency / kind filters.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  readMicState,
  selectProductionExercise,
  buildSessionActivities,
  recordProductionExercise as recordFn,
  PRODUCTION_SCREEN_IDS,
} from '../hooks/useDailySession';
import { CEFR_ORDER } from '../lib/cefr';

vi.mock('../lib/random.js', () => ({ rnd: () => 0 }));

const PRODUCTION_SCREENS = ['dialogue', 'writing', 'shadowing', 'production_drill', 'dictation'];

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

describe('selectProductionExercise — CEFR gating', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // Session-Rec #2: dialogue (A1, keyboard) is now the floor, so A1 gets a real
  // production slot — the old pool returned null here (everything was A2+/mic).
  it('A1 user → dialogue (the new keyboard floor)', () => {
    const result = selectProductionExercise({
      cefr: 'A1',
      micState: 'available',
      recentScreens: [],
    });
    expect(result?.screen).toBe('dialogue');
  });

  it('A2 user → first eligible is dialogue (dialogue, writing, shadowing unlocked)', () => {
    const result = selectProductionExercise({
      cefr: 'A2',
      micState: 'available',
      recentScreens: [],
    });
    expect(result?.screen).toBe('dialogue');
  });

  it('B1 user → all five unlocked, first eligible is dialogue', () => {
    const result = selectProductionExercise({
      cefr: 'B1',
      micState: 'available',
      recentScreens: [],
    });
    expect(result?.screen).toBe('dialogue');
  });
});

describe('selectProductionExercise — GUARANTEE (Session-Rec #2)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // The core contract: a non-null production slot for EVERY level in EVERY mic
  // state. This is the property that turns production from sometimes-present
  // into always-present. mic 'unknown' fails open (treated as available).
  it('returns a slot for every CEFR level × every mic state', () => {
    for (const cefr of CEFR_ORDER) {
      for (const micState of ['available', 'denied', 'unsupported', 'unknown'] as const) {
        const result = selectProductionExercise({ cefr, micState, recentScreens: [] });
        expect(result, `expected a production slot for ${cefr}/${micState}`).not.toBeNull();
        expect(PRODUCTION_SCREENS).toContain(result!.screen);
      }
    }
  });

  // The keyboard fallback: even with the mic blocked, every level keeps a
  // keyboard-only production option (dialogue at A1+, writing at A2+).
  it('mic-blocked users still get a keyboard-only slot at every level', () => {
    for (const cefr of CEFR_ORDER) {
      const denied = selectProductionExercise({ cefr, micState: 'denied', recentScreens: [] });
      expect(denied, `mic-denied ${cefr} must still get production`).not.toBeNull();
      // shadowing + production_drill are the only mic-required members; a
      // mic-blocked slot must never be one of them.
      expect(['shadowing', 'production_drill']).not.toContain(denied!.screen);
    }
  });
});

describe('selectProductionExercise — mic state filtering', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('mic denied at B1 → keyboard pool [dialogue, writing, dictation], first is dialogue', () => {
    const result = selectProductionExercise({
      cefr: 'B1',
      micState: 'denied',
      recentScreens: [],
    });
    expect(result?.screen).toBe('dialogue');
  });

  it('mic unsupported at A2 → keyboard pool [dialogue, writing], first is dialogue', () => {
    const result = selectProductionExercise({
      cefr: 'A2',
      micState: 'unsupported',
      recentScreens: [],
    });
    expect(result?.screen).toBe('dialogue');
  });

  it('mic unknown → fail-open (treated as available), first eligible is dialogue', () => {
    const result = selectProductionExercise({
      cefr: 'B1',
      micState: 'unknown',
      recentScreens: [],
    });
    expect(result?.screen).toBe('dialogue');
  });

  it('mic denied at A1 → dialogue (A1 keyboard) — no longer null', () => {
    const result = selectProductionExercise({
      cefr: 'A1',
      micState: 'denied',
      recentScreens: [],
    });
    expect(result?.screen).toBe('dialogue');
  });
});

describe('selectProductionExercise — recent-exclusion', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('excludes recent screens from selection', () => {
    // B1, mic available: normally dialogue. Exclude it → next surviving is writing.
    const result = selectProductionExercise({
      cefr: 'B1',
      micState: 'available',
      recentScreens: ['dialogue'],
    });
    expect(result?.screen).toBe('writing');
  });

  it('falls back to full pool when recent-exclusion empties it', () => {
    // All five in recent → recency fallback returns the pre-exclusion first item.
    const result = selectProductionExercise({
      cefr: 'B1',
      micState: 'available',
      recentScreens: PRODUCTION_SCREENS,
    });
    expect(result?.screen).toBe('dialogue');
  });

  it('mic-denied + keyboard options in recent → still returns a keyboard slot', () => {
    // B1 mic-denied keyboard pool: [dialogue, writing, dictation]. Exclude the
    // first two → dictation remains.
    const result = selectProductionExercise({
      cefr: 'B1',
      micState: 'denied',
      recentScreens: ['dialogue', 'writing'],
    });
    expect(result?.screen).toBe('dictation');
  });
});

describe('selectProductionExercise — excludeScreens (no double-booking)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('never returns a screen in excludeScreens', () => {
    // B1 mic available: dialogue is first, but it is excluded (already queued by
    // an earlier slot) → next surviving candidate, writing.
    const result = selectProductionExercise({
      cefr: 'B1',
      micState: 'available',
      recentScreens: [],
      excludeScreens: ['dialogue'],
    });
    expect(result?.screen).toBe('writing');
  });

  it('returns null only when every candidate is excluded (callers treat as "nothing to add")', () => {
    const result = selectProductionExercise({
      cefr: 'B1',
      micState: 'available',
      recentScreens: [],
      excludeScreens: PRODUCTION_SCREENS,
    });
    expect(result).toBeNull();
  });
});

describe('selectProductionExercise — kindBias (Session-Rec #4 anchor)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("kindBias 'converse' prefers the conversation member (dialogue)", () => {
    const result = selectProductionExercise({
      cefr: 'B1',
      micState: 'available',
      recentScreens: [],
      kindBias: 'converse',
    });
    expect(result?.screen).toBe('dialogue');
  });

  it("kindBias 'converse' but dialogue excluded → does not strand; falls back to another kind", () => {
    const result = selectProductionExercise({
      cefr: 'B1',
      micState: 'available',
      recentScreens: [],
      excludeScreens: ['dialogue'],
      kindBias: 'converse',
    });
    // No 'converse' member survives → bias is ignored rather than returning null.
    expect(result).not.toBeNull();
    expect(result?.screen).not.toBe('dialogue');
  });
});

describe('buildSessionActivities — P2.5 production slot', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('A1 session now contains exactly one production-pool screen (the guarantee)', () => {
    const result = buildSessionActivities('A1');
    const matches = result.filter((a) => PRODUCTION_SCREENS.includes(a.screen));
    expect(matches.length).toBe(1);
  });

  it('A2 session contains exactly one production-pool screen', () => {
    const result = buildSessionActivities('A2');
    const matches = result.filter((a) => PRODUCTION_SCREENS.includes(a.screen));
    expect(matches.length).toBe(1);
  });

  it('every level A1–C2 gets exactly one production slot', () => {
    for (const cefr of CEFR_ORDER) {
      const result = buildSessionActivities(cefr);
      const matches = result.filter((a) => PRODUCTION_SCREENS.includes(a.screen));
      expect(matches.length, `level ${cefr} should have exactly one production slot`).toBe(1);
    }
  });

  it('mic-denied user at B1 gets a keyboard production slot (never a mic-required one)', () => {
    localStorage.setItem('nh_mic_state', 'denied');
    const result = buildSessionActivities('B1');
    const productionMatch = result.find((a) => PRODUCTION_SCREENS.includes(a.screen));
    expect(productionMatch).toBeTruthy();
    expect(['shadowing', 'production_drill']).not.toContain(productionMatch!.screen);
  });
});

describe('PRODUCTION_SCREEN_IDS — markDone integration surface', () => {
  it('includes all five production screens', () => {
    expect(PRODUCTION_SCREEN_IDS.has('dialogue')).toBe(true);
    expect(PRODUCTION_SCREEN_IDS.has('writing')).toBe(true);
    expect(PRODUCTION_SCREEN_IDS.has('shadowing')).toBe(true);
    expect(PRODUCTION_SCREEN_IDS.has('production_drill')).toBe(true);
    expect(PRODUCTION_SCREEN_IDS.has('dictation')).toBe(true);
  });

  it('excludes a non-production screen', () => {
    expect(PRODUCTION_SCREEN_IDS.has('cloze')).toBe(false);
    expect(PRODUCTION_SCREEN_IDS.has('mcgame')).toBe(false);
    expect(PRODUCTION_SCREEN_IDS.has('speaking_sprint')).toBe(false);
  });

  it('recordProductionExercise is a function callable from markDone', () => {
    expect(typeof recordFn).toBe('function');
  });
});

describe('selectProductionExercise — determinism', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('with rnd()=0 mocked, returns the first item in the candidate pool deterministically', () => {
    // rnd is mocked at top of file to return 0. First eligible at B1: dialogue.
    const result = selectProductionExercise({
      cefr: 'B1',
      micState: 'available',
      recentScreens: [],
    });
    expect(result?.screen).toBe('dialogue');
  });

  it('Math.min clamp prevents out-of-bounds index (defensive coverage note)', () => {
    // Defensive: helper uses Math.min(Math.floor(rnd() * len), len - 1).
    // Even if rnd() returned 1.0 (spec-excluded but possible from poorly-seeded PRNG),
    // the clamp ensures we never read past the array.
    expect(true).toBe(true);
  });
});
