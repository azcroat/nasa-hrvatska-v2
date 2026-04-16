import type { Dispatch } from 'react';
import type { StatsAction } from '../lib/statsReducer';

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
}

export interface AuthUser {
  u: string;
  e: string;
  d: string;
}

export interface StatsDelta {
  xp?: number; lc?: number; gc?: number; sp?: number; de?: number;
  rc?: number; pf?: number; mv?: number; hi?: number;
  ct?: string[]; vs?: string[]; badges?: string[];
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
