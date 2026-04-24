export type AwardActivityType =
  | 'media_view'
  | 'phrase_of_day'
  | 'daily_discovery'
  | 'grammar'
  | 'vocabulary'
  | 'pronunciation'
  | 'listening'
  | 'reading'
  | 'speaking'
  | 'culture'
  | 'quest'
  | 'review'
  | 'lesson'
  | 'heritage'
  | 'story'
  | 'default';

export const ACTIVITY_XP_MAP: Record<AwardActivityType, number> = {
  // Micro rewards
  media_view: 15,
  phrase_of_day: 15,
  daily_discovery: 20,

  // Standard practice (base ≤ 25 XP × 2× multiplier + 50 comeback + headroom)
  grammar: 80,
  vocabulary: 80,
  pronunciation: 80,
  listening: 80,
  reading: 80,
  speaking: 100,
  culture: 100,
  quest: 100,
  review: 80,

  // Major completions (base × 2× multiplier + 50 comeback + 10 headroom)
  lesson: 210,
  heritage: 250,
  story: 100,

  // Catch-all for any unlisted activityType
  default: 210,
};
