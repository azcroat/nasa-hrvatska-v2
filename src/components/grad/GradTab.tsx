import React, { useState } from 'react';
import { getUserCefr } from '../../lib/cefr';
import { LISTEN, getSR, getDueReviews } from '../../data';
import { useContent } from '../../hooks/useContent';
import { localDateStr } from '../../lib/dateUtils.js';
import { useApp } from '../../context/AppContext';
import { useStats } from '../../context/StatsContext';
import { useAdaptivePractice } from '../../hooks/useAdaptivePractice';
import { buildExercises } from '../practice/exerciseCatalog';
import CharacterPortrait from '../family/CharacterPortrait';
import { PLACES, type PlaceId } from './places';
import { placeStats, recommendedVisit, type ModelCtx } from './gradModel';
import GradMap from './GradMap';
import PlaceScreen from './PlaceScreen';

const RECENT_KEY = 'nh_recent_exercises';
function recordRecentExercise(id: string) {
  try {
    const prev = (JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') as string[]).filter(
      (x) => x !== id,
    );
    localStorage.setItem(RECENT_KEY, JSON.stringify([id, ...prev].slice(0, 6)));
  } catch {
    /* ignore */
  }
}

interface GradTabProps {
  allCats: string[];
  sh: <T>(arr: T[]) => T[];
  sCurEx: (id: string) => void;
  onLaunchQuiz: (items: unknown[]) => void;
  onLaunchFlash: (items: unknown[]) => void;
  onLaunchListen: (items: unknown[]) => void;
  onLaunchMatch: (items: unknown[]) => void;
  onLaunchSpeaking: (items?: unknown[]) => void;
}

export default function GradTab({
  allCats,
  sh,
  sCurEx,
  onLaunchQuiz,
  onLaunchFlash,
  onLaunchListen,
  onLaunchMatch,
  onLaunchSpeaking,
}: GradTabProps) {
  const { setScr } = useApp();
  const { stats: st } = useStats();
  const { content } = useContent();
  const V = (content?.V ?? {}) as Record<string, string[][]>;
  const lc = st?.lc ?? 0;
  const userCefr = getUserCefr(st?.xp ?? 0, st?.lc ?? 0, st?.gc ?? 0);

  const [view, setView] = useState<'list' | 'map'>(
    () => (localStorage.getItem('nh_grad_view') as 'list' | 'map') || 'list',
  );
  const [openPlace, setOpenPlace] = useState<PlaceId | null>(null);

  function chooseView(v: 'list' | 'map') {
    setView(v);
    try {
      localStorage.setItem('nh_grad_view', v);
    } catch {
      /* ignore */
    }
  }

  // ── launch handlers (parity with the retired PracticeTab) ──────────────
  const pool = allCats.flatMap((cc) => V[cc] || []);
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
  function startListening() {
    onLaunchListen(sh(LISTEN).slice(0, 8));
  }
  function startSpeaking() {
    onLaunchSpeaking(sh(pool).slice(0, 6));
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
  const specialInit: Record<string, () => void> = {
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
      specialInit[screen] ??
      (() => {
        setScr(screen);
        sCurEx(screen);
      });
    return () => {
      recordRecentExercise(exerciseId);
      base();
    };
  };

  const EXERCISES = buildExercises({
    go,
    setScr,
    sCurEx,
    startPitchAccent,
    startShadowing,
    startReview,
    startAspectDrill,
  });

  const { practiceQueue } = useAdaptivePractice();

  const ctx: ModelCtx = {
    exercises: EXERCISES,
    extras: {
      quiz: startQuiz,
      flash: startFlashcards,
      match: startMatch,
      listen: startListening,
      speaking: startSpeaking,
      scr: (id: string) => () => {
        recordRecentExercise(id);
        setScr(id);
        sCurEx(id);
      },
    },
    userCefr,
    recs: {
      dueReviews: getDueReviews().length,
      weakCount: Object.values(getSR() as Record<string, { w?: number }>).filter(
        (v) => (v.w || 0) > 0,
      ).length,
      isNewUser: lc === 0 && !localStorage.getItem('nh_placement_done'),
      userGoal: localStorage.getItem('nh_goal'),
    },
    queue: practiceQueue,
  };

  const rec = recommendedVisit(ctx);

  // daily quest progress (4-dot quiet row)
  const questsDone = (() => {
    const d = localDateStr();
    const q = (id: string) => localStorage.getItem('nh_quest_' + id + '_' + d) === '1';
    const done = [q('speak'), q('grammar'), q('master'), q('reading')].filter(Boolean).length;
    return { done, total: 4 };
  })();

  if (openPlace) {
    return <PlaceScreen placeId={openPlace} ctx={ctx} onBack={() => setOpenPlace(null)} />;
  }

  const statsByPlace = Object.fromEntries(
    PLACES.map((p) => {
      const s = placeStats(p.id, ctx);
      return [p.id, { due: s.due, total: s.total }];
    }),
  ) as Record<string, { due: number; total: number }>;

  const teal = '#0e7490';

  return (
    <div>
      {/* ── HERO + VIEW TOGGLE ─────────────────────────────────────────── */}
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: '.16em',
                textTransform: 'uppercase',
                color: '#c2410c',
              }}
            >
              u grad
            </span>
            <span
              style={{
                fontFamily: "'Playfair Display',serif",
                fontSize: 22,
                fontWeight: 900,
                color: 'var(--heading)',
              }}
            >
              Grad
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              background: 'var(--bar-bg)',
              border: '1px solid var(--card-b)',
              borderRadius: 11,
              padding: 3,
              gap: 2,
            }}
          >
            <button
              onClick={() => chooseView('list')}
              aria-pressed={view === 'list'}
              style={toggleStyle(view === 'list', teal)}
            >
              📋 Popis
            </button>
            <button
              onClick={() => chooseView('map')}
              aria-pressed={view === 'map'}
              style={toggleStyle(view === 'map', teal)}
            >
              🗺️ Karta
            </button>
          </div>
        </div>
        <div
          style={{
            height: 3,
            borderRadius: 2,
            marginTop: 10,
            background: 'linear-gradient(90deg,#D40030 0 33%,#fff 33% 66%,#0e7490 66%)',
          }}
        />
      </div>

      {view === 'map' ? (
        <GradMap rec={rec} onOpenPlace={setOpenPlace} statsByPlace={statsByPlace} />
      ) : (
        <>
          {/* ── TODAY CARD ───────────────────────────────────────────── */}
          <div
            style={{
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: '.15em',
              textTransform: 'uppercase',
              color: 'var(--subtext)',
              margin: '4px 2px 10px',
            }}
          >
            Danas u gradu
          </div>
          <button
            onClick={() => rec.launch()}
            style={{
              width: '100%',
              textAlign: 'left',
              border: 'none',
              cursor: 'pointer',
              fontFamily: "'Outfit',sans-serif",
              background: 'linear-gradient(145deg,#0e7490 0%,#155e75 55%,#164e63 100%)',
              borderRadius: 20,
              padding: '16px 16px 14px',
              color: '#fff',
              boxShadow: '0 10px 28px rgba(14,116,144,.32)',
              marginBottom: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
              <div
                style={{
                  flex: 'none',
                  borderRadius: '50%',
                  padding: 3,
                  background: 'linear-gradient(135deg,#C8980A,#e0b84a)',
                  display: 'flex',
                }}
              >
                {rec.host ? (
                  <CharacterPortrait name={rec.host} size={52} />
                ) : (
                  <span
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,.16)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 26,
                    }}
                  >
                    ☀️
                  </span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 900,
                    letterSpacing: '.14em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,.7)',
                  }}
                >
                  Preporučeno za danas
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.2, marginTop: 2 }}>
                  {rec.hr}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.72)', marginTop: 3 }}>
                  {rec.en} · ~{rec.durationMin} min
                </div>
              </div>
              <span
                style={{
                  flex: 'none',
                  background: 'rgba(255,255,255,.2)',
                  border: '1px solid rgba(255,255,255,.3)',
                  borderRadius: 10,
                  padding: '8px 12px',
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                Idemo →
              </span>
            </div>
          </button>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              margin: '11px 2px 2px',
              fontSize: 11,
              color: 'var(--subtext)',
              fontWeight: 600,
            }}
          >
            <span style={{ display: 'flex', gap: 5 }}>
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: '50%',
                    background: i < questsDone.done ? '#C8980A' : 'var(--card-b)',
                  }}
                />
              ))}
            </span>
            {questsDone.done} of {questsDone.total} dnevnih zadataka
          </div>

          {/* ── PLACES LIST ──────────────────────────────────────────── */}
          <div
            style={{
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: '.15em',
              textTransform: 'uppercase',
              color: 'var(--subtext)',
              margin: '18px 2px 10px',
            }}
          >
            Mjesta u gradu
          </div>
          {PLACES.map((p) => {
            const s = statsByPlace[p.id]!;
            const recommended = rec.placeId === p.id;
            const signal = s.due > 0 ? `${s.due} due` : `${s.total} vježbi`;
            return (
              <button
                key={p.id}
                onClick={() => setOpenPlace(p.id)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 13,
                  background: 'var(--card)',
                  border: recommended ? '1.5px solid #C8980A' : '1px solid var(--card-b)',
                  borderRadius: 16,
                  padding: '13px 14px',
                  marginBottom: 10,
                  cursor: 'pointer',
                  fontFamily: "'Outfit',sans-serif",
                  boxShadow: recommended
                    ? '0 2px 10px rgba(200,152,10,.18)'
                    : '0 1px 3px rgba(0,0,0,.05)',
                }}
              >
                {p.host ? (
                  <span style={{ flex: 'none', display: 'flex' }}>
                    <CharacterPortrait name={p.host} size={48} />
                  </span>
                ) : (
                  <span
                    style={{
                      flex: 'none',
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      background: p.tint,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 25,
                    }}
                  >
                    {p.icon}
                  </span>
                )}
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      display: 'block',
                      fontFamily: "'Playfair Display',serif",
                      fontSize: 16,
                      fontWeight: 800,
                      color: 'var(--heading)',
                      lineHeight: 1.15,
                    }}
                  >
                    {p.name}
                  </span>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 11.5,
                      color: 'var(--subtext)',
                      marginTop: 2,
                    }}
                  >
                    {p.blurb}
                  </span>
                </span>
                <span
                  style={{
                    flex: 'none',
                    fontSize: 11,
                    fontWeight: 700,
                    color: recommended ? '#9a7407' : 'var(--subtext)',
                    background: recommended ? 'rgba(200,152,10,.14)' : 'transparent',
                    borderRadius: 8,
                    padding: recommended ? '2px 8px' : 0,
                  }}
                >
                  {signal}
                </span>
              </button>
            );
          })}
        </>
      )}
    </div>
  );
}

function toggleStyle(on: boolean, teal: string): React.CSSProperties {
  return {
    border: 'none',
    background: on ? 'var(--card)' : 'none',
    color: on ? teal : 'var(--subtext)',
    fontFamily: "'Outfit',sans-serif",
    fontSize: 12,
    fontWeight: 800,
    padding: '5px 11px',
    borderRadius: 8,
    cursor: 'pointer',
    boxShadow: on ? '0 1px 3px rgba(0,0,0,.12)' : 'none',
  };
}
