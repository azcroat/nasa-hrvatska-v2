/**
 * wordOfDay.ts — Daily Word of the Day, consistent for all users on the same date.
 *
 * Uses WORD_OF_DAY_POOL (365 curated entries) for a full year of unique words.
 * Falls back to V vocabulary pool if the curated pool is unavailable.
 * Word format: { hr, en, pos, note } from curated pool, or [hr, en, example] from V.
 */
import { WORD_OF_DAY_POOL } from '../data/daily-content.js';

export function getWordOfDay(): [string, string, string] | null {
  try {
    // Day-of-year as seed for consistent daily word across all users.
    // Use Date.UTC for both endpoints so DST transitions (which shorten/lengthen a day
    // by 1 hour) cannot cause Math.floor to return the same value on two consecutive days.
    const now = new Date();
    const dayOfYear = Math.floor(
      (Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) -
        Date.UTC(now.getFullYear(), 0, 1)) /
        86400000,
    );

    if (WORD_OF_DAY_POOL?.length) {
      const entry = WORD_OF_DAY_POOL[dayOfYear % WORD_OF_DAY_POOL.length] as
        | { hr: string; en: string; pos?: string; note?: string }
        | undefined;
      // Normalize to [hr, en, note] array format used by HomeTab
      if (entry) return [entry.hr, entry.en, entry.note || entry.pos || ''];
    }
    return null;
  } catch {
    return null;
  }
}
