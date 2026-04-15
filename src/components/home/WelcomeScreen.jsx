import { useState, useRef, useEffect } from 'react';
import { sh, PLACE, speak } from '../../data.jsx';
import CroatianGrb from '../shared/CroatianGrb.jsx';
import CroatianKnight from '../shared/CroatianKnight';

const GOALS = [
  { id: 'heritage', icon: '🇭🇷', label: 'My heritage & roots', sub: 'Connect with where I came from' },
  { id: 'family',   icon: '👨‍👩‍👧', label: 'Speak with family', sub: 'Talk to parents, grandparents, relatives' },
  { id: 'elders',   icon: '👴👵', label: 'Za bake i djedove', sub: 'Connect with elderly relatives before time runs out' },
  { id: 'partner',  icon: '💑',  label: 'My partner is Croatian', sub: 'Navigate family gatherings, impress their parents' },
  { id: 'travel',   icon: '✈️',  label: 'Travel to Croatia',  sub: 'Navigate, meet locals, feel at home' },
  { id: 'culture',  icon: '📖',  label: 'Love the culture',   sub: 'Music, history, food, football' },
  { id: 'fluent',   icon: '🗣️',  label: 'Become fluent',      sub: 'Full conversational ability in Croatian' },
];

const DAILY_GOALS = [
  { id: 5,  label: '5 min',  sub: 'Light — just a few words a day' },
  { id: 10, label: '10 min', sub: 'Steady — the most popular choice' },
  { id: 15, label: '15 min', sub: 'Committed — you\'ll be conversational faster' },
  { id: 20, label: '20 min', sub: 'Serious — your fastest path to real Croatian' },
];

export default function WelcomeScreen({ name, au, st, setScr, setName, setPlacementQ, setPlacementIdx, setPlacementScore, setPlacementAnswers, setPlacementXp }) {
  const [step, setStep] = useState(0); // 0=hero, 1=goal, 2=daily, 3=heritage/partner
  const [goal, setGoal] = useState('');
  const [dailyMin, setDailyMin] = useState(0);
  const [showSpeakModal, setShowSpeakModal] = useState(false);
  const [selectedGen, setSelectedGen] = useState(localStorage.getItem('nh_heritage_gen') || '');

  // Focus trap refs for the speak modal
  const modalRef = useRef(null);
  const triggerRefStep2 = useRef(null);
  const triggerRefStep3 = useRef(null);

  // Move focus into modal and trap it when open
  useEffect(() => {
    if (!showSpeakModal) return undefined;
    const focusable = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable?.length) focusable[0].focus();
    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return;
      const elements = [...focusable];
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showSpeakModal]);

  // Return focus to trigger when modal closes
  useEffect(() => {
    if (!showSpeakModal) {
      const trigger = step === 2 ? triggerRefStep2.current : triggerRefStep3.current;
      if (trigger) trigger.focus();
    }
   
  }, [showSpeakModal]);

  function startPlacement() {
    if (!name && au) setName(au.d);
    if (goal) {
      localStorage.setItem('nh_goal', goal);
      localStorage.setItem('nh_goal_set', '1');
      localStorage.setItem('nh_goal_set_date', String(Date.now()));
    }
    if (dailyMin) localStorage.setItem('nh_daily_min', String(dailyMin));
    if (localStorage.getItem('nh_heritage_region')) {
      localStorage.setItem('nh_heritage_saved', 'true');
    }
    localStorage.setItem('onboarded', 'true');
    const b = sh(PLACE.filter(x => x.d === 1)).slice(0, 5);
    const m = sh(PLACE.filter(x => x.d === 2)).slice(0, 5);
    const a = sh(PLACE.filter(x => x.d === 3)).slice(0, 5);
    const q = [...b, ...m, ...a].map(q => {
      const c = q.o[q.c];
      const o = sh([...q.o]);
      return { ...q, o, c: o.indexOf(c) };
    });
    setPlacementQ(q); setPlacementIdx(0); setPlacementScore(0); setPlacementAnswers(false); setPlacementXp(-1);
    setScr('placement');
  }

  // ── Step 0: Hero ──────────────────────────────────────────────────────────
  if (step === 0) return (
    <div style={{
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      minHeight:'100vh', padding:'clamp(14px, 4vw, 24px)', position:'relative', zIndex:1,
      background:'linear-gradient(160deg, #060e1e 0%, #0a2348 40%, #0c3868 100%)',
    }}>
      {/* Gold accent line */}
      <div style={{ position:'fixed', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg, transparent, #C8980A 20%, #FFE070 50%, #C8980A 80%, transparent)', zIndex:10 }}/>
      <div style={{ textAlign:'center', maxWidth:460, animation:'rise .6s' }}>
        <StepDots step={0} dark />
        <div style={{ display:'flex', justifyContent:'center', marginBottom:20 }}>
          <CroatianGrb size={120} style={{ filter:'drop-shadow(0 8px 24px rgba(0,0,0,0.35))' }} />
        </div>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:'var(--text-4xl)', color:'white', fontWeight:900, marginBottom:8, lineHeight:1.15 }}>
          Naša Hrvatska
        </h1>
        <CroatianKnight size={110} mood="celebrating" style={{margin:'8px auto', display:'block'}} />
        <p style={{ color:'rgba(255,255,255,0.8)', fontSize:'var(--text-lg)', marginBottom:8 }}>
          Croatian for the diaspora — made with love 🇭🇷
        </p>
        {(name || au?.d) && (
          <p style={{ color:'rgba(255,255,255,0.7)', fontSize:'var(--text-md)', marginBottom:28 }}>
            Bog, <span style={{ color:'#FFE070', fontWeight:700 }}>{name || au?.d}</span>!
          </p>
        )}
        <div style={{ background:'rgba(255,255,255,0.1)', borderRadius:16, padding:'16px 20px', marginBottom:28, border:'1px solid rgba(255,255,255,0.15)', textAlign:'left' }}>
          <div style={{ display:'flex', gap:12, marginBottom:10 }}>
            <span style={{ fontSize:18 }}>🌍</span><span style={{ fontSize:'var(--text-sm)', color:'rgba(255,255,255,0.75)', fontWeight:600 }}>By diaspora, for diaspora — built by Croatian-Americans who know the struggle</span>
          </div>
          <div style={{ display:'flex', gap:12, marginBottom:10 }}>
            <span style={{ fontSize:18 }}>👨‍👩‍👧</span><span style={{ fontSize:'var(--text-sm)', color:'rgba(255,255,255,0.75)', fontWeight:600 }}>Family leaderboard — compete with cousins, siblings, and Baka</span>
          </div>
          <div style={{ display:'flex', gap:12 }}>
            <span style={{ fontSize:18 }}>🇭🇷</span><span style={{ fontSize:'var(--text-sm)', color:'rgba(255,255,255,0.75)', fontWeight:600 }}>Authentic content — real songs, real stories, real Croatian (not tourist phrases)</span>
          </div>
        </div>
        <button
          className="b bp"
          style={{ fontSize:'var(--text-lg)', padding:'14px 48px', width:'100%', marginBottom:12 }}
          onClick={() => setStep(1)}
        >
          <span style={{ display:'block', fontWeight:900 }}>Počnimo!</span>
          <span style={{ display:'block', fontSize:'var(--text-sm)', fontWeight:600, opacity:0.85, marginTop:2 }}>Let's begin →</span>
        </button>
        {!!au && (
          <button className="b bg" style={{ fontSize:'var(--text-sm)', padding:'13px 24px', width:'100%' }} onClick={() => setScr('dashboard')}>
            Already signed in? Continue →
          </button>
        )}
      </div>
    </div>
  );

  // ── Step 1: Why are you learning? ─────────────────────────────────────────
  if (step === 1) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', padding:'clamp(14px, 4vw, 24px)', position:'relative', zIndex:1 }}>
      <div style={{ maxWidth:460, width:'100%', animation:'rise .4s' }}>
        <StepDots step={1} />
        <CroatianKnight
          size={72}
          mood="happy"
          style={{ margin: '0 auto 8px', display: 'block' }}
        />
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, color:'var(--heading)', fontWeight:900, marginBottom:6, textAlign:'center' }}>
          What's your story?
        </h2>
        <p style={{ color:'var(--subtext)', fontSize:'var(--text-base)', textAlign:'center', marginBottom:24 }}>
          This shapes your learning path — so every lesson fits you personally.
        </p>
        <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:24 }}>
          {GOALS.map(g => (
            <button
              key={g.id}
              onClick={() => setGoal(g.id)}
              style={{
                display:'flex', alignItems:'center', gap:14, padding:'14px 18px',
                borderRadius:14,
                border: goal===g.id ? '2px solid var(--info)' : '2px solid var(--card-b)',
                background: goal===g.id ? 'rgba(14,116,144,.1)' : 'var(--card)',
                cursor:'pointer', textAlign:'left', transition:'all .18s',
                fontFamily:"'Outfit',sans-serif",
                transform: goal===g.id ? 'scale(1.02)' : 'scale(1)',
                boxShadow: goal===g.id ? '0 0 0 3px rgba(14,116,144,0.5)' : 'none',
              }}
            >
              <span style={{
                fontSize:22, flexShrink:0, width:40, height:40, borderRadius:'50%',
                display:'flex', alignItems:'center', justifyContent:'center',
                background: goal===g.id ? 'rgba(14,116,144,.15)' : 'transparent',
                transition:'background .18s',
              }}>{g.icon}</span>
              <div>
                <div style={{ fontSize:'var(--text-md)', fontWeight:800, color:'var(--heading)', marginBottom:2 }}>{g.label}</div>
                <div style={{ fontSize:'var(--text-sm)', color:'var(--subtext)', fontWeight:500 }}>{g.sub}</div>
              </div>
              {goal===g.id && <span style={{ marginLeft:'auto', color:'var(--info)', fontSize:18 }}>✓</span>}
            </button>
          ))}
        </div>
        {!goal && (
          <p style={{
            fontSize: 12,
            color: 'var(--subtext)',
            textAlign: 'center',
            marginBottom: 8,
            opacity: 0.8,
          }}>
            👆 Choose your goal above to continue
          </p>
        )}
        <button
          className="b bp"
          style={{ fontSize:'var(--text-lg)', padding:'14px', width:'100%', opacity: goal ? 1 : 0.5 }}
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
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', padding:'clamp(14px, 4vw, 24px)', position:'relative', zIndex:1 }}>
      <div style={{ maxWidth:460, width:'100%', animation:'rise .4s' }}>
        <StepDots step={2} />
        <CroatianKnight
          size={72}
          mood="thinking"
          style={{ margin: '0 auto 8px', display: 'block' }}
        />
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, color:'var(--heading)', fontWeight:900, marginBottom:6, textAlign:'center' }}>
          How much time each day?
        </h2>
        <p style={{ color:'var(--subtext)', fontSize:'var(--text-base)', textAlign:'center', marginBottom:24 }}>Consistency beats intensity every time</p>
        <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:24 }}>
          {DAILY_GOALS.map(g => (
            <button
              key={g.id}
              onClick={() => setDailyMin(g.id)}
              style={{
                display:'flex', alignItems:'center', gap:14, padding:'14px 18px',
                borderRadius:14,
                border: dailyMin===g.id ? '2px solid var(--info)' : '2px solid var(--card-b)',
                background: dailyMin===g.id ? 'rgba(14,116,144,.1)' : 'var(--card)',
                cursor:'pointer', textAlign:'left', transition:'all .18s',
                fontFamily:"'Outfit',sans-serif",
                transform: dailyMin===g.id ? 'scale(1.02)' : 'scale(1)',
                boxShadow: dailyMin===g.id ? '0 0 0 3px rgba(14,116,144,0.5)' : 'none',
              }}
            >
              <span style={{ fontSize:22, fontWeight:900, color: dailyMin===g.id?'var(--info)':'var(--subtext)', minWidth:44, textAlign:'center' }}>{g.label}</span>
              <div>
                <div style={{ fontSize:'var(--text-sm)', color:'var(--subtext)', fontWeight:600 }}>{g.sub}</div>
              </div>
              {dailyMin===g.id && <span style={{ marginLeft:'auto', color:'var(--info)', fontSize:18 }}>✓</span>}
            </button>
          ))}
        </div>
        <div style={{
          background: 'rgba(14,116,144,0.15)',
          border: '1px solid rgba(14,116,144,0.3)',
          borderRadius: 10,
          padding: '10px 14px',
          marginBottom: 20,
          fontSize: 'var(--text-sm)',
          color: 'rgba(255,255,255,0.85)',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          📊 Quick level check: 15 questions, ~3 minutes — places you at the right starting point
        </div>
        {!dailyMin && (
          <p style={{
            fontSize: 12,
            color: 'var(--subtext)',
            textAlign: 'center',
            marginBottom: 8,
            opacity: 0.8,
          }}>
            👆 Pick a daily goal above to continue
          </p>
        )}
        <button
          ref={triggerRefStep2}
          className="b bp"
          style={{ fontSize:'var(--text-lg)', padding:'14px', width:'100%', marginBottom:12, opacity: dailyMin ? 1 : 0.5 }}
          disabled={!dailyMin}
          onClick={() => {
            if (goal === 'heritage' || goal === 'family' || goal === 'partner' || goal === 'elders') {
              setStep(3);
            } else {
              setShowSpeakModal(true);
            }
          }}
        >
          Take the placement test →
        </button>
        <button
          onClick={() => { localStorage.setItem('nh_placement_done', 'true'); startPlacement(); }}
          style={{
            background: 'none',
            border: '1px solid var(--card-b)',
            borderRadius: 10,
            padding: '12px 20px',
            color: 'var(--subtext)',
            fontSize: 'var(--text-sm)',
            cursor: 'pointer',
            marginTop: 8,
            width: '100%',
            fontFamily: 'inherit'
          }}
        >
          Skip test — start as beginner
        </button>
        {showSpeakModal && (
          <div ref={modalRef} role="dialog" aria-modal="true" aria-label="Say your first Croatian word" style={{
            position:'fixed', inset:0, background:'rgba(0,0,0,.65)', zIndex:100,
            display:'flex', alignItems:'center', justifyContent:'center', padding:20,
          }}>
            <div style={{
              background:'var(--card)', borderRadius:24, padding:'32px 24px',
              maxWidth:360, width:'100%', textAlign:'center',
              animation:'rise .4s',
              fontFamily:"'Outfit',sans-serif",
            }}>
              <div style={{fontSize:52, marginBottom:8}}>🎤</div>
              <h2 style={{fontFamily:"'Playfair Display',serif", fontSize:22, color:'var(--heading)', marginBottom:6}}>
                Say your first word
              </h2>
              <p style={{fontSize:'var(--text-sm)', color:'var(--subtext)', marginBottom:20, lineHeight:1.5}}>
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
                <span style={{fontSize:'var(--text-base)', color:'rgba(255,255,255,.8)', fontWeight:600}}>Hello / Hi — tap to hear it <span aria-hidden="true">🔊</span></span>
              </button>
              <p style={{fontSize:'var(--text-sm)', color:'var(--subtext)', marginBottom:20, fontStyle:'italic'}}>
                Now you say it! Repeat after the audio.
              </p>
              <button
                className="b bp"
                style={{width:'100%', fontSize:'var(--text-md)', padding:'14px'}}
                onClick={() => { setShowSpeakModal(false); startPlacement(); }}
              >
                I said it! Take the test →
              </button>
              <button
                onClick={() => { setShowSpeakModal(false); startPlacement(); }}
                style={{
                  background: 'none',
                  border: '1px solid var(--card-b)',
                  borderRadius: 10,
                  padding: '12px 20px',
                  color: 'var(--subtext)',
                  fontSize: 'var(--text-sm)',
                  cursor: 'pointer',
                  marginTop: 8,
                  width: '100%',
                  fontFamily: 'inherit'
                }}
              >
                Skip speaking — continue to test
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ── Step 3: Heritage Profile (heritage/family goal only) ─────────────────
  if (step === 3) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', padding:'clamp(14px, 4vw, 24px)', position:'relative', zIndex:1 }}>
      <div style={{ maxWidth:460, width:'100%', animation:'rise .4s' }}>
        <StepDots step={3} />
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:24, color:'var(--heading)', fontWeight:900, marginBottom:6, textAlign:'center' }}>
          {goal === 'partner' ? 'Tell us about your partner 💑'
            : goal === 'elders' ? 'Tell us about your family 👴👵'
            : 'Tell us about your roots 🇭🇷'}
        </h2>
        <p style={{ color:'var(--subtext)', fontSize:'var(--text-sm)', textAlign:'center', marginBottom:24 }}>
          {goal === 'partner' ? "We'll teach you the words that matter most at family gatherings"
            : goal === 'elders' ? 'Every conversation is precious — we\'ll focus on what matters most right now'
            : 'This helps us personalize your content (totally optional)'}
        </p>

        <div style={{ marginBottom:16 }}>
          <label style={{ fontSize:'var(--text-sm)', fontWeight:700, color:'var(--heading)', display:'block', marginBottom:6 }}>
            {goal === 'partner' ? 'Where is your partner from?' : 'Where is your family from?'}
          </label>
          <select
            onChange={(e) => localStorage.setItem('nh_heritage_region', e.target.value)}
            defaultValue={localStorage.getItem('nh_heritage_region') || ''}
            style={{ width:'100%', padding:'12px 14px', borderRadius:12, border:'1.5px solid var(--card-b)', background:'var(--card)', color:'var(--heading)', fontSize:'var(--text-base)', fontFamily:"'Outfit',sans-serif" }}
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
          <label style={{ fontSize:'var(--text-sm)', fontWeight:700, color:'var(--heading)', display:'block', marginBottom:6 }}>
            {goal === 'partner' ? 'Tell us about your partner'
              : goal === 'elders' ? 'Who are you hoping to connect with?'
              : 'Your generation'}
          </label>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {(goal === 'partner' ? [
              { id: 'partner_native',   label: "My partner is Croatian-born 🇭🇷",       sub: 'Born or raised in Croatia' },
              { id: 'partner_heritage', label: "My partner's parents are Croatian 🌍",   sub: '2nd generation diaspora' },
              { id: 'partner_extended', label: "My partner has Croatian family ties 👨‍👩‍👧", sub: 'Extended Croatian family' },
            ] : goal === 'elders' ? [
              { id: 'elders_baka',      label: 'Baka i djed 👴👵',                        sub: 'Grandparents — I want them to hear me speak Croatian' },
              { id: 'elders_gathering', label: 'Family gatherings 👨‍👩‍👧',                  sub: 'Weddings, funerals, reunions — I want to be present' },
              { id: 'elders_aging',     label: 'Before it\'s too late ❤️',                sub: 'Reconnecting while there\'s still time' },
              { id: 'elders_general',   label: 'Older relatives generally 🏡',            sub: 'Aunts, uncles, distant family abroad' },
            ] : [
              { id: 'first',  label: "I'm from Croatia",               sub: 'Born or raised there' },
              { id: 'second', label: 'My parents are Croatian',         sub: '2nd generation diaspora' },
              { id: 'third',  label: 'My grandparents are Croatian',    sub: '3rd generation diaspora' },
              { id: 'fourth', label: 'Great-grandparents or further',   sub: '4th+ generation' },
            ]).map(g => {
              const sel = selectedGen === g.id;
              return (
                <button
                  key={g.id}
                  onClick={() => { localStorage.setItem('nh_heritage_gen', g.id); setSelectedGen(g.id); }}
                  style={{
                    display:'flex', alignItems:'center', gap:12, padding:'12px 16px',
                    borderRadius:12,
                    border: sel ? '2px solid var(--info)' : '2px solid var(--card-b)',
                    background: sel ? 'rgba(14,116,144,.1)' : 'var(--card)',
                    cursor:'pointer', textAlign:'left', fontFamily:"'Outfit',sans-serif",
                  }}
                >
                  <div>
                    <div style={{ fontSize:'var(--text-base)', fontWeight:700, color:'var(--heading)' }}>{g.label}</div>
                    <div style={{ fontSize:'var(--text-xs)', color:'var(--subtext)' }}>{g.sub}</div>
                  </div>
                  {sel && <span style={{ marginLeft:'auto', color:'var(--info)' }}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        <button ref={triggerRefStep3} className="b bp" style={{ fontSize:'var(--text-md)', padding:'14px', width:'100%', marginBottom:10 }}
          onClick={() => goal === 'elders' ? setShowSpeakModal(true) : startPlacement()}>
          Continue to test →
        </button>
        <button onClick={() => startPlacement()}
          style={{
            background: 'none',
            border: '1px solid var(--card-b)',
            borderRadius: 10,
            padding: '12px 20px',
            color: 'var(--subtext)',
            fontSize: 'var(--text-sm)',
            cursor: 'pointer',
            marginTop: 8,
            width: '100%',
            fontFamily: 'inherit'
          }}>
          Skip this step
        </button>
        {showSpeakModal && (
          <div ref={modalRef} role="dialog" aria-modal="true" aria-label={goal === 'elders' ? "Your first Croatian phrase" : "Say your first Croatian word"} style={{
            position:'fixed', inset:0, background:'rgba(0,0,0,.65)', zIndex:100,
            display:'flex', alignItems:'center', justifyContent:'center', padding:20,
          }}>
            <div style={{
              background:'var(--card)', borderRadius:24, padding:'32px 24px',
              maxWidth:380, width:'100%', textAlign:'center',
              animation:'rise .4s',
              fontFamily:"'Outfit',sans-serif",
            }}>
              {goal === 'elders' ? (
                <>
                  <div style={{fontSize:52, marginBottom:8}}>❤️</div>
                  <h2 style={{fontFamily:"'Playfair Display',serif", fontSize:22, color:'var(--heading)', marginBottom:10}}>
                    Your first phrase
                  </h2>
                  <div style={{
                    background:'rgba(14,116,144,0.12)',
                    border:'1px solid rgba(14,116,144,0.3)',
                    borderRadius:14,
                    padding:'16px 18px',
                    marginBottom:16,
                    textAlign:'left',
                  }}>
                    <p style={{fontSize:'var(--text-md)', fontWeight:800, color:'var(--heading)', marginBottom:4, fontStyle:'italic', lineHeight:1.4}}>
                      "Učim hrvatski kako bih mogao razgovarati s bakom i djedom."
                    </p>
                    <p style={{fontSize:'var(--text-sm)', color:'var(--subtext)', fontWeight:500, marginBottom:0}}>
                      I'm learning Croatian so I can talk with my grandparents.
                    </p>
                  </div>
                  <button
                    onClick={() => speak('Učim hrvatski kako bih mogao razgovarati s bakom i djedom')}
                    style={{
                      width:'100%', padding:'14px 18px', borderRadius:14, marginBottom:14, cursor:'pointer',
                      background:'linear-gradient(135deg,#0e7490,#164e63)',
                      border:'none', fontFamily:"'Outfit',sans-serif",
                      display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                      color:'#fff', fontSize:'var(--text-sm)', fontWeight:700,
                    }}
                  >
                    <span aria-hidden="true">🔊</span> Hear it in Croatian
                  </button>
                  <p style={{fontSize:'var(--text-sm)', color:'var(--subtext)', marginBottom:20, lineHeight:1.5, fontStyle:'italic'}}>
                    Svaki razgovor je dragocjen — every conversation is precious.
                  </p>
                </>
              ) : (
                <>
                  <div style={{fontSize:52, marginBottom:8}}>🎤</div>
                  <h2 style={{fontFamily:"'Playfair Display',serif", fontSize:22, color:'var(--heading)', marginBottom:6}}>
                    Say your first word
                  </h2>
                  <p style={{fontSize:'var(--text-sm)', color:'var(--subtext)', marginBottom:20, lineHeight:1.5}}>
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
                    <span style={{fontSize:'var(--text-base)', color:'rgba(255,255,255,.8)', fontWeight:600}}>Hello / Hi — tap to hear it <span aria-hidden="true">🔊</span></span>
                  </button>
                  <p style={{fontSize:'var(--text-sm)', color:'var(--subtext)', marginBottom:20, fontStyle:'italic'}}>
                    Now you say it! Repeat after the audio.
                  </p>
                </>
              )}
              <button
                className="b bp"
                style={{width:'100%', fontSize:'var(--text-md)', padding:'14px'}}
                onClick={() => { setShowSpeakModal(false); startPlacement(); }}
              >
                {goal === 'elders' ? "Let's begin — take the test →" : "I said it! Take the test →"}
              </button>
              <button
                onClick={() => { setShowSpeakModal(false); startPlacement(); }}
                style={{
                  background: 'none',
                  border: '1px solid var(--card-b)',
                  borderRadius: 10,
                  padding: '12px 20px',
                  color: 'var(--subtext)',
                  fontSize: 'var(--text-sm)',
                  cursor: 'pointer',
                  marginTop: 8,
                  width: '100%',
                  fontFamily: 'inherit'
                }}
              >
                Skip speaking — continue to test
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
function StepDots({ step, dark = false }) {
  return (
    <div style={{ display:'flex', justifyContent:'center', gap:6, marginBottom:24 }}>
      {[0,1,2,3].map(i => (
        <div key={i} style={{
          width: i===step ? 22 : 8, height:8, borderRadius:4,
          background: i<=step ? (dark ? '#C8980A' : 'var(--info)') : (dark ? 'rgba(255,255,255,0.2)' : 'var(--bar-bg,#e2e8f0)'),
          transition:'all .25s',
        }} />
      ))}
    </div>
  );
}
