// @ts-nocheck
import React, { useState } from 'react';
import { H, srMark } from '../../data';
import { knightSpeak } from '../../lib/knightSpeak.js';
import { markQuest } from '../../lib/quests.js';

// Q-4: State moved into component — App.jsx no longer owns mp/mm/msl/gph/gsc.
// PracticeTab passes initPool (the shuffled card array) as the only init prop.
export default function MatchGame({ initPool, goBack, award }) {
  const [mp] = useState(initPool || []);
  const [mm, sMm] = useState([]);
  const [msl, sMsl] = useState([]);
  const [gph, sGph] = useState('play');
  const [gsc, sGsc] = useState(0);

  return (
    <div className="scr-wrap">
      {H('🃏 Match Pairs', '', goBack)}
      {gph === 'play' && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--subtext)' }}>
            <span style={{ color: 'var(--success)', fontWeight: 900 }}>{mm.length}</span> /{' '}
            {mp.length / 2} pairs found
          </div>
          {mm.length > 0 && (
            <div style={{ fontSize: 12, color: 'var(--success)', fontWeight: 700 }}>
              {'★'.repeat(mm.length)}
            </div>
          )}
        </div>
      )}
      {gph === 'play' && (
        <div className="g3">
          {mp.map((c) => (
            <div
              key={c.id}
              role="button"
              tabIndex={0}
              aria-pressed={msl.some((s) => s.id === c.id)}
              style={{
                padding: '14px 12px',
                border: mm.includes(c.p)
                  ? '2px solid var(--success)'
                  : msl.some((s) => s.id === c.id)
                    ? '2px solid var(--info)'
                    : '2px solid var(--card-b)',
                borderRadius: 14,
                background: mm.includes(c.p)
                  ? 'var(--success-bg)'
                  : msl.some((s) => s.id === c.id)
                    ? 'rgba(14,116,144,.1)'
                    : 'var(--card)',
                textAlign: 'center',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                opacity: mm.includes(c.p) ? 0.6 : 1,
                transition: 'transform .15s ease, box-shadow .15s ease',
                transform: msl.some((s) => s.id === c.id) ? 'scale(1.03)' : 'scale(1)',
              }}
              onClick={() => {
                if (mm.includes(c.p)) return;
                if (msl.length === 0) {
                  sMsl([c]);
                  return;
                }
                const f = msl[0];
                if (f.id === c.id) {
                  sMsl([]);
                  return;
                }
                if (f.p === c.p && f.tp !== c.tp) {
                  const hrWord = f.tp === 'hr' ? f.t : c.t;
                  srMark(hrWord, true);
                  sMm((m) => [...m, c.p]);
                  sGsc((s) => s + 1);
                  sMsl([]);
                  if (mm.length + 1 === mp.length / 2)
                    setTimeout(() => {
                      if (typeof award === 'function') award(20);
                      markQuest('vocab');
                      sGph('done');
                      knightSpeak(
                        'celebrating',
                        'Sve upareno! You just matched every word. Neural pathways reinforced. 🧠⚔️',
                        800,
                      );
                    }, 500);
                } else {
                  const hrWord = f.tp === 'hr' ? f.t : c.tp === 'hr' ? c.t : null;
                  if (hrWord) srMark(hrWord, false);
                  sMsl([f, c]);
                  setTimeout(() => sMsl([]), 800);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (mm.includes(c.p)) return;
                  if (msl.length === 0) {
                    sMsl([c]);
                    return;
                  }
                  const f = msl[0];
                  if (f.id === c.id) {
                    sMsl([]);
                    return;
                  }
                  if (f.p === c.p && f.tp !== c.tp) {
                    const hrWord = f.tp === 'hr' ? f.t : c.t;
                    srMark(hrWord, true);
                    sMm((m) => [...m, c.p]);
                    sGsc((s) => s + 1);
                    sMsl([]);
                    if (mm.length + 1 === mp.length / 2)
                      setTimeout(() => {
                        if (typeof award === 'function') award(20);
                        markQuest('vocab');
                        sGph('done');
                        knightSpeak(
                          'celebrating',
                          'Sve upareno! You just matched every word. Neural pathways reinforced. 🧠⚔️',
                          800,
                        );
                      }, 500);
                  } else {
                    const hrWord = f.tp === 'hr' ? f.t : c.tp === 'hr' ? c.t : null;
                    if (hrWord) srMark(hrWord, false);
                    sMsl([f, c]);
                    setTimeout(() => sMsl([]), 800);
                  }
                }
              }}
            >
              {c.t}
            </div>
          ))}
        </div>
      )}
      {gph === 'done' && (
        <div style={{ textAlign: 'center', paddingTop: 40 }}>
          <div style={{ fontSize: 64 }}>🎉</div>
          <h3
            style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: 24,
              color: 'var(--heading)',
              marginTop: 12,
            }}
          >
            All Matched!
          </h3>
          <p style={{ color: 'var(--subtext)', marginTop: 4 }}>{gsc} pairs matched!</p>
          <button className="b bp" style={{ marginTop: 24 }} onClick={goBack}>
            Continue →
          </button>
        </div>
      )}
    </div>
  );
}
