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

// C1 — register: recognising the standard/formal equivalent of a colloquial or
// slang word. Controlling register is a C1 competence.
const DATA = [
  {
    q: "Standard equivalent of slang 'skužiti':",
    opts: ['shvatiti', 'čuti', 'gledati', 'pisati'],
    answer: 'shvatiti',
    en: 'to understand',
    tip: "'skužiti'/'kužiti' (colloq.) → 'shvatiti' (standard).",
  },
  {
    q: "Standard equivalent of slang 'lova':",
    opts: ['novac', 'hrana', 'kuća', 'posao'],
    answer: 'novac',
    en: 'money',
    tip: "'lova' (slang) → 'novac' (standard).",
  },
  {
    q: "Standard equivalent of slang 'frend':",
    opts: ['prijatelj', 'susjed', 'rođak', 'kolega'],
    answer: 'prijatelj',
    en: 'friend',
    tip: "'frend' (anglicism/slang) → 'prijatelj' (standard).",
  },
  {
    q: "Standard equivalent of dialectal 'kaj':",
    opts: ['što', 'tko', 'kako', 'gdje'],
    answer: 'što',
    en: 'what',
    tip: "'kaj' (kajkavian) → 'što' (standard).",
  },
  {
    q: "Standard equivalent of slang 'murja':",
    opts: ['policija', 'vojska', 'bolnica', 'škola'],
    answer: 'policija',
    en: 'police',
    tip: "'murja' (slang) → 'policija' (standard).",
  },
  {
    q: "Standard equivalent of colloquial 'faks':",
    opts: ['fakultet', 'razred', 'ured', 'tečaj'],
    answer: 'fakultet',
    en: 'university (faculty)',
    tip: "'faks' (colloq.) → 'fakultet' (standard).",
  },
  {
    q: "Standard equivalent of slang 'šljaka':",
    opts: ['posao', 'odmor', 'igra', 'put'],
    answer: 'posao',
    en: 'work / job',
    tip: "'šljaka' (slang) → 'posao' (standard).",
  },
  {
    q: "More formal equivalent of 'super':",
    opts: ['izvrsno', 'dobro', 'onako', 'možda'],
    answer: 'izvrsno',
    en: 'excellent',
    tip: "'super' (colloq.) → 'izvrsno' / 'odlično' (formal).",
  },
  {
    q: "Standard equivalent of slang 'cuga':",
    opts: ['piće', 'jelo', 'pjesma', 'šala'],
    answer: 'piće',
    en: 'drink',
    tip: "'cuga' (slang) → 'piće' (standard).",
  },
  {
    q: "Formal request form of 'Daj mi to.':",
    opts: ['Možete li mi to dati?', 'Daj to amo.', 'Daj mi to brzo.', 'Hajde, daj.'],
    answer: 'Možete li mi to dati?',
    en: 'Could you give me that? (formal/polite)',
    tip: 'Formal register uses the polite Vi-form and a question, not a bare imperative.',
  },
];

interface Props {
  goBack: () => void;
  award?: (xp: number, celebrate?: boolean, activityType?: string) => void;
}

export default function RegisterDrill({ goBack, award }: Props) {
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
          key: 'register',
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
        {H('🎩 Register', 'Standard/formal vs colloquial', goBack)}
        <div className="c" style={{ marginTop: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>{passed ? '🎉' : '📚'}</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            {score} / {total}
          </div>
          <div style={{ fontSize: 15, color: '#64748b', marginBottom: 16 }}>
            {score === total
              ? 'Perfect! Register mastered! 🏆'
              : score >= total * 0.8
                ? 'Great work! 💪'
                : 'Keep practising — register takes time!'}
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
      {H('🎩 Register', 'Standard/formal vs colloquial', goBack)}
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
          Choose the standard / formal form
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#0e7490', lineHeight: 1.5 }}>
          {cur.q}
        </div>
        <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>{cur.en}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, marginTop: 16 }}>
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
                style={{ background: bg, borderColor: bc, fontSize: 13, textAlign: 'left' }}
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
