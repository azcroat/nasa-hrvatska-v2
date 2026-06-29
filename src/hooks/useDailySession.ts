// src/hooks/useDailySession.ts
import { useState, useCallback, useEffect } from 'react';
import { getDueReviews, getServableReviewCount } from '../lib/srs';
import { getDueCategoryQueue, CONJ_CATEGORIES, CATEGORY_MIN_CEFR } from '../lib/adaptive';
import type { SkillCategory } from '../lib/adaptive';
import { CONJ_LAB_ENABLED } from '../lib/conjugation/conjugationConfig';
import { cefrRank, type Cefr } from '../lib/conjugation/category';
import { isUnlocked } from '../lib/cefr';
import { localDateStr } from '../lib/dateUtils';
import { rnd } from '../lib/random.js';

// ── Types ────────────────────────────────────────────────────────────────────

// Sessions can include Croatia activities whose categories aren't SkillCategory
type SessionCategory = SkillCategory | 'culture' | 'practical' | 'general';

export interface SessionActivity {
  id: string;
  label: string;
  screen: string;
  category: SessionCategory;
}

export interface DailySession {
  date: string; // 'YYYY-MM-DD'
  cefrLevel?: string; // CEFR level when session was built — invalidate on level-up
  activities: SessionActivity[];
  completedIds: string[];
  estimatedMinutes: number;
}

export interface UseDailySessionReturn {
  session: DailySession;
  isComplete: boolean;
  progress: number; // 0.0–1.0
  markDone: (screenOrId: string) => void;
  nextActivity: SessionActivity | null;
  tomorrowLabel: string;
  /**
   * Extra activities to suggest AFTER the curated daily session is done.
   * Solves the "Session Complete → nothing else to do" dead-end: users who
   * want to keep learning get 3–5 hand-picked next steps drawn from the
   * unlocked CEFR pool (excluding activities already in the daily session
   * and any done in the last 24h). Empty array when session is incomplete.
   */
  bonusActivities: SessionActivity[];
}

// ── Constants ────────────────────────────────────────────────────────────────

const SESSION_KEY = 'nh_daily_session';
const HISTORY_KEY = 'nh_session_history';
const RECENT_KEY = 'nh_recent_exercises';
const MINUTES_PER_ACTIVITY = 5;

/** Maps adaptive SkillCategory → exercise screen id */
const CATEGORY_SCREEN_MAP: Partial<Record<SkillCategory, string>> = {
  genitive: 'genitivedrill',
  accusative: 'accusativedrill',
  'dative-locative': 'cloze',
  instrumental: 'cloze',
  vocative: 'cloze',
  'past-tense': 'cloze',
  'future-tense': 'future',
  'aspect-imperfective': 'aspectdrill',
  'aspect-perfective': 'aspectdrill',
  'aspect-negation': 'aspectdrill',
  conditional: 'cloze',
  clitics: 'clitic',
  'vocab-a2': 'znam',
  'vocab-b1': 'znam',
  'vocab-b2': 'znam',
  // 'speaking' category previously mapped to 'speaking_sprint'; that surface
  // is AI-driven and now lives only on the AI Tutor tab. Speaking category
  // adaptive picks no longer route to a daily-session activity.
};

/** CEFR-annotated exercise pool for Priority 3 fill */
const CEFR_EXERCISE_POOL: Array<{
  id: string;
  label: string;
  screen: string;
  cefr: string;
  category: SkillCategory;
}> = [
  { id: 'flashcards', label: 'Flashcards', screen: 'flashcards', cefr: 'A1', category: 'vocab-a2' },
  { id: 'mcgame', label: 'Quiz', screen: 'mcgame', cefr: 'A1', category: 'vocab-a2' },
  { id: 'match', label: 'Match Pairs', screen: 'match', cefr: 'A1', category: 'vocab-a2' },
  { id: 'review', label: 'SRS Review', screen: 'review', cefr: 'A1', category: 'vocab-a2' },
  { id: 'znam', label: 'Translate', screen: 'znam', cefr: 'A2', category: 'vocab-a2' },
  { id: 'qwords', label: 'Questions', screen: 'qwords', cefr: 'A2', category: 'vocab-a2' },
  { id: 'genderdrill', label: 'Gender', screen: 'genderdrill', cefr: 'A2', category: 'vocab-a2' },
  { id: 'cloze', label: 'Sentence Cloze', screen: 'cloze', cefr: 'A2', category: 'vocab-a2' },
  { id: 'unjumble', label: 'Word Order', screen: 'unjumble', cefr: 'A2', category: 'word-order' },
  { id: 'prepdrill', label: 'Prepositions', screen: 'prepdrill', cefr: 'A2', category: 'genitive' },
  { id: 'negation', label: 'Negation', screen: 'negation', cefr: 'A2', category: 'genitive' },
  {
    id: 'genitivedrill',
    label: 'Genitive Case',
    screen: 'genitivedrill',
    cefr: 'A2',
    category: 'genitive',
  },
  {
    id: 'nomdrill',
    label: 'Nominative Case',
    screen: 'nomdrill',
    cefr: 'A1',
    category: 'nominative',
  },
  {
    id: 'locdrill',
    label: 'Locative Case',
    screen: 'locdrill',
    cefr: 'B1',
    category: 'dative-locative',
  },
  {
    id: 'sentbuild',
    label: 'Build Sentences',
    screen: 'sentbuild',
    cefr: 'A2',
    category: 'word-order',
  },
  {
    id: 'sentencetiles',
    label: 'Tile Assembly',
    screen: 'sentencetiles',
    cefr: 'A2',
    category: 'word-order',
  },
  { id: 'typing', label: 'Typing', screen: 'typing', cefr: 'A2', category: 'vocab-a2' },
  {
    id: 'aspectdrill',
    label: 'Aspect Drill',
    screen: 'aspectdrill',
    cefr: 'B1',
    category: 'aspect-imperfective',
  },
  {
    id: 'accusativedrill',
    label: 'Accusative Case',
    screen: 'accusativedrill',
    cefr: 'B1',
    category: 'accusative',
  },
  { id: 'future', label: 'Future Tense', screen: 'future', cefr: 'B1', category: 'future-tense' },
  {
    id: 'comparatives',
    label: 'Compare',
    screen: 'comparatives',
    cefr: 'B1',
    category: 'vocab-b1',
  },
  { id: 'clitic', label: 'Clitic Drill', screen: 'clitic', cefr: 'B2', category: 'clitics' },
  { id: 'dictation', label: 'Dictation', screen: 'dictation', cefr: 'B1', category: 'speaking' },
];

// Screen → CEFR lookup derived from the pool. Used to CEFR-gate the adaptive
// pick (resolveAdaptiveActivity) so the coverage floor can't surface a locked
// drill (e.g. B1 accusative, B2 clitics) to an A1/A2 user.
const SCREEN_CEFR: Record<string, string> = Object.fromEntries(
  CEFR_EXERCISE_POOL.map((e) => [e.screen, e.cefr]),
);

/** Croatia rotation pool — Priority 4 always adds one of these */
const CROATIA_POOL: SessionActivity[] = [
  { id: 'cityofday', label: 'City of the Day', screen: 'cityofday', category: 'culture' },
  { id: 'top100', label: 'Top 100 Phrases', screen: 'top100', category: 'vocab-a2' },
  { id: 'grocery', label: 'Grocery Scenario', screen: 'grocery', category: 'practical' },
  { id: 'transport', label: 'Transport Scenario', screen: 'transport', category: 'practical' },
  { id: 'recipes', label: 'Croatian Recipes', screen: 'recipes', category: 'culture' },
  { id: 'history', label: 'Croatian History', screen: 'history', category: 'culture' },
  { id: 'proverbs', label: 'Croatian Proverbs', screen: 'proverbs', category: 'culture' },
  { id: 'popculture', label: 'Pop Culture', screen: 'popculture', category: 'culture' },
];

// Reference/immersion screens with no self-grading completion (read/scenario
// screens). The Priority-4 Croatia slot ALWAYS adds one of these, and they only
// fire the completion handshake on their error/empty path — never on normal
// viewing (the dwell-credit that used to cover that was removed 2026-06-12). So
// the always-present Croatia slot stranded the session at N-1/N: it could never
// complete, which also blocked the on-completion auto-regenerate. Treat
// "launched from the session and returned" as completion for these. Derived from
// CROATIA_POOL so it can never drift out of sync.
export const SESSION_AUTOCOMPLETE_SCREENS: ReadonlySet<string> = new Set(
  CROATIA_POOL.map((c) => c.screen),
);

/**
 * Whether a launched session activity should be marked done on return to Home:
 * either the screen fired the real completion signal (`completed === pending`),
 * or it is a reference screen with no self-grading (auto-complete on view).
 */
export function shouldAutoCompleteOnReturn(
  pending: string | null,
  completed: string | null,
): boolean {
  if (!pending) return false;
  return completed === pending || SESSION_AUTOCOMPLETE_SCREENS.has(pending);
}

// ── Pure helpers (exported for unit tests) ───────────────────────────────────

// Choose the adaptive grammar activity for this session. CEFR-gates and re-points
// conjugation categories to the conjugation drill when CONJ_LAB_ENABLED. Returns
// null when no eligible category maps to an unused screen.
export function resolveAdaptiveActivity(
  userCefr: string,
  usedScreens: Set<string>,
): SessionActivity | null {
  const queue = getDueCategoryQueue(6);
  for (const { category } of queue) {
    const isConj = CONJ_LAB_ENABLED && CONJ_CATEGORIES.has(category);
    if (isConj) {
      const min = CATEGORY_MIN_CEFR[category];
      if (min && cefrRank(userCefr as Cefr) < cefrRank(min)) continue; // not yet unlocked
    }
    const screen = isConj ? 'conjpractice' : CATEGORY_SCREEN_MAP[category];
    if (!screen || usedScreens.has(screen)) continue;
    // CEFR-gate non-conjugation picks by the mapped drill's level (conjugation is
    // gated above via CATEGORY_MIN_CEFR). Without this the coverage floor would
    // surface a locked drill — e.g. B1 accusative or B2 clitics — to an A1/A2
    // user. When every eligible category is locked this returns null and the
    // guaranteed-grammar slot (G2) backfills a level-appropriate drill.
    if (!isConj) {
      const screenCefr = SCREEN_CEFR[screen];
      if (screenCefr && !isUnlocked(screenCefr, userCefr)) continue;
    }
    const label = category.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    return { id: `cat_${category}`, label, screen, category };
  }
  return null;
}

// Structural difficulty tier per session exercise type (1 = recognition …
// 5 = open production), mirroring exerciseMeta's scale. Used to bias the daily
// Priority-3 fill toward the user's ability so content scales as they advance
// (defect #1: difficulty was inert — nothing consumed difficulty tiers). Any id
// not listed defaults to tier 3.
const EXERCISE_DIFFICULTY: Record<string, number> = {
  flashcards: 1,
  mcgame: 1,
  match: 1,
  review: 2,
  qwords: 2,
  genderdrill: 2,
  nomdrill: 2,
  unjumble: 2,
  negation: 2,
  znam: 3,
  cloze: 3,
  prepdrill: 3,
  genitivedrill: 3,
  locdrill: 3,
  sentencetiles: 3,
  typing: 3,
  accusativedrill: 3,
  future: 3,
  comparatives: 3,
  dictation: 3,
  sentbuild: 4,
  aspectdrill: 4,
  clitic: 4,
};

// Maps the user's CEFR level to a target difficulty tier (1–5). A stronger user
// is biased toward harder exercise types.
const CEFR_TIER: Record<string, number> = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 5 };

// Grammar/structure categories: the seven cases, verb tense/aspect, clitics, and
// word order. Excludes vocab-*, speaking, and culture/practical. Used to (a) tell
// whether a session already contains grammar and (b) pick the guaranteed grammar
// slot (G2). Tags are the honest ones set on CEFR_EXERCISE_POOL (see G1).
const GRAMMAR_STRUCTURE_CATEGORIES: ReadonlySet<SessionCategory> = new Set<SessionCategory>([
  'nominative',
  'genitive',
  'accusative',
  'dative-locative',
  'instrumental',
  'vocative',
  'present-tense',
  'past-tense',
  'future-tense',
  'aspect-imperfective',
  'aspect-perfective',
  'aspect-negation',
  'conditional',
  'clitics',
  'word-order',
]);

function isGrammarStructure(category: SessionCategory): boolean {
  return GRAMMAR_STRUCTURE_CATEGORIES.has(category);
}

// G2: pick one guaranteed grammar/structure drill from the unlocked pool. It is
// level-appropriate (nearest CEFR to the user) and EXEMPT from the Priority-3
// difficulty-tier sort (G4) — that sort otherwise buries case/structure drills
// (tier 3–4) for A1/A2 users, starving exactly the learners who most need
// foundational grammar. Skips recent + already-used screens, falling back to
// ignoring recency rather than returning nothing.
function selectGuaranteedGrammar(
  userCefr: string,
  usedScreens: Set<string>,
  recentScreens: string[],
): SessionActivity | null {
  const grammar = CEFR_EXERCISE_POOL.filter(
    (ex) =>
      isGrammarStructure(ex.category) &&
      isUnlocked(ex.cefr, userCefr) &&
      !usedScreens.has(ex.screen),
  );
  let candidates = grammar.filter((ex) => !recentScreens.includes(ex.screen));
  if (candidates.length === 0) candidates = grammar; // recency fallback
  if (candidates.length === 0) return null;
  // Nearest CEFR to the user first (level-appropriate); random tiebreak rotates
  // same-level drills day to day.
  const userRank = cefrRank(userCefr as Cefr);
  const pick = candidates
    .map((ex) => ({ ex, dist: Math.abs(cefrRank(ex.cefr as Cefr) - userRank), r: rnd() }))
    .sort((a, b) => a.dist - b.dist || a.r - b.r)[0]!.ex;
  return { id: pick.id, label: pick.label, screen: pick.screen, category: pick.category };
}

export function buildSessionActivities(
  userCefr: string,
  poolWords?: Set<string>,
): SessionActivity[] {
  const activities: SessionActivity[] = [];

  // Priority 1: FSRS word reviews — gated on what ReviewScreen can actually
  // serve, not the raw FSRS count. When poolWords is provided (HomeTab call
  // path), drop orphan cards (words removed from vocabulary) so the slot is
  // only added if /review will render content. Fallback to the unfiltered
  // count when no pool is provided (e.g., unit tests).
  const dueCount = poolWords ? getServableReviewCount(poolWords) : getDueReviews().length;
  if (dueCount > 0) {
    activities.push({
      id: 'srsreview',
      label: 'Word Review',
      screen: 'review',
      category: 'vocab-a2',
    });
  }

  // Priority 2: Adaptive grammar topic (CEFR-gated; conjugation categories route
  // to the conjugation drill when CONJ_LAB_ENABLED).
  const adaptiveActivity = resolveAdaptiveActivity(
    userCefr,
    new Set(activities.map((a) => a.screen)),
  );
  if (adaptiveActivity) activities.push(adaptiveActivity);

  // Build usedScreens once, here, so P2.5 and P3 both dedup against it.
  const usedScreens = new Set(activities.map((a) => a.screen));

  // Priority 2.5: Production — guarantee one speaking/writing slot per session
  // SP4b. Uses pure helper that filters by CEFR + mic state + recent exclusion.
  const productionActivity = selectProductionExercise({
    cefr: userCefr,
    micState: readMicState(),
    recentScreens: getRecentProduction(),
  });
  if (productionActivity && !usedScreens.has(productionActivity.screen)) {
    activities.push(productionActivity);
    usedScreens.add(productionActivity.screen);
  }

  // Recency list — shared by the guaranteed-grammar slot (P2.7) and the P3 fill.
  const recentScreens: string[] = (() => {
    try {
      return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') as string[];
    } catch {
      return [];
    }
  })();

  // Priority 2.7: Guaranteed grammar/structure (G2). P2's adaptive pick can be a
  // vocab category or null, and the P3 tier sort buries grammar for A1/A2 — so a
  // session could contain zero grammar. If nothing queued so far is
  // grammar/structure, force in one level-appropriate drill (tier-sort-exempt,
  // G4). It counts toward fillTarget, so it DISPLACES a vocab fill rather than
  // lengthening the session.
  if (!activities.some((a) => isGrammarStructure(a.category))) {
    const grammar = selectGuaranteedGrammar(userCefr, usedScreens, recentScreens);
    if (grammar) {
      activities.push(grammar);
      usedScreens.add(grammar.screen);
    }
  }

  // Priority 3: CEFR-appropriate fill (skip recent, exclude already queued screens)
  let pool = CEFR_EXERCISE_POOL.filter(
    (ex) =>
      isUnlocked(ex.cefr, userCefr) &&
      !recentScreens.includes(ex.screen) &&
      !usedScreens.has(ex.screen),
  );

  // Fallback: if recency filter leaves nothing, use full unlocked pool
  if (pool.length === 0) {
    pool = CEFR_EXERCISE_POOL.filter(
      (ex) => isUnlocked(ex.cefr, userCefr) && !usedScreens.has(ex.screen),
    );
  }

  // Bias the fill toward the user's ability tier: nearest difficulty first, with
  // a random tiebreak so same-tier types still rotate for variety (recency
  // already rotates day to day). Replaces the prior pure shuffle so difficulty
  // actually scales with the user (defect #1: difficulty was inert).
  const targetTier = CEFR_TIER[userCefr] ?? 3;
  const ordered = [...pool]
    .map((ex) => ({
      ex,
      dist: Math.abs((EXERCISE_DIFFICULTY[ex.id] ?? 3) - targetTier),
      r: rnd(),
    }))
    .sort((a, b) => a.dist - b.dist || a.r - b.r)
    .map((o) => o.ex);
  const fillTarget = 4; // target 4 activities from P1+P2+P3 before Croatia slot
  for (const ex of ordered) {
    if (activities.length >= fillTarget) break;
    if (!usedScreens.has(ex.screen)) {
      activities.push({ id: ex.id, label: ex.label, screen: ex.screen, category: ex.category });
      usedScreens.add(ex.screen);
    }
  }

  // Priority 4: Croatia immersion — always 1 slot
  const today = localDateStr();
  const cityVisited = localStorage.getItem('nh_cityofday_date') === today;
  const dayOfMonth = new Date().getDate();
  const croatiaActivity = cityVisited
    ? CROATIA_POOL[1 + (dayOfMonth % (CROATIA_POOL.length - 1))]!
    : CROATIA_POOL[0]!;
  activities.push(croatiaActivity);

  return activities;
}

export function markDoneInSession(session: DailySession, id: string): DailySession {
  if (session.completedIds.includes(id)) return session; // idempotent
  return { ...session, completedIds: [...session.completedIds, id] };
}

export function recordSessionComplete(date: string): void {
  try {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '{}') as Record<
      string,
      boolean
    >;
    history[date] = true;
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {}
}

function loadPersistedSession(): DailySession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DailySession;
    return parsed.date === localDateStr() ? parsed : null;
  } catch {
    return null;
  }
}

function persistSession(session: DailySession): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {}
}

// Record a completed activity's screen in the recent-exercises list so the
// Priority-3 "skip recent" filter actually rotates day to day. Previously this
// list was only written by the Practice tab, so a Today's-Session-only user kept
// getting the same fill exercises. Mirrors GradTab's writer (cap 6, de-duped).
function recordRecentExercise(screen: string): void {
  try {
    const prev = (JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') as string[]).filter(
      (s) => s !== screen,
    );
    localStorage.setItem(RECENT_KEY, JSON.stringify([screen, ...prev].slice(0, 6)));
  } catch {}
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useDailySession(userCefr: string, poolWords?: Set<string>): UseDailySessionReturn {
  const [session, setSession] = useState<DailySession>(() => {
    const persisted = loadPersistedSession();
    // Invalidate if date changed OR CEFR level changed (new exercises unlocked)
    if (persisted && persisted.date === localDateStr() && persisted.cefrLevel === userCefr) {
      return persisted;
    }
    const activities = buildSessionActivities(userCefr, poolWords);
    const fresh: DailySession = {
      date: localDateStr(),
      cefrLevel: userCefr,
      activities,
      completedIds: [],
      estimatedMinutes: activities.length * MINUTES_PER_ACTIVITY,
    };
    persistSession(fresh);
    return fresh;
  });

  // Handle date rollover or CEFR level-up after mount.
  //
  // 2026-05-21 BUG FIX: the previous implementation set `completedIds: []` on
  // every CEFR change, which wiped the user's session progress whenever stats
  // hydrated async after the initial render. Repro:
  //   1. App opens, stats not yet loaded → userCefr derives as 'A1'.
  //   2. Session is built with A1 activities and marked complete by user actions.
  //   3. Firebase hydration lands a moment later, stats.xp jumps to real value,
  //      userCefr re-derives as e.g. 'B1'.
  //   4. This effect fired → built FRESH B1 session with completedIds: [] →
  //      every activity the user just finished now showed as not done.
  // Multiple users reported "I did my activities but the card forgot."
  //
  // Fix: when CEFR changes mid-day, preserve completedIds by mapping old
  // session screens to new ones — any new activity whose screen matches an old
  // completed activity stays completed. Date rollover (true new day) still
  // wipes — that's the intended fresh-day behavior.
  useEffect(() => {
    const isNewDay = session.date !== localDateStr();
    const isCefrChange = session.cefrLevel !== userCefr;
    if (!isNewDay && !isCefrChange) return;
    // (poolWords change does NOT trigger this effect — only date/CEFR — so
    // the activity list stays stable as content lazy-loads.)

    const activities = buildSessionActivities(userCefr, poolWords);

    let completedIds: string[];
    if (isNewDay) {
      completedIds = []; // genuine new day — start fresh
    } else {
      // CEFR change mid-day: preserve progress by screen-match. An activity in
      // the OLD session whose screen also appears in the NEW session was
      // already accomplished — don't ask the user to redo it.
      const completedScreens = new Set(
        session.activities.filter((a) => session.completedIds.includes(a.id)).map((a) => a.screen),
      );
      completedIds = activities.filter((a) => completedScreens.has(a.screen)).map((a) => a.id);
    }

    const fresh: DailySession = {
      date: localDateStr(),
      cefrLevel: userCefr,
      activities,
      completedIds,
      estimatedMinutes: activities.length * MINUTES_PER_ACTIVITY,
    };
    persistSession(fresh);
    setSession(fresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userCefr]);

  const markDone = useCallback((screenOrId: string) => {
    setSession((prev) => {
      // Match by id or by screen name
      const match = prev.activities.find((a) => a.id === screenOrId || a.screen === screenOrId);
      if (!match) return prev;
      if (prev.completedIds.includes(match.id)) return prev;
      const updated = markDoneInSession(prev, match.id);
      persistSession(updated);
      // Record the screen so the daily session's skip-recent filter rotates it
      // out next time (the write path that was missing for non-Practice users).
      recordRecentExercise(match.screen);
      // SP4b: track production exercises for recent-exclusion rotation
      if (PRODUCTION_SCREEN_IDS.has(match.screen)) {
        recordProductionExercise(match.screen);
      }
      // Check for session completion
      if (updated.completedIds.length === updated.activities.length) {
        recordSessionComplete(updated.date);
      }
      return updated;
    });
  }, []);

  // 2026-05-20 BUG FIX: auto-skip SRS review activity when nothing is due.
  //
  // Symptom users hit (screenshot, 2026-05-20):
  //   1. Morning session built with srsreview activity (reviews WERE due then).
  //   2. User burns through their queue, every card scheduled days out.
  //   3. Later they tap "Today's Session" → routes to /review → screen renders
  //      "All caught up!" dead-end with only a Go Back button — no path back
  //      into the session, no markDone signal fired.
  //   4. Tomorrow's session never unlocks because today is permanently stuck
  //      at N-1/N with a stale review slot.
  // Multiple users reported the same dead-end ("Today's Session is broken").
  //
  // Fix: when the activity list contains srsreview AND the FSRS queue is
  // empty right now, auto-mark it complete. The session card naturally
  // advances to the next pending activity, no dead-end screen possible.
  // Re-checks on every session change so a user who's clearing reviews
  // *during* the session is caught the moment the queue empties.
  useEffect(() => {
    const srsActivity = session.activities.find((a) => a.screen === 'review');
    if (!srsActivity) return;
    if (session.completedIds.includes(srsActivity.id)) return;
    // Use the same pool-aware count buildSessionActivities now uses, so the
    // skip decision agrees with what ReviewScreen will actually serve.
    const dueCount = poolWords ? getServableReviewCount(poolWords) : getDueReviews().length;
    if (dueCount > 0) return;
    // Use the same setter path markDone uses (persist + history side-effects).
    setSession((prev) => {
      if (prev.completedIds.includes(srsActivity.id)) return prev;
      const updated = markDoneInSession(prev, srsActivity.id);
      persistSession(updated);
      if (updated.completedIds.length === updated.activities.length) {
        recordSessionComplete(updated.date);
      }
      return updated;
    });
  }, [session, poolWords]);

  const isComplete = session.completedIds.length >= session.activities.length;
  const progress =
    session.activities.length === 0 ? 0 : session.completedIds.length / session.activities.length;
  const nextActivity = session.activities.find((a) => !session.completedIds.includes(a.id)) ?? null;
  const tomorrowLabel = '4–6 activities tomorrow';

  // Auto-regenerate on completion (same day). The moment every activity is done,
  // build a brand-new set so Today's Session always offers fresh content instead
  // of a dead-end. By now the just-completed screens are recorded (skip-recent)
  // and the just-rated adaptive category has rescheduled, so the new set rotates
  // to different exercises and a different grammar focus. buildSessionActivities
  // always returns >= 1 activity (Croatia slot is unconditional), so the fresh
  // set is never immediately complete — no render loop.
  useEffect(() => {
    if (!isComplete || session.activities.length === 0) return;
    const activities = buildSessionActivities(userCefr, poolWords);
    const fresh: DailySession = {
      date: localDateStr(),
      cefrLevel: userCefr,
      activities,
      completedIds: [],
      estimatedMinutes: activities.length * MINUTES_PER_ACTIVITY,
    };
    persistSession(fresh);
    setSession(fresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete]);

  // Bonus activities — show only when the curated daily session is complete,
  // so users who want to keep learning have specific next steps instead of a
  // generic "come back tomorrow" message. Draws from CEFR_EXERCISE_POOL,
  // excluding screens already in today's session and any used in the last
  // 24h (recentScreens). Capped at 5.
  const bonusActivities: SessionActivity[] = isComplete
    ? (() => {
        const sessionScreens = new Set(session.activities.map((a) => a.screen));
        const recentScreens: string[] = (() => {
          try {
            return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') as string[];
          } catch {
            return [];
          }
        })();
        const recentSet = new Set(recentScreens);
        let pool = CEFR_EXERCISE_POOL.filter(
          (ex) =>
            isUnlocked(ex.cefr, userCefr) &&
            !sessionScreens.has(ex.screen) &&
            !recentSet.has(ex.screen),
        );
        if (pool.length === 0) {
          pool = CEFR_EXERCISE_POOL.filter(
            (ex) => isUnlocked(ex.cefr, userCefr) && !sessionScreens.has(ex.screen),
          );
        }
        const shuffled = [...pool];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(rnd() * (i + 1));
          const tmp = shuffled[i] as (typeof shuffled)[0];
          shuffled[i] = shuffled[j] as (typeof shuffled)[0];
          shuffled[j] = tmp;
        }
        return shuffled.slice(0, 5).map((ex) => ({
          id: 'bonus_' + ex.id,
          label: ex.label,
          screen: ex.screen,
          category: ex.category,
        }));
      })()
    : [];

  return { session, isComplete, progress, markDone, nextActivity, tomorrowLabel, bonusActivities };
}

// ── Mic-state persistence (SP4b) ─────────────────────────────────────────────
// useRecorder writes 'available' | 'denied' | 'unsupported' on terminal state
// transitions. selectProductionExercise reads this to decide whether
// mic-required exercises are eligible. Unknown values fail-open to 'unknown'.
const MIC_STATE_KEY = 'nh_mic_state';
const VALID_MIC_STATES = new Set(['available', 'denied', 'unsupported']);
export type MicState = 'available' | 'denied' | 'unsupported' | 'unknown';

export function readMicState(): MicState {
  try {
    const v = localStorage.getItem(MIC_STATE_KEY);
    if (v && VALID_MIC_STATES.has(v)) return v as MicState;
  } catch (_) {
    // localStorage unavailable (iOS private browsing) — fall through
  }
  return 'unknown';
}

// ── Recent-production tracking (SP4b) ────────────────────────────────────────
// Tracks which production exercises the user has done in the last 3 days to
// avoid back-to-back repeats. Device-local by design — cross-device sync is
// out of scope per SP4b spec.
const PRODUCTION_RECENT_KEY = 'nh_recent_production';
const PRODUCTION_RECENT_WINDOW_DAYS = 3;

interface RecentProductionEntry {
  screen: string;
  date: string; // YYYY-MM-DD
}

function _todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function _daysBetween(a: string, b: string): number {
  // Returns absolute day difference between two YYYY-MM-DD strings.
  // ISO-string parse is timezone-stable for date-only values.
  const aMs = new Date(a + 'T00:00:00Z').getTime();
  const bMs = new Date(b + 'T00:00:00Z').getTime();
  return Math.round(Math.abs(aMs - bMs) / 86400000);
}

export function getRecentProduction(): string[] {
  try {
    const raw = localStorage.getItem(PRODUCTION_RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const today = _todayStr();
    return parsed
      .filter(
        (e): e is RecentProductionEntry =>
          e &&
          typeof e === 'object' &&
          typeof e.screen === 'string' &&
          typeof e.date === 'string' &&
          _daysBetween(today, e.date) < PRODUCTION_RECENT_WINDOW_DAYS,
      )
      .map((e) => e.screen);
  } catch (_) {
    return [];
  }
}

// ── Production pool (SP4b) ───────────────────────────────────────────────────
// Five-member pool of exercises that require active learner output.
// micRequired === false members are eligible as fallback for mic-blocked users.
const PRODUCTION_POOL: Array<{
  id: string;
  label: string;
  screen: string;
  cefr: string;
  category: SkillCategory;
  micRequired: boolean;
}> = [
  {
    id: 'shadowing',
    label: 'Shadowing',
    screen: 'shadowing',
    cefr: 'A2',
    category: 'speaking',
    micRequired: true,
  },
  {
    id: 'production_drill',
    // screen MUST match the AppRouter route id ('production_drill', with
    // underscore) — a prior 'productiondrill' typo routed Today's Session →
    // Production to an empty page at B1+ (no such route). Audited 2026-05-30.
    label: 'Production',
    screen: 'production_drill',
    cefr: 'B1',
    category: 'speaking',
    micRequired: true,
  },
  {
    id: 'dictation',
    label: 'Dictation',
    screen: 'dictation',
    cefr: 'B1',
    category: 'speaking',
    micRequired: false,
  },
];

/** Set of screen IDs in the production pool, for fast lookup in markDone wiring. */
export const PRODUCTION_SCREEN_IDS: ReadonlySet<string> = new Set(
  PRODUCTION_POOL.map((p) => p.screen),
);

/**
 * Every screen id "Today's Session" can route to, across all CEFR levels and all
 * priority slots. Derived from the pools so it can never drift. The
 * session-routes test asserts each of these resolves to a real AppRouter route —
 * a guard against the dead-lesson class of bug (e.g. the 'productiondrill' typo
 * that routed B1 Production to an empty page, fixed 2026-05-30).
 */
export const SESSION_SCREEN_IDS: ReadonlySet<string> = new Set<string>([
  'review', // Priority 1 SRS slot (hardcoded in buildSessionActivities)
  ...(Object.values(CATEGORY_SCREEN_MAP).filter(Boolean) as string[]),
  ...CEFR_EXERCISE_POOL.map((e) => e.screen),
  ...CROATIA_POOL.map((c) => c.screen),
  ...PRODUCTION_POOL.map((p) => p.screen),
]);

// ── Production exercise selector (SP4b) ──────────────────────────────────────
// Pure function — returns one SessionActivity from PRODUCTION_POOL, applying
// CEFR / mic / recent filters. Returns null when the unlocked pool is empty
// (e.g., A1 user with all 5 exercises locked).
export function selectProductionExercise(opts: {
  cefr: string;
  micState: MicState;
  recentScreens: string[];
}): SessionActivity | null {
  const { cefr, micState, recentScreens } = opts;
  // Step 1 — CEFR gate
  let pool = PRODUCTION_POOL.filter((p) => isUnlocked(p.cefr, cefr));
  // Step 2 — mic-required filter (keyboard-only when denied/unsupported)
  if (micState === 'denied' || micState === 'unsupported') {
    pool = pool.filter((p) => !p.micRequired);
  }
  if (pool.length === 0) return null;
  // Step 3 — recent-exclusion (fall back to pre-filter if it empties)
  let candidates = pool.filter((p) => !recentScreens.includes(p.screen));
  if (candidates.length === 0) candidates = pool;
  // Step 4 — random uniform pick
  const idx = Math.min(Math.floor(rnd() * candidates.length), candidates.length - 1);
  const picked = candidates[idx]!;
  return {
    id: picked.id,
    label: picked.label,
    screen: picked.screen,
    category: picked.category,
  };
}

export function recordProductionExercise(screen: string): void {
  if (!screen || typeof screen !== 'string') return;
  try {
    const raw = localStorage.getItem(PRODUCTION_RECENT_KEY);
    const arr: RecentProductionEntry[] = (() => {
      try {
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    })();
    const today = _todayStr();
    // Same-day re-record doesn't duplicate
    const existsToday = arr.some((e) => e.screen === screen && e.date === today);
    if (!existsToday) arr.push({ screen, date: today });
    // Prune entries older than the window before saving
    const pruned = arr.filter(
      (e) =>
        e &&
        typeof e.date === 'string' &&
        _daysBetween(today, e.date) < PRODUCTION_RECENT_WINDOW_DAYS,
    );
    localStorage.setItem(PRODUCTION_RECENT_KEY, JSON.stringify(pruned));
  } catch (_) {
    // QuotaExceededError or localStorage unavailable — non-fatal
  }
}
