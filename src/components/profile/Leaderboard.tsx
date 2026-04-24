import React, { useEffect, useRef, useState } from 'react';
import {
  H,
  fbGetFamilyMembers,
  fbWatchFamilyMembers,
  fbCreateFamily,
  fbJoinFamily,
  fbLeaveFamily,
} from '../../data';
import { fbSaveReaction, fbWatchReactions } from '../../lib/firebase.js';
import { subscribeToLeaderboard } from '../../lib/leaderboard.js';
import type { LeaderboardEntry } from '../../lib/leaderboard.js';
import CroatianKnight from '../shared/CroatianKnight';
import WeeklyLeague from './WeeklyLeague';
import type { AuthUser, Stats } from '../../types';

interface FamilyMemberLocal {
  name?: string;
  email: string;
  role?: string;
  xp: number;
  lc: number;
  weekXP?: number;
  joined?: number;
  gen?: string;
  uid?: string;
  streak?: number;
}

interface FamilyData {
  code: string;
  name?: string;
  role?: string;
}

interface ReactorData {
  emoji: string;
  name?: string;
}

interface ReactionData {
  reactors?: Record<string, ReactorData>;
}

function getCEFRLevel(weekXP: number) {
  // Rough weekly XP → CEFR for leaderboard display
  if (weekXP < 50) return null;
  if (weekXP < 150) return 'A1';
  if (weekXP < 300) return 'A2';
  if (weekXP < 600) return 'B1';
  if (weekXP < 1000) return 'B2';
  return 'C1+';
}

const CEFR_COLORS = {
  A1: '#16a34a',
  A2: '#65a30d',
  B1: '#ca8a04',
  B2: '#b45309',
  'C1+': '#0e7490',
};

function getRecentAchievements() {
  try {
    return JSON.parse(localStorage.getItem('nh_journey') || '[]')
      .slice(-10)
      .reverse();
  } catch (_) {
    return [];
  }
}

const ACHIEVEMENT_ICONS = {
  first_lesson: '📚',
  first_speaking: '🎤',
  streak_7: '🔥',
  streak_30: '🌟',
  streak_50: '💎',
  streak_100: '🏆',
  streak_365: '👑',
  name_day: '🎉',
};
const REACTION_EMOJIS = ['🔥', '❤️', '🇭🇷', '👏', '💪'];

export default function Leaderboard({
  goBack,
  authUser: au,
  name,
  stats,
  famData,
  setFamData,
  famMembers,
  setFamMembers,
  famLoading,
  setFamLoading,
  famName,
  setFamName,
  famCode,
  setFamCode,
  famErr,
  setFamErr,
  famTab,
  setFamTab,
}: {
  goBack: () => void;
  authUser: AuthUser | null;
  name?: string;
  stats?: Partial<Stats>;
  famData: FamilyData | null;
  setFamData: (d: FamilyData | null) => void;
  famMembers: FamilyMemberLocal[];
  setFamMembers: (m: FamilyMemberLocal[]) => void;
  famLoading: boolean;
  setFamLoading: (v: boolean) => void;
  famName: string;
  setFamName: (v: string) => void;
  famCode: string;
  setFamCode: (v: string) => void;
  famErr: string;
  setFamErr: (v: string) => void;
  famTab: string;
  setFamTab: (v: string) => void;
}) {
  const watchRef = useRef<(() => void) | null>(null);
  const [liveStatus, setLiveStatus] = useState<null | 'connecting' | 'live' | 'offline'>(null);
  const [view, setView] = useState('total'); // 'total' or 'week'
  const [generation, setGeneration] = useState(() => localStorage.getItem('nh_generation') || '');
  const [_reactionTick, setReactionTick] = useState(0);
  const [firestoreReactions, setFirestoreReactions] = useState<Record<string, ReactionData>>({});

  function getWeekKey() {
    const d = new Date();
    const day = d.getDay() || 7;
    d.setDate(d.getDate() + 4 - day);
    const year = d.getFullYear();
    const week = Math.ceil(((d.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + 1) / 7);
    return `${year}-W${String(week).padStart(2, '0')}`;
  }
  const myWeekXP = parseInt(localStorage.getItem('nh_week_xp_' + getWeekKey()) || '0', 10);

  function getLeagueTier(weekXP: number) {
    if (weekXP >= 600)
      return {
        id: 'platinum',
        name: 'Platinum',
        icon: '💎',
        color: '#7c3aed',
        bg: 'rgba(124,58,237,.08)',
        border: '#c4b5fd',
        mult: '2.0x XP',
      };
    if (weekXP >= 300)
      return {
        id: 'gold',
        name: 'Gold',
        icon: '🥇',
        color: '#d97706',
        bg: 'rgba(217,119,6,.08)',
        border: '#fcd34d',
        mult: '1.5x XP',
      };
    if (weekXP >= 100)
      return {
        id: 'silver',
        name: 'Silver',
        icon: '🥈',
        color: '#6b7280',
        bg: 'rgba(107,114,128,.08)',
        border: '#d1d5db',
        mult: '1.25x XP',
      };
    return {
      id: 'bronze',
      name: 'Bronze',
      icon: '🥉',
      color: '#b45309',
      bg: 'rgba(180,83,9,.08)',
      border: '#fcd34d',
      mult: '1.0x XP',
    };
  }

  const GENERATION_LABELS = {
    grandparent: { label: 'Baka/Djed', emoji: '👴', color: '#d97706' },
    parent: { label: 'Parent', emoji: '👨', color: '#0e7490' },
    adult: { label: 'Adult', emoji: '🧑', color: '#7c3aed' },
    teen: { label: 'Teen', emoji: '🧒', color: '#16a34a' },
  };

  // ── Global leaderboard ───────────────────────────────────────────────────
  const [globalUsers, setGlobalUsers] = useState<LeaderboardEntry[]>([]);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const globalUnsubRef = useRef<(() => void) | null>(null);

  // Real-time subscription using onSnapshot — bypasses Firestore offline cache on Android.
  // getDocs() returns cached empty data on first load in Capacitor; onSnapshot always
  // delivers a server snapshot shortly after the initial cache hit.
  useEffect(() => {
    if (famTab !== 'global') {
      // Unsubscribe when leaving the global tab
      if (globalUnsubRef.current) {
        globalUnsubRef.current();
        globalUnsubRef.current = null;
      }
      return;
    }
    setGlobalUsers([]);
    setGlobalLoading(true);
    setGlobalError('');

    let settled = false;
    globalUnsubRef.current = subscribeToLeaderboard(
      null,
      50,
      (entries) => {
        setGlobalUsers(entries);
        setGlobalLoading(false);
        setGlobalError('');
        settled = true;
      },
      (err) => {
        console.error('[Leaderboard] subscription error:', err);
        setGlobalLoading(false);
        setGlobalError('Could not load global leaderboard. Check your connection.');
        settled = true;
      },
    );

    // Surface a connection error if nothing arrives within 8 seconds
    const timeout = setTimeout(() => {
      if (!settled) {
        setGlobalLoading(false);
        setGlobalError('Could not load global leaderboard. Check your connection.');
      }
    }, 8000);

    return () => {
      clearTimeout(timeout);
      if (globalUnsubRef.current) {
        globalUnsubRef.current();
        globalUnsubRef.current = null;
      }
    };
  }, [famTab]);

  // Real-time listener — starts when user is in a family and on the main tab,
  // fires immediately with current data and then on every remote change.
  useEffect(() => {
    // Stop any existing watcher when tab changes or famData clears
    if (watchRef.current) {
      watchRef.current();
      watchRef.current = null;
    }
    if (!famData || famTab !== 'main') {
      setLiveStatus(null);
      return undefined;
    }

    setFamLoading(true);
    setLiveStatus('connecting');

    watchRef.current = fbWatchFamilyMembers(famData.code, function (members) {
      setFamMembers(members);
      setFamLoading(false);
      setLiveStatus('live');
      try {
        localStorage.setItem(
          'famCache_' + famData.code,
          JSON.stringify({ m: members, ts: Date.now() }),
        );
      } catch {}
    });

    // If watcher returns a no-op (Firebase not ready), fall back to a one-shot read
    if (!watchRef.current || watchRef.current.toString() === 'function(){}') {
      fbGetFamilyMembers(famData.code)
        .then((m) => {
          setFamMembers(m);
          setFamLoading(false);
          setLiveStatus('live');
        })
        .catch(() => {
          setFamLoading(false);
          setLiveStatus('offline');
          try {
            const raw = JSON.parse(localStorage.getItem('famCache_' + famData.code) || 'null');
            // Support new {m, ts} format and legacy plain array format.
            // Reject cached data older than 5 minutes to prevent stale XP scores.
            const cached =
              raw && raw.m && Date.now() - (raw.ts || 0) < 300_000
                ? raw.m
                : Array.isArray(raw)
                  ? raw
                  : null;
            if (cached && cached.length > 0) {
              setFamMembers(cached);
              setFamErr('⚠️ Showing cached results — offline');
            }
          } catch {}
        });
    }

    return () => {
      if (watchRef.current) {
        watchRef.current();
        watchRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [famData, famTab]);

  // Watch Firestore reactions for the family so other members' reactions appear live
  useEffect(() => {
    if (!famCode) return undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const unsub = fbWatchReactions(famCode, setFirestoreReactions as any);
    return unsub;
  }, [famCode]);

  // Merge live local stats for the current user so their XP is always up-to-date
  const displayMembers = famMembers
    .map((m) => {
      if (au && m.email === au.e && stats) {
        return {
          ...m,
          xp: Math.max(m.xp, stats.xp || 0),
          lc: Math.max(m.lc, stats.lc || 0),
          name: name || m.name,
        };
      }
      return m;
    })
    .sort((a, b) => b.xp - a.xp);

  return (
    <div className="scr-wrap">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <CroatianKnight size={40} mood="celebrating" style={{ flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          {H('🏆 Family Leaderboard', 'Compete with your family!', goBack)}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {['main', 'global', 'league', 'create', 'join'].map((t) => (
          <button
            key={t}
            className={'b ' + (famTab === t ? 'bp' : 'bg')}
            style={{ fontSize: 12, padding: '8px 14px' }}
            onClick={() => {
              setFamTab(t);
              setFamErr('');
            }}
          >
            {t === 'main'
              ? '🏆 Family'
              : t === 'global'
                ? '🌍 Global'
                : t === 'league'
                  ? '🥇 League'
                  : t === 'create'
                    ? '➕ Create Family'
                    : '🔗 Join Family'}
          </button>
        ))}
      </div>

      {famTab === 'main' && (
        <React.Fragment>
          {famData ? (
            <React.Fragment>
              <div
                className="c"
                style={{
                  marginBottom: 16,
                  borderLeft: '4px solid #f59e0b',
                  background: 'linear-gradient(135deg,#fffbeb,#fef3c7)',
                }}
              >
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#92400e' }}>
                      👨‍👩‍👧‍👦 {famData.name}
                    </div>
                    <div style={{ fontSize: 12, color: '#78716c', marginBottom: 6 }}>
                      Code:{' '}
                      <span
                        style={{
                          fontWeight: 800,
                          color: '#0e7490',
                          letterSpacing: 2,
                          fontSize: 14,
                        }}
                      >
                        {famData.code}
                      </span>
                    </div>
                    <button
                      onClick={async () => {
                        const link = `${window.location.origin}/?join=${famData.code}`;
                        if (navigator.share) {
                          try {
                            await navigator.share({
                              title: 'Join my family on Naša Hrvatska 🇭🇷',
                              text: 'Click to join and learn Croatian together!',
                              url: link,
                            });
                          } catch (_) {}
                        } else {
                          await navigator.clipboard.writeText(link);
                          setFamErr('✅ Invite link copied!');
                          setTimeout(() => setFamErr(''), 3000);
                        }
                      }}
                      style={{
                        background: 'linear-gradient(135deg,#0e7490,#164e63)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 10,
                        padding: '6px 14px',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      🔗 Share Invite Link
                    </button>
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      padding: '3px 8px',
                      background: famData.role === 'admin' ? '#dbeafe' : '#e7e5e4',
                      borderRadius: 12,
                      color: famData.role === 'admin' ? '#1e40af' : '#78716c',
                      fontWeight: 600,
                    }}
                  >
                    {famData.role}
                  </div>
                </div>
              </div>
              {/* ── SET GENERATION ── */}
              <div
                style={{
                  marginBottom: 16,
                  background: 'var(--card)',
                  border: '1px solid var(--card-b)',
                  borderRadius: 14,
                  padding: '14px 16px',
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: 'var(--subtext)',
                    letterSpacing: '.08em',
                    textTransform: 'uppercase',
                    marginBottom: 10,
                  }}
                >
                  🧬 Your Generation
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {Object.entries(GENERATION_LABELS).map(([id, g]) => (
                    <button
                      key={id}
                      onClick={() => {
                        localStorage.setItem('nh_generation', id);
                        setGeneration(id);
                      }}
                      style={{
                        padding: '10px 8px',
                        borderRadius: 10,
                        border: `2px solid ${generation === id ? g.color : 'var(--card-b)'}`,
                        background: generation === id ? g.color + '18' : 'var(--bar-bg)',
                        color: generation === id ? g.color : 'var(--subtext)',
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: 'pointer',
                        fontFamily: "'Outfit',sans-serif",
                      }}
                    >
                      {g.emoji} {g.label}
                    </button>
                  ))}
                </div>
              </div>
              {famData &&
                (() => {
                  const tier = getLeagueTier(myWeekXP);
                  return (
                    <div
                      style={{
                        background: tier.bg,
                        border: `1.5px solid ${tier.border}`,
                        borderRadius: 14,
                        padding: '12px 14px',
                        marginBottom: 14,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <span style={{ fontSize: 28 }}>{tier.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            background:
                              tier.id === 'platinum'
                                ? 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(168,85,247,0.1))'
                                : tier.id === 'gold'
                                  ? 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(245,158,11,0.1))'
                                  : tier.id === 'silver'
                                    ? 'linear-gradient(135deg, rgba(148,163,184,0.15), rgba(100,116,139,0.1))'
                                    : 'linear-gradient(135deg, rgba(205,124,55,0.15), rgba(180,100,30,0.1))',
                            border: `1.5px solid ${tier.id === 'platinum' ? 'rgba(139,92,246,0.4)' : tier.id === 'gold' ? 'rgba(251,191,36,0.5)' : tier.id === 'silver' ? 'rgba(148,163,184,0.5)' : 'rgba(205,124,55,0.5)'}`,
                            borderRadius: 20,
                            padding: '4px 12px',
                            fontSize: 13,
                            fontWeight: 800,
                            color: tier.color,
                          }}
                        >
                          {tier.icon} {tier.name} League · {tier.mult}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: 'var(--subtext)',
                            fontWeight: 600,
                            marginTop: 4,
                          }}
                        >
                          Your family · active this week
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 18, fontWeight: 900, color: tier.color }}>
                          {myWeekXP}
                        </div>
                        <div
                          style={{
                            fontSize: 9,
                            color: 'var(--subtext)',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                          }}
                        >
                          XP this week
                        </div>
                      </div>
                    </div>
                  );
                })()}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <button
                  className="b bp"
                  style={{ flex: 1, fontSize: 14 }}
                  onClick={() => {
                    setFamLoading(true);
                    setFamErr('');
                    setLiveStatus('connecting');
                    fbGetFamilyMembers(famData.code)
                      .then((m) => {
                        setFamMembers(m);
                        setFamLoading(false);
                        setLiveStatus('live');
                        try {
                          localStorage.setItem(
                            'famCache_' + famData.code,
                            JSON.stringify({ m, ts: Date.now() }),
                          );
                        } catch {}
                      })
                      .catch(() => {
                        setFamLoading(false);
                        setLiveStatus('offline');
                        setFamErr('Could not refresh. Check your connection.');
                      });
                  }}
                  disabled={famLoading}
                >
                  {famLoading ? '⏳ Loading...' : '🔄 Refresh'}
                </button>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '8px 12px',
                    borderRadius: 10,
                    background:
                      liveStatus === 'live'
                        ? '#f0fdf4'
                        : liveStatus === 'connecting'
                          ? '#fefce8'
                          : liveStatus === 'offline'
                            ? '#fff1f2'
                            : '#f8fafc',
                    color:
                      liveStatus === 'live'
                        ? '#16a34a'
                        : liveStatus === 'connecting'
                          ? '#a16207'
                          : liveStatus === 'offline'
                            ? '#dc2626'
                            : '#78716c',
                    border: '1.5px solid',
                    borderColor:
                      liveStatus === 'live'
                        ? '#bbf7d0'
                        : liveStatus === 'connecting'
                          ? '#fde68a'
                          : liveStatus === 'offline'
                            ? '#fecaca'
                            : '#e2e8f0',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {liveStatus === 'live'
                    ? '● Live'
                    : liveStatus === 'connecting'
                      ? '◌ Connecting'
                      : liveStatus === 'offline'
                        ? '⚠ Offline'
                        : '—'}
                </div>
              </div>
              {famErr && (
                <div
                  style={{
                    color: famErr.startsWith('✅') ? '#16a34a' : '#dc2626',
                    fontSize: 13,
                    marginBottom: 12,
                  }}
                >
                  {famErr}
                </div>
              )}
              {/* Weekly Challenge Banner */}
              <div
                style={{
                  background: 'linear-gradient(135deg, var(--info-bg), rgba(14,116,144,0.05))',
                  border: '1.5px solid var(--info-b, rgba(14,116,144,0.3))',
                  borderRadius: 14,
                  padding: '12px 14px',
                  marginBottom: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <span style={{ fontSize: 28 }}>⚡</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--info)' }}>
                    This Week's Challenge
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--subtext)', marginTop: 2 }}>
                    {myWeekXP > 0
                      ? `You've earned ${myWeekXP} XP this week. Keep pushing for ${Math.ceil(myWeekXP / 100) * 100}!`
                      : 'Earn XP this week to climb the rankings. Every lesson counts!'}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 900, fontSize: 20, color: '#fbbf24' }}>{myWeekXP}</div>
                  <div style={{ fontSize: 10, color: 'var(--subtext)' }}>my XP</div>
                </div>
              </div>

              {/* Family Invite Card */}
              {famData && famData.code && (
                <div
                  style={{
                    background: 'var(--card)',
                    border: '1px solid var(--card-b)',
                    borderRadius: 12,
                    padding: '12px 14px',
                    marginBottom: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <span style={{ fontSize: 20 }}>🔗</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--heading)' }}>
                      Invite Family Members
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--subtext)', marginTop: 1 }}>
                      Share code:{' '}
                      <strong style={{ color: 'var(--info)', letterSpacing: '0.1em' }}>
                        {famData.code}
                      </strong>
                    </div>
                  </div>
                  <button
                    className="b bs"
                    style={{ padding: '8px 12px', fontSize: 12 }}
                    onClick={async (e) => {
                      const btn = e.currentTarget;
                      if (navigator.share) {
                        try {
                          await navigator.share({
                            title: 'Join my Croatian family leaderboard!',
                            text: `Learn Croatian with me on Naša Hrvatska! Use family code: ${famData.code}`,
                          });
                        } catch (_) {}
                      } else {
                        try {
                          await navigator.clipboard.writeText(famData.code);
                        } catch (_) {}
                        btn.textContent = 'Copied! ✓';
                        setTimeout(() => {
                          btn.textContent = 'Share';
                        }, 2000);
                      }
                    }}
                  >
                    Share
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {['total', 'week'].map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: 10,
                      border: 'none',
                      cursor: 'pointer',
                      background:
                        view === v ? 'linear-gradient(135deg,#0e7490,#164e63)' : 'var(--bar-bg)',
                      color: view === v ? '#fff' : 'var(--subtext)',
                      fontSize: 12,
                      fontWeight: 800,
                      fontFamily: "'Outfit',sans-serif",
                    }}
                  >
                    {v === 'total' ? '⭐ All Time' : '⚡ This Week'}
                  </button>
                ))}
              </div>
              {displayMembers.length > 0 ? (
                (() => {
                  const maxXP = displayMembers[0]?.xp || 1;
                  return displayMembers.map((u, i) => {
                    const rank = i + 1;
                    const isMe = au && u.email === au.e;
                    const entryWeekXP = isMe ? myWeekXP : u.weekXP || 0;
                    const barColor =
                      rank === 1
                        ? '#fbbf24'
                        : rank === 2
                          ? '#94a3b8'
                          : rank === 3
                            ? '#cd7c37'
                            : 'var(--info)';
                    const rankMedal =
                      rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;
                    return (
                      <div
                        key={u.email}
                        className="c"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 14,
                          marginBottom: 10,
                          borderLeft:
                            rank === 1
                              ? '4px solid #f59e0b'
                              : rank === 2
                                ? '4px solid #9ca3af'
                                : '4px solid #d97706',
                          background: isMe ? 'var(--info-bg)' : undefined,
                          border: isMe
                            ? '1px solid var(--info-b, rgba(14,116,144,0.3))'
                            : undefined,
                        }}
                      >
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: '50%',
                            background:
                              rank === 1
                                ? 'linear-gradient(135deg,#f59e0b,#d97706)'
                                : rank === 2
                                  ? 'linear-gradient(135deg,#9ca3af,#6b7280)'
                                  : 'linear-gradient(135deg,#d97706,#92400e)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontWeight: 800,
                            fontSize: rankMedal ? 24 : 16,
                            flexShrink: 0,
                          }}
                        >
                          {rankMedal || rank}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 16,
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              flexWrap: 'wrap',
                              gap: 4,
                            }}
                          >
                            {u.name}
                            {u.role === 'admin' ? ' 👑' : ''}
                            {isMe && (
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  color: 'var(--info)',
                                  background: 'var(--info-bg)',
                                  borderRadius: 6,
                                  padding: '2px 6px',
                                }}
                              >
                                You
                              </span>
                            )}
                            {u.gen &&
                              (() => {
                                const gen =
                                  GENERATION_LABELS[u.gen as keyof typeof GENERATION_LABELS];
                                return gen ? (
                                  <span
                                    style={{
                                      fontSize: 10,
                                      fontWeight: 700,
                                      color: gen.color,
                                      background: 'var(--bar-bg)',
                                      borderRadius: 6,
                                      padding: '2px 6px',
                                      marginLeft: 4,
                                    }}
                                  >
                                    {gen.emoji} {gen.label}
                                  </span>
                                ) : null;
                              })()}
                          </div>
                          <div style={{ fontSize: 12, color: '#78716c' }}>
                            {u.lc} lessons · Joined{' '}
                            {u.joined ? new Date(u.joined).toLocaleDateString() : '—'}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div
                            style={{
                              fontSize: view === 'week' ? 14 : 20,
                              fontWeight: 800,
                              color: '#b45309',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-end',
                              gap: 4,
                              flexWrap: 'wrap',
                            }}
                          >
                            {view === 'week'
                              ? entryWeekXP + ' XP this week'
                              : u.xp.toLocaleString() + ' XP'}
                            {view === 'week' &&
                              (() => {
                                const cefrLabel = getCEFRLevel(entryWeekXP);
                                if (!cefrLabel) return null;
                                return (
                                  <span
                                    style={{
                                      fontSize: 9,
                                      fontWeight: 800,
                                      padding: '2px 5px',
                                      borderRadius: 4,
                                      background: CEFR_COLORS[cefrLabel],
                                      color: '#fff',
                                      marginLeft: 4,
                                    }}
                                  >
                                    {cefrLabel}
                                  </span>
                                );
                              })()}
                          </div>
                          {view === 'total' && (
                            <>
                              <div
                                style={{
                                  height: 3,
                                  background: 'var(--bar-bg)',
                                  borderRadius: 2,
                                  marginTop: 3,
                                  width: 80,
                                }}
                              >
                                <div
                                  style={{
                                    height: '100%',
                                    width: `${Math.round((u.xp / maxXP) * 100)}%`,
                                    background: barColor,
                                    borderRadius: 2,
                                  }}
                                />
                              </div>
                              {entryWeekXP > 0 && (
                                <div
                                  style={{
                                    fontSize: 10,
                                    color: 'var(--info)',
                                    fontWeight: 600,
                                    marginTop: 2,
                                  }}
                                >
                                  +{entryWeekXP} this week
                                </div>
                              )}
                            </>
                          )}
                          {view === 'week' && (
                            <div
                              style={{
                                height: 3,
                                background: 'var(--bar-bg)',
                                borderRadius: 2,
                                marginTop: 3,
                                width: 80,
                              }}
                            >
                              <div
                                style={{
                                  height: '100%',
                                  width: `${Math.round((entryWeekXP / Math.max(...displayMembers.map((m) => (au && m.email === au.e ? myWeekXP : m.weekXP || 0)), 1)) * 100)}%`,
                                  background: barColor,
                                  borderRadius: 2,
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()
              ) : (
                <div className="c" style={{ textAlign: 'center', color: '#78716c' }}>
                  Tap 'Refresh Leaderboard' to load family scores.
                </div>
              )}
              {famData && (
                <div style={{ marginTop: 16 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: 'var(--subtext)',
                      textTransform: 'uppercase',
                      letterSpacing: '.08em',
                      marginBottom: 10,
                    }}
                  >
                    🎯 This Week's Family Challenges
                  </div>
                  {[
                    {
                      name: 'Streak Champions',
                      desc: 'Everyone on 3+ day streak',
                      icon: '🔥',
                      progress: Math.min(
                        famMembers.filter((m) => (m.streak || 0) >= 3).length,
                        famMembers.length,
                      ),
                      total: Math.max(famMembers.length, 1),
                      reward: '+100 family XP',
                    },
                    {
                      name: 'XP Milestone',
                      desc: 'Earn 200+ XP as a family this week',
                      icon: '⚡',
                      progress: Math.min(myWeekXP, 200),
                      total: 200,
                      reward: '1.5x XP next week',
                    },
                    {
                      name: 'Active Family',
                      desc: 'All members practice this week',
                      icon: '👨‍👩‍👧',
                      progress: Math.min(
                        famMembers.filter((m) => (m.xp || 0) > 0).length,
                        famMembers.length,
                      ),
                      total: Math.max(famMembers.length, 1),
                      reward: 'Unlock bonus content',
                    },
                  ].map((ch, i) => {
                    const pct = Math.round((ch.progress / ch.total) * 100);
                    const done = ch.progress >= ch.total;
                    return (
                      <div
                        key={i}
                        style={{
                          background: 'var(--card)',
                          border: `1px solid ${done ? '#86efac' : 'var(--card-b)'}`,
                          borderRadius: 12,
                          padding: '12px 14px',
                          marginBottom: 10,
                        }}
                      >
                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}
                        >
                          <span style={{ fontSize: 16 }}>{ch.icon}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--heading)' }}>
                              {ch.name}
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--subtext)' }}>{ch.desc}</div>
                          </div>
                          {done && (
                            <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 800 }}>
                              ✓
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            height: 5,
                            background: 'var(--bar-bg)',
                            borderRadius: 3,
                            overflow: 'hidden',
                            marginBottom: 4,
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: pct + '%',
                              background: done ? '#16a34a' : '#0e7490',
                              borderRadius: 3,
                              transition: 'width .4s',
                            }}
                          />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 10, color: 'var(--subtext)', fontWeight: 600 }}>
                            {pct}% complete
                          </span>
                          <span style={{ fontSize: 10, color: '#0e7490', fontWeight: 700 }}>
                            {ch.reward}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <button
                style={{
                  marginTop: 20,
                  width: '100%',
                  padding: '12px',
                  border: '2px solid rgba(220,38,38,.15)',
                  borderRadius: 14,
                  background: 'rgba(220,38,38,.03)',
                  color: '#dc2626',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                onClick={() => {
                  if (confirm('Leave this family group? You can rejoin with the code later.')) {
                    fbLeaveFamily(famData.code, au?.e ?? '').then((r) => {
                      if (r.ok) {
                        setFamData(null);
                        setFamMembers([]);
                        localStorage.removeItem('uFamily');
                      } else
                        setFamErr('Could not leave family. Check your connection and try again.');
                    });
                  }
                }}
              >
                🚪 Leave Family
              </button>
            </React.Fragment>
          ) : (
            <div className="c" style={{ textAlign: 'center', padding: '32px 20px' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>👨‍👩‍👧‍👦</div>
              <h3 style={{ color: '#164e63', marginBottom: 8 }}>No Family Group Yet</h3>
              <p style={{ color: '#78716c', fontSize: 14, marginBottom: 16 }}>
                Create a family group and share the code with your family members. Everyone who
                joins can see each other's progress and compete for the top spot!
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button className="b bp" onClick={() => setFamTab('create')}>
                  ➕ Create Family
                </button>
                <button className="b bg" onClick={() => setFamTab('join')}>
                  🔗 Join Family
                </button>
              </div>
            </div>
          )}
        </React.Fragment>
      )}

      {famTab === 'global' && (
        <React.Fragment>
          <div style={{ fontSize: 13, color: 'var(--subtext)', marginBottom: 12, fontWeight: 600 }}>
            🏆 This week's top learners — same XP shown everywhere
          </div>
          {globalError && (
            <div style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{globalError}</div>
          )}
          {globalUsers.length > 0 &&
            (() => {
              const globalMaxXP = globalUsers[0]?.xp || 1;
              return globalUsers.map((u) => {
                const rank = u.rank || 0;
                const isMe = au && u.uid === au.u;
                const rankMedal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;
                const barColor =
                  rank === 1
                    ? '#fbbf24'
                    : rank === 2
                      ? '#94a3b8'
                      : rank === 3
                        ? '#cd7c37'
                        : 'var(--info)';
                return (
                  <div
                    key={u.uid}
                    className="c"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      marginBottom: 8,
                      padding: '10px 16px',
                      background: isMe ? 'var(--info-bg)' : undefined,
                      border: isMe ? '1px solid var(--info-b, rgba(14,116,144,0.3))' : undefined,
                    }}
                  >
                    <div
                      style={{
                        fontSize: rankMedal ? 22 : 15,
                        fontWeight: 900,
                        color: rankMedal ? undefined : 'var(--subtext)',
                        width: 32,
                        flexShrink: 0,
                        textAlign: 'center',
                      }}
                    >
                      {rankMedal || `#${rank}`}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: 'var(--heading)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {isMe ? '⚡ You' : u.displayName || 'Learner'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--subtext)' }}>This week</div>
                    </div>
                    <div style={{ flexShrink: 0, textAlign: 'right' }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#0e7490' }}>
                        {(u.xp || 0).toLocaleString()} XP
                      </div>
                      <div
                        style={{
                          height: 3,
                          background: 'var(--bar-bg)',
                          borderRadius: 2,
                          marginTop: 3,
                          width: 64,
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${Math.round(((u.xp || 0) / globalMaxXP) * 100)}%`,
                            background: barColor,
                            borderRadius: 2,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          {globalUsers.length === 0 && !globalLoading && !globalError && (
            <div className="c" style={{ textAlign: 'center', padding: '28px 20px' }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🌍</div>
              <div
                style={{ fontSize: 15, fontWeight: 800, color: 'var(--heading)', marginBottom: 6 }}
              >
                Be one of the first!
              </div>
              <div
                style={{ fontSize: 13, color: 'var(--subtext)', marginBottom: 16, lineHeight: 1.5 }}
              >
                The global leaderboard fills as more learners join. Invite a friend and claim your
                spot at the top.
              </div>
              <button
                onClick={() => {
                  const text =
                    "I'm learning Croatian with Naša Hrvatska — join me! 🇭🇷 https://nasahrvatska.com?ref=invite";
                  if (navigator.share) {
                    navigator.share({ title: 'Naša Hrvatska', text }).catch(() => {});
                  } else {
                    navigator.clipboard.writeText(text).catch(() => {});
                  }
                }}
                style={{
                  padding: '10px 20px',
                  borderRadius: 12,
                  border: 'none',
                  background: '#0e7490',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer',
                  fontFamily: "'Outfit',sans-serif",
                }}
              >
                📤 Invite a Friend
              </button>
            </div>
          )}
          {globalLoading && (
            <div style={{ textAlign: 'center', color: 'var(--subtext)', padding: '16px' }}>
              ⏳ Loading…
            </div>
          )}
        </React.Fragment>
      )}

      {famTab === 'create' && (
        <div className="c" style={{ padding: 24 }}>
          <div style={{ fontSize: 14, color: '#44403c', marginBottom: 12 }}>
            Create a family group. You'll get a 6-character code to share with your family members.
          </div>
          <div
            style={{
              fontSize: 12,
              color: '#78716c',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              padding: '10px 14px',
              marginBottom: 16,
              lineHeight: 1.6,
            }}
          >
            <strong style={{ color: '#0f172a' }}>Parent/guardian notice:</strong> By creating a
            family group you confirm you are the parent or legal guardian of any minor members you
            invite, and consent to their display name and XP being visible within the group.{' '}
            <a
              href="/privacy.html"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#0e7490' }}
            >
              Privacy Policy
            </a>
          </div>
          {famErr && (
            <div
              style={{
                background: famErr.startsWith('✅') ? 'rgba(22,163,74,.08)' : 'rgba(220,38,38,.08)',
                border: '1px solid',
                borderColor: famErr.startsWith('✅') ? 'rgba(22,163,74,.2)' : 'rgba(220,38,38,.2)',
                borderRadius: 10,
                padding: '12px 16px',
                color: famErr.startsWith('✅') ? '#16a34a' : '#dc2626',
                fontSize: 14,
                fontWeight: 600,
                marginBottom: 16,
              }}
            >
              {famErr}
            </div>
          )}
          <label
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#78716c',
              display: 'block',
              marginBottom: 6,
            }}
          >
            FAMILY NAME
          </label>
          <input
            type="text"
            placeholder={'e.g. "The Horvat Family"'}
            value={famName}
            onChange={(e) => {
              setFamName(e.target.value);
              setFamErr('');
            }}
            style={{ marginBottom: 16 }}
          />
          <button
            className="b bp"
            style={{ width: '100%', fontSize: 16 }}
            disabled={famLoading}
            onClick={() => {
              if (!famName.trim()) {
                setFamErr('Please enter a family name.');
                return;
              }
              if (!au || !au.e) {
                setFamErr('You must be logged in.');
                return;
              }
              setFamLoading(true);
              fbCreateFamily(famName.trim(), au.u, au.e, name || au.d).then((r) => {
                setFamLoading(false);
                if (r.ok) {
                  setFamData(r.family ?? null);
                  setFamTab('main');
                  setFamName('');
                  setFamErr('');
                } else setFamErr(r.err ?? '');
              });
            }}
          >
            {famLoading ? 'Creating...' : '👨‍👩‍👧‍👦 Create Family Group'}
          </button>
        </div>
      )}

      {famTab === 'join' && (
        <div className="c" style={{ padding: 24 }}>
          <div style={{ fontSize: 14, color: '#44403c', marginBottom: 16 }}>
            Enter the 6-character family code that was shared with you.
          </div>
          {famErr && (
            <div
              style={{
                background: famErr.startsWith('✅') ? 'rgba(22,163,74,.08)' : 'rgba(220,38,38,.08)',
                border: '1px solid',
                borderColor: famErr.startsWith('✅') ? 'rgba(22,163,74,.2)' : 'rgba(220,38,38,.2)',
                borderRadius: 10,
                padding: '12px 16px',
                color: famErr.startsWith('✅') ? '#16a34a' : '#dc2626',
                fontSize: 14,
                fontWeight: 600,
                marginBottom: 16,
              }}
            >
              {famErr}
            </div>
          )}
          <label
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#78716c',
              display: 'block',
              marginBottom: 6,
            }}
          >
            FAMILY CODE
          </label>
          <input
            type="text"
            placeholder="e.g. AB3X7K"
            value={famCode}
            onChange={(e) => {
              setFamCode(e.target.value.toUpperCase());
              setFamErr('');
            }}
            maxLength={6}
            style={{
              marginBottom: 16,
              textAlign: 'center',
              letterSpacing: 6,
              fontSize: 24,
              fontWeight: 800,
              textTransform: 'uppercase',
            }}
          />
          <button
            className="b bp"
            style={{ width: '100%', fontSize: 16 }}
            disabled={famLoading}
            onClick={() => {
              if (famCode.trim().length !== 6) {
                setFamErr('Code must be 6 characters.');
                return;
              }
              if (!au || !au.e) {
                setFamErr('You must be logged in.');
                return;
              }
              setFamLoading(true);
              fbJoinFamily(famCode.trim(), au.u, au.e, name || au.d, myWeekXP).then((r) => {
                setFamLoading(false);
                if (r.ok) {
                  setFamData(r.family ?? null);
                  setFamTab('main');
                  setFamCode('');
                  setFamErr('');
                } else setFamErr(r.err ?? '');
              });
            }}
          >
            {famLoading ? 'Joining...' : '🔗 Join Family'}
          </button>
        </div>
      )}

      {famTab === 'league' && (
        <WeeklyLeague authUser={au} name={name} stats={stats} goBack={() => setFamTab('main')} />
      )}

      {/* ── RECENT ACHIEVEMENTS ── */}
      {(() => {
        const achievements = getRecentAchievements();
        if (achievements.length === 0) return null;
        return (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: 'var(--subtext)',
                  letterSpacing: '.1em',
                  textTransform: 'uppercase',
                }}
              >
                🏅 My Achievements
              </div>
              <div style={{ flex: 1, height: 1, background: 'var(--card-b)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(achievements as { type: string; date: string | number }[])
                .slice(0, 5)
                .map((a, i) => {
                  const icon = ACHIEVEMENT_ICONS[a.type as keyof typeof ACHIEVEMENT_ICONS] || '🌟';
                  const date = new Date(a.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  });
                  const reactionKey = `nh_react_${a.type}_${a.date}`;
                  const localReactions = JSON.parse(localStorage.getItem(reactionKey) || '{}');
                  // Build achievementKey for Firestore: "{safeEmail}_{type}_{date}"
                  const ownerEmail = au ? au.e : '';
                  const achievementKey = `${ownerEmail}_${a.type}_${a.date}`;
                  const safeKey = achievementKey.replace(/[.#$/\[\]]/g, '_');
                  // Merge local reactions with Firestore reactions from other family members
                  const reactionData = firestoreReactions[safeKey];
                  const allFsReactions = reactionData?.reactors
                    ? Object.values(reactionData.reactors).map((r) => r.emoji)
                    : [];
                  // Build a summary of who reacted for display
                  const fsReactorNames = reactionData?.reactors
                    ? Object.values(reactionData.reactors)
                        .map((r) => r.name)
                        .filter(Boolean)
                    : [];
                  return (
                    <div
                      key={i}
                      style={{
                        background: 'var(--card)',
                        border: '1px solid var(--card-b)',
                        borderRadius: 14,
                        padding: '12px 14px',
                      }}
                    >
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}
                      >
                        <span style={{ fontSize: 22 }}>{icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--heading)' }}>
                            {a.type
                              .replace(/_/g, ' ')
                              .replace(/\b\w/g, (c: string) => c.toUpperCase())}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--subtext)', fontWeight: 600 }}>
                            {date}
                          </div>
                        </div>
                        {fsReactorNames.length > 0 && (
                          <div style={{ fontSize: 11, color: 'var(--subtext)', fontWeight: 600 }}>
                            {allFsReactions.slice(0, 3).join('')}{' '}
                            {fsReactorNames.slice(0, 2).join(', ')}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {REACTION_EMOJIS.map((emoji) => {
                          const localCount = localReactions[emoji] || 0;
                          // Count how many Firestore reactors used this emoji
                          const fsCount = allFsReactions.filter((e) => e === emoji).length;
                          const count = Math.max(localCount, fsCount);
                          return (
                            <button
                              key={emoji}
                              onClick={() => {
                                const updated = {
                                  ...localReactions,
                                  [emoji]: (localReactions[emoji] || 0) + 1,
                                };
                                localStorage.setItem(reactionKey, JSON.stringify(updated));
                                // Sync to Firestore so other family members see this reaction
                                if (famCode) {
                                  const reactorEmail = au?.e || '';
                                  fbSaveReaction(
                                    famCode,
                                    achievementKey,
                                    emoji,
                                    name || 'Someone',
                                    reactorEmail,
                                  ).catch(() => {});
                                }
                                // Force re-render by triggering a state update
                                setReactionTick((t) => t + 1);
                              }}
                              style={{
                                padding: '4px 8px',
                                borderRadius: 8,
                                border: '1px solid var(--card-b)',
                                background: 'var(--bar-bg)',
                                cursor: 'pointer',
                                fontSize: 13,
                                fontWeight: 600,
                                color: 'var(--heading)',
                                fontFamily: "'Outfit',sans-serif",
                              }}
                            >
                              {emoji}
                              {count > 0 ? ` ${count}` : ''}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
