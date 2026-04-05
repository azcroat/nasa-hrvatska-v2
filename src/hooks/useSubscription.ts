/**
 * useSubscription — Subscription state management
 *
 * Manages free/premium subscription status. All registered users receive a free
 * annual subscription automatically (grantFreeAnnual). When monetisation is ready,
 * flip FREE_ANNUAL_ENABLED to false — free_annual subscriptions will not be renewed
 * at their next anniversary, so users who haven't paid hit the paywall organically.
 *
 * ── Monetisation toggle ───────────────────────────────────────────────────────
 *   FREE_ANNUAL_ENABLED = true   → every signed-in user gets/renews a free annual
 *   FREE_ANNUAL_ENABLED = false  → free_annual grants stop; existing ones remain
 *                                  active until expiresAt, then paywall activates
 *
 * ── Revenue path ─────────────────────────────────────────────────────────────
 *   RevenueCat / Stripe can be wired at any time — activateSubscription() already
 *   handles 'stripe' and 'revenuecat' sources and will be preferred over free_annual.
 *   When a user pays, source changes to 'stripe'|'revenuecat' and is never
 *   overwritten by grantFreeAnnual() (paid sources are protected).
 *
 * Storage: localStorage key 'nh_subscription'
 * Shape: { plan: 'free'|'monthly'|'yearly', expiresAt: ISO|null,
 *           trialUntil: ISO|null, source: 'trial'|'stripe'|'revenuecat'|'promo'|'free_annual' }
 */

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'nh_subscription';

// ── Monetisation flag ────────────────────────────────────────────────────────
// Set to false when you are ready to charge. Free annual subscriptions will
// naturally expire and users will hit the paywall at their renewal date.
export const FREE_ANNUAL_ENABLED = true;

type SubscriptionPlan = 'free' | 'monthly' | 'yearly';
type SubscriptionSource = 'trial' | 'stripe' | 'revenuecat' | 'promo' | 'free_annual' | null;

interface Subscription {
  plan: SubscriptionPlan;
  expiresAt: string | null;
  trialUntil: string | null;
  source: SubscriptionSource;
}

export interface SubscriptionStatus {
  isPremium: boolean;
  inTrial: boolean;
  isPaid: boolean;
  isFreeAnnual: boolean;
  plan: SubscriptionPlan;
  daysLeft: number | null;
  source: SubscriptionSource;
  expiresAt: string | null;
}

// ── Internals ────────────────────────────────────────────────────────────────
function _makeFreeSub(): Subscription {
  return { plan: 'free', expiresAt: null, trialUntil: null, source: null };
}

function _load(): Subscription {
  try { return (JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') as Subscription) || _makeFreeSub(); }
  catch { return _makeFreeSub(); }
}

function _save(sub: Subscription): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(sub)); } catch {}
}

function _isInTrial(sub: Subscription): boolean {
  if (!sub.trialUntil || typeof sub.trialUntil !== 'string') return false;
  const d = new Date(sub.trialUntil);
  return !isNaN(d.getTime()) && d > new Date();
}

function _isActivePaid(sub: Subscription): boolean {
  if (sub.plan === 'free') return false;
  if (!sub.expiresAt) return false;
  return new Date(sub.expiresAt) > new Date();
}

// Source is considered "paid" only when the user went through a real payment flow.
// free_annual / trial / promo are not paid sources.
function _isPaidSource(source: SubscriptionSource): boolean {
  return source === 'stripe' || source === 'revenuecat';
}

/**
 * Grant (or renew) a free annual subscription for every signed-in user.
 *
 * Behaviour:
 *  - Paid subscriptions (stripe / revenuecat) are NEVER touched.
 *  - If FREE_ANNUAL_ENABLED is false, no new grants or renewals happen.
 *  - If the user already has an active free_annual with > 30 days left, skip.
 *  - Otherwise: activate/extend for exactly 365 days from today.
 *
 * Call on every sign-in and also on app mount for returning users.
 */
export function grantFreeAnnual(userId: string): void {
  if (!userId) return;

  const sub = _load();

  // Never override active paid subscriptions.
  if (_isPaidSource(sub.source) && _isActivePaid(sub)) return;

  // Monetisation is off — do not grant or renew.
  if (!FREE_ANNUAL_ENABLED) return;

  // Already has a valid free_annual with plenty of time left — skip.
  if (sub.source === 'free_annual' && sub.expiresAt) {
    const daysLeft = Math.ceil((new Date(sub.expiresAt).getTime() - Date.now()) / 86400000);
    if (daysLeft > 30) return;
    // Within 30 days of expiry → fall through to renew.
  }

  const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
  _save({ plan: 'yearly', expiresAt, trialUntil: null, source: 'free_annual' });

  // Record per-user grant date for analytics / future entitlement checks.
  try {
    localStorage.setItem('nh_free_annual_' + userId, new Date().toISOString());
  } catch {}

  window.dispatchEvent(new CustomEvent('nh:subscription-changed'));
}

/**
 * Activate a subscription after successful payment or RevenueCat entitlement.
 * Always takes precedence over free_annual.
 */
export function activateSubscription(plan: SubscriptionPlan, source: SubscriptionSource = 'stripe'): void {
  const now = new Date();
  const expiresAt = plan === 'yearly'
    ? new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString()
    : new Date(now.getTime() + 32 * 24 * 60 * 60 * 1000).toISOString(); // 32-day buffer
  _save({ plan, expiresAt, trialUntil: null, source });
  window.dispatchEvent(new CustomEvent('nh:subscription-changed'));
}

/**
 * Apply a promo / gift code.
 * HRVATSKA2026 → 30 days · DIASPORA → 90 days · TEACHER → 365 days
 */
export function redeemPromoCode(code: string): { ok: boolean; message: string } {
  const PROMO_CODES: Record<string, { days: number; plan: SubscriptionPlan }> = {
    'HRVATSKA2026': { days: 30,  plan: 'monthly' },
    'DIASPORA':     { days: 90,  plan: 'yearly'  },
    'TEACHER':      { days: 365, plan: 'yearly'  },
  };
  const promo = PROMO_CODES[code?.toUpperCase?.()];
  if (!promo) return { ok: false, message: 'Invalid promo code.' };
  const usedKey = 'nh_promo_' + code.toUpperCase();
  if (localStorage.getItem(usedKey)) return { ok: false, message: 'Promo already used.' };
  localStorage.setItem(usedKey, '1');
  activateSubscription(promo.plan, 'promo');
  return { ok: true, message: `${promo.days} days of Premium activated!` };
}

/**
 * Cancel the free_annual subscription.
 * Paid subscriptions are not affected (use RevenueCat / Stripe portal for those).
 */
export function cancelFreeAnnual(userId: string): void {
  const sub = _load();
  if (sub.source !== 'free_annual') return; // nothing to cancel
  _save(_makeFreeSub());
  // Mark as cancelled so grantFreeAnnual won't re-grant on next login.
  try {
    if (userId) localStorage.setItem('nh_free_annual_cancelled_' + userId, '1');
  } catch {}
  window.dispatchEvent(new CustomEvent('nh:subscription-changed'));
}

export function getSubscriptionStatus(): SubscriptionStatus {
  const sub = _load();
  const inTrial    = _isInTrial(sub);
  const isPaid     = _isActivePaid(sub) && _isPaidSource(sub.source);
  const isFreeAnnual = sub.source === 'free_annual' && _isActivePaid(sub);
  const isPremium  = inTrial || isPaid || isFreeAnnual || _isActivePaid(sub);

  let daysLeft: number | null = null;
  if (sub.expiresAt && _isActivePaid(sub)) {
    daysLeft = Math.ceil((new Date(sub.expiresAt).getTime() - Date.now()) / 86400000);
  } else if (inTrial && sub.trialUntil) {
    daysLeft = Math.ceil((new Date(sub.trialUntil).getTime() - Date.now()) / 86400000);
  }

  return {
    isPremium,
    inTrial,
    isPaid,
    isFreeAnnual,
    plan: sub.plan,
    daysLeft,
    source: sub.source,
    expiresAt: sub.expiresAt,
  };
}

/**
 * Primary hook — call anywhere you need to gate premium features.
 */
export function useSubscription(): SubscriptionStatus & { refresh: () => void } {
  const [status, setStatus] = useState<SubscriptionStatus>(getSubscriptionStatus);

  const refresh = useCallback((): void => {
    setStatus(getSubscriptionStatus());
  }, []);

  useEffect(() => {
    window.addEventListener('focus', refresh);
    window.addEventListener('nh:subscription-changed', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      window.removeEventListener('nh:subscription-changed', refresh);
    };
  }, [refresh]);

  return { ...status, refresh };
}

// ── Legacy alias (kept for backwards compat) ─────────────────────────────────
/** @deprecated Use grantFreeAnnual instead */
export function startTrial(userId: string): void { grantFreeAnnual(userId); }

/*
 * ── RevenueCat integration (uncomment when ready) ──────────────────────────
 *
 * import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
 *
 * export async function initRevenueCat(userId) {
 *   const apiKey = import.meta.env.VITE_REVENUECAT_API_KEY_IOS;
 *   await Purchases.configure({ apiKey, appUserID: userId });
 *   await syncRevenueCatEntitlements();
 * }
 *
 * export async function syncRevenueCatEntitlements() {
 *   try {
 *     const { customerInfo } = await Purchases.getCustomerInfo();
 *     const premium = customerInfo.entitlements.active['premium'];
 *     if (premium?.isActive) {
 *       activateSubscription(
 *         premium.productIdentifier.includes('yearly') ? 'yearly' : 'monthly',
 *         'revenuecat'
 *       );
 *     }
 *   } catch (e) {
 *     console.warn('[RevenueCat] Could not sync entitlements:', e.message);
 *   }
 * }
 *
 * export async function purchaseProduct(productId) {
 *   const { customerInfo } = await Purchases.purchaseStoreProduct({
 *     product: { productIdentifier: productId }
 *   });
 *   await syncRevenueCatEntitlements();
 *   return customerInfo;
 * }
 *
 * // To enable monetisation:
 * // 1. Set FREE_ANNUAL_ENABLED = false
 * // 2. Wire purchaseProduct() in PaywallScreen.jsx handleSubscribe()
 * // 3. Call initRevenueCat(userId) after sign-in
 * // Free annual users will continue until their expiresAt, then hit the paywall.
 */
