import React, { useEffect, useState } from 'react';

// Confetti colors — Croatian flag + gold
const CONFETTI_COLORS = ['#b61800','#ffffff','#003087','#f59e0b','#16a34a'];

function Confetti() {
  const [pieces] = useState(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 1.5,
      duration: 2.5 + Math.random() * 2,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 8 + Math.random() * 8,
      shape: Math.random() > 0.5 ? 'circle' : 'square',
    }))
  );
  return (
    <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:9998, overflow:'hidden' }}>
      {pieces.map(p => (
        <div key={p.id} style={{
          position:'absolute', left:`${p.x}%`, top:-20,
          width:p.size, height:p.size,
          borderRadius: p.shape === 'circle' ? '50%' : 4,
          background: p.color,
          animation: `confettiFall ${p.duration}s ${p.delay}s linear infinite`,
          opacity: 0.9,
        }} />
      ))}
    </div>
  );
}

// ceremony types:
// 'streak_30' — 30-day streak
// 'streak_50' — 50-day streak
// 'streak_100' — 100-day streak
// 'stage_2' — completed Stage 2
// 'stage_3' — completed Stage 3
// 'stage_4' — completed Stage 4
// 'stage_5' — completed Stage 5 (graduation)

const CEREMONY_CONFIG = {
  streak_30: {
    emoji: '🔥',
    title: '30 Days Strong!',
    titleHr: 'Trideset dana!',
    subtitle: 'You\'ve been learning Croatian every day for a full month. That\'s remarkable.',
    color: 'linear-gradient(135deg,#dc2626,#b91c1c)',
    badge: '🔥 30',
  },
  streak_50: {
    emoji: '💎',
    title: '50 Days!',
    titleHr: 'Pedeset dana!',
    subtitle: 'Fifty days of dedication. You\'re not stopping, and Croatia is noticing.',
    color: 'linear-gradient(135deg,#7c3aed,#5b21b6)',
    badge: '💎 50',
  },
  streak_100: {
    emoji: '🏆',
    title: '100 Days!',
    titleHr: 'Sto dana!',
    subtitle: 'One hundred days. You are now officially serious about Croatian.',
    color: 'linear-gradient(135deg,#d97706,#b45309)',
    badge: '🏆 100',
  },
  stage_2: {
    emoji: '🌱',
    title: 'Stage 2 Complete!',
    titleHr: 'Razina 2 završena!',
    subtitle: 'You\'ve mastered the basics. Baka would be so proud.',
    color: 'linear-gradient(135deg,#16a34a,#15803d)',
    badge: '🌱 Lv 2',
  },
  stage_3: {
    emoji: '🌿',
    title: 'Stage 3 Complete!',
    titleHr: 'Razina 3 završena!',
    subtitle: 'You can now hold a real conversation. You\'re past the hard part.',
    color: 'linear-gradient(135deg,#0e7490,#164e63)',
    badge: '🌿 Lv 3',
  },
  stage_4: {
    emoji: '🦅',
    title: 'Stage 4 Complete!',
    titleHr: 'Razina 4 završena!',
    subtitle: 'Advanced Croatian. The diaspora community sees you now.',
    color: 'linear-gradient(135deg,#1d4ed8,#1e3a8a)',
    badge: '🦅 Lv 4',
  },
  stage_5: {
    emoji: '👑',
    title: 'You Did It!',
    titleHr: 'Uspio si! / Uspjela si!',
    subtitle: 'Stage 5 complete. You\'ve learned Croatian. Naša Hrvatska — our Croatia.',
    color: 'linear-gradient(135deg,#b61800,#7f1d1d)',
    badge: '👑 Lv 5',
  },
};

export default function CeremonyModal({ type, stats, name, onClose }) {
  const [showShare, setShowShare] = useState(false);
  const cfg = CEREMONY_CONFIG[type] || CEREMONY_CONFIG['streak_30'];

  useEffect(() => {
    // Prevent body scroll while modal is open
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const xp = stats?.xp || 0;
  const lc = stats?.lc || 0;
  const streak = stats?.str || 0;

  // Generate shareable text
  const shareText = `${cfg.emoji} ${cfg.title} — ${cfg.titleHr}\n\nI've been learning Croatian with Naša Hrvatska!\n${lc} lessons · ${xp} XP · ${streak}-day streak\n\nNaša Hrvatska 🇭🇷`;

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: 'Naša Hrvatska', text: shareText }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareText).then(() => setShowShare(true));
      setTimeout(() => setShowShare(false), 2000);
    }
  }

  return (
    <>
      <Confetti />
      <div style={{
        position:'fixed', inset:0, zIndex:9999,
        background:'rgba(0,0,0,.75)',
        display:'flex', alignItems:'center', justifyContent:'center',
        padding:20, animation:'fadeIn .3s',
      }}>
        <div style={{
          background:'var(--card)', borderRadius:28,
          maxWidth:380, width:'100%',
          textAlign:'center', overflow:'hidden',
          animation:'rise .5s cubic-bezier(.34,1.56,.64,1)',
          fontFamily:'var(--font-sans)',
          border:'1px solid var(--card-b)',
          boxShadow:'var(--card-shadow)',
        }}>
          {/* Header */}
          <div style={{ background: cfg.color, padding:'32px 24px 24px' }}>
            <div style={{ fontSize:64, marginBottom:8, filter:'drop-shadow(0 4px 12px rgba(0,0,0,.3))' }}>{cfg.emoji}</div>
            <div style={{ fontSize:26, fontFamily:"'Playfair Display',serif", fontWeight:900, color:'#fff', marginBottom:4, lineHeight:1.2 }}>{cfg.title}</div>
            <div style={{ fontSize:14, color:'rgba(255,255,255,.85)', fontWeight:600, marginBottom:8 }}>{cfg.titleHr}</div>
            <div style={{ display:'inline-block', background:'rgba(255,255,255,.2)', borderRadius:20, padding:'4px 14px', fontSize:13, color:'#fff', fontWeight:700 }}>{cfg.badge}</div>
          </div>

          {/* Body */}
          <div style={{ padding:'24px 24px 20px' }}>
            <div style={{ fontSize:'var(--text-md)', color:'var(--heading)', lineHeight:'var(--leading-normal)', marginBottom:20, fontWeight:500 }}>{cfg.subtitle}</div>

            {/* Stats recap */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:24 }}>
              {[
                { label:'Lessons', value:lc },
                { label:'XP', value:xp.toLocaleString() },
                { label:'Day Streak', value:`${streak}🔥` },
              ].map(s => (
                <div key={s.label} style={{ background:'var(--bar-bg)', borderRadius:'var(--radius-md)', padding:'12px 8px' }}>
                  <div style={{ fontSize:18, fontWeight:900, color:'var(--info)' }}>{s.value}</div>
                  <div style={{ fontSize:'var(--text-xs)', color:'var(--subtext)', fontWeight:600, marginTop:2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Letter to Future Me */}
            {(() => {
              const letter = localStorage.getItem('nh_letter_to_self');
              if (!letter || !letter.trim()) return null;
              return (
                <div style={{
                  background: 'rgba(255,255,255,0.08)', borderRadius: 12,
                  padding: '14px 16px', margin: '16px 0',
                  border: '1px solid rgba(255,255,255,0.15)',
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 6, letterSpacing: 1 }}>
                    YOU WROTE THIS WHEN YOU STARTED
                  </div>
                  <div style={{ fontSize: 13, color: '#fff', fontStyle: 'italic', lineHeight: 1.6 }}>
                    "{letter.trim()}"
                  </div>
                </div>
              );
            })()}

            {/* Shareable card message */}
            {showShare && (
              <div style={{ background:'var(--success-bg)', border:`1.5px solid var(--success-b)`, borderRadius:12, padding:'10px', marginBottom:16, fontSize:'var(--text-sm)', color:'var(--success)', fontWeight:600 }}>
                ✓ Copied to clipboard!
              </div>
            )}

            <button
              onClick={handleShare}
              className="b bp"
              style={{ width:'100%', marginBottom:10 }}
            >
              📱 Share this moment
            </button>
            <button
              onClick={onClose}
              className="b bg"
              style={{ width:'100%' }}
            >
              Nastavi učiti →
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
