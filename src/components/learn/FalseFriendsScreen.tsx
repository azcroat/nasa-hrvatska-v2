import React, { useRef } from 'react';
import { H, speak } from '../../data';
import { FALSEFR } from '../../data';
import { useStats } from '../../context/StatsContext.tsx';
import { markQuest } from '../../lib/quests.js';

interface Props {
  goBack: () => void;
  award?: (xp: number, celebrate?: boolean, activityType?: string) => void;
}
function FalseFriendsScreen({ goBack, award }: Props) {
  const { stats, setStats, writeDelta } = useStats();
  const completed = useRef(false);

  function handleComplete() {
    if (completed.current) return;
    completed.current = true;
    if (award) award(30, false, 'vocabulary');
    markQuest('vocab');
    // Replicate what the 20s dwell timer would do — grant LC credit so
    // the LearnPath ck(s.lc>=20) check can pass without waiting for dwell.
    if (!stats.vs?.includes('falsefr')) {
      setStats((prev) => {
        if (prev.vs?.includes('falsefr')) return prev;
        return { ...prev, lc: (prev.lc || 0) + 1, vs: [...(prev.vs || []), 'falsefr'] };
      });
      if (writeDelta) writeDelta({ lc: 1, vs: ['falsefr'] });
    }
    goBack();
  }

  return (
    <div className="scr-wrap">
      {H('⚠️ False Friends', 'Croatian words that trick English speakers', goBack)}
      {FALSEFR.map(function (f, i) {
        return (
          <button
            key={i}
            aria-label={`Play audio for ${f.hr}`}
            className="c"
            style={{ marginBottom: 10 }}
            onClick={function () {
              speak(f.hr);
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#dc2626' }}>
                {f.hr} <span aria-hidden="true">🔊</span>
              </span>
              <span style={{ fontSize: 14, color: '#78716c' }}>
                {'Looks like: '}
                {f.looks}
              </span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#16a34a', marginTop: 4 }}>
              {'Actually means: '}
              {f.means}
            </div>
            {f.ex && (
              <div
                style={{ fontSize: 12, color: 'var(--subtext)', fontStyle: 'italic', marginTop: 2 }}
              >
                {f.ex}
              </div>
            )}
          </button>
        );
      })}

      <button
        onClick={handleComplete}
        style={{
          width: '100%',
          marginTop: 16,
          padding: '14px 0',
          background: 'linear-gradient(135deg,#0e7490,#164e63)',
          color: 'white',
          border: 'none',
          borderRadius: 14,
          fontSize: 16,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        {'Complete Lesson  +30 XP'}
      </button>
    </div>
  );
}

export default FalseFriendsScreen;
