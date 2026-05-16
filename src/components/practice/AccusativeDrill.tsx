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
    q: 'Vidim ___.',
    opts: ['brata', 'brat', 'bratu', 'bratom'],
    answer: 'brata',
    en: 'I see my brother.',
    tip: 'Animate masc accusative = genitive form: brat -> brata.',
  },
  {
    q: 'Gledam ___.',
    opts: ['stol', 'stola', 'stolu', 'stolom'],
    answer: 'stol',
    en: 'I look at the table.',
    tip: 'Inanimate masc accusative = nominative form: stol stays stol.',
  },
  {
    q: 'Volim ___.',
    opts: ['psa', 'pas', 'psu', 'psom'],
    answer: 'psa',
    en: 'I love the dog.',
    tip: "Animate masc: 'pas' has fleeting -a-, animate accusative = genitive: psa.",
  },
  {
    q: 'Kupujem ___.',
    opts: ['auto', 'autom', 'auta', 'autu'],
    answer: 'auto',
    en: "I'm buying a car.",
    tip: "Inanimate 'auto' is indeclinable in standard Croatian — accusative same as nominative.",
  },
  {
    q: 'Pozivam ___.',
    opts: ['prijatelja', 'prijatelj', 'prijatelju', 'prijateljem'],
    answer: 'prijatelja',
    en: "I'm inviting my friend.",
    tip: 'Animate masc accusative = genitive: prijatelj -> prijatelja.',
  },
  {
    q: 'Jedem ___.',
    opts: ['juhu', 'juha', 'juhi', 'juhom'],
    answer: 'juhu',
    en: "I'm eating soup.",
    tip: 'Fem nouns ending in -a take -u in accusative singular: juha -> juhu.',
  },
  {
    q: 'Pijem ___.',
    opts: ['kavu', 'kava', 'kavi', 'kavom'],
    answer: 'kavu',
    en: "I'm drinking coffee.",
    tip: 'Fem -a -> -u in accusative: kava -> kavu.',
  },
  {
    q: 'Citam ___.',
    opts: ['knjigu', 'knjiga', 'knjizi', 'knjigom'],
    answer: 'knjigu',
    en: "I'm reading a book.",
    tip: 'Fem -a -> -u: knjiga -> knjigu.',
  },
  {
    q: 'Vidim ___.',
    opts: ['Anu', 'Ana', 'Ani', 'Anom'],
    answer: 'Anu',
    en: 'I see Ana.',
    tip: 'Fem names ending in -a take -u in accusative: Ana -> Anu.',
  },
  {
    q: 'Kuham ___.',
    opts: ['veceru', 'vecera', 'veceri', 'vecerom'],
    answer: 'veceru',
    en: "I'm cooking dinner.",
    tip: 'Fem -a -> -u: vecera -> veceru.',
  },
  {
    q: 'Imam ___.',
    opts: ['sestru', 'sestra', 'sestre', 'sestrom'],
    answer: 'sestru',
    en: 'I have a sister.',
    tip: "Fem -a -> -u after 'imati' (to have): sestra -> sestru.",
  },
  {
    q: 'Volim ___.',
    opts: ['more', 'mora', 'moru', 'morem'],
    answer: 'more',
    en: 'I love the sea.',
    tip: 'Neut nouns in -e have accusative = nominative: more stays more.',
  },
  {
    q: 'Imam ___.',
    opts: ['kucu', 'kuca', 'kuce', 'kucom'],
    answer: 'kucu',
    en: 'I have a house.',
    tip: "'imati' (to have) takes accusative — fem 'kuca' -> 'kucu'.",
  },
  {
    q: 'Gledam ___.',
    opts: ['film', 'filma', 'filmu', 'filmom'],
    answer: 'film',
    en: "I'm watching the film.",
    tip: "'gledati' (to watch) + accusative — inanimate masc 'film' = nom in acc.",
  },
  {
    q: 'Kupujem ___.',
    opts: ['kruh', 'kruha', 'kruhu', 'kruhom'],
    answer: 'kruh',
    en: "I'm buying bread.",
    tip: "'kupiti' (to buy) + accusative — inanimate masc 'kruh' = nom in acc.",
  },
  {
    q: 'Gledam ___.',
    opts: ['televiziju', 'televizija', 'televiziji', 'televizijom'],
    answer: 'televiziju',
    en: "I'm watching TV.",
    tip: "'gledati' + accusative — fem 'televizija' -> 'televiziju'.",
  },
  {
    q: 'Idem u ___.',
    opts: ['skolu', 'skola', 'skoli', 'skolom'],
    answer: 'skolu',
    en: "I'm going to school.",
    tip: "'u' (into, with motion verbs) takes accusative — fem 'skola' -> 'skolu'. Compare 'u skoli' (locative, location).",
  },
  {
    q: 'Idem na ___.',
    opts: ['posao', 'posla', 'poslu', 'poslom'],
    answer: 'posao',
    en: "I'm going to work.",
    tip: "'na' (onto, with motion) takes accusative — inanimate masc 'posao' = nom in acc.",
  },
  {
    q: 'Seta kroz ___.',
    opts: ['park', 'parka', 'parku', 'parkom'],
    answer: 'park',
    en: 'He walks through the park.',
    tip: "'kroz' (through) takes accusative — inanimate masc 'park' = nom in acc.",
  },
  {
    q: 'Voli ___.',
    opts: ['mene', 'ja', 'mi', 'mnom'],
    answer: 'mene',
    en: 'She loves me.',
    tip: "1st person singular accusative long form: 'mene'. Short clitic form: 'me'.",
  },
];

interface Props {
  goBack: () => void;
  award?: (xp: number, celebrate?: boolean, activityType?: string) => void;
}

export default function AccusativeDrill({ goBack, award }: Props) {
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
        if (!stats.vs?.includes('accusative')) {
          setStats((prev) => {
            if (prev.vs?.includes('accusative')) return prev;
            return { ...prev, gc: (prev.gc || 0) + 1, vs: [...(prev.vs || []), 'accusative'] };
          });
          if (writeDelta) writeDelta({ gc: 1, vs: ['accusative'] });
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
        {H('Accusative Case', 'Direct objects, animate/inanimate, motion prepositions', goBack)}
        <div className="c" style={{ marginTop: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            {score} / {total}
          </div>
          <div style={{ fontSize: 15, color: '#64748b', marginBottom: 16 }}>
            {score === total
              ? 'Perfect! Accusative mastered!'
              : score >= total * 0.8
                ? 'Great work! Accusative is essential for direct objects!'
                : 'Keep practising — accusative marks the direct object of most verbs.'}
          </div>
          <button className="b bp" style={{ width: '100%' }} onClick={goBack}>
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="scr-wrap">
      {H('Accusative Case', 'Direct objects, animate/inanimate, motion prepositions', goBack)}
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
            <strong>{chosen === cur.answer ? 'Correct!' : 'Incorrect.'}</strong> {cur.tip}
          </div>
        )}
        {answered && (
          <button className="b bp" style={{ width: '100%', marginTop: 16 }} onClick={next}>
            {idx + 1 >= total ? 'See results' : 'Next'}
          </button>
        )}
      </div>
    </div>
  );
}
