// @ts-nocheck
import React, { useState } from 'react';
import { COUNTRIES, PROFESSIONS, WEATHER, CLOTHES, BODYDESC, PHONOLOGY, speak } from '../../data';

// Shows a pronunciation difficulty badge for words with Croatian diacritics
function PronDifficulty({ word }) {
  if (!word) return null;
  const veryHard = /[čć].*[šž]|dž/.test(word);
  const hard = /[čćšžđ]/.test(word);
  if (!hard) return null;
  return (
    <span
      title={veryHard ? 'Pronunciation: challenging' : 'Pronunciation: some diacritics'}
      style={{
        fontSize: 9,
        fontWeight: 700,
        padding: '1px 5px',
        borderRadius: 4,
        marginLeft: 4,
        background: veryHard ? 'rgba(220,38,38,0.1)' : 'rgba(245,158,11,0.1)',
        color: veryHard ? '#dc2626' : '#d97706',
        verticalAlign: 'middle',
        display: 'inline-block',
      }}
    >
      {veryHard ? '🔴 hard' : '🟡 diacritics'}
    </span>
  );
}

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

export function CountriesScreen({ goBack }) {
  const [tab, setTab] = useState('Countries');
  const d = COUNTRIES;
  return (
    <WRAP>
      <BACK_BTN goBack={goBack} />
      <HERO icon="🌍" title={d.title} subtitle={d.intro} color="#0369a1" />
      <TIP_BOX text={d.tip} />
      <TAB_NAV
        tabs={['Countries', 'Phrases', 'Quiz']}
        active={tab}
        setActive={setTab}
        accent="#0369a1"
      />

      {tab === 'Countries' && (
        <div>
          <div style={{ fontSize: 11, color: '#78716c', marginBottom: 12, lineHeight: 1.6 }}>
            Tap the flag to hear the country name. Nationality adjectives:{' '}
            <strong>m / f / n</strong>. Demonyms: person of that nationality.
          </div>
          {d.countries.map((c, i) => (
            <div
              key={i}
              style={{
                background: 'white',
                borderRadius: 14,
                padding: '14px 16px',
                marginBottom: 10,
                border: '1px solid rgba(0,0,0,.06)',
                boxShadow: '0 1px 3px rgba(0,0,0,.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <button
                  onClick={() => speak(c.country)}
                  style={{
                    fontSize: 30,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    flexShrink: 0,
                    padding: 0,
                    lineHeight: 1,
                  }}
                >
                  {c.flag}
                </button>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      flexWrap: 'wrap',
                      marginBottom: 4,
                    }}
                  >
                    <span style={{ fontSize: 15, fontWeight: 800, color: '#0369a1' }}>
                      {c.country}
                      <PronDifficulty word={c.country} />
                    </span>
                    <span style={{ fontSize: 11, color: '#78716c' }}>{c.en}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                    {[c.adj_m, c.adj_f, c.adj_n].map((adj, ai) => (
                      <span
                        key={ai}
                        style={{
                          background: '#f0f9ff',
                          color: '#0369a1',
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 8,
                          border: '1px solid #bae6fd',
                        }}
                      >
                        {adj}{' '}
                        <span style={{ fontWeight: 400, opacity: 0.7 }}>{['m', 'f', 'n'][ai]}</span>
                      </span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: '#44403c' }}>
                      👤 {c.dem_m} / {c.dem_f}
                    </span>
                  </div>
                  {c.note && (
                    <div
                      style={{ marginTop: 4, fontSize: 11, color: '#78716c', fontStyle: 'italic' }}
                    >
                      {c.note}
                    </div>
                  )}
                </div>
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
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0369a1' }}>{p.hr}</div>
                <div style={{ fontSize: 12, color: '#78716c' }}>{p.en}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'Quiz' && <QUIZ_SECTION quiz={d.quiz} accent="#0369a1" />}
    </WRAP>
  );
}

export function ProfessionsScreen({ goBack }) {
  const [tab, setTab] = useState('Jobs');
  const [catIdx, setCatIdx] = useState(0);
  const d = PROFESSIONS;
  const cat = d.categories[catIdx];
  return (
    <WRAP>
      <BACK_BTN goBack={goBack} />
      <HERO icon="💼" title={d.title} subtitle={d.intro} color="#1d4ed8" />
      <TIP_BOX text={d.tip} />
      <TAB_NAV
        tabs={['Jobs', 'Phrases', 'Quiz']}
        active={tab}
        setActive={setTab}
        accent="#1d4ed8"
      />

      {tab === 'Jobs' && (
        <div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
            {d.categories.map((c, i) => (
              <button
                key={i}
                onClick={() => setCatIdx(i)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 20,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 11,
                  fontWeight: 700,
                  background: catIdx === i ? '#1d4ed8' : '#f5f5f4',
                  color: catIdx === i ? 'white' : '#44403c',
                }}
              >
                {c.icon} {c.cat}
              </button>
            ))}
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {cat.jobs.map((j, i) => (
              <div
                key={i}
                style={{
                  background: 'white',
                  borderRadius: 12,
                  padding: '12px 14px',
                  border: '1px solid rgba(0,0,0,.06)',
                  boxShadow: '0 1px 3px rgba(0,0,0,.04)',
                }}
              >
                <div
                  style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 800,
                          color: '#1d4ed8',
                          cursor: 'pointer',
                        }}
                        onClick={() => speak(j.m)}
                      >
                        ♂ {j.m}
                        <PronDifficulty word={j.m} />
                      </span>
                      <span style={{ color: '#d1d5db', fontSize: 14 }}>/</span>
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 800,
                          color: '#7c3aed',
                          cursor: 'pointer',
                        }}
                        onClick={() => speak(j.f)}
                      >
                        ♀ {j.f}
                        <PronDifficulty word={j.f} />
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#78716c' }}>{j.en}</div>
                    {j.note && (
                      <div
                        style={{
                          fontSize: 11,
                          color: '#0369a1',
                          fontStyle: 'italic',
                          marginTop: 3,
                        }}
                      >
                        {j.note}
                      </div>
                    )}
                  </div>
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
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1d4ed8' }}>{p.hr}</div>
                <div style={{ fontSize: 12, color: '#78716c' }}>{p.en}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'Quiz' && <QUIZ_SECTION quiz={d.quiz} accent="#1d4ed8" />}
    </WRAP>
  );
}

export function WeatherScreen({ goBack }) {
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
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0891b2' }}>
                    {v.hr}
                    <PronDifficulty word={v.hr} />
                  </div>
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

export function ClothesScreen({ goBack }) {
  const [tab, setTab] = useState('Clothing');
  const [catIdx, setCatIdx] = useState(0);
  const d = CLOTHES;
  const cat = d.categories[catIdx];
  return (
    <WRAP>
      <BACK_BTN goBack={goBack} />
      <HERO icon="👗" title={d.title} subtitle={d.intro} color="#7c3aed" />
      <TIP_BOX text={d.tip} />
      <TAB_NAV
        tabs={['Clothing', 'Phrases', 'Quiz']}
        active={tab}
        setActive={setTab}
        accent="#7c3aed"
      />

      {tab === 'Clothing' && (
        <div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
            {d.categories.map((c, i) => (
              <button
                key={i}
                onClick={() => setCatIdx(i)}
                style={{
                  padding: '6px 10px',
                  borderRadius: 20,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 11,
                  fontWeight: 700,
                  background: catIdx === i ? '#7c3aed' : '#f5f5f4',
                  color: catIdx === i ? 'white' : '#44403c',
                }}
              >
                {c.icon}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#7c3aed', marginBottom: 10 }}>
            {cat.icon} {cat.cat}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {cat.items.map((item, i) => (
              <div
                key={i}
                role="button"
                tabIndex={0}
                aria-label={`Play audio: ${item.hr} — ${item.en}`}
                style={{
                  background: 'white',
                  borderRadius: 12,
                  padding: '10px 12px',
                  border: '1px solid rgba(0,0,0,.06)',
                  cursor: 'pointer',
                }}
                onClick={() => speak(item.hr)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    speak(item.hr);
                  }
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: '#7c3aed', marginBottom: 2 }}>
                  {item.hr}
                  <PronDifficulty word={item.hr} />
                </div>
                <div style={{ fontSize: 11, color: '#78716c' }}>{item.en}</div>
                {item.gen && (
                  <div
                    style={{
                      fontSize: 10,
                      background: '#f3f4f6',
                      color: '#6b7280',
                      padding: '1px 6px',
                      borderRadius: 6,
                      display: 'inline-block',
                      marginTop: 2,
                    }}
                  >
                    {item.gen}
                  </div>
                )}
                {item.note && (
                  <div
                    style={{ fontSize: 10, color: '#0369a1', fontStyle: 'italic', marginTop: 2 }}
                  >
                    {item.note}
                  </div>
                )}
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
                <div style={{ fontSize: 14, fontWeight: 700, color: '#7c3aed' }}>{p.hr}</div>
                <div style={{ fontSize: 12, color: '#78716c' }}>{p.en}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'Quiz' && <QUIZ_SECTION quiz={d.quiz} accent="#7c3aed" />}
    </WRAP>
  );
}

export function BodyDescScreen({ goBack }) {
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
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f766e' }}>
                    {item.hr}
                    <PronDifficulty word={item.hr} />
                  </div>
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

export function PhonologyScreen({ goBack }) {
  const [tab, setTab] = useState('Letters');
  const [selLetter, setSelLetter] = useState(null);
  const d = PHONOLOGY;
  return (
    <WRAP>
      <BACK_BTN goBack={goBack} />
      <HERO icon="🔤" title={d.title} subtitle={d.intro} color="#b45309" />
      <TIP_BOX text={d.tip} />
      <TAB_NAV
        tabs={['Letters', 'Confusing Pairs', 'Rules', 'Quiz']}
        active={tab}
        setActive={setTab}
        accent="#b45309"
      />

      {tab === 'Letters' && (
        <div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: 8,
              marginBottom: 16,
            }}
          >
            {d.letters.map((l, i) => (
              <button
                key={i}
                onClick={() => setSelLetter(selLetter === i ? null : i)}
                style={{
                  background: selLetter === i ? l.color : l.color + '15',
                  color: selLetter === i ? 'white' : l.color,
                  border: `2px solid ${l.color}30`,
                  borderRadius: 12,
                  padding: '12px 4px',
                  fontSize: 22,
                  fontWeight: 900,
                  cursor: 'pointer',
                  transition: 'all .15s',
                }}
              >
                {l.letter}
              </button>
            ))}
          </div>
          {selLetter !== null &&
            (() => {
              const l = d.letters[selLetter];
              return (
                <div
                  style={{
                    background: 'white',
                    borderRadius: 16,
                    padding: 20,
                    border: `2px solid ${l.color}30`,
                    boxShadow: '0 4px 16px rgba(0,0,0,.06)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 14,
                        background: l.color + '15',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 30,
                        fontWeight: 900,
                        color: l.color,
                      }}
                    >
                      {l.letter}
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: l.color }}>{l.name}</div>
                      <div style={{ fontSize: 12, color: '#78716c', fontFamily: 'monospace' }}>
                        {l.ipa}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{ fontSize: 13, color: '#44403c', marginBottom: 10, lineHeight: 1.6 }}
                  >
                    {l.like}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      background: l.color + '10',
                      borderRadius: 10,
                      padding: '8px 12px',
                      marginBottom: 12,
                      color: l.color,
                      fontWeight: 700,
                    }}
                  >
                    🧠 {l.memory}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#164e63', marginBottom: 6 }}>
                    Examples:
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {l.examples.map((ex, j) => (
                      <div
                        key={j}
                        style={{
                          background: '#f5f5f4',
                          borderRadius: 10,
                          padding: '6px 12px',
                          cursor: 'pointer',
                        }}
                        onClick={() => speak(ex.hr)}
                      >
                        <div style={{ fontSize: 14, fontWeight: 700, color: l.color }}>{ex.hr}</div>
                        <div style={{ fontSize: 11, color: '#78716c' }}>{ex.en}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          {selLetter === null && (
            <div style={{ textAlign: 'center', padding: '20px', color: '#78716c', fontSize: 13 }}>
              Tap any letter above to see its pronunciation guide
            </div>
          )}
        </div>
      )}

      {tab === 'Confusing Pairs' && (
        <div>
          <div style={{ fontSize: 13, color: '#78716c', marginBottom: 14, lineHeight: 1.6 }}>
            These letter pairs cause the most confusion. Tap each word to hear the difference.
          </div>
          {d.confusedPairs.map((p, i) => (
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
              <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                <div
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    background: '#fef3c7',
                    borderRadius: 10,
                    padding: '10px',
                    cursor: 'pointer',
                  }}
                  onClick={() => speak(p.example_a.split(' ')[0])}
                >
                  <div style={{ fontSize: 26, fontWeight: 900, color: '#b45309' }}>{p.a}</div>
                  <div style={{ fontSize: 11, color: '#44403c', marginTop: 4 }}>{p.example_a}</div>
                </div>
                <div
                  style={{ display: 'flex', alignItems: 'center', color: '#78716c', fontSize: 16 }}
                >
                  vs
                </div>
                <div
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    background: '#fef3c7',
                    borderRadius: 10,
                    padding: '10px',
                    cursor: 'pointer',
                  }}
                  onClick={() => speak(p.example_b.split(' ')[0])}
                >
                  <div style={{ fontSize: 26, fontWeight: 900, color: '#b45309' }}>{p.b}</div>
                  <div style={{ fontSize: 11, color: '#44403c', marginTop: 4 }}>{p.example_b}</div>
                </div>
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: '#44403c',
                  lineHeight: 1.6,
                  background: '#fef9ee',
                  borderRadius: 8,
                  padding: '8px 12px',
                }}
              >
                {p.tip}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'Rules' && (
        <div>
          {d.rules.map((r, i) => (
            <div
              key={i}
              style={{
                background: 'white',
                borderRadius: 14,
                padding: 16,
                marginBottom: 10,
                border: '1px solid rgba(0,0,0,.06)',
                boxShadow: '0 1px 3px rgba(0,0,0,.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: '#b45309',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    fontWeight: 900,
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#b45309', marginBottom: 4 }}>
                    {r.rule}
                  </div>
                  <div style={{ fontSize: 13, color: '#44403c', lineHeight: 1.6 }}>{r.detail}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'Quiz' && <QUIZ_SECTION quiz={d.quiz} accent="#b45309" />}
    </WRAP>
  );
}
