import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { getCityOfDay } from '../../data';
import CroatianKnight from '../shared/CroatianKnight';

const KNIGHT_MESSAGES = [
  {
    mood: 'happy',
    text: 'Dobrodošli! New content rotates every day — a fresh city, phrase, and cultural fact just for you.',
  },
  {
    mood: 'thinking',
    text: 'Try the Stories tab — real letters from Baka Marija. Authentic Croatian the way families actually write.',
  },
  {
    mood: 'encouraging',
    text: "The Media tab has Croatian music and film. Listening is the fastest path to fluency — don't skip it!",
  },
  {
    mood: 'ready',
    text: 'You can save any word from Baka\'s letters straight to your vocabulary journal. Tap "+ Save word" on any tile.',
  },
  {
    mood: 'celebrating',
    text: 'Svaki dan novi grad! Every day reveals a different Croatian city. Keep coming back.',
  },
];

/** Darken a hex color until white text meets WCAG AA (4.5:1 contrast ratio). */
function aaButtonBg(hex: string): string {
  if (!hex.startsWith('#') || hex.length !== 7) return hex;
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const lum = (h: string) => {
    const r = parseInt(h.slice(1, 3), 16);
    const g = parseInt(h.slice(3, 5), 16);
    const b = parseInt(h.slice(5, 7), 16);
    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  };
  let current = hex;
  for (let i = 0; i < 8; i++) {
    if (1.05 / (lum(current) + 0.05) >= 4.5) return current;
    // Darken by 15% each iteration
    const r = Math.round(parseInt(current.slice(1, 3), 16) * 0.85);
    const g = Math.round(parseInt(current.slice(3, 5), 16) * 0.85);
    const b = Math.round(parseInt(current.slice(5, 7), 16) * 0.85);
    current = '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
  }
  return current;
}

export default function DiscoverTab() {
  const { setScr } = useApp();
  const city = getCityOfDay();

  // Safe field access — 36/365 cities are stubs
  const cityColor: string = (city as { color?: string }).color || '#0e7490';
  const cityIcon: string = (city as { icon?: string }).icon || '🏙️';
  const cityRegion: string = (city as { region?: string }).region || 'Croatia';
  const cityTagline: string = (city as { tagline?: string }).tagline || '';
  const cityIntro: string =
    (city as { intro?: string }).intro || `${city.name} is a remarkable city in ${cityRegion}.`;
  const cityDidYouKnow: string = (city as { didYouKnow?: string }).didYouKnow || '';

  // Rotating knight message
  const [kMsgIdx, setKMsgIdx] = useState(0);
  const [kMsgVisible, setKMsgVisible] = useState(true);
  const kTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const kFadeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    kTimerRef.current = setInterval(() => {
      setKMsgVisible(false);
      kFadeRef.current = setTimeout(() => {
        setKMsgIdx((i) => (i + 1) % KNIGHT_MESSAGES.length);
        setKMsgVisible(true);
      }, 350);
    }, 5500);
    return () => {
      clearInterval(kTimerRef.current ?? undefined);
      clearTimeout(kFadeRef.current ?? undefined);
    };
  }, []);

  const kMsg = KNIGHT_MESSAGES[kMsgIdx]!;

  return (
    <div style={{ paddingBottom: 16 }}>
      {/* ── CITY OF THE DAY (text-only, always visible) ── */}
      <div
        style={{
          borderRadius: 18,
          overflow: 'hidden',
          marginBottom: 16,
          boxShadow: '0 4px 20px rgba(0,0,0,.1)',
          border: `1.5px solid ${cityColor}35`,
        }}
      >
        {/* Accent bar */}
        <div style={{ height: 4, background: cityColor }} />

        <div
          style={{
            background: `linear-gradient(135deg, ${cityColor}12, ${cityColor}05)`,
            padding: '16px 18px 18px',
          }}
        >
          {/* Header row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 900,
                color: cityColor,
                textTransform: 'uppercase',
                letterSpacing: '.12em',
              }}
            >
              🗓️ City of the Day
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: cityColor,
                background: `${cityColor}18`,
                border: `1px solid ${cityColor}35`,
                borderRadius: 20,
                padding: '3px 10px',
              }}
            >
              📍 {cityRegion}
            </span>
          </div>

          {/* City name */}
          <div
            style={{
              fontSize: 24,
              fontWeight: 900,
              color: 'var(--heading)',
              fontFamily: "'Playfair Display', serif",
              lineHeight: 1.15,
              marginBottom: cityTagline ? 6 : 12,
            }}
          >
            {cityIcon} {city.name}
          </div>

          {/* Tagline */}
          {cityTagline ? (
            <div
              style={{
                fontSize: 12,
                color: cityColor,
                fontStyle: 'italic',
                fontWeight: 600,
                marginBottom: 12,
                lineHeight: 1.5,
              }}
            >
              &ldquo;{cityTagline}&rdquo;
            </div>
          ) : null}

          {/* Intro snippet — 3-line clamp */}
          <div
            style={{
              fontSize: 13,
              color: 'var(--body)',
              lineHeight: 1.65,
              marginBottom: 16,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {cityIntro}
          </div>

          {/* CTA */}
          <button
            onClick={() => setScr('cityofday')}
            style={{
              width: '100%',
              background: aaButtonBg(cityColor),
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '11px 0',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              fontFamily: "'Outfit', sans-serif",
              letterSpacing: '.025em',
            }}
          >
            Explore {city.name} →
          </button>
        </div>
      </div>

      {/* ── DID YOU KNOW ── */}
      {cityDidYouKnow ? (
        <div
          style={{
            background: 'linear-gradient(135deg,rgba(124,58,237,.07),rgba(91,33,182,.04))',
            border: '1.5px solid rgba(124,58,237,.2)',
            borderRadius: 16,
            padding: '14px 16px',
            marginBottom: 12,
            boxShadow: 'var(--card-shadow)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <span style={{ fontSize: 14 }}>💡</span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 900,
                color: 'var(--lavender,#7c3aed)',
                textTransform: 'uppercase',
                letterSpacing: '.1em',
              }}
            >
              Did You Know?
            </span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--body)', lineHeight: 1.65, fontWeight: 500 }}>
            {cityDidYouKnow}
          </div>
        </div>
      ) : null}

      {/* ── FEATURED STORY PREVIEW ── */}
      <button
        onClick={() => {
          const el = document.querySelector('[data-ctab="stories"]') as HTMLElement | null;
          if (el) el.click();
        }}
        className="tc"
        style={{
          background: 'linear-gradient(135deg,var(--warning-bg,#fffbeb),rgba(251,191,36,.08))',
          border: '1.5px solid var(--warning-b,#fde68a)',
          padding: '16px 18px',
          marginBottom: 12,
          display: 'block',
          width: '100%',
          textAlign: 'left',
          fontFamily: "'Outfit',sans-serif",
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <span style={{ fontSize: 14 }}>💌</span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 900,
              color: 'var(--warning-dark,#92400e)',
              textTransform: 'uppercase',
              letterSpacing: '.1em',
            }}
          >
            Letters from Baka
          </span>
          <span
            style={{
              marginLeft: 'auto',
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--warning-dark,#92400e)',
              background: 'var(--warning-bg,#fffbeb)',
              border: '1px solid var(--warning-b,#fde68a)',
              borderRadius: 20,
              padding: '2px 8px',
            }}
          >
            Stories tab →
          </span>
        </div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: 'var(--heading)',
            marginBottom: 6,
            fontFamily: "'Playfair Display',serif",
          }}
        >
          Baka Marija piše...
        </div>
        <div
          style={{
            fontSize: 12,
            color: 'var(--subtext)',
            lineHeight: 1.6,
            fontStyle: 'italic',
            borderLeft: '3px solid var(--warning-b,#fde68a)',
            paddingLeft: 12,
          }}
        >
          &ldquo;Drago moje unuče, kako si ti? Ovdje je lijepo proljetno vrijeme. Cvjetovi su
          procvjetali u vrtu...&rdquo;
        </div>
      </button>

      {/* ── HRVOJE COMPANION — rotating contextual messages ── */}
      <div
        className="c"
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 14,
          padding: '14px 16px',
          marginBottom: 12,
        }}
      >
        <CroatianKnight size={58} mood={kMsg.mood} style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 900,
              color: 'var(--info)',
              textTransform: 'uppercase',
              letterSpacing: '.1em',
              marginBottom: 5,
            }}
          >
            Hrvoje kaže
          </div>
          <div
            style={{
              fontSize: 12,
              color: 'var(--body)',
              lineHeight: 1.65,
              opacity: kMsgVisible ? 1 : 0,
              transition: 'opacity .35s ease',
              minHeight: 38,
            }}
          >
            {kMsg.text}
          </div>
          {/* progress dots */}
          <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
            {KNIGHT_MESSAGES.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === kMsgIdx ? 14 : 5,
                  height: 5,
                  borderRadius: 3,
                  background: i === kMsgIdx ? 'var(--info)' : 'var(--card-b)',
                  transition: 'width .35s ease, background .35s ease',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── DIALECT AWARENESS ── */}
      <button
        onClick={() => setScr('dialect_awareness')}
        className="feature-card"
        style={{
          background: 'linear-gradient(135deg,#1e3a5f,#2563eb)',
          boxShadow: '0 4px 20px rgba(37,99,235,.35)',
          marginBottom: 12,
        }}
      >
        <div
          style={{
            width: 50,
            height: 50,
            borderRadius: 14,
            flexShrink: 0,
            background: 'rgba(255,255,255,.12)',
            border: '1.5px solid rgba(255,255,255,.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 26,
          }}
        >
          🗣️
        </div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div
            style={{
              fontSize: 9,
              fontWeight: 900,
              color: 'rgba(255,255,255,.6)',
              letterSpacing: '.12em',
              textTransform: 'uppercase',
              marginBottom: 4,
            }}
          >
            Linguistics · Culture
          </div>
          <div className="feature-card-title" style={{ color: '#fff', marginBottom: 3 }}>
            Croatian Dialect Explorer
          </div>
          <div className="feature-card-desc" style={{ color: 'rgba(255,255,255,.72)' }}>
            Što vs Ča vs Kaj — discover the three dialects and where they come from.
          </div>
        </div>
        <div style={{ fontSize: 20, color: 'rgba(255,255,255,.7)', fontWeight: 300 }}>›</div>
      </button>

      {/* ── PHOTO VOCAB SCANNER ── */}
      <button
        onClick={() => setScr('photo_vocab')}
        className="feature-card"
        style={{
          background: 'linear-gradient(135deg,#164e63,#0e7490)',
          boxShadow: '0 4px 20px rgba(14,116,144,.35)',
        }}
      >
        <div
          style={{
            width: 50,
            height: 50,
            borderRadius: 14,
            flexShrink: 0,
            background: 'rgba(255,255,255,.12)',
            border: '1.5px solid rgba(255,255,255,.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 26,
          }}
        >
          📷
        </div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div
            style={{
              fontSize: 9,
              fontWeight: 900,
              color: 'rgba(255,255,255,.6)',
              letterSpacing: '.12em',
              textTransform: 'uppercase',
              marginBottom: 4,
            }}
          >
            AI · Camera
          </div>
          <div className="feature-card-title" style={{ color: '#fff', marginBottom: 3 }}>
            Photo Vocabulary Scanner
          </div>
          <div className="feature-card-desc" style={{ color: 'rgba(255,255,255,.72)' }}>
            Point your camera at menus, signs or labels — learn the Croatian words instantly.
          </div>
        </div>
        <div style={{ fontSize: 20, color: 'rgba(255,255,255,.7)', fontWeight: 300 }}>›</div>
      </button>
    </div>
  );
}
