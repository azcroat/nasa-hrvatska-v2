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
    q: 'Croatian is spoken here. = Ovdje ___ hrvatski.',
    opts: ['se govori', 'se govoriti', 'govori se ti', 'govoriti'],
    answer: 'se govori',
    en: 'Croatian is spoken here.',
    tip: "se-passive: 3rd sg (impersonal). Clitic 'se' precedes the verb: 'se govori'",
  },
  {
    q: 'The house is being built. = Kuća ___.',
    opts: ['se gradi', 'se grade', 'se graditi', 'gradi ti'],
    answer: 'se gradi',
    en: 'The house is being built.',
    tip: "se-passive: kuća (fem sg) → verb in 3rd sg: 'se gradi'",
  },
  {
    q: 'The books are being sold. = Knjige ___.',
    opts: ['se prodaju', 'se prodaje', 'prodati se', 'se prodati'],
    answer: 'se prodaju',
    en: 'The books are being sold.',
    tip: "se-passive: knjige (fem pl) → verb in 3rd pl: 'se prodaju'",
  },
  {
    q: 'The window is opened. = Prozor ___.',
    opts: ['se otvara', 'se otvaraju', 'otvoriti se', 'se otvoriti'],
    answer: 'se otvara',
    en: 'The window is opened.',
    tip: "se-passive: prozor (masc sg) → verb in 3rd sg: 'se otvara'",
  },
  {
    q: 'The meeting is held every week. = Sastanak ___ svaki tjedan.',
    opts: ['se održava', 'se održavaju', 'se je održan', 'je se'],
    answer: 'se održava',
    en: 'The meeting is held every week.',
    tip: "se-passive, habitual → imperfective: 'se održava' (3rd sg)",
  },
  {
    q: 'Movies are watched in the evening. = Filmovi ___ navečer.',
    opts: ['se gledaju', 'se gleda', 'gledati se', 'je gledano'],
    answer: 'se gledaju',
    en: 'Movies are watched in the evening.',
    tip: "se-passive: filmovi (masc pl) → 3rd pl: 'se gledaju'",
  },
  {
    q: 'The letter has been written. = Pismo je ___.',
    opts: ['napisano', 'napisan', 'napisana', 'napisani'],
    answer: 'napisano',
    en: 'The letter has been written.',
    tip: "Passive participle: pismo (neuter sg) → -o ending: 'napisano'",
  },
  {
    q: 'The door was opened. = Vrata su bila ___.',
    opts: ['otvorena', 'otvoren', 'otvoreno', 'otvoreni'],
    answer: 'otvorena',
    en: 'The door was opened.',
    tip: "Passive participle: vrata (neuter pl) → -a ending: 'otvorena'",
  },
  {
    q: 'The city was built in the 15th century. = Grad je bio ___ u 15. stoljeću.',
    opts: ['izgrađen', 'izgrađena', 'izgrađeno', 'izgrađeni'],
    answer: 'izgrađen',
    en: 'The city was built in the 15th century.',
    tip: "Passive participle: grad (masculine sg) → no suffix: 'izgrađen'",
  },
  {
    q: 'The song was sung. = Pjesma je bila ___.',
    opts: ['pjevana', 'pjevan', 'pjevano', 'pjevani'],
    answer: 'pjevana',
    en: 'The song was sung.',
    tip: "Passive participle: pjesma (feminine sg) → -a ending: 'pjevana'",
  },
  {
    q: 'The guests were welcomed. = Gosti su bili ___.',
    opts: ['dočekani', 'dočekan', 'dočekana', 'dočekano'],
    answer: 'dočekani',
    en: 'The guests were welcomed.',
    tip: "Passive participle: gosti (masc pl) → -i ending: 'dočekani'",
  },
  {
    q: 'The problem was solved. = Problem je ___.',
    opts: ['riješen', 'se riješiti', 'riješena', 'riješeno'],
    answer: 'riješen',
    en: 'The problem was solved.',
    tip: "biti + participle: problem (masc sg) → 'je riješen'. riješiti → riješen",
  },
  {
    q: 'The exam is taken every June. = Ispit ___ svaki lipanj.',
    opts: ['se polaže', 'je položen', 'se položiti', 'polaže'],
    answer: 'se polaže',
    en: 'The exam is taken every June.',
    tip: "Habitual/repeated → se-passive with imperfective: 'se polaže' (polagati)",
  },
  {
    q: 'The house was sold last year. = Kuća je bila ___ prošle godine.',
    opts: ['prodana', 'prodan', 'prodano', 'prodani'],
    answer: 'prodana',
    en: 'The house was sold last year.',
    tip: "Passive participle: kuća (fem sg) → -a ending: 'prodana'. prodati → prodan- → prodana",
  },
  {
    q: 'Three languages are spoken here. = Ovdje ___ tri jezika.',
    opts: ['se govore', 'se govori', 'govori se', 'je govoreno'],
    answer: 'se govore',
    en: 'Three languages are spoken here.',
    tip: "se-passive: tri jezika → verb in 3rd pl: 'se govore'",
  },
  {
    q: 'The novel was written by Šenoa. = Roman je bio napisan ___ Šenoe.',
    opts: ['od', 's', 'za', 'iz'],
    answer: 'od',
    en: 'The novel was written by Šenoa.',
    tip: "Agent in biti+participle passive: 'od + genitive'. od Šenoe = by Šenoa",
  },
  {
    q: 'The letter was sent. = Pismo ___ poslano.',
    opts: ['je', 'se je', 'je se', 'bilo'],
    answer: 'je',
    en: 'The letter was sent.',
    tip: "biti + participle: 'je' (3rd sg present) + 'poslano' (neut sg). No 'se' in this construction.",
  },
  {
    q: 'Tickets are sold at the entrance. = Karte ___ na ulazu.',
    opts: ['se prodaju', 'su prodane', 'se prodati', 'prodaju se ne'],
    answer: 'se prodaju',
    en: 'Tickets are sold at the entrance.',
    tip: "se-passive, habitual: karte (fem pl) → 'se prodaju' (3rd pl imperfective)",
  },
];

interface Props {
  goBack: () => void;
  award?: (xp: number, celebrate?: boolean, activityType?: string) => void;
}

export default function PassiveDrill({ goBack, award }: Props) {
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
          key: 'passive',
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
        {H('🔄 Passive Voice', 'Se-passive and biti+participle constructions', goBack)}
        <div className="c" style={{ marginTop: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>{passed ? '🎉' : '📚'}</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            {score} / {total}
          </div>
          <div style={{ fontSize: 15, color: '#64748b', marginBottom: 16 }}>
            {score === total
              ? 'Perfect! Passive voice mastered! 🏆'
              : score >= total * 0.8
                ? 'Great work! 💪'
                : 'Keep practising — passive takes time!'}
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
      {H('🔄 Passive Voice', 'Se-passive and biti+participle constructions', goBack)}
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
          Choose the correct passive construction
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
