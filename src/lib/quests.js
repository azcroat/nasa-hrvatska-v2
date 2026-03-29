/**
 * Quest completion markers for daily quest tracking.
 * Writes localStorage keys of the form: nh_quest_<id>_YYYY-MM-DD
 * The DailyQuests component reads these keys to determine completion status.
 *
 * Tier-2 auto-promotion: when a tier-1 quest is marked a second time today,
 * the corresponding tier-2 quest is automatically marked as well.
 * e.g. markQuest('speak') called twice → 'speak2' also marked.
 */
import { localDateStr } from './dateUtils.js';

const TIER2_MAP = { speak: 'speak2', grammar: 'grammar2', master: 'master2', reading: 'reading2' };

export function markQuest(id) {
  try {
    const d = localDateStr();
    localStorage.setItem('nh_quest_' + id + '_' + d, '1');

    // Track daily count for this quest type to enable tier-2 promotion
    const countKey = 'nh_quest_' + id + '_count_' + d;
    const count = parseInt(localStorage.getItem(countKey) || '0', 10);
    localStorage.setItem(countKey, String(count + 1));

    // Auto-mark tier-2 on the second completion of the same quest type today
    const tier2 = TIER2_MAP[id];
    if (tier2 && count >= 1) {
      localStorage.setItem('nh_quest_' + tier2 + '_' + d, '1');
    }
  } catch (_) {}
}
