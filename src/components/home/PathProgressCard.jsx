import React from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { useStats } from '../../context/StatsContext.jsx';

const SkeletonBar = ({ w = '100%', h = 16, r = 8, mt = 0 }) => (
  <div style={{width:w, height:h, borderRadius:r, marginTop:mt,
    background:'linear-gradient(90deg, var(--bar-bg) 25%, var(--card-b) 50%, var(--bar-bg) 75%)',
    backgroundSize:'200% 100%', animation:'shimmer 1.4s ease infinite'}} />
);

export default function PathProgressCard({
  activePalette, pathData, syncReady,
  launchPathItem, setTab, resumeLesson,
  lastActivity, sCurEx,
}) {
  const { setScr } = useApp();
  const { stats: st } = useStats();

  const lessonName = pathData.nextItem?.name || pathData.nextItem?.title || 'Learning Path Complete';
  const levelTitle = `Stage ${pathData.activeLv.level} · ${pathData.activeLv.title}`;
  const pct = pathData.activeLv.items.length > 0
    ? Math.round(pathData.activeLvDone / pathData.activeLv.items.length * 100)
    : 100;

  return (
    <div
      className="progress-hero"
      style={{ background: activePalette.grad }}
    >
      {!syncReady ? (
        <div style={{padding:'4px 0 8px'}}>
          <SkeletonBar h={11} w="55%" r={6} />
          <SkeletonBar h={22} w="78%" r={8} mt={10} />
          <SkeletonBar h={12} w="45%" r={6} mt={8} />
          <SkeletonBar h={7}  w="100%" r={6} mt={14} />
          <SkeletonBar h={54} r={15} mt={16} />
        </div>
      ) : (
        <>
          <div className="progress-hero-eyebrow">
            {st.lc > 0 ? 'Continue Learning' : 'Start Your Journey'}
          </div>
          <div className="progress-hero-title">{lessonName}</div>
          <div className="progress-hero-subtitle">{levelTitle}</div>

          {/* Progress bar */}
          <div className="progress-hero-bar-track">
            <div
              className="progress-hero-bar-fill"
              style={{ width: pct + '%' }}
            />
          </div>
          <div className="progress-hero-count">
            Stage progress: {pathData.activeLvDone} / {pathData.activeLv.items.length} lessons
          </div>

          {/* Stage dots — Zeigarnik effect */}
          {pathData.activeLv.items.length > 0 && (
            <div className="progress-hero-dots">
              {pathData.activeLv.items.slice(0, 14).map((item, i) => {
                const done = i < pathData.activeLvDone;
                const isNext = i === pathData.activeLvDone;
                return (
                  <div
                    key={i}
                    className={
                      'progress-hero-dot ' +
                      (done ? 'progress-hero-dot--done' : isNext ? 'progress-hero-dot--active' : 'progress-hero-dot--empty')
                    }
                    style={{ color: done ? activePalette.text : 'rgba(255,255,255,.45)' }}
                    title={item.name}
                  >
                    {done ? '✓' : ''}
                  </div>
                );
              })}
              {pathData.activeLv.items.length > 14 && (
                <div className="progress-hero-dot-more">
                  +{pathData.activeLv.items.length - 14}
                </div>
              )}
            </div>
          )}

          {/* Primary CTA */}
          <button
            className="progress-hero-cta"
            onClick={() => { if (pathData.nextItem) launchPathItem(pathData.nextItem); else setScr('learnpath'); }}
            style={{ color: activePalette.text }}
          >
            <span style={{fontSize:20}}>▶</span>
            <span>{st.lc > 0 ? 'Continue Learning' : 'Start Learning'}</span>
          </button>

          {/* Practice Now — returning users */}
          {st.lc > 0 && (
            <button
              className="progress-hero-secondary"
              onClick={() => setTab && setTab('practice')}
            >
              <span style={{fontSize:14}}>🎮</span>
              <span>Start Practicing →</span>
            </button>
          )}

          {/* Resume interrupted lesson */}
          {(() => {
            try {
              const r = JSON.parse(localStorage.getItem('nh_lesson_resume') || 'null');
              if (r && r.topic && r.ts && (Date.now() - r.ts) < 86400000 && resumeLesson) {
                return (
                  <button
                    className="progress-hero-secondary"
                    onClick={resumeLesson}
                    style={{ marginTop: 8, borderColor: 'rgba(212,0,45,.4)', background: 'rgba(212,0,45,.12)' }}
                  >
                    <span style={{fontSize:14}}>▶️</span>
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
              onClick={() => { setScr(lastActivity.ex); sCurEx(lastActivity.ex); }}
              style={{ marginTop: 8 }}
            >
              <span style={{fontSize:14}}>↩️</span>
              <span>Resume: {lastActivity.label} →</span>
            </button>
          )}
        </>
      )}
    </div>
  );
}
