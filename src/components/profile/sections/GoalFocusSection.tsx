import React from 'react';
import { sh } from '../../../data';

/**
 * Goal Focus cluster — extracted verbatim from SettingsTab as part of the 1a
 * decomposition. Two mutually-exclusive blocks gated on the user's goal:
 *   • Goal Focus grid — shortcut tiles for the active goal (heritage/family/
 *     travel/culture/fluent). Renders only when GOAL_FOCUS has the goal.
 *   • Partner Goal Card — static encouragement card shown when the goal is
 *     'partner' (which is intentionally NOT a GOAL_FOCUS key, so the grid above
 *     returns null in that case).
 * Behavior-identical to the prior inline blocks. The GOAL_FOCUS table lives here
 * because this section is its only consumer.
 */
const GOAL_FOCUS = {
  heritage: {
    label: 'Heritage & Roots',
    icon: '🇭🇷',
    color: 'var(--warning)',
    bg: 'var(--warning-bg)',
    border: 'var(--warning-b)',
    items: [
      { icon: '🏛️', label: 'Croatian History', scr: 'history' },
      { icon: '🌟', label: 'Proverbs', scr: 'proverbs' },
      { icon: '📖', label: 'Reading', scr: 'readlist' },
    ],
  },
  family: {
    label: 'Speaking with Family',
    icon: '👨‍👩‍👧',
    color: 'var(--info)',
    bg: 'var(--info-bg)',
    border: 'var(--info-b)',
    items: [
      { icon: '🃏', label: 'Family Words', scr: 'flashcards', launch: 'flashcards_family' },
      { icon: '🎤', label: 'Speaking', scr: 'speaking', launch: 'speaking_family' },
      { icon: '💬', label: 'Dialogue Sim', scr: 'dialogue' },
    ],
  },
  travel: {
    label: 'Traveling to Croatia',
    icon: '✈️',
    color: 'var(--success)',
    bg: 'var(--success-bg)',
    border: 'var(--success-b)',
    items: [
      { icon: '🍽️', label: 'Restaurant', scr: 'restaurant' },
      { icon: '🚗', label: 'Transport', scr: 'transport' },
      { icon: '🚨', label: 'Emergency', scr: 'emergency' },
    ],
  },
  culture: {
    label: 'Croatian Culture',
    icon: '📖',
    color: 'var(--lavender)',
    bg: 'rgba(124,58,237,.1)',
    border: 'rgba(124,58,237,.25)',
    items: [{ icon: '🌊', label: 'Immersion', scr: 'immersion' }],
  },
  fluent: {
    label: 'Becoming Fluent',
    icon: '🗣️',
    color: 'var(--info)',
    bg: 'var(--info-bg)',
    border: 'var(--info-b)',
    items: [
      { icon: '🎓', label: 'CEFR Test', scr: 'cefrtest' },
      { icon: '💬', label: 'Dialogue Sim', scr: 'dialogue' },
      { icon: '🗣️', label: 'Shadowing', scr: 'shadowing' },
    ],
  },
};

export default function GoalFocusSection({
  currentGoal,
  V,
  setScr,
  launchFlashcards,
  launchSpeaking,
}: {
  currentGoal: string;
  V: Record<string, any[]>;
  setScr: (scr: string) => void;
  launchFlashcards?: (pool: any[]) => void;
  launchSpeaking?: (pool: any[]) => void;
}) {
  return (
    <React.Fragment>
      {/* ── GOAL FOCUS ── */}
      {currentGoal &&
        (() => {
          const gf = GOAL_FOCUS[currentGoal as keyof typeof GOAL_FOCUS];
          if (!gf) return null;
          return (
            <React.Fragment>
              <div className="section-hdr">
                <div
                  className="section-hdr-icon"
                  style={{ background: gf.bg, border: `1px solid ${gf.border}` }}
                >
                  {gf.icon}
                </div>
                <div className="section-hdr-text">
                  <div className="section-hdr-title">Goal Focus</div>
                  <div className="section-hdr-sub">{gf.label}</div>
                </div>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: 8,
                  marginBottom: 20,
                }}
              >
                {gf.items.map(
                  (it: { icon: string; label: string; scr: string; launch?: string }) => {
                    function handleGoalItem() {
                      if (it.launch === 'flashcards_family') {
                        const pool = sh([...(V['family'] || [])]).slice(0, 20);
                        if (pool.length > 0 && launchFlashcards) launchFlashcards(pool);
                        else setScr('review');
                      } else if (it.launch === 'speaking_family') {
                        const pool = sh([...(V['family'] || [])]).slice(0, 6);
                        if (pool.length > 0 && launchSpeaking) launchSpeaking(pool);
                        // Fallback to speaking_sprint removed — that surface
                        // is now only launchable from the AI Tutor tab.
                      } else {
                        setScr(it.scr);
                      }
                    }
                    return (
                      <button
                        key={it.scr}
                        onClick={handleGoalItem}
                        className="tc"
                        style={{
                          background: gf.bg,
                          border: `1.5px solid ${gf.border}`,
                          padding: '14px 8px',
                          textAlign: 'center',
                          cursor: 'pointer',
                          fontFamily: "'Outfit',sans-serif",
                        }}
                      >
                        <div style={{ fontSize: 'var(--text-xl)', marginBottom: 4 }}>{it.icon}</div>
                        <div
                          style={{
                            fontSize: 'var(--text-xs)',
                            fontWeight: 700,
                            color: gf.color,
                            lineHeight: 1.2,
                          }}
                        >
                          {it.label}
                        </div>
                      </button>
                    );
                  },
                )}
              </div>
            </React.Fragment>
          );
        })()}

      {/* ── PARTNER GOAL CARD ── */}
      {localStorage.getItem('nh_goal') === 'partner' && (
        <div
          style={{
            background: 'linear-gradient(135deg,rgba(249,168,37,.1),rgba(14,116,144,.08))',
            border: '1.5px solid rgba(249,168,37,.3)',
            borderRadius: 16,
            padding: '16px 18px',
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: 'var(--text-base)',
              fontWeight: 900,
              color: 'var(--heading)',
              marginBottom: 6,
            }}
          >
            💑 Learning for your partner
          </div>
          <div
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--subtext)',
              lineHeight: 1.6,
              marginBottom: 12,
            }}
          >
            You're learning Croatian because someone special is Croatian. That's the most powerful
            motivation there is.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              '✓ Learn in-law vocabulary (Svekrva, punac, šogor)',
              '✓ Master the Imendan tradition (see below)',
              '✓ Practice "Survival at the Table" phrases',
              '✓ Say Živjeli! at the right moment',
            ].map((tip, i) => (
              <div
                key={i}
                style={{ fontSize: 'var(--text-sm)', color: 'var(--subtext)', fontWeight: 600 }}
              >
                {tip}
              </div>
            ))}
          </div>
        </div>
      )}
    </React.Fragment>
  );
}
