import React, { useEffect } from 'react';
import CroatianKnight from '../shared/CroatianKnight';
import { markPracticed } from '../../hooks/useNotifications';
import { useApp } from '../../context/AppContext';

interface Props {
  activePool: unknown[][];
  known: number;
  missed: unknown[][];
  onGoBack: () => void;
  onStudyMissed: (missed: unknown[][]) => void;
}
export default function FlashcardResultScreen({
  activePool,
  known,
  missed,
  onGoBack,
  onStudyMissed,
}: Props) {
  const { setScr } = useApp();
  // Mark practiced + campaign quest uskrs_q2 ("Practice family vocab") done on first flashcard completion
  useEffect(() => {
    markPracticed();
    try {
      const key = 'nh_cq_easter_uskrs_q2';
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, '1');
        // Notify HomeTab to re-read campaign quest state from localStorage
        window.dispatchEvent(new CustomEvent('nh-campaign-quest-done'));
      }
    } catch (_) {}
  }, []);
  const knownCount = activePool.length - missed.length;
  const missedCount = missed.length;
  const totalFlipped = activePool.length;
  const accuracy = totalFlipped > 0 ? knownCount / totalFlipped : 0;
  let difficultyRec = null;
  if (accuracy < 0.5) {
    difficultyRec = 'Try the basic vocabulary exercises to build your foundation 💪';
  } else if (accuracy >= 0.8) {
    difficultyRec = "You're ready for harder content — try Grammar exercises! 🎯";
  }
  return (
    <div className="scr-wrap">
      <div style={{ textAlign: 'center', padding: '40px 20px 20px' }}>
        <CroatianKnight
          size={80}
          mood={missedCount === 0 ? 'victory' : missedCount <= 2 ? 'encouraged' : 'happy'}
          style={{ margin: '0 auto 12px', display: 'block' }}
        />
        <div style={{ fontSize: 64 }}>{missedCount === 0 ? '🌟' : '🎉'}</div>
        <h3
          style={{
            fontFamily: "'Playfair Display',serif",
            fontSize: 22,
            color: 'var(--heading)',
            marginTop: 12,
          }}
        >
          {missedCount === 0 ? 'Perfect round!' : 'Round complete!'}
        </h3>
        <p style={{ color: 'var(--subtext)', marginTop: 6, fontSize: 14 }}>
          Known: <strong style={{ color: 'var(--success)' }}>{knownCount}</strong>
          {missedCount > 0 && (
            <>
              {' '}
              · Still learning: <strong style={{ color: '#f59e0b' }}>{missedCount}</strong>
            </>
          )}{' '}
          / {activePool.length}
        </p>
        <div
          style={{ fontSize: 'var(--text-2xl)', fontWeight: 900, color: '#fbbf24', marginTop: 8 }}
        >
          +{knownCount * 2 + 5} XP
        </div>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--subtext)', marginTop: 4 }}>
          {missedCount === 0
            ? '🌟 Perfect! Ready for new words.'
            : `${missedCount} card${missedCount !== 1 ? 's' : ''} scheduled for review — check back tomorrow to reinforce them`}
        </div>
        {difficultyRec && (
          <div
            style={{
              marginTop: 16,
              padding: '10px 16px',
              background: accuracy >= 0.8 ? 'rgba(22,163,74,0.08)' : 'rgba(245,158,11,0.08)',
              border: `1px solid ${accuracy >= 0.8 ? 'rgba(22,163,74,0.25)' : 'rgba(245,158,11,0.25)'}`,
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 600,
              color: accuracy >= 0.8 ? 'var(--success)' : '#92400e',
              lineHeight: 1.5,
            }}
          >
            {difficultyRec}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '0 0 20px' }}>
        {/* Primary CTA: always show next lesson path forward */}
        <button className="b bp" style={{ width: '100%' }} onClick={() => setScr('learnpath')}>
          📚 Continue — Next Lesson →
        </button>
        {missed.length > 0 && (
          <button className="b bg" style={{ width: '100%' }} onClick={() => onStudyMissed(missed)}>
            📖 Study {missed.length} missed {missed.length === 1 ? 'card' : 'cards'} again
          </button>
        )}
        <button
          className="b bg"
          style={{ width: '100%', fontSize: 'var(--text-sm)' }}
          onClick={onGoBack}
        >
          ← Back
        </button>
      </div>
    </div>
  );
}
