import React from 'react';
import AudioControls from './AudioControls';
import TranscriptToggle from './TranscriptToggle';
import { EXERCISES } from './exercises';
import type { ListeningQuiz } from './useListeningQuiz';

/** Extract key vocabulary words from the Croatian sentence (words ≥ 4 chars, skip common short words) */
const STOP_WORDS = new Set([
  'gdje',
  'kako',
  'kada',
  'koji',
  'koja',
  'koje',
  'što',
  'ima',
  'ima',
  'sam',
  'ste',
  'smo',
  'ću',
  'će',
  'će',
  'ali',
  'ili',
  'jer',
  'dok',
  'bez',
  'kod',
  'nad',
  'pod',
  'pred',
  'pri',
  'kroz',
  'između',
  'zbog',
  'prema',
  'jedan',
  'jedna',
  'jedno',
  'dva',
  'dvije',
  'tri',
  'ovo',
  'ova',
  'ove',
  'taj',
  'ta',
  'to',
  'ti',
  'te',
  'on',
  'ona',
  'ono',
  'oni',
  'one',
  'ona',
  'moj',
  'moja',
  'moje',
  'tvoj',
  'tvoja',
  'naš',
  'naša',
  'vaš',
  'vaša',
]);

function extractKeyWords(sentence: string) {
  const words = sentence
    .replace(/[.,!?;:"'«»—–\-\u201c\u201d]/g, ' ')
    .split(/\s+/)
    .map((w) => w.toLowerCase().trim())
    .filter((w) => w.length >= 4 && !STOP_WORDS.has(w));
  // deduplicate
  return [...new Set(words)].slice(0, 6);
}

// ── Main component ─────────────────────────────────────────────────────────────

/** Active-question screen — audio, options, transcript, progress. */
export default function QuestionView({ quiz }: { quiz: ListeningQuiz }) {
  const {
    shuffledQuestions,
    questionIdx,
    selectedLevel,
    selectedSetIdx,
    selectedSet,
    getCompletedQuestions,
    getTotalQuestionsForSet,
    reset,
    chosen,
    handleAnswer,
    next,
  } = quiz;
  if (!shuffledQuestions) return null;
  const q = shuffledQuestions[questionIdx]!;
  const total = shuffledQuestions.length;
  const ld = (EXERCISES as Record<string, typeof EXERCISES.A1>)[selectedLevel!]!;
  const keyWords = extractKeyWords(q.hr);

  // Completion within the set
  const completedInSet = getCompletedQuestions(selectedLevel!, selectedSetIdx!);
  const totalInSet = getTotalQuestionsForSet(selectedLevel!, selectedSetIdx!);

  return (
    <div className="scr-wrap" style={{ paddingBottom: 24 }}>
      {/* Top bar: back + progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <button
          onClick={reset}
          style={{
            background: 'var(--bar-bg)',
            border: 'none',
            borderRadius: 10,
            padding: '6px 12px',
            color: 'var(--subtext)',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          ← Back
        </button>
        <div
          style={{
            flex: 1,
            height: 6,
            background: 'var(--bar-bg)',
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: (questionIdx / total) * 100 + '%',
              height: '100%',
              background: ld.color,
              borderRadius: 3,
              transition: 'width .3s ease',
            }}
          />
        </div>
        <div
          style={{
            padding: '3px 10px',
            borderRadius: 20,
            background: ld.headerBg,
            fontSize: 11,
            fontWeight: 800,
            color: 'white',
            flexShrink: 0,
          }}
        >
          {selectedLevel}
        </div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--subtext)',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {questionIdx + 1}/{total}
        </div>
      </div>

      {/* Set progress indicator */}
      <div
        style={{
          fontSize: 11,
          color: 'var(--subtext)',
          fontWeight: 600,
          marginBottom: 14,
          paddingLeft: 2,
        }}
      >
        {selectedSet.icon} {selectedSet.title} · {completedInSet}/{totalInSet} completed
      </div>

      {/* Question card */}
      <div
        style={{
          background: 'var(--card)',
          border: '1.5px solid var(--card-b)',
          borderRadius: 16,
          padding: '20px 18px',
          marginBottom: 16,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 900,
            color: ld.color,
            textTransform: 'uppercase',
            letterSpacing: '.1em',
            marginBottom: 10,
          }}
        >
          🎧 Listen & understand
        </div>
        <div
          style={{
            fontSize: 20,
            fontWeight: 900,
            color: 'var(--heading)',
            fontFamily: "'Playfair Display',serif",
            lineHeight: 1.4,
            marginBottom: 6,
          }}
        >
          &ldquo;{q.hr}&rdquo;
        </div>
        <div
          style={{ fontSize: 11, color: 'var(--subtext)', fontStyle: 'italic', marginBottom: 0 }}
        >
          What does this mean in English?
        </div>

        {/* TTS controls */}
        <AudioControls
          key={`${selectedLevel}-${selectedSetIdx}-${questionIdx}`}
          text={q.hr}
          accentColor={ld.color}
        />

        {/* Transcript toggle — only after answering */}
        {chosen !== null && (
          <TranscriptToggle text={q.hr} keyWords={keyWords} accentColor={ld.color} />
        )}
      </div>

      {/* Answer options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {q.opts.map((opt: string) => {
          const isCorrect = opt === q.en;
          const isChosen = opt === chosen;
          let bg = 'var(--card)',
            border = '1.5px solid var(--card-b)',
            color = 'var(--body)';
          if (chosen !== null) {
            if (isCorrect) {
              bg = 'var(--success-bg, #f0fdf4)';
              border = '1.5px solid var(--success-b, #bbf7d0)';
              color = 'var(--success)';
            } else if (isChosen) {
              bg = '#fff1f2';
              border = '1.5px solid #fecaca';
              color = '#b91c1c';
            }
          }
          return (
            <button
              key={opt}
              onClick={() => handleAnswer(opt)}
              style={{
                padding: '14px 16px',
                borderRadius: 12,
                border,
                background: bg,
                color,
                fontSize: 14,
                fontWeight: 600,
                cursor: chosen ? 'default' : 'pointer',
                textAlign: 'left',
                fontFamily: "'Outfit',sans-serif",
                lineHeight: 1.4,
                transition: 'background .2s, border .2s',
              }}
            >
              {chosen !== null && isCorrect && <span style={{ marginRight: 8 }}>✓</span>}
              {chosen !== null && isChosen && !isCorrect && (
                <span style={{ marginRight: 8 }}>✗</span>
              )}
              {opt}
            </button>
          );
        })}
      </div>

      {chosen !== null && (
        <button
          onClick={next}
          style={{
            marginTop: 16,
            width: '100%',
            padding: '14px',
            borderRadius: 14,
            background: ld.color,
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: 15,
            fontWeight: 900,
            fontFamily: "'Outfit',sans-serif",
          }}
        >
          {questionIdx + 1 >= total ? 'See Results' : 'Next →'}
        </button>
      )}
    </div>
  );
}
