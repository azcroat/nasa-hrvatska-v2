/**
 * dailyInput — the comprehensible-input spine (Content-Rec #6).
 *
 * Fluency is driven by a steady daily dose of input the learner can *mostly*
 * understand (Krashen's i+1). The listening (#1) and reading (#2) curricula
 * already compute the learner's next level-appropriate unit, but they live in
 * separate tabs. This aggregates them into one "today's input" recommendation
 * for the Home tab so comprehensible input is a first-class daily habit — the
 * backbone that threads the two input surfaces together.
 *
 * Pure aggregation of the existing curricula at the learner's earned CEFR
 * (getGenerationCefr) — no new content. Per-day engagement is a light localStorage
 * flag set when the learner opens each surface from the card.
 */
import { localDateStr } from './dateUtils';
import { getGenerationCefr } from './cefrCertification';
import { getNextListeningUnit } from './listeningCurriculum';
import { getNextReadingUnit } from './readingCurriculum';

export type InputKind = 'listening' | 'reading';

function dayKey(kind: InputKind): string {
  return `nh_daily_input_${kind}_${localDateStr()}`;
}

/** Whether the learner has opened this input surface from the card today. */
export function isDailyInputDone(kind: InputKind): boolean {
  try {
    return localStorage.getItem(dayKey(kind)) === '1';
  } catch {
    return false;
  }
}

/** Mark that the learner engaged this input surface today (best-effort). */
export function markDailyInput(kind: InputKind): void {
  try {
    localStorage.setItem(dayKey(kind), '1');
  } catch {
    /* localStorage unavailable — non-fatal */
  }
}

export interface DailyInputItem {
  title: string;
  subtitle: string;
  doneToday: boolean;
}

export interface DailyInput {
  level: string;
  listening: DailyInputItem;
  reading: DailyInputItem;
}

interface StatsLike {
  xp?: number;
  lc?: number;
  gc?: number;
  vs?: unknown;
}

/**
 * Today's comprehensible-input dose: the next listening unit and next reading
 * passage at the learner's earned CEFR, each with a per-day engagement flag.
 * Always returns both items (falls back to a generic label when a curriculum
 * level is fully complete) so the card is always actionable.
 */
export function getDailyInput(stats?: StatsLike): DailyInput {
  const level = getGenerationCefr(stats);
  const lu = getNextListeningUnit(level);
  const vs = Array.isArray(stats?.vs) ? (stats!.vs as string[]) : [];
  const ru = getNextReadingUnit(level, vs);
  return {
    level,
    listening: {
      title: lu ? lu.title : 'Listening practice',
      subtitle: lu ? lu.desc : 'Fresh Croatian audio at your level',
      doneToday: isDailyInputDone('listening'),
    },
    reading: {
      title: ru ? ru.title : 'Graded reading',
      subtitle: ru ? ru.tEn || 'A graded passage at your level' : 'A graded passage at your level',
      doneToday: isDailyInputDone('reading'),
    },
  };
}
