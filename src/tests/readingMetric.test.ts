// src/tests/readingMetric.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { recordReadingRep, getReadingReps } from '../lib/readingMetric';
import { weekKey } from '../lib/dateUtils';

describe('readingMetric', () => {
  beforeEach(() => localStorage.clear());

  it('returns zeros with no data', () => {
    expect(getReadingReps()).toEqual({ total: 0, thisWeek: 0 });
  });

  it('records a rep into both lifetime total and this-week bucket', () => {
    recordReadingRep();
    recordReadingRep();
    recordReadingRep();
    expect(getReadingReps()).toEqual({ total: 3, thisWeek: 3 });
  });

  it('rolls thisWeek to 0 on a new week but keeps lifetime total', () => {
    localStorage.setItem(
      'nh_reading_reps',
      JSON.stringify({ total: 12, week: 'old-week-key', weekCount: 5 }),
    );
    const reps = getReadingReps();
    expect(reps.total).toBe(12);
    expect(reps.thisWeek).toBe(0);
  });

  it('a new rep in a new week resets the weekly bucket to 1 and increments total', () => {
    localStorage.setItem(
      'nh_reading_reps',
      JSON.stringify({ total: 12, week: 'old-week-key', weekCount: 5 }),
    );
    recordReadingRep();
    expect(getReadingReps()).toEqual({ total: 13, thisWeek: 1 });
    expect(JSON.parse(localStorage.getItem('nh_reading_reps')!).week).toBe(weekKey());
  });

  it('never throws on corrupt storage', () => {
    localStorage.setItem('nh_reading_reps', 'not json');
    expect(getReadingReps()).toEqual({ total: 0, thisWeek: 0 });
  });
});
