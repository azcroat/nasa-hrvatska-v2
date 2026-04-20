// @ts-nocheck
import React, { useState } from 'react';
import { H, Bar, sh, ZNAM, srMark } from '../../data';

export default function ZnamGame({ goBack, award }) {
  const [znMode, sZnMode] = useState('menu');
  const [znSec, sZnSec] = useState(0);
  const [znIdx, sZnIdx] = useState(0);
  const [znSc, sZnSc] = useState(0);
  const [znAns, sZnAns] = useState(false);
  const [znSel, sZnSel] = useState(-1);
  const [znOpts, sZnOpts] = useState([]);

  function startSection(si) {
    const s0 = ZNAM.sections[si].sentences[0];
    sZnSec(si);
    sZnIdx(0);
    sZnSc(0);
    sZnAns(false);
    sZnSel(-1);
    sZnOpts(sh([s0.hr, ...s0.alts]));
    sZnMode('quiz');
  }

  return (
    <div className="scr-wrap">
      {H('🇭🇷 ' + ZNAM.title, 'Translate English to Croatian', goBack)}

      {znMode === 'menu' && (
        <React.Fragment>
          <div className="c" style={{ marginBottom: 20 }}>
            Select a section to practice translating English sentences into Croatian. Pick the
            correct Croatian translation from four choices.
          </div>
          {ZNAM.sections.map((sec, si) => (
            <div
              key={si}
              className="tc"
              onClick={() => startSection(si)}
              style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg,#0e7490,#06b6d4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 800,
                  fontSize: 16,
                }}
              >
                {si + 1}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{sec.name}</div>
                <div style={{ fontSize: 12, color: '#78716c' }}>
                  {sec.sentences.length} sentences
                </div>
              </div>
            </div>
          ))}
        </React.Fragment>
      )}

      {znMode === 'quiz' &&
        (() => {
          const sec = ZNAM.sections[znSec];
          const sent = sec.sentences[znIdx];
          const correct = sent.hr;
          return (
            <React.Fragment>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>
                  {sec.name} — {znIdx + 1}/{sec.sentences.length}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0e7490' }}>Score: {znSc}</div>
              </div>
              <Bar v={znIdx + 1} mx={sec.sentences.length} h={6} />
              <div className="c" style={{ marginTop: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: '#78716c', marginBottom: 6 }}>
                  Translate to Croatian:
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#1c1917' }}>"{sent.en}"</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
                {znOpts.map((o, oi) => (
                  <button
                    key={oi}
                    className={
                      'ob ' + (znAns ? (o === correct ? 'ok' : znSel === oi ? 'no' : '') : '')
                    }
                    onClick={() => {
                      if (znAns) return;
                      sZnSel(oi);
                      sZnAns(true);
                      const isCorrect = o === correct;
                      srMark(correct, isCorrect);
                      if (isCorrect) {
                        sZnSc((s) => s + 1);
                        if (typeof award === 'function') award(5);
                      }
                    }}
                  >
                    {o}
                  </button>
                ))}
              </div>
              {znAns && (
                <button
                  className="b bp"
                  style={{ width: '100%', marginTop: 16 }}
                  onClick={() => {
                    if (znIdx < sec.sentences.length - 1) {
                      const nxt = sec.sentences[znIdx + 1];
                      sZnIdx((i) => i + 1);
                      sZnAns(false);
                      sZnSel(-1);
                      sZnOpts(sh([nxt.hr, ...nxt.alts]));
                    } else {
                      sZnMode('done');
                    }
                  }}
                >
                  {znIdx < sec.sentences.length - 1 ? 'Next →' : 'See Results'}
                </button>
              )}
            </React.Fragment>
          );
        })()}

      {znMode === 'done' &&
        (() => {
          const sec = ZNAM.sections[znSec];
          const pct = Math.round((znSc / sec.sentences.length) * 100);
          return (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 64 }}>{pct >= 80 ? '🏆' : pct >= 50 ? '👍' : '📚'}</div>
              <h2 style={{ fontFamily: "'Playfair Display',serif", color: '#164e63' }}>
                {sec.name} Complete!
              </h2>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#0e7490' }}>
                {znSc} / {sec.sentences.length}
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#d97706', margin: '8px 0 4px' }}>
                +{znSc * 5} XP
              </div>
              <div style={{ fontSize: 14, color: '#78716c', marginBottom: 24 }}>{pct}% correct</div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="b bg" onClick={() => startSection(znSec)}>
                  🔄 Retry
                </button>
                {znSec < ZNAM.sections.length - 1 && (
                  <button className="b bp" onClick={() => startSection(znSec + 1)}>
                    Next Section →
                  </button>
                )}
                <button className="b bg" onClick={() => sZnMode('menu')}>
                  📋 All Sections
                </button>
              </div>
            </div>
          );
        })()}
    </div>
  );
}
