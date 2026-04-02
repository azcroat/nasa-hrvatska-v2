// ═══════════════════════════════════════════════════════════
// AnimatedLesson — Animated Grammar Lesson Player
// The app's equivalent of pre-produced video lessons,
// built entirely in React with animations and live TTS.
// ═══════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { speak } from '../../lib/audio.js';
import { markQuest } from '../../lib/quests.js';
import {
  ProgressBar,
  IntroSlide,
  RuleSlide,
  ExampleSlide,
  TableSlide,
  QuizSlide,
  SummarySlide,
} from './LessonSlides.jsx';

// ── Inline keyframes injected once ──────────────────────────
const SLIDE_ANIM_ID = 'nh-slide-anim';
if (typeof document !== 'undefined' && !document.getElementById(SLIDE_ANIM_ID)) {
  const style = document.createElement('style');
  style.id = SLIDE_ANIM_ID;
  style.textContent = `
    @keyframes slideIn {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);
}

// ── Helpers ──────────────────────────────────────────────────
function LS_GET(key, fallback) {
  try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); }
  catch { return fallback; }
}
function LS_SET(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// ── Main Component ─────────────────────────────────────────────
export default function AnimatedLesson({ lesson, goBack, award }) {
  const [slide, setSlide] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResults, setQuizResults] = useState({});
  const [score, setScore] = useState(0);
  const [_done, setDone] = useState(false);
  const [autoTTS, setAutoTTS] = useState(() => LS_GET('nh_autotts', true));
  const [ttsAvailable] = useState(() => typeof window !== 'undefined');
  const [xpAwarded, setXpAwarded] = useState(false);

  const slides = lesson.slides;
  const totalSlides = slides.length;
  const currentSlide = slides[slide];

  // Count quiz slides for score display
  const quizSlides = slides.reduce((acc, s, i) => {
    if (s.type === 'quiz') acc.push(i);
    return acc;
  }, []);
  const quizTotal = quizSlides.length;

  // Auto-TTS on slide change
  useEffect(() => {
    if (!autoTTS || !ttsAvailable) return undefined;
    if (currentSlide.type === 'example' && currentSlide.items && currentSlide.items.length > 0) {
      const timer = setTimeout(() => {
        speak(currentSlide.items[0].hr);
      }, 600);
      return () => clearTimeout(timer);
    }
    return undefined;
   
  }, [slide]);

  // Award XP when summary slide reached
  useEffect(() => {
    if (currentSlide.type === 'summary' && !xpAwarded) {
      setXpAwarded(true);
      if (typeof award === 'function') {
        award(25);
        markQuest('grammar');
      }
    }
   
  }, [slide]);

  function handleToggleTTS() {
    setAutoTTS(prev => {
      const next = !prev;
      LS_SET('nh_autotts', next);
      return next;
    });
  }

  function handleAnswer(slideIndex, optionIndex) {
    setQuizAnswers(prev => ({ ...prev, [slideIndex]: optionIndex }));
  }

  function handleCheck(slideIndex) {
    const s = slides[slideIndex];
    const chosen = quizAnswers[slideIndex];
    if (chosen === undefined) return;
    const correct = chosen === s.correct;
    setQuizResults(prev => ({ ...prev, [slideIndex]: correct }));
    if (correct) setScore(sc => sc + 1);
  }

  function goNext() {
    if (slide < totalSlides - 1) {
      setSlide(s => s + 1);
    } else {
      setDone(true);
      goBack();
    }
  }

  function goPrev() {
    if (slide > 0) setSlide(s => s - 1);
  }

  // Can we go next? For quiz slides, require answer checked before advancing
  const isQuiz = currentSlide.type === 'quiz';
  const quizRevealed = quizResults[slide] !== undefined;
  const canGoNext = !isQuiz || quizRevealed;
  const isLastSlide = slide === totalSlides - 1;

  // ── Render slide content ─────────────────────────────────
  function renderSlide() {
    switch (currentSlide.type) {
      case 'intro':
        return <IntroSlide slide={currentSlide} lesson={lesson} />;

      case 'rule':
        return <RuleSlide slide={currentSlide} lesson={lesson} />;

      case 'example':
        return (
          <ExampleSlide
            slide={currentSlide}
            lesson={lesson}
            autoTTS={autoTTS}
            ttsAvailable={ttsAvailable}
          />
        );

      case 'table':
        return <TableSlide slide={currentSlide} lesson={lesson} />;

      case 'quiz':
        return (
          <QuizSlide
            slide={currentSlide}
            slideIndex={slide}
            lesson={lesson}
            quizAnswers={quizAnswers}
            quizResults={quizResults}
            onAnswer={handleAnswer}
            onCheck={handleCheck}
          />
        );

      case 'summary':
        return (
          <SummarySlide
            slide={currentSlide}
            lesson={lesson}
            score={score}
            quizTotal={quizTotal}
            xpAwarded={xpAwarded}
          />
        );

      default:
        return (
          <div style={{ color: 'var(--subtext)', padding: 24 }}>
            Unknown slide type: {currentSlide.type}
          </div>
        );
    }
  }

  return (
    <div style={{
      fontFamily: "'Outfit', sans-serif",
      maxWidth: 600, margin: '0 auto',
      padding: '0 0 80px',
    }}>
      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        marginBottom: 12, padding: '0 2px',
      }}>
        {/* Back button */}
        <button
          onClick={goBack}
          aria-label="Back to lesson list"
          style={{
            background: 'none', border: '1px solid var(--card-b)',
            borderRadius: 10, padding: '6px 10px', cursor: 'pointer',
            fontSize: 16, color: 'var(--subtext)', flexShrink: 0,
            fontFamily: 'inherit', transition: 'background .15s',
          }}
        >
          ←
        </button>

        {/* Title */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 'var(--text-sm)', fontWeight: 900,
            color: 'var(--heading)', overflow: 'hidden',
            textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{lesson.title}</div>
          <div style={{
            fontSize: 'var(--text-xs)', color: 'var(--subtext)', fontWeight: 600,
          }}>{lesson.level} · {lesson.duration}</div>
        </div>

        {/* TTS toggle */}
        {ttsAvailable && (
          <button
            onClick={handleToggleTTS}
            aria-label={autoTTS ? 'Disable auto-speak' : 'Enable auto-speak'}
            title={autoTTS ? 'Auto-speak ON' : 'Auto-speak OFF'}
            style={{
              background: autoTTS ? lesson.bg : 'var(--bar-bg)',
              border: '1px solid ' + (autoTTS ? lesson.color + '55' : 'var(--card-b)'),
              borderRadius: 10, padding: '6px 10px', cursor: 'pointer',
              fontSize: 15, color: autoTTS ? lesson.color : 'var(--subtext)',
              fontFamily: 'inherit', display: 'flex', alignItems: 'center',
              gap: 4, flexShrink: 0, transition: 'all .15s',
            }}
          >
            <span aria-hidden="true">🔊</span>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700 }}>
              {autoTTS ? 'Auto' : 'Off'}
            </span>
          </button>
        )}
      </div>

      {/* ── Progress Bar ── */}
      <ProgressBar current={slide + 1} total={totalSlides} color={lesson.color} />

      {/* ── Slide Content (animated) ── */}
      <div
        key={slide}
        style={{ animation: 'slideIn 0.3s ease forwards' }}
      >
        {renderSlide()}
      </div>

      {/* ── Navigation ── */}
      <div style={{
        display: 'flex', gap: 10, marginTop: 24, alignItems: 'center',
      }}>
        {/* Prev */}
        <button
          onClick={goPrev}
          disabled={slide === 0}
          aria-label="Previous slide"
          style={{
            flex: 1, padding: '13px 16px',
            borderRadius: 12, border: '1px solid var(--card-b)',
            background: slide === 0 ? 'var(--bar-bg)' : 'var(--card)',
            color: slide === 0 ? 'var(--subtext)' : 'var(--heading)',
            cursor: slide === 0 ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', fontSize: 'var(--text-base)',
            fontWeight: 700, opacity: slide === 0 ? 0.4 : 1,
            transition: 'all .15s',
          }}
        >
          ← Prev
        </button>

        {/* Slide type indicator dots */}
        <div style={{
          display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0,
        }}>
          {slides.map((s, i) => (
            <div
              key={i}
              style={{
                width: i === slide ? 16 : 6,
                height: 6, borderRadius: 99,
                background: i === slide ? lesson.color : (i < slide ? lesson.color + '66' : 'var(--bar-bg)'),
                transition: 'all .25s ease',
              }}
            />
          ))}
        </div>

        {/* Next */}
        <button
          onClick={goNext}
          disabled={!canGoNext}
          aria-label={isLastSlide ? 'Finish lesson' : 'Next slide'}
          style={{
            flex: 1, padding: '13px 16px',
            borderRadius: 12, border: 'none',
            background: canGoNext ? lesson.color : 'var(--bar-bg)',
            color: canGoNext ? '#fff' : 'var(--subtext)',
            cursor: canGoNext ? 'pointer' : 'not-allowed',
            fontFamily: 'inherit', fontSize: 'var(--text-base)',
            fontWeight: 800, transition: 'all .15s',
            opacity: canGoNext ? 1 : 0.5,
          }}
        >
          {isLastSlide ? 'Finish ✓' : 'Next →'}
        </button>
      </div>

      {/* ── Quiz: check reminder ── */}
      {isQuiz && !quizRevealed && quizAnswers[slide] !== undefined && (
        <div style={{
          marginTop: 10, padding: '8px 12px',
          background: lesson.bg, borderRadius: 10,
          border: '1px solid ' + lesson.color + '33',
          fontSize: 'var(--text-xs)', color: lesson.color,
          fontWeight: 700, textAlign: 'center',
          animation: 'slideIn .25s ease forwards',
        }}>
          Tap "Check Answer" before continuing
        </div>
      )}
    </div>
  );
}
