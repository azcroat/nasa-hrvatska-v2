import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';

// ── A1→B2 Grammar Curriculum ─────────────────────────────────────────────────
// Each unit links to an existing screen. Progress tracked per-unit in localStorage.

const LEVELS = [
  {
    id: 'A1',
    label: 'A1 — Absolute Beginner',
    color: '#16a34a',
    bg: 'linear-gradient(135deg,#f0fdf4,#dcfce7)',
    border: '#bbf7d0',
    headerBg: 'linear-gradient(135deg,#059669,#065f46)',
    units: [
      {
        id: 'gender',
        icon: '♂️♀️',
        title: 'Noun Gender',
        desc: 'Masculine, feminine, neuter — the foundation',
        screen: 'genderdrill',
        qs: 30,
      },
      {
        id: 'pronouns',
        icon: '👤',
        title: 'Personal Pronouns',
        desc: 'Ja, ti, on, ona, mi, vi, oni — all cases',
        screen: 'pronouns',
        qs: 15,
      },
      {
        id: 'qwords',
        icon: '❓',
        title: 'Question Words',
        desc: 'Tko, Što, Gdje, Kada, Zašto, Kako, Kamo',
        screen: 'qwords',
        qs: 18,
      },
      {
        id: 'negation',
        icon: '❌',
        title: 'Basic Negation',
        desc: 'Ne, nije, nisam — how to say no',
        screen: 'negation',
        qs: 14,
      },
      {
        id: 'possess',
        icon: '🤝',
        title: 'Possessives',
        desc: 'Moj, tvoj, njegov, njezin, naš, vaš',
        screen: 'possess',
        qs: 18,
      },
    ],
  },
  {
    id: 'A2',
    label: 'A2 — Elementary',
    color: '#0e7490',
    bg: 'linear-gradient(135deg,#f0f9ff,#e0f2fe)',
    border: '#bae6fd',
    headerBg: 'linear-gradient(135deg,#0e7490,#164e63)',
    units: [
      {
        id: 'sentbuild',
        icon: '🏗️',
        title: 'Sentence Building',
        desc: 'Word order in Croatian — SVO and beyond',
        screen: 'sentbuild',
        qs: 42,
      },
      {
        id: 'coloragree',
        icon: '🎨',
        title: 'Adjective Agreement',
        desc: 'Colors and adjectives match noun gender',
        screen: 'coloragree',
        qs: 25,
      },
      {
        id: 'ordinals',
        icon: '🔢',
        title: 'Ordinal Numbers',
        desc: 'First, second, third — in all genders',
        screen: 'ordinals',
        qs: 15,
      },
      {
        id: 'verbdrill',
        icon: '💪',
        title: '20 Core Verbs',
        desc: 'The most-used Croatian verbs conjugated',
        screen: 'verbdrill',
        qs: 20,
      },
      {
        id: 'profgender',
        icon: '👨‍⚖️',
        title: 'Job Gender Forms',
        desc: 'Učitelj vs učiteljica — M/F professions',
        screen: 'profgender',
        qs: 16,
      },
      {
        id: 'unjumble',
        icon: '🧩',
        title: 'Word Order Drill',
        desc: 'Rearrange jumbled Croatian sentences',
        screen: 'unjumble',
        qs: 20,
      },
      {
        id: 'prepdrill',
        icon: '📍',
        title: 'Prepositions',
        desc: 'U, na, od, do, za, s, iz — which case?',
        screen: 'prepdrill',
        qs: 20,
      },
      {
        id: 'past_tense_lesson',
        icon: '⏮️',
        title: 'Past Tense',
        desc: 'L-participle + auxiliary — how to talk about the past',
        screen: 'past_tense_lesson',
        qs: 12,
      },
      {
        id: 'future_tense_lesson',
        icon: '🚀',
        title: 'Future Tense Full',
        desc: 'Future I, Future II (budem), and negative future',
        screen: 'future_tense_lesson',
        qs: 12,
      },
    ],
  },
  {
    id: 'B1',
    label: 'B1 — Intermediate',
    color: '#d97706',
    bg: 'linear-gradient(135deg,#fffbeb,#fef3c7)',
    border: '#fde68a',
    headerBg: 'linear-gradient(135deg,#d97706,#92400e)',
    units: [
      {
        id: 'padezi',
        icon: '⚙️',
        title: 'The 7 Cases',
        desc: 'NOM / GEN / DAT / AKU / VOK / LOK / INS',
        screen: 'padezi',
        qs: 15,
      },
      {
        id: 'akudrill',
        icon: '🍽️',
        title: 'Accusative Case',
        desc: 'Direct objects — the most-used case',
        screen: 'akudrill',
        qs: 15,
      },
      {
        id: 'future',
        icon: '🚀',
        title: 'Future Tense',
        desc: 'Ću, ćeš, će — simple future construction',
        screen: 'future',
        qs: 20,
      },
      {
        id: 'reflexive',
        icon: '🧲',
        title: 'SE Reflexive Verbs',
        desc: 'Volim se, zovem se, naći se — essential',
        screen: 'reflexive',
        qs: 10,
      },
      {
        id: 'comparatives',
        icon: '📈',
        title: 'Comparatives',
        desc: 'Veći, manji, brži — bigger, smaller, faster',
        screen: 'comparatives',
        qs: 15,
      },
      {
        id: 'sibil',
        icon: '🔄',
        title: 'Sibilarization',
        desc: 'k→c, g→z sound changes in plural & dative',
        screen: 'sibil',
        qs: 15,
      },
      {
        id: 'relpron',
        icon: '🔗',
        title: 'Relative Pronouns',
        desc: 'Koji, koja, koje — the man who, the woman that',
        screen: 'relpron',
        qs: 15,
      },
      {
        id: 'imperative',
        icon: '⚡',
        title: 'Imperative Mood',
        desc: 'Commands: Daj!, Idi!, Čekaj!, Reci!',
        screen: 'imperative',
        qs: 22,
      },
      {
        id: 'numcases',
        icon: '🔢',
        title: 'Numbers + Cases',
        desc: '1/2-4/5+ case agreement — mastered for good',
        screen: 'numcases',
        qs: 24,
      },
      {
        id: 'neggen',
        icon: '❌',
        title: 'Negation + Genitive',
        desc: 'Nemam vremena — negation shifts accusative→genitive',
        screen: 'neggen',
        qs: 20,
      },
    ],
  },
  {
    id: 'B2',
    label: 'B2 — Upper Intermediate',
    color: '#7c3aed',
    bg: 'linear-gradient(135deg,#faf5ff,#ede9fe)',
    border: '#ddd6fe',
    headerBg: 'linear-gradient(135deg,#7c3aed,#5b21b6)',
    units: [
      {
        id: 'padezifull',
        icon: '📚',
        title: 'Full Declension Tables',
        desc: 'All noun & adjective paradigms in one place',
        screen: 'padezifull',
        qs: 20,
      },
      {
        id: 'clitic',
        icon: '🔗',
        title: 'Clitic Ordering',
        desc: "Wackernagel's law — the hardest rule in Croatian",
        screen: 'clitic',
        qs: 22,
      },
      {
        id: 'aspect',
        icon: '⏳',
        title: 'Verbal Aspect',
        desc: 'Perfective vs imperfective — the core of Croatian',
        screen: 'aspect',
        qs: 16,
      },
      {
        id: 'aspectdrill',
        icon: '🔄',
        title: 'Aspect Drill',
        desc: 'Pisati/napisati — drilled until natural',
        screen: 'aspectdrill',
        qs: 25,
      },
      {
        id: 'conditional',
        icon: '🤔',
        title: 'Conditional',
        desc: 'Bi + past participle — I would, you would',
        screen: 'conditional',
        qs: 15,
      },
      {
        id: 'tenses',
        icon: '🕰️',
        title: 'All Tenses',
        desc: 'Present, past, future, conditional — full chart',
        screen: 'tenses',
        qs: 10,
      },
      {
        id: 'modal',
        icon: '💬',
        title: 'Modal Verbs',
        desc: 'Moći, morati, smjeti, trebati, htjeti',
        screen: 'modal',
        qs: 15,
      },
      {
        id: 'svojmoj',
        icon: '🔄',
        title: 'Svoj vs Moj',
        desc: 'The reflexive possessive — tiny but critical',
        screen: 'svojmoj',
        qs: 15,
      },
    ],
  },
];

const PROGRESS_KEY = 'nh_grammar_track_';

function getProgress() {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY + 'done') || '[]');
  } catch {
    return [];
  }
}

interface Unit {
  id: string;
  icon: string;
  title: string;
  desc: string;
  screen: string;
  qs: number;
}

interface Level {
  id: string;
  label: string;
  color: string;
  bg: string;
  border: string;
  headerBg: string;
  units: Unit[];
}

function markDone(unitId: string): void {
  try {
    const done = getProgress() as string[];
    if (!done.includes(unitId)) {
      localStorage.setItem(PROGRESS_KEY + 'done', JSON.stringify([...done, unitId]));
    }
  } catch (_e) {}
}

export default function GrammarTrackScreen({ goBack }: { goBack: () => void }) {
  const { setScr } = useApp();
  const [activeLevel, setActiveLevel] = useState('A1');
  const [done, setDone] = useState(getProgress);

  // Refresh progress when user returns to this screen (e.g. after completing a unit)
  useEffect(() => {
    function handleFocus() {
      setDone(getProgress());
    }
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, []);

  function launch(unit: Unit): void {
    markDone(unit.id);
    setDone(getProgress());
    setScr(unit.screen);
  }

  const level = (LEVELS.find((l: Level) => l.id === activeLevel) || LEVELS[0])!;
  const totalUnits = LEVELS.reduce((s, l) => s + l.units.length, 0);
  const doneCount = done.length;
  const pct = Math.round((doneCount / totalUnits) * 100);

  return (
    <div className="scr-wrap" style={{ paddingBottom: 24 }}>
      {/* ── HEADER ── */}
      <div
        style={{
          background: 'linear-gradient(135deg,#1e1b4b,#312e81)',
          borderRadius: 18,
          padding: '18px 18px 16px',
          marginBottom: 16,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <button
          onClick={goBack}
          style={{
            background: 'rgba(255,255,255,.12)',
            border: 'none',
            borderRadius: 10,
            padding: '6px 12px',
            color: 'rgba(255,255,255,.8)',
            cursor: 'pointer',
            marginBottom: 12,
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          ← Back
        </button>
        <div
          style={{
            fontSize: 10,
            fontWeight: 900,
            color: 'rgba(255,255,255,.5)',
            textTransform: 'uppercase',
            letterSpacing: '.14em',
            marginBottom: 4,
          }}
        >
          CURRICULUM
        </div>
        <div
          style={{
            fontSize: 24,
            fontWeight: 900,
            color: 'white',
            fontFamily: "'Playfair Display',serif",
            marginBottom: 4,
          }}
        >
          Grammar Track
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,.65)', marginBottom: 14 }}>
          A1 → B2 · 38 units · Structured grammar progression
        </div>

        {/* Overall progress bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,.15)', borderRadius: 3 }}>
            <div
              style={{
                width: pct + '%',
                height: '100%',
                background: '#a78bfa',
                borderRadius: 3,
                transition: 'width .4s ease',
              }}
            />
          </div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: 'rgba(255,255,255,.7)',
              whiteSpace: 'nowrap',
            }}
          >
            {doneCount}/{totalUnits} units · {pct}%
          </div>
        </div>
      </div>

      {/* ── CEFR LEVEL TABS ── */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          scrollbarWidth: 'none',
          marginBottom: 16,
          padding: '2px 0',
        }}
      >
        {LEVELS.map((l) => {
          const lvlDone = l.units.filter((u) => done.includes(u.id)).length;
          const isActive = l.id === activeLevel;
          const lvlPct = Math.round((lvlDone / l.units.length) * 100);
          return (
            <button
              key={l.id}
              onClick={() => setActiveLevel(l.id)}
              style={{
                flexShrink: 0,
                padding: '8px 16px',
                borderRadius: 20,
                border: 'none',
                background: isActive ? l.color : 'var(--bar-bg)',
                color: isActive ? 'white' : 'var(--subtext)',
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'background .2s',
                position: 'relative',
              }}
            >
              {l.id}
              <span
                style={{
                  marginLeft: 6,
                  fontSize: 10,
                  fontWeight: 700,
                  color: isActive ? 'rgba(255,255,255,.75)' : 'var(--subtext)',
                }}
              >
                {lvlDone}/{l.units.length}
              </span>
              {lvlPct === 100 && <span style={{ marginLeft: 4, fontSize: 10 }}>✓</span>}
            </button>
          );
        })}
      </div>

      {/* ── LEVEL HEADER ── */}
      <div
        style={{
          background: level.headerBg,
          borderRadius: 14,
          padding: '14px 16px',
          marginBottom: 14,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 900,
            color: 'rgba(255,255,255,.55)',
            textTransform: 'uppercase',
            letterSpacing: '.12em',
            marginBottom: 4,
          }}
        >
          {level.id} Level
        </div>
        <div style={{ fontSize: 16, fontWeight: 900, color: 'white' }}>{level.label}</div>
        <div style={{ marginTop: 8, display: 'flex', gap: 6, alignItems: 'center' }}>
          <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,.2)', borderRadius: 3 }}>
            <div
              style={{
                width:
                  (level.units.filter((u) => done.includes(u.id)).length / level.units.length) *
                    100 +
                  '%',
                height: '100%',
                background: 'rgba(255,255,255,.8)',
                borderRadius: 3,
                transition: 'width .4s ease',
              }}
            />
          </div>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,.7)', fontWeight: 700 }}>
            {level.units.filter((u) => done.includes(u.id)).length}/{level.units.length} complete
          </span>
        </div>
      </div>

      {/* ── UNITS LIST ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {level.units.map((unit, unitIdx) => {
          const isDone = done.includes(unit.id);
          // Determine if this unit is "unlocked" — the first incomplete unit or any done unit
          const completedInLevel = level.units.filter((u) => done.includes(u.id)).length;
          const isNext = unitIdx === completedInLevel && !isDone;
          return (
            <button
              key={unit.id}
              onClick={() => launch(unit)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 16px',
                borderRadius: 14,
                background: isDone
                  ? 'var(--success-bg, #f0fdf4)'
                  : isNext
                    ? 'var(--card)'
                    : 'var(--card)',
                border: isDone
                  ? '1.5px solid var(--success-b, #bbf7d0)'
                  : isNext
                    ? `2px solid ${level.color}`
                    : '1.5px solid var(--card-b)',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: "'Outfit',sans-serif",
                borderLeft: `4px solid ${isDone ? '#16a34a' : isNext ? level.color : '#d1d5db'}`,
                opacity: 1,
                boxShadow: isNext ? `0 0 0 1px ${level.color}22` : 'none',
              }}
            >
              {/* Icon with completion badge */}
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  flexShrink: 0,
                  background: isDone ? 'var(--success-bg, #f0fdf4)' : level.bg,
                  border: `1px solid ${isDone ? 'var(--success-b, #bbf7d0)' : level.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  position: 'relative',
                }}
              >
                {unit.icon}
                {isDone && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: -4,
                      right: -4,
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: '#16a34a',
                      border: '2px solid var(--card)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 9,
                      color: 'white',
                      fontWeight: 900,
                    }}
                  >
                    ✓
                  </div>
                )}
                {isNext && !isDone && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: -4,
                      right: -4,
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: level.color,
                      border: '2px solid var(--card)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 9,
                      color: 'white',
                      fontWeight: 900,
                    }}
                  >
                    ▶
                  </div>
                )}
              </div>

              {/* Title + desc */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: 'var(--heading)',
                    lineHeight: 1.2,
                  }}
                >
                  {unit.title}
                  {isNext && !isDone && (
                    <span
                      style={{
                        marginLeft: 6,
                        fontSize: 9,
                        fontWeight: 900,
                        color: level.color,
                        background: level.color + '18',
                        padding: '2px 5px',
                        borderRadius: 4,
                        textTransform: 'uppercase',
                        letterSpacing: '.08em',
                      }}
                    >
                      Up next
                    </span>
                  )}
                </div>
                <div
                  style={{ fontSize: 12, color: 'var(--subtext)', marginTop: 3, lineHeight: 1.4 }}
                >
                  {unit.desc}
                </div>
                {unit.qs && (
                  <div
                    style={{ fontSize: 10, color: 'var(--subtext)', marginTop: 4, fontWeight: 600 }}
                  >
                    {unit.qs} exercises
                  </div>
                )}
              </div>

              {/* Status badge */}
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '4px 8px',
                  borderRadius: 8,
                  background: isDone
                    ? 'var(--success-bg)'
                    : isNext
                      ? level.color + '15'
                      : 'var(--bar-bg)',
                  color: isDone ? 'var(--success)' : isNext ? level.color : level.color,
                  border: `1px solid ${isDone ? 'var(--success-b)' : isNext ? level.color + '40' : level.border}`,
                  whiteSpace: 'nowrap',
                }}
              >
                {isDone ? '✓ Done' : isNext ? '▶ Start' : level.id}
              </div>
            </button>
          );
        })}
      </div>

      {/* ── BOTTOM ENCOURAGEMENT ── */}
      {level.units.every((u) => done.includes(u.id)) && (
        <div
          style={{
            marginTop: 16,
            padding: '14px 16px',
            borderRadius: 14,
            background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)',
            border: '1.5px solid #bbf7d0',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 6 }}>🎉</div>
          <div style={{ fontSize: 15, fontWeight: 900, color: '#065f46', marginBottom: 4 }}>
            {level.id} Complete!
          </div>
          <div style={{ fontSize: 13, color: '#059669' }}>
            {activeLevel !== 'B2'
              ? `Move on to ${LEVELS[LEVELS.findIndex((l) => l.id === activeLevel) + 1]?.id} when ready`
              : "You've mastered Croatian grammar — Odlično!"}
          </div>
        </div>
      )}

      {/* ── ALL COMPLETE BANNER ── */}
      {doneCount === totalUnits && (
        <div
          style={{
            marginTop: 12,
            padding: '16px',
            borderRadius: 14,
            background: 'linear-gradient(135deg,#1e1b4b,#312e81)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>🏆</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: 'white', marginBottom: 4 }}>
            A1 → B2 Complete!
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.7)' }}>
            All 38 grammar units visited. Bravo — Odlično!
          </div>
        </div>
      )}
    </div>
  );
}
