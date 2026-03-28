import React, { useState } from 'react';
import { Bar, lXP, nXP } from '../../data.jsx';
import { fbDeleteAccount } from '../../lib/firebase.js';
import { getSubscriptionStatus, cancelFreeAnnual } from '../../hooks/useSubscription.js';

export default function ProfileScreen({ name, level, st, au, goBack, doOut, setScr }) {
  const [deleteStep, setDeleteStep] = useState(0); // 0=idle, 1=confirm, 2=deleting
  const [deleteError, setDeleteError] = useState('');
  const [cancelStep, setCancelStep] = useState(0); // 0=idle, 1=friction, 2=cancelled
  const sub = getSubscriptionStatus();

  async function handleDeleteAccount() {
    if (deleteStep === 0) { setDeleteStep(1); return; }
    if (deleteStep === 1) {
      setDeleteStep(2);
      setDeleteError('');
      const uid = au?.u || au?.uid || '';
      const res = await fbDeleteAccount(uid);
      if (res.ok) {
        doOut();
      } else {
        setDeleteError(res.err || 'Could not delete account. Try again.');
        setDeleteStep(1);
      }
    }
  }
  const tiles = [
    { icon:"🏆", label:"Badges",        screen:"badges" },
    { icon:"📖", label:"Vocab Journal", screen:"journal" },
    { icon:"🗺️", label:"Learning Path", screen:"learnpath" },
    { icon:"📊", label:"Analytics",     screen:"analytics" },
  ];
  return (
    <div className="scr-wrap">

      <div style={{textAlign:"center",marginBottom:24}}>
        <div style={{width:80,height:80,borderRadius:"50%",background:"linear-gradient(135deg,#0e7490,#164e63)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",fontSize:36,color:"#fff",fontWeight:800}}>
          {name.charAt(0).toUpperCase()}
        </div>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:26,color:"#164e63"}}>{name}</h2>
        <p style={{color:"#78716c",fontSize:14}}>Level {level} · {st.diff.charAt(0).toUpperCase()+st.diff.slice(1)}</p>
        {au&&au.e&&<p style={{color:"#a8a29e",fontSize:12,marginTop:4}}>{au.e}</p>}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:24}}>
        {[["⭐",st.xp,"XP"],["📚",st.lc,"Lessons"],["📝",st.gc,"Grammar"]].map(([i,v,l],idx)=>(
          <div key={idx} className="c" style={{textAlign:"center"}}>
            <div style={{fontSize:24}}>{i}</div>
            <div style={{fontSize:20,fontWeight:800,marginTop:4}}>{v}</div>
            <div style={{fontSize:11,color:"#78716c"}}>{l}</div>
          </div>
        ))}
      </div>
      <div className="c" style={{marginBottom:16}}>
        <h3 style={{fontSize:14,fontWeight:700,color:"#78716c",marginBottom:12}}>Next Level</h3>
        <Bar v={st.xp-lXP(level)} mx={nXP(level)-lXP(level)} />
        <p style={{fontSize:12,color:"#a8a29e",marginTop:8}}>{nXP(level)-st.xp} XP to Level {level+1}</p>
      </div>
      {setScr && (
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
          {tiles.map(t => (
            <button key={t.screen} className="tc"
              style={{display:"flex",alignItems:"center",gap:12,padding:"14px",textAlign:"left"}}
              onClick={() => setScr(t.screen)}>
              <span style={{fontSize:24}}>{t.icon}</span>
              <span style={{fontSize:13,fontWeight:800,color:"var(--heading)"}}>{t.label}</span>
            </button>
          ))}
        </div>
      )}
      <button onClick={doOut} style={{width:"100%",padding:"14px",border:"2px solid rgba(194,65,12,.15)",borderRadius:14,background:"rgba(194,65,12,.05)",color:"#c2410c",fontSize:15,fontWeight:700,cursor:"pointer"}}>
        🚪 Sign Out
      </button>

      {/* Subscription management */}
      {sub.isFreeAnnual && cancelStep === 0 && (
        <div style={{ marginBottom: 8, padding: '12px 16px', background: 'var(--forest-light,#f0fdf4)', borderRadius: 12, border: '1.5px solid var(--success-b,#86efac)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--success,#16a34a)' }}>✓ Full Premium Access</div>
            <div style={{ fontSize: 11, color: 'var(--subtext)', marginTop: 2 }}>
              All AI features, live tutor & more — free annually
            </div>
          </div>
          <button
            onClick={() => setCancelStep(1)}
            style={{ background: 'none', border: 'none', color: '#a8a29e', fontSize: 11, cursor: 'pointer', padding: 4, textDecoration: 'underline' }}
          >
            Manage
          </button>
        </div>
      )}
      {cancelStep === 1 && (
        <div className="c" style={{ marginBottom: 8, padding: 20, border: '2px solid rgba(245,158,11,.25)', borderRadius: 14, background: 'rgba(245,158,11,.04)' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#92400e', marginBottom: 6 }}>Cancel your free subscription?</div>
          <div style={{ fontSize: 12, color: '#78716c', marginBottom: 8, lineHeight: 1.5 }}>
            You'll lose access to the AI Tutor, Live Tutor, Grammar Diagnosis, Photo Scanner, and personalized insights immediately.
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#0e7490', background: 'rgba(14,116,144,.08)', borderRadius: 8, padding: '8px 12px', marginBottom: 14 }}>
            💡 Pause instead? Your progress is saved. Come back anytime and your streak, vocabulary, and level will be right where you left them.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setCancelStep(0)}
              style={{ flex: 1, padding: '10px', border: '2px solid #e5e7eb', borderRadius: 10, background: 'var(--card)', fontSize: 13, fontWeight: 800, cursor: 'pointer', color: '#374151' }}
            >
              Keep Access
            </button>
            <button
              onClick={() => {
                cancelFreeAnnual(au?.u || au?.uid || '');
                setCancelStep(2);
              }}
              style={{ flex: 1, padding: '10px', border: '2px solid rgba(185,28,28,.2)', borderRadius: 10, background: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: '#b91c1c' }}
            >
              Cancel Anyway
            </button>
          </div>
        </div>
      )}
      {cancelStep === 2 && (
        <div style={{ marginBottom: 8, padding: '10px 16px', background: 'var(--bar-bg)', borderRadius: 10, fontSize: 12, color: 'var(--subtext)', textAlign: 'center' }}>
          Subscription cancelled. Sign in again anytime to restore access.
        </div>
      )}

      {/* Delete Account — GDPR right to erasure */}
      <div style={{marginTop:12,textAlign:"center"}}>
        {deleteStep === 0 && (
          <button onClick={handleDeleteAccount}
            style={{background:"none",border:"none",color:"#a8a29e",fontSize:12,cursor:"pointer",textDecoration:"underline",padding:"8px"}}>
            Delete Account
          </button>
        )}
        {deleteStep >= 1 && (
          <div className="c" style={{marginTop:8,padding:20,border:"2px solid rgba(185,28,28,.2)",borderRadius:14,background:"rgba(185,28,28,.04)"}}>
            <p style={{fontSize:14,fontWeight:700,color:"#991b1b",marginBottom:8}}>Delete your account?</p>
            <p style={{fontSize:12,color:"#78716c",marginBottom:16}}>This permanently deletes all your progress, streaks, and data. This cannot be undone.</p>
            {deleteError && <p style={{fontSize:12,color:"#b91c1c",marginBottom:10}}>{deleteError}</p>}
            <div style={{display:"flex",gap:10}}>
              <button onClick={() => { setDeleteStep(0); setDeleteError(''); }}
                style={{flex:1,padding:"10px",border:"2px solid #e5e7eb",borderRadius:10,background:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",color:"#374151"}}
                disabled={deleteStep === 2}>
                Cancel
              </button>
              <button onClick={handleDeleteAccount}
                style={{flex:1,padding:"10px",border:"2px solid rgba(185,28,28,.3)",borderRadius:10,background:"#b91c1c",fontSize:13,fontWeight:700,cursor:"pointer",color:"#fff",opacity:deleteStep===2?0.6:1}}
                disabled={deleteStep === 2}>
                {deleteStep === 2 ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
