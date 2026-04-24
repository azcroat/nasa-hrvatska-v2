import React, { useState, useRef } from 'react';
import { H, Bar } from '../../data';
import { markQuest } from '../../lib/quests.js';

import { rnd } from '../../lib/random.js';
function shLocal<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const tmp = b[i] as T;
    b[i] = b[j] as T;
    b[j] = tmp;
  }
  return b;
}

const DATA = [
  {
    affirm: 'Imam brata.',
    neg_prompt: "I don't have a brother.",
    opts: ['Nemam brata.', 'Nemam brat.', 'Nemam bratu.', 'Nemam bratom.'],
    answer: 'Nemam brata.',
    en: "I don't have a brother.",
    tip: "'brat' (animate masc) — accusative and genitive singular look the same: 'brata'",
  },
  {
    affirm: 'Vidim auto.',
    neg_prompt: "I don't see the car.",
    opts: ['Ne vidim auta.', 'Ne vidim auto.', 'Ne vidim autu.', 'Ne vidim autom.'],
    answer: 'Ne vidim auta.',
    en: "I don't see the car.",
    tip: "'auto' (inanimate masc) → accusative = nominative ('auto') but genitive = 'auta'",
  },
  {
    affirm: 'Imam novac.',
    neg_prompt: "I don't have money.",
    opts: ['Nemam novca.', 'Nemam novac.', 'Nemam novcu.', 'Nemam novcem.'],
    answer: 'Nemam novca.',
    en: "I don't have money.",
    tip: "'novac' (masc inanimate) → genitive 'novca'. Negation triggers genitive!",
  },
  {
    affirm: 'Čitam knjigu.',
    neg_prompt: "I'm not reading a book.",
    opts: ['Ne čitam knjige.', 'Ne čitam knjigu.', 'Ne čitam knjizi.', 'Ne čitam knjiga.'],
    answer: 'Ne čitam knjige.',
    en: "I'm not reading a book.",
    tip: "'knjiga' (fem) → accusative 'knjigu' → genitive 'knjige'",
  },
  {
    affirm: 'Imam vremena.',
    neg_prompt: "I don't have time.",
    opts: ['Nemam vremena.', 'Nemam vreme.', 'Nemam vremenu.', 'Nemam vremenom.'],
    answer: 'Nemam vremena.',
    en: "I don't have time.",
    tip: "'vrijeme' (neuter) → genitive 'vremena'. Already genitive even affirmatively (partitive use)!",
  },
  {
    affirm: 'Pijem kavu.',
    neg_prompt: "I'm not drinking coffee.",
    opts: ['Ne pijem kave.', 'Ne pijem kavu.', 'Ne pijem kavi.', 'Ne pijem kavom.'],
    answer: 'Ne pijem kave.',
    en: "I'm not drinking coffee.",
    tip: "'kava' (fem) → accusative 'kavu' → genitive 'kave'",
  },
  {
    affirm: 'Imam sestru.',
    neg_prompt: "I don't have a sister.",
    opts: ['Nemam sestre.', 'Nemam sestru.', 'Nemam sestri.', 'Nemam sestrom.'],
    answer: 'Nemam sestre.',
    en: "I don't have a sister.",
    tip: "'sestra' (fem) → accusative 'sestru' → genitive 'sestre'",
  },
  {
    affirm: 'Znam odgovor.',
    neg_prompt: "I don't know the answer.",
    opts: ['Ne znam odgovora.', 'Ne znam odgovor.', 'Ne znam odgovoru.', 'Ne znam odgovorom.'],
    answer: 'Ne znam odgovora.',
    en: "I don't know the answer.",
    tip: "'odgovor' (masc inanimate) → genitive 'odgovora'",
  },
  {
    affirm: 'Tražim posao.',
    neg_prompt: "I'm not looking for a job.",
    opts: ['Ne tražim posla.', 'Ne tražim posao.', 'Ne tražim poslu.', 'Ne tražim poslom.'],
    answer: 'Ne tražim posla.',
    en: "I'm not looking for a job.",
    tip: "'posao' (masc inanimate) → genitive 'posla'. Note vowel drop: posao → posl-",
  },
  {
    affirm: 'Kuham večeru.',
    neg_prompt: "I'm not cooking dinner.",
    opts: ['Ne kuham večere.', 'Ne kuham večeru.', 'Ne kuham večeri.', 'Ne kuham večerom.'],
    answer: 'Ne kuham večere.',
    en: "I'm not cooking dinner.",
    tip: "'večera' (fem) → accusative 'večeru' → genitive 'večere'",
  },
  {
    affirm: 'Imam ideju.',
    neg_prompt: "I don't have an idea.",
    opts: ['Nemam ideje.', 'Nemam ideju.', 'Nemam ideji.', 'Nemam idejom.'],
    answer: 'Nemam ideje.',
    en: "I don't have an idea.",
    tip: "'ideja' (fem) → accusative 'ideju' → genitive 'ideje'",
  },
  {
    affirm: 'Vidim more.',
    neg_prompt: "I don't see the sea.",
    opts: ['Ne vidim mora.', 'Ne vidim more.', 'Ne vidim moru.', 'Ne vidim morima.'],
    answer: 'Ne vidim mora.',
    en: "I don't see the sea.",
    tip: "'more' (neuter) → genitive 'mora'",
  },
  {
    affirm: 'Tražim ključ.',
    neg_prompt: "I'm not looking for the key.",
    opts: ['Ne tražim ključa.', 'Ne tražim ključ.', 'Ne tražim ključu.', 'Ne tražim ključem.'],
    answer: 'Ne tražim ključa.',
    en: "I'm not looking for the key.",
    tip: "'ključ' (masc inanimate) → genitive 'ključa'",
  },
  {
    affirm: 'Imam stan.',
    neg_prompt: "I don't have an apartment.",
    opts: ['Nemam stana.', 'Nemam stan.', 'Nemam stanu.', 'Nemam stanom.'],
    answer: 'Nemam stana.',
    en: "I don't have an apartment.",
    tip: "'stan' (masc inanimate) → genitive 'stana'",
  },
  {
    affirm: 'Čujem glazbu.',
    neg_prompt: "I don't hear the music.",
    opts: ['Ne čujem glazbe.', 'Ne čujem glazbu.', 'Ne čujem glazbi.', 'Ne čujem glazbom.'],
    answer: 'Ne čujem glazbe.',
    en: "I don't hear the music.",
    tip: "'glazba' (fem) → accusative 'glazbu' → genitive 'glazbe'",
  },
  {
    affirm: 'Imam dječaka.',
    neg_prompt: "I don't have a boy.",
    opts: ['Nemam dječaka.', 'Nemam dječak.', 'Nemam dječaku.', 'Nemam dječakom.'],
    answer: 'Nemam dječaka.',
    en: "I don't have a boy.",
    tip: "'dječak' (masc animate) → accusative and genitive look the same: 'dječaka'",
  },
  {
    affirm: 'Znam rješenje.',
    neg_prompt: "I don't know the solution.",
    opts: ['Ne znam rješenja.', 'Ne znam rješenje.', 'Ne znam rješenju.', 'Ne znam rješenjem.'],
    answer: 'Ne znam rješenja.',
    en: "I don't know the solution.",
    tip: "'rješenje' (neuter) → genitive 'rješenja'",
  },
  {
    affirm: 'Pijem vodu.',
    neg_prompt: "I'm not drinking water.",
    opts: ['Ne pijem vode.', 'Ne pijem vodu.', 'Ne pijem vodi.', 'Ne pijem vodom.'],
    answer: 'Ne pijem vode.',
    en: "I'm not drinking water.",
    tip: "'voda' (fem) → accusative 'vodu' → genitive 'vode'",
  },
  {
    affirm: 'Imam prijatelja.',
    neg_prompt: "I don't have a friend.",
    opts: ['Nemam prijatelja.', 'Nemam prijatelj.', 'Nemam prijatelju.', 'Nemam prijateljem.'],
    answer: 'Nemam prijatelja.',
    en: "I don't have a friend.",
    tip: "'prijatelj' (masc animate) → accusative and genitive sg look the same: 'prijatelja'",
  },
  {
    affirm: 'Tražim taksi.',
    neg_prompt: "I'm not looking for a taxi.",
    opts: ['Ne tražim taksija.', 'Ne tražim taksi.', 'Ne tražim taksiju.', 'Ne tražim taksijem.'],
    answer: 'Ne tražim taksija.',
    en: "I'm not looking for a taxi.",
    tip: "'taksi' (masc inanimate, foreign) → genitive 'taksija'",
  },
];

export default function NegationGenDrill({
  goBack,
  award,
}: {
  goBack: () => void;
  award?: (xp: number) => void;
}) {
  const finishFired = useRef(false);
  const [q] = useState(() => shLocal(DATA));
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
        if (award) award(score * 5);
        markQuest('grammar');
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
        {H('❌ Genitive of Negation', 'Negate correctly — accusative shifts to genitive', goBack)}
        <div className="c" style={{ marginTop: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            {score} / {total}
          </div>
          <div style={{ fontSize: 15, color: '#64748b', marginBottom: 16 }}>
            {score === total
              ? 'Perfect! Genitive of negation mastered! 🏆'
              : score >= total * 0.8
                ? 'Great feel for negation! 💪'
                : 'Keep practising — this rule is tricky but crucial!'}
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
      {H('❌ Genitive of Negation', 'Negate correctly — accusative shifts to genitive', goBack)}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
        <span style={{ fontSize: 13, color: '#64748b', whiteSpace: 'nowrap' }}>
          {idx + 1} / {total}
        </span>
        <Bar v={idx + 1} mx={total} />
      </div>
      <div className="c" style={{ marginTop: 16 }}>
        <div
          style={{
            background: '#dcfce7',
            borderRadius: 12,
            padding: '12px 16px',
            marginBottom: 12,
            fontSize: 16,
            fontWeight: 700,
            color: '#166534',
            border: '1.5px solid #86efac',
          }}
        >
          ✅ {cur.affirm}
        </div>
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
          How do you negate this?
        </div>
        <div style={{ fontSize: 17, fontWeight: 600, color: '#0e7490', lineHeight: 1.5 }}>
          {cur.neg_prompt}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 16 }}>
          {cur.opts.map((opt) => {
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
