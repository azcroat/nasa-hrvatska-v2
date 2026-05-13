// src/hooks/useDailySession.ts
import { useState, useCallback, useEffect } from 'react';
import { getDueReviews } from '../lib/srs';
import { getDueCategoryQueue } from '../lib/adaptive';
import type { SkillCategory } from '../lib/adaptive';
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
}

// ── Constants ────────────────────────────────────────────────────────────────

const SESSION_KEY = 'nh_daily_session';
const HISTORY_KEY = 'nh_session_history';
const RECENT_KEY = 'nh_recent_exercises';
const MINUTES_PER_ACTIVITY = 5;

/** Maps adaptive SkillCategory → exercise screen id */
const CATEGORY_SCREEN_MAP: Partial<Record<SkillCategory, string>> = {
  genitive: 'genitivedrill',
  accusative: 'akudrill',
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
  speaking: 'speaking_sprint',
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
  { id: 'unjumble', label: 'Word Order', screen: 'unjumble', cefr: 'A2', category: 'vocab-a2' },
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
    category: 'vocab-a2',
  },
  {
    id: 'sentbuild',
    label: 'Build Sentences',
    screen: 'sentbuild',
    cefr: 'A2',
    category: 'vocab-a2',
  },
  {
    id: 'sentencetiles',
    label: 'Tile Assembly',
    screen: 'sentencetiles',
    cefr: 'A2',
    category: 'vocab-a2',
  },
  { id: 'typing', label: 'Typing', screen: 'typing', cefr: 'A2', category: 'vocab-a2' },
  {
    id: 'speaking_sprint',
    label: 'Speaking Sprint',
    screen: 'speaking_sprint',
    cefr: 'A2',
    category: 'speaking',
  },
  {
    id: 'aspectdrill',
    label: 'Aspect Drill',
    screen: 'aspectdrill',
    cefr: 'B1',
    category: 'aspect-imperfective',
  },
  { id: 'akudrill', label: 'Accusative', screen: 'akudrill', cefr: 'B1', category: 'accusative' },
  { id: 'future', label: 'Future Tense', screen: 'future', cefr: 'B1', category: 'future-tense' },
  {
    id: 'comparatives',
    label: 'Compare',
    screen: 'comparatives',
    cefr: 'B1',
    category: 'vocab-b1',
  },
  { id: 'clitic', label: 'Clitic Drill', screen: 'clitic', cefr: 'B2', category: 'clitics' },
  { id: 'writing', label: 'Free Writing', screen: 'writing', cefr: 'B1', category: 'speaking' },
  { id: 'dictation', label: 'Dictation', screen: 'dictation', cefr: 'B1', category: 'speaking' },
];

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

// ── Pure helpers (exported for unit tests) ───────────────────────────────────

export function buildSessionActivities(userCefr: string): SessionActivity[] {
  const activities: SessionActivity[] = [];

  // Priority 1: FSRS word reviews
  const dueReviews = getDueReviews();
  if (dueReviews.length > 0) {
    activities.push({
      id: 'srsreview',
      label: 'Word Review',
      screen: 'review',
      category: 'vocab-a2',
    });
  }

  // Priority 2: Adaptive category (top due category → mapped screen)
  const catQueue = getDueCategoryQueue(6);
  if (catQueue.length > 0) {
    const top = catQueue[0]!;
    const screen = CATEGORY_SCREEN_MAP[top.category];
    if (screen && !activities.find((a) => a.screen === screen)) {
      activities.push({
        id: `cat_${top.category}`,
        label: top.category.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        screen,
        category: top.category,
      });
    }
  }

  // Priority 3: CEFR-appropriate fill (skip recent, exclude already queued screens)
  const recentScreens: string[] = (() => {
    try {
      return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') as string[];
    } catch {
      return [];
    }
  })();
  const usedScreens = new Set(activities.map((a) => a.screen));

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

  // Shuffle and fill to 4 total activities before Croatia slot
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const tmp = shuffled[i] as (typeof shuffled)[0];
    shuffled[i] = shuffled[j] as (typeof shuffled)[0];
    shuffled[j] = tmp;
  }
  const fillTarget = 4; // target 4 activities from P1+P2+P3 before Croatia slot
  for (const ex of shuffled) {
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

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useDailySession(userCefr: string): UseDailySessionReturn {
  const [session, setSession] = useState<DailySession>(() => {
    const persisted = loadPersistedSession();
    // Invalidate if date changed OR CEFR level changed (new exercises unlocked)
    if (persisted && persisted.date === localDateStr() && persisted.cefrLevel === userCefr) {
      return persisted;
    }
    const activities = buildSessionActivities(userCefr);
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

  // Handle date rollover or CEFR level-up after mount
  useEffect(() => {
    if (session.date !== localDateStr() || session.cefrLevel !== userCefr) {
      const activities = buildSessionActivities(userCefr);
      const fresh: DailySession = {
        date: localDateStr(),
        cefrLevel: userCefr,
        activities,
        completedIds: [],
        estimatedMinutes: activities.length * MINUTES_PER_ACTIVITY,
      };
      persistSession(fresh);
      setSession(fresh);
    }
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
      // Check for session completion
      if (updated.completedIds.length === updated.activities.length) {
        recordSessionComplete(updated.date);
      }
      return updated;
    });
  }, []);

  const isComplete = session.completedIds.length >= session.activities.length;
  const progress =
    session.activities.length === 0 ? 0 : session.completedIds.length / session.activities.length;
  const nextActivity = session.activities.find((a) => !session.completedIds.includes(a.id)) ?? null;
  const tomorrowLabel = '4–6 activities tomorrow';

  return { session, isComplete, progress, markDone, nextActivity, tomorrowLabel };
}
