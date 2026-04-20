// @ts-nocheck
import React, { useState } from 'react';
import { H, MEDIA } from '../../data';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];

const LEVEL_META = {
  A1: {
    label: 'Beginner — First sounds',
    color: '#16a34a',
    bg: '#f0fdf4',
    border: '#bbf7d0',
    tip: "Start with music and children's stories. Focus on sounds, not meaning — your brain is calibrating to Croatian rhythm and melody. Even 5 minutes a day matters.",
  },
  A2: {
    label: 'Elementary — Getting by',
    color: '#a16207',
    bg: '#fefce8',
    border: '#fde68a',
    tip: 'Short videos with subtitles. Watch once in English for story, once in Croatian for language. Street interview channels and travel docs are perfect at this stage.',
  },
  B1: {
    label: 'Intermediate — Communicating',
    color: '#0369a1',
    bg: '#f0f9ff',
    border: '#bae6fd',
    tip: 'HRT news and documentaries. Listen for words you already know. 40% comprehension is real progress — push through the fog rather than turning on subtitles immediately.',
  },
  B2: {
    label: 'Upper Intermediate — Flowing',
    color: '#7c3aed',
    bg: '#faf5ff',
    border: '#e9d5ff',
    tip: 'Authentic unscripted speech: radio, podcasts, interviews. Start pausing and rewinding to catch specific phrases. Try shadowing — repeat what you hear 2 seconds later.',
  },
  C1: {
    label: 'Advanced — Fluent',
    color: '#b45309',
    bg: '#fffbeb',
    border: '#fde68a',
    tip: 'Native-speed content: debates, opinion shows, regional dialects. Listen without subtitles. Read a newspaper article on the same topic before listening to prime your brain.',
  },
};

export default function ListeningPath({ goBack }) {
  const [activeLevel, setActiveLevel] = useState('A1');
  const meta = LEVEL_META[activeLevel];
  const levelMedia = MEDIA.filter(function (m) {
    return m.level === activeLevel;
  });

  return (
    <div className="scr-wrap">
      {H('🎧 Listening Path', 'A1 → C1 scaffolded listening', goBack)}

      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {LEVELS.map(function (lv) {
          const m = LEVEL_META[lv];
          return (
            <button
              key={lv}
              onClick={function () {
                setActiveLevel(lv);
              }}
              style={{
                flex: 1,
                padding: '8px 4px',
                fontSize: 12,
                fontWeight: 700,
                border: '2px solid ' + (activeLevel === lv ? m.color : '#e2e8f0'),
                borderRadius: 10,
                cursor: 'pointer',
                background: activeLevel === lv ? m.color : 'var(--card)',
                color: activeLevel === lv ? '#fff' : 'var(--heading)',
                transition: 'all .15s',
              }}
            >
              {lv}
            </button>
          );
        })}
      </div>

      <div
        className="c"
        style={{
          marginBottom: 16,
          borderLeft: '4px solid ' + meta.color,
          background: meta.bg,
          border: '1.5px solid ' + meta.border,
        }}
      >
        <div style={{ fontWeight: 800, fontSize: 14, color: meta.color, marginBottom: 6 }}>
          {activeLevel} — {meta.label}
        </div>
        <div style={{ fontSize: 13, color: '#44403c', lineHeight: 1.65 }}>{meta.tip}</div>
      </div>

      {levelMedia.length > 0 ? (
        levelMedia.map(function (m, i) {
          return (
            <div key={i} className="c" style={{ marginBottom: 10, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>{m.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 14,
                      color: 'var(--heading)',
                      marginBottom: 2,
                    }}
                  >
                    {m.name}
                  </div>
                  <div style={{ fontSize: 12, color: '#78716c', marginBottom: m.tip ? 6 : 0 }}>
                    {m.desc}
                  </div>
                  {m.tip && (
                    <div
                      style={{
                        fontSize: 12,
                        color: '#0369a1',
                        background: '#f0f9ff',
                        border: '1px solid #bae6fd',
                        borderRadius: 8,
                        padding: '8px 10px',
                        lineHeight: 1.55,
                        marginBottom: m.web ? 6 : 0,
                      }}
                    >
                      💡 {m.tip}
                    </div>
                  )}
                  {m.web ? (
                    <a
                      href={m.web}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-block',
                        fontSize: 12,
                        color: '#0e7490',
                        fontWeight: 600,
                        textDecoration: 'none',
                      }}
                    >
                      🔗 Open →
                    </a>
                  ) : m.scr ? (
                    <span style={{ fontSize: 12, color: '#78716c', fontStyle: 'italic' }}>
                      Available in the app
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <div className="c" style={{ textAlign: 'center', color: '#78716c', padding: '32px 16px' }}>
          No resources at this level yet.
        </div>
      )}

      <button className="b bg" style={{ width: '100%', marginTop: 8 }} onClick={goBack}>
        Back
      </button>
    </div>
  );
}
