// src/tests/useDailySession.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  buildSessionActivities,
  markDoneInSession,
  recordSessionComplete,
  useDailySession,
  shouldAutoCompleteOnReturn,
  SESSION_AUTOCOMPLETE_SCREENS,
} from '../hooks/useDailySession';
import type { DailySession } from '../hooks/useDailySession';
import { localDateStr } from '../lib/dateUtils';

// Mock external dependencies to test different branches
vi.mock('../lib/srs', () => ({
  getDueReviews: vi.fn(() => []),
}));

vi.mock('../lib/adaptive', () => ({
  getDueCategoryQueue: vi.fn(() => []),
  CONJ_CATEGORIES: new Set([
    'present-tense',
    'past-tense',
    'future-tense',
    'conditional',
    'aspect-imperfective',
    'aspect-perfective',
    'aspect-negation',
  ]),
  CATEGORY_MIN_CEFR: {
    'present-tense': 'A1',
    'past-tense': 'A2',
    'future-tense': 'A2',
    conditional: 'B1',
    'aspect-imperfective': 'B1',
    'aspect-negation': 'B1',
    'aspect-perfective': 'B2',
  },
}));

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe('buildSessionActivities', () => {
  it('returns 4–6 activities for new user (no FSRS, no category SR)', () => {
    const acts = buildSessionActivities('A1');
    expect(acts.length).toBeGreaterThanOrEqual(4);
    expect(acts.length).toBeLessThanOrEqual(6);
  });

  it('always includes exactly one Croatia activity', () => {
    const acts = buildSessionActivities('A1');
    const croatiaIds = [
      'cityofday',
      'top100',
      'grocery',
      'transport',
      'recipes',
      'history',
      'proverbs',
      'popculture',
    ];
    const croatiaActs = acts.filter((a) => croatiaIds.includes(a.id));
    expect(croatiaActs).toHaveLength(1);
  });

  it('includes cityofday as croatia activity when not visited today', () => {
    localStorage.removeItem('nh_cityofday_date');
    const acts = buildSessionActivities('A2');
    expect(acts.find((a) => a.id === 'cityofday')).toBeTruthy();
  });

  it('excludes cityofday when already visited today, rotates instead', () => {
    const today = localDateStr();
    localStorage.setItem('nh_cityofday_date', today);
    const acts = buildSessionActivities('A2');
    expect(acts.find((a) => a.id === 'cityofday')).toBeFalsy();
  });

  it('only includes exercises at or below user CEFR level', () => {
    const acts = buildSessionActivities('A1');
    // B1+ exercises should not appear in an A1 session
    const b1Exercises = ['aspectdrill', 'clitic', 'future', 'accusativedrill'];
    for (const ex of b1Exercises) {
      expect(acts.find((a) => a.screen === ex)).toBeFalsy();
    }
  });

  it('does not repeat exercises from nh_recent_exercises', () => {
    localStorage.setItem(
      'nh_recent_exercises',
      JSON.stringify(['mcgame', 'flashcards', 'review', 'znam', 'cloze', 'typing']),
    );
    const acts = buildSessionActivities('B1');
    const recentIds = ['mcgame', 'flashcards', 'review', 'znam', 'cloze', 'typing'];
    for (const act of acts) {
      if (
        ![
          'cityofday',
          'top100',
          'grocery',
          'transport',
          'recipes',
          'history',
          'proverbs',
          'popculture',
        ].includes(act.id)
      ) {
        expect(recentIds).not.toContain(act.screen);
      }
    }
  });

  it('falls back to all unlocked exercises when all are in nh_recent_exercises', () => {
    // Mark every known screen as recent to trigger the fallback branch
    const allScreens = [
      'flashcards',
      'mcgame',
      'match',
      'review',
      'znam',
      'qwords',
      'genderdrill',
      'cloze',
      'unjumble',
      'prepdrill',
      'negation',
      'sentbuild',
      'sentencetiles',
      'typing',
      'speaking_sprint',
      'aspectdrill',
      'accusativedrill',
      'future',
      'comparatives',
      'clitic',
      'writing',
      'dictation',
    ];
    localStorage.setItem('nh_recent_exercises', JSON.stringify(allScreens));
    // A1 user — only A1/A2 exercises are unlocked, but all are "recent"
    // The fallback branch fires, returning full unlocked pool ignoring recency
    const acts = buildSessionActivities('A1');
    // Croatia slot always included, so we get at least 2 activities (fill + croatia)
    expect(acts.length).toBeGreaterThanOrEqual(2);
  });

  it('handles corrupt nh_recent_exercises JSON gracefully', () => {
    // Store invalid JSON to trigger the catch branch
    localStorage.setItem('nh_recent_exercises', '{invalid json}');
    // Should not throw; returns full exercise pool instead
    const acts = buildSessionActivities('A1');
    expect(acts.length).toBeGreaterThanOrEqual(4); // Should have normal session size
  });

  it('includes FSRS review activity when getDueReviews returns items', async () => {
    // Import the mocked function and configure it
    const srs = await import('../lib/srs');
    const getDueReviews = vi.mocked(srs.getDueReviews);
    getDueReviews.mockReturnValue([{ word: 'test' }]);
    const acts = buildSessionActivities('A1');
    // Should include 'srsreview' activity from Priority 1
    expect(acts.find((a) => a.id === 'srsreview')).toBeTruthy();
  });

  it('includes adaptive category activity when getDueCategoryQueue returns items', async () => {
    // Import the mocked function and configure it
    const adaptive = await import('../lib/adaptive');
    const getDueCategoryQueue = vi.mocked(adaptive.getDueCategoryQueue);
    getDueCategoryQueue.mockReturnValue([{ category: 'genitive', difficulty: 3 }]);
    const acts = buildSessionActivities('A1');
    // genitive maps to 'genitivedrill' screen
    expect(acts.find((a) => a.screen === 'genitivedrill')).toBeTruthy();
  });
});

describe('markDoneInSession', () => {
  it('adds id to completedIds', () => {
    const session: DailySession = {
      date: localDateStr(),
      activities: [{ id: 'cloze', label: 'Sentence Cloze', screen: 'cloze', category: 'genitive' }],
      completedIds: [],
      estimatedMinutes: 5,
    };
    const updated = markDoneInSession(session, 'cloze');
    expect(updated.completedIds).toContain('cloze');
  });

  it('is idempotent — double-call does not duplicate', () => {
    const session: DailySession = {
      date: localDateStr(),
      activities: [{ id: 'cloze', label: 'Sentence Cloze', screen: 'cloze', category: 'genitive' }],
      completedIds: ['cloze'],
      estimatedMinutes: 5,
    };
    const updated = markDoneInSession(session, 'cloze');
    expect(updated.completedIds.filter((id) => id === 'cloze')).toHaveLength(1);
  });
});

describe('recordSessionComplete', () => {
  it('writes to nh_session_history with today as key', () => {
    const today = localDateStr();
    recordSessionComplete(today);
    const history = JSON.parse(localStorage.getItem('nh_session_history') || '{}');
    expect(history[today]).toBe(true);
  });

  it('merges with existing nh_session_history entries', () => {
    const today = localDateStr();
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yesterday = d.toISOString().slice(0, 10);
    localStorage.setItem('nh_session_history', JSON.stringify({ [yesterday]: true }));
    recordSessionComplete(today);
    const history = JSON.parse(localStorage.getItem('nh_session_history') || '{}') as Record<
      string,
      boolean
    >;
    expect(history[today]).toBe(true);
    expect(history[yesterday]).toBe(true); // prior entry preserved
  });

  it('handles corrupt nh_session_history JSON gracefully', () => {
    // Store invalid JSON to trigger the catch branch
    localStorage.setItem('nh_session_history', '{bad json}');
    const today = localDateStr();
    // Should not throw; silently fails and skips writing
    recordSessionComplete(today);
    // localStorage should still contain the bad data (nothing changed)
    expect(localStorage.getItem('nh_session_history')).toBe('{bad json}');
  });
});

describe('useDailySession — rotation memory + auto-regenerate (hook)', () => {
  it('records a completed activity screen in nh_recent_exercises (the missing write)', () => {
    const { result } = renderHook(() => useDailySession('A2'));
    const first = result.current.session.activities[0]!;
    act(() => {
      result.current.markDone(first.screen);
    });
    const recent = JSON.parse(localStorage.getItem('nh_recent_exercises') || '[]') as string[];
    expect(recent).toContain(first.screen);
  });

  it('auto-regenerates a fresh set when every activity is completed (no dead-end)', () => {
    const { result } = renderHook(() => useDailySession('A2'));
    const firstIds = result.current.session.activities.map((a) => a.id);
    expect(firstIds.length).toBeGreaterThan(0);
    act(() => {
      firstIds.forEach((id) => result.current.markDone(id));
    });
    // Completing all triggers regeneration: not complete, progress reset to a
    // fresh non-empty set rather than a "come back tomorrow" dead-end.
    expect(result.current.isComplete).toBe(false);
    expect(result.current.session.completedIds).toEqual([]);
    expect(result.current.session.activities.length).toBeGreaterThan(0);
  });
});

describe('buildSessionActivities — difficulty bias (defect #1)', () => {
  it('biases the fill toward harder exercise TYPES for an advanced user (B2)', () => {
    // B2 target tier is 4. Across runs, the fill should prefer tier-4 types
    // (sentbuild/aspectdrill/clitic) and not pull in tier-1 recognition games
    // while harder unlocked types are available. dist is the primary sort key,
    // so this holds regardless of the random tiebreak.
    let sawHard = false;
    for (let i = 0; i < 5; i++) {
      const screens = buildSessionActivities('B2').map((a) => a.screen);
      expect(screens).not.toContain('flashcards'); // tier 1, farthest from target 4
      if (screens.some((s) => ['sentbuild', 'aspectdrill', 'clitic'].includes(s))) sawHard = true;
    }
    expect(sawHard).toBe(true);
  });

  it('keeps an A1 user on easy types (only tier 1–2 unlocked anyway)', () => {
    const screens = buildSessionActivities('A1').map((a) => a.screen);
    // No advanced-tier type should appear at A1 (they are CEFR-locked).
    for (const hard of ['sentbuild', 'aspectdrill', 'clitic', 'accusativedrill', 'future']) {
      expect(screens).not.toContain(hard);
    }
  });
});

describe('shouldAutoCompleteOnReturn — Croatia/reference slot completion', () => {
  it('REGRESSION: every always-present Croatia slot auto-completes on return (no stranding)', () => {
    // The Priority-4 Croatia slot is one of these; none self-grade on normal
    // view, so without this the session could never complete (blocking regen).
    const croatia = [
      'cityofday',
      'top100',
      'grocery',
      'transport',
      'recipes',
      'history',
      'proverbs',
      'popculture',
    ];
    for (const screen of croatia) {
      expect(SESSION_AUTOCOMPLETE_SCREENS.has(screen)).toBe(true);
      expect(shouldAutoCompleteOnReturn(screen, null)).toBe(true); // completes even w/o a signal
    }
  });

  it('a graded screen still requires its real completion signal', () => {
    expect(shouldAutoCompleteOnReturn('genitivedrill', null)).toBe(false);
    expect(shouldAutoCompleteOnReturn('genitivedrill', 'genitivedrill')).toBe(true);
  });

  it('returns false when there is no pending activity', () => {
    expect(shouldAutoCompleteOnReturn(null, null)).toBe(false);
    expect(shouldAutoCompleteOnReturn(null, 'cityofday')).toBe(false);
  });

  it('INVARIANT: never auto-completes a graded/production screen (no pool overlap)', () => {
    // Locks the safety property: only reference (Croatia) slots auto-complete on
    // view. A graded or production screen must still fire its real signal — so a
    // future pool edit that collided ids would fail here, not silently credit.
    const nonReference = [
      'flashcards',
      'mcgame',
      'match',
      'review',
      'znam',
      'cloze',
      'genitivedrill',
      'accusativedrill',
      'future',
      'aspectdrill',
      'clitic',
      'shadowing',
      'production_drill',
      'dictation',
    ];
    for (const s of nonReference) {
      expect(SESSION_AUTOCOMPLETE_SCREENS.has(s)).toBe(false);
      expect(shouldAutoCompleteOnReturn(s, null)).toBe(false);
    }
  });
});
