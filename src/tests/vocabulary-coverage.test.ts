// src/tests/vocabulary-coverage.test.ts
//
// VOCABULARY COVERAGE CI GATE
// ───────────────────────────
// Counts unique Croatian headwords in the CEFR-tiered vocabulary banks and
// asserts breadth floors. Motivated by the content audit: grammar is
// fluency-grade, but lexical breadth caps around B1 — the single biggest blocker
// to real B2–C1 fluency. This gate makes the vocabulary gap a measured, tracked,
// regression-proof number instead of an invisible ceiling.
//
// Tiers (the uniform [hr, en, example?] banks; misc banks like COUNTRIES/ZNAM
// have heterogeneous shapes and aren't CEFR-tiered, so they're out of scope):
//   - core  (V)     — general A1–B1 vocabulary
//   - B2    (V_B2)  — B2 tier
//   - C1    (V_C1)  — C1 tier
//
// Design — green today, ratcheting (mirrors content-coverage.test.ts):
//   - `core` already has the breadth a B1 base needs → ENFORCED with a
//     regression floor (vocabulary can never silently shrink below it).
//   - `B2`/`C1` are far below the breadth those levels require, so they're in
//     KNOWN_GAPS: the suite stays green, but the gap is explicit debt and the
//     ratchet test fails if a tier is grown past target without being promoted
//     out of KNOWN_GAPS (locking the win in). Targets are deliberate minimums to
//     *credibly back the tier*, not exact cumulative-CEFR vocabulary science.
//
// Fluency reference (cumulative): ~1k ≈ A2, ~3–4k ≈ B1/B2, ~8–10k ≈ C1/C2.

import { describe, it, expect } from 'vitest';
import { V, V_B2, V_C1 } from '../../functions/api/content/_data/vocabulary.js';

/** Count unique, normalised Croatian headwords in a {category: [hr, en, ...][]} bank. */
function countUnique(bank: Record<string, unknown> | undefined): number {
  const set = new Set<string>();
  if (!bank) return 0;
  for (const value of Object.values(bank)) {
    if (!Array.isArray(value)) continue;
    for (const entry of value) {
      if (Array.isArray(entry) && typeof entry[0] === 'string') {
        set.add(entry[0].trim().toLowerCase());
      }
    }
  }
  return set.size;
}

const counts = {
  core: countUnique(V as Record<string, unknown>),
  B2: countUnique(V_B2 as Record<string, unknown>),
  C1: countUnique(V_C1 as Record<string, unknown>),
};

// Minimum unique headwords per tier.
const TARGET = { core: 1200, B2: 900, C1: 600 } as const;
type Tier = keyof typeof TARGET;

// Tiers below target today (green-but-tracked debt; ratchet forces removal once
// filled). PRIORITY: B2 → C1. The audit recommends roughly tripling each tier.
// Both B2 and C1 were promoted out once their banks crossed the breadth floor
// (now enforced as hard regression guards). No tiers remain in tracked debt.
const KNOWN_GAPS = new Set<Tier>([]);

const meetsTarget = (t: Tier) => counts[t] >= TARGET[t];

// ── Report (prints on every run) ──────────────────────────────────────────────
console.log(
  '\nVocabulary coverage — unique Croatian headwords per CEFR tier:\n' +
    (Object.keys(TARGET) as Tier[])
      .map(
        (t) =>
          `  ${t.padEnd(5)} ${String(counts[t]).padStart(5)} / target ${TARGET[t]}` +
          (KNOWN_GAPS.has(t) ? '  ← gap' : meetsTarget(t) ? '  ✅' : ''),
      )
      .join('\n') +
    `\n  Known gaps (tracked debt): ${[...KNOWN_GAPS].join(', ') || 'none'}\n`,
);

describe('vocabulary coverage', () => {
  it('every CEFR tier bank is non-empty (banks didn’t move or break)', () => {
    expect(counts.core).toBeGreaterThan(0);
    expect(counts.B2).toBeGreaterThan(0);
    expect(counts.C1).toBeGreaterThan(0);
  });

  it('tiers meeting target stay above the breadth floor (regression guard)', () => {
    for (const t of Object.keys(TARGET) as Tier[]) {
      if (KNOWN_GAPS.has(t)) continue;
      expect(
        counts[t],
        `${t} vocabulary dropped below its breadth floor (${TARGET[t]}); words were removed.`,
      ).toBeGreaterThanOrEqual(TARGET[t]);
    }
  });

  it('ratchet: a KNOWN_GAP tier grown past target must be removed from the allowlist', () => {
    for (const t of KNOWN_GAPS) {
      expect(
        meetsTarget(t),
        `${t} vocabulary now meets target (${counts[t]} ≥ ${TARGET[t]}) — remove it from KNOWN_GAPS to lock in the win and enforce the floor.`,
      ).toBe(false);
    }
  });
});
