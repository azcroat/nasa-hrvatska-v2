import React, { useState, useMemo } from 'react';
import { H, speak, sh } from '../../data.jsx';
import { TEXTING } from '../../data.jsx';
import { recordTopicResult } from '../../lib/adaptive.js';
import { markQuest } from '../../lib/quests.js';

function buildQuiz(items) {
  return sh([...items]).map((item, _, arr) => {
    const distractors = arr.filter(d => d.means !== item.means).map(d => d.means);
    const opts = sh([item.means, ...sh(distractors).slice(0, 3)]);
    return { q: `What does "${item.slang}" mean?`, o: opts, c: opts.indexOf(item.means) };
  });
}

function TextingScreen({ goBack, award }) {
  const [phase, setPhase] = useState('browse'); // browse | quiz
  const [qi, setQi] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState(-1);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const questions = useMemo(() => buildQuiz(TEXTING), []);

  function startQuiz() { setPhase('quiz'); setQi(0); setAnswered(false); setSelected(-1); setScore(0); setDone(false); }

  function pick(i) {
    if (answered) return;
    setSelected(i);
    setAnswered(true);
    const correct = i === questions[qi].c;
    if (correct) setScore(s => s + 1);
    recordTopicResult('vocabulary', correct);
  }

  function next() {
    if (qi < questions.length - 1) {
      setQi(q => q + 1); setAnswered(false); setSelected(-1);
    } else {
      const xp = Math.round((score / questions.length) * 20) + 5;
      if (award) award(xp);
      markQuest('culture');
      setDone(true);
    }
  }

  if (phase === 'quiz' && done) {
    return (
      <div className="scr-wrap" style={{ textAlign: 'center', paddingTop: 40 }}>
        <div style={{ fontSize: 64 }}>📱</div>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, color: '#164e63' }}>
          Score: {score}/{questions.length}
        </h2>
        <p style={{ color: 'var(--subtext)', fontSize: 14 }}>
          {score === questions.length ? 'Savršeno! You text like a local! 🇭🇷' : 'Keep practising — locals will think you\'re one of them soon!'}
        </p>
        <button className="b bp" style={{ marginTop: 24, marginRight: 12 }} onClick={startQuiz}>Try Again</button>
        <button className="b" style={{ marginTop: 24, background: 'var(--card)', color: 'var(--heading)', border: '1.5px solid var(--card-b)' }} onClick={goBack}>Done</button>
      </div>
    );
  }

  if (phase === 'quiz') {
    const q = questions[qi];
    return (
      <div className="scr-wrap">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--subtext)' }}>{qi + 1} / {questions.length}</span>
          <button onClick={goBack} style={{ background: 'none', border: 'none', fontSize: 13, color: 'var(--subtext)', cursor: 'pointer', fontFamily: "'Outfit',sans-serif", fontWeight: 700, padding: '4px 8px' }}>✕ Exit</button>
        </div>
        <div className="c" style={{ marginTop: 8 }}>
          <p style={{ fontSize: 22, fontWeight: 800, marginBottom: 20, color: '#7c3aed' }}>{q.q}</p>
          {q.o.map((o, i) => (
            <button key={i} className={'ob ' + (answered ? (i === q.c ? 'ok' : selected === i ? 'no' : '') : '')}
              onClick={() => pick(i)}>
              {o}
            </button>
          ))}
          {answered && (
            <button className="b bp" style={{ width: '100%', marginTop: 16 }} onClick={next}>
              {qi < questions.length - 1 ? 'Next →' : 'Results'}
            </button>
          )}
        </div>
      </div>
    );
  }

  // browse phase
  return (
    <div className="scr-wrap">
      {H("📱 Texting & Slang", "How Croatian kids actually text", goBack)}
      {TEXTING.map(function(t, i) { return (
        <button key={i} aria-label={`Play audio for ${t.slang}`} className="c" style={{ marginBottom: 8 }} onClick={function() { speak(t.slang); }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#7c3aed' }}>{t.slang}{' '}<span aria-hidden="true">🔊</span></div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0e7490' }}>{t.means}</div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--subtext)', marginTop: 2 }}>{t.ctx}</div>
        </button>
      ); })}
      <button className="b bp" style={{ width: '100%', marginTop: 16 }} onClick={startQuiz}>
        Test Yourself →
      </button>
    </div>
  );
}

export default TextingScreen;
