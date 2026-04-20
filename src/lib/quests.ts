/**
 * Quest completion markers for daily quest tracking.
 * Writes localStorage keys of the form: nh_quest_<id>_YYYY-MM-DD
 * The DailyQuests component reads these keys to determine completion status.
 *
 * Tier-2 auto-promotion: when a tier-1 quest is marked a second time today,
 * the corresponding tier-2 quest is automatically marked as well.
 * e.g. markQuest('speak') called twice → 'speak2' also marked.
 */
import { localDateStr } from './dateUtils';

/**
 * Remove quest keys older than yesterday to prevent unbounded localStorage growth.
 * Safe to call on every app session start.
 */
export function cleanupStaleQuestKeys(): void {
  try {
    const today = localDateStr();
    const _d = new Date();
    _d.setDate(_d.getDate() - 1);
    const yesterday =
      _d.getFullYear() +
      '-' +
      String(_d.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(_d.getDate()).padStart(2, '0');
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith('nh_quest_')) continue;
      // Key format: nh_quest_<id>_YYYY-MM-DD  or  nh_quest_<id>_count_YYYY-MM-DD
      const datePart = key.slice(-10); // last 10 chars = YYYY-MM-DD
      if (datePart !== today && datePart !== yesterday && /^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
        toRemove.push(key);
      }
    }
    toRemove.forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch (_) {}
    });
  } catch (_) {}
}

const TIER2_MAP: Record<string, string> = {
  speak: 'speak2',
  grammar: 'grammar2',
  master: 'master2',
  reading: 'reading2',
  culture: 'culture2',
  vocab: 'vocab2',
};

export function markQuest(id: string): void {
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

    // Notify the knight mascot to show a proud reaction
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('knight:quest-done'));
    }
  } catch (_) {}
}
