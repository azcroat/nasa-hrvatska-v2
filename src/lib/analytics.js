/**
 * analytics.js — centralized Firebase Analytics event tracking.
 *
 * All functions are safe no-ops when Firebase Analytics is unavailable
 * (ad blockers, private browsing without consent, missing measurementId).
 *
 * D1/D7/D30 retention: nh_install_date is set on first app load and never
 * reset, even across sign-outs. This gives true retention from first touch.
 */
import { fbLogEvent } from './firebase.js';

const INSTALL_KEY = 'nh_install_date';

function getInstallDate() {
  let d = localStorage.getItem(INSTALL_KEY);
  if (!d) {
    d = new Date().toISOString().slice(0, 10);
    try { localStorage.setItem(INSTALL_KEY, d); } catch {}
  }
  return d;
}

export function getDaysSinceInstall() {
  try {
    const install = new Date(getInstallDate());
    const now = new Date();
    return Math.floor((now - install) / 86400000);
  } catch { return 0; }
}

function retentionBucket(days) {
  if (days === 0) return 'd0';
  if (days === 1) return 'd1';
  if (days <= 3) return 'd2_3';
  if (days <= 6) return 'd4_6';
  if (days === 7) return 'd7';
  if (days <= 13) return 'd8_13';
  if (days === 14) return 'd14';
  if (days <= 29) return 'd15_29';
  if (days === 30) return 'd30';
  if (days <= 60) return 'd31_60';
  return 'd60_plus';
}

/** Fire on every app open. Provides D1/D7/D14/D30 retention buckets in Analytics. */
export function trackAppOpen(isSignedIn) {
  const days = getDaysSinceInstall();
  fbLogEvent('app_open', {
    days_since_install: days,
    retention_bucket: retentionBucket(days),
    signed_in: isSignedIn,
  });
}

/** Fire when a lesson (celebrate=true) completes and XP is awarded. */
export function trackLessonComplete({ xpEarned, streak, lessonType = 'vocab', lessonId = '' }) {
  fbLogEvent('lesson_complete', {
    xp_earned: xpEarned,
    streak,
    lesson_type: lessonType,
    lesson_id: lessonId,
  });
}

/** Fire when any non-lesson exercise completes. */
export function trackExerciseComplete({ exerciseType, xpEarned }) {
  fbLogEvent('exercise_complete', {
    exercise_type: exerciseType,
    xp_earned: xpEarned,
  });
}

/** Fire when the user's level increases. */
export function trackLevelUp({ newLevel, totalXP }) {
  fbLogEvent('level_up', { new_level: newLevel, total_xp: totalXP });
}

/** Fire once per badge unlock. */
export function trackBadgeEarned(badgeId) {
  fbLogEvent('badge_earned', { badge_id: badgeId });
}

/** Fire on streak milestones (7, 14, 30, etc). */
export function trackStreakMilestone(days) {
  fbLogEvent('streak_milestone', { days });
}

/** Fire when the streak counter resets to 0. */
export function trackStreakBroken(previousStreak) {
  fbLogEvent('streak_broken', { previous_streak: previousStreak });
}

/** Fire on new account registration. */
export function trackSignUp(method = 'email') {
  fbLogEvent('sign_up', { method });
}

/** Fire on successful sign-in. */
export function trackLogin(method = 'email') {
  fbLogEvent('login', { method });
}

/** Fire when the paywall is displayed. */
export function trackPaywallShown(featureName) {
  fbLogEvent('paywall_shown', { feature: featureName || 'unknown' });
}

/** Fire when the user completes a purchase / activates a subscription. */
export function trackSubscribed(plan = 'premium') {
  fbLogEvent('purchase', { item_name: plan });
}

/** Fire when the onboarding tour is completed or dismissed. */
export function trackOnboardingComplete() {
  fbLogEvent('tutorial_complete', {});
}

/** Fire when the daily challenge 3-question set is finished. */
export function trackDailyChallengeComplete({ score, total }) {
  fbLogEvent('daily_challenge_complete', {
    score,
    total,
    perfect: score === total,
  });
}

/** Fire after a spaced-repetition review session. */
export function trackSRReview({ correct, total }) {
  if (!total) return;
  fbLogEvent('sr_review_complete', {
    correct,
    total,
    accuracy: Math.round((correct / total) * 100),
  });
}

/** Fire when the user successfully adds a friend. */
export function trackFriendAdded() {
  fbLogEvent('friend_added', {});
}

/** Fire when the user joins or creates a family group. */
export function trackFamilyJoined() {
  fbLogEvent('family_joined', {});
}
