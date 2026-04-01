import React from 'react';
import { DAILY_QUESTS } from '../../data.jsx';

export default function QuestTracker({ questsDone, allQuestsDone, onQuestStart }) {
  const QUEST_COLORS = {
    speak:        { bg:'#7c3aed', shadow:'rgba(124,58,237,.35)', border:'rgba(124,58,237,.3)' },
    speak2:       { bg:'#7c3aed', shadow:'rgba(124,58,237,.35)', border:'rgba(124,58,237,.3)' },
    grammar:      { bg:'#d97706', shadow:'rgba(217,119,6,.35)',  border:'rgba(217,119,6,.3)'  },
    grammar2:     { bg:'#d97706', shadow:'rgba(217,119,6,.35)',  border:'rgba(217,119,6,.3)'  },
    master:       { bg:'#0e7490', shadow:'rgba(14,116,144,.35)', border:'rgba(14,116,144,.3)' },
    master2:      { bg:'#0e7490', shadow:'rgba(14,116,144,.35)', border:'rgba(14,116,144,.3)' },
    reading:      { bg:'#16a34a', shadow:'rgba(22,163,74,.35)',  border:'rgba(22,163,74,.3)'  },
    reading2:     { bg:'#16a34a', shadow:'rgba(22,163,74,.35)',  border:'rgba(22,163,74,.3)'  },
    streak:       { bg:'#ea580c', shadow:'rgba(234,88,12,.35)',  border:'rgba(234,88,12,.3)'  },
    streak_alive: { bg:'#ea580c', shadow:'rgba(234,88,12,.35)',  border:'rgba(234,88,12,.3)'  },
    perfect:      { bg:'#ca8a04', shadow:'rgba(202,138,4,.35)',  border:'rgba(202,138,4,.3)'  },
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
        boxShadow: '0 4px 20px rgba(99,102,241,.18)',
        border: '1.5px solid rgba(99,102,241,.2)',
        marginBottom: 12,
      }}>
        <div style={{ background: 'linear-gradient(135deg, #4c1d95 0%, #6d28d9 60%, #7c3aed 100%)', padding: '14px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 13, flexShrink: 0,
              background: 'rgba(255,255,255,.15)', border: '1.5px solid rgba(255,255,255,.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
            }}>
              {allQuestsDone ? '🏆' : '🎯'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,.7)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 2 }}>
                EARN BONUS XP
              </div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>Daily Quests</div>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.6)' }}>
                {allQuestsDone ? 'All quests complete!' : `${total - questsDoneCount} quest${total - questsDoneCount !== 1 ? 's' : ''} remaining`}
              </span>
              <span style={{ fontSize: 10, fontWeight: 800, color: allQuestsDone ? '#c4b5fd' : 'rgba(255,255,255,.8)' }}>
                {pct}%
              </span>
            </div>
            <div style={{ height: 5, background: 'rgba(255,255,255,.2)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: pct + '%',
                background: allQuestsDone ? '#c4b5fd' : 'rgba(255,255,255,.75)',
                borderRadius: 3, transition: 'width .4s ease',
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
              background: done ? 'var(--success-bg)' : 'var(--card)',
              border: `1.5px solid ${done ? 'var(--success-b)' : qc.border}`,
              borderRadius: 16, padding: '14px 12px', textAlign: 'center',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              boxShadow: done ? 'none' : `0 2px 12px ${qc.shadow.replace('.35', '.12')}`,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14, marginBottom: 8,
                background: done ? 'var(--success)' : qc.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24,
                boxShadow: done ? 'none' : `0 4px 14px ${qc.shadow}`,
              }}>
                {done ? '✓' : q.icon}
              </div>
              <div style={{ fontSize: 12, fontWeight: 900, color: done ? 'var(--success)' : 'var(--heading)', lineHeight: 1.2, marginBottom: 3 }}>{q.name}</div>
              <div style={{ fontSize: 10, color: 'var(--subtext)', fontWeight: 500, marginBottom: 8, lineHeight: 1.3 }}>{q.desc}</div>
              {done
                ? <div style={{ fontSize: 11, color: 'var(--success)', fontWeight: 800 }}>+{q.xp} XP earned</div>
                : <>
                    <button
                      onClick={() => onQuestStart(q.id, questScreenMap[q.id])}
                      style={{
                        marginTop: 'auto', fontSize: 11, fontWeight: 800,
                        color: '#fff', background: qc.bg, border: 'none',
                        borderRadius: 10, padding: '6px 14px', cursor: 'pointer',
                        lineHeight: 1.4, boxShadow: `0 3px 10px ${qc.shadow}`,
                        fontFamily: "'Outfit',sans-serif",
                      }}
                    >Start →</button>
                    <div style={{ fontSize: 10, color: 'var(--subtext)', marginTop: 5 }}>{q.xp} XP</div>
                  </>
              }
            </div>
          );
        })}
      </div>

      {/* ── Daily Mastery banner ── */}
      {allQuestsDone && (
        <div style={{
          marginTop: 12, borderRadius: 18, overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(99,102,241,.25)',
          border: '1.5px solid rgba(99,102,241,.3)',
          animation: 'rise .4s ease',
        }}>
          <div style={{ background: 'linear-gradient(135deg, #4c1d95 0%, #6d28d9 60%, #7c3aed 100%)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, flexShrink: 0,
              background: 'rgba(255,255,255,.15)', border: '1.5px solid rgba(255,255,255,.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
            }}>🏆</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', marginBottom: 2 }}>Daily Mastery!</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.8)', fontWeight: 600 }}>+50 XP bonus · All {total} quests complete</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
