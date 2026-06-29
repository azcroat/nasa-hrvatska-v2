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

// C1 — figurative idioms: recognise the non-literal meaning (the literal gloss
// is given as a tip). Knowing idiomatic meaning beyond the words is C1 territory.
const DATA = [
  {
    q: 'praviti od muhe slona',
    opts: [
      'to make a mountain out of a molehill',
      'to work very hard',
      'to tell a long story',
      'to raise animals',
    ],
    answer: 'to make a mountain out of a molehill',
    tip: "Literally 'to make an elephant out of a fly' — to exaggerate.",
  },
  {
    q: 'naći zajednički jezik',
    opts: [
      'to find common ground',
      'to learn a language',
      'to translate a text',
      'to lose an argument',
    ],
    answer: 'to find common ground',
    tip: "Literally 'to find a common language' — to reach mutual understanding.",
  },
  {
    q: 'kupiti mačka u vreći',
    opts: [
      'to buy something sight unseen',
      'to adopt a pet',
      'to get a great bargain',
      'to go shopping',
    ],
    answer: 'to buy something sight unseen',
    tip: "Literally 'to buy a cat in a bag' — to buy a pig in a poke.",
  },
  {
    q: 'vući nekoga za nos',
    opts: ['to deceive someone', 'to annoy someone', 'to help someone', 'to follow someone'],
    answer: 'to deceive someone',
    tip: "Literally 'to pull someone by the nose' — to mislead/fool them.",
  },
  {
    q: 'obećavati brda i doline',
    opts: [
      'to promise the moon',
      'to plan a hiking trip',
      'to describe the scenery',
      'to keep a promise',
    ],
    answer: 'to promise the moon',
    tip: "Literally 'to promise mountains and valleys' — to make extravagant promises.",
  },
  {
    q: 'pala mu sjekira u med',
    opts: [
      'he had a stroke of luck',
      'he made a big mistake',
      'he got injured',
      'he started cooking',
    ],
    answer: 'he had a stroke of luck',
    tip: "Literally 'his axe fell into honey' — unexpected good fortune.",
  },
  {
    q: 'bacati drvlje i kamenje (na nekoga)',
    opts: ['to harshly attack/criticise', 'to build a house', 'to clean the yard', 'to give gifts'],
    answer: 'to harshly attack/criticise',
    tip: "Literally 'to throw timber and stones' — to lambast someone.",
  },
  {
    q: 'držati nekome fige',
    opts: [
      'to keep fingers crossed for someone',
      'to owe someone money',
      'to be angry at someone',
      'to wait for someone',
    ],
    answer: 'to keep fingers crossed for someone',
    tip: "Literally 'to hold figs (crossed fingers)' — to wish someone luck.",
  },
  {
    q: 'biti na konju',
    opts: ['to be in a winning position', 'to be travelling', 'to be late', 'to be tired'],
    answer: 'to be in a winning position',
    tip: "Literally 'to be on the horse' — to have the upper hand / be sorted.",
  },
  {
    q: 'trla baba lan',
    opts: ['idle, pointless activity', 'hard manual labour', 'a family gathering', 'a clever plan'],
    answer: 'idle, pointless activity',
    tip: "From 'trla baba lan da joj prođe dan' — doing something just to pass the time.",
  },
  {
    q: 'gledati kroz prste (nekome)',
    opts: ['to turn a blind eye', 'to watch closely', 'to count money', 'to be jealous'],
    answer: 'to turn a blind eye',
    tip: "Literally 'to look through one's fingers' — to overlook a fault.",
  },
  {
    q: 'dobiti nogu',
    opts: ['to get fired/dumped', 'to win a prize', 'to start running', 'to get hurt'],
    answer: 'to get fired/dumped',
    tip: "Literally 'to get the foot' — to be dismissed or broken up with.",
  },
];

interface Props {
  goBack: () => void;
  award?: (xp: number, celebrate?: boolean, activityType?: string) => void;
}

export default function IdiomDrill({ goBack, award }: Props) {
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
          key: 'idiomdrill',
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
        {H('💬 Idioms', 'Figurative expressions — beyond the literal', goBack)}
        <div className="c" style={{ marginTop: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>{passed ? '🎉' : '📚'}</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            {score} / {total}
          </div>
          <div style={{ fontSize: 15, color: '#64748b', marginBottom: 16 }}>
            {score === total
              ? 'Perfect! Idioms mastered! 🏆'
              : score >= total * 0.8
                ? 'Great work! 💪'
                : 'Keep practising — idioms take time!'}
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
      {H('💬 Idioms', 'Figurative expressions — beyond the literal', goBack)}
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
          What does this idiom mean?
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#0e7490', lineHeight: 1.5 }}>
          {cur.q}
        </div>
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
