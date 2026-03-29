/**
 * useAward — XP award, streak ceremony, and badge toast state.
 *
 * Extracted from App.jsx to isolate the gamification state machine.
 * Caller must provide curEx (active exercise ID), stats, and setStats.
 *
 * @param {{ curEx: string, stats: object, setStats: Function }} params
 */
import { useState, useCallback } from 'react';
import {
  lXPgain, lvl, BADGES,
  updateStreak, applyStreakEarnBack, getStreakEarnBack, earnFreeze,
  getStreak, recordJourneyMilestone,
} from '../data.jsx';
import { trackComplete } from '../lib/learnerStyle.js';
import {
  trackLessonComplete, trackExerciseComplete, trackLevelUp,
  trackBadgeEarned, trackStreakMilestone,
} from '../lib/analytics.js';
import { weekKey as _weekKey } from '../lib/dateUtils.js';

// Module-level guard: comeback bonus fires at most once per app session
// (mirrors _comebackUsedThisSession in App.jsx — must stay in sync if moved)
let _awardComebackUsed = false;

// Expose for App.jsx reset on sign-out (if needed)
export function resetComebackGuard() { _awardComebackUsed = false; }

// Pure XP cooldown helpers — also imported by App.jsx for launch functions
function _localDateStr() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
export function canEarnXP(exerciseId) {
  try { const cd = JSON.parse(localStorage.getItem('xpCooldown') || '{}'); return cd[exerciseId] !== _localDateStr(); } catch { return true; }
}
export function markExerciseDone(exerciseId) {
  try { const cd = JSON.parse(localStorage.getItem('xpCooldown') || '{}'); const today = _localDateStr(); cd[exerciseId] = today; const clean = {}; for (const k in cd) { if (cd[k] === today) clean[k] = cd[k]; } localStorage.setItem('xpCooldown', JSON.stringify(clean)); } catch {}
}

export function useAward({ curEx, stats, setStats }) {
  const [comebackBonus, setComebackBonus] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebXP, setCelebXP] = useState(0);
  const [streakMilestone, setStreakMilestone] = useState(null);
  const [ceremonyType, setCeremonyType] = useState(null);
  const [levelUpData, setLevelUpData] = useState(null);
  const [freezeUsedToast, setFreezeUsedToast] = useState(false);
  const [earnBackPrompt, setEarnBackPrompt] = useState(null);
  const [streakRestoredCount, setStreakRestoredCount] = useState(0);
  const [ttsFailedToast, setTtsFailedToast] = useState(false);
  const [showXP, setShowXP] = useState(false);
  const [xpA, setXpA] = useState(0);
  const [nB, setNB] = useState(null);
  const [sB, setSB] = useState(false);

  const award = useCallback((amt, celebrate) => {
    if (!Number.isFinite(amt) || amt === 0) return;
    if (curEx && !canEarnXP(curEx)) { setXpA(0); setShowXP(false); return; }
    if (curEx) markExerciseDone(curEx);
    let totalAmt = lXPgain(amt);
    const _today = _localDateStr();
    if (comebackBonus && amt > 0 && !_awardComebackUsed && !localStorage.getItem('nh_comeback_used_' + _today)) {
      _awardComebackUsed = true;
      localStorage.setItem('nh_comeback_used_' + _today, '1');
      totalAmt = lXPgain(amt) + 50; // Bonus is flat, not subject to campaign multiplier
    }
    setXpA(totalAmt); setShowXP(true);
    // Capture side-effect data outside the updater — state updaters must be pure
    let _pendingBadge = null;
    let _pendingLevelUp = null;
    setStats(s => {
      const oldLevel = lvl(s.xp);
      const n = { ...s, xp: Math.max(0, (s.xp || 0) + totalAmt), streak: (getStreak() || { count: 0 }).count };
      // streak will be updated by updateStreak() below — keep n.streak consistent
      const badges = Array.isArray(s.badges) ? s.badges : [];
      const nb = BADGES.filter(b => {
        if (badges.includes(b.id)) return false;
        try { return b.r(n); } catch { return false; }
      });
      if (nb.length) {
        n.badges = [...badges, ...nb.map(b => b.id)];
        _pendingBadge = nb[0];
        nb.forEach(b => trackBadgeEarned(b.id));
      }
      const newLevel = lvl(n.xp);
      if (newLevel > oldLevel) {
        _pendingLevelUp = newLevel;
        trackLevelUp({ newLevel, totalXP: n.xp });
      }
      return n;
    });
    // Schedule UI side effects AFTER the state update, outside the updater
    if (_pendingBadge) {
      const badge = _pendingBadge;
      setTimeout(() => { setNB(badge); setSB(true); setTimeout(() => setSB(false), 3000); }, 600);
    }
    if (_pendingLevelUp != null) {
      setTimeout(() => { setLevelUpData({ level: _pendingLevelUp }); }, 900);
    }
    setTimeout(() => setShowXP(false), 1500);
    if (celebrate && totalAmt > 0) { setCelebXP(totalAmt); setTimeout(() => setShowCelebration(true), 400); }
    const sr = updateStreak();
    const restoredCount = applyStreakEarnBack();
    if (restoredCount > 0) { setTimeout(() => { setStreakRestoredCount(restoredCount); setTimeout(() => setStreakRestoredCount(0), 5000); }, 1000); }
    else { const eb = getStreakEarnBack(); if (eb && eb.lc === 1) { setEarnBackPrompt({ prev: eb.prev }); setTimeout(() => setEarnBackPrompt(null), 8000); } }
    if (sr.milestone) {
      setTimeout(() => setStreakMilestone(sr.milestone), 800);
      trackStreakMilestone(sr.milestone);
      recordJourneyMilestone('streak_' + sr.milestone, { count: sr.milestone, allowRepeat: false });
    }
    if (sr.count >= 30 && !localStorage.getItem('nh_ceremony_streak_30')) { localStorage.setItem('nh_ceremony_streak_30', '1'); setCeremonyType('streak_30'); }
    if (sr.count >= 50 && !localStorage.getItem('nh_ceremony_streak_50')) { localStorage.setItem('nh_ceremony_streak_50', '1'); setCeremonyType('streak_50'); }
    if (sr.count >= 100 && !localStorage.getItem('nh_ceremony_streak_100')) { localStorage.setItem('nh_ceremony_streak_100', '1'); setCeremonyType('streak_100'); }
    if (sr.count > 0 && sr.count % 7 === 0) earnFreeze();
    if (sr.freezeUsed) { setFreezeUsedToast(true); setTimeout(() => setFreezeUsedToast(false), 4500); }
    const _stageGates = [5, 11, 22, 34, 45];
    setStats(function (s) {
      for (let _si = 1; _si < _stageGates.length; _si++) {
        const _sk = 'nh_stage' + (_si + 1) + '_ceremony';
        if (s.lc >= _stageGates[_si] && !localStorage.getItem(_sk)) { localStorage.setItem(_sk, '1'); setTimeout(() => setCeremonyType('stage_' + (_si + 1)), 100); break; }
      }
      return s;
    });
    const _wk = _weekKey();
    const _wkKey = 'nh_week_xp_' + _wk;
    localStorage.setItem(_wkKey, String(Math.max(0, (parseInt(localStorage.getItem(_wkKey) || '0', 10)) + totalAmt)));
    if (!localStorage.getItem('nh_journey_first_lesson') && totalAmt > 0) { localStorage.setItem('nh_journey_first_lesson', '1'); recordJourneyMilestone('first_lesson', {}); }
    if (celebrate && curEx && curEx.startsWith('vocab_')) { try { localStorage.removeItem('nh_lesson_resume'); } catch (_) {} }
    if (curEx) {
      const _lsStartTs = parseInt(sessionStorage.getItem('nh_ex_start') || '0');
      const _lsDur = _lsStartTs ? Date.now() - _lsStartTs : 0;
      const _lsTypeMap = { flash: 'flashcards', flashcards: 'flashcards', mcgame: 'quiz', review: 'srs_review', listening: 'listening', ai_listening: 'listening', speaking: 'speaking', speaking_sprint: 'speaking', aiconvo: 'conversation', writing: 'writing', shadowing: 'shadowing', cloze: 'cloze', grammar: 'grammar', match: 'matching', readlist: 'reading' };
      const _lsAType = _lsTypeMap[curEx] || (curEx.startsWith('vocab_') ? 'flashcards' : null);
      if (_lsAType) {
        trackComplete(_lsAType, _lsDur);
        sessionStorage.removeItem('nh_ex_start');
        if (celebrate) {
          trackLessonComplete({ xpEarned: totalAmt, streak: getStreak().count, lessonType: _lsAType, lessonId: curEx });
        } else {
          trackExerciseComplete({ exerciseType: _lsAType, xpEarned: totalAmt });
        }
      }
    }
  }, [curEx, comebackBonus, setStats]);

  return {
    award,
    // Ceremony + toast state
    comebackBonus, setComebackBonus,
    showCelebration, setShowCelebration, celebXP, setCelebXP,
    streakMilestone, setStreakMilestone,
    ceremonyType, setCeremonyType,
    levelUpData, setLevelUpData,
    freezeUsedToast, setFreezeUsedToast,
    earnBackPrompt, setEarnBackPrompt,
    streakRestoredCount, setStreakRestoredCount,
    ttsFailedToast, setTtsFailedToast,
    showXP, xpA,
    nB, sB,
  };
}
