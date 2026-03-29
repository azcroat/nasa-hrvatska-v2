/**
 * progressSnapshot — pure function that builds the canonical progress document.
 *
 * Previously copy-pasted 3 times across App.jsx (doSyncNow, saveSnapshot, auto-save
 * useEffect). This module is the single source of truth for what gets persisted.
 *
 * @param {{ uid: string, name: string, stats: object, dchlA: boolean[], dchlSl: string[], favs: string[], jWords: object[] }} params
 * @returns {object} progress document ready for localStorage / Firestore
 */
import { getSR, getStreak, getStreakFreezes, gP } from '../data.jsx';
import { localDateStr as _todayStr, weekKey as _weekKey } from './dateUtils.js';

/** Merge React dc state with localStorage dcDay3 — truth is the union of answered positions. */
function _bestDc(dchlA, dchlSl) {
  const today = _todayStr();
  let localAns = [false, false, false];
  let localSel = ['', '', ''];
  try {
    const p = JSON.parse(localStorage.getItem('dcDay3') || '{}');
    if (p.day === today) {
      if (Array.isArray(p.answered)) localAns = p.answered;
      if (Array.isArray(p.selected) && typeof p.selected[0] === 'string') localSel = p.selected;
    }
  } catch (_) {}
  const bestAns = (dchlA || [false, false, false]).map((a, i) => a || localAns[i] || false);
  const bestSel = (dchlSl && dchlSl.some(s => s)) ? dchlSl : localSel;
  return { day: today, answered: bestAns, selected: bestSel };
}

export function buildProgressSnapshot({ uid, name, stats, dchlA, dchlSl, favs, jWords }) {
  const dc = _bestDc(dchlA, dchlSl);
  const weekXP = parseInt(localStorage.getItem('nh_week_xp_' + _weekKey()) || '0', 10);
  const fbUpdated = (() => { try { const p = gP(uid); return (p && p._fbUpdated) || 0; } catch { return 0; } })();
  const cooldown = (() => { try { return JSON.parse(localStorage.getItem('xpCooldown') || '{}'); } catch { return {}; } })();

  return {
    name,
    stats,
    cp: true,
    onboarded: localStorage.getItem('onboarded') === 'true',
    savedAt: Date.now(),
    _fbUpdated: fbUpdated,
    sr: getSR(),
    streak: getStreak(),
    freezes: getStreakFreezes(),
    favs: favs || [],
    journal: jWords || [],
    dc,
    cooldown,
    weekXP,
  };
}
