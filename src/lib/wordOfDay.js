/**
 * wordOfDay.js — Daily Word of the Day, consistent for all users on the same date.
 *
 * Uses the day-of-year as a deterministic index into the full vocabulary pool.
 * Word format: [hr, en] or [hr, en, phonetic/example]
 */
import { V } from '../data.jsx';

export function getWordOfDay() {
  try {
    const allWords = Object.values(V).flat();
    if (!allWords.length) return null;

    // Filter to entries that have at least [hr, en]
    const validWords = allWords.filter(w => Array.isArray(w) && w[0] && w[1]);
    if (!validWords.length) return null;

    // Day-of-year as seed for consistent daily word across all users.
    // Use Jan 1 (month=0, day=1) so day 1 = Jan 1, matching getCityOfDay().
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((now - start) / 86400000);
    const idx = dayOfYear % validWords.length;
    return validWords[idx]; // [hr, en] or [hr, en, example]
  } catch {
    return null;
  }
}
