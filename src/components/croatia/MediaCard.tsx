import React, { useState } from 'react';
import RadioPlayer from './RadioPlayer';
import { LEVEL_COLORS, DOMAIN_VOCAB, getDomain, getActionLabel, markImmersionToday } from './MediaPlayerUtils';

// ── Completion tracking (localStorage) ───────────────────────────────────────
function getCompletedMedia() {
  try { return JSON.parse(localStorage.getItem('nh_media_done') || '{}'); } catch { return {}; }
}
function markMediaDone(id) {
  const done = getCompletedMedia();
  done[id] = Date.now();
  localStorage.setItem('nh_media_done', JSON.stringify(done));
}

// ── Learning Mode Toggle ──────────────────────────────────────────────────────
export function LearningModeToggle({ enabled, onToggle }) {
  return (
    <button onClick={onToggle} style={{
      display:'flex',alignItems:'center',gap:8,padding:'8px 14px',
      background:enabled?'rgba(212,0,48,.08)':'var(--bar-bg)',
      border:`1.5px solid ${enabled?'rgba(212,0,48,.3)':'var(--card-b)'}`,
      borderRadius:20,cursor:'pointer',fontFamily:"'Outfit',sans-serif",
      transition:'all .2s',flexShrink:0,
    }}>
      <span style={{fontSize:14}}>{enabled?'🎓':'👁️'}</span>
      <span style={{fontSize:11,fontWeight:700,color:enabled?'#D40030':'var(--subtext)',whiteSpace:'nowrap'}}>
        {enabled?'Learning Mode ON':'Learning Mode'}
      </span>
      <div style={{
        width:32,height:18,borderRadius:9,position:'relative',flexShrink:0,
        background:enabled?'#D40030':'var(--bar-bg)',border:'1px solid var(--card-b)',
        transition:'background .2s',
      }}>
        <div style={{
          position:'absolute',top:2,left:enabled?14:2,
          width:14,height:14,borderRadius:'50%',background:'white',
          boxShadow:'0 1px 4px rgba(0,0,0,.25)',transition:'left .2s',
        }}/>
      </div>
    </button>
  );
}

// ── Goal Tag Badge ────────────────────────────────────────────────────────────
export function GoalTag({ label }) {
  return (
    <span style={{
      background:'rgba(212,0,48,.08)',color:'#D40030',
      fontSize:9,fontWeight:800,padding:'2px 7px',borderRadius:20,
      border:'1px solid rgba(212,0,48,.2)',letterSpacing:'0.04em',flexShrink:0,
    }}>{label}</span>
  );
}

// ── Vocab Preview (Learning Mode) ─────────────────────────────────────────────
function VocabPreview({ cat }) {
  const words = DOMAIN_VOCAB[cat] || DOMAIN_VOCAB.culture;
  return (
    <div style={{padding:'8px 12px',background:'rgba(212,0,48,.04)',borderTop:'1px solid var(--card-b)'}}>
      <div style={{fontSize:9,fontWeight:900,color:'#D40030',letterSpacing:'.08em',textTransform:'uppercase',marginBottom:6}}>
        Words you'll hear
      </div>
      <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
        {words.map(w => (
          <div key={w.hr} style={{
            background:'white',border:'1px solid var(--card-b)',borderRadius:8,
            padding:'4px 8px',fontSize:10,
          }}>
            <span style={{fontWeight:800,color:'#0e7490'}}>{w.hr}</span>
            <span style={{color:'var(--subtext)',marginLeft:4}}>{w.en}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Comprehension Card (Learning Mode) ───────────────────────────────────────
const COMPREHENSION_QS = {
  tv:'After watching, try to summarise: what was the main topic?',
  music:'After listening: what emotion does this music convey?',
  film:'After watching: what happened in the first scene?',
  sport:'After watching: who won and what was the score?',
  podcast:"After listening: what was the host's main argument?",
  culture:'After reading: name one tradition or custom mentioned.',
};
function ComprehensionCard({ cat, itemId }) {
  const key = `nh_media_engaged_${itemId}`;
  const [done, setDone] = useState(() => { try { return !!localStorage.getItem(key); } catch { return false; } });
  const q = COMPREHENSION_QS[cat] || COMPREHENSION_QS.culture;
  function markDone() {
    try { localStorage.setItem(key, '1'); } catch{}
    setDone(true);
    markImmersionToday();
  }
  return (
    <div style={{padding:'10px 12px',background:'rgba(14,116,144,.04)',borderTop:'1px solid var(--card-b)'}}>
      <div style={{fontSize:9,fontWeight:900,color:'#0e7490',letterSpacing:'.08em',textTransform:'uppercase',marginBottom:4}}>
        Comprehension Check
      </div>
      <div style={{fontSize:11,color:'var(--body)',lineHeight:1.5,marginBottom:8}}>{q}</div>
      {done
        ? <span style={{fontSize:10,color:'#16a34a',fontWeight:800}}>✓ Completed</span>
        : <button onClick={markDone} style={{
            padding:'5px 12px',borderRadius:8,border:'none',background:'#0e7490',
            color:'white',fontSize:10,fontWeight:700,cursor:'pointer',
          }}>I watched this ✓</button>
      }
    </div>
  );
}

export default function MediaCard({ m, cat, onOpen, activeStream, setActiveStream, learningMode, goalTag }) {
  const [tipOpen, setTipOpen] = useState(false);
  const [done, setDone] = useState(() => !!getCompletedMedia()[m.name]);
  const lc = LEVEL_COLORS[m.level] || '#78716c';
  const isExternal = !!m.web;
  const isInternal = !!m.scr && !m.web;
  const hasAction = isExternal || isInternal;
  const domain = getDomain(m.web);
  const isHRTI = domain === 'hrti.hrt.hr';
  const [actionLabel, isLive] = getActionLabel(m, cat);
  const btnBg = isLive ? 'linear-gradient(135deg,#dc2626,#b91c1c)' : isInternal ? '#0e7490' : m.color;
  const btnShadow = isLive ? '0 3px 10px rgba(220,38,38,.35)' : `0 2px 6px ${m.color}35`;
  const streamId = m.stream ? m.name : null;
  const itemId = m.name.replace(/\s+/g,'_').toLowerCase();

  return (
    <div className="media-card" style={{background:'var(--card)',borderRadius:16,border:'1px solid var(--card-b)',boxShadow:'0 2px 8px rgba(0,0,0,.04)',overflow:'hidden',marginBottom:10,animation:'nh-fade-in .3s ease both'}}>
      {/* Info row */}
      <div style={{display:'flex',gap:12,padding:'14px 14px 12px',alignItems:'flex-start'}}>
        <div style={{width:46,height:46,borderRadius:13,background:m.color+'15',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0,border:`1px solid ${m.color}20`}}>
          {m.icon}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4,flexWrap:'wrap'}}>
            <span style={{fontSize:'var(--text-sm)',fontWeight:800,color:'var(--heading)'}}>{m.name}</span>
            {m.level && <span style={{background:`${lc}18`,color:lc,fontSize:9,fontWeight:800,padding:'2px 6px',borderRadius:20,border:`1px solid ${lc}35`,letterSpacing:'0.04em'}}>{m.level}</span>}
            {isHRTI && <span style={{background:'rgba(220,38,38,.08)',color:'var(--error)',fontSize:9,fontWeight:800,padding:'2px 6px',borderRadius:20,border:'1px solid rgba(220,38,38,.2)',letterSpacing:'0.04em'}}>HRT+</span>}
            {isInternal && <span style={{background:'rgba(14,116,144,.08)',color:'#0e7490',fontSize:9,fontWeight:800,padding:'2px 6px',borderRadius:20,border:'1px solid rgba(14,116,144,.2)',letterSpacing:'0.04em'}}>IN APP</span>}
            {m.stream && <span style={{background:'rgba(220,38,38,.08)',color:'var(--error)',fontSize:9,fontWeight:800,padding:'2px 6px',borderRadius:20,border:'1px solid rgba(220,38,38,.2)',letterSpacing:'0.04em'}}>LIVE</span>}
            {goalTag && <GoalTag label={goalTag} />}
          </div>
          <div style={{fontSize:'var(--text-xs)',color:'var(--subtext)',lineHeight:1.5}}>{m.desc}</div>
          {domain && !isHRTI && !m.stream && (
            <div style={{display:'flex',alignItems:'center',gap:3,marginTop:5,fontSize:'var(--text-xs)',color:'var(--subtext)'}}>
              <span>🌐</span><span>{domain}</span>
            </div>
          )}
          {isHRTI && (
            <div style={{display:'flex',alignItems:'center',gap:3,marginTop:5,fontSize:'var(--text-xs)',color:'var(--error)'}}>
              <span>🔐</span><span>Subscription required · browser auto-fills saved login</span>
            </div>
          )}
        </div>
      </div>

      {/* Action footer */}
      <div style={{display:'flex',alignItems:'center',gap:8,padding:'10px 14px',borderTop:'1px solid var(--card-b)',background:'rgba(0,0,0,.015)'}}>
        {m.stream
          ? <RadioPlayer
              src={m.stream}
              color={m.color}
              streamId={streamId}
              activeStream={activeStream}
              setActiveStream={setActiveStream}
            />
          : hasAction && (
            <button
              onClick={onOpen}
              style={{display:'flex',alignItems:'center',gap:5,padding:'8px 14px',background:btnBg,color:'white',border:'none',borderRadius:10,fontSize:'var(--text-xs)',fontWeight:800,cursor:'pointer',letterSpacing:'0.02em',boxShadow:btnShadow,flexShrink:0}}>
              {isLive && <span style={{width:6,height:6,borderRadius:'50%',background:'white',display:'inline-block',opacity:.9,flexShrink:0}}/>}
              {actionLabel}
            </button>
          )
        }
        {m.tip && (
          <button
            onClick={() => setTipOpen(o => !o)}
            style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:4,cursor:'pointer',padding:'6px 10px',borderRadius:8,background:tipOpen?'rgba(14,116,144,.08)':'transparent',border:'1px solid '+(tipOpen?'rgba(14,116,144,.2)':'rgba(0,0,0,.07)'),color:tipOpen?'#0e7490':'#78716c',flexShrink:0}}>
            <span style={{fontSize:'var(--text-sm)'}}>💡</span>
            <span style={{fontSize:'var(--text-xs)',fontWeight:700}}>Tip</span>
            <span style={{fontSize:'var(--text-xs)',fontWeight:700}}>{tipOpen ? '▲' : '▼'}</span>
          </button>
        )}
      </div>

      {/* Tip content */}
      {m.tip && tipOpen && (
        <div style={{padding:'12px 14px 16px',borderTop:'1px solid var(--card-b)',background:'var(--bar-bg)'}}>
          <p style={{margin:0,fontSize:'var(--text-xs)',color:'var(--body)',lineHeight:1.75}}>{m.tip}</p>
        </div>
      )}

      {/* Learning Mode extras */}
      {learningMode && <VocabPreview cat={cat} />}
      {learningMode && <ComprehensionCard cat={cat} itemId={itemId} />}

      {/* Completion tracker */}
      {learningMode && (
        <button
          onClick={(e) => { e.stopPropagation(); const newDone = !done; setDone(newDone); if (newDone) markMediaDone(m.name); else { const d = getCompletedMedia(); delete d[m.name]; localStorage.setItem('nh_media_done', JSON.stringify(d)); } }}
          style={{ margin: '8px 12px 12px', padding: '6px 14px', borderRadius: 20, border: `1px solid ${done ? 'var(--success-b,#86efac)' : 'var(--card-b)'}`, background: done ? 'var(--success-bg,#f0fdf4)' : 'var(--bar-bg)', color: done ? 'var(--success,#16a34a)' : 'var(--subtext)', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
        >
          {done ? '✓ Done' : '○ Mark as done'}
        </button>
      )}
    </div>
  );
}
