import React from 'react';

/**
 * Heritage Learner entry-point card — extracted verbatim from SettingsTab as the
 * pilot of the 1a decomposition. Presentational + a single navigation action;
 * reflects active state from the `nh_heritage_mode` localStorage flag. Behavior
 * is identical to the prior inline block (the repeated localStorage reads are
 * hoisted to one render-time const — same value within a render).
 */
export default function HeritageEntrySection({ setScr }: { setScr: (scr: string) => void }) {
  const active = localStorage.getItem('nh_heritage_mode') === 'true';
  return (
    <>
      <div className="section-hdr" style={{ marginTop: 24 }}>
        <div
          className="section-hdr-icon"
          style={{ background: 'linear-gradient(135deg,rgba(194,65,12,.15),rgba(234,88,12,.1))' }}
        >
          🇭🇷
        </div>
        <div className="section-hdr-text">
          <div className="section-hdr-title">Heritage Learner</div>
          <div className="section-hdr-sub">Diaspora-specific learning path</div>
        </div>
      </div>
      <button
        className="tc"
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '16px',
          marginBottom: 10,
        }}
        onClick={() => setScr('heritage_mode')}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 13,
            background: active
              ? 'linear-gradient(135deg,#7c2d12,#c2410c)'
              : 'linear-gradient(135deg,#9a3412,#ea580c)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'var(--text-xl)',
            flexShrink: 0,
          }}
        >
          🇭🇷
        </div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--heading)' }}>
            {active ? 'Heritage Mode Active' : 'I grew up hearing Croatian at home →'}
          </div>
          <div
            style={{
              fontSize: 'var(--text-xs)',
              color: active ? 'var(--success)' : 'var(--subtext)',
              marginTop: 1,
            }}
          >
            {active
              ? '✓ Dialect set · Gap analysis complete · Baka phrases saved'
              : 'Diaspora-specific path: dialect check, gap analysis, family phrases'}
          </div>
        </div>
        <div style={{ fontSize: 'var(--text-xl)', color: 'var(--subtext)', opacity: 0.8 }}>›</div>
      </button>
    </>
  );
}
