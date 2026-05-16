import React, { useState } from 'react';
import { speak } from '../../data';
import { useGrammar } from '../../hooks/useGrammar';

interface PhonExample {
  hr: string;
  en: string;
}
interface PhonLetter {
  letter: string;
  name: string;
  ipa: string;
  like: string;
  memory: string;
  color: string;
  examples: PhonExample[];
}
interface PhonConfusedPair {
  a: string;
  b: string;
  example_a: string;
  example_b: string;
  tip: string;
}
interface PhonRule {
  rule: string;
  detail: string;
}
interface PhonologyShape {
  title: string;
  intro: string;
  tip: string;
  letters: PhonLetter[];
  confusedPairs: PhonConfusedPair[];
  rules: PhonRule[];
  quiz: PhonQuizItem[];
}

function LoadingState() {
  return <div style={{ padding: 24, textAlign: 'center' }}>Loading…</div>;
}
function ErrorState({ message }: { message: string }) {
  return <div style={{ padding: 24, textAlign: 'center', color: 'var(--info)' }}>{message}</div>;
}

const BACK_BTN = ({ goBack }: { goBack: () => void }) => (
  <button className="b bg" style={{ marginBottom: 16, fontSize: 13 }} onClick={goBack}>
    ← Back
  </button>
);
const WRAP = ({ children }: { children: React.ReactNode }) => (
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
const HERO = ({
  icon,
  title,
  subtitle,
  color,
}: {
  icon: string;
  title: string;
  subtitle: string;
  color: string;
}) => (
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
const TAB_NAV = ({
  tabs,
  active,
  setActive,
  accent,
}: {
  tabs: string[];
  active: string;
  setActive: (t: string) => void;
  accent: string;
}) => (
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
const TIP_BOX = ({ text }: { text: string }) => (
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
interface PhonQuizItem {
  q: string;
  opts: string[];
  a: string;
}

const QUIZ_SECTION = ({ quiz, accent }: { quiz: PhonQuizItem[]; accent: string }) => {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  return (
    <div>
      {quiz.map((q: PhonQuizItem, i: number) => (
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
                color: q.opts[answers[i]!] === q.a ? '#15803d' : '#b91c1c',
                fontWeight: 700,
              }}
            >
              {q.opts[answers[i]!] === q.a ? '✓ Correct!' : `✗ Answer: ${q.a}`}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

function PhonologyScreen({ goBack }: { goBack: () => void }) {
  const { grammar, loading, error } = useGrammar();
  const [tab, setTab] = useState('Letters');
  const [selLetter, setSelLetter] = useState<number | null>(null);
  if (error) return <ErrorState message="Couldn't load grammar - please retry." />;
  if (loading || !grammar) return <LoadingState />;
  const d = grammar.PHONOLOGY as unknown as PhonologyShape;
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
              const l = d.letters[selLetter]!;
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
                  onClick={() => speak(p.example_a.split(' ')[0] ?? '')}
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
                  onClick={() => speak(p.example_b.split(' ')[0] ?? '')}
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

export default PhonologyScreen;
