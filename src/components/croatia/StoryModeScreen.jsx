import React, { useState, useEffect, useRef, useCallback } from 'react';
import { H } from '../../data.jsx';
import { useStats } from '../../context/StatsContext.jsx';
import { useOnlineStatus } from '../../hooks/useOnlineStatus.js';
import { apiFetch } from '../../lib/apiFetch.js';

// ── City data ─────────────────────────────────────────────────────────────────
const STORY_CITIES = [
  { name: 'Zagreb',    icon: '🏛️', color: '#0e7490', region: 'Central Croatia' },
  { name: 'Split',     icon: '🏟️', color: '#b45309', region: 'Dalmatia' },
  { name: 'Dubrovnik', icon: '🏯', color: '#7c3aed', region: 'Southern Dalmatia' },
  { name: 'Hvar',      icon: '🌿', color: '#16a34a', region: 'Dalmatia' },
  { name: 'Rovinj',    icon: '🎨', color: '#dc2626', region: 'Istria' },
  { name: 'Šibenik',   icon: '⛪', color: '#0369a1', region: 'Northern Dalmatia' },
  { name: 'Plitvice',  icon: '🌊', color: '#0e7490', region: 'Lika' },
  { name: 'Labin',     icon: '⛏️', color: '#0e7490', region: 'Istria' },
  { name: 'Mostar',    icon: '🌉', color: '#b45309', region: 'Herzegovina' },
  { name: 'Varaždin',  icon: '🎶', color: '#7c3aed', region: 'Northern Croatia' },
  { name: 'Zadar',     icon: '🌅', color: '#b45309', region: 'Northern Dalmatia' },
  { name: 'Rijeka',    icon: '🚢', color: '#0369a1', region: 'Kvarner' },
];

const CITY_PHOTOS = {
  Zagreb:    '/images/scenes/zagreb.webp',
  Split:     'https://images.unsplash.com/photo-1559570704-fea2efaf9e79?w=800&q=85&fit=crop',
  Dubrovnik: '/images/scenes/dubrovnik-ai.webp',
  Hvar:      'https://images.unsplash.com/photo-1527515637462-cff94edd89b6?w=800&q=85&fit=crop',
  Rovinj:    'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800&q=85&fit=crop',
  Plitvice:  '/images/scenes/plitvice.webp',
  Labin:     '/images/scenes/labin.webp',
  Mostar:    '/images/scenes/mostar.webp',
  default:   '/images/scenes/dalmatian-ai.webp',
};

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

// ── TTS helper ────────────────────────────────────────────────────────────────
async function playTTS(text) {
  const res = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, slow: false }),
  });
  if (!res.ok) throw new Error('TTS failed');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.play();
  audio.addEventListener('ended', () => URL.revokeObjectURL(url));
  return audio;
}

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

// ── Pulsing dots ──────────────────────────────────────────────────────────────
function PulsingDots({ color }) {
  return (
    <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 8, height: 8, borderRadius: '50%',
          backgroundColor: color || '#0e7490',
          display: 'inline-block',
          animation: `pulse-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
    </span>
  );
}

// ── Goal meta ─────────────────────────────────────────────────────────────────
const GOAL_META = {
  heritage: {
    label: 'Heritage Seeker',
    icon: '🧬',
    cities: ['Zagreb', 'Varaždin', 'Šibenik'],
    theme: 'family history and Croatian roots',
    tip: 'Stories about ancestry, old family homes, and cultural identity',
  },
  family: {
    label: 'Family Connection',
    icon: '👨‍👩‍👧',
    cities: ['Split', 'Zagreb', 'Zadar'],
    theme: 'everyday family life and domestic moments',
    tip: 'Stories set in homes, markets, and family gatherings',
  },
  travel: {
    label: 'Traveler',
    icon: '✈️',
    cities: ['Dubrovnik', 'Hvar', 'Rovinj'],
    theme: 'travel, exploration, and local discoveries',
    tip: 'Stories as a visitor navigating real Croatian places',
  },
  culture: {
    label: 'Culture Lover',
    icon: '🎭',
    cities: ['Šibenik', 'Zadar', 'Varaždin'],
    theme: 'art, music, festivals, and Croatian traditions',
    tip: 'Stories rich in cultural references and local customs',
  },
  partner: {
    label: 'Partner Goal',
    icon: '💑',
    cities: ['Rovinj', 'Hvar', 'Dubrovnik'],
    theme: 'romantic settings and heartfelt conversations',
    tip: 'Stories set in intimate, scenic Croatian locations',
  },
  fluent: {
    label: 'Fluency Goal',
    icon: '🗣️',
    cities: ['Zagreb', 'Split', 'Rijeka'],
    theme: 'authentic everyday Croatian life and natural dialogue',
    tip: 'Stories with rich vocabulary and natural speech patterns',
  },
};

// ── Main component ─────────────────────────────────────────────────────────────
export default function StoryModeScreen({ goBack, award }) {
  const { level: userLevel } = useStats();
  const isOnline = useOnlineStatus();

  // Read user goal
  const userGoal = (() => { try { return localStorage.getItem('nh_goal') || ''; } catch { return ''; } })();
  const goalMeta = GOAL_META[userGoal] || null;

  // Setup state — pre-select a goal-recommended city if available
  const [selectedCity, setSelectedCity] = useState(() => {
    if (goalMeta) {
      const rec = STORY_CITIES.find(c => goalMeta.cities.includes(c.name));
      if (rec) return rec;
    }
    return STORY_CITIES[0];
  });
  const [selectedLevel, setSelectedLevel] = useState(userLevel || 'A2');
  const [characterName, setCharacterName] = useState('');

  // Phase: setup | loading | story | error
  const [phase, setPhase] = useState('setup');
  const [storyData, setStoryData] = useState(null);
  const [error, setError] = useState('');

  // Story interaction state
  const [tappedWords, setTappedWords] = useState(0);
  const [vocabOpen, setVocabOpen] = useState(false);
  const [discussOpen, setDiscussOpen] = useState(false);
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const audioRef = useRef(null);
  const awardFired = useRef(false);
  const storyRef = useRef(null);
  const tappedWordsRef = useRef(0);

  // Keep ref in sync so scroll handler always sees current value without re-adding listener
  useEffect(() => { tappedWordsRef.current = tappedWords; }, [tappedWords]);

  // Track reading completion via scroll — only re-attach when phase changes, not on every word tap
  useEffect(() => {
    if (phase !== 'story' || !storyRef.current) return;
    const el = storyRef.current;
    const check = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      if (scrollTop + clientHeight >= scrollHeight - 80 && tappedWordsRef.current >= 5 && !awardFired.current) {
        awardFired.current = true;
        award(15);
      }
    };
    el.addEventListener('scroll', check, { passive: true });
    return () => el.removeEventListener('scroll', check);
  }, [phase, award]);

  const generateStory = useCallback(async () => {
    if (!isOnline) { setError('You need an internet connection to generate stories.'); return; }
    setPhase('loading');
    setError('');
    awardFired.current = false;
    setTappedWords(0);
    try {
      const res = await apiFetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'story',
          messages: [{ role: 'user', content: `Generate an immersive Croatian story set in ${selectedCity.name}` }],
          params: {
            city: selectedCity.name,
            region: selectedCity.region,
            level: selectedLevel,
            character_name: characterName || 'you',
            goal: userGoal || undefined,
            goal_theme: goalMeta?.theme || undefined,
          },
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setStoryData(data);
      setPhase('story');
    } catch (e) {
      setError('Could not generate story. Please try again.');
      setPhase('setup');
    }
  }, [isOnline, selectedCity, selectedLevel, characterName]);

  const handleTTS = useCallback(async () => {
    if (!storyData || ttsPlaying) return;
    setTtsPlaying(true);
    try {
      const audio = await playTTS(storyData.story);
      audioRef.current = audio;
      audio.addEventListener('ended', () => setTtsPlaying(false));
      audio.addEventListener('error', () => setTtsPlaying(false));
    } catch {
      setTtsPlaying(false);
    }
  }, [storyData, ttsPlaying]);

  const stopTTS = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setTtsPlaying(false);
  }, []);

  const handleWordTap = useCallback(() => {
    setTappedWords(n => n + 1);
  }, []);

  const photoSrc = CITY_PHOTOS[selectedCity?.name] || CITY_PHOTOS.default;

  // ── SETUP PHASE ─────────────────────────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <div className="scr-wrap">
        <style>{`
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
        `}</style>

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
                Recommended: {goalMeta.cities.join(', ')}
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
          onClick={generateStory}
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

        <button className="b" onClick={goBack} style={{ width: '100%', marginTop: 12, fontSize: 14, backgroundColor: 'transparent', border: '1.5px solid var(--card-b)', color: 'var(--subtext)' }}>
          ← Back
        </button>
      </div>
    );
  }

  // ── LOADING PHASE ────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="scr-wrap">
        <style>{`
          @keyframes pulse-dot {
            0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
            40% { transform: scale(1); opacity: 1; }
          }
          @keyframes city-spin {
            0% { transform: rotate(0deg) scale(1); }
            50% { transform: rotate(180deg) scale(1.1); }
            100% { transform: rotate(360deg) scale(1); }
          }
        `}</style>
        <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
          <div style={{ fontSize: 72, animation: 'city-spin 2s ease-in-out infinite' }}>
            {selectedCity.icon}
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--heading)', marginBottom: 8 }}>
              Crafting your story in {selectedCity.name}…
            </div>
            <div style={{ fontSize: 14, color: 'var(--subtext)', marginBottom: 16 }}>
              Weaving language, culture, and place into your {selectedLevel} adventure
            </div>
            <PulsingDots color={selectedCity.color} />
          </div>
        </div>
      </div>
    );
  }

  // ── STORY PHASE ──────────────────────────────────────────────────────────────
  if (phase === 'story' && storyData) {
    const tokens = tokenise(storyData.story || '');
    const accentColor = selectedCity.color;

    return (
      <div className="scr-wrap" ref={storyRef}>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes pulse-dot {
            0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
            40% { transform: scale(1); opacity: 1; }
          }
          @keyframes fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
          .story-section { animation: fade-in 0.4s ease forwards; }
          .vocab-row:hover { background: ${accentColor}0d; }
        `}</style>

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
            onError={e => { e.target.src = CITY_PHOTOS.default; }}
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
                        onTap={handleWordTap}
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
          onClick={ttsPlaying ? stopTTS : handleTTS}
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
            '🔊 Read Story Aloud'
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
            onClick={() => { stopTTS(); setPhase('setup'); setStoryData(null); }}
            style={{ flex: 1, padding: '14px', borderRadius: 12, backgroundColor: accentColor, color: '#fff', border: 'none', fontWeight: 700, fontSize: 15 }}
          >
            🔄 New Story
          </button>
          <button
            className="b"
            onClick={() => { stopTTS(); goBack(); }}
            style={{ flex: 1, padding: '14px', borderRadius: 12, backgroundColor: 'transparent', border: '1.5px solid var(--card-b)', color: 'var(--subtext)', fontWeight: 600, fontSize: 15 }}
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  return null;
}
