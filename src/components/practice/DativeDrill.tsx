import React, { useState, useRef } from 'react';
import { H, Bar } from '../../data';
import { markQuest } from '../../lib/quests.js';
import { useStats } from '../../context/StatsContext';
import { rnd } from '../../lib/random.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    q: 'Dajem poklon ___.',
    opts: ['bratu', 'brata', 'brat', 'bratom'],
    answer: 'bratu',
    en: 'I give a gift to my brother.',
    tip: 'Indirect object takes dative: brat + -u → bratu',
  },
  {
    q: 'Pomažem ___.',
    opts: ['mami', 'mama', 'mame', 'mamom'],
    answer: 'mami',
    en: 'I am helping my mom.',
    tip: "'pomoći' takes dative: mama → drop -a + -i → mami",
  },
  {
    q: 'Šaljem poruku ___.',
    opts: ['učitelju', 'učitelja', 'učiteljem', 'učitelj'],
    answer: 'učitelju',
    en: 'I am sending a message to the teacher.',
    tip: 'Indirect object: učitelj (soft -lj) → dative: učitelju',
  },
  {
    q: 'Sviđa mi se ___.',
    opts: ['gradu', 'grad', 'grada', 'gradom'],
    answer: 'gradu',
    en: 'I like the city. (The city pleases me.)',
    tip: "'sviđati se' uses dative for subject: grad + -u → gradu",
  },
  {
    q: 'Pišem pismo ___.',
    opts: ['sestri', 'sestra', 'sestre', 'sestrom'],
    answer: 'sestri',
    en: 'I am writing a letter to my sister.',
    tip: 'Indirect object: sestra → drop -a + -i → sestri',
  },
  {
    q: 'Zahvaljujem ___.',
    opts: ['prijatelju', 'prijatelja', 'prijateljem', 'prijatelj'],
    answer: 'prijatelju',
    en: 'I thank my friend.',
    tip: "'zahvaliti' takes dative: prijatelj → prijatelju",
  },
  {
    q: 'Kupujem tortu ___.',
    opts: ['sinu', 'sina', 'sin', 'sinom'],
    answer: 'sinu',
    en: 'I am buying a cake for my son.',
    tip: 'Indirect object (for whom): sin + -u → sinu',
  },
  {
    q: 'Vjerujem ___.',
    opts: ['prijatelju', 'prijatelja', 'prijateljem', 'prijatelj'],
    answer: 'prijatelju',
    en: 'I believe my friend.',
    tip: "'vjerovati' takes dative: prijatelj → prijatelju",
  },
  {
    q: 'Govorim ___.',
    opts: ['djetetu', 'dijete', 'djeteta', 'djetetom'],
    answer: 'djetetu',
    en: 'I am speaking to the child.',
    tip: 'Indirect object: dijete (neut) → dative: djetetu',
  },
  {
    q: 'Treba mi pomoć ___.',
    opts: ['liječniku', 'liječnika', 'liječnik', 'liječnikom'],
    answer: 'liječniku',
    en: 'The doctor needs my help.',
    tip: "'trebati' takes dative for the person who needs: liječnik + -u → liječniku",
  },
  {
    q: 'Daje novac ___.',
    opts: ['ženi', 'žena', 'žene', 'ženom'],
    answer: 'ženi',
    en: 'He gives money to the woman.',
    tip: 'Indirect object: žena → drop -a + -i → ženi',
  },
  {
    q: 'Idemo prema ___.',
    opts: ['moru', 'more', 'mora', 'morem'],
    answer: 'moru',
    en: 'We are going towards the sea.',
    tip: "'prema' (towards) takes dative: more (neuter) → moru",
  },
  {
    q: 'Hvala ___!',
    opts: ['svima', 'svi', 'sve', 'svakom'],
    answer: 'svima',
    en: 'Thank you to everyone!',
    tip: "'hvala' takes dative: svi → dative plural: svima",
  },
  {
    q: 'Koliko je godina ___?',
    opts: ['tebi', 'ti', 'tebe', 'tobom'],
    answer: 'tebi',
    en: 'How old are you?',
    tip: "Age expression uses dative. Long form 'tebi' in question position.",
  },
  {
    q: 'Nasuprot ___.',
    opts: ['kući', 'kuća', 'kuće', 'kućom'],
    answer: 'kući',
    en: 'Opposite the house.',
    tip: "'nasuprot' (opposite) takes dative: kuća → drop -a + -i → kući",
  },
  {
    q: 'Šaljem poruku ___.',
    opts: ['tati', 'tata', 'tate', 'tatom'],
    answer: 'tati',
    en: 'I am sending a message to my dad.',
    tip: 'Indirect object: tata (masc -a noun) → drop -a + -i → tati',
  },
  {
    q: 'Pomaže li ___?',
    opts: ['djeci', 'dijete', 'djece', 'djecom'],
    answer: 'djeci',
    en: 'Does she help the children?',
    tip: "'pomoći' + dative: djeca → djeci (irregular plural dative)",
  },
  {
    q: 'Recite ___.',
    opts: ['meni', 'ja', 'mene', 'mnom'],
    answer: 'meni',
    en: 'Tell me! (emphatic)',
    tip: "Long dative pronoun for emphasis: 'meni'. Short clitic form: 'mi'.",
  },
  {
    q: 'Slat ću pismo ___.',
    opts: ['mami', 'mama', 'mame', 'mamom'],
    answer: 'mami',
    en: 'I will send a letter to mom.',
    tip: 'Indirect object: mama → drop -a + -i → mami',
  },
  {
    q: 'Pišem ___.',
    opts: ['prijatelju', 'prijatelja', 'prijateljem', 'prijatelj'],
    answer: 'prijatelju',
    en: 'I am writing to my friend.',
    tip: "'pisati' (to write to) takes dative: prijatelj → prijatelju",
  },
];

interface Props {
  goBack: () => void;
  award?: (xp: number, celebrate?: boolean, activityType?: string) => void;
}

export default function DativeDrill({ goBack, award }: Props) {
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
        if (!stats.vs?.includes('dative')) {
          setStats((prev) => {
            if (prev.vs?.includes('dative')) return prev;
            return { ...prev, gc: (prev.gc || 0) + 1, vs: [...(prev.vs || []), 'dative'] };
          });
          if (writeDelta) writeDelta({ gc: 1, vs: ['dative'] });
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
        {H('🤝 Dative Case', 'Indirect objects, giving, helping, liking', goBack)}
        <div className="c" style={{ marginTop: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            {score} / {total}
          </div>
          <div style={{ fontSize: 15, color: '#64748b', marginBottom: 16 }}>
            {score === total
              ? 'Perfect! Dative mastered! 🏆'
              : score >= total * 0.8
                ? 'Great work! 💪'
                : 'Keep practising — dative is essential!'}
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
      {H('🤝 Dative Case', 'Indirect objects, giving, helping, liking', goBack)}
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
