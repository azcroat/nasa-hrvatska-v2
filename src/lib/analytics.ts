/**
 * analytics.ts — centralized Firebase Analytics event tracking.
 *
 * All functions are safe no-ops when Firebase Analytics is unavailable
 * (ad blockers, private browsing without consent, missing measurementId).
 *
 * GDPR: events are suppressed when the user has not accepted analytics
 * cookies. Consent is stored in localStorage under 'cookie_consent_v1'.
 * Only the value 'accepted' enables analytics; 'essential' (or missing)
 * means the user declined analytics — no events fire.
 */
import { fbLogEvent } from './firebase';
import { localDateStr } from './dateUtils';

function isAnalyticsConsented(): boolean {
  try {
    return localStorage.getItem('cookie_consent_v1') === 'accepted';
  } catch {
    return false;
  }
}

function safeLog(eventName: string, params?: Record<string, unknown>): void {
  if (!isAnalyticsConsented()) return;
  fbLogEvent(eventName, params || {});
}

function phCapture(eventName: string, props?: Record<string, unknown>): void {
  try {
    const ph = (window as unknown as Record<string, unknown>).__posthog as { capture?: (name: string, props?: unknown) => void } | undefined;
    if (ph && typeof ph.capture === 'function') {
      ph.capture(eventName, props || {});
    }
  } catch {}
}

const INSTALL_KEY = 'nh_install_date';

function getInstallDate(): string {
  let d = localStorage.getItem(INSTALL_KEY);
  if (!d) {
    d = localDateStr();
    try { localStorage.setItem(INSTALL_KEY, d); } catch {}
  }
  return d;
}

export function getDaysSinceInstall(): number {
  try {
    const install = new Date(getInstallDate());
    const now = new Date();
    return Math.floor((now.getTime() - install.getTime()) / 86400000);
  } catch { return 0; }
}

function retentionBucket(days: number): string {
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

export function trackAppOpen(isSignedIn: boolean): void {
  const days = getDaysSinceInstall();
  safeLog('app_open', {
    days_since_install: days,
    retention_bucket: retentionBucket(days),
    signed_in: isSignedIn,
  });
  phCapture('app_open', {
    days_since_install: days,
    retention_bucket: retentionBucket(days),
    signed_in: isSignedIn,
  });
}

export function trackLessonComplete({ xpEarned, streak, lessonType = 'vocab', lessonId = '' }: {
  xpEarned: number;
  streak: number;
  lessonType?: string;
  lessonId?: string;
}): void {
  safeLog('lesson_complete', {
    xp_earned: xpEarned,
    streak,
    lesson_type: lessonType,
    lesson_id: lessonId,
  });
  phCapture('lesson_complete', {
    xp_earned: xpEarned,
    streak,
    lesson_type: lessonType,
    lesson_id: lessonId,
    days_since_install: getDaysSinceInstall(),
  });
}

export function trackExerciseComplete({ exerciseType, xpEarned }: { exerciseType: string; xpEarned: number }): void {
  safeLog('exercise_complete', {
    exercise_type: exerciseType,
    xp_earned: xpEarned,
  });
}

export function trackLevelUp({ newLevel, totalXP }: { newLevel: number; totalXP: number }): void {
  safeLog('level_up', { new_level: newLevel, total_xp: totalXP });
}

export function trackBadgeEarned(badgeId: string): void {
  safeLog('badge_earned', { badge_id: badgeId });
}

export function trackStreakMilestone(days: number): void {
  safeLog('streak_milestone', { days });
  phCapture('streak_milestone', { days });
}

export function trackStreakBroken(previousStreak: number): void {
  safeLog('streak_broken', { previous_streak: previousStreak });
  phCapture('streak_broken', { previous_streak: previousStreak });
}

export function trackSignUp(method = 'email'): void {
  safeLog('sign_up', { method });
  phCapture('sign_up', { method, days_since_install: getDaysSinceInstall() });
}

export function trackLogin(method = 'email'): void {
  safeLog('login', { method });
  phCapture('login', { method });
}

export function trackPaywallShown(featureName: string): void {
  safeLog('paywall_shown', { feature: featureName || 'unknown' });
  phCapture('paywall_shown', { feature: featureName || 'unknown' });
}

export function trackSubscribed(plan = 'premium'): void {
  safeLog('purchase', { item_name: plan });
  phCapture('subscribed', { plan, days_since_install: getDaysSinceInstall() });
}

export function trackOnboardingComplete(): void {
  safeLog('tutorial_complete', {});
  phCapture('onboarding_complete', { days_since_install: getDaysSinceInstall() });
}

export function trackDailyChallengeComplete({ score, total }: { score: number; total: number }): void {
  safeLog('daily_challenge_complete', {
    score,
    total,
    perfect: score === total,
  });
}

export function trackSRReview({ correct, total }: { correct: number; total: number }): void {
  if (!total) return;
  safeLog('sr_review_complete', {
    correct,
    total,
    accuracy: Math.round((correct / total) * 100),
  });
}

export function trackFriendAdded(): void {
  safeLog('friend_added', {});
}

export function trackFamilyJoined(): void {
  safeLog('family_joined', {});
}
