import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { useHaptic } from '../../hooks/useHaptic.js';

const MESSAGES = {
  7:   { emoji: '🔥', title: '7-Day Streak!', sub: 'One week straight — you\'re building a real habit!', color: '#f97316' },
  30:  { emoji: '🌟', title: '30-Day Streak!', sub: 'A whole month of Croatian — impressive dedication!', color: '#f59e0b' },
  50:  { emoji: '💎', title: '50-Day Streak!', sub: 'Fifty days strong — you\'re in elite territory!', color: '#8b5cf6' },
  100: { emoji: '🏆', title: '100-Day Streak!', sub: 'One hundred days. You are extraordinary.', color: '#0e7490' },
  365: { emoji: '👑', title: 'One Year Streak!', sub: 'A full year of Croatian. Čestitamo — you\'ve done something rare.', color: '#164e63' },
};

export default function StreakMilestoneModal({ days, onClose }) {
  const haptic = useHaptic();
  const msg = MESSAGES[days] || { emoji: '🔥', title: `${days}-Day Streak!`, sub: 'Keep it up!', color: '#f97316' };
  const fired = useRef(false);
  useEffect(() => { haptic.award(); }, []);

  useEffect(() => {
    if (fired.current) return undefined;
    fired.current = true;
    const end = Date.now() + 3000;
    const colors = [msg.color, '#f59e0b', '#ffffff', '#10b981'];
    const frame = () => {
      confetti({ particleCount: 6, angle: 60, spread: 70, origin: { x: 0 }, colors });
      confetti({ particleCount: 6, angle: 120, spread: 70, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
    const t = setTimeout(onClose, 6000);
    return () => clearTimeout(t);
  }, [onClose, msg.color]);

  return (
    <div
      role="dialog" aria-modal="true"
      onClick={onClose}
      style={{ position:'fixed', inset:0, zIndex:99999, display:'flex', alignItems:'center', justifyContent:'center',
        background:'rgba(0,0,0,0.6)', backdropFilter:'blur(6px)' }}
    >
      <div onClick={e=>e.stopPropagation()} style={{
        background:'#fff', borderRadius:28, padding:'44px 40px 36px', textAlign:'center',
        maxWidth:320, width:'90%', boxShadow:'0 32px 80px rgba(0,0,0,.3)',
        border:`3px solid ${msg.color}`, animation:'celebPop .5s cubic-bezier(.34,1.56,.64,1) forwards',
      }}>
        <div style={{ fontSize:72, lineHeight:1, marginBottom:8 }}>{msg.emoji}</div>
        <div style={{ fontSize:26, fontWeight:900, color:msg.color, fontFamily:"'Playfair Display',serif", marginBottom:6 }}>
          {msg.title}
        </div>
        <div style={{ fontSize:14, color:'#64748b', marginBottom:20, lineHeight:1.5 }}>{msg.sub}</div>
        <div style={{ fontSize:48, fontWeight:900, color:msg.color, fontVariantNumeric:'tabular-nums', marginBottom:4 }}>
          {days}
        </div>
        <div style={{ fontSize:12, color:'#94a3b8', marginBottom:20 }}>days in a row</div>
        <button onClick={onClose} style={{
          padding:'12px 32px', background:`linear-gradient(135deg,${msg.color},#164e63)`,
          color:'#fff', border:'none', borderRadius:14, fontSize:15, fontWeight:700, cursor:'pointer',
        }}>Keep Going 💪</button>
        <div style={{ fontSize:11, color:'#94a3b8', marginTop:12 }}>Tap anywhere to close</div>
      </div>
    </div>
  );
}
