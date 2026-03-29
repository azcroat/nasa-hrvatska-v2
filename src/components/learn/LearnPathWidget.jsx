import React from 'react';
import CroatianKnight from '../shared/CroatianKnight';

// ─── LearnPathWidget ──────────────────────────────────────────────────────────
// Renders the "Next Up" path card block: stage header, progress bar,
// next lesson row, journey strip, and CEFR track.

export default function LearnPathWidget({
  sc,
  currentStage,
  currentStageDone,
  overallPct,
  stagePct,
  totalDone,
  totalItems,
  nextItem,
  cefrLevel,
  cefrPct,
  setScr,
  setTab,
  st,
  handleLaunchPathItem,
}) {
  return (
    <div style={{
      borderRadius:20, overflow:'hidden', marginBottom:24,
      boxShadow:'0 4px 20px rgba(0,0,0,.10)', border:'1px solid var(--card-b)',
    }}>
      {/* Stage header */}
      <div style={{ background: sc.bg, padding:'18px 20px', color:'var(--card)' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', opacity:.75 }}>
              Stage {currentStage?.level}
            </div>
            <div style={{ fontSize:18, fontWeight:800, marginTop:3, color:'var(--card)' }}>{currentStage?.title}</div>
            <div style={{ fontSize:13, fontWeight:400, marginTop:3, lineHeight:1.5, opacity:.85 }}>{currentStage?.desc}</div>
          </div>
          <div style={{ textAlign:'right', flexShrink:0 }}>
            <div style={{ fontSize:'var(--text-2xl)', fontWeight:900, lineHeight:1 }}>{overallPct}%</div>
            <div style={{ fontSize:'var(--text-xs)', opacity:.7, marginTop:2 }}>overall</div>
          </div>
        </div>
        <div style={{ background:'rgba(255,255,255,.25)', borderRadius:6, height:6, overflow:'hidden' }}>
          <div style={{ height:'100%', width:stagePct+'%', background:'var(--card)', borderRadius:6, transition:'width .5s ease' }} />
        </div>
        <div style={{ fontSize:'var(--text-xs)', opacity:.7, marginTop:5 }}>
          {currentStageDone} / {currentStage?.items.length} lessons this stage
        </div>
      </div>

      {/* Next Up */}
      <div style={{ background:'var(--card)', padding:'16px 20px' }}>
        {nextItem ? (
          <div style={{ display:'flex', alignItems:'center', gap:14, position:'relative' }}>
            <div style={{
              width:44, height:44, borderRadius:13, flexShrink:0,
              background:'var(--info-bg)', border:'1px solid var(--info-b)',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:'var(--text-2xl)',
            }}>🎯</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <CroatianKnight size={36} mood="ready" style={{ flexShrink: 0 }} />
                <div style={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--subtext)' }}>
                  Next Up
                </div>
              </div>
              <div style={{ fontSize:'var(--text-base)', fontWeight:800, color:'var(--heading)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {nextItem.name}
              </div>
              {/* Difficulty + duration row */}
              <div style={{display:'flex',alignItems:'center',gap:10,marginTop:5}}>
                <span style={{fontSize:12,letterSpacing:1}} title={`Difficulty: ${nextItem.diff||1}/3`}>
                  {'⭐'.repeat(nextItem.diff||1)}{'☆'.repeat(3-(nextItem.diff||1))}
                </span>
                {nextItem.dur && (
                  <span style={{fontSize:'var(--text-sm)',color:'var(--subtext)',fontWeight:700}}>
                    {nextItem.dur}
                  </span>
                )}
              </div>
              <div style={{fontSize:12, color:'var(--subtext)', marginTop:4, marginBottom:12, lineHeight:1.5}}>
                {(/** @type {any} */ (nextItem)).description || `Learn essential ${(/** @type {any} */ (nextItem)).label || 'vocabulary'} · includes audio`}
              </div>
            </div>
            {(!st || st.lc === 0) && (
              <>
                <CroatianKnight
                  size={70}
                  mood="happy"
                  style={{ margin: '0 auto 8px', display: 'block' }}
                />
                <div style={{
                  position:'absolute', top:-8, right:60,
                  background:'var(--error)', color:'var(--card)',
                  fontSize:'var(--text-xs)', fontWeight:900, padding:'3px 8px',
                  borderRadius:10, letterSpacing:'.05em',
                  animation:'pulse 2s infinite',
                }}>
                  START HERE
                </div>
              </>
            )}
            <button
              onClick={() => handleLaunchPathItem(nextItem)}
              style={{
                padding:'13px 18px', borderRadius:12, border:'none', flexShrink:0,
                background:sc.bg, color:'var(--card)', fontSize:'var(--text-base)', fontWeight:800,
                cursor:'pointer', fontFamily:"'Outfit',sans-serif",
                boxShadow:'0 3px 10px rgba(0,0,0,.15)',
              }}
            >Start →</button>
          </div>
        ) : (
          <div style={{ textAlign:'center', padding:'8px 0' }}>
            <CroatianKnight
              size={80}
              mood="victory"
              style={{ margin: '0 auto 8px', display: 'block' }}
            />
            <div style={{ fontSize:'var(--text-4xl)', marginBottom:6 }}>🏆</div>
            <div style={{ fontSize:'var(--text-md)', fontWeight:900, color:'var(--heading)' }}>Path Complete!</div>
            <div style={{ fontSize:'var(--text-sm)', color:'var(--subtext)', marginTop:2 }}>Ti si pravi Hrvat! Bravo!</div>
          </div>
        )}
        <button
          onClick={() => setScr("learnpath")}
          style={{
            width:'100%', marginTop:12, padding:'13px', borderRadius:10,
            border:'1.5px solid var(--inp-b)', background:'none', cursor:'pointer',
            fontSize:'var(--text-sm)', fontWeight:700, color:'var(--subtext)', fontFamily:"'Outfit',sans-serif",
          }}
        >
          View full path — {totalDone}/{totalItems} lessons
        </button>
        {st && st.lc > 0 && (
          <div
            onClick={() => { if (setTab) setTab('practice'); }}
            style={{
              display:'flex', alignItems:'center', gap:10, padding:'12px 14px',
              background:'var(--card)', border:'1px solid var(--card-b)',
              borderRadius:12, cursor:'pointer', marginTop:12,
            }}
          >
            <span style={{fontSize:'var(--text-xl)'}}>🎯</span>
            <div style={{flex:1}}>
              <div style={{fontSize:'var(--text-sm)', fontWeight:700, color:'var(--heading)'}}>Now practice what you learned</div>
              <div style={{fontSize:'var(--text-sm)', color:'var(--subtext)'}}>Flashcards → drill new vocabulary</div>
            </div>
            <span style={{color:'var(--subtext)', fontSize:'var(--text-base)'}}>→</span>
          </div>
        )}
      </div>
    </div>
  );
}
