import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useStats } from '../../context/StatsContext.tsx';
import { H, Bar, speak, srMark, sh, shuffleArr, V, ASPECT_PAIRS, CROATIAN_CITIES } from '../../data.jsx';
import { playCorrect, playWrong, haptic, playFanfare } from '../../lib/soundSettings.js';
import { markQuest } from '../../lib/quests.js';
import { markPracticed } from '../../hooks/useNotifications';
import CroatianKnight from '../shared/CroatianKnight';
import { knightSpeak } from '../../lib/knightSpeak.js';
import { CelebrationScene } from '../illustrations';
import Flashcards from '../practice/Flashcards';

const CONFETTI_COLORS = ['var(--info-light, #38bdf8)','var(--gold, #fbbf24)','var(--success-light, #4ade80)','var(--error-light, #f87171)','var(--lavender-light, #a78bfa)','#fb923c','#34d399','#e879f9'];

export default function LessonScreen({
  lt, li, lx, ls, lp, la, lsl, qi, icons,
  sLi, sLx, sLs, sLp, sLa, sLsl, sQi,
  goBack, award, setSt, setScr, goToPractice,
}) {
  const resultFired = useRef(false);
  const [showQuit, setShowQuit] = useState(false);

  // Reset resultFired whenever the lesson enters 'learn' phase (new lesson or Study Again)
  useEffect(() => {
    if (lp === 'learn') resultFired.current = false;
  }, [lp]);

  // Auto-play first word audio when lesson enters learn phase — DuoLingo best practice
  useEffect(() => {
    if (lp !== 'learn' || !li || !li[0]) return undefined;
    const t = setTimeout(() => { speak(li[0][0]); }, 600);
    return () => clearTimeout(t);
  }, [lp]);

  // Knight reacts across all lesson phases
  useEffect(() => {
    if (lp === 'learn') {
      const tips = [
        { mood: 'happy',       text: 'New words! Tap each one to hear the pronunciation — then say it back out loud. Hearing yourself is the shortcut. 🔊' },
        { mood: 'ready',       text: 'Vocabulary is the bricks of language. Learn these words and your Croatian conversations open up. 🏰' },
        { mood: 'thinking',    text: 'Pro tip: connect each word to a vivid image. "Kuća" — picture a house you know. Croatian sticks when it has meaning. 🧠' },
        { mood: 'encouraging', text: 'Polako! Take your time with each word. Speed comes naturally — depth comes from attention. ⚔️' },
      ];
      const tip = tips[Math.floor(Math.random() * tips.length)];
      knightSpeak(tip.mood, tip.text, 900);
      return;
    }
    if (lp !== 'result') return;
    const pct = qi.length > 0 ? ls / qi.length : 0;
    knightSpeak(
      pct === 1 ? 'victory' : pct >= 0.7 ? 'celebrating' : 'encouraged',
      pct === 1 ? 'Savršeno! That lesson is yours forever now. 🌟' :
      pct >= 0.7 ? `Odlično! ${Math.round(pct * 100)}% — real Croatian progress. 💪` :
      'Svaki početak je težak — every beginning is hard. Come back and it gets easier. 🛡️',
      400
    );
  }, [lp]);  
  const [showFlashcards, setShowFlashcards] = useState(false);
  const earnedXp = qi.length > 0 ? Math.round((ls / qi.length) * 30) + 5 : 5;
  const scorePct = qi.length > 0 ? ls / qi.length : 0;

  // Build flash pool from lesson words (li is the shuffled word array)
  const flashPool = (li || []).map(w => [
    w.w || w[0],
    w.e || w[1],
    w.p || w[2],
    w.ex || w[3],
  ]).filter(row => row[0] && row[1]);

  const { writeDelta } = useStats();
  const awardFn = typeof award === 'function' ? award : () => {};

  // Pick a Croatian city for the cultural moment on the result screen
  const culturalCity = useMemo(() => {
    if (!CROATIAN_CITIES || !CROATIAN_CITIES.length) return null;
    return CROATIAN_CITIES[Math.floor(Math.random() * CROATIAN_CITIES.length)];
  }, []); // stable per lesson session

  // Build a lookup from Croatian infinitive → aspect pair info
  const aspectMap = useMemo(() => {
    const map = {};
    (ASPECT_PAIRS || []).forEach(pair => {
      if (pair.impf) map[pair.impf] = pair;
      if (pair.pf) map[pair.pf] = pair;
    });
    return map;
  }, []);

  // ── Quiz keyboard shortcuts ────────────────────────────────────────────────
  // Press 1–4 to select an answer; Enter or Space to advance after answering.
  useEffect(() => {
    if (lp !== 'quiz' || !qi[lx]) return;
    function handleKey(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const num = { '1': 0, '2': 1, '3': 2, '4': 3 }[e.key];
      if (num !== undefined && !la && num < qi[lx].opts.length) {
        e.preventDefault();
        sLsl(num); sLa(true);
        const ok = num === qi[lx].ci;
        if (ok) { playCorrect(); haptic(40); sLs(s => s + 1); }
        else { playWrong(); haptic([40, 30, 40]); }
        srMark(qi[lx][0], ok);
      }
      if ((e.key === 'Enter' || e.key === ' ') && la) {
        e.preventDefault();
        if (lx < qi.length - 1) {
          sLx(i => i + 1); sLa(false); sLsl(-1);
        } else {
          if (resultFired.current) return;
          resultFired.current = true;
          const p = ls / qi.length;
          const perfectBonus = p === 1 ? 10 : 0;
          awardFn(Math.round(p * 30) + 5 + perfectBonus, p >= 0.7);
          markPracticed();
          markQuest('grammar');
          markQuest('vocab');
          if (p === 1) markQuest('perfect');
          setSt(s => ({ ...s, lc: s.lc + 1, pf: p === 1 ? s.pf + 1 : s.pf, rs: [...s.rs, String(Math.round(p * 100))], ct: [...new Set([...s.ct, lt])] }));
          writeDelta({ lc: 1, ...(p === 1 ? { pf: 1 } : {}), ct: [lt] });
          playFanfare();
          sLp('result');
        }
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lp, lx, la, ls, qi]);  

  /* ── FLASHCARDS OVERLAY ───────────────────────────────────────── */
  if (showFlashcards) {
    return (
      <Flashcards
        pool={flashPool}
        goBack={() => setShowFlashcards(false)}
        award={awardFn}
      />
    );
  }

  /* ── LEARN PHASE ──────────────────────────────────────────────── */
  if (lp === "learn") return (
    <div className="scr-wrap">
      {H((icons?.[lt] || "📚") + " " + lt)}
      <div style={{
        background:'linear-gradient(135deg, var(--info-bg), rgba(14,116,144,0.08))',
        border:'1px solid rgba(14,116,144,0.2)',
        borderRadius:12, padding:'10px 14px', marginBottom:16,
        display:'flex', alignItems:'center', gap:10
      }}>
        <span style={{fontSize:20}}>🎯</span>
        <div>
          <div style={{fontSize:12, fontWeight:800, color:'var(--info)'}}>TODAY'S LESSON</div>
          <div style={{fontSize:13, fontWeight:700, color:'var(--heading)'}}>
            Complete this lesson to earn XP and advance your learning path
          </div>
        </div>
      </div>
      <div style={{ marginBottom: 8 }}>
        {li.map((w, i) => (
          <div key={i}
            role="button" tabIndex={0}
            onClick={() => speak(w[0])}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); speak(w[0]); } }}
            aria-label={"Hear pronunciation of " + w[0]}
            style={{
              marginBottom: 10, display: "flex", justifyContent: "space-between",
              alignItems: "center", padding: "18px 20px", cursor: "pointer",
              background: 'var(--card)', borderRadius: 14,
              border: '1px solid var(--card-b)',
              borderLeft: '4px solid var(--info)',
              boxShadow: '0 2px 8px rgba(0,0,0,.05)',
              transition: 'transform .1s, box-shadow .1s',
              animation: `fade-up .4s ease ${i * 0.05}s both`,
            }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 12,
                background: 'var(--info-bg)', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid var(--info-b)', fontSize: 18,
              }} aria-hidden="true">🔊</div>
              <div>
                <div style={{
                  fontSize: 20, fontWeight: 800, color: 'var(--heading)',
                  fontFamily: "'Playfair Display',serif",
                }}>{w[0]}</div>
                {w[2] && (
                  <div style={{
                    fontSize: 'var(--text-xs)', color: 'var(--subtext)',
                    marginTop: 2, fontFamily: 'monospace', letterSpacing: '.03em',
                  }}>/{w[2]}/</div>
                )}
                {/* Example sentence */}
                {w[3] && (
                  <div style={{
                    fontSize: 12, color: 'var(--subtext)', marginTop: 4,
                    fontStyle: 'italic', lineHeight: 1.4,
                  }}>{w[3]}</div>
                )}
                {/* Aspect pair */}
                {(() => {
                  const pair = aspectMap[w[0]];
                  if (!pair) return null;
                  const partner = pair.impf === w[0]
                    ? { label: 'pf', word: pair.pf }
                    : { label: 'impf', word: pair.impf };
                  return (
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      marginTop: 6, background: 'rgba(14,116,144,.08)',
                      border: '1px solid rgba(14,116,144,.2)',
                      borderRadius: 8, padding: '2px 8px', fontSize: 11,
                    }}>
                      <span style={{ color: 'var(--info)', fontWeight: 700 }}>
                        {pair.impf === w[0] ? 'impf' : 'pf'}
                      </span>
                      <span style={{ color: 'var(--subtext)' }}>↔</span>
                      <span
                        role="button" tabIndex={0}
                        onClick={e => { e.stopPropagation(); speak(partner.word); }}
                        onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); speak(partner.word); } }}
                        style={{ color: 'var(--info)', fontWeight: 700, cursor: 'pointer' }}
                      >{partner.word}</span>
                      <span style={{ color: 'var(--subtext)', fontWeight: 600 }}>({partner.label})</span>
                    </div>
                  );
                })()}
              </div>
            </div>
            <div style={{
              fontSize: 15, fontWeight: 600, color: 'var(--subtext)',
              textAlign: 'right', maxWidth: '45%',
            }}>{w[1]}</div>
          </div>
        ))}
      </div>
      {li.length >= 4 && (
        <button className="b bp" style={{ width: "100%", marginTop: 8 }} onClick={() => {
          const qPool = sh(li).slice(0, Math.min(li.length, 15));
          // DuoLingo-style: alternate CR→EN and EN→CR questions for exercise variety
          const q = qPool.map((w, i) => {
            const isCrToEn = i % 2 === 0;
            if (isCrToEn) {
              // CR → EN: show Croatian word, pick English translation (existing)
              const wr = sh(li.filter(x => x[1] !== w[1])).slice(0, 3).map(x => x[1]);
              const o = sh([w[1], ...wr]);
              return { ...w, opts: o, ci: o.indexOf(w[1]), direction: 'cr-en' };
            } else {
              // EN → CR: show English word, pick Croatian translation (new)
              const wr = sh(li.filter(x => x[0] !== w[0])).slice(0, 3).map(x => x[0]);
              const o = sh([w[0], ...wr]);
              return { ...w, opts: o, ci: o.indexOf(w[0]), direction: 'en-cr' };
            }
          });
          sQi(q); sLx(0); sLp("quiz"); sLa(false); sLsl(-1);
        }}>Quiz Me! →</button>
      )}
    </div>
  );

  /* ── QUIZ PHASE ───────────────────────────────────────────────── */
  if (lp === "quiz" && qi[lx]) {
    const isCorrect = la && lsl === qi[lx].ci;
    return (
      <div className="scr-wrap">
        {showQuit && (
          <div style={{
            position:'fixed', inset:0, background:'rgba(0,0,0,0.5)',
            display:'flex', alignItems:'center', justifyContent:'center',
            zIndex:1000, padding:24
          }}>
            <div className="c" style={{maxWidth:320, width:'100%', padding:24, textAlign:'center'}}>
              <div style={{fontSize:24, marginBottom:8}}>🚪</div>
              <div style={{fontSize:'var(--text-xl)', fontWeight:800, color:'var(--heading)', marginBottom:8}}>
                Leave this lesson?
              </div>
              <div style={{fontSize:'var(--text-sm)', color:'var(--subtext)', marginBottom:20}}>
                Your progress in this lesson won't be saved.
              </div>
              <button className="b bd" style={{width:'100%', marginBottom:10}} onClick={goBack}>
                Yes, leave
              </button>
              <button className="b bg" style={{width:'100%'}} onClick={() => setShowQuit(false)}>
                Keep going →
              </button>
            </div>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: "var(--subtext)" }}>
            {lx + 1} / {qi.length}
          </span>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'var(--warning-bg)', borderRadius: 20,
            padding: '4px 10px', border: '1px solid var(--warning-b)',
          }}>
            <span style={{ fontSize: 13 }}>⭐</span>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--warning)' }}>
              {ls * 3} XP
            </span>
          </div>
          <button onClick={() => { if (lx > 0 || ls > 0) setShowQuit(true); else goBack(); }} style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 22, color: "var(--subtext)", padding: "6px 10px", minHeight: 44,
          }} aria-label="Exit quiz">×</button>
        </div>

        <div style={{
          fontSize:12, color:'var(--subtext)', fontWeight:600,
          marginBottom:6, textAlign:'center'
        }}>
          {lt || 'Lesson'} · Question {(lx || 0) + 1} of {qi?.length || '?'}
        </div>

        <Bar v={lx + 1} mx={qi.length} h={6} />

        <div className="c" style={{ marginTop: 16 }}>
          {/* Direction label — mirrors DuoLingo's exercise-type header */}
          <div style={{
            fontSize: 11, fontWeight: 700, color: 'var(--subtext)',
            marginBottom: 10, letterSpacing: '.06em', textTransform: 'uppercase',
          }}>
            {qi[lx].direction === 'en-cr' ? 'Translate to Croatian' : 'What does this mean in English?'}
          </div>

          {qi[lx].direction === 'en-cr' ? (
            /* EN → CR: show English word as prompt (no speaker — it's English) */
            <div style={{ marginBottom: 24, padding: '12px 0' }}>
              <p style={{
                fontSize: 28, fontWeight: 900, margin: 0,
                fontFamily: "'Playfair Display',serif", color: 'var(--heading)',
              }}>{qi[lx][1]}</p>
            </div>
          ) : (
            /* CR → EN: show Croatian word with speaker icon (existing behavior) */
            <div
              role="button" tabIndex={0}
              onClick={() => speak(qi[lx][0])}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); speak(qi[lx][0]); } }}
              aria-label={"Hear pronunciation of " + qi[lx][0]}
              style={{
                display: "flex", alignItems: "center", gap: 14,
                marginBottom: 24, cursor: "pointer", padding: '12px 0',
              }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: 'var(--info-bg)', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid var(--info-b)', fontSize: 20,
              }} aria-hidden="true">🔊</div>
              <p style={{
                fontSize: 28, fontWeight: 900, margin: 0,
                fontFamily: "'Playfair Display',serif", color: 'var(--heading)',
              }}>{qi[lx][0]}</p>
            </div>
          )}

          {qi[lx].opts.map((o, i) => (
            <button key={i}
              className={"ob " + (la ? (i === qi[lx].ci ? "ok" : lsl === i ? "no" : "") : "")}
              style={{
                animation: la && i === qi[lx].ci ? 'correct-flash .5s ease' : la && lsl === i ? 'wrong-shake .4s ease' : undefined,
                position: 'relative',
                display: 'flex', alignItems: 'center', gap: 10,
              }}
              aria-label={`Option ${i + 1}: ${o}`}
              onClick={() => {
                if (!la) {
                  sLsl(i); sLa(true);
                  const ok = i === qi[lx].ci;
                  if (ok) { playCorrect(); haptic(40); sLs(s => s + 1); }
                  else { playWrong(); haptic([40, 30, 40]); }
                  srMark(qi[lx][0], ok);
                }
              }}>
              <span style={{
                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                fontSize: 10, fontWeight: 800, color: 'var(--subtext)', opacity: 0.5,
                fontFamily: 'monospace', pointerEvents: 'none',
              }} aria-hidden="true">{i + 1}</span>
              <span style={{ flex: 1, paddingLeft: 24 }}>{o}</span>
              {/* EN→CR: tap any Croatian option to hear its pronunciation */}
              {qi[lx].direction === 'en-cr' && (
                <span
                  role="button"
                  tabIndex={-1}
                  onClick={e => { e.stopPropagation(); speak(o); }}
                  style={{ fontSize: 14, opacity: 0.5, flexShrink: 0, padding: '2px 4px' }}
                  aria-label={`Hear ${o}`}
                >🔊</span>
              )}
            </button>
          ))}

          {/* Answer feedback banner */}
          {la && (
            <div style={{
              marginTop: 14, borderRadius: 14, padding: '14px 16px',
              background: isCorrect ? 'var(--success-bg)' : 'var(--error-bg)',
              border: `1.5px solid ${isCorrect ? 'var(--success-b)' : 'var(--error-b)'}`,
              display: 'flex', alignItems: 'center', gap: 12,
              animation: 'spring-in .3s ease',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: isCorrect ? 'var(--success)' : 'var(--error)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: 18, fontWeight: 900,
              }}>
                {isCorrect ? '✓' : '✗'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 15, fontWeight: 900,
                  color: isCorrect ? 'var(--success)' : 'var(--error)',
                }}>
                  {isCorrect ? 'Točno! · Correct!' : 'Netočno · Incorrect'}
                </div>
                {!isCorrect && (
                  <div style={{ fontSize: 13, color: 'var(--subtext)', marginTop: 2, fontWeight: 600 }}>
                    Answer: <span style={{ color: 'var(--success)', fontWeight: 800 }}>{qi[lx].opts[qi[lx].ci]}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          {la && !isCorrect && (
            <div style={{
              marginTop:10, padding:'12px 14px',
              background:'rgba(14,116,144,0.15)',
              border:'1px solid rgba(14,116,144,0.15)',
              borderLeft:'3px solid var(--info)',
              borderRadius:10, fontSize:13, color:'var(--subtext)', lineHeight:1.6
            }}>
              💡 <strong style={{color:'var(--heading)'}}>Tip:</strong>{' '}
              {qi?.[lx]?.hint || qi?.[lx]?.explanation || (qi?.[lx] ? (qi[lx].direction === 'en-cr' ? `"${qi[lx][1]}" translates to "${qi[lx][0]}" in Croatian.` : 'Review this word — it will come up again in spaced repetition.') : 'Review this word — it will come up again in spaced repetition.')}
            </div>
          )}

          {la && (
            <button className="b bp" style={{ width: "100%", marginTop: 14 }} onClick={() => {
              if (lx < qi.length - 1) {
                sLx(i => i + 1); sLa(false); sLsl(-1);
              } else {
                if (resultFired.current) return;
                resultFired.current = true;
                const p = ls / qi.length;
                const perfectBonus = p === 1 ? 10 : 0;
                awardFn(Math.round(p * 30) + 5 + perfectBonus, p >= 0.7);
                markPracticed();
                markQuest('grammar');
                markQuest('vocab');
                if (p === 1) markQuest('perfect');
                setSt(s => ({ ...s, lc: s.lc + 1, pf: p === 1 ? s.pf + 1 : s.pf, rs: [...s.rs, String(Math.round(p * 100))], ct: [...new Set([...s.ct, lt])] }));
          writeDelta({ lc: 1, ...(p === 1 ? { pf: 1 } : {}), ct: [lt] });
                playFanfare();
                sLp("result");
              }
            }}>{lx < qi.length - 1 ? "Next →" : "See Results"}</button>
          )}
        </div>
      </div>
    );
  }

  /* ── RESULT PHASE ─────────────────────────────────────────────── */
  if (lp === "result") return (
    <div style={{
      minHeight: '80vh',
      background: 'linear-gradient(160deg,var(--grad-start,#060e1e) 0%,var(--grad-mid,#0a2348) 45%,var(--grad-end,#0c3868) 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '40px 24px 52px',
      position: 'relative', overflow: 'hidden',
      borderRadius: 20, margin: '0 -16px',
    }}>

      {/* Confetti particles */}
      {CONFETTI_COLORS.map((color, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${(i * 13 + 5) % 95}%`,
          top: -16,
          width: i % 3 === 0 ? 10 : 7,
          height: i % 3 === 0 ? 10 : 7,
          borderRadius: i % 2 === 0 ? '50%' : 3,
          background: color,
          animation: `confettiDrop ${1.1 + (i * 0.13) % 1.0}s ease-in ${(i * 0.09) % 0.7}s both`,
          zIndex: 0,
        }} />
      ))}
      {CONFETTI_COLORS.map((color, i) => (
        <div key={'b' + i} style={{
          position: 'absolute',
          left: `${(i * 19 + 10) % 95}%`,
          top: -12,
          width: 6, height: 6,
          borderRadius: 2,
          background: color,
          animation: `confettiDrop ${1.4 + (i * 0.11) % 0.9}s ease-in ${0.1 + (i * 0.07) % 0.6}s both`,
          zIndex: 0,
        }} />
      ))}

      {/* Shimmer overlay */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        background: 'linear-gradient(105deg, transparent 25%, rgba(255,255,255,.04) 50%, transparent 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 4s linear infinite',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        <CroatianKnight
          size={90}
          mood={scorePct === 1 ? 'victory' : scorePct >= 0.5 ? 'encouraged' : 'thinking'}
          style={{margin:'0 auto 16px', display:'block', animation:'bounce-in .5s ease'}}
        />

        {/* Trophy / emoji */}
        <div style={{
          fontSize: 76, lineHeight: 1, marginBottom: 18,
          animation: 'bounce-in .6s cubic-bezier(.175,.885,.32,1.275)',
          filter: scorePct === 1 ? 'drop-shadow(0 0 20px rgba(251,191,36,.8))' : 'drop-shadow(0 0 12px rgba(74,222,128,.5))',
        }}>
          {scorePct === 1 ? '⭐' : scorePct >= 0.7 ? '🎉' : '💪'}
        </div>

        {/* Croatian celebration heading */}
        <div style={{
          fontSize: 38, fontWeight: 900,
          fontFamily: "'Playfair Display',serif",
          color: 'white', textAlign: 'center', lineHeight: 1.1,
          textShadow: '0 2px 24px rgba(0,0,0,.5)',
          animation: 'fade-up .6s ease .15s both',
          marginBottom: 6,
        }}>
          {scorePct === 1 ? 'Savršeno!' : scorePct >= 0.7 ? 'Odlično!' : 'Bravo!'}
        </div>
        <div style={{
          fontSize: 15, color: 'rgba(255,255,255,.65)',
          animation: 'fade-up .6s ease .22s both',
          fontWeight: 600, marginBottom: 28,
        }}>
          {scorePct === 1 ? 'Perfect!' : scorePct >= 0.5 ? 'Great Job!' : 'Every practice counts.'}
        </div>

        {/* Score fraction */}
        <div style={{
          fontSize: 13, color: 'rgba(255,255,255,.5)', fontWeight: 700,
          marginBottom: 12, letterSpacing: '.04em',
        }}>
          {ls}/{qi.length}
        </div>

        {/* Score dots */}
        <div style={{
          display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap', justifyContent: 'center',
          animation: 'fade-up .6s ease .28s both',
        }}>
          {qi.map((_, i) => (
            <div key={i} style={{
              width: 16, height: 16, borderRadius: '50%',
              background: i < ls ? 'var(--success)' : 'rgba(255,255,255,.18)',
              boxShadow: i < ls ? '0 0 8px rgba(74,222,128,.7)' : 'none',
              transition: `all .35s ease ${i * 0.04}s`,
            }} />
          ))}
        </div>

        {/* XP award card */}
        <div style={{
          background: 'rgba(255,255,255,.1)', borderRadius: 22,
          padding: '22px 36px', textAlign: 'center',
          border: '1px solid rgba(255,255,255,.18)',
          backdropFilter: 'blur(16px)',
          animation: 'fade-up .6s ease .38s both',
          marginBottom: 32, width: '100%', maxWidth: 320,
        }}>
          <div style={{
            fontSize: 'var(--text-xs)', fontWeight: 800,
            color: 'rgba(255,255,255,.55)', textTransform: 'uppercase',
            letterSpacing: '.12em', marginBottom: 6,
          }}>XP EARNED</div>
          <div style={{
            fontSize: 56, fontWeight: 900, color: 'var(--gold, #fbbf24)',
            fontFamily: "'Outfit',sans-serif", lineHeight: 1,
            textShadow: '0 0 28px rgba(251,191,36,.7)',
            animation: 'count-up-pop .7s ease .65s both',
          }}>+{earnedXp}</div>
          <div style={{
            marginTop: 10, display: 'flex', gap: 16, justifyContent: 'center',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'white', fontFamily: "'Outfit',sans-serif" }}>{ls}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,.45)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em' }}>correct</div>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,.15)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'white', fontFamily: "'Outfit',sans-serif" }}>{qi.length - ls}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,.45)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em' }}>missed</div>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,.15)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'white', fontFamily: "'Outfit',sans-serif" }}>{qi.length}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,.45)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em' }}>total</div>
            </div>
          </div>
        </div>

        {/* Celebration illustration */}
        <CelebrationScene
          width={280} height={120}
          message={scorePct === 1 ? 'Savršeno!' : 'Odlično!'}
          style={{margin:'0 auto 4px', display:'block'}}
        />

        {/* ── Croatian cultural moment ── */}
        {culturalCity && (
          <div style={{
            marginTop: 16, width: '100%', maxWidth: 320,
            background: 'rgba(255,255,255,.08)',
            border: '1px solid rgba(255,255,255,.15)',
            borderRadius: 14, padding: '14px 16px',
            backdropFilter: 'blur(12px)',
            animation: 'fade-up .6s ease .55s both',
          }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,.5)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 8 }}>
              🇭🇷 Your next destination
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 36, flexShrink: 0 }}>{culturalCity.icon || '🏔️'}</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 900, color: 'white', fontFamily: "'Playfair Display', serif" }}>
                  {culturalCity.name}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', marginTop: 2, fontStyle: 'italic' }}>
                  {culturalCity.tagline || culturalCity.region}
                </div>
              </div>
            </div>
            {culturalCity.vocab && culturalCity.vocab[0] && (
              <div style={{
                marginTop: 10, paddingTop: 10,
                borderTop: '1px solid rgba(255,255,255,.12)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span
                  role="button" tabIndex={0}
                  onClick={() => speak(culturalCity.vocab[0].hr)}
                  onKeyDown={e => { if (e.key === 'Enter') speak(culturalCity.vocab[0].hr); }}
                  style={{ fontSize: 14, fontWeight: 800, color: 'white', cursor: 'pointer' }}
                >
                  🔊 {culturalCity.vocab[0].hr}
                </span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,.6)' }}>{culturalCity.vocab[0].en}</span>
              </div>
            )}
          </div>
        )}

        {/* Practice Path panel */}
        <div style={{
          marginTop:16, padding:'16px',
          background:'rgba(255,255,255,.08)',
          border:'1px solid rgba(255,255,255,.15)',
          borderRadius:14, width:'100%', maxWidth:320,
          backdropFilter:'blur(12px)',
          animation:'fade-up .6s ease .44s both',
        }}>
          <div style={{fontSize:13, fontWeight:800, color:'rgba(255,255,255,.9)', marginBottom:12, letterSpacing:'.02em'}}>
            Practice what you just learned:
          </div>
          {[
            { icon:'🃏', title:'Flashcards', desc:'Review vocabulary', action: () => setShowFlashcards(true) },
            { icon:'🔁', title:'SRS Review', desc:'Lock it in long-term', action: () => { goBack(); if (typeof setScr === 'function') setTimeout(() => setScr('review'), 50); } },
            { icon:'🎯', title:'Quick Quiz', desc:'Test yourself now', action: () => { if (typeof goToPractice === 'function') goToPractice(); else goBack(); } },
          ].map(ex => (
            <button key={ex.title} onClick={ex.action} style={{
              display:'flex', alignItems:'center', gap:10, width:'100%',
              padding:'10px 12px', marginBottom:8,
              background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.18)',
              borderRadius:10, cursor:'pointer', textAlign:'left',
            }}>
              <span style={{fontSize:20}}>{ex.icon}</span>
              <div>
                <div style={{fontSize:13, fontWeight:700, color:'white'}}>{ex.title}</div>
                <div style={{fontSize:11, color:'rgba(255,255,255,.6)'}}>{ex.desc}</div>
              </div>
            </button>
          ))}
        </div>

        {/* CTAs */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 10,
          width: '100%', maxWidth: 340,
          animation: 'fade-up .6s ease .48s both',
        }}>
          <button
            style={{
              width: '100%', height: 56, fontSize: 17, fontWeight: 800,
              background: 'white', color: '#0a2348',
              borderRadius: 16, border: 'none', cursor: 'pointer',
              fontFamily: "'Outfit',sans-serif", letterSpacing: '.01em',
              boxShadow: '0 4px 24px rgba(0,0,0,.35)',
            }}
            onClick={goBack}>
            Continue →
          </button>
          <button
            style={{
              width: '100%', height: 46,
              background: 'rgba(255,255,255,.1)',
              border: '1.5px solid rgba(255,255,255,.22)',
              borderRadius: 14, cursor: 'pointer',
              color: 'rgba(255,255,255,.75)', fontSize: 14, fontWeight: 700,
              fontFamily: "'Outfit',sans-serif",
            }}
            onClick={() => {
              resultFired.current = false;
              sLi(shuffleArr(V[lt] || [])); sLx(0); sLs(0); sLp("learn"); sLa(false);
            }}>
            ↩ Study Again
          </button>
        </div>
      </div>
    </div>
  );

  return null;
}
