// @ts-nocheck
import React, { useState } from 'react';
import { speak } from '../../data';
import { BASKETBALL } from '../../data';

function SportScreen({ data, accent, heroGradient, heroIcon }) {
  const [activeSection, setActiveSection] = useState(0);
  const [playing, setPlaying] = useState(null);
  const section = data.sections[activeSection];
  const totalPhrases = data.sections.reduce(function (sum, s) {
    return sum + s.phrases.length;
  }, 0);

  function playPhrase(hr, key) {
    setPlaying(key);
    speak(hr);
    setTimeout(function () {
      setPlaying(null);
    }, 2200);
  }

  const isVocabSection = section.phrases.every(function (p) {
    return p.hr.length <= 35 && !p.note;
  });

  return (
    <div className="scr-wrap">
      <div
        style={{
          marginBottom: 24,
          borderRadius: 20,
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,.15)',
        }}
      >
        <div style={{ background: heroGradient, padding: '24px 20px 20px' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>{heroIcon}</div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 900,
              color: 'white',
              letterSpacing: '-.02em',
              lineHeight: 1.2,
            }}
          >
            {data.title}
          </div>
          <div
            style={{ fontSize: 13, color: 'rgba(255,255,255,.75)', marginTop: 4, fontWeight: 500 }}
          >
            {data.subtitle}
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <span
              style={{
                background: 'rgba(255,255,255,.18)',
                color: 'white',
                fontSize: 11,
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 20,
              }}
            >
              {data.sections.length} categories
            </span>
            <span
              style={{
                background: 'rgba(255,255,255,.18)',
                color: 'white',
                fontSize: 11,
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 20,
              }}
            >
              {totalPhrases}+ phrases
            </span>
          </div>
        </div>
        <div style={{ background: 'rgba(0,0,0,.45)', padding: '12px 20px' }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.85)', lineHeight: 1.6 }}>
            {data.intro}
          </div>
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          gap: 0,
          overflowX: 'auto',
          marginBottom: 20,
          borderBottom: '2px solid #f1f5f9',
          paddingBottom: 0,
        }}
      >
        {data.sections.map(function (s, si) {
          const isActive = activeSection === si;
          return (
            <button
              key={si}
              onClick={function () {
                setActiveSection(si);
              }}
              style={{
                flex: '0 0 auto',
                padding: '10px 14px',
                border: 'none',
                borderBottom: isActive ? '2.5px solid ' + accent : '2.5px solid transparent',
                background: 'transparent',
                fontSize: 12,
                fontWeight: isActive ? 800 : 500,
                color: isActive ? accent : '#78716c',
                cursor: 'pointer',
                transition: 'all .18s',
                whiteSpace: 'nowrap',
                marginBottom: '-2px',
                lineHeight: 1.2,
              }}
            >
              <span style={{ marginRight: 4 }}>{s.icon}</span>
              <span>{s.title}</span>
              <span
                style={{
                  marginLeft: 6,
                  background: isActive ? accent + '18' : '#f1f5f9',
                  color: isActive ? accent : '#a8a29e',
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: 10,
                }}
              >
                {s.phrases.length}
              </span>
            </button>
          );
        })}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 14,
        }}
      >
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#1c1917' }}>
            {section.icon} {section.title}
          </div>
          <div style={{ fontSize: 11, color: '#78716c', marginTop: 2, fontWeight: 500 }}>
            {section.en} &nbsp;·&nbsp; {section.phrases.length} items
          </div>
        </div>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: accent + '12',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
          }}
        >
          {section.icon}
        </div>
      </div>
      {isVocabSection && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
          {section.phrases.map(function (p, pi) {
            const key = activeSection + '-' + pi;
            const isPlaying = playing === key;
            return (
              <button
                key={pi}
                aria-label={`Play audio for ${p.hr}`}
                onClick={function () {
                  playPhrase(p.hr, key);
                }}
                style={{
                  background: 'white',
                  borderRadius: 14,
                  border: '1px solid ' + (isPlaying ? accent : 'rgba(0,0,0,.06)'),
                  boxShadow: isPlaying ? '0 0 0 3px ' + accent + '25' : '0 1px 4px rgba(0,0,0,.05)',
                  padding: '12px 14px',
                  cursor: 'pointer',
                  transition: 'all .18s',
                  borderLeft: '3px solid ' + (isPlaying ? accent : accent + '50'),
                  width: '100%',
                  textAlign: 'left',
                  fontFamily: "'Outfit',sans-serif",
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 4,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: accent + '99',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {String(pi + 1).padStart(2, '0')}
                  </span>
                  <span
                    aria-hidden="true"
                    style={{
                      fontSize: 14,
                      opacity: isPlaying ? 1 : 0.35,
                      transition: 'opacity .2s',
                    }}
                  >
                    🔊
                  </span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1c1917', lineHeight: 1.3 }}>
                  {p.hr}
                </div>
                <div style={{ fontSize: 11, color: '#78716c', marginTop: 3, lineHeight: 1.4 }}>
                  {p.en}
                </div>
              </button>
            );
          })}
        </div>
      )}
      {!isVocabSection && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {section.phrases.map(function (p, pi) {
            const key = activeSection + '-' + pi;
            const isPlaying = playing === key;
            return (
              <button
                key={pi}
                aria-label={`Play audio for ${p.hr}`}
                onClick={function () {
                  playPhrase(p.hr, key);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'stretch',
                  background: 'white',
                  borderRadius: 14,
                  border: '1px solid ' + (isPlaying ? accent : 'rgba(0,0,0,.06)'),
                  boxShadow: isPlaying ? '0 0 0 3px ' + accent + '22' : '0 2px 6px rgba(0,0,0,.05)',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all .18s',
                  width: '100%',
                  textAlign: 'left',
                  fontFamily: "'Outfit',sans-serif",
                  padding: 0,
                }}
              >
                <div
                  style={{
                    width: 40,
                    flexShrink: 0,
                    background: isPlaying ? accent : accent + '08',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 800,
                    color: isPlaying ? 'white' : accent + '80',
                    transition: 'all .18s',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {String(pi + 1).padStart(2, '0')}
                </div>
                <div style={{ flex: 1, padding: '13px 14px' }}>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 800,
                      color: '#1c1917',
                      lineHeight: 1.3,
                      marginBottom: 4,
                    }}
                  >
                    {p.hr}
                  </div>
                  <div style={{ fontSize: 12, color: '#44403c', lineHeight: 1.4 }}>{p.en}</div>
                  {p.note && (
                    <div
                      style={{
                        marginTop: 6,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        background: accent + '0f',
                        borderRadius: 6,
                        padding: '3px 8px',
                      }}
                    >
                      <span style={{ fontSize: 10, color: accent, fontWeight: 700 }}>ⓘ</span>
                      <span style={{ fontSize: 10, color: accent + 'cc', lineHeight: 1.4 }}>
                        {p.note}
                      </span>
                    </div>
                  )}
                </div>
                <div
                  style={{
                    width: 44,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: isPlaying ? accent : 'rgba(0,0,0,.04)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      transition: 'all .18s',
                    }}
                  >
                    {isPlaying ? (
                      <span aria-hidden="true" style={{ color: 'white' }}>
                        ♪
                      </span>
                    ) : (
                      <span aria-hidden="true" style={{ opacity: 0.45 }}>
                        🔊
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function BasketballScreen({ goBack }) {
  return (
    <div>
      {goBack && (
        <button
          onClick={goBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 700,
            color: '#78716c',
            padding: '12px 16px 0',
            fontFamily: "'Outfit',sans-serif",
          }}
        >
          ‹ Back
        </button>
      )}
      <SportScreen
        data={BASKETBALL}
        accent="#ea580c"
        heroGradient="linear-gradient(145deg,#9a3412,#ea580c)"
        heroIcon="🏀"
      />
    </div>
  );
}

export default BasketballScreen;
