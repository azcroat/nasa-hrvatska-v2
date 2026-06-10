// src/lib/conjugation/mastery.ts
import type { ConjCell } from './types';
import { buildCardKey } from './cardKey';

export type MasteryLevel = 'new' | 'learning' | 'mastered';

// FSRS 'stability' (days). Thresholds chosen so "mastered" ≈ a 3-week+ retention interval.
const MASTERED_S = 21;

export function cellMastery(card: { s?: number } | undefined): MasteryLevel {
  if (!card || typeof card.s !== 'number') return 'new';
  return card.s >= MASTERED_S ? 'mastered' : 'learning';
}

export function verbMastery(
  inf: string,
  cells: ConjCell[],
  sr: Record<string, { s?: number }>,
): MasteryLevel {
  const verbCells = cells.filter((c) => c.inf === inf);
  if (verbCells.length === 0) return 'new';
  const levels = verbCells.map((c) => cellMastery(sr[buildCardKey(c)]));
  if (levels.every((l) => l === 'mastered')) return 'mastered';
  if (levels.some((l) => l !== 'new')) return 'learning';
  return 'new';
}

// A unit is "complete enough" to unlock the next when ≥80% of its cells are learning+.
export function unitUnlocksNext(cells: ConjCell[], sr: Record<string, { s?: number }>): boolean {
  if (cells.length === 0) return true;
  const touched = cells.filter((c) => cellMastery(sr[buildCardKey(c)]) !== 'new').length;
  return touched / cells.length >= 0.8;
}
