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
  0.4072,
  1.1829,
  3.1262,
  15.4722, // W0–W3  initial stability for grades 1–4
  7.2102,
  0.5316,
  1.0651,
  0.0589, // W4–W7  difficulty / forgetting
  1.533,
  0.14,
  0.9394,
  2.1597, // W8–W11 recall / forget stability
  0.01,
  0.9667,
  0.1544,
  2.9898, // W12–W15
  0.51,
  0.41,
  0.842, // W16–W18
];

const DESIRED_RETENTION = 0.9; // 90 % target recall
const LS_KEY = 'nh_sr';

// ─── Card type ────────────────────────────────────────────────────────────────
interface SRCard {
  s: number;
  d: number;
  r: number;
  w: number;
  l: number;
  b: number;
  due: number;
  nextDue: number;
  // Legacy SM-2 fields (present before migration)
  ease?: number;
  interval?: number;
  ef?: number;
  iv?: number;
  rep?: number;
  reps?: number;
  t?: number;
}

type SRMap = Record<string, SRCard>;

// ─── Core FSRS math ──────────────────────────────────────────────────────────

/** Retrievability: probability of recall after t days with stability S */
function _R(t: number, S: number): number {
  return Math.pow(DESIRED_RETENTION, t / S);
}

/** Initial stability for a new card (grade 1–4, where 4 = easy) */
function _initS(grade: number): number {
  return Math.max(W[grade - 1], 0.1);
}

/** Initial difficulty (1–10 scale, higher = harder) */
function _initD(grade: number): number {
  return Math.min(Math.max(W[4] - Math.exp(W[5] * (grade - 1)) + 1, 1), 10);
}

/** Stability after a successful review (grade ≥ 3) */
function _nextS_recall(D: number, S: number, R: number): number {
  return S * (Math.exp(W[8]) * (11 - D) * Math.pow(S, -W[9]) * (Math.exp(W[10] * (1 - R)) - 1) + 1);
}

/** Stability after forgetting (grade < 3) */
function _nextS_forget(D: number, S: number, R: number): number {
  return W[11] * Math.pow(D, -W[12]) * (Math.pow(S + 1, W[13]) - 1) * Math.exp(W[14] * (1 - R));
}

/** Update difficulty after a review */
function _nextD(D: number, grade: number): number {
  return Math.min(Math.max(D - W[6] * (grade - 3), 1), 10);
}

/** Optimal next interval in days from stability (capped at 365 days) */
function _nextInterval(S: number): number {
  return Math.min(365, Math.max(1, Math.round((S * Math.log(DESIRED_RETENTION)) / Math.log(0.9))));
}

// ─── Grade mapping ────────────────────────────────────────────────────────────
// Maps { correct, timeMs } → FSRS grade 1–4
//   1 = wrong + fast (<5 s)   → blackout
//   2 = wrong + slow           → wrong but some recall
//   3 = correct + slow (>8 s)  → correct with difficulty
//   4 = correct, any speed ≤8s → good / easy
function _gradeFromResult(correct: boolean, timeMs: number): number {
  if (!correct) return timeMs < 5000 ? 1 : 2;
  return timeMs > 8000 ? 3 : 4;
}

// ─── Migration from SM-2 card format ─────────────────────────────────────────
function _migrate(card: SRCard): SRCard {
  const easeVal = card.ease !== undefined ? card.ease : card.ef;
  const intervalVal = card.interval !== undefined ? card.interval : card.iv;

  if (easeVal !== undefined || intervalVal !== undefined) {
    const ease = Math.min(Math.max(easeVal !== undefined ? easeVal : 2.5, 1.3), 2.5);
    const iv = intervalVal !== undefined ? intervalVal : 1;

    card.s = Math.max(iv, 0.1);
    card.d = Math.round(10 - (ease - 1.3) * 3.7);
    card.d = Math.min(Math.max(card.d, 1), 10);
    card.l = card.l || 0;

    if (!card.due) {
      const lastSeen = card.t || Date.now();
      card.due = lastSeen + iv * 86400000;
    }
    card.nextDue = card.due;

    delete card.ease;
    delete card.interval;
    delete card.ef;
    delete card.iv;
    delete card.rep;
    delete card.t;
  }
  return card;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Read the full SRS map from localStorage. Migrates legacy cards on the fly. */
export function getSR(): SRMap {
  let data: SRMap;
  try {
    data = JSON.parse(localStorage.getItem(LS_KEY) || '{}') as SRMap;
  } catch {
    return {};
  }
  if (Object.keys(data).length === 0) {
    try {
      const legacy = JSON.parse(localStorage.getItem('uSR') || '{}') as SRMap;
      if (Object.keys(legacy).length > 0) {
        data = legacy;
      }
    } catch (_) {}
  }
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
export function saveSR(data: SRMap): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch (_) {}
}

/**
 * Silently add a word to SRS as a brand-new card if it isn't already tracked.
 */
export function addWordToSRS(word: string): void {
  if (!word || typeof word !== 'string') return;
  const w = word.trim();
  if (!w) return;
  try {
    const sr = getSR();
    if (sr[w]) return;
    const s = _initS(3);
    const d = _initD(3);
    const intv = _nextInterval(s);
    const due = Date.now() + intv * 86400000;
    sr[w] = { s, d, r: 0, w: 0, l: 0, b: 1, due, nextDue: due };
    saveSR(sr);
  } catch (_) {}
}

/**
 * Return an array of Croatian word strings that are due for review right now.
 */
export function getDueReviews(): string[] {
  const sr = getSR();
  const now = Date.now();
  const due: string[] = [];
  // Cards with no due date are legitimately new (never reviewed) and should be
  // shown, but we cap them at 15 per session to prevent queue flooding if a
  // user imports a large word list or legacy SM-2 data wasn't fully migrated.
  let newCardBudget = 15;
  for (const word in sr) {
    const card = sr[word];
    if (card.due != null) {
      if (card.due <= now) due.push(word);
    } else if (newCardBudget > 0) {
      due.push(word);
      newCardBudget--;
    }
  }
  for (let i = due.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [due[i], due[j]] = [due[j], due[i]];
  }
  return due;
}

/**
 * Record a review result for a word using FSRS-4.5, save, and return the updated card.
 */
export function getSRScore(word: string, correct: boolean, timeMs: number): SRCard {
  const sr = getSR();
  const now = Date.now();
  const grade = _gradeFromResult(correct, timeMs || 0);

  let card = sr[word];

  if (!card) {
    const s = _initS(grade);
    const d = _initD(grade);
    const intv = _nextInterval(s);
    const due = now + intv * 86400000;
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
    _migrate(card);

    const lastScheduledMs = card.due - _nextInterval(card.s || 1) * 86400000;
    const elapsedDays = Math.max(0, (now - lastScheduledMs) / 86400000);
    const R = _R(elapsedDays, card.s || 1);
    const D = card.d || 5;
    const S = card.s || 1;

    let newS: number, newD: number;
    if (grade >= 3) {
      newS = _nextS_recall(D, S, R);
      newD = _nextD(D, grade);
    } else {
      newS = _nextS_forget(D, S, R);
      newD = _nextD(D, grade);
      card.l = (card.l || 0) + 1;
    }

    newS = Math.max(newS, 0.1);
    newD = Math.min(Math.max(newD, 1), 10);

    const intv = _nextInterval(newS);
    const due = now + intv * 86400000;

    card.s = newS;
    card.d = newD;
    card.r = (card.r || 0) + (correct ? 1 : 0);
    card.w = (card.w || 0) + (correct ? 0 : 1);
    card.b = Math.min(Math.max((card.b || 0) + (correct ? 1 : -2), 0), 5);
    card.due = due;
    card.nextDue = due;
  }

  sr[word] = card;
  saveSR(sr);
  return card;
}

// ─── Legacy / compatibility exports ──────────────────────────────────────────

/**
 * @deprecated Use getSRScore() instead.
 * SM-2-compatible wrapper — runs one FSRS update and returns a card-like object.
 */
export function sm2(
  card: SRCard | null,
  quality: number,
): SRCard & {
  ease: number;
  interval: number;
  reps: number;
  nextReview: number;
  lastQuality: number;
} {
  const correct = quality >= 3;
  const timeMs =
    quality === 5
      ? 1000
      : quality === 4
        ? 3000
        : quality === 3
          ? 9000
          : quality === 1
            ? 3000
            : 8000;
  const grade = _gradeFromResult(correct, timeMs);
  const now = Date.now();
  if (!card || card.s === undefined) {
    const s = _initS(grade);
    const d = _initD(grade);
    const intv = _nextInterval(s);
    return {
      s,
      d,
      r: correct ? 1 : 0,
      w: correct ? 0 : 1,
      l: 0,
      b: 1,
      due: now + intv * 86400000,
      nextDue: now + intv * 86400000,
      ease: 2.5,
      interval: intv,
      reps: 1,
      nextReview: now + intv * 86400000,
      lastQuality: quality,
    };
  }
  const elapsedDays =
    card.due && card.interval
      ? Math.max(0, (now - (card.due - card.interval * 86400000)) / 86400000)
      : 0;
  const R = _R(elapsedDays, card.s || 1);
  const D = card.d || 5;
  const S = card.s || 1;
  const newS = grade >= 3 ? _nextS_recall(D, S, R) : _nextS_forget(D, S, R);
  const newD = _nextD(D, grade);
  const intv = _nextInterval(Math.max(newS, 0.1));
  return {
    ...card,
    s: Math.max(newS, 0.1),
    d: Math.min(Math.max(newD, 1), 10),
    r: (card.r || 0) + (correct ? 1 : 0),
    w: (card.w || 0) + (correct ? 0 : 1),
    due: now + intv * 86400000,
    nextDue: now + intv * 86400000,
    ease: 2.5,
    interval: intv,
    reps: (card.reps || 0) + 1,
    nextReview: now + intv * 86400000,
    lastQuality: quality,
  };
}

interface VocabEntry {
  id?: string;
  [key: string]: unknown;
}

interface DueCardEntry extends VocabEntry {
  _card: SRCard;
}

/**
 * @deprecated Use getDueReviews() instead.
 */
export function getDueCards(
  srMap: SRMap,
  allCards: VocabEntry[],
  maxNew = 10,
  maxReview = 20,
): (VocabEntry | DueCardEntry)[] {
  const now = Date.now();
  const due: DueCardEntry[] = [];
  const fresh: VocabEntry[] = [];
  for (const c of allCards) {
    const card = c.id ? srMap[c.id as string] : undefined;
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

interface SRStats {
  due: number;
  learning: number;
  mastered: number;
}

/**
 * @deprecated
 */
export function getSRStats(srMap: SRMap): SRStats {
  const now = Date.now();
  let due = 0,
    learning = 0,
    mastered = 0;
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
 */
export function getPrioritizedReviewQueue(pool: unknown[][]): unknown[][] {
  const sr = getSR();
  const now = Date.now();

  const poolWords = new Set(pool.map((w) => w[0] as string));

  const overdue: { word: string; state: SRCard; daysOverdue: number }[] = [];
  const dueToday: { word: string; state: SRCard; R: number }[] = [];

  for (const [word, state] of Object.entries(sr)) {
    if (!poolWords.has(word)) continue;
    if (!state.due) continue;
    const dueMs = state.due;
    const daysOverdue = (now - dueMs) / 86400000;

    if (daysOverdue > 1) {
      overdue.push({ word, state, daysOverdue });
    } else if (dueMs <= now) {
      const S = state.s || 1;
      const t = Math.max(0, daysOverdue);
      const R = Math.pow(DESIRED_RETENTION, t / S);
      dueToday.push({ word, state, R });
    }
  }

  for (let i = overdue.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [overdue[i], overdue[j]] = [overdue[j], overdue[i]];
  }
  for (let i = dueToday.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [dueToday[i], dueToday[j]] = [dueToday[j], dueToday[i]];
  }
  overdue.sort((a, b) => b.daysOverdue - a.daysOverdue);
  dueToday.sort((a, b) => a.R - b.R);

  const prioritized = [...overdue, ...dueToday];

  if (!pool || !pool.length) return [];

  const poolMap = new Map(pool.map((w) => [w[0] as string, w]));
  const result = prioritized
    .map(({ word }) => poolMap.get(word))
    .filter((w): w is unknown[] => Boolean(w))
    .slice(0, 20);

  if (result.length < 10 && pool) {
    const seenWords = new Set(
      Object.entries(sr)
        .filter(([w, s]) => poolWords.has(w) && s && s.due)
        .map(([w]) => w),
    );
    const newWords = pool
      .filter((w) => !seenWords.has(w[0] as string))
      .slice(0, Math.min(5, 10 - result.length));
    result.push(...newWords);
  }

  return result;
}

/**
 * @deprecated Use _gradeFromResult() logic directly or getSRScore().
 */
export function srQualityFromResult(correct: boolean, timeMs: number): number {
  if (!correct) return timeMs < 5000 ? 1 : 0;
  if (timeMs < 2000) return 5;
  if (timeMs < 4000) return 4;
  return 3;
}
