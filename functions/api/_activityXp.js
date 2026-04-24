// functions/api/_activityXp.js
// Canonical Worker-side XP cap allowlist.
// IMPORTANT: Values must stay in sync with src/lib/activityXp.ts.
// Update both files together if caps change.

export const ACTIVITY_XP_MAP = {
  // Micro rewards
  media_view: 15,
  phrase_of_day: 15,
  daily_discovery: 20,

  // Standard practice
  grammar: 80,
  vocabulary: 80,
  pronunciation: 80,
  listening: 80,
  reading: 80,
  speaking: 100,
  culture: 100,
  quest: 100,
  review: 80,

  // Major completions
  lesson: 210,
  heritage: 250,
  story: 100,

  // Catch-all for any unlisted activityType
  default: 210,
};
