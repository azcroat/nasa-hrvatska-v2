import React, { useState, useRef, useEffect } from 'react';

// Global search modal (opened by the TabBar 🔍). Previously this used a stale,
// hardcoded 37-item list and could only setTab() to one of five tabs — so it
// never actually took the user to the thing they searched for. It now uses the
// REAL search index (buildSearchIndex: every vocab word, phrase, and screen)
// and navigates to the exact screen via setScr / launchPathItem — the same
// behaviour as the dashboard search, but reachable from any tab.

interface SearchItem {
  hr: string;
  en: string;
  type: 'vocab' | 'phrase' | 'screen';
  go: string;
  cat?: string;
}

function normDiacritics(s: string) {
  return s
    .toLowerCase()
    .replace(/[čć]/g, 'c')
    .replace(/š/g, 's')
    .replace(/ž/g, 'z')
    .replace(/đ/g, 'd');
}

const TYPE_LABELS: Record<SearchItem['type'], string> = {
  screen: 'Screens & tools',
  vocab: 'Words',
  phrase: 'Phrases',
};
// Screens first (the most likely "take me there" intent), then words, then phrases.
const TYPE_ORDER: SearchItem['type'][] = ['screen', 'vocab', 'phrase'];

export default function SearchModal({
  setScr,
  launchPathItem,
  onClose,
}: {
  setScr?: (scr: string) => void;
  launchPathItem?: (item: { go: string; topic?: string }) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState('');
  const [index, setIndex] = useState<SearchItem[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Lazy-load the real search index (keeps chunk-data out of the startup bundle,
  // mirroring useSearch). The modal is only mounted once the user opens search.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mod = (await import('../../data')) as { buildSearchIndex?: () => SearchItem[] };
        const idx = mod.buildSearchIndex ? mod.buildSearchIndex() : [];
        if (!cancelled) setIndex(idx);
      } catch {
        // index unavailable → empty results, modal still closable
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') onClose();
  }

  function navigate(r: SearchItem) {
    onClose();
    if (r.type === 'vocab' && r.cat) {
      launchPathItem?.({ go: 'lesson', topic: r.cat });
    } else {
      setScr?.(r.go);
    }
  }

  const results =
    q.trim().length < 1
      ? []
      : (() => {
          const nq = normDiacritics(q);
          const lq = q.toLowerCase();
          return index
            .filter(
              (item) =>
                normDiacritics(item.hr).includes(nq) ||
                normDiacritics(item.en).includes(nq) ||
                item.hr.toLowerCase().includes(lq) ||
                item.en.toLowerCase().includes(lq),
            )
            .slice(0, 40);
        })();

  // Group by type so "screens & tools" lead (the jump-to-a-feature intent).
  const grouped = results.reduce<Record<string, SearchItem[]>>((acc, item) => {
    (acc[item.type] ||= []).push(item);
    return acc;
  }, {});

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search"
      onKeyDown={handleKeyDown}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        background: 'var(--app-bg)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 16px',
          borderBottom: '1px solid var(--bar-bg)',
        }}
      >
        <span style={{ fontSize: 20 }}>🔍</span>
        <input
          ref={inputRef}
          aria-label="Search words, phrases, and screens"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search words, phrases, screens…"
          style={{
            flex: 1,
            background: 'none',
            border: 'none',
            outline: 'none',
            fontSize: 16,
            color: 'var(--heading)',
          }}
        />
        <button
          onClick={onClose}
          aria-label="Close search"
          style={{
            background: 'none',
            border: 'none',
            fontSize: 22,
            cursor: 'pointer',
            color: 'var(--subtext)',
          }}
        >
          ✕
        </button>
      </div>
      {/* Results */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px' }}>
        {q.length === 0 && (
          <p style={{ color: 'var(--subtext)', fontSize: 14, marginTop: 24, textAlign: 'center' }}>
            Search every word, phrase, and screen — jump straight to it
          </p>
        )}
        {q.length > 0 && results.length === 0 && (
          <p style={{ color: 'var(--subtext)', fontSize: 14, marginTop: 24, textAlign: 'center' }}>
            No results for "{q}"
          </p>
        )}
        {TYPE_ORDER.filter((t) => grouped[t]?.length).map((type) => (
          <div key={type} style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--subtext)',
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginBottom: 8,
              }}
            >
              {TYPE_LABELS[type]}
            </div>
            {grouped[type]!.map((item, i) => (
              <button
                key={item.go + ':' + item.hr + ':' + i}
                onClick={() => navigate(item)}
                aria-label={`${item.hr} — ${item.en}`}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: 'none',
                  background: 'var(--card)',
                  cursor: 'pointer',
                  marginBottom: 6,
                  textAlign: 'left',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--rt-c)' }}>
                    {item.hr}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--subtext)' }}>{item.en}</div>
                </div>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
