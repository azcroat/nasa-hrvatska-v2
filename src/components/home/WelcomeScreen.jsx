import { useState } from 'react';
import { sh, PLACE } from '../../data.jsx';
import CroatianGrb from '../shared/CroatianGrb.jsx';

const GOALS = [
  { id: 'heritage', icon: '🇭🇷', label: 'My heritage & roots', sub: 'Connect with where I came from' },
  { id: 'family',   icon: '👨‍👩‍👧', label: 'Speak with family', sub: 'Talk to parents, grandparents, relatives' },
  { id: 'travel',   icon: '✈️',  label: 'Travel to Croatia',  sub: 'Navigate, meet locals, feel at home' },
  { id: 'culture',  icon: '📖',  label: 'Love the culture',   sub: 'Music, history, food, football' },
];

const DAILY_GOALS = [
  { id: 5,  label: '5 min',  sub: 'Light — just a few words a day' },
  { id: 10, label: '10 min', sub: 'Steady — the most popular choice' },
  { id: 15, label: '15 min', sub: 'Committed — you\'ll be conversational faster' },
  { id: 20, label: '20 min', sub: 'Serious — fluency is your goal' },
];

export default function WelcomeScreen({ name, au, st, setScr, setName, sPq, sPi, sPs, sPa, sPx }) {
  const [step, setStep] = useState(0); // 0=hero, 1=goal, 2=daily
  const [goal, setGoal] = useState('');
  const [dailyMin, setDailyMin] = useState(0);

  function startPlacement() {
    if (!name && au) setName(au.d);
    // Persist choices for future use (streak goals, personalised content)
    if (goal) localStorage.setItem('nh_goal', goal);
    if (dailyMin) localStorage.setItem('nh_daily_min', String(dailyMin));
    const b = sh(PLACE.filter(x => x.d === 1)).slice(0, 3);
    const m = sh(PLACE.filter(x => x.d === 2)).slice(0, 3);
    const a = sh(PLACE.filter(x => x.d === 3)).slice(0, 2);
    const q = [...b, ...m, ...a].map(q => {
      const c = q.o[q.c];
      const o = sh([...q.o]);
      return { ...q, o, c: o.indexOf(c) };
    });
    sPq(q); sPi(0); sPs(0); sPa(false); sPx(-1);
    setScr('placement');
  }

  // ── Step 0: Hero ──────────────────────────────────────────────────────────
  if (step === 0) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', padding:24, position:'relative', zIndex:1 }}>
      <div style={{ textAlign:'center', maxWidth:460, animation:'rise .6s' }}>
        {/* Coat of arms — centred, prominent */}
        <div style={{ display:'flex', justifyContent:'center', marginBottom:20 }}>
          <CroatianGrb size={130} style={{ filter:'drop-shadow(0 6px 20px rgba(0,0,0,0.25))' }} />
        </div>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:40, color:'var(--heading)', fontWeight:900, marginBottom:8, lineHeight:1.15 }}>
          Naša Hrvatska
        </h1>
        <p style={{ color:'var(--subtext)', fontSize:17, marginBottom:8 }}>
          Croatian for the diaspora — made with love 🇭🇷
        </p>
        {(name || au?.d) && (
          <p style={{ color:'var(--rt-c)', fontSize:15, marginBottom:28 }}>
            Bog, <span style={{ color:'#0e7490', fontWeight:700 }}>{name || au?.d}</span>!
          </p>
        )}
        <div style={{ background:'var(--card,#fff)', borderRadius:16, padding:'16px 20px', marginBottom:28, border:'1px solid var(--inp-b,#e2e8f0)', textAlign:'left' }}>
          <div style={{ display:'flex', gap:12, marginBottom:10 }}>
            <span style={{ fontSize:18 }}>🧠</span><span style={{ fontSize:13, color:'var(--subtext)', fontWeight:600 }}>Smart spaced repetition — remembers what you forget</span>
          </div>
          <div style={{ display:'flex', gap:12, marginBottom:10 }}>
            <span style={{ fontSize:18 }}>🔥</span><span style={{ fontSize:13, color:'var(--subtext)', fontWeight:600 }}>Daily streaks, milestones & family leaderboard</span>
          </div>
          <div style={{ display:'flex', gap:12 }}>
            <span style={{ fontSize:18 }}>🎵</span><span style={{ fontSize:13, color:'var(--subtext)', fontWeight:600 }}>Croatian songs, AI conversation & cultural immersion</span>
          </div>
        </div>
        <button className="b bp" style={{ fontSize:17, padding:'16px 48px', width:'100%', marginBottom:12 }} onClick={() => setStep(1)}>
          Počnimo! — Let's start! →
        </button>
        {st.xp > 0 && (
          <button className="b bg" style={{ fontSize:13, padding:'13px 24px', width:'100%' }} onClick={() => setScr('dashboard')}>
            Already have an account? Skip →
          </button>
        )}
      </div>
    </div>
  );

  // ── Step 1: Why are you learning? ─────────────────────────────────────────
  if (step === 1) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', padding:24, position:'relative', zIndex:1 }}>
      <div style={{ maxWidth:460, width:'100%', animation:'rise .4s' }}>
        <StepDots step={1} />
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, color:'var(--heading)', fontWeight:900, marginBottom:6, textAlign:'center' }}>
          Why are you learning Croatian?
        </h2>
        <p style={{ color:'var(--subtext)', fontSize:14, textAlign:'center', marginBottom:24 }}>We'll personalise your experience</p>
        <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:24 }}>
          {GOALS.map(g => (
            <button
              key={g.id}
              onClick={() => setGoal(g.id)}
              style={{
                display:'flex', alignItems:'center', gap:14, padding:'14px 18px',
                borderRadius:14, border:`2px solid ${goal===g.id?'#0e7490':'var(--inp-b,#e2e8f0)'}`,
                background: goal===g.id ? 'rgba(14,116,144,.07)' : 'var(--card,#fff)',
                cursor:'pointer', textAlign:'left', transition:'all .18s',
                fontFamily:"'Outfit',sans-serif",
              }}
            >
              <span style={{ fontSize:26, flexShrink:0 }}>{g.icon}</span>
              <div>
                <div style={{ fontSize:15, fontWeight:800, color:'var(--heading)', marginBottom:2 }}>{g.label}</div>
                <div style={{ fontSize:12, color:'var(--subtext)', fontWeight:500 }}>{g.sub}</div>
              </div>
              {goal===g.id && <span style={{ marginLeft:'auto', color:'#0e7490', fontSize:18 }}>✓</span>}
            </button>
          ))}
        </div>
        <button
          className="b bp"
          style={{ fontSize:16, padding:'14px', width:'100%', opacity: goal ? 1 : 0.5 }}
          disabled={!goal}
          onClick={() => setStep(2)}
        >
          Continue →
        </button>
      </div>
    </div>
  );

  // ── Step 2: Daily goal ────────────────────────────────────────────────────
  if (step === 2) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', padding:24, position:'relative', zIndex:1 }}>
      <div style={{ maxWidth:460, width:'100%', animation:'rise .4s' }}>
        <StepDots step={2} />
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, color:'var(--heading)', fontWeight:900, marginBottom:6, textAlign:'center' }}>
          How much time each day?
        </h2>
        <p style={{ color:'var(--subtext)', fontSize:14, textAlign:'center', marginBottom:24 }}>Consistency beats intensity every time</p>
        <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:24 }}>
          {DAILY_GOALS.map(g => (
            <button
              key={g.id}
              onClick={() => setDailyMin(g.id)}
              style={{
                display:'flex', alignItems:'center', gap:14, padding:'14px 18px',
                borderRadius:14, border:`2px solid ${dailyMin===g.id?'#0e7490':'var(--inp-b,#e2e8f0)'}`,
                background: dailyMin===g.id ? 'rgba(14,116,144,.07)' : 'var(--card,#fff)',
                cursor:'pointer', textAlign:'left', transition:'all .18s',
                fontFamily:"'Outfit',sans-serif",
              }}
            >
              <span style={{ fontSize:22, fontWeight:900, color: dailyMin===g.id?'#0e7490':'var(--subtext)', minWidth:44, textAlign:'center' }}>{g.label}</span>
              <div>
                <div style={{ fontSize:13, color:'var(--subtext)', fontWeight:600 }}>{g.sub}</div>
              </div>
              {dailyMin===g.id && <span style={{ marginLeft:'auto', color:'#0e7490', fontSize:18 }}>✓</span>}
            </button>
          ))}
        </div>
        <button
          className="b bp"
          style={{ fontSize:16, padding:'14px', width:'100%', marginBottom:12, opacity: dailyMin ? 1 : 0.5 }}
          disabled={!dailyMin}
          onClick={startPlacement}
        >
          Take the placement test →
        </button>
        <p style={{ color:'var(--subtext)', fontSize:12, textAlign:'center' }}>
          8 quick questions · takes about 2 minutes
        </p>
      </div>
    </div>
  );

  return null;
}

function StepDots({ step }) {
  return (
    <div style={{ display:'flex', justifyContent:'center', gap:6, marginBottom:24 }}>
      {[1,2].map(i => (
        <div key={i} style={{
          width: i===step ? 22 : 8, height:8, borderRadius:4,
          background: i===step ? '#0e7490' : 'var(--bar-bg,#e2e8f0)',
          transition:'all .25s',
        }} />
      ))}
    </div>
  );
}
