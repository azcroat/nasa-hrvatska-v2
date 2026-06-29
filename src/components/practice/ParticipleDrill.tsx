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

// B2 — Croatian participles: glagolski prilog sadašnji (present adverbial, -ći),
// glagolski prilog prošli (past adverbial, -vši) and the passive/past participle
// (trpni / radni pridjev) in attributive and adverbial use.
const DATA = [
  {
    q: '___ knjigu, zaspao je. (čitati — while reading)',
    opts: ['Čitajući', 'Čitati', 'Čitao', 'Pročitavši'],
    answer: 'Čitajući',
    en: 'While reading a book, he fell asleep.',
    tip: 'Present adverbial participle (simultaneous action): 3rd pl present čita-ju → čita-jući.',
  },
  {
    q: '___ posao, otišao je kući. (završiti — having finished)',
    opts: ['Završivši', 'Završavajući', 'Završiti', 'Završen'],
    answer: 'Završivši',
    en: 'Having finished the work, he went home.',
    tip: 'Past adverbial participle (prior action): perfective infinitive stem + -vši: završi-vši.',
  },
  {
    q: '___ na posao, sreo je prijatelja. (ići — while going)',
    opts: ['Idući', 'Išavši', 'Ići', 'Išao'],
    answer: 'Idući',
    en: 'While going to work, he met a friend.',
    tip: 'Present adverbial participle from ići: id-u → id-ući → idući.',
  },
  {
    q: '___ vijest, počela je plakati. (čuti — having heard)',
    opts: ['Čuvši', 'Čujući', 'Čula', 'Čuti'],
    answer: 'Čuvši',
    en: 'Having heard the news, she started crying.',
    tip: 'Past adverbial participle: perfective ču-ti → ču-vši.',
  },
  {
    q: '___ se na klupi, odmarao je. (sjediti — while sitting)',
    opts: ['Sjedeći', 'Sjedivši', 'Sjedio', 'Sjediti'],
    answer: 'Sjedeći',
    en: 'Sitting on the bench, he was resting.',
    tip: 'Present adverbial participle: sjed-e → sjed-eći (i-class verbs take -eći).',
  },
  {
    q: 'To je dobro ___ esej. (write — passive participle)',
    opts: ['napisan', 'napisao', 'pišući', 'napisavši'],
    answer: 'napisan',
    en: 'That is a well-written essay.',
    tip: 'Passive participle used attributively (masc sg): napisati → napisan.',
  },
  {
    q: 'Vrata su bila ___. (open — passive participle, neut pl)',
    opts: ['otvorena', 'otvoren', 'otvoreno', 'otvarajući'],
    answer: 'otvorena',
    en: 'The door was open(ed).',
    tip: 'Passive participle agrees with vrata (neuter pl): otvoren-a.',
  },
  {
    q: '___ istinu, nije ništa rekao. (znati — knowing)',
    opts: ['Znajući', 'Znavši', 'Znao', 'Znati'],
    answer: 'Znajući',
    en: 'Knowing the truth, he said nothing.',
    tip: 'Present adverbial participle: zna-ju → zna-jući.',
  },
  {
    q: '___ kući, legao je spavati. (doći — having arrived)',
    opts: ['Došavši', 'Dolazeći', 'Došao', 'Doći'],
    answer: 'Došavši',
    en: 'Having arrived home, he went to sleep.',
    tip: 'Past adverbial participle: perfective doći (dođ-) → doš-avši.',
  },
  {
    q: 'Pročitao je ___ pismo. (received — passive participle)',
    opts: ['primljeno', 'primljen', 'primivši', 'primati'],
    answer: 'primljeno',
    en: 'He read the received letter.',
    tip: 'Passive participle agreeing with pismo (neuter sg): primljen-o.',
  },
  {
    q: '___ pažljivo, sve je razumjela. (slušati — listening)',
    opts: ['Slušajući', 'Slušavši', 'Slušala', 'Slušati'],
    answer: 'Slušajući',
    en: 'Listening carefully, she understood everything.',
    tip: 'Present adverbial participle: sluša-ju → sluša-jući.',
  },
  {
    q: 'Grad ima mnogo ___ zgrada. (build — passive participle, gen pl)',
    opts: ['izgrađenih', 'izgrađen', 'gradeći', 'izgradivši'],
    answer: 'izgrađenih',
    en: 'The city has many built(-up) buildings.',
    tip: 'Passive participle declined (gen pl after mnogo): izgrađen-ih.',
  },
];

interface Props {
  goBack: () => void;
  award?: (xp: number, celebrate?: boolean, activityType?: string) => void;
}

export default function ParticipleDrill({ goBack, award }: Props) {
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
          key: 'participles',
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
        {H('🍂 Participles', 'Adverbial (-ći / -vši) and passive participles', goBack)}
        <div className="c" style={{ marginTop: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>{passed ? '🎉' : '📚'}</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            {score} / {total}
          </div>
          <div style={{ fontSize: 15, color: '#64748b', marginBottom: 16 }}>
            {score === total
              ? 'Perfect! Participles mastered! 🏆'
              : score >= total * 0.8
                ? 'Great work! 💪'
                : 'Keep practising — participles take time!'}
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
      {H('🍂 Participles', 'Adverbial (-ći / -vši) and passive participles', goBack)}
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
          Choose the correct participle
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
