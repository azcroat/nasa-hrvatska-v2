import React from 'react';
import ExerciseCard from './ExerciseCard';
import type { Recommendations } from '../../hooks/useSmartRecommendations';

// EXERCISES entries always carry a cefr (every entry sets it; isUnlocked requires it),
// so cefr is required here — the locked-tile onClick passes it to showLockedToast.
type ExerciseDef = React.ComponentProps<typeof ExerciseCard> & { cefr: string };

/**
 * Drill intent panel — featured Production Drill, the Browse-Exercises category
 * accordion (uses ExerciseCard), goal-based recommendations, and locked-exercise
 * teasers. Extracted from PracticeTab as part of the 1d decomposition. Receives
 * the filtered exercise lists + open-category state + nav/toast handlers + the
 * useSmartRecommendations bundle (recs). Behavior-identical to the prior block.
 */
export default function DrillPanel({
  availableExercises,
  lockedExercises,
  openCat,
  setOpenCat,
  setScr,
  sCurEx,
  nextCefrTier,
  showLockedToast,
  recs,
}: {
  availableExercises: ExerciseDef[];
  lockedExercises: ExerciseDef[];
  openCat: string | null;
  setOpenCat: (c: string | null) => void;
  setScr: (id: string) => void;
  sCurEx: (id: string) => void;
  nextCefrTier: string | null | undefined;
  showLockedToast: (cefr: string) => void;
  recs: Recommendations;
}) {
  const { goalItems, isNewUser, userGoal, goalLabels } = recs;
  return (
    <div>
      {/* ── PRODUCTION DRILL — featured hero ───────────────────────── */}
      <button
        onClick={() => {
          setScr('production_drill');
          sCurEx('production_drill');
        }}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '16px 18px',
          marginBottom: 12,
          border: 'none',
          cursor: 'pointer',
          borderRadius: 16,
          background: 'linear-gradient(135deg,#7c3aed,#5b21b6)',
          boxShadow: '0 6px 20px rgba(124,58,237,.35)',
          textAlign: 'left',
          fontFamily: "'Outfit',sans-serif",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            flexShrink: 0,
            background: 'rgba(255,255,255,.18)',
            border: '2px solid rgba(255,255,255,.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 26,
          }}
        >
          ✍️
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>Production Drill</div>
            <span
              style={{
                fontSize: 9,
                fontWeight: 900,
                letterSpacing: '.05em',
                background: 'rgba(255,255,255,.25)',
                color: '#fff',
                borderRadius: 5,
                padding: '2px 7px',
              }}
            >
              NEW
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.8)' }}>
            Transform · Translate · Build sentences · Correct errors
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.6)', marginTop: 2 }}>
            Step from passive recognition to real fluency
          </div>
        </div>
        <div style={{ fontSize: 22, color: 'rgba(255,255,255,.8)', fontWeight: 300 }}>›</div>
      </button>
      <div className="section-hdr">
        <div className="section-hdr-icon" style={{ background: 'rgba(99,102,241,.12)' }}>
          📚
        </div>
        <div className="section-hdr-text">
          <div className="section-hdr-title">Browse Exercises</div>
          <div className="section-hdr-sub">
            {availableExercises.length} exercises available at your level
          </div>
        </div>
      </div>
      {[
        {
          id: 'grammar',
          label: 'Grammar',
          emoji: '📝',
          color: '#7c3aed',
          bg: 'rgba(124,58,237,.08)',
          border: 'rgba(124,58,237,.25)',
        },
        {
          id: 'vocab',
          label: 'Vocabulary',
          emoji: '🇭🇷',
          color: '#0e7490',
          bg: 'rgba(14,116,144,.08)',
          border: 'rgba(14,116,144,.25)',
        },
        {
          id: 'practical',
          label: 'Practical',
          emoji: '🌍',
          color: '#059669',
          bg: 'rgba(5,150,105,.08)',
          border: 'rgba(5,150,105,.25)',
        },
        {
          id: 'advanced',
          label: 'Advanced',
          emoji: '🎓',
          color: '#d97706',
          bg: 'rgba(217,119,6,.08)',
          border: 'rgba(217,119,6,.25)',
        },
      ].map((cat) => {
        const catExercises = availableExercises.filter((e) => e.category === cat.id);
        const isOpen = openCat === cat.id;
        return (
          <div key={cat.id} style={{ marginBottom: 8 }}>
            <button
              onClick={() => setOpenCat(isOpen ? null : cat.id)}
              aria-expanded={isOpen}
              className="cat-tile"
              style={{
                borderRadius: isOpen ? '14px 14px 0 0' : 14,
                background: isOpen ? cat.color : cat.bg,
                border: `1.5px solid ${cat.border}`,
                borderBottom: isOpen ? 'none' : `1.5px solid ${cat.border}`,
              }}
            >
              <div
                className="cat-tile-icon"
                style={{
                  background: isOpen ? 'rgba(255,255,255,.18)' : 'var(--card)',
                  border: `1px solid ${isOpen ? 'rgba(255,255,255,.3)' : cat.border}`,
                }}
              >
                {cat.emoji}
              </div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div
                  className="cat-tile-title"
                  style={{ color: isOpen ? '#fff' : 'var(--heading)' }}
                >
                  {cat.label}
                </div>
                <div
                  className="cat-tile-count"
                  style={{ color: isOpen ? 'rgba(255,255,255,.75)' : 'var(--subtext)' }}
                >
                  {catExercises.length} exercises
                </div>
              </div>
              <div
                className={'cat-tile-chevron' + (isOpen ? ' cat-tile-chevron--open' : '')}
                style={{ color: isOpen ? 'rgba(255,255,255,.85)' : cat.color }}
              >
                ▼
              </div>
            </button>
            {isOpen && (
              <div
                className="cat-panel"
                style={{
                  border: `1.5px solid ${cat.border}`,
                  borderTop: 'none',
                  borderRadius: '0 0 14px 14px',
                  overflow: 'hidden',
                  background: 'var(--card)',
                }}
              >
                <div
                  className="exercise-grid-stagger"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 8,
                    padding: 10,
                  }}
                >
                  {catExercises.map((e) => (
                    <ExerciseCard key={e.id} {...e} />
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
      {goalItems && !isNewUser && (
        <div style={{ marginTop: 16, marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: 'var(--info)',
                textTransform: 'uppercase',
                letterSpacing: '.08em',
              }}
            >
              🎯 For your goal
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--info)',
                background: 'var(--info-bg)',
                border: '1px solid var(--info-b)',
                borderRadius: 20,
                padding: '2px 10px',
              }}
            >
              {userGoal ? (goalLabels as Record<string, string>)[userGoal] : ''}
            </span>
          </div>
          <div className="g3">
            {goalItems.map((r, i) => (
              <button
                key={i}
                className="tc"
                style={{
                  textAlign: 'center',
                  padding: '18px 10px',
                  border: `1.5px solid ${r.border}`,
                  background: r.color,
                }}
                onClick={r.fn}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 13,
                    margin: '0 auto 8px',
                    background: 'var(--card)',
                    border: `1px solid ${r.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                  }}
                >
                  {r.icon}
                </div>
                <div
                  style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: 800,
                    color: 'var(--heading)',
                    lineHeight: 1.2,
                  }}
                >
                  {r.title}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: 'var(--subtext)',
                    marginTop: 4,
                    lineHeight: 1.3,
                  }}
                >
                  {r.desc}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── LOCKED EXERCISES ── */}
      {lockedExercises.length > 0 && (
        <>
          <h3
            className="sh"
            style={{
              marginBottom: 8,
              marginTop: 20,
              fontSize: 13,
              fontWeight: 800,
              color: 'var(--subtext)',
            }}
          >
            Unlock at {nextCefrTier ?? 'higher level'} 🔒
          </h3>
          {lockedExercises.map((ex) => (
            <div
              key={ex.id}
              onClick={() => showLockedToast(ex.cefr)}
              style={{
                opacity: 0.55,
                filter: 'grayscale(0.6)',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--card-b)',
                  borderRadius: 14,
                  padding: '12px 14px',
                  marginBottom: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <span style={{ fontSize: 24 }}>{ex.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--heading)' }}>
                    {ex.label}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--subtext)', fontWeight: 500 }}>
                    {ex.desc} · Unlocks at {ex.cefr}
                  </div>
                </div>
                <span style={{ fontSize: 14 }}>🔒</span>
              </div>
            </div>
          ))}
          <div
            style={{
              textAlign: 'center',
              fontSize: 11,
              color: 'var(--subtext)',
              fontWeight: 600,
              padding: '8px 0 16px',
            }}
          >
            + {lockedExercises.length} more unlock at {nextCefrTier ?? 'higher level'} · Keep going
            →
          </div>
        </>
      )}
    </div>
  );
}
