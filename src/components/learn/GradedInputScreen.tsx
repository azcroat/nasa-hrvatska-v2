import React, { useState, useRef, useCallback, useEffect } from 'react';
import { speak } from '../../data';
import { apiFetch } from '../../lib/apiFetch.js';
import { unlockAudio, ttsFetch } from '../../lib/audio.js';
import { getVoicePreference } from '../../lib/soundSettings.js';
import { getStoryCatalog, getStory } from '../../lib/contentClient';
import type { StoryCatalogEntry } from '../../types/content';
import { markQuest } from '../../lib/quests.js';
import { useStats } from '../../context/StatsContext';
import { useRecorder } from '../../hooks/useRecorder';
import { appendRecentError } from '../../lib/recentErrors';
import { recordStoryRead } from '../../lib/recentReads';
import MicPermissionDeniedExplainer from '../shared/MicPermissionDeniedExplainer';

// Map CEFR story level to TOPIC_ALLOWLIST entry for recent-error logging.
// Graded stories test vocabulary comprehension, so vocab-{level} is the
// closest semantic match. A1 buckets to vocab-a2 since the allowlist has
// no vocab-a1 entry.
function _levelToTopic(level: string): string {
  if (level === 'B2' || level === 'C1') return 'vocab-b2';
  if (level === 'B1') return 'vocab-b1';
  return 'vocab-a2';
}

const LEVELS = ['All', 'A1', 'A2', 'B1'];
const LEVEL_COLOR: Record<string, string> = { A1: '#166534', A2: '#1e40af', B1: '#92400e' };
const LEVEL_BG: Record<string, string> = { A1: '#dcfce7', A2: '#dbeafe', B1: '#fef3c7' };

// ── Types ──────────────────────────────────────────────────────────────────────
interface VocabItem {
  hr: string;
  en: string;
  ex?: string;
}
interface Paragraph {
  hr: string;
  en: string;
}
interface QuizItem {
  q: string;
  qEn?: string;
  opts: string[];
  correct: number;
}
interface GradedStory {
  id: string;
  level: string;
  icon: string;
  title: string;
  titleEn: string;
  duration: number;
  focus: string;
  intro: string;
  vocabulary: VocabItem[];
  paragraphs: Paragraph[];
  quiz: QuizItem[];
}

const COMPLETED_KEY = 'nh_graded_done';
function getDone() {
  try {
    return JSON.parse(localStorage.getItem(COMPLETED_KEY) || '[]');
  } catch {
    return [];
  }
}
function markDone(id: string) {
  const done = getDone();
  if (!done.includes(id)) {
    try {
      localStorage.setItem(COMPLETED_KEY, JSON.stringify([...done, id]));
    } catch {}
  }
}

// ─── Back button ─────────────────────────────────────────────────────────────
const BackBtn = ({ onClick }: { onClick: () => void }) => (
  <button className="b bg" style={{ marginBottom: 16, fontSize: 13 }} onClick={onClick}>
    ← Back
  </button>
);

// ─── Level badge ──────────────────────────────────────────────────────────────
const LevelBadge = ({ level }: { level: string }) => (
  <span
    style={{
      background: LEVEL_BG[level] || '#f5f5f4',
      color: LEVEL_COLOR[level] || '#44403c',
      fontSize: 10,
      fontWeight: 800,
      padding: '2px 8px',
      borderRadius: 20,
      letterSpacing: '.05em',
    }}
  >
    {level}
  </span>
);

// ─── TTS audio helper ─────────────────────────────────────────────────────────
async function playTTS(text: string, audioRef: React.MutableRefObject<HTMLAudioElement | null>) {
  unlockAudio(); // must be synchronous before any await — iOS activation
  // Stop any previous audio
  if (audioRef.current) {
    audioRef.current.pause();
    audioRef.current = null;
  }

  // Try the app's TTS API first (native-safe), fall back to Web Speech
  try {
    const res = await ttsFetch({ text, voice: getVoicePreference() });
    if (res && res.ok) {
      const blob = await res.blob();
      // Use a base64 data URL — blob: URLs fail silently on some Android OEM WebViews
      const url = await new Promise<string>((resolve) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.readAsDataURL(blob);
      });
      const a = new Audio(url);
      a.volume = 1.0; // required: low volume blocks activation on some WebViews
      audioRef.current = a;
      a.play().catch(() => speak(text));
      return;
    }
  } catch {}
  speak(text);
}

// ─── List view ────────────────────────────────────────────────────────────────
function StoryList({ onSelect, goBack }: { onSelect: (id: string) => void; goBack: () => void }) {
  const [filter, setFilter] = useState('All');
  const [catalog, setCatalog] = useState<StoryCatalogEntry[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const done = getDone();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cat = await getStoryCatalog();
        if (!cancelled) setCatalog(cat);
      } catch {
        if (!cancelled) setLoadError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loadError) {
    return (
      <div className="scr-wrap" data-testid="graded-input-screen-error">
        <BackBtn onClick={goBack} />
        <div style={{ padding: 20 }}>
          Couldn&#39;t load stories. Check your connection and retry.
        </div>
      </div>
    );
  }

  if (!catalog) {
    return (
      <div className="scr-wrap" data-testid="graded-input-screen-loading">
        <BackBtn onClick={goBack} />
        <div style={{ padding: 20 }}>Loading stories…</div>
      </div>
    );
  }

  const visible = catalog.filter((s) => filter === 'All' || s.level === filter);

  return (
    <div className="scr-wrap">
      <BackBtn onClick={goBack} />

      {/* Hero */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0e7490, #0369a1)',
          borderRadius: 18,
          padding: '20px 20px',
          marginBottom: 20,
          color: 'white',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 44 }}>📖</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 4 }}>Graded Stories</div>
            <div style={{ fontSize: 12, opacity: 0.85, lineHeight: 1.5 }}>
              Real Croatian texts at your level — read, listen, and quiz yourself
            </div>
          </div>
        </div>
      </div>

      {/* Level filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {LEVELS.map((l) => (
          <button
            key={l}
            onClick={() => setFilter(l)}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 700,
              background: filter === l ? '#0e7490' : 'var(--card)',
              color: filter === l ? 'white' : 'var(--subtext)',
              boxShadow: filter === l ? '0 2px 8px rgba(14,116,144,.3)' : 'none',
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Story cards */}
      {visible.map((story) => {
        const isDone = done.includes(story.id);
        return (
          <div
            key={story.id}
            data-testid={'graded-story-card-' + story.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(story.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(story.id);
              }
            }}
            style={{
              background: 'var(--card)',
              borderRadius: 16,
              padding: '16px 18px',
              marginBottom: 12,
              cursor: 'pointer',
              border: '1px solid var(--card-b)',
              borderLeft: `4px solid ${LEVEL_COLOR[story.level] || '#0e7490'}`,
              boxShadow: '0 2px 8px rgba(0,0,0,.05)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ fontSize: 32 }}>{story.icon}</div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <LevelBadge level={story.level} />
                  <span style={{ fontSize: 11, color: 'var(--subtext)' }}>
                    {story.duration} min
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: 'var(--heading)',
                    marginBottom: 2,
                  }}
                >
                  {story.title}
                </div>
                <div style={{ fontSize: 12, color: 'var(--subtext)' }}>{story.titleEn}</div>
                <div style={{ fontSize: 11, color: 'var(--info)', marginTop: 4 }}>
                  {story.focus}
                </div>
              </div>
            </div>
            <div style={{ fontSize: 20, flexShrink: 0 }}>{isDone ? '✅' : '▶️'}</div>
          </div>
        );
      })}

      {visible.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--subtext)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>No stories at this level yet</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Try A1 or A2 to get started</div>
        </div>
      )}
    </div>
  );
}

// ─── Pronunciation assessment helper ─────────────────────────────────────────
async function assessPronunciation(audioBlob: Blob, referenceText: string) {
  const arrayBuffer = await audioBlob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i] ?? 0);
  const base64 = btoa(binary);

  const res = await apiFetch('/api/pronunciation-assess', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ audio: base64, text: referenceText, locale: 'hr-HR' }),
  });
  if (!res.ok) throw new Error('Assessment failed');
  return res.json();
}

// ─── Reader view ──────────────────────────────────────────────────────────────
interface AssessResult {
  overall: number;
  accuracy: number;
  fluency: number;
  word_scores?: { word: string; score: number }[];
}
// Exported for unit tests — the mic flow + per-paragraph assessment lives
// here, not in the outer GradedInputScreen which only handles list/reader/quiz
// view routing.
export function StoryReader({
  story,
  onStartQuiz,
  goBack,
}: {
  story: GradedStory;
  onStartQuiz: () => void;
  goBack: () => void;
}) {
  const [showEn, setShowEn] = useState(false);
  const [showVocab, setShowVocab] = useState(false);
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);
  const [recordingIdx, setRecordingIdx] = useState<number | null>(null);
  const [assessResults, setAssessResults] = useState<Record<number, AssessResult>>({});
  const [assessError, setAssessError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Shared mic recorder. Per-paragraph dispatch tracked via recordingIdx +
  // the paraText we captured at startRecording time (paragraphTextRef).
  const recorder = useRecorder();
  const paragraphTextRef = useRef<string>('');

  // When recorder reaches 'done', call assessPronunciation with the captured
  // blob + the paragraph text we stored when recording started.
  useEffect(() => {
    if (recorder.state !== 'done' || !recorder.audioBlob || recordingIdx === null) return;
    const paraIdx = recordingIdx;
    const paraText = paragraphTextRef.current;
    const blob = recorder.audioBlob;
    let cancelled = false;
    (async () => {
      try {
        const result = await assessPronunciation(blob, paraText);
        if (!cancelled) setAssessResults((r) => ({ ...r, [paraIdx]: result }));
      } catch (_e) {
        if (!cancelled) {
          setAssessError('Assessment unavailable — check your connection and try again.');
        }
      }
      if (!cancelled) {
        setRecordingIdx(null);
        recorder.reset();
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recorder.state]);

  const handlePlay = useCallback(async (text: string, idx: number) => {
    setPlayingIdx(idx);
    await playTTS(text, audioRef);
    setPlayingIdx(null);
  }, []);

  const startRecording = useCallback(
    (paraIdx: number, paraText: string) => {
      setAssessError(null);
      paragraphTextRef.current = paraText;
      setRecordingIdx(paraIdx);
      // No countdown — match existing per-paragraph instant-record UX.
      recorder.startRecording({ countdown: 0 });
    },
    [recorder],
  );

  const stopRecording = useCallback(() => {
    recorder.stopRecording();
  }, [recorder]);

  return (
    <div className="scr-wrap">
      <BackBtn onClick={goBack} />

      {/* Story header */}
      <div
        style={{
          background: `linear-gradient(135deg, ${LEVEL_COLOR[story.level]}dd, ${LEVEL_COLOR[story.level]})`,
          borderRadius: 18,
          padding: '20px 20px',
          marginBottom: 20,
          color: 'white',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 44 }}>{story.icon}</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 4 }}>{story.title}</div>
            <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 6 }}>{story.titleEn}</div>
            <div style={{ fontSize: 11, opacity: 0.8, lineHeight: 1.5 }}>{story.focus}</div>
          </div>
        </div>
      </div>

      {/* Intro */}
      <div
        style={{
          background: 'var(--info-bg)',
          border: '1px solid var(--info-b)',
          borderRadius: 12,
          padding: '12px 16px',
          marginBottom: 20,
          fontSize: 13,
          color: 'var(--info)',
          lineHeight: 1.6,
        }}
      >
        <strong>💡 </strong>
        {story.intro}
      </div>

      {/* Toggle controls */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          onClick={() => setShowEn((v) => !v)}
          style={{
            padding: '6px 14px',
            borderRadius: 20,
            border: 'none',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 700,
            background: showEn ? '#0e7490' : 'var(--card)',
            color: showEn ? 'white' : 'var(--subtext)',
          }}
        >
          🇬🇧 {showEn ? 'Hide' : 'Show'} English
        </button>
        <button
          onClick={() => setShowVocab((v) => !v)}
          style={{
            padding: '6px 14px',
            borderRadius: 20,
            border: 'none',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 700,
            background: showVocab ? '#7c3aed' : 'var(--card)',
            color: showVocab ? 'white' : 'var(--subtext)',
          }}
        >
          📚 {showVocab ? 'Hide' : 'Show'} Vocabulary
        </button>
      </div>

      {/* Vocabulary panel */}
      {showVocab && (
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--card-b)',
            borderRadius: 14,
            padding: '12px 16px',
            marginBottom: 20,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--heading)', marginBottom: 12 }}>
            Key Vocabulary
          </div>
          {story.vocabulary.map((v, i) => (
            <div
              key={i}
              role="button"
              tabIndex={0}
              onClick={() => speak(v.hr)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  speak(v.hr);
                }
              }}
              aria-label={`Hear pronunciation of ${v.hr}`}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                padding: '10px 0',
                borderBottom: i < story.vocabulary.length - 1 ? '1px solid var(--card-b)' : 'none',
                cursor: 'pointer',
                gap: 12,
              }}
            >
              <div>
                <span style={{ fontWeight: 700, color: 'var(--heading)' }}>🔊 {v.hr}</span>
                <div style={{ fontSize: 11, color: 'var(--subtext)', marginTop: 3 }}>{v.ex}</div>
              </div>
              <span style={{ fontSize: 13, color: 'var(--subtext)', flexShrink: 0 }}>{v.en}</span>
            </div>
          ))}
        </div>
      )}

      {/* Permission-denied explainer takes priority over generic assess error */}
      {recorder.state === 'denied' && (
        <MicPermissionDeniedExplainer
          onRetry={() => {
            recorder.reset();
            setRecordingIdx(null);
          }}
        />
      )}

      {/* Generic assessment error (network, API, mic-unsupported) */}
      {assessError && recorder.state !== 'denied' && (
        <div
          style={{
            background: '#fee2e2',
            border: '1px solid #fca5a5',
            borderRadius: 10,
            padding: '10px 14px',
            marginBottom: 12,
            fontSize: 12,
            color: '#b91c1c',
          }}
        >
          {assessError}
        </div>
      )}

      {/* Paragraphs */}
      {story.paragraphs.map((para, i) => {
        const result = assessResults[i];
        return (
          <div
            key={i}
            style={{
              background: 'var(--card)',
              border: '1px solid var(--card-b)',
              borderRadius: 14,
              padding: '16px 18px',
              marginBottom: 12,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 8,
              }}
            >
              <p
                style={{
                  fontSize: 16,
                  lineHeight: 1.8,
                  color: 'var(--heading)',
                  fontFamily: "'Playfair Display', Georgia, serif",
                  margin: 0,
                  flex: 1,
                  whiteSpace: 'pre-line',
                }}
              >
                {para.hr}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                <button
                  onClick={() => handlePlay(para.hr, i)}
                  aria-label="Listen to paragraph"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 50,
                    border: 'none',
                    background: playingIdx === i ? '#0e7490' : 'var(--info-bg)',
                    color: playingIdx === i ? 'white' : '#0e7490',
                    fontSize: 16,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {playingIdx === i ? '⏸' : '🔊'}
                </button>
                <button
                  onClick={() =>
                    recordingIdx === i ? stopRecording() : startRecording(i, para.hr)
                  }
                  aria-label={recordingIdx === i ? 'Stop recording' : 'Record your pronunciation'}
                  title={recordingIdx === i ? 'Stop recording' : 'Assess your pronunciation'}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 50,
                    border: 'none',
                    background:
                      recordingIdx === i ? '#dc2626' : result ? '#059669' : 'var(--card-b)',
                    color: recordingIdx === i ? 'white' : result ? 'white' : 'var(--subtext)',
                    fontSize: 16,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: recordingIdx === i ? 'pulse 1s infinite' : 'none',
                  }}
                >
                  {recordingIdx === i ? '⏹' : result ? '✓' : '🎤'}
                </button>
              </div>
            </div>

            {showEn && (
              <p
                style={{
                  fontSize: 13,
                  color: 'var(--subtext)',
                  lineHeight: 1.6,
                  marginTop: 10,
                  paddingTop: 10,
                  borderTop: '1px dashed var(--card-b)',
                  margin: '10px 0 0',
                  fontStyle: 'italic',
                  whiteSpace: 'pre-line',
                }}
              >
                {para.en}
              </p>
            )}

            {/* Pronunciation score card */}
            {result && (
              <div
                style={{
                  marginTop: 12,
                  paddingTop: 12,
                  borderTop: '1px solid var(--card-b)',
                }}
              >
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
                  {[
                    { label: 'Overall', score: result.overall },
                    { label: 'Accuracy', score: result.accuracy },
                    { label: 'Fluency', score: result.fluency },
                  ].map(({ label, score }) => (
                    <div key={label} style={{ textAlign: 'center', minWidth: 60 }}>
                      <div
                        style={{
                          fontSize: 20,
                          fontWeight: 900,
                          color: score >= 80 ? '#059669' : score >= 55 ? '#d97706' : '#dc2626',
                        }}
                      >
                        {score}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--subtext)', fontWeight: 700 }}>
                        {label}
                      </div>
                    </div>
                  ))}
                </div>
                {result.word_scores && result.word_scores.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {result.word_scores.map((w, wi) => (
                      <span
                        key={wi}
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 8,
                          background:
                            w.score >= 80 ? '#dcfce7' : w.score >= 55 ? '#fef3c7' : '#fee2e2',
                          color: w.score >= 80 ? '#15803d' : w.score >= 55 ? '#92400e' : '#b91c1c',
                          border: `1px solid ${w.score >= 80 ? '#86efac' : w.score >= 55 ? '#fde68a' : '#fca5a5'}`,
                        }}
                      >
                        {w.word}
                      </span>
                    ))}
                  </div>
                )}
                <div style={{ fontSize: 11, color: 'var(--subtext)', marginTop: 6 }}>
                  Green = good · Yellow = needs work · Red = practice more
                </div>
              </div>
            )}
          </div>
        );
      })}

      <button
        data-testid="graded-story-start-quiz"
        className="b bp"
        style={{ width: '100%', marginTop: 8 }}
        onClick={onStartQuiz}
      >
        Comprehension Quiz →
      </button>
    </div>
  );
}

// ─── Quiz view ────────────────────────────────────────────────────────────────
function StoryQuiz({
  story,
  onComplete,
  goBack,
}: {
  story: GradedStory;
  onComplete: (xp: number) => void;
  goBack: () => void;
}) {
  const [qi, setQi] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState(-1);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const resultFired = useRef(false);

  // Guard: validate quiz data before rendering
  const q: QuizItem | undefined = story.quiz[qi];
  const isLast = qi === story.quiz.length - 1;
  const quizDataError =
    !Array.isArray(story.quiz) ||
    story.quiz.length === 0 ||
    !q ||
    !Array.isArray(q.opts) ||
    q.opts.length === 0 ||
    q.correct == null;

  if (quizDataError) {
    return (
      <div className="scr-wrap">
        <BackBtn onClick={goBack} />
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--card-b)',
            borderRadius: 16,
            padding: '32px 20px',
            textAlign: 'center',
            marginTop: 20,
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--heading)', marginBottom: 8 }}>
            Quiz unavailable for this story
          </div>
          <div style={{ fontSize: 13, color: 'var(--subtext)', lineHeight: 1.6 }}>
            The quiz content for this story couldn&#39;t be loaded. Try another story or come back
            later.
          </div>
          <button className="b bg" style={{ marginTop: 20 }} onClick={goBack}>
            ← Back to Story
          </button>
        </div>
      </div>
    );
  }

  function choose(idx: number) {
    if (answered || !q) return;
    setSelected(idx);
    setAnswered(true);
    if (idx === q.correct) {
      setScore((s) => s + 1);
    } else {
      // Log wrong answer so AI feedback endpoints can reference recent mistakes.
      appendRecentError({
        topic: _levelToTopic(story.level),
        prompt: q.q ?? '',
        userAnswer: q.opts[idx] ?? '',
        correctAnswer: q.opts[q.correct] ?? '',
      });
    }
  }

  function next() {
    if (isLast) {
      if (resultFired.current) return;
      resultFired.current = true;
      setDone(true);
    } else {
      setQi((i) => i + 1);
      setAnswered(false);
      setSelected(-1);
    }
  }

  if (done) {
    const xp = Math.round((score / story.quiz.length) * 25) + 10;
    return (
      <div className="scr-wrap" style={{ textAlign: 'center' }}>
        <BackBtn onClick={goBack} />
        <div style={{ paddingTop: 40 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>
            {score === story.quiz.length
              ? '🌟'
              : score >= Math.ceil(story.quiz.length / 2)
                ? '📖'
                : '💪'}
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--heading)', marginBottom: 8 }}>
            {score}/{story.quiz.length} correct
          </div>
          <div style={{ fontSize: 14, color: 'var(--subtext)', marginBottom: 24 }}>
            {score === story.quiz.length
              ? 'Perfect! You understood everything!'
              : score >= Math.ceil(story.quiz.length / 2)
                ? 'Good work! Keep reading to improve.'
                : 'Try reading the story again and focus on the vocabulary.'}
          </div>
          <div
            style={{
              background: 'var(--info-bg)',
              border: '1px solid var(--info-b)',
              borderRadius: 14,
              padding: '14px 20px',
              marginBottom: 24,
              display: 'inline-block',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--info)' }}>
              +{xp} XP earned
            </div>
          </div>
          <div>
            <button
              className="b bp"
              style={{ width: '100%', marginBottom: 10 }}
              onClick={() => onComplete(xp)}
            >
              Continue →
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!q) return null;

  return (
    <div className="scr-wrap">
      <BackBtn onClick={goBack} />

      {/* Progress */}
      <div
        style={{
          background: 'var(--card-b)',
          borderRadius: 6,
          height: 6,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            background: LEVEL_COLOR[story.level] || '#0e7490',
            height: '100%',
            borderRadius: 6,
            width: `${((qi + 1) / story.quiz.length) * 100}%`,
            transition: 'width .3s',
          }}
        />
      </div>

      <div style={{ fontSize: 12, color: 'var(--subtext)', marginBottom: 16, fontWeight: 700 }}>
        Question {qi + 1} of {story.quiz.length}
      </div>

      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--card-b)',
          borderRadius: 16,
          padding: '20px 18px',
          marginBottom: 16,
        }}
      >
        <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--heading)', marginBottom: 4 }}>
          {q.q}
        </p>
        {q.qEn && (
          <p
            style={{
              fontSize: 13,
              color: 'var(--subtext)',
              fontStyle: 'italic',
              margin: '4px 0 16px',
            }}
          >
            {q.qEn}
          </p>
        )}
        {q.opts.map((opt, i) => {
          let bg = 'var(--card)',
            col = 'var(--heading)',
            border = '1px solid var(--card-b)';
          if (answered) {
            if (i === q.correct) {
              bg = '#dcfce7';
              col = '#15803d';
              border = '1px solid #86efac';
            } else if (i === selected) {
              bg = '#fee2e2';
              col = '#b91c1c';
              border = '1px solid #fca5a5';
            }
          }
          return (
            <button
              key={i}
              data-testid={'graded-story-quiz-option-' + i}
              onClick={() => choose(i)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '12px 14px',
                marginBottom: 8,
                borderRadius: 12,
                border,
                background: bg,
                color: col,
                fontSize: 14,
                fontWeight: answered && i === q.correct ? 700 : 500,
                cursor: answered ? 'default' : 'pointer',
                transition: 'background .2s, border-color .2s',
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {answered && (
        <button className="b bp" style={{ width: '100%' }} onClick={next}>
          {isLast ? 'See Results →' : 'Next Question →'}
        </button>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function GradedInputScreen({
  goBack,
  award,
  initialStoryId,
}: {
  goBack: () => void;
  award?: (xp: number, celebrate?: boolean, activityType?: string) => void;
  initialStoryId?: string;
}) {
  const [view, setView] = useState<'list' | 'reader' | 'quiz'>('list');
  const [story, setStory] = useState<GradedStory | null>(null);
  const [loadingStory, setLoadingStory] = useState<boolean>(!!initialStoryId);
  const completeFired = useRef(false);
  const { stats, setStats, writeDelta } = useStats();

  // SP11: when launched with initialStoryId, fetch the full body via
  // getStory() and open reader view. Unknown IDs fall through to list.
  useEffect(() => {
    if (!initialStoryId) return;
    let cancelled = false;
    (async () => {
      try {
        const full = await getStory(initialStoryId);
        if (cancelled) return;
        setStory(full as unknown as GradedStory);
        setView('reader');
      } catch {
        if (!cancelled) setView('list');
      } finally {
        if (!cancelled) setLoadingStory(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialStoryId]);

  async function selectStory(id: string) {
    setLoadingStory(true);
    try {
      const full = await getStory(id);
      setStory(full as unknown as GradedStory);
      setView('reader');
    } catch {
      // fall through silently; user remains on list view
    } finally {
      setLoadingStory(false);
    }
  }

  function startQuiz() {
    setView('quiz');
  }

  function complete(xp: number) {
    if (completeFired.current) return;
    completeFired.current = true;
    if (story) recordStoryRead(story.id); // SP7
    if (story) markDone(story.id);
    if (typeof award === 'function') award(xp, false, 'reading');
    markQuest('reading');
    // Contract: update vs badge + sync lc counter — guarded to fire once per story
    if (!stats.vs.includes('story-comprehension')) {
      setStats((prev) => ({ ...prev, vs: [...prev.vs, 'story-comprehension'] }));
    }
    writeDelta({ lc: 1, vs: ['story-comprehension'] });
    goBack();
  }

  if (loadingStory && !story) {
    return (
      <div className="scr-wrap" data-testid="graded-input-screen-loading-story">
        <BackBtn
          onClick={() => {
            setView('list');
            setLoadingStory(false);
          }}
        />
        <div style={{ padding: 20 }}>Loading story…</div>
      </div>
    );
  }

  if (view === 'reader' && story) {
    return <StoryReader story={story} onStartQuiz={startQuiz} goBack={() => setView('list')} />;
  }

  if (view === 'quiz' && story) {
    return <StoryQuiz story={story} onComplete={complete} goBack={() => setView('reader')} />;
  }

  return <StoryList onSelect={selectStory} goBack={goBack} />;
}
