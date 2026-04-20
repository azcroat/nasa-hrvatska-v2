// @ts-nocheck
import React, { useMemo } from 'react';
import { getStreak, getSR } from '../../data';
import { getStyleLabel, getStylePreferences } from '../../lib/learnerStyle.js';
import { useApp } from '../../context/AppContext';
import { useStats } from '../../context/StatsContext';
import XPActivityCalendar from './XPActivityCalendar';
import SkillRadar from './SkillRadar';

function getCEFR(xp, lc, gc) {
  const total = xp + lc * 15 + gc * 25;
  if (total < 300)
    return { level: 'A1', label: 'Beginner', color: 'var(--success)', next: 'A2', needed: 300 };
  if (total < 1200)
    return { level: 'A2', label: 'Elementary', color: 'var(--success)', next: 'B1', needed: 1200 };
  if (total < 3500)
    return {
      level: 'B1',
      label: 'Intermediate',
      color: 'var(--warning)',
      next: 'B2',
      needed: 3500,
    };
  if (total < 8000)
    return { level: 'B2', label: 'Upper-Int.', color: 'var(--warning)', next: 'C1', needed: 8000 };
  if (total < 18000)
    return { level: 'C1', label: 'Advanced', color: 'var(--info)', next: 'C2', needed: 18000 };
  return { level: 'C2', label: 'Mastery', color: 'var(--lavender)', next: null, needed: null };
}

function getWordsLearned() {
  try {
    const sr = JSON.parse(localStorage.getItem('nh_sr') || '{}');
    return Object.values(sr).filter((v) => v && v.r > 0).length;
  } catch (_) {
    return 0;
  }
}

const STAGE_CEFR = ['A1', 'A2', 'B1', 'B1+', 'B2+', 'C1'];
const STAGE_NAMES_PROFILE = ['Survivor', 'Settler', 'Communicator', 'Explorer', 'Hrvat!'];

export default function StatsTab({ onShowPrestigeModal, onSyncNow }) {
  const { favs, setScr } = useApp();
  const { stats: st } = useStats();

  const prestigeLevel = parseInt(localStorage.getItem('nh_prestige') || '0', 10);

  const streak = useMemo(() => getStreak(), [st]);
  const sr = useMemo(() => getSR(), [st]);
  const mastered = useMemo(
    () => Object.values(sr).filter((v) => v.r > v.w && v.r >= 2).length,
    [sr],
  );

  const stats = useMemo(
    () => [
      {
        icon: '⭐',
        value: st.xp.toLocaleString(),
        label: 'Total XP',
        color: 'var(--info)',
        bg: 'var(--info-bg)',
        border: 'var(--info-b)',
      },
      {
        icon: '🔥',
        value: streak.count,
        label: 'Day Streak',
        color: 'var(--warning)',
        bg: 'var(--warning-bg)',
        border: 'var(--warning-b)',
      },
      {
        icon: '📚',
        value: st.lc,
        label: 'Lessons',
        color: 'var(--success)',
        bg: 'var(--success-bg)',
        border: 'var(--success-b)',
      },
      {
        icon: '📝',
        value: st.gc,
        label: 'Grammar',
        color: 'var(--lavender)',
        bg: 'rgba(124,58,237,.1)',
        border: 'rgba(124,58,237,.25)',
      },
      {
        icon: '💪',
        value: mastered,
        label: 'Mastered',
        color: 'var(--error)',
        bg: 'var(--error-bg)',
        border: 'var(--error-b)',
      },
      {
        icon: '🏆',
        value: (st.badges || []).length,
        label: 'Badges',
        color: 'var(--warning)',
        bg: 'var(--warning-bg)',
        border: 'var(--warning-b)',
      },
    ],
    [st, streak.count, mastered],
  );

  const styleLabel = useMemo(() => getStyleLabel(), []);
  const stylePrefs = useMemo(() => getStylePreferences(), []);

  return (
    <React.Fragment>
      {/* ── 12-WEEK ACTIVITY CALENDAR ── */}
      <XPActivityCalendar st={st} />

      {/* ── SKILL RADAR CHART ── */}
      <SkillRadar st={st} />

      {/* ── STATS GRID ── */}
      <div
        role="region"
        aria-label="Your statistics"
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 24 }}
      >
        {stats.map((s, i) => {
          const bgs = [
            'linear-gradient(145deg,rgba(14,116,144,.16) 0%,rgba(14,116,144,.05) 100%)',
            'linear-gradient(145deg,rgba(245,158,11,.18) 0%,rgba(212,0,48,.07) 100%)',
            'linear-gradient(145deg,rgba(22,163,74,.16) 0%,rgba(22,163,74,.04) 100%)',
            'linear-gradient(145deg,rgba(124,58,237,.16) 0%,rgba(124,58,237,.04) 100%)',
            'linear-gradient(145deg,rgba(2,132,199,.16) 0%,rgba(0,61,165,.06) 100%)',
            'linear-gradient(145deg,rgba(245,158,11,.18) 0%,rgba(180,83,9,.06) 100%)',
          ];
          const accents = ['#0e7490', '#d97706', '#16a34a', '#7c3aed', '#0284c7', '#f59e0b'];
          const valueGrads = [
            'linear-gradient(135deg,#0e7490,#06b6d4)',
            'linear-gradient(135deg,#ea580c,#f59e0b)',
            'linear-gradient(135deg,#16a34a,#22c55e)',
            'linear-gradient(135deg,#7c3aed,#a78bfa)',
            'linear-gradient(135deg,#0284c7,#38bdf8)',
            'linear-gradient(135deg,#b45309,#f59e0b)',
          ];
          return (
            <div
              key={i}
              aria-label={`${s.value} ${s.label}`}
              className="stat-card-v3"
              style={/** @type {any} */ { background: bgs[i], '--stat-accent': accents[i] }}
            >
              <span className="stat-icon">{s.icon}</span>
              {s.label === 'Day Streak' ? (
                <div
                  style={{
                    fontSize: 26,
                    fontWeight: 900,
                    lineHeight: 1,
                    fontVariantNumeric: 'tabular-nums',
                    background: valueGrads[i],
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {s.value} 🔥
                </div>
              ) : (
                <div
                  style={{
                    fontSize: 26,
                    fontWeight: 900,
                    lineHeight: 1,
                    fontVariantNumeric: 'tabular-nums',
                    background: valueGrads[i],
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {s.value}
                </div>
              )}
              <div className="stat-label">{s.label}</div>
              {s.label === 'Total XP' && (
                <div className="stat-sub">
                  {st.xp >= 5000 ? '🚀 Near B1!' : st.xp >= 2000 ? '📈 Momentum!' : '⭐ Keep going'}
                </div>
              )}
              {s.label === 'Day Streak' && (
                <div className="stat-sub" style={{ color: '#d97706' }}>
                  {streak.count >= 30
                    ? 'Legendary!'
                    : streak.count >= 7
                      ? 'Crushing it!'
                      : 'Keep going!'}
                </div>
              )}
              {s.label === 'Lessons' && (
                <div className="stat-sub">{st.lc >= 50 ? '🏆 Dedicated!' : '📚 Keep learning'}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── LEARNING STYLE ── */}
      {styleLabel && (
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--card-b)',
            borderRadius: 12,
            padding: '12px 14px',
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span style={{ fontSize: 24 }}>🧠</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text)' }}>{styleLabel}</div>
            <div style={{ fontSize: 11, color: 'var(--text-2)' }}>
              Based on {stylePrefs?.dataPoints || 0} sessions
              {stylePrefs?.preferredTypes?.[0] ? ` · Loves ${stylePrefs.preferredTypes[0]}` : ''}
            </div>
          </div>
        </div>
      )}

      {/* ── CEFR ESTIMATE ── */}
      {(() => {
        const cefr = getCEFR(st.xp || 0, st.lc || 0, st.gc || 0);
        const wordsLearned = getWordsLearned();
        const cefrScore = (st.xp || 0) + (st.lc || 0) * 15 + (st.gc || 0) * 25;
        const progress = cefr.needed
          ? Math.min(100, Math.round((cefrScore / cefr.needed) * 100))
          : 100;
        // Derive which Learn Path stage matches the current CEFR level so both displays agree.
        const CEFR_TO_STAGE_IDX = { A1: 0, A2: 1, B1: 2, B2: 3, C1: 4, C2: 4 };
        const cefrStageIdx = CEFR_TO_STAGE_IDX[cefr.level] ?? 0;
        return (
          <>
            <div
              style={{
                background: 'var(--card)',
                border: '1.5px solid var(--card-b)',
                borderRadius: 18,
                padding: '18px',
                marginBottom: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    background: cefr.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{ fontSize: 'var(--text-xl)', fontWeight: 900, color: 'var(--card)' }}
                  >
                    {cefr.level}
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{ fontSize: 'var(--text-lg)', fontWeight: 900, color: 'var(--heading)' }}
                  >
                    CEFR Level: {cefr.level}
                  </div>
                  <div
                    style={{ fontSize: 'var(--text-sm)', color: 'var(--subtext)', fontWeight: 600 }}
                  >
                    {cefr.label}
                    {prestigeLevel > 0 ? ` · ${'✦'.repeat(prestigeLevel)} Prestige` : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 'var(--text-xl)', fontWeight: 900, color: cefr.color }}>
                    {wordsLearned}
                  </div>
                  <div
                    style={{ fontSize: 'var(--text-xs)', color: 'var(--subtext)', fontWeight: 700 }}
                  >
                    words
                  </div>
                </div>
              </div>
              {cefr.needed && (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--subtext)',
                      marginBottom: 4,
                      fontWeight: 600,
                    }}
                  >
                    <span>{cefr.level}</span>
                    <span>→ {cefr.next}</span>
                  </div>
                  <div
                    style={{
                      height: 8,
                      borderRadius: 4,
                      background: 'var(--bar-bg)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        borderRadius: 4,
                        background: cefr.color,
                        width: `${progress}%`,
                        transition: 'width .4s ease',
                      }}
                    />
                  </div>
                  <div
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--subtext)',
                      marginTop: 4,
                      fontWeight: 600,
                    }}
                  >
                    {progress}% to {cefr.next}
                  </div>
                </div>
              )}
            </div>

            {/* ── LEARN PATH STAGE OVERVIEW — driven by same CEFR level as above ── */}
            <h3 className="sh" style={{ marginTop: 8 }}>
              Learn Path
            </h3>
            <div
              style={{
                background: 'var(--card)',
                border: '1.5px solid var(--card-b)',
                borderRadius: 18,
                padding: '16px 18px',
                marginBottom: 16,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {STAGE_NAMES_PROFILE.map((stageName, i) => {
                  const isActive = i === cefrStageIdx;
                  const isDone = i < cefrStageIdx;
                  return (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                      }}
                    >
                      <span
                        style={{ fontSize: 'var(--text-lg)', opacity: i > cefrStageIdx ? 0.35 : 1 }}
                      >
                        {isDone ? '✅' : isActive ? '▶️' : '⬜'}
                      </span>
                      <span
                        style={{
                          fontSize: 'var(--text-sm)',
                          fontWeight: isActive ? 800 : 600,
                          color: isActive ? 'var(--heading)' : 'var(--subtext)',
                        }}
                      >
                        Stage {i + 1}: {stageName}
                      </span>
                      <span
                        style={{
                          fontSize: 'var(--text-xs)',
                          fontWeight: 800,
                          background: isActive
                            ? cefr.level === 'A1' || cefr.level === 'A2'
                              ? 'var(--warning-dark,#92400e)'
                              : cefr.level === 'B2'
                                ? '#14532d'
                                : cefr.color
                            : 'var(--info-bg)',
                          color: isActive ? '#fff' : 'var(--info)',
                          borderRadius: 4,
                          padding: '1px 4px',
                          marginLeft: 6,
                        }}
                      >
                        {STAGE_CEFR[i]}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Stage 6 teaser — show when user has reached Stage 5 (Hrvat / C1) */}
              {cefrStageIdx >= 4 && (
                <div
                  style={{
                    background: 'var(--info-bg)',
                    border: '1.5px dashed var(--card-b)',
                    borderRadius: 14,
                    padding: '14px 16px',
                    marginTop: 10,
                    opacity: 0.75,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 'var(--text-2xl)' }}>🔒</span>
                    <div>
                      <div
                        style={{
                          fontSize: 'var(--text-sm)',
                          fontWeight: 800,
                          color: 'var(--heading)',
                        }}
                      >
                        Stage 6: Naš Čovjek
                        <span
                          style={{
                            fontSize: 'var(--text-xs)',
                            fontWeight: 800,
                            background: 'var(--info-bg)',
                            color: 'var(--info)',
                            borderRadius: 4,
                            padding: '1px 4px',
                            marginLeft: 6,
                          }}
                        >
                          {STAGE_CEFR[5]}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: 'var(--text-xs)',
                          color: 'var(--subtext)',
                          marginTop: 2,
                        }}
                      >
                        Advanced fluency — Shadowing, Pitch Accent, Bureaucratic Croatian, Formal
                        Register
                      </div>
                    </div>
                  </div>
                  <div
                    style={{ marginTop: 8, fontSize: 'var(--text-xs)', color: 'var(--subtext)' }}
                  >
                    Advanced content available now in Practice → Shadowing, Pitch Accent, and Formal
                    Register drills.
                  </div>
                </div>
              )}
            </div>
          </>
        );
      })()}

      {/* ── PRESTIGE ── */}
      {(st.lc || 0) >= 30 && (
        <div
          style={{
            background: 'var(--card)',
            border: '1.5px solid var(--card-b)',
            borderRadius: 18,
            padding: '18px',
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: prestigeLevel > 0 ? 12 : 0,
            }}
          >
            <div style={{ fontSize: 'var(--text-3xl)' }}>{prestigeLevel > 0 ? '✦' : '🏆'}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 'var(--text-md)', fontWeight: 900, color: 'var(--heading)' }}>
                {prestigeLevel > 0
                  ? `Prestige ${prestigeLevel} — ${'✦'.repeat(prestigeLevel)}`
                  : 'Ready to Prestige?'}
              </div>
              <div
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--subtext)',
                  fontWeight: 500,
                  lineHeight: 1.5,
                  marginTop: 2,
                }}
              >
                {prestigeLevel > 0
                  ? 'You have prestiged. Your dedication to Croatian is legendary.'
                  : 'Reset your XP counter and earn the ✦ Prestige badge — wear it as a mark of dedication. Stage 6 "Naš Čovjek" is in development and will be unlocked for prestige members first.'}
              </div>
            </div>
          </div>
          {prestigeLevel === 0 && (
            <button
              onClick={onShowPrestigeModal}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 12,
                border: 'none',
                cursor: 'pointer',
                background: 'linear-gradient(135deg,var(--lavender, #7c3aed),#4c1d95)',
                color: 'var(--card)',
                fontWeight: 800,
                fontSize: 'var(--text-base)',
                fontFamily: "'Outfit',sans-serif",
                marginTop: 12,
              }}
            >
              ✦ Prestige Now
            </button>
          )}
        </div>
      )}

      {/* ── MY COLLECTION ── */}
      <h3 className="sh">My Collection</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        <button
          className="tc"
          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px' }}
          onClick={() => setScr('favorites')}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 13,
              background: 'rgba(253,224,71,.2)',
              border: '1px solid rgba(253,224,71,.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'var(--text-xl)',
              flexShrink: 0,
            }}
          >
            ⭐
          </div>
          <div style={{ textAlign: 'left', minWidth: 0 }}>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--heading)' }}>
              Favorites
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--subtext)', marginTop: 1 }}>
              {favs.length} saved
            </div>
          </div>
        </button>
        <button
          className="tc"
          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px' }}
          onClick={() => setScr('journal')}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 13,
              background: 'rgba(124,58,237,.1)',
              border: '1px solid rgba(124,58,237,.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'var(--text-xl)',
              flexShrink: 0,
            }}
          >
            📓
          </div>
          <div style={{ textAlign: 'left', minWidth: 0 }}>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--heading)' }}>
              Vocabulary
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--subtext)', marginTop: 1 }}>
              Personal journal
            </div>
          </div>
        </button>
      </div>

      <div
        onClick={() => setScr('my_words')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 14px',
          background: 'var(--card)',
          border: '1px solid var(--card-b)',
          borderRadius: 12,
          cursor: 'pointer',
          marginBottom: 8,
        }}
      >
        <span style={{ fontSize: 'var(--text-xl)' }}>📚</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--heading)' }}>
            My Words
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--subtext)' }}>
            {(() => {
              try {
                return (
                  JSON.parse(localStorage.getItem('nh_custom_words') || '[]').length +
                  ' words saved'
                );
              } catch {
                return 'Your personal vocabulary deck';
              }
            })()}
          </div>
        </div>
        <span style={{ color: 'var(--subtext)' }}>→</span>
      </div>

      {/* ── LEARNING TOOLS ── */}
      <div style={{ marginTop: 16, marginBottom: 8 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: 'var(--text-2)',
            letterSpacing: '.08em',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}
        >
          Learning Tools
        </div>
        {[
          {
            icon: '📊',
            label: 'My Analytics',
            screen: 'analytics',
            desc: 'Progress charts & stats',
          },
          { icon: '❌', label: 'Mistakes Review', screen: 'mistakes', desc: 'Words you got wrong' },
          {
            icon: '🏆',
            label: 'Leaderboard',
            screen: 'leaderboard',
            desc: 'Family & friends ranking',
          },
        ].map((item) => (
          <button
            key={item.screen}
            onClick={() => setScr(item.screen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              width: '100%',
              padding: '12px 14px',
              marginBottom: 8,
              background: 'var(--card)',
              border: '1px solid var(--card-b)',
              borderRadius: 12,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <span style={{ fontSize: 22 }}>{item.icon}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                {item.label}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-2)' }}>{item.desc}</div>
            </div>
            <span style={{ marginLeft: 'auto', color: 'var(--text-3)', fontSize: 14 }}>›</span>
          </button>
        ))}
      </div>

      {/* ── REPORT A BUG ── visible shortcut so users don't have to hunt through Settings */}
      <button
        onClick={() => setScr('contact')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          width: '100%',
          padding: '13px 14px',
          marginTop: 8,
          marginBottom: 24,
          background: 'rgba(220,38,38,0.05)',
          border: '1.5px solid rgba(220,38,38,0.18)',
          borderRadius: 12,
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 20 }}>🐛</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#dc2626' }}>Report a Bug</div>
          <div style={{ fontSize: 11, color: 'var(--text-2)' }}>
            Something not working? Let us know.
          </div>
        </div>
        <span style={{ marginLeft: 'auto', color: 'rgba(220,38,38,0.5)', fontSize: 14 }}>›</span>
      </button>
    </React.Fragment>
  );
}
