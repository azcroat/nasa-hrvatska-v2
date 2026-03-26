import React, { useState, useRef, useMemo } from 'react';
import { getStreak, getSR, fbDeleteAccount } from '../../data.jsx';
import ProgressCharts from './ProgressCharts.jsx';
import { getWeakTopics } from '../../lib/adaptive.js';
import JourneyTimeline from './JourneyTimeline.jsx';

function getCEFR(xp, lc, gc) {
  const total = xp + (lc * 15) + (gc * 25);
  if (total < 300) return { level: 'A1', label: 'Beginner', color: '#16a34a', next: 'A2', needed: 300 };
  if (total < 1200) return { level: 'A2', label: 'Elementary', color: '#65a30d', next: 'B1', needed: 1200 };
  if (total < 3500) return { level: 'B1', label: 'Intermediate', color: '#ca8a04', next: 'B2', needed: 3500 };
  if (total < 8000) return { level: 'B2', label: 'Upper-Int.', color: '#b45309', next: 'C1', needed: 8000 };
  if (total < 18000) return { level: 'C1', label: 'Advanced', color: '#0e7490', next: 'C2', needed: 18000 };
  return { level: 'C2', label: 'Mastery', color: '#7c3aed', next: null, needed: null };
}

function getWordsLearned() {
  try {
    const sr = JSON.parse(localStorage.getItem('nh_sr') || '{}');
    // Count entries where right answers > 0 (been seen at least once correctly)
    return Object.values(sr).filter(v => v && v.r > 0).length;
  } catch(_) { return 0; }
}

const STAGE_CEFR = ['A1', 'A2', 'B1', 'B1+', 'B2+', 'C1'];
const STAGE_NAMES_PROFILE = ['Survivor', 'Settler', 'Communicator', 'Explorer', 'Hrvat!'];
const STAGE_THRESHOLDS = [0, 8, 16, 24, 32]; // lc thresholds for each stage

export default function ProfileTab({ name, au, level, st, favs, darkMode, setDarkMode, setScr, doOut, syncReady, onSyncNow, jWords, onNavigate }) {
  const [confirmOut, setConfirmOut] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);
  const [currentGoal, setCurrentGoal] = useState(() => localStorage.getItem('nh_goal') || '');
  const [showPrestigeModal, setShowPrestigeModal] = useState(false);
  const prestigeLevel = parseInt(localStorage.getItem('nh_prestige') || '0', 10);
  const [imdOpen, setImdOpen] = useState(false);

  const GOALS = [
    { id: 'heritage', icon: '🇭🇷', label: 'My heritage & roots' },
    { id: 'family',   icon: '👨‍👩‍👧', label: 'Speak with family' },
    { id: 'travel',   icon: '✈️',  label: 'Travel to Croatia' },
    { id: 'culture',  icon: '📖',  label: 'Love the culture' },
    { id: 'fluent',   icon: '🗣️',  label: 'Become fluent' },
  ];

  function exportData() {
    const data = {
      exportDate: new Date().toISOString(),
      profile: { name, email: au?.u },
      stats: st,
      streak: { current: getStreak() },
      favourites: favs,
      journal: jWords,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nasa-hrvatska-export-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportDone(true);
    setTimeout(() => setExportDone(false), 3000);
  }

  async function handleDeleteAccount() {
    if (!au || !au.u) return;
    setDeleting(true);
    try {
      await fbDeleteAccount(au.u);
      doOut();
    } catch(e) {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }
  const [letterOpen, setLetterOpen] = useState(false);
  const [letterText, setLetterText] = useState(() => localStorage.getItem('nh_letter_to_self') || '');
  const [syncing, setSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);
  const [syncErr, setSyncErr] = useState(false);
  const doneTimerRef = useRef(null);

  // Memoized so it doesn't re-parse localStorage on every render
  const lastSaved = useMemo(() => {
    if (!au || !au.u) return null;
    try {
      const p = JSON.parse(localStorage.getItem('uP_' + au.u) || 'null');
      return p && p.savedAt ? new Date(p.savedAt) : null;
    } catch { return null; }
  }, [au, syncDone]); // eslint-disable-line react-hooks/exhaustive-deps -- syncDone is intentionally included to force a re-read of localStorage after a successful sync

  async function handleSyncNow() {
    if (syncing) return; // prevent overlapping calls
    if (doneTimerRef.current) clearTimeout(doneTimerRef.current);
    setSyncing(true); setSyncDone(false); setSyncErr(false);
    try {
      const ok = onSyncNow ? await onSyncNow() : true;
      setSyncDone(ok !== false);
      setSyncErr(ok === false);
    } catch {
      setSyncDone(false); setSyncErr(true);
    }
    setSyncing(false);
    doneTimerRef.current = setTimeout(() => { setSyncDone(false); setSyncErr(false); }, 4000);
  }
  const streak = getStreak();
  const sr = getSR();
  const mastered = Object.values(sr).filter(v => v.r > v.w && v.r >= 2).length;

  const stats = [
    { icon: "⭐", value: st.xp.toLocaleString(), label: "Total XP",   color: "#0e7490", bg: "#f0f9ff", border: "#bae6fd" },
    { icon: "🔥", value: streak.count,            label: "Day Streak", color: "#f59e0b", bg: "#fffbeb", border: "#fde68a" },
    { icon: "📚", value: st.lc,                   label: "Lessons",    color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
    { icon: "📝", value: st.gc,                   label: "Grammar",    color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
    { icon: "💪", value: mastered,                label: "Mastered",   color: "#dc2626", bg: "#fff1f2", border: "#fecaca" },
    { icon: "🏆", value: (st.badges||[]).length,  label: "Badges",     color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  ];

  return (
    <React.Fragment>

      {/* ── PROFILE HEADER ── */}
      <div style={{
        background: "linear-gradient(145deg,#0c4a6e 0%,#0e7490 55%,#0369a1 100%)",
        borderRadius: 24, padding: "28px 20px 24px", marginBottom: 16,
        textAlign: "center", color: "white", position: "relative", overflow: "hidden",
        boxShadow: "0 8px 32px rgba(14,116,144,.3)"
      }}>
        <div style={{position:"absolute",top:-40,right:-40,width:160,height:160,background:"rgba(255,255,255,.05)",borderRadius:"50%",pointerEvents:"none"}}/>
        <div style={{position:"absolute",bottom:-30,left:-30,width:100,height:100,background:"rgba(255,255,255,.04)",borderRadius:"50%",pointerEvents:"none"}}/>
        <div style={{
          width: 84, height: 84, borderRadius: "50%",
          background: "rgba(255,255,255,.18)", backdropFilter: "blur(10px)",
          border: "3px solid rgba(255,255,255,.35)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 14px", fontSize: 38, fontWeight: 900, color: "#fff",
          position: "relative"
        }}>
          {name ? name.charAt(0).toUpperCase() : "👤"}
        </div>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:"#fff",marginBottom:4,fontWeight:800,letterSpacing:"-.01em"}}>
          {name || au?.d}
        </h2>
        <div style={{fontSize:13,opacity:.7,marginBottom:2,fontWeight:600}}>Level {level} Learner</div>
        {au?.e && <div style={{fontSize:12,opacity:.5,marginTop:2}}>{au.e}</div>}
      </div>

      {/* ── CLOUD SYNC STATUS ── */}
      <div style={{
        background: syncErr ? "linear-gradient(135deg,#fff1f2,#fee2e2)" : syncReady ? "linear-gradient(135deg,#f0fdf4,#dcfce7)" : "linear-gradient(135deg,#f8fafc,#f1f5f9)",
        border: `1.5px solid ${syncErr ? "#fca5a5" : syncReady ? "#86efac" : "#cbd5e1"}`,
        borderRadius: 16, padding: "14px 16px", marginBottom: 16,
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12, flexShrink: 0,
          background: syncErr ? "linear-gradient(135deg,#dc2626,#b91c1c)" : syncReady ? "linear-gradient(135deg,#16a34a,#15803d)" : "linear-gradient(135deg,#94a3b8,#64748b)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
        }}>
          {syncing ? "⏳" : syncErr ? "⚠️" : syncDone ? "✅" : syncReady ? "☁️" : "📵"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: syncErr ? "#dc2626" : syncReady ? "#15803d" : "#64748b" }}>
            {syncing ? "Saving to cloud…" : syncErr ? "Sync failed — check connection" : syncDone ? "Saved to cloud!" : syncReady ? "Cloud backup active" : "Connecting…"}
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2, fontWeight: 500 }}>
            {lastSaved ? `Last saved: ${lastSaved.toLocaleString()}` : "No local save found"}
          </div>
        </div>
        {syncReady && (
          <button onClick={handleSyncNow} disabled={syncing} style={{
            padding: "12px 16px", borderRadius: 10, border: "none", cursor: syncing ? "default" : "pointer",
            background: syncing ? "#e2e8f0" : syncErr ? "linear-gradient(135deg,#dc2626,#b91c1c)" : "linear-gradient(135deg,#16a34a,#15803d)",
            color: syncing ? "#94a3b8" : "#fff", fontSize: 12, fontWeight: 800,
            fontFamily: "'Outfit',sans-serif", flexShrink: 0, minHeight: 44,
          }}>
            {syncing ? "…" : "Sync Now"}
          </button>
        )}
      </div>

      {/* ── PARTNER GOAL CARD ── */}
      {localStorage.getItem('nh_goal') === 'partner' && (
        <div style={{
          background:'linear-gradient(135deg,rgba(249,168,37,.1),rgba(14,116,144,.08))',
          border:'1.5px solid rgba(249,168,37,.3)',
          borderRadius:16, padding:'16px 18px', marginBottom:16,
        }}>
          <div style={{ fontSize:14, fontWeight:900, color:'var(--heading)', marginBottom:6 }}>
            💑 Learning for your partner
          </div>
          <div style={{ fontSize:12, color:'var(--subtext)', lineHeight:1.6, marginBottom:12 }}>
            You're learning Croatian because someone special is Croatian. That's the most powerful motivation there is.
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {[
              '✓ Learn in-law vocabulary (Svekrva, punac, šogor)',
              '✓ Master the Imendan tradition (see below)',
              '✓ Practice "Survival at the Table" phrases',
              '✓ Say Živjeli! at the right moment',
            ].map((tip, i) => (
              <div key={i} style={{ fontSize:12, color:'var(--subtext)', fontWeight:600 }}>{tip}</div>
            ))}
          </div>
        </div>
      )}

      {/* ── STATS GRID ── */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:24}}>
        {stats.map((s, i) => (
          <div key={i} style={{background:s.bg,border:`1.5px solid ${s.border}`,borderRadius:14,padding:"12px 8px",textAlign:"center"}}>
            <div style={{fontSize:18,marginBottom:3}}>{s.icon}</div>
            <div style={{fontSize:17,fontWeight:900,color:s.color,lineHeight:1,fontVariantNumeric:"tabular-nums"}}>{s.value}</div>
            <div style={{fontSize:11,color:"#94a3b8",fontWeight:700,marginTop:3,textTransform:"uppercase",letterSpacing:".04em"}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── CEFR ESTIMATE ── */}
      {(() => {
        const cefr = getCEFR(st.xp || 0, st.lc || 0, st.gc || 0);
        const wordsLearned = getWordsLearned();
        const cefrScore = (st.xp || 0) + ((st.lc || 0) * 15) + ((st.gc || 0) * 25);
        const progress = cefr.needed ? Math.min(100, Math.round((cefrScore / cefr.needed) * 100)) : 100;
        return (
          <div style={{ background:'var(--card)', border:'1.5px solid var(--card-b)', borderRadius:18, padding:'18px', marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
              <div style={{ width:52, height:52, borderRadius:14, background:cefr.color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <span style={{ fontSize:20, fontWeight:900, color:'#fff' }}>{cefr.level}</span>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:16, fontWeight:900, color:'var(--heading)' }}>CEFR Level: {cefr.level}</div>
                <div style={{ fontSize:12, color:'var(--subtext)', fontWeight:600 }}>{cefr.label}{prestigeLevel > 0 ? ` · ${'✦'.repeat(prestigeLevel)} Prestige` : ''}</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:18, fontWeight:900, color:cefr.color }}>{wordsLearned}</div>
                <div style={{ fontSize:10, color:'var(--subtext)', fontWeight:700 }}>words</div>
              </div>
            </div>
            {cefr.needed && (
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--subtext)', marginBottom:4, fontWeight:600 }}>
                  <span>{cefr.level}</span><span>→ {cefr.next}</span>
                </div>
                <div style={{ height:8, borderRadius:4, background:'var(--bar-bg)', overflow:'hidden' }}>
                  <div style={{ height:'100%', borderRadius:4, background:cefr.color, width:`${progress}%`, transition:'width .4s ease' }} />
                </div>
                <div style={{ fontSize:10, color:'var(--subtext)', marginTop:4, fontWeight:600 }}>{progress}% to {cefr.next}</div>
              </div>
            )}
          </div>
        );
      })()}

      {/* ── PRESTIGE ── */}
      {(st.lc || 0) >= 30 && (
        <div style={{ background:'var(--card)', border:'1.5px solid var(--card-b)', borderRadius:18, padding:'18px', marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:prestigeLevel > 0 ? 12 : 0 }}>
            <div style={{ fontSize:28 }}>{prestigeLevel > 0 ? '✦' : '🏆'}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:15, fontWeight:900, color:'var(--heading)' }}>
                {prestigeLevel > 0 ? `Prestige ${prestigeLevel} — ${'✦'.repeat(prestigeLevel)}` : 'Ready to Prestige?'}
              </div>
              <div style={{ fontSize:12, color:'var(--subtext)', fontWeight:500, lineHeight:1.5, marginTop:2 }}>
                {prestigeLevel > 0 ? 'You have prestiged. Your dedication to Croatian is legendary.' : 'Reset your XP counter and earn the ✦ Prestige badge — wear it as a mark of dedication. Stage 6 "Naš Čovjek" is in development and will be unlocked for prestige members first.'}
              </div>
            </div>
          </div>
          {prestigeLevel === 0 && (
            <button
              onClick={() => setShowPrestigeModal(true)}
              style={{ width:'100%', padding:'12px', borderRadius:12, border:'none', cursor:'pointer', background:'linear-gradient(135deg,#7c3aed,#4c1d95)', color:'#fff', fontWeight:800, fontSize:14, fontFamily:"'Outfit',sans-serif", marginTop:12 }}
            >
              ✦ Prestige Now
            </button>
          )}
        </div>
      )}

      {/* ── LEARN PATH STAGE OVERVIEW ── */}
      <h3 className="sh" style={{marginTop:8}}>Learn Path</h3>
      <div style={{ background:'var(--card)', border:'1.5px solid var(--card-b)', borderRadius:18, padding:'16px 18px', marginBottom:16 }}>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {STAGE_NAMES_PROFILE.map((stageName, i) => {
            const isActive = (st.lc || 0) >= STAGE_THRESHOLDS[i] && (i === STAGE_NAMES_PROFILE.length - 1 || (st.lc || 0) < STAGE_THRESHOLDS[i + 1]);
            const isDone = i < STAGE_NAMES_PROFILE.length - 1 ? (st.lc || 0) >= STAGE_THRESHOLDS[i + 1] : (st.lc || 0) >= STAGE_THRESHOLDS[i];
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                opacity: (st.lc || 0) >= STAGE_THRESHOLDS[i] ? 1 : 0.45,
              }}>
                <span style={{ fontSize: 16 }}>{isDone ? '✅' : isActive ? '▶️' : '⬜'}</span>
                <span style={{ fontSize: 13, fontWeight: isActive ? 800 : 600, color: isActive ? 'var(--heading)' : 'var(--subtext)' }}>
                  Stage {i + 1}: {stageName}
                </span>
                <span style={{
                  fontSize: 9, fontWeight: 800,
                  background: 'rgba(14,116,144,0.15)', color: '#0e7490',
                  borderRadius: 4, padding: '1px 4px', marginLeft: 6,
                }}>
                  {STAGE_CEFR[i]}
                </span>
              </div>
            );
          })}
        </div>

        {/* Stage 6 teaser — show when user has completed Stage 4 or is in Stage 5 */}
        {(st.lc || 0) >= 20 && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(14,116,144,0.08), rgba(22,78,99,0.12))',
            border: '1.5px dashed var(--card-b)',
            borderRadius: 14, padding: '14px 16px', marginTop: 10, opacity: 0.75,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 24 }}>🔒</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--heading)' }}>
                  Stage 6: Naš Čovjek
                  <span style={{
                    fontSize: 9, fontWeight: 800,
                    background: 'rgba(14,116,144,0.15)', color: '#0e7490',
                    borderRadius: 4, padding: '1px 4px', marginLeft: 6,
                  }}>
                    {STAGE_CEFR[5]}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--subtext)', marginTop: 2 }}>
                  Advanced fluency — Shadowing, Pitch Accent, Bureaucratic Croatian, Formal Register
                </div>
              </div>
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: 'var(--subtext)', fontStyle: 'italic' }}>
              Complete Stage 5 to unlock. Coming soon.
            </div>
          </div>
        )}
      </div>

      {/* ── GOAL FOCUS ── */}
      {currentGoal && (() => {
        const GOAL_FOCUS = {
          heritage: { label:'Heritage & Roots', icon:'🇭🇷', color:'#92400e', bg:'#fffbeb', border:'#fde68a',
            items:[{icon:'🏛️',label:'Croatian History',scr:'history'},{icon:'🌟',label:'Proverbs',scr:'proverbs'},{icon:'📖',label:'Reading',scr:'readlist'}] },
          family:   { label:'Speaking with Family', icon:'👨‍👩‍👧', color:'#0e7490', bg:'#f0f9ff', border:'#bae6fd',
            items:[{icon:'🃏',label:'Family Words',scr:'flashcards'},{icon:'🎤',label:'Speaking',scr:'speaking'},{icon:'💬',label:'Dialogue Sim',scr:'dialogue'}] },
          travel:   { label:'Traveling to Croatia', icon:'✈️', color:'#16a34a', bg:'#f0fdf4', border:'#bbf7d0',
            items:[{icon:'🍽️',label:'Restaurant',scr:'restaurant'},{icon:'🚗',label:'Transport',scr:'transport'},{icon:'🚨',label:'Emergency',scr:'emergency'}] },
          culture:  { label:'Croatian Culture', icon:'📖', color:'#7c3aed', bg:'#faf5ff', border:'#ddd6fe',
            items:[{icon:'🌊',label:'Immersion',scr:'immersion'},{icon:'🤖',label:'AI Convo',scr:'aiconvo'},{icon:'🎵',label:'Song Lyrics',scr:'lyrics'}] },
          fluent:   { label:'Becoming Fluent', icon:'🗣️', color:'#0369a1', bg:'#f0f9ff', border:'#bae6fd',
            items:[{icon:'🎓',label:'CEFR Test',scr:'cefrtest'},{icon:'💬',label:'Dialogue Sim',scr:'dialogue'},{icon:'🗣️',label:'Shadowing',scr:'shadowing'}] },
        };
        const gf = GOAL_FOCUS[currentGoal];
        if (!gf) return null;
        return (
          <React.Fragment>
            <h3 className="sh">Goal Focus</h3>
            <div style={{ background:gf.bg, border:`1.5px solid ${gf.border}`, borderRadius:16, padding:'16px', marginBottom:20 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                <span style={{ fontSize:22 }}>{gf.icon}</span>
                <div>
                  <div style={{ fontSize:13, fontWeight:900, color:gf.color }}>{gf.label}</div>
                  <div style={{ fontSize:11, color:'#94a3b8', marginTop:1 }}>Your recommended exercises</div>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
                {gf.items.map(it => (
                  <button key={it.scr}
                    onClick={() => setScr(it.scr)}
                    style={{ background:'var(--card)', border:`1px solid ${gf.border}`, borderRadius:10, padding:'10px 6px', cursor:'pointer', textAlign:'center', fontFamily:"'Outfit',sans-serif" }}>
                    <div style={{ fontSize:20 }}>{it.icon}</div>
                    <div style={{ fontSize:10, fontWeight:700, color:'var(--heading)', marginTop:4, lineHeight:1.2 }}>{it.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </React.Fragment>
        );
      })()}

      {/* ── MY PROGRESS ── */}
      <h3 className="sh">My Progress</h3>
      <ProgressCharts stats={st} />

      {/* ── MY CROATIAN JOURNEY ── */}
      <h3 className="sh" style={{marginTop:24}}>My Croatian Journey</h3>
      <div style={{background:'var(--card)', borderRadius:16, padding:'16px', marginBottom:16, border:'1px solid var(--card-b)'}}>
        <JourneyTimeline />
      </div>

      {/* ── LETTER TO FUTURE ME ── */}
      <div style={{marginBottom:16}}>
        <button
          onClick={() => setLetterOpen(o => !o)}
          style={{
            width:'100%', display:'flex', alignItems:'center', gap:10, padding:'14px 16px',
            background:'var(--card)', border:'1px solid var(--card-b)', borderRadius:14,
            cursor:'pointer', textAlign:'left', fontFamily:"'Outfit',sans-serif",
          }}
        >
          <span style={{fontSize:20}}>💌</span>
          <div style={{flex:1}}>
            <div style={{fontSize:13, fontWeight:800, color:'var(--heading)'}}>Letter to Future Me</div>
            <div style={{fontSize:11, color:'var(--subtext)'}}>Why are you learning Croatian?</div>
          </div>
          <span style={{color:'var(--subtext)',opacity:.5}}>{letterOpen ? '▲' : '▼'}</span>
        </button>
        {letterOpen && (
          <div style={{background:'var(--card)', border:'1px solid var(--card-b)', borderTop:'none', borderRadius:'0 0 14px 14px', padding:'14px 16px'}}>
            <p style={{fontSize:12, color:'var(--subtext)', marginBottom:10, fontStyle:'italic'}}>
              Write a note to your future self about why you're learning Croatian. The app will remind you of this when you hit milestones.
            </p>
            <textarea
              value={letterText}
              onChange={(e) => {
                setLetterText(e.target.value);
                localStorage.setItem('nh_letter_to_self', e.target.value);
              }}
              placeholder="I want to speak Croatian because..."
              style={{
                width:'100%', minHeight:100, padding:'10px 12px', borderRadius:10,
                border:'1.5px solid var(--inp-b)', background:'var(--card)', color:'var(--heading)',
                fontSize:13, fontFamily:"'Outfit',sans-serif", resize:'vertical', boxSizing:'border-box',
              }}
            />
            <div style={{fontSize:10, color:'var(--subtext)', marginTop:6}}>Saved automatically ✓</div>
          </div>
        )}
      </div>

      {/* ── IMENDAN EXPLAINER ──────────────────────────────────────────── */}
      <div style={{
        background:'linear-gradient(135deg,rgba(182,24,0,.07),rgba(0,48,135,.05))',
        border:'1.5px solid rgba(182,24,0,.18)',
        borderRadius:16, padding:'16px 18px', marginBottom:16,
      }}>
        <button
          onClick={() => setImdOpen(o => !o)}
          style={{
            display:'flex', alignItems:'center', gap:12, width:'100%',
            background:'none', border:'none', cursor:'pointer',
            fontFamily:"'Outfit',sans-serif", textAlign:'left',
          }}
        >
          <span style={{ fontSize:28 }}>🎉</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:900, color:'var(--heading)', marginBottom:2 }}>
              What is Imendan?
            </div>
            <div style={{ fontSize:11, color:'var(--subtext)', fontWeight:600 }}>
              The Croatian name day tradition — essential knowledge
            </div>
          </div>
          <span style={{ fontSize:14, color:'var(--subtext)', opacity:.5 }}>{imdOpen ? '▲' : '▼'}</span>
        </button>
        {imdOpen && (
          <div style={{ marginTop:14, borderTop:'1px solid rgba(182,24,0,.12)', paddingTop:14 }}>
            <p style={{ fontSize:13, color:'var(--subtext)', lineHeight:1.7, marginBottom:12 }}>
              In Croatia, every day of the year is associated with one or more saints. If you share your name with a saint, that day is your <strong style={{ color:'var(--heading)' }}>imendan</strong> (name day) — and it's often celebrated just as much as your birthday, if not more.
            </p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
              {[
                { day:'Jan 13', name:'Stjepan (Stephen)', emoji:'🎊' },
                { day:'Mar 19', name:'Josip (Joseph)', emoji:'🎊' },
                { day:'Jun 29', name:'Petar (Peter)', emoji:'🎊' },
                { day:'Aug 15', name:'Marija (Mary)', emoji:'🎊' },
                { day:'Nov 1', name:'Svi Sveti (All Saints)', emoji:'⛪' },
                { day:'Dec 13', name:'Lucija (Lucy)', emoji:'🎊' },
              ].map(m => (
                <div key={m.day} style={{
                  background:'var(--card)', border:'1px solid var(--card-b)',
                  borderRadius:10, padding:'8px 10px',
                }}>
                  <div style={{ fontSize:10, color:'var(--subtext)', fontWeight:700, marginBottom:2 }}>{m.day}</div>
                  <div style={{ fontSize:12, fontWeight:800, color:'var(--heading)' }}>{m.emoji} {m.name}</div>
                </div>
              ))}
            </div>
            <div style={{
              background:'rgba(14,116,144,.08)', borderRadius:12, padding:'12px 14px',
              fontSize:12, color:'var(--subtext)', lineHeight:1.6,
            }}>
              <strong style={{ color:'var(--heading)' }}>What to do:</strong> Say{' '}
              <strong style={{ color:'#0e7490' }}>"Sretan imendan!"</strong> (Happy Name Day!) and bring a small gift or flowers. Never forget your partner's or their parents' imendan — it matters more than you think.
            </div>
          </div>
        )}
      </div>

      {/* ── WEAK AREAS ── */}
      {(() => {
        const weak = getWeakTopics(60);
        if (!weak.length) return null;
        return (
          <React.Fragment>
            <h3 className="sh">Weak Areas</h3>
            <div style={{ marginBottom: 20 }}>
              {weak.slice(0, 5).map(w => (
                <div key={w.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                  background: 'var(--card)', border: '1.5px solid var(--card-b)',
                  borderRadius: 12, marginBottom: 8,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--heading)', textTransform: 'capitalize' }}>{w.id.replace(/_/g, ' ')}</div>
                    <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 600, marginTop: 2 }}>{w.accuracy}% accuracy · {w.attempts} attempts</div>
                  </div>
                  <button
                    onClick={() => setScr(w.id)}
                    style={{
                      padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                      background: 'linear-gradient(135deg,#dc2626,#b91c1c)',
                      color: '#fff', fontSize: 12, fontWeight: 700,
                      fontFamily: "'Outfit',sans-serif",
                    }}
                  >Review</button>
                </div>
              ))}
            </div>
          </React.Fragment>
        );
      })()}

      {/* ── ACHIEVEMENTS ── */}
      <h3 className="sh">Achievements</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
        <button className="tc" style={{display:"flex",alignItems:"center",gap:12,padding:"16px"}} onClick={() => setScr("badges")}>
          <div style={{width:44,height:44,borderRadius:13,background:"linear-gradient(135deg,#fffbeb,#fef3c7)",border:"1px solid #fde68a",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>🏆</div>
          <div style={{textAlign:"left",minWidth:0}}>
            <div style={{fontSize:13,fontWeight:800,color:"var(--heading)"}}>Badges</div>
            <div style={{fontSize:11,color:"var(--subtext)",marginTop:1}}>{(st.badges||[]).length} earned</div>
          </div>
        </button>
        <button className="tc" style={{display:"flex",alignItems:"center",gap:12,padding:"16px"}} onClick={() => setScr("leaderboard")}>
          <div style={{width:44,height:44,borderRadius:13,background:"linear-gradient(135deg,#f0fdf4,#dcfce7)",border:"1px solid #bbf7d0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>🏅</div>
          <div style={{textAlign:"left",minWidth:0}}>
            <div style={{fontSize:13,fontWeight:800,color:"var(--heading)"}}>Leaderboard</div>
            <div style={{fontSize:11,color:"var(--subtext)",marginTop:1}}>View rankings</div>
          </div>
        </button>
        <button className="tc" style={{gridColumn:"1/-1",display:"flex",alignItems:"center",gap:14,padding:"16px"}} onClick={() => setScr("certificate")}>
          <div style={{width:44,height:44,borderRadius:13,background:"linear-gradient(135deg,#f0f9ff,#bae6fd)",border:"1px solid #7dd3fc",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>📜</div>
          <div style={{flex:1,textAlign:"left"}}>
            <div style={{fontSize:14,fontWeight:800,color:"var(--heading)"}}>My Certificate</div>
            <div style={{fontSize:11,color:"var(--subtext)",marginTop:1}}>Download your progress certificate</div>
          </div>
          <div style={{fontSize:20,color:"var(--subtext)",opacity:.35}}>›</div>
        </button>
      </div>

      {/* ── MY COLLECTION ── */}
      <h3 className="sh">My Collection</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
        <button className="tc" style={{display:"flex",alignItems:"center",gap:12,padding:"16px"}} onClick={() => setScr("favorites")}>
          <div style={{width:44,height:44,borderRadius:13,background:"linear-gradient(135deg,#fef9c3,#fef08a)",border:"1px solid #fde047",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>⭐</div>
          <div style={{textAlign:"left",minWidth:0}}>
            <div style={{fontSize:13,fontWeight:800,color:"var(--heading)"}}>Favorites</div>
            <div style={{fontSize:11,color:"var(--subtext)",marginTop:1}}>{favs.length} saved</div>
          </div>
        </button>
        <button className="tc" style={{display:"flex",alignItems:"center",gap:12,padding:"16px"}} onClick={() => setScr("journal")}>
          <div style={{width:44,height:44,borderRadius:13,background:"linear-gradient(135deg,#faf5ff,#ede9fe)",border:"1px solid #ddd6fe",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>📓</div>
          <div style={{textAlign:"left",minWidth:0}}>
            <div style={{fontSize:13,fontWeight:800,color:"var(--heading)"}}>Vocabulary</div>
            <div style={{fontSize:11,color:"var(--subtext)",marginTop:1}}>Personal journal</div>
          </div>
        </button>
      </div>

      <div
        onClick={() => onNavigate && onNavigate('my_words')}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 14px', background: 'var(--card)',
          border: '1px solid var(--card-b)', borderRadius: 12,
          cursor: 'pointer', marginBottom: 8,
        }}
      >
        <span style={{ fontSize: 22 }}>📚</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--heading)' }}>My Words</div>
          <div style={{ fontSize: 11, color: 'var(--subtext)' }}>
            {(() => {
              try { return JSON.parse(localStorage.getItem('nh_custom_words') || '[]').length + ' words saved'; }
              catch { return 'Your personal vocabulary deck'; }
            })()}
          </div>
        </div>
        <span style={{ color: 'var(--subtext)' }}>→</span>
      </div>

      {/* ── SETTINGS ── */}
      <h3 className="sh">Settings</h3>

      {/* Goal selector */}
      <div className="tc" style={{marginBottom:10,overflow:'hidden'}}>
        <button
          onClick={() => setGoalOpen(o => !o)}
          style={{width:'100%',display:'flex',alignItems:'center',gap:14,padding:'16px',background:'none',border:'none',cursor:'pointer',fontFamily:"'Outfit',sans-serif",textAlign:'left'}}
        >
          <div style={{width:44,height:44,borderRadius:13,background:'linear-gradient(135deg,#f0f9ff,#e0f2fe)',border:'1px solid #bae6fd',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>
            {GOALS.find(g => g.id === currentGoal)?.icon || '🎯'}
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:800,color:'var(--heading)'}}>My Learning Goal</div>
            <div style={{fontSize:11,color:'var(--subtext)',marginTop:1}}>
              {currentGoal ? GOALS.find(g => g.id === currentGoal)?.label : 'Not set — tap to choose'}
            </div>
          </div>
          <div style={{fontSize:14,color:'var(--subtext)',opacity:.5,transition:'transform .2s',transform:goalOpen?'rotate(180deg)':'none'}}>⌄</div>
        </button>
        {goalOpen && (
          <div style={{borderTop:'1px solid var(--card-b)',padding:'10px 12px 12px'}}>
            {GOALS.map(g => (
              <button
                key={g.id}
                onClick={() => { localStorage.setItem('nh_goal', g.id); setCurrentGoal(g.id); setGoalOpen(false); }}
                style={{
                  width:'100%',display:'flex',alignItems:'center',gap:12,padding:'10px 12px',
                  borderRadius:10,border:'none',cursor:'pointer',textAlign:'left',
                  background: currentGoal === g.id ? 'rgba(14,116,144,.08)' : 'transparent',
                  fontFamily:"'Outfit',sans-serif",marginBottom:4,
                }}
              >
                <span style={{fontSize:20}}>{g.icon}</span>
                <span style={{fontSize:13,fontWeight:currentGoal===g.id?800:600,color:currentGoal===g.id?'#0e7490':'var(--heading)'}}>{g.label}</span>
                {currentGoal === g.id && <span style={{marginLeft:'auto',color:'#0e7490',fontSize:14,fontWeight:900}}>✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      <button className="tc" style={{width:"100%",display:"flex",alignItems:"center",gap:14,padding:"16px",marginBottom:10}}
        onClick={() => { const nv = !darkMode; setDarkMode(nv); localStorage.setItem("darkMode", nv.toString()); }}>
        <div style={{
          width:44,height:44,borderRadius:13,
          background: darkMode ? "linear-gradient(135deg,#fef9c3,#fef08a)" : "linear-gradient(135deg,#1e293b,#334155)",
          border: darkMode ? "1px solid #fde047" : "1px solid #475569",
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0
        }}>
          {darkMode ? "☀️" : "🌙"}
        </div>
        <div style={{flex:1,textAlign:"left"}}>
          <div style={{fontSize:14,fontWeight:800,color:"var(--heading)"}}>{darkMode ? "Light Mode" : "Dark Mode"}</div>
          <div style={{fontSize:11,color:"var(--subtext)",marginTop:1}}>Switch appearance</div>
        </div>
        <div style={{fontSize:20,color:"var(--subtext)",opacity:.35}}>›</div>
      </button>
      <button className="tc" style={{display:"flex",alignItems:"center",gap:14,padding:"16px",marginBottom:10}} onClick={() => setScr("contact")}>
        <div style={{width:38,height:38,borderRadius:12,background:"linear-gradient(135deg,#0e7490,#164e63)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>🛟</div>
        <div style={{flex:1,textAlign:"left"}}>
          <div style={{fontSize:14,fontWeight:800,color:"var(--heading)"}}>Help & Feedback</div>
          <div style={{fontSize:11,color:"var(--subtext)",marginTop:1}}>Report a bug or suggest a feature</div>
        </div>
        <div style={{fontSize:20,color:"var(--subtext)",opacity:.35}}>›</div>
      </button>
      <button className="tc" style={{width:"100%",textAlign:"center",padding:"14px",marginBottom:10}} onClick={() => setScr("privacy")}>
        <div style={{fontSize:13,color:"var(--subtext)",fontWeight:600}}>Privacy Policy & Terms</div>
      </button>
      {au && au.u === 'jschreiner75@gmail.com' && (
        <button className="tc" style={{width:"100%",display:"flex",alignItems:"center",gap:14,padding:"16px",marginBottom:24}} onClick={() => setScr("admin")}>
          <div style={{width:38,height:38,borderRadius:12,background:"linear-gradient(135deg,#7c3aed,#4c1d95)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>🛠️</div>
          <div style={{flex:1,textAlign:"left"}}>
            <div style={{fontSize:14,fontWeight:800,color:"var(--heading)"}}>Admin Dashboard</div>
            <div style={{fontSize:11,color:"var(--subtext)",marginTop:1}}>Platform overview & user stats</div>
          </div>
          <div style={{fontSize:20,color:"var(--subtext)",opacity:.35}}>›</div>
        </button>
      )}
      {!(au && au.u === 'jschreiner75@gmail.com') && <div style={{marginBottom:24}} />}

      {/* ── GDPR DATA EXPORT ── */}
      <h3 className="sh">Your Data</h3>
      <button className="tc" style={{width:"100%",display:"flex",alignItems:"center",gap:14,padding:"16px",marginBottom:10}}
        onClick={exportData}>
        <div style={{width:38,height:38,borderRadius:12,background:"linear-gradient(135deg,#0e7490,#164e63)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>📦</div>
        <div style={{flex:1,textAlign:"left"}}>
          <div style={{fontSize:14,fontWeight:800,color:"var(--heading)"}}>Export My Data</div>
          <div style={{fontSize:11,color:exportDone?"#16a34a":"var(--subtext)",marginTop:1,fontWeight:exportDone?700:500}}>
            {exportDone ? "✓ Downloaded! Check your downloads folder." : "Download all your progress as JSON"}
          </div>
        </div>
        <div style={{fontSize:20,color:"var(--subtext)",opacity:.35}}>›</div>
      </button>

      {/* ── SIGN OUT ── */}
      {confirmOut ? (
        <div style={{border:"2px solid rgba(194,65,12,.2)",borderRadius:16,padding:"20px",background:"rgba(194,65,12,.04)",marginBottom:16}}>
          <p style={{fontSize:15,fontWeight:700,color:"#c2410c",textAlign:"center",marginBottom:16}}>Sign out of Naša Hrvatska?</p>
          <div style={{display:"flex",gap:10}}>
            <button onClick={() => setConfirmOut(false)} style={{flex:1,padding:"13px",border:"1.5px solid var(--card-b)",borderRadius:12,background:"var(--card)",color:"var(--subtext)",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
              Cancel
            </button>
            <button onClick={doOut} style={{flex:1,padding:"13px",border:"none",borderRadius:12,background:"#c2410c",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
              Sign Out
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setConfirmOut(true)} style={{width:"100%",padding:"14px",border:"2px solid rgba(194,65,12,.15)",borderRadius:14,background:"rgba(194,65,12,.05)",color:"#c2410c",fontSize:14,fontWeight:700,cursor:"pointer",marginBottom:16,fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          🚪 Sign Out
        </button>
      )}

      {/* ── DANGER ZONE ── */}
      <h3 className="sh" style={{color:"#dc2626",marginTop:8}}>Danger Zone</h3>
      {confirmDelete ? (
        <div style={{border:"2px solid rgba(220,38,38,.2)",borderRadius:16,padding:"20px",background:"rgba(220,38,38,.04)",marginBottom:16}}>
          <p style={{fontSize:15,fontWeight:700,color:"#dc2626",textAlign:"center",marginBottom:8}}>Delete your account?</p>
          <p style={{fontSize:13,color:"#78716c",textAlign:"center",marginBottom:16}}>This permanently deletes all your progress and cannot be undone.</p>
          <div style={{display:"flex",gap:10}}>
            <button onClick={() => setConfirmDelete(false)} disabled={deleting} style={{flex:1,padding:"13px",border:"1.5px solid var(--card-b)",borderRadius:12,background:"var(--card)",color:"var(--subtext)",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
              Cancel
            </button>
            <button onClick={handleDeleteAccount} disabled={deleting} style={{flex:1,padding:"13px",border:"none",borderRadius:12,background:"#dc2626",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setConfirmDelete(true)} style={{width:"100%",padding:"14px",border:"2px solid rgba(220,38,38,.15)",borderRadius:14,background:"rgba(220,38,38,.05)",color:"#dc2626",fontSize:14,fontWeight:700,cursor:"pointer",marginBottom:16,fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          🗑️ Delete Account
        </button>
      )}

      {showPrestigeModal && (
        <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,.6)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:'var(--card)', borderRadius:24, padding:'32px 24px', maxWidth:340, width:'100%', textAlign:'center' }}>
            <div style={{ fontSize:48, marginBottom:12 }}>✦</div>
            <div style={{ fontSize:20, fontWeight:900, color:'var(--heading)', marginBottom:8 }}>Prestige?</div>
            <div style={{ fontSize:13, color:'var(--subtext)', lineHeight:1.7, marginBottom:24 }}>
              Your XP will reset to 0, but you'll earn a permanent ✦ Prestige badge. Your lessons, streak, and vocabulary remain. This is a mark of honour.
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setShowPrestigeModal(false)} style={{ flex:1, padding:'12px', borderRadius:12, border:'1.5px solid var(--inp-b)', background:'none', cursor:'pointer', fontSize:14, fontWeight:700, color:'var(--subtext)', fontFamily:"'Outfit',sans-serif" }}>Cancel</button>
              <button
                onClick={() => {
                  const newPrestige = prestigeLevel + 1;
                  localStorage.setItem('nh_prestige', String(newPrestige));
                  localStorage.setItem('nh_xp', '0');
                  setShowPrestigeModal(false);
                }}
                style={{ flex:1, padding:'12px', borderRadius:12, border:'none', background:'linear-gradient(135deg,#7c3aed,#4c1d95)', cursor:'pointer', fontSize:14, fontWeight:800, color:'#fff', fontFamily:"'Outfit',sans-serif" }}
              >
                ✦ Confirm
              </button>
            </div>
          </div>
        </div>
      )}

    </React.Fragment>
  );
}
