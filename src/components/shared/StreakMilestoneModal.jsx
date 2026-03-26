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
      aria-label={msg.title}
      onClick={onClose}
      onKeyDown={e => { if (e.key === 'Escape') { e.preventDefault(); onClose(); } }}
      style={{ position:'fixed', inset:0, zIndex:99999, display:'flex', alignItems:'center', justifyContent:'center',
        background:'rgba(0,0,0,0.6)', backdropFilter:'blur(6px)' }}
    >
      <div onClick={e=>e.stopPropagation()} style={{
        background:'var(--card)', borderRadius:28, padding:'44px 40px 36px', textAlign:'center',
        maxWidth:320, width:'90%', boxShadow:'var(--card-shadow)',
        border:`3px solid ${msg.color}`, animation:'celebPop .5s cubic-bezier(.34,1.56,.64,1) forwards',
        fontFamily:'var(--font-sans)',
      }}>
        {/* SVG Badge Ring */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:16 }}>
          <svg width="140" height="140" viewBox="0 0 140 140" style={{ display:'block', marginBottom:8 }}>
            {/* Outer glow ring */}
            <circle cx="70" cy="70" r="64" fill="none" stroke={msg.color} strokeWidth="3" opacity="0.15"/>
            {/* Track ring */}
            <circle cx="70" cy="70" r="55" fill="none" stroke={msg.color} strokeWidth="10" opacity="0.12"/>
            {/* Animated fill ring */}
            <circle cx="70" cy="70" r="55" fill="none" stroke={msg.color} strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray="345.4"
              strokeDashoffset="0"
              style={{ transform:'rotate(-90deg)', transformOrigin:'70px 70px', animation:'ringFill 1.8s cubic-bezier(.4,0,.2,1) forwards' }}
            />
            {/* Inner circle fill */}
            <circle cx="70" cy="70" r="46" fill={msg.color} opacity="0.08"/>
            {/* Emoji */}
            <text x="70" y="58" textAnchor="middle" fontSize="30" style={{ userSelect:'none' }}>{msg.emoji}</text>
            {/* Day count */}
            <text x="70" y="88" textAnchor="middle" fontSize="26" fontWeight="900" fill={msg.color} fontFamily="Outfit,sans-serif" style={{ fontVariantNumeric:'tabular-nums' }}>{days}</text>
            {/* "days" label */}
            <text x="70" y="104" textAnchor="middle" fontSize="11" fontWeight="700" fill={msg.color} opacity="0.7" fontFamily="Outfit,sans-serif" letterSpacing="2">DAYS</text>
          </svg>
          <div style={{ fontSize:'var(--text-3xl)', fontWeight:900, color:msg.color, fontFamily:'var(--font-serif)', marginBottom:6, textAlign:'center' }}>
            {msg.title}
          </div>
          <div style={{ fontSize:'var(--text-base)', color:'var(--subtext)', marginBottom:16, lineHeight:'var(--leading-normal)', textAlign:'center' }}>{msg.sub}</div>
        </div>
        <div style={{
          fontSize:'var(--text-sm)', color:'var(--body)', background:'var(--bar-bg)', borderRadius:'var(--radius-md)',
          padding:'10px 14px', marginBottom:20, lineHeight:'var(--leading-normal)', textAlign:'left',
          border:'1px solid var(--card-b)',
        }}>
          {msg.tip}
        </div>
        <button onClick={onClose} className="b" style={{
          width:'100%', padding:'12px 32px', background:`linear-gradient(135deg,${msg.color},#164e63)`,
          color:'#fff', border:'none', borderRadius:14, fontSize:'var(--text-md)', fontWeight:700, cursor:'pointer',
        }}>Keep Going 💪</button>
        <button
          onClick={handleShare}
          className="b"
          style={{
            width:'100%', padding:'12px', marginTop:12,
            background:'linear-gradient(135deg, #0e7490, #164e63)',
            color:'#fff', border:'none', borderRadius:12,
            fontSize:'var(--text-sm)', fontWeight:800, cursor:'pointer',
          }}
        >
          {copied ? '✓ Copied to clipboard!' : '📤 Share your streak'}
        </button>
        <div style={{ fontSize:'var(--text-xs)', color:'var(--subtext)', marginTop:12 }}>Tap anywhere to close</div>
      </div>
    </div>
  );
}
