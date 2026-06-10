// src/lib/conjugation/distractors.ts
import type { ConjVerb, ConjCell } from './types';
import { formFor } from './forms';

interface Args {
  verb: ConjVerb;
  cell: ConjCell;
  correct: string;
  allVerbs: ConjVerb[];
  rng?: () => number; // injectable for deterministic tests; defaults to Math.random
}

// Wrong-class ending swap: the classic learner error (applying -am to an -em verb, etc.).
function classConfusion(verb: ConjVerb, cell: ConjCell): string | null {
  if (cell.formType !== 'present' || !verb.present) return null;
  const form = verb.present[cell.personIdx];
  if (!form) return null;
  // crude but effective: swap the characteristic vowel of the ending
  if (verb.klass === 'a-em') return form.replace(/e(m|š|mo|te)?$/, 'a$1'); // pišem→pišam
  if (verb.klass === 'a-am') return form.replace(/a(m|š|mo|te)?$/, 'e$1');
  if (verb.klass === 'i-im') return form.replace(/i(m|š|mo|te)?$/, 'e$1');
  return null;
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export function buildDistractors(args: Args): string[] {
  const { verb, cell, correct, allVerbs } = args;
  const rng = args.rng ?? Math.random;
  const out: string[] = [];
  const seen = new Set<string>([correct]);
  const add = (s: string | null | undefined) => {
    if (s && !seen.has(s)) {
      seen.add(s);
      out.push(s);
    }
  };

  // Priority 1: wrong person, same verb + form-type.
  const personCount = cell.formType === 'imperative' ? 3 : 6;
  const otherPersons = shuffle(
    Array.from({ length: personCount }, (_, i) => i).filter((i) => i !== cell.personIdx),
    rng,
  );
  for (const pi of otherPersons) {
    add(formFor(verb, { ...cell, personIdx: pi }));
    if (out.length >= 3) return out.slice(0, 3);
  }

  // Priority 2: wrong class ending (the classic error).
  add(classConfusion(verb, cell));
  if (out.length >= 3) return out.slice(0, 3);

  // Priority 3: wrong aspect partner's same cell (if the partner is in the dataset).
  if (verb.pair) {
    const partner = allVerbs.find((v) => v.inf === verb.pair);
    if (partner) add(formFor(partner, cell));
  }
  if (out.length >= 3) return out.slice(0, 3);

  // Priority 4 (fallback): forms of other verbs, same cell.
  for (const v of shuffle(
    allVerbs.filter((v) => v.inf !== verb.inf),
    rng,
  )) {
    add(formFor(v, cell));
    if (out.length >= 3) break;
  }
  return out.slice(0, 3);
}
