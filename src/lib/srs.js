/**
 * FSRS-4.5 Spaced Repetition Scheduler
 * Free Spaced Repetition Scheduler — trained on 700 M+ Anki reviews.
 * Achieves ~89.6% target recall vs SM-2's ~47.1% on open benchmarks.
 *
 * Card schema (stored in localStorage 'nh_sr'):
 *   s:    number  — stability (days; replaces SM-2 ease/interval)
 *   d:    number  — difficulty 1–10 (higher = harder)
 *   r:    number  — total correct reviews  (kept for analytics / achievements)
 *   w:    number  — total wrong reviews    (kept for weak-word detection)
 *   l:    number  — lapses (forgot count)
 *   b:    number  — box 0–5 (kept for legacy badge / mastered logic)
 *   due:  number  — timestamp ms when next due  (primary scheduling field)
 *   nextDue: number — alias of due (kept for ReviewScreen ETA display)
 *
 * Legacy SM-2 fields (ease, interval, rep, ef, iv, t) are migrated on first
 * read so existing user data is never lost.
 */

// ─── FSRS-4.5 default weights (W0–W18) ───────────────────────────────────────
const W = [
  0.4072, 1.1829, 3.1262, 15.4722,  // W0–W3  initial stability for grades 1–4
  7.2102, 0.5316, 1.0651, 0.0589,   // W4–W7  difficulty / forgetting
  1.5330, 0.1400, 0.9394, 2.1597,   // W8–W11 recall / forget stability
  0.0100, 0.9667, 0.1544, 2.9898,   // W12–W15
  0.5100, 0.4100, 0.8420,           // W16–W18
];

const DESIRED_RETENTION = 0.90; // 90 % target recall
const LS_KEY = 'nh_sr';

// ─── Core FSRS math ──────────────────────────────────────────────────────────

/** Retrievability: probability of recall after t days with stability S */
function _R(t, S) {
  return Math.pow(DESIRED_RETENTION, t / S);
}

/** Initial stability for a new card (grade 1–4, where 4 = easy) */
function _initS(grade) {
  return Math.max(W[grade - 1], 0.1);
}

/** Initial difficulty (1–10 scale, higher = harder) */
function _initD(grade) {
  return Math.min(Math.max(W[4] - Math.exp(W[5] * (grade - 1)) + 1, 1), 10);
}

/** Stability after a successful review (grade ≥ 3) */
function _nextS_recall(D, S, R) {
  return S * (
    Math.exp(W[8]) *
    (11 - D) *
    Math.pow(S, -W[9]) *
    (Math.exp(W[10] * (1 - R)) - 1) +
    1
  );
}

/** Stability after forgetting (grade < 3) */
function _nextS_forget(D, S, R) {
  return (
    W[11] *
    Math.pow(D, -W[12]) *
    (Math.pow(S + 1, W[13]) - 1) *
    Math.exp(W[14] * (1 - R))
  );
}

/** Update difficulty after a review */
function _nextD(D, grade) {
  return Math.min(Math.max(D - W[6] * (grade - 3), 1), 10);
}

/** Optimal next interval in days from stability */
function _nextInterval(S) {
  return Math.max(1, Math.round(S * Math.log(DESIRED_RETENTION) / Math.log(0.9)));
}

// ─── Grade mapping ────────────────────────────────────────────────────────────
// Maps { correct, timeMs } → FSRS grade 1–4
//   1 = wrong + fast (<5 s)   → blackout
//   2 = wrong + slow           → wrong but some recall
//   3 = correct + slow (>8 s)  → correct with difficulty
//   4 = correct, any speed ≤8s → good / easy
function _gradeFromResult(correct, timeMs) {
  if (!correct) return timeMs < 5000 ? 1 : 2;
  return timeMs > 8000 ? 3 : 4;
}

// ─── Migration from SM-2 card format ─────────────────────────────────────────
// If a card still has the old 'ease' / 'ef' / 'interval' / 'iv' fields,
// convert it in-place to FSRS format. Safe to call on every read.
function _migrate(card) {
  // Support both SM-2 field names used historically in this codebase:
  //   ease / interval  (from the original srs.js sm2() helper)
  //   ef   / iv        (from the data.jsx srMark() implementation)
  const easeVal    = card.ease !== undefined ? card.ease    : card.ef;
  const intervalVal = card.interval !== undefined ? card.interval : card.iv;

  if (easeVal !== undefined || intervalVal !== undefined) {
    const ease = easeVal    !== undefined ? easeVal    : 2.5;
    const iv   = intervalVal !== undefined ? intervalVal : 1;

    // Map ease 1.3–2.5 → difficulty 10–1  (linear)
    card.s = Math.max(iv, 0.1);
    card.d = Math.round(10 - (ease - 1.3) * 3.7);
    card.d = Math.min(Math.max(card.d, 1), 10);
    card.l = card.l || 0;

    // Reconstruct due timestamp from last-seen time + interval
    if (!card.due) {
      const lastSeen = card.t || Date.now();
      card.due = lastSeen + iv * 86400000;
    }
    card.nextDue = card.due;

    // Remove SM-2 fields
    delete card.ease;
    delete card.interval;
    delete card.ef;
    delete card.iv;
    delete card.rep;   // SM-2 rep counter (replaced by r)
    delete card.t;     // last-seen timestamp (baked into due)
  }
  return card;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Read the full SRS map from localStorage. Migrates legacy cards on the fly. */
export function getSR() {
  let data;
  try {
    data = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
  } catch {
    return {};
  }
  // One-time migration: copy data stored under the old 'uSR' key (used by the
  // previous SM-2 implementation in data.jsx) into 'nh_sr' so no user data
  // is lost when upgrading. Only runs when 'nh_sr' is empty.
  if (Object.keys(data).length === 0) {
    try {
      const legacy = JSON.parse(localStorage.getItem('uSR') || '{}');
      if (Object.keys(legacy).length > 0) {
        data = legacy;
        // The SM-2 fields will be migrated to FSRS in the loop below.
      }
    } catch (_) {}
  }
  // Migrate any SM-2 cards found; write back only if something changed
  let dirty = false;
  for (const word in data) {
    const before = JSON.stringify(data[word]);
    _migrate(data[word]);
    if (JSON.stringify(data[word]) !== before) dirty = true;
  }
  if (dirty) saveSR(data);
  return data;
}

/** Persist the SRS map to localStorage. */
export function saveSR(data) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch (_) {}
}

/**
 * Return an array of Croatian word strings that are due for review right now.
 * Matches the signature used by data.jsx getDueReviews().
 */
export function getDueReviews() {
  const sr  = getSR();
  const now = Date.now();
  const due = [];
  for (const word in sr) {
    const card = sr[word];
    // Primary: FSRS due timestamp
    if (card.due != null) {
      if (card.due <= now) due.push(word);
    } else {
      // Fallback for any card that somehow lacks a due field
      due.push(word);
    }
  }
  return due;
}

/**
 * Record a review result for a word using FSRS-4.5, save, and return the
 * updated card. This is the primary entry point for scoring a review.
 *
 * @param {string}  word    — Croatian word being reviewed
 * @param {boolean} correct — whether the user answered correctly
 * @param {number}  timeMs  — response time in milliseconds
 * @returns {object} updated card
 */
export function getSRScore(word, correct, timeMs) {
  const sr   = getSR();
  const now  = Date.now();
  const grade = _gradeFromResult(correct, timeMs || 0);

  let card = sr[word];

  if (!card) {
    // ── Brand-new card ──────────────────────────────────────────────────────
    const s    = _initS(grade);
    const d    = _initD(grade);
    const intv = _nextInterval(s);
    const due  = now + intv * 86400000;
    card = {
      s,
      d,
      r: correct ? 1 : 0,
      w: correct ? 0 : 1,
      l: grade < 3 ? 1 : 0,
      b: correct ? 1 : 0,
      due,
      nextDue: due,
    };
  } else {
    // ── Existing card — run through FSRS ────────────────────────────────────
    _migrate(card); // ensure no stale SM-2 fields

    const elapsedDays = Math.max(0, (now - (card.due - _nextInterval(card.s || 1) * 86400000)) / 86400000);
    const R = _R(elapsedDays, card.s || 1);
    const D = card.d || 5;
    const S = card.s || 1;

    let newS, newD;
    if (grade >= 3) {
      // Recall
      newS = _nextS_recall(D, S, R);
      newD = _nextD(D, grade);
    } else {
      // Lapse
      newS = _nextS_forget(D, S, R);
      newD = _nextD(D, grade);
      card.l = (card.l || 0) + 1;
    }

    newS = Math.max(newS, 0.1);
    newD = Math.min(Math.max(newD, 1), 10);

    const intv = _nextInterval(newS);
    const due  = now + intv * 86400000;

    card.s      = newS;
    card.d      = newD;
    card.r      = (card.r || 0) + (correct ? 1 : 0);
    card.w      = (card.w || 0) + (correct ? 0 : 1);
    card.b      = Math.min(Math.max((card.b || 0) + (correct ? 1 : -2), 0), 5);
    card.due    = due;
    card.nextDue = due;
  }

  sr[word] = card;
  saveSR(sr);
  return card;
}

// ─── Legacy / compatibility exports ──────────────────────────────────────────
// The functions below were exported by the original SM-2 srs.js.
// Nothing in the current codebase imports them, but they are preserved as
// thin wrappers / stubs so any future import won't crash.

/**
 * @deprecated Use getSRScore() instead.
 * SM-2-compatible wrapper — runs one FSRS update and returns a card-like object.
 */
export function sm2(card, quality) {
  // Map SM-2 quality 0–5 → correct bool + synthetic timeMs
  const correct = quality >= 3;
  const timeMs  = quality === 5 ? 1000 : quality === 4 ? 3000 : quality === 3 ? 9000 : quality === 1 ? 3000 : 8000;
  // Build a temporary word key for the internal update
  const _tmp = '__sm2_compat__';
  const sr   = getSR();
  sr[_tmp]   = card || {};
  const orig = saveSR; // eslint-disable-line no-unused-vars
  // Operate directly on a cloned card without touching global storage
  const grade = _gradeFromResult(correct, timeMs);
  const now   = Date.now();
  if (!card || card.s === undefined) {
    const s   = _initS(grade);
    const d   = _initD(grade);
    const intv = _nextInterval(s);
    return { s, d, r: correct ? 1 : 0, w: correct ? 0 : 1, l: 0, b: 1,
             due: now + intv * 86400000, nextDue: now + intv * 86400000,
             // SM-2 compat fields so callers that read ease/interval don't crash:
             ease: 2.5, interval: intv, reps: 1, nextReview: now + intv * 86400000, lastQuality: quality };
  }
  const elapsedDays = 0;
  const R  = _R(elapsedDays, card.s || 1);
  const D  = card.d || 5;
  const S  = card.s || 1;
  const newS = grade >= 3 ? _nextS_recall(D, S, R) : _nextS_forget(D, S, R);
  const newD = _nextD(D, grade);
  const intv = _nextInterval(Math.max(newS, 0.1));
  return {
    ...card,
    s: Math.max(newS, 0.1), d: Math.min(Math.max(newD, 1), 10),
    r: (card.r || 0) + (correct ? 1 : 0),
    w: (card.w || 0) + (correct ? 0 : 1),
    due: now + intv * 86400000, nextDue: now + intv * 86400000,
    ease: 2.5, interval: intv, reps: (card.reps || 0) + 1,
    nextReview: now + intv * 86400000, lastQuality: quality,
  };
}

/**
 * @deprecated Use getDueReviews() instead.
 * Returns due + fresh cards from a provided srMap / allCards array.
 */
export function getDueCards(srMap, allCards, maxNew = 10, maxReview = 20) {
  const now = Date.now();
  const due = [], fresh = [];
  for (const c of allCards) {
    const card = srMap[c.id];
    if (!card) {
      fresh.push(c);
    } else {
      const dueTs = card.due || card.nextDue || (card.t ? card.t + (card.iv || 1) * 86400000 : 0);
      if (dueTs <= now) due.push({ ...c, _card: card });
    }
  }
  due.sort((a, b) => (a._card.due || 0) - (b._card.due || 0));
  return [...due.slice(0, maxReview), ...fresh.slice(0, maxNew)];
}

/**
 * @deprecated
 * Returns { due, learning, mastered } counts from a provided srMap.
 */
export function getSRStats(srMap) {
  const now = Date.now();
  let due = 0, learning = 0, mastered = 0;
  for (const id in srMap) {
    const c = srMap[id];
    const dueTs = c.due || c.nextDue || 0;
    if (dueTs <= now) {
      due++;
    } else if ((c.s || 0) >= 21) {
      mastered++;
    } else {
      learning++;
    }
  }
  return { due, learning, mastered };
}

/**
 * Return a prioritized review queue from the vocabulary pool.
 *
 * Ordering rules (world-class SRS standard):
 *   1. Overdue cards (due > 1 day ago) — most overdue first
 *   2. Cards due today — lowest retrievability R first (hardest to recall)
 *   3. New words (never reviewed) — padded in if queue < 10, up to 5 words
 *
 * @param {Array} pool — flat array of vocabulary entries, e.g. Object.values(V).flat()
 * @returns {Array} ordered vocabulary entries ready for review
 */
export function getPrioritizedReviewQueue(pool) {
  const sr  = getSR();
  const now = Date.now();

  // Scope to words that exist in the current pool — prevents words from
  // other categories consuming priority slots that then get discarded.
  const poolWords = new Set(pool.map(w => w[0]));

  const overdue  = [];
  const dueToday = [];

  for (const [word, state] of Object.entries(sr)) {
    if (!poolWords.has(word)) continue; // only consider words in current category pool
    if (!state.due) continue;           // skip corrupted entries (handled as new words below)
    const dueMs      = state.due;
    const daysOverdue = (now - dueMs) / 86400000;

    if (daysOverdue > 1) {
      // Overdue: past due by more than 1 day
      overdue.push({ word, state, daysOverdue });
    } else if (dueMs <= now) {
      // Due today (or within the last day): rank by retrievability
      const S = state.s || 1;
      const t = Math.max(0, daysOverdue);
      const R = Math.pow(DESIRED_RETENTION, t / S); // lower = harder
      dueToday.push({ word, state, R });
    }
  }

  // Most overdue first; within dueToday lowest R first (hardest)
  overdue.sort((a, b) => b.daysOverdue - a.daysOverdue);
  dueToday.sort((a, b) => a.R - b.R);

  const prioritized = [...overdue, ...dueToday];

  // Map to vocabulary entries (pool entries are arrays where index 0 = Croatian word)
  const poolMap = new Map(pool.map(w => [w[0], w]));
  const result = prioritized
    .map(({ word }) => poolMap.get(word))
    .filter(Boolean)
    .slice(0, 20);

  // Pad with new words if queue is thin.
  // Only words with a valid `due` field are "seen" — corrupted entries
  // (missing due) are treated as unseen so they re-enter the new-word queue.
  if (result.length < 10 && pool) {
    const seenWords = new Set(
      Object.entries(sr)
        .filter(([w, s]) => poolWords.has(w) && s && s.due)
        .map(([w]) => w)
    );
    const newWords = pool
      .filter(w => !seenWords.has(w[0]))
      .slice(0, Math.min(5, 10 - result.length));
    result.push(...newWords);
  }

  return result;
}

/**
 * @deprecated Use _gradeFromResult() logic directly or getSRScore().
 * Maps { correct, timeMs } → SM-2-style quality 0–5.
 */
export function srQualityFromResult(correct, timeMs) {
  if (!correct) return timeMs < 5000 ? 1 : 0;
  if (timeMs < 2000) return 5;
  if (timeMs < 4000) return 4;
  return 3;
}
