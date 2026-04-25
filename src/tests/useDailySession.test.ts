// src/tests/useDailySession.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  buildSessionActivities,
  markDoneInSession,
  recordSessionComplete,
} from '../hooks/useDailySession';
import type { DailySession } from '../hooks/useDailySession';
import { localDateStr } from '../lib/dateUtils';

// Mock external dependencies to test different branches
vi.mock('../lib/srs', () => ({
  getDueReviews: vi.fn(() => []),
}));

vi.mock('../lib/adaptive', () => ({
  getDueCategoryQueue: vi.fn(() => []),
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
    const b1Exercises = ['aspectdrill', 'clitic', 'future', 'akudrill'];
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
      'akudrill',
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
    // genitive maps to 'prepdrill' screen
    expect(acts.find((a) => a.screen === 'prepdrill')).toBeTruthy();
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
