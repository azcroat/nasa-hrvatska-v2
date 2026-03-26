import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { useHaptic } from '../../hooks/useHaptic.js';

const MESSAGES = {
  7:   { emoji: '🔥', title: '7 Days Strong! 🔥', sub: "You've formed a habit. This is where it starts.", tip: 'Tip: Put your next practice time in your calendar right now.', color: '#f97316' },
  14:  { emoji: '💪', title: '2 Weeks! 💪', sub: "You've pushed through the hard first days. Most people quit before this.", tip: 'Tip: Tell someone you\'re learning Croatian — accountability helps.', color: '#f59e0b' },
  21:  { emoji: '🌟', title: '3 Weeks! 🌟', sub: 'Science says 21 days builds a habit. You\'re there.', tip: 'Fun: Try saying something Croatian to your partner or family today.', color: '#10b981' },
  30:  { emoji: '⚡', title: '30 Days! ⚡', sub: 'One full month of Croatian. You are no longer a beginner.', tip: 'You speak Croatian now. Not perfectly — but you speak it.', color: '#f59e0b' },
  50:  { emoji: '💎', title: '50 Days! 💎', sub: 'Incredible dedication. Most apps never see you this far.', tip: 'At 50 days, your brain has begun to restructure for Croatian. Keep going.', color: '#8b5cf6' },
  100: { emoji: '🏆', title: '100 Days! 🏆', sub: 'Triple digits. You have earned the right to call yourself a Croatian learner.', tip: 'You are in the top 1% of language learners worldwide by consistency alone.', color: '#0e7490' },
  365: { emoji: '👑', title: '365 Days! 👑', sub: 'One full year. Čestitamo — congratulations from the whole Croatian diaspora.', tip: 'Jedna godina. Ti si naš čovjek.', color: '#164e63' },
};

export default function StreakMilestoneModal({ days, onClose }) {
  const haptic = useHaptic();
  const msg = MESSAGES[days] || { emoji: '🔥', title: `${days}-Day Streak!`, sub: 'Keep it up!', tip: 'Every day counts. See you tomorrow!', color: '#f97316' };
  const fired = useRef(false);
  const [copied, setCopied] = useState(false);

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

  const shareText = `🔥 ${days}-day Croatian streak! I'm learning Croatian with Naša Hrvatska. Naša Hrvatska — Croatian for the diaspora.`;

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Naša Hrvatska', text: shareText });
      } catch (_) {}
    } else {
      await navigator.clipboard.writeText(shareText).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

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
        <div style={{ fontSize:12, color:'#94a3b8', marginBottom:8 }}>days in a row</div>
        <div style={{
          fontSize:12, color:'#475569', background:'#f1f5f9', borderRadius:10,
          padding:'10px 14px', marginBottom:20, lineHeight:1.5, textAlign:'left',
        }}>
          {msg.tip}
        </div>
        <button onClick={onClose} style={{
          width:'100%', padding:'12px 32px', background:`linear-gradient(135deg,${msg.color},#164e63)`,
          color:'#fff', border:'none', borderRadius:14, fontSize:15, fontWeight:700, cursor:'pointer',
        }}>Keep Going 💪</button>
        <button
          onClick={handleShare}
          style={{
            width:'100%', padding:'12px', marginTop:12,
            background:'linear-gradient(135deg, #0e7490, #164e63)',
            color:'#fff', border:'none', borderRadius:12,
            fontSize:13, fontWeight:800, cursor:'pointer',
          }}
        >
          {copied ? '✓ Copied to clipboard!' : '📤 Share your streak'}
        </button>
        <div style={{ fontSize:11, color:'#94a3b8', marginTop:12 }}>Tap anywhere to close</div>
      </div>
    </div>
  );
}
