import React, { useRef } from 'react';
import type { AwardActivityType } from '../../types/index.js';

interface DebriefData {
  summary?: string;
  strength?: string;
  nextStep?: string;
  durationSecs: number;
  xpEarned?: number;
}

interface Props {
  goBack: () => void;
  debrief: DebriefData;
  turnCount: number;
  topic: string;
  award?: (xp: number, celebrate?: boolean, activityType?: AwardActivityType) => void;
  onPracticeAgain: () => void;
}

export default function LiveTutorDebrief({
  goBack,
  debrief,
  turnCount,
  topic,
  award,
  onPracticeAgain,
}: Props) {
  const awardFired = useRef<boolean>(false);
  const fmtDur = (s: number) => `${Math.floor(s / 60)}m ${s % 60}s`;
  const xpEarned = debrief.xpEarned ?? 30;

  return (
    <div className="c" style={{ minHeight: '100vh', paddingBottom: 40 }}>
      <div style={{ padding: '16px 16px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={goBack}
          className="b bp"
          style={{ padding: '8px 14px', fontSize: 'var(--text-sm)', fontWeight: 700 }}
        >
          ← Back
        </button>
      </div>
      <div style={{ padding: '0 16px', animation: 'lt-debrief-pop 0.5s ease-out both' }}>
        {/* Confetti row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 8,
            fontSize: 22,
            margin: '20px 0 8px',
            height: 50,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {['🎉', '🌟', '🗣️', '✨', '🎊', '💫', '🇭🇷', '🎈'].map((e, i) => (
            <span
              key={i}
              style={{
                display: 'inline-block',
                animation: `maja-confetti-fall 1.8s ease-in ${(i * 0.18).toFixed(2)}s both`,
              }}
            >
              {e}
            </span>
          ))}
        </div>

        <h2
          style={{
            textAlign: 'center',
            fontSize: 22,
            fontWeight: 800,
            color: 'var(--heading)',
            margin: '0 0 4px',
          }}
        >
          Session Complete!
        </h2>
        <p
          style={{ textAlign: 'center', color: 'var(--subtext)', fontSize: 13, margin: '0 0 20px' }}
        >
          {fmtDur(debrief.durationSecs)} · {turnCount} turns · {topic}
        </p>

        {/* Marija's personal note */}
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--card-b)',
            borderLeft: '3px solid #D4002D',
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'rgba(212,0,45,.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              flexShrink: 0,
            }}
          >
            👩‍🏫
          </div>
          <p
            style={{
              fontSize: 14,
              fontStyle: 'italic',
              lineHeight: 1.6,
              color: 'var(--heading)',
              margin: 0,
            }}
          >
            {debrief.summary}
          </p>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {[
            { label: 'Turns', value: turnCount },
            { label: 'Minutes', value: Math.ceil(debrief.durationSecs / 60) },
            { label: 'XP', value: `+${xpEarned}` },
          ].map(({ label, value }) => (
            <div
              key={label}
              style={{
                flex: 1,
                background: 'var(--card)',
                border: '1px solid var(--card-b)',
                borderRadius: 10,
                padding: '10px 6px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--heading)' }}>{value}</div>
              <div style={{ fontSize: 11, color: 'var(--subtext)', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Strength */}
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--card-b)',
            borderLeft: '3px solid #16a34a',
            borderRadius: 12,
            padding: '12px 16px',
            marginBottom: 10,
          }}
        >
          <p style={{ margin: 0, fontSize: 14, color: 'var(--heading)', lineHeight: 1.5 }}>
            ✅ {debrief.strength}
          </p>
        </div>

        {/* Next step */}
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--card-b)',
            borderLeft: '3px solid #b45309',
            borderRadius: 12,
            padding: '12px 16px',
            marginBottom: 20,
          }}
        >
          <p style={{ margin: 0, fontSize: 14, color: 'var(--heading)', lineHeight: 1.5 }}>
            🎯 {debrief.nextStep}
          </p>
        </div>

        {/* CTA */}
        <button
          onClick={() => {
            if (!awardFired.current) {
              awardFired.current = true;
              if (award) award(xpEarned, false, 'speaking');
            }
            goBack();
          }}
          style={{
            width: '100%',
            height: 52,
            borderRadius: 12,
            background: '#D4002D',
            color: '#fff',
            border: 'none',
            fontSize: 16,
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          +{xpEarned} XP · Back to App
        </button>
        <button
          onClick={onPracticeAgain}
          style={{
            width: '100%',
            height: 48,
            borderRadius: 12,
            background: 'transparent',
            color: 'var(--heading)',
            border: '1px solid var(--card-b)',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            marginTop: 10,
          }}
        >
          Practice Again
        </button>
      </div>
    </div>
  );
}
