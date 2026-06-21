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
    q: 'Živim u ___.',
    opts: ['Zagrebu', 'Zagreb', 'Zagreba', 'Zagrebom'],
    answer: 'Zagrebu',
    en: 'I live in Zagreb.',
    tip: "'u' (in, with location) takes locative — masc 'Zagreb' -> 'Zagrebu' (add -u).",
  },
  {
    q: 'Knjiga je na ___.',
    opts: ['stolu', 'stol', 'stola', 'stolom'],
    answer: 'stolu',
    en: 'The book is on the table.',
    tip: "'na' (on, location) takes locative — masc 'stol' -> 'stolu'.",
  },
  {
    q: 'Djeca su u ___.',
    opts: ['školi', 'škola', 'školu', 'školom'],
    answer: 'školi',
    en: 'The children are in school.',
    tip: "'u' + locative — fem 'škola' -> 'školi' (drop -a, add -i).",
  },
  {
    q: 'Mačka spava na ___.',
    opts: ['krevetu', 'krevet', 'kreveta', 'krevetom'],
    answer: 'krevetu',
    en: 'The cat sleeps on the bed.',
    tip: "'na' + locative — masc 'krevet' -> 'krevetu'.",
  },
  {
    q: 'Sjedim u ___.',
    opts: ['sobi', 'soba', 'sobu', 'sobom'],
    answer: 'sobi',
    en: 'I sit in the room.',
    tip: "'u' + locative — fem 'soba' -> 'sobi'.",
  },
  {
    q: 'Auto je u ___.',
    opts: ['garaži', 'garaža', 'garažu', 'garažom'],
    answer: 'garaži',
    en: 'The car is in the garage.',
    tip: "'u' + locative — fem 'garaža' -> 'garaži'.",
  },
  {
    q: 'Govorim o ___.',
    opts: ['knjizi', 'knjiga', 'knjigu', 'knjigom'],
    answer: 'knjizi',
    en: "I'm talking about the book.",
    tip: "'o' (about) takes locative — fem 'knjiga' -> 'knjizi' (k->z + -i).",
  },
  {
    q: 'Razmišljam o ___.',
    opts: ['tebi', 'ti', 'tebe', 'tobom'],
    answer: 'tebi',
    en: "I'm thinking about you.",
    tip: "'o' + locative of pronoun — 'ti' (nom) -> 'tebi' (loc).",
  },
  {
    q: 'Pišem o ___.',
    opts: ['pjesmi', 'pjesma', 'pjesmu', 'pjesmom'],
    answer: 'pjesmi',
    en: "I'm writing about a song.",
    tip: "'o' + locative — fem 'pjesma' -> 'pjesmi'.",
  },
  {
    q: 'Razgovaramo o ___.',
    opts: ['filmu', 'film', 'filma', 'filmom'],
    answer: 'filmu',
    en: "We're talking about the film.",
    tip: "'o' + locative — masc 'film' -> 'filmu'.",
  },
  {
    q: 'Praznici su u ___.',
    opts: ['prosincu', 'prosinac', 'prosinca', 'prosincem'],
    answer: 'prosincu',
    en: 'The holidays are in December.',
    tip: "'u' + month (time meaning) takes locative — masc 'prosinac' has fleeting -a-, locative 'prosincu'.",
  },
  {
    q: 'U ___ je hladnije nego ljeti.',
    opts: ['zimi', 'zima', 'zimu', 'zimom'],
    answer: 'zimi',
    en: "In winter it's colder than in summer.",
    tip: "'u' + season takes locative — fem 'zima' -> 'zimi'.",
  },
  {
    q: 'Praznujemo u ___.',
    opts: ['svibnju', 'svibanj', 'svibnja', 'svibnjem'],
    answer: 'svibnju',
    en: 'We celebrate in May.',
    tip: "'u' + month — masc 'svibanj' has fleeting -a-, locative 'svibnju'.",
  },
  {
    q: 'Šetam po ___.',
    opts: ['parku', 'park', 'parka', 'parkom'],
    answer: 'parku',
    en: 'I walk through the park.',
    tip: "'po' (along, through, around) takes locative — masc 'park' -> 'parku'.",
  },
  {
    q: 'Pri ___ smo se sreli.',
    opts: ['radu', 'rad', 'rada', 'radom'],
    answer: 'radu',
    en: 'We met at work.',
    tip: "'pri' (at, during, near) takes locative — masc 'rad' -> 'radu'.",
  },
  {
    q: 'Slika je na ___.',
    opts: ['zidu', 'zid', 'zida', 'zidom'],
    answer: 'zidu',
    en: 'The picture is on the wall.',
    tip: "'na' (on, location) takes locative — masc 'zid' -> 'zidu'.",
  },
  {
    q: 'Putujem po ___.',
    opts: ['Hrvatskoj', 'Hrvatska', 'Hrvatsku', 'Hrvatskom'],
    answer: 'Hrvatskoj',
    en: 'I travel around Croatia.',
    tip: "'po' + locative — 'Hrvatska' inflects as fem adjective: locative 'Hrvatskoj'.",
  },
  {
    q: 'Razmišljamo o ___.',
    opts: ['problemu', 'problem', 'problema', 'problemom'],
    answer: 'problemu',
    en: "We're thinking about the problem.",
    tip: "'o' (about) + locative — masc 'problem' -> 'problemu'.",
  },
  {
    q: 'Ujutro radim u ___.',
    opts: ['uredu', 'ured', 'ureda', 'uredom'],
    answer: 'uredu',
    en: 'In the morning I work in the office.',
    tip: "'u' (in, location) + locative — masc 'ured' -> 'uredu'.",
  },
  {
    q: 'Pri ___ je važno biti pažljiv.',
    opts: ['vožnji', 'vožnja', 'vožnju', 'vožnjom'],
    answer: 'vožnji',
    en: "When driving it's important to be careful.",
    tip: "'pri' (during, when doing X) + locative — fem 'vožnja' -> 'vožnji'.",
  },
  {
    q: 'Radim u ___.',
    opts: ['bolnici', 'bolnica', 'bolnicu', 'bolnicom'],
    answer: 'bolnici',
    en: 'I work in a hospital.',
    tip: "'u' (location) + locative — fem 'bolnica' → 'bolnici'.",
  },
  {
    q: 'Knjige su u ___.',
    opts: ['torbi', 'torba', 'torbu', 'torbom'],
    answer: 'torbi',
    en: 'The books are in the bag.',
    tip: "'u' + locative — fem 'torba' → 'torbi'.",
  },
  {
    q: 'Odmaram se u ___.',
    opts: ['fotelji', 'fotelja', 'fotelju', 'foteljom'],
    answer: 'fotelji',
    en: "I'm resting in the armchair.",
    tip: "'u' + locative — fem 'fotelja' → 'fotelji'.",
  },
  {
    q: 'Čekam te na ___.',
    opts: ['kolodvoru', 'kolodvor', 'kolodvora', 'kolodvorom'],
    answer: 'kolodvoru',
    en: "I'm waiting for you at the station.",
    tip: "'na' (location) + locative — masc 'kolodvor' → 'kolodvoru'.",
  },
  {
    q: 'Sastajemo se u ___.',
    opts: ['kafiću', 'kafić', 'kafića', 'kafićem'],
    answer: 'kafiću',
    en: 'We meet at the café.',
    tip: "'u' + locative — masc 'kafić' → 'kafiću'.",
  },
  {
    q: 'Razgovor je o ___.',
    opts: ['politici', 'politika', 'politiku', 'politikom'],
    answer: 'politici',
    en: 'The conversation is about politics.',
    tip: "'o' (about) + locative — fem 'politika' → 'politici' (k → c before -i).",
  },
  {
    q: 'Sanjam o ___.',
    opts: ['moru', 'more', 'mora', 'morem'],
    answer: 'moru',
    en: 'I dream about the sea.',
    tip: "'o' + locative — neut 'more' → 'moru'.",
  },
  {
    q: 'Sve ovisi o ___.',
    opts: ['vremenu', 'vrijeme', 'vremena', 'vremenom'],
    answer: 'vremenu',
    en: 'Everything depends on the weather.',
    tip: "'o' + locative — neut 'vrijeme' has irregular stem: 'vremenu'.",
  },
  {
    q: 'Cvijeće je u ___.',
    opts: ['vazi', 'vaza', 'vazu', 'vazom'],
    answer: 'vazi',
    en: 'The flowers are in the vase.',
    tip: "'u' + locative — fem 'vaza' → 'vazi'.",
  },
  {
    q: 'Učimo o ___.',
    opts: ['povijesti', 'povijest', 'poviješću', 'povijestima'],
    answer: 'povijesti',
    en: 'We are learning about history.',
    tip: "'o' + locative — fem i-declension 'povijest' → 'povijesti'.",
  },
  {
    q: 'Stojim na ___.',
    opts: ['mostu', 'most', 'mosta', 'mostom'],
    answer: 'mostu',
    en: "I'm standing on the bridge.",
    tip: "'na' + locative — masc 'most' → 'mostu'.",
  },
  {
    q: 'Vozim se po ___.',
    opts: ['gradu', 'grad', 'grada', 'gradom'],
    answer: 'gradu',
    en: 'I ride around the city.',
    tip: "'po' (around) + locative — masc 'grad' → 'gradu'.",
  },
  {
    q: 'Pričamo o ___.',
    opts: ['ljubavi', 'ljubav', 'ljubavlju', 'ljubave'],
    answer: 'ljubavi',
    en: 'We talk about love.',
    tip: "'o' + locative — fem i-declension 'ljubav' → 'ljubavi'.",
  },
  {
    q: 'Kuham u ___.',
    opts: ['kuhinji', 'kuhinja', 'kuhinju', 'kuhinjom'],
    answer: 'kuhinji',
    en: "I'm cooking in the kitchen.",
    tip: "'u' + locative — fem 'kuhinja' → 'kuhinji'.",
  },
  {
    q: 'Plivam u ___.',
    opts: ['bazenu', 'bazen', 'bazena', 'bazenom'],
    answer: 'bazenu',
    en: "I'm swimming in the pool.",
    tip: "'u' + locative — masc 'bazen' → 'bazenu'.",
  },
  {
    q: 'Sjedimo u ___.',
    opts: ['vrtu', 'vrt', 'vrta', 'vrtom'],
    answer: 'vrtu',
    en: 'We are sitting in the garden.',
    tip: "'u' + locative — masc 'vrt' → 'vrtu'.",
  },
  {
    q: 'Ostavila sam ključeve na ___.',
    opts: ['polici', 'polica', 'policu', 'policom'],
    answer: 'polici',
    en: 'I left the keys on the shelf.',
    tip: "'na' + locative — fem 'polica' → 'polici'.",
  },
  {
    q: 'Mislim o ___.',
    opts: ['budućnosti', 'budućnost', 'budućnošću', 'budućnostom'],
    answer: 'budućnosti',
    en: 'I think about the future.',
    tip: "'o' + locative — fem i-declension 'budućnost' → 'budućnosti'.",
  },
  {
    q: 'Film je o ___.',
    opts: ['ratu', 'rat', 'rata', 'ratom'],
    answer: 'ratu',
    en: 'The film is about the war.',
    tip: "'o' + locative — masc 'rat' → 'ratu'.",
  },
  {
    q: 'On studira na ___.',
    opts: ['fakultetu', 'fakultet', 'fakulteta', 'fakultetom'],
    answer: 'fakultetu',
    en: 'He studies at the faculty.',
    tip: "'na' + locative — masc 'fakultet' → 'fakultetu'.",
  },
  {
    q: 'Ona radi u ___.',
    opts: ['tvornici', 'tvornica', 'tvornicu', 'tvornicom'],
    answer: 'tvornici',
    en: 'She works in a factory.',
    tip: "'u' + locative — fem 'tvornica' → 'tvornici'.",
  },
  {
    q: 'Pas je u ___.',
    opts: ['dvorištu', 'dvorište', 'dvorišta', 'dvorištem'],
    answer: 'dvorištu',
    en: 'The dog is in the yard.',
    tip: "'u' + locative — neut 'dvorište' → 'dvorištu'.",
  },
  {
    q: 'Govorimo o ___.',
    opts: ['glazbi', 'glazba', 'glazbu', 'glazbom'],
    answer: 'glazbi',
    en: 'We talk about music.',
    tip: "'o' + locative — fem 'glazba' → 'glazbi'.",
  },
  {
    q: 'Hodam po ___.',
    opts: ['obali', 'obala', 'obalu', 'obalom'],
    answer: 'obali',
    en: 'I walk along the shore.',
    tip: "'po' (along) + locative — fem 'obala' → 'obali'.",
  },
  {
    q: 'Bili smo na ___.',
    opts: ['koncertu', 'koncert', 'koncerta', 'koncertom'],
    answer: 'koncertu',
    en: 'We were at the concert.',
    tip: "'na' + locative — masc 'koncert' → 'koncertu'.",
  },
  {
    q: 'Razmišljam o ___ cijeli dan.',
    opts: ['poslu', 'posao', 'posla', 'poslom'],
    answer: 'poslu',
    en: 'I think about work all day.',
    tip: "'o' + locative — masc 'posao' has a fleeting -a-: 'poslu'.",
  },
  {
    q: 'Djeca se igraju na ___.',
    opts: ['igralištu', 'igralište', 'igrališta', 'igralištem'],
    answer: 'igralištu',
    en: 'The children play on the playground.',
    tip: "'na' + locative — neut 'igralište' → 'igralištu'.",
  },
  {
    q: 'Ime piše na ___.',
    opts: ['koverti', 'koverta', 'kovertu', 'kovertom'],
    answer: 'koverti',
    en: 'The name is written on the envelope.',
    tip: "'na' + locative — fem 'koverta' → 'koverti'.",
  },
  {
    q: 'Susreli smo se na ___.',
    opts: ['svadbi', 'svadba', 'svadbu', 'svadbom'],
    answer: 'svadbi',
    en: 'We met at the wedding.',
    tip: "'na' + locative — fem 'svadba' → 'svadbi'.",
  },
  {
    q: 'Pri ___ budi oprezan.',
    opts: ['kuhanju', 'kuhanje', 'kuhanja', 'kuhanjem'],
    answer: 'kuhanju',
    en: 'Be careful when cooking.',
    tip: "'pri' (when doing X) + locative — neut 'kuhanje' → 'kuhanju'.",
  },
];

interface Props {
  goBack: () => void;
  award?: (xp: number, celebrate?: boolean, activityType?: string) => void;
}

export default function LocativeDrill({ goBack, award }: Props) {
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
          key: 'locative',
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
        {H('📍 Locative Case', 'Location, topic, time, prepositions u/na/o/po/pri', goBack)}
        <div className="c" style={{ marginTop: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>{passed ? '🎉' : '📚'}</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            {score} / {total}
          </div>
          <div style={{ fontSize: 15, color: '#64748b', marginBottom: 16 }}>
            {score === total
              ? 'Perfect! Locative mastered! 🏆'
              : score >= total * 0.8
                ? 'Great work! Locative covers location and topic!'
                : 'Keep practising — locative comes after u/na/o/po/pri.'}
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
      {H('📍 Locative Case', 'Location, topic, time, prepositions u/na/o/po/pri', goBack)}
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
