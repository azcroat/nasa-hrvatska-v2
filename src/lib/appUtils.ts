/**
 * appUtils.ts — lightweight app-level utilities with no content-data dependencies.
 *
 * Extracted from src/data/content.jsx so hooks can import these small helpers
 * without pulling in the entire 749 KB content bundle at startup.
 *
 * Allowed deps: src/lib/dateUtils only. No data/* imports.
 */
import type { CSSProperties } from 'react';
import { localDateStr } from './dateUtils';
import { addDay, seedDaysFromStreak, type DaySet } from './streakDays';

// ─── Active-day set (canonical streak source; union-merged across devices) ─────
const STREAK_DAYS_KEY = 'nh_streak_days';

function readStreakDays(): DaySet {
  try {
    return JSON.parse(localStorage.getItem(STREAK_DAYS_KEY) || '{}') as DaySet;
  } catch {
    return {};
  }
}

function writeStreakDays(days: DaySet): void {
  try {
    localStorage.setItem(STREAK_DAYS_KEY, JSON.stringify(days));
  } catch {
    /* quota/disabled */
  }
}

// ─── Daily XP goal ───────────────────────────────────────────────────────────
// Default goal — used when user hasn't completed onboarding
export const DAILY_XP_GOAL = 50;

/** Returns the user's chosen daily XP goal (from onboarding), defaulting to DAILY_XP_GOAL. */
export function getDailyXPGoal(): number {
  try {
    const saved = parseInt(localStorage.getItem('nh_daily_goal_xp') || '0', 10);
    return saved > 0 ? saved : DAILY_XP_GOAL;
  } catch {
    return DAILY_XP_GOAL;
  }
}

export function getDailyXP(): number {
  try {
    return parseInt(localStorage.getItem('nh_daily_xp_' + localDateStr()) || '0', 10);
  } catch {
    return 0;
  }
}

// ─── XP / Level ──────────────────────────────────────────────────────────────
export function lvl(x: number): number {
  const t = [0, 50, 150, 300, 500, 800, 1200, 1800, 2500, 3500];
  for (let i = t.length - 1; i >= 0; i--) if (x >= t[i]!) return i + 1;
  return 1;
}
export function lXP(l: number): number {
  return [0, 0, 50, 150, 300, 500, 800, 1200, 1800, 2500, 3500][l] ?? 3500;
}
export function nXP(l: number): number {
  return [0, 50, 150, 300, 500, 800, 1200, 1800, 2500, 3500, 5000][l] ?? 5000;
}

// SP11e: Seasonal-campaigns data + getActiveCampaign moved to
// functions/api/content/_data/seasonalCampaigns.js (server) and
// src/lib/seasonalCampaign.ts (client utilities). Easter math
// (easterSunday — Meeus/Jones/Butcher) and the active-window resolver
// also live in seasonalCampaign.ts. lXPgain below takes campaignMultiplier
// as an argument now.

// ─── XP Boost ────────────────────────────────────────────────────────────────
export const XP_BOOST_COST = 100;
export const XP_BOOST_DURATION_MS = 30 * 60 * 1000;
export const XP_BOOST_MULTIPLIER = 2;

export function getXPBoost(): { active: boolean; expiresAt: number; msRemaining: number } {
  try {
    const exp = parseInt(localStorage.getItem('nh_xp_boost_expires') || '0', 10);
    if (exp > Date.now()) return { active: true, expiresAt: exp, msRemaining: exp - Date.now() };
  } catch {}
  return { active: false, expiresAt: 0, msRemaining: 0 };
}

export function canActivateXPBoost(): boolean {
  try {
    const last = parseInt(localStorage.getItem('nh_xp_boost_last_activated') || '0', 10);
    return Date.now() - last >= 24 * 60 * 60 * 1000;
  } catch {
    return true;
  }
}

export function activateXPBoost(): number {
  const now = Date.now();
  const expires = now + XP_BOOST_DURATION_MS;
  try {
    localStorage.setItem('nh_xp_boost_expires', String(expires));
    localStorage.setItem('nh_xp_boost_last_activated', String(now));
  } catch {}
  return expires;
}

/**
 * Apply XP multipliers (campaign + boost). SP11e: campaign multiplier is now
 * passed in by the caller (resolved from useContent + getActiveCampaign), not
 * pulled from the deleted appUtils SEASONAL_CAMPAIGNS array.
 *
 * Boost and campaign DO NOT stack — take the higher of the two.
 */
export function lXPgain(xp: number, campaignMultiplier?: number): number {
  if (xp <= 0) return xp;
  let multiplier = 1;
  if (campaignMultiplier && campaignMultiplier > 1) {
    multiplier = campaignMultiplier;
  }
  try {
    const boostExp = parseInt(localStorage.getItem('nh_xp_boost_expires') || '0', 10);
    if (boostExp > Date.now()) multiplier = Math.max(multiplier, XP_BOOST_MULTIPLIER);
  } catch {}
  return Math.round(xp * multiplier);
}

// ─── Streak & freeze ─────────────────────────────────────────────────────────
interface StreakData {
  count: number;
  last: string;
  frozeOn?: string;
}

export function getStreak(): StreakData {
  try {
    return JSON.parse(localStorage.getItem('uStreak') || '{"count":0,"last":""}');
  } catch {
    return { count: 0, last: '' };
  }
}
export function getStreakFreezes(): number {
  try {
    return parseInt(localStorage.getItem('uFreeze') || '0', 10);
  } catch {
    return 0;
  }
}
export function earnFreeze(): void {
  const f = getStreakFreezes();
  localStorage.setItem('uFreeze', String(Math.min(f + 1, 2)));
}
export function spendFreeze(): boolean {
  const f = getStreakFreezes();
  if (f <= 0) return false;
  localStorage.setItem('uFreeze', String(f - 1));
  return true;
}

const STREAK_MILESTONES = [7, 14, 21, 30, 50, 60, 100, 365];

export function updateStreak(
  todayOverride?: string,
): StreakData & { milestone: number | null; freezeUsed?: boolean } {
  const s = getStreak();
  const today = todayOverride || localDateStr();
  // Maintain the canonical active-day set in lockstep. Seed from the legacy
  // {count,last} the first time (migration) so no existing streak history is lost,
  // then mark today (and any freeze-bridged day) so cross-device merges reconcile
  // from a complete set. uStreak below stays the derived cache displays read.
  let _days = readStreakDays();
  if (Object.keys(_days).length === 0)
    _days = seedDaysFromStreak(_days, s.count || 0, s.last || '');
  const yd = new Date(today + 'T00:00:00');
  yd.setDate(yd.getDate() - 1);
  const yesterday =
    yd.getFullYear() +
    '-' +
    String(yd.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(yd.getDate()).padStart(2, '0');
  if (s.last === today) {
    try {
      const eb = JSON.parse(localStorage.getItem('nh_earn_back') || 'null');
      if (eb && (eb.date === today || eb.date === yesterday)) {
        eb.lc = (eb.lc || 1) + 1;
        localStorage.setItem('nh_earn_back', JSON.stringify(eb));
      }
    } catch {}
    writeStreakDays(addDay(_days, today)); // already active today; keep the set in sync
    return { ...s, milestone: null };
  }
  let milestone: number | null = null;
  let freezeUsed = false;
  if (s.last === yesterday) {
    s.count++;
    s.last = today;
    if (STREAK_MILESTONES.includes(s.count)) milestone = s.count;
  } else if (s.last !== today) {
    // Only spend a freeze when exactly 1 day was missed (last practice was 2 calendar days ago).
    // A freeze cannot bridge a 2+ day gap — the streak is already broken.
    const _lastDate = s.last ? new Date(s.last + 'T00:00:00') : null;
    const _todayDate = new Date(today + 'T00:00:00');
    const _daysBetween = _lastDate
      ? Math.round((_todayDate.getTime() - _lastDate.getTime()) / 86400000)
      : 0;
    if (_daysBetween === 2 && spendFreeze()) {
      s.count++; // the bridged day counts toward the streak
      s.last = today;
      s.frozeOn = today;
      freezeUsed = true;
      if (STREAK_MILESTONES.includes(s.count)) milestone = s.count;
    } else {
      if (s.count >= 2) {
        try {
          localStorage.setItem(
            'nh_earn_back',
            JSON.stringify({ prev: s.count, date: today, lc: 1 }),
          );
        } catch {}
      }
      const _prevCount = s.count;
      STREAK_MILESTONES.forEach((m) => {
        if (_prevCount >= m) localStorage.removeItem('nh_ceremony_streak_' + m);
      });
      s.count = 1;
      s.last = today;
    }
  }
  // Mirror today (and the freeze-bridged missed day) into the active-day set.
  _days = addDay(_days, today);
  if (freezeUsed) _days = addDay(_days, yesterday);
  writeStreakDays(_days);
  localStorage.setItem('uStreak', JSON.stringify(s));
  return { ...s, milestone, freezeUsed };
}

interface EarnBackData {
  prev: number;
  date: string;
  lc: number;
}

export function getStreakEarnBack(): EarnBackData | null {
  try {
    const eb = JSON.parse(localStorage.getItem('nh_earn_back') || 'null');
    if (!eb) return null;
    const t = localDateStr();
    const _yd = new Date(t + 'T00:00:00');
    _yd.setDate(_yd.getDate() - 1);
    const yest =
      _yd.getFullYear() +
      '-' +
      String(_yd.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(_yd.getDate()).padStart(2, '0');
    if (eb.date !== t && eb.date !== yest) return null;
    return eb;
  } catch {
    return null;
  }
}
export function applyStreakEarnBack(): number {
  const eb = getStreakEarnBack();
  if (!eb || eb.lc < 2) return 0;
  const s = getStreak();
  s.count = eb.prev;
  localStorage.setItem('uStreak', JSON.stringify(s));
  try {
    localStorage.removeItem('nh_earn_back');
  } catch {}
  return eb.prev;
}

// ─── Culture stats ────────────────────────────────────────────────────────────
export function getCultureStats(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem('nh_culture') || '{}');
  } catch {
    return {};
  }
}
export function incrementCulture(key: string): number {
  const c = getCultureStats();
  c[key] = (c[key] || 0) + 1;
  localStorage.setItem('nh_culture', JSON.stringify(c));
  return c[key];
}

// ─── Badges ───────────────────────────────────────────────────────────────────
interface BadgeStats {
  lc?: number;
  xp?: number;
  pf?: number;
  gc?: number;
  sp?: number;
  mv?: number;
  hi?: number;
  srsTotal?: number;
  streak?: number;
  mistakesMastered?: number;
  readingDone?: number;
  mediaVisits?: number;
  footballDone?: number;
  dialectDone?: number;
  textingDone?: number;
}
interface Badge {
  id: string;
  n: string;
  i: string;
  d: string;
  r: (s: BadgeStats) => boolean;
}

export const BADGES: Badge[] = [
  { id: 'first', n: 'First Steps', i: '🌱', d: 'Complete 1 lesson', r: (s) => (s.lc ?? 0) >= 1 },
  { id: 'x100', n: 'Rising Star', i: '⭐', d: 'Earn 100 XP', r: (s) => (s.xp ?? 0) >= 100 },
  { id: 'x500', n: 'Scholar', i: '📚', d: 'Earn 500 XP', r: (s) => (s.xp ?? 0) >= 500 },
  { id: 'x1k', n: 'Master', i: '🏆', d: 'Earn 1,000 XP', r: (s) => (s.xp ?? 0) >= 1000 },
  { id: 'x2k', n: 'Expert', i: '🎓', d: 'Earn 2,000 XP', r: (s) => (s.xp ?? 0) >= 2000 },
  { id: 'x5k', n: 'Champion', i: '🥇', d: 'Earn 5,000 XP', r: (s) => (s.xp ?? 0) >= 5000 },
  { id: 'x10k', n: 'Legend', i: '👑', d: 'Earn 10,000 XP', r: (s) => (s.xp ?? 0) >= 10000 },
  { id: 'ded', n: 'Dedicated', i: '🔥', d: 'Complete 5 lessons', r: (s) => (s.lc ?? 0) >= 5 },
  { id: 'lc20', n: 'Go-Getter', i: '🚀', d: 'Complete 20 lessons', r: (s) => (s.lc ?? 0) >= 20 },
  { id: 'lc50', n: 'Marathoner', i: '🏃', d: 'Complete 50 lessons', r: (s) => (s.lc ?? 0) >= 50 },
  { id: 'lc100', n: 'Centurion', i: '💯', d: 'Complete 100 lessons', r: (s) => (s.lc ?? 0) >= 100 },
  {
    id: 'perf',
    n: 'Perfectionist',
    i: '💎',
    d: 'Get 100% on a lesson',
    r: (s) => (s.pf ?? 0) >= 1,
  },
  { id: 'perf5', n: 'Flawless', i: '✨', d: 'Get 100% on 5 lessons', r: (s) => (s.pf ?? 0) >= 5 },
  {
    id: 'gram',
    n: 'Grammar Guru',
    i: '📝',
    d: 'Complete a grammar lesson',
    r: (s) => (s.gc ?? 0) >= 1,
  },
  {
    id: 'spk',
    n: 'Voice of Croatia',
    i: '🎤',
    d: 'Complete a speaking lesson',
    r: (s) => (s.sp ?? 0) >= 1,
  },
  { id: 'mod', n: 'Modal Master', i: '🔮', d: 'Complete modal verbs', r: (s) => (s.mv ?? 0) >= 1 },
  { id: 'hist', n: 'Historian', i: '🏛️', d: 'Read a history passage', r: (s) => (s.hi ?? 0) >= 1 },
  {
    id: 'srs10',
    n: 'Word Collector',
    i: '📖',
    d: 'Review 10 SRS words',
    r: (s) => (s.srsTotal || 0) >= 10,
  },
  {
    id: 'srs50',
    n: 'Polyglot',
    i: '🌍',
    d: 'Review 50 SRS words',
    r: (s) => (s.srsTotal || 0) >= 50,
  },
  { id: 'str3', n: 'On a Roll', i: '🔥', d: '3-day streak', r: (s) => (s.streak || 0) >= 3 },
  { id: 'str7', n: 'Week Warrior', i: '📅', d: '7-day streak', r: (s) => (s.streak || 0) >= 7 },
  { id: 'str30', n: 'Unstoppable', i: '⚡', d: '30-day streak', r: (s) => (s.streak || 0) >= 30 },
  {
    id: 'fix5',
    n: 'Mistake Crusher',
    i: '🛠️',
    d: 'Master 5 mistake words',
    r: (s) => (s.mistakesMastered || 0) >= 5,
  },
  {
    id: 'read3',
    n: 'Reading Pro',
    i: '📰',
    d: 'Complete 3 reading passages',
    r: (s) => (s.readingDone || 0) >= 3,
  },
  {
    id: 'amb',
    n: 'Cultural Ambassador',
    i: '🇭🇷',
    d: 'Explore HRT & media',
    r: (s) => (s.mediaVisits || 0) >= 1,
  },
  {
    id: 'baka1',
    n: "Baka's Listener",
    i: '💌',
    d: 'Opened your first letter from Baka',
    r: () => (getCultureStats().bakaCnt || 0) >= 1,
  },
  {
    id: 'baka5',
    n: "Baka's Devotee",
    i: '👵',
    d: 'Read 5 letters from Baka',
    r: () => (getCultureStats().bakaCnt || 0) >= 5,
  },
  {
    id: 'city5',
    n: 'City Explorer',
    i: '🏙️',
    d: 'Explored 5 Croatian cities',
    r: () => (getCultureStats().cityCnt || 0) >= 5,
  },
  {
    id: 'city15',
    n: 'Wanderer',
    i: '🗺️',
    d: 'Discovered 15 Croatian cities',
    r: () => (getCultureStats().cityCnt || 0) >= 15,
  },
  {
    id: 'media5',
    n: 'Culture Seeker',
    i: '🎵',
    d: 'Explored 5 Croatian media items',
    r: () => (getCultureStats().mediaCnt || 0) >= 5,
  },
  {
    id: 'media20',
    n: 'Culture Master',
    i: '🇭🇷',
    d: 'Experienced 20 Croatian media items',
    r: () => (getCultureStats().mediaCnt || 0) >= 20,
  },
  {
    id: 'region5',
    n: 'Regional Explorer',
    i: '🏔️',
    d: 'Explored 5 Croatian regions',
    r: () => (getCultureStats().regionCnt || 0) >= 5,
  },
  {
    id: 'proverb',
    n: 'Wisdom Seeker',
    i: '📜',
    d: 'Read 3 Croatian proverbs',
    r: () => (getCultureStats().proverbCnt || 0) >= 3,
  },
  {
    id: 'str14',
    n: 'Two Weeks Strong',
    i: '🔥',
    d: '14-day streak',
    r: (s) => (s.streak || 0) >= 14,
  },
  {
    id: 'str21',
    n: 'Three Week Hero',
    i: '💪',
    d: '21-day streak',
    r: (s) => (s.streak || 0) >= 21,
  },
  {
    id: 'str60',
    n: 'Two Month Titan',
    i: '⚡',
    d: '60-day streak',
    r: (s) => (s.streak || 0) >= 60,
  },
  {
    id: 'str100',
    n: 'Century Streak',
    i: '🏆',
    d: '100-day streak',
    r: (s) => (s.streak || 0) >= 100,
  },
  { id: 'lc10', n: 'Ten Strong', i: '🎯', d: 'Complete 10 lessons', r: (s) => (s.lc ?? 0) >= 10 },
  { id: 'lc30', n: 'Committed', i: '📘', d: 'Complete 30 lessons', r: (s) => (s.lc ?? 0) >= 30 },
  {
    id: 'lc75',
    n: 'Dedicated Learner',
    i: '🎓',
    d: 'Complete 75 lessons',
    r: (s) => (s.lc ?? 0) >= 75,
  },
  {
    id: 'sharp3',
    n: 'Sharp Shooter',
    i: '🎯',
    d: 'Score 100% on 3 different exercises',
    r: (s) => (s.pf || 0) >= 3,
  },
  {
    id: 'perf10',
    n: 'Perfectionist Pro',
    i: '💎',
    d: 'Score 100% on 10 exercises total',
    r: (s) => (s.pf || 0) >= 10,
  },
  {
    id: 'nomistake',
    n: 'No Mistakes',
    i: '✅',
    d: 'Complete any exercise without a wrong answer',
    r: (s) => (s.pf || 0) >= 1,
  },
  {
    id: 'srs25',
    n: 'Word Enthusiast',
    i: '📖',
    d: 'Review 25 SRS words',
    r: (s) => (s.srsTotal || 0) >= 25,
  },
  {
    id: 'srs100',
    n: 'Vocabulary Builder',
    i: '📚',
    d: 'Review 100 SRS words',
    r: (s) => (s.srsTotal || 0) >= 100,
  },
  {
    id: 'srs250',
    n: 'Lexicon Master',
    i: '🌐',
    d: 'Review 250 SRS words',
    r: (s) => (s.srsTotal || 0) >= 250,
  },
  {
    id: 'srs500',
    n: 'Word Hoarder',
    i: '🗂️',
    d: 'Review 500 SRS words',
    r: (s) => (s.srsTotal || 0) >= 500,
  },
  {
    id: 'srs1k',
    n: 'Lexicon Lord',
    i: '🏅',
    d: 'Review 1,000 SRS words',
    r: (s) => (s.srsTotal || 0) >= 1000,
  },
  {
    id: 'sp5',
    n: 'Speaker',
    i: '🗣️',
    d: 'Complete 5 speaking sessions',
    r: (s) => (s.sp || 0) >= 5,
  },
  {
    id: 'sp10',
    n: 'Fluent Voice',
    i: '🎙️',
    d: 'Complete 10 speaking sessions',
    r: (s) => (s.sp || 0) >= 10,
  },
  {
    id: 'sp25',
    n: 'Orator',
    i: '🏛️',
    d: 'Complete 25 speaking sessions',
    r: (s) => (s.sp || 0) >= 25,
  },
  {
    id: 'gc5',
    n: 'Grammar Adept',
    i: '✍️',
    d: 'Complete 5 grammar exercises',
    r: (s) => (s.gc || 0) >= 5,
  },
  {
    id: 'gc10',
    n: 'Grammar Master',
    i: '🎓',
    d: 'Complete 10 grammar exercises',
    r: (s) => (s.gc || 0) >= 10,
  },
  {
    id: 'extype5',
    n: 'Explorer',
    i: '🔍',
    d: 'Complete 5 different exercise types',
    r: () => {
      try {
        return JSON.parse(localStorage.getItem('nh_ex_types_done') || '[]').length >= 5;
      } catch (_) {
        return false;
      }
    },
  },
  {
    id: 'extype10',
    n: 'Polyglot Practice',
    i: '🗣️',
    d: 'Complete 10 different exercise types',
    r: () => {
      try {
        return JSON.parse(localStorage.getItem('nh_ex_types_done') || '[]').length >= 10;
      } catch (_) {
        return false;
      }
    },
  },
  {
    id: 'extype15',
    n: 'All-Rounder',
    i: '🌟',
    d: 'Complete 15 different exercise types',
    r: () => {
      try {
        return JSON.parse(localStorage.getItem('nh_ex_types_done') || '[]').length >= 15;
      } catch (_) {
        return false;
      }
    },
  },
  {
    id: 'earlybird',
    n: 'Early Bird',
    i: '🌅',
    d: 'Practice before 8am',
    r: () => new Date().getHours() < 8,
  },
  {
    id: 'nightowl',
    n: 'Night Owl',
    i: '🦉',
    d: 'Practice after 10pm',
    r: () => new Date().getHours() >= 22,
  },
  {
    id: 'weekend',
    n: 'Weekend Warrior',
    i: '🏖️',
    d: 'Practice on both Saturday and Sunday in same weekend',
    r: () => {
      try {
        const w = JSON.parse(localStorage.getItem('nh_weekend_days') || '{}');
        return !!(w.sat && w.sun);
      } catch (_) {
        return false;
      }
    },
  },
  {
    id: 'heritage5',
    n: 'Heritage Seeker',
    i: '🧬',
    d: 'Set heritage goal and complete 5 lessons',
    r: (s) => {
      try {
        const g = localStorage.getItem('nh_goal');
        return g === 'heritage' && (s.lc ?? 0) >= 5;
      } catch (_) {
        return false;
      }
    },
  },
  {
    id: 'family5',
    n: 'Family First',
    i: '👨‍👩‍👧',
    d: 'Set family goal and complete 5 lessons',
    r: (s) => {
      try {
        const g = localStorage.getItem('nh_goal');
        return g === 'family' && (s.lc ?? 0) >= 5;
      } catch (_) {
        return false;
      }
    },
  },
  {
    id: 'travel5',
    n: 'World Traveler',
    i: '✈️',
    d: 'Set travel goal and complete 5 lessons',
    r: (s) => {
      try {
        const g = localStorage.getItem('nh_goal');
        return g === 'travel' && (s.lc ?? 0) >= 5;
      } catch (_) {
        return false;
      }
    },
  },
  {
    id: 'hajduk',
    n: 'Hajduk Fan',
    i: '⚽',
    d: 'Complete the football slang exercise',
    r: (s) => (s.footballDone || 0) >= 1,
  },
  {
    id: 'dalmatian',
    n: 'Dalmatian Soul',
    i: '🌊',
    d: 'Complete the Dalmatian dialect exercise',
    r: (s) => (s.dialectDone || 0) >= 1,
  },
  {
    id: 'zagreb',
    n: 'Zagrepčanin',
    i: '🏙️',
    d: 'Complete the Zagreb slang exercise',
    r: (s) => (s.textingDone || 0) >= 1,
  },
];

// ─── Journey milestones ───────────────────────────────────────────────────────
interface JourneyEntry {
  type: string;
  date: string;
  allowRepeat?: boolean;
  [key: string]: unknown;
}

export function recordJourneyMilestone(type: string, meta?: Record<string, unknown>): void {
  try {
    const existing: JourneyEntry[] = JSON.parse(localStorage.getItem('nh_journey') || '[]');
    const allowRepeat = meta && meta.allowRepeat;
    if (!allowRepeat && existing.some((m) => m.type === type)) return;
    existing.push(Object.assign({ type, date: new Date().toISOString() }, meta || {}));
    localStorage.setItem('nh_journey', JSON.stringify(existing.slice(-200)));
  } catch (_) {}
}
export function getJourneyMilestones(): JourneyEntry[] {
  try {
    return JSON.parse(localStorage.getItem('nh_journey') || '[]');
  } catch (_) {
    return [];
  }
}

// ─── Theme objects (inline CSS for the root div) ──────────────────────────────
export const BG_LIGHT: CSSProperties = {
  minHeight: '100vh',
  background:
    'radial-gradient(ellipse 100% 55% at 60% -10%, rgba(14,116,144,.09) 0%, transparent 60%), radial-gradient(ellipse 70% 45% at 0% 100%, rgba(212,0,48,.05) 0%, transparent 55%), radial-gradient(ellipse 60% 40% at 100% 50%, rgba(0,61,165,.04) 0%, transparent 50%), #eef2f7',
  color: '#1c1917',
  fontFamily: "'Outfit',sans-serif",
  position: 'relative',
  overflowX: 'hidden',
};
export const BG_DARK: CSSProperties = {
  minHeight: '100vh',
  background:
    'radial-gradient(ellipse 100% 55% at 50% -10%, rgba(14,116,144,.18) 0%, transparent 55%), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(212,0,48,.1) 0%, transparent 50%), linear-gradient(170deg,#080f1e 0%,#0d1b35 40%,#101828 70%,#0c1520 100%)',
  color: '#e2e8f0',
  fontFamily: "'Outfit',sans-serif",
  position: 'relative',
  overflowX: 'hidden',
};
