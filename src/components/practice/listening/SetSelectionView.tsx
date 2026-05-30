import React from 'react';
import BonusStoryCard from './BonusStoryCard';
import GradedStoryModal from './GradedStoryModal';
import type { ListeningQuiz } from './useListeningQuiz';

/** Set-selection screen for a chosen level — set list + bonus story. */
export default function SetSelectionView({ quiz }: { quiz: ListeningQuiz }) {
  const {
    selectedLevel,
    levelData,
    getLevelCompletionCount,
    getLevelTotalCount,
    isLevelComplete,
    setSelectedLevel,
    getCompletedQuestions,
    getTotalQuestionsForSet,
    startSet,
    storyCatalog,
    bonusStory,
    setBonusStory,
  } = quiz;
  if (!selectedLevel || !levelData) return null;
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
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.9)', fontWeight: 800 }}>{pct}%</div>
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
