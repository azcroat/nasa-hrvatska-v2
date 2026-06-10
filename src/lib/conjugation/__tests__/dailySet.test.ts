// src/lib/conjugation/__tests__/dailySet.test.ts
import { describe, it, expect } from 'vitest';
import { selectDailySet } from '../dailySet';
import { buildCardKey } from '../cardKey';
import type { ConjCell } from '../types';

const candidate: ConjCell[] = Array.from({ length: 40 }, (_, i) => ({
  inf: i % 2 ? 'pisati' : 'čitati',
  formType: 'present' as const,
  personIdx: i % 6,
}));

describe('selectDailySet', () => {
  it('caps at the requested size', () => {
    const set = selectDailySet({
      candidates: candidate,
      dueKeys: new Set(),
      size: 15,
      daySeed: 20260609,
    });
    expect(set.length).toBeLessThanOrEqual(15);
  });

  it('is deterministic for a given day-seed', () => {
    const a = selectDailySet({
      candidates: candidate,
      dueKeys: new Set(),
      size: 15,
      daySeed: 20260609,
    });
    const b = selectDailySet({
      candidates: candidate,
      dueKeys: new Set(),
      size: 15,
      daySeed: 20260609,
    });
    expect(a).toEqual(b);
  });

  it('prioritizes due cards first', () => {
    const due = new Set(['conj|pisati|present|3']);
    const set = selectDailySet({ candidates: candidate, dueKeys: due, size: 5, daySeed: 1 });
    expect(set.map((c) => buildCardKey(c))).toContain('conj|pisati|present|3');
  });
});
