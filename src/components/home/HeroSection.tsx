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
import { hostOfDay } from './hostFamily';
import CompactStrip from './CompactStrip';
import KnightBubble from './KnightBubble';
import RewardsPanel from './RewardsPanel';
import HeroStats from './HeroStats';
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

            <KnightBubble
              knight={knightSpeech}
              name={name}
              host={hostOfDay(Math.floor(Date.now() / 86400000))}
              isNative={_isNative}
            />

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

            <HeroStats
              streak={streak}
              freezes={freezes}
              xpPct={xpPct}
              xpCur={xpCur}
              xpNeeded={xpNeeded}
              level={level}
              cefr={cefr}
              lc={st.lc}
              xp={st.xp}
              wsMastered={wsMastered}
            />

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
