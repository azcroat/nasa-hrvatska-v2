// SP11e: client-side Easter math + active-campaign resolver.
// SEASONAL_CAMPAIGNS data ships from /api/content/core; the easterSunday()
// algorithm (Meeus/Jones/Butcher) is a pure 8-line algorithm with zero IP and
// stays client-side. Replaces the previous closure-based getActiveCampaign()
// in src/lib/appUtils.ts (deleted in Task 12).

export interface SeasonalQuest {
  id: string;
  label: string;
  desc: string;
  xp: number;
  screen: string;
}

export interface SeasonalCampaign {
  id: string;
  name: string;
  icon: string;
  color: string;
  bg: string;
  border: string;
  multiplier: number;
  blurb: string;
  quests: SeasonalQuest[];
  windowKind: 'fixed' | 'easterRelative';
  start?: [number, number];
  end?: [number, number];
  windowOffsets?: [number, number];
}

/**
 * Anonymous Gregorian (Meeus/Jones/Butcher) algorithm — returns the month
 * (1-based) and day of Easter Sunday for any Gregorian year ≥ 1583.
 */
export function easterSunday(year: number): { month: number; day: number } {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { month, day };
}

export function resolveCampaignWindow(
  c: SeasonalCampaign,
  year: number,
): { start: [number, number]; end: [number, number] } {
  if (c.windowKind === 'easterRelative' && c.windowOffsets) {
    const { month, day } = easterSunday(year);
    const easter = new Date(year, month - 1, day);
    const s = new Date(easter.getTime() + c.windowOffsets[0] * 86_400_000);
    const e = new Date(easter.getTime() + c.windowOffsets[1] * 86_400_000);
    return {
      start: [s.getMonth() + 1, s.getDate()],
      end: [e.getMonth() + 1, e.getDate()],
    };
  }
  return { start: c.start as [number, number], end: c.end as [number, number] };
}

export function getActiveCampaign(campaigns: SeasonalCampaign[]): SeasonalCampaign | null {
  if (!Array.isArray(campaigns) || campaigns.length === 0) return null;
  const now = new Date();
  const year = now.getFullYear();
  const m = now.getMonth() + 1;
  const d = now.getDate();

  return (
    campaigns.find((c) => {
      const win = resolveCampaignWindow(c, year);
      const [sm, sd] = win.start;
      const [em, ed] = win.end;
      if (sm === em) return m === sm && d >= sd && d <= ed;
      if (m === sm) return d >= sd;
      if (m === em) return d <= ed;
      return m > sm && m < em;
    }) ?? null
  );
}
