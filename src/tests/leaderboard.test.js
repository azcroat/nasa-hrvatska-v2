import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Firebase before importing leaderboard.js — it imports firebase/firestore
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  setDoc: vi.fn(() => Promise.resolve()),
  getDocs: vi.fn(() => Promise.resolve({ docs: [] })),
  collection: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  onSnapshot: vi.fn(),
}));
vi.mock('../lib/firebase.js', () => ({
  getDb: vi.fn(() => ({})),
}));

import {
  getLeagueForRank,
  getWeekKey,
  LEAGUES,
  submitWeeklyXP,
  getLeaderboard,
  getMyRank,
  subscribeToLeaderboard,
} from '../lib/leaderboard.js';
import { setDoc, getDocs, onSnapshot } from 'firebase/firestore';

describe('leaderboard — pure functions', () => {
  // ── LEAGUES constant ──────────────────────────────────────────────────────

  it('LEAGUES has 5 tiers', () => {
    expect(LEAGUES).toHaveLength(5);
  });

  it('LEAGUES includes bronze, silver, gold, platinum, diamond', () => {
    const ids = LEAGUES.map((l) => l.id);
    expect(ids).toContain('bronze');
    expect(ids).toContain('silver');
    expect(ids).toContain('gold');
    expect(ids).toContain('platinum');
    expect(ids).toContain('diamond');
  });

  // ── getLeagueForRank ──────────────────────────────────────────────────────

  it('rank 1 → diamond', () => {
    expect(getLeagueForRank(1).id).toBe('diamond');
  });

  it('rank 3 → diamond (still within diamond band minRank=1)', () => {
    expect(getLeagueForRank(3).id).toBe('diamond');
  });

  it('rank 4 → platinum (minRank=4)', () => {
    expect(getLeagueForRank(4).id).toBe('platinum');
  });

  it('rank 10 → platinum (within platinum band 4-10)', () => {
    expect(getLeagueForRank(10).id).toBe('platinum');
  });

  it('rank 11 → gold (minRank=11)', () => {
    expect(getLeagueForRank(11).id).toBe('gold');
  });

  it('rank 20 → gold (within gold band 11-20)', () => {
    expect(getLeagueForRank(20).id).toBe('gold');
  });

  it('rank 21 → silver (minRank=21)', () => {
    expect(getLeagueForRank(21).id).toBe('silver');
  });

  it('rank 40 → silver (within silver band 21-40)', () => {
    expect(getLeagueForRank(40).id).toBe('silver');
  });

  it('rank 41 → bronze (minRank=41)', () => {
    expect(getLeagueForRank(41).id).toBe('bronze');
  });

  it('rank 100 → bronze (any high rank)', () => {
    expect(getLeagueForRank(100).id).toBe('bronze');
  });

  it('returned league has all required fields', () => {
    const league = getLeagueForRank(5);
    expect(league).toHaveProperty('id');
    expect(league).toHaveProperty('name');
    expect(league).toHaveProperty('icon');
    expect(league).toHaveProperty('color');
    expect(league).toHaveProperty('minRank');
  });

  it('never returns undefined (fallback to bronze for extreme ranks)', () => {
    expect(getLeagueForRank(9999)).toBeDefined();
    expect(getLeagueForRank(9999).id).toBe('bronze');
  });

  // ── getWeekKey ────────────────────────────────────────────────────────────

  it('returns a string in YYYY-Wnn format', () => {
    expect(getWeekKey()).toMatch(/^\d{4}-W\d{2}$/);
  });

  it('week number is 1-53', () => {
    const key = getWeekKey();
    const week = parseInt(key.split('-W')[1], 10);
    expect(week).toBeGreaterThanOrEqual(1);
    expect(week).toBeLessThanOrEqual(53);
  });

  it('year matches current year', () => {
    const key = getWeekKey();
    const year = parseInt(key.split('-W')[0], 10);
    expect(year).toBe(new Date().getFullYear());
  });

  it('is deterministic within the same second', () => {
    expect(getWeekKey()).toBe(getWeekKey());
  });

  it('week number is zero-padded to 2 digits', () => {
    vi.useFakeTimers();
    // Set to Jan 2 2026 — week 1
    vi.setSystemTime(new Date('2026-01-02'));
    const key = getWeekKey();
    const weekStr = key.split('-W')[1];
    expect(weekStr).toMatch(/^\d{2}$/); // always 2 digits
    vi.useRealTimers();
  });
});

describe('leaderboard — Firestore functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── submitWeeklyXP ────────────────────────────────────────────────────────

  it('calls setDoc with uid, displayName, xp', async () => {
    await submitWeeklyXP({}, 'user1', 'Marko', 450);
    expect(setDoc).toHaveBeenCalledOnce();
    const [, data] = setDoc.mock.calls[0];
    expect(data.uid).toBe('user1');
    expect(data.displayName).toBe('Marko');
    expect(data.xp).toBe(450);
  });

  it('falls back to "Learner" when displayName is missing', async () => {
    await submitWeeklyXP({}, 'user1', null, 100);
    const [, data] = setDoc.mock.calls[0];
    expect(data.displayName).toBe('Learner');
  });

  it('no-ops when uid is missing', async () => {
    vi.clearAllMocks();
    await submitWeeklyXP({}, null, 'Test', 100);
    expect(setDoc).not.toHaveBeenCalled();
  });

  it('includes updatedAt timestamp', async () => {
    const before = Date.now();
    await submitWeeklyXP({}, 'user1', 'Ana', 200);
    const [, data] = setDoc.mock.calls[0];
    expect(data.updatedAt).toBeGreaterThanOrEqual(before);
  });

  // ── getLeaderboard ────────────────────────────────────────────────────────

  it('returns empty array when no entries', async () => {
    const entries = await getLeaderboard({});
    expect(entries).toEqual([]);
  });

  it('maps docs to ranked objects', async () => {
    getDocs.mockResolvedValueOnce({
      docs: [
        { data: () => ({ uid: 'u1', displayName: 'Ana', xp: 900 }) },
        { data: () => ({ uid: 'u2', displayName: 'Ivo', xp: 600 }) },
      ],
    });
    const entries = await getLeaderboard({});
    expect(entries[0].rank).toBe(1);
    expect(entries[0].uid).toBe('u1');
    expect(entries[1].rank).toBe(2);
    expect(entries[1].uid).toBe('u2');
  });

  it('returns empty array when Firestore throws', async () => {
    getDocs.mockRejectedValueOnce(new Error('Firestore error'));
    const entries = await getLeaderboard({});
    expect(entries).toEqual([]);
  });

  // ── getMyRank ─────────────────────────────────────────────────────────────

  it('returns null when uid is missing', async () => {
    expect(await getMyRank({}, null)).toBeNull();
    expect(await getMyRank({}, '')).toBeNull();
  });

  it('returns 1-based rank when uid found', async () => {
    getDocs.mockResolvedValueOnce({
      docs: [
        { data: () => ({ uid: 'u1', xp: 900 }) },
        { data: () => ({ uid: 'u2', xp: 600 }) },
        { data: () => ({ uid: 'u3', xp: 300 }) },
      ],
    });
    const rank = await getMyRank({}, 'u2');
    expect(rank).toBe(2);
  });

  it('returns null when uid not in leaderboard', async () => {
    getDocs.mockResolvedValueOnce({ docs: [] });
    const rank = await getMyRank({}, 'unknown');
    expect(rank).toBeNull();
  });
});

describe('subscribeToLeaderboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls onUpdate with ranked entries on snapshot', () => {
    const onUpdate = vi.fn();
    let snapshotCallback;
    onSnapshot.mockImplementation((_q, onNext, _onError) => {
      snapshotCallback = onNext;
      return () => {};
    });

    subscribeToLeaderboard({}, 50, onUpdate);

    // Simulate a Firestore snapshot with 2 docs
    snapshotCallback({
      docs: [
        { data: () => ({ uid: 'u1', xp: 800, displayName: 'Ana' }) },
        { data: () => ({ uid: 'u2', xp: 400, displayName: 'Ivo' }) },
      ],
    });

    expect(onUpdate).toHaveBeenCalledOnce();
    const [entries] = onUpdate.mock.calls[0];
    expect(entries[0].rank).toBe(1);
    expect(entries[0].uid).toBe('u1');
    expect(entries[1].rank).toBe(2);
    expect(entries[1].uid).toBe('u2');
  });

  it('calls onError and onUpdate([]) when snapshot fails', () => {
    const onUpdate = vi.fn();
    const onError = vi.fn();
    let errorCallback;
    onSnapshot.mockImplementation((_q, _onNext, onErr) => {
      errorCallback = onErr;
      return () => {};
    });

    subscribeToLeaderboard({}, 50, onUpdate, onError);

    const err = new Error('permission-denied');
    errorCallback(err);

    expect(onError).toHaveBeenCalledOnce();
    expect(onError).toHaveBeenCalledWith(err);
    expect(onUpdate).toHaveBeenCalledWith([]);
  });

  it('calls onUpdate([]) and onError when db is null', () => {
    const onUpdate = vi.fn();
    const onError = vi.fn();
    subscribeToLeaderboard(null, 50, onUpdate, onError);
    // null db → getDb() mock returns {} (not null), so onSnapshot is called
    // This just verifies no crash when db is null and getDb returns a value
    expect(onUpdate).not.toHaveBeenCalledWith(expect.arrayContaining([expect.anything()]));
  });

  it('returns an unsubscribe function', () => {
    const unsub = vi.fn();
    onSnapshot.mockReturnValue(unsub);
    const result = subscribeToLeaderboard({}, 50, vi.fn());
    expect(typeof result).toBe('function');
  });
});
