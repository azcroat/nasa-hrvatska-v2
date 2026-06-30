import React from 'react';
import { H } from '../../data';
import {
  sortScenariosByLevel,
  scenarioFitsLevel,
  shouldShowAdvancedBridge,
} from '../../lib/conversationLevel';

const DIFF_COLORS = { A1: '#dcfce7', A2: '#dbeafe', B1: '#fef3c7', B2: '#fce7f3' };
const DIFF_TEXT = { A1: '#166534', A2: '#1e40af', B1: '#92400e', B2: '#9d174d' };

export default function DialogueScenarioMenu({
  scenarios,
  onSelect,
  userLevel = 'A1',
  onAdvanced,
}: {
  scenarios: any[];
  onSelect: (s: any) => void;
  userLevel?: string;
  // Content-Rec #4: routes B2+ learners to the advanced AIConversation scenarios.
  onAdvanced?: () => void;
}) {
  // Surface level-appropriate scenarios first; stretch ones fall to the end.
  const ordered = sortScenariosByLevel(scenarios, userLevel);
  const showBridge = !!onAdvanced && shouldShowAdvancedBridge(userLevel);

  return (
    <div className="scr-wrap">
      {H('💬 Dialogue Simulator', 'Real conversations, real Croatian', undefined)}

      {/* Content-Rec #4: bridge to the advanced (B2–C2) AIConversation scenarios.
          The guided scenarios below top out at B1; this routes learners who are
          ready into job interviews, debates, business and cultural conversations. */}
      {showBridge && (
        <button
          onClick={onAdvanced}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'linear-gradient(135deg,#0e7490,#155e75)',
            border: 'none',
            borderRadius: 14,
            padding: '14px 16px',
            marginBottom: 16,
            cursor: 'pointer',
            textAlign: 'left',
            fontFamily: "'Outfit',sans-serif",
          }}
        >
          <span style={{ fontSize: 26 }} aria-hidden="true">
            🎙️
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>
              Advanced Conversations (B2+)
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.8)', marginTop: 2 }}>
              Job interviews, debates, business &amp; culture — open-ended AI chat
            </div>
          </div>
          <span style={{ fontSize: 18, color: 'rgba(255,255,255,.85)' }}>›</span>
        </button>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {ordered.map((s: any) => {
          const stretch = !scenarioFitsLevel(s.difficulty, userLevel);
          return (
            <button
              key={s.id}
              className="tc"
              onClick={() => onSelect(s)}
              style={{ textAlign: 'left', padding: '14px', position: 'relative' }}
            >
              <div style={{ fontSize: 24, marginBottom: 6 }}>{s.title.split(' ')[0]}</div>
              <div
                style={{ fontSize: 13, fontWeight: 800, color: 'var(--heading)', lineHeight: 1.3 }}
              >
                {s.title.slice(2)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--subtext)', marginTop: 4 }}>
                {s.subtitle}
              </div>
              {s.difficulty && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                  <span
                    style={{
                      display: 'inline-block',
                      fontSize: 10,
                      fontWeight: 800,
                      background:
                        (DIFF_COLORS as Record<string, string>)[s.difficulty] || '#f3f4f6',
                      color: (DIFF_TEXT as Record<string, string>)[s.difficulty] || '#374151',
                      borderRadius: 6,
                      padding: '2px 7px',
                      letterSpacing: '.04em',
                    }}
                  >
                    {s.difficulty}
                  </span>
                  {stretch && (
                    <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--subtext)' }}>
                      ↑ stretch
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
