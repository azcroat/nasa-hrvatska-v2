/**
 * src/lib/cefrCertification.ts
 *
 * CEFR hard-gating foundation. Separates two notions of "level":
 *
 *   - ELIGIBLE level: derived from activity (xp + lessons + grammar drills) via
 *     `getUserCefr()` in cefr.ts. Represents how much the learner has practiced.
 *
 *   - CERTIFIED level: the highest CEFR level the learner has passed an
 *     equivalency test for. Represents demonstrated competency, not activity.
 *
 * In the legacy app, eligible == certified == `getUserCefr()` output, which
 * meant grinding XP automatically raised the perceived level without
 * demonstrating any real competency. The app's stated goal is fluency
 * (not engagement badges), so a B1-labeled user must be able to DO B1
 * things, not just have ground enough activity to cross a numeric threshold.
 *
 * This module introduces:
 *   - Storage shape for equivalency test results (pass / fail history).
 *   - getCertifiedLevel() — the source of truth for "what can this user do?"
 *   - Retake-cooldown logic so a failed test cannot be brute-forced.
 *   - A feature flag (CERTIFICATION_REQUIRED) controlling whether content
 *     unlocks use certified or eligible level. Defaults to FALSE so the
 *     existing UX is unchanged until equivalency test items are authored
 *     and validated. Flipping the flag to TRUE activates strict gating
 *     for every user.
 *
 * Per-test storage shape (localStorage key `nh_cefr_certifications`):
 *   {
 *     passes: { [level: CefrLevel]: { passedAt: number, scores: SkillScores } },
 *     attempts: Array<{ level, passed, takenAt, scores }>,
 *     lastFailedAt: { [level: CefrLevel]: number },
 *   }
 *
 * Retake policy: a failed attempt enforces a 7-day cooldown OR until the
 * user completes 5 additional lessons (whichever comes first). This is
 * intentionally not punitive — its purpose is to prevent a user from
 * spamming retakes until they pass by chance, which would defeat the
 * competency-signal value.
 *
 * @see src/lib/cefr.ts — `isUnlocked()` consults this module via the flag.
 * @see src/lib/progressSnapshot.ts — certification state is synced cross-device.
 */

import type { CefrLevel } from './cefr.js';
import { CEFR_ORDER, cefrRank, getEffectiveLevel, levelBelow } from './cefr.js';

// ── Feature flag ──────────────────────────────────────────────────────────────
//
// HARD gating is ACTIVE as of 2026-05-20. Content unlocks use certified
// level, not eligible. This is the product decision behind "people must
// actually know the material before progressing" — activity-based level
// progression is unreliable signal for competency.
//
// Migration on first launch:
//   - Existing users keep access to content they already had: their
//     activity-derived eligible level is grandfathered into certification
//     via migrateGrandfatheredCertification(). They are NOT downgraded.
//   - Future advancement requires passing the equivalency test for the
//     next tier. No second grandfather; honest gating forward.
//   - The grandfather records 80% (the minimum passing score) so it's
//     visible in attempt history as a migration marker, not a real pass.
//
// New users from this point start at certified A1 and must take tests
// to advance.
//
// This flag is exported so tests can override it.
export const CERTIFICATION_REQUIRED = true;

// ── Storage shapes ────────────────────────────────────────────────────────────

export type SkillScore = number; // 0..1 per skill

export interface SkillScores {
  vocab: SkillScore;
  grammar: SkillScore;
  /** Optional — only present if the test had a reading section. */
  reading?: SkillScore;
  /** Optional — only present if the test had a listening section. */
  listening?: SkillScore;
  /** Optional in the type (legacy equivalency tests have none); REQUIRED by
   *  checkpoint composition (a speaking task is always included — see Plan 1
   *  examComposer). */
  speaking?: SkillScore;
}

/** Every skill a test can score. */
export type SkillKey = 'vocab' | 'grammar' | 'reading' | 'listening' | 'speaking';

export interface CertificationPass {
  passedAt: number; // epoch ms
  scores: SkillScores;
  /** Overall percentage (0..100), kept for fast UI rendering. */
  overall: number;
}

export interface CertificationAttempt {
  level: CefrLevel;
  passed: boolean;
  takenAt: number;
  scores: SkillScores;
  overall: number;
}

export interface CheckpointState {
  /** Epoch ms of the last COMPLETED checkpoint that reset the cadence. */
  lastCheckpointAt: number | null;
  /** Active-day count snapshot at that checkpoint (see activeDayTracker). */
  activeDaysAtLastCheckpoint: number;
  /** Grace counter per level: 0 = none, 1 = one fail pending (next fail demotes). */
  consecutiveFails: Partial<Record<CefrLevel, number>>;
  /** Carry-forward focus skills, keyed by the level they apply to. */
  focusSkills: Partial<Record<CefrLevel, SkillKey[]>>;
  /** Demotion history. */
  demotions: Array<{ from: CefrLevel; to: CefrLevel; at: number; reason: 'checkpoint_fail' }>;
  /** "Remind me tonight" — checkpoint suppressed until this epoch ms. */
  snoozedUntil: number | null;
}

export interface CertificationState {
  passes: Partial<Record<CefrLevel, CertificationPass>>;
  attempts: CertificationAttempt[];
  lastFailedAt: Partial<Record<CefrLevel, number>>;
  checkpoints: CheckpointState; // NEW
  v: 2; // bumped
}

const STORAGE_KEY = 'nh_cefr_certifications';
const COOLDOWN_DAYS = 7;
const COOLDOWN_LESSONS = 5;
const PASS_THRESHOLD = 0.8; // 80% per skill AND overall

// ── Read / write state ────────────────────────────────────────────────────────

export function emptyCheckpointState(): CheckpointState {
  return {
    lastCheckpointAt: null,
    activeDaysAtLastCheckpoint: 0,
    consecutiveFails: {},
    focusSkills: {},
    demotions: [],
    snoozedUntil: null,
  };
}

function emptyState(): CertificationState {
  return { passes: {}, attempts: [], lastFailedAt: {}, checkpoints: emptyCheckpointState(), v: 2 };
}

/**
 * Reads the certification state from localStorage. Always returns a valid
 * object; corrupted/missing storage returns an empty state. This is safe
 * to call before SSR / outside the browser — it returns empty state when
 * `localStorage` is unavailable.
 */
export function getCertificationState(): CertificationState {
  if (typeof localStorage === 'undefined') return emptyState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return emptyState();
    const state = parsed as {
      v?: number;
      passes?: unknown;
      attempts?: unknown;
      lastFailedAt?: unknown;
      checkpoints?: unknown;
    };
    // Accept v1 (migrate up) and v2. Anything else → empty.
    if (state.v !== 1 && state.v !== 2) return emptyState();
    if (!state.passes || typeof state.passes !== 'object') state.passes = {};
    if (!Array.isArray(state.attempts)) state.attempts = [];
    if (!state.lastFailedAt || typeof state.lastFailedAt !== 'object') {
      state.lastFailedAt = {};
    }
    // Migrate / normalise the checkpoints block.
    const def = emptyCheckpointState();
    const cp = (
      state.checkpoints && typeof state.checkpoints === 'object' ? state.checkpoints : {}
    ) as Partial<CheckpointState>;
    state.checkpoints = {
      lastCheckpointAt:
        typeof cp.lastCheckpointAt === 'number' ? cp.lastCheckpointAt : def.lastCheckpointAt,
      activeDaysAtLastCheckpoint:
        typeof cp.activeDaysAtLastCheckpoint === 'number'
          ? cp.activeDaysAtLastCheckpoint
          : def.activeDaysAtLastCheckpoint,
      consecutiveFails:
        cp.consecutiveFails && typeof cp.consecutiveFails === 'object' ? cp.consecutiveFails : {},
      focusSkills: cp.focusSkills && typeof cp.focusSkills === 'object' ? cp.focusSkills : {},
      demotions: Array.isArray(cp.demotions) ? cp.demotions : [],
      snoozedUntil: typeof cp.snoozedUntil === 'number' ? cp.snoozedUntil : def.snoozedUntil,
    };
    state.v = 2;
    return state as unknown as CertificationState;
  } catch {
    return emptyState();
  }
}

export function writeCertificationState(state: CertificationState): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Quota / locked / disabled — silently ignore. The next save will retry.
  }
}

// ── Level computation ─────────────────────────────────────────────────────────

/**
 * The highest CEFR level the user has passed an equivalency test for.
 * Returns 'A1' if they have never passed any test (everyone is implicitly
 * eligible at A1 — that's the entry point of the framework).
 *
 * "Highest" is determined by CEFR_ORDER rank, so a user who passed B1 and
 * A2 is at certified-B1.
 */
export function getCertifiedLevel(): CefrLevel {
  const state = getCertificationState();
  let best: CefrLevel = 'A1';
  let bestRank = -1;
  for (const lvl of CEFR_ORDER) {
    if (state.passes[lvl]) {
      const r = cefrRank(lvl);
      if (r > bestRank) {
        bestRank = r;
        best = lvl;
      }
    }
  }
  return best;
}

/**
 * Lowers the certified level by exactly one rank by removing the top pass,
 * so `getCertifiedLevel()` returns the level below. Records the demotion and
 * clears the grace counter for the demoted level. No-op (returns null) at A1
 * — A1 is the floor. Does NOT touch XP, streak, or eligible level.
 */
export function demoteOneLevel(
  reason: 'checkpoint_fail',
): { from: CefrLevel; to: CefrLevel } | null {
  const current = getCertifiedLevel();
  const to = levelBelow(current);
  if (to === null) return null; // A1 floor
  const state = getCertificationState();
  delete state.passes[current];
  state.checkpoints.demotions.push({ from: current, to, at: Date.now(), reason });
  state.checkpoints.consecutiveFails[current] = 0;
  writeCertificationState(state);
  return { from: current, to };
}

/**
 * Returns the most recent attempt for a given level, or null if none.
 */
export function getLastAttempt(level: CefrLevel): CertificationAttempt | null {
  const state = getCertificationState();
  for (let i = state.attempts.length - 1; i >= 0; i--) {
    if (state.attempts[i]?.level === level) return state.attempts[i]!;
  }
  return null;
}

// ── Retake gating ─────────────────────────────────────────────────────────────

export interface RetakeStatus {
  /** True = user can take the test right now. */
  canTake: boolean;
  /** When set, the user is in cooldown until this epoch ms. */
  cooldownUntil?: number;
  /** Lessons remaining before cooldown is cleared by activity. */
  lessonsRemaining?: number;
  reason?: 'cooldown_active' | 'already_passed' | 'okay';
}

/**
 * Whether the user is allowed to attempt the equivalency test for `level`.
 *
 * Allowed when:
 *   - They have never passed it AND no recent failure in cooldown window, OR
 *   - The cooldown days have elapsed since their last failure, OR
 *   - They have completed `COOLDOWN_LESSONS` more lessons since the failure.
 *
 * Not allowed when:
 *   - They already passed it (no need to retake; a re-test would be a
 *     separate "renew certification" flow not implemented here).
 *   - They failed within the last 7 days AND have completed <5 lessons.
 *
 * @param level The CEFR level whose equivalency test is being attempted.
 * @param currentLessonCount The user's lc stat at the time of the call.
 */
export function canTakeEquivalencyTest(level: CefrLevel, currentLessonCount: number): RetakeStatus {
  const state = getCertificationState();
  if (state.passes[level]) {
    return { canTake: false, reason: 'already_passed' };
  }
  const lastFail = state.lastFailedAt[level];
  if (!lastFail) return { canTake: true, reason: 'okay' };
  const elapsedMs = Date.now() - lastFail;
  const cooldownMs = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
  if (elapsedMs >= cooldownMs) return { canTake: true, reason: 'okay' };
  // Within cooldown — but check lessons-completed override.
  // Find the lessonCount at the time of the failure attempt to compare.
  const lastFailAttempt = [...state.attempts].reverse().find((a) => a.level === level && !a.passed);
  const lessonsAtFailure =
    (lastFailAttempt && (lastFailAttempt as unknown as { lc?: number }).lc) || 0;
  const lessonsDone = Math.max(0, currentLessonCount - lessonsAtFailure);
  if (lessonsDone >= COOLDOWN_LESSONS) return { canTake: true, reason: 'okay' };
  return {
    canTake: false,
    reason: 'cooldown_active',
    cooldownUntil: lastFail + cooldownMs,
    lessonsRemaining: COOLDOWN_LESSONS - lessonsDone,
  };
}

// ── Test result recording ─────────────────────────────────────────────────────

/**
 * Computes whether a test attempt passes. A pass requires ≥80% on every
 * tested skill AND ≥80% overall. The reading skill is optional (not every
 * test set has reading items); if absent, only present skills are checked.
 */
export function computePassed(scores: SkillScores): {
  passed: boolean;
  overall: number;
} {
  const skillValues: number[] = [];
  skillValues.push(scores.vocab);
  skillValues.push(scores.grammar);
  if (scores.reading !== undefined) skillValues.push(scores.reading);
  if (scores.listening !== undefined) skillValues.push(scores.listening);
  if (scores.speaking !== undefined) skillValues.push(scores.speaking);
  if (skillValues.length === 0) return { passed: false, overall: 0 };
  const overall = skillValues.reduce((a, b) => a + b, 0) / skillValues.length;
  const minSkill = Math.min(...skillValues);
  const passed = overall >= PASS_THRESHOLD && minSkill >= PASS_THRESHOLD;
  return { passed, overall: overall * 100 };
}

/**
 * Records an equivalency test attempt. Updates `passes` when passed,
 * `lastFailedAt` when not. Always appends to `attempts` history.
 *
 * @returns the new certified level after this attempt.
 */
export function recordEquivalencyAttempt(opts: {
  level: CefrLevel;
  scores: SkillScores;
  currentLessonCount: number;
}): { passed: boolean; newCertified: CefrLevel; attempt: CertificationAttempt } {
  const { level, scores, currentLessonCount } = opts;
  const { passed, overall } = computePassed(scores);
  const state = getCertificationState();
  const attempt: CertificationAttempt = {
    level,
    passed,
    takenAt: Date.now(),
    scores,
    overall,
  };
  // Stash lessonCount-at-attempt on the record for cooldown calculation.
  (attempt as unknown as { lc: number }).lc = currentLessonCount;
  state.attempts.push(attempt);
  // Cap attempt history at the most recent 100 to keep storage bounded.
  if (state.attempts.length > 100) {
    state.attempts = state.attempts.slice(-100);
  }
  if (passed) {
    state.passes[level] = { passedAt: Date.now(), scores, overall };
    delete state.lastFailedAt[level];
  } else {
    state.lastFailedAt[level] = Date.now();
  }
  writeCertificationState(state);
  return { passed, newCertified: getCertifiedLevel(), attempt };
}

// ── Sync helpers ──────────────────────────────────────────────────────────────

/**
 * Snapshot the certification state for cross-device sync. Returns undefined
 * when there is nothing to sync (no attempts, no passes) so applyRemoteProgress
 * does not write empty state.
 */
export function snapshotCertifications(): CertificationState | undefined {
  const s = getCertificationState();
  if (s.attempts.length === 0 && Object.keys(s.passes).length === 0) return undefined;
  return s;
}

/**
 * Merge a remote certification state into the local one. Merge policy:
 *   - `passes`: additive — once a level is passed anywhere, it's passed
 *     everywhere. Keep the earlier `passedAt` (don't backdate but
 *     don't lose the original pass moment).
 *   - `lastFailedAt`: take the MAX (later failure is the relevant one for
 *     cooldown timing; this prevents an old failure from artificially
 *     unlocking a still-cooldown-active test).
 *   - `attempts`: merge by `takenAt` + level, dedup. Cap at most-recent 100.
 *
 * Safe to call with `null` / `undefined` remote (no-op).
 */
export function mergeRemoteCertifications(remote: CertificationState | null | undefined): void {
  if (!remote || typeof remote !== 'object') return;
  const remoteV = (remote as { v?: number }).v;
  if (remoteV !== 1 && remoteV !== 2) return;
  const local = getCertificationState();

  // Passes — additive, prefer earlier passedAt
  if (remote.passes && typeof remote.passes === 'object') {
    for (const k of Object.keys(remote.passes) as CefrLevel[]) {
      const r = remote.passes[k];
      if (!r) continue;
      const l = local.passes[k];
      if (!l) {
        local.passes[k] = r;
      } else {
        // Keep earlier pass timestamp; take the higher overall score
        // because the user demonstrably passed by that margin somewhere.
        const passedAt = Math.min(l.passedAt, r.passedAt);
        const overall = Math.max(l.overall, r.overall);
        const scores: SkillScores = {
          vocab: Math.max(l.scores.vocab, r.scores.vocab),
          grammar: Math.max(l.scores.grammar, r.scores.grammar),
          reading:
            l.scores.reading === undefined
              ? r.scores.reading
              : r.scores.reading === undefined
                ? l.scores.reading
                : Math.max(l.scores.reading, r.scores.reading),
          listening:
            l.scores.listening === undefined
              ? r.scores.listening
              : r.scores.listening === undefined
                ? l.scores.listening
                : Math.max(l.scores.listening, r.scores.listening),
          speaking:
            l.scores.speaking === undefined
              ? r.scores.speaking
              : r.scores.speaking === undefined
                ? l.scores.speaking
                : Math.max(l.scores.speaking, r.scores.speaking),
        };
        local.passes[k] = { passedAt, overall, scores };
      }
    }
  }

  // lastFailedAt — take MAX so cooldown is honored
  if (remote.lastFailedAt && typeof remote.lastFailedAt === 'object') {
    for (const k of Object.keys(remote.lastFailedAt) as CefrLevel[]) {
      const r = remote.lastFailedAt[k];
      if (r == null) continue;
      const l = local.lastFailedAt[k];
      local.lastFailedAt[k] = l == null ? r : Math.max(l, r);
    }
  }

  // attempts — union by (level, takenAt)
  if (Array.isArray(remote.attempts)) {
    const seen = new Set<string>();
    const out: CertificationAttempt[] = [];
    for (const a of [...local.attempts, ...remote.attempts]) {
      if (!a || typeof a !== 'object') continue;
      const k = a.level + '@' + a.takenAt;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(a);
    }
    out.sort((a, b) => a.takenAt - b.takenAt);
    local.attempts = out.slice(-100);
  }

  // checkpoints — most-recent cadence wins; grace counters take MAX so a
  // stale device cannot erase a pending demotion. snoozedUntil takes MAX.
  if (remote.checkpoints && typeof remote.checkpoints === 'object') {
    const rc = remote.checkpoints;
    const lc = local.checkpoints;

    // Capture original timestamps BEFORE any MAX-overwrite so the focusSkills
    // freshness comparison below is based on the original values.
    const lcTime = lc.lastCheckpointAt ?? -1;
    const rcTime = typeof rc.lastCheckpointAt === 'number' ? rc.lastCheckpointAt : -1;

    if (typeof rc.lastCheckpointAt === 'number') {
      lc.lastCheckpointAt =
        lc.lastCheckpointAt == null
          ? rc.lastCheckpointAt
          : Math.max(lc.lastCheckpointAt, rc.lastCheckpointAt);
    }
    if (typeof rc.activeDaysAtLastCheckpoint === 'number') {
      lc.activeDaysAtLastCheckpoint = Math.max(
        lc.activeDaysAtLastCheckpoint,
        rc.activeDaysAtLastCheckpoint,
      );
    }
    if (rc.consecutiveFails && typeof rc.consecutiveFails === 'object') {
      for (const k of Object.keys(rc.consecutiveFails) as CefrLevel[]) {
        const r = rc.consecutiveFails[k] ?? 0;
        const l = lc.consecutiveFails[k] ?? 0;
        lc.consecutiveFails[k] = Math.max(l, r);
      }
    }
    // focusSkills: adopt the WHOLE map from whichever side has the fresher
    // checkpoint. A remote CLEAR (key absent in remote.focusSkills) must win
    // when the remote checkpoint is newer, so we cannot do a per-key union.
    if (rc.focusSkills && typeof rc.focusSkills === 'object') {
      if (rcTime > lcTime) {
        // Remote checkpoint is fresher → its focus map is authoritative.
        // This also propagates a remote CLEAR: a level absent in remote is dropped.
        lc.focusSkills = { ...rc.focusSkills };
      } else if (rcTime === lcTime) {
        // Same freshness (or both unset) → union, keep local where set.
        for (const k of Object.keys(rc.focusSkills) as CefrLevel[]) {
          if (!lc.focusSkills[k] && rc.focusSkills[k]) lc.focusSkills[k] = rc.focusSkills[k];
        }
      }
      // else local is fresher → keep local focusSkills unchanged.
    }
    if (Array.isArray(rc.demotions)) {
      const seen = new Set(lc.demotions.map((d) => d.at));
      for (const d of rc.demotions) if (d && !seen.has(d.at)) lc.demotions.push(d);
      lc.demotions.sort((a, b) => a.at - b.at);
    }
    if (typeof rc.snoozedUntil === 'number') {
      lc.snoozedUntil =
        lc.snoozedUntil == null ? rc.snoozedUntil : Math.max(lc.snoozedUntil, rc.snoozedUntil);
    }
  }

  writeCertificationState(local);
}

// ── Public convenience wrapper ────────────────────────────────────────────────

/**
 * Returns the level the rest of the app should treat as authoritative
 * for unlocking decisions. This is the canonical entry point: callers
 * should pass their eligible (activity-derived) level and use the
 * result for `isUnlocked()`.
 *
 * When the certification feature flag is off, returns `eligible`
 * unchanged so behaviour is identical to the pre-2026-05-20 app.
 *
 * When the flag is on, returns the certified level — locks all content
 * above that level until the user passes the relevant equivalency test.
 */
export function getEffectiveLevelForUnlock(eligible: CefrLevel): CefrLevel {
  return getEffectiveLevel(eligible, { CERTIFICATION_REQUIRED, getCertifiedLevel });
}

// ── One-time migration ───────────────────────────────────────────────────────

const MIGRATION_FLAG_KEY = 'nh_cefr_migration_v1_done';

/**
 * On the user's first launch after hard CEFR gating ships, grandfather
 * their current activity-derived level into certification. This means:
 *
 *   - Existing users do NOT lose access to content they already had.
 *     If they were eligible at B1 (xp + lessons), they're now certified
 *     at B1 — same content stays unlocked.
 *
 *   - Future advancement requires passing the equivalency test for the
 *     next tier. A user grandfathered at B1 must pass the B1→B2 test
 *     to unlock B2 content. There is no second grandfather.
 *
 *   - The migration is one-shot. The `nh_cefr_migration_v1_done` flag
 *     in localStorage prevents re-running, even if the user's eligible
 *     level later changes (e.g., XP drop after stats reset).
 *
 *   - If the user has already passed an equivalency test before this
 *     migration runs (unlikely, since the flag wasn't on), the
 *     grandfather only fills in lower-rank levels — it never overwrites
 *     a real test pass.
 *
 * The grandfathered "pass" records 80% on every skill and overall —
 * the minimum passing score — so it's clearly distinguishable in the
 * attempt history from a real high-scoring pass.
 *
 * Safe to call at every app launch; bails fast if already migrated.
 */
export function migrateGrandfatheredCertification(eligible: CefrLevel): void {
  if (typeof localStorage === 'undefined') return;
  try {
    if (localStorage.getItem(MIGRATION_FLAG_KEY) === '1') return;
  } catch {
    return;
  }

  // A1-eligible users have nothing to grandfather. Bail without setting the
  // flag so a later call (after stats hydrate from Firebase / accumulate)
  // catches the real eligible level. Setting the flag prematurely would
  // freeze the user at certified=A1 even after they earn XP.
  if (eligible === 'A1') return;

  const state = getCertificationState();
  const eligibleRank = cefrRank(eligible);
  // Grandfather every level from A2 up to (and including) the user's
  // eligible level. A1 needs no pass — that's the entry point.
  let didGrandfather = false;
  for (const level of CEFR_ORDER) {
    if (level === 'A1') continue; // implicit
    if (cefrRank(level) > eligibleRank) break; // don't grandfather levels above eligible
    if (state.passes[level]) continue; // never overwrite a real pass
    state.passes[level] = {
      passedAt: Date.now(),
      scores: { vocab: 0.8, grammar: 0.8, reading: 0.8 },
      overall: 80,
    };
    state.attempts.push({
      level,
      passed: true,
      takenAt: Date.now(),
      scores: { vocab: 0.8, grammar: 0.8, reading: 0.8 },
      overall: 80,
    });
    didGrandfather = true;
  }
  if (didGrandfather) writeCertificationState(state);

  try {
    localStorage.setItem(MIGRATION_FLAG_KEY, '1');
  } catch {
    // Quota or disabled — migration will retry next launch. That's fine;
    // it's idempotent.
  }
}
