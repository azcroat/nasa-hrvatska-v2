import React, { useState, useEffect, useRef, useCallback } from 'react';
import { H } from '../../data.jsx';
import { useOnlineStatus } from '../../hooks/useOnlineStatus.js';
import { apiFetch } from '../../lib/apiFetch.js';

// ── Region data ───────────────────────────────────────────────────────────────
const REGIONS = [
  { name: 'Dalmatia',          icon: '☀️', color: '#b45309', desc: 'Adriatic coast & islands',     image: '/images/scenes/dalmatian-ai.webp' },
  { name: 'Slavonia',          icon: '🌾', color: '#16a34a', desc: 'Eastern plains & forests',      image: '/images/scenes/zagreb.webp' },
  { name: 'Istria',            icon: '🫒', color: '#7c3aed', desc: 'Mediterranean peninsula',       image: '/images/scenes/labin.webp' },
  { name: 'Zagorje',           icon: '🏰', color: '#0369a1', desc: 'Castles & rolling hills',       image: '/images/scenes/zagreb.webp' },
  { name: 'Lika',              icon: '🦅', color: '#dc2626', desc: 'Mountains & tradition',          image: '/images/scenes/plitvice.webp' },
  { name: 'Dubrovnik Region',  icon: '🏯', color: '#7c3aed', desc: 'The pearl of the Adriatic',    image: '/images/scenes/dubrovnik-ai.webp' },
  { name: 'Kvarner',           icon: '⛵', color: '#0e7490', desc: 'Islands & sea breezes',         image: '/images/scenes/dalmatian-ai.webp' },
  { name: 'Herzegovina',       icon: '🌉', color: '#b45309', desc: 'Ancient bridges & stone towns', image: '/images/scenes/mostar.webp' },
];

const ERAS = ['Early 1900s', 'Mid 1900s', 'Late 1800s', 'Any era'];

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
  const cleanup = () => URL.revokeObjectURL(url);
  audio.addEventListener('ended', cleanup);
  audio.addEventListener('error', cleanup);
  audio.play().catch(cleanup);
  return audio;
}

// ── Part card component ────────────────────────────────────────────────────────
function NarrativePart({ part, index, accentColor, onRead }) {
  const [read, setRead] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current || read) return undefined;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
          setRead(true);
          onRead(index);
        }
      },
      { threshold: 0.5 }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [read, index, onRead]);

  const romanNumerals = ['I', 'II', 'III'];

  return (
    <div
      ref={ref}
      style={{
        padding: '22px 22px',
        borderRadius: 16,
        backgroundColor: 'var(--card)',
        border: `1px solid var(--card-b)`,
        marginBottom: 16,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Accent stripe */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        width: 4,
        backgroundColor: accentColor,
        borderRadius: '16px 0 0 16px',
      }} />
      <div style={{ paddingLeft: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span style={{
            fontSize: 11,
            fontWeight: 800,
            color: accentColor,
            backgroundColor: accentColor + '18',
            padding: '3px 10px',
            borderRadius: 20,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>
            Part {romanNumerals[index] || index + 1}
          </span>
        </div>
        <h3 style={{
          fontSize: 17,
          fontWeight: 800,
          color: accentColor,
          marginBottom: 12,
          lineHeight: 1.35,
        }}>
          {part.heading}
        </h3>
        <p style={{
          fontSize: 15,
          lineHeight: 1.85,
          color: 'var(--heading)',
          margin: 0,
        }}>
          {part.text}
        </p>
      </div>
    </div>
  );
}

// ── Phrase card ───────────────────────────────────────────────────────────────
function PhraseCard({ phrase, accentColor }) {
  return (
    <div style={{
      padding: '14px 16px',
      borderRadius: 12,
      backgroundColor: accentColor + '0d',
      border: `1.5px solid ${accentColor}30`,
      marginBottom: 10,
    }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: accentColor, marginBottom: 4 }}>
        {phrase.croatian || phrase.hr}
      </div>
      <div style={{ fontSize: 14, color: 'var(--heading)', marginBottom: phrase.context ? 6 : 0 }}>
        {phrase.english || phrase.en}
      </div>
      {phrase.context && (
        <div style={{ fontSize: 12, color: 'var(--subtext)', fontStyle: 'italic' }}>
          {phrase.context}
        </div>
      )}
    </div>
  );
}

// ── Word card ─────────────────────────────────────────────────────────────────
function WordCard({ word, accentColor }) {
  return (
    <div style={{
      display: 'inline-flex',
      flexDirection: 'column',
      padding: '10px 14px',
      borderRadius: 10,
      backgroundColor: 'var(--card)',
      border: `1px solid var(--card-b)`,
      marginRight: 8,
      marginBottom: 8,
    }}>
      <span style={{ fontWeight: 700, color: accentColor, fontSize: 14 }}>{word.croatian || word.hr || word.word}</span>
      <span style={{ fontSize: 12, color: 'var(--subtext)', marginTop: 2 }}>{word.english || word.en || word.translation}</span>
    </div>
  );
}

// ── Pulsing dots ──────────────────────────────────────────────────────────────
function PulsingDots({ color }) {
  return (
    <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 9, height: 9, borderRadius: '50%',
          backgroundColor: color || '#0e7490',
          display: 'inline-block',
          animation: `heritage-pulse ${1.2}s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
    </span>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function HeritageStoryScreen({ goBack, award }) {
  const isOnline = useOnlineStatus();

  // Form state
  const [selectedRegion, setSelectedRegion] = useState(REGIONS[0]);
  const [userName, setUserName] = useState('');
  const [familyNotes, setFamilyNotes] = useState('');
  const [selectedEra, setSelectedEra] = useState('Any era');

  // Phase: form | loading | story | error
  const [phase, setPhase] = useState('form');
  const [heritageData, setHeritageData] = useState(null);
  const [error, setError] = useState('');

  // Story interactions
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const [saved, setSaved] = useState(false);
  const audioRef = useRef(null);
  const readParts = useRef(new Set());
  const awardFired = useRef(false);
  const _unmountedRef = useRef(false);

  const handlePartRead = useCallback((index) => {
    readParts.current.add(index);
    if (readParts.current.size >= 3 && !awardFired.current) {
      awardFired.current = true;
      if (typeof award === 'function') award(20);
    }
  }, [award]);

  const generateHeritage = useCallback(async () => {
    if (!isOnline) { setError('You need an internet connection to generate your heritage story.'); return; }
    setPhase('loading');
    setError('');
    awardFired.current = false;
    readParts.current = new Set();
    try {
      const res = await apiFetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'heritage',
          messages: [{ role: 'user', content: `Tell the heritage story of ${selectedRegion.name}` }],
          params: {
            region: selectedRegion.name,
            family_notes: familyNotes,
            user_name: userName || 'you',
            ancestor_era: selectedEra,
          },
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setHeritageData(data);
      setSaved(false);
      setPhase('story');
    } catch (e) {
      setError('Could not generate your heritage story. Please try again.');
      setPhase('form');
    }
  }, [isOnline, selectedRegion, userName, familyNotes, selectedEra]);

  const handleTTS = useCallback(async () => {
    if (!heritageData || ttsPlaying) return;
    setTtsPlaying(true);
    try {
      const fullText = (heritageData.parts || []).map(p => p.text).join(' ');
      const audio = await playTTS(fullText);
      if (_unmountedRef.current) return;
      audioRef.current = audio;
      audio.addEventListener('ended', () => { if (!_unmountedRef.current) setTtsPlaying(false); });
      audio.addEventListener('error', () => { if (!_unmountedRef.current) setTtsPlaying(false); });
    } catch {
      if (!_unmountedRef.current) setTtsPlaying(false);
    }
  }, [heritageData, ttsPlaying]);

  const stopTTS = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setTtsPlaying(false);
  }, []);

  useEffect(() => { return () => { _unmountedRef.current = true; }; }, []);

  const saveToProfile = useCallback(() => {
    if (!heritageData) return;
    const entry = {
      savedAt: new Date().toISOString(),
      region: selectedRegion.name,
      era: selectedEra,
      userName: userName || 'you',
      ...heritageData,
    };
    localStorage.setItem('heritageStory', JSON.stringify(entry));
    setSaved(true);
  }, [heritageData, selectedRegion, selectedEra, userName]);

  const accentColor = selectedRegion?.color || '#0e7490';

  // ── FORM PHASE ───────────────────────────────────────────────────────────────
  if (phase === 'form') {
    return (
      <div className="scr-wrap">
        <style>{`
          @keyframes heritage-pulse {
            0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
            40% { transform: scale(1); opacity: 1; }
          }
          @keyframes heritage-gradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .heritage-gen-btn {
            background: linear-gradient(135deg, #b45309, #7c3aed, #0e7490);
            background-size: 200% 200%;
            animation: heritage-gradient 4s ease infinite;
          }
          .region-card { transition: transform 0.15s ease, box-shadow 0.15s ease; cursor: pointer; }
          .region-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
          .era-btn { transition: all 0.15s ease; }
          .era-btn:hover { transform: scale(1.03); }
        `}</style>

        {H('🧬 Your Croatian Heritage', 'Discover the story of your roots — AI-crafted from history, culture, and your family\'s region', goBack)}

        {/* Region selector */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--subtext)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Your ancestral region
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {REGIONS.map(region => (
              <div
                key={region.name}
                className="region-card c"
                onClick={() => setSelectedRegion(region)}
                style={{
                  padding: '14px 16px',
                  borderRadius: 14,
                  border: `2px solid ${selectedRegion.name === region.name ? region.color : 'var(--card-b)'}`,
                  backgroundColor: selectedRegion.name === region.name ? region.color + '12' : 'var(--card)',
                  boxShadow: selectedRegion.name === region.name ? `0 4px 16px ${region.color}30` : undefined,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 24 }}>{region.icon}</span>
                  <div>
                    <div style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: selectedRegion.name === region.name ? region.color : 'var(--heading)',
                      lineHeight: 1.2,
                    }}>
                      {region.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--subtext)', marginTop: 2, lineHeight: 1.3 }}>
                      {region.desc}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User name */}
        <div className="c" style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--subtext)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Your name
          </label>
          <input
            type="text"
            value={userName}
            onChange={e => setUserName(e.target.value)}
            placeholder="For a personal touch"
            maxLength={50}
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

        {/* Family notes */}
        <div className="c" style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--subtext)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            What do you know about your family?
          </label>
          <textarea
            value={familyNotes}
            onChange={e => setFamilyNotes(e.target.value)}
            placeholder="e.g. My grandparents emigrated in the 1920s, they were fishermen, they spoke a dialect..."
            rows={4}
            maxLength={500}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 10,
              border: '1.5px solid var(--card-b)',
              backgroundColor: 'var(--app-bg)',
              color: 'var(--heading)',
              fontSize: 14,
              lineHeight: 1.6,
              outline: 'none',
              resize: 'vertical',
            }}
          />
          <div style={{ fontSize: 12, color: 'var(--subtext)', marginTop: 6 }}>
            Optional — the more you share, the more personal the story becomes
          </div>
        </div>

        {/* Era selector */}
        <div className="c" style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--subtext)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Historical era
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {ERAS.map(era => (
              <button
                key={era}
                className="era-btn"
                onClick={() => setSelectedEra(era)}
                style={{
                  padding: '9px 16px',
                  borderRadius: 10,
                  border: `2px solid ${selectedEra === era ? accentColor : 'var(--card-b)'}`,
                  backgroundColor: selectedEra === era ? accentColor : 'var(--card)',
                  color: selectedEra === era ? '#fff' : 'var(--heading)',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                {era}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', borderRadius: 10, backgroundColor: 'var(--error-bg)', border: '1px solid var(--error-b)', color: 'var(--error)', fontSize: 14, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <button
          className="b heritage-gen-btn"
          onClick={generateHeritage}
          style={{
            width: '100%',
            padding: '18px',
            borderRadius: 14,
            color: '#fff',
            fontSize: 17,
            fontWeight: 700,
            letterSpacing: '0.02em',
            border: 'none',
            boxShadow: '0 8px 32px rgba(124,58,237,0.3)',
          }}
        >
          🧬 Discover My {selectedRegion.icon} {selectedRegion.name} Heritage
        </button>

        <button
          className="b"
          onClick={goBack}
          style={{ width: '100%', marginTop: 12, fontSize: 14, backgroundColor: 'transparent', border: '1.5px solid var(--card-b)', color: 'var(--subtext)' }}
        >
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
          @keyframes heritage-pulse {
            0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
            40% { transform: scale(1); opacity: 1; }
          }
          @keyframes heritage-scroll {
            0% { transform: translateY(0); opacity: 1; }
            50% { transform: translateY(-6px); opacity: 0.7; }
            100% { transform: translateY(0); opacity: 1; }
          }
          @keyframes heritage-bar {
            0% { width: 8%; }
            20% { width: 35%; }
            50% { width: 62%; }
            80% { width: 84%; }
            95% { width: 92%; }
          }
        `}</style>
        <div style={{ minHeight: '65vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32, padding: '0 20px' }}>
          <div style={{ fontSize: 64, animation: 'heritage-scroll 2.5s ease-in-out infinite' }}>
            {selectedRegion.icon}
          </div>
          <div style={{ textAlign: 'center', width: '100%', maxWidth: 340 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--heading)', marginBottom: 6 }}>
              Researching {selectedRegion.name} history…
            </div>
            <div style={{ fontSize: 14, color: 'var(--subtext)', marginBottom: 28, lineHeight: 1.6 }}>
              Weaving your family's story into the tapestry of Croatian heritage
            </div>

            {/* Progress bar */}
            <div style={{
              width: '100%',
              height: 6,
              backgroundColor: accentColor + '25',
              borderRadius: 9999,
              overflow: 'hidden',
              marginBottom: 20,
            }}>
              <div style={{
                height: '100%',
                borderRadius: 9999,
                backgroundColor: accentColor,
                animation: 'heritage-bar 8s ease-out forwards',
              }} />
            </div>

            <PulsingDots color={accentColor} />
          </div>

          <div style={{
            display: 'flex',
            gap: 10,
            flexWrap: 'wrap',
            justifyContent: 'center',
            opacity: 0.6,
          }}>
            {['📜 Archival records', '🗺️ Regional geography', '🏛️ Cultural context', '🌿 Ancestral phrases'].map(label => (
              <span key={label} style={{
                fontSize: 11,
                padding: '4px 10px',
                borderRadius: 20,
                backgroundColor: accentColor + '18',
                color: accentColor,
                fontWeight: 600,
              }}>
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── STORY PHASE ──────────────────────────────────────────────────────────────
  if (phase === 'story' && heritageData) {
    const regionImage = selectedRegion.image || '/images/scenes/dalmatian-ai.webp';

    return (
      <div className="scr-wrap">
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes heritage-pulse {
            0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
            40% { transform: scale(1); opacity: 1; }
          }
          @keyframes heritage-fade-in {
            from { opacity: 0; transform: translateY(12px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .heritage-section { animation: heritage-fade-in 0.5s ease forwards; }
          .save-btn { transition: all 0.2s ease; }
          .save-btn:hover { transform: translateY(-1px); }
        `}</style>

        {/* Region image header — full bleed */}
        <div style={{
          position: 'relative',
          height: 220,
          borderRadius: 18,
          overflow: 'hidden',
          marginBottom: 28,
        }}>
          <img
            src={regionImage}
            alt={selectedRegion.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            loading="lazy"
            onError={e => { /** @type {HTMLImageElement} */ (e.target).src = '/images/scenes/dalmatian-ai.webp'; }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(to top, ${accentColor}cc 0%, rgba(0,0,0,0.15) 55%, transparent 100%)`,
          }} />
          {/* Museum-style label */}
          <div style={{
            position: 'absolute',
            top: 16,
            left: 16,
            padding: '5px 12px',
            borderRadius: 20,
            backgroundColor: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.3)',
          }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Heritage Narrative
            </span>
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 22px' }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.4)', lineHeight: 1.2 }}>
              {heritageData.title || `The ${selectedRegion.name} Story`}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 4 }}>
              {selectedRegion.icon} {selectedRegion.name} · {selectedEra}
            </div>
          </div>
        </div>

        {/* 3-part narrative */}
        {(heritageData.parts || []).map((part, i) => (
          <NarrativePart
            key={i}
            part={part}
            index={i}
            accentColor={accentColor}
            onRead={handlePartRead}
          />
        ))}

        {/* Ancestral phrases */}
        {heritageData.ancestral_phrases && heritageData.ancestral_phrases.length > 0 && (
          <div className="heritage-section" style={{ marginBottom: 16 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 14,
            }}>
              <span style={{ fontSize: 20 }}>🗣️</span>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--heading)' }}>Ancestral Phrases</h2>
            </div>
            {heritageData.ancestral_phrases.map((phrase, i) => (
              <PhraseCard key={i} phrase={phrase} accentColor={accentColor} />
            ))}
          </div>
        )}

        {/* Regional words */}
        {heritageData.regional_words && heritageData.regional_words.length > 0 && (
          <div className="heritage-section" style={{ marginBottom: 16 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 14,
            }}>
              <span style={{ fontSize: 20 }}>📖</span>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--heading)' }}>Regional Words</h2>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {heritageData.regional_words.map((word, i) => (
                <WordCard key={i} word={word} accentColor={accentColor} />
              ))}
            </div>
          </div>
        )}

        {/* Did you know */}
        {heritageData.did_you_know && (
          <div className="heritage-section" style={{
            padding: '18px 20px',
            borderRadius: 14,
            backgroundColor: accentColor + '12',
            border: `2px solid ${accentColor}30`,
            marginBottom: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <span style={{ fontSize: 24, flexShrink: 0 }}>💡</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: accentColor, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Did You Know?
                </div>
                <div style={{ fontSize: 14, color: 'var(--heading)', lineHeight: 1.7 }}>
                  {heritageData.did_you_know}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action strip */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <button
            className="b"
            onClick={ttsPlaying ? stopTTS : handleTTS}
            style={{
              flex: 1,
              padding: '14px',
              borderRadius: 12,
              backgroundColor: ttsPlaying ? '#fef9c3' : accentColor,
              color: ttsPlaying ? '#854d0e' : '#fff',
              border: 'none',
              fontWeight: 700,
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
            }}
          >
            {ttsPlaying ? (
              <>
                <span style={{
                  width: 11, height: 11,
                  border: '2px solid currentColor',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'spin 0.7s linear infinite',
                }} />
                Stop
              </>
            ) : <><span aria-hidden="true">🔊</span>{' Read Aloud'}</>}
          </button>

          <button
            className="b save-btn"
            onClick={saveToProfile}
            style={{
              flex: 1,
              padding: '14px',
              borderRadius: 12,
              backgroundColor: saved ? 'var(--success-bg)' : 'var(--card)',
              border: `1.5px solid ${saved ? 'var(--success-b)' : 'var(--card-b)'}`,
              color: saved ? 'var(--success)' : 'var(--heading)',
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            {saved ? '✅ Saved!' : '💾 Save Story'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="b"
            onClick={() => { stopTTS(); setPhase('form'); setHeritageData(null); }}
            style={{
              flex: 1,
              padding: '14px',
              borderRadius: 12,
              backgroundColor: accentColor,
              color: '#fff',
              border: 'none',
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            🔄 Generate Another
          </button>
          <button
            className="b"
            onClick={() => { stopTTS(); goBack(); }}
            style={{
              flex: 1,
              padding: '14px',
              borderRadius: 12,
              backgroundColor: 'transparent',
              border: '1.5px solid var(--card-b)',
              color: 'var(--subtext)',
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  return null;
}
