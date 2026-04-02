import React, { useState, useRef, useMemo, useCallback } from 'react';
import { fbDeleteAccount, fbLeaveFamily, getLocalFamily } from '../../data.jsx';
import { fbExportUserData } from '../../lib/firebase.js';
import { isSoundEnabled, setSoundEnabled, isHapticEnabled, setHapticEnabled, getVoicePreference, setVoicePreference } from '../../lib/soundSettings.js';
import { useApp } from '../../context/AppContext.jsx';
import { useStats } from '../../context/StatsContext.tsx';
import { getFreezesStored, purchaseFreeze, FREEZE_COST_XP } from '../../lib/streakFreeze.js';

const GOALS = [
  { id: 'heritage', icon: '🇭🇷', label: 'My heritage & roots' },
  { id: 'family',   icon: '👨‍👩‍👧', label: 'Speak with family' },
  { id: 'travel',   icon: '✈️',  label: 'Travel to Croatia' },
  { id: 'culture',  icon: '📖',  label: 'Love the culture' },
  { id: 'fluent',   icon: '🗣️',  label: 'Become fluent' },
];

const GOAL_FOCUS = {
  heritage: { label:'Heritage & Roots', icon:'🇭🇷', color:'var(--warning)', bg:'var(--warning-bg)', border:'var(--warning-b)',
    items:[{icon:'🏛️',label:'Croatian History',scr:'history'},{icon:'🌟',label:'Proverbs',scr:'proverbs'},{icon:'📖',label:'Reading',scr:'readlist'}] },
  family:   { label:'Speaking with Family', icon:'👨‍👩‍👧', color:'var(--info)', bg:'var(--info-bg)', border:'var(--info-b)',
    items:[{icon:'🃏',label:'Family Words',scr:'flashcards'},{icon:'🎤',label:'Speaking',scr:'speaking'},{icon:'💬',label:'Dialogue Sim',scr:'dialogue'}] },
  travel:   { label:'Traveling to Croatia', icon:'✈️', color:'var(--success)', bg:'var(--success-bg)', border:'var(--success-b)',
    items:[{icon:'🍽️',label:'Restaurant',scr:'restaurant'},{icon:'🚗',label:'Transport',scr:'transport'},{icon:'🚨',label:'Emergency',scr:'emergency'}] },
  culture:  { label:'Croatian Culture', icon:'📖', color:'var(--lavender)', bg:'rgba(124,58,237,.1)', border:'rgba(124,58,237,.25)',
    items:[{icon:'🌊',label:'Immersion',scr:'immersion'},{icon:'🤖',label:'AI Convo',scr:'aiconvo'},{icon:'🎵',label:'Song Lyrics',scr:'lyrics'}] },
  fluent:   { label:'Becoming Fluent', icon:'🗣️', color:'var(--info)', bg:'var(--info-bg)', border:'var(--info-b)',
    items:[{icon:'🎓',label:'CEFR Test',scr:'cefrtest'},{icon:'💬',label:'Dialogue Sim',scr:'dialogue'},{icon:'🗣️',label:'Shadowing',scr:'shadowing'}] },
};

export default function SettingsTab({ syncReady, onSyncNow }) {
  const { au, darkMode, setDarkMode, setScr, doOut, name, st, favs, jWords } = useApp();
  const { stats: statsCtx, setStats } = useStats();

  const [freezesStored, setFreezesStored] = useState(() => getFreezesStored());
  const [freezeMsg, setFreezeMsg] = useState('');

  function handleBuyFreeze() {
    const result = purchaseFreeze(statsCtx.xp || 0, setStats);
    if (result.ok) {
      setFreezesStored(result.stored);
      setFreezeMsg(`❄️ Freeze purchased! ${result.stored}/2 stored.`);
      setTimeout(() => setFreezeMsg(''), 3000);
    } else {
      setFreezeMsg(result.reason);
      setTimeout(() => setFreezeMsg(''), 3000);
    }
  }

  const [confirmOut, setConfirmOut] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);
  const [currentGoal, setCurrentGoal] = useState(() => localStorage.getItem('nh_goal') || '');
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());
  const [hapticOn, setHapticOn] = useState(() => isHapticEnabled());
  const [voicePref, setVoicePref] = useState(() => getVoicePreference());
  const [fontSize, setFontSize] = useState(() => localStorage.getItem('nh_font_size') || 'medium');
  const [reduceMotion, setReduceMotion] = useState(() => localStorage.getItem('nh_reduce_motion') === 'true');
  const [syncing, setSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);
  const [syncErr, setSyncErr] = useState(false);
  const doneTimerRef = useRef(null);

  // Push notification state
  const [notifPermission, setNotifPermission] = useState(() => {
    if (typeof Notification === 'undefined') return 'unsupported';
    return Notification.permission;
  });
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifError, setNotifError] = useState('');

  const handleEnableNotifications = useCallback(async () => {
    if (notifLoading) return;
    setNotifLoading(true);
    setNotifError('');
    try {
      const { subscribeToPush } = await import('../../lib/pushNotifications.js');
      const result = await subscribeToPush(au?.u || '');
      setNotifPermission(
        typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
      );
      if (result.ok) {
        try { localStorage.setItem('nh_notifications_enabled', 'true'); } catch {}
      } else {
        setNotifError('Could not enable notifications. Please check your browser settings.');
      }
    } catch (err) {
      setNotifPermission(
        typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
      );
      setNotifError('Notifications unavailable. Please try again or check browser permissions.');
    } finally {
      setNotifLoading(false);
    }
  }, [notifLoading, au]);

  const lastSaved = useMemo(() => {
    if (!au || !au.u) return null;
    try {
      const p = JSON.parse(localStorage.getItem('uP_' + au.u) || 'null');
      return p && p.savedAt ? new Date(p.savedAt) : null;
    } catch { return null; }
  }, [au, syncDone]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSyncNow() {
    if (syncing) return;
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

  async function exportData() {
    if (exporting) return;
    setExporting(true);
    try {
      let data;
      const uid = au?.u || au?.uid || '';
      if (uid) {
        data = await fbExportUserData(uid);
        data.inMemory = {
          profile: { name, email: au?.e },
          stats: st,
          favs,
          journal: jWords,
        };
      } else {
        data = {
          exportDate: new Date().toISOString(),
          note: 'Signed-out export — no Firestore data included.',
          inMemory: {
            profile: { name },
            stats: st,
            favs,
            journal: jWords,
          },
        };
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nasa-hrvatska-data-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExportDone(true);
      setTimeout(() => setExportDone(false), 4000);
    } catch {
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  }

  async function handleDeleteAccount() {
    if (!au || !au.u) return;
    setDeleting(true);
    try {
      const localFam = getLocalFamily();
      if (localFam && localFam.code && au.e) {
        try { await fbLeaveFamily(localFam.code, au.e); } catch { /* Non-blocking */ }
      }
      await fbDeleteAccount(au.u);
      doOut();
    } catch(e) {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <React.Fragment>

      {/* ── GOAL FOCUS ── */}
      {currentGoal && (() => {
        const gf = GOAL_FOCUS[currentGoal];
        if (!gf) return null;
        return (
          <React.Fragment>
            <h3 className="sh">Goal Focus</h3>
            <div style={{ background:gf.bg, border:`1.5px solid ${gf.border}`, borderRadius:16, padding:'16px', marginBottom:20 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                <span style={{ fontSize:'var(--text-xl)' }}>{gf.icon}</span>
                <div>
                  <div style={{ fontSize:'var(--text-sm)', fontWeight:900, color:gf.color }}>{gf.label}</div>
                  <div style={{ fontSize:'var(--text-xs)', color:'var(--subtext)', marginTop:1 }}>Your recommended exercises</div>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
                {gf.items.map(it => (
                  <button key={it.scr}
                    onClick={() => setScr(it.scr)}
                    style={{ background:'var(--card)', border:`1px solid ${gf.border}`, borderRadius:10, padding:'10px 6px', cursor:'pointer', textAlign:'center', fontFamily:"'Outfit',sans-serif" }}>
                    <div style={{ fontSize:'var(--text-xl)' }}>{it.icon}</div>
                    <div style={{ fontSize:'var(--text-xs)', fontWeight:700, color:'var(--heading)', marginTop:4, lineHeight:1.2 }}>{it.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </React.Fragment>
        );
      })()}

      {/* ── PARTNER GOAL CARD ── */}
      {localStorage.getItem('nh_goal') === 'partner' && (
        <div style={{
          background:'linear-gradient(135deg,rgba(249,168,37,.1),rgba(14,116,144,.08))',
          border:'1.5px solid rgba(249,168,37,.3)',
          borderRadius:16, padding:'16px 18px', marginBottom:16,
        }}>
          <div style={{ fontSize:'var(--text-base)', fontWeight:900, color:'var(--heading)', marginBottom:6 }}>
            💑 Learning for your partner
          </div>
          <div style={{ fontSize:'var(--text-sm)', color:'var(--subtext)', lineHeight:1.6, marginBottom:12 }}>
            You're learning Croatian because someone special is Croatian. That's the most powerful motivation there is.
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {[
              '✓ Learn in-law vocabulary (Svekrva, punac, šogor)',
              '✓ Master the Imendan tradition (see below)',
              '✓ Practice "Survival at the Table" phrases',
              '✓ Say Živjeli! at the right moment',
            ].map((tip, i) => (
              <div key={i} style={{ fontSize:'var(--text-sm)', color:'var(--subtext)', fontWeight:600 }}>{tip}</div>
            ))}
          </div>
        </div>
      )}

      {/* ── LEARNING PREFERENCES ── */}
      <div style={{fontSize:'var(--text-xs)', fontWeight:800, color:'var(--subtext)', textTransform:'uppercase', letterSpacing:'0.1em', marginTop:8, marginBottom:10, paddingLeft:4}}>
        ⚙️ Learning Preferences
      </div>

      {/* Sound toggle */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 0',borderBottom:'1px solid var(--card-b)'}}>
        <div>
          <div style={{fontWeight:700,fontSize:'var(--text-sm)'}}><span aria-hidden="true">🔊</span> Sound Effects</div>
          <div style={{fontSize:'var(--text-xs)',color:'var(--subtext)',marginTop:2}}>Play audio feedback for answers</div>
        </div>
        <button
          role="switch"
          aria-checked={soundOn ? 'true' : 'false'}
          onClick={() => { const v = !soundOn; setSoundOn(v); setSoundEnabled(v); }}
          style={{width:44,height:26,borderRadius:13,border:'none',cursor:'pointer',transition:'background .2s',
            background: soundOn ? 'var(--success)' : 'var(--bar-bg)', position:'relative', flexShrink:0}}
        >
          <span style={{position:'absolute',top:3,left: soundOn ? 21 : 3,width:20,height:20,borderRadius:'50%',
            background:'white',transition:'left .2s',boxShadow:'0 1px 4px rgba(0,0,0,.2)'}} />
        </button>
      </div>

      {/* Haptic toggle */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 0',borderBottom:'1px solid var(--card-b)'}}>
        <div>
          <div style={{fontWeight:700,fontSize:'var(--text-sm)'}}>📳 Haptic Feedback</div>
          <div style={{fontSize:'var(--text-xs)',color:'var(--subtext)',marginTop:2}}>Vibration on correct/wrong answers</div>
        </div>
        <button
          role="switch"
          aria-checked={hapticOn ? 'true' : 'false'}
          onClick={() => { const v = !hapticOn; setHapticOn(v); setHapticEnabled(v); }}
          style={{width:44,height:26,borderRadius:13,border:'none',cursor:'pointer',transition:'background .2s',
            background: hapticOn ? 'var(--success)' : 'var(--bar-bg)', position:'relative', flexShrink:0}}
        >
          <span style={{position:'absolute',top:3,left: hapticOn ? 21 : 3,width:20,height:20,borderRadius:'50%',
            background:'white',transition:'left .2s',boxShadow:'0 1px 4px rgba(0,0,0,.2)'}} />
        </button>
      </div>

      {/* Voice preference */}
      <div style={{padding:'14px 0',borderBottom:'1px solid var(--card-b)'}}>
        <div style={{marginBottom:8}}>
          <div style={{fontWeight:700,fontSize:'var(--text-sm)'}}>🗣️ Croatian Voice</div>
          <div style={{fontSize:'var(--text-xs)',color:'var(--subtext)',marginTop:2}}>Choose how Croatian text is spoken</div>
        </div>
        <div style={{display:'flex',gap:6}}>
          {[
            { id:'gabrijela', label:'Gabrijela',  desc:'Azure neural — native Croatian pronunciation (default)' },
            { id:'charlotte', label:'Charlotte',  desc:'ElevenLabs — modern natural voice, slight non-native accent on Croatian' },
          ].map(v => (
            <button
              key={v.id}
              onClick={() => { setVoicePref(v.id); setVoicePreference(v.id); }}
              title={v.desc}
              style={{
                flex:1, padding:'8px 4px', borderRadius:9, border:'none', cursor:'pointer',
                fontFamily:"'Outfit',sans-serif", fontWeight:700, fontSize:11,
                background: voicePref === v.id ? 'var(--info-bg,#e0f2fe)' : 'var(--bar-bg,#f1f5f9)',
                color: voicePref === v.id ? 'var(--info,#0284c7)' : 'var(--subtext,#64748b)',
                outline: voicePref === v.id ? '2px solid var(--info,#0284c7)' : 'none',
                transition:'all .15s',
              }}
            >{v.label}</button>
          ))}
        </div>
        <div style={{fontSize:10,color:'var(--subtext)',marginTop:6,lineHeight:1.4}}>
          {voicePref === 'charlotte' ? '📌 ElevenLabs Charlotte — natural modern voice, slight non-native accent on Croatian' :
           '📌 Azure hr-HR-GabrijelaNeural — native Croatian pronunciation, phonemically accurate'}
        </div>
      </div>

      {/* ── DIFFICULTY ── */}
      <div style={{padding:'14px 0',borderBottom:'1px solid var(--card-b)'}}>
        <div style={{marginBottom:8}}>
          <div style={{fontWeight:700,fontSize:'var(--text-sm)'}}>🎯 Difficulty Level</div>
          <div style={{fontSize:'var(--text-xs)',color:'var(--subtext)',marginTop:2}}>Controls exercise complexity and content recommendations</div>
        </div>
        <div style={{display:'flex',gap:6}}>
          {[
            { id:'beginner',     label:'Beginner',     desc:'A1–A2: basic vocab and simple sentences' },
            { id:'intermediate', label:'Intermediate',  desc:'B1: grammar drills and everyday conversation' },
            { id:'advanced',     label:'Advanced',      desc:'B2+: complex grammar, idioms, and nuance' },
          ].map(d => {
            const active = (statsCtx.diff || 'beginner') === d.id;
            return (
              <button
                key={d.id}
                onClick={() => setStats(prev => ({ ...prev, diff: d.id }))}
                title={d.desc}
                style={{
                  flex:1, padding:'8px 4px', borderRadius:9, border:'none', cursor:'pointer',
                  fontFamily:"'Outfit',sans-serif", fontWeight:700, fontSize:11,
                  background: active ? 'var(--info-bg,#e0f2fe)' : 'var(--bar-bg,#f1f5f9)',
                  color: active ? 'var(--info,#0284c7)' : 'var(--subtext,#64748b)',
                  outline: active ? '2px solid var(--info,#0284c7)' : 'none',
                  transition:'all .15s',
                }}
              >{d.label}</button>
            );
          })}
        </div>
        <div style={{fontSize:10,color:'var(--subtext)',marginTop:6,lineHeight:1.4}}>
          {(statsCtx.diff || 'beginner') === 'beginner'     ? '📌 Beginner: essential vocabulary, simple grammar, and slow pronunciation' :
           (statsCtx.diff || 'beginner') === 'intermediate' ? '📌 Intermediate: case system, verb aspects, and natural conversation speed' :
                                                              '📌 Advanced: idioms, clitic ordering, formal register, and dialect nuance'}
        </div>
      </div>

      {/* Goal selector */}
      <div className="tc" style={{marginBottom:10,overflow:'hidden'}}>
        <button
          onClick={() => setGoalOpen(o => !o)}
          style={{width:'100%',display:'flex',alignItems:'center',gap:14,padding:'16px',background:'none',border:'none',cursor:'pointer',fontFamily:"'Outfit',sans-serif",textAlign:'left'}}
        >
          <div style={{width:44,height:44,borderRadius:13,background:'var(--info-bg)',border:'1px solid var(--info-b)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'var(--text-xl)',flexShrink:0}}>
            {GOALS.find(g => g.id === currentGoal)?.icon || '🎯'}
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:'var(--text-base)',fontWeight:800,color:'var(--heading)'}}>My Learning Goal</div>
            <div style={{fontSize:'var(--text-xs)',color:'var(--subtext)',marginTop:1}}>
              {currentGoal ? GOALS.find(g => g.id === currentGoal)?.label : 'Not set — tap to choose'}
            </div>
          </div>
          <div style={{fontSize:'var(--text-base)',color:'var(--subtext)',opacity:.85,transition:'transform .2s',transform:goalOpen?'rotate(180deg)':'none'}}>⌄</div>
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
                  background: currentGoal === g.id ? 'var(--info-bg)' : 'transparent',
                  fontFamily:"'Outfit',sans-serif",marginBottom:4,
                }}
              >
                <span style={{fontSize:'var(--text-xl)'}}>{g.icon}</span>
                <span style={{fontSize:'var(--text-sm)',fontWeight:currentGoal===g.id?800:600,color:currentGoal===g.id?'var(--info)':'var(--heading)'}}>{g.label}</span>
                {currentGoal === g.id && <span style={{marginLeft:'auto',color:'var(--info)',fontSize:'var(--text-base)',fontWeight:900}}>✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>
      {currentGoal && (
        <div style={{
          fontSize:12, color:'var(--subtext)', marginTop:8, padding:'8px 12px',
          background:'var(--bar-bg)', borderRadius:8, lineHeight:1.5, marginBottom:10,
        }}>
          {currentGoal === 'heritage' ? '🇭🇷 Focuses on family vocabulary, traditions, and diaspora-specific phrases' :
           currentGoal === 'family' ? '👨‍👩‍👧 Emphasizes family conversations, customs, and emotional vocabulary' :
           currentGoal === 'partner' ? '💑 Tailored for learning your partner\'s language and cultural context' :
           currentGoal === 'travel' ? '✈️ Prioritizes practical phrases, transportation, dining, and navigation' :
           currentGoal === 'culture' ? '📖 Focuses on history, art, music, literature, and cultural depth' :
           currentGoal === 'fluent' ? '🗣️ Full curriculum from A1 to B2+ with all grammar and vocabulary' :
           'Select a goal to personalize your learning path'}
        </div>
      )}

      {/* ── HERITAGE MODE ENTRY POINT ── */}
      <div style={{fontSize:'var(--text-xs)', fontWeight:800, color:'var(--subtext)', textTransform:'uppercase', letterSpacing:'0.1em', marginTop:24, marginBottom:10, paddingLeft:4}}>
        🇭🇷 Heritage Learner
      </div>
      <button className="tc" style={{width:'100%',display:'flex',alignItems:'center',gap:14,padding:'16px',marginBottom:10}}
        onClick={() => setScr('heritage_mode')}>
        <div style={{width:44,height:44,borderRadius:13,
          background: localStorage.getItem('nh_heritage_mode') === 'true'
            ? 'linear-gradient(135deg,#7c2d12,#c2410c)'
            : 'linear-gradient(135deg,#9a3412,#ea580c)',
          display:'flex',alignItems:'center',justifyContent:'center',fontSize:'var(--text-xl)',flexShrink:0}}>🇭🇷</div>
        <div style={{flex:1,textAlign:'left'}}>
          <div style={{fontSize:'var(--text-base)',fontWeight:800,color:'var(--heading)'}}>
            {localStorage.getItem('nh_heritage_mode') === 'true' ? 'Heritage Mode Active' : 'I grew up hearing Croatian at home →'}
          </div>
          <div style={{fontSize:'var(--text-xs)',color:localStorage.getItem('nh_heritage_mode') === 'true' ? 'var(--success)' : 'var(--subtext)',marginTop:1}}>
            {localStorage.getItem('nh_heritage_mode') === 'true'
              ? '✓ Dialect set · Gap analysis complete · Baka phrases saved'
              : 'Diaspora-specific path: dialect check, gap analysis, family phrases'}
          </div>
        </div>
        <div style={{fontSize:'var(--text-xl)',color:'var(--subtext)',opacity:.8}}>›</div>
      </button>

      {/* ── STREAK PROTECTION ── */}
      <div style={{fontSize:'var(--text-xs)', fontWeight:800, color:'var(--subtext)', textTransform:'uppercase', letterSpacing:'0.1em', marginTop:24, marginBottom:10, paddingLeft:4}}>
        ❄️ Streak Protection
      </div>
      <div style={{ background: 'var(--card)', borderRadius: 16, padding: 16, marginBottom: 12, border: '1px solid var(--card-b)' }}>
        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>❄️ Streak Protection</div>
        <div style={{ fontSize: 12, color: 'var(--subtext)', marginBottom: 12 }}>
          Freezes automatically protect your streak if you miss a day. Max 2 stored.
        </div>
        {/* Freeze slots */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {[0, 1].map(i => (
            <div key={i} style={{
              width: 48, height: 48, borderRadius: 12,
              background: i < freezesStored ? 'rgba(56,189,248,0.15)' : 'var(--bg)',
              border: `2px solid ${i < freezesStored ? '#38bdf8' : 'var(--card-b)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24,
            }}>
              {i < freezesStored ? '❄️' : '○'}
            </div>
          ))}
          <div style={{ flex: 1, fontSize: 12, color: 'var(--subtext)', alignSelf: 'center' }}>
            {freezesStored}/2 freezes stored
          </div>
        </div>
        <button
          disabled={freezesStored >= 2 || (statsCtx?.xp || 0) < FREEZE_COST_XP}
          onClick={handleBuyFreeze}
          style={{
            width: '100%', padding: '10px', borderRadius: 10,
            background: freezesStored >= 2 || (statsCtx?.xp || 0) < FREEZE_COST_XP ? 'var(--card-b)' : 'var(--info)',
            color: freezesStored >= 2 || (statsCtx?.xp || 0) < FREEZE_COST_XP ? 'var(--subtext)' : '#fff',
            border: 'none', fontWeight: 700, fontSize: 13,
            cursor: freezesStored >= 2 || (statsCtx?.xp || 0) < FREEZE_COST_XP ? 'not-allowed' : 'pointer',
            fontFamily: "'Outfit',sans-serif",
          }}
        >
          {freezesStored >= 2 ? '✓ Freeze slots full' : `Buy Freeze — 50 XP (you have ${statsCtx?.xp || 0})`}
        </button>
        {freezeMsg && <div style={{ marginTop: 8, fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>{freezeMsg}</div>}
      </div>

      {/* ── NOTIFICATIONS ── */}
      <div style={{fontSize:'var(--text-xs)', fontWeight:800, color:'var(--subtext)', textTransform:'uppercase', letterSpacing:'0.1em', marginTop:24, marginBottom:10, paddingLeft:4}}>
        🔔 Notifications
      </div>
      <div style={{
        background: notifPermission === 'granted' ? 'linear-gradient(135deg,var(--success-bg),rgba(22,163,74,.15))' : 'var(--card)',
        border: `1.5px solid ${notifPermission === 'granted' ? 'var(--success-b)' : 'var(--card-b)'}`,
        borderRadius: 16, padding: '14px 16px', marginBottom: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12, flexShrink: 0,
            background: notifPermission === 'granted' ? 'linear-gradient(135deg,var(--success),#15803d)'
              : notifPermission === 'denied' ? 'linear-gradient(135deg,var(--error),#b91c1c)'
              : 'linear-gradient(135deg,#f59e0b,#d97706)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
          }}>
            {notifPermission === 'granted' ? '🔔' : notifPermission === 'denied' ? '🔕' : '🔔'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: notifPermission === 'granted' ? 'var(--success)' : 'var(--heading)' }}>
              {notifPermission === 'granted' ? 'Notifications enabled' :
               notifPermission === 'denied' ? 'Notifications blocked' :
               notifPermission === 'unsupported' ? 'Not supported on this browser' :
               'Daily reminders off'}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--subtext)', marginTop: 2, lineHeight: 1.4 }}>
              {notifPermission === 'granted' ? 'Daily streak reminders + SRS review alerts' :
               notifPermission === 'denied' ? 'Enable in browser Settings → Site permissions' :
               notifPermission === 'unsupported' ? 'Install as PWA for notification support' :
               'Enable for daily streak + SRS reminders'}
            </div>
          </div>
          {notifPermission === 'default' && (
            <button
              onClick={handleEnableNotifications}
              disabled={notifLoading}
              style={{
                padding: '10px 16px', borderRadius: 10, border: 'none',
                cursor: notifLoading ? 'default' : 'pointer',
                background: notifLoading ? 'var(--bar-bg)' : 'linear-gradient(135deg,#f59e0b,#d97706)',
                color: notifLoading ? 'var(--subtext)' : 'white',
                fontSize: 'var(--text-xs)', fontWeight: 800,
                fontFamily: "'Outfit',sans-serif", flexShrink: 0, minHeight: 40,
              }}
            >
              {notifLoading ? '…' : 'Enable'}
            </button>
          )}
        </div>
        {notifError && (
          <div style={{ marginTop: 8, fontSize: 'var(--text-xs)', color: 'var(--error, #ef4444)', fontWeight: 600 }}>
            {notifError}
          </div>
        )}
        {notifPermission === 'granted' && (
          <div style={{ marginTop: 10, fontSize: 'var(--text-xs)', color: 'var(--subtext)', lineHeight: 1.5 }}>
            ✓ Streak reminders at 8PM · ✓ SRS review alerts · ✓ Daily motivation
          </div>
        )}
      </div>

      {/* ── CLOUD SYNC STATUS ── */}
      <div style={{fontSize:'var(--text-xs)', fontWeight:800, color:'var(--subtext)', textTransform:'uppercase', letterSpacing:'0.1em', marginTop:24, marginBottom:10, paddingLeft:4}}>
        ☁️ Cloud Sync
      </div>
      <div style={{
        background: syncErr ? "linear-gradient(135deg,var(--error-bg),rgba(220,38,38,.15))" : syncReady ? "linear-gradient(135deg,var(--success-bg),rgba(22,163,74,.15))" : "linear-gradient(135deg,var(--bar-bg),var(--bar-bg))",
        border: `1.5px solid ${syncErr ? "var(--error-b)" : syncReady ? "var(--success-b)" : "var(--card-b)"}`,
        borderRadius: 16, padding: "14px 16px", marginBottom: 16,
        display: "flex", alignItems: "center", gap: 12,
        transition: 'all .3s ease',
      }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12, flexShrink: 0,
          background: syncErr ? "linear-gradient(135deg,var(--error),#b91c1c)" : syncReady ? "linear-gradient(135deg,var(--success),#15803d)" : "linear-gradient(135deg,var(--subtext),var(--subtext))",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
        }}>
          {syncing ? "⏳" : syncErr ? "⚠️" : syncDone ? "✅" : syncReady ? "☁️" : "📵"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: syncErr ? "var(--error)" : syncReady ? "var(--success)" : "var(--subtext)" }}>
            {syncing ? "Saving to cloud…" : syncErr ? "Sync failed — check connection" : syncDone ? "Saved to cloud!" : syncReady ? "Cloud backup active" : "Connecting…"}
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: "var(--subtext)", marginTop: 2, fontWeight: 500 }}>
            {lastSaved ? `Last saved: ${lastSaved.toLocaleString()}` : "No local save found"}
          </div>
        </div>
        {syncReady && (
          <button onClick={handleSyncNow} disabled={syncing} style={{
            padding: "12px 16px", borderRadius: 10, border: "none", cursor: syncing ? "default" : "pointer",
            background: syncing ? "var(--bar-bg)" : syncErr ? "linear-gradient(135deg,var(--error),#b91c1c)" : "linear-gradient(135deg,var(--success),#15803d)",
            color: syncing ? "var(--subtext)" : "var(--card)", fontSize: 'var(--text-sm)', fontWeight: 800,
            fontFamily: "'Outfit',sans-serif", flexShrink: 0, minHeight: 44,
          }}>
            {syncing ? "…" : "Sync Now"}
          </button>
        )}
      </div>

      {/* ── APPEARANCE ── */}
      <div style={{fontSize:'var(--text-xs)', fontWeight:800, color:'var(--subtext)', textTransform:'uppercase', letterSpacing:'0.1em', marginTop:24, marginBottom:10, paddingLeft:4}}>
        🎨 Appearance
      </div>

      <button className="tc" style={{width:"100%",display:"flex",alignItems:"center",gap:14,padding:"16px",marginBottom:10}}
        onClick={() => { const nv = !darkMode; setDarkMode(nv); localStorage.setItem("darkMode", nv.toString()); }}>
        <div style={{
          width:44,height:44,borderRadius:13,
          background: darkMode ? "rgba(253,224,71,.2)" : "linear-gradient(135deg,var(--heading),#334155)",
          border: darkMode ? "1px solid rgba(253,224,71,.5)" : "1px solid #475569",
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:'var(--text-xl)',flexShrink:0
        }}>
          {darkMode ? "☀️" : "🌙"}
        </div>
        <div style={{flex:1,textAlign:"left"}}>
          <div style={{fontSize:'var(--text-base)',fontWeight:800,color:"var(--heading)"}}>{darkMode ? "Light Mode" : "Dark Mode"}</div>
          <div style={{fontSize:'var(--text-xs)',color:"var(--subtext)",marginTop:1}}>Switch appearance</div>
        </div>
        <div style={{fontSize:'var(--text-xl)',color:"var(--subtext)",opacity:.8}}>›</div>
      </button>

      {/* Font size control */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 0',borderBottom:'1px solid var(--card-b)'}}>
        <div>
          <div style={{fontWeight:700,fontSize:'var(--text-sm)'}}>🔠 Font Size</div>
          <div style={{fontSize:'var(--text-xs)',color:'var(--subtext)',marginTop:2}}>Adjust text size across the app</div>
        </div>
        <div style={{display:'flex',borderRadius:10,overflow:'hidden',border:'1.5px solid var(--card-b)',flexShrink:0}}>
          {['small','medium','large'].map((size, i) => (
            <button
              key={size}
              onClick={() => {
                setFontSize(size);
                localStorage.setItem('nh_font_size', size);
                if (size === 'medium') {
                  document.documentElement.removeAttribute('data-font');
                } else {
                  document.documentElement.setAttribute('data-font', size);
                }
              }}
              style={{
                padding:'6px 12px',
                border:'none',
                borderLeft: i > 0 ? '1px solid var(--card-b)' : 'none',
                cursor:'pointer',
                background: fontSize === size ? 'var(--info)' : 'var(--card)',
                color: fontSize === size ? '#fff' : 'var(--subtext)',
                fontWeight:700,
                fontSize: size === 'small' ? 11 : size === 'large' ? 15 : 13,
                fontFamily:"'Outfit',sans-serif",
                transition:'background .15s',
                minHeight:36,
              }}
            >
              {size.charAt(0).toUpperCase() + size.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Reduce motion toggle */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 0',borderBottom:'1px solid var(--card-b)'}}>
        <div>
          <div style={{fontWeight:700,fontSize:'var(--text-sm)'}}>✋ Reduce Animations</div>
          <div style={{fontSize:'var(--text-xs)',color:'var(--subtext)',marginTop:2}}>Minimize motion and transitions</div>
        </div>
        <button
          role="switch"
          aria-checked={reduceMotion ? 'true' : 'false'}
          onClick={() => {
            const v = !reduceMotion;
            setReduceMotion(v);
            localStorage.setItem('nh_reduce_motion', v.toString());
            document.documentElement.classList.toggle('reduce-motion', v);
          }}
          style={{width:44,height:26,borderRadius:13,border:'none',cursor:'pointer',transition:'background .2s',
            background: reduceMotion ? 'var(--success)' : 'var(--bar-bg)', position:'relative', flexShrink:0}}
        >
          <span style={{position:'absolute',top:3,left: reduceMotion ? 21 : 3,width:20,height:20,borderRadius:'50%',
            background:'white',transition:'left .2s',boxShadow:'0 1px 4px rgba(0,0,0,.2)'}} />
        </button>
      </div>

      {/* ── DATA & ACCOUNT ── */}
      <div style={{fontSize:'var(--text-xs)', fontWeight:800, color:'var(--subtext)', textTransform:'uppercase', letterSpacing:'0.1em', marginTop:24, marginBottom:10, paddingLeft:4}}>
        📊 Data &amp; Account
      </div>

      <button className="tc" style={{display:"flex",alignItems:"center",gap:14,padding:"16px",marginBottom:10}} onClick={() => setScr("contact")}>
        <div style={{width:38,height:38,borderRadius:12,background:"linear-gradient(135deg,var(--info),#164e63)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:'var(--text-lg)',flexShrink:0}}>🛟</div>
        <div style={{flex:1,textAlign:"left"}}>
          <div style={{fontSize:'var(--text-base)',fontWeight:800,color:"var(--heading)"}}>Help & Feedback</div>
          <div style={{fontSize:'var(--text-xs)',color:"var(--subtext)",marginTop:1}}>Report a bug or suggest a feature</div>
        </div>
        <div style={{fontSize:'var(--text-xl)',color:"var(--subtext)",opacity:.8}}>›</div>
      </button>
      <button className="tc" style={{width:"100%",textAlign:"center",padding:"14px",marginBottom:10}} onClick={() => setScr("privacy")}>
        <div style={{fontSize:'var(--text-sm)',color:"var(--subtext)",fontWeight:600}}>Privacy Policy & Terms</div>
      </button>
      {au && au.u === 'jschreiner75@gmail.com' && (
        <button className="tc" style={{width:"100%",display:"flex",alignItems:"center",gap:14,padding:"16px",marginBottom:24}} onClick={() => setScr("admin")}>
          <div style={{width:38,height:38,borderRadius:12,background:"linear-gradient(135deg,var(--lavender),#4c1d95)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:'var(--text-lg)',flexShrink:0}}>🛠️</div>
          <div style={{flex:1,textAlign:"left"}}>
            <div style={{fontSize:'var(--text-base)',fontWeight:800,color:"var(--heading)"}}>Admin Dashboard</div>
            <div style={{fontSize:'var(--text-xs)',color:"var(--subtext)",marginTop:1}}>Platform overview & user stats</div>
          </div>
          <div style={{fontSize:'var(--text-xl)',color:"var(--subtext)",opacity:.8}}>›</div>
        </button>
      )}
      {!(au && au.u === 'jschreiner75@gmail.com') && <div style={{marginBottom:24}} />}

      {/* ── GDPR DATA EXPORT ── */}
      <h3 className="sh">Your Data</h3>
      <button className="tc" style={{width:"100%",display:"flex",alignItems:"center",gap:14,padding:"16px",marginBottom:10,opacity:exporting?0.6:1,cursor:exporting?"not-allowed":"pointer"}}
        onClick={exportData}
        disabled={exporting}>
        <div style={{width:38,height:38,borderRadius:12,background:"linear-gradient(135deg,var(--info),#164e63)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:'var(--text-lg)',flexShrink:0}}>📥</div>
        <div style={{flex:1,textAlign:"left"}}>
          <div style={{fontSize:'var(--text-base)',fontWeight:800,color:"var(--heading)"}}>Export My Data (GDPR)</div>
          <div style={{fontSize:'var(--text-xs)',color:exportDone?"var(--success)":exporting?"var(--info)":"var(--subtext)",marginTop:1,fontWeight:(exportDone||exporting)?700:500}}>
            {exportDone ? "✓ Downloaded! Check your downloads folder." : exporting ? "Exporting…" : "Download all your progress and Firestore data as JSON"}
          </div>
        </div>
        {!exporting && <div style={{fontSize:'var(--text-xl)',color:"var(--subtext)",opacity:.8}}>›</div>}
      </button>

      {/* ── SIGN OUT ── */}
      {confirmOut ? (
        <div style={{border:"2px solid rgba(194,65,12,.2)",borderRadius:16,padding:"20px",background:"rgba(194,65,12,.04)",marginBottom:16}}>
          <p style={{fontSize:'var(--text-md)',fontWeight:700,color:"var(--warning)",textAlign:"center",marginBottom:16}}>Sign out of Naša Hrvatska?</p>
          <div style={{display:"flex",gap:10}}>
            <button onClick={() => setConfirmOut(false)} style={{flex:1,padding:"13px",border:"1.5px solid var(--card-b)",borderRadius:12,background:"var(--card)",color:"var(--subtext)",fontSize:'var(--text-base)',fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
              Cancel
            </button>
            <button onClick={doOut} style={{flex:1,padding:"13px",border:"none",borderRadius:12,background:"var(--warning)",color:"var(--card)",fontSize:'var(--text-base)',fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
              Sign Out
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setConfirmOut(true)} style={{width:"100%",padding:"14px",border:"2px solid rgba(194,65,12,.15)",borderRadius:14,background:"rgba(194,65,12,.05)",color:"var(--warning)",fontSize:'var(--text-base)',fontWeight:700,cursor:"pointer",marginBottom:16,fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          🚪 Sign Out
        </button>
      )}

      {/* ── DANGER ZONE ── */}
      <h3 className="sh" style={{color:"var(--error)",marginTop:8}}>Danger Zone</h3>
      {confirmDelete ? (
        <div style={{border:"2px solid rgba(220,38,38,.2)",borderRadius:16,padding:"20px",background:"rgba(220,38,38,.04)",marginBottom:16}}>
          <p style={{fontSize:'var(--text-md)',fontWeight:700,color:"var(--error)",textAlign:"center",marginBottom:8}}>Delete your account?</p>
          <p style={{fontSize:'var(--text-sm)',color:"var(--subtext)",textAlign:"center",marginBottom:16}}>This permanently deletes all your progress and cannot be undone.</p>
          <div style={{display:"flex",gap:10}}>
            <button onClick={() => setConfirmDelete(false)} disabled={deleting} style={{flex:1,padding:"13px",border:"1.5px solid var(--card-b)",borderRadius:12,background:"var(--card)",color:"var(--subtext)",fontSize:'var(--text-base)',fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
              Cancel
            </button>
            <button onClick={handleDeleteAccount} disabled={deleting} style={{flex:1,padding:"13px",border:"none",borderRadius:12,background:"var(--error)",color:"var(--card)",fontSize:'var(--text-base)',fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setConfirmDelete(true)} style={{width:"100%",padding:"14px",border:"2px solid rgba(220,38,38,.15)",borderRadius:14,background:"rgba(220,38,38,.05)",color:"var(--error)",fontSize:'var(--text-base)',fontWeight:700,cursor:"pointer",marginBottom:16,fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          🗑️ Delete Account
        </button>
      )}

    </React.Fragment>
  );
}
