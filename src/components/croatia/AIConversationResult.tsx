import React, { useState } from 'react';
import { speak } from '../../data';

interface ConvoMistake {
  original?: string;
  correction?: string;
  rule?: string;
}

interface ConvoFocusArea {
  topic?: string;
  explanation?: string;
  exercise?: string;
}

interface ConvoVocabItem {
  word?: string;
  hr?: string;
  english?: string;
  en?: string;
}

interface ConvoEvaluation {
  score: number;
  scoreLabel?: string;
  level_demonstrated?: string;
  encouragement?: string;
  strengths?: string[];
  mistakes?: ConvoMistake[];
  focus_areas?: ConvoFocusArea[];
  vocabulary_feedback?: string;
  [key: string]: unknown;
}

interface AIConversationResultProps {
  evalError: string | null;
  evaluation: ConvoEvaluation | Record<string, unknown> | null;
  level: string;
  userCount: number;
  weakAreasForSession: string[];
  convoVocab: ConvoVocabItem[] | unknown[] | null;
  setJWords: (words: unknown[]) => void;
  setScr: (scr: unknown, ...args: unknown[]) => void;
  sCurEx: ((ex: string) => void) | unknown;
  onBackToChat: () => void;
  onReset: () => void;
}

const EXERCISE_MAP = {
  accusativedrill: '🍽️ Accusative Case',
  tenseflip: '⏳ Tense Flip',
  verbdrill: '💪 Verb Drill',
  negation: '❌ Negation',
  possess: '👤 Possessives',
  ordinals: '🏢 Ordinals',
  relpron: '🔗 Koji/Koja/Koje',
  emogender: '😀 Emotion Gender',
  comparatives: '📈 Comparatives',
  future: '🚀 Future Tense',
  sibil: '🔄 k→c/g→z',
  prepdrill: '📍 Prepositions',
  numtime: '🔢 Numbers & Time',
  profgender: '👨‍⚖️ Job Genders',
  reflexive: '🧲 SE Verbs',
  sentbuild: '🏗️ Sentence Builder',
  genderdrill: '♂️♀️ Gender Drill',
};

export default function AIConversationResult({
  evalError,
  evaluation,
  level,
  userCount,
  weakAreasForSession,
  convoVocab,
  setJWords,
  setScr,
  sCurEx,
  onBackToChat,
  onReset,
}: AIConversationResultProps) {
  const [savedVocab, setSavedVocab] = useState(new Set());
  if (evalError || !evaluation)
    return (
      <div className="scr-wrap" style={{ textAlign: 'center', paddingTop: 40 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--error)', marginBottom: 20 }}>
          {evalError || 'Could not load evaluation'}
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button className="b bg" onClick={onBackToChat}>
            Back to Chat
          </button>
          <button className="b bp" onClick={onReset}>
            Start Over
          </button>
        </div>
      </div>
    );

  const ev = evaluation as ConvoEvaluation;
  const vocab = convoVocab as ConvoVocabItem[] | null;
  const curEx = sCurEx as ((ex: string) => void) | null;
  const scoreEmoji = ev.score >= 80 ? '🏆' : ev.score >= 55 ? '👏' : '📚';
  const scoreLabel =
    ev.score >= 80 ? 'Excellent!' : ev.score >= 55 ? 'Good Progress' : 'Keep Practicing';

  return (
    <div className="scr-wrap" data-testid="eval-result">
      <div
        style={{
          background: 'linear-gradient(145deg,#0c4a6e,#0e7490)',
          borderRadius: 22,
          padding: '24px 20px',
          marginBottom: 20,
          color: 'white',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 6 }}>{scoreEmoji}</div>
        <div
          style={{
            fontSize: 'var(--text-xs)',
            fontWeight: 700,
            opacity: 0.7,
            letterSpacing: '.1em',
            textTransform: 'uppercase',
            marginBottom: 4,
          }}
        >
          Conversation Score
        </div>
        <div style={{ fontSize: 72, fontWeight: 900, lineHeight: 1, marginBottom: 4 }}>
          {ev.score}
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, opacity: 0.9, marginBottom: 6 }}>
          {scoreLabel}
        </div>
        <div style={{ fontSize: 'var(--text-sm)', opacity: 0.7 }}>
          Level demonstrated: <strong style={{ opacity: 1 }}>{ev.level_demonstrated}</strong>
          {ev.level_demonstrated !== level && (
            <span style={{ opacity: 0.6 }}> (target: {level})</span>
          )}
        </div>
      </div>

      {ev.encouragement && (
        <div
          onClick={() => speak(ev.encouragement ?? '')}
          style={{
            background: 'var(--success-bg)',
            border: '1.5px solid var(--success-b)',
            borderRadius: 16,
            padding: '16px 18px',
            marginBottom: 16,
            cursor: 'pointer',
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
          }}
        >
          <span style={{ fontSize: 22, flexShrink: 0 }}>💬</span>
          <div>
            <div
              style={{
                fontSize: 'var(--text-base)',
                fontWeight: 700,
                color: 'var(--success)',
                fontFamily: "'Playfair Display',serif",
                fontStyle: 'italic',
                lineHeight: 1.55,
                marginBottom: 4,
              }}
            >
              "{ev.encouragement}"
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--success)', fontWeight: 600 }}>
              Tap to hear <span aria-hidden="true">🔊</span>
            </div>
          </div>
        </div>
      )}

      {(ev.strengths?.length ?? 0) > 0 && (
        <div
          style={{
            background: 'var(--card)',
            border: '1.5px solid var(--card-b)',
            borderRadius: 18,
            padding: 18,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 800,
              color: 'var(--success)',
              letterSpacing: '.08em',
              textTransform: 'uppercase',
              marginBottom: 12,
            }}
          >
            ✅ What You Did Well
          </div>
          {ev.strengths!.map((s: string, i: number) => (
            <div
              key={i}
              style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}
            >
              <span
                style={{ color: 'var(--success)', fontWeight: 900, flexShrink: 0, marginTop: 1 }}
              >
                •
              </span>
              <span
                style={{ fontSize: 'var(--text-base)', color: 'var(--heading)', lineHeight: 1.55 }}
              >
                {s}
              </span>
            </div>
          ))}
        </div>
      )}

      {(ev.mistakes?.length ?? 0) > 0 && (
        <div
          style={{
            background: 'var(--card)',
            border: '1.5px solid var(--card-b)',
            borderRadius: 18,
            padding: 18,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 800,
              color: 'var(--error)',
              letterSpacing: '.08em',
              textTransform: 'uppercase',
              marginBottom: 12,
            }}
          >
            📝 Corrections
          </div>
          {ev.mistakes!.map((m: ConvoMistake, i: number) => (
            <div
              key={i}
              style={{
                marginBottom: i < (ev.mistakes?.length ?? 0) - 1 ? 14 : 0,
                paddingBottom: i < (ev.mistakes?.length ?? 0) - 1 ? 14 : 0,
                borderBottom:
                  i < (ev.mistakes?.length ?? 0) - 1 ? '1px solid var(--card-b)' : 'none',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  marginBottom: 4,
                }}
              >
                <span
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--error)',
                    textDecoration: 'line-through',
                    fontWeight: 600,
                  }}
                >
                  {m.original}
                </span>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--subtext)' }}>→</span>
                <span
                  style={{ fontSize: 'var(--text-sm)', color: 'var(--success)', fontWeight: 800 }}
                >
                  {m.correction}
                </span>
              </div>
              <div
                style={{ fontSize: 'var(--text-sm)', color: 'var(--subtext)', lineHeight: 1.45 }}
              >
                {m.rule}
              </div>
            </div>
          ))}
        </div>
      )}

      {(ev.focus_areas?.length ?? 0) > 0 && (
        <div
          style={{
            background: 'var(--card)',
            border: '1.5px solid var(--card-b)',
            borderRadius: 18,
            padding: 18,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 800,
              color: 'var(--lavender)',
              letterSpacing: '.08em',
              textTransform: 'uppercase',
              marginBottom: 14,
            }}
          >
            🎯 Focus for the Next Few Days
          </div>
          {ev.focus_areas!.map((f: ConvoFocusArea, i: number) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 12,
                marginBottom: i < (ev.focus_areas?.length ?? 0) - 1 ? 16 : 0,
                paddingBottom: i < (ev.focus_areas?.length ?? 0) - 1 ? 16 : 0,
                borderBottom:
                  i < (ev.focus_areas?.length ?? 0) - 1 ? '1px solid var(--card-b)' : 'none',
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: 'rgba(124,58,237,.08)',
                  border: '1.5px solid rgba(124,58,237,.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 'var(--text-base)',
                  fontWeight: 900,
                  color: 'var(--lavender)',
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 'var(--text-base)',
                    fontWeight: 800,
                    color: 'var(--heading)',
                    marginBottom: 3,
                  }}
                >
                  {f.topic}
                </div>
                <div
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--subtext)',
                    lineHeight: 1.5,
                    marginBottom: 8,
                  }}
                >
                  {f.explanation}
                </div>
                {f.exercise && (EXERCISE_MAP as Record<string, string>)[f.exercise] && (
                  <button
                    onClick={() => {
                      setScr(f.exercise);
                      if (curEx && f.exercise) curEx(f.exercise);
                    }}
                    style={{
                      fontSize: 'var(--text-sm)',
                      fontWeight: 700,
                      padding: '6px 13px',
                      borderRadius: 10,
                      border: '1.5px solid var(--info)',
                      background: 'var(--info-bg)',
                      color: 'var(--info)',
                      cursor: 'pointer',
                      fontFamily: "'Outfit',sans-serif",
                      transition: 'all .15s',
                    }}
                  >
                    Practice now: {(EXERCISE_MAP as Record<string, string>)[f.exercise ?? '']} →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {ev.vocabulary_feedback && (
        <div
          style={{
            background: 'var(--warning-bg)',
            border: '1.5px solid var(--warning-b)',
            borderRadius: 14,
            padding: 15,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 800,
              color: 'var(--warning)',
              textTransform: 'uppercase',
              letterSpacing: '.08em',
              marginBottom: 6,
            }}
          >
            📚 Vocabulary
          </div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--body)', lineHeight: 1.6 }}>
            {ev.vocabulary_feedback}
          </div>
        </div>
      )}

      {weakAreasForSession.length > 0 && (
        <div
          className="c"
          style={{
            padding: '14px 16px',
            marginTop: 12,
            marginBottom: 14,
            background: 'var(--info-bg)',
            borderLeft: '4px solid var(--info)',
            borderRadius: 14,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--info)', marginBottom: 8 }}>
            🎯 Conversation focused on:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {weakAreasForSession.map((area: string, i: number) => (
              <span
                key={i}
                style={{
                  fontSize: 12,
                  padding: '3px 10px',
                  borderRadius: 20,
                  background: 'var(--card)',
                  border: '1px solid var(--info-b)',
                  color: 'var(--info)',
                  fontWeight: 600,
                }}
              >
                {area}
              </span>
            ))}
          </div>
          <div style={{ fontSize: 12, color: 'var(--subtext)', marginTop: 8 }}>
            The AI naturally wove these grammar patterns into the conversation to help you practice.
          </div>
        </div>
      )}

      {vocab && vocab.length > 0 && (
        <div
          style={{
            background: 'var(--card)',
            border: '1.5px solid var(--card-b)',
            borderRadius: 18,
            padding: 18,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 800,
              color: '#7c3aed',
              letterSpacing: '.08em',
              textTransform: 'uppercase',
              marginBottom: 12,
            }}
          >
            📚 Vocabulary from This Conversation
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--subtext)', marginBottom: 12 }}>
            These words appeared in your conversation. Save them to your journal for spaced
            repetition review.
          </div>
          {vocab.map((v: ConvoVocabItem, i: number) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 0',
                borderBottom: i < vocab.length - 1 ? '1px solid var(--card-b)' : 'none',
                gap: 12,
              }}
            >
              <div style={{ flex: 1 }}>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => speak(v.word || v.hr || '')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') speak(v.word || v.hr || '');
                  }}
                  style={{
                    fontWeight: 800,
                    color: 'var(--heading)',
                    cursor: 'pointer',
                    fontSize: 'var(--text-base)',
                  }}
                >
                  🔊 {v.word || v.hr}
                </span>
                <span
                  style={{ marginLeft: 10, color: 'var(--subtext)', fontSize: 'var(--text-sm)' }}
                >
                  {v.english || v.en}
                </span>
              </div>
              <button
                disabled={savedVocab.has(i)}
                onClick={() => {
                  if (typeof setJWords === 'function') {
                    const existing: unknown[] = JSON.parse(
                      localStorage.getItem('uJournal') || '[]',
                    );
                    setJWords([...existing, { hr: v.word || v.hr, en: v.english || v.en }]);
                  }
                  setSavedVocab((s) => new Set([...s, i]));
                }}
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  padding: '4px 12px',
                  borderRadius: 20,
                  border: '1.5px solid #7c3aed',
                  background: savedVocab.has(i) ? '#7c3aed' : 'transparent',
                  color: savedVocab.has(i) ? 'white' : '#7c3aed',
                  cursor: savedVocab.has(i) ? 'default' : 'pointer',
                  flexShrink: 0,
                  transition: 'all .15s',
                }}
              >
                {savedVocab.has(i) ? '✓ Saved' : '+ Journal'}
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 32 }}>
        <button className="b bg" onClick={onBackToChat}>
          ← Back to Chat
        </button>
        <button className="b bp" onClick={onReset}>
          New Conversation
        </button>
      </div>
    </div>
  );
}
