import React, { useState, useEffect, useMemo } from 'react';
import { V, speak } from '../../data.jsx';
import { markQuest } from '../../lib/quests.js';

function _shuffleOpts(opts) {
  const a = [...opts];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const KVIZ_DONE_KEY = 'nh_uskrs_kviz_done';
// Campaign quest keys — written on completion so the banner shows them as done
const CQ_VOCAB_KEY  = 'nh_cq_easter_uskrs_q1'; // "Learn 5 Easter words"
const CQ_KVIZ_KEY   = 'nh_cq_easter_uskrs_q3'; // "Easter challenge"

const TRADITIONS = [
  {
    emoji: '🥚',
    title: 'Pisanice',
    body: 'Decorated Easter eggs — the most iconic Croatian Easter tradition. Women and girls spend hours painting intricate geometric patterns, flowers, and religious symbols. Each region has its own style — Slavonian pisanice use beeswax resist, Dalmatian ones feature Mediterranean motifs.',
  },
  {
    emoji: '🧺',
    title: 'Uskrsna košarica',
    body: 'The Easter basket blessing — on Holy Saturday, families bring baskets filled with ham (šunka), horseradish (hren), bread, hard-boiled eggs, and wine to church for blessing by the priest. The blessed food is shared at Sunday lunch.',
  },
  {
    emoji: '🍽️',
    title: 'Uskrsni ručak',
    body: 'The family Easter lunch — the most important meal of the year after Christmas. Always includes janje (lamb), šunka (ham), hren (horseradish), and pogača (festive bread). Families travel from across Croatia to eat together.',
  },
  {
    emoji: '⛪',
    title: 'Veliki tjedan',
    body: 'Holy Week — the week before Easter is deeply observed. Good Friday (Veliki petak) is solemn with processions. In Hvar, the Za Križen procession has taken place every year for 500 years — 8 villages, all night, no cars, only torchlight and prayers.',
  },
  {
    emoji: '☀️',
    title: 'Uskrsno jutro',
    body: 'Easter Sunday morning greeting — when you see someone, say "Krist uskrsnu!" (Christ is risen!) and they respond "Uistinu uskrsnu!" (He is truly risen!). This exchange happens between strangers, neighbors, shopkeepers — everyone. It\'s one of the most distinctly Croatian cultural moments.',
  },
  {
    emoji: '❤️',
    title: 'Licitarsko srce',
    body: 'Gingerbread heart — the red licitarsko srce is Croatia\'s most recognized folk symbol. At Easter markets, families buy them as gifts. The tradition is UNESCO-protected. Zagreb\'s Dolac market fills with them every spring.',
  },
];

const RECIPES = [
  {
    title: 'Šunka s hrenom',
    subtitle: 'Ham with Horseradish',
    emoji: '🍖',
    body: 'The Easter centerpiece. The ham is cured and slowly cooked. Freshly grated horseradish (hren) is the essential accompaniment — it must be sharp enough to make your eyes water. Mild horseradish is a family embarrassment. Serve cold, sliced thin.',
    keywords: [
      { hr: 'šunka', en: 'ham' },
      { hr: 'hren', en: 'horseradish' },
      { hr: 'hladni narezak', en: 'cold cuts' },
    ],
  },
  {
    title: 'Janje s ražnja',
    subtitle: 'Spit-Roasted Lamb',
    emoji: '🔥',
    body: 'A whole lamb roasted slowly over an open fire (ražanj) for 4–6 hours, basted with salt water. The skin should crack when tapped. Villages gather around the fire from early morning. The smell carries for kilometres. If you\'re invited to a Croatian Easter in Dalmatia, you have been truly accepted.',
    keywords: [
      { hr: 'janje', en: 'lamb' },
      { hr: 'ražanj', en: 'spit roast' },
      { hr: 'kožica', en: 'skin / crackling' },
    ],
  },
  {
    title: 'Pogača',
    subtitle: 'Easter Bread',
    emoji: '🍞',
    body: 'A round, slightly sweet festive bread, sometimes decorated with a dough cross on top. Goes into the Easter basket for blessing. Eaten the next morning with the blessed ham and horseradish.',
    keywords: [
      { hr: 'pogača', en: 'festive bread' },
      { hr: 'blagoslov', en: 'blessing' },
      { hr: 'košarica', en: 'basket' },
    ],
  },
];

const QUIZ_QUESTIONS = [
  {
    q: 'How do you say "Happy Easter"?',
    correct: 'Sretan Uskrs!',
    opts: ['Sretan Uskrs!', 'Sretan Božić', 'Sretan Valentinovo', 'Sretan Uskrsak'],
  },
  {
    q: 'What is a pisanica?',
    correct: 'A decorated Easter egg',
    opts: ['A decorated Easter egg', 'Easter lamb', 'Easter bread', 'Easter basket'],
  },
  {
    q: 'What do Croatians respond to "Krist uskrsnu!"?',
    correct: 'Uistinu uskrsnu!',
    opts: ['Uistinu uskrsnu!', 'Hvala lijepo', 'I tebi', 'Bog te čuvao'],
  },
  {
    q: 'What is the Croatian word for "lamb"?',
    correct: 'janje',
    opts: ['janje', 'šunka', 'hren', 'pogača'],
  },
  {
    q: 'What is the Za Križen procession famous for?',
    correct: '500 years of unbroken tradition',
    opts: ['500 years of unbroken tradition', 'Only women participate', 'Held in Zagreb', 'Involves swimming in the sea'],
  },
];

const ACCENT = '#16a34a';
const ACCENT_LIGHT = 'rgba(22,163,74,.1)';
const ACCENT_BORDER = 'rgba(22,163,74,.25)';

const TABS = [
  { id: 'tradicije', label: 'Tradicije' },
  { id: 'pozdravite', label: 'Pozdravite se' },
  { id: 'recepti', label: 'Recepti' },
  { id: 'kviz', label: 'Kviz' },
];

export default function EasterScreen({ onBack, award }) {
  // Persist completion across sessions — once done, quiz is locked
  const [kvizPermanentlyDone] = useState(() => {
    try { return localStorage.getItem(KVIZ_DONE_KEY) === '1'; } catch { return false; }
  });

  const [tab, setTab] = useState('tradicije');

  // Quiz state
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [quizDone, setQuizDone] = useState(kvizPermanentlyDone);
  const [xpAwarded, setXpAwarded] = useState(kvizPermanentlyDone);

  const easterVocab = V.easter || [];

  // Shuffle opts once per quiz session so correct answer isn't always first
  const shuffledQuestions = useMemo(
    () => QUIZ_QUESTIONS.map(q => ({ ...q, opts: _shuffleOpts(q.opts) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Mark "Learn 5 Easter words" campaign quest when user browses vocab tab
  useEffect(() => {
    if (tab === 'pozdravite' && easterVocab.length >= 5) {
      try {
        if (!localStorage.getItem(CQ_VOCAB_KEY)) {
          localStorage.setItem(CQ_VOCAB_KEY, '1');
          window.dispatchEvent(new CustomEvent('nh-campaign-quest-done'));
        }
      } catch {}
    }
  }, [tab, easterVocab.length]);

  function handleAnswer(opt) {
    if (selected !== null) return;
    const isCorrect = opt === shuffledQuestions[qIdx].correct;
    const newAnswers = [...answers, isCorrect];
    setSelected(opt);
    setAnswers(newAnswers);

    setTimeout(() => {
      if (qIdx + 1 >= shuffledQuestions.length) {
        setQuizDone(true);
        if (!xpAwarded) {
          const correctCount = newAnswers.filter(Boolean).length;
          const xpEarned = correctCount * 10;
          markQuest('reading');
          if (xpEarned > 0 && award) award(xpEarned);
          try {
            localStorage.setItem(KVIZ_DONE_KEY, '1');
            if (!localStorage.getItem(CQ_KVIZ_KEY)) {
              localStorage.setItem(CQ_KVIZ_KEY, '1');
              window.dispatchEvent(new CustomEvent('nh-campaign-quest-done'));
            }
          } catch {}
          setXpAwarded(true);
        }
      } else {
        setQIdx(qIdx + 1);
        setSelected(null);
      }
    }, 900);
  }

  return (
    <div>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${ACCENT}, #15803d)`,
        borderRadius: 16, padding: '18px 20px', marginBottom: 20,
        position: 'relative',
      }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,.18)',
            border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13,
            fontWeight: 700, color: '#fff', padding: '5px 10px',
            fontFamily: "'Outfit',sans-serif", marginBottom: 12,
          }}
        >
          ‹ Back
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 36 }}>🥚</span>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', fontFamily: "'Playfair Display',serif", lineHeight: 1.2 }}>
              Uskrs u Hrvatskoj
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.85)', marginTop: 3, fontWeight: 500 }}>
              Discover Croatian Easter traditions
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 20,
        background: 'var(--bar-bg)', borderRadius: 12, padding: 4,
      }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: '9px 4px', borderRadius: 9, border: 'none',
              cursor: 'pointer',
              background: tab === t.id ? 'var(--card)' : 'transparent',
              fontFamily: "'Outfit',sans-serif", fontSize: 11, fontWeight: 700,
              color: tab === t.id ? ACCENT : 'var(--subtext)',
              boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,.1)' : 'none',
              transition: 'all .2s',
            }}
          >
            {t.id === 'kviz' && kvizPermanentlyDone ? 'Kviz ✓' : t.label}
          </button>
        ))}
      </div>

      {/* TRADICIJE TAB */}
      {tab === 'tradicije' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {TRADITIONS.map((tr, i) => (
            <div key={i} style={{
              background: 'var(--card)', border: '1px solid var(--card-b)',
              borderRadius: 14, padding: '14px 16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{ fontSize: 26, flexShrink: 0, marginTop: 1 }}>{tr.emoji}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--heading)', marginBottom: 5, fontFamily: "'Playfair Display',serif" }}>
                    {tr.title}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--subtext)', lineHeight: 1.65 }}>
                    {tr.body}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* POZDRAVITE SE TAB */}
      {tab === 'pozdravite' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{
            background: ACCENT_LIGHT, border: `1.5px solid ${ACCENT_BORDER}`,
            borderRadius: 12, padding: '12px 14px', marginBottom: 8,
            fontSize: 12, color: 'var(--subtext)', lineHeight: 1.6,
          }}>
            Tap any word to hear it spoken in Croatian.
          </div>
          {easterVocab.map((item, i) => {
            const hr = item[0];
            const en = item[1];
            const ph = item[2] || null;
            return (
              <button
                key={i}
                aria-label={`Play audio for ${hr}`}
                onClick={() => speak(hr)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px',
                  background: 'var(--card)', border: '1px solid var(--card-b)',
                  borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                  fontFamily: "'Outfit',sans-serif", width: '100%',
                }}
              >
                <span aria-hidden="true" style={{
                  fontSize: 16, flexShrink: 0, color: ACCENT,
                }}>🔊</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--heading)', fontFamily: "'Playfair Display',serif" }}>
                    {hr}
                  </div>
                  <div style={{ fontSize: 12, color: ACCENT, fontWeight: 600, marginTop: 1 }}>
                    {en}
                  </div>
                  {ph && (
                    <div style={{ fontSize: 10, color: 'var(--subtext)', fontStyle: 'italic', marginTop: 1 }}>
                      /{ph}/
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* RECEPTI TAB */}
      {tab === 'recepti' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {RECIPES.map((r, i) => (
            <div key={i} style={{
              background: 'var(--card)', border: '1px solid var(--card-b)',
              borderRadius: 16, overflow: 'hidden',
            }}>
              <div style={{
                background: ACCENT_LIGHT, borderBottom: `1px solid ${ACCENT_BORDER}`,
                padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ fontSize: 24 }}>{r.emoji}</span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--heading)', fontFamily: "'Playfair Display',serif" }}>
                    {r.title}
                  </div>
                  <div style={{ fontSize: 11, color: ACCENT, fontWeight: 700 }}>
                    {r.subtitle}
                  </div>
                </div>
              </div>
              <div style={{ padding: '12px 16px' }}>
                <div style={{ fontSize: 12, color: 'var(--subtext)', lineHeight: 1.65, marginBottom: 12 }}>
                  {r.body}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {r.keywords.map((kw, ki) => (
                    <button
                      key={ki}
                      aria-label={`Play audio for ${kw.hr}`}
                      onClick={() => speak(kw.hr)}
                      style={{
                        background: ACCENT_LIGHT, border: `1px solid ${ACCENT_BORDER}`,
                        borderRadius: 20, padding: '4px 10px', cursor: 'pointer',
                        fontFamily: "'Outfit',sans-serif",
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                      }}
                    >
                      <span aria-hidden="true" style={{ fontSize: 10 }}>🔊</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: ACCENT }}>{kw.hr}</span>
                      <span style={{ fontSize: 11, color: 'var(--subtext)', fontWeight: 500 }}>{kw.en}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* KVIZ TAB */}
      {tab === 'kviz' && (
        <div>
          {!quizDone ? (
            <div>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 16,
              }}>
                <div style={{ fontSize: 12, color: 'var(--subtext)', fontWeight: 700 }}>
                  Question {qIdx + 1} of {shuffledQuestions.length}
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {shuffledQuestions.map((_, qi) => (
                    <div key={qi} style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: qi < qIdx
                        ? (answers[qi] ? ACCENT : '#ef4444')
                        : qi === qIdx ? ACCENT : 'var(--card-b)',
                    }} />
                  ))}
                </div>
              </div>

              <div style={{
                background: ACCENT_LIGHT, border: `1.5px solid ${ACCENT_BORDER}`,
                borderRadius: 14, padding: '16px 18px', marginBottom: 20,
              }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--heading)', lineHeight: 1.4 }}>
                  {shuffledQuestions[qIdx].q}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {shuffledQuestions[qIdx].opts.map((opt, oi) => {
                  let bg = 'var(--card)';
                  let border = '1px solid var(--card-b)';
                  let color = 'var(--heading)';
                  if (selected !== null) {
                    if (opt === shuffledQuestions[qIdx].correct) {
                      bg = 'rgba(22,163,74,.12)'; border = `1.5px solid ${ACCENT}`; color = ACCENT;
                    } else if (opt === selected && opt !== shuffledQuestions[qIdx].correct) {
                      bg = 'rgba(239,68,68,.1)'; border = '1.5px solid #ef4444'; color = '#ef4444';
                    }
                  }
                  return (
                    <button
                      key={oi}
                      onClick={() => handleAnswer(opt)}
                      disabled={selected !== null}
                      style={{
                        padding: '13px 16px', background: bg, border,
                        borderRadius: 12, cursor: selected !== null ? 'default' : 'pointer',
                        textAlign: 'left', fontFamily: "'Outfit',sans-serif",
                        fontSize: 13, fontWeight: 700, color,
                        transition: 'all .2s',
                      }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>
                {kvizPermanentlyDone && answers.length === 0 ? '🏆' : answers.filter(Boolean).length === shuffledQuestions.length ? '🎉' : '🥚'}
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--heading)', fontFamily: "'Playfair Display',serif", marginBottom: 6 }}>
                {kvizPermanentlyDone && answers.length === 0 ? 'Kviz završen!' : answers.filter(Boolean).length === shuffledQuestions.length ? 'Savršeno!' : 'Kviz završen!'}
              </div>
              {answers.length > 0 && (
                <div style={{ fontSize: 14, color: 'var(--subtext)', marginBottom: 20 }}>
                  {answers.filter(Boolean).length} / {shuffledQuestions.length} correct
                </div>
              )}
              <div style={{
                background: ACCENT_LIGHT, border: `1.5px solid ${ACCENT_BORDER}`,
                borderRadius: 14, padding: '14px 18px', marginBottom: 20,
                fontSize: 13, fontWeight: 700, color: ACCENT,
              }}>
                {answers.length > 0
                  ? `+${answers.filter(Boolean).length * 10} XP earned`
                  : 'Kviz je već završen — XP je dodijeljen.'}
              </div>

              {answers.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                  {shuffledQuestions.map((qq, qi) => (
                    <div key={qi} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 14px', borderRadius: 10,
                      background: answers[qi] ? 'rgba(22,163,74,.08)' : 'rgba(239,68,68,.07)',
                      border: `1px solid ${answers[qi] ? ACCENT_BORDER : 'rgba(239,68,68,.2)'}`,
                      textAlign: 'left',
                    }}>
                      <span style={{ fontSize: 16, flexShrink: 0 }}>{answers[qi] ? '✅' : '❌'}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, color: 'var(--subtext)', fontWeight: 600, lineHeight: 1.3 }}>{qq.q}</div>
                        {!answers[qi] && (
                          <div style={{ fontSize: 11, color: ACCENT, fontWeight: 700, marginTop: 2 }}>
                            {qq.correct}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* No Try Again — quiz is one-time only */}
              <div style={{
                fontSize: 12, color: 'var(--subtext)', fontStyle: 'italic',
                padding: '10px 16px', background: 'var(--bar-bg)',
                borderRadius: 10, marginTop: 8,
              }}>
                Ovaj kviz može se riješiti samo jednom. / This quiz can only be completed once.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
