/**
 * progressSnapshot.test.ts — tests for buildProgressSnapshot()
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock firebase so gP() call inside buildProgressSnapshot does not crash
vi.mock('../lib/firebase.js', () => ({
  gP: vi.fn(() => null),
}));
// Mock srs so getSR() call works without real data
vi.mock('../lib/srs.js', () => ({
  getSR: vi.fn(() => ({})),
}));

import { buildProgressSnapshot } from '../lib/progressSnapshot';

function clearLS() { localStorage.clear(); }

const BASE_PARAMS = {
  uid: 'user123',
  name: 'Test User',
  stats: { xp: 100, lc: 5, str: 3, gc: 1, sp: 0, pf: 0 } as Record<string, number>,
  dchlA: [true, false, true],
  dchlSl: ['ans1', '', 'ans3'],
  favs: [{ hr: 'kuća', en: 'house' }],
  jWords: [{ hr: 'pas', en: 'dog' }],
};

describe('buildProgressSnapshot', () => {
  beforeEach(clearLS);
  afterEach(() => { clearLS(); vi.restoreAllMocks(); });

  it('returns an object with required top-level keys', () => {
    const snap = buildProgressSnapshot(BASE_PARAMS);
    expect(typeof snap.name).toBe('string');
    expect(typeof snap.stats).toBe('object');
    expect(typeof snap.savedAt).toBe('number');
    expect(Array.isArray(snap.favs)).toBe(true);
    expect(Array.isArray(snap.journal)).toBe(true);
    expect(typeof snap.dc).toBe('object');
    expect(typeof snap.weekXP).toBe('number');
  });

  it('cp field is always true', () => {
    const snap = buildProgressSnapshot(BASE_PARAMS);
    expect(snap.cp).toBe(true);
  });

  it('includes the passed name and stats', () => {
    const snap = buildProgressSnapshot(BASE_PARAMS);
    expect(snap.name).toBe('Test User');
    expect((snap.stats as Record<string, number>).xp).toBe(100);
  });

  it('favs is the passed array', () => {
    const snap = buildProgressSnapshot(BASE_PARAMS);
    expect(snap.favs).toHaveLength(1);
    expect((snap.favs[0] as { hr: string }).hr).toBe('kuća');
  });

  it('journal is the passed jWords', () => {
    const snap = buildProgressSnapshot(BASE_PARAMS);
    expect(snap.journal).toHaveLength(1);
  });

  it('dc.answered includes React dchlA values merged with empty localStorage', () => {
    const snap = buildProgressSnapshot(BASE_PARAMS);
    // dchlA = [true, false, true] — should all be reflected
    expect(Array.isArray(snap.dc.answered)).toBe(true);
    expect((snap.dc.answered as boolean[])[0]).toBe(true);
    expect((snap.dc.answered as boolean[])[2]).toBe(true);
  });

  it('dc merges with localStorage dcDay3 if date matches today', () => {
    const today = new Date();
    const todayStr = today.getFullYear() + '-' +
      String(today.getMonth() + 1).padStart(2, '0') + '-' +
      String(today.getDate()).padStart(2, '0');
    localStorage.setItem('dcDay3', JSON.stringify({
      day: todayStr,
      answered: [false, true, false],
      selected: ['', 'b', ''],
    }));
    // React dchlA = [true, false, false]; merged should give [true, true, false]
    const snap = buildProgressSnapshot({
      ...BASE_PARAMS,
      dchlA: [true, false, false],
      dchlSl: ['a', '', ''],
    });
    expect((snap.dc.answered as boolean[])[1]).toBe(true); // from localStorage
  });

  it('weekXP reads from nh_week_xp_<weekKey> localStorage key', () => {
    // We don't know the exact week key but we can set a value and confirm it's read
    const snap1 = buildProgressSnapshot(BASE_PARAMS);
    expect(snap1.weekXP).toBe(0); // nothing stored

    // Now set a value under a matching key
    const weekSnap = snap1.weekXPKey as string;
    localStorage.setItem('nh_week_xp_' + weekSnap, '250');
    const snap2 = buildProgressSnapshot(BASE_PARAMS);
    expect(snap2.weekXP).toBe(250);
  });

  it('onboarded reads from localStorage', () => {
    localStorage.setItem('onboarded', 'true');
    const snap = buildProgressSnapshot(BASE_PARAMS);
    expect(snap.onboarded).toBe(true);
  });

  it('nh_level reads from localStorage', () => {
    localStorage.setItem('nh_level', 'B1');
    const snap = buildProgressSnapshot(BASE_PARAMS);
    expect(snap.nh_level).toBe('B1');
  });

  it('nh_placement_done is true if nh_placement_done=true', () => {
    localStorage.setItem('nh_placement_done', 'true');
    const snap = buildProgressSnapshot(BASE_PARAMS);
    expect(snap.nh_placement_done).toBe(true);
  });

  it('savedAt is a recent timestamp', () => {
    const before = Date.now();
    const snap = buildProgressSnapshot(BASE_PARAMS);
    const after = Date.now();
    expect(snap.savedAt).toBeGreaterThanOrEqual(before);
    expect(snap.savedAt).toBeLessThanOrEqual(after);
  });

  it('stats.str is corrected to localStorage uStreak.count if higher', () => {
    localStorage.setItem('uStreak', JSON.stringify({ count: 15, last: '2026-04-19' }));
    const snap = buildProgressSnapshot({ ...BASE_PARAMS, stats: { ...BASE_PARAMS.stats, str: 3 } });
    // uStreak.count=15 is higher than stats.str=3, so snap.stats.str should be 15
    expect((snap.stats as Record<string, number>).str).toBe(15);
  });

  it('handles empty favs gracefully', () => {
    const snap = buildProgressSnapshot({ ...BASE_PARAMS, favs: [] });
    expect(snap.favs).toEqual([]);
  });

  it('handles empty jWords gracefully', () => {
    const snap = buildProgressSnapshot({ ...BASE_PARAMS, jWords: [] });
    expect(snap.journal).toEqual([]);
  });

  it('handles undefined favs gracefully', () => {
    // @ts-expect-error intentional test with undefined
    const snap = buildProgressSnapshot({ ...BASE_PARAMS, favs: undefined });
    expect(Array.isArray(snap.favs)).toBe(true);
  });

  it('freezes reads from uFreeze localStorage', () => {
    localStorage.setItem('uFreeze', '2');
    const snap = buildProgressSnapshot(BASE_PARAMS);
    expect(typeof snap.freezes).toBe('number');
    expect(snap.freezes).toBe(2);
  });
});
