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
