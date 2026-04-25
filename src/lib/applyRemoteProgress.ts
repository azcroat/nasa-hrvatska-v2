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
import { weekKey as _weekKey } from './dateUtils.js';

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
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyRemoteProgress(fp: any, setters: RemoteProgressSetters): void {
  if (!fp) return;

  const { setFavs, setJWords, sDchlA, sDchlSl, setOnboarded, setName } = setters;
  const today = todayStr();

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

  // ── Streak — Math.max merge: always take the higher count; most-recent last ─
  // Rationale: mergeStatsFromRemote already does Math.max for stats.str (used by
  // achievements and Firestore), but uStreak localStorage (used by getStreak() and
  // buildProgressSnapshot) was only updated when the remote streak was "active" (last
  // === today/yesterday). That gate caused divergence when two devices had different
  // activity dates — one device's higher streak count was silently ignored on the other.
  // Fix: always take Math.max of counts and the most-recent last date, matching the
  // Math.max policy used for all other numeric stats.
  if (fp.streak || (fp.stats as Record<string, unknown>)?.str) {
    let lSt: { count: number; last: string } = { count: 0, last: '' };
    try {
      lSt = JSON.parse(localStorage.getItem('uStreak') || '{"count":0,"last":""}');
    } catch (_) {}
    const remoteStreak = fp.streak as { count?: number; last?: string } | undefined;
    // Also consult stats.str (set by mergeStatsFromRemote in _processSnapshot) as a
    // source of truth — this ensures the streak count from the Firestore top-level
    // stats field is also respected.
    const fpCount = Math.max(
      remoteStreak?.count || 0,
      ((fp.stats as Record<string, unknown>)?.str as number) || 0,
    );
    const fpLast = remoteStreak?.last || '';
    const newCount = Math.max(lSt.count || 0, fpCount);
    // Take the most-recent "last" date so we never backdate activity
    const newLast = fpLast > (lSt.last || '') ? fpLast : lSt.last || '';
    if (newCount !== lSt.count || newLast !== lSt.last) {
      localStorage.setItem('uStreak', JSON.stringify({ ...lSt, count: newCount, last: newLast }));
    }
  }

  // ── Streak freeze tokens — Math.max ───────────────────────────────────────
  if (fp.freezes !== undefined) {
    const lF = parseInt(localStorage.getItem('uFreeze') || '0', 10);
    localStorage.setItem(
      'uFreeze',
      String(Math.max(lF, Math.max(0, parseInt(fp.freezes, 10) || 0))),
    );
  }

  // ── Favourites — dedup union keyed on hr ──────────────────────────────────
  if (fp.favs) {
    let lFv: unknown[] = [];
    try {
      lFv = JSON.parse(localStorage.getItem('uFavs') || '[]');
    } catch (_) {}
    const favMap = new Map<string, unknown>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [...lFv, ...fp.favs].forEach((f: any) => {
      if (f && f.hr) favMap.set(f.hr, f);
    });
    const mFv = [...favMap.values()];
    try {
      localStorage.setItem('uFavs', JSON.stringify(mFv));
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        console.warn('[sync] localStorage quota exceeded — some progress may not persist locally');
      }
    }
    setFavs(mFv);
  }

  // ── Journal — dedup union keyed on word ───────────────────────────────────
  if (fp.journal) {
    let lJ: unknown[] = [];
    try {
      lJ = JSON.parse(localStorage.getItem('uJournal') || '[]');
    } catch (_) {}
    const jM = new Map<string, unknown>();
    // Remote entries set first; local entries set second so local wins on conflict
    // (preserves user notes/edits made on this device over older remote entries).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fp.journal.forEach((e: any) => {
      if (e?.word) jM.set(e.word, e);
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lJ.forEach((e: any) => {
      if (e?.word) jM.set(e.word, e);
    });
    const mJ = Array.from(jM.values());
    try {
      localStorage.setItem('uJournal', JSON.stringify(mJ));
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        console.warn('[sync] localStorage quota exceeded — some progress may not persist locally');
      }
    }
    setJWords(mJ);
  }

  // ── Daily challenge — restore today's answers ─────────────────────────────
  if (fp.dc?.day === today) {
    const ans = fp.dc.answered || [false, false, false];
    const sel =
      Array.isArray(fp.dc.selected) && typeof fp.dc.selected[0] === 'string'
        ? fp.dc.selected
        : ['', '', ''];
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
    try {
      cd = JSON.parse(localStorage.getItem('xpCooldown') || '{}');
    } catch (_) {}
    for (const k in fp.cooldown) {
      if (fp.cooldown[k] === today) cd[k] = fp.cooldown[k];
    }
    localStorage.setItem('xpCooldown', JSON.stringify(cd));
  }

  // ── Weekly XP — Math.max with stored value ────────────────────────────────
  // Guard: only apply if the snapshot is from the current week.
  // Old snapshots (saved last week) must not contaminate this week's XP counter:
  // fp.weekXPKey (added 2026-04-17) is 'YYYY-WNN'; if absent (legacy snapshot),
  // apply unconditionally (same old behaviour — safe since weekXP rolled over).
  if (fp.weekXP !== undefined) {
    const wk = _weekKey();
    if (!fp.weekXPKey || fp.weekXPKey === wk) {
      const lX = parseInt(localStorage.getItem('nh_week_xp_' + wk) || '0', 10);
      localStorage.setItem('nh_week_xp_' + wk, String(Math.max(lX, fp.weekXP)));
    }
  }

  // ── User settings — restore from Firebase so all devices share preferences ─
  if (fp.nh_level) {
    // MAX comparison: never let a stale lower level from one device overwrite a
    // higher level earned on another device (e.g. Android A1 must not clobber Chrome B2).
    const CEFR_NUM: Record<string, number> = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 };
    const localLevel = localStorage.getItem('nh_level') || '';
    const remoteOrd = CEFR_NUM[fp.nh_level as string] || 0;
    const localOrd = CEFR_NUM[localLevel] || 0;
    if (remoteOrd >= localOrd) localStorage.setItem('nh_level', fp.nh_level);
  }
  if (fp.nh_goal) {
    localStorage.setItem('nh_goal', fp.nh_goal);
    localStorage.setItem('nh_goal_set', '1');
  }
  if (fp.nh_culture) localStorage.setItem('nh_culture', fp.nh_culture);
  if (fp.nh_daily_goal_xp > 0) {
    const lDgx = parseInt(localStorage.getItem('nh_daily_goal_xp') || '0', 10);
    // Math.max: whichever device set the higher daily-goal XP target wins.
    // Prevents a stale lower value from one device silently overwriting a higher goal
    // the user explicitly chose on another device.
    try {
      localStorage.setItem('nh_daily_goal_xp', String(Math.max(lDgx, fp.nh_daily_goal_xp)));
    } catch (_) {}
  }
  if (fp.nh_placement_done) {
    localStorage.setItem('nh_placement_done', 'true');
    localStorage.setItem('placement_done', 'true');
  }
  if (fp.nh_grammar_track_done) localStorage.setItem('nh_grammar_track_done', 'true');

  // ── UI/accessibility preferences ──────────────────────────────────────────
  // Three-state values (null | 'true' | 'false'): only write when remote is non-null
  if (fp.darkMode !== null && fp.darkMode !== undefined)
    localStorage.setItem('darkMode', fp.darkMode);
  if (fp.nh_dm_explicit) localStorage.setItem('nh_dm_explicit', '1');
  if (fp.nh_sound_enabled !== null && fp.nh_sound_enabled !== undefined)
    localStorage.setItem('nh_sound_enabled', fp.nh_sound_enabled);
  if (fp.nh_haptic_enabled !== null && fp.nh_haptic_enabled !== undefined)
    localStorage.setItem('nh_haptic_enabled', fp.nh_haptic_enabled);
  if (fp.nh_voice_pref) localStorage.setItem('nh_voice_pref', fp.nh_voice_pref);
  // nh_font_size: null means "never explicitly set on remote device" — skip write.
  // Any non-null value (including 'medium') is an explicit user choice and should sync.
  if (fp.nh_font_size !== null && fp.nh_font_size !== undefined)
    localStorage.setItem('nh_font_size', fp.nh_font_size);
  if (fp.nh_reduce_motion === true) localStorage.setItem('nh_reduce_motion', 'true');
  if (fp.nh_autotts === true) localStorage.setItem('nh_autotts', 'true');

  // ── Journey milestones — additive union: never discard history ────────────
  if (Array.isArray(fp.nh_journey) && fp.nh_journey.length > 0) {
    let lJ: Array<{ type: string; date: string }> = [];
    try {
      lJ = JSON.parse(localStorage.getItem('nh_journey') || '[]');
    } catch (_) {}
    const seen = new Set(lJ.map((m) => m.type + '|' + m.date));
    const incoming = fp.nh_journey.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (m: any) => m && m.type && m.date && !seen.has(m.type + '|' + m.date),
    );
    if (incoming.length) {
      try {
        localStorage.setItem('nh_journey', JSON.stringify([...lJ, ...incoming].slice(-200)));
      } catch (_) {}
    }
  }

  // ── Weekend activity — merge sat/sun independently ────────────────────────
  if (fp.nh_weekend_days && typeof fp.nh_weekend_days === 'object') {
    let lWD: Record<string, boolean> = {};
    try {
      lWD = JSON.parse(localStorage.getItem('nh_weekend_days') || '{}');
    } catch (_) {}
    const merged = { ...fp.nh_weekend_days, ...lWD }; // local wins for shared keys
    if (merged.sat || merged.sun) {
      try {
        localStorage.setItem('nh_weekend_days', JSON.stringify(merged));
      } catch (_) {}
    }
  }

  // ── Seasonal/campaign quest completion — additive ─────────────────────────
  if (fp.nh_uskrs_kviz_done === true)
    try {
      localStorage.setItem('nh_uskrs_kviz_done', '1');
    } catch (_) {}
  if (fp.nh_cq_easter_uskrs_q1 === true)
    try {
      localStorage.setItem('nh_cq_easter_uskrs_q1', '1');
    } catch (_) {}
  if (fp.nh_cq_easter_uskrs_q2 === true)
    try {
      localStorage.setItem('nh_cq_easter_uskrs_q2', '1');
    } catch (_) {}
  if (fp.nh_cq_easter_uskrs_q3 === true)
    try {
      localStorage.setItem('nh_cq_easter_uskrs_q3', '1');
    } catch (_) {}
  if (
    fp.nh_cq_easter_uskrs_q1 === true ||
    fp.nh_cq_easter_uskrs_q2 === true ||
    fp.nh_cq_easter_uskrs_q3 === true
  ) {
    try {
      window.dispatchEvent(new CustomEvent('nh-campaign-quest-done'));
    } catch (_) {}
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
    try {
      localStorage.setItem('nh_prestige', String(Math.max(lPr, fp.nh_prestige)));
    } catch (_) {}
  }

  // ── Checkpoints — union (local wins on conflict) ──────────────────────────
  if (fp.nh_checkpoints && typeof fp.nh_checkpoints === 'object') {
    let lCk: Record<string, unknown> = {};
    try {
      lCk = JSON.parse(localStorage.getItem('nh_checkpoints') || '{}');
    } catch (_) {}
    try {
      localStorage.setItem('nh_checkpoints', JSON.stringify({ ...fp.nh_checkpoints, ...lCk }));
    } catch (_) {}
  }

  // ── Custom words — dedup union keyed on word.word ─────────────────────────
  if (Array.isArray(fp.nh_custom_words) && fp.nh_custom_words.length > 0) {
    let lCW: unknown[] = [];
    try {
      lCW = JSON.parse(localStorage.getItem('nh_custom_words') || '[]');
    } catch (_) {}
    const cwMap = new Map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [...fp.nh_custom_words, ...lCW].map((w: any) => [w?.word || JSON.stringify(w), w]),
    );
    try {
      localStorage.setItem('nh_custom_words', JSON.stringify([...cwMap.values()]));
    } catch (_) {}
  }

  // ── Miscellaneous additive flags ──────────────────────────────────────────
  if (fp.nh_hearts_always_on === true)
    try {
      localStorage.setItem('nh_hearts_always_on', 'true');
    } catch (_) {}
  if (fp.nh_used_free_repair === true)
    try {
      localStorage.setItem('nh_used_free_repair', '1');
    } catch (_) {}

  // ── Saved phrases — union ─────────────────────────────────────────────────
  if (Array.isArray(fp.nh_saved_phrases) && fp.nh_saved_phrases.length > 0) {
    let lSP: string[] = [];
    try {
      lSP = JSON.parse(localStorage.getItem('nh_saved_phrases') || '[]');
    } catch (_) {}
    try {
      localStorage.setItem(
        'nh_saved_phrases',
        JSON.stringify([...new Set([...lSP, ...fp.nh_saved_phrases])]),
      );
    } catch (_) {}
  }

  // ── Media done — union (local wins on conflict) ───────────────────────────
  if (fp.nh_media_done && typeof fp.nh_media_done === 'object') {
    let lMD: Record<string, unknown> = {};
    try {
      lMD = JSON.parse(localStorage.getItem('nh_media_done') || '{}');
    } catch (_) {}
    try {
      localStorage.setItem('nh_media_done', JSON.stringify({ ...fp.nh_media_done, ...lMD }));
    } catch (_) {}
  }

  // ── Session history — additive union (never remove completed days) ──────────────
  if (fp.nh_session_history && typeof fp.nh_session_history === 'object') {
    let lSH: Record<string, boolean> = {};
    try {
      lSH = JSON.parse(localStorage.getItem('nh_session_history') || '{}');
    } catch (_) {}
    const merged = { ...(fp.nh_session_history as Record<string, boolean>), ...lSH }; // local wins for shared keys
    try {
      localStorage.setItem('nh_session_history', JSON.stringify(merged));
    } catch (_) {}
  }

  // ── Earn-back streak data — remote wins if for a more recent date ────────────
  if (fp.nh_earn_back !== null && fp.nh_earn_back !== undefined) {
    try {
      const lEB = JSON.parse(localStorage.getItem('nh_earn_back') || 'null');
      if (
        !lEB ||
        ((fp.nh_earn_back as Record<string, unknown>).date as string) > (lEB.date as string)
      ) {
        localStorage.setItem('nh_earn_back', JSON.stringify(fp.nh_earn_back));
      }
    } catch (_) {}
  }

  // ── XP boost — Math.max for both timestamps ───────────────────────────────────
  if (fp.nh_xp_boost_expires > 0) {
    const lExp = parseInt(localStorage.getItem('nh_xp_boost_expires') || '0', 10);
    try {
      localStorage.setItem(
        'nh_xp_boost_expires',
        String(Math.max(lExp, fp.nh_xp_boost_expires as number)),
      );
    } catch (_) {}
  }
  if (fp.nh_xp_boost_last_activated > 0) {
    const lAct = parseInt(localStorage.getItem('nh_xp_boost_last_activated') || '0', 10);
    try {
      localStorage.setItem(
        'nh_xp_boost_last_activated',
        String(Math.max(lAct, fp.nh_xp_boost_last_activated as number)),
      );
    } catch (_) {}
  }

  // ── Daily XP — write today's XP value to the correct date-keyed slot ────────
  if ((fp.nh_daily_xp_today as number) > 0 && fp.nh_daily_xp_date === today) {
    const lDX = parseInt(localStorage.getItem('nh_daily_xp_' + today) || '0', 10);
    try {
      localStorage.setItem(
        'nh_daily_xp_' + today,
        String(Math.max(lDX, fp.nh_daily_xp_today as number)),
      );
    } catch (_) {}
  }

  // ── Lesson resume — remote fills a gap when local is absent ─────────────────
  if (fp.nh_lesson_resume !== null && fp.nh_lesson_resume !== undefined) {
    try {
      const raw = localStorage.getItem('nh_lesson_resume');
      if (!raw || raw === 'null') {
        localStorage.setItem('nh_lesson_resume', JSON.stringify(fp.nh_lesson_resume));
      }
    } catch (_) {}
  }

  // ── Last exercise — remote fills a gap in local ──────────────────────────────
  if (fp.nh_last_ex && !localStorage.getItem('nh_last_ex')) {
    try {
      localStorage.setItem('nh_last_ex', fp.nh_last_ex as string);
    } catch (_) {}
  }
  if (fp.nh_last_ex_label && !localStorage.getItem('nh_last_ex_label')) {
    try {
      localStorage.setItem('nh_last_ex_label', fp.nh_last_ex_label as string);
    } catch (_) {}
  }

  // ── Journey milestone flags — additive: once true, always true ───────────────
  if (fp.nh_journey_first_speaking === true)
    try {
      localStorage.setItem('nh_journey_first_speaking', '1');
    } catch (_) {}
  if (fp.nh_journey_first_lesson === true)
    try {
      localStorage.setItem('nh_journey_first_lesson', '1');
    } catch (_) {}

  // ── Ceremony flags — additive union (packed object → individual keys) ────────
  // progressSnapshot packs ceremony keys into `nh_ceremonies: { streak_7: true, stage5: true }`.
  // applyRemoteProgress unpacks them back to individual localStorage keys so the
  // rest of the app (CelebrationModal, ceremony guards) can read them as expected.
  if (fp.nh_ceremonies && typeof fp.nh_ceremonies === 'object') {
    const cerMap = fp.nh_ceremonies as Record<string, boolean>;
    for (const key in cerMap) {
      if (cerMap[key] !== true) continue;
      try {
        if (key.startsWith('streak_')) {
          // e.g. streak_7 → nh_ceremony_streak_7
          localStorage.setItem(`nh_ceremony_${key}`, '1');
        } else if (key.startsWith('stage')) {
          // e.g. stage5 → nh_stage5_ceremony
          localStorage.setItem(`nh_${key}_ceremony`, '1');
        }
      } catch (_) {}
    }
  }
}
