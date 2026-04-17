// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import { markImmersionToday } from './MediaPlayerUtils';
import { API_BASE } from '../../lib/platform.ts';

export default function RadioPlayer({ src, color, streamId, activeStream, setActiveStream }) {
  const isActive = activeStream === streamId;
  const [playing, setPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [error, setError] = useState(false);
  const ref = useRef(null);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    if (!isActive && ref.current) {
      ref.current.pause();
      ref.current.removeAttribute('src');
      ref.current.load();
      setPlaying(false);
      setBuffering(false);
    }
  }, [isActive]);

  // Space bar shortcut when this player is active
  useEffect(() => {
    if (!isActive) return undefined;
    function onKey(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space') { e.preventDefault(); toggle(); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
   
  }, [isActive, playing, buffering]);

  function toggle() {
    const a = ref.current;
    if (!a) return;
    if (playing || buffering) {
      a.pause();
      a.removeAttribute('src');
      a.load();
      setPlaying(false);
      setBuffering(false);
      setActiveStream(null);
    } else {
      setError(false);
      setBuffering(true);
      setActiveStream(streamId);
      // Prefix relative stream URLs with absolute base so native WebView
      // resolves to nasahrvatska.com (not https://localhost)
      a.src = src.startsWith('/') ? `${API_BASE}${src}` : src;
      a.play().catch(() => { setError(true); setBuffering(false); setActiveStream(null); });
      // mark immersion engagement
      markImmersionToday();
    }
  }

  // Visualizer bars (CSS-animated)
  const Bars = () => (
    <div style={{display:'flex',alignItems:'flex-end',gap:2,height:24,flexShrink:0}}>
      {[['nh-bar1','0s'],['nh-bar2','.1s'],['nh-bar3','.2s'],['nh-bar4','.05s']].map(([anim,delay],i) => (
        <div key={i} style={{
          width:3,borderRadius:2,background:color,
          animation:playing?`${anim} 0.7s ease-in-out infinite ${delay}`:'none',
          height:playing?undefined:4,
          transition:'height .15s',
        }}/>
      ))}
    </div>
  );

  // Skeleton shimmer when buffering
  const Skeleton = () => (
    <div style={{
      height:10,borderRadius:6,width:'70%',
      background:'linear-gradient(90deg,rgba(255,255,255,.04) 25%,rgba(255,255,255,.12) 50%,rgba(255,255,255,.04) 75%)',
      backgroundSize:'200% 100%',
      animation:'nh-skeleton 1.4s linear infinite',
    }}/>
  );

  return (
    <div style={{display:'flex',alignItems:'center',gap:10,flex:1}}>
      <audio
        ref={ref}
        preload="none"
        onPlaying={() => { setPlaying(true); setBuffering(false); }}
        onPause={() => setPlaying(false)}
        onWaiting={() => setBuffering(true)}
        onError={() => { setError(true); setBuffering(false); setPlaying(false); setActiveStream(null); }}
      />
      <button
        onClick={toggle}
        aria-label={playing ? 'Pause radio' : 'Play radio'}
        style={{
          width:40,height:40,borderRadius:'50%',
          background:(playing||buffering) ? color : `${color}18`,
          border:`2px solid ${color}50`,
          color:(playing||buffering) ? 'white' : color,
          fontSize:16,cursor:'pointer',
          display:'flex',alignItems:'center',justifyContent:'center',
          flexShrink:0,transition:'all .15s',
          boxShadow:(playing||buffering) ? `0 4px 14px ${color}50` : 'none',
        }}>
        {buffering ? <span style={{fontSize:'var(--text-sm)',fontWeight:900}}>…</span> : playing ? '⏸' : '▶'}
      </button>
      <div style={{flex:1,minWidth:0}}>
        {error
          ? <span style={{fontSize:'var(--text-xs)',color:'var(--error)',fontWeight:700}}>Stream unavailable — tap to retry</span>
          : playing
            ? <div>
                <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:3}}>
                  <span style={{width:7,height:7,borderRadius:'50%',background:'var(--error)',display:'inline-block',flexShrink:0,boxShadow:'0 0 6px var(--error)'}}/>
                  <span style={{fontSize:'var(--text-xs)',fontWeight:900,color:'var(--error)',letterSpacing:'0.05em'}}>LIVE</span>
                  <Bars />
                </div>
                <div style={{fontSize:9,color:color,fontWeight:700,letterSpacing:'.02em'}}>
                  Authentic Croatian! 🇭🇷
                </div>
              </div>
            : buffering
              ? <div>
                  <span style={{fontSize:'var(--text-xs)',color:'var(--subtext)',display:'block',marginBottom:4}}>Connecting…</span>
                  <Skeleton />
                </div>
              : <span style={{fontSize:'var(--text-xs)',color:'var(--subtext)'}}>Tap ▶ to stream live · Space to pause</span>
        }
      </div>
    </div>
  );
}
