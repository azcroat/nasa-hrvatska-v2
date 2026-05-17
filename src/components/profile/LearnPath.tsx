import React, { useRef, useEffect, useState, useMemo } from 'react';
import { H } from '../../data';
import { useContent } from '../../hooks/useContent';
import { evalCk, type CkRule } from '../../lib/learnPathRules';
import type { Stats, LearnPathItem } from '../../types';
import type { LevelQuizQuestion } from '../learn/LevelQuiz';

// ── Mastery gate helper ──────────────────────────────────────────────────────
// Returns true when targetLevel is unlocked.
// Rules (all must hold):
//   1. Level 1 is always unlocked.
//   2. Prev level >= 80% items complete (using evalCk(item.ckRule)).
//   3. Prev level quiz passed (score >= 7/10).
//   Grandfather: if prev level is 100% complete AND no quiz record exists,
//   treat as auto-passed so existing progress is never blocked.
type ItemWithCk = { ckRule?: CkRule; topic?: string };
function canUnlockLevel(
  targetLevel: number,
  prevLevelItems: ItemWithCk[],
  stats: Partial<Stats>,
): boolean {
  if (targetLevel <= 1) return true;
  const prevLevel = targetLevel - 1;
  const completedCount = prevLevelItems.filter((it) => evalCk(it.ckRule, stats)).length;
  const threshold80 = Math.ceil(prevLevelItems.length * 0.8);
  if (completedCount < threshold80) return false;
  const quizRecord = stats.levelQuizPasses?.[prevLevel];
  if (quizRecord && quizRecord.score >= 7) return true;
  // Grandfather: full prev-level completion with no quiz record -> auto-pass
  if (!quizRecord && completedCount >= prevLevelItems.length) return true;
  return false;
}

// ── Level Quiz question builder ──────────────────────────────────────────────
// V is passed in by the caller (sourced from useContent()) rather than
// dynamic-imported. SP11d moved V from the client `src/data/content.tsx`
// barrel to the server-side `/api/content/core` endpoint, so the old
// `await import('../../data')` returned `undefined` for V — questions came
// back empty and the LevelQuiz screen rendered no counter / no quiz body.
async function buildLevelQuizQuestions(
  levelItems: ItemWithCk[],
  V: Record<string, unknown[]>,
): Promise<LevelQuizQuestion[]> {
  const pool: { hr: string; en: string }[] = [];
  for (const item of levelItems) {
    if (!item.topic) continue;
    const vocab = (V[item.topic] ?? []) as string[][];
    pool.push(
      ...vocab
        .filter((w) => Array.isArray(w) && w[0] != null && w[1] != null)
        .slice(0, 6)
        .map((w) => ({ hr: w[0]!, en: w[1]! })),
    );
  }
  if (pool.length < 4) return [];
  // Deduplicate by hr word
  const seen = new Set<string>();
  const deduped = pool.filter((p) => {
    if (seen.has(p.hr)) return false;
    seen.add(p.hr);
    return true;
  });
  const shuffled = [...deduped].sort(() => Math.random() - 0.5).slice(0, 10);
  return shuffled.map((word) => {
    const distractors = deduped
      .filter((p) => p.en !== word.en)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((p) => p.en);
    // Pad distractors from pool if not enough
    if (distractors.length < 3) {
      const extra = pool.filter((p) => p.en !== word.en && !distractors.includes(p.en));
      while (distractors.length < 3 && extra.length > 0) {
        distractors.push(extra.splice(0, 1)[0]!.en);
      }
    }
    return {
      q: word.hr,
      opts: [word.en, ...distractors].sort(() => Math.random() - 0.5),
      answer: word.en,
      en: '',
    } satisfies LevelQuizQuestion;
  });
}

// Returns a Set of topic keys whose FSRS words are mostly overdue (skill decay signal).
// A topic is "decayed" when >40% of its reviewed words are past their due date.
function getDecayedTopics(learnPath: ReadonlyArray<{ items: ReadonlyArray<{ topic?: string }> }>) {
  try {
    const srData = JSON.parse(localStorage.getItem('nh_sr') || '{}');
    const now = Date.now();
    const decayed = new Set();
    learnPath.forEach((lv) =>
      lv.items.forEach((it) => {
        if (!it.topic) return;
        const cards = Object.entries(srData).filter(([, v]) => v && typeof v === 'object') as [
          string,
          Record<string, unknown>,
        ][];
        if (cards.length === 0) return;
        // Words belonging to this topic are identified by checking if they exist in srData
        // We use all reviewed words to approximate: count overdue fraction
        const topicCards = cards.filter(([, v]) => v['topic'] === it.topic);
        const checkSet = topicCards.length >= 3 ? topicCards : cards;
        const overdue = checkSet.filter(
          ([, v]) => ((v['due'] as number) || (v['nextDue'] as number) || 0) < now,
        ).length;
        if (checkSet.length > 0 && overdue / checkSet.length > 0.4) {
          decayed.add(it.topic);
        }
      }),
    );
    return decayed;
  } catch {
    return new Set();
  }
}

const LEVEL_COLORS = [
  {
    bg: 'linear-gradient(135deg,#16a34a,#15803d)',
    text: '#fff',
    glow: 'rgba(22,163,74,.4)',
    light: '#f0fdf4',
    border: '#86efac',
  }, // L1 – green
  {
    bg: 'linear-gradient(135deg,#0e7490,#164e63)',
    text: '#fff',
    glow: 'rgba(14,116,144,.4)',
    light: '#f0f9ff',
    border: '#7dd3fc',
  }, // L2 – teal
  {
    bg: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
    text: '#fff',
    glow: 'rgba(124,58,237,.4)',
    light: '#faf5ff',
    border: '#c4b5fd',
  }, // L3 – purple
  {
    bg: 'linear-gradient(135deg,#d97706,#b45309)',
    text: '#fff',
    glow: 'rgba(217,119,6,.4)',
    light: '#fffbeb',
    border: '#fcd34d',
  }, // L4 – amber
  {
    bg: 'linear-gradient(135deg,#e11d48,#be123c)',
    text: '#fff',
    glow: 'rgba(225,29,72,.4)',
    light: '#fff1f2',
    border: '#fca5a5',
  }, // L5 – red
  {
    bg: 'linear-gradient(135deg,#4f46e5,#4338ca)',
    text: '#fff',
    glow: 'rgba(79,70,229,.4)',
    light: '#eef2ff',
    border: '#a5b4fc',
  }, // L6 – indigo
  {
    bg: 'linear-gradient(135deg,#b45309,#78350f)',
    text: '#fff',
    glow: 'rgba(180,83,9,.4)',
    light: '#fef3c7',
    border: '#fde68a',
  }, // L7 – dark gold
];

const LEVEL_EMOJIS = ['🌱', '🌿', '🌳', '🌲', '🏔️', '⭐', '🏆'];
const STAGE_NAMES = [
  'Survivor',
  'Settler',
  'Communicator',
  'Explorer',
  'Hrvat',
  'Virtuoz',
  'Majstor',
];

// Returns a Set of level indices whose checkpoint has been passed
function getPassedCheckpoints() {
  try {
    return new Set(
      Object.keys(JSON.parse(localStorage.getItem('nh_checkpoints') || '{}')).map(Number),
    );
  } catch {
    return new Set();
  }
}

export default function LearnPath({
  st,
  setScr,
  goBack,
  onLaunchItem,
  onLaunchLegendary,
  onLaunchCheckpoint,
}: {
  st: Partial<Stats>;
  setScr?: (screen: string) => void;
  goBack: () => void;
  onLaunchItem?: (item: LearnPathItem) => void;
  onLaunchLegendary?: (item: LearnPathItem) => void;
  onLaunchCheckpoint?: (levelIndex: number, items: any[]) => void;
}) {
  const activeRef = useRef<HTMLDivElement | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [quizLaunching, setQuizLaunching] = useState(false);
  const passedCheckpoints = useMemo(() => getPassedCheckpoints(), []);
  const { content } = useContent();
  const LEARN_PATH = useMemo(() => content?.LEARN_PATH ?? [], [content?.LEARN_PATH]);
  const V = useMemo(() => (content?.V ?? {}) as Record<string, unknown[]>, [content?.V]);
  const decayedTopics = useMemo(() => getDecayedTopics(LEARN_PATH), [LEARN_PATH]);

  // Launch the LevelQuiz screen for the given 1-based level number
  async function launchLevelQuiz(levelNumber: number): Promise<void> {
    if (!setScr) return;
    setQuizLaunching(true);
    try {
      const levelData = LEARN_PATH[levelNumber - 1];
      if (!levelData) return;
      const questions = await buildLevelQuizQuestions(
        levelData.items as unknown as ItemWithCk[],
        V,
      );
      sessionStorage.setItem('nh_level_quiz', JSON.stringify({ levelNumber, questions }));
      sessionStorage.setItem('nh_ex_start', Date.now().toString());
      setScr('levelquiz');
    } finally {
      setQuizLaunching(false);
    }
  }

  // Calculate global progress
  let totalDone = 0,
    totalAll = 0;
  LEARN_PATH.forEach((lv) =>
    lv.items.forEach((it) => {
      totalAll++;
      if (evalCk(it.ckRule, st)) totalDone++;
    }),
  );

  // Find the first incomplete item (the "active" node)
  let activeLevel = -1,
    activeItem = -1;
  outer: for (let li = 0; li < LEARN_PATH.length; li++) {
    for (let ii = 0; ii < LEARN_PATH[li]!.items.length; ii++) {
      if (!evalCk(LEARN_PATH[li]!.items[ii]!.ckRule, st)) {
        activeLevel = li;
        activeItem = ii;
        break outer;
      }
    }
  }

  useEffect(() => {
    if (activeRef.current) {
      setTimeout(() => {
        activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 400);
    }
  }, []);

  const pct = totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : 0;

  return (
    <div className="scr-wrap" style={{ paddingBottom: 100 }}>
      {H('🗺️ My Learning Path', 'From zero to fluency — one step at a time', goBack)}

      {/* ── Global progress ring ────────────────────────────────────────── */}
      <div
        className="c"
        style={{
          marginBottom: 28,
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
          border: '1.5px solid #7dd3fc',
        }}
      >
        {/* Circular progress ring */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <svg width={80} height={80} viewBox="0 0 80 80">
            <defs>
              <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0e7490" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
            <circle cx={40} cy={40} r={32} fill="none" stroke="rgba(0,0,0,.08)" strokeWidth={8} />
            <circle
              cx={40}
              cy={40}
              r={32}
              fill="none"
              stroke="url(#ringGrad)"
              strokeWidth={8}
              strokeLinecap="round"
              strokeDasharray={201}
              strokeDashoffset={201 - (201 * pct) / 100}
              transform="rotate(-90 40 40)"
              style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)' }}
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 900, color: '#0e7490', lineHeight: 1 }}>
              {pct}%
            </div>
            <div style={{ fontSize: 9, color: '#64748b', fontWeight: 600 }}>done</div>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
            {totalDone} / {totalAll} milestones
          </div>
          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500, lineHeight: 1.5 }}>
            {pct === 100
              ? '🏆 All milestones complete! You are Hrvat!'
              : activeLevel >= 0
                ? `Currently on: ${LEARN_PATH[activeLevel]!.title} — ${LEARN_PATH[activeLevel]!.items[activeItem]?.name}`
                : 'Amazing progress!'}
          </div>
        </div>
      </div>

      {/* ── NEXT LESSON CTA — the ONE button the user always taps ──────── */}
      {activeLevel >= 0 && activeItem >= 0 && onLaunchItem && (
        <button
          onClick={() => onLaunchItem(LEARN_PATH[activeLevel]!.items[activeItem]!)}
          style={{
            width: '100%',
            marginBottom: 24,
            padding: '18px 24px',
            background: 'linear-gradient(135deg,#0e7490,#0284c7)',
            border: 'none',
            borderRadius: 20,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 6px 24px rgba(14,116,144,.4)',
            animation: 'nodeGlow 2s ease-in-out infinite',
            fontFamily: "'Outfit',sans-serif",
          }}
        >
          <div style={{ textAlign: 'left' }}>
            <div
              style={{
                fontSize: 11,
                color: 'rgba(255,255,255,.75)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '.08em',
                marginBottom: 4,
              }}
            >
              Next Lesson
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>
              {LEARN_PATH[activeLevel]!.items[activeItem]!.name}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', marginTop: 3 }}>
              Stage {LEARN_PATH[activeLevel]!.level}: {LEARN_PATH[activeLevel]!.title}
            </div>
          </div>
          <div style={{ fontSize: 32, color: '#fff', flexShrink: 0 }}>▶</div>
        </button>
      )}

      {/* ── THE WINDING PATH ────────────────────────────────────────────── */}
      {LEARN_PATH.map((lv, li) => {
        const col = LEVEL_COLORS[li % LEVEL_COLORS.length]!;
        const levelDone = lv.items.filter((it) => evalCk(it.ckRule, st)).length;
        const levelPct = Math.round((levelDone / lv.items.length) * 100);
        const prevItems = li > 0 ? (LEARN_PATH[li - 1]!.items as unknown as ItemWithCk[]) : [];
        const isUnlocked = canUnlockLevel(lv.level, prevItems, st);
        // Level Quiz CTA: show when >= 80% complete but quiz not yet passed
        const threshold80 = Math.ceil(lv.items.length * 0.8);
        const quizPassed = (st.levelQuizPasses?.[lv.level]?.score ?? -1) >= 7;
        const showQuizCTA = isUnlocked && levelDone >= threshold80 && !quizPassed && setScr;

        return (
          <div key={li} style={{ marginBottom: 8 }}>
            {/* ── Stage Banner ─────────────────────────────────────────── */}
            <div
              style={{
                marginBottom: 20,
                borderRadius: 20,
                overflow: 'hidden',
                boxShadow: isUnlocked
                  ? `0 4px 20px ${col.glow}, 0 1px 4px rgba(0,0,0,.08)`
                  : '0 2px 8px rgba(0,0,0,.06)',
                opacity: isUnlocked ? 1 : 0.55,
                transition: 'opacity .3s',
              }}
            >
              <div
                style={{
                  background: isUnlocked ? col.bg : 'linear-gradient(135deg,#94a3b8,#64748b)',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 26,
                    flexShrink: 0,
                    border: '2px solid rgba(255,255,255,.3)',
                  }}
                >
                  {isUnlocked ? LEVEL_EMOJIS[li] : '🔒'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'rgba(255,255,255,.7)',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '.08em',
                    }}
                  >
                    Stage {lv.level}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>
                    {STAGE_NAMES[li] || lv.title}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,.75)', marginTop: 2 }}>
                    {lv.desc}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 900,
                    color: '#fff',
                    background: 'rgba(255,255,255,.2)',
                    borderRadius: 12,
                    padding: '6px 12px',
                    flexShrink: 0,
                  }}
                >
                  {levelPct === 100 ? '✅' : `${levelDone}/${lv.items.length}`}
                </div>
              </div>
              {/* Level progress bar */}
              <div
                style={{
                  background: col.light,
                  padding: '8px 20px 12px',
                  borderTop: `2px solid ${col.border}`,
                }}
              >
                <div
                  style={{
                    height: 6,
                    background: 'rgba(0,0,0,.08)',
                    borderRadius: 6,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: levelPct + '%',
                      background: isUnlocked ? col.bg : '#94a3b8',
                      borderRadius: 6,
                      transition: 'width .8s cubic-bezier(.4,0,.2,1)',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* ── Milestone nodes on the winding path ──────────────────── */}
            {isUnlocked && (
              <div style={{ paddingLeft: 8, paddingRight: 8, marginBottom: 16 }}>
                {/* Path line visual (vertical dashed or solid) */}
                <div style={{ position: 'relative' }}>
                  {lv.items.map((it, ii) => {
                    const isDone = evalCk(it.ckRule, st);
                    const isActive = li === activeLevel && ii === activeItem;
                    const isRight = ii % 2 === 0; // alternating alignment

                    return (
                      <div
                        key={ii}
                        ref={isActive ? activeRef : null}
                        style={{
                          display: 'flex',
                          justifyContent: isRight ? 'flex-start' : 'flex-end',
                          marginBottom: 12,
                          paddingLeft: isRight ? 0 : 60,
                          paddingRight: isRight ? 60 : 0,
                          position: 'relative',
                        }}
                      >
                        {/* Connector line */}
                        {ii < lv.items.length - 1 && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '100%',
                              left: isRight ? 28 : undefined,
                              right: !isRight ? 28 : undefined,
                              width: 2,
                              height: 12,
                              background: isDone ? col.bg : 'var(--card-b)',
                              borderLeft: isDone ? 'none' : '2px dashed var(--card-b)',
                              zIndex: 0,
                            }}
                          />
                        )}

                        {/* Node + label */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            flexDirection: isRight ? 'row' : 'row-reverse',
                            maxWidth: '85%',
                          }}
                        >
                          <button
                            onClick={() => {
                              if (onLaunchItem && (isActive || isDone)) onLaunchItem(it);
                            }}
                            disabled={!isDone && !isActive}
                            onMouseEnter={() => setHovered(`${li}-${ii}`)}
                            onMouseLeave={() => setHovered(null)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: isDone || isActive ? 'pointer' : 'default',
                              padding: 0,
                            }}
                          >
                            {/* The node circle */}
                            <div
                              style={{
                                width: isActive ? 60 : 52,
                                height: isActive ? 60 : 52,
                                borderRadius: '50%',
                                background: isDone ? col.bg : isActive ? col.bg : 'var(--card)',
                                border: isDone
                                  ? 'none'
                                  : isActive
                                    ? 'none'
                                    : '2px solid var(--card-b)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: isActive ? 24 : 20,
                                color: isDone || isActive ? '#fff' : 'var(--subtext)',
                                boxShadow: isDone
                                  ? `0 4px 16px ${col.glow}`
                                  : isActive
                                    ? `0 0 0 6px ${col.glow.replace('.4)', ',.15)')}, 0 4px 16px ${col.glow}`
                                    : '0 2px 6px rgba(0,0,0,.06)',
                                animation: isActive
                                  ? 'nodeGlow 2s ease-in-out infinite, nodePulse 2s ease-in-out infinite'
                                  : 'none',
                                transition:
                                  'transform .2s cubic-bezier(.34,1.56,.64,1), box-shadow .2s',
                                transform:
                                  hovered === `${li}-${ii}` && (isDone || isActive)
                                    ? 'scale(1.1)'
                                    : 'scale(1)',
                                flexShrink: 0,
                                position: 'relative',
                                zIndex: 2,
                              }}
                            >
                              {isDone ? '✓' : isActive ? '▶' : '🔒'}

                              {/* Skill decay badge */}
                              {isDone && it.topic && decayedTopics.has(it.topic) && (
                                <div
                                  style={{
                                    position: 'absolute',
                                    top: -4,
                                    right: -4,
                                    width: 18,
                                    height: 18,
                                    borderRadius: '50%',
                                    background: '#f59e0b',
                                    border: '2px solid #fff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 9,
                                    fontWeight: 900,
                                    color: '#fff',
                                    zIndex: 3,
                                  }}
                                  title="Words due for review"
                                >
                                  ⏰
                                </div>
                              )}

                              {/* Active pulse ring */}
                              {isActive && (
                                <div
                                  style={{
                                    position: 'absolute',
                                    inset: -8,
                                    borderRadius: '50%',
                                    border: `2px solid ${col.glow}`,
                                    animation: 'nodeGlow 2s ease-in-out infinite',
                                  }}
                                />
                              )}
                            </div>
                          </button>

                          {/* Label + Legendary button */}
                          <div style={{ minWidth: 0, textAlign: isRight ? 'left' : 'right' }}>
                            {isActive && (
                              <div
                                style={{
                                  fontSize: 10,
                                  fontWeight: 800,
                                  textTransform: 'uppercase',
                                  letterSpacing: '.08em',
                                  color: '#0e7490',
                                  marginBottom: 2,
                                }}
                              >
                                ← Up Next!
                              </div>
                            )}
                            <div
                              style={{
                                fontSize: 14,
                                fontWeight: isDone ? 600 : isActive ? 800 : 500,
                                color: isDone
                                  ? 'var(--subtext)'
                                  : isActive
                                    ? 'var(--heading)'
                                    : 'var(--subtext)',
                                textDecoration: isDone ? 'line-through' : 'none',
                                opacity: isDone ? 0.7 : 1,
                                lineHeight: 1.3,
                              }}
                            >
                              {it.name}
                            </div>
                            {isActive && (
                              <div
                                style={{
                                  fontSize: 11,
                                  color: '#0e7490',
                                  fontWeight: 700,
                                  marginTop: 3,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  justifyContent: isRight ? 'flex-start' : 'flex-end',
                                }}
                              >
                                Tap to start →
                              </div>
                            )}
                            {isDone && onLaunchLegendary && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onLaunchLegendary(it);
                                }}
                                style={{
                                  marginTop: 5,
                                  background: 'linear-gradient(135deg,#f59e0b,#d97706)',
                                  border: 'none',
                                  borderRadius: 20,
                                  color: '#fff',
                                  fontSize: 10,
                                  fontWeight: 800,
                                  padding: '3px 10px',
                                  cursor: 'pointer',
                                  letterSpacing: '.04em',
                                  boxShadow: '0 2px 8px rgba(217,119,6,.35)',
                                  transition: 'transform .15s, box-shadow .15s',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = 'scale(1.08)';
                                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(217,119,6,.5)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = 'scale(1)';
                                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(217,119,6,.35)';
                                }}
                              >
                                ⚔️ Legendary
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!isUnlocked && (
              <div
                className="c"
                style={{
                  textAlign: 'center',
                  padding: '20px',
                  marginBottom: 16,
                  opacity: 0.7,
                  border: '2px dashed var(--card-b)',
                  background: 'var(--bar-bg)',
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 6 }}>🔒</div>
                <div style={{ fontSize: 13, color: 'var(--subtext)', fontWeight: 600 }}>
                  Complete 80% of {LEARN_PATH[li - 1]?.title} and pass its Level Quiz to unlock
                </div>
              </div>
            )}

            {/* ── Checkpoint banner after completed level ───────────────── */}
            {isUnlocked && levelPct === 100 && onLaunchCheckpoint && li < LEARN_PATH.length - 1 && (
              <div
                style={{
                  marginBottom: 20,
                  padding: '14px 18px',
                  borderRadius: 16,
                  background: passedCheckpoints.has(li)
                    ? 'linear-gradient(135deg,#f0fdf4,#dcfce7)'
                    : 'linear-gradient(135deg,#fef9c3,#fef3c7)',
                  border: passedCheckpoints.has(li) ? '2px solid #86efac' : '2px solid #fcd34d',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                }}
              >
                <div style={{ fontSize: 32, flexShrink: 0 }}>
                  {passedCheckpoints.has(li) ? '🏆' : '📝'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: passedCheckpoints.has(li) ? '#166534' : '#92400e',
                    }}
                  >
                    {passedCheckpoints.has(li)
                      ? `Stage ${li + 1} Checkpoint — Passed! ✓`
                      : `Stage ${li + 1} Checkpoint Quiz`}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: passedCheckpoints.has(li) ? '#166534' : '#78716c',
                      marginTop: 2,
                      fontWeight: 500,
                    }}
                  >
                    {passedCheckpoints.has(li)
                      ? 'You mastered this stage.'
                      : 'Test your knowledge from this stage — 15 questions, 70% to pass.'}
                  </div>
                </div>
                {!passedCheckpoints.has(li) && (
                  <button
                    onClick={() => onLaunchCheckpoint(li, lv.items)}
                    style={{
                      background: 'linear-gradient(135deg,#d97706,#f59e0b)',
                      border: 'none',
                      borderRadius: 12,
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 800,
                      padding: '8px 16px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(217,119,6,.3)',
                      flexShrink: 0,
                    }}
                  >
                    Start →
                  </button>
                )}
              </div>
            )}

            {/* ── Level Quiz CTA — shown when >= 80% done but quiz not yet passed ── */}
            {showQuizCTA && (
              <div
                className="c"
                style={{
                  marginTop: 4,
                  marginBottom: 20,
                  padding: '16px',
                  background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
                  border: '2px solid #0e7490',
                  borderRadius: 12,
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 700, color: '#0e7490', marginBottom: 6 }}>
                  Level {lv.level} Quiz
                </div>
                <div style={{ fontSize: 14, color: '#475569', marginBottom: 12 }}>
                  10 questions from items you have studied. Score 7/10 to unlock Level{' '}
                  {lv.level + 1}.
                </div>
                <button
                  className="b bp"
                  onClick={() => void launchLevelQuiz(lv.level)}
                  disabled={quizLaunching}
                  style={{ width: '100%' }}
                >
                  {quizLaunching ? 'Loading...' : 'Take Level Quiz →'}
                </button>
              </div>
            )}

            {/* Already passed badge */}
            {isUnlocked && quizPassed && lv.level < LEARN_PATH.length && (
              <div
                style={{
                  marginBottom: 12,
                  padding: '8px 14px',
                  borderRadius: 10,
                  background: '#f0fdf4',
                  border: '1.5px solid #86efac',
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#166534',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                Level {lv.level} Quiz Passed ({st.levelQuizPasses![lv.level]!.score}/10)
              </div>
            )}
          </div>
        );
      })}

      {/* ── Completion banner ────────────────────────────────────────────── */}
      {pct === 100 && (
        <div
          className="c"
          style={{
            textAlign: 'center',
            padding: '32px',
            background: 'linear-gradient(135deg,#fef3c7,#fde68a)',
            border: '2px solid #f59e0b',
            animation: 'glow 3s ease-in-out infinite',
          }}
        >
          <div style={{ fontSize: 56, marginBottom: 8 }}>🏆</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#92400e', marginBottom: 4 }}>
            Čestitamo!
          </div>
          <div style={{ fontSize: 14, color: '#78716c', fontWeight: 500 }}>
            You have completed the entire learning path. You are truly Hrvat!
          </div>
        </div>
      )}
    </div>
  );
}
