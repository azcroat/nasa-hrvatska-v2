// lives.js — Challenge Mode hearts system
// 5 hearts per day. Lose 1 on wrong answer. Regen 1 per 4 hours.
// Hearts reset at midnight.

import { localDateStr } from './dateUtils.js';

const KEY = 'nh_hearts';

function getState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function saveState(s) {
  localStorage.setItem(KEY, JSON.stringify(s));
}

function todayKey() {
  return localDateStr();
}

export function getHearts() {
  const s = getState();
  const today = todayKey();
  if (!s || s.date !== today) {
    // New day — full hearts
    const fresh = { date: today, hearts: 5, lastRegen: Date.now() };
    saveState(fresh);
    return fresh.hearts;
  }
  // Check regen: +1 per 4 hours since lastRegen, up to 5
  const hoursPassed = (Date.now() - (s.lastRegen || 0)) / 14400000;
  const regenCount = Math.floor(hoursPassed);
  if (regenCount > 0 && s.hearts < 5) {
    const newHearts = Math.min(5, s.hearts + regenCount);
    const updated = { ...s, hearts: newHearts, lastRegen: Date.now() };
    saveState(updated);
    return newHearts;
  }
  return s.hearts;
}

export function loseHeart() {
  const s = getState();
  const today = todayKey();
  const current = (s && s.date === today) ? s.hearts : 5;
  const newHearts = Math.max(0, current - 1);
  saveState({ date: today, hearts: newHearts, lastRegen: s?.lastRegen || Date.now() });
  return newHearts;
}

export function hasHearts() {
  return getHearts() > 0;
}

export function getRegenTimeMs() {
  // Returns ms until next heart regen
  const s = getState();
  if (!s || s.hearts >= 5) return 0;
  const elapsed = Date.now() - (s.lastRegen || 0);
  const nextRegen = 14400000 - (elapsed % 14400000);
  return nextRegen;
}
