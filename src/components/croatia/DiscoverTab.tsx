import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
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

export default function DiscoverTab() {
  const { setScr } = useApp();

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
      {/* City of the Day + its Did-You-Know block were removed from the
          Croatia tab — they live on the Today tab as the daily-engagement
          hook. Keeping the same city in two places duplicated the surface
          without adding anything new for the user. */}

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
    </div>
  );
}
