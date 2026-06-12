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

const DATA = [
  {
    q: 'Idem na posao ___.',
    opts: ['autom', 'auta', 'auto', 'autu'],
    answer: 'autom',
    en: 'I go to work by car.',
    tip: "Instrumental shows means: auto + -m → autom. 'Ići autom' = to go by car",
  },
  {
    q: 'Putujemo ___ u Split.',
    opts: ['vlakom', 'vlak', 'vlaka', 'vlaku'],
    answer: 'vlakom',
    en: 'We are travelling to Split by train.',
    tip: 'Instrumental of means: vlak + -om → vlakom',
  },
  {
    q: 'Piše ___.',
    opts: ['olovkom', 'olovka', 'olovki', 'olovke'],
    answer: 'olovkom',
    en: 'She writes with a pencil.',
    tip: 'Instrumental shows instrument: olovka → drop -a + -om → olovkom',
  },
  {
    q: 'Letim ___ u Amsterdam.',
    opts: ['avionom', 'avion', 'aviona', 'avionu'],
    answer: 'avionom',
    en: 'I fly to Amsterdam by plane.',
    tip: 'Instrumental of means: avion + -om → avionom',
  },
  {
    q: 'Razgovaram s ___.',
    opts: ['prijateljem', 'prijatelja', 'prijatelj', 'prijatelju'],
    answer: 'prijateljem',
    en: 'I am talking with a friend.',
    tip: 's + instrumental: prijatelj (soft -lj) → -em ending: prijateljem',
  },
  {
    q: 'Idem s ___.',
    opts: ['mamom', 'mama', 'mame', 'mami'],
    answer: 'mamom',
    en: 'I am going with my mom.',
    tip: 's + instrumental: mama (fem -a) → drop -a + -om → mamom',
  },
  {
    q: 'Razgovaram s ___.',
    opts: ['bratom', 'brata', 'brat', 'bratu'],
    answer: 'bratom',
    en: 'I am talking with my brother.',
    tip: 's + instrumental: brat + -om → bratom',
  },
  {
    q: 'Igram se sa ___.',
    opts: ['psom', 'pas', 'psa', 'psu'],
    answer: 'psom',
    en: 'I am playing with the dog.',
    tip: "sa + instrumental: pas → psa stem → psom. 'Sa' before consonant clusters",
  },
  {
    q: 'Bavim se ___.',
    opts: ['sportom', 'sport', 'sporta', 'sportu'],
    answer: 'sportom',
    en: 'I do sports. (I am engaged in sport.)',
    tip: "'baviti se' takes instrumental: sport + -om → sportom",
  },
  {
    q: 'Ona se bavi ___.',
    opts: ['glazbom', 'glazba', 'glazbe', 'glazbi'],
    answer: 'glazbom',
    en: 'She is engaged in music.',
    tip: "'baviti se' + instrumental: glazba (fem) → drop -a + -om → glazbom",
  },
  {
    q: 'Bavi se ___.',
    opts: ['glumom', 'gluma', 'glume', 'glumi'],
    answer: 'glumom',
    en: 'She is engaged in acting.',
    tip: "'baviti se' + instrumental: gluma → drop -a + -om → glumom",
  },
  {
    q: 'Želi postati ___.',
    opts: ['liječnikom', 'liječnik', 'liječnika', 'liječniku'],
    answer: 'liječnikom',
    en: 'He wants to become a doctor.',
    tip: "'postati' + instrumental for professions: liječnik + -om → liječnikom",
  },
  {
    q: 'Postala je ___.',
    opts: ['učiteljicom', 'učiteljica', 'učiteljice', 'učiteljici'],
    answer: 'učiteljicom',
    en: 'She became a teacher.',
    tip: "'postati' + instrumental: učiteljica (fem) → drop -a + -om → učiteljicom",
  },
  {
    q: 'Radim ___.',
    opts: ['noću', 'noć', 'noći', 'noćom'],
    answer: 'noću',
    en: 'I work at night.',
    tip: "Temporal instrumental: noć (fem consonant noun) → -u → noću. 'Noću' = at night",
  },
  {
    q: 'Šetamo ___.',
    opts: ['šumom', 'šuma', 'šume', 'šumi'],
    answer: 'šumom',
    en: 'We walk through the forest.',
    tip: "Instrumental for path: šuma + -om → šumom. 'Ići šumom' = to walk through the forest",
  },
  {
    q: 'Smatram ga ___.',
    opts: ['prijateljem', 'prijatelja', 'prijatelj', 'prijatelju'],
    answer: 'prijateljem',
    en: 'I consider him a friend.',
    tip: "'Smatrati' (to consider) takes instrumental for the predicate: prijatelj → prijateljem",
  },
  {
    q: 'Dolaze ___.',
    opts: ['biciklom', 'bicikl', 'bicikla', 'biciklu'],
    answer: 'biciklom',
    en: 'They are coming by bicycle.',
    tip: 'Instrumental of means: bicikl + -om → biciklom',
  },
  {
    q: 'Pijem kavu s ___.',
    opts: ['mlijekom', 'mlijeko', 'mlijeka', 'mlijeku'],
    answer: 'mlijekom',
    en: 'I drink coffee with milk.',
    tip: 's + instrumental: mlijeko (neut) → drop -o + -om → mlijekom',
  },
  {
    q: 'Reže ___.',
    opts: ['nožem', 'nož', 'noža', 'nožu'],
    answer: 'nožem',
    en: 'He cuts with a knife.',
    tip: 'Instrumental of instrument: nož (soft -ž) → -em ending: nožem',
  },
  {
    q: 'Putuje ___ svaki dan.',
    opts: ['autobusom', 'autobus', 'autobusa', 'autobusu'],
    answer: 'autobusom',
    en: 'He travels by bus every day.',
    tip: 'Instrumental of means: autobus + -om → autobusom',
  },
];

interface Props {
  goBack: () => void;
  award?: (xp: number, celebrate?: boolean, activityType?: string) => void;
}

export default function InstrumentalDrill({ goBack, award }: Props) {
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
          key: 'instrumental',
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
        {H('🔧 Instrumental Case', 'With s/sa, means of transport, baviti se, postati', goBack)}
        <div className="c" style={{ marginTop: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>{passed ? '🎉' : '📚'}</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            {score} / {total}
          </div>
          <div style={{ fontSize: 15, color: '#64748b', marginBottom: 16 }}>
            {score === total
              ? 'Perfect! Instrumental mastered! 🏆'
              : score >= total * 0.8
                ? 'Great work! 💪'
                : 'Keep practising — instrumental will click!'}
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
      {H('🔧 Instrumental Case', 'With s/sa, means of transport, baviti se, postati', goBack)}
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
