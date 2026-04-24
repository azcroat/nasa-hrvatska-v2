import React, { useState, useRef } from 'react';
import { H, Bar, speak, sh } from '../../data';
import { markQuest } from '../../lib/quests.js';
import { useStats } from '../../context/StatsContext.tsx';
import { recordTopicResult } from '../../lib/adaptive.ts';

// ── Future I: ću + infinitive paradigm ────────────────────────────────────────
const FUTURE1_PARADIGM = [
  { person: 'Ja', clitic: 'ću', full: 'ću raditi', short: 'Radit ću', en: 'I will work' },
  { person: 'Ti', clitic: 'ćeš', full: 'ćeš raditi', short: 'Radit ćeš', en: 'you will work' },
  {
    person: 'On/Ona/Ono',
    clitic: 'će',
    full: 'će raditi',
    short: 'Radit će',
    en: 'he/she will work',
  },
  { person: 'Mi', clitic: 'ćemo', full: 'ćemo raditi', short: 'Radit ćemo', en: 'we will work' },
  {
    person: 'Vi',
    clitic: 'ćete',
    full: 'ćete raditi',
    short: 'Radit ćete',
    en: 'you (pl) will work',
  },
  {
    person: 'Oni/One/Ona',
    clitic: 'će',
    full: 'će raditi',
    short: 'Radit će',
    en: 'they will work',
  },
];

// ── Future II: budem + L-participle ───────────────────────────────────────────
const FUTURE2_PARADIGM = [
  { person: 'Ja', form: 'budem radio/radila', en: 'when I have worked' },
  { person: 'Ti', form: 'budeš radio/radila', en: 'when you have worked' },
  { person: 'On/Ona/Ono', form: 'bude radio/radila', en: 'when he/she has worked' },
  { person: 'Mi', form: 'budemo radili/radile', en: 'when we have worked' },
  { person: 'Vi', form: 'budete radili/radile', en: 'when you (pl) have worked' },
  { person: 'Oni/One/Ona', form: 'budu radili/radile', en: 'when they have worked' },
];

const FUTURE2_CONTRASTS = [
  {
    en: "When I finish, I'll call you.",
    wrong: 'Kada završim, nazvat ću te.',
    right: 'Kad budem završio, nazvat ću te.',
    note: 'Future II in the subordinate "kad" clause',
  },
  {
    en: 'If you have time, come visit.',
    wrong: 'Ako imaš vremena, dođi.',
    right: 'Ako budeš imao vremena, dođi.',
    note: 'Future II after "ako" for future condition',
  },
  {
    en: "As soon as she arrives, we'll eat.",
    wrong: 'Čim dođe, jesti ćemo.',
    right: 'Čim bude došla, jesti ćemo.',
    note: '"čim" + Future II marks the triggering event',
  },
  {
    en: "Once I learn Croatian, I'll move to Split.",
    wrong: 'Kada naučim hrvatski, preselit ću se u Split.',
    right: 'Kad budem naučio hrvatski, preselit ću se u Split.',
    note: 'The Croatian future perfect — completed condition',
  },
  {
    en: 'Whoever works hard will succeed.',
    wrong: 'Tko radi, uspijet će.',
    right: 'Tko bude radio, uspijet će.',
    note: 'Future II in relative clause with future reference',
  },
];

// ── Negative future paradigm ──────────────────────────────────────────────────
const NEG_PARADIGM = [
  { person: 'Ja', neg: 'neću', example: 'Neću ići na posao.', en: "I won't go to work." },
  { person: 'Ti', neg: 'nećeš', example: 'Nećeš to učiniti.', en: "You won't do that." },
  {
    person: 'On/Ona/Ono',
    neg: 'neće',
    example: 'Neće doći večeras.',
    en: "He/she won't come tonight.",
  },
  { person: 'Mi', neg: 'nećemo', example: 'Nećemo čekati dugo.', en: "We won't wait long." },
  { person: 'Vi', neg: 'nećete', example: 'Nećete požaliti.', en: "You won't regret it." },
  {
    person: 'Oni/One/Ona',
    neg: 'neće',
    example: 'Neće nas slušati.',
    en: "They won't listen to us.",
  },
];

// ── Quiz ───────────────────────────────────────────────────────────────────────
const QUIZ_QS = [
  {
    type: 'fut1',
    prompt: 'Select the correct Future I form for "Mi"',
    hint: '1st person plural ću-form',
    answer: 'ćemo',
    opts: ['ćemo', 'ćete', 'ću', 'će'],
  },
  {
    type: 'fut2',
    prompt: '"Kad ___ gotov, nazvat ću te." — Fill in Future II (ja, m)',
    hint: 'Future II: budem + L-participle (bio)',
    answer: 'budem bio',
    opts: ['budem bio', 'biti ću', 'budem biti', 'sam bio'],
  },
  {
    type: 'neg',
    prompt: '"She won\'t come" — negative future of ona + doći',
    hint: '3rd sg negative: neće',
    answer: 'Neće doći.',
    opts: ['Neće doći.', 'Nije došla.', 'Ne će doći.', 'Nećeš doći.'],
  },
  {
    type: 'short',
    prompt: '"Ja ću čitati" — what is the short form?',
    hint: 'Infinitive drops -i, clitic follows first word',
    answer: 'Čitat ću',
    opts: ['Čitat ću', 'Ću čitati', 'Čitati ću', 'Čita ću'],
  },
  {
    type: 'fut2',
    prompt: 'Which sentence correctly uses Future II?',
    hint: '"Ako/Kad" + future condition → Future II in subordinate clause',
    answer: 'Ako budeš imao vremena, dođi.',
    opts: [
      'Ako ćeš imati vremena, dođi.',
      'Ako budeš imao vremena, dođi.',
      'Ako imaš, dođi ćeš.',
      'Kada imaš vremena, dolazit ćeš.',
    ],
  },
  {
    type: 'fut1',
    prompt: 'Select the correct Future I form for "Vi"',
    hint: '2nd person plural ću-form',
    answer: 'ćete',
    opts: ['ćete', 'ćemo', 'će', 'ćeš'],
  },
  {
    type: 'neg',
    prompt: '"We won\'t wait" — negative future of mi + čekati',
    hint: '1st plural negative: nećemo',
    answer: 'Nećemo čekati.',
    opts: ['Nećemo čekati.', 'Nismo čekali.', 'Ne čekamo.', 'Neću čekati.'],
  },
  {
    type: 'interrog',
    prompt: '"Will they come?" — interrogative future with "li"',
    hint: 'Question: Hoće li + infinitive?',
    answer: 'Hoće li doći?',
    opts: ['Hoće li doći?', 'Će li doći?', 'Doći će li?', 'Hoćeš li doći?'],
  },
  {
    type: 'fut2',
    prompt: '"Čim ___ učio, nazvat ćeš me." (ti, m) — Future II',
    hint: '"Čim" + Future II: budeš + L-participle',
    answer: 'budeš',
    opts: ['budeš', 'ćeš', 'si', 'bude'],
  },
  {
    type: 'fut1',
    prompt: '"Oni ___ putovati u Zagreb." — Future I',
    hint: '3rd plural: će',
    answer: 'će',
    opts: ['će', 'ćemo', 'ćete', 'ću'],
  },
  {
    type: 'short',
    prompt: '"Ti ćeš pisati" — what is the short form?',
    hint: 'Infinitive drops -i, clitic after first word',
    answer: 'Pisat ćeš',
    opts: ['Pisat ćeš', 'Ćeš pisati', 'Pisati ćeš', 'Pišeš ćeš'],
  },
  {
    type: 'neg',
    prompt: '"I won\'t go to work" — negative future of ja + ići',
    hint: '1st sg negative: neću',
    answer: 'Neću ići na posao.',
    opts: [
      'Neću ići na posao.',
      'Nisam išao na posao.',
      'Ne idem na posao.',
      'Nećeš ići na posao.',
    ],
  },
];

interface QuizQ {
  type: string;
  prompt: string;
  hint: string;
  answer: string;
  opts: string[];
}
export default function FutureTenseLessonScreen({
  goBack,
  award,
}: {
  goBack: () => void;
  award?: (xp: number, celebrate?: boolean, activityType?: string) => void;
}) {
  const { stats, setStats, writeDelta } = useStats();
  const finishFired = useRef(false);
  const [tab, setTab] = useState('fut1');

  // Quiz state
  const [quizQs, setQuizQs] = useState<QuizQ[]>([]);
  const [qi, setQi] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState(-1);
  const [opts, setOpts] = useState<string[]>([]);

  function startQuiz() {
    const shuffled = sh([...QUIZ_QS]);
    setQuizQs(shuffled);
    setQi(0);
    setScore(0);
    setAnswered(false);
    setSelected(-1);
    setOpts(shuffled[0]?.opts ?? []);
    setTab('quiz');
  }

  const TABS = [
    { id: 'fut1', label: '⚡ Futur I' },
    { id: 'fut2', label: '🔄 Futur II' },
    { id: 'neg', label: '🚫 Negacija' },
    { id: 'quiz', label: '🏆 Vježba' },
  ];

  return (
    <div className="scr-wrap">
      {H('🚀 Future Tense', 'Buduće vrijeme — Futur I, Futur II, Negacija (A2–B1)', goBack)}

      {/* Tab bar */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          marginBottom: 16,
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            className={'b ' + (tab === t.id ? 'bp' : 'bg')}
            style={{ fontSize: 12, padding: '7px 12px', whiteSpace: 'nowrap', flexShrink: 0 }}
            onClick={() => {
              if (t.id === 'quiz') startQuiz();
              else setTab(t.id);
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB 1: Future I ───────────────────────────────────────────── */}
      {tab === 'fut1' && (
        <div>
          {/* Formula card */}
          <div
            className="c"
            style={{
              marginBottom: 14,
              borderLeft: '4px solid #7c3aed',
              background: 'linear-gradient(135deg,#faf5ff,#ede9fe)',
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 900,
                color: '#7c3aed',
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: '.08em',
              }}
            >
              Formula — Future I
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#4c1d95', marginBottom: 8 }}>
              Subject + ću/ćeš/će/ćemo/ćete/će + infinitive
            </div>
            <div style={{ fontSize: 13, color: '#6d28d9', lineHeight: 1.7 }}>
              <b>Ja ću raditi.</b> &nbsp;·&nbsp; I will work
              <br />
              <b>Ona će doći.</b> &nbsp;·&nbsp; She will come
              <br />
              <b>Mi ćemo učiti.</b> &nbsp;·&nbsp; We will study
            </div>
          </div>

          {/* Conjugation table */}
          <div
            className="c"
            style={{
              padding: 0,
              overflow: 'hidden',
              marginBottom: 14,
              borderLeft: '4px solid #7c3aed',
            }}
          >
            <div
              style={{
                padding: '12px 16px',
                background: 'linear-gradient(135deg,#7c3aed,#5b21b6)',
                color: '#fff',
              }}
            >
              <div style={{ fontSize: 17, fontWeight: 800 }}>raditi — Future I</div>
              <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>
                Long form (formal) and short form (spoken)
              </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr
                  style={{ borderBottom: '2px solid var(--card-b)', background: 'var(--bar-bg)' }}
                >
                  <th
                    style={{
                      padding: '8px 14px',
                      textAlign: 'left',
                      fontSize: 11,
                      fontWeight: 800,
                      color: 'var(--subtext)',
                      textTransform: 'uppercase',
                    }}
                  >
                    Person
                  </th>
                  <th
                    style={{
                      padding: '8px 14px',
                      textAlign: 'left',
                      fontSize: 11,
                      fontWeight: 800,
                      color: 'var(--subtext)',
                      textTransform: 'uppercase',
                    }}
                  >
                    Long form
                  </th>
                  <th
                    style={{
                      padding: '8px 14px',
                      textAlign: 'left',
                      fontSize: 11,
                      fontWeight: 800,
                      color: 'var(--subtext)',
                      textTransform: 'uppercase',
                    }}
                  >
                    Short form
                  </th>
                </tr>
              </thead>
              <tbody>
                {FUTURE1_PARADIGM.map((row, i) => (
                  <tr
                    key={i}
                    style={{ borderBottom: '1px solid var(--card-b)', cursor: 'pointer' }}
                    onClick={() => speak(row.person + ' ' + row.full)}
                  >
                    <td
                      style={{
                        padding: '10px 14px',
                        fontWeight: 700,
                        color: '#7c3aed',
                        fontSize: 13,
                      }}
                    >
                      {row.person}
                    </td>
                    <td
                      style={{
                        padding: '10px 14px',
                        fontWeight: 700,
                        fontSize: 14,
                        color: '#4c1d95',
                      }}
                    >
                      {row.full} <span aria-hidden="true">🔊</span>
                    </td>
                    <td
                      style={{
                        padding: '10px 14px',
                        fontSize: 13,
                        color: '#059669',
                        fontWeight: 700,
                      }}
                    >
                      {row.short}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Short form explanation */}
          <div
            className="c"
            style={{ marginBottom: 14, borderLeft: '4px solid #059669', background: '#f0fdf4' }}
          >
            <div style={{ fontSize: 13, fontWeight: 800, color: '#065f46', marginBottom: 6 }}>
              Short form — spoken Croatian
            </div>
            <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.8 }}>
              In everyday speech, the infinitive drops final <b>-i</b> and the clitic follows the
              first word of the clause:
              <br />
              <b>Čitat ću</b> (I will read) · <b>Pisat ćeš</b> (you will write)
              <br />
              <b>Ić ću</b> → but irregular: <b>Ići ću</b> is also accepted for ići
              <br />
              <br />
              Clitic placement: the ću-form is a <em>clitic</em> — it cannot start a sentence. It
              attaches after the first accented word or phrase.
            </div>
          </div>

          {/* Common verbs */}
          <div className="c" style={{ borderLeft: '4px solid #0e7490' }}>
            <div className="sh" style={{ marginBottom: 10 }}>
              10 common verbs in Future I (tap to hear)
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {[
                'Ići ću',
                'Doći ćeš',
                'Raditi ćemo',
                'Pisati će',
                'Čitati ćete',
                'Gledati ću',
                'Jesti ćemo',
                'Piti će',
                'Učiti ćeš',
                'Putovati ću',
              ].map((s, i) => (
                <button
                  key={i}
                  onClick={() => speak(s)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 10,
                    border: '1px solid rgba(14,116,144,.3)',
                    background: 'rgba(14,116,144,.08)',
                    color: '#0e7490',
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  {s} 🔊
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: Future II ──────────────────────────────────────────── */}
      {tab === 'fut2' && (
        <div>
          <div
            className="c"
            style={{ marginBottom: 14, borderLeft: '4px solid #dc2626', background: '#fef2f2' }}
          >
            <div style={{ fontSize: 13, fontWeight: 800, color: '#dc2626', marginBottom: 4 }}>
              What is Future II?
            </div>
            <div style={{ fontSize: 12, color: '#78716c', lineHeight: 1.7 }}>
              Future II (futur egzaktni) expresses a future action that will be{' '}
              <b>completed before</b> another future action. It is used in subordinate clauses after{' '}
              <b>kad(a)</b> (when), <b>ako</b> (if), <b>čim</b> (as soon as), <b>dok</b>{' '}
              (while/until). English speakers often mistakenly use present tense here — Croatian
              requires Future II. This is one of the features that most distinguishes Croatian from
              English.
            </div>
          </div>

          {/* Formula */}
          <div
            className="c"
            style={{
              marginBottom: 14,
              borderLeft: '4px solid #7c3aed',
              background: 'linear-gradient(135deg,#faf5ff,#ede9fe)',
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 900,
                color: '#7c3aed',
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: '.08em',
              }}
            >
              Formula — Future II
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#4c1d95', marginBottom: 8 }}>
              budem/budeš/bude/… + L-participle
            </div>
            <div style={{ fontSize: 13, color: '#6d28d9', lineHeight: 1.7 }}>
              <b>Kad budem gotov, nazvat ću te.</b>
              <br />
              When I am done, I will call you.
            </div>
          </div>

          {/* Paradigm table */}
          <div
            className="c"
            style={{
              padding: 0,
              overflow: 'hidden',
              marginBottom: 14,
              borderLeft: '4px solid #dc2626',
            }}
          >
            <div
              style={{
                padding: '12px 16px',
                background: 'linear-gradient(135deg,#dc2626,#9f1239)',
                color: '#fff',
              }}
            >
              <div style={{ fontSize: 17, fontWeight: 800 }}>raditi — Future II (kad + budem)</div>
              <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>
                Used in subordinate clauses
              </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {FUTURE2_PARADIGM.map((row, i) => (
                  <tr
                    key={i}
                    role="button"
                    tabIndex={0}
                    style={{ borderBottom: '1px solid var(--card-b)', cursor: 'pointer' }}
                    onClick={() => speak(row.person + ' ' + row.form)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        speak(row.person + ' ' + row.form);
                      }
                    }}
                  >
                    <td
                      style={{
                        padding: '10px 14px',
                        fontWeight: 700,
                        color: '#7c3aed',
                        fontSize: 13,
                        width: '28%',
                      }}
                    >
                      {row.person}
                    </td>
                    <td
                      style={{
                        padding: '10px 14px',
                        fontWeight: 700,
                        fontSize: 14,
                        color: '#9f1239',
                      }}
                    >
                      {row.form} <span aria-hidden="true">🔊</span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 11, color: 'var(--subtext)' }}>
                      {row.en}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* English vs Croatian contrasts */}
          <div className="sh" style={{ marginBottom: 10 }}>
            English vs Croatian — 5 real contrasts
          </div>
          {FUTURE2_CONTRASTS.map((c, i) => (
            <div
              key={i}
              className="c"
              style={{ marginBottom: 10, borderLeft: '4px solid #d97706' }}
            >
              <div style={{ fontSize: 12, fontWeight: 800, color: '#d97706', marginBottom: 4 }}>
                {c.en}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div
                  style={{
                    padding: '6px 10px',
                    borderRadius: 8,
                    background: '#dcfce7',
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#166534',
                    cursor: 'pointer',
                  }}
                  onClick={() => speak(c.right)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      speak(c.right);
                    }
                  }}
                >
                  ✓ {c.right} 🔊
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--subtext)', marginTop: 4 }}>💡 {c.note}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB 3: Negation ───────────────────────────────────────────── */}
      {tab === 'neg' && (
        <div>
          <div
            className="c"
            style={{ marginBottom: 14, borderLeft: '4px solid #dc2626', background: '#fef2f2' }}
          >
            <div style={{ fontSize: 13, fontWeight: 800, color: '#dc2626', marginBottom: 4 }}>
              Negative future: neću
            </div>
            <div style={{ fontSize: 12, color: '#78716c', lineHeight: 1.7 }}>
              The negative future uses <b>neću/nećeš/neće/nećemo/nećete/neće</b> + infinitive.
              Unlike positive future, the negative form is one word — it does NOT split.
              <br />
              <br />
              Interrogative: <b>Hoće li + infinitive?</b> — "Will they come?" → "Hoće li doći?" The{' '}
              <b>li</b> particle marks a yes/no question.
            </div>
          </div>

          {/* neću paradigm */}
          <div
            className="c"
            style={{
              padding: 0,
              overflow: 'hidden',
              marginBottom: 14,
              borderLeft: '4px solid #dc2626',
            }}
          >
            <div
              style={{
                padding: '12px 16px',
                background: 'linear-gradient(135deg,#dc2626,#9f1239)',
                color: '#fff',
              }}
            >
              <div style={{ fontSize: 17, fontWeight: 800 }}>
                Negative Future — neću + infinitive
              </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {NEG_PARADIGM.map((row, i) => (
                  <tr
                    key={i}
                    role="button"
                    tabIndex={0}
                    style={{ borderBottom: '1px solid var(--card-b)', cursor: 'pointer' }}
                    onClick={() => speak(row.example)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        speak(row.example);
                      }
                    }}
                  >
                    <td
                      style={{
                        padding: '10px 14px',
                        fontWeight: 700,
                        color: '#dc2626',
                        fontSize: 13,
                        width: '22%',
                      }}
                    >
                      {row.neg}
                    </td>
                    <td
                      style={{
                        padding: '10px 14px',
                        fontWeight: 700,
                        fontSize: 14,
                        color: 'var(--heading)',
                      }}
                    >
                      {row.example} <span aria-hidden="true">🔊</span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 11, color: 'var(--subtext)' }}>
                      {row.en}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Interrogative */}
          <div className="c" style={{ marginBottom: 14, borderLeft: '4px solid #0e7490' }}>
            <div className="sh" style={{ marginBottom: 10 }}>
              Interrogative Future — Hoće li …?
            </div>
            {[
              { q: 'Hoće li doći?', a: 'Yes/No: Will they come?' },
              { q: 'Hoćeš li ići?', a: 'Will you go?' },
              { q: 'Hoće li biti tu?', a: 'Will he/she be there?' },
              { q: 'Hoćeš li jesti?', a: 'Will you eat?' },
            ].map((pair, i) => (
              <div
                key={i}
                style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}
              >
                <button
                  onClick={() => speak(pair.q)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 10,
                    border: '1px solid rgba(14,116,144,.3)',
                    background: 'rgba(14,116,144,.08)',
                    color: '#0e7490',
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  {pair.q} 🔊
                </button>
                <span style={{ fontSize: 12, color: 'var(--subtext)' }}>{pair.a}</span>
              </div>
            ))}
          </div>

          {/* Contrast card */}
          <div className="c" style={{ borderLeft: '4px solid #f59e0b', background: '#fffbeb' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#92400e', marginBottom: 6 }}>
              Key contrast to remember
            </div>
            <div style={{ fontSize: 12, color: '#78716c', lineHeight: 1.8 }}>
              Positive: <b>Ići ću</b> / <b>Ja ću ići</b> — two words, clitic second
              <br />
              Negative: <b>Neću ići</b> — one merged negative word + infinitive
              <br />
              Question: <b>Hoću li ići?</b> — standard form (hoću + li)
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: Quiz ───────────────────────────────────────────────── */}
      {tab === 'quiz' &&
        (() => {
          if (!quizQs.length) return null;
          const total = quizQs.length;

          if (qi >= total) {
            const pct = Math.round((score / total) * 100);
            const pass = pct >= 60;
            return (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 64, marginBottom: 8 }}>
                  {pct >= 80 ? '🏆' : pct >= 60 ? '👍' : '📚'}
                </div>
                <h2 style={{ fontFamily: "'Playfair Display',serif", color: 'var(--heading)' }}>
                  Future Tense Quiz Done!
                </h2>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#7c3aed', marginBottom: 4 }}>
                  {score} / {total}
                </div>
                <div style={{ fontSize: 14, color: 'var(--subtext)', marginBottom: 16 }}>
                  {pct}% — {pass ? 'Odlično!' : 'Keep practising!'}
                </div>
                {pass && (
                  <div
                    className="c"
                    style={{
                      marginBottom: 16,
                      background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)',
                      borderLeft: '4px solid #16a34a',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#065f46' }}>
                      Quest complete! +20 XP bonus
                    </div>
                    <div style={{ fontSize: 12, color: '#059669', marginTop: 4 }}>
                      Grammar quest marked. Keep building your streak!
                    </div>
                  </div>
                )}
                <button
                  className="b bp"
                  style={{ marginTop: 8, marginRight: 8 }}
                  onClick={() => {
                    if (finishFired.current) return;
                    finishFired.current = true;
                    if (typeof award === 'function') award(score * 5, false, 'grammar');
                    if (pass) {
                      markQuest('grammar');
                      writeDelta && writeDelta({ gc: 1 });
                      if (!stats.vs?.includes('future_tense_lesson')) {
                        setStats((prev) => ({
                          ...prev,
                          gc: (prev.gc || 0) + 1,
                          vs: [...(prev.vs || []), 'future_tense_lesson'],
                        }));
                      }
                    }
                    goBack();
                  }}
                >
                  Finish
                </button>
                <button className="b bg" style={{ marginTop: 8 }} onClick={startQuiz}>
                  Try Again
                </button>
              </div>
            );
          }

          const q = quizQs[qi];
          if (!q) return null;
          const typeColors = {
            fut1: { bg: '#dbeafe', color: '#1e40af', label: 'Future I' },
            fut2: { bg: '#fce7f3', color: '#9d174d', label: 'Future II' },
            neg: { bg: '#fee2e2', color: '#991b1b', label: 'Negative' },
            short: { bg: '#dcfce7', color: '#166534', label: 'Short form' },
            interrog: { bg: '#fef3c7', color: '#92400e', label: 'Question' },
          };
          const tc =
            (typeColors as Record<string, typeof typeColors.fut1>)[q.type] ?? typeColors.fut1;

          return (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>
                  {qi + 1} / {total}
                </span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#7c3aed' }}>
                  Score: {score}
                </span>
              </div>
              <Bar v={qi + 1} mx={total} color="#7c3aed" />
              <div className="c" style={{ marginTop: 16, marginBottom: 16 }}>
                <div style={{ marginBottom: 8 }}>
                  <span
                    style={{
                      padding: '3px 10px',
                      borderRadius: 10,
                      fontSize: 11,
                      fontWeight: 800,
                      background: tc.bg,
                      color: tc.color,
                    }}
                  >
                    {tc.label}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: 'var(--heading)',
                    lineHeight: 1.4,
                  }}
                >
                  {q.prompt}
                </div>
                <div style={{ fontSize: 12, color: 'var(--subtext)', marginTop: 6 }}>
                  💡 {q.hint}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {opts.map((o, oi) => (
                  <button
                    key={oi}
                    className="ob"
                    style={{
                      background: answered
                        ? o === q.answer
                          ? '#dcfce7'
                          : selected === oi
                            ? '#fee2e2'
                            : 'var(--card)'
                        : 'var(--card)',
                      borderColor: answered
                        ? o === q.answer
                          ? '#16a34a'
                          : selected === oi
                            ? '#dc2626'
                            : 'rgba(124,58,237,.12)'
                        : 'rgba(124,58,237,.12)',
                    }}
                    onClick={() => {
                      if (answered) return;
                      setSelected(oi);
                      setAnswered(true);
                      const correct = o === q.answer;
                      if (correct) setScore((s) => s + 1);
                      recordTopicResult('future_tense', correct);
                      recordTopicResult('grammar', correct);
                    }}
                  >
                    {o}
                  </button>
                ))}
              </div>
              {answered && (
                <button
                  className="b bp"
                  style={{ width: '100%', marginTop: 16 }}
                  onClick={() => {
                    const next = qi + 1;
                    if (next < total) {
                      setOpts(quizQs[next]?.opts ?? []);
                      setQi(next);
                      setAnswered(false);
                      setSelected(-1);
                    } else {
                      setQi(total);
                    }
                  }}
                >
                  {qi < total - 1 ? 'Next →' : 'See Results'}
                </button>
              )}
            </div>
          );
        })()}
    </div>
  );
}
