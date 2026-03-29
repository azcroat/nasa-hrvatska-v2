import React, { useState, useEffect, useRef, useCallback } from 'react';
import { apiFetch } from '../../lib/apiFetch.js';
import { CITY_PHOTOS } from './StoryModeData.js';

// ── Word token component ───────────────────────────────────────────────────────
function WordToken({ word, accentColor, onTap, isPunctuation }) {
  const [state, setState] = useState('idle'); // idle | loading | shown
  const [translation, setTranslation] = useState(null);
  const timerRef = useRef(null);

  const handleClick = useCallback(async () => {
    if (isPunctuation) return;
    setState('loading');
    onTap();
    try {
      const res = await apiFetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'translate',
          messages: [{ role: 'user', content: word }],
          params: { word },
        }),
      });
      const data = await res.json();
      const tr = data.translation || data.reply || data.content || '…';
      setTranslation(tr);
      setState('shown');
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setState('idle'), 2500);
    } catch {
      setState('idle');
    }
  }, [word, isPunctuation, onTap]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const isActive = state === 'loading' || state === 'shown';

  return (
    <span style={{ display: 'inline-block', position: 'relative', margin: '0 1px' }}>
      <span
        onClick={handleClick}
        style={{
          cursor: isPunctuation ? 'default' : 'pointer',
          padding: isPunctuation ? '0' : '1px 3px',
          borderRadius: 4,
          backgroundColor: isActive ? 'rgba(254,240,138,0.85)' : 'transparent',
          borderBottom: (!isPunctuation && !isActive) ? `1px dotted ${accentColor}44` : 'none',
          transition: 'background-color 0.15s ease',
          fontSize: 17,
          lineHeight: 1.9,
          color: 'var(--heading)',
          userSelect: 'none',
        }}
      >
        {word}
      </span>
      {isActive && (
        <span style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#1c1917',
          color: '#fafaf9',
          fontSize: 12,
          fontWeight: 500,
          padding: '4px 8px',
          borderRadius: 6,
          whiteSpace: 'nowrap',
          zIndex: 100,
          boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
          pointerEvents: 'none',
        }}>
          {state === 'loading' ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                border: '1.5px solid #fafaf9',
                borderTopColor: 'transparent',
                display: 'inline-block',
                animation: 'spin 0.6s linear infinite',
              }} />
              translating…
            </span>
          ) : (
            <>{word} → {translation}</>
          )}
        </span>
      )}
    </span>
  );
}

// ── Tokenise story text into words + punctuation ──────────────────────────────
function tokenise(text) {
  const tokens = [];
  const parts = text.split(/(\s+)/);
  parts.forEach((part, i) => {
    if (/^\s+$/.test(part)) {
      tokens.push({ type: 'space', value: part, key: `s${i}` });
    } else if (part) {
      tokens.push({ type: 'word', value: part, key: `w${i}` });
    }
  });
  return tokens;
}

const VIEW_CSS = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse-dot {
    0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
    40% { transform: scale(1); opacity: 1; }
  }
  @keyframes fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  .story-section { animation: fade-in 0.4s ease forwards; }
`;

export default function StoryViewPanel({
  storyData,
  selectedCity,
  selectedLevel,
  ttsPlaying,
  tappedWords,
  vocabOpen,
  setVocabOpen,
  discussOpen,
  setDiscussOpen,
  storyRef,
  onWordTap,
  onTTSToggle,
  onNewStory,
  onBack,
}) {
  const accentColor = selectedCity.color;
  const photoSrc = CITY_PHOTOS[selectedCity.name] || CITY_PHOTOS.default;
  const tokens = tokenise(storyData.story || '');

  return (
    <div className="scr-wrap" ref={storyRef}>
      <style>{VIEW_CSS + `.vocab-row:hover { background: ${accentColor}0d; }`}</style>

      {/* City photo header */}
      <div style={{
        position: 'relative',
        height: 200,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 24,
      }}>
        <img
          src={photoSrc}
          alt={selectedCity.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={e => { /** @type {HTMLImageElement} */ (e.target).src = CITY_PHOTOS.default; }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)',
        }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 20px' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
            {selectedCity.icon} {selectedCity.name}
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.82)', marginTop: 2 }}>
            {selectedCity.region} · Level {selectedLevel}
          </div>
        </div>
      </div>

      {/* Story title */}
      <div className="story-section" style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--heading)', lineHeight: 1.3, marginBottom: 4 }}>
          {storyData.title}
        </h1>
        {storyData.title_en && (
          <div style={{ fontSize: 15, color: 'var(--subtext)', fontStyle: 'italic' }}>
            {storyData.title_en}
          </div>
        )}
      </div>

      {/* Story text — word-tap */}
      <div className="c story-section" style={{ marginBottom: 20, padding: '20px 20px' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: accentColor, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Tap any word to translate ✨
        </div>
        <div style={{ fontSize: 17, lineHeight: 1.9, color: 'var(--heading)' }}>
          {tokens.map(tok => {
            if (tok.type === 'space') return <span key={tok.key}>{tok.value}</span>;
            const clean = tok.value.replace(/[.,!?;:"""''()—–\-]+$/g, '');
            const suffix = tok.value.slice(clean.length);
            const isPunctOnly = !clean;
            return (
              <React.Fragment key={tok.key}>
                {isPunctOnly ? (
                  <span style={{ fontSize: 17, lineHeight: 1.9, color: 'var(--heading)' }}>{tok.value}</span>
                ) : (
                  <>
                    <WordToken
                      word={clean}
                      accentColor={accentColor}
                      onTap={onWordTap}
                      isPunctuation={false}
                    />
                    {suffix && <span style={{ fontSize: 17, lineHeight: 1.9 }}>{suffix}</span>}
                  </>
                )}
              </React.Fragment>
            );
          })}
        </div>
        {tappedWords > 0 && (
          <div style={{ marginTop: 16, fontSize: 12, color: 'var(--subtext)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: accentColor }}>●</span>
            {tappedWords} word{tappedWords !== 1 ? 's' : ''} looked up
            {tappedWords >= 5 && ' · Keep reading to unlock XP!'}
          </div>
        )}
      </div>

      {/* TTS button */}
      <button
        className="b"
        onClick={onTTSToggle}
        style={{
          width: '100%',
          marginBottom: 12,
          backgroundColor: ttsPlaying ? '#fef9c3' : accentColor,
          color: ttsPlaying ? '#854d0e' : '#fff',
          border: 'none',
          borderRadius: 12,
          padding: '14px',
          fontSize: 15,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        {ttsPlaying ? (
          <>
            <span style={{
              width: 12, height: 12,
              border: '2px solid currentColor',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              display: 'inline-block',
              animation: 'spin 0.7s linear infinite',
            }} />
            Stop Audio
          </>
        ) : (
          <><span aria-hidden="true">🔊</span>{' Read Story Aloud'}</>
        )}
      </button>

      {/* Cultural note */}
      {storyData.cultural_note && (
        <div className="story-section" style={{
          padding: '16px 18px',
          borderRadius: 12,
          backgroundColor: `${accentColor}10`,
          border: `1.5px solid ${accentColor}33`,
          marginBottom: 12,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: accentColor, marginBottom: 6 }}>
            📝 Cultural Note
          </div>
          <div style={{ fontSize: 14, color: 'var(--heading)', lineHeight: 1.7 }}>
            {storyData.cultural_note}
          </div>
        </div>
      )}

      {/* Vocabulary section */}
      {storyData.vocabulary && storyData.vocabulary.length > 0 && (
        <div className="c story-section" style={{ marginBottom: 12 }}>
          <button
            onClick={() => setVocabOpen(v => !v)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--heading)' }}>
              📚 Vocabulary ({storyData.vocabulary.length} words)
            </div>
            <span style={{ fontSize: 18, color: 'var(--subtext)', transform: vocabOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>⌄</span>
          </button>
          {vocabOpen && (
            <div style={{ marginTop: 12 }}>
              {storyData.vocabulary.map((v, i) => (
                <div
                  key={i}
                  className="vocab-row"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 10px',
                    borderRadius: 8,
                    transition: 'background 0.15s',
                  }}
                >
                  <span style={{ fontWeight: 700, color: accentColor, fontSize: 15 }}>{v.hr || v.croatian || v.word}</span>
                  <span style={{ fontSize: 14, color: 'var(--subtext)' }}>{v.en || v.english || v.translation}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Comprehension questions */}
      {storyData.comprehension_questions && storyData.comprehension_questions.length > 0 && (
        <div className="c story-section" style={{ marginBottom: 12 }}>
          <button
            onClick={() => setDiscussOpen(d => !d)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--heading)' }}>
              💬 Comprehension Questions
            </div>
            <span style={{ fontSize: 18, color: 'var(--subtext)', transform: discussOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>⌄</span>
          </button>
          {discussOpen && (
            <div style={{ marginTop: 12 }}>
              {storyData.comprehension_questions.map((q, i) => (
                <div key={i} style={{
                  padding: '10px 12px',
                  marginBottom: 8,
                  borderRadius: 8,
                  backgroundColor: 'var(--app-bg)',
                  borderLeft: `3px solid ${accentColor}`,
                  fontSize: 14,
                  color: 'var(--heading)',
                  lineHeight: 1.6,
                }}>
                  <span style={{ fontWeight: 700, color: accentColor }}>{i + 1}. </span>{q}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button
          className="b"
          onClick={onNewStory}
          style={{ flex: 1, padding: '14px', borderRadius: 12, backgroundColor: accentColor, color: '#fff', border: 'none', fontWeight: 700, fontSize: 15 }}
        >
          🔄 New Story
        </button>
        <button
          className="b"
          onClick={onBack}
          style={{ flex: 1, padding: '14px', borderRadius: 12, backgroundColor: 'transparent', border: '1.5px solid var(--card-b)', color: 'var(--subtext)', fontWeight: 600, fontSize: 15 }}
        >
          ← Back
        </button>
      </div>
    </div>
  );
}
