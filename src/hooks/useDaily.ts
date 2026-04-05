/**
 * useDaily — daily challenge answered/selection state.
 * Restores today's progress from localStorage on mount.
 * Extracted from App.jsx.
 */
import { useState } from 'react';

function todayKey(): string {
  const d = new Date();
  return d.getFullYear() + '-'
    + String(d.getMonth() + 1).padStart(2, '0') + '-'
    + String(d.getDate()).padStart(2, '0');
}

interface DailyState {
  day: string;
  answered?: (boolean | 0 | 1 | null)[];
  selected?: string[];
}

// Read the main progress doc (uP_<uid>) as a fallback source for today's dc state.
// The auto-save in App.jsx writes dchlA into this doc on every answer, making it
// the most reliable record even if dcDay3 was corrupted by a previous sync.
function loadFromMainDoc(k: string): DailyState | null {
  try {
    const sess = JSON.parse(localStorage.getItem('uS') || 'null') as { u?: string } | null;
    if (!sess || !sess.u) return null;
    const prog = JSON.parse(localStorage.getItem('uP_' + sess.u) || 'null') as { dc?: DailyState } | null;
    if (prog && prog.dc && prog.dc.day === k) return prog.dc;
  } catch (e) {}
  return null;
}

function loadDailyAnswered(): boolean[] {
  const k = todayKey();
  // Primary: dedicated dcDay3 key (written on every answer click)
  const saved = localStorage.getItem('dcDay3');
  if (saved) {
    try {
      const p = JSON.parse(saved) as DailyState;
      if (p.day === k && Array.isArray(p.answered)) {
        // Merge with main progress doc in case one source has more answers
        const main = loadFromMainDoc(k);
        if (main && Array.isArray(main.answered)) {
          return p.answered.map((a, i) => !!(a || (main.answered as (boolean | 0 | 1 | null)[])[i]));
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

function loadDailySelected(): string[] {
  const k = todayKey();
  const saved = localStorage.getItem('dcDay3');
  if (saved) {
    try {
      const p = JSON.parse(saved) as DailyState;
      if (p.day === k && Array.isArray(p.selected) && typeof p.selected[0] === 'string') return p.selected;
    } catch (e) {}
  }
  // Fallback: main progress doc
  const main = loadFromMainDoc(k);
  if (main && Array.isArray(main.selected) && typeof main.selected[0] === 'string') return main.selected;
  return ['', '', ''];
}

export function useDaily(): {
  dchlA: boolean[];
  sDchlA: React.Dispatch<React.SetStateAction<boolean[]>>;
  dchlSl: string[];
  sDchlSl: React.Dispatch<React.SetStateAction<string[]>>;
} {
  const [dchlA, sDchlA] = useState<boolean[]>(loadDailyAnswered);
  const [dchlSl, sDchlSl] = useState<string[]>(loadDailySelected);
  return { dchlA, sDchlA, dchlSl, sDchlSl };
}
