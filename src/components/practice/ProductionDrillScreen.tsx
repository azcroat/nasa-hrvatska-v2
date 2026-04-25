import React, { useState } from 'react';
import { speak, sh } from '../../data';
import { markQuest } from '../../lib/quests.js';
import { recordTopicResult, rateCategorySession } from '../../lib/adaptive.ts';
import { useAdaptiveSession } from '../../hooks/useAdaptiveSession';

// ─── TRANSFORM DATA ─────────────────────────────────────────────────────────
const TRANSFORMS = [
  {
    src: 'Idem u školu.',
    instruction: 'Negacija: reci suprotno',
    target: 'Ne idem u školu.',
    type: 'negate',
    level: 'A2',
  },
  {
    src: 'Ona je ljepša od njega.',
    instruction: 'Negacija',
    target: 'Ona nije ljepša od njega.',
    type: 'negate',
    level: 'A2',
  },
  {
    src: 'Vidim dobro.',
    instruction: 'Negacija',
    target: 'Ne vidim dobro.',
    type: 'negate',
    level: 'A2',
  },
  {
    src: 'Ja sam umorán.',
    instruction: 'Pretvori u: ona je...',
    target: 'Ona je umorna.',
    type: 'transform',
    level: 'A2',
  },
  {
    src: 'Čitat ću knjigu.',
    instruction: 'Pretvori u: mi ćemo...',
    target: 'Čitat ćemo knjigu.',
    type: 'transform',
    level: 'A2',
  },
  {
    src: 'Jučer sam radio.',
    instruction: 'Pretvori u buduće vrijeme (sutra...)',
    target: 'Sutra ću raditi.',
    type: 'tense',
    level: 'A2',
  },
  {
    src: 'Pila je kavu.',
    instruction: 'Pretvori u buduće: ona će...',
    target: 'Ona će piti kavu.',
    type: 'tense',
    level: 'B1',
  },
  {
    src: 'Dolazimo svaki dan.',
    instruction: 'Pretvori u prošlo: dolazili smo...',
    target: 'Dolazili smo svaki dan.',
    type: 'tense',
    level: 'B1',
  },
  {
    src: 'Svaki tjedan pišem pisma.',
    instruction: 'Zamijeni s perfektivnim oblikom jedne radnje',
    target: 'Napisao/la sam pismo.',
    type: 'aspect',
    level: 'B1',
  },
  {
    src: 'Naučio/la sam lekciju.',
    instruction: 'Pretvori u imperfektivno (navika)',
    target: 'Svaki dan učim lekciju.',
    type: 'aspect',
    level: 'B1',
  },
  {
    src: 'Vidim ____ (kuća).',
    instruction: 'Stavi u akuzativ (ženski)',
    target: 'Vidim kuću.',
    type: 'case',
    level: 'A2',
  },
  {
    src: 'Idem u ____ (Zagreb).',
    instruction: 'Stavi u akuzativ',
    target: 'Idem u Zagreb.',
    type: 'case',
    level: 'A2',
  },
  {
    src: 'Pričam s ____ (prijatelj).',
    instruction: 'Stavi u instrumental',
    target: 'Pričam s prijateljem.',
    type: 'case',
    level: 'B1',
  },
  {
    src: 'Nema ____ (voda).',
    instruction: 'Stavi u genitiv',
    target: 'Nema vode.',
    type: 'case',
    level: 'B1',
  },
  {
    src: 'Ana je visoka. Pero je viši.',
    instruction: 'Napravi usporedbu: Ana je ____ od Pera',
    target: 'Ana je niža od Pera.',
    type: 'compare',
    level: 'B1',
  },
  {
    src: 'Ovaj auto je brz. Onaj je spor.',
    instruction: 'Usporedi ih',
    target: 'Ovaj auto je brži od onog.',
    type: 'compare',
    level: 'B1',
  },
  {
    src: 'On dolazi u petak.',
    instruction: 'Postavi pitanje: Kada...?',
    target: 'Kada dolazi?',
    type: 'question',
    level: 'A2',
  },
  {
    src: 'Marija živi u Splitu.',
    instruction: 'Postavi pitanje: Gdje...?',
    target: 'Gdje živi Marija?',
    type: 'question',
    level: 'A2',
  },
  {
    src: 'Kupujem kruh jer sam gladan.',
    instruction: 'Postavi pitanje: Zašto...?',
    target: 'Zašto kupuješ kruh?',
    type: 'question',
    level: 'B1',
  },
  {
    src: 'Putujem u Dubrovnik vlakom.',
    instruction: 'Postavi pitanje: Kako...?',
    target: 'Kako putuješ u Dubrovnik?',
    type: 'question',
    level: 'B1',
  },
];

// ─── TRANSLATION DATA ────────────────────────────────────────────────────────
const TRANSLATE_PROD = [
  { en: "I didn't go to school yesterday.", hr: 'Nisam išao/išla u školu jučer.', level: 'A2' },
  { en: 'She will come tomorrow morning.', hr: 'Doći će sutra ujutro.', level: 'A2' },
  {
    en: 'We have been learning Croatian for two years.',
    hr: 'Učimo hrvatski dvije godine.',
    level: 'B1',
  },
  {
    en: 'If you study every day, you will succeed.',
    hr: 'Ako učiš svaki dan, uspjet ćeš.',
    level: 'B1',
  },
  { en: "I don't have time today.", hr: 'Nemam vremena danas.', level: 'A2' },
  {
    en: 'He was reading a book when I called.',
    hr: 'Čitao je knjigu kad sam nazvao/la.',
    level: 'B1',
  },
  { en: 'Can you help me with this?', hr: 'Možeš li mi pomoći s ovim?', level: 'A2' },
  { en: 'They arrived before us.', hr: 'Stigli su prije nas.', level: 'B1' },
  { en: 'I need to buy bread and milk.', hr: 'Trebam kupiti kruh i mlijeko.', level: 'A1' },
  { en: 'Where is the nearest pharmacy?', hr: 'Gdje je najbliža ljekarna?', level: 'A2' },
  { en: 'It has been raining since morning.', hr: 'Kiša pada od jutra.', level: 'B1' },
  {
    en: 'Despite the rain, we went for a walk.',
    hr: 'Unatoč kiši, otišli smo u šetnju.',
    level: 'B2',
  },
  {
    en: 'The meeting was cancelled due to illness.',
    hr: 'Sastanak je otkazan zbog bolesti.',
    level: 'B2',
  },
  { en: 'I have never been to Dubrovnik.', hr: 'Nikad nisam bio/bila u Dubrovniku.', level: 'A2' },
  { en: 'She speaks three languages fluently.', hr: 'Govori tečno tri jezika.', level: 'B1' },
  {
    en: 'Please turn off the lights when you leave.',
    hr: 'Molim ugasi svjetlo kad odlaziš.',
    level: 'B1',
  },
  {
    en: 'The more you practice, the better you get.',
    hr: 'Što više vježbaš, to si bolji.',
    level: 'B2',
  },
  { en: 'I used to live near the sea.', hr: 'Nekad sam živio/živjela blizu mora.', level: 'B1' },
  { en: 'He told me that he was tired.', hr: 'Rekao mi je da je umoran.', level: 'B1' },
  { en: 'The film is worth watching.', hr: 'Film je vrijedan gledanja.', level: 'B2' },
  {
    en: "I haven't eaten anything since breakfast.",
    hr: 'Nisam ništa jeo/jela od doručka.',
    level: 'B1',
  },
  {
    en: "Let's meet in front of the cathedral at noon.",
    hr: 'Nađimo se ispred katedrale u podne.',
    level: 'B1',
  },
  { en: 'She is taller than her brother.', hr: 'Viša je od svog brata.', level: 'A2' },
  {
    en: 'I would like a glass of red wine, please.',
    hr: 'Htio/htjela bih čašu crnog vina, molim.',
    level: 'A2',
  },
  {
    en: 'It is said that Croatia has the most beautiful coast.',
    hr: 'Kaže se da Hrvatska ima najljepšu obalu.',
    level: 'B2',
  },
  {
    en: 'He regrets not learning Croatian earlier.',
    hr: 'Žali što nije ranije naučio/la hrvatski.',
    level: 'B2',
  },
  {
    en: 'Neither Ana nor Pero knows the answer.',
    hr: 'Ni Ana ni Pero ne zna odgovor.',
    level: 'B2',
  },
  {
    en: 'By the time we arrived, the film had already started.',
    hr: 'Kad smo stigli, film je već počeo.',
    level: 'B2',
  },
  { en: 'It depends on the weather.', hr: 'Ovisi o vremenu.', level: 'A2' },
  { en: 'Would you like to come with us?', hr: 'Hoćeš li doći s nama?', level: 'A2' },
];

// ─── BUILD SENTENCES DATA ────────────────────────────────────────────────────
const BUILD_SENTENCES = [
  {
    words: ['Sutra', 'idem', 'u', 'Zagreb', 'vlakom'],
    target: 'Sutra idem u Zagreb vlakom.',
    en: 'Tomorrow I am going to Zagreb by train.',
  },
  {
    words: ['Nisam', 'još', 'naučio', 'sve', 'padeže'],
    target: 'Nisam još naučio sve padeže.',
    en: "I haven't learned all cases yet.",
  },
  {
    words: ['Moja', 'sestra', 'živi', 'u', 'Splitu'],
    target: 'Moja sestra živi u Splitu.',
    en: 'My sister lives in Split.',
  },
  {
    words: ['Volim', 'plivati', 'u', 'moru', 'ljeti'],
    target: 'Volim plivati u moru ljeti.',
    en: 'I love swimming in the sea in summer.',
  },
  {
    words: ['Jesi', 'li', 'već', 'jeo', 'danas'],
    target: 'Jesi li već jeo danas?',
    en: 'Have you already eaten today?',
  },
  {
    words: ['Kad', 'budem', 'gotov', 'nazvat', 'ću', 'te'],
    target: 'Kad budem gotov, nazvat ću te.',
    en: "When I'm done, I'll call you.",
  },
  {
    words: ['Ne', 'sviđa', 'mi', 'se', 'to'],
    target: 'Ne sviđa mi se to.',
    en: "I don't like that.",
  },
  {
    words: ['Hvala', 'ti', 'puno', 'za', 'pomoć'],
    target: 'Hvala ti puno za pomoć.',
    en: 'Thank you very much for your help.',
  },
  {
    words: ['Gdje', 'si', 'bio', 'jučer', 'navečer'],
    target: 'Gdje si bio jučer navečer?',
    en: 'Where were you yesterday evening?',
  },
  {
    words: ['Djeca', 'se', 'igraju', 'u', 'parku'],
    target: 'Djeca se igraju u parku.',
    en: 'The children are playing in the park.',
  },
  {
    words: ['Moram', 'kupiti', 'kruh', 'i', 'mlijeko'],
    target: 'Moram kupiti kruh i mlijeko.',
    en: 'I need to buy bread and milk.',
  },
  {
    words: ['Ovo', 'je', 'najljepša', 'plaža', 'na', 'otoku'],
    target: 'Ovo je najljepša plaža na otoku.',
    en: 'This is the most beautiful beach on the island.',
  },
  {
    words: ['Nikada', 'nisam', 'bio', 'u', 'Osijeku'],
    target: 'Nikada nisam bio u Osijeku.',
    en: 'I have never been to Osijek.',
  },
  {
    words: ['Što', 'ćeš', 'raditi', 'ovog', 'vikenda'],
    target: 'Što ćeš raditi ovog vikenda?',
    en: 'What will you do this weekend?',
  },
  {
    words: ['On', 'govori', 'bolje', 'od', 'mene'],
    target: 'On govori bolje od mene.',
    en: 'He speaks better than me.',
  },
];

// ─── ERROR CORRECTION DATA ───────────────────────────────────────────────────
const ERROR_CORRECT = [
  {
    sentence: 'Vidim jedan lijepa žena.',
    error: 'lijepa',
    correct: 'lijepu',
    opts: ['lijepu', 'lijep', 'lijepo'],
    explanation: 'Akuzativ ženskog roda: jedna lijepa → jednu lijepu ženu',
    en: 'I see a beautiful woman.',
  },
  {
    sentence: 'Idem u škola svaki dan.',
    error: 'škola',
    correct: 'školu',
    opts: ['školu', 'škole', 'školom'],
    explanation: 'Nakon "u" s kretanjem: akuzativ → školu',
    en: 'I go to school every day.',
  },
  {
    sentence: 'On je vratio se kasno.',
    error: 'vratio se',
    correct: 'se vratio',
    opts: ['se vratio', 'vratio se', 'se je vratio'],
    explanation: 'Klitika "se" stoji ispred pomoćnog glagola: vratio se → se vratio',
    en: 'He returned late.',
  },
  {
    sentence: 'Nemam vremena za to raditi.',
    error: 'raditi',
    correct: 'to',
    opts: ['nemam to', 'za to', 'to raditi'],
    explanation: 'Correct: "Nemam vremena za to." — redundant "raditi"',
    en: "I don't have time for that.",
  },
  {
    sentence: 'Učio sam svaki dana.',
    error: 'dana',
    correct: 'dan',
    opts: ['dan', 'dana', 'danu'],
    explanation: '"Svaki" + nominativ/akuzativ = svaki dan',
    en: 'I studied every day.',
  },
  {
    sentence: 'Puno sam gladna.',
    error: 'Puno',
    correct: 'Jako',
    opts: ['Jako', 'Puno', 'Mnogo'],
    explanation: '"Puno" mjeri količinu, "jako/vrlo" mjeri intenzitet pridjeva',
    en: 'I am very hungry.',
  },
  {
    sentence: 'On je otišla na more.',
    error: 'otišla',
    correct: 'otišao',
    opts: ['otišao', 'otišla', 'otišlo'],
    explanation: 'Muški rod: on je otišao (ne otišla)',
    en: 'He went to the seaside.',
  },
  {
    sentence: 'Razgovaram s moj prijatelj.',
    error: 'moj',
    correct: 'mojim',
    opts: ['mojim', 'moj', 'moje'],
    explanation: 'Instrumental: s mojim prijateljem',
    en: 'I am talking with my friend.',
  },
  {
    sentence: 'Pišem pisma svaki tjedan za godinu.',
    error: 'za godinu',
    correct: 'već godinu dana',
    opts: ['već godinu dana', 'za godinu', 'kroz godinu'],
    explanation: '"Za godinu" = in one year; "već godinu dana" = for a year',
    en: 'I have been writing letters every week for a year.',
  },
  {
    sentence: 'Daj mi jedan vode, molim.',
    error: 'jedan',
    correct: 'malo',
    opts: ['malo', 'jedan', 'jednu'],
    explanation: 'Voda je nebrojiva — "malo vode", ne "jedan vode"',
    en: 'Give me some water, please.',
  },
  {
    sentence: 'Nije mi dopada taj film.',
    error: 'dopada',
    correct: 'svidio',
    opts: ['svidio', 'dopada', 'sviđa'],
    explanation: 'Prošlo: "Nije mi se svidio taj film."',
    en: "I didn't like that film.",
  },
  {
    sentence: 'Kad dođeš, ću ti reći sve.',
    error: 'ću',
    correct: 'reći ću',
    opts: ['reći ću ti', 'ću ti reći', 'ti reći ću'],
    explanation: 'Klitika "ću" ne može biti na početku rečenice',
    en: "When you come, I'll tell you everything.",
  },
  {
    sentence: 'Treba mi da učim više.',
    error: 'da učim',
    correct: 'učiti',
    opts: ['učiti', 'da učim', 'učenje'],
    explanation: '"Trebam + infinitiv": Trebam učiti više.',
    en: 'I need to study more.',
  },
  {
    sentence: 'Svi znaju on.',
    error: 'on',
    correct: 'njega',
    opts: ['njega', 'on', 'mu'],
    explanation: 'Akuzativ lične zamjenice: svi znaju njega',
    en: 'Everyone knows him.',
  },
  {
    sentence: 'Živim ovdje od pet godina.',
    error: 'od',
    correct: 'već',
    opts: ['već', 'od', 'za'],
    explanation: '"Od pet godina" = since 5 years ago; "već pet godina" = for five years',
    en: 'I have lived here for five years.',
  },
];

// ─── STYLES ──────────────────────────────────────────────────────────────────
const STYLES = `
@keyframes pd-shake {
  0%,100%{transform:translateX(0)}
  20%{transform:translateX(-8px)}
  40%{transform:translateX(8px)}
  60%{transform:translateX(-5px)}
  80%{transform:translateX(5px)}
}
@keyframes pd-pop {
  0%{transform:scale(0.9);opacity:0}
  60%{transform:scale(1.04)}
  100%{transform:scale(1);opacity:1}
}
`;

// ─── LEVEL BADGE ─────────────────────────────────────────────────────────────
interface LevelBadgeProps {
  level: string;
}
function LevelBadge({ level }: LevelBadgeProps) {
  const colors: Record<string, string> = {
    A1: '#059669',
    A2: '#0e7490',
    B1: '#7c3aed',
    B2: '#d97706',
  };
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 800,
        padding: '2px 7px',
        borderRadius: 99,
        background: colors[level] || '#6b7280',
        color: '#fff',
        letterSpacing: '.06em',
      }}
    >
      {level}
    </span>
  );
}

// ─── MODE A: TRANSFORM ───────────────────────────────────────────────────────
interface ModeDoneProps {
  onDone: () => void;
  award?: (n: number, celebrate?: boolean, activityType?: string) => void;
  onCorrect?: () => void;
  onWrong?: () => void;
}
function ModeTransform({ onDone, award, onCorrect, onWrong }: ModeDoneProps) {
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const total = TRANSFORMS.length;
  const item = TRANSFORMS[idx];
  if (!item) return null;

  function advance(correct: boolean) {
    recordTopicResult('production', correct);
    recordTopicResult('grammar', correct);
    if (correct) {
      setScore((s) => s + 1);
      if (award) award(2, false, 'grammar');
      if (onCorrect) onCorrect();
    } else {
      if (onWrong) onWrong();
    }
    if (idx + 1 >= total) {
      setDone(true);
    } else {
      setIdx((i) => i + 1);
      setRevealed(false);
    }
  }

  if (done) {
    const pct = Math.round((score / total) * 100);
    const grade = pct >= 90 ? 'A' : pct >= 75 ? 'B' : pct >= 60 ? 'C' : 'D';
    return (
      <div style={{ textAlign: 'center', padding: '32px 16px' }}>
        <div style={{ fontSize: 56, marginBottom: 8 }}>{pct >= 75 ? '🎉' : '💪'}</div>
        <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--heading)', marginBottom: 4 }}>
          Ocjena {grade}
        </div>
        <div style={{ fontSize: 15, color: 'var(--subtext)', marginBottom: 24 }}>
          {score}/{total} točno · {pct}%
        </div>
        <button onClick={onDone} style={btnStyle('#7c3aed')}>
          Nazad na izbor
        </button>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--subtext)' }}>
          {idx + 1}/{total}
        </span>
        <LevelBadge level={item.level} />
      </div>
      <div
        style={{
          background: 'var(--card-bg)',
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
          boxShadow: '0 2px 12px rgba(0,0,0,.08)',
          animation: 'pd-pop .22s ease both',
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: 'var(--heading)',
            marginBottom: 10,
            lineHeight: 1.4,
          }}
        >
          {item.src}
        </div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: '#d97706',
            background: 'rgba(217,119,6,.1)',
            borderRadius: 10,
            padding: '8px 12px',
          }}
        >
          {item.instruction}
        </div>
      </div>
      {!revealed ? (
        <button onClick={() => setRevealed(true)} style={btnStyle('#7c3aed')}>
          Otkrij odgovor
        </button>
      ) : (
        <div style={{ animation: 'pd-pop .2s ease both' }}>
          <div
            style={{
              background: 'rgba(5,150,105,.08)',
              border: '1.5px solid rgba(5,150,105,.3)',
              borderRadius: 14,
              padding: '14px 16px',
              marginBottom: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div style={{ flex: 1, fontSize: 16, fontWeight: 800, color: '#059669' }}>
              {item.target}
            </div>
            <button
              onClick={() => speak(item.target)}
              style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}
            >
              🔊
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button onClick={() => advance(true)} style={btnStyle('#059669')}>
              ✓ Točno
            </button>
            <button onClick={() => advance(false)} style={btnStyle('#dc2626')}>
              ✗ Pogrešno
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MODE B: TRANSLATE ───────────────────────────────────────────────────────
function ModeTranslate({ onDone, award, onCorrect, onWrong }: ModeDoneProps) {
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const total = TRANSLATE_PROD.length;
  const item = TRANSLATE_PROD[idx];
  if (!item) return null;

  function advance(correct: boolean) {
    recordTopicResult('production', correct);
    recordTopicResult('vocabulary', correct);
    if (correct) {
      setScore((s) => s + 1);
      if (award) award(3, false, 'grammar');
      if (onCorrect) onCorrect();
    } else {
      if (onWrong) onWrong();
    }
    if (idx + 1 >= total) {
      setDone(true);
    } else {
      setIdx((i) => i + 1);
      setRevealed(false);
    }
  }

  if (done) {
    const pct = Math.round((score / total) * 100);
    const grade = pct >= 90 ? 'A' : pct >= 75 ? 'B' : pct >= 60 ? 'C' : 'D';
    return (
      <div style={{ textAlign: 'center', padding: '32px 16px' }}>
        <div style={{ fontSize: 56, marginBottom: 8 }}>{pct >= 75 ? '🎉' : '💪'}</div>
        <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--heading)', marginBottom: 4 }}>
          Ocjena {grade}
        </div>
        <div style={{ fontSize: 15, color: 'var(--subtext)', marginBottom: 24 }}>
          {score}/{total} točno · {pct}%
        </div>
        <button onClick={onDone} style={btnStyle('#0e7490')}>
          Nazad na izbor
        </button>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--subtext)' }}>
          {idx + 1}/{total}
        </span>
        <LevelBadge level={item.level} />
      </div>
      <div
        style={{
          background: 'var(--card-bg)',
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
          boxShadow: '0 2px 12px rgba(0,0,0,.08)',
          animation: 'pd-pop .22s ease both',
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: 'var(--subtext)',
            textTransform: 'uppercase',
            letterSpacing: '.1em',
            marginBottom: 8,
          }}
        >
          Prevedi na hrvatski
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--heading)', lineHeight: 1.4 }}>
          {item.en}
        </div>
      </div>
      {!revealed ? (
        <button onClick={() => setRevealed(true)} style={btnStyle('#0e7490')}>
          Otkrij prijevod
        </button>
      ) : (
        <div style={{ animation: 'pd-pop .2s ease both' }}>
          <div
            style={{
              background: 'rgba(14,116,144,.08)',
              border: '1.5px solid rgba(14,116,144,.3)',
              borderRadius: 14,
              padding: '14px 16px',
              marginBottom: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div style={{ flex: 1, fontSize: 16, fontWeight: 800, color: '#0e7490' }}>
              {item.hr}
            </div>
            <button
              onClick={() => speak(item.hr)}
              style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}
            >
              🔊
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button onClick={() => advance(true)} style={btnStyle('#059669')}>
              ✓ Točno
            </button>
            <button onClick={() => advance(false)} style={btnStyle('#dc2626')}>
              ✗ Pogrešno
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MODE C: BUILD SENTENCE ───────────────────────────────────────────────────
interface Tile {
  w: string;
  i: number;
}
interface BuildItem {
  words: string[];
  target: string;
  en: string;
}
function ModeBuild({ onDone, award, onCorrect, onWrong }: ModeDoneProps) {
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [shake, setShake] = useState(false);
  const total = BUILD_SENTENCES.length;
  const item = BUILD_SENTENCES[idx];
  if (!item) return null;

  const [placed, setPlaced] = useState<Tile[]>([]);
  const [remaining, setRemaining] = useState<Tile[]>(() =>
    (sh([...item.words]) as string[]).map((w: string, i: number) => ({ w, i })),
  );

  function resetForItem(newItem: BuildItem) {
    const arr: Tile[] = (sh([...newItem.words]) as string[]).map((w: string) => ({
      w,
      i: Math.random(),
    }));
    setPlaced([]);
    setRemaining(arr);
    setFeedback(null);
    setShake(false);
  }

  function tapRemaining(tile: Tile) {
    if (feedback) return;
    setRemaining((r: Tile[]) => r.filter((t: Tile) => t !== tile));
    setPlaced((p: Tile[]) => [...p, tile]);
  }

  function tapPlaced(tile: Tile) {
    if (feedback) return;
    setPlaced((p: Tile[]) => p.filter((t: Tile) => t !== tile));
    setRemaining((r: Tile[]) => [...r, tile]);
  }

  function check() {
    const answer = placed.map((t: Tile) => t.w).join(' ');
    const cleanAnswer = answer.replace(/[?.!,]$/, '').trim();
    const cleanTarget = item!.target.replace(/[?.!,]$/, '').trim();
    const correct = cleanAnswer === cleanTarget;
    recordTopicResult('production', correct);
    recordTopicResult('grammar', correct);
    if (correct) {
      setFeedback('correct');
      setScore((s) => s + 1);
      if (award) award(5, false, 'grammar');
      if (onCorrect) onCorrect();
    } else {
      setShake(true);
      setFeedback('wrong');
      setTimeout(() => setShake(false), 600);
      if (onWrong) onWrong();
    }
  }

  function next() {
    if (idx + 1 >= total) {
      setDone(true);
    } else {
      const nextItem = BUILD_SENTENCES[idx + 1]!;
      setIdx((i) => i + 1);
      resetForItem(nextItem);
    }
  }

  if (done) {
    const pct = Math.round((score / total) * 100);
    const grade = pct >= 90 ? 'A' : pct >= 75 ? 'B' : pct >= 60 ? 'C' : 'D';
    return (
      <div style={{ textAlign: 'center', padding: '32px 16px' }}>
        <div style={{ fontSize: 56, marginBottom: 8 }}>{pct >= 75 ? '🎉' : '💪'}</div>
        <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--heading)', marginBottom: 4 }}>
          Ocjena {grade}
        </div>
        <div style={{ fontSize: 15, color: 'var(--subtext)', marginBottom: 24 }}>
          {score}/{total} točno · {pct}%
        </div>
        <button onClick={onDone} style={btnStyle('#059669')}>
          Nazad na izbor
        </button>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--subtext)' }}>
          {idx + 1}/{total}
        </span>
        <span style={{ fontSize: 12, color: 'var(--subtext)' }}>{item.en}</span>
      </div>

      {/* Placed area */}
      <div
        style={{
          minHeight: 60,
          background: 'var(--card-bg)',
          borderRadius: 14,
          border:
            feedback === 'correct'
              ? '2px solid #059669'
              : feedback === 'wrong'
                ? '2px solid #dc2626'
                : '2px dashed rgba(124,58,237,.3)',
          padding: '12px 14px',
          marginBottom: 12,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          alignItems: 'flex-start',
          animation: shake ? 'pd-shake .5s ease' : 'none',
        }}
      >
        {placed.length === 0 ? (
          <span style={{ color: 'var(--subtext)', fontSize: 13, opacity: 0.5 }}>
            Tap words to build the sentence...
          </span>
        ) : (
          placed.map((tile, i) => (
            <button
              key={i}
              onClick={() => tapPlaced(tile)}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: '1.5px solid rgba(124,58,237,.4)',
                background: 'rgba(124,58,237,.1)',
                fontSize: 14,
                fontWeight: 700,
                color: '#7c3aed',
                cursor: 'pointer',
                fontFamily: "'Outfit',sans-serif",
              }}
            >
              {tile.w}
            </button>
          ))
        )}
      </div>

      {/* Feedback */}
      {feedback === 'correct' && (
        <div
          style={{
            background: 'rgba(5,150,105,.1)',
            border: '1.5px solid rgba(5,150,105,.3)',
            borderRadius: 12,
            padding: '10px 14px',
            marginBottom: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ fontSize: 18 }}>✅</span>
          <span style={{ fontWeight: 800, color: '#059669', fontSize: 14 }}>Točno!</span>
          <button
            onClick={() => speak(item.target)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 18,
              cursor: 'pointer',
              marginLeft: 4,
            }}
          >
            🔊
          </button>
        </div>
      )}
      {feedback === 'wrong' && (
        <div
          style={{
            background: 'rgba(220,38,38,.08)',
            border: '1.5px solid rgba(220,38,38,.3)',
            borderRadius: 12,
            padding: '10px 14px',
            marginBottom: 10,
          }}
        >
          <div style={{ fontWeight: 800, color: '#dc2626', fontSize: 13, marginBottom: 4 }}>
            Točan odgovor:
          </div>
          <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 14 }}>
            {item.target}
          </div>
        </div>
      )}

      {/* Remaining tiles */}
      {!feedback && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16, minHeight: 40 }}>
          {remaining.map((tile, i) => (
            <button
              key={i}
              onClick={() => tapRemaining(tile)}
              style={{
                padding: '8px 14px',
                borderRadius: 10,
                border: '1.5px solid rgba(14,116,144,.3)',
                background: 'rgba(14,116,144,.08)',
                fontSize: 14,
                fontWeight: 700,
                color: '#0e7490',
                cursor: 'pointer',
                fontFamily: "'Outfit',sans-serif",
              }}
            >
              {tile.w}
            </button>
          ))}
        </div>
      )}

      {!feedback ? (
        <button
          onClick={check}
          disabled={placed.length === 0}
          style={{ ...btnStyle('#7c3aed'), opacity: placed.length === 0 ? 0.5 : 1 }}
        >
          Provjeri
        </button>
      ) : (
        <button onClick={next} style={btnStyle(feedback === 'correct' ? '#059669' : '#7c3aed')}>
          {idx + 1 >= total ? 'Završi' : 'Sljedeće →'}
        </button>
      )}
    </div>
  );
}

// ─── MODE D: ERROR CORRECTION ────────────────────────────────────────────────
function ModeErrorCorrect({ onDone, award, onCorrect, onWrong }: ModeDoneProps) {
  const [idx, setIdx] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const total = ERROR_CORRECT.length;
  const item = ERROR_CORRECT[idx];
  if (!item) return null;

  function pick(opt: string) {
    if (chosen !== null) return;
    setChosen(opt);
    const correct = opt === item!.correct;
    recordTopicResult('production', correct);
    recordTopicResult('grammar', correct);
    if (correct) {
      setScore((s) => s + 1);
      if (award) award(3, false, 'grammar');
      if (onCorrect) onCorrect();
    } else {
      if (onWrong) onWrong();
    }
  }

  function next() {
    if (idx + 1 >= total) {
      setDone(true);
    } else {
      setIdx((i) => i + 1);
      setChosen(null);
    }
  }

  if (done) {
    const pct = Math.round((score / total) * 100);
    const grade = pct >= 90 ? 'A' : pct >= 75 ? 'B' : pct >= 60 ? 'C' : 'D';
    return (
      <div style={{ textAlign: 'center', padding: '32px 16px' }}>
        <div style={{ fontSize: 56, marginBottom: 8 }}>{pct >= 75 ? '🎉' : '💪'}</div>
        <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--heading)', marginBottom: 4 }}>
          Ocjena {grade}
        </div>
        <div style={{ fontSize: 15, color: 'var(--subtext)', marginBottom: 24 }}>
          {score}/{total} točno · {pct}%
        </div>
        <button onClick={onDone} style={btnStyle('#d97706')}>
          Nazad na izbor
        </button>
      </div>
    );
  }

  // Render sentence with error highlighted
  const parts = item.sentence.split(item.error);

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--subtext)' }}>
          {idx + 1}/{total}
        </span>
        <span style={{ fontSize: 11, color: 'var(--subtext)', fontStyle: 'italic' }}>
          {item.en}
        </span>
      </div>

      <div
        style={{
          background: 'var(--card-bg)',
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
          boxShadow: '0 2px 12px rgba(0,0,0,.08)',
          animation: 'pd-pop .22s ease both',
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: 'var(--subtext)',
            textTransform: 'uppercase',
            letterSpacing: '.1em',
            marginBottom: 10,
          }}
        >
          Ispravi grešku
        </div>
        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--heading)', lineHeight: 1.6 }}>
          {parts[0]}
          <span
            style={{
              background: 'rgba(220,38,38,.15)',
              border: '1.5px solid rgba(220,38,38,.4)',
              borderRadius: 6,
              padding: '1px 6px',
              color: '#dc2626',
              fontWeight: 800,
            }}
          >
            {item.error}
          </span>
          {parts.slice(1).join(item.error)}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
        {item.opts.map((opt, i) => {
          let bg = 'var(--card-bg)';
          let border = '1.5px solid rgba(0,0,0,.1)';
          let col = 'var(--heading)';
          if (chosen !== null) {
            if (opt === item.correct) {
              bg = 'rgba(5,150,105,.12)';
              border = '2px solid #059669';
              col = '#059669';
            } else if (opt === chosen && opt !== item.correct) {
              bg = 'rgba(220,38,38,.1)';
              border = '2px solid #dc2626';
              col = '#dc2626';
            }
          }
          return (
            <button
              key={i}
              onClick={() => pick(opt)}
              style={{
                padding: '12px 16px',
                borderRadius: 12,
                border,
                background: bg,
                color: col,
                fontWeight: 700,
                fontSize: 15,
                textAlign: 'left',
                cursor: chosen ? 'default' : 'pointer',
                fontFamily: "'Outfit',sans-serif",
                transition: 'all .15s',
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {chosen !== null && (
        <div
          style={{
            background: chosen === item.correct ? 'rgba(5,150,105,.08)' : 'rgba(220,38,38,.07)',
            border: `1.5px solid ${chosen === item.correct ? 'rgba(5,150,105,.3)' : 'rgba(220,38,38,.3)'}`,
            borderRadius: 12,
            padding: '12px 14px',
            marginBottom: 14,
            animation: 'pd-pop .2s ease both',
          }}
        >
          <div
            style={{
              fontWeight: 800,
              color: chosen === item.correct ? '#059669' : '#dc2626',
              marginBottom: 4,
              fontSize: 13,
            }}
          >
            {chosen === item.correct ? '✓ Točno!' : '✗ Netočno'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--subtext)', lineHeight: 1.5 }}>
            {item.explanation}
          </div>
        </div>
      )}

      {chosen !== null && (
        <button onClick={next} style={btnStyle(chosen === item.correct ? '#059669' : '#d97706')}>
          {idx + 1 >= total ? 'Završi' : 'Sljedeće →'}
        </button>
      )}
    </div>
  );
}

// ─── SHARED BUTTON STYLE ─────────────────────────────────────────────────────
function btnStyle(color: string) {
  return {
    width: '100%',
    padding: '14px 16px',
    borderRadius: 14,
    border: 'none',
    background: color,
    color: '#fff',
    fontWeight: 800,
    fontSize: 15,
    cursor: 'pointer',
    fontFamily: "'Outfit',sans-serif",
    letterSpacing: '.02em',
  };
}

// ─── MODE CARDS ──────────────────────────────────────────────────────────────
const MODES = [
  {
    id: 'transform',
    icon: '🔄',
    title: 'Preoblikuj',
    titleEn: 'Transform',
    desc: 'Negate, change tense, transform sentences — you generate the answer',
    time: '~8 min',
    difficulty: 'A2+',
    color: '#7c3aed',
  },
  {
    id: 'translate',
    icon: '🌍',
    title: 'Prevedi',
    titleEn: 'Translate',
    desc: 'English → Croatian — produce full natural sentences',
    time: '~10 min',
    difficulty: 'A2–B2',
    color: '#0e7490',
  },
  {
    id: 'build',
    icon: '🧩',
    title: 'Složi rečenicu',
    titleEn: 'Build a Sentence',
    desc: 'Arrange shuffled word tiles into the correct Croatian sentence',
    time: '~6 min',
    difficulty: 'A2+',
    color: '#059669',
  },
  {
    id: 'error',
    icon: '🔍',
    title: 'Ispravi grešku',
    titleEn: 'Correct the Error',
    desc: 'Spot the grammatical mistake and choose the correct form',
    time: '~8 min',
    difficulty: 'A2–B1',
    color: '#d97706',
  },
];

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────
interface ProductionDrillProps {
  goBack: () => void;
  award: (n: number, celebrate?: boolean, activityType?: string) => void;
}
export default function ProductionDrillScreen({ goBack, award }: ProductionDrillProps) {
  const [mode, setMode] = useState<string | null>(null);

  // Adaptive session tracking — difficulty starts at 4 (free production exercises)
  const { onCorrect, onWrong, sessionSummary, reset } = useAdaptiveSession(4);

  // Category per mode: each production mode maps to a SkillCategory
  const MODE_CATEGORY = {
    transform: 'vocab-b1',
    translate: 'vocab-b2',
    build: 'vocab-b1',
    error: 'vocab-b1',
  } as const;

  function handleDone() {
    markQuest('grammar');
    // Rate each category based on session accuracy
    const summary = sessionSummary();
    for (const [cat, accuracy] of Object.entries(summary) as Array<[string, number]>) {
      rateCategorySession(cat as Parameters<typeof rateCategorySession>[0], accuracy);
    }
    reset();
    setMode(null);
  }

  // Callbacks bound to the current mode's category
  function makeOnCorrect() {
    const cat = mode
      ? (MODE_CATEGORY[mode as keyof typeof MODE_CATEGORY] ?? 'vocab-b1')
      : 'vocab-b1';
    return () => onCorrect(cat);
  }
  function makeOnWrong() {
    const cat = mode
      ? (MODE_CATEGORY[mode as keyof typeof MODE_CATEGORY] ?? 'vocab-b1')
      : 'vocab-b1';
    return () => onWrong(cat);
  }

  return (
    <div style={{ padding: '0 0 32px', fontFamily: "'Outfit',sans-serif" }}>
      <style>{STYLES}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 8px' }}>
        <button
          onClick={mode ? () => setMode(null) : goBack}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 22,
            cursor: 'pointer',
            color: 'var(--heading)',
            padding: 4,
          }}
        >
          ←
        </button>
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--heading)' }}>
            {mode ? MODES.find((m) => m.id === mode)?.title : 'Production Drill'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--subtext)' }}>
            {mode ? MODES.find((m) => m.id === mode)?.titleEn : 'Active output practice'}
          </div>
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>
        {!mode && (
          <div>
            <p style={{ fontSize: 13, color: 'var(--subtext)', marginBottom: 20, lineHeight: 1.6 }}>
              Generate language — don't just pick answers. Choose a production mode:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '16px 18px',
                    borderRadius: 16,
                    border: `1.5px solid ${m.color}22`,
                    background: `${m.color}0d`,
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: "'Outfit',sans-serif",
                  }}
                >
                  <div
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 14,
                      flexShrink: 0,
                      background: m.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 24,
                      boxShadow: `0 4px 12px ${m.color}44`,
                    }}
                  >
                    {m.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 900,
                        color: 'var(--heading)',
                        marginBottom: 2,
                      }}
                    >
                      {m.title}{' '}
                      <span style={{ fontWeight: 500, color: 'var(--subtext)', fontSize: 13 }}>
                        — {m.titleEn}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--subtext)',
                        lineHeight: 1.4,
                        marginBottom: 6,
                      }}
                    >
                      {m.desc}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          color: m.color,
                          background: `${m.color}18`,
                          padding: '2px 8px',
                          borderRadius: 99,
                        }}
                      >
                        {m.difficulty}
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--subtext)' }}>
                        ⏱ {m.time}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: 20, color: m.color, opacity: 0.7 }}>›</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {mode === 'transform' && (
          <ModeTransform
            onDone={handleDone}
            award={award}
            onCorrect={makeOnCorrect()}
            onWrong={makeOnWrong()}
          />
        )}
        {mode === 'translate' && (
          <ModeTranslate
            onDone={handleDone}
            award={award}
            onCorrect={makeOnCorrect()}
            onWrong={makeOnWrong()}
          />
        )}
        {mode === 'build' && (
          <ModeBuild
            onDone={handleDone}
            award={award}
            onCorrect={makeOnCorrect()}
            onWrong={makeOnWrong()}
          />
        )}
        {mode === 'error' && (
          <ModeErrorCorrect
            onDone={handleDone}
            award={award}
            onCorrect={makeOnCorrect()}
            onWrong={makeOnWrong()}
          />
        )}
      </div>
    </div>
  );
}
