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
  // l → o in past tense (masculine singular)
  {
    q: 'On ___ cijelu noć. (pisati = to write)',
    opts: ['pisao', 'pišao', 'pisali', 'pisal'],
    answer: 'pisao',
    en: 'He wrote all night.',
    tip: 'Masc past tense l→o: pisati → pisa-l → pisa-o = pisao',
  },
  {
    q: 'On ___ svaki dan. (čitati = to read)',
    opts: ['čitao', 'čital', 'čitali', 'čitaje'],
    answer: 'čitao',
    en: 'He read every day.',
    tip: 'l→o: čitati → čita-l → čita-o = čitao',
  },
  {
    q: 'On ___ u tvornici. (raditi = to work)',
    opts: ['radio', 'radil', 'radili', 'radijo'],
    answer: 'radio',
    en: 'He worked in the factory.',
    tip: 'l→o: raditi → radi-l → radi-o = radio',
  },
  {
    q: 'On ___ kuću. (graditi = to build)',
    opts: ['gradio', 'gradil', 'gradili', 'gradijo'],
    answer: 'gradio',
    en: 'He built a house.',
    tip: 'l→o: graditi → gradi-l → gradi-o = gradio',
  },
  {
    q: 'On ___ bolestan. (biti = to be)',
    opts: ['bio', 'bil', 'bilio', 'bili'],
    answer: 'bio',
    en: 'He was sick.',
    tip: 'biti → bi-l → bi-o = bio. The most important l→o: bio/bila/bilo',
  },
  {
    q: 'On ___ u školu. (ići = to go)',
    opts: ['išao', 'išal', 'išali', 'išo'],
    answer: 'išao',
    en: 'He went to school.',
    tip: 'ići → irregular: iš-ao. Note the stem change: ići → išao',
  },
  {
    q: 'On ___ film. (gledati = to watch)',
    opts: ['gledao', 'gledo', 'gledal', 'gledali'],
    answer: 'gledao',
    en: 'He watched the film.',
    tip: 'l→o: gledati → gleda-l → gleda-o = gledao',
  },
  {
    q: 'On ___ hrvatski. (govoriti = to speak)',
    opts: ['govorio', 'govori', 'govorili', 'govorijo'],
    answer: 'govorio',
    en: 'He spoke Croatian.',
    tip: 'l→o: govoriti → govori-l → govori-o = govorio',
  },
  {
    q: 'On ___ na odmor. (doći = to come/arrive)',
    opts: ['došao', 'doći', 'došli', 'došo'],
    answer: 'došao',
    en: 'He arrived on vacation.',
    tip: 'doći → irregular: došao. Major irregular verb — memorise this form.',
  },
  {
    q: 'On ___ more. (vidjeti = to see)',
    opts: ['vidio', 'vidjel', 'vidjeli', 'vidijo'],
    answer: 'vidio',
    en: 'He saw the sea.',
    tip: 'l→o: vidjeti → vidi-l → vidi-o = vidio',
  },
  // Fleeting-a in nouns (mobile vowel)
  {
    q: "Genitive singular of 'otac' (father) is:",
    opts: ['oca', 'otaca', 'otca', 'ocu'],
    answer: 'oca',
    en: 'of the father',
    tip: "Fleeting-a: otac → the -a- between 't' and 'c' disappears → oc- + -a → oca",
  },
  {
    q: "Accusative of 'pisac' (writer, animate) is:",
    opts: ['pisca', 'pisac', 'pisacu', 'piscem'],
    answer: 'pisca',
    en: 'the writer (as object)',
    tip: 'Fleeting-a: pisac → pisc- (drop -a-) → pisca (accusative = genitive for animate)',
  },
  {
    q: "Dative singular of 'lonac' (pot) is:",
    opts: ['loncu', 'lonac', 'lonca', 'loncem'],
    answer: 'loncu',
    en: 'to the pot',
    tip: 'Fleeting-a: lonac → lonc- (drop -a-) → loncu (dative: -u)',
  },
  {
    q: "Genitive singular of 'vjetar' (wind) is:",
    opts: ['vjetra', 'vjetara', 'vjetru', 'vjetrom'],
    answer: 'vjetra',
    en: 'of the wind',
    tip: "Fleeting-a: vjetar → vjetr- (the -a- between 't' and 'r' disappears) → vjetra",
  },
  {
    q: "Genitive singular of 'san' (dream/sleep) is:",
    opts: ['sna', 'sana', 'snu', 'snom'],
    answer: 'sna',
    en: 'of the dream',
    tip: 'Fleeting-a: san → the -a- drops → sn- + -a → sna',
  },
  // Fleeting-a in adjectives
  {
    q: "Feminine form of 'dobar' (good) is:",
    opts: ['dobra', 'dobara', 'dobrim', 'dobrih'],
    answer: 'dobra',
    en: 'good (feminine)',
    tip: "Fleeting-a in adjective: dobar → the -a- between 'b' and 'r' drops → dobr- + -a → dobra",
  },
  {
    q: "Feminine form of 'slobodan' (free) is:",
    opts: ['slobodna', 'slobodana', 'slobodnoj', 'slobodnih'],
    answer: 'slobodna',
    en: 'free (feminine)',
    tip: 'Fleeting-a: slobodan → the -a- before -n drops → slobodn- + -a → slobodna',
  },
  {
    q: "Feminine form of 'bistar' (clear/bright) is:",
    opts: ['bistra', 'bistara', 'bistrom', 'bistrih'],
    answer: 'bistra',
    en: 'clear/bright (feminine)',
    tip: "Fleeting-a: bistar → the -a- between 't' and 'r' drops → bistr- + -a → bistra",
  },
];

interface Props {
  goBack: () => void;
  award?: (xp: number, celebrate?: boolean, activityType?: string) => void;
}

export default function FleetingADrill({ goBack, award }: Props) {
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
        if (!stats.vs?.includes('fleetinga')) {
          setStats((prev) => {
            if (prev.vs?.includes('fleetinga')) return prev;
            return { ...prev, gc: (prev.gc || 0) + 1, vs: [...(prev.vs || []), 'fleetinga'] };
          });
          if (writeDelta) writeDelta({ gc: 1, vs: ['fleetinga'] });
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
        {H('✨ Fleeting-A & L→O', 'Mobile vowels and past tense l→o changes', goBack)}
        <div className="c" style={{ marginTop: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            {score} / {total}
          </div>
          <div style={{ fontSize: 15, color: '#64748b', marginBottom: 16 }}>
            {score === total
              ? 'Perfect! C1 phonology mastered! 🏆'
              : score >= total * 0.8
                ? 'Great work! 💪'
                : 'Keep at it — these patterns become automatic!'}
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
      {H('✨ Fleeting-A & L→O', 'Mobile vowels and past tense l→o changes', goBack)}
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
          Choose the correct form
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
