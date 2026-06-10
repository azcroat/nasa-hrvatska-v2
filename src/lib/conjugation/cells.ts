// src/lib/conjugation/cells.ts
import type { ConjVerb, ConjCell, FormType, Gender } from './types';
import type { ConjUnit } from './curriculum';
import { parseCardKey } from './cardKey';
import { formFor } from './forms';

const GENDERS: Gender[] = ['m', 'f', 'n'];

export function cellsForUnit(
  unit: Pick<ConjUnit, 'formTypes' | 'verbs'>,
  allVerbs: ConjVerb[],
): ConjCell[] {
  const byInf = new Map(allVerbs.map((v) => [v.inf, v]));
  const out: ConjCell[] = [];
  for (const inf of unit.verbs) {
    const verb = byInf.get(inf);
    if (!verb) continue;
    for (const ft of unit.formTypes) {
      const personCount = ft === 'imperative' ? 3 : 6;
      for (let p = 0; p < personCount; p++) {
        if (ft === 'past') {
          for (const g of GENDERS) {
            const cell: ConjCell = { inf, formType: ft as FormType, personIdx: p, gender: g };
            if (formFor(verb, cell) != null) out.push(cell);
          }
        } else {
          const cell: ConjCell = { inf, formType: ft as FormType, personIdx: p };
          if (formFor(verb, cell) != null) out.push(cell);
        }
      }
    }
  }
  return out;
}

// SRMap value shape we rely on: { nextDue: number } (see src/lib/srs.ts).
export function dueConjKeys(sr: Record<string, { nextDue?: number }>, now: number): Set<string> {
  const due = new Set<string>();
  for (const key in sr) {
    if (!parseCardKey(key)) continue;
    const nd = sr[key]?.nextDue ?? 0;
    if (nd <= now) due.add(key);
  }
  return due;
}
