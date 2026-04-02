import React from 'react';
import { DAILY_QUESTS } from '../../data.jsx';

export default function QuestTracker({ questsDone, allQuestsDone, onQuestStart }) {
  const QUEST_COLORS = {
    speak:        { bg:'var(--lavender,#7c3aed)',  shadow:'rgba(124,58,237,.35)',  border:'rgba(124,58,237,.25)' },
    speak2:       { bg:'var(--lavender,#7c3aed)',  shadow:'rgba(124,58,237,.35)',  border:'rgba(124,58,237,.25)' },
    grammar:      { bg:'var(--harvest,#d97706)',   shadow:'rgba(217,119,6,.35)',   border:'rgba(217,119,6,.25)'  },
    grammar2:     { bg:'var(--harvest,#d97706)',   shadow:'rgba(217,119,6,.35)',   border:'rgba(217,119,6,.25)'  },
    master:       { bg:'var(--accent,#0e7490)',    shadow:'rgba(14,116,144,.35)',  border:'rgba(14,116,144,.25)' },
    master2:      { bg:'var(--accent,#0e7490)',    shadow:'rgba(14,116,144,.35)',  border:'rgba(14,116,144,.25)' },
    reading:      { bg:'var(--forest,#16a34a)',    shadow:'rgba(22,163,74,.35)',   border:'rgba(22,163,74,.25)'  },
    reading2:     { bg:'var(--forest,#16a34a)',    shadow:'rgba(22,163,74,.35)',   border:'rgba(22,163,74,.25)'  },
    streak:       { bg:'var(--terracotta,#c2410c)',shadow:'rgba(194,65,12,.35)',   border:'rgba(194,65,12,.25)'  },
    streak_alive: { bg:'var(--terracotta,#c2410c)',shadow:'rgba(194,65,12,.35)',   border:'rgba(194,65,12,.25)'  },
    perfect:      { bg:'var(--medal-gold,#f59e0b)',shadow:'rgba(245,158,11,.35)',  border:'rgba(245,158,11,.25)' },
  };
  const questScreenMap = {
    speak:'speaking',     speak2:'speaking',
    grammar:'grammar',    grammar2:'grammar',
    master:'review',      master2:'review',
    reading:'readlist',   reading2:'readlist',
    streak:'learnpath',   streak_alive:'learnpath',
    perfect:'flashcards',
  };

  const questsDoneCount = DAILY_QUESTS.filter(q => questsDone[q.id]).length;
  const total = DAILY_QUESTS.length;
  const pct = Math.round((questsDoneCount / total) * 100);

  return (
    <div style={{ marginBottom: 20 }}>

      {/* ── Gradient header ── */}
      <div style={{
        borderRadius: 18, overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(124,58,237,.2), var(--card-shadow)',
        border: '1.5px solid rgba(124,58,237,.22)',
        marginBottom: 12,
      }}>
        <div style={{ background: 'linear-gradient(135deg, #3b0764 0%, #6d28d9 55%, var(--lavender,#7c3aed) 100%)', padding: '14px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 13, flexShrink: 0,
              background: 'rgba(255,255,255,.15)', border: '1.5px solid rgba(255,255,255,.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
            }}>
              {allQuestsDone ? '🏆' : '🎯'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,.7)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 2, fontFamily: 'var(--font-sans)' }}>
                EARN BONUS XP
              </div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', fontFamily: 'var(--font-sans)' }}>Daily Quests</div>
            </div>
            <div style={{
              flexShrink: 0, background: 'rgba(255,255,255,.15)',
              border: '1.5px solid rgba(255,255,255,.25)',
              borderRadius: 10, padding: '4px 10px',
              fontSize: 12, fontWeight: 800, color: '#fff',
            }}>
              {questsDoneCount}/{total}
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ marginTop: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.65)', fontFamily: 'var(--font-sans)' }}>
                {allQuestsDone ? 'All quests complete!' : `${total - questsDoneCount} quest${total - questsDoneCount !== 1 ? 's' : ''} remaining`}
              </span>
              <span style={{ fontSize: 10, fontWeight: 800, color: allQuestsDone ? '#e9d5ff' : 'rgba(255,255,255,.85)', fontFamily: 'var(--font-sans)' }}>
                {pct}%
              </span>
            </div>
            <div className="prog-track" style={{ background: 'rgba(255,255,255,.18)' }}>
              <div className="prog-fill" style={{
                width: pct + '%',
                background: allQuestsDone
                  ? 'linear-gradient(90deg,#c4b5fd,#e9d5ff)'
                  : 'linear-gradient(90deg,rgba(255,255,255,.7),rgba(255,255,255,.9))',
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Quest cards grid ── */}
      <div className="anim-children-fade" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
        {DAILY_QUESTS.map(q => {
          const done = questsDone[q.id];
          const qc = QUEST_COLORS[q.id] || QUEST_COLORS.master;
          return (
            <div key={q.id} style={{
              background: done
                ? 'linear-gradient(135deg, var(--success-bg) 0%, #dcfce7 100%)'
                : 'var(--card)',
              border: `1.5px solid ${done ? 'var(--success-b)' : qc.border}`,
              borderRadius: 'var(--radius-lg)', padding: '14px 12px', textAlign: 'center',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              boxShadow: done ? 'none' : `0 2px 12px ${qc.shadow.replace('.35', '.10')}, var(--card-shadow)`,
              transition: 'transform .15s ease, box-shadow .15s ease',
            }}
            onMouseEnter={e => { if (!done) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 6px 20px ${qc.shadow.replace('.35','.2')}, var(--card-shadow-hover)`; }}}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = done ? 'none' : `0 2px 12px ${qc.shadow.replace('.35','.10')}, var(--card-shadow)`; }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 'var(--radius-md)', marginBottom: 8,
                background: done ? 'var(--success)' : qc.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24,
                boxShadow: done ? '0 2px 8px rgba(22,163,74,.3)' : `0 4px 16px ${qc.shadow}`,
                transition: 'transform .15s ease',
              }}>
                {done ? '✓' : q.icon}
              </div>
              <div style={{ fontSize: 12, fontWeight: 900, color: done ? 'var(--success)' : 'var(--heading)', lineHeight: 1.2, marginBottom: 3, fontFamily: 'var(--font-sans)' }}>{q.name}</div>
              <div style={{ fontSize: 10, color: 'var(--subtext)', fontWeight: 500, marginBottom: 8, lineHeight: 1.3, fontFamily: 'var(--font-sans)' }}>{q.desc}</div>
              {done
                ? <div style={{ fontSize: 11, color: 'var(--success)', fontWeight: 800, fontFamily: 'var(--font-sans)' }}>+{q.xp} XP earned ✓</div>
                : <>
                    <button
                      onClick={() => onQuestStart(q.id, questScreenMap[q.id])}
                      style={{
                        marginTop: 'auto', fontSize: 11, fontWeight: 800,
                        color: '#fff', background: qc.bg, border: 'none',
                        borderRadius: 'var(--radius-sm)', padding: '7px 16px', cursor: 'pointer',
                        lineHeight: 1.4, boxShadow: `0 3px 12px ${qc.shadow}`,
                        fontFamily: 'var(--font-sans)',
                        transition: 'transform .12s ease, box-shadow .12s ease',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = `0 5px 16px ${qc.shadow}`; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `0 3px 12px ${qc.shadow}`; }}
                      onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.96)'; }}
                      onPointerUp={e => { e.currentTarget.style.transform = ''; }}
                    >Start →</button>
                    <div style={{ fontSize: 10, color: 'var(--subtext)', marginTop: 5, fontFamily: 'var(--font-sans)', fontWeight: 600 }}>{q.xp} XP</div>
                  </>
              }
            </div>
          );
        })}
      </div>

      {/* ── Daily Mastery banner ── */}
      {allQuestsDone && (
        <div style={{
          marginTop: 12, borderRadius: 'var(--radius-xl)', overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(124,58,237,.28), 0 2px 8px rgba(0,0,0,.08)',
          border: '1.5px solid rgba(196,181,253,.4)',
          animation: 'rise .4s ease',
        }}>
          <div style={{ background: 'linear-gradient(135deg, #3b0764 0%, #6d28d9 55%, var(--lavender,#7c3aed) 100%)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 'var(--radius-md)', flexShrink: 0,
              background: 'rgba(255,255,255,.18)', border: '1.5px solid rgba(255,255,255,.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
              boxShadow: '0 4px 12px rgba(0,0,0,.18)',
            }}>🏆</div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 900, color: '#fff', marginBottom: 3, fontFamily: 'var(--font-sans)' }}>Daily Mastery!</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.82)', fontWeight: 600, fontFamily: 'var(--font-sans)' }}>+50 XP bonus · All {total} quests complete</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
