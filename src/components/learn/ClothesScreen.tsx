import React, { useState } from 'react';
import { speak } from '../../data';
import { useContent } from '../../hooks/useContent';

interface BackBtnProps {
  goBack: () => void;
}
const BACK_BTN = ({ goBack }: BackBtnProps) => (
  <button className="b bg" style={{ marginBottom: 16, fontSize: 13 }} onClick={goBack}>
    ← Back
  </button>
);
interface WrapProps {
  children: React.ReactNode;
}
const WRAP = ({ children }: WrapProps) => (
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
interface HeroProps {
  icon: string;
  title: string;
  subtitle: string;
  color: string;
}
const HERO = ({ icon, title, subtitle, color }: HeroProps) => (
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
interface TabNavProps {
  tabs: string[];
  active: string;
  setActive: (t: string) => void;
  accent: string;
}
const TAB_NAV = ({ tabs, active, setActive, accent }: TabNavProps) => (
  <div style={{ display: 'flex', gap: 4, marginBottom: 20, overflowX: 'auto', paddingBottom: 2 }}>
    {tabs.map((t: string) => (
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
interface TipBoxProps {
  text: string;
}
const TIP_BOX = ({ text }: TipBoxProps) => (
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
interface QuizItem2 {
  q: string;
  opts: string[];
  a: string;
}
interface QuizSectionProps2 {
  quiz: QuizItem2[];
  accent: string;
}
const QUIZ_SECTION = ({ quiz, accent: _accent }: QuizSectionProps2) => {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  return (
    <div>
      {quiz.map((q: QuizItem2, i: number) => (
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
            {q.opts.map((opt: string, j: number) => {
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
                color: q.opts[answers[i] as number] === q.a ? '#15803d' : '#b91c1c',
                fontWeight: 700,
              }}
            >
              {q.opts[answers[i] as number] === q.a ? '✓ Correct!' : `✗ Answer: ${q.a}`}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

interface ClothesScreenProps {
  goBack: () => void;
}
function ClothesScreen({ goBack }: ClothesScreenProps) {
  const { content, loading, error } = useContent();
  const [tab, setTab] = useState('Clothing');
  const [catIdx, setCatIdx] = useState(0);
  if (error) return <WRAP><BACK_BTN goBack={goBack} /></WRAP>;
  if (loading || !content) return <WRAP><BACK_BTN goBack={goBack} /></WRAP>;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const d = content.CLOTHES as {
    title: string;
    intro: string;
    tip: string;
    categories: any[];
    phrases: any[];
    quiz: any[];
  };
  /* eslint-enable @typescript-eslint/no-explicit-any */
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
            {cat?.icon} {cat?.cat}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {(cat?.items ?? []).map(// eslint-disable-next-line @typescript-eslint/no-explicit-any
            (item: any, i: number) => (
              <div
                key={i}
                style={{
                  background: 'white',
                  borderRadius: 12,
                  padding: '10px 12px',
                  border: '1px solid rgba(0,0,0,.06)',
                  cursor: 'pointer',
                }}
                onClick={() => speak(item.hr)}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: '#7c3aed', marginBottom: 2 }}>
                  {item.hr}
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
          {d.phrases.map(// eslint-disable-next-line @typescript-eslint/no-explicit-any
          (p: any, i: number) => (
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

export default ClothesScreen;
