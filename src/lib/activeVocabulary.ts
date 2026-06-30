/**
 * activeVocabulary — the "vocabulary-in-context" provider (Content-Rec #3).
 *
 * The audit's core finding: learners drill vocabulary in isolation, but words
 * only become fluency when they are MET IN CONTEXT — read, heard, and produced.
 * This module is the single shared selector that turns the learner's own
 * spaced-repetition state into a ranked list of TARGET Croatian words, so the
 * contextual generators (AI story / listening / writing / dialogue) can weave in
 * the exact words the learner is currently working on instead of random content.
 *
 * It reads only EXISTING reviewed data — the live FSRS map (`getSR()`) plus the
 * corpus FREQUENCY_500 list — so it ships no new Croatian and fabricates nothing.
 *
 * Ranking (priority order, deduped, capped):
 *   1. weak     — lapsed, or wrong-answers exceed right (with ≥2 reviews). The
 *                 words actively failing; recycling these in context is the
 *                 highest-value review.
 *   2. due      — scheduled for review now (most-overdue first).
 *   3. learning — seen but not yet stable (still being acquired).
 *   4. fresh    — high-frequency CONTENT words not yet introduced, in corpus-
 *                 frequency order. For a brand-new learner (empty SR) this makes
 *                 targets the frequency core itself — the most useful first words.
 *
 * Within the weak/learning tiers, ties break toward higher corpus frequency
 * (more common = more useful to shore up first).
 */
import { getSR } from './srs';
import { FREQUENCY_500 } from './frequency500';

export interface ActiveVocabulary {
  /** Ranked target words to weave into contextual content (the headline output). */
  targets: string[];
  /** Struggling words: lapsed or wrong>right. */
  weak: string[];
  /** Words due for review right now. */
  due: string[];
  /** Seen but not yet stable. */
  learning: string[];
  /** High-frequency content words not yet introduced (corpus-frequency order). */
  fresh: string[];
}

/** POS values worth featuring as vocabulary (skip pure function words for `fresh`). */
const CONTENT_POS = new Set(['noun', 'verb', 'adj', 'adv', 'num']);
const DEFAULT_LIMIT = 12;
const MASTERED_STABILITY_DAYS = 21; // FSRS stability past which a word is "known"

/** Lowercased Croatian word → corpus frequency rank (1 = most common). */
const FREQ_RANK: Map<string, number> = (() => {
  const m = new Map<string, number>();
  for (const e of FREQUENCY_500) {
    const k = e.hr.toLowerCase();
    if (!m.has(k)) m.set(k, e.rank);
  }
  return m;
})();

function freqRank(word: string): number {
  return FREQ_RANK.get(word.toLowerCase()) ?? Number.MAX_SAFE_INTEGER;
}

function num(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}

/**
 * Build the learner's active vocabulary. Pure aside from reading localStorage via
 * getSR(); safe to call anywhere (returns frequency-core targets when SR is empty).
 */
export function getActiveVocabulary(opts: { limit?: number } = {}): ActiveVocabulary {
  const limit = Math.max(1, opts.limit ?? DEFAULT_LIMIT);

  let sr: Record<string, unknown> = {};
  try {
    sr = getSR() as unknown as Record<string, unknown>;
  } catch {
    sr = {};
  }
  const now = Date.now();
  const seen = new Set<string>(Object.keys(sr).map((w) => w.toLowerCase()));

  const weakRows: Array<{ word: string; sev: number }> = [];
  const dueRows: Array<{ word: string; overdue: number }> = [];
  const learningRows: Array<{ word: string; rank: number }> = [];

  for (const [word, raw] of Object.entries(sr)) {
    if (!raw || typeof raw !== 'object') continue;
    const c = raw as Record<string, unknown>;
    const l = num(c.l);
    const w = num(c.w);
    const r = num(c.r);
    const s = num(c.s);
    const due = num(c.due) || num(c.nextDue);
    const reviewed = r + w;

    if (l > 0 || (w > r && reviewed >= 2)) {
      // Severity: lapses dominate, then the wrong-vs-right margin.
      weakRows.push({ word, sev: l * 10 + (w - r) });
    }
    if (due > 0 && due <= now) {
      dueRows.push({ word, overdue: now - due });
    } else if (reviewed > 0 && s < MASTERED_STABILITY_DAYS) {
      learningRows.push({ word, rank: freqRank(word) });
    }
  }

  weakRows.sort((a, b) => b.sev - a.sev || freqRank(a.word) - freqRank(b.word));
  dueRows.sort((a, b) => b.overdue - a.overdue);
  learningRows.sort((a, b) => a.rank - b.rank);

  const weak = weakRows.map((x) => x.word);
  const due = dueRows.map((x) => x.word);
  const learning = learningRows.map((x) => x.word);

  const fresh: string[] = [];
  for (const e of FREQUENCY_500) {
    if (!CONTENT_POS.has(e.pos)) continue;
    if (seen.has(e.hr.toLowerCase())) continue;
    fresh.push(e.hr);
  }

  // Priority merge into the capped target list, deduped case-insensitively.
  const targets: string[] = [];
  const used = new Set<string>();
  const add = (words: string[]): void => {
    for (const word of words) {
      if (targets.length >= limit) return;
      const k = word.toLowerCase();
      if (used.has(k)) continue;
      used.add(k);
      targets.push(word);
    }
  };
  add(weak);
  add(due);
  add(learning);
  add(fresh);

  return { targets, weak, due, learning, fresh };
}

/** Convenience: just the ranked target words (the common consumer need). */
export function getActiveVocabularyTargets(limit?: number): string[] {
  return getActiveVocabulary({ limit }).targets;
}
