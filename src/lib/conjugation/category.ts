// src/lib/conjugation/category.ts
// Pure mapping from an adaptive SkillCategory to conjugation drill content.
import type { SkillCategory } from '../adaptive';
import type { FormType } from './types';

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
