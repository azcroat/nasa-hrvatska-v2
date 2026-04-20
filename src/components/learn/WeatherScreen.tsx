// @ts-nocheck
import React, { useState } from 'react';
import { WEATHER, speak } from '../../data';

const BACK_BTN = ({ goBack }) => (
  <button className="b bg" style={{ marginBottom: 16, fontSize: 13 }} onClick={goBack}>
    ← Back
  </button>
);
const WRAP = ({ children }) => (
  <div
    style={{
      maxWidth: 620,
      margin: '0 auto',
      padding: '24px 16px',
      paddingBottom: 80,
      position: 'relative',
      zIndex: 1,
    }}
  >
    {children}
  </div>
);
const HERO = ({ icon, title, subtitle, color }) => (
  <div
    style={{
      background: `linear-gradient(135deg,${color}dd,${color})`,
      borderRadius: 18,
      padding: '20px 20px',
      marginBottom: 20,
      color: 'white',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ fontSize: 44 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 12, opacity: 0.85, lineHeight: 1.5 }}>{subtitle}</div>
      </div>
    </div>
  </div>
);
const TAB_NAV = ({ tabs, active, setActive, accent }) => (
  <div style={{ display: 'flex', gap: 4, marginBottom: 20, overflowX: 'auto', paddingBottom: 2 }}>
    {tabs.map((t) => (
      <button
        key={t}
        onClick={() => setActive(t)}
        style={{
          flexShrink: 0,
          padding: '8px 16px',
          borderRadius: 20,
          border: 'none',
          cursor: 'pointer',
          fontSize: 12,
          fontWeight: 700,
          background: active === t ? accent : '#f5f5f4',
          color: active === t ? 'white' : '#44403c',
        }}
      >
        {t}
      </button>
    ))}
  </div>
);
const TIP_BOX = ({ text }) => (
  <div
    style={{
      background: 'rgba(14,116,144,.06)',
      borderLeft: '3px solid #0e7490',
      borderRadius: 10,
      padding: '10px 14px',
      marginBottom: 16,
      fontSize: 12,
      color: '#44403c',
      lineHeight: 1.6,
    }}
  >
    <strong>💡 Tip: </strong>
    {text}
  </div>
);
const QUIZ_SECTION = ({ quiz, accent }) => {
  const [answers, setAnswers] = useState({});
  return (
    <div>
      {quiz.map((q, i) => (
        <div
          key={i}
          style={{
            background: 'white',
            borderRadius: 14,
            padding: 16,
            marginBottom: 12,
            border: '1px solid rgba(0,0,0,.06)',
            boxShadow: '0 1px 3px rgba(0,0,0,.04)',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1c1917', marginBottom: 10 }}>
            {i + 1}. {q.q}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {q.opts.map((opt, j) => {
              const sel = answers[i];
              const correct = opt === q.a;
              let bg = '#f5f5f4',
                color = '#44403c',
                border = '1.5px solid #e7e5e4';
              if (sel !== undefined) {
                if (correct) {
                  bg = '#dcfce7';
                  color = '#15803d';
                  border = '1.5px solid #86efac';
                } else if (sel === j) {
                  bg = '#fee2e2';
                  color = '#b91c1c';
                  border = '1.5px solid #fca5a5';
                }
              }
              return (
                <button
                  key={j}
                  onClick={() => {
                    if (sel === undefined) setAnswers((a) => ({ ...a, [i]: j }));
                  }}
                  style={{
                    background: bg,
                    color,
                    border,
                    borderRadius: 10,
                    padding: '8px 12px',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: sel === undefined ? 'pointer' : 'default',
                    textAlign: 'left',
                  }}
                >
                  {opt}
                </button>
              );
            })}
          </div>
          {answers[i] !== undefined && (
            <div
              style={{
                marginTop: 8,
                fontSize: 11,
                color: q.opts[answers[i]] === q.a ? '#15803d' : '#b91c1c',
                fontWeight: 700,
              }}
            >
              {q.opts[answers[i]] === q.a ? '✓ Correct!' : `✗ Answer: ${q.a}`}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

function WeatherScreen({ goBack }) {
  const [tab, setTab] = useState('Vocabulary');
  const d = WEATHER;
  return (
    <WRAP>
      <BACK_BTN goBack={goBack} />
      <HERO icon="🌤️" title={d.title} subtitle={d.intro} color="#0891b2" />
      <TIP_BOX text={d.tip} />
      <TAB_NAV
        tabs={['Vocabulary', 'Seasons', 'Phrases', 'Quiz']}
        active={tab}
        setActive={setTab}
        accent="#0891b2"
      />

      {tab === 'Vocabulary' && (
        <div>
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}
          >
            {d.vocab.map((v, i) => (
              <div
                key={i}
                style={{
                  background: 'white',
                  borderRadius: 12,
                  padding: '10px 12px',
                  border: '1px solid rgba(0,0,0,.06)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
                onClick={() => speak(v.hr)}
              >
                <div style={{ fontSize: 22, flexShrink: 0 }}>{v.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0891b2' }}>{v.hr}</div>
                  <div style={{ fontSize: 11, color: '#78716c' }}>{v.en}</div>
                  {v.note && (
                    <div
                      style={{ fontSize: 10, color: '#0369a1', fontStyle: 'italic', marginTop: 1 }}
                    >
                      {v.note}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#164e63', marginBottom: 10 }}>
            Opposites
          </div>
          {d.adjectives.map((a, i) => (
            <div
              key={i}
              style={{
                background: 'white',
                borderRadius: 10,
                padding: '10px 14px',
                marginBottom: 6,
                border: '1px solid rgba(0,0,0,.06)',
                display: 'flex',
                gap: 10,
                alignItems: 'center',
              }}
            >
              <div style={{ flex: 1 }}>
                <span
                  style={{ fontWeight: 700, color: '#0891b2', cursor: 'pointer' }}
                  onClick={() => speak(a.hr)}
                >
                  {a.hr}
                </span>{' '}
                <span style={{ color: '#78716c', fontSize: 12 }}>— {a.en}</span>
              </div>
              <div style={{ color: '#d1d5db' }}>⟷</div>
              <div style={{ flex: 1 }}>
                <span
                  style={{ fontWeight: 700, color: '#0891b2', cursor: 'pointer' }}
                  onClick={() => speak(a.hr2)}
                >
                  {a.hr2}
                </span>{' '}
                <span style={{ color: '#78716c', fontSize: 12 }}>— {a.en2}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'Seasons' && (
        <div>
          {d.seasons.map((s, i) => (
            <div
              key={i}
              style={{
                background: 'white',
                borderRadius: 14,
                padding: '16px',
                marginBottom: 12,
                border: '1px solid rgba(0,0,0,.06)',
                boxShadow: '0 1px 3px rgba(0,0,0,.04)',
                cursor: 'pointer',
              }}
              onClick={() => speak(s.hr)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
                <div style={{ fontSize: 36 }}>{s.icon}</div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 900, color: '#0891b2' }}>{s.hr}</div>
                  <div style={{ fontSize: 13, color: '#78716c' }}>{s.en}</div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: '#44403c', marginBottom: 4 }}>
                <strong>Adjective:</strong> {s.adj}
              </div>
              <div style={{ fontSize: 11, color: '#44403c' }}>
                <strong>Months:</strong> {s.months}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'Phrases' && (
        <div>
          {d.phrases.map((p, i) => (
            <div
              key={i}
              role="button"
              tabIndex={0}
              aria-label={`Play audio: ${p.hr} — ${p.en}`}
              style={{
                background: 'white',
                borderRadius: 12,
                padding: '12px 16px',
                marginBottom: 8,
                border: '1px solid rgba(0,0,0,.06)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                cursor: 'pointer',
              }}
              onClick={() => speak(p.hr)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  speak(p.hr);
                }
              }}
            >
              <div style={{ fontSize: 20 }} aria-hidden="true">
                🔊
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0891b2' }}>{p.hr}</div>
                <div style={{ fontSize: 12, color: '#78716c' }}>{p.en}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'Quiz' && <QUIZ_SECTION quiz={d.quiz} accent="#0891b2" />}
    </WRAP>
  );
}

export default WeatherScreen;
