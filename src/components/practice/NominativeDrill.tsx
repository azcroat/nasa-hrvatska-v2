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
    q: '___ čita knjigu.',
    opts: ['Ana', 'Anu', 'Ane', 'Anom'],
    answer: 'Ana',
    en: 'Ana reads a book.',
    tip: 'Subject takes nominative. The doer of the action stays in its base form: Ana.',
  },
  {
    q: '___ trči u parku.',
    opts: ['Marko', 'Marka', 'Marku', 'Markom'],
    answer: 'Marko',
    en: 'Marko runs in the park.',
    tip: 'Masc names ending in -o keep -o in nominative singular: Marko.',
  },
  {
    q: '___ piše pismo.',
    opts: ['Učitelj', 'Učitelja', 'Učitelju', 'Učiteljem'],
    answer: 'Učitelj',
    en: 'The teacher writes a letter.',
    tip: "Masc 'učitelj' has zero ending (no suffix) in nominative singular.",
  },
  {
    q: '___ kuha juhu.',
    opts: ['Mama', 'Mamu', 'Mami', 'Mamom'],
    answer: 'Mama',
    en: 'Mom cooks soup.',
    tip: 'Fem nouns ending in -a in nominative singular: mama.',
  },
  {
    q: '___ spava na podu.',
    opts: ['Mačka', 'Mačku', 'Mački', 'Mačkom'],
    answer: 'Mačka',
    en: 'The cat sleeps on the floor.',
    tip: "Fem 'mačka' — nominative singular ends in -a.",
  },
  {
    q: '___ dolazi sutra.',
    opts: ['Brat', 'Brata', 'Bratu', 'Bratom'],
    answer: 'Brat',
    en: 'My brother is coming tomorrow.',
    tip: "Masc 'brat' has zero ending in nominative singular.",
  },
  {
    q: 'Moj otac je ___.',
    opts: ['liječnik', 'liječnika', 'liječniku', 'liječnikom'],
    answer: 'liječnik',
    en: 'My father is a doctor.',
    tip: "After 'je' (is), the predicate noun takes nominative: liječnik.",
  },
  {
    q: 'Ona je ___.',
    opts: ['učiteljica', 'učiteljicu', 'učiteljici', 'učiteljicom'],
    answer: 'učiteljica',
    en: 'She is a teacher.',
    tip: "Predicate nominative after 'je' — fem 'učiteljica'.",
  },
  {
    q: 'To je ___.',
    opts: ['knjiga', 'knjigu', 'knjizi', 'knjigom'],
    answer: 'knjiga',
    en: 'This is a book.',
    tip: "After 'to je' (this is), noun stays in nominative: knjiga.",
  },
  {
    q: 'Ovo je ___.',
    opts: ['kuća', 'kuću', 'kući', 'kućom'],
    answer: 'kuća',
    en: 'This is a house.',
    tip: "After 'ovo je' the noun is in nominative — fem 'kuća'.",
  },
  {
    q: 'Hrvatska je ___.',
    opts: ['zemlja', 'zemlju', 'zemlji', 'zemljom'],
    answer: 'zemlja',
    en: 'Croatia is a country.',
    tip: "Predicate nominative — fem 'zemlja'.",
  },
  {
    q: '___ trče u parku.',
    opts: ['Djeca', 'Djecu', 'Djece', 'Djecom'],
    answer: 'Djeca',
    en: 'Children run in the park.',
    tip: "'djeca' is a collective noun taking plural verb agreement — nominative form: djeca.",
  },
  {
    q: '___ se igraju.',
    opts: ['Studenti', 'Studente', 'Studentima', 'Studenata'],
    answer: 'Studenti',
    en: 'Students are playing.',
    tip: 'Masc plural nominative ends in -i: student -> studenti.',
  },
  {
    q: '___ pjevaju.',
    opts: ['Djevojke', 'Djevojaka', 'Djevojkama', 'Djevojku'],
    answer: 'Djevojke',
    en: 'Girls are singing.',
    tip: 'Fem plural nominative — djevojka -> djevojke.',
  },
  {
    q: '___ su lijepa.',
    opts: ['Sela', 'Sele', 'Selima', 'Selo'],
    answer: 'Sela',
    en: 'The villages are pretty.',
    tip: 'Neut nouns in -o have plural in -a: selo (sg) -> sela (pl).',
  },
  {
    q: 'Muški rod (nom sg): ___',
    opts: ['Brat', 'Brata', 'Sestra', 'Sestrom'],
    answer: 'Brat',
    en: 'Masculine (nom sg): brat.',
    tip: 'Masc nouns in nom sg typically end in a consonant — brat.',
  },
  {
    q: 'Ženski rod (nom sg): ___',
    opts: ['Mama', 'Mami', 'Mamom', 'Mame'],
    answer: 'Mama',
    en: 'Feminine (nom sg): mama.',
    tip: 'Fem nouns in nom sg typically end in -a — mama.',
  },
  {
    q: 'Srednji rod (nom sg): ___',
    opts: ['Selo', 'Sela', 'Selu', 'Selom'],
    answer: 'Selo',
    en: 'Neuter (nom sg): selo.',
    tip: 'Neut nouns in nom sg typically end in -o or -e — selo.',
  },
  {
    q: 'Muški rod (nom sg): ___',
    opts: ['prozor', 'prozora', 'prozoru', 'prozorom'],
    answer: 'prozor',
    en: 'Masculine (nom sg): prozor (window).',
    tip: 'Masc inanimate noun with zero ending in nominative — prozor.',
  },
  {
    q: 'Ženski rod (nom pl): ___',
    opts: ['žene', 'žena', 'ženama', 'ženu'],
    answer: 'žene',
    en: 'Feminine (nom pl): žene (women).',
    tip: 'Fem plural nominative: žena (sg) -> žene (pl).',
  },
];

interface Props {
  goBack: () => void;
  award?: (xp: number, celebrate?: boolean, activityType?: string) => void;
}

export default function NominativeDrill({ goBack, award }: Props) {
  const { stats, setStats, writeDelta } = useStats();
  const finishFired = useRef(false);
  const [q] = useState(() =>
    shLocal(DATA)
      .slice(0, 10)
      .map((item) => ({ ...item, opts: shLocal([...item.opts]) })),
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
          key: 'nominative',
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
        {H('🏷️ Nominative Case', 'Subjects and identity statements', goBack)}
        <div className="c" style={{ marginTop: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>{passed ? '🎉' : '📚'}</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            {score} / {total}
          </div>
          <div style={{ fontSize: 15, color: '#64748b', marginBottom: 16 }}>
            {score === total
              ? 'Perfect! Nominative mastered! 🏆'
              : score >= total * 0.8
                ? 'Great work! Nominative is the foundation!'
                : 'Keep practising — nominative tells you who or what is doing the action!'}
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
      {H('🏷️ Nominative Case', 'Subjects and identity statements', goBack)}
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
