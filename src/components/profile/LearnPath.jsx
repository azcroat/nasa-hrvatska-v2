import React, { useRef, useEffect, useState } from 'react';
import { H, LEARN_PATH } from '../../data.jsx';

const LEVEL_COLORS = [
  { bg:'linear-gradient(135deg,#16a34a,#15803d)', text:'#fff', glow:'rgba(22,163,74,.4)', light:'#f0fdf4', border:'#86efac' },
  { bg:'linear-gradient(135deg,#0e7490,#164e63)', text:'#fff', glow:'rgba(14,116,144,.4)', light:'#f0f9ff', border:'#7dd3fc' },
  { bg:'linear-gradient(135deg,#7c3aed,#6d28d9)', text:'#fff', glow:'rgba(124,58,237,.4)', light:'#faf5ff', border:'#c4b5fd' },
  { bg:'linear-gradient(135deg,#d97706,#b45309)', text:'#fff', glow:'rgba(217,119,6,.4)',  light:'#fffbeb', border:'#fcd34d' },
  { bg:'linear-gradient(135deg,#e11d48,#be123c)', text:'#fff', glow:'rgba(225,29,72,.4)',  light:'#fff1f2', border:'#fca5a5' },
];

const LEVEL_EMOJIS = ['🌱','🌿','🌳','🌲','🏔️'];
const STAGE_NAMES = ['Survivor','Settler','Communicator','Explorer','Hrvat!'];

export default function LearnPath({ st, setScr, goBack }) {
  const activeRef = useRef(null);
  const [hovered, setHovered] = useState(null);

  // Calculate global progress
  let totalDone = 0, totalAll = 0;
  LEARN_PATH.forEach(lv => lv.items.forEach(it => { totalAll++; if (it.ck(st)) totalDone++; }));

  // Find the first incomplete item (the "active" node)
  let activeLevel = -1, activeItem = -1;
  outer: for (let li = 0; li < LEARN_PATH.length; li++) {
    for (let ii = 0; ii < LEARN_PATH[li].items.length; ii++) {
      if (!LEARN_PATH[li].items[ii].ck(st)) {
        activeLevel = li; activeItem = ii; break outer;
      }
    }
  }

  useEffect(() => {
    if (activeRef.current) {
      setTimeout(() => {
        activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 400);
    }
  }, []);

  const pct = totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : 0;

  return (
    <div className="scr-wrap" style={{ paddingBottom: 100 }}>
      {H("🗺️ My Learning Path", "From zero to fluency — one step at a time", goBack)}

      {/* ── Global progress ring ────────────────────────────────────────── */}
      <div className="c" style={{
        marginBottom: 28, display: 'flex', alignItems: 'center', gap: 20,
        background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
        border: '1.5px solid #7dd3fc',
      }}>
        {/* Circular progress ring */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <svg width={80} height={80} viewBox="0 0 80 80">
            <defs>
              <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0e7490" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
            <circle cx={40} cy={40} r={32} fill="none" stroke="rgba(0,0,0,.08)" strokeWidth={8} />
            <circle
              cx={40} cy={40} r={32}
              fill="none" stroke="url(#ringGrad)" strokeWidth={8}
              strokeLinecap="round"
              strokeDasharray={201}
              strokeDashoffset={201 - (201 * pct / 100)}
              transform="rotate(-90 40 40)"
              style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)' }}
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#0e7490', lineHeight: 1 }}>{pct}%</div>
            <div style={{ fontSize: 9, color: '#64748b', fontWeight: 600 }}>done</div>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
            {totalDone} / {totalAll} milestones
          </div>
          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500, lineHeight: 1.5 }}>
            {pct === 100
              ? '🏆 All milestones complete! You are Hrvat!'
              : activeLevel >= 0
                ? `Currently on: ${LEARN_PATH[activeLevel].title} — ${LEARN_PATH[activeLevel].items[activeItem]?.name}`
                : 'Amazing progress!'
            }
          </div>
        </div>
      </div>

      {/* ── THE WINDING PATH ────────────────────────────────────────────── */}
      {LEARN_PATH.map((lv, li) => {
        const col = LEVEL_COLORS[li % LEVEL_COLORS.length];
        const levelDone = lv.items.filter(it => it.ck(st)).length;
        const levelPct = Math.round(levelDone / lv.items.length * 100);
        const prevLevelDone = li === 0 ? true : LEARN_PATH[li-1].items.filter(it => it.ck(st)).length >= Math.ceil(LEARN_PATH[li-1].items.length * 0.6);
        const isUnlocked = li === 0 || prevLevelDone;

        return (
          <div key={li} style={{ marginBottom: 8 }}>
            {/* ── Stage Banner ─────────────────────────────────────────── */}
            <div style={{
              marginBottom: 20,
              borderRadius: 20, overflow: 'hidden',
              boxShadow: isUnlocked ? `0 4px 20px ${col.glow}, 0 1px 4px rgba(0,0,0,.08)` : '0 2px 8px rgba(0,0,0,.06)',
              opacity: isUnlocked ? 1 : 0.55,
              transition: 'opacity .3s',
            }}>
              <div style={{
                background: isUnlocked ? col.bg : 'linear-gradient(135deg,#94a3b8,#64748b)',
                padding: '16px 20px',
                display: 'flex', alignItems: 'center', gap: 14,
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: '50%',
                  background: 'rgba(255,255,255,.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 26, flexShrink: 0,
                  border: '2px solid rgba(255,255,255,.3)',
                }}>
                  {isUnlocked ? LEVEL_EMOJIS[li] : '🔒'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,.7)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em' }}>
                    Stage {lv.level}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>
                    {STAGE_NAMES[li] || lv.title}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,.75)', marginTop: 2 }}>
                    {lv.desc}
                  </div>
                </div>
                <div style={{
                  fontSize: 22, fontWeight: 900, color: '#fff',
                  background: 'rgba(255,255,255,.2)', borderRadius: 12,
                  padding: '6px 12px', flexShrink: 0,
                }}>
                  {levelPct === 100 ? '✅' : `${levelDone}/${lv.items.length}`}
                </div>
              </div>
              {/* Level progress bar */}
              <div style={{ background: col.light, padding: '8px 20px 12px', borderTop: `2px solid ${col.border}` }}>
                <div style={{ height: 6, background: 'rgba(0,0,0,.08)', borderRadius: 6, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: levelPct + '%',
                    background: isUnlocked ? col.bg : '#94a3b8',
                    borderRadius: 6, transition: 'width .8s cubic-bezier(.4,0,.2,1)',
                  }} />
                </div>
              </div>
            </div>

            {/* ── Milestone nodes on the winding path ──────────────────── */}
            {isUnlocked && (
              <div style={{ paddingLeft: 8, paddingRight: 8, marginBottom: 16 }}>
                {/* Path line visual (vertical dashed or solid) */}
                <div style={{ position: 'relative' }}>
                  {lv.items.map((it, ii) => {
                    const isDone = it.ck(st);
                    const isActive = li === activeLevel && ii === activeItem;
                    const isRight = ii % 2 === 0; // alternating alignment

                    return (
                      <div
                        key={ii}
                        ref={isActive ? activeRef : null}
                        style={{
                          display: 'flex',
                          justifyContent: isRight ? 'flex-start' : 'flex-end',
                          marginBottom: 12,
                          paddingLeft: isRight ? 0 : 60,
                          paddingRight: isRight ? 60 : 0,
                          position: 'relative',
                        }}
                      >
                        {/* Connector line */}
                        {ii < lv.items.length - 1 && (
                          <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: isRight ? 28 : undefined,
                            right: !isRight ? 28 : undefined,
                            width: 2,
                            height: 12,
                            background: isDone ? col.bg : 'var(--card-b)',
                            borderLeft: isDone ? 'none' : '2px dashed var(--card-b)',
                            zIndex: 0,
                          }} />
                        )}

                        {/* Node + label */}
                        <button
                          onClick={() => { if (!isDone && isActive) setScr(it.go); else if (isDone) setScr(it.go); }}
                          disabled={!isDone && !isActive}
                          onMouseEnter={() => setHovered(`${li}-${ii}`)}
                          onMouseLeave={() => setHovered(null)}
                          style={{
                            display: 'flex', alignItems: 'center',
                            gap: 12,
                            flexDirection: isRight ? 'row' : 'row-reverse',
                            background: 'none', border: 'none', cursor: (isDone || isActive) ? 'pointer' : 'default',
                            padding: 0, textAlign: isRight ? 'left' : 'right',
                            maxWidth: '85%',
                          }}
                        >
                          {/* The node circle */}
                          <div style={{
                            width: isActive ? 60 : 52,
                            height: isActive ? 60 : 52,
                            borderRadius: '50%',
                            background: isDone
                              ? col.bg
                              : isActive
                                ? col.bg
                                : 'var(--card)',
                            border: isDone ? 'none' : isActive ? 'none' : '2px solid var(--card-b)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: isActive ? 24 : 20,
                            color: (isDone || isActive) ? '#fff' : 'var(--subtext)',
                            boxShadow: isDone
                              ? `0 4px 16px ${col.glow}`
                              : isActive
                                ? `0 0 0 6px ${col.glow.replace('.4)',',.15)')}, 0 4px 16px ${col.glow}`
                                : '0 2px 6px rgba(0,0,0,.06)',
                            animation: isActive ? 'nodeGlow 2s ease-in-out infinite, nodePulse 2s ease-in-out infinite' : 'none',
                            transition: 'transform .2s cubic-bezier(.34,1.56,.64,1), box-shadow .2s',
                            transform: (hovered === `${li}-${ii}` && (isDone || isActive)) ? 'scale(1.1)' : 'scale(1)',
                            flexShrink: 0,
                            position: 'relative',
                            zIndex: 2,
                          }}>
                            {isDone ? '✓' : isActive ? '▶' : '🔒'}

                            {/* Active pulse ring */}
                            {isActive && (
                              <div style={{
                                position: 'absolute', inset: -8,
                                borderRadius: '50%',
                                border: `2px solid ${col.glow}`,
                                animation: 'nodeGlow 2s ease-in-out infinite',
                              }} />
                            )}
                          </div>

                          {/* Label */}
                          <div style={{ minWidth: 0 }}>
                            {isActive && (
                              <div style={{
                                fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
                                letterSpacing: '.08em', color: '#0e7490',
                                marginBottom: 2,
                              }}>
                                ← Up Next!
                              </div>
                            )}
                            <div style={{
                              fontSize: 14, fontWeight: isDone ? 600 : isActive ? 800 : 500,
                              color: isDone ? 'var(--subtext)' : isActive ? 'var(--heading)' : 'var(--subtext)',
                              textDecoration: isDone ? 'line-through' : 'none',
                              opacity: isDone ? 0.7 : 1,
                              lineHeight: 1.3,
                            }}>
                              {it.name}
                            </div>
                            {isActive && (
                              <div style={{
                                fontSize: 11, color: '#0e7490', fontWeight: 700, marginTop: 3,
                                display: 'flex', alignItems: 'center', gap: 4,
                              }}>
                                Tap to start →
                              </div>
                            )}
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!isUnlocked && (
              <div className="c" style={{
                textAlign: 'center', padding: '20px', marginBottom: 16,
                opacity: 0.7, border: '2px dashed var(--card-b)',
                background: 'var(--bar-bg)',
              }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>🔒</div>
                <div style={{ fontSize: 13, color: 'var(--subtext)', fontWeight: 600 }}>
                  Complete 60% of {LEARN_PATH[li-1]?.title} to unlock
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* ── Completion banner ────────────────────────────────────────────── */}
      {pct === 100 && (
        <div className="c" style={{
          textAlign: 'center', padding: '32px',
          background: 'linear-gradient(135deg,#fef3c7,#fde68a)',
          border: '2px solid #f59e0b',
          animation: 'glow 3s ease-in-out infinite',
        }}>
          <div style={{ fontSize: 56, marginBottom: 8 }}>🏆</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#92400e', marginBottom: 4 }}>Čestitamo!</div>
          <div style={{ fontSize: 14, color: '#78716c', fontWeight: 500 }}>
            You have completed the entire learning path. You are truly Hrvat!
          </div>
        </div>
      )}
    </div>
  );
}
