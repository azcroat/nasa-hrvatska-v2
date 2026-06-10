// src/lib/conjugation/category.ts
// Pure mapping from an adaptive SkillCategory to conjugation drill content.
import type { SkillCategory } from '../adaptive';
import type { FormType, ConjVerb, ConjCell } from './types';
import { UNITS } from './curriculum';
import { cellsForUnit } from './cells';
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

  const isAspect = ASPECT_CATEGORIES.has(category);
  const units = UNITS.filter((u) => {
    if (!u.formTypes.includes(formType)) return false;
    if (cefrRank(u.cefr as Cefr) > cefrRank(userCefr)) return false;
    // Aspect categories drill only the aspect-themed units (their ids start with 'aspect').
    if (isAspect && !u.id.startsWith('aspect')) return false;
    return true;
  });

  const candidates: ConjCell[] = [];
  const seen = new Set<string>();
  for (const u of units) {
    for (const cell of cellsForUnit(u, verbs)) {
      if (cell.formType !== formType) continue; // a unit may declare multiple form types
      const k = buildCardKey(cell);
      if (seen.has(k)) continue;
      seen.add(k);
      candidates.push(cell);
    }
  }

  return selectDailySet({ candidates, dueKeys, size, daySeed });
}
