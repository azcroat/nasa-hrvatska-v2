import React, { useState, useRef } from 'react';
import { H, Bar } from '../../data';
import { completeExercise } from '../../hooks/useExerciseCompletion';
import { useStats } from '../../context/StatsContext';
import { rnd } from '../../lib/random.js';

function shLocal(a: any[]) {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

// B2 — conditional mood: kondicional I (bih/bi/bismo/biste + radni pridjev),
// kondicional II (bio bih + radni pridjev = would have), and irrealis 'da'/'kad'
// conditional sentences. Aux clitics: 1sg bih, 2sg bi, 3sg bi, 1pl bismo,
// 2pl biste, 3pl bi.
const DATA = [
  {
    q: 'Da imam vremena, ___ ti pomogao. (I would help)',
    opts: ['bih', 'bi', 'bismo', 'biste'],
    answer: 'bih',
    en: 'If I had time, I would help you.',
    tip: 'Kondicional I, 1sg aux: bih + radni pridjev (pomogao).',
  },
  {
    q: 'Mi ___ došli da nije kiše. (we would come)',
    opts: ['bismo', 'bi', 'bih', 'biste'],
    answer: 'bismo',
    en: "We would come if it weren't raining.",
    tip: '1pl conditional aux = bismo.',
  },
  {
    q: '___ došao da si me pozvao. (I would have come)',
    opts: ['Bio bih', 'Bih bio', 'Budem', 'Bih'],
    answer: 'Bio bih',
    en: 'I would have come if you had invited me.',
    tip: 'Kondicional II (past): bio + bih + radni pridjev → "Bio bih došao".',
  },
  {
    q: 'Kad ___ bogat, putovao bih svijetom. (if I were)',
    opts: ['bih bio', 'bih', 'da sam', 'budem'],
    answer: 'bih bio',
    en: 'If I were rich, I would travel the world.',
    tip: 'Unreal present in a kad-clause: "Kad bih bio bogat" (aux + bio).',
  },
  {
    q: 'Oni ___ kupili kuću da imaju novca. (they would buy)',
    opts: ['bi', 'bih', 'bismo', 'biste'],
    answer: 'bi',
    en: 'They would buy a house if they had money.',
    tip: '3pl conditional aux = bi.',
  },
  {
    q: 'Volio ___ otići u Hrvatsku. (I would like)',
    opts: ['bih', 'bi', 'bismo', 'sam'],
    answer: 'bih',
    en: 'I would like to go to Croatia.',
    tip: '"Volio bih" = I would like (1sg). "sam" is past tense, not conditional.',
  },
  {
    q: 'Što ___ ti učinio na mom mjestu? (would you do)',
    opts: ['bi', 'bih', 'biste', 'bismo'],
    answer: 'bi',
    en: 'What would you do in my place?',
    tip: '2sg conditional aux = bi.',
  },
  {
    q: 'Da ste rezervirali, ___ dobili stol. (you would have gotten)',
    opts: ['biste', 'bi', 'bih', 'bismo'],
    answer: 'biste',
    en: 'If you had booked, you would have gotten a table.',
    tip: '2pl/formal conditional aux = biste.',
  },
  {
    q: 'Pomogao ___ ti, ali nemam vremena. (I would help)',
    opts: ['bih', 'bi', 'sam', 'ću'],
    answer: 'bih',
    en: 'I would help you, but I have no time.',
    tip: 'Clitic "bih" sits in second position: "Pomogao bih ti".',
  },
  {
    q: 'Da je učila, ___ položila ispit. (she would have passed)',
    opts: ['bila bi', 'bi bila', 'bila bih', 'bude'],
    answer: 'bila bi',
    en: 'If she had studied, she would have passed the exam.',
    tip: 'Kondicional II, fem 3sg: bila + bi + radni pridjev → "bila bi položila".',
  },
  {
    q: 'Kupili ___ auto da je jeftiniji. (we would buy)',
    opts: ['bismo', 'bi', 'biste', 'bih'],
    answer: 'bismo',
    en: 'We would buy the car if it were cheaper.',
    tip: '1pl conditional aux = bismo.',
  },
  {
    q: 'Da sam znao, ___ to učinio. (I would not have done)',
    opts: ['ne bih', 'ne bi', 'nisam', 'neću'],
    answer: 'ne bih',
    en: "Had I known, I wouldn't have done that.",
    tip: 'Negated conditional, 1sg: "ne bih" + radni pridjev (učinio).',
  },
];

interface Props {
  goBack: () => void;
  award?: (xp: number, celebrate?: boolean, activityType?: string) => void;
}

export default function ConditionalDrill({ goBack, award }: Props) {
  const { stats, setStats, writeDelta } = useStats();
  const finishFired = useRef(false);
  const [q] = useState(() =>
    shLocal(DATA).map((item) => ({ ...item, opts: shLocal([...item.opts]) })),
  );
  const total = q.length;
  const [idx, setIdx] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [passed, setPassed] = useState(false);

  const cur = q[idx]!;
  const answered = chosen !== null;

  function pick(opt: string) {
    if (answered) return;
    setChosen(opt);
    if (opt === cur.answer) setScore((s) => s + 1);
  }

  function next() {
    if (idx + 1 >= total) {
      if (!finishFired.current) {
        finishFired.current = true;
        const res = completeExercise({
          key: 'conditionaldrill',
          score,
          total,
          xp: score * 5,
          stats,
          setStats,
          writeDelta,
          award,
        });
        setPassed(res.passed);
      }
      setDone(true);
    } else {
      setIdx((i) => i + 1);
      setChosen(null);
    }
  }

  if (done) {
    return (
      <div className="scr-wrap">
        {H('🤔 Conditional', 'Kondicional I & II — "would" and "would have"', goBack)}
        <div className="c" style={{ marginTop: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>{passed ? '🎉' : '📚'}</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            {score} / {total}
          </div>
          <div style={{ fontSize: 15, color: '#64748b', marginBottom: 16 }}>
            {score === total
              ? 'Perfect! Conditional mastered! 🏆'
              : score >= total * 0.8
                ? 'Great work! 💪'
                : 'Keep practising — the conditional takes time!'}
          </div>
          {!passed && (
            <button
              className="b bp"
              data-testid="drill-retry"
              style={{ width: '100%', marginBottom: 10 }}
              onClick={() => {
                finishFired.current = false;
                setIdx(0);
                setChosen(null);
                setScore(0);
                setPassed(false);
                setDone(false);
              }}
            >
              🔁 Try again (need 75%)
            </button>
          )}
          <button className="b bp" style={{ width: '100%' }} onClick={goBack}>
            ← Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="scr-wrap">
      {H('🤔 Conditional', 'Kondicional I & II — "would" and "would have"', goBack)}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
        <span style={{ fontSize: 13, color: '#64748b', whiteSpace: 'nowrap' }}>
          {idx + 1} / {total}
        </span>
        <Bar v={idx + 1} mx={total} />
      </div>
      <div className="c" style={{ marginTop: 16 }}>
        <div
          style={{
            fontSize: 13,
            color: '#64748b',
            marginBottom: 6,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          Choose the correct conditional form
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#0e7490', lineHeight: 1.5 }}>
          {cur.q}
        </div>
        <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>{cur.en}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 16 }}>
          {cur.opts.map((opt: string) => {
            let bg = 'white';
            let bc = 'rgba(14,116,144,.12)';
            if (answered) {
              if (opt === cur.answer) {
                bg = '#dcfce7';
                bc = '#16a34a';
              } else if (opt === chosen) {
                bg = '#fee2e2';
                bc = '#dc2626';
              }
            }
            return (
              <button
                key={opt}
                className="ob"
                style={{ background: bg, borderColor: bc, fontSize: 13 }}
                onClick={() => pick(opt)}
              >
                {opt}
              </button>
            );
          })}
        </div>
        {answered && (
          <div
            style={{
              marginTop: 14,
              padding: '10px 14px',
              background: '#f0f9ff',
              borderRadius: 10,
              border: '1px solid #bae6fd',
              fontSize: 14,
              color: '#0369a1',
            }}
          >
            <strong>{chosen === cur.answer ? '✅ Correct!' : '❌ Incorrect.'}</strong> {cur.tip}
          </div>
        )}
        {answered && (
          <button className="b bp" style={{ width: '100%', marginTop: 16 }} onClick={next}>
            {idx + 1 >= total ? 'See results' : 'Next →'}
          </button>
        )}
      </div>
    </div>
  );
}
