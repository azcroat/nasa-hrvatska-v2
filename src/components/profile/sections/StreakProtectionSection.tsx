import React, { useState } from 'react';
import { useStats } from '../../../context/StatsContext.tsx';
import { getFreezesStored, purchaseFreeze, FREEZE_COST_XP } from '../../../lib/streakFreeze.js';

/**
 * Streak Protection (freeze slots) — extracted from SettingsTab as part of the
 * 1a decomposition. Owns its freeze state + purchase handler; reads/writes the
 * stats context via useStats() directly. Takes only `onSyncNow` as a prop so a
 * freeze purchase can flush the XP deduction to Firestore immediately.
 * Behavior-identical to the prior inline block.
 */
export default function StreakProtectionSection({
  onSyncNow,
}: {
  onSyncNow?: () => void | Promise<boolean | void>;
}) {
  const { stats: statsCtx, setStats } = useStats();
  const [freezesStored, setFreezesStored] = useState(() => getFreezesStored());
  const [freezeMsg, setFreezeMsg] = useState('');

  function handleBuyFreeze() {
    const result = purchaseFreeze(statsCtx.xp || 0, setStats as any);
    if (result.ok) {
      setFreezesStored(result.stored ?? 0);
      setFreezeMsg(`❄️ Freeze purchased! ${result.stored ?? 0}/2 stored.`);
      setTimeout(() => setFreezeMsg(''), 3000);
      // Persist XP deduction to Firebase immediately — without this, the deduction
      // lives only in React state and localStorage. If the app closes before the next
      // periodic sync, the old (pre-purchase) XP is restored from Firestore on next open.
      if (onSyncNow)
        setTimeout(() => {
          onSyncNow?.();
        }, 300);
    } else {
      setFreezeMsg(result.reason ?? '');
      setTimeout(() => setFreezeMsg(''), 3000);
    }
  }

  return (
    <React.Fragment>
      {/* ── STREAK PROTECTION ── */}
      <div className="section-hdr" style={{ marginTop: 24 }}>
        <div className="section-hdr-icon" style={{ background: 'rgba(56,189,248,.12)' }}>
          ❄️
        </div>
        <div className="section-hdr-text">
          <div className="section-hdr-title">Streak Protection</div>
          <div className="section-hdr-sub">Keep your streak safe on miss days</div>
        </div>
      </div>
      <div
        style={{
          background: 'linear-gradient(135deg,rgba(56,189,248,.06),rgba(14,116,144,.04))',
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
          border: '1.5px solid rgba(56,189,248,.2)',
          boxShadow: 'var(--card-shadow)',
        }}
      >
        <div style={{ fontSize: 12, color: 'var(--subtext)', marginBottom: 14, lineHeight: 1.5 }}>
          Freezes automatically protect your streak if you miss a day. Max 2 stored.
        </div>
        {/* Freeze slots */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
          {[0, 1].map((i) => (
            <div
              key={i}
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: i < freezesStored ? 'rgba(56,189,248,0.15)' : 'var(--bar-bg)',
                border: `2px solid ${i < freezesStored ? '#38bdf8' : 'var(--card-b)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: i < freezesStored ? 26 : 18,
                boxShadow: i < freezesStored ? '0 2px 8px rgba(56,189,248,.25)' : 'none',
                transition: 'all .2s',
              }}
            >
              {i < freezesStored ? '❄️' : '○'}
            </div>
          ))}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--heading)' }}>
              {freezesStored}/2 stored
            </div>
            <div style={{ fontSize: 11, color: 'var(--subtext)', marginTop: 2 }}>
              {freezesStored === 2
                ? "Fully stocked — you're protected!"
                : `${2 - freezesStored} slot${2 - freezesStored > 1 ? 's' : ''} available`}
            </div>
          </div>
        </div>
        <button
          disabled={freezesStored >= 2 || (statsCtx?.xp || 0) < FREEZE_COST_XP}
          onClick={handleBuyFreeze}
          style={{
            width: '100%',
            padding: '11px',
            borderRadius: 12,
            background:
              freezesStored >= 2 || (statsCtx?.xp || 0) < FREEZE_COST_XP
                ? 'var(--bar-bg)'
                : 'linear-gradient(135deg,#38bdf8,#0e7490)',
            color:
              freezesStored >= 2 || (statsCtx?.xp || 0) < FREEZE_COST_XP
                ? 'var(--subtext)'
                : '#fff',
            border: 'none',
            fontWeight: 700,
            fontSize: 13,
            cursor:
              freezesStored >= 2 || (statsCtx?.xp || 0) < FREEZE_COST_XP
                ? 'not-allowed'
                : 'pointer',
            fontFamily: "'Outfit',sans-serif",
          }}
        >
          {freezesStored >= 2
            ? '✓ Freeze slots full'
            : `Buy Freeze — 50 XP (you have ${statsCtx?.xp || 0})`}
        </button>
        {freezeMsg && (
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--success)', fontWeight: 700 }}>
            {freezeMsg}
          </div>
        )}
      </div>
    </React.Fragment>
  );
}
