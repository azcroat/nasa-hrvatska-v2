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

// C1 — nominalization (glagolska imenica / deverbal nouns): forming the noun
// from a verb, the backbone of formal "nominal style". Mostly -nje, but several
// high-frequency deverbal nouns are irregular (dolazak, odluka, odgovor).
const DATA = [
  {
    q: 'čitati → ___ (the reading)',
    opts: ['čitanje', 'čitatelj', 'čitao', 'čitalac'],
    answer: 'čitanje',
    en: 'reading',
    tip: 'Verbal noun -nje from the passive participle stem: čita-nje.',
  },
  {
    q: 'putovati → ___ (the travel/journey)',
    opts: ['putovanje', 'putnik', 'putovao', 'put'],
    answer: 'putovanje',
    en: 'travelling / journey',
    tip: 'putova-nje (verbal noun); "putnik" = traveller, "put" = road/trip.',
  },
  {
    q: 'rješavati → ___ (the solving)',
    opts: ['rješavanje', 'rješenje', 'rješavač', 'riješen'],
    answer: 'rješavanje',
    en: 'the (process of) solving',
    tip: 'Imperfective → process noun rješava-nje; "rješenje" = the solution (result).',
  },
  {
    q: 'dolaziti → ___ (the arrival)',
    opts: ['dolazak', 'dolaženje', 'dolazni', 'došao'],
    answer: 'dolazak',
    en: 'arrival',
    tip: 'Irregular deverbal noun: "dolazak" (not the regular -nje form).',
  },
  {
    q: 'odlučiti → ___ (the decision)',
    opts: ['odluka', 'odlučivanje', 'odlučan', 'odlučio'],
    answer: 'odluka',
    en: 'decision',
    tip: '"odluka" = the decision (result); "odlučivanje" = the act of deciding.',
  },
  {
    q: 'odgovoriti → ___ (the answer)',
    opts: ['odgovor', 'odgovaranje', 'odgovoran', 'odgovorio'],
    answer: 'odgovor',
    en: 'answer / reply',
    tip: 'Irregular deverbal noun "odgovor"; "odgovoran" = responsible (adjective).',
  },
  {
    q: 'razmišljati → ___ (the thinking)',
    opts: ['razmišljanje', 'razmislio', 'mislilac', 'razuman'],
    answer: 'razmišljanje',
    en: 'thinking / reflection',
    tip: 'razmišlja-nje (verbal noun).',
  },
  {
    q: 'graditi → ___ (the construction)',
    opts: ['gradnja', 'graditelj', 'građen', 'gradio'],
    answer: 'gradnja',
    en: 'building / construction',
    tip: '"gradnja" (deverbal noun); "graditelj" = builder.',
  },
  {
    q: 'plivati → ___ (swimming)',
    opts: ['plivanje', 'plivač', 'plivao', 'pliva'],
    answer: 'plivanje',
    en: 'swimming',
    tip: 'pliva-nje (verbal noun); "plivač" = swimmer.',
  },
  {
    q: 'pisati → ___ (the writing)',
    opts: ['pisanje', 'pisac', 'pismo', 'pisao'],
    answer: 'pisanje',
    en: 'writing (the activity)',
    tip: 'pisa-nje (verbal noun); "pisac" = writer, "pismo" = letter.',
  },
];

interface Props {
  goBack: () => void;
  award?: (xp: number, celebrate?: boolean, activityType?: string) => void;
}

export default function NominalizationDrill({ goBack, award }: Props) {
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
          key: 'nominalization',
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
        {H('🏛️ Nominalization', 'Verbal nouns and nominal style', goBack)}
        <div className="c" style={{ marginTop: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>{passed ? '🎉' : '📚'}</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            {score} / {total}
          </div>
          <div style={{ fontSize: 15, color: '#64748b', marginBottom: 16 }}>
            {score === total
              ? 'Perfect! Nominal style mastered! 🏆'
              : score >= total * 0.8
                ? 'Great work! 💪'
                : 'Keep practising — deverbal nouns take time!'}
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
      {H('🏛️ Nominalization', 'Verbal nouns and nominal style', goBack)}
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
          Choose the noun derived from the verb
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
