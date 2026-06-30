// src/tests/listeningCurriculum.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import {
  LISTENING_CURRICULUM,
  getNextListeningUnit,
  getListeningProgress,
  getListeningDone,
  markListeningUnitDone,
  findListeningUnit,
  getUnitsForLevel,
} from '../lib/listeningCurriculum';

// Mirror of the server allowlists (functions/api/listening.js). The curriculum
// must only point at topics/styles/levels the generator actually accepts —
// guard against drift on either side.
const VALID_TOPICS = [
  'cafe',
  'market',
  'family',
  'travel',
  'weather',
  'sports',
  'work',
  'weekend',
  'restaurant',
  'city',
  'school',
  'nature',
  'health',
  'culture',
  'history',
];
const VALID_STYLES = ['dialogue', 'monologue'];
const VALID_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

describe('listeningCurriculum data integrity', () => {
  it('every unit points at a valid topic / style / level the API accepts', () => {
    for (const u of LISTENING_CURRICULUM) {
      expect(VALID_TOPICS, u.id).toContain(u.topic);
      expect(VALID_STYLES, u.id).toContain(u.style);
      expect(VALID_LEVELS, u.id).toContain(u.level);
      expect(u.title.length).toBeGreaterThan(0);
      expect(u.desc.length).toBeGreaterThan(0);
    }
  });

  it('unit ids are unique', () => {
    const ids = LISTENING_CURRICULUM.map((u) => u.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('no two units share the same (level, topic, style) — keeps marking unambiguous', () => {
    const keys = LISTENING_CURRICULUM.map((u) => `${u.level}|${u.topic}|${u.style}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('every CEFR level has at least one unit', () => {
    for (const lv of VALID_LEVELS) {
      expect(getUnitsForLevel(lv).length, lv).toBeGreaterThan(0);
    }
  });
});

describe('listeningCurriculum progression', () => {
  beforeEach(() => localStorage.clear());

  it('getNextListeningUnit returns the first unit at the level when nothing is done', () => {
    const next = getNextListeningUnit('A1');
    expect(next).not.toBeNull();
    expect(next!.level).toBe('A1');
    expect(next!.id).toBe(getUnitsForLevel('A1')[0].id);
  });

  it('advances to the next unit after the current one is marked done', () => {
    const first = getNextListeningUnit('A1')!;
    markListeningUnitDone(first.id);
    const second = getNextListeningUnit('A1')!;
    expect(second.id).not.toBe(first.id);
    expect(getUnitsForLevel('A1').indexOf(second)).toBe(1);
  });

  it('returns null when every unit at the level is complete', () => {
    for (const u of getUnitsForLevel('A1')) markListeningUnitDone(u.id);
    expect(getNextListeningUnit('A1')).toBeNull();
  });

  it('is scoped to the requested level — completing A1 does not affect B1', () => {
    for (const u of getUnitsForLevel('A1')) markListeningUnitDone(u.id);
    expect(getNextListeningUnit('B1')).not.toBeNull();
    expect(getNextListeningUnit('B1')!.level).toBe('B1');
  });

  it('getListeningProgress reflects completed count at the level', () => {
    const units = getUnitsForLevel('A2');
    expect(getListeningProgress('A2')).toEqual({ done: 0, total: units.length });
    markListeningUnitDone(units[0].id);
    expect(getListeningProgress('A2')).toEqual({ done: 1, total: units.length });
  });

  it('markListeningUnitDone is idempotent', () => {
    const first = getNextListeningUnit('A1')!;
    markListeningUnitDone(first.id);
    markListeningUnitDone(first.id);
    expect(getListeningDone().filter((id) => id === first.id)).toHaveLength(1);
  });

  it('an unknown level falls back to B1', () => {
    expect(getNextListeningUnit('Z9')!.level).toBe('B1');
  });
});

describe('findListeningUnit', () => {
  it('matches a curriculum unit by exact (level, topic, style)', () => {
    const u = LISTENING_CURRICULUM[0];
    expect(findListeningUnit(u.level, u.topic, u.style)!.id).toBe(u.id);
  });

  it('returns undefined for a free-pick combo that is not on the path', () => {
    // A monologue cafe at A1 is not a defined unit (a1_cafe is a dialogue).
    expect(findListeningUnit('A1', 'cafe', 'monologue')).toBeUndefined();
  });
});

describe('listeningCurriculum resilience', () => {
  it('getListeningDone never throws on corrupt storage', () => {
    localStorage.setItem('nh_listening_track_done', '{not json');
    expect(getListeningDone()).toEqual([]);
  });

  it('getListeningDone ignores non-string entries', () => {
    localStorage.setItem('nh_listening_track_done', JSON.stringify(['a1_cafe', 5, null]));
    expect(getListeningDone()).toEqual(['a1_cafe']);
  });
});
