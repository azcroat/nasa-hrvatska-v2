/**
 * Named constants for time values and timeouts.
 * Use these instead of magic numbers throughout the codebase.
 */

export const MS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR:   60 * 60 * 1000,
  DAY:    24 * 60 * 60 * 1000,
  WEEK:   7 * 24 * 60 * 60 * 1000,
};

export const TIMEOUTS = {
  // UI feedback durations
  TOAST:              4500,
  XP_POPUP:           1500,
  BADGE_SHOW:          600,
  BADGE_HIDE:         3000,
  CELEBRATION_DELAY:   400,
  STREAK_TOAST:       5000,
  LEVEL_UP_DELAY:      900,
  CEREMONY_DELAY:      100,

  // Network / session
  AUTH_FALLBACK:      8000,
  SESSION_CHECK:      5 * 60 * 1000,
  TOKEN_CACHE:       30 * 60 * 1000,
  AI_REQUEST:        20 * 1000,

  // Startup
  BOOTSTRAP_DELAY:     500,
  PRUNE_IDLE:         2000,
};
