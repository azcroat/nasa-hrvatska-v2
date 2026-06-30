// src/tests/listeningMetric.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { recordListeningRep, getListeningReps } from '../lib/listeningMetric';
import { weekKey } from '../lib/dateUtils';

describe('listeningMetric', () => {
  beforeEach(() => localStorage.clear());

  it('returns zeros with no data', () => {
    expect(getListeningReps()).toEqual({ total: 0, thisWeek: 0 });
  });

  it('records a rep into both lifetime total and this-week bucket', () => {
    recordListeningRep();
    recordListeningRep();
    expect(getListeningReps()).toEqual({ total: 2, thisWeek: 2 });
  });

  it('rolls thisWeek to 0 on a new week but keeps lifetime total', () => {
    localStorage.setItem(
      'nh_listening_reps',
      JSON.stringify({ total: 9, week: 'old-week-key', weekCount: 4 }),
    );
    const reps = getListeningReps();
    expect(reps.total).toBe(9);
    expect(reps.thisWeek).toBe(0);
  });

  it('a new rep in a new week resets the weekly bucket to 1 and increments total', () => {
    localStorage.setItem(
      'nh_listening_reps',
      JSON.stringify({ total: 9, week: 'old-week-key', weekCount: 4 }),
    );
    recordListeningRep();
    const reps = getListeningReps();
    expect(reps.total).toBe(10);
    expect(reps.thisWeek).toBe(1);
    // stored week should now be the current week key
    const stored = JSON.parse(localStorage.getItem('nh_listening_reps')!);
    expect(stored.week).toBe(weekKey());
  });

  it('getListeningReps never throws on corrupt storage', () => {
    localStorage.setItem('nh_listening_reps', 'not json');
    expect(getListeningReps()).toEqual({ total: 0, thisWeek: 0 });
  });
});
