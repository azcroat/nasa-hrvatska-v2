/**
 * readingCurriculum — a structured extensive-reading path over the existing
 * graded reader (Content-Rec #2).
 *
 * The audit flagged that reading was a flat browse of 84 graded passages with
 * no sense of progression — the learner had no answer to "what should I read
 * next?". This gives reading the same structured treatment the listening
 * curriculum gives listening: a per-CEFR-level ordered path with a recommended
 * next passage and progress.
 *
 * It derives entirely from the already-reviewed `READ` pool (src/data/
 * exercises.js) — no new content is authored, and the existing ReadingScreen
 * completion flow is reused unchanged: completing a passage's quiz already
 * writes a `reading_<title>` key into stats.vs, so that array IS the progress
 * store. The curriculum functions are pure — callers pass the done-key list
 * (stats.vs) in.
 *
 * Buckets map to CEFR by their reader badge (beginner=A1/A2, intermediate=B1,
 * advanced=B1-B2, b2=B2, c1=C1); advanced material is offered at both B1 and
 * B2, which is pedagogically correct for B1-B2 graded text.
 */
import { READ } from '../data/exercises.js';

export interface ReadingPassage {
  title: string;
  tEn?: string;
  text?: string;
  vocab?: unknown[];
  qs?: unknown[];
  [k: string]: unknown;
}

export interface ReadingUnit {
  key: string; // the stats.vs key written on completion: reading_<Title>
  title: string;
  tEn: string;
  bucket: string; // beginner | intermediate | advanced | b2 | c1
  badge: string; // CEFR badge for the bucket
  passage: ReadingPassage; // raw passage, for launching
}

// Bucket → CEFR badge (authoritative, matches ReadingList LEVEL_META).
const BUCKET_BADGE: Record<string, string> = {
  beginner: 'A1/A2',
  intermediate: 'B1',
  advanced: 'B1-B2',
  b2: 'B2',
  c1: 'C1',
};

// Which reader buckets make up each CEFR level's path, in reading order.
const LEVEL_BUCKETS: Record<string, string[]> = {
  A1: ['beginner'],
  A2: ['beginner'],
  B1: ['intermediate', 'advanced'],
  B2: ['advanced', 'b2'],
  C1: ['c1'],
  C2: ['c1'], // no dedicated C2 reader — the hardest available bucket
};

const VALID_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

/**
 * The stats.vs key a passage maps to. Must stay byte-identical to the key
 * ReadingScreen writes on completion (`'reading_' + title with spaces → _`).
 */
export function readingKeyFor(title: string): string {
  return 'reading_' + String(title || 'passage').replace(/\s+/g, '_');
}

function normLevel(level: string | null | undefined): string {
  return level && VALID_LEVELS.includes(level) ? level : 'A1';
}

/** All reading units that make up the path at a given CEFR level, in order. */
export function getReadingUnitsForLevel(level: string): ReadingUnit[] {
  const buckets = LEVEL_BUCKETS[normLevel(level)] || [];
  const units: ReadingUnit[] = [];
  const seen = new Set<string>();
  for (const bucket of buckets) {
    const passages = (READ as Record<string, ReadingPassage[]>)[bucket] || [];
    for (const p of passages) {
      const key = readingKeyFor(p.title);
      if (seen.has(key)) continue; // guard against duplicate titles across buckets
      seen.add(key);
      units.push({
        key,
        title: p.title,
        tEn: typeof p.tEn === 'string' ? p.tEn : '',
        bucket,
        badge: BUCKET_BADGE[bucket] || bucket.toUpperCase(),
        passage: p,
      });
    }
  }
  return units;
}

/**
 * The recommended next passage at the learner's level: the first one not yet
 * completed, in reading order. Returns null when every passage at that level is
 * done (the UI then shows a "level complete" state). `done` is stats.vs.
 */
export function getNextReadingUnit(level: string, done: string[]): ReadingUnit | null {
  const doneSet = new Set(Array.isArray(done) ? done : []);
  return getReadingUnitsForLevel(level).find((u) => !doneSet.has(u.key)) || null;
}

/** Done / total passage counts for the learner's current level. */
export function getReadingProgress(level: string, done: string[]): { done: number; total: number } {
  const doneSet = new Set(Array.isArray(done) ? done : []);
  const units = getReadingUnitsForLevel(level);
  return { done: units.filter((u) => doneSet.has(u.key)).length, total: units.length };
}
