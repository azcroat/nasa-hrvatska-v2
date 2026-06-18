import React, { useState, useMemo, useEffect } from 'react';
import type { AuthUser } from '../../types';

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
  launchActivity?: (screen: string, category?: string) => void | Promise<void>;
  launchStory?: (storyId: string) => void;
}

import { getStreak, getDailyChallenge, preloadAudio, DAILY_QUESTS } from '../../data';
import { useContent } from '../../hooks/useContent';
import { evalCk } from '../../lib/learnPathRules';
import { getActiveCampaign } from '../../lib/seasonalCampaign';
import { getWordOfDay, getPhraseOfDay } from '../../lib/wordOfDay.js';
import TodaysDiscoveries from './TodaysDiscoveries';
import { weekKey, localDateStr } from '../../lib/dateUtils.js';
import { useApp } from '../../context/AppContext';
import { useStats } from '../../context/StatsContext';
import { safeGetItem } from '../../hooks/useLocalStorage';
import GoalSetterModal from '../shared/GoalSetterModal';
import { shouldShowGoalModal } from '../../lib/onboardingGates';
import WelcomeBackBanners from './WelcomeBackBanners';
import { useDailySession } from '../../hooks/useDailySession';
import { getUserCefr } from '../../lib/cefr';
import SessionCard from './SessionCard';
import { getServableReviewCount } from '../../lib/srs';

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
  launchActivity,
  launchStory,
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

  // uStreak is the canonical derived streak (union-merged active-day set; kept correct
  // cross-device by applyRemoteProgress/updateStreak). Do NOT Math.max with st.str — that
  // is independently merged and can be stale-inflated, which made the displayed streak
  // diverge across devices. `st` dep only forces a re-render when stats change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const streak = useMemo(() => getStreak(), [st]);

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

  const { content } = useContent();
  const LEARN_PATH = useMemo(() => content?.LEARN_PATH ?? [], [content?.LEARN_PATH]);
  const SEASONAL_CAMPAIGNS = useMemo(
    () => content?.SEASONAL_CAMPAIGNS ?? [],
    [content?.SEASONAL_CAMPAIGNS],
  );
  const activeCampaign = useMemo(() => getActiveCampaign(SEASONAL_CAMPAIGNS), [SEASONAL_CAMPAIGNS]);

  // Goal-setter modal ("What's your main goal?"). CRITICAL cross-device fix:
  // gate on `syncReady` so we wait for the Firestore restore before deciding the user
  // has no goal. `_syncReady` now opens only AFTER applyRemoteProgress has run, so by
  // the time it's true a returning user's `nh_goal_set` has been restored and the modal
  // stays hidden. Derived (not a one-shot useState) so it re-evaluates when syncReady
  // flips — the old `useState(() => !localStorage…)` captured the pre-restore value and
  // never re-checked, which re-prompted existing users for their goal on a new device.
  const [goalModalDismissed, setGoalModalDismissed] = useState(false);
  const showGoalModal = shouldShowGoalModal({
    syncReady: !!syncReady,
    dismissed: goalModalDismissed,
    hasGoalSet: !!localStorage.getItem('nh_goal_set'),
  });

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
      const itemDone = lv.items.map((it) => {
        totalItems++;
        const done = evalCk(it.ckRule, st);
        if (done) {
          totalDone++;
          lvd++;
        } else if (!nextItem)
          nextItem = { ...(it as unknown as LearnPathItem), levelTitle: lv.title };
        return done;
      });
      if (!activeLv && lvd < lv.items.length) {
        activeLv = lv as PathLevel;
        activeLvDone = lvd;
        activeLvItemDone = itemDone;
      }
    }
    if (!activeLv) {
      // SP11e: when LEARN_PATH is empty (content still hydrating from
      // /api/content/core), fall back to a placeholder level rather than
      // crashing on LEARN_PATH[-1]!. useContent re-renders when fetch lands.
      const lastLv = (LEARN_PATH[LEARN_PATH.length - 1] as PathLevel | undefined) ?? {
        level: 1,
        title: '',
        items: [],
      };
      activeLv = lastLv;
      activeLvDone = lastLv.items.length;
      activeLvItemDone = lastLv.items.map(() => true);
    }
    return {
      totalDone,
      totalItems,
      // (LEARN_PATH dep covers content hydration; st captures progress changes)
      pct: totalItems > 0 ? Math.round((totalDone / totalItems) * 100) : 0,
      activeLv,
      activeLvDone,
      activeLvItemDone,
      nextItem,
    };
  }, [st, LEARN_PATH]);

  const activePalette: Palette =
    LEVEL_PALETTE[(pathData.activeLv.level - 1) % LEVEL_PALETTE.length]!;

  // ── Daily Session Hub ──────────────────────────────────────────────────────
  const userCefr = getUserCefr(st.xp, st.lc, st.gc);
  // Build the set of words currently in the active vocabulary pool — used to
  // count SRS reviews that /review can actually serve (orphan cards whose word
  // was later removed from a category get dropped, matching ReviewScreen's
  // own filter so the home pill and the session SRS slot agree with reality).
  const poolWords = useMemo(() => {
    const V = (content?.V ?? {}) as Record<string, unknown[][]>;
    const s = new Set<string>();
    for (const cat of Object.keys(V)) {
      const rows = V[cat] || [];
      for (const row of rows) {
        if (Array.isArray(row) && typeof row[0] === 'string') s.add(row[0] as string);
      }
    }
    return s;
  }, [content?.V]);
  const { session, isComplete, progress, markDone, nextActivity, tomorrowLabel, bonusActivities } =
    useDailySession(userCefr, poolWords);
  const dueCount = getServableReviewCount(poolWords);
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
  // returns), we read nh_session_completed (written by useAward only on real completion)
  // and call markDone only when the exercise was actually finished, not just backed out of.
  React.useEffect(() => {
    try {
      const pending = sessionStorage.getItem('nh_session_started');
      const completed = sessionStorage.getItem('nh_session_completed');
      sessionStorage.removeItem('nh_session_started');
      sessionStorage.removeItem('nh_session_completed');
      if (pending && completed === pending) {
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
      try {
        const pending = sessionStorage.getItem('nh_session_started');
        const completed = sessionStorage.getItem('nh_session_completed');
        sessionStorage.removeItem('nh_session_started');
        sessionStorage.removeItem('nh_session_completed');
        if (pending && completed === pending) {
          markDone(pending);
        }
      } catch {}
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
  void onSyncNow;
  void isNewUserWindow;
  void daysSinceJoin;
  void resumeLesson;
  void _allCats;
  void _sh;
  void currentDayIdx;
  void allQuestsDone;

  // The next incomplete LearnPath item (null when all complete)
  const nextLearnPathItem = pathData.nextItem ?? null;
  // Chip is "done" when stats.vs already contains the item id (written immediately by launchPathItem)
  const learnPathItemDone =
    nextLearnPathItem?.id != null && Array.isArray(st.vs)
      ? st.vs.includes(nextLearnPathItem.id)
      : false;

  return (
    <React.Fragment>
      {/* ── GOAL SETTER MODAL (genuinely new users only — see showGoalModal gating) ── */}
      {showGoalModal && <GoalSetterModal onComplete={() => setGoalModalDismissed(true)} />}

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
            if (launchActivity) {
              // launchActivity initialises pool data for exercises that need it
              // (flashcards, mcgame, match) before navigating — fixes the ScreenGuard
              // "start from Practice tab" fallback that appeared when bare setScr was used.
              void launchActivity(nextActivity.screen, nextActivity.category);
            } else {
              setScr(nextActivity.screen);
              if (sCurEx) sCurEx(nextActivity.screen);
            }
          }
        }}
        onKeepPracticing={() => setTab('practice')}
        streak={streak.count}
        xpThisWeek={xpThisWeek}
        wordsdue={dueCount}
        nextLearnPathItem={nextLearnPathItem}
        learnPathItemDone={learnPathItemDone}
        onLearnPathStart={(item) => {
          // launchPathItem() handles vocab pool load, dwell timer, and returnContext.
          // NEVER use setScr() directly here — see feedback_learnpath_launch.md.
          void launchPathItem(item as Parameters<typeof launchPathItem>[0]);
        }}
        bonusActivities={bonusActivities}
        onBonusStart={(act) => {
          try {
            sessionStorage.setItem('nh_session_started', act.screen);
          } catch {}
          if (launchActivity) {
            void launchActivity(act.screen, act.category);
          } else {
            setScr(act.screen);
            if (sCurEx) sCurEx(act.screen);
          }
        }}
      />

      {/* ── TODAY'S DISCOVERIES — tabbed widget replaces the 4 stacked cards
          (Word / Phrase / City / Story). Single fixed-height container,
          all four labels visible in the tab strip, user picks what to see.
          Eliminates the scroll that previously buried Story of the Day. */}
      <TodaysDiscoveries wod={wod} pod={pod} setScr={setScr} launchStory={launchStory} />
    </React.Fragment>
  );
}
