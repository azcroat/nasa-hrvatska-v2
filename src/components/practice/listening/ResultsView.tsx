import React from 'react';
import WeakWordsPanel from './WeakWordsPanel';
import BonusStoryCard from './BonusStoryCard';
import GradedStoryModal from './GradedStoryModal';
import { EXERCISES } from './exercises';
import type { ListeningQuiz } from './useListeningQuiz';

/** Quiz results screen — score, level-complete banner, weak words, bonus story. */
export default function ResultsView({ quiz }: { quiz: ListeningQuiz }) {
  const {
    score,
    shuffledQuestions,
    selectedLevel,
    isLevelComplete,
    missedQuestions,
    handleAddToFlashcards,
    storyCatalog,
    bonusStory,
    setBonusStory,
    reset,
    setSelectedLevel,
  } = quiz;
  if (!shuffledQuestions) return null;
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
