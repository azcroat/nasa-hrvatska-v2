import React, { useMemo, useRef, useState } from 'react';
import ScreenHeader from '../../shared/ScreenHeader';
import AlkaRing from './AlkaRing';
import AlkaResult from './AlkaResult';
import { useAlkaRide } from './useAlkaRide';
import { selectQuestions } from '../../../lib/gamification/exerciseSource';
import { useStats } from '../../../context/StatsContext';

export default function AlkaScreen({
  goBack,
  award,
}: {
  goBack: () => void;
  award?: (xp: number, celebrate?: boolean, activityType?: string) => void;
}) {
  const { stats } = useStats();
  const questions = useMemo(
    () => selectQuestions({ xp: stats.xp, lc: stats.lc, gc: stats.gc, count: 9 }),
    [stats.xp, stats.lc, stats.gc],
  );
  const ride = useAlkaRide({
    questions,
    // 'vocabulary' is a registered activity type (server rejects unknown types,
    // incl. 'default'); the Alka is a vocabulary MC drill.
    onXp: (xp) => award?.(xp, true, 'vocabulary'),
  });
  const startedAt = useRef<number>(performance.now());
  const [picked, setPicked] = useState<number | null>(null);

  if (questions.length < 9) {
    return (
      <div style={shell}>
        <ScreenHeader title="Alka" goBack={goBack} />
        <p style={{ color: '#fff', padding: 20, textAlign: 'center' }}>
          Not enough exercises available right now. Try again later.
        </p>
      </div>
    );
  }

  if (ride.status === 'result') {
    return (
      <div style={shell}>
        <ScreenHeader title="Sinjska Alka" goBack={goBack} />
        <AlkaResult
          total={ride.total}
          isNewBest={ride.isNewBest}
          previousBest={ride.previousBest}
          onPlayAgain={() => {
            ride.reset();
            startedAt.current = performance.now();
          }}
          onExit={goBack}
        />
      </div>
    );
  }

  const q = ride.current;
  const onPick = (i: number) => {
    setPicked(i);
    const ms = performance.now() - startedAt.current;
    window.setTimeout(() => {
      ride.answer(i, ms);
      setPicked(null);
      startedAt.current = performance.now();
    }, 400);
  };

  return (
    <div style={shell}>
      <ScreenHeader title="Sinjska Alka" goBack={goBack} pill={`Run ${ride.runIndex + 1}/3`} />
      <div style={{ padding: 16, color: '#fff' }}>
        <div
          style={{
            textAlign: 'center',
            fontSize: 10,
            letterSpacing: '.18em',
            textTransform: 'uppercase',
            color: 'rgba(200,152,10,.9)',
            fontWeight: 800,
          }}
        >
          Nišani — Take aim · Sinj, 1715
        </div>
        <AlkaRing aim={ride.aim} />
        <div
          style={{
            textAlign: 'right',
            fontSize: 13,
            fontWeight: 900,
            color: '#FFE070',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {ride.score} {ride.combo > 1 ? `· 🔥×${ride.combo}` : ''}
        </div>
        <div
          style={{
            background: 'rgba(255,255,255,.06)',
            border: '1px solid rgba(255,255,255,.12)',
            borderRadius: 12,
            padding: 14,
            marginTop: 8,
          }}
        >
          <div style={{ color: '#FFE070', fontWeight: 800, fontSize: 16 }}>{q.prompt}</div>
          {q.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => onPick(i)}
              disabled={picked !== null}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                background: picked === i ? 'rgba(34,197,94,.22)' : 'rgba(255,255,255,.07)',
                border: '1px solid rgba(255,255,255,.14)',
                borderRadius: 9,
                padding: '9px 12px',
                marginTop: 8,
                color: '#fff',
                fontSize: 14,
                cursor: picked === null ? 'pointer' : 'default',
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const shell: React.CSSProperties = {
  minHeight: '100vh',
  background: 'linear-gradient(160deg,rgba(6,14,30,.97),rgba(10,35,72,.9) 55%,rgba(12,56,104,.85))',
};
