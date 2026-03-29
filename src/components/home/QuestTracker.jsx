import React from 'react';
import { DAILY_QUESTS } from '../../data.jsx';

export default function QuestTracker({ questsDone, allQuestsDone, setScr }) {
  const QUEST_COLORS = {
    speak:       { bg:'#7c3aed', shadow:'rgba(124,58,237,.35)', border:'rgba(124,58,237,.3)' },
    speak2:      { bg:'#7c3aed', shadow:'rgba(124,58,237,.35)', border:'rgba(124,58,237,.3)' },
    grammar:     { bg:'#d97706', shadow:'rgba(217,119,6,.35)',  border:'rgba(217,119,6,.3)'  },
    grammar2:    { bg:'#d97706', shadow:'rgba(217,119,6,.35)',  border:'rgba(217,119,6,.3)'  },
    master:      { bg:'#0e7490', shadow:'rgba(14,116,144,.35)', border:'rgba(14,116,144,.3)' },
    master2:     { bg:'#0e7490', shadow:'rgba(14,116,144,.35)', border:'rgba(14,116,144,.3)' },
    reading:     { bg:'#16a34a', shadow:'rgba(22,163,74,.35)',  border:'rgba(22,163,74,.3)'  },
    reading2:    { bg:'#16a34a', shadow:'rgba(22,163,74,.35)',  border:'rgba(22,163,74,.3)'  },
    streak:      { bg:'#ea580c', shadow:'rgba(234,88,12,.35)',  border:'rgba(234,88,12,.3)'  },
    streak_alive:{ bg:'#ea580c', shadow:'rgba(234,88,12,.35)',  border:'rgba(234,88,12,.3)'  },
    perfect:     { bg:'#ca8a04', shadow:'rgba(202,138,4,.35)',  border:'rgba(202,138,4,.3)'  },
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

  return (
    <>
      <div className="section-hdr">
        <div className="section-hdr-icon" style={{background:'rgba(99,102,241,.12)'}}>🎯</div>
        <div className="section-hdr-text">
          <div className="section-hdr-title">Daily Quests</div>
          <div className="section-hdr-sub">Complete quests to earn bonus XP</div>
        </div>
        <div className="section-hdr-badge">{questsDoneCount}/{DAILY_QUESTS.length}</div>
      </div>
      <div className="anim-children-fade" style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10, marginBottom:20 }}>
        {DAILY_QUESTS.map(q => {
          const done = questsDone[q.id];
          const qc = QUEST_COLORS[q.id] || QUEST_COLORS.master;
          return (
            <div key={q.id} style={{
              background: done ? 'var(--success-bg)' : 'var(--card)',
              border: `1.5px solid ${done ? 'var(--success-b)' : qc.border}`,
              borderRadius:16, padding:'14px 12px', textAlign:'center',
              display:'flex', flexDirection:'column', alignItems:'center',
              boxShadow: done ? 'none' : `0 2px 12px ${qc.shadow.replace('.35','.12')}`,
            }}>
              <div style={{
                width:48, height:48, borderRadius:14, marginBottom:8,
                background: done ? 'var(--success)' : qc.bg,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:24,
                boxShadow: done ? 'none' : `0 4px 14px ${qc.shadow}`,
              }}>
                {done ? '✓' : q.icon}
              </div>
              <div style={{fontSize:12, fontWeight:900, color: done ? 'var(--success)' : 'var(--heading)', lineHeight:1.2, marginBottom:3}}>{q.name}</div>
              <div style={{fontSize:10, color:'var(--subtext)', fontWeight:500, marginBottom:8, lineHeight:1.3}}>{q.desc}</div>
              {done
                ? <div style={{fontSize:11, color:'var(--success)', fontWeight:800, lineHeight:1}}>+{q.xp} XP earned</div>
                : <>
                    <button
                      onClick={() => setScr(questScreenMap[q.id])}
                      style={{
                        marginTop:'auto', fontSize:11, fontWeight:800,
                        color:'#fff',
                        background: qc.bg,
                        border:'none',
                        borderRadius:10, padding:'6px 14px', cursor:'pointer',
                        lineHeight:1.4,
                        boxShadow: `0 3px 10px ${qc.shadow}`,
                      }}
                    >
                      Start →
                    </button>
                    <div style={{fontSize:10, color:'var(--subtext)', marginTop:5}}>{q.xp} XP</div>
                  </>
              }
            </div>
          );
        })}
      </div>
      {allQuestsDone && (
        <div style={{background:'var(--success-bg)',border:'1.5px solid var(--success-b)',borderRadius:14,padding:'14px 16px',marginBottom:16,textAlign:'center',animation:'rise .4s'}}>
          <div style={{fontSize:20,marginBottom:4}}>🏆</div>
          <div style={{fontSize:14,fontWeight:900,color:'var(--success)'}}>Daily Mastery!</div>
          <div style={{fontSize:12,color:'var(--success)',fontWeight:600}}>+50 XP bonus · All 5 quests complete</div>
        </div>
      )}
    </>
  );
}
