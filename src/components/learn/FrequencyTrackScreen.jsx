import React, { useState, useCallback } from 'react';
import { H } from '../../data/content.jsx';
import {
  FREQUENCY_500,
  getLearnedFrequencyWords,
  markFrequencyWordLearned,
} from '../../lib/frequency500.js';

// ── Constants ─────────────────────────────────────────────────────────────────
const POS_LABELS = {
  all:    'All',
  verb:   'Verbs',
  noun:   'Nouns',
  adj:    'Adjectives',
  adv:    'Adverbs',
  pron:   'Pronouns',
  conj:   'Conjunctions',
  prep:   'Prepositions',
  num:    'Numbers',
  part:   'Particles',
  det:    'Determiners',
  interj: 'Interjections',
};
const POS_FILTER_ORDER = ['all', 'verb', 'noun', 'adj', 'adv', 'pron', 'conj', 'prep', 'num', 'part', 'interj'];
const QUIZ_SIZE = 5;
const DISTRACTORS_PER_Q = 3;
const TEAL_GRAD = 'linear-gradient(135deg,#0e7490,#164e63)';

// ── Utility ───────────────────────────────────────────────────────────────────
function pickRandom(arr, n) {
  const copy = [...arr];
  const out = [];
  while (out.length < n && copy.length) {
    const i = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(i, 1)[0]);
  }
  return out;
}

function buildQuizQuestions(learnedSet) {
  const unlearned = FREQUENCY_500.filter(w => !learnedSet.has(w.rank));
  const pool = pickRandom(unlearned.length >= QUIZ_SIZE ? unlearned : FREQUENCY_500, QUIZ_SIZE);
  return pool.map(word => {
    const others = FREQUENCY_500.filter(w => w.rank !== word.rank);
    const distractors = pickRandom(others, DISTRACTORS_PER_Q).map(w => w.en);
    const choices = [word.en, ...distractors].sort(() => Math.random() - 0.5);
    return { word, choices, answer: word.en };
  });
}

function computeStreak(learnedRanks) {
  if (!learnedRanks.length) return 0;
  const sorted = [...learnedRanks].sort((a, b) => a - b);
  let streak = 0;
  let prev = -1;
  for (const r of sorted) {
    if (prev === -1 || r === prev + 1) {
      streak++;
      prev = r;
    } else {
      break;
    }
  }
  return streak;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatTile({ value, label }) {
  return (
    <div className="stat-tile" style={{
      flex: 1,
      background: 'var(--card)',
      borderRadius: 14,
      padding: '12px 8px',
      textAlign: 'center',
      boxShadow: '0 1px 4px rgba(0,0,0,.08)',
    }}>
      <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--info)', lineHeight: 1.1, fontFamily: "'Outfit', sans-serif" }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: 'var(--subtext)', marginTop: 4, fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>
        {label}
      </div>
    </div>
  );
}

function WordTile({ word, learned, onTap }) {
  return (
    <button
      onClick={onTap}
      style={{
        background: learned ? 'linear-gradient(135deg,#0e7490,#155e75)' : 'var(--card)',
        border: 'none',
        borderRadius: 10,
        padding: '8px 4px 6px',
        cursor: 'pointer',
        position: 'relative',
        textAlign: 'center',
        width: '100%',
        boxShadow: learned ? '0 2px 8px rgba(14,116,144,.3)' : '0 1px 3px rgba(0,0,0,.07)',
        transition: 'transform .15s, box-shadow .15s',
        fontFamily: "'Outfit', sans-serif",
      }}
      aria-label={`${word.hr} — ${word.en}${learned ? ' (learned)' : ''}`}
    >
      <div style={{
        position: 'absolute', top: 4, left: 5,
        fontSize: 8, fontWeight: 700,
        color: learned ? 'rgba(255,255,255,.5)' : 'var(--subtext)',
        lineHeight: 1,
      }}>
        {word.rank}
      </div>
      {learned && (
        <div style={{
          position: 'absolute', top: 3, right: 4,
          fontSize: 9, color: 'rgba(255,255,255,.8)',
        }}>✓</div>
      )}
      <div style={{
        fontSize: 13, fontWeight: 800, lineHeight: 1.2, marginTop: 6,
        color: learned ? 'white' : 'var(--text)',
      }}>
        {word.hr}
      </div>
      <div style={{
        fontSize: 10, marginTop: 2, lineHeight: 1.3,
        color: learned ? 'rgba(255,255,255,.7)' : 'var(--subtext)',
      }}>
        {word.en.length > 14 ? word.en.slice(0, 13) + '…' : word.en}
      </div>
    </button>
  );
}

// ── Quiz Overlay ──────────────────────────────────────────────────────────────
function QuizOverlay({ questions, onClose, onMarkLearned }) {
  const [qi, setQi] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const q = questions[qi];

  function choose(choice) {
    if (selected !== null) return;
    setSelected(choice);
    const correct = choice === q.answer;
    if (correct) {
      setScore(s => s + 1);
      onMarkLearned(q.word.rank);
    }
    setTimeout(() => {
      if (qi + 1 >= questions.length) {
        setDone(true);
      } else {
        setQi(qi + 1);
        setSelected(null);
      }
    }, 900);
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,.65)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: 20,
      fontFamily: "'Outfit', sans-serif",
    }}>
      <div className="c" style={{
        background: 'var(--card)',
        borderRadius: 22, padding: 24,
        width: '100%', maxWidth: 420,
        boxShadow: '0 8px 32px rgba(0,0,0,.25)',
      }}>
        {done ? (
          <>
            <div style={{ fontSize: 40, textAlign: 'center', marginBottom: 8 }}>
              {score >= QUIZ_SIZE ? '🏆' : score >= Math.ceil(QUIZ_SIZE / 2) ? '⭐' : '📚'}
            </div>
            <div style={{ textAlign: 'center', fontSize: 22, fontWeight: 900, color: 'var(--text)', marginBottom: 6 }}>
              {score}/{questions.length} correct
            </div>
            <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--subtext)', marginBottom: 20 }}>
              {score >= QUIZ_SIZE
                ? 'Perfect! All words marked as learned.'
                : score > 0
                ? 'Correct answers marked as learned.'
                : 'Keep practising — you\'ve got this!'}
            </div>
            <button
              onClick={onClose}
              style={{
                width: '100%', padding: '13px 0',
                background: TEAL_GRAD,
                border: 'none', borderRadius: 14,
                color: 'white', fontWeight: 800, fontSize: 15,
                cursor: 'pointer',
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              Done
            </button>
          </>
        ) : (
          <>
            {/* Progress */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--subtext)' }}>
                Question {qi + 1} of {questions.length}
              </div>
              <button
                onClick={onClose}
                style={{ background: 'var(--bar-bg)', border: 'none', borderRadius: 8, padding: '4px 10px', color: 'var(--subtext)', cursor: 'pointer', fontSize: 12, fontFamily: "'Outfit', sans-serif" }}
              >
                ✕ Exit
              </button>
            </div>
            <div style={{ height: 4, background: 'var(--bar-bg)', borderRadius: 2, marginBottom: 20 }}>
              <div style={{ width: `${(qi / questions.length) * 100}%`, height: '100%', background: '#0e7490', borderRadius: 2, transition: 'width .3s' }} />
            </div>

            {/* Question */}
            <div style={{ textAlign: 'center', marginBottom: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--subtext)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4 }}>
                #{q.word.rank} · {POS_LABELS[q.word.pos] || q.word.pos}
              </div>
              <div style={{ fontSize: 34, fontWeight: 900, color: 'var(--text)', marginBottom: 4 }}>
                {q.word.hr}
              </div>
              <div style={{ fontSize: 13, color: 'var(--subtext)' }}>What does this mean?</div>
            </div>

            {/* Choices */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
              {q.choices.map(choice => {
                let bg = 'var(--bar-bg)';
                let col = 'var(--text)';
                if (selected !== null) {
                  if (choice === q.answer) { bg = '#dcfce7'; col = '#166534'; }
                  else if (choice === selected) { bg = '#fee2e2'; col = '#991b1b'; }
                }
                return (
                  <button
                    key={choice}
                    onClick={() => choose(choice)}
                    style={{
                      padding: '12px 16px', borderRadius: 12, border: 'none',
                      background: bg, color: col,
                      fontWeight: 700, fontSize: 14, cursor: 'pointer',
                      textAlign: 'left', transition: 'background .2s',
                      fontFamily: "'Outfit', sans-serif",
                    }}
                  >
                    {choice}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function FrequencyTrackScreen({ goBack, award }) {
  const [learnedArr, setLearnedArr] = useState(() => getLearnedFrequencyWords());
  const [posFilter, setPosFilter] = useState('all');
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);

  const learnedSet = new Set(learnedArr);
  const learnedCount = learnedArr.length;
  const streak = computeStreak(learnedArr);
  const pct = Math.round((learnedCount / FREQUENCY_500.length) * 100);

  const filtered = posFilter === 'all'
    ? FREQUENCY_500
    : FREQUENCY_500.filter(w => w.pos === posFilter);

  const handleTap = useCallback((rank) => {
    if (learnedSet.has(rank)) return;
    markFrequencyWordLearned(rank);
    setLearnedArr(getLearnedFrequencyWords());
    if (typeof award === 'function') award(5);
  }, [learnedSet, award]);

  function handleStartQuiz() {
    const questions = buildQuizQuestions(learnedSet);
    setQuizQuestions(questions);
    setShowQuiz(true);
  }

  function handleQuizMarkLearned(rank) {
    markFrequencyWordLearned(rank);
    setLearnedArr(getLearnedFrequencyWords());
    if (typeof award === 'function') award(5);
  }

  function handleQuizClose() {
    setShowQuiz(false);
    setLearnedArr(getLearnedFrequencyWords());
  }

  return (
    <div className="scr-wrap" style={{ paddingBottom: 100, fontFamily: "'Outfit', sans-serif" }}>
      {/* ── HEADER ── */}
      {H('Top 500 Croatian Words', 'Master the words that make up 80% of everyday Croatian speech', goBack)}

      {/* ── STATS ROW ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <StatTile value={learnedCount} label={`/ ${FREQUENCY_500.length} learned`} />
        <StatTile value={streak} label="word streak" />
        <StatTile value={`${pct}%`} label="complete" />
      </div>

      {/* ── PROGRESS BAR ── */}
      <div className="prog-track" style={{
        width: '100%', height: 10,
        background: 'var(--bar-bg)',
        borderRadius: 5, marginBottom: 18, overflow: 'hidden',
      }}>
        <div className="prog-fill" style={{
          width: `${pct}%`, height: '100%',
          background: 'linear-gradient(90deg,#0e7490,#06b6d4)',
          borderRadius: 5,
          transition: 'width .4s ease',
        }} />
      </div>

      {/* ── POS FILTER PILLS ── */}
      <div style={{
        display: 'flex', gap: 6, overflowX: 'auto',
        scrollbarWidth: 'none', marginBottom: 16,
        padding: '2px 0',
      }}>
        {POS_FILTER_ORDER.map(pos => {
          const isActive = posFilter === pos;
          return (
            <button
              key={pos}
              onClick={() => setPosFilter(pos)}
              style={{
                flexShrink: 0,
                padding: '7px 14px',
                borderRadius: 20, border: 'none',
                background: isActive ? 'linear-gradient(135deg,#0e7490,#164e63)' : 'var(--bar-bg)',
                color: isActive ? 'white' : 'var(--subtext)',
                fontWeight: 700, fontSize: 12, cursor: 'pointer',
                transition: 'background .2s',
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              {POS_LABELS[pos]}
            </button>
          );
        })}
      </div>

      {/* ── WORD GRID ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 6,
        marginBottom: 24,
      }}>
        {filtered.map(word => (
          <WordTile
            key={word.rank}
            word={word}
            learned={learnedSet.has(word.rank)}
            onTap={() => handleTap(word.rank)}
          />
        ))}
      </div>

      {/* ── BOTTOM CTA ── */}
      <div style={{
        position: 'sticky', bottom: 16,
        padding: '0 0 4px',
      }}>
        <button
          onClick={handleStartQuiz}
          disabled={learnedCount >= FREQUENCY_500.length}
          style={{
            width: '100%', padding: '15px 0',
            background: learnedCount >= FREQUENCY_500.length ? 'var(--bar-bg)' : TEAL_GRAD,
            border: 'none', borderRadius: 16,
            color: learnedCount >= FREQUENCY_500.length ? 'var(--subtext)' : 'white',
            fontWeight: 800, fontSize: 16, cursor: 'pointer',
            boxShadow: learnedCount >= FREQUENCY_500.length ? 'none' : '0 4px 18px rgba(14,116,144,.45)',
            transition: 'opacity .2s',
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          {learnedCount >= FREQUENCY_500.length
            ? '🎉 All 500 words learned!'
            : `Quiz me on due words (${FREQUENCY_500.length - learnedCount} remaining)`}
        </button>
      </div>

      {/* ── QUIZ OVERLAY ── */}
      {showQuiz && (
        <QuizOverlay
          questions={quizQuestions}
          onClose={handleQuizClose}
          onMarkLearned={handleQuizMarkLearned}
        />
      )}
    </div>
  );
}
