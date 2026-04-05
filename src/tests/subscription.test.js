import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getSubscriptionStatus,
  grantFreeAnnual,
  activateSubscription,
  redeemPromoCode,
  cancelFreeAnnual,
  FREE_ANNUAL_ENABLED,
} from '../hooks/useSubscription';

function clearLS() { localStorage.clear(); }

function setRawSub(obj) {
  localStorage.setItem('nh_subscription', JSON.stringify(obj));
}

function futureISO(days) {
  return new Date(Date.now() + days * 86400000).toISOString();
}
function pastISO(days) {
  return new Date(Date.now() - days * 86400000).toISOString();
}

describe('subscription — status and lifecycle', () => {
  beforeEach(clearLS);
  afterEach(() => { clearLS(); vi.useRealTimers(); });

  // ── getSubscriptionStatus defaults ───────────────────────────────────────

  it('returns free plan with isPremium=false when nothing stored', () => {
    const s = getSubscriptionStatus();
    expect(s.plan).toBe('free');
    expect(s.isPremium).toBe(false);
    expect(s.daysLeft).toBeNull();
  });

  it('returns isPremium=false for expired subscription', () => {
    setRawSub({ plan: 'yearly', expiresAt: pastISO(1), trialUntil: null, source: 'free_annual' });
    expect(getSubscriptionStatus().isPremium).toBe(false);
  });

  it('returns isPremium=true for active free_annual', () => {
    setRawSub({ plan: 'yearly', expiresAt: futureISO(100), trialUntil: null, source: 'free_annual' });
    const s = getSubscriptionStatus();
    expect(s.isPremium).toBe(true);
    expect(s.isFreeAnnual).toBe(true);
  });

  it('returns isPremium=true for active paid stripe', () => {
    setRawSub({ plan: 'yearly', expiresAt: futureISO(200), trialUntil: null, source: 'stripe' });
    const s = getSubscriptionStatus();
    expect(s.isPremium).toBe(true);
    expect(s.isPaid).toBe(true);
  });

  it('returns correct daysLeft for active subscription', () => {
    setRawSub({ plan: 'yearly', expiresAt: futureISO(30), trialUntil: null, source: 'free_annual' });
    const s = getSubscriptionStatus();
    expect(s.daysLeft).toBeGreaterThan(28);
    expect(s.daysLeft).toBeLessThanOrEqual(30);
  });

  it('returns daysLeft=null for free plan', () => {
    expect(getSubscriptionStatus().daysLeft).toBeNull();
  });

  it('exposes source field correctly', () => {
    setRawSub({ plan: 'yearly', expiresAt: futureISO(100), trialUntil: null, source: 'free_annual' });
    expect(getSubscriptionStatus().source).toBe('free_annual');
  });

  it('isPremium=true for active in-trial state', () => {
    setRawSub({ plan: 'free', expiresAt: null, trialUntil: futureISO(7), source: 'trial' });
    expect(getSubscriptionStatus().isPremium).toBe(true);
    expect(getSubscriptionStatus().inTrial).toBe(true);
  });

  it('isPremium=false for expired trial', () => {
    setRawSub({ plan: 'free', expiresAt: null, trialUntil: pastISO(1), source: 'trial' });
    expect(getSubscriptionStatus().inTrial).toBe(false);
  });

  // ── grantFreeAnnual ───────────────────────────────────────────────────────

  it('grants yearly plan when no subscription exists', () => {
    grantFreeAnnual('user123');
    const s = getSubscriptionStatus();
    expect(s.plan).toBe('yearly');
    expect(s.source).toBe('free_annual');
    expect(s.isPremium).toBe(true);
  });

  it('sets expiresAt ~365 days from now', () => {
    grantFreeAnnual('user123');
    const s = getSubscriptionStatus();
    expect(s.daysLeft).toBeGreaterThan(363);
    expect(s.daysLeft).toBeLessThanOrEqual(366);
  });

  it('does not grant when userId is missing', () => {
    grantFreeAnnual(null);
    grantFreeAnnual(undefined);
    grantFreeAnnual('');
    expect(getSubscriptionStatus().plan).toBe('free');
  });

  it('does not override active paid stripe subscription', () => {
    setRawSub({ plan: 'yearly', expiresAt: futureISO(200), trialUntil: null, source: 'stripe' });
    grantFreeAnnual('user123');
    expect(getSubscriptionStatus().source).toBe('stripe');
  });

  it('does not override active revenuecat subscription', () => {
    setRawSub({ plan: 'monthly', expiresAt: futureISO(30), trialUntil: null, source: 'revenuecat' });
    grantFreeAnnual('user123');
    expect(getSubscriptionStatus().source).toBe('revenuecat');
  });

  it('is idempotent: skips re-grant when >30 days left on free_annual', () => {
    grantFreeAnnual('user123');
    const firstExpiry = getSubscriptionStatus().expiresAt;
    // Immediate second call should be a no-op (365 days left > 30)
    grantFreeAnnual('user123');
    expect(getSubscriptionStatus().expiresAt).toBe(firstExpiry);
  });

  it('renews when free_annual has ≤30 days left', () => {
    setRawSub({ plan: 'yearly', expiresAt: futureISO(20), trialUntil: null, source: 'free_annual' });
    grantFreeAnnual('user123');
    const s = getSubscriptionStatus();
    expect(s.daysLeft).toBeGreaterThan(363); // renewed to ~365 days
  });

  it('writes per-user grant key to localStorage', () => {
    grantFreeAnnual('testuser');
    expect(localStorage.getItem('nh_free_annual_testuser')).not.toBeNull();
  });

  it('dispatches nh:subscription-changed event', () => {
    const listener = vi.fn();
    window.addEventListener('nh:subscription-changed', listener);
    grantFreeAnnual('user123');
    window.removeEventListener('nh:subscription-changed', listener);
    expect(listener).toHaveBeenCalledOnce();
  });

  // ── activateSubscription ──────────────────────────────────────────────────

  it('activates yearly plan with stripe source', () => {
    activateSubscription('yearly', 'stripe');
    const s = getSubscriptionStatus();
    expect(s.plan).toBe('yearly');
    expect(s.source).toBe('stripe');
    expect(s.isPaid).toBe(true);
  });

  it('activates monthly plan with revenuecat source', () => {
    activateSubscription('monthly', 'revenuecat');
    const s = getSubscriptionStatus();
    expect(s.plan).toBe('monthly');
    expect(s.source).toBe('revenuecat');
  });

  it('yearly plan sets expiresAt ~365 days from now', () => {
    activateSubscription('yearly', 'stripe');
    const s = getSubscriptionStatus();
    expect(s.daysLeft).toBeGreaterThan(363);
  });

  it('monthly plan sets expiresAt ~32 days from now', () => {
    activateSubscription('monthly', 'stripe');
    const s = getSubscriptionStatus();
    expect(s.daysLeft).toBeGreaterThan(30);
    expect(s.daysLeft).toBeLessThanOrEqual(33);
  });

  // ── redeemPromoCode ───────────────────────────────────────────────────────

  it('accepts HRVATSKA2026 code and grants 30-day access', () => {
    const result = redeemPromoCode('HRVATSKA2026');
    expect(result.ok).toBe(true);
    expect(result.message).toMatch(/30/);
    expect(getSubscriptionStatus().isPremium).toBe(true);
  });

  it('accepts DIASPORA code and grants 90-day access', () => {
    const result = redeemPromoCode('DIASPORA');
    expect(result.ok).toBe(true);
    expect(result.message).toMatch(/90/);
  });

  it('accepts TEACHER code and grants 365-day access', () => {
    const result = redeemPromoCode('TEACHER');
    expect(result.ok).toBe(true);
    expect(result.message).toMatch(/365/);
  });

  it('is case-insensitive for promo codes', () => {
    const result = redeemPromoCode('hrvatska2026');
    expect(result.ok).toBe(true);
  });

  it('rejects unknown promo code', () => {
    const result = redeemPromoCode('INVALID_CODE');
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/invalid/i);
  });

  it('rejects null/undefined promo code', () => {
    expect(redeemPromoCode(null).ok).toBe(false);
    expect(redeemPromoCode(undefined).ok).toBe(false);
  });

  it('prevents reusing the same promo code', () => {
    redeemPromoCode('DIASPORA');
    const second = redeemPromoCode('DIASPORA');
    expect(second.ok).toBe(false);
    expect(second.message).toMatch(/already used/i);
  });

  // ── cancelFreeAnnual ──────────────────────────────────────────────────────

  it('cancels free_annual subscription', () => {
    grantFreeAnnual('user123');
    cancelFreeAnnual('user123');
    const s = getSubscriptionStatus();
    expect(s.plan).toBe('free');
    expect(s.isPremium).toBe(false);
  });

  it('does not affect paid (stripe) subscription', () => {
    activateSubscription('yearly', 'stripe');
    cancelFreeAnnual('user123');
    const s = getSubscriptionStatus();
    expect(s.source).toBe('stripe');
    expect(s.isPremium).toBe(true);
  });

  it('stores cancelled flag for userId', () => {
    grantFreeAnnual('user123');
    cancelFreeAnnual('user123');
    expect(localStorage.getItem('nh_free_annual_cancelled_user123')).toBe('1');
  });

  // ── FREE_ANNUAL_ENABLED constant ──────────────────────────────────────────

  it('FREE_ANNUAL_ENABLED is exported as a boolean', () => {
    expect(typeof FREE_ANNUAL_ENABLED).toBe('boolean');
  });
});
