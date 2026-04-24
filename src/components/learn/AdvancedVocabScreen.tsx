import React, { useState, useMemo } from 'react';
import { speak } from '../../data';
import { V_B2, V_C1 } from '../../data/vocabulary.js';

type LevelKey = keyof typeof LEVEL_DATA;

const LEVEL_DATA = { B2: V_B2, C1: V_C1 };
const LS_KEY = 'nh_adv_vocab_learned';

function loadLearned() {
  try {
    return new Set<string>(JSON.parse(localStorage.getItem(LS_KEY) || '[]') as string[]);
  } catch {
    return new Set<string>();
  }
}

function saveLearned(set: Set<string>) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify([...set]));
  } catch {}
}

interface Props {
  goBack: () => void;
  award?: (xp: number, celebrate?: boolean, activityType?: string) => void;
}

export default function AdvancedVocabScreen({ goBack, award }: Props) {
  const [level, setLevel] = useState<LevelKey>('B2');
  const [activeCat, setActiveCat] = useState<string>(() => Object.keys(V_B2)[0] ?? '');
  const [search, setSearch] = useState('');
  const [learned, setLearned] = useState(loadLearned);

  const data = LEVEL_DATA[level];
  const categories = Object.keys(data);

  // Keep activeCat in sync when switching level
  const safeCat: string = categories.includes(activeCat) ? activeCat : (categories[0] ?? '');

  const words = useMemo(() => {
    const list: string[][] = (data as Record<string, string[][]>)[safeCat] ?? [];
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      ([hr = '', en = '', ex = '']) =>
        hr.toLowerCase().includes(q) ||
        en.toLowerCase().includes(q) ||
        ex.toLowerCase().includes(q),
    );
  }, [data, safeCat, search]);

  const totalInCat = ((data as Record<string, string[][]>)[safeCat] ?? []).length;
  const learnedInCat = ((data as Record<string, string[][]>)[safeCat] ?? []).filter(([hr = '']) =>
    learned.has(hr),
  ).length;

  function toggleLevel(l: LevelKey) {
    setLevel(l);
    const cats = Object.keys(LEVEL_DATA[l]);
    setActiveCat(cats[0] ?? '');
    setSearch('');
  }

  function toggleLearned(word: string) {
    setLearned((prev) => {
      const next = new Set(prev);
      if (next.has(word)) next.delete(word);
      else {
        next.add(word);
        if (award) award(5, false, 'vocabulary');
      }
      saveLearned(next);
      return next;
    });
  }

  const pct = totalInCat > 0 ? Math.round((learnedInCat / totalInCat) * 100) : 0;

  return (
    <div className="scr-wrap">
      {/* ── HEADER ── */}
      <div className="c" style={{ marginBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <button
            onClick={goBack}
            className="bg sh"
            style={{
              border: 'none',
              borderRadius: 10,
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: 18,
            }}
            aria-label="Go back"
          >
            ‹
          </button>
          <div>
            <div className="b" style={{ fontSize: 'var(--text-lg)', fontWeight: 900 }}>
              B2+ Vocabulary
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--subtext)', fontWeight: 500 }}>
              Napredni vokabular
            </div>
          </div>
        </div>

        {/* ── LEVEL TOGGLE ── */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, marginTop: 12 }}>
          {(['B2', 'C1'] as LevelKey[]).map((l) => (
            <button
              key={l}
              onClick={() => toggleLevel(l)}
              style={{
                flex: 1,
                padding: '10px 0',
                borderRadius: 12,
                border: level === l ? 'none' : '1.5px solid var(--card-b)',
                background:
                  level === l ? 'linear-gradient(135deg, #7c3aed, #5b21b6)' : 'var(--card)',
                color: level === l ? '#fff' : 'var(--text)',
                fontWeight: 800,
                fontSize: 'var(--text-base)',
                cursor: 'pointer',
                fontFamily: "'Outfit', sans-serif",
                boxShadow: level === l ? '0 4px 14px rgba(124,58,237,.35)' : 'none',
                transition: 'all .15s',
              }}
            >
              {l}
            </button>
          ))}
        </div>

        {/* ── SEARCH BAR ── */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search words or meanings…"
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '10px 14px',
            borderRadius: 12,
            border: '1.5px solid var(--card-b)',
            background: 'var(--card)',
            color: 'var(--text)',
            fontSize: 'var(--text-sm)',
            fontFamily: "'Outfit', sans-serif",
            marginBottom: 14,
            outline: 'none',
          }}
        />

        {/* ── CATEGORY PILLS ── */}
        <div
          style={{
            overflowX: 'auto',
            display: 'flex',
            gap: 8,
            paddingBottom: 6,
            scrollbarWidth: 'none',
          }}
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveCat(cat);
                setSearch('');
              }}
              style={{
                whiteSpace: 'nowrap',
                padding: '7px 14px',
                borderRadius: 20,
                border: safeCat === cat ? 'none' : '1.5px solid var(--card-b)',
                background:
                  safeCat === cat ? 'linear-gradient(135deg, #7c3aed, #5b21b6)' : 'var(--card)',
                color: safeCat === cat ? '#fff' : 'var(--subtext)',
                fontWeight: safeCat === cat ? 800 : 600,
                fontSize: 'var(--text-xs)',
                cursor: 'pointer',
                fontFamily: "'Outfit', sans-serif",
                flexShrink: 0,
                transition: 'all .15s',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* ── PROGRESS BAR ── */}
        {!search.trim() && (
          <div style={{ marginTop: 12, marginBottom: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span
                style={{ fontSize: 'var(--text-xs)', color: 'var(--subtext)', fontWeight: 600 }}
              >
                {safeCat}
              </span>
              <span
                style={{ fontSize: 'var(--text-xs)', color: 'var(--subtext)', fontWeight: 700 }}
              >
                {learnedInCat}/{totalInCat} learned
              </span>
            </div>
            <div
              style={{
                height: 6,
                background: 'var(--card-b)',
                borderRadius: 99,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${pct}%`,
                  background: 'linear-gradient(90deg, #7c3aed, #5b21b6)',
                  borderRadius: 99,
                  transition: 'width .3s ease',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── WORD LIST ── */}
      <div className="c" style={{ paddingTop: 8 }}>
        {words.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--subtext)' }}>
            No words match your search.
          </div>
        )}
        {words.map(([hr = '', en = '', ex = '']: string[], i: number) => {
          const isLearned = learned.has(hr);
          return (
            <div
              key={i}
              className="bp sh"
              style={{
                borderRadius: 14,
                padding: '14px 16px',
                marginBottom: 10,
                border: isLearned ? '1.5px solid #6d28d9' : '1.5px solid var(--card-b)',
                background: isLearned ? 'rgba(124,58,237,.06)' : 'var(--card)',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                {/* Text block */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      flexWrap: 'wrap',
                      marginBottom: 2,
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 900,
                        fontSize: 'var(--text-base)',
                        color: 'var(--text)',
                        fontFamily: "'Outfit', sans-serif",
                      }}
                    >
                      {hr}
                    </span>
                    <span
                      style={{
                        fontSize: 'var(--text-sm)',
                        color: 'var(--subtext)',
                        fontWeight: 500,
                      }}
                    >
                      {en}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--subtext)',
                      fontStyle: 'italic',
                      lineHeight: 1.45,
                      marginTop: 4,
                    }}
                  >
                    {ex}
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
                  <button
                    onClick={() => speak(hr)}
                    aria-label={`Listen to ${hr}`}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      border: '1.5px solid var(--card-b)',
                      background: 'var(--bg)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16,
                      flexShrink: 0,
                    }}
                  >
                    🔊
                  </button>
                  <button
                    onClick={() => toggleLearned(hr)}
                    aria-label={isLearned ? `Unmark ${hr} as learned` : `Mark ${hr} as learned`}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      border: isLearned ? 'none' : '1.5px solid var(--card-b)',
                      background: isLearned
                        ? 'linear-gradient(135deg, #059669, #047857)'
                        : 'var(--bg)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16,
                      flexShrink: 0,
                      boxShadow: isLearned ? '0 2px 8px rgba(5,150,105,.3)' : 'none',
                    }}
                  >
                    {isLearned ? '✓' : '○'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Bottom padding */}
        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}
