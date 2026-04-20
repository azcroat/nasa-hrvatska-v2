/**
 * progressSnapshot — pure function that builds the canonical progress document.
 *
 * Previously copy-pasted 3 times across App.jsx (doSyncNow, saveSnapshot, auto-save
 * useEffect). This module is the single source of truth for what gets persisted.
 */
import { getSR } from './srs.js';
import { getStreak, getStreakFreezes } from './appUtils.js';
import { gP } from './firebase.js';
import { localDateStr as _todayStr, weekKey as _weekKey } from './dateUtils.js';
import type { Stats } from '../types/index.js';

interface ProgressSnapshotParams {
  uid: string;
  name: string;
  stats: Stats;
  dchlA: boolean[];
  dchlSl: string[];
  favs: unknown[];
  jWords: unknown[];
}

/** Merge React dc state with localStorage dcDay3 — truth is the union of answered positions. */
function _bestDc(dchlA: boolean[], dchlSl: string[]) {
  const today = _todayStr();
  let localAns: boolean[] = [false, false, false];
  let localSel: string[] = ['', '', ''];
  try {
    const p = JSON.parse(localStorage.getItem('dcDay3') || '{}');
    if (p.day === today) {
      if (Array.isArray(p.answered)) localAns = p.answered;
      if (Array.isArray(p.selected) && typeof p.selected[0] === 'string') localSel = p.selected;
    }
  } catch (_) {}
  const bestAns = (dchlA && dchlA.length > 0 ? dchlA : [false, false, false]).map(
    (a, i) => a || localAns[i] || false,
  );
  const bestSel = dchlSl && dchlSl.some((s) => s) ? dchlSl : localSel;
  return { day: today, answered: bestAns, selected: bestSel };
}

export function buildProgressSnapshot({
  uid,
  name,
  stats,
  dchlA,
  dchlSl,
  favs,
  jWords,
}: ProgressSnapshotParams) {
  const dc = _bestDc(dchlA, dchlSl);
  const weekXP = parseInt(localStorage.getItem('nh_week_xp_' + _weekKey()) || '0', 10);
  const fbUpdated = (() => {
    try {
      const p = gP(uid) as Record<string, unknown> | null;
      return (p && (p._fbUpdated as number)) || 0;
    } catch {
      return 0;
    }
  })();
  const cooldown = (() => {
    try {
      return JSON.parse(localStorage.getItem('xpCooldown') || '{}');
    } catch {
      return {};
    }
  })();
  // Ensure stats.str is the maximum of React state and uStreak localStorage.
  // React state may lag by one render cycle after mergeStatsFromRemote runs.
  // Without this, a push immediately after a snapshot merge can write a stale
  // lower str value to the progress blob, causing streak divergence across devices.
  const _lsStreak = getStreak();
  const _bestStr = Math.max(stats.str || 0, _lsStreak.count || 0);
  const _stats = _bestStr !== (stats.str || 0) ? { ...stats, str: _bestStr } : stats;

  return {
    name,
    stats: _stats,
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
    weekXPKey: _weekKey(), // 'YYYY-WNN' — used by applyRemoteProgress to reject stale cross-week values
    // User settings — must sync so all devices share the same preferences
    nh_level: localStorage.getItem('nh_level') || '',
    nh_goal: localStorage.getItem('nh_goal') || '',
    nh_culture: localStorage.getItem('nh_culture') || '',
    nh_placement_done:
      localStorage.getItem('nh_placement_done') === 'true' ||
      localStorage.getItem('placement_done') === 'true',
    nh_grammar_track_done: localStorage.getItem('nh_grammar_track_done') === 'true',
    nh_daily_goal_xp: parseInt(localStorage.getItem('nh_daily_goal_xp') || '0', 10) || 0,
    // UI / accessibility preferences — null means "never explicitly set; use system default"
    // Storing the raw string (null | 'true' | 'false') preserves the three-state semantic.
    darkMode: localStorage.getItem('darkMode'),
    nh_dm_explicit: localStorage.getItem('nh_dm_explicit') === '1',
    nh_sound_enabled: localStorage.getItem('nh_sound_enabled'),
    nh_haptic_enabled: localStorage.getItem('nh_haptic_enabled'),
    nh_voice_pref: localStorage.getItem('nh_voice_pref'),
    nh_font_size: localStorage.getItem('nh_font_size'),
    nh_reduce_motion: localStorage.getItem('nh_reduce_motion') === 'true',
    nh_autotts: localStorage.getItem('nh_autotts') === 'true',
    // Journey milestones — additive union on merge; never truncated below 200 entries
    nh_journey: (() => {
      try {
        return JSON.parse(localStorage.getItem('nh_journey') || '[]');
      } catch {
        return [];
      }
    })(),
    // Weekend warrior tracking — object { sat?: 'YYYY-MM-DD', sun?: 'YYYY-MM-DD' }
    nh_weekend_days: (() => {
      try {
        return JSON.parse(localStorage.getItem('nh_weekend_days') || '{}');
      } catch {
        return {};
      }
    })(),
    // Seasonal / campaign quest completion flags — additive: true is never overwritten by false.
    nh_uskrs_kviz_done: localStorage.getItem('nh_uskrs_kviz_done') === '1',
    nh_cq_easter_uskrs_q1: localStorage.getItem('nh_cq_easter_uskrs_q1') === '1',
    nh_cq_easter_uskrs_q2: localStorage.getItem('nh_cq_easter_uskrs_q2') === '1',
    nh_cq_easter_uskrs_q3: localStorage.getItem('nh_cq_easter_uskrs_q3') === '1',
    // Game state — sync so all devices share the same live/prestige/checkpoint status
    nh_hearts: (() => {
      try {
        return JSON.parse(localStorage.getItem('nh_hearts') || 'null');
      } catch {
        return null;
      }
    })(),
    nh_prestige: parseInt(localStorage.getItem('nh_prestige') || '0', 10),
    nh_checkpoints: (() => {
      try {
        return JSON.parse(localStorage.getItem('nh_checkpoints') || '{}');
      } catch {
        return {};
      }
    })(),
    nh_custom_words: (() => {
      try {
        return JSON.parse(localStorage.getItem('nh_custom_words') || '[]');
      } catch {
        return [];
      }
    })(),
    nh_hearts_always_on: localStorage.getItem('nh_hearts_always_on') === 'true',
    nh_saved_phrases: (() => {
      try {
        return JSON.parse(localStorage.getItem('nh_saved_phrases') || '[]');
      } catch {
        return [];
      }
    })(),
    nh_media_done: (() => {
      try {
        return JSON.parse(localStorage.getItem('nh_media_done') || '{}');
      } catch {
        return {};
      }
    })(),
    nh_used_free_repair: localStorage.getItem('nh_used_free_repair') === '1',
  };
}
