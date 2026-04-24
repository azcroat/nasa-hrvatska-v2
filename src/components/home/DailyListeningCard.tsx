/**
 * DailyListeningCard — Comprehensible input at the user's CEFR level.
 *
 * Calls /api/listening to generate a short Croatian dialogue/monologue, shows
 * a scrollable transcript with per-line audio, then reveals 3 comprehension
 * questions. Awards 15 XP on completion. Resets once per day.
 */
import React, { useState, useCallback } from 'react';
import type { AwardActivityType } from '../../types/index.js';
import { apiFetch } from '../../lib/apiFetch.js';
import { speak } from '../../lib/audio.js';
import { markQuest } from '../../lib/quests.js';

interface ListeningQuestion {
  text?: string;
  question?: string;
  options: string[];
  answer: string;
}

interface ListeningSpeaker {
  name?: string;
  lines?: string[];
}

interface ListeningData {
  speakers: ListeningSpeaker[];
  questions: ListeningQuestion[];
}

const XP_REWARD = 15;
const TOPICS = [
  'cafe',
  'market',
  'family',
  'travel',
  'weather',
  'sports',
  'work',
  'weekend',
  'restaurant',
  'city',
];

function getDailyTopic(): string {
  // Rotate topics deterministically by day
  const dayIdx = Math.floor(Date.now() / 86400000);
  return TOPICS[dayIdx % TOPICS.length] ?? TOPICS[0]!;
}

function getCompletedKey(level: string) {
  const today = new Date().toISOString().slice(0, 10);
  return `nh_listening_done_${level}_${today}`;
}

export default function DailyListeningCard({
  level,
  award,
}: {
  level: string;
  award?: (xp: number, celebrate?: boolean, activityType?: AwardActivityType) => void;
}) {
  const [phase, setPhase] = useState('idle'); // idle | loading | reading | questions | done
  const [data, setData] = useState<ListeningData | null>(null); // {speakers, questions}
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({}); // questionIdx -> selectedOption
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [speakingLine, setSpeakingLine] = useState<string | null>(null);
  const completedKey = getCompletedKey(level);
  const alreadyDone =
    phase !== 'done' &&
    (() => {
      try {
        return localStorage.getItem(completedKey) === '1';
      } catch {
        return false;
      }
    })();

  const load = useCallback(async () => {
    setPhase('loading');
    setError(null);
    try {
      const topic = getDailyTopic();
      const res = await apiFetch('/api/listening', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, level, style: 'dialogue' }),
      });
      if (!res.ok) throw new Error('API error');
      const json = await res.json();
      if (!json.speakers?.length) throw new Error('Invalid response');
      setData(json);
      setPhase('reading');
    } catch (e) {
      setError("Could not load today's listening exercise. Try again.");
      setPhase('idle');
    }
  }, [level]);

  const handleAnswer = useCallback(
    (qIdx: number, opt: string) => {
      if (checked) return;
      setAnswers((prev) => ({ ...prev, [qIdx]: opt }));
    },
    [checked],
  );

  const checkAnswers = useCallback(() => {
    if (!data?.questions) return;
    let correct = 0;
    data.questions.forEach((q, i) => {
      if (answers[i] === q.answer) correct++;
    });
    setScore(correct);
    setChecked(true);
    // Award XP proportional to score
    const xp = Math.round(XP_REWARD * (0.5 + (correct / Math.max(data.questions.length, 1)) * 0.5));
    if (award) award(xp, false, 'listening');
    markQuest('speak');
    try {
      localStorage.setItem(completedKey, '1');
    } catch {}
    setTimeout(() => setPhase('done'), 400);
  }, [data, answers, award, completedKey]);

  const speakLine = useCallback(async (text: string) => {
    setSpeakingLine(text);
    try {
      await speak(text);
    } catch {}
    setSpeakingLine(null);
  }, []);

  if (alreadyDone && phase !== 'done') {
    return (
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--card-b)',
          borderRadius: 16,
          padding: '14px 16px',
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <span style={{ fontSize: 28 }}>🎧</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--heading)' }}>
            Daily Listening · Complete
          </div>
          <div style={{ fontSize: 12, color: 'var(--subtext)', marginTop: 2 }}>
            Come back tomorrow for a new exercise
          </div>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: '#16a34a' }}>
          ✓ Done
        </div>
      </div>
    );
  }

  // ── IDLE ────────────────────────────────────────────────────────────────────
  if (phase === 'idle') {
    return (
      <div
        style={{
          background:
            'linear-gradient(135deg, rgba(14,116,144,0.08) 0%, rgba(12,74,110,0.05) 100%)',
          border: '1.5px solid rgba(14,116,144,0.25)',
          borderRadius: 16,
          padding: '16px',
          marginBottom: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 32, flexShrink: 0 }}>🎧</div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 900,
                color: '#0e7490',
                textTransform: 'uppercase',
                letterSpacing: '.08em',
                marginBottom: 2,
              }}
            >
              Daily Listening · {level}
            </div>
            <div
              style={{ fontSize: 13, color: 'var(--heading)', fontWeight: 600, lineHeight: 1.4 }}
            >
              {error ||
                `Today's topic: ${getDailyTopic().charAt(0).toUpperCase() + getDailyTopic().slice(1)} · Dialogue with questions`}
            </div>
          </div>
          <button
            onClick={load}
            style={{
              flexShrink: 0,
              background: '#0e7490',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '10px 16px',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              fontFamily: "'Outfit',sans-serif",
            }}
          >
            Listen →
          </button>
        </div>
        {error && (
          <div style={{ marginTop: 8, fontSize: 11, color: '#b91c1c', fontWeight: 600 }}>
            {error}
          </div>
        )}
      </div>
    );
  }

  // ── LOADING ─────────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--card-b)',
          borderRadius: 16,
          padding: '20px 16px',
          marginBottom: 12,
          textAlign: 'center',
        }}
      >
        <div
          style={{ fontSize: 28, marginBottom: 8, animation: 'pulse 1.5s ease-in-out infinite' }}
        >
          🎧
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--subtext)' }}>
          Generating today's Croatian dialogue…
        </div>
      </div>
    );
  }

  // ── DONE ────────────────────────────────────────────────────────────────────
  if (phase === 'done') {
    const total = data?.questions?.length || 3;
    return (
      <div
        style={{
          background: 'var(--card)',
          border: '1.5px solid rgba(22,163,74,0.3)',
          borderRadius: 16,
          padding: '16px',
          marginBottom: 12,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 6 }}>🎧</div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 900,
            color: score === total ? '#16a34a' : '#0e7490',
            marginBottom: 4,
          }}
        >
          {score === total ? 'Odlično! Perfect score!' : `${score}/${total} correct — Dobro!`}
        </div>
        <div style={{ fontSize: 12, color: 'var(--subtext)', fontWeight: 500 }}>
          +{XP_REWARD} XP earned · Come back tomorrow
        </div>
      </div>
    );
  }

  // Flatten all dialogue lines for the transcript
  const allLines = [];
  if (data?.speakers) {
    for (const speaker of data.speakers) {
      for (const line of speaker.lines || []) {
        allLines.push({ speaker: speaker.name, text: line });
      }
    }
  }

  // ── READING — transcript + questions ────────────────────────────────────────
  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1.5px solid rgba(14,116,144,0.25)',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 12,
      }}
    >
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(90deg, #0c4a6e, #0e7490)',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>🎧</span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 900,
              color: '#fff',
              textTransform: 'uppercase',
              letterSpacing: '.08em',
            }}
          >
            Daily Listening · {level}
          </span>
        </div>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: 600 }}>
          {getDailyTopic().charAt(0).toUpperCase() + getDailyTopic().slice(1)}
        </span>
      </div>

      {/* Transcript */}
      <div style={{ padding: '12px 16px', maxHeight: 240, overflowY: 'auto' }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: 'var(--subtext)',
            textTransform: 'uppercase',
            letterSpacing: '.08em',
            marginBottom: 10,
          }}
        >
          📜 Transcript — tap any line to hear it
        </div>
        {allLines.map((line, i) => (
          <div
            key={i}
            onClick={() => speakLine(line.text)}
            style={{
              display: 'flex',
              gap: 10,
              marginBottom: 10,
              cursor: 'pointer',
              padding: '8px 10px',
              borderRadius: 10,
              background: speakingLine === line.text ? 'rgba(14,116,144,0.12)' : 'var(--bar-bg)',
              border:
                speakingLine === line.text
                  ? '1px solid rgba(14,116,144,0.3)'
                  : '1px solid transparent',
              transition: 'background .2s ease',
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: '#0e7490',
                minWidth: 60,
                flexShrink: 0,
                paddingTop: 1,
              }}
            >
              {line.speaker}
            </div>
            <div style={{ fontSize: 13, color: 'var(--heading)', lineHeight: 1.5, flex: 1 }}>
              {line.text}
              {speakingLine === line.text && (
                <span
                  style={{
                    marginLeft: 6,
                    animation: 'pulse 1s ease-in-out infinite',
                    fontSize: 11,
                  }}
                >
                  🔊
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Comprehension questions */}
      {(data?.questions?.length ?? 0) > 0 && data && (
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ borderTop: '1px solid var(--card-b)', paddingTop: 12, marginBottom: 10 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: 'var(--subtext)',
                textTransform: 'uppercase',
                letterSpacing: '.08em',
              }}
            >
              ❓ Comprehension Questions
            </div>
          </div>
          {data.questions.map((q, qi) => (
            <div key={qi} style={{ marginBottom: 14 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--heading)',
                  marginBottom: 8,
                  lineHeight: 1.4,
                }}
              >
                {qi + 1}. {q.question}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(q.options || []).map((opt, oi) => {
                  const isSelected = answers[qi] === opt;
                  const isCorrect = checked && opt === q.answer;
                  const isWrong = checked && isSelected && opt !== q.answer;
                  return (
                    <button
                      key={oi}
                      onClick={() => handleAnswer(qi, opt)}
                      disabled={checked}
                      style={{
                        padding: '9px 12px',
                        borderRadius: 10,
                        textAlign: 'left',
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'var(--heading)',
                        fontFamily: "'Outfit',sans-serif",
                        cursor: checked ? 'default' : 'pointer',
                        background: isCorrect
                          ? 'rgba(22,163,74,0.15)'
                          : isWrong
                            ? 'rgba(220,38,38,0.1)'
                            : isSelected
                              ? 'rgba(14,116,144,0.1)'
                              : 'var(--bar-bg)',
                        border: isCorrect
                          ? '1.5px solid #16a34a'
                          : isWrong
                            ? '1.5px solid #dc2626'
                            : isSelected
                              ? '1.5px solid #0e7490'
                              : '1.5px solid transparent',
                        transition: 'all .2s ease',
                      }}
                    >
                      {opt}
                      {isCorrect && ' ✓'}
                      {isWrong && ' ✗'}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Check answers button */}
          {!checked && Object.keys(answers).length === data.questions.length && (
            <button
              onClick={checkAnswers}
              style={{
                width: '100%',
                height: 44,
                background: 'linear-gradient(135deg, #0c4a6e, #0e7490)',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 800,
                cursor: 'pointer',
                fontFamily: "'Outfit',sans-serif",
                boxShadow: '0 4px 14px rgba(14,116,144,0.35)',
              }}
            >
              Check Answers (+{XP_REWARD} XP)
            </button>
          )}
          {!checked && Object.keys(answers).length < data.questions.length && (
            <div
              style={{
                fontSize: 11,
                color: 'var(--subtext)',
                textAlign: 'center',
                fontWeight: 600,
              }}
            >
              Answer all {data.questions.length} questions to continue
            </div>
          )}
        </div>
      )}
    </div>
  );
}
