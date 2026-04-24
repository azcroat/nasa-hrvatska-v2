import React, { useState, useRef, useMemo } from 'react';
import { H, speak, sh, shMemo } from '../../../data';
import { NEGATION } from '../../../data';
import { markQuest } from '../../../lib/quests.js';
import { recordTopicResult } from '../../../lib/adaptive.js';

const NEGATION_QUIZ = [
  { q: 'Ne ___ ručak. (kuhati — ja)', a: 'kuham', opts: ['kuham', 'kuhaš', 'kuha', 'kuhamo'] },
  { q: 'Ne ___ u park. (ići — ja)', a: 'idem', opts: ['idem', 'ideš', 'ide', 'idemo'] },
  { q: 'Ne ___ čaj. (piti — ja)', a: 'pijem', opts: ['pijem', 'piješ', 'pije', 'pijemo'] },
  { q: 'Tata ne ___. (voziti — on)', a: 'vozi', opts: ['vozi', 'vozim', 'voze', 'vozite'] },
  {
    q: 'Mama ne ___ stan. (pospremati — ona)',
    a: 'posprema',
    opts: ['posprema', 'pospremam', 'pospremaš', 'pospremu'],
  },
  { q: 'Ne ___ zadaću. (pisati — ja)', a: 'pišem', opts: ['pišem', 'pišeš', 'piše', 'pišemo'] },
  {
    q: "'I don't have a dog' (nemati) =",
    a: 'Nemam psa.',
    opts: ['Nemam psa.', 'Ne imam psa.', 'Ne imam pas.', 'Nema psa.'],
  },
  {
    q: "'There is no coffee' =",
    a: 'Nema kave.',
    opts: ['Nema kave.', 'Ne kava.', 'Nije kava.', 'Nemam kave.'],
  },
  {
    q: "'She is not here' — 'biti' negative (ona) =",
    a: 'Nije ovdje.',
    opts: ['Nije ovdje.', 'Ne je ovdje.', 'Nisam ovdje.', 'Ne ona ovdje.'],
  },
  {
    q: "'We are not tired' — 'biti' negative (mi) =",
    a: 'Nismo umorni.',
    opts: ['Nismo umorni.', 'Ne smo umorni.', 'Ne biti umorni.', 'Nema umorni.'],
  },
  {
    q: 'After NEMA and NEMAM, nouns take which case?',
    a: 'Genitive',
    opts: ['Genitive', 'Accusative', 'Nominative', 'Dative'],
  },
  {
    q: "'I will not go' (contraction) =",
    a: 'Neću ići.',
    opts: ['Neću ići.', 'Ne ću ići.', 'Nisam ići.', 'Ne idem.'],
  },
  { q: "'Nobody knows' = Nitko ___ zna.", a: 'ne', opts: ['ne', 'ni', 'nije', 'nema'] },
  { q: "'Nothing is ready' = Ništa ___ gotovo.", a: 'nije', opts: ['nije', 'ne', 'nema', 'nisam'] },
];

interface Props {
  goBack: () => void;
  award: (n: number, celebrate?: boolean) => void;
}

function NegationScreen({ goBack, award }: Props) {
  const [tab, setTab] = useState('learn');
  // answers[qi] = the option the user selected (string), or undefined
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const questFiredRef = useRef(false);
  // Stable shuffled quiz + options — computed once per mount
  const shuffledQuiz = useMemo(() => sh([...NEGATION_QUIZ]), []);
  const shuffledOpts = useMemo(() => shuffledQuiz.map((q) => sh([...q.opts])), [shuffledQuiz]);

  const answeredCount = Object.keys(answers).length;
  const correctCount = Object.entries(answers).filter(
    ([qi, sel]) => sel === (shuffledQuiz[Number(qi)] ?? { a: '' }).a,
  ).length;
  const allDone = answeredCount === shuffledQuiz.length;

  function handleAnswer(qi: number, opt: string) {
    if (answers[qi] !== undefined) return;
    setAnswers((prev) => ({ ...prev, [qi]: opt }));
    const isCorrect = opt === (shuffledQuiz[qi] ?? { a: '' }).a;
    recordTopicResult('grammar', isCorrect);
    if (isCorrect) {
      if (typeof award === 'function') award(3);
      speak(opt);
    }
    if (answeredCount + 1 >= shuffledQuiz.length && !questFiredRef.current) {
      questFiredRef.current = true;
      markQuest('grammar');
    }
  }

  return (
    <div className="scr-wrap">
      {H('❌ Basic Negation', 'Ne, nije, nisam — how to say no in Croatian', goBack)}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {[
          { id: 'learn', label: '📖 Learn' },
          { id: 'quiz', label: '🎯 Quiz' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1,
              padding: '9px 0',
              borderRadius: 20,
              border: 'none',
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
              background: tab === t.id ? '#0e7490' : 'var(--bar-bg)',
              color: tab === t.id ? 'white' : 'var(--subtext)',
              transition: 'all .2s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'learn' && (
        <>
          <div
            className="c"
            style={{
              marginBottom: 12,
              padding: '10px',
              background: 'rgba(14,116,144,.06)',
              fontSize: 12,
            }}
          >
            💡 Most verbs: add <strong>NE</strong> before the verb. Exception: imam →{' '}
            <strong>nemam</strong>, hoću → <strong>neću</strong>. After <strong>nema/nemam</strong>,
            nouns take the <strong>Genitive</strong> case.
          </div>
          <div
            style={{
              marginBottom: 12,
              padding: '10px 14px',
              background: '#fef3c7',
              borderRadius: 12,
              fontSize: 12,
              borderLeft: '3px solid #ca8a04',
            }}
          >
            <strong>biti (to be):</strong> nisam / nisi / nije / nismo / niste / nisu
            <br />
            <strong>htjeti (to want):</strong> neću / nećeš / neće / nećemo / nećete / neće
          </div>
          {shMemo('ng', NEGATION, undefined).map(function (
            n: { pos: string; neg: string; en: string },
            ni: number,
          ) {
            return (
              <div
                key={ni}
                className="c"
                style={{
                  marginBottom: 8,
                  padding: '10px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ flex: 1 }}>
                  <button
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      padding: 0,
                      fontFamily: "'Outfit',sans-serif",
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#16a34a',
                      marginBottom: 2,
                      display: 'block',
                    }}
                    onClick={() => speak(n.pos)}
                  >
                    {'✅ '}
                    {n.pos}
                  </button>
                  <button
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      padding: 0,
                      fontFamily: "'Outfit',sans-serif",
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#dc2626',
                      display: 'block',
                    }}
                    onClick={() => speak(n.neg)}
                  >
                    {'❌ '}
                    {n.neg}
                  </button>
                </div>
                <div style={{ fontSize: 11, color: '#78716c', maxWidth: 140, textAlign: 'right' }}>
                  {n.en}
                </div>
              </div>
            );
          })}
        </>
      )}

      {tab === 'quiz' && (
        <>
          <div
            style={{
              marginBottom: 12,
              padding: '10px 14px',
              background: 'rgba(14,116,144,.06)',
              borderRadius: 10,
              fontSize: 12,
              color: '#164e63',
            }}
          >
            Choose the correct negative form. {answeredCount}/{shuffledQuiz.length} answered.
          </div>
          {shuffledQuiz.map((q, qi) => {
            const selected = answers[qi];
            const answered = selected !== undefined;
            return (
              <div key={qi} className="c" style={{ marginBottom: 10, padding: '10px 14px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: '#1c1917' }}>
                  {q.q}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {(shuffledOpts[qi] ?? []).map((opt, oi) => {
                    let bg = 'white',
                      bc = '#e7e5e4',
                      col = '#1c1917';
                    if (answered) {
                      if (opt === q.a) {
                        bg = '#dcfce7';
                        bc = '#16a34a';
                        col = '#14532d';
                      } else if (opt === selected) {
                        bg = '#fee2e2';
                        bc = '#dc2626';
                        col = '#7f1d1d';
                      }
                    }
                    return (
                      <button
                        key={oi}
                        onClick={() => handleAnswer(qi, opt)}
                        style={{
                          padding: '7px 14px',
                          border: `2px solid ${bc}`,
                          borderRadius: 10,
                          background: bg,
                          color: col,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: answered ? 'default' : 'pointer',
                          transition: 'all .15s',
                        }}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {answered && selected !== q.a && (
                  <div style={{ fontSize: 11, marginTop: 5, fontWeight: 700, color: '#dc2626' }}>
                    ✗ Correct: <span style={{ color: '#16a34a' }}>{q.a}</span>
                  </div>
                )}
                {answered && selected === q.a && (
                  <div style={{ fontSize: 11, marginTop: 5, fontWeight: 700, color: '#16a34a' }}>
                    ✓ Correct!
                  </div>
                )}
              </div>
            );
          })}
          {allDone && (
            <div className="c" style={{ marginTop: 16, padding: '20px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>
                {correctCount / shuffledQuiz.length >= 0.8
                  ? '🏆'
                  : correctCount / shuffledQuiz.length >= 0.6
                    ? '⭐'
                    : '💪'}
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#164e63', marginBottom: 4 }}>
                {correctCount}/{shuffledQuiz.length} correct
              </div>
              <button className="b bp" style={{ marginTop: 12 }} onClick={goBack}>
                ✓ Done
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default NegationScreen;
