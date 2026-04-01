/**
 * wordOfDay.js — Daily Word of the Day, consistent for all users on the same date.
 *
 * Uses WORD_OF_DAY_POOL (365 curated entries) for a full year of unique words.
 * Falls back to V vocabulary pool if the curated pool is unavailable.
 * Word format: { hr, en, pos, note } from curated pool, or [hr, en, example] from V.
 */
import { WORD_OF_DAY_POOL } from '../data/daily-content.js';

export function getWordOfDay() {
  try {
    // Day-of-year as seed for consistent daily word across all users.
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((now - start) / 86400000);

    if (WORD_OF_DAY_POOL?.length) {
      const entry = WORD_OF_DAY_POOL[dayOfYear % WORD_OF_DAY_POOL.length];
      // Normalize to [hr, en, note] array format used by HomeTab
      if (entry) return [entry.hr, entry.en, entry.note || entry.pos || ''];
    }
    return null;
  } catch {
    return null;
  }
}
