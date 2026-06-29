// src/lib/userContext.ts
// SP5: client-built user-context payload attached to AI POST requests.

import { getWeakTopics } from './adaptive';
import { getRecentErrors, type RecentErrorView } from './recentErrors';
import { getGatedUserCefr } from './cefrLevel';

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface UserContext {
  version: 1;
  generatedAt: number;
  level: {
    cefr: CefrLevel;
    xp: number;
    streak: number;
  };
  weakTopics: Array<{
    topic: string;
    accuracy: number;
    attempts: number;
  }>;
  recentErrors: RecentErrorView[];
  vocab: {
    learned: number;
    dueToday: number;
    hardest: string[];
  };
}

interface ProfileStats {
  xp?: number;
  lc?: number;
  gc?: number;
}

interface SRCard {
  i?: number;
  e?: number;
  n?: number;
  due?: number;
  q?: number;
  lapses?: number;
}

function _readActiveEmail(): string | null {
  try {
    const raw = localStorage.getItem('uS');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return typeof parsed?.u === 'string' ? parsed.u : null;
  } catch {
    return null;
  }
}

function _readProfile(): { st: ProfileStats; sr: Record<string, SRCard> } | null {
  const email = _readActiveEmail();
  if (!email) return null;
  try {
    const raw = localStorage.getItem('uP_' + email);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // 2026-05-21 BUG FIX: progressSnapshot writes the canonical `stats` key;
    // legacy writes used `st`. Reading only `parsed.st` made every fresh
    // user resolve as xp=0 → A1 → recommender then suggested A1 stories
    // and the rationale text said "right at your A1 level" even for users
    // who were visibly B2 on the home screen. Read `stats` first, fall
    // back to `st` for any legacy blob that still has the old key.
    return {
      st: (parsed?.stats as ProfileStats) || (parsed?.st as ProfileStats) || {},
      sr: (parsed?.sr as Record<string, SRCard>) || {},
    };
  } catch {
    return null;
  }
}

function _readStreak(): number {
  try {
    const raw = localStorage.getItem('uStreak');
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    return typeof parsed?.count === 'number' ? parsed.count : 0;
  } catch {
    return 0;
  }
}

function readLevel(): UserContext['level'] {
  const profile = _readProfile();
  const st = profile?.st ?? {};
  const xp = typeof st.xp === 'number' ? st.xp : 0;
  const lc = typeof st.lc === 'number' ? st.lc : 0;
  const gc = typeof st.gc === 'number' ? st.gc : 0;
  const cefr = getGatedUserCefr(xp, lc, gc) as CefrLevel;
  return { cefr, xp, streak: _readStreak() };
}

function readWeakTopics(): UserContext['weakTopics'] {
  // adaptive.getWeakTopics returns { id, accuracy(0-100), attempts } already
  // sorted lowest-accuracy-first and pre-filtered to attempts >= 3 + non-stale.
  // We pass threshold=100 so every topic below perfect accuracy is included,
  // then cap at 3 and normalize the accuracy to a 0-1 fraction rounded to 2dp.
  const weak = getWeakTopics(100);
  return weak
    .filter((t) => t.attempts >= 3)
    .slice(0, 3)
    .map((t) => ({
      topic: t.id,
      accuracy: Math.round(t.accuracy) / 100,
      attempts: t.attempts,
    }));
}

function readVocabStats(): UserContext['vocab'] {
  const profile = _readProfile();
  const sr = profile?.sr ?? {};
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  let learned = 0;
  let dueToday = 0;
  const entries: Array<{ word: string; lapses: number }> = [];
  for (const [word, card] of Object.entries(sr)) {
    if (!card || typeof card !== 'object') continue;
    const n = typeof card.n === 'number' ? card.n : 0;
    const due = typeof card.due === 'number' ? card.due : 0;
    const lapses = typeof card.lapses === 'number' ? card.lapses : 0;
    if (n >= 1) learned += 1;
    if (due > 0 && due - now <= dayMs) dueToday += 1;
    if (lapses > 0) entries.push({ word, lapses });
  }
  entries.sort((a, b) => b.lapses - a.lapses);
  const hardest = entries.slice(0, 5).map((e) => e.word);
  return { learned, dueToday, hardest };
}

export function buildUserContext(): UserContext {
  return {
    version: 1,
    generatedAt: Date.now(),
    level: readLevel(),
    weakTopics: readWeakTopics(),
    recentErrors: getRecentErrors(),
    vocab: readVocabStats(),
  };
}
