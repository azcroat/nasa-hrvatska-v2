import React, { useState } from 'react';
import { motion } from 'framer-motion';

// On Android WebView (Capacitor), Framer Motion entry animations can stall
// leaving elements permanently at opacity:0. Skip entry animation on native.
// Use hostname === 'localhost' (reliable) not window.Capacitor (async bridge injection).
// Capacitor Android: https://localhost with NO port.
// Dev/CI server: http://localhost:PORT — always has a port number.
const _isNative =
  typeof window !== 'undefined' &&
  window.location.hostname === 'localhost' &&
  !window.location.port;
import { lXP, nXP } from '../../data';
import { useContent } from '../../hooks/useContent';
import { getDailyXP, getDailyXPGoal } from '../../lib/appUtils.js';
import { useApp } from '../../context/AppContext';
import { useStats } from '../../context/StatsContext';
import CroatianGrb from '../shared/CroatianGrb';
import { LEVEL_PALETTE } from './heroData';
import { getDailyScene, getMascotMessage, getCEFR } from './heroHelpers';
import CompactStrip from './CompactStrip';
import KnightBubble from './KnightBubble';
import RewardsPanel from './RewardsPanel';
import { useKnightSpeech } from './useKnightSpeech';
import { useHeroRewards } from './useHeroRewards';

interface LearnPathItem {
  id?: string;
  type?: string;
  title?: string;
  name?: string;
  level?: number;
  [key: string]: unknown;
}
interface PathLevel {
  level: number;
  title: string;
  items: unknown[];
}
interface PathData {
  nextItem?: (LearnPathItem & { name?: string; title?: string }) | null;
  activeLv: PathLevel;
  activeLvDone: number;
}

export default function HeroSection({
  streak,
  pathData,
  allQuestsDone,
  userGoal,
  comebackBonus,
  lastActivity,
  sCurEx,
  onSyncNow,
  wsMastered,
  launchPathItem,
}: {
  streak: { count: number; last?: string };
  pathData: PathData;
  allQuestsDone?: boolean;
  userGoal?: string;
  comebackBonus?: boolean;
  lastActivity?: { label?: string; ex?: string } | null;
  sCurEx?: (screen: string) => void;
  onSyncNow?: () => void;
  wsMastered?: number;
  launchPathItem?: (item: LearnPathItem) => void;
}) {
  const { name } = useApp();
  const { level, stats: st } = useStats();
  const { content: coreContent } = useContent();
  const LEVEL_NARRATIVE = (coreContent?.LEVEL_NARRATIVE ?? {}) as Record<string, string[]>;

  // Hero is always expanded by default — users can still collapse it manually
  const [heroExpanded, setHeroExpanded] = useState(() => {
    const saved = localStorage.getItem('nh_hero_expanded');
    if (saved !== null) return saved === '1';
    return true; // default expanded for all users
  });
  const toggleHero = () => {
    const next = !heroExpanded;
    setHeroExpanded(next);
    localStorage.setItem('nh_hero_expanded', next ? '1' : '0');
  };

  const xpCur = st.xp - lXP(level);
  const xpNeeded = nXP(level) - lXP(level);
  const xpPct = Math.min(Math.round((xpCur / xpNeeded) * 100), 100);
  const cefr = getCEFR(st.xp, st.lc, st.gc);
  const dailyXP = getDailyXP();
  const dailyXPGoal = getDailyXPGoal();

  const activePalette = LEVEL_PALETTE[(pathData.activeLv.level - 1) % LEVEL_PALETTE.length]!;
  const heroScene = getDailyScene();

  const _td = new Date();
  const today =
    _td.getFullYear() +
    '-' +
    String(_td.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(_td.getDate()).padStart(2, '0');

  const _mascot = getMascotMessage({
    streak: streak.count,
    level,
    lc: st.lc,
    comebackBonus,
    allQuestsDone,
    practicedToday: streak.last === today,
  });

  // ── Knight speech (greeting, translator, quick-reply pools) ──
  const knightSpeech = useKnightSpeech({
    st,
    streakCount: streak.count,
    level,
    practicedToday: streak.last === today,
  });

  // ── Hero rewards (freezes, XP boost, streak recovery) ──
  const rewards = useHeroRewards({ today, onSyncNow });
  const { freezes } = rewards; // freezes is also shown in the streak badge + stat row

  return (
    <motion.div
      initial={_isNative ? false : { y: 16 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut', delay: 0 }}
    >
      <div
        style={{
          background: `linear-gradient(160deg,rgba(6,14,30,0.91) 0%,rgba(10,35,72,0.82) 40%,rgba(12,56,104,0.77) 100%), url('/images/scenes/${heroScene.img}.webp') center ${heroScene.position} / cover no-repeat`,
          position: 'relative',
          overflow: 'hidden',
          color: 'white',
          borderRadius: '22px 22px 0 0',
          borderBottom: '1px solid rgba(200,152,10,0.35)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}
      >
        {/* Croatian identity stripe — gold line */}
        <div style={{ position: 'relative' }}>
          <div
            style={{
              height: 3,
              background:
                'linear-gradient(90deg, transparent 0%, var(--gold, #C8980A) 20%, var(--harvest, #FFE070) 50%, var(--gold, #C8980A) 80%, transparent 100%)',
            }}
          />
        </div>

        {/* ── COMPACT STRIP (returning users, collapsed state) ── */}
        {!heroExpanded && (
          <CompactStrip
            streakCount={streak.count}
            level={level}
            levelTitle={pathData.activeLv.title}
            xp={st.xp}
            onExpand={toggleHero}
          />
        )}

        {heroExpanded && (
          <div style={{ padding: '16px 20px 20px' }}>
            {/* Top row: brand — grb + logotype */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
              <div style={{ flexShrink: 0, filter: 'drop-shadow(0 4px 14px rgba(0,0,0,.6))' }}>
                <CroatianGrb size={64} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 900,
                    letterSpacing: '.01em',
                    lineHeight: 1,
                    color: 'white',
                    fontFamily: "'Playfair Display',serif",
                    textShadow: '0 2px 12px rgba(0,0,0,.5)',
                  }}
                >
                  Naša Hrvatska
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'rgba(200,152,10,0.90)',
                    letterSpacing: '.12em',
                    textTransform: 'uppercase',
                    marginTop: 5,
                  }}
                >
                  Learn Croatian
                </div>
              </div>
            </div>

            <KnightBubble knight={knightSpeech} name={name} isNative={_isNative} />

            {/* Level badge pill */}
            <div style={{ display: 'inline-flex', alignItems: 'center', marginBottom: 16 }}>
              <span
                style={{
                  background: activePalette.grad,
                  borderRadius: 20,
                  padding: '5px 14px',
                  fontSize: 11,
                  fontWeight: 800,
                  color: 'white',
                  letterSpacing: '.06em',
                  textTransform: 'uppercase',
                  boxShadow: '0 4px 14px rgba(0,0,0,.3)',
                }}
              >
                <span>Level {level}</span>
                <span style={{ opacity: 0.65, fontWeight: 600 }}> · {pathData.activeLv.title}</span>
                <span
                  style={{
                    marginLeft: 8,
                    background: 'rgba(255,255,255,.2)',
                    borderRadius: 10,
                    padding: '2px 7px',
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '.02em',
                  }}
                >
                  {LEVEL_NARRATIVE[userGoal ?? '']?.[level - 1] || 'Learning'}
                </span>
              </span>
            </div>

            {/* ── PREMIUM STATS: Streak card + XP ring ── */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 12, marginTop: 8 }}>
              {/* Streak card */}
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  background: 'rgba(255,255,255,.09)',
                  borderRadius: 20,
                  padding: '18px 10px 14px',
                  border: '1px solid rgba(255,255,255,.14)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,.12)',
                }}
              >
                <span
                  className="anim-streak"
                  style={{ fontSize: 34, lineHeight: 1, marginBottom: 2 }}
                >
                  🔥
                </span>
                <div
                  style={{
                    fontSize: 46,
                    fontWeight: 900,
                    color: 'white',
                    lineHeight: 1,
                    fontVariantNumeric: 'tabular-nums',
                    fontFamily: "'Outfit',sans-serif",
                    textShadow: '0 0 28px rgba(251,146,60,.75)',
                    marginTop: 3,
                  }}
                >
                  {streak.count}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: 'rgba(255,255,255,.6)',
                    textTransform: 'uppercase',
                    letterSpacing: '.1em',
                    marginTop: 6,
                  }}
                >
                  day streak
                </div>
                {streak.count === 0 ? (
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: 'rgba(253,186,116,.95)',
                      marginTop: 5,
                    }}
                  >
                    Start your streak! Complete a lesson today 🔥
                  </div>
                ) : (
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: 'rgba(253,186,116,.95)',
                      marginTop: 5,
                    }}
                  >
                    {streak.count >= 30
                      ? '🇭🇷 Legend!'
                      : streak.count >= 7
                        ? '⚡ Odlično!'
                        : '✓ Keep going!'}
                  </div>
                )}
                {streak.count >= 25 && streak.count < 30 && (
                  <div style={{ fontSize: 10, color: '#d97706', fontWeight: 700, marginTop: 2 }}>
                    5 more days to legendary status! ⭐
                  </div>
                )}
                {streak.count >= 7 && streak.count < 25 && (
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,.6)', marginTop: 2 }}>
                    {30 - streak.count} days to Legend status
                  </div>
                )}
                {freezes > 0 && (
                  <div
                    title="Zaštita niza — Streak shield"
                    style={{
                      marginTop: 8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 3,
                      background: 'rgba(59,130,246,.18)',
                      border: '1px solid rgba(59,130,246,.35)',
                      borderRadius: 10,
                      padding: '4px 9px',
                    }}
                  >
                    <span style={{ fontSize: 12 }}>🛡️</span>
                    <span style={{ fontSize: 9, color: 'rgba(147,197,253,.95)', fontWeight: 800 }}>
                      ×{freezes} Zaštita niza
                    </span>
                  </div>
                )}
                {streak.count === 0 && (
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--warning)',
                      fontWeight: 600,
                      marginTop: 4,
                      textAlign: 'center',
                    }}
                  >
                    Complete any lesson today to start your streak! 🔥
                  </div>
                )}
              </div>

              {/* XP progress ring */}
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  background: 'rgba(255,255,255,.09)',
                  borderRadius: 20,
                  padding: '14px 10px 12px',
                  border: '1px solid rgba(255,255,255,.14)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,.12)',
                }}
              >
                <svg width="96" height="96" viewBox="0 0 96 96" aria-hidden="true">
                  <defs>
                    <linearGradient id="xpRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#38bdf8" />
                      <stop offset="100%" stopColor="#818cf8" />
                    </linearGradient>
                  </defs>
                  {/* Glow halo */}
                  <circle
                    cx="48"
                    cy="48"
                    r="38"
                    fill="none"
                    stroke="rgba(56,189,248,.1)"
                    strokeWidth="14"
                  />
                  {/* Track */}
                  <circle
                    cx="48"
                    cy="48"
                    r="38"
                    fill="none"
                    stroke="rgba(255,255,255,.12)"
                    strokeWidth="8"
                  />
                  {/* Fill */}
                  <circle
                    cx="48"
                    cy="48"
                    r="38"
                    fill="none"
                    stroke="url(#xpRingGrad)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray="238.76"
                    strokeDashoffset={238.76 * (1 - xpPct / 100)}
                    style={{
                      transform: 'rotate(-90deg)',
                      transformOrigin: '48px 48px',
                      transition: 'stroke-dashoffset 0.9s cubic-bezier(.4,0,.2,1)',
                      filter: 'drop-shadow(0 0 5px rgba(56,189,248,.9))',
                    }}
                  />
                  {/* Level number */}
                  <text
                    x="48"
                    y="45"
                    textAnchor="middle"
                    fontSize="26"
                    fontWeight="900"
                    fill="white"
                    fontFamily="Outfit,sans-serif"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {level}
                  </text>
                  <text
                    x="48"
                    y="60"
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="800"
                    fill="rgba(255,255,255,.55)"
                    fontFamily="Outfit,sans-serif"
                    letterSpacing="2"
                  >
                    LEVEL
                  </text>
                </svg>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: 'rgba(96,205,250,.95)',
                    marginTop: 1,
                    letterSpacing: '.04em',
                  }}
                >
                  {xpPct}% → Lv {level + 1}
                </div>
                <div
                  style={{
                    fontSize: 9,
                    color: 'rgba(255,255,255,.45)',
                    marginTop: 3,
                    fontWeight: 600,
                  }}
                >
                  {(nXP(level) - st.xp).toLocaleString()} XP to go
                </div>
              </div>
            </div>

            {/* CEFR progression bar */}
            <div style={{ marginTop: 12 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 4,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.7)',
                    letterSpacing: '.05em',
                  }}
                >
                  CEFR LEVEL
                </span>
                <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--gold, #C8980A)' }}>
                  {cefr.current} → {cefr.next} &nbsp;·&nbsp; {cefr.pctInLevel}%
                </span>
              </div>
              <div
                style={{
                  height: 6,
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: 6,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: cefr.pctInLevel + '%',
                    background: 'linear-gradient(90deg, var(--gold,#C8980A), #FFE070)',
                    borderRadius: 6,
                    transition: 'width 0.6s ease',
                  }}
                />
              </div>
              <div
                style={{
                  marginTop: 4,
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.5)',
                  fontStyle: 'italic',
                }}
              >
                {xpCur} / {xpNeeded} XP this level
              </div>
            </div>

            {/* Mini stat row */}
            <div style={{ display: 'flex', gap: 7, marginBottom: freezes === 0 ? 11 : 14 }}>
              {[
                { icon: '📚', value: st.lc, label: 'lessons' },
                { icon: '💪', value: wsMastered, label: 'mastered' },
                { icon: '⭐', value: st.xp.toLocaleString(), label: 'total XP' },
              ].map((s, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    background: 'rgba(255,255,255,.07)',
                    borderRadius: 12,
                    padding: '8px 4px',
                    border: '1px solid rgba(255,255,255,.09)',
                  }}
                >
                  <span style={{ fontSize: 15 }}>{s.icon}</span>
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 900,
                        color: 'white',
                        lineHeight: 1,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {s.value}
                    </div>
                    <div
                      style={{
                        fontSize: 9,
                        fontWeight: 600,
                        color: 'rgba(255,255,255,.45)',
                        textTransform: 'uppercase',
                        letterSpacing: '.05em',
                      }}
                    >
                      {s.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── DAILY XP GOAL — DuoLingo-style progress bar (uses user's chosen commitment) ── */}
            {(() => {
              const goalXP = Math.min(dailyXP, dailyXPGoal);
              const goalPct = Math.min(Math.round((goalXP / dailyXPGoal) * 100), 100);
              const goalDone = dailyXP >= dailyXPGoal;
              return (
                <div
                  style={{
                    background: goalDone ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.07)',
                    border: goalDone
                      ? '1px solid rgba(34,197,94,0.35)'
                      : '1px solid rgba(255,255,255,0.10)',
                    borderRadius: 14,
                    padding: '10px 14px',
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 6,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 13 }}>{goalDone ? '🎯' : '⚡'}</span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: goalDone ? 'rgba(134,239,172,0.95)' : 'rgba(255,255,255,0.75)',
                          letterSpacing: '.04em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {goalDone ? "Today's goal — complete!" : "Today's goal"}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 900,
                        color: goalDone ? 'rgba(134,239,172,0.95)' : 'rgba(255,255,255,0.9)',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {goalXP} / {dailyXPGoal} XP
                    </span>
                  </div>
                  <div
                    style={{
                      height: 6,
                      background: 'rgba(255,255,255,0.12)',
                      borderRadius: 6,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: goalPct + '%',
                        background: goalDone
                          ? 'linear-gradient(90deg,#22c55e,#4ade80)'
                          : 'linear-gradient(90deg,#38bdf8,#818cf8)',
                        borderRadius: 6,
                        transition: 'width 0.6s ease',
                        boxShadow: goalDone
                          ? '0 0 8px rgba(34,197,94,0.6)'
                          : '0 0 6px rgba(56,189,248,0.5)',
                      }}
                    />
                  </div>
                </div>
              );
            })()}

            <RewardsPanel rewards={rewards} xp={st.xp} streakCount={streak.count} today={today} />
            {/* Collapse button — bottom of full hero */}
            <button
              onClick={toggleHero}
              aria-label="Collapse hero section"
              style={{
                width: '100%',
                marginTop: 14,
                padding: '6px 0',
                background: 'rgba(255,255,255,.06)',
                border: '1px solid rgba(255,255,255,.12)',
                borderRadius: 10,
                cursor: 'pointer',
                color: 'rgba(255,255,255,.5)',
                fontSize: 12,
                fontWeight: 600,
                fontFamily: "'Outfit',sans-serif",
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <span>Hide details</span>
              <span style={{ fontSize: 10 }}>⌃</span>
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
