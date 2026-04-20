import type { Dispatch } from 'react';

// Core stats shape — mirrors DS constant in App.jsx and sanitizeStats field list.
export interface Stats {
  xp: number;
  lc: number;
  gc: number;
  sp: number;
  de: number;
  rc: number;
  pf: number;
  mv: number;
  hi: number;
  str: number;
  authLoading: number;
  diff: 'beginner' | 'intermediate' | 'advanced';
  ct: string[];
  vs: string[];
  rs: string[];
  badges: string[];
  // Badge-backing counters — present on the stats object but outside the core type.
  // Math.max merged in mergeStatsFromRemote so they survive multi-device sync.
  srsTotal?: number;
  mistakesMastered?: number;
  readingDone?: number;
  mediaVisits?: number;
  streak?: number;
}

export type StatsAction =
  | { type: 'RESET'; payload: Stats }
  | { type: 'MERGE_REMOTE'; payload: unknown; ds: Stats }
  | { type: 'APPLY'; payload: (prev: Stats) => Stats };

export interface AuthUser {
  u: string;
  e: string;
  d: string;
}

export interface StatsDelta {
  xp?: number;
  lc?: number;
  gc?: number;
  sp?: number;
  de?: number;
  rc?: number;
  pf?: number;
  mv?: number;
  hi?: number;
  ct?: string[];
  vs?: string[];
  badges?: string[];
}

export interface StatsContextValue {
  stats: Stats;
  setStats: (fn: ((prev: Stats) => Stats) | Stats) => void;
  dispatch: Dispatch<StatsAction>;
  award: (amt: number, celebrate?: boolean, exerciseId?: string) => void;
  level: number;
  /** Fire an atomic Firestore increment for this delta — conflict-free across devices. */
  writeDelta: (delta: StatsDelta) => void;
}

/** CEFR proficiency level — the six standard levels used throughout the app. */
export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

/**
 * FSRS spaced-repetition card state.
 * Canonical type for the `nh_sr` localStorage map and Firestore `sr` field.
 * Mirrors `SRCard` in `src/lib/srs.ts` — keep in sync if srs.ts fields change.
 */
export interface SRSCard {
  s: number; // stability (days before forgetting)
  d: number; // difficulty (0–10)
  r: number; // repetitions count
  w: number; // wrong-answer count
  l: number; // last review timestamp (ms since epoch)
  b: number; // last rating given (0–4)
  due: number; // timestamp when card became due (ms)
  nextDue: number; // timestamp of next scheduled review (ms)
  // Legacy SM-2 fields — present on cards created before FSRS migration
  ease?: number;
  interval?: number;
  ef?: number;
  iv?: number;
  rep?: number;
  reps?: number;
  t?: number;
}

/**
 * A single item in the sequential A1→C1 learn path.
 * Passed to `launchPathItem()` in `src/hooks/useScreenLauncher.ts`.
 */
export interface LearnPathItem {
  id?: string;
  go?: string;
  topic?: string;
  filter?: unknown;
  lessonId?: string;
}
