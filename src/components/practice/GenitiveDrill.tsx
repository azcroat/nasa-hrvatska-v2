import React, { useState, useRef } from 'react';
import { H, Bar } from '../../data';
import { markQuest } from '../../lib/quests.js';
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

const DATA = [
  {
    q: 'Ovo je knjiga moga ___.',
    opts: ['brata', 'brat', 'bratu', 'brate'],
    answer: 'brata',
    en: "This is my brother's book.",
    tip: "Possession after 'knjiga' takes genitive. Masc 'brat' -> 'brata' (add -a).",
  },
  {
    q: 'Auto moje ___.',
    opts: ['sestre', 'sestra', 'sestri', 'sestrom'],
    answer: 'sestre',
    en: "My sister's car.",
    tip: 'Fem nouns in -a drop -a and add -e: sestra -> sestre.',
  },
  {
    q: 'Ime moga ___.',
    opts: ['oca', 'otac', 'ocu', 'ocem'],
    answer: 'oca',
    en: "My father's name.",
    tip: "'otac' has fleeting -a in oblique cases: otac -> oca (drop -a-, add -a).",
  },
  {
    q: 'Boja njezine ___.',
    opts: ['haljine', 'haljina', 'haljinu', 'haljinom'],
    answer: 'haljine',
    en: 'The color of her dress.',
    tip: "Fem 'haljina' -> 'haljine' in genitive singular.",
  },
  {
    q: 'Vrata moje ___.',
    opts: ['kuće', 'kuća', 'kuću', 'kućom'],
    answer: 'kuće',
    en: 'The door of my house.',
    tip: "Fem 'kuća' -> 'kuće' in genitive singular.",
  },
  {
    q: 'Selo mog ___.',
    opts: ['djeda', 'djed', 'djedu', 'djedom'],
    answer: 'djeda',
    en: "My grandfather's village.",
    tip: "Masc 'djed' -> 'djeda' in genitive (add -a).",
  },
  {
    q: 'Pijem čašu ___.',
    opts: ['vode', 'voda', 'vodi', 'vodom'],
    answer: 'vode',
    en: 'I drink a glass of water.',
    tip: "Partitive after a measure noun ('čaša') takes genitive: voda -> vode.",
  },
  {
    q: 'Jedem komad ___.',
    opts: ['kruha', 'kruh', 'kruhu', 'kruhom'],
    answer: 'kruha',
    en: 'I eat a piece of bread.',
    tip: "Partitive after 'komad' — masc 'kruh' -> 'kruha'.",
  },
  {
    q: 'Kupujem kilogram ___.',
    opts: ['jabuka', 'jabuke', 'jabukama', 'jabuku'],
    answer: 'jabuka',
    en: 'I buy a kilo of apples.',
    tip: "Measure + genitive plural: 'jabuke' (nom pl) -> 'jabuka' (gen pl, zero ending).",
  },
  {
    q: 'Daj mi malo ___.',
    opts: ['šećera', 'šećer', 'šećeru', 'šećerom'],
    answer: 'šećera',
    en: 'Give me a little sugar.',
    tip: "Partitive after 'malo' — masc 'šećer' -> 'šećera'.",
  },
  {
    q: 'Nemam ___.',
    opts: ['vremena', 'vrijeme', 'vremenu', 'vremenom'],
    answer: 'vremena',
    en: "I don't have time.",
    tip: "Negation takes genitive — neut 'vrijeme' has irregular genitive 'vremena' (ije->e + add -na).",
  },
  {
    q: 'Nemam ___.',
    opts: ['novca', 'novac', 'novcu', 'novcem'],
    answer: 'novca',
    en: "I don't have money.",
    tip: "Masc 'novac' has fleeting -a — genitive 'novca'.",
  },
  {
    q: 'Ne pijem ___.',
    opts: ['kave', 'kava', 'kavu', 'kavom'],
    answer: 'kave',
    en: "I don't drink coffee.",
    tip: "Negation takes genitive — fem 'kava' -> 'kave'.",
  },
  {
    q: 'Nema ___ u kuhinji.',
    opts: ['mlijeka', 'mlijeko', 'mlijeku', 'mlijekom'],
    answer: 'mlijeka',
    en: "There's no milk in the kitchen.",
    tip: "'nema' (impersonal negation) takes genitive — neut 'mlijeko' -> 'mlijeka'.",
  },
  {
    q: 'Idem iz ___.',
    opts: ['kuće', 'kuća', 'kući', 'kućom'],
    answer: 'kuće',
    en: "I'm coming from the house.",
    tip: "'iz' (from, out of) takes genitive — fem 'kuća' -> 'kuće'.",
  },
  {
    q: 'Hodam od ___ do mora.',
    opts: ['parka', 'park', 'parku', 'parkom'],
    answer: 'parka',
    en: 'I walk from the park to the sea.',
    tip: "'od' (from) takes genitive — masc 'park' -> 'parka'. Note: 'do' also takes genitive (mora).",
  },
  {
    q: 'Kupit ću kavu bez ___.',
    opts: ['šećera', 'šećer', 'šećeru', 'šećerom'],
    answer: 'šećera',
    en: "I'll get coffee without sugar.",
    tip: "'bez' (without) takes genitive — masc 'šećer' -> 'šećera'.",
  },
  {
    q: 'Stojim kod ___.',
    opts: ['prozora', 'prozor', 'prozoru', 'prozorom'],
    answer: 'prozora',
    en: "I'm standing by the window.",
    tip: "'kod' (at, near, by) takes genitive — masc 'prozor' -> 'prozora'.",
  },
  {
    q: 'U gradu je puno ___.',
    opts: ['ljudi', 'ljudima', 'čovjek', 'ljude'],
    answer: 'ljudi',
    en: 'There are many people in the city.',
    tip: "'puno' takes genitive plural. 'ljudi' is the suppletive genitive plural of 'čovjek'.",
  },
  {
    q: 'Imam malo ___.',
    opts: ['prijatelja', 'prijatelji', 'prijateljima', 'prijatelje'],
    answer: 'prijatelja',
    en: 'I have few friends.',
    tip: "'malo' + genitive plural — masc 'prijatelji' (nom pl) -> 'prijatelja' (gen pl).",
  },
];

interface Props {
  goBack: () => void;
  award?: (xp: number, celebrate?: boolean, activityType?: string) => void;
}

export default function GenitiveDrill({ goBack, award }: Props) {
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
        if (award) award(score * 5, false, 'grammar');
        markQuest('grammar');
        if (!stats.vs?.includes('genitive')) {
          setStats((prev) => {
            if (prev.vs?.includes('genitive')) return prev;
            return { ...prev, gc: (prev.gc || 0) + 1, vs: [...(prev.vs || []), 'genitive'] };
          });
          if (writeDelta) writeDelta({ gc: 1, vs: ['genitive'] });
        }
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
        {H('📖 Genitive Case', 'Possession, partitive, negation, prepositions', goBack)}
        <div className="c" style={{ marginTop: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            {score} / {total}
          </div>
          <div style={{ fontSize: 15, color: '#64748b', marginBottom: 16 }}>
            {score === total
              ? 'Perfect! Genitive mastered! 🏆'
              : score >= total * 0.8
                ? 'Great work! Genitive is essential!'
                : 'Keep practising — genitive shapes possession, partitive, and negation!'}
          </div>
          <button className="b bp" style={{ width: '100%' }} onClick={goBack}>
            ← Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="scr-wrap">
      {H('📖 Genitive Case', 'Possession, partitive, negation, prepositions', goBack)}
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
          Fill the blank
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#0e7490', lineHeight: 1.4 }}>
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
                style={{ background: bg, borderColor: bc }}
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
