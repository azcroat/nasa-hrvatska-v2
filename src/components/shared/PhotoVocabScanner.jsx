import React, { useState, useRef, useCallback, useEffect } from 'react';
import { apiFetch } from '../../lib/apiFetch.js';

// ── Keyframe injection (pv-spin for loading spinner) ─────────────────────────
const PV_SPIN_STYLE = `@keyframes pv-spin { to { transform: rotate(360deg) } }`;

function injectKeyframes() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('pv-keyframes')) return;
  const el = document.createElement('style');
  el.id = 'pv-keyframes';
  el.textContent = PV_SPIN_STYLE;
  document.head.appendChild(el);
}

// ── Severity color for a vocab card accent ────────────────────────────────────
const BRAND_RED = '#D4002D';
const BRAND_TEAL = '#0e7490';

// ── VocabCard ─────────────────────────────────────────────────────────────────
function VocabCard({ item, checked, onToggle }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      background: 'var(--card)',
      border: '1px solid var(--card-b)',
      borderRadius: 14,
      marginBottom: 10,
      overflow: 'hidden',
    }}>
      {/* Left accent bar */}
      <div style={{
        width: 5,
        alignSelf: 'stretch',
        background: BRAND_RED,
        flexShrink: 0,
        borderRadius: '14px 0 0 14px',
      }} />

      {/* Content */}
      <div style={{ flex: 1, padding: '12px 12px 12px 14px' }}>
        {/* Croatian word */}
        <div style={{
          fontSize: 18,
          fontWeight: 800,
          color: BRAND_RED,
          lineHeight: 1.2,
          marginBottom: 2,
          fontFamily: "'Playfair Display', serif",
        }}>
          {item.word}
        </div>

        {/* English translation */}
        <div style={{
          fontSize: 14,
          color: 'var(--subtext)',
          marginBottom: 2,
          fontWeight: 500,
        }}>
          {item.translation}
        </div>

        {/* Pronunciation hint */}
        {item.pronunciation && (
          <div style={{
            fontSize: 12,
            fontStyle: 'italic',
            color: '#78716c',
            marginBottom: 6,
          }}>
            ({item.pronunciation})
          </div>
        )}

        {/* Example sentence */}
        {item.example && (
          <div style={{
            fontSize: 13,
            color: 'var(--heading)',
            lineHeight: 1.5,
            borderTop: '1px solid var(--card-b)',
            paddingTop: 6,
            marginTop: 2,
          }}>
            {item.example}
          </div>
        )}
      </div>

      {/* Checkbox */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '14px 14px 14px 4px',
        flexShrink: 0,
      }}>
        <input
          type="checkbox"
          aria-label={`Select ${item.word} — ${item.translation}`}
          checked={checked}
          onChange={onToggle}
          style={{
            width: 20,
            height: 20,
            cursor: 'pointer',
            accentColor: BRAND_RED,
          }}
        />
      </div>
    </div>
  );
}

// ── Loading spinner ───────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{
      width: 40,
      height: 40,
      borderRadius: '50%',
      border: `4px solid rgba(212,0,45,0.15)`,
      borderTopColor: BRAND_RED,
      animation: 'pv-spin 0.8s linear infinite',
    }} />
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message }) {
  return (
    <div style={{
      position: 'fixed',
      bottom: 80,
      left: '50%',
      transform: 'translateX(-50%)',
      background: '#16a34a',
      color: '#fff',
      fontWeight: 700,
      fontSize: 14,
      padding: '12px 24px',
      borderRadius: 30,
      zIndex: 9999,
      boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
      pointerEvents: 'none',
      whiteSpace: 'nowrap',
    }}>
      {message}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

/**
 * PhotoVocabScanner
 *
 * @param {{ goBack: () => void, level?: string, onSaveWords?: (words: any[]) => void }} props
 */
export default function PhotoVocabScanner({ goBack, level = 'A2', onSaveWords }) {
  // Inject keyframes on first render
  useEffect(() => { injectKeyframes(); }, []);

  // State machine: 'idle' → 'preview' → 'loading' → 'results' | 'error'
  const [phase, setPhase] = useState('idle');
  const [imageDataUrl, setImageDataUrl] = useState(null);
  const [context, setContext] = useState('');
  const [results, setResults] = useState(null);   // { scene, words: [...] }
  const [errorMsg, setErrorMsg] = useState('');
  const [checked, setChecked] = useState({});     // word index → boolean
  const [toast, setToast] = useState(null);

  const fileInputRef = useRef(null);

  // ── File selection ──────────────────────────────────────────────────────────
  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImageDataUrl(ev.target.result);
      setPhase('preview');
      setResults(null);
      setErrorMsg('');
      setChecked({});
    };
    reader.readAsDataURL(file);
    // Reset file input so same file can be re-selected if needed
    e.target.value = '';
  }, []);

  // ── Scan ────────────────────────────────────────────────────────────────────
  const handleScan = useCallback(async () => {
    if (!imageDataUrl) return;
    setPhase('loading');
    setErrorMsg('');
    try {
      const data = /** @type {any} */ (await apiFetch('/api/photo-vocab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageDataUrl, level, context: context.trim() }),
      }));
      setResults(data);
      // Default: all words checked
      const initial = {};
      (data.words || []).forEach((_, i) => { initial[i] = true; });
      setChecked(initial);
      setPhase('results');
    } catch (err) {
      setErrorMsg(err?.message || 'Failed to scan image. Please try again.');
      setPhase('error');
    }
  }, [imageDataUrl, level, context]);

  // ── Save selected words ─────────────────────────────────────────────────────
  const handleSave = useCallback(() => {
    if (!results?.words) return;
    const selected = results.words.filter((_, i) => checked[i]);
    if (selected.length === 0) return;
    if (onSaveWords) onSaveWords(selected);
    setToast(`✓ ${selected.length} word${selected.length > 1 ? 's' : ''} saved to journal!`);
    setTimeout(() => setToast(null), 2000);
  }, [results, checked, onSaveWords]);

  const selectedCount = Object.values(checked).filter(Boolean).length;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="scr-wrap" style={{ maxWidth: 540, margin: '0 auto' }}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {toast && <Toast message={toast} />}

      {/* ── Header ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 18,
        paddingBottom: 12,
        borderBottom: '1px solid var(--card-b)',
      }}>
        <button
          onClick={goBack}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 22,
            lineHeight: 1,
            color: 'var(--heading)',
            padding: '2px 4px',
          }}
          aria-label="Go back"
        >
          ←
        </button>
        <div>
          <div style={{ fontWeight: 800, fontSize: 17, color: 'var(--heading)' }}>
            📷 Photo Vocabulary
          </div>
          <div style={{ fontSize: 12, color: 'var(--subtext)' }}>
            Snap anything — learn the Croatian words
          </div>
        </div>
      </div>

      {/* ── IDLE: pick photo ── */}
      {(phase === 'idle' || phase === 'preview' || phase === 'error') && (
        <div style={{ marginBottom: 16 }}>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              width: '100%',
              height: 52,
              background: BRAND_RED,
              color: '#fff',
              border: 'none',
              borderRadius: 14,
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: "'Outfit', sans-serif",
              marginBottom: 12,
            }}
          >
            📷 Take Photo or Choose Image
          </button>

          {/* Context hint */}
          <input
            type="text"
            aria-label="Optional context about the photo"
            value={context}
            onChange={e => setContext(e.target.value)}
            placeholder="What is this? (optional)"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '10px 14px',
              borderRadius: 10,
              border: '1px solid var(--card-b)',
              background: 'var(--card)',
              color: 'var(--heading)',
              fontSize: 13,
              fontFamily: "'Outfit', sans-serif",
              outline: 'none',
            }}
          />
        </div>
      )}

      {/* ── PREVIEW: image + scan button ── */}
      {(phase === 'preview' || phase === 'error') && imageDataUrl && (
        <div style={{ marginBottom: 16 }}>
          <div style={{
            borderRadius: 14,
            overflow: 'hidden',
            border: '2px solid var(--card-b)',
            marginBottom: 14,
            background: '#000',
            maxHeight: 260,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <img
              src={imageDataUrl}
              alt="Selected"
              style={{ width: '100%', maxHeight: 260, objectFit: 'contain', display: 'block' }}
            />
          </div>

          {phase === 'error' && (
            <div style={{
              background: '#fee2e2',
              color: '#991b1b',
              borderRadius: 10,
              padding: '10px 14px',
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 12,
            }}>
              ⚠️ {errorMsg}
            </div>
          )}

          <button
            onClick={handleScan}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              width: '100%',
              height: 52,
              background: BRAND_RED,
              color: '#fff',
              border: 'none',
              borderRadius: 14,
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            🔍 Scan for Croatian Vocabulary
          </button>
        </div>
      )}

      {/* ── LOADING ── */}
      {phase === 'loading' && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 18,
          padding: '40px 20px',
        }}>
          <Spinner />
          <div style={{
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--subtext)',
            textAlign: 'center',
          }}>
            Identifying vocabulary…
          </div>
        </div>
      )}

      {/* ── RESULTS ── */}
      {phase === 'results' && results && (
        <div>
          {/* Scene description */}
          {results.scene && (
            <div style={{
              fontSize: 13,
              color: 'var(--subtext)',
              fontStyle: 'italic',
              marginBottom: 16,
              paddingBottom: 12,
              borderBottom: '1px solid var(--card-b)',
              lineHeight: 1.5,
            }}>
              {results.scene}
            </div>
          )}

          {/* Image thumbnail */}
          {imageDataUrl && (
            <div style={{
              borderRadius: 12,
              overflow: 'hidden',
              border: '1px solid var(--card-b)',
              marginBottom: 16,
              maxHeight: 160,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#000',
            }}>
              <img
                src={imageDataUrl}
                alt="Scanned"
                style={{ width: '100%', maxHeight: 160, objectFit: 'contain', display: 'block' }}
              />
            </div>
          )}

          {/* Header row */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--heading)' }}>
              {results.words?.length || 0} words found
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                background: 'none',
                border: '1px solid var(--card-b)',
                borderRadius: 8,
                padding: '5px 12px',
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--subtext)',
                cursor: 'pointer',
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              📷 New Photo
            </button>
          </div>

          {/* Vocab cards */}
          {(results.words || []).map((item, i) => (
            <VocabCard
              key={i}
              item={item}
              checked={!!checked[i]}
              onToggle={() => setChecked(prev => ({ ...prev, [i]: !prev[i] }))}
            />
          ))}

          {/* Save button */}
          {results.words?.length > 0 && (
            <button
              onClick={handleSave}
              disabled={selectedCount === 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                width: '100%',
                height: 52,
                background: selectedCount === 0 ? 'rgba(212,0,45,0.35)' : BRAND_RED,
                color: '#fff',
                border: 'none',
                borderRadius: 14,
                fontSize: 15,
                fontWeight: 700,
                cursor: selectedCount === 0 ? 'default' : 'pointer',
                fontFamily: "'Outfit', sans-serif",
                marginTop: 4,
                marginBottom: 12,
                transition: 'background 0.2s',
              }}
            >
              💾 Save Selected to Journal
              {selectedCount > 0 && (
                <span style={{
                  background: 'rgba(255,255,255,0.25)',
                  borderRadius: 20,
                  padding: '1px 9px',
                  fontSize: 13,
                  fontWeight: 800,
                }}>
                  {selectedCount}
                </span>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
