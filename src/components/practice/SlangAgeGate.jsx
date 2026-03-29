import React from 'react';

export default function SlangAgeGate({ onUnlock, onBack }) {
  return (
    <div className="scr-wrap" style={{ paddingBottom: 100 }}>
      <div style={{
        textAlign: 'center', padding: '48px 24px',
        background: 'linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)',
        borderRadius: 24, color: '#fff', marginBottom: 20,
      }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🔞</div>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, marginBottom: 12, color: '#fff' }}>
          Age Confirmation Required
        </h2>
        <p style={{ fontSize: 15, lineHeight: 1.6, opacity: .9, marginBottom: 24 }}>
          This section contains adult language.<br />
          <strong>Are you 18 or older?</strong>
        </p>
        <div style={{
          background: 'rgba(255,255,255,.08)', borderRadius: 14,
          padding: '16px 20px', marginBottom: 28, fontSize: 13,
          lineHeight: 1.7, textAlign: 'left',
        }}>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>📚 12 sections — 150+ entries:</div>
          <div>🔥 The Classics — jeb- construction mastery</div>
          <div>😤 Everyday Exclamations</div>
          <div>😎 Street Slang — sound like a local</div>
          <div>👥 People & Addresses</div>
          <div>☀️ Dalmatian / Split dialect</div>
          <div>🏙️ Zagreb / Kajkavian slang</div>
          <div>🔄 Šatrovački — Croatian secret syllable code</div>
          <div>📱 Gen Z & Internet language 2025</div>
          <div>🍺 Drunk, Hungover & Broke vocabulary</div>
          <div>⚽ Football culture language</div>
          <div>🗺️ Zagreb vs Split — regional comparison</div>
          <div>🎨 The Art of the Curse — grammar masterclass</div>
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={onUnlock} style={{
            padding: '14px 32px', borderRadius: 14, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg,#dc2626,#b91c1c)',
            color: '#fff', fontSize: 15, fontWeight: 900,
            fontFamily: "'Outfit',sans-serif",
            boxShadow: '0 8px 32px rgba(220,38,38,.4)',
          }}>
            Yes, continue
          </button>
          <button onClick={onBack} style={{
            padding: '14px 32px', borderRadius: 14, cursor: 'pointer',
            background: 'rgba(255,255,255,.12)',
            border: '1.5px solid rgba(255,255,255,.25)',
            color: '#fff', fontSize: 15, fontWeight: 700,
            fontFamily: "'Outfit',sans-serif",
          }}>
            No, go back
          </button>
        </div>
        <div style={{ marginTop: 14, fontSize: 11, opacity: .5 }}>+15 XP for unlocking this module</div>
      </div>
    </div>
  );
}
