import React, { useState, useEffect, useRef } from 'react';
import { speak, stopAudio } from '../../../lib/audio.ts';

export default function GradedStoryModal({ story, onClose }: { story: any; onClose: () => void }) {
  const [paraIdx, setParaIdx] = useState(0);
  const [showEn, setShowEn] = useState(false);
  const [quizMode, setQuizMode] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizDone, setQuizDone] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopAudio();
    };
  }, []);

  const para = story.paragraphs[paraIdx];
  const totalParas = story.paragraphs.length;

  function handleParaAudio() {
    speak(para.hr);
  }

  function handleQuizAnswer(optIdx: number) {
    if (quizAnswer !== null) return;
    setQuizAnswer(optIdx);
    if (optIdx === story.quiz[quizIdx].correct) setQuizScore((s) => s + 1);
  }

  function handleNextQuiz() {
    if (quizIdx + 1 >= story.quiz.length) {
      setQuizDone(true);
    } else {
      setQuizIdx((i) => i + 1);
      setQuizAnswer(null);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0,0,0,.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          maxHeight: '90vh',
          background: 'var(--bg)',
          borderRadius: '20px 20px 0 0',
          padding: '20px 18px 32px',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 16,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: '#7c3aed',
                textTransform: 'uppercase',
                letterSpacing: '.1em',
              }}
            >
              {story.icon} {story.level} Graded Story
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 900,
                color: 'var(--heading)',
                fontFamily: "'Playfair Display',serif",
                marginTop: 2,
              }}
            >
              {story.title}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'var(--bar-bg)',
              border: 'none',
              borderRadius: 8,
              padding: '6px 10px',
              cursor: 'pointer',
              fontSize: 14,
              color: 'var(--subtext)',
              fontWeight: 700,
            }}
          >
            ✕
          </button>
        </div>

        {!quizMode ? (
          <>
            <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
              {story.paragraphs.map((_: any, i: number) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: 4,
                    borderRadius: 2,
                    background: i <= paraIdx ? '#7c3aed' : 'var(--bar-bg)',
                    transition: 'background .3s',
                  }}
                />
              ))}
            </div>

            <div style={{ fontSize: 12, color: 'var(--subtext)', marginBottom: 12 }}>
              Paragraph {paraIdx + 1} of {totalParas}
            </div>

            <div
              style={{
                padding: '16px',
                background: 'var(--card)',
                border: '1.5px solid var(--card-b)',
                borderRadius: 14,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  fontSize: 15,
                  lineHeight: 1.7,
                  color: 'var(--heading)',
                  fontFamily: "'Playfair Display',serif",
                }}
              >
                {para.hr}
              </div>
            </div>

            {showEn && (
              <div
                style={{
                  padding: '12px 14px',
                  background: 'rgba(124,58,237,.06)',
                  borderRadius: 10,
                  marginBottom: 12,
                  fontSize: 13,
                  color: 'var(--subtext)',
                  lineHeight: 1.6,
                  animation: 'fadeIn .2s ease',
                }}
              >
                {para.en}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <button
                onClick={handleParaAudio}
                style={{
                  padding: '8px 14px',
                  borderRadius: 10,
                  border: 'none',
                  background: '#7c3aed',
                  color: 'white',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                ▶ Listen
              </button>
              <button
                onClick={() => setShowEn((o) => !o)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 10,
                  border: '1.5px solid var(--card-b)',
                  background: 'transparent',
                  color: 'var(--subtext)',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {showEn ? 'Hide English' : 'Show English'}
              </button>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              {paraIdx > 0 && (
                <button
                  onClick={() => {
                    setParaIdx((i) => i - 1);
                    setShowEn(false);
                  }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: 12,
                    border: '1.5px solid var(--card-b)',
                    background: 'transparent',
                    color: 'var(--body)',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  ← Previous
                </button>
              )}
              {paraIdx + 1 < totalParas ? (
                <button
                  onClick={() => {
                    setParaIdx((i) => i + 1);
                    setShowEn(false);
                  }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: 12,
                    border: 'none',
                    background: '#7c3aed',
                    color: 'white',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Next →
                </button>
              ) : story.quiz && story.quiz.length > 0 ? (
                <button
                  onClick={() => setQuizMode(true)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: 12,
                    border: 'none',
                    background: '#7c3aed',
                    color: 'white',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Take quiz →
                </button>
              ) : (
                <button
                  onClick={onClose}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: 12,
                    border: 'none',
                    background: '#7c3aed',
                    color: 'white',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Finish ✓
                </button>
              )}
            </div>
          </>
        ) : quizDone ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: 56 }}>{quizScore === story.quiz.length ? '🌟' : '🎉'}</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--heading)', marginTop: 12 }}>
              {quizScore}/{story.quiz.length} correct
            </div>
            <button
              onClick={onClose}
              style={{
                marginTop: 20,
                width: '100%',
                padding: '13px',
                borderRadius: 14,
                border: 'none',
                background: '#7c3aed',
                color: 'white',
                fontSize: 15,
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: '#7c3aed',
                textTransform: 'uppercase',
                letterSpacing: '.1em',
                marginBottom: 12,
              }}
            >
              Quiz · {quizIdx + 1}/{story.quiz.length}
            </div>
            <div
              style={{
                padding: '14px 16px',
                background: 'var(--card)',
                border: '1.5px solid var(--card-b)',
                borderRadius: 14,
                marginBottom: 14,
              }}
            >
              <div
                style={{ fontSize: 15, fontWeight: 800, color: 'var(--heading)', marginBottom: 4 }}
              >
                {story.quiz[quizIdx].q}
              </div>
              <div style={{ fontSize: 12, color: 'var(--subtext)', fontStyle: 'italic' }}>
                {story.quiz[quizIdx].qEn}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {story.quiz[quizIdx].opts.map((opt: any, idx: number) => {
                const correct = story.quiz[quizIdx].correct;
                let bg = 'var(--card)',
                  border = '1.5px solid var(--card-b)',
                  color = 'var(--body)';
                if (quizAnswer !== null) {
                  if (idx === correct) {
                    bg = '#f0fdf4';
                    border = '1.5px solid #bbf7d0';
                    color = '#166534';
                  } else if (idx === quizAnswer) {
                    bg = '#fff1f2';
                    border = '1.5px solid #fecaca';
                    color = '#b91c1c';
                  }
                }
                return (
                  <button
                    key={idx}
                    onClick={() => handleQuizAnswer(idx)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 12,
                      border,
                      background: bg,
                      color,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: quizAnswer !== null ? 'default' : 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    {quizAnswer !== null && idx === correct && (
                      <span style={{ marginRight: 6 }}>✓</span>
                    )}
                    {quizAnswer !== null && idx === quizAnswer && idx !== correct && (
                      <span style={{ marginRight: 6 }}>✗</span>
                    )}
                    {opt}
                  </button>
                );
              })}
            </div>
            {quizAnswer !== null && (
              <button
                onClick={handleNextQuiz}
                style={{
                  marginTop: 14,
                  width: '100%',
                  padding: '13px',
                  borderRadius: 14,
                  border: 'none',
                  background: '#7c3aed',
                  color: 'white',
                  fontSize: 15,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {quizIdx + 1 >= story.quiz.length ? 'See results' : 'Next question →'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
