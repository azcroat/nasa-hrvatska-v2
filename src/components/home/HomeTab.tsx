import React, { useState, useMemo, useEffect } from 'react';
import type { Stats, AuthUser } from '../../types';

interface LearnPathItem {
  id?: string;
  type?: string;
  title?: string;
  name?: string;
  level?: number;
  levelTitle?: string;
  [key: string]: unknown;
}
interface PathLevel {
  level: number;
  title: string;
  desc?: string;
  items: unknown[];
}
interface PathData {
  totalDone: number;
  totalItems: number;
  pct: number;
  activeLv: PathLevel;
  activeLvDone: number;
  activeLvItemDone: boolean[] | null;
  nextItem: LearnPathItem | null;
}
interface Palette {
  grad: string;
  light?: string;
  text: string;
  border: string;
  accent?: string;
}

interface HomeTabProps {
  dchlA: boolean[];
  sDchlA: (v: boolean[]) => void;
  dchlSl: boolean;
  sDchlSl: (v: boolean) => void;
  getWeekStats: () => { strong: number };
  setTab: (tab: string) => void;
  sCurEx?: (screen: string) => void;
  allCats?: string[];
  sh?: (arr: unknown[][]) => unknown[][];
  launchPathItem: (item: LearnPathItem) => void;
  syncReady?: boolean;
  onSyncNow?: () => void;
  authUser?: AuthUser | null;
  comebackBonus?: boolean;
  goal?: string;
  isNewUserWindow?: boolean;
  daysSinceJoin?: number | null;
  resumeLesson?: (() => void) | null;
}

import {
  LEARN_PATH,
  getStreak,
  getDailyChallenge,
  preloadAudio,
  DAILY_QUESTS,
  getActiveCampaign,
} from '../../data';
import { getWordOfDay, getPhraseOfDay } from '../../lib/wordOfDay.js';
import WordOfDayCard from './WordOfDayCard';
import PhraseOfDayCard from './PhraseOfDayCard';
import { weekKey, localDateStr } from '../../lib/dateUtils.js';
import { useApp } from '../../context/AppContext';
import { useStats } from '../../context/StatsContext';
import { safeGetItem } from '../../hooks/useLocalStorage';
import GoalSetterModal from '../shared/GoalSetterModal';
import StreakMilestoneToast, { checkAndMarkMilestone } from '../shared/StreakMilestoneToast';
import WelcomeBackBanners from './WelcomeBackBanners';
import { useDailySession } from '../../hooks/useDailySession';
import { getUserCefr } from '../../lib/cefr';
import SessionCard from './SessionCard';
import { getDueReviews } from '../../lib/srs';

const LEVEL_PALETTE = [
  {
    grad: 'linear-gradient(135deg,#92400e,#b45309)',
    light: '#fef3c7',
    text: '#92400e',
    border: '#fcd34d',
  },
  {
    grad: 'linear-gradient(135deg,#065f46,#059669)',
    light: '#d1fae5',
    text: '#065f46',
    border: '#6ee7b7',
  },
  {
    grad: 'linear-gradient(135deg,#1e3a8a,#1d4ed8)',
    light: '#dbeafe',
    text: '#1e3a8a',
    border: '#93c5fd',
  },
  {
    grad: 'linear-gradient(135deg,#4c1d95,#6d28d9)',
    light: '#ede9fe',
    text: '#4c1d95',
    border: '#c4b5fd',
  },
  {
    grad: 'linear-gradient(135deg,#7f1d1d,#dc2626)',
    light: '#fee2e2',
    text: '#7f1d1d',
    border: '#fca5a5',
  },
  {
    grad: 'linear-gradient(135deg,#134e4a,#0d9488)',
    light: '#ccfbf1',
    text: '#134e4a',
    border: '#5eead4',
  },
  {
    grad: 'linear-gradient(135deg,#1e1b4b,#3730a3)',
    light: '#e0e7ff',
    text: '#1e1b4b',
    border: '#a5b4fc',
  },
];

function getWeekXP() {
  return safeGetItem('nh_week_xp_' + weekKey(), 0);
}

export default function HomeTab({
  dchlA,
  sDchlA: _sDchlA,
  dchlSl: _dchlSl,
  sDchlSl: _sDchlSl,
  getWeekStats,
  setTab,
  sCurEx,
  allCats: _allCats,
  sh: _sh,
  launchPathItem,
  syncReady,
  onSyncNow,
  authUser,
  comebackBonus,
  goal,
  isNewUserWindow = false,
  daysSinceJoin = null,
  resumeLesson = null,
}: HomeTabProps) {
  const { setScr, doSignUp, currentScreen } = useApp();
  const { stats: st, award } = useStats();
  const dc = useMemo(() => getDailyChallenge(), []);

  // getWeekStats reads external state; st is the change signal, getWeekStats is the accessor
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const ws = useMemo(() => getWeekStats(), [st, getWeekStats]);

  // getWeekXP reads localStorage; re-derive when stats change (st is the stat-change signal)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const weekXP = useMemo(() => getWeekXP(), [st]);

  const streak = useMemo(() => {
    const s = getStreak();
    // st.str is always correctly Math.max-merged from Firestore via mergeStatsFromRemote.
    // uStreak localStorage may lag behind (e.g. applyRemoteProgress hasn't fired yet, or
    // the device just came online). Always display the maximum of both sources so the UI
    // is never lower than what Firebase confirmed.
    return { ...s, count: Math.max(s.count || 0, st.str || 0) };
  }, [st]);

  // Track the current calendar day — updates when the app regains visibility so
  // word-of-day and phrase-of-day refresh automatically after midnight.
  const [currentDayIdx, setCurrentDayIdx] = useState(() => Math.floor(Date.now() / 86400000));
  useEffect(() => {
    const checkDay = () => {
      const newDay = Math.floor(Date.now() / 86400000);
      setCurrentDayIdx((prev) => (prev !== newDay ? newDay : prev));
    };
    document.addEventListener('visibilitychange', checkDay);
    return () => document.removeEventListener('visibilitychange', checkDay);
  }, []);

  // currentDayIdx signals a calendar day change; force recompute even though getWordOfDay uses Date internally
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const wod = useMemo(() => getWordOfDay(), [currentDayIdx]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pod = useMemo(() => getPhraseOfDay(), [currentDayIdx]);

  // Preload word-of-the-day audio on mount so first tap plays instantly
  useEffect(() => {
    if (wod?.hr) preloadAudio(wod.hr);
  }, [wod]);

  const userGoal =
    goal ||
    (() => {
      try {
        return localStorage.getItem('nh_goal');
      } catch {
        return null;
      }
    })() ||
    'fluent';

  // st.lc signals lesson completion; force campaign recompute when it changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const activeCampaign = useMemo(() => getActiveCampaign(), [st.lc]);

  // Goal-setter modal: show for any user who hasn't set a goal yet
  const [showGoalModal, setShowGoalModal] = useState(() => !localStorage.getItem('nh_goal_set'));

  // Streak milestone celebration — fires once per milestone level
  const [streakMilestone, setStreakMilestone] = useState<number | null>(null);
  useEffect(() => {
    if (streak.count > 0 && checkAndMarkMilestone(streak.count)) {
      setStreakMilestone(streak.count);
    }
  }, [streak.count]);

  const questsDone = useMemo(() => {
    const d = localDateStr();
    const q = (id: string) => localStorage.getItem('nh_quest_' + id + '_' + d) === '1';
    const hasStreak = streak.count > 0;
    return {
      speak: q('speak'),
      speak2: q('speak2'),
      grammar: q('grammar'),
      grammar2: q('grammar2'),
      master: q('master'),
      master2: q('master2'),
      reading: q('reading'),
      reading2: q('reading2'),
      culture: q('culture'),
      culture2: q('culture2'),
      vocab: q('vocab'),
      vocab2: q('vocab2'),
      write: q('write'),
      streak: hasStreak,
      streak_alive: hasStreak,
      perfect: q('perfect'),
    };
  }, [streak]);

  // Exclude streak/streak_alive from the "all done" check
  const allQuestsDone = Object.entries(questsDone)
    .filter(([k]) => k !== 'streak' && k !== 'streak_alive')
    .every(([, v]) => v);

  const _questXP = DAILY_QUESTS.filter((q) => (questsDone as Record<string, boolean>)[q.id]).reduce(
    (s, q) => s + q.xp,
    0,
  );
  void _questXP;

  // Award Daily Mastery +50 XP bonus the first time all quests are done today
  const _td = new Date();
  const today =
    _td.getFullYear() +
    '-' +
    String(_td.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(_td.getDate()).padStart(2, '0');
  const masteryKey = `nh_daily_mastery_${today}`;
  useEffect(() => {
    if (allQuestsDone && !localStorage.getItem(masteryKey)) {
      localStorage.setItem(masteryKey, '1');
      if (award) award(50, false, 'daily_discovery');
    }
  }, [allQuestsDone, masteryKey, award]);

  const doneCount = dchlA.filter(Boolean).length;
  const [_dcOpen, _setDcOpen] = useState(doneCount === 0);
  void _dcOpen;
  void _setDcOpen;

  const longAbsence = useMemo(() => {
    const ls = localStorage.getItem('nh_last_seen');
    if (!ls) return false;
    const parsed = parseInt(ls, 10);
    if (isNaN(parsed)) return false;
    const diff = Date.now() - parsed;
    return diff > 7 * 86400000;
  }, []);

  const pathData: PathData = useMemo(() => {
    let totalDone = 0,
      totalItems = 0;
    let activeLv: PathLevel | null = null,
      activeLvDone = 0,
      activeLvItemDone: boolean[] | null = null,
      nextItem: LearnPathItem | null = null;
    for (const lv of LEARN_PATH) {
      let lvd = 0;
      const itemDone = (
        lv.items as Array<Record<string, unknown> & { ck: (s: Stats) => boolean }>
      ).map((it) => {
        totalItems++;
        const done = it.ck(st);
        if (done) {
          totalDone++;
          lvd++;
        } else if (!nextItem)
          nextItem = { ...(it as LearnPathItem), levelTitle: lv.title } as LearnPathItem;
        return done;
      });
      if (!activeLv && lvd < lv.items.length) {
        activeLv = lv as PathLevel;
        activeLvDone = lvd;
        activeLvItemDone = itemDone;
      }
    }
    if (!activeLv) {
      const lastLv = LEARN_PATH[LEARN_PATH.length - 1]! as PathLevel;
      activeLv = lastLv;
      activeLvDone = lastLv.items.length;
      activeLvItemDone = lastLv.items.map(() => true);
    }
    return {
      totalDone,
      totalItems,
      pct: Math.round((totalDone / totalItems) * 100),
      activeLv,
      activeLvDone,
      activeLvItemDone,
      nextItem,
    };
  }, [st]);

  const activePalette: Palette =
    LEVEL_PALETTE[(pathData.activeLv.level - 1) % LEVEL_PALETTE.length]!;

  // ── Daily Session Hub ──────────────────────────────────────────────────────
  const userCefr = getUserCefr(st.xp, st.lc, st.gc);
  const { session, isComplete, progress, markDone, nextActivity, tomorrowLabel } =
    useDailySession(userCefr);
  const dueCount = getDueReviews().length;
  const xpThisWeek = (() => {
    try {
      return parseInt(localStorage.getItem('nh_week_xp_' + weekKey()) || '0', 10);
    } catch {
      return 0;
    }
  })();

  // markDone wiring — two-path approach to handle both architectures:
  //
  // PATH A (sessionStorage — primary): HomeTab unmounts when an exercise screen is shown
  // because AppRouter only renders HomeTab when currentScreen === 'dashboard'. The
  // prevScreenRef approach below can never fire in this case (HomeTab is gone). Instead,
  // onStart() writes the launched screen to sessionStorage; on the next mount (when user
  // returns), we read it back and call markDone.
  React.useEffect(() => {
    try {
      const pending = sessionStorage.getItem('nh_session_started');
      if (pending) {
        sessionStorage.removeItem('nh_session_started');
        markDone(pending);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — runs once on mount only

  // PATH B (prevScreenRef — secondary safety net): fires if HomeTab ever stays mounted
  // while currentScreen transitions (e.g., if the architecture changes).
  const prevScreenRef = React.useRef(currentScreen);
  React.useEffect(() => {
    const prev = prevScreenRef.current;
    prevScreenRef.current = currentScreen;
    if (currentScreen === 'dashboard' && prev !== 'dashboard' && prev !== 'welcome') {
      markDone(prev);
    }
  }, [currentScreen, markDone]);

  // Suppress unused variable warnings for props kept for API compatibility
  void dc;
  void ws;
  void weekXP;
  void userGoal;
  void activeCampaign;
  void activePalette;
  void pathData;
  void syncReady;
  void onSyncNow;
  void isNewUserWindow;
  void daysSinceJoin;
  void resumeLesson;
  void _allCats;
  void _sh;
  void launchPathItem;
  void currentDayIdx;
  void allQuestsDone;

  return (
    <React.Fragment>
      {/* ── GOAL SETTER MODAL (new users only) ── */}
      {showGoalModal && <GoalSetterModal onComplete={() => setShowGoalModal(false)} />}

      {/* ── STREAK MILESTONE CELEBRATION ── */}
      {streakMilestone && (
        <StreakMilestoneToast
          streakCount={streakMilestone}
          onDismiss={() => setStreakMilestone(null)}
        />
      )}

      {/* ── WELCOME BACK / COMEBACK BANNERS ── */}
      <WelcomeBackBanners comebackBonus={comebackBonus ?? false} longAbsence={longAbsence} />

      {/* ── GUEST SAVE-PROGRESS BANNER ── */}
      {!authUser && st.xp > 0 && (
        <div
          style={{
            background: 'linear-gradient(135deg, #0e7490, #164e63)',
            borderRadius: 14,
            padding: '12px 16px',
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span style={{ fontSize: 22, flexShrink: 0 }}>💾</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: 'rgba(255,255,255,0.75)',
                letterSpacing: '.04em',
              }}
            >
              Explore mode · {st.xp} XP earned
            </div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: 'rgba(255,255,255,0.85)',
                lineHeight: 1.4,
              }}
            >
              Create a free account to sync across all your devices
            </div>
          </div>
          <button
            onClick={doSignUp}
            style={{
              flexShrink: 0,
              background: '#fff',
              color: '#0e7490',
              border: 'none',
              borderRadius: 10,
              padding: '8px 14px',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              fontFamily: "'Outfit',sans-serif",
              whiteSpace: 'nowrap',
            }}
          >
            Save Free →
          </button>
        </div>
      )}

      {/* ── KNIGHT GREETING ── */}
      {authUser && (
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--subtext)',
            marginBottom: 12,
            paddingLeft: 2,
          }}
        >
          {(() => {
            const h = new Date().getHours();
            const g = h < 12 ? 'Dobro jutro' : h < 18 ? 'Dobar dan' : 'Dobra večer';
            return `${g}, ${authUser.d || 'Learner'}! 👋`;
          })()}
        </div>
      )}

      {/* ── DAILY SESSION CARD ── */}
      <SessionCard
        session={session}
        isComplete={isComplete}
        progress={progress}
        nextActivity={nextActivity}
        tomorrowLabel={tomorrowLabel}
        onStart={() => {
          if (nextActivity) {
            // Record the launched screen before navigation causes HomeTab to unmount.
            // HomeTab is only rendered when currentScreen === 'dashboard', so navigating
            // to an exercise screen unmounts it. On the next mount (when user returns),
            // the mount effect above reads this key and calls markDone().
            try {
              sessionStorage.setItem('nh_session_started', nextActivity.screen);
            } catch {}
            setScr(nextActivity.screen);
            if (sCurEx) sCurEx(nextActivity.screen);
          }
        }}
        onKeepPracticing={() => setTab('practice')}
        streak={streak.count}
        xpThisWeek={xpThisWeek}
        wordsdue={dueCount}
      />

      {/* ── WORD OF THE DAY ── */}
      {wod && <WordOfDayCard word={wod} />}

      {/* ── PHRASE OF THE DAY ── */}
      {pod && <PhraseOfDayCard phrase={pod} />}
    </React.Fragment>
  );
}
