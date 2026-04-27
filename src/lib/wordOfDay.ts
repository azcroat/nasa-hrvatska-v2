/**
 * wordOfDay.ts — Daily Word of the Day and Phrase of the Day.
 * Both are consistent for all users on the same calendar date.
 *
 * Word format returned: { hr, en, ph, cat }
 * Phrase format returned: { hr, en, note }
 */
import { WORD_OF_DAY_POOL, PHRASE_OF_DAY_POOL } from '../data/daily-content.js';

/** Returns the day-of-year index (0-based, UTC-safe). */
function dayOfYear(): number {
  const now = new Date();
  return Math.floor(
    (Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) -
      Date.UTC(now.getFullYear(), 0, 1)) /
      86400000,
  );
}

export interface WordOfDay {
  hr: string;
  en: string;
  /** Phonetic pronunciation guide, e.g. "YAH-boo-kah" */
  ph: string;
  /** Thematic category, e.g. "food", "family", "nature" */
  cat: string;
}

export interface PhraseOfDay {
  hr: string;
  en: string;
  /** Usage/context note, e.g. "Informal — use with friends" */
  note: string;
  /** Phonetic pronunciation guide, e.g. "KAH-koh SEE" (space = word break, hyphen = syllable, UPPERCASE = stressed) */
  ph?: string;
}

export function getWordOfDay(): WordOfDay | null {
  try {
    const pool = WORD_OF_DAY_POOL as Array<{
      hr: string;
      en: string;
      ph?: string;
      cat?: string;
    }>;
    if (!pool?.length) return null;
    const entry = pool[dayOfYear() % pool.length];
    if (!entry) return null;
    return {
      hr: entry.hr,
      en: entry.en,
      ph: entry.ph || '',
      cat: entry.cat || '',
    };
  } catch {
    return null;
  }
}

export function getPhraseOfDay(): PhraseOfDay | null {
  try {
    const pool = PHRASE_OF_DAY_POOL as Array<{
      hr: string;
      en: string;
      note?: string;
    }>;
    if (!pool?.length) return null;
    const entry = pool[dayOfYear() % pool.length];
    if (!entry) return null;
    return {
      hr: entry.hr,
      en: entry.en,
      note: entry.note || '',
      ph: (entry as { ph?: string }).ph || '',
    };
  } catch {
    return null;
  }
}
