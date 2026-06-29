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

// B2 — subordinate clauses: choosing the right subordinating conjunction
// (concessive, causal, temporal, final, conditional) and relative pronoun (koji)
// in the correct case for complex sentences.
const DATA = [
  {
    q: 'Došao je ___ je padala kiša. (although)',
    opts: ['iako', 'jer', 'dok', 'ako'],
    answer: 'iako',
    en: 'He came although it was raining.',
    tip: "Concessive 'iako' = although. 'jer' = because, 'dok' = while, 'ako' = if.",
  },
  {
    q: 'Ostani kod kuće ___ ne ozdraviš. (until)',
    opts: ['dok', 'čim', 'jer', 'iako'],
    answer: 'dok',
    en: 'Stay home until you recover.',
    tip: "'dok ne' + present = until. 'čim' = as soon as.",
  },
  {
    q: 'Učim hrvatski ___ mogu razgovarati s rodbinom. (so that)',
    opts: ['da', 'jer', 'iako', 'dok'],
    answer: 'da',
    en: 'I study Croatian so that I can talk with relatives.',
    tip: "Final clause 'da' + present = so that / in order to.",
  },
  {
    q: '___ je bila umorna, nastavila je raditi. (even though)',
    opts: ['Iako', 'Budući da', 'Čim', 'Ako'],
    answer: 'Iako',
    en: 'Even though she was tired, she kept working.',
    tip: "Concessive at clause start: 'Iako'. 'Budući da' = since/because.",
  },
  {
    q: '___ nemam vremena, ne mogu doći. (because — formal)',
    opts: ['Budući da', 'Iako', 'Dok', 'Da'],
    answer: 'Budući da',
    en: 'Since I have no time, I cannot come.',
    tip: "'Budući da' = since/because (formal causal, clause-initial).",
  },
  {
    q: 'Nazovi me ___ stigneš. (as soon as)',
    opts: ['čim', 'dok', 'iako', 'jer'],
    answer: 'čim',
    en: 'Call me as soon as you arrive.',
    tip: "'čim' = as soon as (temporal).",
  },
  {
    q: 'Čovjek ___ sam jučer vidio je nestao. (whom — acc., animate)',
    opts: ['kojeg', 'koji', 'koje', 'kojem'],
    answer: 'kojeg',
    en: 'The man whom I saw yesterday disappeared.',
    tip: 'Relative pronoun, masc. animate direct object → accusative = genitive form: kojeg.',
  },
  {
    q: 'Žena ___ pomažem je susjeda. (whom — dative)',
    opts: ['kojoj', 'koju', 'koja', 'koje'],
    answer: 'kojoj',
    en: 'The woman whom I help is a neighbour.',
    tip: "pomagati takes dative → relative pronoun feminine dative: 'kojoj'.",
  },
  {
    q: 'Knjiga ___ čitam je zanimljiva. (which — acc.)',
    opts: ['koju', 'koja', 'koje', 'kojom'],
    answer: 'koju',
    en: 'The book which I am reading is interesting.',
    tip: 'Feminine inanimate direct object → accusative: koju (knjigu → koju).',
  },
  {
    q: 'Reci mi ___ si zakasnio. (why)',
    opts: ['zašto', 'jer', 'da', 'iako'],
    answer: 'zašto',
    en: 'Tell me why you were late.',
    tip: "Indirect question uses 'zašto' (why); 'jer' only answers, never asks.",
  },
  {
    q: 'Radit ću ___ ti pomognem. (in order to)',
    opts: ['kako bih', 'jer', 'iako', 'dok'],
    answer: 'kako bih',
    en: 'I will work in order to help you.',
    tip: "Purpose with conditional: 'kako bih' + participle = in order to (1sg).",
  },
  {
    q: 'Ne znam ___ će doći. (whether/if)',
    opts: ['hoće li', 'ako', 'iako', 'jer'],
    answer: 'hoće li',
    en: "I don't know whether he will come.",
    tip: "Indirect yes/no question = verb + 'li' ('hoće li'); 'ako' is conditional, not 'whether'.",
  },
];

interface Props {
  goBack: () => void;
  award?: (xp: number, celebrate?: boolean, activityType?: string) => void;
}

export default function SubordinationDrill({ goBack, award }: Props) {
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
          key: 'subordination',
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
        {H('🔗 Subordinate Clauses', 'Conjunctions and relative pronouns', goBack)}
        <div className="c" style={{ marginTop: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>{passed ? '🎉' : '📚'}</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            {score} / {total}
          </div>
          <div style={{ fontSize: 15, color: '#64748b', marginBottom: 16 }}>
            {score === total
              ? 'Perfect! Complex sentences mastered! 🏆'
              : score >= total * 0.8
                ? 'Great work! 💪'
                : 'Keep practising — conjunctions take time!'}
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
      {H('🔗 Subordinate Clauses', 'Conjunctions and relative pronouns', goBack)}
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
