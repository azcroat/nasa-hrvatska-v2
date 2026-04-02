import React, { useState } from 'react';
import DiscoverTab from './DiscoverTab.jsx';
import CultureTab from './CultureTab.jsx';
import MediaTab from './MediaTab.jsx';
import StoriesTab from './StoriesTab.jsx';

// ── CSS keyframe injection is handled in MediaPlayerUtils.jsx ─────────────────

// Q-4: Removed dead state setters — target screens manage their own state.
export default function CroatiaTab({ sCurEx }) {
  const [ctab, setCTab] = useState(() => sessionStorage.getItem('nh_ctab') || 'discover');

  // Track first-visit per sub-tab so "New" badges dismiss after the user has been there
  const [visited, setVisited] = useState(() => ({
    media:   !!localStorage.getItem('nh_visited_media'),
    stories: !!localStorage.getItem('nh_visited_stories'),
  }));

  function changeTab(id) {
    sessionStorage.setItem('nh_ctab', id);
    setCTab(id);
    if ((id === 'media' || id === 'stories') && !visited[id]) {
      try { localStorage.setItem('nh_visited_' + id, '1'); } catch (_) {}
      setVisited(v => ({ ...v, [id]: true }));
    }
  }

  return (
    <React.Fragment>
      {/* ── TAB HERO — always visible ── */}
      <div className="tab-hero">
        <div className="tab-hero-stripe" />
        <div style={{position:'absolute',top:0,left:0,right:0,bottom:0,background:'linear-gradient(105deg,transparent 30%,rgba(255,255,255,.035) 50%,transparent 70%)',backgroundSize:'200% 100%',animation:'shimmer 8s linear infinite',pointerEvents:'none'}} />
        <div className="tab-hero-body">
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
            <div style={{
              width:52,height:52,borderRadius:16,flexShrink:0,
              background:'rgba(255,255,255,.1)',border:'1.5px solid rgba(255,255,255,.2)',
              display:'flex',alignItems:'center',justifyContent:'center',fontSize:30,
              boxShadow:'0 4px 16px rgba(0,0,0,.2)',
            }}>🇭🇷</div>
            <div>
              <div style={{fontSize:10,fontWeight:800,color:'rgba(255,255,255,.5)',letterSpacing:'.18em',textTransform:'uppercase',marginBottom:4}}>Life in Croatia</div>
              <div style={{fontSize:27,fontWeight:900,color:'white',fontFamily:"'Playfair Display',serif",lineHeight:1.1,textShadow:'0 2px 20px rgba(0,0,0,.45)'}}>Naša Hrvatska</div>
            </div>
          </div>
          <div style={{fontSize:'var(--text-sm)',color:'rgba(255,255,255,.62)',lineHeight:1.5,fontWeight:500,marginBottom:14}}>
            Culture, history, daily life &amp; immersion
          </div>
          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
            {[
              {label:'🏰 History', color:'rgba(194,65,12,.45)'},
              {label:'🎵 Culture', color:'rgba(14,116,144,.45)'},
              {label:'📰 Stories', color:'rgba(22,163,74,.35)'},
              {label:'🌊 Immersion', color:'rgba(124,58,237,.35)'},
            ].map(t=>(
              <span key={t.label} style={{
                fontSize:11,fontWeight:700,color:'rgba(255,255,255,.75)',
                background:t.color,
                border:'1px solid rgba(255,255,255,.15)',
                borderRadius:20,padding:'4px 12px',
                backdropFilter:'blur(4px)',
              }}>{t.label}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── SUB-TAB PILL SELECTOR ── */}
      <style>{`@keyframes nh-new-pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.35);opacity:.7}}`}</style>
      <div style={{
        display:'flex', gap:6, overflowX:'auto', scrollbarWidth:'none',
        position:'sticky', top:0, zIndex:10,
        background:'var(--app-bg)', padding:'10px 0',
        borderBottom:'1px solid var(--card-b)',
        boxShadow:'0 2px 10px rgba(0,0,0,0.07)',
      }}>
        {[
          { id:'discover', label:'🗓️ Discover' },
          { id:'culture',  label:'🏰 Culture' },
          { id:'media',    label:'🎵 Media' },
          { id:'stories',  label:'📖 Stories' },
        ].map(t => {
          const isNew = (t.id === 'media' || t.id === 'stories') && !visited[t.id];
          const isActive = ctab === t.id;
          return (
            <button key={t.id} data-ctab={t.id} onClick={() => changeTab(t.id)} style={{
              position:'relative',
              padding:'8px 18px', borderRadius:22, flexShrink:0,
              border: isActive ? 'none' : '1px solid var(--card-b)',
              background: isActive ? 'var(--info)' : 'var(--card)',
              color: isActive ? '#fff' : 'var(--subtext)',
              fontWeight:700, fontSize:13, cursor:'pointer', whiteSpace:'nowrap',
              transition:'all 0.2s',
              boxShadow: isActive ? '0 2px 8px rgba(14,116,144,.3)' : 'var(--card-shadow)',
            }}>
              {t.label}
              {isNew && (
                <span style={{
                  position:'absolute', top:2, right:4,
                  width:8, height:8, borderRadius:'50%',
                  background:'#ef4444',
                  border:'1.5px solid var(--app-bg)',
                  animation:'nh-new-pulse 2s ease-in-out infinite',
                }} />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Tab content wrapper with fade transition ── */}
      <div key={ctab} style={{animation:'nh-fade-in .28s ease both'}}>

        {ctab === 'discover' && <DiscoverTab />}
        {ctab === 'culture'  && <CultureTab sCurEx={sCurEx} />}
        {ctab === 'media'    && <MediaTab />}
        {ctab === 'stories'  && <StoriesTab />}

      </div>{/* end tab content fade wrapper */}
    </React.Fragment>
  );
}
