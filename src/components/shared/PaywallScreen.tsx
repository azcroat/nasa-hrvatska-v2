// @ts-nocheck
/**
 * PaywallScreen — Conversion-optimized premium upsell
 *
 * Shown when a free user tries to access AI Tutor, Live Tutor, or AI Conversation.
 * Design principles:
 *   - Lead with the BENEFIT, not the price
 *   - Show social proof (heritage angle — not fake stats)
 *   - Promo code entry for diaspora org partnerships
 *   - Annual plan default (higher LTV)
 *   - 7-day trial already started → show days remaining, not "start trial"
 */

import React, { useState, useEffect } from 'react';
import { redeemPromoCode, activateSubscription } from '../../hooks/useSubscription';
import { trackPaywallShown, trackSubscribed } from '../../lib/analytics.js';

// ── Feature list ──────────────────────────────────────────────────────────────
const _FREE_FEATURES = [
  'All A1 vocabulary & grammar',
  'Flashcards & spaced repetition',
  'Daily quests & streak tracking',
  'Cultural content & history',
  'Pronunciation practice (basic)',
];

const PREMIUM_FEATURES = [
  { icon: '🤖', text: 'Maja AI Tutor — unlimited conversations' },
  { icon: '👨‍🏫', text: 'Live Tutor — personalized coaching sessions' },
  { icon: '🎯', text: 'AI Conversation Practice — all 40+ scenarios' },
  { icon: '🎙️', text: 'Phoneme-level pronunciation assessment' },
  { icon: '📱', text: 'Full offline mode — learn on the plane to Split' },
  { icon: '🏅', text: 'Certificate of completion (A1–B2 levels)' },
  { icon: '📊', text: 'Advanced learning analytics & weak-area targeting' },
  { icon: '♾️', text: 'All levels A1 → C1 + new content monthly' },
];

const PLANS = [
  {
    id: 'monthly',
    label: 'Monthly',
    price: '$7.99',
    per: '/month',
    priceNote: null,
    badge: null,
    highlight: false,
  },
  {
    id: 'yearly',
    label: 'Annual',
    price: '$49.99',
    per: '/year',
    priceNote: '$4.17/mo — save 48%',
    badge: 'Most Popular',
    highlight: true,
  },
];

export default function PaywallScreen({ onClose, featureName = 'AI Tutor', onSubscribed }) {
  const [selectedPlan, setSelectedPlan] = /** @type {[('yearly'|'monthly'), Function]} */ (useState('yearly'));
  const [promoCode, setPromoCode] = useState('');
  const [promoMsg, setPromoMsg]   = useState('');
  const [showPromo, setShowPromo] = useState(false);
  const [loading, setLoading]     = useState(false);

  // Track impression on mount
  useEffect(() => { trackPaywallShown(featureName); }, [featureName]);

  function handlePromo() {
    const result = redeemPromoCode(promoCode);
    setPromoMsg(result.message);
    if (result.ok) {
      trackSubscribed('promo');
      setTimeout(() => { if (onSubscribed) onSubscribed(); else if (onClose) onClose(); }, 1200);
    }
  }

  // Activates subscription locally. FREE_ANNUAL_ENABLED=true means all signed-in
  // users already receive 365 days free via grantFreeAnnual() on login — this path
  // is reached only by users who explicitly hit the paywall (e.g. signed-out or
  // expired). Wire purchaseProduct() from useSubscription.js when monetisation
  // is enabled (set FREE_ANNUAL_ENABLED=false and add RevenueCat/Stripe keys).
  async function handleSubscribe() {
    setLoading(true);
    setTimeout(() => {
      activateSubscription(selectedPlan, 'stripe');
      trackSubscribed(selectedPlan);
      setLoading(false);
      if (onSubscribed) onSubscribed();
      else if (onClose) onClose();
    }, 800);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Unlock ${featureName} — Premium subscription`}
      style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      padding: '0',
    }}>
      <div style={{
        background: 'var(--app-bg)',
        borderRadius: '28px 28px 0 0',
        width: '100%',
        maxWidth: 520,
        maxHeight: '94dvh',
        overflowY: 'auto',
        padding: '0 0 env(safe-area-inset-bottom,16px)',
      }}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(160deg,#164e63 0%,#0e7490 50%,#155e75 100%)',
          borderRadius: '28px 28px 0 0',
          padding: '28px 24px 32px',
          position: 'relative',
        }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 16, right: 16,
              background: 'rgba(255,255,255,.15)', border: 'none',
              borderRadius: '50%', width: 36, height: 36,
              fontSize: 18, color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            aria-label="Close">✕</button>

          <div style={{ fontSize: 48, marginBottom: 10 }}>🇭🇷</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', lineHeight: 1.2, marginBottom: 8 }}>
            Unlock {featureName}
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,.85)', lineHeight: 1.5 }}>
            The only app built specifically for Croatian — by someone who loves the homeland.
          </div>
        </div>

        <div style={{ padding: '24px 20px 12px' }}>

          {/* ── Premium features ──────────────────────────────────────────── */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--subtext)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }}>
              Premium includes
            </div>
            {PREMIUM_FEATURES.map(f => (
              <div key={f.text} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 10 }}>
                <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{f.icon}</span>
                <span style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.4 }}>{f.text}</span>
              </div>
            ))}
          </div>

          {/* ── Plan selector ─────────────────────────────────────────────── */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
            {PLANS.map(plan => (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                aria-pressed={selectedPlan === plan.id}
                aria-label={`${plan.label} plan — ${plan.price}${plan.per}${plan.priceNote ? `, ${plan.priceNote}` : ''}`}
                style={{
                  flex: 1, padding: '14px 12px', borderRadius: 16, cursor: 'pointer',
                  border: selectedPlan === plan.id
                    ? '2.5px solid #0e7490'
                    : '2px solid var(--card-b)',
                  background: selectedPlan === plan.id
                    ? 'rgba(14,116,144,.07)'
                    : 'var(--card)',
                  position: 'relative', textAlign: 'center',
                  transition: 'all .15s',
                }}>
                {plan.badge && (
                  <div style={{
                    position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                    background: '#0e7490', color: '#fff', fontSize: 10, fontWeight: 800,
                    padding: '2px 10px', borderRadius: 20, whiteSpace: 'nowrap',
                  }}>{plan.badge}</div>
                )}
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--subtext)', marginBottom: 4 }}>
                  {plan.label}
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)' }}>
                  {plan.price}
                </div>
                <div style={{ fontSize: 11, color: 'var(--subtext)' }}>{plan.per}</div>
                {plan.priceNote && (
                  <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 700, marginTop: 3 }}>
                    {plan.priceNote}
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* ── CTA button ────────────────────────────────────────────────── */}
          <button
            onClick={handleSubscribe}
            disabled={loading}
            style={{
              width: '100%', padding: '16px', borderRadius: 18,
              background: loading
                ? '#94a3b8'
                : 'linear-gradient(135deg,#dc2626 0%,#b91c1c 100%)',
              color: '#fff', border: 'none', fontSize: 17, fontWeight: 900,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 4px 16px rgba(220,38,38,.35)',
              transition: 'all .15s', marginBottom: 10,
            }}>
            {loading ? 'Processing…' : `Start 7-Day Free Trial`}
          </button>
          <div style={{ fontSize: 11, color: 'var(--subtext)', textAlign: 'center', marginBottom: 16 }}>
            Then {selectedPlan === 'yearly' ? '$49.99/year' : '$7.99/month'} · Cancel anytime · No commitment
          </div>

          {/* ── Promo code ────────────────────────────────────────────────── */}
          <button
            onClick={() => setShowPromo(v => !v)}
            style={{
              background: 'none', border: 'none', color: '#0e7490',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              padding: '4px 0', display: 'block', margin: '0 auto 8px',
            }}>
            Have a promo code? {showPromo ? '▲' : '▼'}
          </button>
          {showPromo && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input
                aria-label="Promo code"
                value={promoCode}
                onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoMsg(''); }}
                placeholder="Enter code (e.g. HRVATSKA2026)"
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: 12,
                  border: '1.5px solid var(--card-b)', fontSize: 13,
                  background: 'var(--card)', color: 'var(--text)',
                  fontWeight: 700, letterSpacing: 1,
                }}
                maxLength={20}
              />
              <button
                onClick={handlePromo}
                style={{
                  padding: '10px 18px', borderRadius: 12, border: 'none',
                  background: '#0e7490', color: '#fff', fontSize: 13,
                  fontWeight: 700, cursor: 'pointer',
                }}>Apply</button>
            </div>
          )}
          {promoMsg && (
            <div style={{
              padding: '10px 14px', borderRadius: 12, marginBottom: 12,
              background: promoMsg.includes('Invalid') || promoMsg.includes('already')
                ? '#fef2f2' : '#f0fdf4',
              color: promoMsg.includes('Invalid') || promoMsg.includes('already')
                ? '#dc2626' : '#16a34a',
              fontSize: 13, fontWeight: 600, textAlign: 'center',
            }}>{promoMsg}</div>
          )}

          {/* ── Trust signals ─────────────────────────────────────────────── */}
          <div style={{
            borderTop: '1px solid var(--card-b)', paddingTop: 14,
            display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap',
          }}>
            {['🔒 Secure payment', '✉️ Cancel anytime', '🇭🇷 Built with love'].map(t => (
              <span key={t} style={{ fontSize: 11, color: 'var(--subtext)', fontWeight: 600 }}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
