/**
 * Quest completion markers for daily quest tracking.
 * Writes localStorage keys of the form: nh_quest_<id>_YYYY-MM-DD
 * The DailyQuests component reads these keys to determine completion status.
 */
export function markQuest(id) {
  try {
    const d = new Date().toISOString().slice(0, 10);
    localStorage.setItem('nh_quest_' + id + '_' + d, '1');
  } catch (_) {}
}
