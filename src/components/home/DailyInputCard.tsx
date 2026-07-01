import React from 'react';
import { getDailyInput, markDailyInput, type InputKind } from '../../lib/dailyInput';

/**
 * DailyInputCard — the comprehensible-input spine on the Home tab (Content-Rec
 * #6). Surfaces the learner's next level-appropriate listening + reading in one
 * place so a daily dose of understandable Croatian is a first-class habit. Each
 * row opens the matching surface, where the existing recommended-next banner
 * (listening #1 / reading #2) takes over. Presentational; all "what's next"
 * logic lives in lib/dailyInput + the two curricula.
 */
interface StatsLike {
  xp?: number;
  lc?: number;
  gc?: number;
  vs?: unknown;
}

export default function DailyInputCard({
  stats,
  setScr,
  sCurEx,
}: {
  stats: StatsLike;
  setScr: (screen: string) => void;
  sCurEx?: (id: string) => void;
}) {
  const input = getDailyInput(stats);

  function open(kind: InputKind, screen: string) {
    markDailyInput(kind);
    if (sCurEx) sCurEx(screen);
    setScr(screen);
  }

  const rows: Array<{
    kind: InputKind;
    screen: string;
    emoji: string;
    label: string;
    title: string;
    subtitle: string;
    doneToday: boolean;
    testid: string;
  }> = [
    {
      kind: 'listening',
      screen: 'ai_listening',
      emoji: '🎧',
      label: 'Listen',
      title: input.listening.title,
      subtitle: input.listening.subtitle,
      doneToday: input.listening.doneToday,
      testid: 'daily-input-listening',
    },
    {
      kind: 'reading',
      screen: 'readlist',
      emoji: '📖',
      label: 'Read',
      title: input.reading.title,
      subtitle: input.reading.subtitle,
      doneToday: input.reading.doneToday,
      testid: 'daily-input-reading',
    },
  ];

  return (
    <div
      data-testid="daily-input-card"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--card-b)',
        borderRadius: 16,
        padding: '16px',
        marginBottom: 16,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 4,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--heading)' }}>
          🌱 Today&apos;s Input
        </div>
        <span
          style={{
            background: 'var(--info-bg,#e0f2fe)',
            color: 'var(--info,#0284c7)',
            borderRadius: 20,
            padding: '2px 10px',
            fontSize: 11,
            fontWeight: 800,
          }}
        >
          {input.level}
        </span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--subtext)', marginBottom: 12, lineHeight: 1.4 }}>
        A daily dose of Croatian you can mostly understand — the fastest path to fluency.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.map((r) => (
          <button
            key={r.kind}
            data-testid={r.testid}
            onClick={() => open(r.kind, r.screen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              width: '100%',
              textAlign: 'left',
              background: 'var(--bg, #fafafa)',
              border: '1px solid var(--card-b)',
              borderRadius: 12,
              padding: '11px 13px',
              cursor: 'pointer',
              fontFamily: "'Outfit',sans-serif",
            }}
          >
            <span style={{ fontSize: 22, flexShrink: 0 }} aria-hidden="true">
              {r.emoji}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: 'var(--info,#0284c7)',
                  textTransform: 'uppercase',
                  letterSpacing: '.08em',
                }}
              >
                {r.label}
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--heading)',
                  lineHeight: 1.25,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {r.title}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--subtext)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {r.subtitle}
              </div>
            </div>
            <span
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: r.doneToday ? 'var(--success,#16a34a)' : 'var(--subtext)',
                flexShrink: 0,
              }}
            >
              {r.doneToday ? '✓' : '›'}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
