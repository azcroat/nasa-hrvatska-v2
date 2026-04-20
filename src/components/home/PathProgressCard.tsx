// @ts-nocheck
import React from 'react';
import { useApp } from '../../context/AppContext';
import { useStats } from '../../context/StatsContext';

const SkeletonBar = ({ w = '100%', h = 16, r = 8, mt = 0 }) => (
  <div
    style={{
      width: w,
      height: h,
      borderRadius: r,
      marginTop: mt,
      background: 'linear-gradient(90deg, var(--bar-bg) 25%, var(--card-b) 50%, var(--bar-bg) 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.4s ease infinite',
    }}
  />
);

// Croatian city journey — one city per learning level
const JOURNEY_CITIES = [
  { level: 1, city: 'Zagreb', emoji: '🏙️', desc: 'Beginner' },
  { level: 2, city: 'Plitvice', emoji: '🌊', desc: 'Elementary' },
  { level: 3, city: 'Zadar', emoji: '🌅', desc: 'Intermediate' },
  { level: 4, city: 'Split', emoji: '⛵', desc: 'Upper-Intermediate' },
  { level: 5, city: 'Dubrovnik', emoji: '🏰', desc: 'Advanced' },
  { level: 6, city: 'Hvar', emoji: '🌴', desc: 'Expert' },
  { level: 7, city: 'Majstor', emoji: '🇭🇷', desc: 'Mastery' },
];

function CityJourney({ currentLevel, activePalette }) {
  return (
    <div style={{ marginBottom: 14, marginTop: 4 }}>
      {/* Journey label */}
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          color: 'rgba(255,255,255,0.6)',
          textTransform: 'uppercase',
          letterSpacing: '.1em',
          marginBottom: 10,
        }}
      >
        Your Croatian Journey
      </div>

      {/* City path */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          overflowX: 'auto',
          paddingBottom: 4,
          scrollbarWidth: 'none',
        }}
      >
        {JOURNEY_CITIES.map((stop, i) => {
          const isDone = stop.level < currentLevel;
          const isCurrent = stop.level === currentLevel;
          const isFuture = stop.level > currentLevel;

          return (
            <React.Fragment key={stop.level}>
              {/* City node */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flexShrink: 0,
                  minWidth: 44,
                }}
              >
                {/* Emoji marker */}
                <div
                  style={{
                    width: isCurrent ? 42 : 34,
                    height: isCurrent ? 42 : 34,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: isCurrent ? 22 : 18,
                    background: isDone
                      ? 'rgba(255,255,255,0.18)'
                      : isCurrent
                        ? 'rgba(255,255,255,0.95)'
                        : 'rgba(255,255,255,0.08)',
                    boxShadow: isCurrent
                      ? `0 0 0 3px ${activePalette.text}, 0 4px 16px rgba(0,0,0,0.25)`
                      : 'none',
                    border: isCurrent
                      ? '2px solid rgba(255,255,255,0.9)'
                      : isDone
                        ? '1.5px solid rgba(255,255,255,0.3)'
                        : '1.5px solid rgba(255,255,255,0.1)',
                    opacity: isFuture ? 0.45 : 1,
                    transition: 'all .3s ease',
                    position: 'relative',
                  }}
                >
                  {stop.emoji}
                  {/* Done checkmark overlay */}
                  {isDone && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: -2,
                        right: -2,
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        background: '#16a34a',
                        border: '1.5px solid rgba(255,255,255,0.8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 8,
                        color: '#fff',
                        fontWeight: 900,
                      }}
                    >
                      ✓
                    </div>
                  )}
                  {/* Current pulse ring */}
                  {isCurrent && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: -6,
                        borderRadius: '50%',
                        border: '2px solid rgba(255,255,255,0.35)',
                        animation: 'nh-pulse-ring 2s ease-in-out infinite',
                      }}
                    />
                  )}
                </div>
                {/* City name */}
                <div
                  style={{
                    fontSize: isCurrent ? 10 : 9,
                    fontWeight: isCurrent ? 900 : 600,
                    color: isCurrent
                      ? 'rgba(255,255,255,0.95)'
                      : isDone
                        ? 'rgba(255,255,255,0.6)'
                        : 'rgba(255,255,255,0.3)',
                    marginTop: 5,
                    textAlign: 'center',
                    lineHeight: 1.2,
                    maxWidth: 44,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {stop.city}
                </div>
              </div>

              {/* Connector line between cities */}
              {i < JOURNEY_CITIES.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    height: 2,
                    minWidth: 8,
                    maxWidth: 24,
                    background:
                      stop.level < currentLevel
                        ? 'rgba(255,255,255,0.45)'
                        : 'rgba(255,255,255,0.12)',
                    margin: '0 2px',
                    marginBottom: 18, // align with center of emoji
                    borderRadius: 2,
                    flexShrink: 1,
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

export default function PathProgressCard({
  activePalette,
  pathData,
  syncReady,
  launchPathItem,
  setTab,
  resumeLesson,
  lastActivity,
  sCurEx,
}) {
  const { setScr } = useApp();
  const { stats: st } = useStats();

  const lessonName =
    pathData.nextItem?.name || pathData.nextItem?.title || 'Learning Path Complete';
  const levelTitle = `Stage ${pathData.activeLv.level} · ${pathData.activeLv.title}`;
  const pct =
    pathData.activeLv.items.length > 0
      ? Math.round((pathData.activeLvDone / pathData.activeLv.items.length) * 100)
      : 100;

  return (
    <div className="progress-hero" style={{ background: activePalette.grad }}>
      {!syncReady ? (
        <div style={{ padding: '4px 0 8px' }}>
          <SkeletonBar h={11} w="55%" r={6} />
          <SkeletonBar h={22} w="78%" r={8} mt={10} />
          <SkeletonBar h={12} w="45%" r={6} mt={8} />
          <SkeletonBar h={7} w="100%" r={6} mt={14} />
          <SkeletonBar h={54} r={15} mt={16} />
        </div>
      ) : (
        <>
          <div className="progress-hero-eyebrow">
            {st.lc > 0 ? 'Continue Learning' : 'Start Your Journey'}
          </div>
          <div className="progress-hero-title">{lessonName}</div>
          <div className="progress-hero-subtitle">{levelTitle}</div>

          {/* Croatian city journey map */}
          <CityJourney currentLevel={pathData.activeLv.level} activePalette={activePalette} />

          {/* Stage progress bar (compact, under the journey) */}
          <div className="progress-hero-bar-track" style={{ marginBottom: 6 }}>
            <div className="progress-hero-bar-fill" style={{ width: pct + '%' }} />
          </div>
          <div className="progress-hero-count">
            Stage progress: {pathData.activeLvDone} / {pathData.activeLv.items.length} lessons ·{' '}
            {pct}%
          </div>

          {/* Primary CTA */}
          <button
            className="progress-hero-cta"
            onClick={() => {
              if (pathData.nextItem) launchPathItem(pathData.nextItem);
              else setScr('learnpath');
            }}
            style={{ color: activePalette.text }}
          >
            <span style={{ fontSize: 20 }}>▶</span>
            <span>{st.lc > 0 ? 'Continue Learning' : 'Start Learning'}</span>
          </button>

          {/* Practice Now — returning users */}
          {st.lc > 0 && (
            <button
              className="progress-hero-secondary"
              onClick={() => setTab && setTab('practice')}
            >
              <span style={{ fontSize: 14 }}>🎮</span>
              <span>Start Practicing →</span>
            </button>
          )}

          {/* Resume interrupted lesson */}
          {(() => {
            try {
              const r = JSON.parse(localStorage.getItem('nh_lesson_resume') || 'null');
              if (r && r.topic && r.ts && Date.now() - r.ts < 86400000 && resumeLesson) {
                return (
                  <button
                    className="progress-hero-secondary"
                    onClick={resumeLesson}
                    style={{
                      marginTop: 8,
                      borderColor: 'rgba(212,0,45,.4)',
                      background: 'rgba(212,0,45,.12)',
                    }}
                  >
                    <span style={{ fontSize: 14 }}>▶️</span>
                    <span>Resume: {r.topic} lesson →</span>
                  </button>
                );
              }
            } catch (_) {}
            return null;
          })()}

          {/* Resume last activity */}
          {lastActivity && st.lc > 0 && (
            <button
              className="progress-hero-secondary"
              onClick={() => {
                setScr(lastActivity.ex);
                sCurEx(lastActivity.ex);
              }}
              style={{ marginTop: 8 }}
            >
              <span style={{ fontSize: 14 }}>↩️</span>
              <span>Resume: {lastActivity.label} →</span>
            </button>
          )}
        </>
      )}
    </div>
  );
}
