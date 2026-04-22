import React, { useState, useEffect } from 'react';
import { H } from '../../data';
import { SCENES, TOTAL_WORDS } from './VocabSceneData.js';

interface SceneItem {
  id: string;
  hr: string;
  en: string;
  icon: string;
  note: string;
  x: number;
  y: number;
}

interface SceneInfo {
  id: string;
  title: string;
  titleEn: string;
  icon: string;
  emoji: string;
  color: string;
  bg: string;
  items: SceneItem[];
  [key: string]: unknown;
}

// ─── Inline styles & CSS injection ───────────────────────────────────────────

const CSS = `
@keyframes vs-pulse {
  0%,100% { transform: translate(-50%,-50%) scale(1); }
  50%      { transform: translate(-50%,-50%) scale(1.12); }
}
@keyframes vs-discovered {
  0%   { transform: translate(-50%,-50%) scale(1); }
  40%  { transform: translate(-50%,-50%) scale(1.3); }
  70%  { transform: translate(-50%,-50%) scale(0.92); }
  100% { transform: translate(-50%,-50%) scale(1); }
}
@keyframes vs-popup-in {
  from { transform: translateY(100%); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}
@keyframes vs-confetti {
  0%   { transform: translateY(-10px) rotate(0deg);   opacity: 1; }
  100% { transform: translateY(340px) rotate(720deg); opacity: 0; }
}
@keyframes vs-complete-in {
  from { opacity: 0; transform: scale(0.85); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes vs-toast-in {
  from { opacity: 0; transform: translateX(40px); }
  to   { opacity: 1; transform: translateX(0); }
}
.vs-pulse-anim     { animation: vs-pulse 2s infinite; }
.vs-discovered-anim{ animation: vs-discovered 0.45s ease; }
`;

let cssInjected = false;
export function ensureCSS() {
  if (cssInjected) return;
  cssInjected = true;
  const el = document.createElement('style');
  el.textContent = CSS;
  document.head.appendChild(el);
}

// ─── Confetti component ───────────────────────────────────────────────────────

const CONFETTI_COLORS = [
  '#f59e0b',
  '#10b981',
  '#3b82f6',
  '#ec4899',
  '#8b5cf6',
  '#ef4444',
  '#06b6d4',
];

export function Confetti() {
  const pieces = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length]!,
    left: `${(i / 28) * 100}%`,
    delay: `${(i * 0.07).toFixed(2)}s`,
    duration: `${1.2 + (i % 5) * 0.18}s`,
    size: 6 + (i % 4) * 2,
  }));
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      {pieces.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: p.left,
            top: 0,
            width: p.size,
            height: p.size,
            borderRadius: p.id % 3 === 0 ? '50%' : 2,
            background: p.color,
            animation: `vs-confetti ${p.duration} ${p.delay} ease-in forwards`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

export function Toast({ text, onDone }: { text: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 90,
        right: 16,
        zIndex: 9999,
        background: '#1c1917',
        color: 'white',
        borderRadius: 12,
        padding: '10px 16px',
        fontSize: 13,
        fontWeight: 600,
        boxShadow: '0 4px 20px rgba(0,0,0,.25)',
        animation: 'vs-toast-in 0.3s ease',
        maxWidth: 240,
      }}
    >
      {text}
    </div>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

export function ProgressBar({
  value,
  max,
  color,
  height = 6,
}: {
  value: number;
  max: number;
  color?: string;
  height?: number;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ height, background: 'rgba(0,0,0,.08)', borderRadius: 99, overflow: 'hidden' }}>
      <div
        style={{
          height: '100%',
          width: `${pct}%`,
          borderRadius: 99,
          background: color || '#10b981',
          transition: 'width 0.4s ease',
        }}
      />
    </div>
  );
}

// ─── Scene Picker ─────────────────────────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */
export function ScenePicker({
  onSelect,
  allDiscovered,
}: {
  onSelect: (scene: any) => void;
  allDiscovered: Record<string, Set<string>>;
}) {
  /* eslint-enable @typescript-eslint/no-explicit-any */
  const totalDiscovered = SCENES.reduce((s, sc) => s + (allDiscovered[sc.id]?.size ?? 0), 0);

  return (
    <div className="scr-wrap">
      {H(
        '🎭 Vocabulary Scenes',
        'Tap objects in a scene to discover their Croatian names',
        () => {},
      )}

      {/* Progress summary */}
      <div
        style={{
          background: 'linear-gradient(135deg,#0f172a,#1e293b)',
          borderRadius: 16,
          padding: '14px 18px',
          marginBottom: 20,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              opacity: 0.65,
              fontWeight: 600,
              marginBottom: 2,
              textTransform: 'uppercase',
              letterSpacing: '.06em',
            }}
          >
            Total Progress
          </div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>
            {totalDiscovered}{' '}
            <span style={{ fontSize: 14, opacity: 0.7 }}>/ {TOTAL_WORDS} words discovered</span>
          </div>
        </div>
        <div style={{ fontSize: 36 }}>🌟</div>
      </div>

      {/* Scene grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {SCENES.map((scene) => {
          const disc = allDiscovered[scene.id]?.size ?? 0;
          const total = scene.items.length;
          const complete = disc >= total;
          return (
            <button
              key={scene.id}
              onClick={() => onSelect(scene)}
              style={{
                background: complete ? scene.bg : 'white',
                border: complete ? `2px solid ${scene.color}` : '1.5px solid rgba(0,0,0,.08)',
                borderRadius: 16,
                padding: '16px 14px',
                cursor: 'pointer',
                textAlign: 'left',
                boxShadow: complete ? `0 2px 12px ${scene.color}33` : '0 1px 4px rgba(0,0,0,.06)',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.03)';
                e.currentTarget.style.boxShadow = `0 6px 20px ${scene.color}44`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = complete
                  ? `0 2px 12px ${scene.color}33`
                  : '0 1px 4px rgba(0,0,0,.06)';
              }}
            >
              {complete && (
                <div
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    background: scene.color,
                    color: 'white',
                    borderRadius: 20,
                    padding: '2px 8px',
                    fontSize: 10,
                    fontWeight: 800,
                  }}
                >
                  Complete!
                </div>
              )}
              <div style={{ fontSize: 42, marginBottom: 8, lineHeight: 1 }}>{scene.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#1c1917', marginBottom: 2 }}>
                {scene.title}
              </div>
              <div style={{ fontSize: 11, color: '#78716c', marginBottom: 10 }}>
                {scene.titleEn}
              </div>
              <div style={{ fontSize: 11, color: scene.color, fontWeight: 700, marginBottom: 6 }}>
                {disc} / {total} discovered
              </div>
              <ProgressBar value={disc} max={total} color={scene.color} height={5} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Item Button ──────────────────────────────────────────────────────────────

export function ItemButton({
  item,
  discovered,
  isActive,
  isQuiz,
  onTap,
}: {
  item: SceneItem;
  discovered: boolean;
  isActive: boolean;
  isQuiz: boolean;
  onTap: () => void;
}) {
  const [justFound, setJustFound] = useState(false);
  const prevDisc = React.useRef(discovered);

  useEffect(() => {
    if (!prevDisc.current && discovered) {
      setJustFound(true);
      const t = setTimeout(() => setJustFound(false), 450);
      return () => clearTimeout(t);
    }
    prevDisc.current = discovered;
    return undefined;
  }, [discovered]);

  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${item.x}%`,
    top: `${item.y}%`,
    transform: 'translate(-50%,-50%)',
    width: 44,
    height: 44,
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    zIndex: isActive ? 5 : 2,
    transition: 'box-shadow 0.2s ease',
  };

  if (justFound) {
    return (
      <div
        style={{ ...baseStyle, background: '#fef9c3', boxShadow: '0 0 0 3px #f59e0b' }}
        className="vs-discovered-anim"
      >
        <span style={{ fontSize: 22, lineHeight: 1 }}>{item.icon}</span>
      </div>
    );
  }

  if (discovered) {
    return (
      <button
        onClick={onTap}
        aria-label={`${item.hr} — ${item.en}`}
        style={{
          ...baseStyle,
          background: isActive ? '#fff' : 'rgba(255,255,255,0.92)',
          boxShadow: isActive
            ? '0 0 0 3px #f59e0b, 0 4px 16px rgba(0,0,0,.18)'
            : '0 2px 8px rgba(0,0,0,.14)',
          flexDirection: 'column',
        }}
      >
        <span style={{ fontSize: 20, lineHeight: 1 }}>{item.icon}</span>
        <span
          style={{
            fontSize: 8,
            fontWeight: 700,
            color: '#1c1917',
            lineHeight: 1,
            marginTop: 1,
            maxWidth: 42,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textAlign: 'center',
          }}
        >
          {item.hr}
        </span>
      </button>
    );
  }

  // Undiscovered
  const showQuizMark = isQuiz;
  return (
    <button
      onClick={onTap}
      aria-label="Undiscovered item — tap to reveal"
      className="vs-pulse-anim"
      style={{
        ...baseStyle,
        background: showQuizMark ? 'rgba(99,102,241,0.75)' : 'rgba(0,0,0,0.4)',
        boxShadow: isActive ? '0 0 0 3px #f59e0b' : 'none',
        color: 'white',
        fontSize: showQuizMark ? 18 : 22,
        filter: showQuizMark ? 'none' : 'blur(0.3px)',
      }}
    >
      {showQuizMark ? (
        '?'
      ) : (
        <span style={{ filter: 'blur(1.5px)', opacity: 0.55 }}>{item.icon}</span>
      )}
    </button>
  );
}

// ─── Item Popup ───────────────────────────────────────────────────────────────

export function ItemPopup({
  item,
  scene,
  isAdded,
  isQuiz,
  quizRevealed,
  onClose,
  onSpeak,
  onAddSRS,
  onQuizAnswer,
}: {
  item: SceneItem;
  scene: SceneInfo;
  isAdded: boolean;
  isQuiz: boolean;
  quizRevealed: boolean;
  onClose: () => void;
  onSpeak: () => void;
  onAddSRS: () => void;
  onQuizAnswer: (result: boolean | null) => void;
}) {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 6,
          background: 'rgba(0,0,0,0.18)',
        }}
      />
      {/* Sheet */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 7,
          background: 'white',
          borderRadius: '16px 16px 0 0',
          padding: '16px 20px 20px',
          boxShadow: '0 -4px 24px rgba(0,0,0,.16)',
          animation: 'vs-popup-in 0.28s cubic-bezier(.4,0,.2,1)',
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: 12,
            right: 14,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 20,
            color: '#78716c',
            lineHeight: 1,
            padding: 4,
          }}
        >
          ✕
        </button>

        {isQuiz && !quizRevealed && (
          <div
            style={{
              fontSize: 12,
              color: '#6366f1',
              fontWeight: 700,
              marginBottom: 10,
              textAlign: 'center',
            }}
          >
            Do you know this word?
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
          <div style={{ fontSize: 48, lineHeight: 1 }}>{item.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#1c1917', lineHeight: 1.1 }}>
              {item.hr}
            </div>
            <div style={{ fontSize: 14, color: '#78716c', marginTop: 3 }}>{item.en}</div>
          </div>
          {/* Gender badge */}
          <div
            style={{
              background: scene.bg,
              color: scene.color,
              border: `1.5px solid ${scene.color}44`,
              borderRadius: 20,
              padding: '3px 10px',
              fontSize: 11,
              fontWeight: 800,
            }}
          >
            {item.note}
          </div>
        </div>

        {/* Action row */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={onSpeak}
            aria-label="Listen to pronunciation"
            style={{
              flex: 1,
              background: `${scene.bg}`,
              border: `1.5px solid ${scene.color}44`,
              borderRadius: 12,
              padding: '10px 0',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 700,
              color: scene.color,
            }}
          >
            <span aria-hidden="true">🔊</span> Listen
          </button>
          <button
            onClick={onAddSRS}
            style={{
              flex: 1,
              background: isAdded ? '#dcfce7' : scene.color,
              border: 'none',
              borderRadius: 12,
              padding: '10px 0',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 700,
              color: isAdded ? '#15803d' : 'white',
            }}
          >
            {isAdded ? '✓ In flashcards' : '+ Add to flashcards'}
          </button>
        </div>

        {/* Quiz answer buttons */}
        {isQuiz && quizRevealed && (
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button
              onClick={() => onQuizAnswer(true)}
              style={{
                flex: 1,
                background: '#dcfce7',
                border: '1.5px solid #86efac',
                borderRadius: 12,
                padding: '10px 0',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 700,
                color: '#15803d',
              }}
            >
              ✓ I knew it
            </button>
            <button
              onClick={() => onQuizAnswer(false)}
              style={{
                flex: 1,
                background: '#fee2e2',
                border: '1.5px solid #fca5a5',
                borderRadius: 12,
                padding: '10px 0',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 700,
                color: '#b91c1c',
              }}
            >
              ✗ I didn't
            </button>
          </div>
        )}
        {isQuiz && !quizRevealed && (
          <button
            onClick={() => onQuizAnswer(null)}
            style={{
              width: '100%',
              marginTop: 10,
              background: '#f1f5f9',
              border: '1.5px solid #e2e8f0',
              borderRadius: 12,
              padding: '10px 0',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 700,
              color: '#475569',
            }}
          >
            Reveal word
          </button>
        )}
      </div>
    </>
  );
}

// ─── Scene Complete Overlay ───────────────────────────────────────────────────

export function SceneComplete({
  scene,
  onNext,
  onBack,
}: {
  scene: SceneInfo;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 20,
        background: 'rgba(0,0,0,.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: 20,
          padding: '32px 28px',
          textAlign: 'center',
          boxShadow: '0 8px 40px rgba(0,0,0,.28)',
          animation: 'vs-complete-in 0.4s cubic-bezier(.4,0,.2,1)',
          maxWidth: 300,
          width: '90%',
        }}
      >
        <div style={{ fontSize: 52, marginBottom: 10 }}>🎉</div>
        <div style={{ fontSize: 20, fontWeight: 900, color: '#1c1917', marginBottom: 6 }}>
          Scene Complete!
        </div>
        <div style={{ fontSize: 13, color: '#78716c', marginBottom: 6 }}>
          You discovered all {scene.items.length} words in
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, color: scene.color, marginBottom: 18 }}>
          {scene.icon} {scene.title}
        </div>
        <div
          style={{
            background: '#fef3c7',
            borderRadius: 12,
            padding: '10px 16px',
            marginBottom: 18,
            fontSize: 13,
            fontWeight: 700,
            color: '#92400e',
          }}
        >
          +15 XP earned!
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onBack}
            style={{
              flex: 1,
              background: '#f5f5f4',
              border: 'none',
              borderRadius: 12,
              padding: '12px 0',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 700,
              color: '#44403c',
            }}
          >
            ← Scenes
          </button>
          <button
            onClick={onNext}
            style={{
              flex: 2,
              background: scene.color,
              border: 'none',
              borderRadius: 12,
              padding: '12px 0',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 700,
              color: 'white',
            }}
          >
            Next Scene →
          </button>
        </div>
      </div>
    </div>
  );
}
