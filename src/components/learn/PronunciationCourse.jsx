import React, { useState } from 'react';
import { PHONOLOGY, speak } from '../../data.jsx';

const PROG_KEY = 'nh_pron_progress';
function getProgress() {
  try { return JSON.parse(localStorage.getItem(PROG_KEY) || '{}'); } catch { return {}; }
}
function savePracticed(letter) {
  const p = getProgress();
  p[letter] = (p[letter] || 0) + 1;
  try { localStorage.setItem(PROG_KEY, JSON.stringify(p)); } catch {}
}

// ─── Back button ──────────────────────────────────────────────────────────────
const BackBtn = ({ onClick }) => (
  <button className="b bg" style={{ marginBottom: 16, fontSize: 13 }} onClick={onClick}>
    ← Back
  </button>
);

// ─── Letter overview list ─────────────────────────────────────────────────────
function LetterList({ letters, onSelect, goBack }) {
  const progress = getProgress();

  return (
    <div className="scr-wrap">
      <BackBtn onClick={goBack} />

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
        borderRadius: 18, padding: '20px 20px', marginBottom: 20, color: 'white',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 44 }}>🗣️</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 4 }}>Pronunciation Course</div>
            <div style={{ fontSize: 12, opacity: .85, lineHeight: 1.5 }}>
              Master the sounds that make Croatian different — with IPA, memory aids & audio examples
            </div>
          </div>
        </div>
      </div>

      {/* Intro box */}
      <div style={{
        background: 'var(--info-bg)', border: '1px solid var(--info-b)',
        borderRadius: 12, padding: '12px 16px', marginBottom: 20,
        fontSize: 13, color: 'var(--info)', lineHeight: 1.6,
      }}>
        <strong>💡 </strong>{PHONOLOGY.tip}
      </div>

      {/* Letter grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
        {letters.map(l => {
          const practiced = (progress[l.letter] || 0) > 0;
          return (
            <button key={l.letter} onClick={() => onSelect(l)} style={{
              background: 'var(--card)', border: `2px solid ${practiced ? l.color : 'var(--card-b)'}`,
              borderRadius: 16, padding: '16px 12px', cursor: 'pointer',
              textAlign: 'center',
            }}>
              <div style={{
                fontSize: 36, fontWeight: 900, color: l.color,
                fontFamily: "'Playfair Display', Georgia, serif",
                marginBottom: 6,
              }}>{l.letter.toUpperCase()}</div>
              <div style={{ fontSize: 11, color: 'var(--subtext)', fontFamily: 'monospace' }}>{l.ipa}</div>
              <div style={{ fontSize: 10, color: practiced ? l.color : 'var(--subtext)', fontWeight: 700, marginTop: 4 }}>
                {practiced ? '✓ Practiced' : 'Tap to learn'}
              </div>
            </button>
          );
        })}
      </div>

      {/* Progress summary */}
      {Object.keys(progress).length > 0 && (
        <div style={{
          marginTop: 24, background: 'var(--card)', border: '1px solid var(--card-b)',
          borderRadius: 14, padding: '14px 16px',
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--heading)', marginBottom: 4 }}>
            Your Progress
          </div>
          <div style={{ fontSize: 13, color: 'var(--subtext)' }}>
            {Object.keys(progress).length} / {letters.length} sounds practiced
          </div>
          <div style={{
            background: 'var(--card-b)', borderRadius: 6, height: 6, marginTop: 8,
          }}>
            <div style={{
              background: '#7c3aed', height: '100%', borderRadius: 6,
              width: `${(Object.keys(progress).length / letters.length) * 100}%`,
              transition: 'width .4s',
            }} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Single letter lesson ─────────────────────────────────────────────────────
function LetterLesson({ letter: l, letters, onComplete, goBack }) {
  const [quizMode, setQuizMode] = useState(false);
  const [answers, setAnswers] = useState({});

  // Build a simple 3-question quiz for this letter
  const quiz = [
    {
      q: `What sound does "${l.letter.toUpperCase()}" make in Croatian?`,
      opts: shuffleOpts([
        l.ipa,
        ...getWrongIpa(l, letters),
      ]),
      correct: l.ipa,
    },
    {
      q: `Which English word gives the best hint for "${l.letter.toUpperCase()}"?`,
      opts: shuffleOpts([
        l.like.split('—')[0].replace(/like ['"]?/i, '').split(' or ')[0].trim(),
        ...getWrongLike(l, letters),
      ]),
      correct: l.like.split('—')[0].replace(/like ['"]?/i, '').split(' or ')[0].trim(),
    },
    {
      q: `Which word contains "${l.letter.toUpperCase()}"?`,
      opts: shuffleOpts([
        l.examples[0].hr + ' (' + l.examples[0].en + ')',
        ...getWrongExample(l, letters),
      ]),
      correct: l.examples[0].hr + ' (' + l.examples[0].en + ')',
    },
  ];

  const allAnswered = quiz.every((_, i) => answers[i] !== undefined);
  const correctCount = quiz.filter((q, i) => answers[i] === q.correct).length;

  function handleAnswer(qi, opt) {
    if (answers[qi] !== undefined) return;
    setAnswers(a => ({ ...a, [qi]: opt }));
  }

  function finish() {
    savePracticed(l.letter);
    onComplete();
  }

  return (
    <div className="scr-wrap">
      <BackBtn onClick={goBack} />

      {/* Letter hero */}
      <div style={{
        background: `linear-gradient(135deg, ${l.color}dd, ${l.color})`,
        borderRadius: 18, padding: '24px 20px', marginBottom: 20, color: 'white',
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: 72, fontWeight: 900,
          fontFamily: "'Playfair Display', Georgia, serif",
          lineHeight: 1,
        }}>
          {l.letter.toUpperCase()} {l.letter}
        </div>
        <div style={{ fontSize: 16, marginTop: 8, opacity: .9, fontFamily: 'monospace' }}>{l.ipa}</div>
        <div style={{ fontSize: 13, marginTop: 4, opacity: .85 }}>{l.name}</div>
      </div>

      {!quizMode ? (
        <>
          {/* How to pronounce it */}
          <div style={{
            background: 'var(--card)', border: '1px solid var(--card-b)',
            borderRadius: 14, padding: '16px 18px', marginBottom: 16,
          }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--heading)', marginBottom: 8 }}>
              🇬🇧 How to pronounce it
            </div>
            <p style={{ fontSize: 15, color: 'var(--heading)', lineHeight: 1.7, margin: 0 }}>{l.like}</p>
          </div>

          {/* Memory aid */}
          <div style={{
            background: `${l.color}15`, border: `1px solid ${l.color}40`,
            borderRadius: 14, padding: '14px 18px', marginBottom: 16,
          }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: l.color, marginBottom: 6 }}>
              🧠 Memory Aid
            </div>
            <p style={{ fontSize: 14, color: 'var(--heading)', lineHeight: 1.6, margin: 0, fontWeight: 600 }}>
              {l.memory}
            </p>
          </div>

          {/* Audio examples */}
          <div style={{
            background: 'var(--card)', border: '1px solid var(--card-b)',
            borderRadius: 14, padding: '16px 18px', marginBottom: 20,
          }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--heading)', marginBottom: 12 }}>
              🔊 Listen & Repeat
            </div>
            {l.examples.map((ex, i) => (
              <div key={i}
                role="button" tabIndex={0}
                onClick={() => speak(ex.hr)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); speak(ex.hr); } }}
                aria-label={`Hear pronunciation of ${ex.hr}`}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 14px', marginBottom: 8,
                  background: 'var(--card)', border: '1px solid var(--card-b)',
                  borderLeft: `4px solid ${l.color}`,
                  borderRadius: 10, cursor: 'pointer',
                }}>
                <div>
                  <span style={{
                    fontSize: 18, fontWeight: 800, color: 'var(--heading)',
                    fontFamily: "'Playfair Display', Georgia, serif",
                  }}>
                    {highlightLetter(ex.hr, l.letter, l.color)}
                  </span>
                  <div style={{ fontSize: 12, color: 'var(--subtext)', marginTop: 2 }}>{ex.en}</div>
                </div>
                <span style={{
                  fontSize: 20, width: 36, height: 36, borderRadius: 50,
                  background: `${l.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>🔊</span>
              </div>
            ))}
          </div>

          <button className="b bp" style={{ width: '100%' }} onClick={() => setQuizMode(true)}>
            Test Yourself →
          </button>
        </>
      ) : (
        <>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--heading)', marginBottom: 16 }}>
            Quick Check
          </div>

          {quiz.map((q, qi) => (
            <div key={qi} style={{
              background: 'var(--card)', border: '1px solid var(--card-b)',
              borderRadius: 14, padding: '16px 18px', marginBottom: 12,
            }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--heading)', marginBottom: 12 }}>
                {qi + 1}. {q.q}
              </p>
              {q.opts.map((opt, oi) => {
                const sel = answers[qi];
                const isCorrect = opt === q.correct;
                let bg = 'var(--card)', col = 'var(--heading)', border = '1px solid var(--card-b)';
                if (sel !== undefined) {
                  if (isCorrect) { bg = '#dcfce7'; col = '#15803d'; border = '1px solid #86efac'; }
                  else if (sel === opt) { bg = '#fee2e2'; col = '#b91c1c'; border = '1px solid #fca5a5'; }
                }
                return (
                  <button key={oi} onClick={() => handleAnswer(qi, opt)} style={{
                    width: '100%', textAlign: 'left', padding: '10px 12px',
                    marginBottom: 6, borderRadius: 10, border,
                    background: bg, color: col,
                    fontSize: 13, fontWeight: sel !== undefined && isCorrect ? 700 : 500,
                    cursor: sel !== undefined ? 'default' : 'pointer',
                    transition: 'background .2s',
                  }}>{opt}</button>
                );
              })}
            </div>
          ))}

          {allAnswered && (
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>
                {correctCount === quiz.length ? '🌟 Perfect!' : correctCount >= 2 ? '👍 Almost!' : '💪 Keep practicing!'}
              </div>
              <div style={{ fontSize: 14, color: 'var(--subtext)', marginBottom: 20 }}>
                {correctCount}/{quiz.length} correct
              </div>
              <button className="b bp" style={{ width: '100%' }} onClick={finish}>
                Mark as Practiced ✓
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Utility: highlight the target letter(s) in a word ───────────────────────
function highlightLetter(word, target, color) {
  const parts = [];
  let remaining = word;
  const tLower = target.toLowerCase();
  // For multi-char digraphs (lj, nj, dž) match the whole digraph
  let idx;
  while (remaining.length > 0) {
    idx = remaining.toLowerCase().indexOf(tLower);
    if (idx === -1) { parts.push(<span key={parts.length}>{remaining}</span>); break; }
    if (idx > 0) parts.push(<span key={parts.length}>{remaining.slice(0, idx)}</span>);
    parts.push(
      <span key={parts.length + 'h'} style={{ color, textDecoration: 'underline', textDecorationColor: color }}>
        {remaining.slice(idx, idx + tLower.length)}
      </span>
    );
    remaining = remaining.slice(idx + tLower.length);
  }
  return <>{parts}</>;
}

// ─── Quiz option helpers ───────────────────────────────────────────────────────
function shuffleOpts(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function _fySample(arr, n) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a.slice(0, n);
}

function getWrongIpa(current, all) {
  return _fySample(all.filter(l => l.letter !== current.letter && l.ipa !== current.ipa), 3)
    .map(l => l.ipa);
}

function getWrongLike(current, all) {
  return _fySample(all.filter(l => l.letter !== current.letter), 3)
    .map(l => l.like.split('—')[0].replace(/like ['"]?/i, '').split(' or ')[0].trim());
}

function getWrongExample(current, all) {
  return _fySample(all.filter(l => l.letter !== current.letter), 3)
    .map(l => l.examples[0].hr + ' (' + l.examples[0].en + ')');
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function PronunciationCourse({ goBack, award }) {
  const [selected, setSelected] = useState(null);
  const [completedThis, setCompletedThis] = useState(new Set());

  const letters = (PHONOLOGY?.letters || []);

  function onComplete() {
    if (!selected) return;
    const next = new Set(completedThis);
    next.add(selected.letter);
    setCompletedThis(next);
    if (typeof award === 'function') award(10);
    setSelected(null);
  }

  if (selected) {
    return (
      <LetterLesson
        letter={selected}
        letters={letters}
        onComplete={onComplete}
        goBack={() => setSelected(null)}
      />
    );
  }

  return (
    <LetterList
      letters={letters}
      onSelect={setSelected}
      goBack={goBack}
    />
  );
}
