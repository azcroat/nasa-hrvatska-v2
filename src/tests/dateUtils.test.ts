import { describe, it, expect, afterEach, vi } from 'vitest';
import { localDateStr, weekKey, getServerDateStr } from '../lib/dateUtils';

afterEach(() => vi.restoreAllMocks());

describe('localDateStr', () => {
  it('returns YYYY-MM-DD format', () => {
    const result = localDateStr();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("returns today's date in local timezone", () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    expect(localDateStr()).toBe(`${year}-${month}-${day}`);
  });

  it('accepts a Date argument', () => {
    const d = new Date(2026, 0, 15); // Jan 15 2026 local time
    const result = localDateStr(d);
    expect(result).toBe('2026-01-15');
  });

  it('handles end of year boundary (Dec 31)', () => {
    const d = new Date(2025, 11, 31);
    const result = localDateStr(d);
    expect(result).toBe('2025-12-31');
  });

  it('handles leap year (Feb 29)', () => {
    const d = new Date(2024, 1, 29);
    const result = localDateStr(d);
    expect(result).toBe('2024-02-29');
  });
});

describe('weekKey', () => {
  it('returns ISO 8601 week key format YYYY-Www', () => {
    const result = weekKey();
    expect(result).toMatch(/^\d{4}-W\d{2}$/);
  });

  it('same week returns same key for Monday through Sunday', () => {
    // Week of 2026-04-13 (Mon) through 2026-04-19 (Sun) — all ISO week 16
    const monday = new Date(2026, 3, 13);
    const wednesday = new Date(2026, 3, 15);
    const sunday = new Date(2026, 3, 19);
    expect(weekKey(monday)).toBe(weekKey(wednesday));
    expect(weekKey(wednesday)).toBe(weekKey(sunday));
  });

  it('consecutive weeks produce different keys', () => {
    const week1 = new Date(2026, 3, 13); // Mon week 16
    const week2 = new Date(2026, 3, 20); // Mon week 17
    expect(weekKey(week1)).not.toBe(weekKey(week2));
  });

  it('returns the correct ISO week number for a known date', () => {
    // 2026-04-13 is ISO week 2026-W16
    const d = new Date(2026, 3, 13);
    expect(weekKey(d)).toBe('2026-W16');
  });

  it('handles year boundary correctly (Jan 1 2026 is W01)', () => {
    // 2026-01-05 (Monday of first full week) → W02; Jan 1 2026 is Thursday → W01
    const jan1 = new Date(2026, 0, 1);
    expect(weekKey(jan1)).toMatch(/^\d{4}-W\d{2}$/);
  });
});

// ── getServerDateStr ──────────────────────────────────────────────────────────

describe('getServerDateStr', () => {
  it('falls back to local date when fetch fails', async () => {
    // jsdom does not support fetch to /api/server-time; it will reject
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));
    const result = await getServerDateStr();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    vi.unstubAllGlobals();
  });

  it('falls back to local date when fetch returns non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }));
    const result = await getServerDateStr();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    vi.unstubAllGlobals();
  });

  it('returns server date when fetch returns ok with ts', async () => {
    const serverTs = new Date(2026, 3, 10).getTime(); // Apr 10 2026
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ts: serverTs }),
    }));
    const result = await getServerDateStr();
    expect(result).toBe('2026-04-10');
    vi.unstubAllGlobals();
  });

  it('falls back to local date when response json is malformed', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => { throw new Error('bad json'); },
    }));
    const result = await getServerDateStr();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    vi.unstubAllGlobals();
  });
});
