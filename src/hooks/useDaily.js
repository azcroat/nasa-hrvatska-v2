/**
 * useDaily — daily challenge answered/selection state.
 * Restores today's progress from localStorage on mount.
 * Extracted from App.jsx.
 */
import { useState } from 'react';

function todayKey() {
  const d = new Date();
  return d.getFullYear() + '-'
    + String(d.getMonth() + 1).padStart(2, '0') + '-'
    + String(d.getDate()).padStart(2, '0');
}

// Read the main progress doc (uP_<uid>) as a fallback source for today's dc state.
// The auto-save in App.jsx writes dchlA into this doc on every answer, making it
// the most reliable record even if dcDay3 was corrupted by a previous sync.
function loadFromMainDoc(k) {
  try {
    const sess = JSON.parse(localStorage.getItem('uS') || 'null');
    if (!sess || !sess.u) return null;
    const prog = JSON.parse(localStorage.getItem('uP_' + sess.u) || 'null');
    if (prog && prog.dc && prog.dc.day === k) return prog.dc;
  } catch (e) {}
  return null;
}

function loadDailyAnswered() {
  const k = todayKey();
  // Primary: dedicated dcDay3 key (written on every answer click)
  const saved = localStorage.getItem('dcDay3');
  if (saved) {
    try {
      const p = JSON.parse(saved);
      if (p.day === k && Array.isArray(p.answered)) {
        // Merge with main progress doc in case one source has more answers
        const main = loadFromMainDoc(k);
        if (main && Array.isArray(main.answered)) {
          return p.answered.map((a, i) => !!(a || main.answered[i]));
        }
        return p.answered.map(a => !!a);
      }
    } catch (e) {}
  }
  // Fallback: main progress doc (written by auto-save on every dchlA change)
  const main = loadFromMainDoc(k);
  if (main && Array.isArray(main.answered)) return main.answered.map(a => !!a);
  return [false, false, false];
}

function loadDailySelected() {
  const k = todayKey();
  const saved = localStorage.getItem('dcDay3');
  if (saved) {
    try {
      const p = JSON.parse(saved);
      if (p.day === k && Array.isArray(p.selected) && typeof p.selected[0] === 'string') return p.selected;
    } catch (e) {}
  }
  // Fallback: main progress doc
  const main = loadFromMainDoc(k);
  if (main && Array.isArray(main.selected) && typeof main.selected[0] === 'string') return main.selected;
  return ['', '', ''];
}

export function useDaily() {
  const [dchlA, sDchlA] = useState(loadDailyAnswered);
  const [dchlSl, sDchlSl] = useState(loadDailySelected);
  return { dchlA, sDchlA, dchlSl, sDchlSl };
}
