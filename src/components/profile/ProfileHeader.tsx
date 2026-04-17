// @ts-nocheck
import React from 'react';
import { lXP, nXP } from '../../lib/appUtils.js';
import CroatianKnight from '../shared/CroatianKnight';
import { useApp } from '../../context/AppContext';
import { useStats } from '../../context/StatsContext';

export default function ProfileHeader() {
  const { name, au } = useApp();
  const { level, stats: st } = useStats();

  return (
    <div style={{
      background: "linear-gradient(160deg,#030c1a 0%,#071830 30%,#0a2848 60%,#0d3562 100%)",
      borderRadius: 24, padding: "28px 20px 24px", marginBottom: 16,
      textAlign: "center", color: "var(--card)", position: "relative", overflow: "hidden",
      boxShadow: "0 16px 56px rgba(0,0,0,.45), 0 4px 16px rgba(0,0,0,.3)"
    }}>
      {/* Šahovnica pattern */}
      <div style={{position:"absolute",inset:0,backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28'%3E%3Crect width='14' height='14' fill='rgba(212,0,48,0.04)'/%3E%3Crect x='14' y='14' width='14' height='14' fill='rgba(212,0,48,0.04)'/%3E%3C/svg%3E")`,pointerEvents:"none",borderRadius:"inherit"}}/>
      {/* Radial glow */}
      <div style={{position:"absolute",top:"-50%",left:"50%",transform:"translateX(-50%)",width:"120%",height:"100%",background:"radial-gradient(ellipse at 50% 20%, rgba(14,116,144,.28) 0%, transparent 65%)",pointerEvents:"none"}}/>
      {/* Decorative circles */}
      <div style={{position:"absolute",top:-50,right:-50,width:180,height:180,background:"rgba(14,116,144,.08)",borderRadius:"50%",pointerEvents:"none"}}/>
      <div style={{position:"absolute",bottom:-40,left:-40,width:120,height:120,background:"rgba(212,0,48,.05)",borderRadius:"50%",pointerEvents:"none"}}/>
      <div style={{
        width: 84, height: 84, borderRadius: "50%",
        background: "rgba(255,255,255,.14)", backdropFilter: "blur(12px)",
        border: "2px solid rgba(255,255,255,.28)",
        boxShadow: "0 8px 32px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 14px", fontSize: 38, fontWeight: 900, color: "var(--card)",
        position: "relative", zIndex: 1
      }}>
        {name ? name.charAt(0).toUpperCase() : "👤"}
      </div>
      <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:'var(--text-xl)',color:"#fff",marginBottom:4,fontWeight:800,letterSpacing:"-.01em",position:"relative",zIndex:1,textShadow:"0 2px 12px rgba(0,0,0,.5)"}}>
        {name || au?.d}
      </h2>
      <CroatianKnight size={50} mood="encouraged" style={{margin:'8px auto 0', display:'block', position:'relative', zIndex:1}} />
      <div style={{fontSize:'var(--text-sm)',opacity:.75,marginBottom:2,fontWeight:600,position:"relative",zIndex:1,color:"rgba(255,255,255,.8)"}}>Level {level} Learner</div>
      {/* ── NEXT LEVEL XP BAR ── */}
      {(() => {
        const xpFloor = lXP(level);
        const xpCeil = nXP(level);
        const xpInLevel = (st.xp || 0) - xpFloor;
        const xpNeeded = xpCeil - xpFloor;
        const pct = xpNeeded > 0 ? Math.min(100, Math.round((xpInLevel / xpNeeded) * 100)) : 100;
        const xpRemaining = Math.max(0, xpCeil - (st.xp || 0));
        return (
          <div style={{width:'80%',maxWidth:260,margin:'6px auto 0',position:'relative',zIndex:1}}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:10,fontWeight:700,color:'rgba(255,255,255,.6)',marginBottom:4}}>
              <span>Level {level}</span>
              <span style={{color:'rgba(255,255,255,.85)'}}>
                {xpRemaining > 0 ? xpRemaining + ' XP to Level ' + (level + 1) : 'Max Level!'}
              </span>
            </div>
            <div style={{height:6,borderRadius:3,background:'rgba(255,255,255,.15)',overflow:'hidden'}}>
              <div style={{height:'100%',borderRadius:3,background:'linear-gradient(90deg,#06b6d4,#0e7490)',width:pct + '%',transition:'width .6s ease'}}/>
            </div>
            <div style={{textAlign:'center',fontSize:10,fontWeight:700,color:'rgba(255,255,255,.5)',marginTop:3}}>
              {xpInLevel} / {xpNeeded} XP · {pct}%
            </div>
          </div>
        );
      })()}
      {au?.e && <div style={{fontSize:'var(--text-sm)',opacity:.45,marginTop:6,position:"relative",zIndex:1}}>{au.e}</div>}
    </div>
  );
}
