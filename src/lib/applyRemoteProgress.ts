/**
 * applyRemoteProgress — merges a Firestore progress snapshot into local state.
 *
 * Called by useSyncManager's real-time watcher and by useAuth's onSignedIn callback.
 * Extracted from App.jsx so it can be unit-tested independently and reused by
 * any future sync path without prop-drilling React state setters through the tree.
 *
 * Merge strategies per field type:
 *   - SRS cards: keep the card with more repetitions (r), or more successes (s) when r ties
 *   - Streak: only restore when Firebase streak is active (last === today or yesterday)
 *   - Favs / journal: dedup union (local + remote, keyed on hr / word)
 *   - Numeric game state (prestige, freeze): Math.max
 *   - Hearts: remote wins only when its lastRegen is newer than local
 *   - Checkpoints / custom_words / media_done: union (local wins on conflict)
 *   - Settings (level, goal, darkMode, voice, etc.): remote value written if non-null/undefined
 *   - Quest completion flags: additive — once true anywhere, true everywhere
 */

import { getSR, saveSR } from './srs.js';

export interface RemoteProgressSetters {
  setFavs: (favs: unknown[]) => void;
  setJWords: (words: unknown[]) => void;
  sDchlA: (a: boolean[]) => void;
  sDchlSl: (sl: string[]) => void;
  setOnboarded: (v: boolean) => void;
  setName: (name: string) => void;
}

function todayStr(): string {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function isoWeekKey(): string {
  const d = new Date();
  const dayOfWeek = d.getDay() || 7;
  d.setDate(d.getDate() + 4 - dayOfWeek);
  const year = d.getFullYear();
  const weekNum = Math.ceil(((d.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + 1) / 7);
  return year + '-W' + String(weekNum).padStart(2, '0');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyRemoteProgress(fp: any, setters: RemoteProgressSetters): void {
  if (!fp) return;

  const { setFavs, setJWords, sDchlA, sDchlSl, setOnboarded, setName } = setters;
  const today = todayStr();
  const yesterday = yesterdayStr();

  // ── Onboarding / name ─────────────────────────────────────────────────────
  const apSt = fp.stats || fp.st || {};
  if (fp.onboarded || fp.cp || apSt.xp > 0) {
    localStorage.setItem('onboarded', 'true');
    setOnboarded(true);
  }
  if (fp.name) setName(fp.name);

  // ── SRS cards — keep the card with higher repetition count ───────────────
  if (fp.sr) {
    const lSR = getSR() || {};
    const mSR = { ...lSR };
    for (const w in fp.sr) {
      const r = fp.sr[w];
      const l = mSR[w];
      if (!l || (r.r || 0) > (l.r || 0) || (!l.r && (r.s || 0) > (l.s || 0))) {
        mSR[w] = r;
      }
    }
    saveSR(mSR);
  }

  // ── Streak — only restore when Firebase streak is still active ────────────
  if (fp.streak) {
    let lSt = { count: 0, last: '' };
    try { lSt = JSON.parse(localStorage.getItem('uStreak') || '{"count":0,"last":""}'); } catch (_) {}
    const fpLast = fp.streak.last || '';
    const fpStreakActive = fpLast === today || fpLast === yesterday;
    if (fpStreakActive && (fp.streak.count || 0) > (lSt.count || 0)) {
      localStorage.setItem('uStreak', JSON.stringify(fp.streak));
    }
    // Expired Firebase streaks are never restored — prevents months-old streak appearing active
  }

  // ── Streak freeze tokens — Math.max ───────────────────────────────────────
  if (fp.freezes !== undefined) {
    const lF = parseInt(localStorage.getItem('uFreeze') || '0', 10);
    localStorage.setItem('uFreeze', String(Math.max(lF, Math.max(0, parseInt(fp.freezes, 10) || 0))));
  }

  // ── Favourites — dedup union keyed on hr ──────────────────────────────────
  if (fp.favs) {
    let lFv: unknown[] = [];
    try { lFv = JSON.parse(localStorage.getItem('uFavs') || '[]'); } catch (_) {}
    const favMap = new Map<string, unknown>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [...lFv, ...fp.favs].forEach((f: any) => { if (f && f.hr) favMap.set(f.hr, f); });
    const mFv = [...favMap.values()];
    try { localStorage.setItem('uFavs', JSON.stringify(mFv)); } catch (e: unknown) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        console.warn('[sync] localStorage quota exceeded — some progress may not persist locally');
      }
    }
    setFavs(mFv);
  }

  // ── Journal — dedup union keyed on word ───────────────────────────────────
  if (fp.journal) {
    let lJ: unknown[] = [];
    try { lJ = JSON.parse(localStorage.getItem('uJournal') || '[]'); } catch (_) {}
    const jM = new Map<string, unknown>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lJ.forEach((e: any) => { if (e?.word) jM.set(e.word, e); });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fp.journal.forEach((e: any) => { if (e?.word) jM.set(e.word, e); });
    const mJ = Array.from(jM.values());
    try { localStorage.setItem('uJournal', JSON.stringify(mJ)); } catch (e: unknown) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        console.warn('[sync] localStorage quota exceeded — some progress may not persist locally');
      }
    }
    setJWords(mJ);
  }

  // ── Daily challenge — restore today's answers ─────────────────────────────
  if (fp.dc?.day === today) {
    const ans = fp.dc.answered || [false, false, false];
    const sel = Array.isArray(fp.dc.selected) && typeof fp.dc.selected[0] === 'string'
      ? fp.dc.selected : ['', '', ''];
    let lA: boolean[] = [false, false, false];
    try {
      const ld = JSON.parse(localStorage.getItem('dcDay3') || '{}');
      if (ld.day === today) lA = ld.answered || lA;
    } catch (_) {}
    const mA = ans.map((a: boolean, i: number) => a || lA[i] || false);
    sDchlA(mA);
    sDchlSl(sel);
    localStorage.setItem('dcDay3', JSON.stringify({ day: today, answered: mA, selected: sel }));
  }

  // ── XP cooldown — only restore today's cooldown entries ──────────────────
  if (fp.cooldown) {
    let cd: Record<string, string> = {};
    try { cd = JSON.parse(localStorage.getItem('xpCooldown') || '{}'); } catch (_) {}
    for (const k in fp.cooldown) { if (fp.cooldown[k] === today) cd[k] = fp.cooldown[k]; }
    localStorage.setItem('xpCooldown', JSON.stringify(cd));
  }

  // ── Weekly XP — Math.max with stored value ────────────────────────────────
  if (fp.weekXP !== undefined) {
    const wk = isoWeekKey();
    const lX = parseInt(localStorage.getItem('nh_week_xp_' + wk) || '0', 10);
    localStorage.setItem('nh_week_xp_' + wk, String(Math.max(lX, fp.weekXP)));
  }

  // ── User settings — restore from Firebase so all devices share preferences ─
  if (fp.nh_level) {
    // MAX comparison: never let a stale lower level from one device overwrite a
    // higher level earned on another device (e.g. Android A1 must not clobber Chrome B2).
    const CEFR_NUM: Record<string, number> = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 };
    const localLevel = localStorage.getItem('nh_level') || '';
    const remoteOrd = CEFR_NUM[fp.nh_level as string] || 0;
    const localOrd  = CEFR_NUM[localLevel] || 0;
    if (remoteOrd >= localOrd) localStorage.setItem('nh_level', fp.nh_level);
  }
  if (fp.nh_goal) { localStorage.setItem('nh_goal', fp.nh_goal); localStorage.setItem('nh_goal_set', '1'); }
  if (fp.nh_culture) localStorage.setItem('nh_culture', fp.nh_culture);
  if (fp.nh_daily_goal_xp > 0) {
    const lDgx = parseInt(localStorage.getItem('nh_daily_goal_xp') || '0', 10);
    // Remote wins when it has a value and local has none; otherwise keep local (most recent edit)
    if (!lDgx) localStorage.setItem('nh_daily_goal_xp', String(fp.nh_daily_goal_xp));
  }
  if (fp.nh_placement_done) { localStorage.setItem('nh_placement_done', 'true'); localStorage.setItem('placement_done', 'true'); }
  if (fp.nh_grammar_track_done) localStorage.setItem('nh_grammar_track_done', 'true');

  // ── UI/accessibility preferences ──────────────────────────────────────────
  // Three-state values (null | 'true' | 'false'): only write when remote is non-null
  if (fp.darkMode !== null && fp.darkMode !== undefined) localStorage.setItem('darkMode', fp.darkMode);
  if (fp.nh_dm_explicit) localStorage.setItem('nh_dm_explicit', '1');
  if (fp.nh_sound_enabled !== null && fp.nh_sound_enabled !== undefined) localStorage.setItem('nh_sound_enabled', fp.nh_sound_enabled);
  if (fp.nh_haptic_enabled !== null && fp.nh_haptic_enabled !== undefined) localStorage.setItem('nh_haptic_enabled', fp.nh_haptic_enabled);
  if (fp.nh_voice_pref) localStorage.setItem('nh_voice_pref', fp.nh_voice_pref);
  if (fp.nh_font_size && fp.nh_font_size !== 'medium') localStorage.setItem('nh_font_size', fp.nh_font_size);
  if (fp.nh_reduce_motion === true) localStorage.setItem('nh_reduce_motion', 'true');
  if (fp.nh_autotts === true) localStorage.setItem('nh_autotts', 'true');

  // ── Journey milestones — additive union: never discard history ────────────
  if (Array.isArray(fp.nh_journey) && fp.nh_journey.length > 0) {
    let lJ: Array<{ type: string; date: string }> = [];
    try { lJ = JSON.parse(localStorage.getItem('nh_journey') || '[]'); } catch (_) {}
    const seen = new Set(lJ.map((m) => m.type + '|' + m.date));
    const incoming = fp.nh_journey.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (m: any) => m && m.type && m.date && !seen.has(m.type + '|' + m.date)
    );
    if (incoming.length) {
      try { localStorage.setItem('nh_journey', JSON.stringify([...lJ, ...incoming].slice(-200))); } catch (_) {}
    }
  }

  // ── Weekend activity — merge sat/sun independently ────────────────────────
  if (fp.nh_weekend_days && typeof fp.nh_weekend_days === 'object') {
    let lWD: Record<string, boolean> = {};
    try { lWD = JSON.parse(localStorage.getItem('nh_weekend_days') || '{}'); } catch (_) {}
    const merged = { ...fp.nh_weekend_days, ...lWD }; // local wins for shared keys
    if (merged.sat || merged.sun) {
      try { localStorage.setItem('nh_weekend_days', JSON.stringify(merged)); } catch (_) {}
    }
  }

  // ── Seasonal/campaign quest completion — additive ─────────────────────────
  if (fp.nh_uskrs_kviz_done === true) try { localStorage.setItem('nh_uskrs_kviz_done', '1'); } catch (_) {}
  if (fp.nh_cq_easter_uskrs_q1 === true) try { localStorage.setItem('nh_cq_easter_uskrs_q1', '1'); } catch (_) {}
  if (fp.nh_cq_easter_uskrs_q2 === true) try { localStorage.setItem('nh_cq_easter_uskrs_q2', '1'); } catch (_) {}
  if (fp.nh_cq_easter_uskrs_q3 === true) try { localStorage.setItem('nh_cq_easter_uskrs_q3', '1'); } catch (_) {}
  if (fp.nh_cq_easter_uskrs_q1 === true || fp.nh_cq_easter_uskrs_q2 === true || fp.nh_cq_easter_uskrs_q3 === true) {
    try { window.dispatchEvent(new CustomEvent('nh-campaign-quest-done')); } catch (_) {}
  }

  // ── Hearts — remote wins only when its lastRegen is newer ────────────────
  if (fp.nh_hearts !== null && fp.nh_hearts !== undefined) {
    try {
      const lH = JSON.parse(localStorage.getItem('nh_hearts') || 'null');
      if (!lH || (fp.nh_hearts.lastRegen || 0) > (lH.lastRegen || 0)) {
        localStorage.setItem('nh_hearts', JSON.stringify(fp.nh_hearts));
      }
    } catch (_) {}
  }

  // ── Prestige — Math.max ───────────────────────────────────────────────────
  if (fp.nh_prestige) {
    const lPr = parseInt(localStorage.getItem('nh_prestige') || '0', 10);
    try { localStorage.setItem('nh_prestige', String(Math.max(lPr, fp.nh_prestige))); } catch (_) {}
  }

  // ── Checkpoints — union (local wins on conflict) ──────────────────────────
  if (fp.nh_checkpoints && typeof fp.nh_checkpoints === 'object') {
    let lCk: Record<string, unknown> = {};
    try { lCk = JSON.parse(localStorage.getItem('nh_checkpoints') || '{}'); } catch (_) {}
    try { localStorage.setItem('nh_checkpoints', JSON.stringify({ ...fp.nh_checkpoints, ...lCk })); } catch (_) {}
  }

  // ── Custom words — dedup union keyed on word.word ─────────────────────────
  if (Array.isArray(fp.nh_custom_words) && fp.nh_custom_words.length > 0) {
    let lCW: unknown[] = [];
    try { lCW = JSON.parse(localStorage.getItem('nh_custom_words') || '[]'); } catch (_) {}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cwMap = new Map([...fp.nh_custom_words, ...lCW].map((w: any) => [w?.word || JSON.stringify(w), w]));
    try { localStorage.setItem('nh_custom_words', JSON.stringify([...cwMap.values()])); } catch (_) {}
  }

  // ── Miscellaneous additive flags ──────────────────────────────────────────
  if (fp.nh_hearts_always_on === true) try { localStorage.setItem('nh_hearts_always_on', 'true'); } catch (_) {}
  if (fp.nh_used_free_repair === true) try { localStorage.setItem('nh_used_free_repair', '1'); } catch (_) {}

  // ── Saved phrases — union ─────────────────────────────────────────────────
  if (Array.isArray(fp.nh_saved_phrases) && fp.nh_saved_phrases.length > 0) {
    let lSP: string[] = [];
    try { lSP = JSON.parse(localStorage.getItem('nh_saved_phrases') || '[]'); } catch (_) {}
    try { localStorage.setItem('nh_saved_phrases', JSON.stringify([...new Set([...lSP, ...fp.nh_saved_phrases])])); } catch (_) {}
  }

  // ── Media done — union (local wins on conflict) ───────────────────────────
  if (fp.nh_media_done && typeof fp.nh_media_done === 'object') {
    let lMD: Record<string, unknown> = {};
    try { lMD = JSON.parse(localStorage.getItem('nh_media_done') || '{}'); } catch (_) {}
    try { localStorage.setItem('nh_media_done', JSON.stringify({ ...fp.nh_media_done, ...lMD })); } catch (_) {}
  }
}
