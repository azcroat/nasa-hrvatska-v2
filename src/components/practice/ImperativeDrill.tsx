import React, { useState, useRef } from 'react';
import { H, Bar } from '../../data';
import { markQuest } from '../../lib/quests.js';

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
    q: "'Speak!' (informal, govoriti)",
    opts: ['Govori!', 'Govorite!', 'Govoriti!', 'Govoriš!'],
    answer: 'Govori!',
    en: 'Speak! (to one person)',
    tip: "govoriti → stem 'govor' + i → 'govori'",
  },
  {
    q: "'Don't run!' (informal, trčati)",
    opts: ['Nemoj trčati!', 'Trčaj!', 'Trčiti moraš!', 'Trčiš se!'],
    answer: 'Nemoj trčati!',
    en: "Don't run!",
    tip: 'Negative imperative: nemoj + infinitive is the standard form',
  },
  {
    q: "'Come here!' (plural/formal, doći)",
    opts: ['Dođite ovamo!', 'Dođi ovamo!', 'Dolazite ovamo!', 'Dođemo ovamo!'],
    answer: 'Dođite ovamo!',
    en: 'Come here! (to a group)',
    tip: 'doći → irregular: dođi (sg) / dođite (pl/formal)',
  },
  {
    q: "'Eat!' (informal, jesti)",
    opts: ['Jedi!', 'Jedite!', 'Jesti!', 'Jedeš!'],
    answer: 'Jedi!',
    en: 'Eat! (to one person)',
    tip: "jesti → stem 'jed' + i → 'jedi'",
  },
  {
    q: "'Write your name!' (plural, pisati)",
    opts: ['Napišite svoje ime!', 'Napiši svoje ime!', 'Pisajte svoje ime!', 'Pisajući svoje ime!'],
    answer: 'Napišite svoje ime!',
    en: 'Write your name! (to a group)',
    tip: 'pisati (perfective: napisati) → napišite for plural',
  },
  {
    q: "'Be quiet!' (informal, biti tih)",
    opts: ['Budi tih!', 'Budite tih!', 'Budi tiho!', 'Budi tiha!'],
    answer: 'Budi tiho!',
    en: 'Be quiet! (neuter/command)',
    tip: "biti → budi (sg) / budite (pl). 'tiho' is the adverb form here",
  },
  {
    q: "'Go home!' (informal, ići)",
    opts: ['Idi kući!', 'Idite kući!', 'Idem kući!', 'Idi doma!'],
    answer: 'Idi kući!',
    en: 'Go home! (to one person)',
    tip: 'ići → irregular: idi (sg) / idite (pl)',
  },
  {
    q: "'Listen to me!' (plural, slušati)",
    opts: ['Slušajte me!', 'Slušaj me!', 'Slušate me!', 'Slušajući me!'],
    answer: 'Slušajte me!',
    en: 'Listen to me! (to a group)',
    tip: 'slušati → slušaj (sg) / slušajte (pl)',
  },
  {
    q: "'Take this!' (informal, uzeti)",
    opts: ['Uzmi ovo!', 'Uzmite ovo!', 'Uzimaj ovo!', 'Uzeo ovo!'],
    answer: 'Uzmi ovo!',
    en: 'Take this! (to one person)',
    tip: 'uzeti → irregular: uzmi (sg) / uzmite (pl)',
  },
  {
    q: "'Don't worry!' (informal, brinuti se)",
    opts: ['Nemoj se brinuti!', 'Ne brini se!', 'Ne briniš se!', 'Nemoj brinuti!'],
    answer: 'Nemoj se brinuti!',
    en: "Don't worry!",
    tip: 'Negative: nemoj + infinitive (nemoj se brinuti) is preferred',
  },
  {
    q: "'Open the door!' (informal, otvoriti)",
    opts: ['Otvori vrata!', 'Otvorite vrata!', 'Otvaranje vrata!', 'Otvaraj vrata!'],
    answer: 'Otvori vrata!',
    en: 'Open the door! (to one person)',
    tip: "otvoriti (pf) → stem 'otvori' + i → 'otvori'",
  },
  {
    q: "'Wait!' (plural/formal, čekati)",
    opts: ['Čekajte!', 'Čekaj!', 'Čekate!', 'Čekajući!'],
    answer: 'Čekajte!',
    en: 'Wait! (formal/plural)',
    tip: 'čekati → čekaj (sg) / čekajte (pl)',
  },
  {
    q: "'Look at this!' (informal, pogledati)",
    opts: ['Pogledaj ovo!', 'Pogledajte ovo!', 'Gleda ovo!', 'Gledaj ovo!'],
    answer: 'Pogledaj ovo!',
    en: 'Look at this! (to one person)',
    tip: "pogledati (pf) → stem 'pogleda' + j → 'pogledaj'",
  },
  {
    q: "'Travel safely!' (plural, putovati)",
    opts: ['Putujte sigurno!', 'Putuj sigurno!', 'Putujući sigurno!', 'Putovajte sigurno!'],
    answer: 'Putujte sigurno!',
    en: 'Travel safely! (to a group)',
    tip: 'putovati → putuj (sg) / putujte (pl)',
  },
  {
    q: "'Don't forget!' (informal, zaboraviti)",
    opts: ['Nemoj zaboraviti!', 'Ne zaboravi!', 'Zaboraviš ne!', 'Ne zaboravljaj!'],
    answer: 'Nemoj zaboraviti!',
    en: "Don't forget!",
    tip: "Negative imperative with 'nemoj' + infinitive",
  },
  {
    q: "'Sit down!' (informal, sjesti)",
    opts: ['Sjedni!', 'Sjednite!', 'Sjediš!', 'Sjedi!'],
    answer: 'Sjedni!',
    en: 'Sit down! (to one person)',
    tip: 'sjesti → irregular: sjedni (sg) / sjednite (pl)',
  },
  {
    q: "'Help me!' (informal, pomoći)",
    opts: ['Pomozi mi!', 'Pomozite mi!', 'Pomaži mi!', 'Pomogni mi!'],
    answer: 'Pomozi mi!',
    en: 'Help me! (to one person)',
    tip: 'pomoći → irregular: pomozi (sg) / pomozite (pl)',
  },
  {
    q: "'Please be careful!' (plural, biti pažljiv)",
    opts: ['Budite pažljivi!', 'Budi pažljiv!', 'Budite pažljiv!', 'Pažljivi!'],
    answer: 'Budite pažljivi!',
    en: 'Please be careful! (to a group)',
    tip: 'biti → budite (pl formal). Adjective agrees: pažljivi (pl)',
  },
  {
    q: "'Call me!' (informal, nazvati)",
    opts: ['Nazovi me!', 'Nazvite me!', 'Nazovite me!', 'Nazovim me!'],
    answer: 'Nazovi me!',
    en: 'Call me! (to one person)',
    tip: 'nazvati (pf) → nazovi (sg) / nazovite (pl)',
  },
  {
    q: "'Hurry up!' (informal, požuriti)",
    opts: ['Požuri!', 'Požurite!', 'Žuri se!', 'Požuruj!'],
    answer: 'Požuri!',
    en: 'Hurry up! (to one person)',
    tip: "požuriti → stem 'požuri' + i → 'požuri'",
  },
  {
    q: "'Learn Croatian!' (informal, učiti)",
    opts: ['Uči hrvatski!', 'Učite hrvatski!', 'Učiš hrvatski!', 'Učenje hrvatskog!'],
    answer: 'Uči hrvatski!',
    en: 'Learn Croatian! (to one person)',
    tip: "učiti → stem 'uč' + i → 'uči'",
  },
  {
    q: "'Don't be late!' (formal/plural, kasniti)",
    opts: ['Nemojte kasniti!', 'Nemoj kasniti!', 'Ne kasnite!', 'Ne kasni!'],
    answer: 'Nemojte kasniti!',
    en: "Don't be late! (formal/plural)",
    tip: 'Plural negative: nemojte + infinitive',
  },
];

interface Props {
  goBack: () => void;
  award?: (xp: number, celebrate?: boolean, activityType?: string) => void;
}
export default function ImperativeDrill({ goBack, award }: Props) {
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
        {H('⚡ Imperative Drill', 'Commands — the essential production skill', goBack)}
        <div className="c" style={{ marginTop: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            {score} / {total}
          </div>
          <div style={{ fontSize: 15, color: '#64748b', marginBottom: 16 }}>
            {score === total
              ? 'Flawless! Command the language! 🏆'
              : score >= total * 0.8
                ? 'Strong work on imperatives! 💪'
                : 'Keep practising those command forms!'}
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
      {H('⚡ Imperative Drill', 'Commands — the essential production skill', goBack)}
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
          Choose the correct imperative
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
