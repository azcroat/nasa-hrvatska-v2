import { useState } from 'react';
import { sh, PLACE, speak } from '../../data.jsx';
import CroatianGrb from '../shared/CroatianGrb.jsx';

const GOALS = [
  { id: 'heritage', icon: '🇭🇷', label: 'My heritage & roots', sub: 'Connect with where I came from' },
  { id: 'family',   icon: '👨‍👩‍👧', label: 'Speak with family', sub: 'Talk to parents, grandparents, relatives' },
  { id: 'partner',  icon: '💑',  label: 'My partner is Croatian', sub: 'Navigate family gatherings, impress their parents' },
  { id: 'travel',   icon: '✈️',  label: 'Travel to Croatia',  sub: 'Navigate, meet locals, feel at home' },
  { id: 'culture',  icon: '📖',  label: 'Love the culture',   sub: 'Music, history, food, football' },
  { id: 'fluent',   icon: '🗣️',  label: 'Become fluent',      sub: 'Full conversational ability in Croatian' },
];

const DAILY_GOALS = [
  { id: 5,  label: '5 min',  sub: 'Light — just a few words a day' },
  { id: 10, label: '10 min', sub: 'Steady — the most popular choice' },
  { id: 15, label: '15 min', sub: 'Committed — you\'ll be conversational faster' },
  { id: 20, label: '20 min', sub: 'Serious — fluency is your goal' },
];

export default function WelcomeScreen({ name, au, st, setScr, setName, sPq, sPi, sPs, sPa, sPx }) {
  const [step, setStep] = useState(0); // 0=hero, 1=goal, 2=daily, 3=heritage/partner
  const [goal, setGoal] = useState('');
  const [dailyMin, setDailyMin] = useState(0);
  const [showSpeakModal, setShowSpeakModal] = useState(false);
  const [selectedGen, setSelectedGen] = useState(localStorage.getItem('nh_heritage_gen') || '');

  function startPlacement() {
    if (!name && au) setName(au.d);
    if (goal) {
      localStorage.setItem('nh_goal', goal);
      localStorage.setItem('nh_goal_set_date', String(Date.now()));
    }
    if (dailyMin) localStorage.setItem('nh_daily_min', String(dailyMin));
    if (localStorage.getItem('nh_heritage_region')) {
      localStorage.setItem('nh_heritage_saved', 'true');
    }
    localStorage.setItem('onboarded', 'true');
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
        <StepDots step={0} />
        <div style={{ display:'flex', justifyContent:'center', marginBottom:20 }}>
          <CroatianGrb size={120} style={{ filter:'drop-shadow(0 6px 20px rgba(0,0,0,0.25))' }} />
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
        <button
          className="b bp"
          style={{ fontSize:17, padding:'14px 48px', width:'100%', marginBottom:12 }}
          onClick={() => setStep(1)}
        >
          <span style={{ display:'block', fontWeight:900 }}>Počnimo!</span>
          <span style={{ display:'block', fontSize:13, fontWeight:600, opacity:0.85, marginTop:2 }}>Let's begin →</span>
        </button>
        {!!au && (
          <button className="b bg" style={{ fontSize:13, padding:'13px 24px', width:'100%' }} onClick={() => setScr('dashboard')}>
            Already signed in? Continue →
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
        <p style={{ color:'var(--subtext)', fontSize:14, textAlign:'center', marginBottom:24 }}>
          This shapes what we show you first
        </p>
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
          onClick={() => {
            if (goal === 'heritage' || goal === 'family' || goal === 'partner') {
              setStep(3);
            } else {
              setShowSpeakModal(true);
            }
          }}
        >
          Take the placement test →
        </button>
        <p style={{ color:'var(--subtext)', fontSize:12, textAlign:'center' }}>
          8 quick questions · takes about 2 minutes
        </p>
        <button
          onClick={() => { localStorage.setItem('nh_placement_done', 'true'); startPlacement(); }}
          style={{ display:'block', width:'100%', marginTop:8, background:'none', border:'none', cursor:'pointer', fontSize:12, color:'var(--subtext)', padding:'10px', fontFamily:"'Outfit',sans-serif" }}
        >
          Skip test — start as beginner
        </button>
        {showSpeakModal && (
          <div style={{
            position:'fixed', inset:0, background:'rgba(0,0,0,.65)', zIndex:100,
            display:'flex', alignItems:'center', justifyContent:'center', padding:20,
          }}>
            <div style={{
              background:'#fff', borderRadius:24, padding:'32px 24px',
              maxWidth:360, width:'100%', textAlign:'center',
              animation:'rise .4s',
              fontFamily:"'Outfit',sans-serif",
            }}>
              <div style={{fontSize:52, marginBottom:8}}>🎤</div>
              <h2 style={{fontFamily:"'Playfair Display',serif", fontSize:22, color:'#0c4a6e', marginBottom:6}}>
                Say your first word
              </h2>
              <p style={{fontSize:13, color:'#64748b', marginBottom:20, lineHeight:1.5}}>
                Before we start, let's say the most important word in Croatian:
              </p>
              <button
                onClick={() => speak('Bog')}
                style={{
                  width:'100%', padding:'20px', borderRadius:16, marginBottom:16, cursor:'pointer',
                  background:'linear-gradient(135deg,#0e7490,#164e63)',
                  border:'none', fontFamily:"'Outfit',sans-serif",
                  display:'flex', flexDirection:'column', alignItems:'center', gap:4,
                }}
              >
                <span style={{fontSize:36, fontWeight:900, color:'#fff', fontFamily:"'Playfair Display',serif"}}>Bog</span>
                <span style={{fontSize:14, color:'rgba(255,255,255,.8)', fontWeight:600}}>Hello / Hi — tap to hear it 🔊</span>
              </button>
              <p style={{fontSize:12, color:'#94a3b8', marginBottom:20, fontStyle:'italic'}}>
                Now you say it! Repeat after the audio.
              </p>
              <button
                className="b bp"
                style={{width:'100%', fontSize:15, padding:'14px'}}
                onClick={() => { setShowSpeakModal(false); startPlacement(); }}
              >
                I said it! Take the test →
              </button>
              <button
                onClick={() => { setShowSpeakModal(false); startPlacement(); }}
                style={{marginTop:10, background:'none', border:'none', cursor:'pointer', fontSize:12, color:'#94a3b8', fontFamily:"'Outfit',sans-serif", padding:'8px'}}
              >
                Skip
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ── Step 3: Heritage Profile (heritage/family goal only) ─────────────────
  if (step === 3) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', padding:24, position:'relative', zIndex:1 }}>
      <div style={{ maxWidth:460, width:'100%', animation:'rise .4s' }}>
        <StepDots step={2} />
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:24, color:'var(--heading)', fontWeight:900, marginBottom:6, textAlign:'center' }}>
          {goal === 'partner' ? 'Tell us about your partner 💑' : 'Tell us about your roots 🇭🇷'}
        </h2>
        <p style={{ color:'var(--subtext)', fontSize:13, textAlign:'center', marginBottom:24 }}>
          {goal === 'partner' ? "We'll teach you the words that matter most at family gatherings" : 'This helps us personalize your content (totally optional)'}
        </p>

        <div style={{ marginBottom:16 }}>
          <label style={{ fontSize:13, fontWeight:700, color:'var(--heading)', display:'block', marginBottom:6 }}>
            Where is your family from?
          </label>
          <select
            onChange={(e) => localStorage.setItem('nh_heritage_region', e.target.value)}
            defaultValue={localStorage.getItem('nh_heritage_region') || ''}
            style={{ width:'100%', padding:'12px 14px', borderRadius:12, border:'1.5px solid var(--inp-b)', background:'var(--card)', color:'var(--heading)', fontSize:14, fontFamily:"'Outfit',sans-serif" }}
          >
            <option value="">Choose a region...</option>
            <option value="dalmatia">Dalmatia (Split, Dubrovnik, islands)</option>
            <option value="zagreb">Zagreb &amp; surroundings</option>
            <option value="istria">Istria &amp; Kvarner</option>
            <option value="slavonia">Slavonia &amp; Baranja</option>
            <option value="hercegovina">Herzegovina &amp; Bosanska Hrvatska</option>
            <option value="lika">Lika &amp; Gorski Kotar</option>
            <option value="other">Other / Not sure</option>
          </select>
        </div>

        <div style={{ marginBottom:24 }}>
          <label style={{ fontSize:13, fontWeight:700, color:'var(--heading)', display:'block', marginBottom:6 }}>
            Your generation
          </label>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {[
              { id: 'first', label: "I'm from Croatia", sub: 'Born or raised there' },
              { id: 'second', label: 'My parents are Croatian', sub: '2nd generation diaspora' },
              { id: 'third', label: 'My grandparents are Croatian', sub: '3rd generation diaspora' },
              { id: 'fourth', label: 'Great-grandparents or further', sub: '4th+ generation' },
            ].map(g => {
              const sel = selectedGen === g.id;
              return (
                <button
                  key={g.id}
                  onClick={() => { localStorage.setItem('nh_heritage_gen', g.id); setSelectedGen(g.id); }}
                  style={{
                    display:'flex', alignItems:'center', gap:12, padding:'12px 16px',
                    borderRadius:12, border:`1.5px solid ${sel ? '#0e7490' : 'var(--inp-b)'}`,
                    background: sel ? 'rgba(14,116,144,.07)' : 'var(--card)',
                    cursor:'pointer', textAlign:'left', fontFamily:"'Outfit',sans-serif",
                  }}
                >
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:'var(--heading)' }}>{g.label}</div>
                    <div style={{ fontSize:11, color:'var(--subtext)' }}>{g.sub}</div>
                  </div>
                  {sel && <span style={{ marginLeft:'auto', color:'#0e7490' }}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        <button className="b bp" style={{ fontSize:15, padding:'14px', width:'100%', marginBottom:10 }}
          onClick={() => setShowSpeakModal(true)}>
          Continue →
        </button>
        <button onClick={() => setShowSpeakModal(true)}
          style={{ display:'block', width:'100%', background:'none', border:'none', cursor:'pointer', fontSize:12, color:'var(--subtext)', padding:'10px', fontFamily:"'Outfit',sans-serif" }}>
          Skip this step
        </button>
        {showSpeakModal && (
          <div style={{
            position:'fixed', inset:0, background:'rgba(0,0,0,.65)', zIndex:100,
            display:'flex', alignItems:'center', justifyContent:'center', padding:20,
          }}>
            <div style={{
              background:'#fff', borderRadius:24, padding:'32px 24px',
              maxWidth:360, width:'100%', textAlign:'center',
              animation:'rise .4s',
              fontFamily:"'Outfit',sans-serif",
            }}>
              <div style={{fontSize:52, marginBottom:8}}>🎤</div>
              <h2 style={{fontFamily:"'Playfair Display',serif", fontSize:22, color:'#0c4a6e', marginBottom:6}}>
                Say your first word
              </h2>
              <p style={{fontSize:13, color:'#64748b', marginBottom:20, lineHeight:1.5}}>
                Before we start, let's say the most important word in Croatian:
              </p>
              <button
                onClick={() => speak('Bog')}
                style={{
                  width:'100%', padding:'20px', borderRadius:16, marginBottom:16, cursor:'pointer',
                  background:'linear-gradient(135deg,#0e7490,#164e63)',
                  border:'none', fontFamily:"'Outfit',sans-serif",
                  display:'flex', flexDirection:'column', alignItems:'center', gap:4,
                }}
              >
                <span style={{fontSize:36, fontWeight:900, color:'#fff', fontFamily:"'Playfair Display',serif"}}>Bog</span>
                <span style={{fontSize:14, color:'rgba(255,255,255,.8)', fontWeight:600}}>Hello / Hi — tap to hear it 🔊</span>
              </button>
              <p style={{fontSize:12, color:'#94a3b8', marginBottom:20, fontStyle:'italic'}}>
                Now you say it! Repeat after the audio.
              </p>
              <button
                className="b bp"
                style={{width:'100%', fontSize:15, padding:'14px'}}
                onClick={() => { setShowSpeakModal(false); startPlacement(); }}
              >
                I said it! Take the test →
              </button>
              <button
                onClick={() => { setShowSpeakModal(false); startPlacement(); }}
                style={{marginTop:10, background:'none', border:'none', cursor:'pointer', fontSize:12, color:'#94a3b8', fontFamily:"'Outfit',sans-serif", padding:'8px'}}
              >
                Skip
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return null;
}

// 3-step indicator — dots fill left to right as user advances
function StepDots({ step }) {
  return (
    <div style={{ display:'flex', justifyContent:'center', gap:6, marginBottom:24 }}>
      {[0,1,2].map(i => (
        <div key={i} style={{
          width: i===step ? 22 : 8, height:8, borderRadius:4,
          background: i<=step ? '#0e7490' : 'var(--bar-bg,#e2e8f0)',
          transition:'all .25s',
        }} />
      ))}
    </div>
  );
}
