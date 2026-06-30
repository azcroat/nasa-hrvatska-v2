import { getUserCefr, cefrRank, isUnlocked } from '../cefr';
import { getContentUnlockLevel } from '../cefrCertification';
import { PLACE } from '../../data/exercises.js';

// PLACE is the MC vocab/grammar pool ({q,o,c,d,cefr?,skill}, 85 valid entries):
// 21 at difficulty 1, 19 at 2, 45 at 3. The difficulty ceiling scales with the
// user's level (see selectQuestions) — A1 sees d1, A2 sees d≤2, B1+ sees d≤3 —
// so the 45 hardest questions are actually reachable (they were dead before).
// Comfortably >= the 9 a ride needs at every level.

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
  /** Optional explicit CEFR gate (e.g. 'B2' grammar items) — finer than `d`. */
  cefr?: string;
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

// Fisher-Yates using the Web Crypto RNG. The randomness here is not
// security-sensitive (it only shuffles quiz-question order), but using
// crypto.getRandomValues avoids the weak-RNG static-analysis flag while
// behaving identically for our purposes.
function shuffle<T>(a: T[]): T[] {
  const b = [...a];
  const rnd = new Uint32Array(1);
  for (let i = b.length - 1; i > 0; i--) {
    crypto.getRandomValues(rnd);
    const j = rnd[0]! % (i + 1);
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
  const userCefr = getContentUnlockLevel(getUserCefr(opts.xp, opts.lc, opts.gc));
  // Difficulty ceiling scales with level (Session-Rec #5). The old code hard-
  // capped at d≤2, so all 45 difficulty-3 questions (53% of PLACE) were NEVER
  // served — not even to C1/C2. Now: A1 → d1, A2 → d≤2, B1+ → d≤3.
  const rank = cefrRank(userCefr);
  const maxDifficulty = rank >= cefrRank('B1') ? 3 : rank >= cefrRank('A2') ? 2 : 1;
  const pool = (PLACE as RawExercise[])
    .filter(isValid)
    .filter((e) => (e.d ?? 1) <= maxDifficulty)
    // Respect an explicit CEFR tag (the B2-tagged grammar items) so raising the
    // difficulty ceiling can't leak above-level questions to a B1 user — the tag
    // gates finer than the coarse `d` tier.
    .filter((e) => !e.cefr || isUnlocked(e.cefr, userCefr));
  const picked = shuffle(pool).slice(0, opts.count);
  const mapped = picked.map((raw, i) =>
    opts._debugReturnRaw
      ? ({
          ...toGameQuestion(raw, i),
          _d: raw.d ?? 1,
          _cefr: raw.cefr ?? null,
        } as GameQuestion & { _d: number; _cefr: string | null })
      : toGameQuestion(raw, i),
  );
  return mapped;
}
