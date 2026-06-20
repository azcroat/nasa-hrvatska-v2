import React, { useEffect } from 'react';
import CharacterPortrait from '../family/CharacterPortrait';
import { signalSessionCompleteIfActive } from '../../lib/sessionSignal';

interface Props {
  onGoBack: () => void;
}
export default function FlashcardEmptyState({ onGoBack }: Props) {
  // Empty state means no cards to study — fire the daily-session completion
  // signal so the Today's Session card doesn't strand here. No-op when the
  // user reached this screen outside of a daily session.
  useEffect(() => {
    signalSessionCompleteIfActive('flashcards');
  }, []);
  return (
    <div className="scr-wrap">
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <CharacterPortrait name="kovac" size={90} />
        </div>
        <div style={{ fontSize: 52 }}>🎉</div>
        <h3
          style={{
            fontFamily: "'Playfair Display',serif",
            fontSize: 22,
            color: 'var(--heading)',
            marginTop: 12,
          }}
        >
          All caught up!
        </h3>
        <p
          style={{
            color: 'var(--subtext)',
            marginTop: 8,
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          No more cards due right now.
          <br />
          Come back tomorrow for your next review session.
        </p>
        <button className="b bp" style={{ marginTop: 20, width: '100%' }} onClick={onGoBack}>
          Continue →
        </button>
      </div>
    </div>
  );
}
