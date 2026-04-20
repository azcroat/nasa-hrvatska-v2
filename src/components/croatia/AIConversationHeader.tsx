// @ts-nocheck
import React from 'react';

export default function AIConversationHeader({
  appMode,
  setAppMode,
  scenario,
  sceneForCat,
  onModeChange,
}) {
  const _headerBg = scenario
    ? `linear-gradient(145deg,rgba(12,74,110,0.88),rgba(14,116,144,0.82)), url('${sceneForCat(scenario.cat)}') center / cover no-repeat`
    : 'linear-gradient(145deg,#0c4a6e,#0e7490)';

  return (
    <div
      style={{
        background: _headerBg,
        borderRadius: 22,
        padding: '22px 20px',
        marginBottom: 22,
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative blobs */}
      <div
        style={{
          position: 'absolute',
          right: -30,
          top: -30,
          width: 160,
          height: 160,
          background: 'rgba(255,255,255,.05)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: -20,
          bottom: -40,
          width: 120,
          height: 120,
          background: 'rgba(255,255,255,.04)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />

      {appMode === 'convo' ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 14,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Tutor portrait */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 20,
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,.3), 0 0 0 3px rgba(255,255,255,.25)',
                background: 'linear-gradient(135deg,rgba(255,255,255,.15),rgba(255,255,255,.05))',
              }}
            >
              <img
                src="/images/portraits/tutor-hero.webp"
                alt="Maja — Croatian tutor"
                loading="lazy"
                onError={(e) => {
                  const t = /** @type {HTMLImageElement} */ e.target;
                  t.style.display = 'none';
                  const sib = /** @type {HTMLElement} */ t.nextSibling;
                  if (sib) sib.style.display = 'flex';
                }}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'top center',
                }}
              />
              <div
                style={{
                  display: 'none',
                  width: '100%',
                  height: '100%',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 32,
                }}
              >
                🇭🇷
              </div>
            </div>
            {/* Online indicator */}
            <div
              style={{
                position: 'absolute',
                bottom: 4,
                right: 4,
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: '#22c55e',
                border: '2.5px solid #0e7490',
                boxShadow: '0 0 6px rgba(34,197,94,.6)',
              }}
            />
          </div>
          <div>
            <div
              style={{
                fontSize: 'var(--text-xl)',
                fontWeight: 900,
                fontFamily: "'Playfair Display',serif",
                letterSpacing: '-.02em',
                lineHeight: 1.1,
                marginBottom: 3,
              }}
            >
              Razgovor s Majom
            </div>
            <div style={{ fontSize: 'var(--text-sm)', opacity: 0.8, lineHeight: 1.4 }}>
              Native Croatian speaker · All levels
            </div>
            <div style={{ marginTop: 6, display: 'flex', gap: 4, alignItems: 'center' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
              <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.85 }}>
                Online · Ready to talk
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{ fontSize: 'var(--text-4xl)', marginBottom: 8, position: 'relative', zIndex: 1 }}
        >
          ✍️
        </div>
      )}

      <div
        style={{
          fontSize: 'var(--text-sm)',
          opacity: 0.85,
          lineHeight: 1.65,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {appMode === 'write'
          ? 'Write freely in Croatian, then get a full AI correction with line-by-line feedback and a score.'
          : '40+ real-life scenarios. Maja corrects your grammar in real time, speaks every response in Croatian, and evaluates your fluency at the end.'}
      </div>
      {/* Mode toggle tabs */}
      <div style={{ display: 'flex', gap: 8, marginTop: 14, position: 'relative', zIndex: 1 }}>
        {[
          ['convo', '💬 Razgovor'],
          ['write', '✍️ Free Write'],
        ].map(([mode, label]) => (
          <button
            key={mode}
            onClick={() => onModeChange(mode)}
            style={{
              padding: '7px 16px',
              borderRadius: 20,
              border: '2px solid rgba(255,255,255,.5)',
              fontWeight: 800,
              fontSize: 'var(--text-sm)',
              cursor: 'pointer',
              fontFamily: "'Outfit',sans-serif",
              background: appMode === mode ? 'rgba(255,255,255,.25)' : 'transparent',
              color: 'white',
              transition: 'all .15s',
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
