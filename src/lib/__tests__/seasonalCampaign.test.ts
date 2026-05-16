import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  easterSunday,
  resolveCampaignWindow,
  getActiveCampaign,
  type SeasonalCampaign,
} from '../seasonalCampaign';

const easterCampaign: SeasonalCampaign = {
  id: 'easter',
  name: 'Uskrs u Hrvatskoj',
  icon: '🥚',
  color: '#16a34a',
  bg: '#f0fdf4',
  border: '#86efac',
  windowKind: 'easterRelative',
  windowOffsets: [-7, 1],
  multiplier: 1.5,
  blurb: 'Easter',
  quests: [],
};

const midsummerCampaign: SeasonalCampaign = {
  id: 'midsummer',
  name: 'Ivanjdan',
  icon: '🔥',
  color: '#ea580c',
  bg: '#fff7ed',
  border: '#fed7aa',
  windowKind: 'fixed',
  start: [6, 20],
  end: [6, 25],
  multiplier: 1.5,
  blurb: 'Midsummer',
  quests: [],
};

const domovinaCampaign: SeasonalCampaign = {
  id: 'domovina',
  name: 'Dan domovine',
  icon: '🇭🇷',
  color: '#b61800',
  bg: '#fff1f0',
  border: '#fca5a5',
  windowKind: 'fixed',
  start: [7, 25],
  end: [8, 6],
  multiplier: 2.0,
  blurb: 'Domovina',
  quests: [],
};

describe('easterSunday', () => {
  // Anonymous Gregorian (Meeus/Jones/Butcher) — published reference values
  it.each([
    [2024, { month: 3, day: 31 }],
    [2025, { month: 4, day: 20 }],
    [2026, { month: 4, day: 5 }],
    [2027, { month: 3, day: 28 }],
    [2028, { month: 4, day: 16 }],
  ])('year %i → %s', (year, expected) => {
    expect(easterSunday(year)).toEqual(expected);
  });
});

describe('resolveCampaignWindow', () => {
  it('fixed kind returns the input start/end unchanged', () => {
    const win = resolveCampaignWindow(midsummerCampaign, 2026);
    expect(win.start).toEqual([6, 20]);
    expect(win.end).toEqual([6, 25]);
  });

  it('easterRelative for 2026 → Palm Sunday (Mar 29) → Easter Monday (Apr 6)', () => {
    const win = resolveCampaignWindow(easterCampaign, 2026);
    expect(win.start).toEqual([3, 29]);
    expect(win.end).toEqual([4, 6]);
  });

  it('easterRelative for 2027 → Palm Sunday (Mar 21) → Easter Monday (Mar 29)', () => {
    // Easter 2027 = March 28
    const win = resolveCampaignWindow(easterCampaign, 2027);
    expect(win.start).toEqual([3, 21]);
    expect(win.end).toEqual([3, 29]);
  });
});

describe('getActiveCampaign', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('returns null when no campaign is currently active', () => {
    vi.setSystemTime(new Date(2026, 1, 1)); // Feb 1 2026
    expect(getActiveCampaign([easterCampaign, midsummerCampaign, domovinaCampaign])).toBeNull();
  });

  it('returns midsummer during June 20–25', () => {
    vi.setSystemTime(new Date(2026, 5, 22)); // June 22 2026
    expect(getActiveCampaign([easterCampaign, midsummerCampaign, domovinaCampaign])?.id).toBe(
      'midsummer',
    );
  });

  it('returns easter during Palm Sunday window', () => {
    vi.setSystemTime(new Date(2026, 2, 30)); // March 30 2026 (Easter 2026 = Apr 5)
    expect(getActiveCampaign([easterCampaign, midsummerCampaign, domovinaCampaign])?.id).toBe(
      'easter',
    );
  });

  it('returns domovina during cross-month July 25 → August 6 window', () => {
    vi.setSystemTime(new Date(2026, 7, 2)); // August 2 2026
    expect(getActiveCampaign([easterCampaign, midsummerCampaign, domovinaCampaign])?.id).toBe(
      'domovina',
    );
  });

  it('returns null on empty campaigns array', () => {
    vi.setSystemTime(new Date(2026, 5, 22));
    expect(getActiveCampaign([])).toBeNull();
  });
});
