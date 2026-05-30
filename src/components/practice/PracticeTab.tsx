import React, { useState, useMemo } from 'react';
import type { AwardActivityType } from '../../lib/activityXp.js';
import { isUnlocked, getUserCefr } from '../../lib/cefr';
import { LISTEN, getSR, lvl, getStreak } from '../../data';
import { useContent } from '../../hooks/useContent';
import { localDateStr } from '../../lib/dateUtils.js';
import { useApp } from '../../context/AppContext';
import { useStats } from '../../context/StatsContext';
import DailyListeningCard from '../home/DailyListeningCard';
import WeakWordsPanel from '../home/WeakWordsPanel';
import QuestTracker from '../home/QuestTracker';
import SpeedChallenge from '../home/SpeedChallenge';
import { useAdaptivePractice } from '../../hooks/useAdaptivePractice';
import { useSmartRecommendations } from '../../hooks/useSmartRecommendations';
import ChallengePanel from './ChallengePanel';
import ExerciseCard from './ExerciseCard';
import AllPanel from './AllPanel';
import DrillPanel from './DrillPanel';
import ReviewPanel from './ReviewPanel';
import { buildExercises } from './exerciseCatalog';
import { buildAdaptiveCategoryMap } from './adaptiveCategoryMap';

// ── Recently-played tracking ─────────────────────────────────────────────────
// Saved as a JSON array of exercise IDs in localStorage (max 6 entries, newest first).
const RECENT_KEY = 'nh_recent_exercises';
function getRecentExercises() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
  } catch {
    return [];
  }
}
function recordRecentExercise(id: string) {
  try {
    const prev = getRecentExercises().filter((x: string) => x !== id);
    localStorage.setItem(RECENT_KEY, JSON.stringify([id, ...prev].slice(0, 6)));
  } catch {}
}

interface PracticeTabProps {
  allCats: string[];
  sh: <T>(arr: T[]) => T[];
  sCurEx: (id: string) => void;
  onLaunchQuiz: (items: unknown[]) => void;
  onLaunchFlash: (items: unknown[]) => void;
  onLaunchListen: (items: unknown[]) => void;
  onLaunchMatch: (items: unknown[]) => void;
  onLaunchSpeaking: (items?: unknown[]) => void;
  award: (amt: number, celebrate?: boolean, activityType?: AwardActivityType) => void;
  launchPathItem: (item: unknown) => void;
}

// Q-4: PracticeTab now receives callbacks instead of raw App.jsx state setters.
// Screens manage their own state; App.jsx only keeps state needed by screen props.
export default function PracticeTab({
  allCats,
  sh,
  sCurEx,
  onLaunchQuiz,
  onLaunchFlash,
  onLaunchListen,
  onLaunchMatch,
  onLaunchSpeaking,
  award,
  launchPathItem,
}: PracticeTabProps) {
  const { setScr } = useApp();
  const { stats: st } = useStats();
  const { content } = useContent();
  const V = useMemo(() => (content?.V ?? {}) as Record<string, any[]>, [content]);
  const lc = st?.lc ?? 0;

  const userCefr = getUserCefr(st?.xp ?? 0, st?.lc ?? 0, st?.gc ?? 0);
  const nextCefrTier = (() => {
    const order = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const idx = order.indexOf(userCefr);
    return idx >= 0 && idx < order.length - 1 ? order[idx + 1] : null;
  })();
  const [lockedToast, setLockedToast] = useState<string | null>(null);

  function showLockedToast(requiredCefr: string) {
    setLockedToast(`Available at ${requiredCefr} — keep learning to unlock`);
    setTimeout(() => setLockedToast(null), 2000);
  }

  // Compute quest completion from localStorage — same logic as HomeTab
  const streak = useMemo(() => getStreak(), []);
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
  const allQuestsDone = Object.values(questsDone).every(Boolean);
  const [weakMsg, setWeakMsg] = useState('');
  // openCat: which category tile is expanded in the browse grid ('grammar'|'vocab'|'practical'|'advanced'|null)
  const [openCat, setOpenCat] = useState<string | null>(null);
  // activeIntent: which intent panel is shown ('review'|'drill'|'challenge')
  // Auto-selects 'review' if the user has SRS items due, otherwise defaults to 'drill'
  const [activeIntent, setActiveIntent] = useState(() => {
    try {
      const sr = JSON.parse(localStorage.getItem('nh_sr') || '{}') as Record<
        string,
        { due?: number }
      >;
      const now = Date.now();
      return Object.values(sr).some((v) => v.due != null && v.due <= now) ? 'review' : 'drill';
    } catch {
      return 'drill';
    }
  });

  // Default expanded so quests are visible without an extra tap. The
  // previous default (collapsed) was paired with a redundant always-visible
  // Daily Quests strip at the bottom of Practice; that strip was removed
  // because it was non-functional, so defaulting the top tracker to
  // collapsed would hide quests entirely.
  const [questsExpanded, setQuestsExpanded] = useState(true);
  const [speedExpanded, setSpeedExpanded] = useState(false);

  const { practiceQueue } = useAdaptivePractice();

  // Memoized so event handlers always get a stable array reference without
  // recomputing the flatMap on every parent render.
  const pool = useMemo(
    () => allCats.flatMap((cc) => (V as Record<string, string[][]>)[cc] || []),
    [allCats, V],
  );

  function startQuiz() {
    const items = sh(pool)
      .slice(0, 20)
      .map((w) => {
        const wr = sh(pool.filter((x) => x[1] !== w[1]))
          .slice(0, 3)
          .map((x) => x[1]);
        return { hr: w[0], en: w[1], ph: w[2], opts: sh([w[1]].concat(wr)), correct: w[1] };
      });
    onLaunchQuiz(items);
  }
  function startFlashcards() {
    onLaunchFlash(sh(pool).slice(0, 20));
  }
  function startMatch() {
    const sel = sh(pool).slice(0, 6);
    const initPool = sh(
      sel
        .map((w, i) => ({ id: 'h' + i, t: w[0], p: i, tp: 'hr' }))
        .concat(sel.map((w, i) => ({ id: 'e' + i, t: w[1], p: i, tp: 'en' }))),
    );
    onLaunchMatch(initPool);
  }
  function startTyping() {
    setScr('typing');
    sCurEx('typing');
  }
  function startListening() {
    onLaunchListen(sh(LISTEN).slice(0, 8));
  }
  function startSpeaking() {
    onLaunchSpeaking(sh(pool).slice(0, 6));
  }
  function _startWeakWords() {
    const d = getSR();
    const weak = Object.entries(d)
      .filter((e) => e[1].w > 0)
      .sort((a, b) => b[1].w / (b[1].r + 1) - a[1].w / (a[1].r + 1));
    if (weak.length < 3) {
      setWeakMsg(
        "Words you miss 3+ times show up here for focused review. Make some mistakes — it's how you learn!",
      );
      return;
    }
    const weakWords = weak
      .slice(0, 15)
      .map((e) => pool.find((w) => w[0] === e[0]))
      .filter((w): w is string[] => !!w);
    if (weakWords.length < 3) {
      setWeakMsg('Not enough weak words yet — keep practicing!');
      return;
    }
    const items = weakWords.map((w) => {
      const wr = sh(pool.filter((x) => x[1] !== w[1]))
        .slice(0, 3)
        .map((x) => x[1] ?? '');
      return { hr: w[0], en: w[1], ph: w[2], opts: sh([w[1] ?? ''].concat(wr)), correct: w[1] };
    });
    onLaunchQuiz(items);
  }
  function startReview() {
    setScr('review');
    sCurEx('review');
  }
  function startPitchAccent() {
    setScr('pitchaccent');
    sCurEx('pitchaccent');
  }
  function startShadowing() {
    setScr('shadowing');
    sCurEx('shadowing');
  }
  function startAspectDrill() {
    setScr('aspectdrill');
    sCurEx('aspectdrill');
  }

  // Q-4: Screens (ZnamGame, Unjumble, PrepDrill, NumTime) all manage their own state internally.
  // These launch functions only navigate — no App.jsx state setters needed.
  const specialInit = {
    znam: () => {
      setScr('znam');
      sCurEx('znam');
    },
    unjumble: () => {
      setScr('unjumble');
      sCurEx('unjumble');
    },
    prepdrill: () => {
      setScr('prepdrill');
      sCurEx('prepdrill');
    },
    numtime: () => {
      setScr('numtime');
      sCurEx('numtime');
    },
  };
  const go = (screen: string, id?: string) => {
    const exerciseId = id ?? screen;
    if (screen.startsWith('slang:')) {
      const section = screen.slice(6);
      return () => {
        recordRecentExercise(exerciseId);
        localStorage.setItem('slangInitSection', section);
        setScr('slang');
        sCurEx('slang');
      };
    }
    const base =
      (specialInit as Record<string, () => void>)[screen] ??
      (() => {
        setScr(screen);
        sCurEx(screen);
      });
    return () => {
      recordRecentExercise(exerciseId);
      base();
    };
  };

  // ── SMART RECOMMENDATIONS ──
  const recs = useSmartRecommendations({ lc, V, sh, sCurEx, onLaunchFlash, startSpeaking });
  const { dueReviews } = recs; // for the pill badge; the panels consume the rest of `recs`

  // ── ALL EXERCISES FLAT ARRAY ──────────────────────────────────────────
  // category: 'grammar' | 'vocab' | 'practical' | 'advanced'
  const EXERCISES = buildExercises({
    go,
    setScr,
    sCurEx,
    startPitchAccent,
    startShadowing,
    startReview,
    startAspectDrill,
  });

  const ADAPTIVE_CATEGORY_MAP = buildAdaptiveCategoryMap({
    setScr,
    sCurEx,
    onLaunchFlash,
    startSpeaking,
    sh,
    allCats,
    V,
  });

  const availableExercises = EXERCISES.filter((ex) => isUnlocked(ex.cefr, userCefr));
  const lockedExercises = EXERCISES.filter((ex) => !isUnlocked(ex.cefr, userCefr));

  // Daily quest progress for Practice tab header
  const practiceQuestsDone = (() => {
    const d = new Date().toISOString().slice(0, 10);
    const speak = localStorage.getItem('nh_quest_speak_' + d) === '1';
    const grammar = localStorage.getItem('nh_quest_grammar_' + d) === '1';
    const master = localStorage.getItem('nh_quest_master_' + d) === '1';
    const reading = localStorage.getItem('nh_quest_reading_' + d) === '1';
    const done = [speak, grammar, master, reading].filter(Boolean).length;
    return { done, total: 4, speak, grammar, master, reading };
  })();

  return (
    <div>
      {/* ── PRACTICE TAB HERO ───────────────────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(150deg,#0369a1 0%,#0e7490 45%,#0891b2 100%)',
          borderRadius: 20,
          overflow: 'hidden',
          marginBottom: 20,
          position: 'relative',
          boxShadow: '0 8px 32px rgba(14,116,144,.35)',
        }}
      >
        <div style={{ height: 3, background: 'linear-gradient(90deg,#0e7490,#0369a1)' }} />
        <div className="tab-hero-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                flexShrink: 0,
                background: 'rgba(255,255,255,.14)',
                border: '1.5px solid rgba(255,255,255,.28)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
              }}
            >
              🎮
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 900,
                  color: 'rgba(255,255,255,.65)',
                  letterSpacing: '.15em',
                  textTransform: 'uppercase',
                  marginBottom: 3,
                }}
              >
                Practice
              </div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 900,
                  color: '#fff',
                  lineHeight: 1.1,
                  fontFamily: "'Playfair Display',serif",
                }}
              >
                {userCefr} Level
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.65)', marginTop: 3 }}>
                {practiceQuestsDone.done} of {practiceQuestsDone.total} quests done today
              </div>
            </div>
            {nextCefrTier && (
              <div
                style={{
                  background: 'rgba(255,255,255,.15)',
                  border: '1px solid rgba(255,255,255,.25)',
                  borderRadius: 10,
                  padding: '5px 9px',
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#fff',
                  flexShrink: 0,
                }}
              >
                → {nextCefrTier}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Voice Conversation hero removed — was a duplicate entry point
          for the AI feature family that already lives under the dedicated
          AI Tutor tab. Single canonical home (AI Tutor) cleans Practice
          into a pure drills surface and prepares for paywall gating. */}

      {/* ── LOCKED TILE TOAST ── */}
      {lockedToast && (
        <div
          style={{
            position: 'fixed',
            bottom: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(30,30,40,.92)',
            color: '#fff',
            borderRadius: 12,
            padding: '10px 18px',
            fontSize: 13,
            fontWeight: 700,
            zIndex: 9999,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {lockedToast}
        </div>
      )}

      {/* ── DAILY QUESTS ─────────────────────────────────────────────────── */}
      {!questsExpanded ? (
        <button
          onClick={() => setQuestsExpanded(true)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 14px',
            background: 'var(--card)',
            border: '1.5px solid var(--card-b)',
            borderRadius: 14,
            cursor: 'pointer',
            marginBottom: 14,
            fontFamily: "'Outfit',sans-serif",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              fontSize: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(14,116,144,.12)',
              flexShrink: 0,
            }}
          >
            🏆
          </div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--heading)' }}>Quests</div>
            <div style={{ fontSize: 11, color: 'var(--subtext)', marginTop: 1 }}>
              {practiceQuestsDone.done} of {practiceQuestsDone.total} complete
            </div>
          </div>
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            {[
              practiceQuestsDone.speak,
              practiceQuestsDone.grammar,
              practiceQuestsDone.master,
              practiceQuestsDone.reading,
            ].map((done, i) => (
              <div
                key={i}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: done ? '#0e7490' : 'var(--card-b)',
                  border: done ? 'none' : '1.5px solid var(--card-b)',
                }}
              />
            ))}
          </div>
          <div style={{ fontSize: 14, color: 'var(--subtext)' }}>›</div>
        </button>
      ) : (
        <>
          <button
            onClick={() => setQuestsExpanded(false)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--subtext)',
              fontSize: 11,
              fontWeight: 700,
              marginBottom: 6,
              padding: '4px 0',
              fontFamily: "'Outfit',sans-serif",
            }}
          >
            ‹ Collapse quests
          </button>
          <QuestTracker
            questsDone={questsDone}
            allQuestsDone={allQuestsDone}
            onQuestStart={(questId, screen) => {
              if (questId === 'speak' || questId === 'speak2') {
                const pool = allCats
                  .flatMap((t) => (V as Record<string, string[][]>)[t] || [])
                  .filter((w) => w && w[0] && w[1]);
                const items = sh(pool).slice(0, 6);
                onLaunchSpeaking(
                  items.length ? items : [['Dobar dan', 'Good day', 'DOH-bar dahn']],
                );
              } else if (questId === 'grammar' || questId === 'grammar2') {
                if (launchPathItem) launchPathItem({ go: 'grammar' });
                else setScr('grammar');
              } else if (questId === 'vocab' || questId === 'vocab2') {
                if (launchPathItem) launchPathItem({ go: 'lesson' });
                else setScr('learnpath');
              } else if (questId === 'perfect') {
                const pool = allCats
                  .flatMap((t) => (V as Record<string, string[][]>)[t] || [])
                  .filter((w) => w && w[0] && w[1]);
                onLaunchFlash(sh(pool).slice(0, 20));
              } else {
                setScr(screen);
              }
            }}
          />
        </>
      )}

      {/* ── SPEED CHALLENGE ──────────────────────────────────────────────── */}
      {!speedExpanded ? (
        <button
          onClick={() => setSpeedExpanded(true)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 14px',
            background: 'var(--card)',
            border: '1.5px solid var(--card-b)',
            borderRadius: 14,
            cursor: 'pointer',
            marginBottom: 14,
            fontFamily: "'Outfit',sans-serif",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              fontSize: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(217,119,6,.12)',
              flexShrink: 0,
            }}
          >
            ⚡
          </div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--heading)' }}>
              Speed Challenge
            </div>
            <div style={{ fontSize: 11, color: 'var(--subtext)', marginTop: 1 }}>
              Beat your best time — tap to play
            </div>
          </div>
          <div style={{ fontSize: 14, color: 'var(--subtext)' }}>›</div>
        </button>
      ) : (
        <>
          <button
            onClick={() => setSpeedExpanded(false)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--subtext)',
              fontSize: 11,
              fontWeight: 700,
              marginBottom: 6,
              padding: '4px 0',
              fontFamily: "'Outfit',sans-serif",
            }}
          >
            ‹ Collapse
          </button>
          <SpeedChallenge />
        </>
      )}

      {/* ── ADAPTIVE PRACTICE — smart queue for due categories ─────────────────── */}
      {practiceQueue.length > 0 && (
        <>
          <div className="section-hdr" style={{ marginTop: 4 }}>
            <div className="section-hdr-icon" style={{ background: 'rgba(14,116,144,.12)' }}>
              🎯
            </div>
            <div className="section-hdr-text">
              <div className="section-hdr-title">Practice Now</div>
              <div className="section-hdr-sub">Your weakest areas — due for review</div>
            </div>
          </div>
          <div className="todays-picks-grid" style={{ marginBottom: 20 }}>
            {practiceQueue.slice(0, 3).map((item) => {
              const cfg = ADAPTIVE_CATEGORY_MAP[item.category];
              if (!cfg) return null;
              return (
                <ExerciseCard
                  key={item.category}
                  id={`adaptive-${item.category}`}
                  label={cfg.label}
                  icon={cfg.icon}
                  desc={cfg.desc}
                  action={cfg.action}
                />
              );
            })}
          </div>
        </>
      )}

      {/* ── DAILY LISTENING — comprehensible input at user's CEFR level ── */}
      {lc >= 2 && (
        <DailyListeningCard level={String(lvl(st?.xp || 0))} award={award || (() => {})} />
      )}

      {/* ── WEAK WORDS — surface vocabulary needing most practice ─────── */}
      {lc >= 3 && <WeakWordsPanel setScr={setScr} />}

      {/* ── INTENT STRIP ─────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          overflowX: 'auto',
          gap: 8,
          marginBottom: 16,
          scrollbarWidth: 'none',
          padding: '2px 0 6px',
        }}
      >
        {[
          {
            id: 'review',
            label: 'Weakest Areas',
            badge: dueReviews.length > 0 ? dueReviews.length : null,
          },
          { id: 'drill', label: 'Drill', badge: null },
          { id: 'challenge', label: 'Quick Game', badge: null },
          { id: 'all', label: 'All Exercises', badge: null },
        ].map((pill) => {
          const isActive = activeIntent === pill.id;
          return (
            <button
              key={pill.id}
              onClick={() => setActiveIntent(pill.id)}
              style={{
                flexShrink: 0,
                padding: '8px 16px',
                borderRadius: 20,
                border: isActive ? '1.5px solid #0e7490' : '1.5px solid rgba(14,116,144,.3)',
                background: isActive ? '#0e7490' : 'rgba(14,116,144,.06)',
                color: isActive ? '#fff' : '#0e7490',
                fontFamily: "'Outfit',sans-serif",
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all .15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              {pill.label}
              {pill.badge && (
                <span
                  style={{
                    marginLeft: 6,
                    background: isActive ? 'rgba(255,255,255,.3)' : '#0e7490',
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: 800,
                    borderRadius: 99,
                    padding: '0px 5px',
                  }}
                >
                  {pill.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── ANIMATED CONTENT PANEL ──────────────────────────────────────── */}
      <div key={activeIntent} style={{ animation: 'rise .22s ease both' }}>
        {/* ── REVIEW PANEL ──────────────────────────────────────────────── */}
        {activeIntent === 'review' && (
          <ReviewPanel
            recs={recs}
            startReview={startReview}
            startFlashcards={startFlashcards}
            startWeakWords={_startWeakWords}
            weakMsg={weakMsg}
            setWeakMsg={setWeakMsg}
            setScr={setScr}
            sCurEx={sCurEx}
          />
        )}

        {/* ── DRILL PANEL ─────────────────────────────────────────────────── */}
        {activeIntent === 'drill' && (
          <DrillPanel
            availableExercises={availableExercises}
            lockedExercises={lockedExercises}
            openCat={openCat}
            setOpenCat={setOpenCat}
            setScr={setScr}
            sCurEx={sCurEx}
            nextCefrTier={nextCefrTier}
            showLockedToast={showLockedToast}
            recs={recs}
          />
        )}

        {/* ── CHALLENGE PANEL ─────────────────────────────────────────────── */}
        {activeIntent === 'challenge' && (
          <ChallengePanel
            startQuiz={startQuiz}
            startFlashcards={startFlashcards}
            startMatch={startMatch}
            startTyping={startTyping}
            startListening={startListening}
            startSpeaking={startSpeaking}
            setScr={setScr}
            sCurEx={sCurEx}
          />
        )}
        {/* ── ALL EXERCISES PANEL ─────────────────────────────────────────── */}
        {activeIntent === 'all' && <AllPanel availableExercises={availableExercises} />}
      </div>

      {/* AdaptiveInsightsCard removed — AI-powered surface (hits
          /api/adaptive-insights), so it belongs only on the AI Tutor
          tab per the consolidation rule. Wasn't functioning here either. */}

      {/* Bottom "Daily Quests" strip removed — it was a non-actionable
          presentational duplicate of the top quest pill (line ~1530),
          which already shows the same {done}/4 count AND is clickable
          to expand quest detail. Keeping both was visual clutter without
          adding any function. The underlying quest-tracking system
          (src/lib/quests.ts markQuest helper) is unchanged and still
          drives the top pill. */}
    </div>
  );
}
