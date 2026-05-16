import React, { useState } from 'react';
import { H, speak } from '../../data';
import { useContent } from '../../hooks/useContent';
import { useGrammar } from '../../hooks/useGrammar';

interface QuizQuestion {
  q: string;
  opts: string[];
  a: string;
}

interface ConditionalShape {
  title: string;
  intro: string;
  forms: { pro: string; form: string; en: string }[];
  examples: { hr: string; en: string; note: string }[];
  ifThen: { hr: string; en: string }[];
  polite: { situation: string; hr: string; en: string }[];
  quiz: QuizQuestion[];
}

interface FormalRegisterShape {
  title: string;
  intro: string;
  rules: { icon: string; rule: string; examples: string[] }[];
  comparison: { situation: string; ti: string; vi: string }[];
  verbForms: {
    pronoun: string;
    biti: string;
    imati: string;
    ići: string;
    moći: string;
    htjeti: string;
    govoriti: string;
  }[];
  emailPhrases: { label: string; hr: string; en: string }[];
  quiz: QuizQuestion[];
}

interface ImpersonalShape {
  title: string;
  intro: string;
  constructions: { hr: string; en: string; note: string; example: string }[];
  signs: { sign: string; en: string }[];
  quiz: QuizQuestion[];
}

function LoadingState() {
  return <div style={{ padding: 24, textAlign: 'center' }}>Loading…</div>;
}
function ErrorState({ message }: { message: string }) {
  return <div style={{ padding: 24, textAlign: 'center', color: 'var(--info)' }}>{message}</div>;
}

// ── shared quiz engine ────────────────────────────────────────────────────────
function QuizBlock({
  questions,
  award,
}: {
  questions: QuizQuestion[];
  award?: (pts: number, celebrate?: boolean, activityType?: string) => void;
}) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [score, setScore] = useState<number | null>(null);

  function handleAnswer(qi: number, opt: string, correct: string): void {
    void correct;
    if (answers[qi] !== undefined) return;
    const updated = { ...answers, [qi]: opt };
    setAnswers(updated);
    if (Object.keys(updated).length === questions.length) {
      const pts = Object.entries(updated).filter(
        ([i, v]) => v === (questions[Number(i)] as QuizQuestion).a,
      ).length;
      setScore(pts);
      if (award) award(pts * 5, false, 'lesson');
    }
  }

  return (
    <div>
      <h3 className="sh" style={{ marginTop: 4 }}>
        🎯 Quick Quiz
      </h3>
      {questions.map(function (q: any, qi: number) {
        const ans = answers[qi];
        return (
          <div key={qi} className="c" style={{ marginBottom: 12 }}>
            <div
              style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: 'var(--heading)' }}
            >
              {qi + 1}. {q.q}
            </div>
            {q.opts.map(function (opt: any, oi: number) {
              let bg = 'white',
                bc = '#e7e5e4',
                col = '#1c1917';
              if (ans) {
                if (opt === q.a) {
                  bg = '#dcfce7';
                  bc = '#16a34a';
                  col = '#14532d';
                } else if (opt === ans) {
                  bg = '#fee2e2';
                  bc = '#dc2626';
                  col = '#7f1d1d';
                }
              }
              return (
                <button
                  key={oi}
                  onClick={function () {
                    handleAnswer(qi, opt, q.a);
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    marginBottom: 6,
                    textAlign: 'left',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '2px solid ' + bc,
                    background: bg,
                    color: col,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all .2s',
                    fontFamily: "'Outfit',sans-serif",
                  }}
                >
                  {opt}
                </button>
              );
            })}
            {ans && (
              <div
                style={{
                  fontSize: 11,
                  lineHeight: 1.5,
                  marginTop: 4,
                  padding: '6px 10px',
                  background: 'rgba(14,116,144,.07)',
                  borderRadius: 8,
                  color: '#0e7490',
                }}
              >
                {ans === q.a ? '✓ Correct!' : '✗ Correct answer: ' + q.a}
              </div>
            )}
          </div>
        );
      })}
      {score !== null && (
        <div
          style={{
            margin: '16px 0',
            padding: '14px 18px',
            background: score >= questions.length * 0.8 ? '#dcfce7' : '#fef3c7',
            borderRadius: 14,
            textAlign: 'center',
            fontWeight: 700,
            fontSize: 16,
            color: score >= questions.length * 0.8 ? '#14532d' : '#92400e',
          }}
        >
          {score >= questions.length * 0.8 ? '🌟 ' : '💪 '}
          {score}/{questions.length} —{' '}
          {score >= questions.length * 0.8 ? 'Excellent!' : 'Keep practising!'}
        </div>
      )}
    </div>
  );
}

// ── CONDITIONAL MOOD ─────────────────────────────────────────────────────────
export function ConditionalScreen({
  goBack,
  award,
}: {
  goBack: () => void;
  award?: (pts: number, celebrate?: boolean, activityType?: string) => void;
}) {
  const { grammar, loading, error } = useGrammar();
  const [tab, setTab] = useState('forms');
  const tabs = [
    { k: 'forms', l: 'Forms' },
    { k: 'examples', l: 'Examples' },
    { k: 'ifthen', l: 'If/Then' },
    { k: 'polite', l: 'Polite Use' },
    { k: 'quiz', l: 'Quiz' },
  ];

  if (error) return <ErrorState message="Couldn't load grammar - please retry." />;
  if (loading || !grammar) return <LoadingState />;
  const CONDITIONAL = grammar.CONDITIONAL as unknown as ConditionalShape;

  return (
    <div className="scr-wrap">
      {H('🔀 ' + CONDITIONAL.title, CONDITIONAL.intro, goBack)}

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {tabs.map((t) => (
          <button
            key={t.k}
            className={'b ' + (tab === t.k ? 'bp' : 'bg')}
            style={{ fontSize: 13 }}
            onClick={() => setTab(t.k)}
          >
            {t.l}
          </button>
        ))}
      </div>

      {tab === 'forms' && (
        <div>
          <div
            style={{
              marginBottom: 14,
              padding: '12px 16px',
              background: 'linear-gradient(135deg,#0e7490,#0369a1)',
              borderRadius: 14,
              color: 'white',
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                opacity: 0.8,
                marginBottom: 6,
                letterSpacing: '0.08em',
              }}
            >
              THE PATTERN
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.7 }}>
              bih / bi / bi / bismo / biste / bi + <strong>infinitive</strong>
            </div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>
              The conditional clitic always comes <em>after the first stressed word/phrase</em> —
              never at the start of a sentence.
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                {['Pronoun', 'Conditional', 'English'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '8px 10px',
                      textAlign: 'left',
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#44403c',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CONDITIONAL.forms.map(function (f: any, i: number) {
                return (
                  <tr
                    key={i}
                    style={{
                      borderBottom: '1px solid #f3f4f6',
                      background: i % 2 === 0 ? 'white' : '#fafaf9',
                    }}
                  >
                    <td style={{ padding: '10px', fontWeight: 700, color: '#0e7490' }}>{f.pro}</td>
                    <td
                      style={{ padding: '10px', fontWeight: 800, fontSize: 16, color: '#0369a1' }}
                    >
                      {f.form}
                    </td>
                    <td style={{ padding: '10px', color: '#78716c', fontSize: 13 }}>{f.en}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'examples' && (
        <div>
          {CONDITIONAL.examples.map(function (ex: any, i: number) {
            return (
              <div
                key={i}
                style={{
                  marginBottom: 12,
                  background: 'white',
                  borderRadius: 14,
                  border: '1px solid rgba(0,0,0,.07)',
                  overflow: 'hidden',
                  boxShadow: '0 1px 3px rgba(0,0,0,.04)',
                }}
              >
                <button
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '12px 16px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: "'Outfit',sans-serif",
                  }}
                  onClick={() => speak(ex.hr)}
                >
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#0369a1' }}>
                    {ex.hr} <span aria-hidden="true">🔊</span>
                  </div>
                  <div style={{ fontSize: 14, color: '#16a34a', fontWeight: 600, marginTop: 3 }}>
                    {ex.en}
                  </div>
                </button>
                <div
                  style={{
                    padding: '0 16px 12px',
                    fontSize: 12,
                    color: '#78716c',
                    lineHeight: 1.5,
                    borderTop: '1px solid #f3f4f6',
                    paddingTop: 8,
                  }}
                >
                  💡 {ex.note}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'ifthen' && (
        <div>
          <div
            style={{
              marginBottom: 14,
              padding: '12px 16px',
              background: 'rgba(14,116,144,.07)',
              borderRadius: 12,
              fontSize: 13,
              color: '#0e7490',
              lineHeight: 1.6,
            }}
          >
            <strong>Pattern:</strong> Da + present tense → conditional result. "Da imam..." = "If I
            had..."
          </div>
          {CONDITIONAL.ifThen.map(function (ex: any, i: number) {
            return (
              <button
                key={i}
                className="c"
                style={{
                  marginBottom: 10,
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
                onClick={() => speak(ex.hr)}
              >
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0369a1' }}>
                  {ex.hr} <span aria-hidden="true">🔊</span>
                </div>
                <div style={{ fontSize: 13, color: '#78716c', marginTop: 3 }}>{ex.en}</div>
              </button>
            );
          })}
        </div>
      )}

      {tab === 'polite' && (
        <div>
          <div
            style={{
              marginBottom: 14,
              padding: '12px 16px',
              background: 'rgba(14,116,144,.07)',
              borderRadius: 12,
              fontSize: 13,
              color: '#0e7490',
              lineHeight: 1.6,
            }}
          >
            The conditional is the <strong>standard polite register</strong> in Croatia. Using the
            present tense to ask for things (e.g. "Hoću kavu") sounds blunt.
          </div>
          {CONDITIONAL.polite.map(function (p: any, i: number) {
            return (
              <button
                key={i}
                className="c"
                style={{
                  marginBottom: 10,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 10,
                  textAlign: 'left',
                  cursor: 'pointer',
                  width: '100%',
                }}
                onClick={() => speak(p.hr)}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: '#78716c', marginBottom: 3 }}>
                    {p.situation}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#0369a1' }}>
                    {p.hr} <span aria-hidden="true">🔊</span>
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: '#16a34a',
                    fontWeight: 600,
                    minWidth: 100,
                    textAlign: 'right',
                  }}
                >
                  {p.en}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {tab === 'quiz' && <QuizBlock questions={CONDITIONAL.quiz} award={award} />}
    </div>
  );
}

// ── FORMAL REGISTER (Vi vs ti) ────────────────────────────────────────────────
export function FormalRegisterScreen({
  goBack,
  award,
}: {
  goBack: () => void;
  award?: (pts: number, celebrate?: boolean, activityType?: string) => void;
}) {
  const { grammar, loading, error } = useGrammar();
  const [tab, setTab] = useState('rules');
  const tabs = [
    { k: 'rules', l: 'Rules' },
    { k: 'compare', l: 'Compare' },
    { k: 'verbs', l: 'Verb Forms' },
    { k: 'email', l: 'Email' },
    { k: 'quiz', l: 'Quiz' },
  ];

  if (error) return <ErrorState message="Couldn't load grammar - please retry." />;
  if (loading || !grammar) return <LoadingState />;
  const FORMAL_REGISTER = grammar.FORMAL_REGISTER as unknown as FormalRegisterShape;

  return (
    <div className="scr-wrap">
      {H('🤝 ' + FORMAL_REGISTER.title, FORMAL_REGISTER.intro, goBack)}

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {tabs.map((t) => (
          <button
            key={t.k}
            className={'b ' + (tab === t.k ? 'bp' : 'bg')}
            style={{ fontSize: 13 }}
            onClick={() => setTab(t.k)}
          >
            {t.l}
          </button>
        ))}
      </div>

      {tab === 'rules' && (
        <div>
          {FORMAL_REGISTER.rules.map(function (r: any, i: number) {
            const colors = ['#0e7490', '#7c3aed', '#ca8a04'];
            const bgs = ['rgba(14,116,144,.06)', 'rgba(124,58,237,.06)', 'rgba(202,138,68,.06)'];
            return (
              <div
                key={i}
                style={{
                  marginBottom: 14,
                  padding: '14px 16px',
                  background: bgs[i],
                  borderRadius: 14,
                  borderLeft: '4px solid ' + colors[i],
                }}
              >
                <div style={{ fontSize: 16, fontWeight: 800, color: colors[i], marginBottom: 8 }}>
                  {r.icon} {r.rule}
                </div>
                {r.examples.map(function (ex: any, ei: number) {
                  return (
                    <div
                      key={ei}
                      style={{
                        fontSize: 13,
                        color: '#44403c',
                        lineHeight: 1.6,
                        paddingLeft: 8,
                        borderLeft: '2px solid ' + colors[i] + '44',
                        marginBottom: 4,
                      }}
                    >
                      {ex}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'compare' && (
        <div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  {['Situation', 'ti (informal)', 'Vi (formal)'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '8px 10px',
                        textAlign: 'left',
                        fontWeight: 700,
                        color: '#44403c',
                        fontSize: 12,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FORMAL_REGISTER.comparison.map(function (row: any, i: number) {
                  return (
                    <tr
                      key={i}
                      style={{
                        borderBottom: '1px solid #f3f4f6',
                        background: i % 2 === 0 ? 'white' : '#fafaf9',
                      }}
                    >
                      <td style={{ padding: '8px 10px', color: '#78716c', fontSize: 12 }}>
                        {row.situation}
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        {row.ti !== '—' ? (
                          <button
                            aria-label={`Play audio for ${row.ti}`}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              fontFamily: "'Outfit',sans-serif",
                              fontWeight: 600,
                              color: '#0e7490',
                              fontSize: 13,
                              padding: 0,
                              textAlign: 'left',
                            }}
                            onClick={() => speak(row.ti)}
                          >
                            {row.ti} <span aria-hidden="true">🔊</span>
                          </button>
                        ) : (
                          <span style={{ color: '#cbd5e1' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <button
                          aria-label={`Play audio for ${row.vi}`}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontFamily: "'Outfit',sans-serif",
                            fontWeight: 700,
                            color: '#7c3aed',
                            fontSize: 13,
                            padding: 0,
                            textAlign: 'left',
                          }}
                          onClick={() => speak(row.vi)}
                        >
                          {row.vi} <span aria-hidden="true">🔊</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'verbs' && (
        <div>
          <div
            style={{
              marginBottom: 12,
              padding: '10px 14px',
              background: 'rgba(124,58,237,.06)',
              borderRadius: 10,
              fontSize: 12,
              color: '#4c1d95',
              lineHeight: 1.6,
            }}
          >
            Vi uses the same conjugation as the 2nd person plural (oni/vi). It always takes a
            capital V in writing.
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  {['', 'biti', 'imati', 'ići', 'moći', 'htjeti', 'govoriti'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '8px',
                        textAlign: 'left',
                        fontWeight: 700,
                        color: '#44403c',
                        fontSize: 11,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FORMAL_REGISTER.verbForms.map(function (row: any, i: number) {
                  return (
                    <tr
                      key={i}
                      style={{
                        borderBottom: '1px solid #f3f4f6',
                        background: i % 2 === 0 ? 'white' : '#f8f4ff',
                      }}
                    >
                      <td
                        style={{
                          padding: '10px 8px',
                          fontWeight: 800,
                          color: i === 0 ? '#0e7490' : '#7c3aed',
                          fontSize: 14,
                        }}
                      >
                        {row.pronoun}
                      </td>
                      {[row.biti, row.imati, row.ići, row.moći, row.htjeti, row.govoriti].map(
                        function (v, vi) {
                          return (
                            <td key={vi} style={{ padding: '10px 8px', fontWeight: 600 }}>
                              <button
                                aria-label={`Play audio for ${v}`}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontFamily: "'Outfit',sans-serif",
                                  fontSize: 13,
                                }}
                                onClick={() => speak(v)}
                              >
                                {v} <span aria-hidden="true">🔊</span>
                              </button>
                            </td>
                          );
                        },
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'email' && (
        <div>
          <div
            style={{
              marginBottom: 12,
              padding: '10px 14px',
              background: 'rgba(14,116,144,.07)',
              borderRadius: 10,
              fontSize: 12,
              color: '#0e7490',
              lineHeight: 1.6,
            }}
          >
            Croatian formal emails use Vi throughout. Starting with just "Zdravo" to an official is
            considered unprofessional.
          </div>
          {FORMAL_REGISTER.emailPhrases.map(function (p: any, i: number) {
            return (
              <button
                key={i}
                className="c"
                style={{
                  marginBottom: 10,
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
                onClick={() => speak(p.hr)}
              >
                <div style={{ fontSize: 11, color: '#78716c', marginBottom: 3 }}>{p.label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0369a1' }}>
                  {p.hr} <span aria-hidden="true">🔊</span>
                </div>
                <div style={{ fontSize: 13, color: '#16a34a', marginTop: 2 }}>{p.en}</div>
              </button>
            );
          })}
        </div>
      )}

      {tab === 'quiz' && <QuizBlock questions={FORMAL_REGISTER.quiz} award={award} />}
    </div>
  );
}

// ── IMPERSONAL CONSTRUCTIONS ──────────────────────────────────────────────────
export function ImpersonalScreen({
  goBack,
  award,
}: {
  goBack: () => void;
  award?: (pts: number, celebrate?: boolean, activityType?: string) => void;
}) {
  const { grammar, loading, error } = useGrammar();
  const [tab, setTab] = useState('constructions');
  const tabs = [
    { k: 'constructions', l: 'Constructions' },
    { k: 'signs', l: 'Signs' },
    { k: 'quiz', l: 'Quiz' },
  ];

  if (error) return <ErrorState message="Couldn't load grammar - please retry." />;
  if (loading || !grammar) return <LoadingState />;
  const IMPERSONAL = grammar.IMPERSONAL as unknown as ImpersonalShape;

  return (
    <div className="scr-wrap">
      {H('🔁 ' + IMPERSONAL.title, IMPERSONAL.intro, goBack)}

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {tabs.map((t) => (
          <button
            key={t.k}
            className={'b ' + (tab === t.k ? 'bp' : 'bg')}
            style={{ fontSize: 13 }}
            onClick={() => setTab(t.k)}
          >
            {t.l}
          </button>
        ))}
      </div>

      {tab === 'constructions' && (
        <div>
          {IMPERSONAL.constructions.map(function (c: any, i: number) {
            return (
              <div
                key={i}
                style={{
                  marginBottom: 12,
                  background: 'white',
                  borderRadius: 14,
                  border: '1px solid rgba(0,0,0,.07)',
                  overflow: 'hidden',
                  boxShadow: '0 1px 3px rgba(0,0,0,.04)',
                }}
              >
                <button
                  aria-label={`Play audio for ${c.hr}`}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '12px 16px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: "'Outfit',sans-serif",
                  }}
                  onClick={() => speak(c.hr)}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                    }}
                  >
                    <span style={{ fontSize: 17, fontWeight: 800, color: '#0e7490' }}>
                      {c.hr} <span aria-hidden="true">🔊</span>
                    </span>
                    <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 600 }}>{c.en}</span>
                  </div>
                </button>
                <div
                  style={{ padding: '0 16px 12px', borderTop: '1px solid #f3f4f6', paddingTop: 8 }}
                >
                  <div style={{ fontSize: 12, color: '#78716c', lineHeight: 1.5, marginBottom: 6 }}>
                    {c.note}
                  </div>
                  <button
                    aria-label={`Play audio for ${c.example}`}
                    style={{
                      background: 'rgba(14,116,144,.07)',
                      border: 'none',
                      borderRadius: 8,
                      padding: '6px 12px',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#0e7490',
                      cursor: 'pointer',
                      fontFamily: "'Outfit',sans-serif",
                    }}
                    onClick={() => speak(c.example)}
                  >
                    {c.example} <span aria-hidden="true">🔊</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'signs' && (
        <div>
          <div
            style={{
              marginBottom: 12,
              padding: '10px 14px',
              background: 'rgba(14,116,144,.07)',
              borderRadius: 10,
              fontSize: 12,
              color: '#0e7490',
              lineHeight: 1.6,
            }}
          >
            These signs appear on buildings, shops, and public spaces across Croatia. Recognising
            them instantly will save you a lot of confusion.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {IMPERSONAL.signs.map(function (s: any, i: number) {
              return (
                <button
                  key={i}
                  style={{
                    padding: '14px 12px',
                    borderRadius: 14,
                    border: '2px solid #e2e8f0',
                    background: 'white',
                    cursor: 'pointer',
                    textAlign: 'center',
                    fontFamily: "'Outfit',sans-serif",
                    boxShadow: '0 1px 3px rgba(0,0,0,.05)',
                  }}
                  onClick={() => speak(s.sign)}
                >
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: '#0e7490',
                      letterSpacing: '.03em',
                    }}
                  >
                    {s.sign}
                  </div>
                  <div style={{ fontSize: 12, color: '#78716c', marginTop: 4 }}>{s.en}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'quiz' && <QuizBlock questions={IMPERSONAL.quiz} award={award} />}
    </div>
  );
}

// ── TECHNOLOGY VOCABULARY ─────────────────────────────────────────────────────
export function TechVocScreen({
  goBack,
  award,
}: {
  goBack: () => void;
  award?: (pts: number, celebrate?: boolean, activityType?: string) => void;
}) {
  const { content, loading, error } = useContent();
  const [catIdx, setCatIdx] = useState(0);
  const [tab, setTab] = useState('vocab');
  if (error)
    return (
      <div className="scr-wrap">
        {H('💻 Tech Vocabulary', "Couldn't load — please retry.", goBack)}
      </div>
    );
  if (loading || !content)
    return <div className="scr-wrap">{H('💻 Tech Vocabulary', 'Loading…', goBack)}</div>;
  const TECH_VOC = content.TECH_VOC as {
    title: string;
    intro: string;
    categories: any[];
    phrases: any[];
    quiz: any[];
  };
  const cat = TECH_VOC.categories[catIdx]!;

  return (
    <div className="scr-wrap">
      {H('💻 ' + TECH_VOC.title, TECH_VOC.intro, goBack)}

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        <button
          className={'b ' + (tab === 'vocab' ? 'bp' : 'bg')}
          style={{ fontSize: 13 }}
          onClick={() => setTab('vocab')}
        >
          Vocabulary
        </button>
        <button
          className={'b ' + (tab === 'phrases' ? 'bp' : 'bg')}
          style={{ fontSize: 13 }}
          onClick={() => setTab('phrases')}
        >
          Phrases
        </button>
        <button
          className={'b ' + (tab === 'quiz' ? 'bp' : 'bg')}
          style={{ fontSize: 13 }}
          onClick={() => setTab('quiz')}
        >
          Quiz
        </button>
      </div>

      {tab === 'vocab' && (
        <div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
            {TECH_VOC.categories.map(function (c: any, i: number) {
              return (
                <button
                  key={i}
                  className={'b ' + (catIdx === i ? 'bp' : 'bg')}
                  style={{ fontSize: 12 }}
                  onClick={() => setCatIdx(i)}
                >
                  {c.icon} {c.name.split(' —')[0]}
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0e7490', marginBottom: 10 }}>
            {cat.icon} {cat.name}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {(cat.words as any[]).map(function (w: any, i: number) {
              return (
                <button
                  key={i}
                  aria-label={`Play audio for ${w.hr}`}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    background: 'white',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: "'Outfit',sans-serif",
                    boxShadow: '0 1px 2px rgba(0,0,0,.04)',
                  }}
                  onClick={() => speak(w.hr)}
                >
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0369a1' }}>
                    {w.hr} <span aria-hidden="true">🔊</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#78716c', marginTop: 2 }}>{w.en}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'phrases' && (
        <div>
          {TECH_VOC.phrases.map(function (p: any, i: number) {
            return (
              <button
                key={i}
                className="c"
                style={{
                  marginBottom: 10,
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
                onClick={() => speak(p.hr)}
              >
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0369a1' }}>
                  {p.hr} <span aria-hidden="true">🔊</span>
                </div>
                <div style={{ fontSize: 13, color: '#78716c', marginTop: 3 }}>{p.en}</div>
              </button>
            );
          })}
        </div>
      )}

      {tab === 'quiz' && <QuizBlock questions={TECH_VOC.quiz} award={award} />}
    </div>
  );
}

// ── BUREAUCRATIC / ADMINISTRATIVE ─────────────────────────────────────────────
export function BureaucraticScreen({
  goBack,
  award,
}: {
  goBack: () => void;
  award?: (pts: number, celebrate?: boolean, activityType?: string) => void;
}) {
  const { content, loading, error } = useContent();
  const [catIdx, setCatIdx] = useState(0);
  const [tab, setTab] = useState('vocab');
  if (error)
    return (
      <div className="scr-wrap">
        {H('🏛️ Bureaucratic', "Couldn't load — please retry.", goBack)}
      </div>
    );
  if (loading || !content)
    return <div className="scr-wrap">{H('🏛️ Bureaucratic', 'Loading…', goBack)}</div>;
  const BUREAUCRATIC = content.BUREAUCRATIC as {
    title: string;
    intro: string;
    categories: any[];
    phrases: any[];
    quiz: any[];
  };
  const cat = BUREAUCRATIC.categories[catIdx]!;

  return (
    <div className="scr-wrap">
      {H('🏛️ ' + BUREAUCRATIC.title, BUREAUCRATIC.intro, goBack)}

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        <button
          className={'b ' + (tab === 'vocab' ? 'bp' : 'bg')}
          style={{ fontSize: 13 }}
          onClick={() => setTab('vocab')}
        >
          Vocabulary
        </button>
        <button
          className={'b ' + (tab === 'phrases' ? 'bp' : 'bg')}
          style={{ fontSize: 13 }}
          onClick={() => setTab('phrases')}
        >
          Key Phrases
        </button>
        <button
          className={'b ' + (tab === 'quiz' ? 'bp' : 'bg')}
          style={{ fontSize: 13 }}
          onClick={() => setTab('quiz')}
        >
          Quiz
        </button>
      </div>

      {tab === 'vocab' && (
        <div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
            {BUREAUCRATIC.categories.map(function (c: any, i: number) {
              return (
                <button
                  key={i}
                  className={'b ' + (catIdx === i ? 'bp' : 'bg')}
                  style={{ fontSize: 12 }}
                  onClick={() => setCatIdx(i)}
                >
                  {c.icon} {c.name.split(' —')[0]}
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0e7490', marginBottom: 10 }}>
            {cat.icon} {cat.name}
          </div>
          {cat.words.map(function (w: any, i: number) {
            return (
              <button
                key={i}
                aria-label={`Play audio for ${w.hr}`}
                className="c"
                style={{
                  marginBottom: 8,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  width: '100%',
                }}
                onClick={() => speak(w.hr)}
              >
                <span style={{ fontSize: 14, fontWeight: 700, color: '#0369a1' }}>
                  {w.hr} <span aria-hidden="true">🔊</span>
                </span>
                <span style={{ fontSize: 13, color: '#78716c' }}>{w.en}</span>
              </button>
            );
          })}
        </div>
      )}

      {tab === 'phrases' && (
        <div>
          <div
            style={{
              marginBottom: 12,
              padding: '10px 14px',
              background: 'rgba(14,116,144,.07)',
              borderRadius: 10,
              fontSize: 12,
              color: '#0e7490',
              lineHeight: 1.6,
            }}
          >
            💡 Tip: Use Vi (formal address) in all government offices, healthcare facilities, and
            with landlords.
          </div>
          {BUREAUCRATIC.phrases.map(function (p: any, i: number) {
            return (
              <button
                key={i}
                className="c"
                style={{
                  marginBottom: 10,
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
                onClick={() => speak(p.hr)}
              >
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0369a1' }}>
                  {p.hr} <span aria-hidden="true">🔊</span>
                </div>
                <div style={{ fontSize: 13, color: '#78716c', marginTop: 3 }}>{p.en}</div>
              </button>
            );
          })}
        </div>
      )}

      {tab === 'quiz' && <QuizBlock questions={BUREAUCRATIC.quiz} award={award} />}
    </div>
  );
}
