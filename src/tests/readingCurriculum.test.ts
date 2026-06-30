// src/tests/readingCurriculum.test.ts
import { describe, it, expect } from 'vitest';
import {
  readingKeyFor,
  getReadingUnitsForLevel,
  getNextReadingUnit,
  getReadingProgress,
} from '../lib/readingCurriculum';
import { READ } from '../data/exercises.js';

describe('readingKeyFor', () => {
  it('matches the key ReadingScreen writes to stats.vs on completion', () => {
    // ReadingScreen: 'reading_' + (title).replace(/\s+/g, '_')
    expect(readingKeyFor('Moja Obitelj')).toBe('reading_Moja_Obitelj');
    expect(readingKeyFor('A  B')).toBe('reading_A_B');
  });
});

describe('readingCurriculum units', () => {
  it('every CEFR level produces at least one reading unit', () => {
    for (const lv of ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']) {
      expect(getReadingUnitsForLevel(lv).length, lv).toBeGreaterThan(0);
    }
  });

  it('A1/A2 both draw from the beginner reader', () => {
    const a1 = getReadingUnitsForLevel('A1');
    const a2 = getReadingUnitsForLevel('A2');
    expect(a1.map((u) => u.key)).toEqual(a2.map((u) => u.key));
    expect(a1.every((u) => u.bucket === 'beginner')).toBe(true);
  });

  it('units carry a stable key, title and CEFR badge', () => {
    const u = getReadingUnitsForLevel('A1')[0];
    expect(u.key.startsWith('reading_')).toBe(true);
    expect(u.title.length).toBeGreaterThan(0);
    expect(u.badge).toBe('A1/A2');
    expect(u.passage).toBeDefined();
  });

  it('keys within a level are unique (dedups duplicate titles across buckets)', () => {
    const keys = getReadingUnitsForLevel('B1').map((u) => u.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('an unknown level falls back to A1 (beginner)', () => {
    expect(getReadingUnitsForLevel('Z9').map((u) => u.key)).toEqual(
      getReadingUnitsForLevel('A1').map((u) => u.key),
    );
  });

  it('covers the whole beginner reader pool at A1', () => {
    const beginnerTitles = (READ as Record<string, Array<{ title: string }>>).beginner.map(
      (p) => p.title,
    );
    const unitTitles = getReadingUnitsForLevel('A1').map((u) => u.title);
    expect(unitTitles).toEqual(beginnerTitles);
  });
});

describe('readingCurriculum progression (driven by stats.vs)', () => {
  it('recommends the first passage when nothing is done', () => {
    const units = getReadingUnitsForLevel('A1');
    expect(getNextReadingUnit('A1', [])!.key).toBe(units[0].key);
  });

  it('advances past completed passages (keys present in vs)', () => {
    const units = getReadingUnitsForLevel('A1');
    const next = getNextReadingUnit('A1', [units[0].key]);
    expect(next!.key).toBe(units[1].key);
  });

  it('returns null when every passage at the level is in vs', () => {
    const allKeys = getReadingUnitsForLevel('A1').map((u) => u.key);
    expect(getNextReadingUnit('A1', allKeys)).toBeNull();
  });

  it('getReadingProgress counts completed passages from vs', () => {
    const units = getReadingUnitsForLevel('A1');
    expect(getReadingProgress('A1', [])).toEqual({ done: 0, total: units.length });
    expect(getReadingProgress('A1', [units[0].key, units[1].key])).toEqual({
      done: 2,
      total: units.length,
    });
  });

  it('tolerates a non-array done value', () => {
    // @ts-expect-error — defensive: callers pass stats.vs which could be undefined
    expect(getNextReadingUnit('A1', undefined)).not.toBeNull();
    // @ts-expect-error — defensive: callers pass stats.vs which could be null
    expect(getReadingProgress('A1', null).done).toBe(0);
  });
});
