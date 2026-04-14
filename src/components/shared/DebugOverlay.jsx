/**
 * DebugOverlay — on-screen log panel for diagnosing tablet issues.
 * Shows errors/warnings from audio.ts, KnightCompanion, and unhandled exceptions.
 * Toggled by a small "DBG" button in the top-right corner.
 * REMOVE THIS COMPONENT once the tablet issues are diagnosed.
 */
import React, { useState, useEffect, useRef } from 'react';
import { getEntries, clearEntries } from '../../lib/debugLog';

const LEVEL_COLOR = { error: '#ff4444', warn: '#ffaa00', info: '#aaaaaa' };

function fmt(ts) {
  const d = new Date(ts);
  return `${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}.${String(d.getMilliseconds()).padStart(3,'0')}`;
}

export default function DebugOverlay() {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState(() => [...getEntries()]);
  const scrollRef = useRef(null);

  useEffect(() => {
    const handler = () => setEntries([...getEntries()]);
    window.addEventListener('nh:debuglog', handler);
    return () => window.removeEventListener('nh:debuglog', handler);
  }, []);

  // Auto-scroll to bottom on new entries
  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries, open]);

  const errorCount = entries.filter(e => e.level === 'error').length;

  return (
    <>
      {/* Toggle button — top right, above everything */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed', top: 8, right: 8,
          zIndex: 99999,
          background: errorCount > 0 ? '#ff4444' : '#222',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          padding: '4px 8px',
          fontSize: 11,
          fontFamily: 'monospace',
          fontWeight: 700,
          opacity: 0.85,
          cursor: 'pointer',
          minWidth: 44,
        }}
      >
        DBG{errorCount > 0 ? ` ⚠${errorCount}` : ''}
      </button>

      {/* Log panel */}
      {open && (
        <div style={{
          position: 'fixed', top: 36, left: 0, right: 0, bottom: 0,
          zIndex: 99998,
          background: 'rgba(0,0,0,0.92)',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 10px',
            borderBottom: '1px solid #333',
            flexShrink: 0,
          }}>
            <span style={{ color: '#fff', fontFamily: 'monospace', fontSize: 12, flex: 1 }}>
              Debug Log — {entries.length} entries
            </span>
            <button
              onClick={() => { clearEntries(); setEntries([]); }}
              style={{ background: '#444', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 8px', fontSize: 11, cursor: 'pointer' }}
            >
              Clear
            </button>
            <button
              onClick={() => setOpen(false)}
              style={{ background: '#444', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 8px', fontSize: 11, cursor: 'pointer' }}
            >
              Close
            </button>
          </div>

          {/* Log entries */}
          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
            {entries.length === 0 && (
              <div style={{ color: '#666', fontFamily: 'monospace', fontSize: 11, padding: '12px 10px' }}>
                No log entries yet. Interact with the app to trigger logs.
              </div>
            )}
            {entries.map((e, i) => (
              <div key={i} style={{
                display: 'flex', gap: 6, padding: '2px 10px',
                borderBottom: '1px solid #1a1a1a',
                background: e.level === 'error' ? '#2a0000' : 'transparent',
              }}>
                <span style={{ color: '#555', fontFamily: 'monospace', fontSize: 10, flexShrink: 0, paddingTop: 1 }}>
                  {fmt(e.t)}
                </span>
                <span style={{
                  color: LEVEL_COLOR[e.level],
                  fontFamily: 'monospace',
                  fontSize: 11,
                  wordBreak: 'break-all',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.4,
                }}>
                  {e.msg}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
