import React, { useState } from 'react';
import DiscoverTab from './DiscoverTab.jsx';
import CultureTab from './CultureTab.jsx';
import MediaTab from './MediaTab.jsx';
import StoriesTab from './StoriesTab.jsx';

// ── CSS keyframe injection is handled in MediaPlayerUtils.jsx ─────────────────

// Q-4: Removed dead state setters — target screens manage their own state.
export default function CroatiaTab({ sCurEx }) {
  const [ctab, setCTab] = useState('discover');

  return (
    <React.Fragment>
      {/* ── TAB HERO — always visible ── */}
      <div className="tab-hero">
        <div className="tab-hero-stripe" />
        <div style={{position:'absolute',top:0,left:0,right:0,bottom:0,background:'linear-gradient(105deg,transparent 30%,rgba(255,255,255,.025) 50%,transparent 70%)',backgroundSize:'200% 100%',animation:'shimmer 8s linear infinite',pointerEvents:'none'}} />
        <div className="tab-hero-body">
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
            <span style={{fontSize:36,lineHeight:1}}>🇭🇷</span>
            <div>
              <div style={{fontSize:10,fontWeight:800,color:'rgba(255,255,255,.45)',letterSpacing:'.16em',textTransform:'uppercase',marginBottom:3}}>Life in Croatia</div>
              <div style={{fontSize:26,fontWeight:900,color:'white',fontFamily:"'Playfair Display',serif",lineHeight:1.1,textShadow:'0 2px 16px rgba(0,0,0,.4)'}}>Naša Hrvatska</div>
            </div>
          </div>
          <div style={{fontSize:'var(--text-sm)',color:'rgba(255,255,255,.58)',lineHeight:1.5,fontWeight:500}}>
            Culture, history, daily life &amp; immersion
          </div>
          <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:12}}>
            {['🏰 History','🎵 Culture','📰 Stories','🌊 Immersion'].map(t=>(
              <span key={t} style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,.55)',background:'rgba(255,255,255,.07)',border:'1px solid rgba(255,255,255,.1)',borderRadius:20,padding:'4px 10px'}}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Access — horizontal scroll category cards */}
      <div style={{
        display: 'flex', gap: 10, overflowX: 'auto', padding: '12px 16px 4px',
        scrollbarWidth: 'none', msOverflowStyle: 'none',
        WebkitOverflowScrolling: 'touch',
      }}>
        {[
          { icon: '🏛️', label: 'History',   tab: 'culture'  },
          { icon: '🗺️', label: 'Regions',   tab: 'culture'  },
          { icon: '🎵', label: 'Music',      tab: 'media'    },
          { icon: '📺', label: 'TV & Film',  tab: 'media'    },
          { icon: '📖', label: 'Stories',    tab: 'stories'  },
          { icon: '🌊', label: 'Discover',   tab: 'discover' },
        ].map(item => (
          <button
            key={item.label}
            onClick={() => setCTab(item.tab)}
            style={{
              flexShrink: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 4, padding: '10px 14px',
              background: ctab === item.tab ? 'var(--info-bg, #f0f9ff)' : 'var(--card)',
              border: ctab === item.tab ? '1.5px solid var(--info-b, #bae6fd)' : '1px solid var(--card-b)',
              borderRadius: 12, cursor: 'pointer', minWidth: 64,
            }}
          >
            <span style={{fontSize: 22}}>{item.icon}</span>
            <span style={{fontSize: 11, fontWeight: 700, color: 'var(--text-2)', whiteSpace: 'nowrap'}}>{item.label}</span>
          </button>
        ))}
      </div>

      {/* ── SUB-TAB PILL SELECTOR ── */}
      <div style={{ display:'flex', gap:8, overflowX:'auto', scrollbarWidth:'none', position:'sticky', top:0, zIndex:10, background:'var(--bg)', paddingTop:8, paddingBottom:8, borderBottom:'1px solid var(--card-b)', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
        {[
          { id:'discover', label:'🗓️ Discover' },
          { id:'culture',  label:'🏰 Culture' },
          { id:'media',    label:'🎵 Media' },
          { id:'stories',  label:'📖 Stories' },
        ].map(t => (
          <button key={t.id} onClick={() => setCTab(t.id)} style={{
            padding:'7px 16px', borderRadius:20, border:'none', flexShrink:0,
            background: ctab === t.id ? 'var(--info)' : 'var(--bar-bg)',
            color: ctab === t.id ? '#fff' : 'var(--subtext)',
            fontWeight:700, fontSize:13, cursor:'pointer', whiteSpace:'nowrap',
            transition:'background 0.2s',
          }}>{t.label}</button>
        ))}
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
