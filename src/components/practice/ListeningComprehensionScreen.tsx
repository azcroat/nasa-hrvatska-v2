import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { stopAudio } from '../../lib/audio.ts';
import { getStoryCatalog } from '../../lib/contentClient';
import type { StoryCatalogEntry } from '../../types/content';
import AudioControls from './listening/AudioControls';
import TranscriptToggle from './listening/TranscriptToggle';
import WeakWordsPanel from './listening/WeakWordsPanel';
import BonusStoryCard from './listening/BonusStoryCard';
import GradedStoryModal from './listening/GradedStoryModal';
import { EXERCISES } from './listening/exercises';

// ── Storage key ────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'nh_listen_comp_v2';

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveProgress(prog: any) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prog));
  } catch {}
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function shuffle(arr: any[]) {
  const b = [...arr];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

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

export default function ListeningComprehensionScreen({
  goBack,
  award,
}: {
  goBack: () => void;
  award?: (xp: number, celebrate?: boolean, activityType?: string) => void;
}) {
  useApp();

  // Navigation state
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedSet, setSelectedSet] = useState<any | null>(null);
  const [selectedSetIdx, setSelectedSetIdx] = useState<number | null>(null);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [shuffledQuestions, setShuffledQuestions] = useState<any[] | null>(null);
  const [missedQuestions, setMissedQuestions] = useState<any[]>([]);

  // Bonus story modal
  const [bonusStory, setBonusStory] = useState<any | null>(null);

  // Story catalog (async-loaded for BonusStoryCard)
  const [storyCatalog, setStoryCatalog] = useState<StoryCatalogEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cat = await getStoryCatalog();
        if (!cancelled) setStoryCatalog(cat);
      } catch {
        // BonusStoryCard renders null when catalog is empty — fine
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist progress
  const [progress, setProgress] = useState<any>(() => loadProgress());

  // Computed: level completion
  const levelIds = Object.keys(EXERCISES);
  const levelData = selectedLevel
    ? ((EXERCISES as Record<string, typeof EXERCISES.A1>)[selectedLevel] ?? null)
    : null;

  function getCompletedQuestions(levelId: string, setIdx: number) {
    const lvl = (progress as any)[levelId] || {};
    const set = lvl[setIdx] || {};
    return Object.keys(set).filter((k) => set[k] === true).length;
  }

  function getTotalQuestionsForSet(levelId: string, setIdx: number) {
    return (EXERCISES as Record<string, typeof EXERCISES.A1>)[levelId]!.sets[setIdx]!.questions
      .length;
  }

  function isSetComplete(levelId: string, setIdx: number) {
    const total = getTotalQuestionsForSet(levelId, setIdx);
    return getCompletedQuestions(levelId, setIdx) >= total;
  }

  function isLevelComplete(levelId: string) {
    const sets = (EXERCISES as Record<string, typeof EXERCISES.A1>)[levelId]!.sets;
    return sets.every((_, si) => isSetComplete(levelId, si));
  }

  function getLevelCompletionCount(levelId: string) {
    const sets = (EXERCISES as Record<string, typeof EXERCISES.A1>)[levelId]!.sets;
    return sets.reduce((sum, _, si) => sum + getCompletedQuestions(levelId, si), 0);
  }

  function getLevelTotalCount(levelId: string) {
    const sets = (EXERCISES as Record<string, typeof EXERCISES.A1>)[levelId]!.sets;
    return sets.reduce((sum, _, si) => sum + getTotalQuestionsForSet(levelId, si), 0);
  }

  function markQuestionDone(levelId: string, setIdx: number, qIdx: number) {
    setProgress((prev: any) => {
      const next = {
        ...prev,
        [levelId]: {
          ...(prev[levelId] || {}),
          [setIdx]: {
            ...((prev[levelId] || {})[setIdx] || {}),
            [qIdx]: true,
          },
        },
      };
      saveProgress(next);
      return next;
    });
  }

  function startSet(setData: any, setIdx: number) {
    // Build ordered questions preserving original indices for progress tracking
    const indexed = setData.questions.map((q: any, i: number) => ({ ...q, _origIdx: i }));
    const shuffled = shuffle(indexed).map((q) => ({ ...q, opts: shuffle(q.opts) }));
    setShuffledQuestions(shuffled);
    setSelectedSet(setData);
    setSelectedSetIdx(setIdx);
    setQuestionIdx(0);
    setChosen(null);
    setScore(0);
    setFinished(false);
    setMissedQuestions([]);
  }

  function handleAnswer(opt: string) {
    if (chosen !== null) return;
    setChosen(opt);
    const q = shuffledQuestions![questionIdx]!;
    const correct = opt === q.en;
    if (correct) {
      setScore((s) => s + 1);
    } else {
      setMissedQuestions((prev) => [...prev, { hr: q.hr, en: q.en }]);
    }
    // Mark this question as done in progress
    markQuestionDone(selectedLevel!, selectedSetIdx!, q._origIdx);
  }

  function next() {
    const qs = shuffledQuestions!;
    if (questionIdx + 1 >= qs.length) {
      setFinished(true);
      // `score` already includes the last answer (handleAnswer incremented it before Next was clickable).
      const finalScore = score;
      const xp = Math.round((finalScore / qs.length) * 15) + 5;
      if (award) award(xp, false, 'listening');
    } else {
      setQuestionIdx((i) => i + 1);
      setChosen(null);
    }
  }

  function reset() {
    stopAudio();
    setSelectedSet(null);
    setSelectedSetIdx(null);
    setShuffledQuestions(null);
    setChosen(null);
    setScore(0);
    setFinished(false);
    setQuestionIdx(0);
    setMissedQuestions([]);
  }

  function handleAddToFlashcards(words: any[]) {
    // Dispatch event to app-level handler if available
    try {
      window.dispatchEvent(
        new CustomEvent('nh:add-weak-words', {
          detail: { words, source: 'listening-comprehension', level: selectedLevel },
        }),
      );
    } catch {}
  }

  // ── Finished screen ──────────────────────────────────────────────────────
  if (finished && shuffledQuestions) {
    const total = shuffledQuestions.length;
    const displayScore = score;
    const pct = Math.round((displayScore / total) * 100);
    const ld = (EXERCISES as Record<string, typeof EXERCISES.A1>)[selectedLevel!]!;
    const levelNowComplete = isLevelComplete(selectedLevel!);

    return (
      <div className="scr-wrap">
        <div style={{ textAlign: 'center', padding: '40px 20px 24px' }}>
          <div style={{ fontSize: 64 }}>{pct >= 80 ? '🌟' : pct >= 60 ? '🎉' : '💪'}</div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 900,
              color: 'var(--heading)',
              fontFamily: "'Playfair Display',serif",
              marginTop: 12,
            }}
          >
            {pct >= 80 ? 'Odlično!' : pct >= 60 ? 'Dobro!' : 'Vježbaj dalje!'}
          </div>
          <div style={{ fontSize: 14, color: 'var(--subtext)', marginTop: 8 }}>
            {displayScore}/{total} correct · {pct}%
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#fbbf24', marginTop: 8 }}>
            +{Math.round((pct / 100) * 15) + 5} XP
          </div>

          {pct < 60 && (
            <div
              style={{
                marginTop: 16,
                padding: '12px 16px',
                background: 'rgba(245,158,11,.08)',
                border: '1px solid rgba(245,158,11,.25)',
                borderRadius: 12,
                fontSize: 13,
                color: '#92400e',
                fontWeight: 600,
              }}
            >
              Try listening with headphones — catching every syllable takes practice!
            </div>
          )}

          {levelNowComplete && (
            <div
              style={{
                marginTop: 16,
                padding: '14px 16px',
                background: 'linear-gradient(135deg,rgba(16,163,74,.12),rgba(16,163,74,.04))',
                border: '1.5px solid rgba(16,163,74,.3)',
                borderRadius: 14,
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 6 }}>🏆</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#166534' }}>
                {selectedLevel} Level Complete!
              </div>
              <div style={{ fontSize: 13, color: '#166534', opacity: 0.8, marginTop: 4 }}>
                You have finished all exercises at this level.
              </div>
            </div>
          )}
        </div>

        <WeakWordsPanel
          missedQuestions={missedQuestions}
          accentColor={ld.color}
          onAddToFlashcards={handleAddToFlashcards}
        />

        <BonusStoryCard
          catalog={storyCatalog}
          levelId={selectedLevel!}
          accentColor={ld.color}
          onOpen={setBonusStory}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '20px 0 0' }}>
          <button className="b bp" onClick={reset} style={{ width: '100%' }}>
            Try another set
          </button>
          <button
            className="b bg"
            onClick={() => {
              reset();
              setSelectedLevel(null);
            }}
            style={{ width: '100%' }}
          >
            ← Choose a different level
          </button>
        </div>

        {bonusStory && <GradedStoryModal story={bonusStory} onClose={() => setBonusStory(null)} />}
      </div>
    );
  }

  // ── Active question ──────────────────────────────────────────────────────
  if (selectedSet && shuffledQuestions) {
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

  // ── Set selection ────────────────────────────────────────────────────────
  if (selectedLevel && levelData) {
    const completed = getLevelCompletionCount(selectedLevel);
    const totalQ = getLevelTotalCount(selectedLevel);
    const pct = totalQ > 0 ? Math.round((completed / totalQ) * 100) : 0;
    const lvlComplete = isLevelComplete(selectedLevel);

    return (
      <div className="scr-wrap" style={{ paddingBottom: 24 }}>
        <button
          onClick={() => setSelectedLevel(null)}
          style={{
            background: 'var(--bar-bg)',
            border: 'none',
            borderRadius: 10,
            padding: '8px 14px',
            color: 'var(--subtext)',
            cursor: 'pointer',
            marginBottom: 16,
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          ← Levels
        </button>

        <div
          style={{
            background: levelData.headerBg,
            borderRadius: 16,
            padding: '16px 18px',
            marginBottom: 8,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 900,
              color: 'rgba(255,255,255,.55)',
              textTransform: 'uppercase',
              letterSpacing: '.12em',
              marginBottom: 4,
            }}
          >
            {selectedLevel} Comprehension
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: 'white', marginBottom: 4 }}>
            {levelData.label}
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', marginBottom: 12 }}>
            {levelData.desc}
          </div>

          {/* Level progress bar */}
          <div
            style={{
              height: 6,
              background: 'rgba(255,255,255,.2)',
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: pct + '%',
                height: '100%',
                background: 'white',
                borderRadius: 3,
                transition: 'width .4s ease',
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.7)', fontWeight: 600 }}>
              {completed}/{totalQ} questions completed
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.9)', fontWeight: 800 }}>
              {pct}%
            </div>
          </div>
        </div>

        {lvlComplete && (
          <div
            style={{
              margin: '0 0 16px',
              padding: '12px 16px',
              background: 'rgba(16,163,74,.08)',
              border: '1.5px solid rgba(16,163,74,.25)',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div style={{ fontSize: 24 }}>🏆</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#166534' }}>Level complete!</div>
              <div style={{ fontSize: 12, color: '#166534', opacity: 0.8 }}>
                All sets finished. Review anytime.
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {levelData.sets.map((set, si) => {
            const setDone = getCompletedQuestions(selectedLevel, si);
            const setTotal = getTotalQuestionsForSet(selectedLevel, si);
            const complete = setDone >= setTotal;
            return (
              <button
                key={set.title}
                onClick={() => startSet(set, si)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '16px 18px',
                  borderRadius: 16,
                  background: levelData.bg,
                  border: `1.5px solid ${complete ? levelData.color : levelData.border}`,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: "'Outfit',sans-serif",
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{ fontSize: 32, flexShrink: 0 }}>{set.icon}</div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 900,
                      color: 'var(--heading)',
                      marginBottom: 3,
                    }}
                  >
                    {set.title}
                    {complete && (
                      <span style={{ marginLeft: 8, fontSize: 13, color: levelData.color }}>✓</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--subtext)', marginBottom: 6 }}>
                    {set.questions.length} questions · multiple choice
                  </div>
                  {/* Mini progress bar per set */}
                  <div
                    style={{
                      height: 4,
                      background: 'rgba(0,0,0,.08)',
                      borderRadius: 2,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: (setDone / setTotal) * 100 + '%',
                        height: '100%',
                        background: levelData.color,
                        borderRadius: 2,
                        transition: 'width .3s',
                      }}
                    />
                  </div>
                  <div
                    style={{ fontSize: 10, color: 'var(--subtext)', fontWeight: 600, marginTop: 3 }}
                  >
                    {setDone}/{setTotal} done
                  </div>
                </div>
                <div style={{ fontSize: 20, color: levelData.color }}>→</div>
              </button>
            );
          })}
        </div>

        {lvlComplete && (
          <BonusStoryCard
            catalog={storyCatalog}
            levelId={selectedLevel}
            accentColor={levelData.color}
            onOpen={setBonusStory}
          />
        )}

        {bonusStory && <GradedStoryModal story={bonusStory} onClose={() => setBonusStory(null)} />}
      </div>
    );
  }

  // ── Level selection ──────────────────────────────────────────────────────
  return (
    <div className="scr-wrap" style={{ paddingBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button
          onClick={goBack}
          style={{
            background: 'var(--bar-bg)',
            border: 'none',
            borderRadius: 10,
            padding: '8px 14px',
            color: 'var(--subtext)',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          ← Back
        </button>
      </div>

      <div
        style={{
          background: 'linear-gradient(135deg,#1e1b4b,#312e81)',
          borderRadius: 18,
          padding: '18px 18px 16px',
          marginBottom: 20,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 900,
            color: 'rgba(255,255,255,.5)',
            textTransform: 'uppercase',
            letterSpacing: '.14em',
            marginBottom: 4,
          }}
        >
          LISTENING
        </div>
        <div
          style={{
            fontSize: 24,
            fontWeight: 900,
            color: 'white',
            fontFamily: "'Playfair Display',serif",
            marginBottom: 6,
          }}
        >
          Comprehension Track
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,.65)' }}>
          Hear Croatian sentences, choose the correct English meaning · A1 → B2
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {levelIds.map((lid) => {
          const ld = (EXERCISES as Record<string, typeof EXERCISES.A1>)[lid]!;
          const completed = getLevelCompletionCount(lid);
          const total = getLevelTotalCount(lid);
          const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
          const complete = isLevelComplete(lid);
          return (
            <button
              key={lid}
              onClick={() => setSelectedLevel(lid)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '16px 18px',
                borderRadius: 16,
                background: ld.bg,
                border: `1.5px solid ${complete ? ld.color : ld.border}`,
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: "'Outfit',sans-serif",
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  flexShrink: 0,
                  background: ld.headerBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  fontWeight: 900,
                  color: 'white',
                  position: 'relative',
                }}
              >
                {lid}
                {complete && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -4,
                      right: -4,
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      background: '#fbbf24',
                      fontSize: 9,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                    }}
                  >
                    ✓
                  </div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 900,
                    color: 'var(--heading)',
                    marginBottom: 3,
                  }}
                >
                  {ld.label}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--subtext)',
                    lineHeight: 1.4,
                    marginBottom: 6,
                  }}
                >
                  {ld.desc}
                </div>
                {/* Progress bar */}
                <div
                  style={{
                    height: 4,
                    background: 'rgba(0,0,0,.08)',
                    borderRadius: 2,
                    overflow: 'hidden',
                    marginBottom: 3,
                  }}
                >
                  <div
                    style={{
                      width: pct + '%',
                      height: '100%',
                      background: ld.color,
                      borderRadius: 2,
                      transition: 'width .4s',
                    }}
                  />
                </div>
                <div style={{ fontSize: 10, color: ld.color, fontWeight: 700 }}>
                  {ld.sets.length} sets · {completed}/{total} questions
                  {complete && ' · Complete 🏆'}
                </div>
              </div>
              <div style={{ fontSize: 20, color: ld.color }}>→</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
