import React from 'react';
import { getListeningReps } from '../../lib/listeningMetric';
import { getReadingReps } from '../../lib/readingMetric';
import { getProductionReps } from '../../hooks/useDailySession';

/**
 * FluencySnapshot — the unified fluency dashboard (Content-Rec #10).
 *
 * The audit's core finding was that learners over-index on vocabulary and have
 * no read on whether they're building the skills fluency actually requires. The
 * three rep metrics shipped across Recs #6/#1/#2 (production, listening,
 * reading) measure exactly those skills but lived as three scattered cards.
 * This consolidates them into one panel that shows this-week balance across the
 * three fluency-building practice types and nudges the lightest one — turning
 * "I did something" into "I'm practising all the skills, and here's the gap".
 *
 * Pure read-only aggregation of metrics that already exist — no new content,
 * no new persistence.
 */

interface Skill {
  key: string;
  label: string;
  emoji: string;
  screen: string;
  week: number;
  total: number;
  // tiebreak priority when several skills are equally light — output first,
  // since neglected production is the audit's biggest gap.
  priority: number;
}

export default function FluencySnapshot({
  cefr,
  setScr,
  syncedProductionTotal = 0,
}: {
  cefr: string;
  setScr: (screen: string) => void;
  // Production lifetime total is synced cross-device via stats.pr; Math.max with
  // the device-local bucket guards a device whose synced stat hasn't hydrated.
  syncedProductionTotal?: number;
}) {
  const listen = getListeningReps();
  const read = getReadingReps();
  const prod = getProductionReps();
  const prodTotal = Math.max(syncedProductionTotal, prod.total);

  const skills: Skill[] = [
    {
      key: 'speaking',
      label: 'Speaking & Writing',
      emoji: '🗣️',
      screen: 'speaking',
      week: prod.thisWeek,
      total: prodTotal,
      priority: 0,
    },
    {
      key: 'listening',
      label: 'Listening',
      emoji: '🎧',
      screen: 'ai_listening',
      week: listen.thisWeek,
      total: listen.total,
      priority: 1,
    },
    {
      key: 'reading',
      label: 'Reading',
      emoji: '📖',
      screen: 'readlist',
      week: read.thisWeek,
      total: read.total,
      priority: 2,
    },
  ];

  const maxWeek = Math.max(1, ...skills.map((s) => s.week));
  const weekTotal = skills.reduce((sum, s) => sum + s.week, 0);
  // Lightest skill this week (lowest reps; ties → output-first via priority).
  // skills always has three entries, so [0] is defined.
  const focus = [...skills].sort((a, b) => a.week - b.week || a.priority - b.priority)[0]!;

  return (
    <div
      style={{
        background: 'linear-gradient(135deg,#0f172a,#1e293b)',
        borderRadius: 18,
        padding: '18px 18px 16px',
        marginBottom: 16,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 4,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 900,
            color: 'rgba(255,255,255,.5)',
            textTransform: 'uppercase',
            letterSpacing: '.14em',
          }}
        >
          Fluency Snapshot
        </span>
        <span
          style={{
            background: 'rgba(255,255,255,.14)',
            color: '#fff',
            borderRadius: 20,
            padding: '3px 12px',
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          {cefr}
        </span>
      </div>
      <div
        style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', marginBottom: 14, lineHeight: 1.5 }}
      >
        Fluency grows when all skills advance together — not vocabulary alone.
      </div>

      {/* Three skill bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
        {skills.map((s) => (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 16, width: 22, textAlign: 'center' }} aria-hidden="true">
              {s.emoji}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 3,
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'rgba(255,255,255,.85)',
                }}
              >
                <span>{s.label}</span>
                <span style={{ color: 'rgba(255,255,255,.6)' }}>
                  {s.week} this week · {s.total} total
                </span>
              </div>
              <div style={{ height: 6, background: 'rgba(255,255,255,.12)', borderRadius: 3 }}>
                <div
                  style={{
                    width: (s.week / maxWeek) * 100 + '%',
                    height: '100%',
                    background:
                      s.key === focus.key && weekTotal > 0
                        ? 'linear-gradient(90deg,#f59e0b,#fbbf24)'
                        : 'rgba(255,255,255,.85)',
                    borderRadius: 3,
                    transition: 'width .4s ease',
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Focus nudge */}
      <button
        onClick={() => setScr(focus.screen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'rgba(255,255,255,.08)',
          border: '1px solid rgba(255,255,255,.12)',
          borderRadius: 12,
          padding: '11px 14px',
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: "'Outfit',sans-serif",
        }}
      >
        <span style={{ fontSize: 18 }} aria-hidden="true">
          {weekTotal === 0 ? '🚀' : '🎯'}
        </span>
        <span style={{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,.85)', lineHeight: 1.4 }}>
          {weekTotal === 0 ? (
            <>Start a session to build your fluency profile.</>
          ) : (
            <>
              This week your lightest skill is{' '}
              <span style={{ fontWeight: 800, color: '#fbbf24' }}>{focus.label}</span> — give it
              some reps.
            </>
          )}
        </span>
        <span style={{ fontSize: 16, color: 'rgba(255,255,255,.7)' }}>›</span>
      </button>
    </div>
  );
}
