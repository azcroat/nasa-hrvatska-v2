// src/lib/conjugation/dailySet.ts
import type { ConjCell } from './types';
import { buildCardKey } from './cardKey';

interface Args {
  candidates: ConjCell[]; // all cells from the user's unlocked units
  dueKeys: Set<string>; // SR card keys currently due
  size: number;
  daySeed: number; // e.g. yyyymmdd; keeps the set stable across reloads
}

// Mulberry32 — deterministic PRNG seeded by the day.
function rngFrom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleSeeded<T>(arr: T[], rng: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export function selectDailySet({ candidates, dueKeys, size, daySeed }: Args): ConjCell[] {
  const rng = rngFrom(daySeed);
  const due = candidates.filter((c) => dueKeys.has(buildCardKey(c)));
  const fresh = candidates.filter((c) => !dueKeys.has(buildCardKey(c)));
  const out: ConjCell[] = [];
  const seen = new Set<string>();
  for (const c of [...shuffleSeeded(due, rng), ...shuffleSeeded(fresh, rng)]) {
    const k = buildCardKey(c);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(c);
    if (out.length >= size) break;
  }
  return out;
}
