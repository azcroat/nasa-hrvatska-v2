// src/tests/useDailySession.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildSessionActivities,
  markDoneInSession,
  recordSessionComplete,
} from '../hooks/useDailySession';
import type { DailySession } from '../hooks/useDailySession';
import { localDateStr } from '../lib/dateUtils';

beforeEach(() => localStorage.clear());

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
});
