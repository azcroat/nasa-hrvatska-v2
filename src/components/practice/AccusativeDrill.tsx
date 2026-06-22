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
    q: 'Vidim ___.',
    opts: ['brata', 'brat', 'bratu', 'bratom'],
    answer: 'brata',
    en: 'I see my brother.',
    tip: 'Animate masc accusative = genitive form: brat → brata.',
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
    tip: "Animate masc 'pas' has a fleeting -a-; accusative = genitive: psa.",
  },
  {
    q: 'Kupujem ___.',
    opts: ['auto', 'autom', 'auta', 'autu'],
    answer: 'auto',
    en: "I'm buying a car.",
    tip: "'auto' is indeclinable in standard Croatian — accusative = nominative.",
  },
  {
    q: 'Pozivam ___.',
    opts: ['prijatelja', 'prijatelj', 'prijatelju', 'prijateljem'],
    answer: 'prijatelja',
    en: "I'm inviting my friend.",
    tip: 'Animate masc accusative = genitive: prijatelj → prijatelja.',
  },
  {
    q: 'Jedem ___.',
    opts: ['juhu', 'juha', 'juhi', 'juhom'],
    answer: 'juhu',
    en: "I'm eating soup.",
    tip: 'Fem nouns in -a take -u in the accusative: juha → juhu.',
  },
  {
    q: 'Pijem ___.',
    opts: ['kavu', 'kava', 'kavi', 'kavom'],
    answer: 'kavu',
    en: "I'm drinking coffee.",
    tip: 'Fem -a → -u: kava → kavu.',
  },
  {
    q: 'Čitam ___.',
    opts: ['knjigu', 'knjiga', 'knjizi', 'knjigom'],
    answer: 'knjigu',
    en: "I'm reading a book.",
    tip: 'Fem -a → -u: knjiga → knjigu.',
  },
  {
    q: 'Vidim ___ na ulici.',
    opts: ['Anu', 'Ana', 'Ani', 'Anom'],
    answer: 'Anu',
    en: 'I see Ana on the street.',
    tip: 'Fem names ending in -a take -u: Ana → Anu.',
  },
  {
    q: 'Kuham ___.',
    opts: ['večeru', 'večera', 'večeri', 'večerom'],
    answer: 'večeru',
    en: "I'm cooking dinner.",
    tip: 'Fem -a → -u: večera → večeru.',
  },
  {
    q: 'Imam ___.',
    opts: ['sestru', 'sestra', 'sestre', 'sestrom'],
    answer: 'sestru',
    en: 'I have a sister.',
    tip: "'imati' takes the accusative — fem sestra → sestru.",
  },
  {
    q: 'Volim ___ ljeti.',
    opts: ['more', 'mora', 'moru', 'morem'],
    answer: 'more',
    en: 'I love the sea in summer.',
    tip: 'Neut nouns in -e: accusative = nominative: more stays more.',
  },
  {
    q: 'Gradimo ___.',
    opts: ['kuću', 'kuća', 'kuće', 'kućom'],
    answer: 'kuću',
    en: "We're building a house.",
    tip: 'Fem -a → -u: kuća → kuću.',
  },
  {
    q: 'Gledam ___ navečer.',
    opts: ['film', 'filma', 'filmu', 'filmom'],
    answer: 'film',
    en: "I'm watching the film in the evening.",
    tip: 'Inanimate masc accusative = nominative: film stays film.',
  },
  {
    q: 'Kupujem ___ u pekari.',
    opts: ['kruh', 'kruha', 'kruhu', 'kruhom'],
    answer: 'kruh',
    en: "I'm buying bread at the bakery.",
    tip: 'Inanimate masc accusative = nominative: kruh stays kruh.',
  },
  {
    q: 'Gledamo ___ zajedno.',
    opts: ['televiziju', 'televizija', 'televiziji', 'televizijom'],
    answer: 'televiziju',
    en: "We're watching TV together.",
    tip: 'Fem -a → -u: televizija → televiziju.',
  },
  {
    q: 'Idem u ___.',
    opts: ['školu', 'škola', 'školi', 'školom'],
    answer: 'školu',
    en: "I'm going to school.",
    tip: "'u' with a motion verb takes the accusative — fem škola → školu. Compare 'u školi' (locative, location).",
  },
  {
    q: 'Idem na ___.',
    opts: ['posao', 'posla', 'poslu', 'poslom'],
    answer: 'posao',
    en: "I'm going to work.",
    tip: "'na' with motion takes the accusative — masc 'posao' = nominative in the accusative.",
  },
  {
    q: 'Šetam kroz ___.',
    opts: ['park', 'parka', 'parku', 'parkom'],
    answer: 'park',
    en: 'I walk through the park.',
    tip: "'kroz' (through) takes the accusative — masc park = nominative.",
  },
  {
    q: 'Voli ___.',
    opts: ['mene', 'ja', 'mi', 'mnom'],
    answer: 'mene',
    en: 'She loves me.',
    tip: "1st person singular accusative long form: 'mene'. Short clitic form: 'me'.",
  },
  {
    q: 'Čekam ___.',
    opts: ['sina', 'sin', 'sinu', 'sinom'],
    answer: 'sina',
    en: "I'm waiting for my son.",
    tip: 'Animate masc accusative = genitive: sin → sina.',
  },
  {
    q: 'Pozdravljam ___.',
    opts: ['oca', 'otac', 'ocu', 'ocem'],
    answer: 'oca',
    en: 'I greet my father.',
    tip: "Animate masc 'otac' has a fleeting -a-; accusative = genitive: oca.",
  },
  {
    q: 'Slušam ___.',
    opts: ['glazbu', 'glazba', 'glazbi', 'glazbom'],
    answer: 'glazbu',
    en: "I'm listening to music.",
    tip: 'Fem -a → -u: glazba → glazbu.',
  },
  {
    q: 'Pišem ___.',
    opts: ['pismo', 'pisma', 'pismu', 'pismom'],
    answer: 'pismo',
    en: "I'm writing a letter.",
    tip: 'Neut nouns in -o: accusative = nominative: pismo stays pismo.',
  },
  {
    q: 'Pijem ___ ujutro.',
    opts: ['mlijeko', 'mlijeka', 'mlijeku', 'mlijekom'],
    answer: 'mlijeko',
    en: 'I drink milk in the morning.',
    tip: 'Neut accusative = nominative: mlijeko stays mlijeko.',
  },
  {
    q: 'Tražim ___.',
    opts: ['ključ', 'ključa', 'ključu', 'ključem'],
    answer: 'ključ',
    en: "I'm looking for the key.",
    tip: 'Inanimate masc accusative = nominative: ključ stays ključ.',
  },
  {
    q: 'Nosim ___.',
    opts: ['kaput', 'kaputa', 'kaputu', 'kaputom'],
    answer: 'kaput',
    en: "I'm wearing a coat.",
    tip: 'Inanimate masc accusative = nominative: kaput stays kaput.',
  },
  {
    q: 'Hranim ___.',
    opts: ['konja', 'konj', 'konju', 'konjem'],
    answer: 'konja',
    en: "I'm feeding the horse.",
    tip: 'Animate masc accusative = genitive: konj → konja.',
  },
  {
    q: 'Pozivam ___ na zabavu.',
    opts: ['susjeda', 'susjed', 'susjedu', 'susjedom'],
    answer: 'susjeda',
    en: "I'm inviting the neighbour to the party.",
    tip: 'Animate masc accusative = genitive: susjed → susjeda.',
  },
  {
    q: 'Učim ___.',
    opts: ['pjesmu', 'pjesma', 'pjesmi', 'pjesmom'],
    answer: 'pjesmu',
    en: "I'm learning a song.",
    tip: 'Fem -a → -u: pjesma → pjesmu.',
  },
  {
    q: 'Pijem ___ s limunom.',
    opts: ['vodu', 'voda', 'vodi', 'vodom'],
    answer: 'vodu',
    en: 'I drink water with lemon.',
    tip: 'Fem -a → -u: voda → vodu.',
  },
  {
    q: 'Grlim ___.',
    opts: ['majku', 'majka', 'majci', 'majkom'],
    answer: 'majku',
    en: 'I hug my mother.',
    tip: 'Fem -a → -u: majka → majku.',
  },
  {
    q: 'Zovem ___.',
    opts: ['liječnika', 'liječnik', 'liječniku', 'liječnikom'],
    answer: 'liječnika',
    en: "I'm calling the doctor.",
    tip: 'Animate masc accusative = genitive: liječnik → liječnika.',
  },
  {
    q: 'Vozim ___.',
    opts: ['automobil', 'automobila', 'automobilu', 'automobilom'],
    answer: 'automobil',
    en: "I'm driving a car.",
    tip: 'Inanimate masc accusative = nominative: automobil stays automobil.',
  },
  {
    q: 'Čekam ___ na kolodvoru.',
    opts: ['vlak', 'vlaka', 'vlaku', 'vlakom'],
    answer: 'vlak',
    en: "I'm waiting for the train at the station.",
    tip: 'Inanimate masc accusative = nominative: vlak stays vlak.',
  },
  {
    q: 'Jedem ___ za užinu.',
    opts: ['jabuku', 'jabuka', 'jabuci', 'jabukom'],
    answer: 'jabuku',
    en: 'I eat an apple for a snack.',
    tip: 'Fem -a → -u: jabuka → jabuku.',
  },
  {
    q: 'Spremam ___.',
    opts: ['salatu', 'salata', 'salati', 'salatom'],
    answer: 'salatu',
    en: "I'm making a salad.",
    tip: 'Fem -a → -u: salata → salatu.',
  },
  {
    q: 'Šaljem ___.',
    opts: ['poruku', 'poruka', 'poruci', 'porukom'],
    answer: 'poruku',
    en: "I'm sending a message.",
    tip: 'Fem -a → -u: poruka → poruku.',
  },
  {
    q: 'Pričam ___.',
    opts: ['priču', 'priča', 'priči', 'pričom'],
    answer: 'priču',
    en: "I'm telling a story.",
    tip: 'Fem -a → -u: priča → priču.',
  },
  {
    q: 'Pozivam ___ na večeru.',
    opts: ['ženu', 'žena', 'ženi', 'ženom'],
    answer: 'ženu',
    en: "I'm inviting the woman to dinner.",
    tip: 'Fem -a → -u: žena → ženu.',
  },
  {
    q: 'Trebam ___.',
    opts: ['tebe', 'ti', 'tebi', 'tobom'],
    answer: 'tebe',
    en: 'I need you.',
    tip: "2nd person singular accusative long form: 'tebe'. Short clitic form: 'te'.",
  },
  {
    q: 'Poznajem ___.',
    opts: ['njega', 'on', 'njemu', 'njime'],
    answer: 'njega',
    en: 'I know him.',
    tip: "3rd person masc accusative long form: 'njega'. Short clitic form: 'ga'.",
  },
  {
    q: 'Vidim ___ često.',
    opts: ['nju', 'ona', 'njoj', 'njom'],
    answer: 'nju',
    en: 'I see her often.',
    tip: "3rd person fem accusative long form: 'nju'. Short clitic form: 'je/ju'.",
  },
  {
    q: 'Čuvam ___.',
    opts: ['dijete', 'djeteta', 'djetetu', 'djetetom'],
    answer: 'dijete',
    en: "I'm looking after the child.",
    tip: 'Neut accusative = nominative: dijete stays dijete (genitive djeteta).',
  },
  {
    q: 'Pijem ___ uz ribu.',
    opts: ['vino', 'vina', 'vinu', 'vinom'],
    answer: 'vino',
    en: 'I drink wine with fish.',
    tip: 'Neut accusative = nominative: vino stays vino.',
  },
  {
    q: 'Naručujem ___.',
    opts: ['pizzu', 'pizza', 'pizzi', 'pizzom'],
    answer: 'pizzu',
    en: "I'm ordering a pizza.",
    tip: 'Fem -a → -u: pizza → pizzu.',
  },
  {
    q: 'Kupujem ___ za vlak.',
    opts: ['kartu', 'karta', 'karti', 'kartom'],
    answer: 'kartu',
    en: "I'm buying a ticket for the train.",
    tip: 'Fem -a → -u: karta → kartu.',
  },
  {
    q: 'Trčim niz ___.',
    opts: ['ulicu', 'ulica', 'ulici', 'ulicom'],
    answer: 'ulicu',
    en: 'I run down the street.',
    tip: "'niz' (down) takes the accusative — fem ulica → ulicu.",
  },
  {
    q: 'Ovo je za ___.',
    opts: ['nas', 'mi', 'nama', 'nami'],
    answer: 'nas',
    en: 'This is for us.',
    tip: "'za' (for) takes the accusative — 1st person plural accusative 'nas'; short clitic also 'nas'.",
  },
  {
    q: 'Čekamo ___.',
    opts: ['goste', 'gosti', 'gostiju', 'gostima'],
    answer: 'goste',
    en: "We're waiting for the guests.",
    tip: 'Masc animate plural accusative: gosti → goste (accusative plural -e).',
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
          key: 'accusative',
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
        {H('Accusative Case', 'Direct objects, animate/inanimate, motion prepositions', goBack)}
        <div className="c" style={{ marginTop: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>{passed ? '🎉' : '📚'}</div>
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
