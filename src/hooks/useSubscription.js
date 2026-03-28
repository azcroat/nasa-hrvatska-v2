/**
 * useSubscription — Subscription state management
 *
 * Manages free/premium subscription status. Designed to be a thin wrapper
 * that can be swapped for RevenueCat SDK calls once you have API keys.
 *
 * RevenueCat integration: install @revenuecat/purchases-capacitor and
 * uncomment the RevenueCat section. Set VITE_REVENUECAT_API_KEY_IOS and
 * VITE_REVENUECAT_API_KEY_ANDROID in your .env file.
 *
 * Storage: localStorage key 'nh_subscription'
 * Shape: { plan: 'free'|'monthly'|'yearly', expiresAt: ISO string|null,
 *           trialUntil: ISO string|null, source: 'trial'|'stripe'|'revenuecat'|'promo' }
 */

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'nh_subscription';
const TRIAL_DAYS  = 7; // days of free full access for new users

// ── Default free subscription ────────────────────────────────────────────────
function _makeFreeSub() {
  return { plan: 'free', expiresAt: null, trialUntil: null, source: null };
}

function _load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || _makeFreeSub(); }
  catch { return _makeFreeSub(); }
}

function _save(sub) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(sub)); } catch {}
}

/** Returns true if the user is within their free trial window */
function _isInTrial(sub) {
  if (!sub.trialUntil) return false;
  return new Date(sub.trialUntil) > new Date();
}

/** Returns true if the user has an active paid subscription */
function _isActivePaid(sub) {
  if (sub.plan === 'free') return false;
  if (!sub.expiresAt) return false;
  return new Date(sub.expiresAt) > new Date();
}

/**
 * Start a free trial for a new user (call once on first sign-in).
 * No-op if the user already has a trial or paid plan.
 */
export function startTrial(userId) {
  if (!userId) return;
  const trialKey = 'nh_trial_started_' + userId;
  if (localStorage.getItem(trialKey)) return; // already started
  const sub = _load();
  if (sub.trialUntil || sub.plan !== 'free') return; // already has trial or paid
  const trialUntil = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const newSub = { ...sub, trialUntil, source: 'trial' };
  _save(newSub);
  localStorage.setItem(trialKey, '1');
}

/**
 * Activate a subscription (call after successful payment or RevenueCat entitlement).
 * @param {'monthly'|'yearly'} plan
 * @param {string} source - 'stripe' | 'revenuecat' | 'promo'
 */
export function activateSubscription(plan, source = 'stripe') {
  const now = new Date();
  const expiresAt = plan === 'yearly'
    ? new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString()
    : new Date(now.getTime() + 32 * 24 * 60 * 60 * 1000).toISOString(); // 32 days (buffer)
  const sub = { plan, expiresAt, trialUntil: null, source };
  _save(sub);
  // Dispatch event so useSubscription hook re-reads
  window.dispatchEvent(new CustomEvent('nh:subscription-changed'));
}

/**
 * Apply a promo/gift code. Currently supports 'HRVATSKA2026' for 30 days free.
 * @returns {{ ok: boolean, message: string }}
 */
export function redeemPromoCode(code) {
  const PROMO_CODES = {
    'HRVATSKA2026': { days: 30, plan: 'monthly' },
    'DIASPORA':     { days: 90, plan: 'yearly'  },
    'TEACHER':      { days: 365, plan: 'yearly' },
  };
  const promo = PROMO_CODES[code?.toUpperCase?.()];
  if (!promo) return { ok: false, message: 'Invalid promo code.' };
  const usedKey = 'nh_promo_' + code.toUpperCase();
  if (localStorage.getItem(usedKey)) return { ok: false, message: 'Promo already used.' };
  localStorage.setItem(usedKey, '1');
  activateSubscription(promo.plan, 'promo');
  return { ok: true, message: `${promo.days} days of Premium activated!` };
}

export function getSubscriptionStatus() {
  const sub = _load();
  const inTrial = _isInTrial(sub);
  const isPaid  = _isActivePaid(sub);
  const isPremium = inTrial || isPaid;

  let daysLeft = null;
  if (inTrial && sub.trialUntil) {
    daysLeft = Math.ceil((new Date(sub.trialUntil) - new Date()) / 86400000);
  } else if (isPaid && sub.expiresAt) {
    daysLeft = Math.ceil((new Date(sub.expiresAt) - new Date()) / 86400000);
  }

  return { isPremium, inTrial, isPaid, plan: sub.plan, daysLeft, source: sub.source };
}

/**
 * Primary hook — returns subscription status and a refresh callback.
 * Call anywhere you need to gate premium features.
 */
export function useSubscription() {
  const [status, setStatus] = useState(getSubscriptionStatus);

  const refresh = useCallback(() => {
    setStatus(getSubscriptionStatus());
  }, []);

  useEffect(() => {
    // Re-check on focus (catches subscription purchased in another tab)
    window.addEventListener('focus', refresh);
    window.addEventListener('nh:subscription-changed', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      window.removeEventListener('nh:subscription-changed', refresh);
    };
  }, [refresh]);

  return { ...status, refresh };
}

/*
 * ── RevenueCat integration (uncomment when ready) ──────────────────────────
 *
 * import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
 *
 * export async function initRevenueCat(userId) {
 *   const apiKey = import.meta.env.VITE_REVENUECAT_API_KEY_IOS; // or ANDROID
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
 */
