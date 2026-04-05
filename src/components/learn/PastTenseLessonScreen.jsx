import React, { useState, useRef } from 'react';
import { H, Bar, speak, sh } from '../../data.jsx';
import { markQuest } from '../../lib/quests.js';
import { useStats } from '../../context/StatsContext.tsx';

// ── Paradigm data ─────────────────────────────────────────────────────────────
const RADITI_PARADIGM = [
  { person: 'Ja',        aux: 'sam',  mForm: 'radio',  fForm: 'radila',  en: 'I worked' },
  { person: 'Ti',        aux: 'si',   mForm: 'radio',  fForm: 'radila',  en: 'you worked' },
  { person: 'On/Ona/Ono',aux: 'je',   mForm: 'radio',  fForm: 'radila',  en: 'he/she worked', nForm: 'radilo' },
  { person: 'Mi',        aux: 'smo',  mForm: 'radili', fForm: 'radile',  en: 'we worked' },
  { person: 'Vi',        aux: 'ste',  mForm: 'radili', fForm: 'radile',  en: 'you (pl) worked' },
  { person: 'Oni/One/Ona',aux: 'su',  mForm: 'radili', fForm: 'radile',  en: 'they worked', nForm: 'radila' },
];

const IRREGULAR_VERBS = [
  { inf: 'ići',    en: 'to go',     m: 'išao',  f: 'išla',  n: 'išlo',  pl: 'išli' },
  { inf: 'doći',   en: 'to come',   m: 'došao', f: 'došla', n: 'došlo', pl: 'došli' },
  { inf: 'biti',   en: 'to be',     m: 'bio',   f: 'bila',  n: 'bilo',  pl: 'bili' },
  { inf: 'htjeti', en: 'to want',   m: 'htio',  f: 'htjela',n: 'htjelo',pl: 'htjeli' },
  { inf: 'moći',   en: 'to be able',m: 'mogao', f: 'mogla', n: 'moglo', pl: 'mogli' },
  { inf: 'reći',   en: 'to say',    m: 'rekao', f: 'rekla', n: 'reklo', pl: 'rekli' },
  { inf: 'vidjeti',en: 'to see',    m: 'vidio', f: 'vidjela',n:'vidjelo',pl: 'vidjeli' },
  { inf: 'naći',   en: 'to find',   m: 'našao', f: 'našla', n: 'našlo', pl: 'našli' },
];

const EXAMPLES = [
  { hr: 'Juče sam bio u Splitu.', en: 'Yesterday I was in Split. (m)' },
  { hr: 'Ana je studirala na Filozofskom fakultetu.', en: 'Ana studied at the Faculty of Philosophy.' },
  { hr: 'Nismo razumjeli što je rekao.', en: "We didn't understand what he said." },
  { hr: 'Jesi li vidio utakmicu sinoć?', en: 'Did you watch the match last night? (m)' },
  { hr: 'Mama je skuhala ručak.', en: 'Mum cooked lunch.' },
  { hr: 'Nisu mogli doći na vjenčanje.', en: 'They could not come to the wedding.' },
  { hr: 'Svaki dan sam učio po sat vremena.', en: 'I studied an hour every day. (habitual, impf)' },
  { hr: 'Naučio sam sve riječi za ispit.', en: 'I learned all the words for the exam. (completed, perf)' },
  { hr: 'Vratio sam se kući kasno.', en: 'I returned home late. (reflexive: vratio sam se)' },
  { hr: 'Gdje ste bili na ljetovanju?', en: 'Where did you go on holiday?' },
];

// ── Quiz data ─────────────────────────────────────────────────────────────────
const QUIZ_QS = [
  {
    type: 'participle',
    prompt: 'Ja (f) + pisati → ?',
    hint: 'pisati → pis- → pis-ala',
    answer: 'pisala',
    opts: ['pisala', 'pisao', 'pisali', 'pisalo'],
  },
  {
    type: 'aux',
    prompt: 'Which auxiliary goes with "Vi"?',
    hint: 'Auxiliary for 2nd person plural',
    answer: 'ste',
    opts: ['smo', 'ste', 'su', 'si'],
  },
  {
    type: 'participle',
    prompt: 'On + ići → ?',
    hint: 'ići is irregular: išao (m)',
    answer: 'išao',
    opts: ['išao', 'išla', 'išli', 'otišao'],
  },
  {
    type: 'negative',
    prompt: '"I (m) didn\'t work" — negative past of ja + raditi',
    hint: 'Negative auxiliary: nisam',
    answer: 'Nisam radio.',
    opts: ['Nisam radio.', 'Ne sam radio.', 'Sam ne radio.', 'Nismo radio.'],
  },
  {
    type: 'participle',
    prompt: 'One (f pl) + doći → ?',
    hint: 'doći is irregular; feminine plural → došle',
    answer: 'došle',
    opts: ['došle', 'došla', 'došli', 'doći'],
  },
  {
    type: 'aux',
    prompt: 'Which auxiliary goes with "Ona"?',
    hint: '3rd person singular auxiliary',
    answer: 'je',
    opts: ['je', 'si', 'su', 'smo'],
  },
  {
    type: 'aspect',
    prompt: 'Which sentence describes a COMPLETED action?',
    hint: 'Perfective = completed. Imperfective = habitual/ongoing.',
    answer: 'Naučio sam lekciju.',
    opts: ['Svaki dan sam učio.', 'Naučio sam lekciju.', 'Učio sam dok je spavao.', 'Uvijek sam učio kasno.'],
  },
  {
    type: 'participle',
    prompt: 'Ja (m) + moći → ?',
    hint: 'moći irregular: mogao (m)',
    answer: 'mogao',
    opts: ['mogao', 'mogla', 'moći', 'možao'],
  },
  {
    type: 'negative',
    prompt: '"She didn\'t come" — negative past of ona + doći',
    hint: 'Negative auxiliary for 3rd sg: nije',
    answer: 'Nije došla.',
    opts: ['Nije došla.', 'Nisam došla.', 'Ne je došla.', 'Nije doći.'],
  },
  {
    type: 'participle',
    prompt: 'Mi (mixed group) + vidjeti → ?',
    hint: 'Mixed group uses masculine plural: vidjeli',
    answer: 'vidjeli',
    opts: ['vidjeli', 'vidjele', 'vidjela', 'vidio'],
  },
  {
    type: 'aspect',
    prompt: 'Which sentence describes a HABITUAL past action?',
    hint: 'Imperfective verb used habitually',
    answer: 'Svaki dan smo pili kavu.',
    opts: ['Popili smo kavu.', 'Kava je bila dobra.', 'Svaki dan smo pili kavu.', 'Popio sam kavu odmah.'],
  },
  {
    type: 'aux',
    prompt: '"Oni su išli" — what is the correct auxiliary?',
    hint: '3rd person plural auxiliary',
    answer: 'su',
    opts: ['su', 'smo', 'ste', 'je'],
  },
];

export default function PastTenseLessonScreen({ goBack, award }) {
  const { stats, setStats, writeDelta } = useStats();
  const finishFired = useRef(false);
  const [tab, setTab] = useState('form');
  const [gender, setGender] = useState('m');

  // Quiz state
  const [quizQs, setQuizQs] = useState([]);
  const [qi, setQi] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState(-1);
  const [opts, setOpts] = useState([]);

  function startQuiz() {
    const shuffled = sh([...QUIZ_QS]);
    setQuizQs(shuffled);
    setQi(0);
    setScore(0);
    setAnswered(false);
    setSelected(-1);
    setOpts(shuffled[0].opts);
    setTab('quiz');
  }

  const TABS = [
    { id: 'form',       label: '📖 Kako se tvori' },
    { id: 'irregular',  label: '👥 Nepravilni' },
    { id: 'examples',   label: '💬 Primjeri' },
    { id: 'quiz',       label: '🏆 Vježba' },
  ];

  return (
    <div className="scr-wrap">
      {H('⏮️ Past Tense', 'Prošlo vrijeme — L-participle + auxiliary (A2)', goBack)}

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            className={'b ' + (tab === t.id ? 'bp' : 'bg')}
            style={{ fontSize: 12, padding: '7px 12px', whiteSpace: 'nowrap', flexShrink: 0 }}
            onClick={() => { if (t.id === 'quiz') startQuiz(); else setTab(t.id); }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB 1: How it's formed ─────────────────────────────────────── */}
      {tab === 'form' && (
        <div>
          {/* Formula card */}
          <div className="c" style={{ marginBottom: 14, borderLeft: '4px solid #7c3aed', background: 'linear-gradient(135deg,#faf5ff,#ede9fe)' }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: '#7c3aed', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.08em' }}>Formula</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#4c1d95', marginBottom: 8 }}>
              Subject + auxiliary (biti) + L-participle
            </div>
            <div style={{ fontSize: 13, color: '#6d28d9', lineHeight: 1.7 }}>
              <b>Ja sam radio.</b> &nbsp;·&nbsp; I worked (male)<br />
              <b>Ona je radila.</b> &nbsp;·&nbsp; She worked (female)
            </div>
          </div>

          {/* L-participle formation rules */}
          <div className="c" style={{ marginBottom: 14, borderLeft: '4px solid #0e7490' }}>
            <div className="sh" style={{ marginBottom: 10 }}>L-participle Endings</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {[
                { label: 'Masc. sg.', suffix: '-o', example: 'radio', color: '#0e7490' },
                { label: 'Fem. sg.', suffix: '-la', example: 'radila', color: '#dc2626' },
                { label: 'Neut. sg.', suffix: '-lo', example: 'radilo', color: '#d97706' },
                { label: 'Masc. pl.', suffix: '-li', example: 'radili', color: '#0e7490' },
                { label: 'Fem. pl.', suffix: '-le', example: 'radile', color: '#dc2626' },
                { label: 'Neut. pl.', suffix: '-la', example: 'radila', color: '#d97706' },
              ].map(e => (
                <div key={e.label} style={{ padding: '8px 10px', borderRadius: 10, background: 'var(--bar-bg)', border: '1px solid var(--card-b)' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--subtext)', textTransform: 'uppercase' }}>{e.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: e.color }}>{e.suffix}</div>
                  <div style={{ fontSize: 12, color: 'var(--subtext)' }}>{e.example}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: 'var(--subtext)', lineHeight: 1.6 }}>
              Rule: Infinitive → remove <b>-ti</b> → add ending.<br />
              <b>raditi</b> → radi- → radio / radila / radilo …
            </div>
          </div>

          {/* Gender toggle */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {[['m', '👨 Muško'], ['f', '👩 Žensko']].map(([g, label]) => (
              <button
                key={g}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: 12, border: '2px solid ' + (gender === g ? (g === 'm' ? '#0e7490' : '#dc2626') : 'var(--card-b)'),
                  background: gender === g ? (g === 'm' ? 'rgba(14,116,144,.08)' : 'rgba(220,38,38,.06)') : 'var(--card)',
                  fontWeight: 700, fontSize: 13, cursor: 'pointer',
                  color: gender === g ? (g === 'm' ? '#0e7490' : '#dc2626') : 'var(--subtext)',
                }}
                onClick={() => setGender(g)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* raditi paradigm table */}
          <div className="c" style={{ padding: 0, overflow: 'hidden', marginBottom: 14, borderLeft: '4px solid ' + (gender === 'm' ? '#0e7490' : '#dc2626') }}>
            <div style={{
              padding: '12px 16px',
              background: gender === 'm' ? 'linear-gradient(135deg,#0e7490,#164e63)' : 'linear-gradient(135deg,#dc2626,#9f1239)',
              color: '#fff',
            }}>
              <div style={{ fontSize: 17, fontWeight: 800 }}>raditi — to work</div>
              <div style={{ fontSize: 12, opacity: .8, marginTop: 2 }}>Prošlo vrijeme · {gender === 'm' ? 'Muški govornik' : 'Ženski govornik'}</div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {RADITI_PARADIGM.map((row, i) => {
                  const form = row.aux + ' ' + (gender === 'm' ? row.mForm : row.fForm);
                  const full = row.person + ' ' + form;
                  return (
                    <tr
                      key={i}
                      role="button"
                      tabIndex={0}
                      aria-label={'Hear: ' + full}
                      style={{ borderBottom: '1px solid var(--card-b)', cursor: 'pointer' }}
                      onClick={() => speak(full)}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); speak(full); } }}
                    >
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: '#7c3aed', fontSize: 13, width: '30%' }}>{row.person}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 700, fontSize: 15, color: gender === 'm' ? '#0e7490' : '#dc2626' }}>
                        {form} <span aria-hidden="true">🔊</span>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 11, color: 'var(--subtext)' }}>{row.en}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Key rules */}
          {[
            { icon: '⚡', title: 'Gender agreement', text: 'The L-participle agrees with the SUBJECT\'s gender, not the object.' },
            { icon: '🔕', title: 'Negative: nisam/nije…', text: 'Replace the auxiliary with its negative: nisam, nisi, nije, nismo, niste, nisu + L-participle.' },
            { icon: '🔄', title: 'Reflexive verbs', text: 'Reflexive clitic (se/si) precedes the auxiliary in some positions: "Vratio sam se." (I returned)' },
            { icon: '⏳', title: 'Aspect still applies', text: 'Both perfective & imperfective verbs use the same structure. Aspect determines completed vs. habitual meaning.' },
          ].map((r, i) => (
            <div key={i} className="c" style={{ marginBottom: 8, borderLeft: '4px solid #f59e0b', background: '#fffbeb' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#92400e' }}>{r.icon} {r.title}</div>
              <div style={{ fontSize: 12, color: '#78716c', marginTop: 4, lineHeight: 1.6 }}>{r.text}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB 2: Irregular verbs ─────────────────────────────────────── */}
      {tab === 'irregular' && (
        <div>
          <div className="c" style={{ marginBottom: 14, borderLeft: '4px solid #dc2626', background: '#fef2f2' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#dc2626', marginBottom: 4 }}>Why these matter</div>
            <div style={{ fontSize: 12, color: '#78716c', lineHeight: 1.7 }}>
              These 8 verbs are among the most common in Croatian. Their L-participles
              cannot be predicted by regular rules — they must be memorised. Tap any cell to hear it.
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {IRREGULAR_VERBS.map((v, i) => (
              <div
                key={i}
                className="c"
                style={{ borderLeft: '4px solid #0e7490', padding: 12 }}
              >
                <div style={{ fontSize: 14, fontWeight: 900, color: '#164e63', marginBottom: 2 }}>{v.inf}</div>
                <div style={{ fontSize: 11, color: 'var(--subtext)', marginBottom: 8 }}>{v.en}</div>
                {[
                  { label: '♂', form: v.m, color: '#0e7490' },
                  { label: '♀', form: v.f, color: '#dc2626' },
                  { label: '⚪', form: v.n, color: '#d97706' },
                  { label: '👥', form: v.pl, color: '#059669' },
                ].map(({ label, form, color }) => (
                  <button
                    key={label}
                    onClick={() => speak(form)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      marginRight: 6, marginBottom: 4,
                      padding: '3px 8px', borderRadius: 8,
                      border: '1px solid ' + color + '40',
                      background: color + '12',
                      cursor: 'pointer', fontSize: 12, fontWeight: 700, color,
                    }}
                  >
                    {label} {form} <span aria-hidden="true" style={{ fontSize: 10 }}>🔊</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
          <div className="c" style={{ marginTop: 12, background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)', borderLeft: '4px solid #7c3aed' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#7c3aed', marginBottom: 6 }}>Mnemonic pattern</div>
            <div style={{ fontSize: 12, color: '#6d28d9', lineHeight: 1.8 }}>
              <b>ić- verbs:</b> ići → išao, naći → našao, doći → došao (suppletive stem)<br />
              <b>reći group:</b> reći → rekao, peći → pekao (k-stem retained)<br />
              <b>htjeti:</b> htio / htjela — the h is silent, stress on the vowel
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: Examples ───────────────────────────────────────────── */}
      {tab === 'examples' && (
        <div>
          <div className="c" style={{ marginBottom: 14, borderLeft: '4px solid #059669', background: '#f0fdf4' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#065f46', marginBottom: 4 }}>10 authentic sentences</div>
            <div style={{ fontSize: 12, color: '#059669', lineHeight: 1.6 }}>
              All from real Croatian life contexts. Tap the speaker button to hear each sentence.
            </div>
          </div>
          {EXAMPLES.map((ex, i) => (
            <div
              key={i}
              className="c"
              style={{ marginBottom: 10, borderLeft: '4px solid ' + (i % 3 === 0 ? '#0e7490' : i % 3 === 1 ? '#7c3aed' : '#d97706') }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--heading)', lineHeight: 1.4 }}>{ex.hr}</div>
                  <div style={{ fontSize: 12, color: 'var(--subtext)', marginTop: 4 }}>{ex.en}</div>
                </div>
                <button
                  onClick={() => speak(ex.hr)}
                  aria-label={'Hear: ' + ex.hr}
                  style={{
                    flexShrink: 0, background: 'rgba(14,116,144,.1)', border: '1px solid rgba(14,116,144,.2)',
                    borderRadius: 10, padding: '7px 10px', cursor: 'pointer', color: '#0e7490', fontSize: 16,
                  }}
                >
                  🔊
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB 4: Quiz ───────────────────────────────────────────────── */}
      {tab === 'quiz' && (() => {
        if (!quizQs.length) return null;
        const total = quizQs.length;

        if (qi >= total) {
          const pct = Math.round((score / total) * 100);
          const pass = pct >= 60;
          return (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 64, marginBottom: 8 }}>{pct >= 80 ? '🏆' : pct >= 60 ? '👍' : '📚'}</div>
              <h2 style={{ fontFamily: "'Playfair Display',serif", color: 'var(--heading)' }}>Past Tense Quiz Done!</h2>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#0e7490', marginBottom: 4 }}>{score} / {total}</div>
              <div style={{ fontSize: 14, color: 'var(--subtext)', marginBottom: 16 }}>{pct}% — {pass ? 'Odlično!' : 'Keep practising!'}</div>
              {pass && (
                <div className="c" style={{ marginBottom: 16, background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', borderLeft: '4px solid #16a34a', textAlign: 'left' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#065f46' }}>Quest complete! +20 XP bonus</div>
                  <div style={{ fontSize: 12, color: '#059669', marginTop: 4 }}>Grammar quest marked. Keep building your streak!</div>
                </div>
              )}
              <button
                className="b bp"
                style={{ marginTop: 8, marginRight: 8 }}
                onClick={() => {
                  if (finishFired.current) return;
                  finishFired.current = true;
                  if (typeof award === 'function') award(score * 5);
                  if (pass) {
                    markQuest('grammar');
                    writeDelta && writeDelta({ gc: 1 });
                    if (!stats.vs?.includes('past_tense_lesson')) {
                      setStats(prev => ({
                        ...prev,
                        gc: (prev.gc || 0) + 1,
                        vs: [...(prev.vs || []), 'past_tense_lesson'],
                      }));
                    }
                  }
                  goBack();
                }}
              >
                Finish
              </button>
              <button className="b bg" style={{ marginTop: 8 }} onClick={startQuiz}>Try Again</button>
            </div>
          );
        }

        const q = quizQs[qi];
        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700 }}>{qi + 1} / {total}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0e7490' }}>Score: {score}</span>
            </div>
            <Bar v={qi + 1} mx={total} />
            <div className="c" style={{ marginTop: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                <span style={{
                  padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 800,
                  background: q.type === 'aspect' ? '#fef3c7' : q.type === 'negative' ? '#fee2e2' : '#dbeafe',
                  color: q.type === 'aspect' ? '#92400e' : q.type === 'negative' ? '#991b1b' : '#1e40af',
                }}>
                  {q.type === 'participle' ? 'L-participle' : q.type === 'aux' ? 'Auxiliary' : q.type === 'negative' ? 'Negative past' : 'Aspect'}
                </span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--heading)', lineHeight: 1.4 }}>{q.prompt}</div>
              <div style={{ fontSize: 12, color: 'var(--subtext)', marginTop: 6 }}>💡 {q.hint}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {opts.map((o, oi) => (
                <button
                  key={oi}
                  className="ob"
                  style={{
                    background: answered ? (o === q.answer ? '#dcfce7' : selected === oi ? '#fee2e2' : 'var(--card)') : 'var(--card)',
                    borderColor: answered ? (o === q.answer ? '#16a34a' : selected === oi ? '#dc2626' : 'rgba(14,116,144,.12)') : 'rgba(14,116,144,.12)',
                  }}
                  onClick={() => {
                    if (answered) return;
                    setSelected(oi);
                    setAnswered(true);
                    if (o === q.answer) setScore(s => s + 1);
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
                    setOpts(quizQs[next].opts);
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
