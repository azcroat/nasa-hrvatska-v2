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

// C1 — discourse connectors: linking ideas in formal/written register
// (consequence, concession, addition, contrast). Cohesion at text level is C1.
const DATA = [
  {
    q: 'Cijene rastu; ___, kupovna moć pada. (therefore)',
    opts: ['stoga', 'naime', 'unatoč tome', 'doduše'],
    answer: 'stoga',
    en: 'Prices are rising; therefore, purchasing power is falling.',
    tip: "'stoga' = therefore (consequence).",
  },
  {
    q: 'Projekt je uspješan; ___, dobio je nagradu. (moreover)',
    opts: ['štoviše', 'naime', 'unatoč tome', 'inače'],
    answer: 'štoviše',
    en: 'The project is successful; moreover, it won an award.',
    tip: "'štoviše' = moreover / what's more (addition, intensifying).",
  },
  {
    q: 'Bilo je hladno; ___ smo otišli na izlet. (despite that)',
    opts: ['unatoč tome', 'stoga', 'naime', 'dakle'],
    answer: 'unatoč tome',
    en: 'It was cold; despite that, we went on the trip.',
    tip: "'unatoč tome' = despite that (concession).",
  },
  {
    q: 'Plan je dobar; ___, ima rizika. (however)',
    opts: ['međutim', 'stoga', 'naime', 'dakle'],
    answer: 'međutim',
    en: 'The plan is good; however, there are risks.',
    tip: "'međutim' = however (contrast).",
  },
  {
    q: 'Volim grad; ___, ne bih ondje živio. (admittedly)',
    opts: ['doduše', 'štoviše', 'stoga', 'naime'],
    answer: 'doduše',
    en: "I love the city; admittedly, I wouldn't live there.",
    tip: "'doduše' = admittedly / though (qualifying concession).",
  },
  {
    q: 'On nije lijen; ___, vrlo je marljiv. (on the contrary)',
    opts: ['dapače', 'stoga', 'naime', 'ipak'],
    answer: 'dapače',
    en: "He isn't lazy; on the contrary, he's very diligent.",
    tip: "'dapače' = on the contrary / indeed (reinforcing reversal).",
  },
  {
    q: 'Treba učiti; ___ ćeš pasti ispit. (otherwise)',
    opts: ['inače', 'naime', 'štoviše', 'doduše'],
    answer: 'inače',
    en: "You need to study; otherwise you'll fail the exam.",
    tip: "'inače' = otherwise (alternative consequence).",
  },
  {
    q: 'Sve je spremno; ___ možemo početi. (accordingly)',
    opts: ['prema tome', 'unatoč tome', 'naime', 'doduše'],
    answer: 'prema tome',
    en: 'Everything is ready; accordingly, we can begin.',
    tip: "'prema tome' = accordingly / so (drawing a conclusion).",
  },
  {
    q: 'Zatvoreno je; ___, ne radi se nedjeljom. (namely)',
    opts: ['naime', 'štoviše', 'unatoč tome', 'međutim'],
    answer: 'naime',
    en: "It's closed; namely, they don't work on Sundays.",
    tip: "'naime' = namely / that is (explanatory).",
  },
  {
    q: 'Kasnio je; ___, propustio je sastanak. (consequently)',
    opts: ['posljedično', 'naime', 'doduše', 'štoviše'],
    answer: 'posljedično',
    en: 'He was late; consequently, he missed the meeting.',
    tip: "'posljedično' = consequently (formal consequence).",
  },
];

interface Props {
  goBack: () => void;
  award?: (xp: number, celebrate?: boolean, activityType?: string) => void;
}

export default function DiscourseDrill({ goBack, award }: Props) {
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
          key: 'discourse',
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
        {H('🪡 Discourse Connectors', 'Linking ideas in formal register', goBack)}
        <div className="c" style={{ marginTop: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>{passed ? '🎉' : '📚'}</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            {score} / {total}
          </div>
          <div style={{ fontSize: 15, color: '#64748b', marginBottom: 16 }}>
            {score === total
              ? 'Perfect! Cohesion mastered! 🏆'
              : score >= total * 0.8
                ? 'Great work! 💪'
                : 'Keep practising — connectors take time!'}
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
      {H('🪡 Discourse Connectors', 'Linking ideas in formal register', goBack)}
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
          Choose the correct connector
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
