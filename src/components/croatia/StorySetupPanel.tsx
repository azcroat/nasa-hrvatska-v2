// @ts-nocheck
import React from 'react';
import { H } from '../../data';
import { STORY_CITIES, LEVELS } from './StoryModeData.js';

const SETUP_CSS = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse-dot {
    0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
    40% { transform: scale(1); opacity: 1; }
  }
  @keyframes gradient-shift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  .story-gen-btn {
    background: linear-gradient(135deg, #0e7490, #7c3aed, #b45309);
    background-size: 200% 200%;
    animation: gradient-shift 4s ease infinite;
    border: none !important;
  }
  .city-chip:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.12); }
  .city-chip { transition: transform 0.15s ease, box-shadow 0.15s ease; }
  .level-btn:hover { transform: scale(1.05); }
  .level-btn { transition: transform 0.15s ease; }
`;

export default function StorySetupPanel({
  goalMeta,
  selectedCity,
  setSelectedCity,
  selectedLevel,
  setSelectedLevel,
  characterName,
  setCharacterName,
  error,
  onGenerate,
  onBack,
}) {
  return (
    <div className="scr-wrap">
      <style>{SETUP_CSS}</style>

      {H('📖 Immersive Stories', 'AI-generated stories set in real Croatian places, tailored to your level')}

      {/* Goal-aware recommendation banner */}
      {goalMeta && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 12,
          padding: '12px 14px', borderRadius: 12, marginBottom: 16,
          background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
          border: '1.5px solid #86efac',
        }}>
          <span style={{ fontSize: 22, flexShrink: 0 }}>{goalMeta.icon}</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
              Personalized for You · {goalMeta.label}
            </div>
            <div style={{ fontSize: 13, color: '#166534', lineHeight: 1.5 }}>
              {goalMeta.tip}
            </div>
            <div style={{ fontSize: 12, color: '#15803d', marginTop: 4 }}>
              Recommended: {goalMeta.cities?.join(', ') || 'Multiple cities'}
            </div>
          </div>
        </div>
      )}

      {/* City selector */}
      <div className="c" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--subtext)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Choose a city
        </div>
        <div style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 8,
          scrollbarWidth: 'none',
        }}>
          {STORY_CITIES.map(city => (
            <button
              key={city.name}
              className="city-chip"
              onClick={() => setSelectedCity(city)}
              style={{
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                padding: '10px 14px',
                borderRadius: 12,
                border: `2px solid ${selectedCity.name === city.name ? city.color : 'var(--card-b)'}`,
                backgroundColor: selectedCity.name === city.name ? city.color + '18' : 'var(--card)',
                cursor: 'pointer',
                minWidth: 72,
              }}
            >
              <span style={{ fontSize: 22 }}>{city.icon}</span>
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                color: selectedCity.name === city.name ? city.color : 'var(--heading)',
              }}>{city.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Level selector */}
      <div className="c" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--subtext)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Your level
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {LEVELS.map(lvl => (
            <button
              key={lvl}
              className="level-btn"
              onClick={() => setSelectedLevel(lvl)}
              style={{
                padding: '8px 18px',
                borderRadius: 10,
                border: `2px solid ${selectedLevel === lvl ? selectedCity.color : 'var(--card-b)'}`,
                backgroundColor: selectedLevel === lvl ? selectedCity.color : 'var(--card)',
                color: selectedLevel === lvl ? '#fff' : 'var(--heading)',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Character name */}
      <div className="c" style={{ marginBottom: 24 }}>
        <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--subtext)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Your name (for the story)
        </label>
        <input
          type="text"
          value={characterName}
          onChange={e => setCharacterName(e.target.value)}
          placeholder="Optional — leave blank to use 'you'"
          maxLength={40}
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: 10,
            border: '1.5px solid var(--card-b)',
            backgroundColor: 'var(--app-bg)',
            color: 'var(--heading)',
            fontSize: 15,
            outline: 'none',
          }}
        />
      </div>

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: 10, backgroundColor: 'var(--error-bg)', border: '1px solid var(--error-b)', color: 'var(--error)', fontSize: 14, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <button
        className="b story-gen-btn"
        onClick={onGenerate}
        style={{
          width: '100%',
          padding: '18px',
          borderRadius: 14,
          color: '#fff',
          fontSize: 17,
          fontWeight: 700,
          letterSpacing: '0.02em',
          boxShadow: '0 8px 32px rgba(14,116,144,0.35)',
        }}
      >
        ✨ Generate Story in {selectedCity.icon} {selectedCity.name}
      </button>

      <button className="b" onClick={onBack} style={{ width: '100%', marginTop: 12, fontSize: 14, backgroundColor: 'transparent', border: '1.5px solid var(--card-b)', color: 'var(--subtext)' }}>
        ← Back
      </button>
    </div>
  );
}
