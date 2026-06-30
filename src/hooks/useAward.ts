/**
 * useAward — XP award, streak ceremony, and badge toast state.
 *
 * Extracted from App.jsx to isolate the gamification state machine.
 * Caller must provide curEx (active exercise ID), stats, and setStats.
 */
import { useState, useCallback } from 'react';
import {
  lXPgain,
  lvl,
  BADGES,
  updateStreak,
  applyStreakEarnBack,
  getStreakEarnBack,
  earnFreeze,
  getStreak,
  recordJourneyMilestone,
} from '../lib/appUtils.js';
import { useContent } from './useContent';
import { getActiveCampaign } from '../lib/seasonalCampaign';
import { trackComplete } from '../lib/learnerStyle.js';
import {
  trackLessonComplete,
  trackExerciseComplete,
  trackLevelUp,
  trackBadgeEarned,
  trackStreakMilestone,
} from '../lib/analytics.js';
import {
  localDateStr as _localDateStr,
  weekKey as _weekKey,
  getServerDateStr as _getServerDateStr,
} from '../lib/dateUtils.js';
import { knightSpeak } from '../lib/knightSpeak.js';
import { apiFetch } from '../lib/apiFetch.js';
import * as offlineAwardQueue from '../lib/offlineAwardQueue.js';
import { PRODUCTION_SCREEN_IDS } from './useDailySession';
import { recordProductionRep } from '../lib/productionMetric';
import { recordListeningRep } from '../lib/listeningMetric';
import type { AwardActivityType } from '../lib/activityXp.js';
import type { Stats } from '../types/index.js';

// ── Badge-specific knight speeches ────────────────────────────────────────────
const BADGE_SPEECHES: Record<string, { mood: string; text: string }> = {
  first: {
    mood: 'celebrating',
    text: "Prva lekcija! You've taken the hardest step — beginning. 🌱",
  },
  x100: { mood: 'celebrating', text: '100 XP! The journey to fluency starts here. Svaka čast! ⭐' },
  x500: { mood: 'celebrating', text: "500 XP! You're building something real. Nastavi! 📚" },
  x1k: {
    mood: 'celebrating',
    text: 'Tisuću XP! A thousand points of Croatian locked in your brain. 🏆',
  },
  x2k: { mood: 'celebrating', text: "Dva tisuće XP! You're thinking in Croatian now. Odlično! 🎓" },
  x5k: {
    mood: 'celebrating',
    text: '5,000 XP — Champion status! Croatia itself would applaud. 🥇',
  },
  x10k: { mood: 'celebrating', text: '10,000 XP! You are a legend among language learners. 👑' },
  ded: { mood: 'encouraging', text: 'Pet lekcija! Dedication is the real teacher. 🔥' },
  lc20: { mood: 'celebrating', text: "20 lessons! You've committed. Croatia can feel it. 🚀" },
  lc50: {
    mood: 'celebrating',
    text: '50 lessons — Marathoner! Govorite li hrvatski? Almost... 🏃',
  },
  lc100: { mood: 'celebrating', text: '100 lessons! Sto lekcija! You could write a book. 💯' },
  perf: {
    mood: 'celebrating',
    text: 'Savršeno! A perfect score. Your attention is your superpower. 💎',
  },
  str3: {
    mood: 'encouraging',
    text: 'Tri dana! Habit loops are forming in your mind. Keep going! 🔥',
  },
  str7: { mood: 'celebrating', text: 'Tjedan dana! Week Warrior! Seven days of showing up. 📅' },
  str30: {
    mood: 'celebrating',
    text: "30 days — UNSTOPPABLE! Trideset dana! You've changed yourself. ⚡",
  },
  str100: { mood: 'celebrating', text: '100 days! Sto dana! You are a Century Streak legend. 🏆' },
  spk: {
    mood: 'celebrating',
    text: "Glas Hrvatske! You spoke Croatian out loud. That's courage. 🎤",
  },
  srs10: {
    mood: 'encouraging',
    text: 'Deset riječi u SRS! Your spaced-repetition deck is growing. 📖',
  },
  srs50: {
    mood: 'celebrating',
    text: 'Pedeset SRS words mastered! Your vocabulary is real now. 🌍',
  },
  amb: {
    mood: 'celebrating',
    text: "Kulturni ambasador! You've explored Croatian media. Bravo! 🇭🇷",
  },
};

// ── Level-up knight speeches ──────────────────────────────────────────────────
const LEVEL_SPEECHES: Record<number, { mood: string; text: string }> = {
  2: {
    mood: 'levelup',
    text: "Level 2 — Početnik! You've moved beyond zero. Every word is a victory. 🌱",
  },
  3: {
    mood: 'levelup',
    text: 'Level 3 — Osnovni! The grammar is clicking. You can feel the pattern. 📚',
  },
  4: { mood: 'levelup', text: 'Level 4 — Srednji! Halfway to fluency. Zadar welcomes you. ⭐' },
  5: {
    mood: 'levelup',
    text: "Level 5 — Napredni! You're speaking Croatian that Croatians respect. 💪",
  },
  6: { mood: 'levelup', text: 'Level 6 — Stručnjak! Dubrovnik is your city now. Sjajno! 🏆' },
  7: {
    mood: 'levelup',
    text: 'Level 7 — MAJSTOR! Complete mastery. Croatia is your second home. 👑',
  },
};

// Module-level guard: comeback bonus fires at most once per calendar day.
// Stored as a date string so it resets automatically when the date rolls over
// (the previous boolean would block the bonus on a new day in the same session).
let _awardComebackUsed = '';

// Expose for App.jsx reset on sign-out (if needed)
export function resetComebackGuard() {
  _awardComebackUsed = '';
}
export function canEarnXP(exerciseId: string): boolean {
  try {
    const cd = JSON.parse(localStorage.getItem('xpCooldown') || '{}');
    return cd[exerciseId] !== _localDateStr();
  } catch {
    return true;
  }
}
export function markExerciseDone(exerciseId: string): void {
  try {
    const cd = JSON.parse(localStorage.getItem('xpCooldown') || '{}');
    const today = _localDateStr();
    cd[exerciseId] = today;
    const clean: Record<string, string> = {};
    for (const k in cd) {
      if (cd[k] === today) clean[k] = cd[k];
    }
    localStorage.setItem('xpCooldown', JSON.stringify(clean));
  } catch {}
}

export function useAward({
  curEx,
  stats,
  setStats,
  writeDelta,
}: {
  curEx: string;
  stats: Stats;
  setStats: (fn: (prev: Stats) => Stats) => void;
  writeDelta?: (delta: Record<string, unknown>) => void;
}) {
  const [comebackBonus, setComebackBonus] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebXP, setCelebXP] = useState(0);
  const [streakMilestone, setStreakMilestone] = useState<number | null>(null);
  const [ceremonyType, setCeremonyType] = useState<string | null>(null);
  const [levelUpData, setLevelUpData] = useState<{ level: number } | null>(null);
  const [freezeUsedToast, setFreezeUsedToast] = useState(false);
  const [earnBackPrompt, setEarnBackPrompt] = useState<{ prev: number } | null>(null);
  const [streakRestoredCount, setStreakRestoredCount] = useState(0);
  const [ttsFailedToast, setTtsFailedToast] = useState(false);
  const [showXP, setShowXP] = useState(false);
  const [xpA, setXpA] = useState(0);
  const [nB, setNB] = useState<{ id: string; n: string; d: string } | null>(null);
  const [sB, setSB] = useState(false);

  // SP11e: active campaign multiplier comes from server-shipped SEASONAL_CAMPAIGNS
  // via useContent → getActiveCampaign. Passed into lXPgain so the utility stays
  // pure (no module-level data dependency).
  const { content } = useContent();
  const activeMultiplier = getActiveCampaign(content?.SEASONAL_CAMPAIGNS ?? [])?.multiplier;

  const award = useCallback(
    async (amt: number, celebrate?: boolean, activityType?: AwardActivityType) => {
      if (!Number.isFinite(amt) || amt === 0) return;
      const _effectiveEx = curEx;
      // Signal daily-session completion FIRST — before the XP-cooldown gate below.
      // The daily session is a practice FLOW decoupled from the XP economy: finishing
      // an activity must advance the session even when XP is on cooldown (the learner
      // already earned XP for this exercise earlier today). Previously this write sat
      // AFTER the canEarnXP early-return, so award()-only screens (mcgame, comparatives,
      // qwords, genderdrill, sentbuild, and the listening quizzes) stranded the session
      // at N-1/N on the 2nd+ run of the day — no path to complete it. completeExercise
      // already signals unconditionally; this brings the award() path in line.
      // HomeTab reads nh_session_completed on remount to distinguish a real finish from
      // a back-press, and the started===_effectiveEx guard keeps it activity-accurate.
      if (_effectiveEx) {
        try {
          const started = sessionStorage.getItem('nh_session_started');
          if (started && started === _effectiveEx) {
            sessionStorage.setItem('nh_session_completed', _effectiveEx);
          }
        } catch {}
      }
      // Session-Rec #6 (synced): count a production rep on completion of ANY
      // production exercise — daily session OR Practice tab — keyed on the screen
      // id. Done here, before the XP-cooldown gate, so production is counted even
      // when XP is on cooldown (production effort is the fluency signal, decoupled
      // from the XP economy — same rationale as the session-completion signal
      // above). Updates the device-local weekly bucket AND the synced lifetime
      // `stats.pr` (Math.max-merged across devices). This is the single counting
      // site — markDone no longer counts, so session + practice share one scope.
      if (_effectiveEx && PRODUCTION_SCREEN_IDS.has(_effectiveEx)) {
        recordProductionRep();
        setStats((s: Stats) => ({ ...s, pr: (s.pr || 0) + 1 }));
        if (writeDelta) writeDelta({ pr: 1 });
      }
      // Content-Rec #1: count a listening rep on completion of ANY listening
      // activity (AI Listening, Dictation, Shadowing, Daily Listening, the
      // static listening quiz — every one awards with activityType 'listening').
      // Keyed on activityType, before the XP-cooldown gate, so input volume is
      // measured even when XP is on cooldown — same rationale as production reps.
      // Device-local weekly+lifetime bucket; the synced-promotion path is
      // documented in listeningMetric.ts.
      if (activityType === 'listening') {
        recordListeningRep();
      }
      if (_effectiveEx && !canEarnXP(_effectiveEx)) {
        setXpA(0);
        setShowXP(false);
        return;
      }
      if (_effectiveEx) {
        markExerciseDone(_effectiveEx);
      }
      let totalAmt = lXPgain(amt, activeMultiplier);
      const _today = _localDateStr();
      if (
        comebackBonus &&
        amt > 0 &&
        _awardComebackUsed !== _today &&
        !localStorage.getItem('nh_comeback_used_' + _today)
      ) {
        _awardComebackUsed = _today;
        localStorage.setItem('nh_comeback_used_' + _today, '1');
        totalAmt = totalAmt + 50; // Bonus is flat, not subject to campaign multiplier
      }
      setXpA(totalAmt);
      setShowXP(true);
      // Capture side-effect data outside the updater — state updaters must be pure
      let _pendingBadge: unknown = null;
      let _pendingLevelUp: number | null = null;
      setStats((s: Stats) => {
        const oldLevel = lvl(s.xp);
        const n = {
          ...s,
          xp: Math.max(0, (s.xp || 0) + totalAmt),
          streak: (getStreak() || { count: 0 }).count,
        };
        // streak will be updated by updateStreak() below — keep n.streak consistent
        const badges = Array.isArray(s.badges) ? s.badges : [];
        const nb = (BADGES as unknown as Array<{ id: string; r: (s: Stats) => boolean }>).filter(
          (b) => {
            if (badges.includes(b.id)) return false;
            try {
              return b.r(n);
            } catch {
              return false;
            }
          },
        );
        if (nb.length) {
          n.badges = [...badges, ...nb.map((b: { id: string }) => b.id)];
          _pendingBadge = nb[0];
          nb.forEach((b: { id: string }) => trackBadgeEarned(b.id));
        }
        const newLevel = lvl(n.xp);
        if (newLevel > oldLevel) {
          _pendingLevelUp = newLevel;
          trackLevelUp({ newLevel, totalXP: n.xp });
        }
        return n;
      });
      // ── Server-side XP validation ─────────────────────────────────────────
      // Local state always uses totalAmt for immediate visual feedback.
      // Firestore write uses _serverAwardedXp (validated by Worker for online users).
      // On failure or offline, falls through to totalAmt (existing behavior).
      let _serverAwardedXp = totalAmt;
      if (writeDelta && totalAmt > 0) {
        const _isOnline = typeof navigator !== 'undefined' && navigator.onLine;
        if (_isOnline && activityType) {
          try {
            const _vRes = await apiFetch('/api/award', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ activityType, claimedXp: totalAmt }),
            });
            if (_vRes.ok) {
              const _vData = (await _vRes.json()) as { awarded?: number };
              if (typeof _vData.awarded === 'number' && _vData.awarded >= 0) {
                _serverAwardedXp = _vData.awarded;
              } else {
                offlineAwardQueue.enqueue({
                  activityType,
                  claimedXp: totalAmt,
                  timestamp: Date.now(),
                });
              }
            } else {
              offlineAwardQueue.enqueue({
                activityType,
                claimedXp: totalAmt,
                timestamp: Date.now(),
              });
            }
          } catch {
            // Network error or timeout — fall through to totalAmt
            offlineAwardQueue.enqueue({
              activityType,
              claimedXp: totalAmt,
              timestamp: Date.now(),
            });
          }
        } else if (activityType) {
          // Offline path: enqueue for audit on reconnect
          offlineAwardQueue.enqueue({
            activityType,
            claimedXp: totalAmt,
            timestamp: Date.now(),
          });
        }

        // Atomic Firebase increment — fires immediately, conflict-free across devices.
        const _deltaPayload: Record<string, unknown> = { xp: _serverAwardedXp };
        if (_pendingBadge) {
          const _pendingBadgeObj = _pendingBadge as { id: string };
          _deltaPayload.badges = [_pendingBadgeObj.id];
        }
        writeDelta(_deltaPayload);
      }

      // Schedule UI side effects AFTER the state update, outside the updater
      if (_pendingBadge) {
        const badge = _pendingBadge as { id: string; n: string; d: string };
        setTimeout(() => {
          setNB(badge);
          setSB(true);
          setTimeout(() => setSB(false), 3000);
        }, 600);
        // Knight mascot: badge-specific speech if available, fallback to generic badge event
        setTimeout(() => {
          const speech = BADGE_SPEECHES[badge.id];
          if (speech) {
            knightSpeak(speech.mood, speech.text);
          } else {
            window.dispatchEvent(new CustomEvent('knight:badge'));
          }
        }, 1200);
      }
      if (_pendingLevelUp != null) {
        const newLvl = _pendingLevelUp as number;
        setTimeout(() => {
          setLevelUpData({ level: newLvl });
        }, 900);
        // Knight celebrates with level-specific speech
        const lvlSpeech = LEVEL_SPEECHES[newLvl];
        if (lvlSpeech) {
          setTimeout(() => knightSpeak(lvlSpeech.mood, lvlSpeech.text), 1500);
        } else {
          setTimeout(() => knightSpeak('levelup', `Čestitam! Level ${newLvl} unlocked! 🎉`), 1500);
        }
      }
      setTimeout(() => setShowXP(false), 1500);
      if (celebrate && totalAmt > 0) {
        setCelebXP(totalAmt);
        setTimeout(() => setShowCelebration(true), 400);
      }

      // Notify the knight mascot on significant XP awards so it expands from mini-mode
      if (totalAmt >= 20 && _pendingBadge == null && _pendingLevelUp == null) {
        window.dispatchEvent(
          new CustomEvent('knight:celebrate', {
            detail: { mood: 'celebrating', text: `Sjajno! +${totalAmt} XP! 🎉` },
          }),
        );
      }

      const _serverToday = await _getServerDateStr();
      const sr = updateStreak(_serverToday);

      // Evaluate streak badges SYNCHRONOUSLY before calling setStats.
      // If we set _pendingStreakBadge inside the setStats updater, it remains null
      // when read immediately after (React updaters run asynchronously on next render).
      // Using the current `stats` closure + sr.count gives us the correct preview state.
      const STREAK_BADGE_IDS = ['str3', 'str7', 'str14', 'str21', 'str30', 'str60', 'str100'];
      const _streakPreview = { ...stats, streak: sr.count };
      const _currentBadges = Array.isArray(stats.badges) ? stats.badges : [];
      const _earnedStreakBadges = (
        BADGES as unknown as Array<{ id: string; r: (s: Stats) => boolean }>
      ).filter((b) => {
        if (!STREAK_BADGE_IDS.includes(b.id) || _currentBadges.includes(b.id)) return false;
        try {
          return b.r(_streakPreview);
        } catch {
          return false;
        }
      });
      const _pendingStreakBadge: unknown = _earnedStreakBadges.length
        ? _earnedStreakBadges[0]
        : null;

      // Second setStats: update streak count AND apply streak badge to state
      setStats((s: Stats) => {
        const n = { ...s, streak: sr.count };
        const badges = Array.isArray(n.badges) ? n.badges : [];
        const newStreakBadges = (
          BADGES as unknown as Array<{ id: string; r: (s: Stats) => boolean }>
        ).filter((b) => {
          if (!STREAK_BADGE_IDS.includes(b.id) || badges.includes(b.id)) return false;
          try {
            return b.r(n);
          } catch {
            return false;
          }
        });
        if (newStreakBadges.length) {
          n.badges = [...badges, ...newStreakBadges.map((b: { id: string }) => b.id)];
          newStreakBadges.forEach((b: { id: string }) => trackBadgeEarned(b.id));
        }
        return n;
      });
      // Fire badge toast + knight speech for any newly earned streak badge
      if (_pendingStreakBadge) {
        const strBadge = _pendingStreakBadge as { id: string; n: string; d: string };
        setTimeout(() => {
          setNB(strBadge);
          setSB(true);
          setTimeout(() => setSB(false), 3000);
        }, 600);
        setTimeout(() => {
          const speech = BADGE_SPEECHES[strBadge.id];
          if (speech) knightSpeak(speech.mood, speech.text);
          else window.dispatchEvent(new CustomEvent('knight:badge'));
        }, 1200);
        if (writeDelta) writeDelta({ badges: [strBadge.id] });
      }
      const restoredCount = applyStreakEarnBack();
      if (restoredCount > 0) {
        setTimeout(() => {
          setStreakRestoredCount(restoredCount);
          setTimeout(() => setStreakRestoredCount(0), 5000);
        }, 1000);
      } else {
        const eb = getStreakEarnBack();
        if (eb && eb.lc === 1) {
          setEarnBackPrompt({ prev: eb.prev });
          setTimeout(() => setEarnBackPrompt(null), 8000);
        }
      }
      if (sr.milestone) {
        setTimeout(() => setStreakMilestone(sr.milestone), 800);
        trackStreakMilestone(sr.milestone);
        recordJourneyMilestone('streak_' + sr.milestone, {
          count: sr.milestone,
          allowRepeat: false,
        });
        // Knight milestone speeches keyed by day count
        const streakSpeeches: Record<number, { mood: string; text: string }> = {
          7: { mood: 'celebrating', text: 'Sedam dana! A full week — the habit is real! 📅' },
          14: {
            mood: 'celebrating',
            text: 'Dva tjedna! Your brain is rewiring for Croatian. Keep it up! 💪',
          },
          21: {
            mood: 'celebrating',
            text: "21 days — Three weeks! Science says it's a habit now. Bravo! 🔥",
          },
          30: {
            mood: 'celebrating',
            text: "Trideset dana! 30 days of showing up. You're unstoppable! ⚡",
          },
          50: {
            mood: 'celebrating',
            text: 'Pedeset dana! 50 days of Croatian mastery in progress. 🏆',
          },
          100: {
            mood: 'celebrating',
            text: 'STO DANA! 100 days! You have changed your life. Legenda! 👑',
          },
          365: { mood: 'celebrating', text: 'Godišnjica! One full year! You ARE Croatian now. 🇭🇷' },
        };
        const ms = streakSpeeches[sr.milestone as number];
        if (ms) setTimeout(() => knightSpeak(ms.mood, ms.text), 1800);
      }
      if (sr.count >= 30 && !localStorage.getItem('nh_ceremony_streak_30')) {
        localStorage.setItem('nh_ceremony_streak_30', '1');
        setCeremonyType('streak_30');
      }
      if (sr.count >= 50 && !localStorage.getItem('nh_ceremony_streak_50')) {
        localStorage.setItem('nh_ceremony_streak_50', '1');
        setCeremonyType('streak_50');
      }
      if (sr.count >= 100 && !localStorage.getItem('nh_ceremony_streak_100')) {
        localStorage.setItem('nh_ceremony_streak_100', '1');
        setCeremonyType('streak_100');
      }
      if (sr.count > 0 && sr.count % 7 === 0) earnFreeze();
      if (sr.freezeUsed) {
        setFreezeUsedToast(true);
        setTimeout(() => setFreezeUsedToast(false), 4500);
      }
      // Check stage gate using current stats value directly (side effects must not be in setStats updaters)
      const _stageGates = [5, 11, 22, 34, 45];
      for (let _si = 0; _si < _stageGates.length; _si++) {
        const _sk = 'nh_stage' + (_si + 1) + '_ceremony';
        if (stats.lc >= _stageGates[_si]! && !localStorage.getItem(_sk)) {
          localStorage.setItem(_sk, '1');
          setTimeout(() => setCeremonyType('stage_' + (_si + 1)), 100);
          break;
        }
      }
      const _wk = _weekKey();
      const _wkKey = 'nh_week_xp_' + _wk;
      localStorage.setItem(
        _wkKey,
        String(Math.max(0, parseInt(localStorage.getItem(_wkKey) || '0', 10) + totalAmt)),
      );
      // Daily XP goal tracking — same pattern as weekly; key resets each calendar day
      if (totalAmt > 0) {
        const _dkKey = 'nh_daily_xp_' + _localDateStr();
        localStorage.setItem(
          _dkKey,
          String(parseInt(localStorage.getItem(_dkKey) || '0', 10) + totalAmt),
        );
      }
      if (!localStorage.getItem('nh_journey_first_lesson') && totalAmt > 0) {
        localStorage.setItem('nh_journey_first_lesson', '1');
        recordJourneyMilestone('first_lesson', {});
      }
      if (celebrate && curEx && curEx.startsWith('vocab_')) {
        try {
          localStorage.removeItem('nh_lesson_resume');
        } catch (_) {}
      }
      if (curEx) {
        const _lsStartTs = parseInt(sessionStorage.getItem('nh_ex_start') || '0');
        const _lsDur = _lsStartTs ? Date.now() - _lsStartTs : 0;
        const _lsTypeMap: Record<string, string> = {
          flash: 'flashcards',
          flashcards: 'flashcards',
          mcgame: 'quiz',
          review: 'srs_review',
          listening: 'listening',
          ai_listening: 'listening',
          speaking: 'speaking',
          speaking_sprint: 'speaking',
          aiconvo: 'conversation',
          writing: 'writing',
          shadowing: 'shadowing',
          cloze: 'cloze',
          grammar: 'grammar',
          match: 'matching',
          readlist: 'reading',
        };
        const _lsAType = _lsTypeMap[curEx] || (curEx.startsWith('vocab_') ? 'flashcards' : null);
        if (_lsAType) {
          trackComplete(_lsAType, _lsDur);
          sessionStorage.removeItem('nh_ex_start');
          // Write per-type daily session counts — read by DailyPlanCard to give the AI planner context
          const _scTypeMap: Record<string, string> = {
            flashcards: 'flashcards',
            listening: 'listening',
            speaking: 'speaking',
            writing: 'writing',
          };
          const _scType = _scTypeMap[_lsAType];
          if (_scType) {
            const _scKey = 'nh_session_' + _scType + '_' + _localDateStr();
            try {
              localStorage.setItem(
                _scKey,
                String(parseInt(localStorage.getItem(_scKey) || '0', 10) + 1),
              );
            } catch {}
          }
          try {
            localStorage.setItem('nh_last_active', String(Date.now()));
          } catch {}
          // Accumulate daily study time (minutes) for analytics chart
          if (_lsDur > 0) {
            const _dtKey = 'nh_daily_time_' + _localDateStr();
            const _addMins = Math.max(1, Math.round(_lsDur / 60000));
            localStorage.setItem(
              _dtKey,
              String(parseInt(localStorage.getItem(_dtKey) || '0', 10) + _addMins),
            );
          }
          if (celebrate) {
            trackLessonComplete({
              xpEarned: totalAmt,
              streak: getStreak().count,
              lessonType: _lsAType,
              lessonId: curEx,
            });
          } else {
            trackExerciseComplete({ exerciseType: _lsAType, xpEarned: totalAmt });
          }
        }
      }
    },
    [curEx, comebackBonus, setStats, stats, writeDelta, activeMultiplier],
  );

  return {
    award,
    // Ceremony + toast state
    comebackBonus,
    setComebackBonus,
    showCelebration,
    setShowCelebration,
    celebXP,
    setCelebXP,
    streakMilestone,
    setStreakMilestone,
    ceremonyType,
    setCeremonyType,
    levelUpData,
    setLevelUpData,
    freezeUsedToast,
    setFreezeUsedToast,
    earnBackPrompt,
    setEarnBackPrompt,
    streakRestoredCount,
    setStreakRestoredCount,
    ttsFailedToast,
    setTtsFailedToast,
    showXP,
    xpA,
    nB,
    sB,
  };
}
