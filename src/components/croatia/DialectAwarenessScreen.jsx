import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { useStats } from '../../context/StatsContext.tsx';
import { H } from '../../data.jsx';

// ─── Dialect Data ────────────────────────────────────────────────────────────

const DIALECTS = [
  {
    id: 'stokavian',
    name: 'Štokavski',
    nameEn: 'Štokavian',
    icon: '🏙️',
    color: '#2563eb',
    region: 'Central & Eastern Croatia, Bosnia, Serbia, Montenegro',
    pronoun: 'što',
    speakers: '~85% of Croatian speakers',
    standard: true,
    tagline: 'The standard language — what you learn in textbooks',
    description:
      'Štokavian is the basis of standard Croatian, Serbian, Bosnian, and Montenegrin. The name comes from the word "što" (what). If you learn textbook Croatian, you are learning Štokavian.',
    features: [
      { feature: 'Word for "what"', dialect: 'što', standard: 'što' },
      { feature: 'Word for "I"', dialect: 'ja', standard: 'ja' },
      { feature: '"Where are you going?"', dialect: 'Kuda ideš?', standard: 'Kuda ideš?' },
      { feature: '"House"', dialect: 'kuća', standard: 'kuća' },
      { feature: '"Milk"', dialect: 'mlijeko', standard: 'mlijeko' },
    ],
    sample: 'Što radiš? Idem kući.',
    sampleEn: 'What are you doing? I am going home.',
    famousFor: 'Standard Croatian, spoken in Zagreb, Split, Dubrovnik',
    hearIn: 'News broadcasts, formal speech, all textbooks',
    tip: 'This is the dialect you are already learning! Understanding the others helps you decode real Croatian conversation.',
  },
  {
    id: 'cakavian',
    name: 'Čakavski',
    nameEn: 'Čakavian',
    icon: '🌊',
    color: '#0891b2',
    region: 'Dalmatian coast, islands, Istria',
    pronoun: 'ča',
    speakers: '~10% of Croatian speakers',
    standard: false,
    tagline: 'The poetic dialect of the coast and islands',
    description:
      'Čakavian is spoken along the Dalmatian coast, on islands like Hvar, Brač, and Vis, and in Istria. Named after "ča" (what). It has strong Italian and Venetian influence due to centuries of trade. The first Croatian literary works were written in Čakavian.',
    features: [
      { feature: 'Word for "what"', dialect: 'ča', standard: 'što' },
      { feature: 'Word for "I"', dialect: 'ja / ja', standard: 'ja' },
      { feature: '"Where are you going?"', dialect: 'Kamo greš?', standard: 'Kuda ideš?' },
      { feature: '"House"', dialect: 'hiža / kuća', standard: 'kuća' },
      { feature: '"Milk"', dialect: 'mliko', standard: 'mlijeko' },
      { feature: '"I have"', dialect: 'Ja imam / Ja maš', standard: 'Ja imam' },
    ],
    sample: 'Ča delaš? Gren doma.',
    sampleEn: 'What are you doing? I am going home.',
    famousFor: 'Islands of Hvar, Brač, Vis; Zadar area; Istria',
    hearIn: 'Klapa music, folk songs, island grandparents',
    tip: 'If you visit Hvar or Brač and hear "Ča?", it means "What?" — this is Čakavian!',
  },
  {
    id: 'kajkavian',
    name: 'Kajkavski',
    nameEn: 'Kajkavian',
    icon: '🌲',
    color: '#16a34a',
    region: 'Zagreb and northwestern Croatia, Zagorje, Međimurje',
    pronoun: 'kaj',
    speakers: '~5% of Croatian speakers',
    standard: false,
    tagline: 'The dialect of Zagreb and the north',
    description:
      'Kajkavian is spoken in Zagreb (the capital) and the northwestern region. Named after "kaj" (what). It has strong Central European influence — German and Hungarian loanwords are common. Despite being the dialect of the capital, it is not the standard language.',
    features: [
      { feature: 'Word for "what"', dialect: 'kaj', standard: 'što' },
      { feature: 'Word for "I"', dialect: 'ja', standard: 'ja' },
      { feature: '"Where are you going?"', dialect: 'Kam ideš?', standard: 'Kuda ideš?' },
      { feature: '"House"', dialect: 'hiža', standard: 'kuća' },
      { feature: '"Milk"', dialect: 'mleko', standard: 'mlijeko' },
      { feature: '"I have"', dialect: 'Ja imam', standard: 'Ja imam' },
    ],
    sample: 'Kaj delaš? Idem doma.',
    sampleEn: 'What are you doing? I am going home.',
    famousFor: 'Zagreb, Zagorje, Međimurje',
    hearIn: 'Zagreb locals chatting, Zagorje folk songs, Josip Broz Tito (who was from Zagorje)',
    tip: 'When Zagrepčani (Zagreb people) speak casually among themselves, you will hear "kaj" instead of "što". This is Kajkavian leaking into everyday speech.',
  },
];

// ─── Quiz Data ───────────────────────────────────────────────────────────────

const QUIZ = [
  {
    q: 'Which dialect is the basis of standard Croatian?',
    options: ['Čakavian', 'Kajkavian', 'Štokavian', 'All three equally'],
    ans: 2,
  },
  {
    q: 'If you hear "Ča radiš?" on a Dalmatian island, which dialect is being spoken?',
    options: ['Štokavian', 'Čakavian', 'Kajkavian', 'Serbian'],
    ans: 1,
  },
  {
    q: '"Kaj" is the word for "what" in which dialect?',
    options: ['Štokavian', 'Čakavian', 'Kajkavian', 'Istrian'],
    ans: 2,
  },
  {
    q: 'Where would you most likely hear Kajkavian?',
    options: ['Split', 'Dubrovnik', 'Zagreb', 'Hvar'],
    ans: 2,
  },
  {
    q: 'What do "što", "ča", and "kaj" all mean?',
    options: ['Hello', 'Goodbye', 'What', 'Where'],
    ans: 2,
  },
  {
    q: 'Which dialect has the most Italian/Venetian loanword influence?',
    options: ['Štokavian', 'Čakavian', 'Kajkavian', 'None'],
    ans: 1,
  },
];

const LS_KEY = 'nh_dialect_quiz_done';

// ─── Sub-components ───────────────────────────────────────────────────────────

function DialectCard({ dialect, onTap }) {
  return (
    <button
      onClick={() => onTap(dialect)}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        background: 'var(--card)',
        border: '1px solid var(--card-b)',
        borderLeft: `4px solid ${dialect.color}`,
        borderRadius: 14,
        padding: '16px 16px 14px',
        marginBottom: 12,
        cursor: 'pointer',
        boxShadow: '0 1px 4px rgba(0,0,0,.06)',
        transition: 'transform 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,.1)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,.06)';
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <span style={{ fontSize: 26 }}>{dialect.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 18,
                fontWeight: 800,
                color: 'var(--heading)',
                letterSpacing: '-0.02em',
              }}
            >
              {dialect.name}
            </span>
            <span style={{ fontSize: 13, color: 'var(--subtext)', fontWeight: 500 }}>
              {dialect.nameEn}
            </span>
            {dialect.standard && (
              <span
                style={{
                  background: dialect.color,
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: 20,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                Standard
              </span>
            )}
          </div>
        </div>
        <span style={{ fontSize: 18, color: 'var(--subtext)' }}>›</span>
      </div>

      {/* Tagline */}
      <div
        style={{
          fontSize: 13,
          color: dialect.color,
          fontWeight: 600,
          marginBottom: 8,
        }}
      >
        {dialect.tagline}
      </div>

      {/* Region pill */}
      <div
        style={{
          display: 'inline-block',
          background: `${dialect.color}18`,
          color: dialect.color,
          fontSize: 11,
          fontWeight: 600,
          padding: '3px 9px',
          borderRadius: 20,
          marginBottom: 8,
        }}
      >
        📍 {dialect.region}
      </div>

      {/* Speakers */}
      <div style={{ fontSize: 12, color: 'var(--subtext)', fontWeight: 500 }}>
        {dialect.speakers}
      </div>
    </button>
  );
}

function ComparisonTable({ features }) {
  return (
    <div
      style={{
        borderRadius: 10,
        overflow: 'hidden',
        border: '1px solid var(--card-b)',
        marginBottom: 16,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          background: 'var(--card-b)',
          padding: '8px 12px',
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--subtext)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Feature
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--subtext)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Dialect
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--subtext)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Standard
        </div>
      </div>

      {/* Rows */}
      {features.map((row, i) => (
        <div
          key={i}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            padding: '9px 12px',
            background: i % 2 === 0 ? 'var(--card)' : 'rgba(0,0,0,.025)',
            alignItems: 'center',
            borderTop: i === 0 ? 'none' : '1px solid var(--card-b)',
          }}
        >
          <div style={{ fontSize: 12, color: 'var(--subtext)', lineHeight: 1.3 }}>{row.feature}</div>
          <div
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 700,
              fontSize: 14,
              color: 'var(--heading)',
            }}
          >
            {row.dialect}
          </div>
          <div style={{ fontSize: 13, color: 'var(--subtext)', fontWeight: 500 }}>{row.standard}</div>
        </div>
      ))}
    </div>
  );
}

function DetailView({ dialect, onBack }) {
  return (
    <div>
      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--subtext)',
          marginBottom: 16,
          padding: '4px 0',
          fontFamily: "'Outfit', sans-serif",
        }}
      >
        ‹ Back to Dialects
      </button>

      {/* Hero */}
      <div
        style={{
          background: 'var(--card)',
          border: `2px solid ${dialect.color}`,
          borderRadius: 16,
          padding: '20px 16px 16px',
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <span style={{ fontSize: 36 }}>{dialect.icon}</span>
          <div>
            <div
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 26,
                fontWeight: 800,
                color: 'var(--heading)',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
              }}
            >
              {dialect.name}
            </div>
            <div style={{ fontSize: 14, color: dialect.color, fontWeight: 600, marginTop: 2 }}>
              {dialect.nameEn} · {dialect.speakers}
            </div>
          </div>
          {dialect.standard && (
            <span
              style={{
                marginLeft: 'auto',
                background: dialect.color,
                color: '#fff',
                fontSize: 11,
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 20,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Standard
            </span>
          )}
        </div>

        {/* Region */}
        <div
          style={{
            display: 'inline-block',
            background: `${dialect.color}18`,
            color: dialect.color,
            fontSize: 12,
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: 20,
          }}
        >
          📍 {dialect.region}
        </div>
      </div>

      {/* Description */}
      <div className="c" style={{ marginBottom: 12 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--subtext)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: 6,
          }}
        >
          About this dialect
        </div>
        <p style={{ fontSize: 14, color: 'var(--heading)', lineHeight: 1.6, margin: 0 }}>
          {dialect.description}
        </p>
      </div>

      {/* Famous for */}
      <div className="c" style={{ marginBottom: 12 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--subtext)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: 6,
          }}
        >
          Famous for
        </div>
        <div style={{ fontSize: 14, color: 'var(--heading)', fontWeight: 500 }}>
          {dialect.famousFor}
        </div>
      </div>

      {/* Comparison table */}
      <div style={{ marginBottom: 4 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--subtext)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: 8,
          }}
        >
          Key differences vs. Standard Croatian
        </div>
        <ComparisonTable features={dialect.features} />
      </div>

      {/* Sample sentence */}
      <div
        style={{
          background: `${dialect.color}12`,
          border: `1px solid ${dialect.color}40`,
          borderRadius: 14,
          padding: '16px 16px 14px',
          marginBottom: 12,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: dialect.color,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: 8,
          }}
        >
          Sample sentence
        </div>
        <div
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 22,
            fontWeight: 800,
            color: 'var(--heading)',
            marginBottom: 6,
            lineHeight: 1.3,
          }}
        >
          {dialect.sample}
        </div>
        <div style={{ fontSize: 13, color: 'var(--subtext)', fontStyle: 'italic' }}>
          "{dialect.sampleEn}"
        </div>
      </div>

      {/* Where you'll hear it */}
      <div
        style={{
          background: 'var(--info)',
          borderRadius: 12,
          padding: '12px 14px',
          marginBottom: 12,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--subtext)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: 4,
          }}
        >
          🎧 Where you'll hear it
        </div>
        <div style={{ fontSize: 13, color: 'var(--heading)', lineHeight: 1.5 }}>
          {dialect.hearIn}
        </div>
      </div>

      {/* Pro tip */}
      <div
        style={{
          background: '#fef9c3',
          border: '1px solid #fde047',
          borderRadius: 12,
          padding: '12px 14px',
          marginBottom: 20,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: '#92400e',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: 4,
          }}
        >
          💡 Pro tip
        </div>
        <div style={{ fontSize: 13, color: '#78350f', lineHeight: 1.5 }}>{dialect.tip}</div>
      </div>

      {/* Back button bottom */}
      <button
        onClick={onBack}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'var(--card)',
          border: '1px solid var(--card-b)',
          borderRadius: 12,
          padding: '12px 18px',
          cursor: 'pointer',
          fontSize: 14,
          fontWeight: 700,
          color: 'var(--subtext)',
          fontFamily: "'Outfit', sans-serif",
        }}
      >
        ← Back to all dialects
      </button>
    </div>
  );
}

function QuizView({ onBack, award }) {
  const { stats, setStats, writeDelta } = useStats();
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState([]); // array of booleans
  const [selected, setSelected] = useState(null); // selected option index for current q
  const [done, setDone] = useState(false);

  const q = QUIZ[idx];
  const isAnswered = selected !== null;
  const isCorrect = selected === q.ans;

  function handleSelect(optIdx) {
    if (isAnswered) return;
    setSelected(optIdx);
  }

  function handleNext() {
    const nextAnswers = [...answers, selected === q.ans];
    if (idx + 1 < QUIZ.length) {
      setAnswers(nextAnswers);
      setIdx(idx + 1);
      setSelected(null);
    } else {
      setAnswers(nextAnswers);
      const score = nextAnswers.filter(Boolean).length;
      const alreadyDone = localStorage.getItem(LS_KEY) === '1';
      if (!alreadyDone) {
        localStorage.setItem(LS_KEY, '1');
        if (typeof award === 'function') award(score * 10);
        if (!stats.vs?.includes('dialects')) {
          setStats(prev => {
            if (prev.vs?.includes('dialects')) return prev;
            return { ...prev, lc: (prev.lc || 0) + 1, vs: [...(prev.vs || []), 'dialects'] };
          });
          if (writeDelta) writeDelta({ lc: 1, vs: ['dialects'] });
        }
      }
      setDone(true);
    }
  }

  function handleRetake() {
    setIdx(0);
    setAnswers([]);
    setSelected(null);
    setDone(false);
  }

  // Results screen
  if (done) {
    const score = answers.filter(Boolean).length;
    const pct = Math.round((score / QUIZ.length) * 100);
    const alreadyDone = localStorage.getItem(LS_KEY) === '1';
    return (
      <div>
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--card-b)',
            borderRadius: 16,
            padding: '28px 20px 24px',
            textAlign: 'center',
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 52, marginBottom: 10 }}>
            {pct >= 80 ? '🏆' : pct >= 50 ? '👏' : '📚'}
          </div>
          <div
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 28,
              fontWeight: 800,
              color: 'var(--heading)',
              marginBottom: 4,
            }}
          >
            {score} / {QUIZ.length}
          </div>
          <div style={{ fontSize: 15, color: 'var(--subtext)', marginBottom: 14 }}>
            {pct >= 80
              ? 'Excellent! You understand Croatian dialects.'
              : pct >= 50
              ? 'Good effort! Review the dialect cards and try again.'
              : 'Keep exploring — every dialect expert started here!'}
          </div>
          {alreadyDone ? (
            <div
              style={{
                background: 'var(--info)',
                borderRadius: 10,
                padding: '8px 14px',
                fontSize: 13,
                color: 'var(--subtext)',
                display: 'inline-block',
              }}
            >
              XP already awarded for your first completion
            </div>
          ) : (
            <div
              style={{
                background: '#d1fae5',
                border: '1px solid #6ee7b7',
                borderRadius: 10,
                padding: '8px 14px',
                fontSize: 14,
                fontWeight: 700,
                color: '#065f46',
                display: 'inline-block',
              }}
            >
              +{score * 10} XP earned!
            </div>
          )}
        </div>

        {/* Per-question review */}
        <div style={{ marginBottom: 16 }}>
          {QUIZ.map((question, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                background: 'var(--card)',
                border: '1px solid var(--card-b)',
                borderRadius: 10,
                padding: '10px 12px',
                marginBottom: 8,
              }}
            >
              <span style={{ fontSize: 16, marginTop: 1 }}>
                {answers[i] ? '✅' : '❌'}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: 'var(--heading)', fontWeight: 600, marginBottom: 2 }}>
                  {question.q}
                </div>
                {!answers[i] && (
                  <div style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>
                    Correct: {question.options[question.ans]}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, flexDirection: 'column' }}>
          <button
            onClick={handleRetake}
            style={{
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '13px',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            Retake Quiz
          </button>
          <button
            onClick={onBack}
            style={{
              background: 'var(--card)',
              color: 'var(--heading)',
              border: '1px solid var(--card-b)',
              borderRadius: 12,
              padding: '13px',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            Back to Dialects
          </button>
        </div>
      </div>
    );
  }

  // Active question
  return (
    <div>
      {/* Progress bar */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 12,
            color: 'var(--subtext)',
            fontWeight: 600,
            marginBottom: 6,
          }}
        >
          <span>Question {idx + 1} of {QUIZ.length}</span>
          <span>{answers.filter(Boolean).length} correct so far</span>
        </div>
        <div
          style={{
            height: 6,
            background: 'var(--card-b)',
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${((idx) / QUIZ.length) * 100}%`,
              background: '#2563eb',
              borderRadius: 3,
              transition: 'width 0.4s',
            }}
          />
        </div>
      </div>

      {/* Question card */}
      <div
        className="c"
        style={{ marginBottom: 16 }}
      >
        <div
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--heading)',
            lineHeight: 1.4,
          }}
        >
          {q.q}
        </div>
      </div>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {q.options.map((opt, i) => {
          let bg = 'var(--card)';
          let border = '1px solid var(--card-b)';
          let color = 'var(--heading)';

          if (isAnswered) {
            if (i === q.ans) {
              bg = '#d1fae5';
              border = '2px solid #6ee7b7';
              color = '#065f46';
            } else if (i === selected && i !== q.ans) {
              bg = '#fee2e2';
              border = '2px solid #fca5a5';
              color = '#7f1d1d';
            }
          } else if (selected === i) {
            bg = '#eff6ff';
            border = '2px solid #93c5fd';
          }

          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={isAnswered}
              style={{
                background: bg,
                border,
                borderRadius: 12,
                padding: '13px 16px',
                textAlign: 'left',
                cursor: isAnswered ? 'default' : 'pointer',
                fontSize: 15,
                fontWeight: 600,
                color,
                fontFamily: "'Outfit', sans-serif",
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                transition: 'background 0.15s, border 0.15s',
              }}
            >
              <span
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: isAnswered && i === q.ans
                    ? '#6ee7b7'
                    : isAnswered && i === selected && i !== q.ans
                    ? '#fca5a5'
                    : 'var(--card-b)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 800,
                  flexShrink: 0,
                  color: isAnswered && (i === q.ans || i === selected) ? '#fff' : 'var(--subtext)',
                }}
              >
                {isAnswered && i === q.ans ? '✓' : isAnswered && i === selected && i !== q.ans ? '✗' : String.fromCharCode(65 + i)}
              </span>
              {opt}
            </button>
          );
        })}
      </div>

      {/* Feedback + Next */}
      {isAnswered && (
        <div>
          <div
            style={{
              background: isCorrect ? '#d1fae5' : '#fee2e2',
              border: `1px solid ${isCorrect ? '#6ee7b7' : '#fca5a5'}`,
              borderRadius: 12,
              padding: '12px 16px',
              marginBottom: 14,
              fontSize: 14,
              fontWeight: 600,
              color: isCorrect ? '#065f46' : '#7f1d1d',
            }}
          >
            {isCorrect
              ? '✅ Correct! Well done.'
              : `❌ Not quite — the correct answer is "${q.options[q.ans]}".`}
          </div>
          <button
            onClick={handleNext}
            style={{
              width: '100%',
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '14px',
              fontSize: 16,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            {idx + 1 < QUIZ.length ? 'Next →' : 'See Results'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function DialectAwarenessScreen({ goBack, stats }) {
  const { award } = useApp();

  const [view, setView] = useState('menu'); // 'menu' | 'detail' | 'quiz'
  const [selectedDialect, setSelectedDialect] = useState(null);

  function openDetail(dialect) {
    setSelectedDialect(dialect);
    setView('detail');
  }

  function backToMenu() {
    setView('menu');
    setSelectedDialect(null);
  }

  return (
    <div className="scr-wrap">
      {/* ── Menu ── */}
      {view === 'menu' && (
        <div>
          {H('🗣️ Croatian Dialects', 'The three dialect groups', goBack)}

          {/* Intro card */}
          <div
            className="c"
            style={{ marginBottom: 20 }}
          >
            <div
              style={{
                fontSize: 13,
                color: 'var(--heading)',
                lineHeight: 1.65,
              }}
            >
              Croatian has three major dialect groups, named after their word for{' '}
              <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                "what"
              </span>
              . Standard Croatian is based on{' '}
              <span style={{ fontWeight: 700, color: '#2563eb' }}>Štokavian</span>, but the
              other two are living dialects spoken by millions — and{' '}
              <span style={{ fontWeight: 700 }}>no other Croatian app teaches this</span>.
            </div>

            {/* što / ča / kaj pill row */}
            <div
              style={{
                display: 'flex',
                gap: 8,
                marginTop: 14,
                flexWrap: 'wrap',
              }}
            >
              {DIALECTS.map(d => (
                <div
                  key={d.id}
                  style={{
                    background: `${d.color}18`,
                    border: `1px solid ${d.color}60`,
                    color: d.color,
                    borderRadius: 20,
                    padding: '5px 14px',
                    fontSize: 15,
                    fontWeight: 800,
                    fontFamily: "'Playfair Display', serif",
                  }}
                >
                  {d.pronoun}
                </div>
              ))}
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--subtext)',
                  alignSelf: 'center',
                  fontWeight: 500,
                }}
              >
                = "what" in each dialect
              </div>
            </div>
          </div>

          {/* Dialect cards */}
          {DIALECTS.map(d => (
            <DialectCard key={d.id} dialect={d} onTap={openDetail} />
          ))}

          {/* Quiz CTA */}
          <button
            onClick={() => setView('quiz')}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #2563eb 0%, #0891b2 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 14,
              padding: '16px',
              fontSize: 16,
              fontWeight: 800,
              cursor: 'pointer',
              marginTop: 8,
              fontFamily: "'Outfit', sans-serif",
              boxShadow: '0 4px 14px rgba(37,99,235,.35)',
              letterSpacing: '-0.01em',
            }}
          >
            🧠 Take the Dialect Quiz!
          </button>

          {localStorage.getItem(LS_KEY) === '1' && (
            <div
              style={{
                textAlign: 'center',
                fontSize: 12,
                color: 'var(--subtext)',
                marginTop: 8,
                fontWeight: 500,
              }}
            >
              ✓ Quiz completed — retake anytime
            </div>
          )}
        </div>
      )}

      {/* ── Detail ── */}
      {view === 'detail' && selectedDialect && (
        <DetailView dialect={selectedDialect} onBack={backToMenu} />
      )}

      {/* ── Quiz ── */}
      {view === 'quiz' && (
        <div>
          {H('🧠 Dialect Quiz', 'Test your knowledge', backToMenu)}
          <QuizView onBack={backToMenu} award={award} />
        </div>
      )}
    </div>
  );
}
