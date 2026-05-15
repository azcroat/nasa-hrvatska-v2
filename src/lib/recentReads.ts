// src/lib/recentReads.ts
// SP7: tracks completed story IDs so the recommender can avoid recently-read
// stories for 7 days (hard exclusion) and softly penalize them for 30 days.

const KEY = 'nh_recent_reads';
const HARD_EXCLUSION_DAYS = 7;
const SOFT_PENALTY_DAYS = 30;
const MAX_ENTRIES = 60;

interface RecentReadEntry {
  id: string;
  at: number;
}

function _read(): RecentReadEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function recordStoryRead(id: string): void {
  if (!id || typeof id !== 'string') return;
  try {
    const arr = _read();
    const today = new Date().toISOString().slice(0, 10);
    const exists = arr.some(
      (e) => e.id === id && new Date(e.at).toISOString().slice(0, 10) === today,
    );
    if (!exists) arr.unshift({ id, at: Date.now() });
    const capped = arr.slice(0, MAX_ENTRIES);
    localStorage.setItem(KEY, JSON.stringify(capped));
  } catch {
    // QuotaExceededError or localStorage unavailable — non-fatal
  }
}

/** Hard exclusion list: story IDs read within the last 7 days. */
export function getRecentReads(): string[] {
  const cutoff = Date.now() - HARD_EXCLUSION_DAYS * 24 * 60 * 60 * 1000;
  return _read()
    .filter((e) => typeof e?.at === 'number' && e.at >= cutoff)
    .map((e) => e.id);
}

/** Soft penalty list: story IDs read within the last 30 days. */
export function getRecentReadsExtended(): string[] {
  const cutoff = Date.now() - SOFT_PENALTY_DAYS * 24 * 60 * 60 * 1000;
  return _read()
    .filter((e) => typeof e?.at === 'number' && e.at >= cutoff)
    .map((e) => e.id);
}
