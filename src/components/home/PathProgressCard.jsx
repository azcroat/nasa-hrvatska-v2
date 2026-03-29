import React from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { useStats } from '../../context/StatsContext.jsx';

const SkeletonBar = ({ w = '100%', h = 16, r = 8, mt = 0 }) => (
  <div style={{width:w, height:h, borderRadius:r, marginTop:mt,
    background:'linear-gradient(90deg, var(--bar-bg) 25%, var(--card-b) 50%, var(--bar-bg) 75%)',
    backgroundSize:'200% 100%', animation:'shimmer 1.4s ease infinite'}} />
);

export default function PathProgressCard({
  activePalette, pathData, syncReady,
  launchPathItem, setTab, resumeLesson,
  lastActivity, sCurEx,
}) {
  const { setScr } = useApp();
  const { stats: st } = useStats();

  return (
    <div style={{
      background: activePalette.grad,
      borderRadius: '0 0 22px 22px',
      padding: '20px 20px 22px',
      marginBottom: 20,
      boxShadow: '0 8px 32px rgba(0,0,0,.2)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{position:'absolute',top:-30,right:-30,width:140,height:140,background:'rgba(255,255,255,.07)',borderRadius:'50%',pointerEvents:'none'}}/>
      <div style={{position:'absolute',bottom:-20,left:-20,width:100,height:100,background:'rgba(0,0,0,.1)',borderRadius:'50%',pointerEvents:'none'}}/>

      {!syncReady ? (
        <div style={{padding:'16px 0'}}>
          <SkeletonBar h={20} w="60%" r={10} />
          <SkeletonBar h={14} w="80%" r={8} mt={10} />
          <SkeletonBar h={48} r={14} mt={14} />
        </div>
      ) : (
        <>
          <div style={{fontSize:10,fontWeight:800,color:'rgba(255,255,255,.7)',letterSpacing:'.12em',textTransform:'uppercase',marginBottom:8}}>
            Your Next Lesson
          </div>
          <div style={{
            fontSize:20,fontWeight:900,
            fontFamily:"'Playfair Display',serif",
            color:'white',lineHeight:1.2,marginBottom:4,
            textShadow:'0 2px 8px rgba(0,0,0,.2)',
          }}>
            {pathData.nextItem?.name || 'Learning Path Complete'}
          </div>
          <div style={{fontSize:12,color:'rgba(255,255,255,.7)',fontWeight:600,marginBottom:14}}>
            Level {pathData.activeLv.level} · {pathData.activeLv.title}
          </div>

          {/* Progress bar */}
          <div style={{background:'rgba(255,255,255,.25)',borderRadius:6,height:6,overflow:'hidden',marginBottom:6}}>
            <div style={{
              height:'100%',background:'white',borderRadius:6,
              width: (pathData.activeLvDone / pathData.activeLv.items.length * 100) + '%',
              transition:'width .7s cubic-bezier(.4,0,.2,1)',
            }}/>
          </div>
          <div style={{fontSize:11,color:'rgba(255,255,255,.7)',fontWeight:500,marginBottom:10}}>
            This stage: {pathData.activeLvDone} of {pathData.activeLv.items.length} lessons
          </div>

          {/* Stage progress dots — Zeigarnik effect: users want to complete the row */}
          {pathData.activeLv.items.length > 0 && (
            <div style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:16}}>
              {pathData.activeLv.items.slice(0, 12).map((item, i) => {
                const done = i < pathData.activeLvDone;
                return (
                  <div key={i} style={{
                    width:22,height:22,borderRadius:'50%',flexShrink:0,
                    background: done ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.18)',
                    border: done ? '2px solid rgba(255,255,255,1)' : '1.5px solid rgba(255,255,255,0.35)',
                    display:'flex',alignItems:'center',justifyContent:'center',
                    fontSize:10,fontWeight:900,
                    color: done ? activePalette.text : 'rgba(255,255,255,0.5)',
                    transition:'background .3s',
                  }}>
                    {done ? '✓' : ''}
                  </div>
                );
              })}
              {pathData.activeLv.items.length > 12 && (
                <div style={{
                  height:22,borderRadius:11,padding:'0 8px',flexShrink:0,
                  background:'rgba(255,255,255,0.12)',
                  display:'flex',alignItems:'center',
                  fontSize:10,fontWeight:700,color:'rgba(255,255,255,.65)',
                }}>
                  +{pathData.activeLv.items.length - 12}
                </div>
              )}
            </div>
          )}

          {/* Start Now button */}
          <button
            onClick={() => { if (pathData.nextItem) { launchPathItem(pathData.nextItem); } else setScr('learnpath'); }}
            style={{
              width:'100%',height:52,
              background:'white',
              color: activePalette.text,
              fontSize:16,fontWeight:800,
              border:'none',borderRadius:14,cursor:'pointer',
              fontFamily:"'Outfit',sans-serif",
              letterSpacing:'.01em',
              boxShadow:'0 4px 20px rgba(0,0,0,.25)',
              display:'flex',alignItems:'center',justifyContent:'center',gap:8,
              transition:'transform .15s, box-shadow .15s',
            }}>
            <span style={{fontSize:18}}>▶</span>
            <span>{st.lc > 0 ? 'Continue Learning' : 'Start Learning'}</span>
          </button>

          {/* Practice Now — always visible for returning users */}
          {st.lc > 0 && (
            <button
              onClick={() => setTab && setTab('practice')}
              style={{
                width:'100%', marginTop:10, height:44,
                background:'rgba(255,255,255,.12)', border:'1.5px solid rgba(255,255,255,.3)',
                borderRadius:12, cursor:'pointer',
                fontFamily:"'Outfit',sans-serif",
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                color:'rgba(255,255,255,.9)', fontSize:13, fontWeight:700,
              }}>
              <span style={{fontSize:14}}>🎮</span>
              <span>Start Practicing →</span>
            </button>
          )}

          {/* Resume interrupted lesson */}
          {(() => {
            try {
              const r = JSON.parse(localStorage.getItem('nh_lesson_resume') || 'null');
              // Only show if the lesson was interrupted recently (within 24h)
              if (r && r.topic && r.ts && (Date.now() - r.ts) < 86400000 && resumeLesson) {
                return (
                  <button
                    onClick={resumeLesson}
                    style={{
                      width:'100%', marginTop:8, height:44,
                      background:'rgba(212,0,45,.15)', border:'1px solid rgba(212,0,45,.35)',
                      borderRadius:12, cursor:'pointer',
                      fontFamily:"'Outfit',sans-serif",
                      display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                      color:'#fff', fontSize:13, fontWeight:800,
                    }}>
                    <span style={{fontSize:14}}>▶️</span>
                    <span>Resume: {r.topic} lesson →</span>
                  </button>
                );
              }
            } catch (_) {}
            return null;
          })()}

          {/* Resume last activity */}
          {lastActivity && st.lc > 0 && (
            <button
              onClick={() => { setScr(lastActivity.ex); sCurEx(lastActivity.ex); }}
              style={{
                width:'100%', marginTop:8, height:44,
                background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.2)',
                borderRadius:12, cursor:'pointer',
                fontFamily:"'Outfit',sans-serif",
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                color:'rgba(255,255,255,.9)', fontSize:13, fontWeight:700,
              }}>
              <span style={{fontSize:14}}>↩️</span>
              <span>Resume: {lastActivity.label} →</span>
            </button>
          )}
        </>
      )}
    </div>
  );
}
