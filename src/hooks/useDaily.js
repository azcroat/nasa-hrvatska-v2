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

function loadDailyAnswered() {
  const k = todayKey();
  const saved = localStorage.getItem('dcDay3');
  if (saved) {
    try { const p = JSON.parse(saved); if (p.day === k) return p.answered; }
    catch (e) {} // NOSONAR - intentional empty catch, optional browser API or safe fallback
  }
  return [false, false, false];
}

function loadDailySelected() {
  const k = todayKey();
  const saved = localStorage.getItem('dcDay3');
  if (saved) {
    try {
      const p = JSON.parse(saved);
      if (p.day === k && Array.isArray(p.selected) && typeof p.selected[0] === 'string') return p.selected;
    } catch (e) {} // NOSONAR - intentional empty catch, optional browser API or safe fallback
  }
  return ['', '', ''];
}

export function useDaily() {
  const [dchlA, sDchlA] = useState(loadDailyAnswered);
  const [dchlSl, sDchlSl] = useState(loadDailySelected);
  return { dchlA, sDchlA, dchlSl, sDchlSl };
}
