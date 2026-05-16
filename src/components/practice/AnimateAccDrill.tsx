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
    q: 'Vidim svog ___ na ulici.',
    nom: 'brat (brother)',
    en: 'I see my brother on the street.',
    opts: ['brata', 'brat', 'bratu', 'bratom'],
    answer: 'brata',
    tip: 'brat is ANIMATE (person) → accusative = genitive form: brat → brata',
  },
  {
    q: 'Ona čita ___.',
    nom: 'roman (novel)',
    en: 'She is reading a novel.',
    opts: ['roman', 'romana', 'romanu', 'romanom'],
    answer: 'roman',
    tip: 'roman is INANIMATE → accusative = nominative: roman (no change)',
  },
  {
    q: 'Imam ___.',
    nom: 'pas (dog)',
    en: 'I have a dog.',
    opts: ['psa', 'pas', 'psu', 'psom'],
    answer: 'psa',
    tip: 'pas is ANIMATE (animal) → accusative = genitive: pas → psa',
  },
  {
    q: 'Ona gleda ___.',
    nom: 'film (film)',
    en: 'She is watching a film.',
    opts: ['film', 'filma', 'filmu', 'filmom'],
    answer: 'film',
    tip: 'film is INANIMATE → accusative = nominative: film (no change)',
  },
  {
    q: 'Mama zove ___.',
    nom: 'sin (son)',
    en: 'Mom is calling her son.',
    opts: ['sina', 'sin', 'sinu', 'sinom'],
    answer: 'sina',
    tip: 'sin is ANIMATE (person) → accusative = genitive: sin → sina',
  },
  {
    q: 'Kupio sam novi ___.',
    nom: 'stol (table)',
    en: 'I bought a new table.',
    opts: ['stol', 'stola', 'stolu', 'stolom'],
    answer: 'stol',
    tip: 'stol is INANIMATE → accusative = nominative: stol (no change)',
  },
  {
    q: 'Traži svog ___.',
    nom: 'prijatelj (friend)',
    en: 'She is looking for her friend.',
    opts: ['prijatelja', 'prijatelj', 'prijatelju', 'prijateljem'],
    answer: 'prijatelja',
    tip: 'prijatelj is ANIMATE (person) → accusative = genitive: prijatelj → prijatelja',
  },
  {
    q: 'Kupila sam novi ___.',
    nom: 'telefon (phone)',
    en: 'I bought a new phone.',
    opts: ['telefon', 'telefona', 'telefonu', 'telefonom'],
    answer: 'telefon',
    tip: 'telefon is INANIMATE → accusative = nominative: telefon (no change)',
  },
  {
    q: 'Volim svog ___.',
    nom: 'mačak (cat)',
    en: 'I love my cat.',
    opts: ['mačka', 'mačak', 'mačku', 'mačkom'],
    answer: 'mačka',
    tip: 'mačak is ANIMATE (animal) → accusative = genitive: mačak → mačka',
  },
  {
    q: 'Čujem ___.',
    nom: 'vlak (train)',
    en: 'I hear the train.',
    opts: ['vlak', 'vlaka', 'vlaku', 'vlakom'],
    answer: 'vlak',
    tip: 'vlak is INANIMATE → accusative = nominative: vlak (no change)',
  },
  {
    q: 'Pitam ___.',
    nom: 'profesor (professor)',
    en: 'I am asking the professor.',
    opts: ['profesora', 'profesor', 'profesoru', 'profesorom'],
    answer: 'profesora',
    tip: 'profesor is ANIMATE (person) → accusative = genitive: profesor → profesora',
  },
  {
    q: 'Vozim ___.',
    nom: 'auto (car)',
    en: 'I drive a car.',
    opts: ['auto', 'auta', 'autu', 'autom'],
    answer: 'auto',
    tip: 'auto is INANIMATE → accusative = nominative: auto (no change — indeclinable)',
  },
  {
    q: 'Vidim ___.',
    nom: 'konj (horse)',
    en: 'I see a horse.',
    opts: ['konja', 'konj', 'konju', 'konjem'],
    answer: 'konja',
    tip: 'konj is ANIMATE (animal) → accusative = genitive: konj → konja',
  },
  {
    q: 'Imam ___.',
    nom: 'ključ (key)',
    en: 'I have a key.',
    opts: ['ključ', 'ključa', 'ključu', 'ključem'],
    answer: 'ključ',
    tip: 'ključ is INANIMATE → accusative = nominative: ključ (no change)',
  },
  {
    q: 'Znam ___.',
    nom: 'liječnik (doctor)',
    en: 'I know the doctor.',
    opts: ['liječnika', 'liječnik', 'liječniku', 'liječnikom'],
    answer: 'liječnika',
    tip: 'liječnik is ANIMATE (person) → accusative = genitive: liječnik → liječnika',
  },
  {
    q: 'Otvaramo ___.',
    nom: 'prozor (window)',
    en: 'We are opening the window.',
    opts: ['prozor', 'prozora', 'prozoru', 'prozorom'],
    answer: 'prozor',
    tip: 'prozor is INANIMATE → accusative = nominative: prozor (no change)',
  },
  {
    q: 'Volim svog ___.',
    nom: 'muž (husband)',
    en: 'I love my husband.',
    opts: ['muža', 'muž', 'mužu', 'mužem'],
    answer: 'muža',
    tip: 'muž is ANIMATE (person) → accusative = genitive: muž → muža',
  },
  {
    q: 'Vidim ___.',
    nom: 'brod (ship)',
    en: 'I see a ship.',
    opts: ['brod', 'broda', 'brodu', 'brodom'],
    answer: 'brod',
    tip: 'brod is INANIMATE → accusative = nominative: brod (no change)',
  },
  {
    q: 'Čuvam svog ___.',
    nom: 'stranac (stranger)',
    en: 'I am keeping an eye on the stranger.',
    opts: ['stranca', 'stranac', 'strancu', 'strancem'],
    answer: 'stranca',
    tip: 'stranac is ANIMATE (person) → accusative = genitive: stranac → stranca',
  },
  {
    q: 'Čujem ___.',
    nom: 'sat (clock)',
    en: 'I hear the clock.',
    opts: ['sat', 'sata', 'satu', 'satom'],
    answer: 'sat',
    tip: 'sat is INANIMATE → accusative = nominative: sat (no change)',
  },
];

interface Props {
  goBack: () => void;
  award?: (xp: number, celebrate?: boolean, activityType?: string) => void;
}

export default function AnimateAccDrill({ goBack, award }: Props) {
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
        if (!stats.vs?.includes('animateacc')) {
          setStats((prev) => {
            if (prev.vs?.includes('animateacc')) return prev;
            return { ...prev, gc: (prev.gc || 0) + 1, vs: [...(prev.vs || []), 'animateacc'] };
          });
          if (writeDelta) writeDelta({ gc: 1, vs: ['animateacc'] });
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
        {H('🎯 Animate Accusative', 'Inanimate = same as nom; Animate = genitive form', goBack)}
        <div className="c" style={{ marginTop: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            {score} / {total}
          </div>
          <div style={{ fontSize: 15, color: '#64748b', marginBottom: 16 }}>
            {score === total
              ? 'Perfect! Animate accusative mastered! 🏆'
              : score >= total * 0.8
                ? 'Great work! 💪'
                : 'Keep practising — animate vs inanimate is tricky!'}
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
      {H('🎯 Animate Accusative', 'Inanimate = same as nom; Animate = genitive form', goBack)}
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
          Choose the accusative form
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#0e7490', lineHeight: 1.4 }}>
          {cur.q}
        </div>
        <div style={{ fontSize: 15, color: '#164e63', fontWeight: 600, marginTop: 4 }}>
          {cur.nom}
        </div>
        <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>{cur.en}</div>
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
