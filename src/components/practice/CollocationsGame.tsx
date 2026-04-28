import React, { useState, useRef } from 'react';
import { H, Bar } from '../../data';

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
    q: '___ grešku (to make a mistake)',
    opts: ['napraviti', 'učiniti', 'raditi', 'izvesti'],
    answer: 'napraviti',
    en: 'napraviti grešku',
    tip: "'napraviti grešku' is the correct collocation. 'učiniti grešku' sounds bookish.",
  },
  {
    q: '___ odluku (to make a decision)',
    opts: ['donijeti', 'napraviti', 'učiniti', 'raditi'],
    answer: 'donijeti',
    en: 'donijeti odluku',
    tip: "Decisions are 'brought' in Croatian: donijeti odluku",
  },
  {
    q: '___ pitanje (to ask a question)',
    opts: ['postaviti', 'napraviti', 'reći', 'govoriti'],
    answer: 'postaviti',
    en: 'postaviti pitanje',
    tip: "Questions are 'placed/set': postaviti pitanje",
  },
  {
    q: '___ posao (to find a job)',
    opts: ['naći', 'dobiti', 'uzeti', 'uzimati'],
    answer: 'naći',
    en: 'naći posao',
    tip: "'naći posao' = find a job. 'dobiti posao' = get/receive a job (both possible but naći is more natural)",
  },
  {
    q: '___ ispitu (to pass an exam)',
    opts: ['položiti', 'proći', 'dobiti', 'uzeti'],
    answer: 'položiti',
    en: 'položiti ispit',
    tip: "Exams are 'laid down' in Croatian: položiti ispit",
  },
  {
    q: '___ pažnju (to pay attention)',
    opts: ['obratiti', 'platiti', 'dati', 'staviti'],
    answer: 'obratiti',
    en: 'obratiti pažnju',
    tip: "'Obratiti pažnju' — turn attention to something",
  },
  {
    q: '___ odgovornost (to take responsibility)',
    opts: ['preuzeti', 'uzeti', 'nositi', 'imati'],
    answer: 'preuzeti',
    en: 'preuzeti odgovornost',
    tip: "Responsibility is 'taken over': preuzeti odgovornost",
  },
  {
    q: '___ prijedlog (to make a proposal)',
    opts: ['iznijeti', 'napraviti', 'reći', 'dati'],
    answer: 'iznijeti',
    en: 'iznijeti prijedlog',
    tip: "Proposals are 'brought out': iznijeti prijedlog",
  },
  {
    q: '___ korak (to take a step)',
    opts: ['napraviti', 'ući', 'hodati', 'ići'],
    answer: 'napraviti',
    en: 'napraviti korak',
    tip: "'Napraviti korak naprijed' = take a step forward",
  },
  {
    q: '___ razgovor (to have a conversation)',
    opts: ['voditi', 'imati', 'reći', 'raditi'],
    answer: 'voditi',
    en: 'voditi razgovor',
    tip: "Conversations are 'led': voditi razgovor",
  },
  {
    q: '___ zahvalu (to express gratitude)',
    opts: ['izraziti', 'reći', 'dati', 'pokazati'],
    answer: 'izraziti',
    en: 'izraziti zahvalu',
    tip: "Gratitude is 'expressed': izraziti zahvalu",
  },
  {
    q: '___ ulogu (to play a role)',
    opts: ['igrati', 'glumiti', 'raditi', 'imati'],
    answer: 'igrati',
    en: 'igrati ulogu',
    tip: "'Igrati ulogu' = play a role, like in theatre",
  },
  {
    q: '___ provjeru (to carry out a check)',
    opts: ['provesti', 'napraviti', 'raditi', 'uzeti'],
    answer: 'provesti',
    en: 'provesti provjeru',
    tip: "Checks/investigations are 'conducted': provesti provjeru",
  },
  {
    q: '___ vatrometom (to end with fireworks)',
    opts: ['završiti', 'završavati', 'prestati', 'okončati'],
    answer: 'završiti',
    en: 'završiti vatrometom',
    tip: "'Završiti vatrometom' = end with fireworks",
  },
  {
    q: '___ vijesti (to watch the news)',
    opts: ['gledati', 'čitati', 'slušati', 'pratiti'],
    answer: 'gledati',
    en: 'gledati vijesti',
    tip: "TV news is 'watched': gledati vijesti. Radio news is 'listened to'.",
  },
  {
    q: '___ glazbu (to listen to music)',
    opts: ['slušati', 'gledati', 'čuti', 'uživati'],
    answer: 'slušati',
    en: 'slušati glazbu',
    tip: "Music is always 'listened to': slušati glazbu",
  },
  {
    q: '___ plan (to make a plan)',
    opts: ['napraviti', 'donijeti', 'izvesti', 'planirati'],
    answer: 'napraviti',
    en: 'napraviti plan',
    tip: "'Napraviti plan' — make a plan",
  },
  {
    q: '___ prijavu (to submit an application)',
    opts: ['podnijeti', 'dati', 'predati', 'uzeti'],
    answer: 'podnijeti',
    en: 'podnijeti prijavu',
    tip: "Applications are 'submitted' (podnijeti) to authorities",
  },
  {
    q: '___ šansu (to give a chance)',
    opts: ['dati', 'napraviti', 'uzeti', 'dobiti'],
    answer: 'dati',
    en: 'dati šansu',
    tip: "'Dati šansu' = give a chance",
  },
  {
    q: '___ novu tehnologiju (to adopt new technology)',
    opts: ['prihvatiti', 'uzeti', 'dobiti', 'imati'],
    answer: 'prihvatiti',
    en: 'prihvatiti novu tehnologiju',
    tip: "Technology/ideas are 'accepted/adopted': prihvatiti",
  },
  {
    q: '___ brzinom (to travel at speed)',
    opts: ['kretati se', 'ići', 'voziti se', 'hodati'],
    answer: 'kretati se',
    en: 'kretati se velikom brzinom',
    tip: "Movement collocates with 'kretati se' when describing manner of movement",
  },
  {
    q: '___ obvezu (to fulfil an obligation)',
    opts: ['ispuniti', 'napraviti', 'nositi', 'imati'],
    answer: 'ispuniti',
    en: 'ispuniti obvezu',
    tip: "Obligations are 'fulfilled': ispuniti obvezu",
  },
  {
    q: '___ napredak (to make progress)',
    opts: ['ostvariti', 'napraviti', 'raditi', 'ići'],
    answer: 'ostvariti',
    en: 'ostvariti napredak',
    tip: "Progress is 'realised/achieved': ostvariti napredak",
  },
  {
    q: '___ san (to fulfil a dream)',
    opts: ['ostvariti', 'napraviti', 'imati', 'sanjati'],
    answer: 'ostvariti',
    en: 'ostvariti san',
    tip: "Dreams are 'realised': ostvariti san",
  },
  {
    q: '___ posjet (to pay a visit)',
    opts: ['uputiti', 'napraviti', 'platiti', 'ići'],
    answer: 'uputiti',
    en: 'uputiti posjet',
    tip: "Visits are 'directed/made': uputiti posjet or 'platiti posjet' (both used)",
  },
];

interface Props {
  goBack: () => void;
  award?: (xp: number, celebrate?: boolean, activityType?: string) => void;
}
export default function CollocationsGame({ goBack, award }: Props) {
  const finishFired = useRef(false);
  const [qs] = useState(() => shLocal(DATA).map((item) => ({ ...item, opts: shLocal([...item.opts]) })));
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState(-1);

  const total = qs.length;

  if (!qs.length) return null;

  if (idx >= total) {
    return (
      <div className="scr-wrap">
        {H('🔀 Collocations', 'Which words belong together in Croatian?', goBack)}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 64 }}>{score >= total * 0.8 ? '🏆' : '📚'}</div>
          <h2>
            {score} / {total}
          </h2>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#d97706', margin: '8px 0 16px' }}>
            +{score * 5} XP
          </div>
          <button
            className="b bp"
            onClick={() => {
              if (finishFired.current) return;
              finishFired.current = true;
              if (typeof award === 'function') award(score * 5, false, 'vocabulary');
              goBack();
            }}
            style={{ width: '100%', marginTop: 16 }}
          >
            🏠 Done
          </button>
        </div>
      </div>
    );
  }

  const q = qs[idx]!;

  return (
    <div className="scr-wrap">
      {H('🔀 Collocations', 'Which words belong together in Croatian?', goBack)}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>
          {idx + 1} / {total}
        </span>
        <span style={{ color: '#0e7490', fontWeight: 700 }}>Score: {score}</span>
      </div>
      <Bar v={idx + 1} mx={total} />
      <div className="c" style={{ marginTop: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 600 }}>{q.q}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 16 }}>
        {q.opts.map((o: string, oi: number) => (
          <button
            key={oi}
            className="ob"
            style={{
              textAlign: 'center',
              background: answered
                ? o === q.answer
                  ? '#dcfce7'
                  : selected === oi
                    ? '#fee2e2'
                    : 'white'
                : 'white',
              borderColor: answered
                ? o === q.answer
                  ? '#16a34a'
                  : selected === oi
                    ? '#dc2626'
                    : 'rgba(14,116,144,.12)'
                : 'rgba(14,116,144,.12)',
            }}
            onClick={() => {
              if (!answered) {
                setSelected(oi);
                setAnswered(true);
                if (o === q.answer) setScore(score + 1);
              }
            }}
          >
            {o}
          </button>
        ))}
      </div>
      {answered && (
        <div
          style={{
            background: '#f0f9ff',
            borderRadius: 12,
            padding: '12px 16px',
            marginTop: 12,
            border: '1.5px solid #bae6fd',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 800, color: '#0369a1', marginBottom: 2 }}>
            ✅ {q.en}
          </div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: '#0369a1',
              marginBottom: 4,
              marginTop: 8,
            }}
          >
            💡 Tip
          </div>
          <div style={{ fontSize: 13, color: '#075985' }}>{q.tip}</div>
        </div>
      )}
      {answered && (
        <button
          className="b bp"
          style={{ width: '100%', marginTop: 16 }}
          onClick={() => {
            setIdx(idx + 1);
            setAnswered(false);
            setSelected(-1);
          }}
        >
          Next →
        </button>
      )}
    </div>
  );
}
