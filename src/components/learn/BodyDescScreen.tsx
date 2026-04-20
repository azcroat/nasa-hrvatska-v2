// @ts-nocheck
import React, { useState } from 'react';
import { BODYDESC, speak } from '../../data';

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

function BodyDescScreen({ goBack }) {
  const [tab, setTab] = useState('Description');
  const [secIdx, setSecIdx] = useState(0);
  const d = BODYDESC;
  const sec = d.sections[secIdx];
  return (
    <WRAP>
      <BACK_BTN goBack={goBack} />
      <HERO icon="👤" title={d.title} subtitle={d.intro} color="#0f766e" />
      <TIP_BOX text={d.tip} />
      <TAB_NAV
        tabs={['Description', 'Phrases', 'Quiz']}
        active={tab}
        setActive={setTab}
        accent="#0f766e"
      />

      {tab === 'Description' && (
        <div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
            {d.sections.map((s, i) => (
              <button
                key={i}
                onClick={() => setSecIdx(i)}
                style={{
                  padding: '6px 10px',
                  borderRadius: 20,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 11,
                  fontWeight: 700,
                  background: secIdx === i ? '#0f766e' : '#f5f5f4',
                  color: secIdx === i ? 'white' : '#44403c',
                  flexShrink: 0,
                }}
              >
                {s.icon} {s.title}
              </button>
            ))}
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {sec.items.map((item, i) => (
              <div
                key={i}
                role="button"
                tabIndex={0}
                aria-label={`Play audio: ${item.hr} — ${item.en}`}
                style={{
                  background: 'white',
                  borderRadius: 12,
                  padding: '10px 14px',
                  border: '1px solid rgba(0,0,0,.06)',
                  cursor: 'pointer',
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                }}
                onClick={() => speak(item.hr)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    speak(item.hr);
                  }
                }}
              >
                <div style={{ fontSize: 20, flexShrink: 0 }} aria-hidden="true">
                  🔊
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f766e' }}>{item.hr}</div>
                  <div style={{ fontSize: 12, color: '#78716c' }}>{item.en}</div>
                  {item.note && (
                    <div
                      style={{ fontSize: 11, color: '#0369a1', fontStyle: 'italic', marginTop: 2 }}
                    >
                      {item.note}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
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
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f766e' }}>{p.hr}</div>
                <div style={{ fontSize: 12, color: '#78716c' }}>{p.en}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'Quiz' && <QUIZ_SECTION quiz={d.quiz} accent="#0f766e" />}
    </WRAP>
  );
}

export default BodyDescScreen;
