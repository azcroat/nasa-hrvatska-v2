// lives.ts — Challenge Mode hearts system
// 5 hearts per day. Lose 1 on wrong answer. Regen 1 per 4 hours.
// Hearts reset at midnight.

import { localDateStr } from './dateUtils';

const KEY = 'nh_hearts';

interface HeartsState {
  date: string;
  hearts: number;
  lastRegen: number;
}

function getState(): HeartsState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as HeartsState;
  } catch {
    return null;
  }
}

function saveState(s: HeartsState): void {
  localStorage.setItem(KEY, JSON.stringify(s));
}

function todayKey(): string {
  return localDateStr();
}

export function getHearts(): number {
  const s = getState();
  const today = todayKey();
  if (!s || s.date !== today) {
    const fresh: HeartsState = { date: today, hearts: 5, lastRegen: Date.now() };
    saveState(fresh);
    return fresh.hearts;
  }
  // Clamp hearts from localStorage to valid range [0,5] — guards against corrupted data.
  const safeHearts = Math.min(5, Math.max(0, s.hearts || 0));
  const hoursPassed = (Date.now() - (s.lastRegen || 0)) / 14400000;
  const regenCount = Math.floor(hoursPassed);
  if (regenCount > 0 && safeHearts < 5) {
    const newHearts = Math.min(5, safeHearts + regenCount);
    const updated: HeartsState = { ...s, hearts: newHearts, lastRegen: Date.now() };
    saveState(updated);
    return newHearts;
  }
  return safeHearts;
}

export function loseHeart(): number {
  const s = getState();
  const today = todayKey();
  const current = s && s.date === today ? s.hearts : 5;
  const newHearts = Math.max(0, current - 1);
  // When date has changed (returning user on a new day), reset lastRegen to now.
  // Using the old lastRegen from a previous day causes getHearts() to immediately
  // regen all hearts (20+ hours elapsed), breaking the lives system for returning users.
  const lastRegen = s && s.date === today ? s.lastRegen || Date.now() : Date.now();
  saveState({ date: today, hearts: newHearts, lastRegen });
  return newHearts;
}

export function hasHearts(): boolean {
  return getHearts() > 0;
}

export function getRegenTimeMs(): number {
  const s = getState();
  if (!s || s.hearts >= 5) return 0;
  const elapsed = Math.max(0, Date.now() - (s.lastRegen || 0));
  const rem = elapsed % 14400000;
  return rem === 0 ? 0 : 14400000 - rem;
}
