// src/tests/content-coverage.test.ts
//
// CONTENT COVERAGE CI GATE
// ────────────────────────
// Tabulates the daily-session exercise pool into a (CEFR level × skill group)
// matrix and asserts coverage floors, so the curriculum can't silently drift
// out of balance. Motivated by the audit that found content peaks at A2 and
// collapses at the top: B2 has one drill, C1/C2 have none, while the
// equivalency-test ladder certifies all the way to C2.
//
// Design — green today, ratcheting:
//   - TARGET_FLOOR is the minimum acceptable coverage per level.
//   - Levels that currently MEET target (A1/A2/B1) are enforced: they can never
//     regress below the floor or collapse to a single skill group.
//   - Levels currently BELOW target (B2, C1) are listed in KNOWN_GAPS so the
//     suite is green, but the gap is explicit debt. The ratchet test fails if a
//     KNOWN_GAP is filled-but-not-removed — forcing the win to be locked in
//     (after which the level becomes enforced).
//   - C2 is intentionally exempt: the app states C2 native-equivalence is
//     measured by external providers (see EquivalencyTestCard), so it is
//     assessment + curated immersion only, not a drill-volume target.
//
// This gate does NOT lower the bar to pass — it codifies the real target and
// tracks the remaining debt transparently.

import { describe, it, expect } from 'vitest';
import { CEFR_EXERCISE_POOL } from '../hooks/useDailySession';
import type { SkillCategory } from '../lib/adaptive';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
type Level = (typeof LEVELS)[number];

const SKILL_GROUPS = [
  'vocab',
  'case',
  'verb',
  'syntax',
  'speaking',
  'listening',
  'reading',
] as const;
type SkillGroup = (typeof SKILL_GROUPS)[number];

// Every pool category maps to exactly one skill group. A category with no entry
// here is a bug (the matrix would silently miscount) — asserted below.
const SKILL_GROUP: Record<SkillCategory, SkillGroup> = {
  'vocab-a2': 'vocab',
  'vocab-b1': 'vocab',
  'vocab-b2': 'vocab',
  nominative: 'case',
  genitive: 'case',
  accusative: 'case',
  'dative-locative': 'case',
  instrumental: 'case',
  vocative: 'case',
  'present-tense': 'verb',
  'past-tense': 'verb',
  'future-tense': 'verb',
  'aspect-imperfective': 'verb',
  'aspect-perfective': 'verb',
  'aspect-negation': 'verb',
  conditional: 'verb',
  'word-order': 'syntax',
  clitics: 'syntax',
  speaking: 'speaking',
};

// Minimum acceptable exercises per level. C2 omitted = exempt by design.
const TARGET_FLOOR: Partial<Record<Level, number>> = {
  A1: 4,
  A2: 6,
  B1: 6,
  B2: 6,
  C1: 4,
};

// A healthy level must teach more than one kind of thing.
const MIN_SKILL_GROUPS = 2;

// Levels currently below target. Green-but-tracked debt; the ratchet test below
// forces removal once filled. PRIORITY ORDER for content authoring: B2 → C1.
const KNOWN_GAPS = new Set<Level>(['B2', 'C1']);

// ── Build the matrix ─────────────────────────────────────────────────────────
function buildMatrix() {
  const totals: Record<string, number> = {};
  const cells: Record<string, Record<string, number>> = {};
  for (const lvl of LEVELS) {
    totals[lvl] = 0;
    cells[lvl] = {};
    for (const g of SKILL_GROUPS) cells[lvl][g] = 0;
  }
  for (const ex of CEFR_EXERCISE_POOL) {
    const group = SKILL_GROUP[ex.category];
    if (!group) continue; // surfaced by the unmapped-category test
    if (!(ex.cefr in totals)) continue; // unknown level — surfaced separately
    totals[ex.cefr] += 1;
    cells[ex.cefr][group] += 1;
  }
  return { totals, cells };
}

const { totals, cells } = buildMatrix();
const groupsCovered = (lvl: Level) => SKILL_GROUPS.filter((g) => cells[lvl][g] > 0).length;
const meetsTarget = (lvl: Level) => {
  const floor = TARGET_FLOOR[lvl];
  if (floor === undefined) return true; // exempt (C2)
  return totals[lvl] >= floor && groupsCovered(lvl) >= MIN_SKILL_GROUPS;
};

// ── Human-readable report (prints on every run) ──────────────────────────────
console.log(
  '\nContent coverage — exercises per (CEFR level × skill group):\n' +
    ['level', ...SKILL_GROUPS, 'TOTAL', 'target'].join('\t') +
    '\n' +
    LEVELS.map((lvl) =>
      [
        lvl,
        ...SKILL_GROUPS.map((g) => cells[lvl][g] || '·'),
        totals[lvl],
        TARGET_FLOOR[lvl] ?? 'exempt',
      ].join('\t'),
    ).join('\n') +
    `\n\nKnown gaps (tracked debt): ${[...KNOWN_GAPS].join(', ') || 'none'}\n`,
);

describe('content coverage matrix', () => {
  it('every pool category maps to a known skill group (matrix is exhaustive)', () => {
    const unmapped = CEFR_EXERCISE_POOL.filter((ex) => !SKILL_GROUP[ex.category]).map(
      (ex) => `${ex.id} (${ex.category})`,
    );
    expect(
      unmapped,
      `Unmapped categories — add them to SKILL_GROUP: ${unmapped.join(', ')}`,
    ).toEqual([]);
  });

  it('every pool entry has a recognised CEFR level', () => {
    const bad = CEFR_EXERCISE_POOL.filter((ex) => !LEVELS.includes(ex.cefr as Level)).map(
      (ex) => `${ex.id} (${ex.cefr})`,
    );
    expect(bad, `Unknown CEFR levels: ${bad.join(', ')}`).toEqual([]);
  });

  it('levels meeting target stay above the coverage floor (regression guard)', () => {
    for (const lvl of LEVELS) {
      if (KNOWN_GAPS.has(lvl) || TARGET_FLOOR[lvl] === undefined) continue;
      expect(
        totals[lvl],
        `${lvl} dropped below its coverage floor (${TARGET_FLOOR[lvl]}); content was removed or retagged away.`,
      ).toBeGreaterThanOrEqual(TARGET_FLOOR[lvl]!);
      expect(
        groupsCovered(lvl),
        `${lvl} collapsed to <${MIN_SKILL_GROUPS} skill groups; it must teach more than one kind of thing.`,
      ).toBeGreaterThanOrEqual(MIN_SKILL_GROUPS);
    }
  });

  it('ratchet: a KNOWN_GAP that is now filled must be removed from the allowlist', () => {
    for (const lvl of KNOWN_GAPS) {
      expect(
        meetsTarget(lvl),
        `${lvl} now meets its coverage target — remove it from KNOWN_GAPS to lock in the win and enforce the floor going forward.`,
      ).toBe(false);
    }
  });

  it('C2 is intentionally exempt from a drill-volume floor (documented decision)', () => {
    expect(TARGET_FLOOR.C2).toBeUndefined();
  });
});
