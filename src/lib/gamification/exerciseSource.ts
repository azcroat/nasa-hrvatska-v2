import { getUserCefr, cefrRank } from '../cefr';
import { PLACE } from '../../data/exercises.js';

// PLACE is the MC vocab pool ({q,o,c,d,skill}, ~85 valid entries; ~21 at
// difficulty <=1 for A1, the rest unlock at B1+). Comfortably >= the 9 a ride needs.

export interface GameQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
}

interface RawExercise {
  q: string;
  o: string[];
  c: number;
  d?: number;
  skill?: string;
}

export function toGameQuestion(raw: RawExercise, index: number): GameQuestion {
  return { id: `ex-${index}`, prompt: raw.q, options: raw.o, correctIndex: raw.c };
}

function isValid(raw: RawExercise): boolean {
  return (
    !!raw &&
    typeof raw.q === 'string' &&
    Array.isArray(raw.o) &&
    raw.o.length >= 2 &&
    typeof raw.c === 'number' &&
    raw.c >= 0 &&
    raw.c < raw.o.length
  );
}

function shuffle<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j]!, b[i]!];
  }
  return b;
}

interface SelectOpts {
  xp: number;
  lc: number;
  gc: number;
  count: number;
  _debugReturnRaw?: boolean;
}

export function selectQuestions(opts: SelectOpts): GameQuestion[] {
  const userCefr = getUserCefr(opts.xp, opts.lc, opts.gc);
  const allowDifficulty2 = cefrRank(userCefr) >= cefrRank('B1');
  const pool = (PLACE as RawExercise[])
    .filter(isValid)
    .filter((e) => (e.d ?? 1) <= (allowDifficulty2 ? 2 : 1));
  const picked = shuffle(pool).slice(0, opts.count);
  const mapped = picked.map((raw, i) =>
    opts._debugReturnRaw
      ? ({ ...toGameQuestion(raw, i), _d: raw.d ?? 1 } as GameQuestion & { _d: number })
      : toGameQuestion(raw, i),
  );
  return mapped;
}
