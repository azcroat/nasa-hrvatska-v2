// src/lib/adaptiveFeedback.ts
//
// Feedback loop (Phase 3a): turn the equivalency test's per-skill result into
// targeted practice. A skill scored below the pass bar is "weak" → its
// representative adaptive categories are rescheduled by performance (weaker
// score → sooner due via rateCategorySession's grade→interval), so the daily
// session surfaces what the user just tested poorly on. Previously the test
// result fed only certification, never the practice engine.
//
// Scope: only WEAK skills act, and only skills with a drillable adaptive
// category. Reading and listening have no daily-session category, so they're
// intentionally omitted (no-op) rather than silently mapped to the wrong thing.
// (Phase 3b will add per-error categories from Writing/Razgovor corrections.)

import { rateCategorySession } from './adaptive';
import type { SkillCategory } from './adaptive';
import type { SkillScores, SkillKey } from './cefrCertification';

/** Equivalency pass bar; a per-skill score below this is treated as weak. */
const WEAK_THRESHOLD = 0.8;

// Representative categories per tested skill. Kept small and high-frequency so a
// weak result nudges core practice without flooding the queue. All entries are
// real ALL_CATEGORIES members that route to a session activity.
const SKILL_TO_CATEGORIES: Partial<Record<SkillKey, SkillCategory[]>> = {
  grammar: ['genitive', 'accusative', 'aspect-imperfective'],
  vocab: ['vocab-a2', 'vocab-b1'],
  speaking: ['speaking'],
};

/**
 * Push a completed equivalency test's weaknesses into the adaptive scheduler.
 * Safe to call once on test completion; only weak (< pass bar), drillable skills
 * reschedule. Non-numeric/absent scores and strong skills are ignored.
 */
export function applyExamScoresToAdaptive(scores: SkillScores): void {
  for (const skill of Object.keys(SKILL_TO_CATEGORIES) as SkillKey[]) {
    const score = scores[skill];
    if (typeof score !== 'number' || score >= WEAK_THRESHOLD) continue;
    for (const cat of SKILL_TO_CATEGORIES[skill]!) {
      rateCategorySession(cat, score);
    }
  }
}
