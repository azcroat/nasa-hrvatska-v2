// src/components/croatia/StoriesTab.tsx
// Spotlight + Browse view for the Baka/Djed/Luka/Recipe/Family letter corpus.
// Replaces the previous flat 14-card accordion. Letter data lives in
// src/data/bakaLetters.ts; this file owns the read-state, recommendation,
// filter, and rendering logic.
import React, { useMemo, useState } from 'react';
import type { AwardActivityType } from '../../types/index.js';
import { incrementCulture } from '../../data';
import { useApp } from '../../context/AppContext';
import CroatianKnight from '../shared/CroatianKnight';
import { knightSpeak } from '../../lib/knightSpeak.js';
import {
  BAKA_LETTERS,
  type BakaLetter,
  type BakaWord,
  type LetterCategory,
  categoryOf,
  seasonOf,
  readingTimeMin,
  CATEGORY_META,
  SEASON_META,
} from '../../data/bakaLetters';

// ── Read-state persistence ─────────────────────────────────────────────────
const READ_KEY = 'nh_baka_read';

function loadReadIds(): Set<string> {
  try {
    const j = JSON.parse(localStorage.getItem(READ_KEY) || '[]') as unknown;
    if (!Array.isArray(j)) return new Set();
    return new Set(j.filter((x): x is string => typeof x === 'string'));
  } catch {
    return new Set();
  }
}

function persistReadIds(ids: Set<string>): void {
  try {
    localStorage.setItem(READ_KEY, JSON.stringify(Array.from(ids)));
  } catch {
    /* localStorage unavailable — non-critical */
  }
}

// ── Today's-letter recommendation ──────────────────────────────────────────
// Deterministic per day: prefer current-season unread → unread anywhere →
// any letter. Stable for the day so the user sees the same spotlight if
// they leave and come back.
function dayOfYear(d: Date = new Date()): number {
  const start = Date.UTC(d.getFullYear(), 0, 0);
  const now = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.floor((now - start) / 86_400_000);
}

function currentSeason(d: Date = new Date()): 'spring' | 'summer' | 'autumn' | 'winter' {
  const m = d.getMonth() + 1;
  if (m >= 3 && m <= 5) return 'spring';
  if (m >= 6 && m <= 8) return 'summer';
  if (m >= 9 && m <= 11) return 'autumn';
  return 'winter';
}

function pickTodaysLetter(letters: BakaLetter[], readIds: Set<string>): BakaLetter {
  const doy = dayOfYear();
  const season = currentSeason();
  const unreadInSeason = letters.filter((l) => !readIds.has(l.id) && seasonOf(l) === season);
  if (unreadInSeason.length) return unreadInSeason[doy % unreadInSeason.length]!;
  const unread = letters.filter((l) => !readIds.has(l.id));
  if (unread.length) return unread[doy % unread.length]!;
  return letters[doy % letters.length]!;
}

// ── WordTile (preserved from previous implementation) ──────────────────────
interface WordTileProps {
  w: BakaWord;
  award?: ((xp: number, celebrate?: boolean, activityType?: AwardActivityType) => void) | null;
}

function WordTile({ w, award }: WordTileProps): React.ReactElement {
  const [saved, setSaved] = useState(() => {
    try {
      const j = JSON.parse(localStorage.getItem('uJournal') || '[]');
      return j.some((x: { hr: string }) => x.hr === w.hr);
    } catch {
      return false;
    }
  });
  return (
    <div
      style={{
        background: 'var(--bar-bg)',
        borderRadius: 8,
        padding: '8px 10px',
        position: 'relative',
      }}
    >
      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: '#0e7490' }}>{w.hr}</div>
      <div
        style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--subtext)',
          marginTop: 2,
          marginBottom: 4,
        }}
      >
        {w.en}
      </div>
      <button
        onClick={() => {
          if (saved) return;
          try {
            const j = JSON.parse(localStorage.getItem('uJournal') || '[]');
            if (!j.some((x: { hr: string }) => x.hr === w.hr)) {
              j.push({ hr: w.hr, en: w.en });
              localStorage.setItem('uJournal', JSON.stringify(j));
            }
          } catch {
            /* ignore */
          }
          setSaved(true);
          if (award) award(1, false, 'story');
          knightSpeak('happy', `"${w.hr}" saved to My Words! 📚`);
        }}
        style={{
          fontSize: 9,
          fontWeight: 700,
          color: saved ? 'var(--success,#16a34a)' : 'var(--info)',
          background: 'none',
          border: 'none',
          cursor: saved ? 'default' : 'pointer',
          padding: 0,
        }}
      >
        {saved ? '✓ Saved' : '+ Save word'}
      </button>
    </div>
  );
}

// ── Today's-letter spotlight card ──────────────────────────────────────────
interface SpotlightProps {
  letter: BakaLetter;
  isRead: boolean;
  onOpen: () => void;
}

function TodaysLetterSpotlight({ letter, isRead, onOpen }: SpotlightProps): React.ReactElement {
  const cat = categoryOf(letter);
  const meta = CATEGORY_META[cat];
  const season = SEASON_META[seasonOf(letter)];
  const mins = readingTimeMin(letter);
  return (
    <button
      data-testid="todays-letter-spotlight"
      onClick={onOpen}
      style={{
        all: 'unset',
        boxSizing: 'border-box',
        display: 'block',
        width: '100%',
        cursor: 'pointer',
        background: `linear-gradient(135deg, ${meta.tint}18, ${meta.tint}08)`,
        border: `1.5px solid ${meta.tint}55`,
        borderRadius: 16,
        padding: '16px 18px',
        marginBottom: 18,
        fontFamily: 'inherit',
      }}
      aria-label={`Today's letter from ${letter.from}: ${letter.subject}`}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '.12em',
          color: meta.tint,
          textTransform: 'uppercase',
          marginBottom: 10,
        }}
      >
        ✨ Today&apos;s Letter
        {isRead && (
          <span
            style={{
              marginLeft: 8,
              padding: '1px 6px',
              borderRadius: 4,
              background: 'var(--success-bg)',
              color: 'var(--success)',
              fontSize: 9,
            }}
          >
            ✓ READ
          </span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: letter.iconBg || 'linear-gradient(135deg,#fef3c7,#fde68a)',
            border: `1px solid ${letter.iconBorder || '#fde68a'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            flexShrink: 0,
          }}
        >
          {letter.icon || '💌'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--heading)', lineHeight: 1.2 }}>
            {letter.from}
          </div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: 'var(--heading)',
              marginTop: 2,
              lineHeight: 1.3,
            }}
          >
            {letter.subject}
          </div>
        </div>
      </div>
      <div
        style={{
          fontSize: 13,
          color: 'var(--subtext)',
          fontStyle: 'italic',
          lineHeight: 1.5,
          marginBottom: 12,
        }}
      >
        &ldquo;{letter.preview}&rdquo;
      </div>
      <div
        style={{
          display: 'flex',
          gap: 12,
          fontSize: 11,
          color: 'var(--subtext)',
          flexWrap: 'wrap',
          marginBottom: 12,
        }}
      >
        <span>⏱ ~{mins} min read</span>
        <span>·</span>
        <span>
          {season.emoji} {season.label}
        </span>
        <span>·</span>
        <span>📚 {letter.words.length} words</span>
      </div>
      <div
        style={{
          background: meta.tint,
          color: '#fff',
          borderRadius: 10,
          padding: '10px 14px',
          fontSize: 13,
          fontWeight: 700,
          textAlign: 'center' as const,
        }}
      >
        Read this letter →
      </div>
    </button>
  );
}

// ── Sender-filter chip row ─────────────────────────────────────────────────
interface ChipRowProps {
  active: LetterCategory | 'all';
  setActive: (c: LetterCategory | 'all') => void;
  counts: Record<LetterCategory | 'all', number>;
  unreadCounts: Record<LetterCategory | 'all', number>;
}

function SenderFilterChips({
  active,
  setActive,
  counts,
  unreadCounts,
}: ChipRowProps): React.ReactElement {
  const chip = (key: LetterCategory | 'all', label: string, emoji: string): React.ReactElement => {
    const isActive = active === key;
    const count = counts[key];
    const unread = unreadCounts[key];
    return (
      <button
        key={key}
        onClick={() => setActive(key)}
        aria-pressed={isActive}
        style={{
          padding: '7px 12px',
          borderRadius: 999,
          border: `1.5px solid ${isActive ? 'var(--info)' : 'var(--card-b)'}`,
          background: isActive ? 'var(--info-bg)' : 'var(--card)',
          color: isActive ? 'var(--info)' : 'var(--text)',
          fontSize: 12,
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: 'inherit',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          whiteSpace: 'nowrap',
        }}
      >
        <span>{emoji}</span>
        <span>{label}</span>
        <span style={{ opacity: 0.6, fontWeight: 600 }}>{count}</span>
        {unread > 0 && (
          <span
            style={{
              background: 'var(--info)',
              color: '#fff',
              borderRadius: 8,
              padding: '1px 5px',
              fontSize: 9,
              fontWeight: 800,
            }}
            aria-label={`${unread} unread`}
          >
            {unread}
          </span>
        )}
      </button>
    );
  };
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
        marginBottom: 14,
      }}
    >
      {chip('all', 'All', '📚')}
      {(Object.keys(CATEGORY_META) as LetterCategory[]).map((k) =>
        counts[k] > 0 ? chip(k, CATEGORY_META[k].label, CATEGORY_META[k].emoji) : null,
      )}
    </div>
  );
}

// ── Compact row ────────────────────────────────────────────────────────────
interface RowProps {
  letter: BakaLetter;
  isRead: boolean;
  isOpen: boolean;
  onToggle: () => void;
  award: ((xp: number, celebrate?: boolean, activityType?: AwardActivityType) => void) | null;
}

function LetterRow({ letter, isRead, isOpen, onToggle, award }: RowProps): React.ReactElement {
  const cat = categoryOf(letter);
  const meta = CATEGORY_META[cat];
  const mins = readingTimeMin(letter);
  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1.5px solid var(--card-b)',
        borderRadius: 12,
        overflow: 'hidden',
        opacity: isRead && !isOpen ? 0.78 : 1,
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          padding: '12px 14px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left' as const,
          fontFamily: 'inherit',
        }}
        aria-expanded={isOpen}
        aria-label={`${isRead ? 'Read' : 'Unread'} letter from ${letter.from}: ${letter.subject}`}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: letter.iconBg || 'linear-gradient(135deg,#fef3c7,#fde68a)',
              border: `1px solid ${letter.iconBorder || '#fde68a'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              flexShrink: 0,
            }}
          >
            {letter.icon || meta.emoji}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: 'var(--heading)',
                lineHeight: 1.25,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {letter.subject}
              </span>
              {!isRead && (
                <span
                  style={{
                    background: 'var(--info)',
                    color: '#fff',
                    fontSize: 8,
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: 999,
                    letterSpacing: '.05em',
                    flexShrink: 0,
                  }}
                >
                  NEW
                </span>
              )}
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--subtext)',
                marginTop: 2,
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
              }}
            >
              <span>{letter.from}</span>
              <span>·</span>
              <span>{letter.date}</span>
              <span>·</span>
              <span>⏱ {mins} min</span>
            </div>
          </div>
          <span style={{ fontSize: 14, color: 'var(--subtext)', opacity: 0.5, flexShrink: 0 }}>
            {isOpen ? '▲' : '▼'}
          </span>
        </div>
      </button>
      {isOpen && (
        <div style={{ borderTop: '1px solid var(--card-b)', padding: '14px' }}>
          <div
            style={{
              background: letter.letterBg || '#fffbeb',
              border: `1px solid ${letter.letterBorder || '#fde68a'}`,
              borderRadius: 10,
              padding: '14px 16px',
              marginBottom: 14,
              fontFamily: 'Georgia, serif',
              fontSize: 'var(--text-sm)',
              lineHeight: 1.8,
              color: letter.letterColor || '#451a03',
              whiteSpace: 'pre-line' as const,
            }}
          >
            {letter.full}
          </div>
          <div
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 800,
              color: 'var(--subtext)',
              textTransform: 'uppercase' as const,
              letterSpacing: '.08em',
              marginBottom: 8,
            }}
          >
            📚 Words from this letter
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {letter.words.map((w) => (
              <WordTile key={w.hr} w={w} award={award} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────
export default function StoriesTab(): React.ReactElement {
  const { award } = useApp();
  const [readIds, setReadIds] = useState<Set<string>>(() => loadReadIds());
  const [openLetter, setOpenLetter] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<LetterCategory | 'all'>('all');
  const [expandedCtx, setExpandedCtx] = useState<Record<string, boolean>>({});
  const toggleCtx = (k: string): void => setExpandedCtx((p) => ({ ...p, [k]: !p[k] }));

  const todaysLetter = useMemo(() => pickTodaysLetter(BAKA_LETTERS, readIds), [readIds]);

  const counts = useMemo(() => {
    const c: Record<LetterCategory | 'all', number> = {
      all: BAKA_LETTERS.length,
      baka: 0,
      djed: 0,
      luka: 0,
      recipe: 0,
      family: 0,
    };
    for (const l of BAKA_LETTERS) c[categoryOf(l)] += 1;
    return c;
  }, []);

  const unreadCounts = useMemo(() => {
    const c: Record<LetterCategory | 'all', number> = {
      all: 0,
      baka: 0,
      djed: 0,
      luka: 0,
      recipe: 0,
      family: 0,
    };
    for (const l of BAKA_LETTERS) {
      if (!readIds.has(l.id)) {
        c.all += 1;
        c[categoryOf(l)] += 1;
      }
    }
    return c;
  }, [readIds]);

  const filtered = useMemo(
    () =>
      activeFilter === 'all'
        ? BAKA_LETTERS
        : BAKA_LETTERS.filter((l) => categoryOf(l) === activeFilter),
    [activeFilter],
  );

  const openLetterAndMark = (id: string): void => {
    const opening = openLetter !== id;
    setOpenLetter(opening ? id : null);
    if (opening) {
      // Mark read on open (email-inbox model — once you've expanded it, it's read).
      if (!readIds.has(id)) {
        const next = new Set(readIds);
        next.add(id);
        setReadIds(next);
        persistReadIds(next);
      }
      incrementCulture('bakaCnt');
      if (award) award(5, false, 'story');
    }
  };

  return (
    <React.Fragment>
      <div className="section-block">
        <div className="section-hdr">
          <div className="section-hdr-icon" style={{ background: 'rgba(200,152,10,.14)' }}>
            💌
          </div>
          <div className="section-hdr-text">
            <div className="section-hdr-title">Letters from family</div>
            <div className="section-hdr-sub">Read Croatian the way family really writes it</div>
          </div>
          <CroatianKnight size={40} mood="thinking" style={{ flexShrink: 0 }} />
        </div>
        <div style={{ fontSize: 12, color: 'var(--subtext)', marginBottom: 12, lineHeight: 1.5 }}>
          Personal letters written in authentic Croatian — perfect for understanding how family
          members actually speak, including regional expressions and emotional vocabulary.
        </div>
        <div
          onClick={() => {
            if (!expandedCtx['baka']) incrementCulture('regionCnt');
            toggleCtx('baka');
          }}
          style={{
            fontSize: 12,
            color: 'var(--info)',
            cursor: 'pointer',
            marginBottom: expandedCtx['baka'] ? 0 : 12,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontWeight: 600,
          }}
        >
          {expandedCtx['baka'] ? '▲' : '▼'} Why this matters for your Croatian
        </div>
        {expandedCtx['baka'] && (
          <div
            style={{
              fontSize: 12,
              color: 'var(--subtext)',
              lineHeight: 1.6,
              padding: '10px 14px',
              background: 'var(--info-bg)',
              borderRadius: 10,
              marginBottom: 12,
              border: '1px solid var(--info-b)',
            }}
          >
            💌 <strong>Family letters</strong> capture authentic Croatian as it&apos;s actually
            written between family members — warm, informal, full of dialect and emotion. This is
            the Croatian you won&apos;t find in textbooks, but will hear and read with your family.
          </div>
        )}

        {/* Today's letter spotlight */}
        <TodaysLetterSpotlight
          letter={todaysLetter}
          isRead={readIds.has(todaysLetter.id)}
          onOpen={() => openLetterAndMark(todaysLetter.id)}
        />

        {/* Browse-all section header */}
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: 'var(--subtext)',
            textTransform: 'uppercase' as const,
            letterSpacing: '.08em',
            marginBottom: 10,
          }}
        >
          Browse all {BAKA_LETTERS.length} letters
        </div>

        {/* Sender chips */}
        <SenderFilterChips
          active={activeFilter}
          setActive={setActiveFilter}
          counts={counts}
          unreadCounts={unreadCounts}
        />

        {/* Filtered compact list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((letter) => (
            <LetterRow
              key={letter.id}
              letter={letter}
              isRead={readIds.has(letter.id)}
              isOpen={openLetter === letter.id}
              onToggle={() => openLetterAndMark(letter.id)}
              award={award}
            />
          ))}
        </div>
      </div>
    </React.Fragment>
  );
}
