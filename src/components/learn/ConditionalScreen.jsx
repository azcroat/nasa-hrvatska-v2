import React, { useState } from 'react';
import { H, speak } from '../../data.jsx';
import { CONDITIONAL } from '../../data.jsx';

function QuizBlock({ questions, award }) {
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);

  function handleAnswer(qi, opt, correct) {
    if (answers[qi] !== undefined) return;
    const updated = { ...answers, [qi]: opt };
    setAnswers(updated);
    if (Object.keys(updated).length === questions.length) {
      const pts = Object.entries(updated).filter(([i, v]) => v === questions[i].a).length;
      setScore(pts);
      if (award) award(pts * 5);
    }
  }

  return (
    <div>
      <h3 className="sh" style={{ marginTop: 4 }}>🎯 Quick Quiz</h3>
      {questions.map(function (q, qi) {
        const ans = answers[qi];
        return (
          <div key={qi} className="c" style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: 'var(--heading)' }}>{qi + 1}. {q.q}</div>
            {q.opts.map(function (opt, oi) {
              let bg = 'white', bc = '#e7e5e4', col = '#1c1917';
              if (ans) {
                if (opt === q.a) { bg = '#dcfce7'; bc = '#16a34a'; col = '#14532d'; }
                else if (opt === ans) { bg = '#fee2e2'; bc = '#dc2626'; col = '#7f1d1d'; }
              }
              return (
                <button key={oi} onClick={function () { handleAnswer(qi, opt, q.a); }}
                  style={{ display: 'block', width: '100%', marginBottom: 6, textAlign: 'left', padding: '10px 14px', borderRadius: 10, border: '2px solid ' + bc, background: bg, color: col, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .2s', fontFamily: "'Outfit',sans-serif" }}>
                  {opt}
                </button>
              );
            })}
            {ans && (
              <div style={{ fontSize: 11, lineHeight: 1.5, marginTop: 4, padding: '6px 10px', background: 'rgba(14,116,144,.07)', borderRadius: 8, color: '#0e7490' }}>
                {ans === q.a ? '✓ Correct!' : '✗ Correct answer: ' + q.a}
              </div>
            )}
          </div>
        );
      })}
      {score !== null && (
        <div style={{ margin: '16px 0', padding: '14px 18px', background: score >= questions.length * 0.8 ? '#dcfce7' : '#fef3c7', borderRadius: 14, textAlign: 'center', fontWeight: 700, fontSize: 16, color: score >= questions.length * 0.8 ? '#14532d' : '#92400e' }}>
          {score >= questions.length * 0.8 ? '🌟 ' : '💪 '}{score}/{questions.length} — {score >= questions.length * 0.8 ? 'Excellent!' : 'Keep practising!'}
        </div>
      )}
    </div>
  );
}

function ConditionalScreen({ goBack, award }) {
  const [tab, setTab] = useState('forms');
  const tabs = [{ k: 'forms', l: 'Forms' }, { k: 'examples', l: 'Examples' }, { k: 'ifthen', l: 'If/Then' }, { k: 'polite', l: 'Polite Use' }, { k: 'quiz', l: 'Quiz' }];

  return (
    <div className="scr-wrap">
      {H('🔀 ' + CONDITIONAL.title, CONDITIONAL.intro)}

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {tabs.map(t => (
          <button key={t.k} className={'b ' + (tab === t.k ? 'bp' : 'bg')} style={{ fontSize: 13 }} onClick={() => setTab(t.k)}>{t.l}</button>
        ))}
      </div>

      {tab === 'forms' && (
        <div>
          <div style={{ marginBottom: 14, padding: '12px 16px', background: 'linear-gradient(135deg,#0e7490,#0369a1)', borderRadius: 14, color: 'white' }}>
            <div style={{ fontSize: 11, fontWeight: 800, opacity: .8, marginBottom: 6, letterSpacing: '0.08em' }}>THE PATTERN</div>
            <div style={{ fontSize: 14, lineHeight: 1.7 }}>bih / bi / bi / bismo / biste / bi + <strong>infinitive</strong></div>
            <div style={{ fontSize: 12, opacity: .85, marginTop: 4 }}>The conditional clitic always comes <em>after the first stressed word/phrase</em> — never at the start of a sentence.</div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                {['Pronoun', 'Conditional', 'English'].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#44403c' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CONDITIONAL.forms.map(function (f, i) {
                return (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? 'white' : '#fafaf9' }}>
                    <td style={{ padding: '10px', fontWeight: 700, color: '#0e7490' }}>{f.pro}</td>
                    <td style={{ padding: '10px', fontWeight: 800, fontSize: 16, color: '#0369a1' }}>{f.form}</td>
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
          {CONDITIONAL.examples.map(function (ex, i) {
            return (
              <div key={i} style={{ marginBottom: 12, background: 'white', borderRadius: 14, border: '1px solid rgba(0,0,0,.07)', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
                <button style={{ width: '100%', textAlign: 'left', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }} onClick={() => speak(ex.hr)}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#0369a1' }}>{ex.hr} 🔊</div>
                  <div style={{ fontSize: 14, color: '#16a34a', fontWeight: 600, marginTop: 3 }}>{ex.en}</div>
                </button>
                <div style={{ padding: '0 16px 12px', fontSize: 12, color: '#78716c', lineHeight: 1.5, borderTop: '1px solid #f3f4f6', paddingTop: 8 }}>💡 {ex.note}</div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'ifthen' && (
        <div>
          <div style={{ marginBottom: 14, padding: '12px 16px', background: 'rgba(14,116,144,.07)', borderRadius: 12, fontSize: 13, color: '#0e7490', lineHeight: 1.6 }}>
            <strong>Pattern:</strong> Da + present tense → conditional result. "Da imam..." = "If I had..."
          </div>
          {CONDITIONAL.ifThen.map(function (ex, i) {
            return (
              <button key={i} className="c" style={{ marginBottom: 10, display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer' }} onClick={() => speak(ex.hr)}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0369a1' }}>{ex.hr} 🔊</div>
                <div style={{ fontSize: 13, color: '#78716c', marginTop: 3 }}>{ex.en}</div>
              </button>
            );
          })}
        </div>
      )}

      {tab === 'polite' && (
        <div>
          <div style={{ marginBottom: 14, padding: '12px 16px', background: 'rgba(14,116,144,.07)', borderRadius: 12, fontSize: 13, color: '#0e7490', lineHeight: 1.6 }}>
            The conditional is the <strong>standard polite register</strong> in Croatia. Using the present tense to ask for things (e.g. "Hoću kavu") sounds blunt.
          </div>
          {CONDITIONAL.polite.map(function (p, i) {
            return (
              <button key={i} className="c" style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, textAlign: 'left', cursor: 'pointer', width: '100%' }} onClick={() => speak(p.hr)}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: '#78716c', marginBottom: 3 }}>{p.situation}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#0369a1' }}>{p.hr} 🔊</div>
                </div>
                <div style={{ fontSize: 13, color: '#16a34a', fontWeight: 600, minWidth: 100, textAlign: 'right' }}>{p.en}</div>
              </button>
            );
          })}
        </div>
      )}

      {tab === 'quiz' && <QuizBlock questions={CONDITIONAL.quiz} award={award} />}
    </div>
  );
}

export default ConditionalScreen;
