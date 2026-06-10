// src/lib/conjugation/category.ts
// Pure mapping from an adaptive SkillCategory to conjugation drill content.
import type { SkillCategory } from '../adaptive';
import type { FormType, ConjVerb, ConjCell, Gender } from './types';
import { formFor } from './forms';
import { selectDailySet } from './dailySet';
import { buildCardKey } from './cardKey';

export type Cefr = 'A1' | 'A2' | 'B1' | 'B2';

const ORDER: Cefr[] = ['A1', 'A2', 'B1', 'B2'];
export function cefrRank(c: Cefr): number {
  return ORDER.indexOf(c);
}

const CATEGORY_FORM: Partial<Record<SkillCategory, FormType>> = {
  'present-tense': 'present',
  'past-tense': 'past',
  'future-tense': 'future1',
  conditional: 'conditional',
  // Aspect is drilled via present-tense forms over aspect-pair verbs.
  'aspect-imperfective': 'present',
  'aspect-perfective': 'present',
  'aspect-negation': 'present',
};

export function categoryToFormType(category: SkillCategory): FormType | null {
  return CATEGORY_FORM[category] ?? null;
}

const ASPECT_CATEGORIES: ReadonlySet<SkillCategory> = new Set([
  'aspect-imperfective',
  'aspect-perfective',
  'aspect-negation',
]);

interface CellsOpts {
  size?: number;
  daySeed?: number;
  dueKeys?: Set<string>;
}

// Build the ordered drill queue for a surfaced session category, gated to the
// learner's CEFR and prioritized by spaced-repetition due-ness.
export function cellsForCategory(
  category: SkillCategory,
  verbs: ConjVerb[],
  userCefr: Cefr,
  opts: CellsOpts = {},
): ConjCell[] {
  const formType = categoryToFormType(category);
  if (!formType) return [];
  const { size = 12, daySeed = 0, dueKeys = new Set<string>() } = opts;

  // Drill the full level-appropriate verb pool (not just curriculum-unit examples),
  // so any verb added to VERBS with the right cefr + forms surfaces automatically.
  const isAspect = ASPECT_CATEGORIES.has(category);
  const GENDERS: Gender[] = ['m', 'f', 'n'];
  const candidates: ConjCell[] = [];
  const seen = new Set<string>();
  for (const v of verbs) {
    if (cefrRank(v.cefr as Cefr) > cefrRank(userCefr)) continue;
    if (isAspect && !v.pair) continue; // aspect categories drill aspect-pair verbs only
    const persons = formType === 'imperative' ? 3 : 6;
    for (let p = 0; p < persons; p++) {
      if (formType === 'past') {
        // Only past is gendered (PastForms m/f/n). Conditional is masculine-baseline flat.
        for (const g of GENDERS) {
          const cell: ConjCell = { inf: v.inf, formType, personIdx: p, gender: g };
          if (formFor(v, cell) == null) continue;
          const k = buildCardKey(cell);
          if (seen.has(k)) continue;
          seen.add(k);
          candidates.push(cell);
        }
      } else {
        const cell: ConjCell = { inf: v.inf, formType, personIdx: p };
        if (formFor(v, cell) == null) continue;
        const k = buildCardKey(cell);
        if (seen.has(k)) continue;
        seen.add(k);
        candidates.push(cell);
      }
    }
  }

  return selectDailySet({ candidates, dueKeys, size, daySeed });
}
