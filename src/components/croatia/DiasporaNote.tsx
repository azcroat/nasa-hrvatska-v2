// @ts-nocheck
import React, { useState } from 'react';
import { speak, H } from '../../data';

const CODE_SWITCH_EXAMPLES = [
  {
    mixed: 'Idem na shopping.',
    full: 'Idem u kupovinu.',
    note: 'Even Zagreb Croatians say "na shopping" — anglicisms are universal.',
  },
  {
    mixed: 'Šaljem ti email.',
    full: 'Šaljem ti poruku / elektroničku poštu.',
    note: '"Email" is used in Croatia too. You\'re not broken.',
  },
  {
    mixed: 'Idem kod doktora, trebam appointment.',
    full: 'Idem kod doktora, trebam termin.',
    note: '"Termin" is the Croatian word — but diaspora speakers hear "appointment" and use it.',
  },
  {
    mixed: 'Ovo je, you know, jako kompliciran.',
    full: 'Ovo je, znaš, jako komplicirano.',
    note: '"You know" mid-sentence is a diaspora signature. Recognize it and gently self-correct.',
  },
  {
    mixed: 'Oprosti, zaboravio/zaboravila sam tu riječ.',
    full: 'Oprosti, ne sjećam se te riječi.',
    note: 'Forgetting words mid-sentence is normal. This phrase itself is perfect Croatian.',
  },
];

const HERITAGE_TRUTHS = [
  {
    icon: '🧬',
    title: 'Your Croatian is real Croatian',
    body: "Heritage Croatian — the language spoken at home, at family dinners, in half-memories — is a genuine dialect of Croatian. It didn't stop being Croatian when it absorbed English words. It evolved, like all living languages do.",
  },
  {
    icon: '🌍',
    title: 'Every diaspora does this',
    body: "Australian Croatians, American Croatians, German Croatians — they all code-switch. It's not a flaw. It's the linguistic fingerprint of a life lived between two worlds.",
  },
  {
    icon: '🇭🇷',
    title: 'Croatia itself borrows constantly',
    body: 'Open any Croatian newspaper and you\'ll find: "email", "streaming", "lajkati", "šerати", "selfie". The official Croatian Radio even has a list of recommended native equivalents that almost nobody uses.',
  },
  {
    icon: '💙',
    title: 'Speaking imperfectly is still speaking',
    body: 'Your Croatian grandparents would rather hear you try and switch to English mid-sentence than not hear Croatian from you at all. Imperfect Croatian is a declaration of love.',
  },
  {
    icon: '📈',
    title: 'This app is not here to fix you',
    body: 'This app exists to give you more tools, not to replace what you already have. Everything you learned at home is a foundation, not a problem.',
  },
];

export default function DiasporaNote({ goBack }) {
  const [activeEx, setActiveEx] = useState(null);

  return (
    <div>
      {H('💙 Diaspora Croatian', 'Your heritage language is real language', goBack)}

      {/* Hero statement */}
      <div
        style={{
          background: 'linear-gradient(135deg,#003087,#0e7490)',
          borderRadius: 20,
          padding: '24px 20px',
          marginBottom: 24,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 12 }}>🌏</div>
        <div
          style={{
            fontSize: 20,
            fontFamily: "'Playfair Display',serif",
            fontWeight: 900,
            color: '#fff',
            marginBottom: 8,
            lineHeight: 1.3,
          }}
        >
          If you grew up switching between Croatian and English mid-sentence — that's not a mistake.
          That's you.
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,.8)', lineHeight: 1.6 }}>
          This page is for learners whose Croatian comes from home, not a classroom.
        </div>
      </div>

      {/* Heritage truths */}
      <h3
        style={{
          fontSize: 13,
          fontWeight: 800,
          color: 'var(--subtext)',
          letterSpacing: '.08em',
          textTransform: 'uppercase',
          marginBottom: 12,
        }}
      >
        Five things to remember
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
        {HERITAGE_TRUTHS.map((t, i) => (
          <div
            key={i}
            style={{
              background: 'var(--card)',
              border: '1px solid var(--card-b)',
              borderRadius: 14,
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
            }}
          >
            <span style={{ fontSize: 22, flexShrink: 0, marginTop: 1 }}>{t.icon}</span>
            <div>
              <div
                style={{ fontSize: 13, fontWeight: 800, color: 'var(--heading)', marginBottom: 4 }}
              >
                {t.title}
              </div>
              <div style={{ fontSize: 12, color: 'var(--subtext)', lineHeight: 1.6 }}>{t.body}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Code-switch examples */}
      <h3
        style={{
          fontSize: 13,
          fontWeight: 800,
          color: 'var(--subtext)',
          letterSpacing: '.08em',
          textTransform: 'uppercase',
          marginBottom: 8,
        }}
      >
        Common code-switches — and the "full Croatian"
      </h3>
      <p style={{ fontSize: 12, color: 'var(--subtext)', marginBottom: 14, fontWeight: 500 }}>
        Tap each to see the native Croatian equivalent. Both are valid — knowing the native form
        gives you more options.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
        {CODE_SWITCH_EXAMPLES.map((ex, i) => (
          <div
            key={i}
            style={{
              background: 'var(--card)',
              border: `1.5px solid ${activeEx === i ? '#0e7490' : 'var(--card-b)'}`,
              borderRadius: 14,
              overflow: 'hidden',
              transition: 'border-color .2s',
            }}
          >
            <button
              onClick={() => setActiveEx(activeEx === i ? null : i)}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: "'Outfit',sans-serif",
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--subtext)',
                    marginBottom: 2,
                    fontStyle: 'italic',
                  }}
                >
                  "{ex.mixed}"
                </div>
              </div>
              <span style={{ fontSize: 14, color: 'var(--subtext)', opacity: 0.5 }}>
                {activeEx === i ? '▲' : '▼'}
              </span>
            </button>
            {activeEx === i && (
              <div
                style={{
                  padding: '12px 16px',
                  borderTop: '1px solid var(--card-b)',
                  background: 'rgba(14,116,144,.04)',
                }}
              >
                <div style={{ marginBottom: 8 }}>
                  <div
                    style={{
                      fontSize: 10,
                      color: '#0e7490',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '.06em',
                      marginBottom: 2,
                    }}
                  >
                    Native Croatian:
                  </div>
                  <button
                    aria-label={`Play audio for ${ex.full}`}
                    onClick={() => speak(ex.full)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: "'Playfair Display',serif",
                      fontSize: 15,
                      fontWeight: 700,
                      color: 'var(--heading)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: 0,
                    }}
                  >
                    <span aria-hidden="true">🔊</span> {ex.full}
                  </button>
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--subtext)',
                    lineHeight: 1.6,
                    fontStyle: 'italic',
                  }}
                >
                  💡 {ex.note}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Closing */}
      <div
        style={{
          background: 'linear-gradient(135deg,rgba(182,24,0,.07),rgba(0,48,135,.05))',
          border: '1.5px solid rgba(182,24,0,.15)',
          borderRadius: 16,
          padding: '16px 18px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 24, marginBottom: 8 }}>🇭🇷</div>
        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--heading)', marginBottom: 6 }}>
          Naša Hrvatska — Our Croatia
        </div>
        <div style={{ fontSize: 12, color: 'var(--subtext)', lineHeight: 1.6 }}>
          Whether your Croatian is textbook-perfect or kitchen-table-and-English, it belongs to you.
          This app just wants to help you use more of it.
        </div>
      </div>
    </div>
  );
}
