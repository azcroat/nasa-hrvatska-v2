import React, { useState } from 'react';
import { MEDIA, incrementCulture } from '../../data.jsx';
import { useApp } from '../../context/AppContext.jsx';
import MediaCard, { LearningModeToggle } from './MediaCard.jsx';
import SpotifySection from './SpotifySection.jsx';
import ImmersionStreak from './ImmersionStreak.jsx';
import RadioPlayer from './RadioPlayer.jsx';
import { getGoalPersonalization, sortMediaForGoal, tagMediaForGoal } from './MediaPlayerUtils.jsx';

export default function MediaTab() {
  const { setScr, award } = useApp();
  const [activeStream, setActiveStream] = useState(null);
  const [mediaFilter, setMediaFilter] = useState('all');
  const [learningMode, setLearningMode] = useState(false);
  const userGoal = getGoalPersonalization();

  return (
    <React.Fragment>
      {/* ─── Hero ─────────────────────────────────────── */}
      <div style={{
        background:'linear-gradient(160deg,#060e1e 0%,#071830 50%,#0a2a50 100%)',
        borderRadius:20, overflow:'hidden', marginBottom:22,
        position:'relative', boxShadow:'0 8px 40px rgba(0,0,0,.5)',
      }}>
        <div style={{height:4,background:'linear-gradient(90deg,#D40030 0%,#D40030 50%,#F8F6F2 50%,#F8F6F2 100%)'}}/>
        <div style={{position:'absolute',top:0,left:0,right:0,bottom:0,background:'linear-gradient(105deg,transparent 30%,rgba(255,255,255,.035) 50%,transparent 70%)',backgroundSize:'200% 100%',animation:'shimmer 6s linear infinite',pointerEvents:'none'}}/>
        <div style={{padding:'22px 22px 24px',position:'relative',zIndex:1}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
            <div style={{width:8,height:8,borderRadius:'50%',background:'#ef4444',boxShadow:'0 0 10px #ef4444',animation:'pulse 1.5s ease-in-out infinite'}}/>
            <span style={{fontSize:10,fontWeight:900,color:'rgba(255,255,255,.45)',letterSpacing:'.18em',textTransform:'uppercase'}}>LIVE FROM CROATIA</span>
          </div>
          <div style={{fontSize:28,fontWeight:900,color:'white',fontFamily:"'Playfair Display',serif",lineHeight:1.1,marginBottom:8,textShadow:'0 2px 20px rgba(0,0,0,.5)'}}>
            Tune In to Croatia
          </div>
          <div style={{fontSize:13,color:'rgba(255,255,255,.6)',fontWeight:500,lineHeight:1.5,marginBottom:14}}>
            Real Croatian — live radio, TV, music, film & sport
          </div>
          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
            {['📡 Live Radio','📺 TV & News','🎵 Music','⚽ Sport','🎬 Film'].map(t => (
              <span key={t} style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,.55)',background:'rgba(255,255,255,.07)',borderRadius:20,padding:'3px 10px',border:'1px solid rgba(255,255,255,.1)'}}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ─── IMMERSION STREAK ──────────────────────────── */}
      <ImmersionStreak />

      {/* ─── LEARNING MODE + FILTER ROW ────────────────── */}
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
        <LearningModeToggle enabled={learningMode} onToggle={() => setLearningMode(m => !m)} />
      </div>

      {/* ─── MEDIA FILTER PILLS ────────────────────────── */}
      <div style={{ display:'flex', gap:8, padding:'4px 0 16px', overflowX:'auto', scrollbarWidth:'none' }}>
        {[
          { id:'all',     label:'🎯 All' },
          { id:'tv',      label:'📺 TV' },
          { id:'music',   label:'🎵 Music' },
          { id:'film',    label:'🎬 Film' },
          { id:'sport',   label:'⚽ Sport' },
          { id:'podcast', label:'🎙️ Podcast' },
          { id:'culture', label:'🎭 Culture' },
        ].map(f => (
          <button key={f.id} onClick={() => setMediaFilter(f.id)} style={{
            padding:'7px 14px', borderRadius:20, border:'none', flexShrink:0,
            background: mediaFilter === f.id ? '#D40030' : 'var(--bar-bg)',
            color: mediaFilter === f.id ? '#fff' : 'var(--subtext)',
            fontWeight:700, fontSize:12, cursor:'pointer', whiteSpace:'nowrap',
            transition:'background 0.2s',
          }}>{f.label}</button>
        ))}
      </div>

      {/* ─── SPOTIFY PLAYLISTS ─────────────────────────── */}
      {(mediaFilter === 'all' || mediaFilter === 'music') && (
        <div style={{
          marginBottom:24, padding:'18px 14px 20px', borderRadius:16,
          background:'var(--card)',
          border:'1px solid rgba(30,215,96,.2)',
          boxShadow:'0 4px 20px rgba(0,0,0,.3)',
        }}>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
            <div style={{
              width:40,height:40,borderRadius:12,background:'#1ed760',
              display:'flex',alignItems:'center',justifyContent:'center',
              fontSize:20,flexShrink:0,boxShadow:'0 4px 12px rgba(30,215,96,.4)',
            }}>🎵</div>
            <div>
              <div style={{fontSize:15,fontWeight:900,color:'white'}}>Croatian Music on Spotify</div>
              <div style={{fontSize:11,color:'rgba(255,255,255,.45)',marginTop:1}}>14 curated playlists · tap to expand</div>
            </div>
          </div>
          <SpotifySection/>
        </div>
      )}

      {/* ─── LIVE RADIO ────────────────────────────────── */}
      {mediaFilter === 'all' && (
        <div style={{marginBottom:24}}>
          <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:12}}>
            <div style={{width:8,height:8,borderRadius:'50%',background:'var(--error)',boxShadow:'0 0 8px var(--error)',animation:'pulse 1.5s ease-in-out infinite'}}/>
            <span style={{fontSize:11,fontWeight:900,color:'var(--error)',textTransform:'uppercase',letterSpacing:'.1em'}}>Streaming Live</span>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
            {MEDIA.filter(m => !!m.stream).map((m,i) => (
              <div key={i} style={{
                background:`linear-gradient(175deg,#0c1520 0%,${m.color}40 100%)`,
                borderRadius:16,overflow:'hidden',border:`1px solid ${m.color}30`,
                display:'flex',flexDirection:'column',
                boxShadow:`0 4px 20px ${m.color}18`,
              }}>
                <div style={{padding:'16px 10px 8px',textAlign:'center'}}>
                  <div style={{fontSize:30,marginBottom:6}}>{m.icon}</div>
                  <div style={{fontSize:10,fontWeight:900,color:'white',lineHeight:1.25,marginBottom:3}}>
                    {m.name.split(' — ')[0].replace(' Live','').replace(' Radio Live','').trim()}
                  </div>
                  <div style={{fontSize:9,color:'rgba(255,255,255,.4)',lineHeight:1.3,marginBottom:8}}>{m.level}</div>
                </div>
                <div style={{padding:'0 8px 10px'}}>
                  <RadioPlayer src={m.stream} color={m.color} streamId={m.name} activeStream={activeStream} setActiveStream={setActiveStream}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── CONTENT CATEGORIES ─────────────────────────── */}
      {[
        {cat:'tv',     emoji:'📺', title:'TV & News',         accent:'#0e7490',  noStream:false},
        {cat:'music',  emoji:'🎵', title:'Music',              accent:'var(--lavender, #9333ea)',  noStream:true},
        {cat:'film',   emoji:'🎬', title:'Film & Video',       accent:'#b91c1c',  noStream:false},
        {cat:'sport',  emoji:'⚽', title:'Sport',              accent:'#1d4ed8',  noStream:false},
        {cat:'podcast',emoji:'🎙️',title:'Podcasts & Audio',   accent:'#16a34a',  noStream:false},
        {cat:'culture',emoji:'🌍', title:'Culture & Press',    accent:'var(--lavender, #7c3aed)',  noStream:false},
      ].map(({cat,emoji,title,accent,noStream}) => {
        if (mediaFilter !== 'all' && mediaFilter !== cat) return null;
        const rawItems = MEDIA.filter(m => m.cat === cat && (noStream ? !m.stream : true));
        if (!rawItems.length) return null;
        // Apply goal-based sorting
        const items = sortMediaForGoal(rawItems, userGoal);
        return (
          <div key={cat} style={{marginBottom:24,animation:'nh-fade-in .35s ease both'}}>
            {/* Section header */}
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12,padding:'10px 14px',borderRadius:12,background:`${accent}10`,borderLeft:`3px solid ${accent}`}}>
              <span style={{fontSize:18}}>{emoji}</span>
              <span style={{fontSize:15,fontWeight:900,color:'var(--heading)',flex:1}}>{title}</span>
              {userGoal && <span style={{fontSize:9,color:'var(--subtext)',fontStyle:'italic'}}>sorted for you</span>}
              <span style={{fontSize:10,color:'var(--subtext)',fontWeight:600,background:'var(--bar-bg)',borderRadius:8,padding:'2px 8px'}}>{items.length}</span>
            </div>
            {/* Learning Mode: full-width cards with extras; Normal: 2-column visual grid */}
            {learningMode ? (
              <div className="nh-stagger">
                {items.map((m,i) => (
                  <MediaCard
                    key={i} m={m} cat={cat}
                    onOpen={() => { if (m.scr || m.web) { incrementCulture('mediaCnt'); if (award) award(3); } if (m.scr) setScr(m.scr); else if (m.web) window.open(m.web,'_blank','noopener,noreferrer'); }}
                    activeStream={activeStream} setActiveStream={setActiveStream}
                    learningMode={true}
                    goalTag={tagMediaForGoal(m, userGoal)}
                  />
                ))}
              </div>
            ) : (
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}} className="nh-stagger">
                {items.map((m,i) => {
                  const isInternal = !!m.scr && !m.web;
                  const isExtLive = !!(m.live && !m.stream && m.web);
                  const hasAction = !!(m.scr || m.web);
                  const goalLabel = tagMediaForGoal(m, userGoal);
                  return (
                    <button key={i}
                      onClick={() => { if (m.scr || m.web) { incrementCulture('mediaCnt'); if (award) award(3); } if (m.scr) setScr(m.scr); else if (m.web) window.open(m.web,'_blank','noopener,noreferrer'); }}
                      style={{
                        display:'flex',flexDirection:'column',background:'var(--card)',
                        borderRadius:16,border:'1px solid var(--card-b)',overflow:'hidden',
                        cursor:hasAction?'pointer':'default',textAlign:'left',
                        fontFamily:"'Outfit',sans-serif",padding:0,
                        transition:'transform .15s,box-shadow .15s',
                        boxShadow:'0 2px 8px rgba(0,0,0,.04)',
                      }}
                      onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow=`0 8px 28px ${m.color}28`;}}
                      onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,.04)';}}>
                      {/* Color band */}
                      <div style={{height:64,background:`linear-gradient(135deg,${m.color}cc,${m.color})`,display:'flex',alignItems:'center',justifyContent:'center',position:'relative',overflow:'hidden',flexShrink:0}}>
                        <div style={{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundImage:'radial-gradient(circle,rgba(255,255,255,.13) 1px,transparent 1px)',backgroundSize:'14px 14px'}}/>
                        <span style={{fontSize:30,position:'relative'}}>{m.icon}</span>
                        {m.level && <span style={{position:'absolute',bottom:6,right:8,background:'rgba(0,0,0,.45)',color:'white',fontSize:8,fontWeight:900,padding:'2px 6px',borderRadius:6}}>{m.level}</span>}
                        {isInternal && <span style={{position:'absolute',top:6,right:8,background:'rgba(255,255,255,.22)',color:'white',fontSize:8,fontWeight:900,padding:'1px 5px',borderRadius:4,border:'1px solid rgba(255,255,255,.3)'}}>IN APP</span>}
                        {isExtLive && <span style={{position:'absolute',top:6,left:8,background:'#dc2626',color:'white',fontSize:8,fontWeight:900,padding:'2px 6px',borderRadius:6}}>LIVE ↗</span>}
                        {goalLabel && <span style={{position:'absolute',bottom:6,left:6,background:'rgba(212,0,48,.85)',color:'white',fontSize:7,fontWeight:900,padding:'2px 5px',borderRadius:4,letterSpacing:'.02em'}}>{goalLabel}</span>}
                      </div>
                      {/* Content */}
                      <div style={{padding:'10px 12px 12px',flex:1,display:'flex',flexDirection:'column'}}>
                        <div style={{fontSize:12,fontWeight:800,color:'var(--heading)',lineHeight:1.3,marginBottom:4}}>{m.name}</div>
                        <div style={{fontSize:10,color:'var(--subtext)',lineHeight:1.45,flex:1}}>
                          {m.desc.length > 58 ? m.desc.substring(0,55)+'…' : m.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </React.Fragment>
  );
}
