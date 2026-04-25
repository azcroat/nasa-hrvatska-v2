import { getDueCategoryQueue } from '../lib/adaptive';
import type { SkillCategory } from '../lib/adaptive';

export interface AdaptiveQueueItem {
  category: SkillCategory;
  difficulty: 1 | 2 | 3 | 4 | 5;
}

export function useAdaptivePractice(): { practiceQueue: AdaptiveQueueItem[] } {
  // getDueCategoryQueue reads localStorage synchronously — no async needed.
  // Guard: only return items when the user has existing category SR data.
  // New users have no 'nh_cat_sr' key, so we return [] to keep the UI unchanged.
  const hasData = (() => {
    try {
      const raw = localStorage.getItem('nh_cat_sr');
      if (!raw) return false;
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      return Object.keys(parsed).length > 0;
    } catch {
      return false;
    }
  })();

  const practiceQueue = hasData ? getDueCategoryQueue(6) : [];
  return { practiceQueue };
}
